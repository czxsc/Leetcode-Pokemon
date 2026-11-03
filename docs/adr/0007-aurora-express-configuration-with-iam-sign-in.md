# 7. Aurora express configuration, signed in to with IAM

**Status:** accepted (supersedes [ADR 3](0003-aurora-serverless-through-the-data-api.md))

## Context

The first deploy to a new AWS account on the **Free plan** failed: Free plan
accounts may only create Aurora clusters in Aurora's **express
configuration**. Staying on the Free plan means AWS can't charge anything,
which matters while the app's abuse protections are still basic.

Express configuration changes the ground rules of ADR 3:

- The cluster has **no VPC**. It's reached through Aurora's **internet
  access gateway** (the normal PostgreSQL protocol over TLS).
- The master user signs in with **IAM authentication only**, so there's no
  password to keep in Secrets Manager.
- The RDS Data API can be turned on afterwards, but it can't use the master
  user: it would need a second, password-based user created by hand.

## Decision

- Create the cluster with `WithExpressConfiguration`, keeping Serverless v2
  at 0–2 ACUs and pausing after 5 idle minutes (the express default). Express
  configuration rejects most other settings at creation, including an initial
  database, so the migration Lambda creates the `pokeleet` database on its
  first run.
- The Lambdas connect **directly with node-postgres**, signing in with a
  short-lived IAM token (`@aws-sdk/rds-signer`) instead of a password.
- **Two database users.** The migration Lambda signs in as the master
  (`postgres`), applies migrations, and makes sure the API's own user
  (`pokeleet_app`) exists with IAM sign-in and only `SELECT, INSERT, UPDATE,
  DELETE` on the app's tables. Each Lambda's IAM role may sign in as its one
  user (`rds-db:connect` on that user's ARN).
- **A connection per request**, closed afterwards. Aurora only pauses while
  no one is connected, and a warm Lambda would otherwise hold a connection
  open indefinitely.

## Alternatives considered

- **Upgrade to the Paid plan and keep the Data API (ADR 3).** No code
  changes, but no hard cost ceiling until the abuse protections exist, and a
  VPC to host the cluster.
- **Data API on the express cluster.** Needs a password user set up over a
  direct connection anyway, plus Secrets Manager.
- **A connection pool kept between requests.** Faster per request, but it
  would keep the database from ever pausing.

## Consequences

- No VPC, no Secrets Manager secret (one less $0.40/month), and no
  passwords anywhere: every credential is a 15-minute IAM token.
- The database endpoint is reachable from the internet. It accepts only TLS
  connections signed in with IAM, and only the two Lambda roles may sign in.
- Each request pays for a new TLS connection (tens of milliseconds). That's
  fine at this scale; RDS Proxy isn't available without a VPC.
- Connection failures other than bad credentials answer **503**, and the web
  app retries. That covers the database resuming from a pause.
- AWS picks the engine version (PostgreSQL 17 at the time of writing), and
  backups keep the express default of 1 day.
- Without the Data API's 1 MiB response limit, the library store reads with
  plain queries and only batches inserts by row count (PostgreSQL's 65,535
  parameter limit per statement).
- Tests run the store against **PGlite** and, when `POSTGRES_URL` is set (CI,
  or `docker compose up`), against a real PostgreSQL server through the same
  node-postgres connection code. IAM sign-in itself is only exercised in a
  deployed stack.

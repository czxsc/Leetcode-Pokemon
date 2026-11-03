# 3. Aurora PostgreSQL Serverless v2, reached through the RDS Data API

**Status:** superseded by [ADR 7](0007-aurora-express-configuration-with-iam-sign-in.md)

## Context

The library needs real PostgreSQL. This is a personal project, so the cloud
bill should be close to zero when nobody is using it. The API runs on Lambda.

## Decision

Use **Aurora PostgreSQL Serverless v2** with a minimum of **0 ACUs**: it
pauses after 10 idle minutes and only storage is billed. Lambdas reach it
through the **RDS Data API** (HTTPS, authorized by IAM, credentials in
Secrets Manager), using Drizzle's Data API driver.

## Alternatives considered

- **Lambda in the VPC with a normal Postgres connection.** The Lambdas then
  can't reach the internet (DynamoDB, LeetCode) without a NAT gateway (about
  $30/month) or several VPC endpoints. Connection limits under concurrency
  would also need RDS Proxy, which isn't free.
- **Provisioned RDS (db.t4g.micro).** Billed around the clock, idle or not.
- **Aurora DSQL.** No VPC at all and a permanent free tier, but it's a
  distributed subset of PostgreSQL (no sequences, transactions that conflict
  and must be retried). The standard engine teaches and transfers better.

## Consequences

- The first request after the database pauses waits a few seconds while it
  resumes. The Data API answers `DatabaseResumingException` meanwhile. The
  cloud entry point turns that into HTTP 503 (`whileResuming`), and the web
  app retries: on load with a short wait loop, and on save through its normal
  retry logic.
- The VPC exists only to host the cluster: isolated subnets, no internet
  gateway, no NAT.
- Tests use **PGlite** (real PostgreSQL compiled to WebAssembly, run in
  process) with the same Drizzle schema and migrations. The Data API driver
  itself is only exercised in a deployed stack.

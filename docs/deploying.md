# Deploying to AWS

This puts PokéLeet online with accounts, using your own AWS account. The
infrastructure is in `infra/` ([architecture](architecture.md)).

## What it costs

At personal scale, almost everything stays within AWS's free allowances or
costs cents. Lambda, API Gateway, DynamoDB on-demand, CloudFront, S3, and
Cognito are free up to 10,000 monthly users. The database is the main cost:

- **Aurora Serverless v2** pauses after 5 idle minutes. While paused you pay
  only for storage (cents per month); while awake, roughly $0.06 per hour at
  the minimum size.

Pass a `budgetEmail` (below) to get an email at 80% and 100% of a $5 monthly
budget.

## First deploy (from your computer)

You need an AWS account, the [AWS CLI](https://aws.amazon.com/cli/) signed in
(`aws login`), and Node.js 24. The AWS Free plan works: the database uses
Aurora's express configuration, which Free plan accounts require
([ADR 7](adr/0007-aurora-express-configuration-with-iam-sign-in.md)).

```bash
npm install && npm run build      # the app, built into dist/
cd infra && npm install
npx cdk bootstrap                 # once per AWS account and region
npx cdk deploy Pokeleet-dev -c budgetEmail=you@example.com
```

The deploy prints `AppUrl`. Open it, choose **Sign up**, and confirm your
email.

- **Prod:** use `-c stage=prod` and deploy `Pokeleet-prod`. Prod keeps its
  data if the stack is deleted (database snapshot, retained table, deletion
  protection); dev doesn't.
- **Remove everything:** `npx cdk destroy Pokeleet-dev`.

## Deploys from GitHub Actions

`.github/workflows/ci.yml` deploys `main` after the checks pass, signing in to
AWS with GitHub's OIDC token. No AWS keys are stored in GitHub.

1. Create the deploy role once (replace with your repo):
   ```bash
   cd infra
   npx cdk deploy Pokeleet-GithubDeploy -c githubRepo=<owner>/<repo>
   ```
   It prints `DeployRoleArn`. Only that repo's `main` branch can use the role,
   and the role can only hand over to the CDK bootstrap roles.
2. In the repo on GitHub: **Settings → Secrets and variables → Actions →
   Variables**, add:
   - `AWS_DEPLOY_ROLE_ARN`: the role ARN from step 1
   - `AWS_REGION`: e.g. `us-east-1`
   - `STAGE` (optional): `dev` (default) or `prod`

   And under **Secrets**:
   - `BUDGET_EMAIL`: where cost alerts go. It's a secret so the address is
     masked in the (public) workflow logs. Without it, a deploy from GitHub
     removes the budget alert.

Until `AWS_DEPLOY_ROLE_ARN` is set, the deploy job is skipped, so forks run
the checks without deploying.

## Study sessions on the cloud app

The PokéLeet Tracker extension only runs on the sites listed in
`extension/manifest.json` (`localhost` by default). To use Focus sessions on
your deployment, add your app's address to both lists and reload the
extension:

```json
"host_permissions": ["https://leetcode.com/*", "http://localhost/*", "http://127.0.0.1/*", "https://dxxxxxxxx.cloudfront.net/*"],
"content_scripts": [{ "matches": ["http://localhost/*", "http://127.0.0.1/*", "https://dxxxxxxxx.cloudfront.net/*"], ... }]
```

## Troubleshooting

- **The first load after a while takes several seconds.** The database is
  waking up from its pause. The app retries on its own.
- **"Sign in to continue" / 401 errors:** sign out and back in. Access tokens
  last an hour and refresh automatically.
- **Logs:** CloudWatch log groups for the `Api/Handler` and `Database/Migrate`
  functions, kept for two weeks.

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
- **Secrets Manager**, only with Google sign-in: $0.40 per month for the
  Google client secret.
- **Route 53**, only with your own domain: $0.50 per month for its DNS zone.
  The certificate is free.

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

The deploy prints `AppUrl`. Open it, choose **Continue with email**, then
**Create an account**, and confirm your email with the code Cognito sends
(check spam). **Try the demo** runs the app without an
account, saved in the browser only.

To add **Continue with Google**, see [below](#sign-in-with-google), then add
`-c googleClientId=<client ID>` to every deploy. Without it, a deploy removes
Google sign-in again.

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
   - `GOOGLE_CLIENT_ID` (optional): turns on Google sign-in (below)
   - `DOMAIN` (optional): the app's own address (below)

   And under **Secrets**:
   - `BUDGET_EMAIL`: where cost alerts go. It's a secret so the address is
     masked in the (public) workflow logs. Without it, a deploy from GitHub
     removes the budget alert.

Until `AWS_DEPLOY_ROLE_ARN` is set, the deploy job is skipped, so forks run
the checks without deploying.

## Sign in with Google

Optional. Google needs an OAuth client for your app, and Cognito needs its
secret. `<cognito-domain>` below is your sign-in domain,
`pokeleet-<stage>-<account id>.auth.<region>.amazoncognito.com` (the address
the **Continue with email** button opens).

1. In the [Google Cloud console](https://console.cloud.google.com/), create a
   project (e.g. "PokeLeet").
2. Open **Google Auth Platform** and choose **Get started**: app name
   `PokéLeet`, your email as support and contact address, audience
   **External**.
3. **Branding:** set the home page to your `AppUrl`, and the privacy policy
   and terms links to `<AppUrl>/privacy.html` and `<AppUrl>/terms.html`
   (`public/`; edit the contact address in them for your deployment). Under
   **Authorized domains** add `amazoncognito.com` and your app's domain
   (e.g. `dxxxxxxxx.cloudfront.net`). Leave the logo empty (a logo requires
   Google's review).
4. **Audience → Publish app**, so any Google account can sign in, not only
   test users. The app only asks for the user's email, which needs no review.
5. **Clients → Create client**, type **Web application**:
   - Authorized JavaScript origins: `https://<cognito-domain>`
   - Authorized redirect URIs: `https://<cognito-domain>/oauth2/idpresponse`

   Copy the **client ID** (ends in `.apps.googleusercontent.com`) and the
   **client secret** (starts with `GOCSPX-`). Google may not show the secret
   again, so download the JSON too.
6. Store the secret in AWS, once per stage:
   ```bash
   aws secretsmanager create-secret --name pokeleet-dev/google-client-secret --secret-string "<client secret>"
   ```
   CloudFormation reads it at deploy time, so it never appears in the
   template or the repo.
7. Deploy with `-c googleClientId=<client ID>` (or set the `GOOGLE_CLIENT_ID`
   variable for GitHub deploys).

To change the secret later, update it in Secrets Manager
(`aws secretsmanager put-secret-value`) and in the Cognito console (**Social
and external providers → Google**): CloudFormation only reads the secret when
the Google provider itself changes.

One email address is one account: the first Google sign-in with the
(verified) email of an existing account is linked to it
(`api/src/pre-sign-up.ts`), and a password sign-up for an email that already
uses Google is refused.

## Your own domain

Optional. The app can live at an address of yours, say `pokeleet.example.com`,
with its sign-in pages at `auth.pokeleet.example.com`. The subdomain gets its
own DNS zone in Route 53, so the parent domain's DNS can stay wherever it is.

1. Create the zone (once):
   ```bash
   npx cdk deploy Pokeleet-Dns -c domain=pokeleet.example.com
   ```
   It prints `NameServers`: four names. The zone also allows Amazon to issue
   its certificates (a CAA record), whatever `example.com` allows.
2. Where `example.com`'s DNS is hosted, add four **NS** records named
   `pokeleet`, one per name server. Check it worked with
   `nslookup -type=NS pokeleet.example.com`.
3. Add `-c domain=pokeleet.example.com` to every deploy of the app. The first
   one creates the certificate (validated through the zone), points the
   domain at CloudFront and adds the sign-in domain; that can take a while.
   The CloudFront address keeps working too.
4. With Google sign-in: in the Google client, add
   `https://auth.pokeleet.example.com` to the JavaScript origins and
   `https://auth.pokeleet.example.com/oauth2/idpresponse` to the redirect URIs,
   add `example.com` to the authorized domains, and update the home page,
   privacy and terms links to the new address.

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

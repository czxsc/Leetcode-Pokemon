# 8. Branded sign-in, Google sign-in, and a demo without an account

**Status:** accepted (updates the sign-in part of [ADR 6](0006-cognito-and-cdk-deployed-by-github-oidc.md))

## Context

The first deploy sent every visitor straight to Cognito's classic hosted
sign-in page: a plain form that looks nothing like the app and only offers
email and password. Visitors (recruiters among them) should be able to sign in
quickly, or look around without an account.

## Decision

- **Cognito Essentials plan** instead of Lite. It's the plan with **managed
  login**, Cognito's newer sign-in pages, and the free tier is the same
  (10,000 monthly users, no expiry).
- **The sign-in pages are styled in code** (`infra/lib/sign-in-style.ts`, a
  `ManagedLoginBranding` resource) in the app's colors, with the PokéLeet logo,
  and link the privacy policy and terms on the sign-up page.
- **"Continue with Google"** through Cognito's built-in Google provider, turned
  on per deploy with `googleClientId`. The client secret lives in Secrets
  Manager and reaches Cognito through a CloudFormation dynamic reference, so
  it's never in the template, the repo, or CI logs.
- **A small sign-in screen in the app** (`src/app/SignIn.jsx`) for signed-out
  visitors: Continue with Google (straight to Google, `identity_provider=Google`),
  Continue with email (Cognito's page, which also creates accounts), and
  **Try the demo**. Cognito's pages can't hold a link of our own, so the demo
  needs this screen. It also shows why a sign-in didn't finish, from the error
  Cognito sends back.
- **The demo runs on the cloud app too**, at `?demo`: the same browser-only
  mode as the GitHub Pages demo, with copy that offers an account instead of
  cloning the repo.

## Alternatives considered

- **A custom sign-in form calling Cognito's APIs** (or Amplify UI). Full
  control of the look, but more code, and the app would own password and
  verification-code screens that Cognito already does well.
- **A marketing-style landing page** (screenshot, feature list). Tried first;
  it read as generic, and the demo shows the app better than a description.
- **Keep Lite and the classic page.** Free and simple, but it's the first
  thing visitors see.

## Consequences

- Google sign-in costs $0.40 a month (the Secrets Manager secret) and needs a
  Google OAuth client, set up once by hand ([deploying.md](../deploying.md#sign-in-with-google)).
- CloudFormation reads the secret only when the Google provider resource
  changes, so a corrected secret also has to be entered in Cognito (or the
  resource changed) to take effect.
- Linking only to verified addresses matters: otherwise someone could sign up
  with another person's email, unverified, and receive their Google sign-in.
- The sign-in screen and library are loaded only by the cloud app (dynamic
  imports), so the local app and the GitHub Pages demo don't download them.

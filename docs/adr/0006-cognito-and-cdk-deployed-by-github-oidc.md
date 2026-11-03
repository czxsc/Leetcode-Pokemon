# 6. Cognito sign-in, CDK infrastructure, deploys through GitHub OIDC

**Status:** accepted; sign-in pages and plan updated by [ADR 8](0008-branded-sign-in-and-google.md)

## Context

The cloud setup needs accounts, reproducible infrastructure, and automated
deploys, without long-lived secrets.

## Decision

- **Sign-in: Amazon Cognito** (Lite plan, free up to 10,000 monthly users)
  with its hosted sign-in page. The web app is a public OAuth client using the
  authorization code flow with PKCE (`oidc-client-ts`). Access tokens are
  checked by **API Gateway's JWT authorizer**, so the Lambda only ever sees
  authenticated requests.
- **Infrastructure: AWS CDK in TypeScript** (`infra/`), in the same language
  as the app. Constructs map to concerns (`Database`, `Auth`, `Api`, `Web`), and
  assertion tests pin the properties the design depends on (scale to zero, no
  NAT gateway, every route authorized, prod data retained).
- **Deploys: GitHub Actions with OIDC.** A small stack
  (`infra/lib/github-deploy-stack.ts`) creates a role that only this repo's
  `main` branch can assume, and that may only assume the CDK bootstrap roles.
  No AWS access keys are stored in GitHub.

## Alternatives considered

- **Auth0 / Clerk.** Nicer developer experience, but another vendor next to
  AWS, and paid tiers sooner.
- **Terraform.** Equally valid and more common across clouds. CDK was chosen
  for a single language across app, API and infrastructure.
- **GitHub sign-in.** Cognito has no built-in GitHub provider, and GitHub's
  OAuth isn't OpenID Connect, so it would need an extra shim service.

## Consequences

- The Tracker extension only runs on pages it lists in its manifest
  (`localhost` by default), so a cloud deployment's address has to be added
  there to use study sessions. See [deploying.md](../deploying.md).
- Tokens are kept in `localStorage` so every tab shares one session. A
  cross-site scripting bug could then read them. The app renders no
  user-supplied HTML apart from its own escaped code highlighter.

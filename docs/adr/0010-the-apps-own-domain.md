# 10. The app's own domain, through a delegated Route 53 zone

**Status:** accepted

## Context

The app was reachable only at its CloudFront address
(`dxxxxxxxx.cloudfront.net`), and Google's sign-in screen named
`amazoncognito.com`. It should live at an address of its own, here a
subdomain of the author's portfolio domain (`pokeleet.sharonchen.dev`), whose
DNS is hosted elsewhere (Vercel).

## Decision

- **Delegate just the subdomain to Route 53.** A small stack
  (`infra/lib/dns-stack.ts`) creates a hosted zone for `pokeleet.<domain>`;
  four NS records at the parent's DNS host hand that name over, once. The
  portfolio's DNS stays where it is. The zone has its own CAA record allowing
  Amazon: without one the parent's apply, and Vercel's allow only other
  certificate authorities, which failed the first certificate.
- **Everything else is code.** The app stack creates one ACM certificate for
  the app and `auth.<app domain>` (validated through the zone), serves
  CloudFront at the domain, adds a Cognito custom domain for the sign-in
  pages, and creates the alias records. Cognito requires the parent
  (`pokeleet.<domain>`) to resolve first, so its domain waits for the app's
  record.
- **The old addresses keep working.** The CloudFront address stays an allowed
  sign-in return address, and the `amazoncognito.com` sign-in domain stays
  next to the custom one. The web app takes its sign-in endpoints from
  `config.json` instead of Cognito's discovery document, so it always uses the
  custom one.

## Alternatives considered

- **Records added by hand at the parent's DNS host.** No Route 53 cost, but
  every certificate validation and alias would be a manual step during deploys.
- **A new domain of its own.** About $10-15 a year, and a name containing a
  trademark (`poke...`) invites complaints; a subdomain of a personal domain
  avoids both.

## Consequences

- $0.50 a month for the hosted zone.
- The domain's zone lives in its own stack (`Pokeleet-Dns`), so deleting the
  app's stack doesn't break the delegation.
- The Google OAuth client needs the new sign-in domain added as an origin and
  redirect URI.

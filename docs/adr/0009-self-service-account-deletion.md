# 9. Self-service account deletion

**Status:** accepted

## Context

The cloud app stores people's email addresses, solution code and progress. The
privacy policy (`public/privacy.html`) should be able to say that anyone can
delete all of it themselves, at any time, without emailing anyone. Google also
asks for a privacy policy before an app may offer Google sign-in to everyone.

## Decision

- **`DELETE /api/account`** removes the user's game progress (DynamoDB) and
  problem library (Postgres; one `DELETE` on the user's `libraries` row, which
  cascades to their problems, tags and custom tags), then deletes their
  Cognito user (`AdminDeleteUser`, the Lambda's only Cognito permission).
- **Data first, then the sign-in.** If deleting the sign-in fails, the user is
  still signed in and can simply try again; the other order could leave data
  with no account to delete it from.
- **Only the cloud stores can forget a user** (`ErasableStore`). The route
  exists only when the API is given a way to delete sign-ins, so the local
  app's files can never be deleted through the API.
- **The web app stops saving before it asks**, so nothing is written back
  after the delete, clears this account's unsaved changes from the browser,
  and signs out. Unsaved changes are now kept per account, so two people
  sharing a browser can't pick up each other's.

## Consequences

- Deleted data lingers only in disaster-recovery backups: DynamoDB
  point-in-time recovery (35 days) and Aurora's backups (1 day).
- Access tokens already issued stay valid until they expire (at most an hour),
  but the account and its data are gone, and saves based on the old
  revisions are refused.

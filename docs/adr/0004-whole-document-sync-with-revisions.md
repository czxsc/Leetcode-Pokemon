# 4. Whole-document saves with revision numbers

**Status:** accepted

## Context

The web app keeps the game state in memory and saves it as the player
plays: progress every ~1.5 s, the library within ~0.25 s of a change. It
already handles hard cases well. Tabs are closed mid-save, the server stops,
two tabs are open, a second device is in use. That logic shouldn't be
rewritten to move to the cloud.

## Decision

Keep the existing protocol for every setup. The client PUTs a whole
document with the revision it was based on (`{ rev, data }`), and the server
saves it only if that is still the current revision (otherwise 409 with the
current revision). Each store implements the check natively:

- files: compare in a serialized read-modify-write
- DynamoDB: a conditional put
- PostgreSQL: `SELECT ... FOR UPDATE` on the user's row inside the save
  transaction

## Alternatives considered

- **Fine-grained REST endpoints** (`POST /problems`, `PATCH /problems/:id`,
  ...). That's more conventional, but the client would need a queue of
  pending operations that survives offline periods and closed tabs, and
  conflicts would have to be resolved per field.

## Consequences

- A conflict stops the stale tab from saving and asks the user to reload,
  rather than merging. That's the same behavior the local app always had.
- The Postgres store turns each whole-library save into the minimal set of
  row changes, so the relational model stays efficient.
- Payloads are bounded: the request body is capped at 5 MB, progress at 350 KB.

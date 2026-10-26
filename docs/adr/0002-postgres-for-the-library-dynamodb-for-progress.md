# 2. PostgreSQL for the problem library, DynamoDB for game progress

**Status:** accepted

## Context

The cloud deployment needs durable, per-user storage for two documents with
very different shapes:

- **Game progress**: one nested object per user (currencies, collection,
  team, quests, counters). The app always reads and writes it whole. Nothing
  queries inside it.
- **Problem library**: a list of problems, each with many tags, plus custom
  tags. It's relational, and it's what stats and future features (streaks,
  progress per topic, sharing) query.

## Decision

- Store **game progress in DynamoDB**: one item per user, written with a
  conditional put on the revision number. Use a single-table key design
  (`pk = USER#<id>`, `sk = DOC#progress`) so more per-user item types fit
  later. On-demand billing and point-in-time recovery.
- Store the **problem library in PostgreSQL**, normalized into `problems`,
  `problem_tags` and `custom_tags` under a per-user `libraries` row that holds
  the revision. Constraints live in the schema: primary and foreign keys,
  cascading deletes, and a `CHECK` on difficulty. A save is one transaction
  that locks the user's row and writes only what changed.

## Alternatives considered

- **Everything in PostgreSQL** (progress as `jsonb`): simpler to operate, but
  it puts a hot, blob-shaped, key-value workload on a relational database for
  no benefit.
- **Everything in DynamoDB** (the library as one item): no joins or ad-hoc
  queries, and the 400 KB item limit would cap how many problems (with code)
  one user can store.

## Consequences

- Two databases to provision and back up. Both are serverless and close to
  free at this scale.
- Saves of the two documents aren't atomic with each other. That's
  acceptable: they were always separate documents with their own revisions,
  and the web app retries each independently.
- Game progress is limited to 350 KB, enforced by the API, below DynamoDB's
  400 KB item limit.

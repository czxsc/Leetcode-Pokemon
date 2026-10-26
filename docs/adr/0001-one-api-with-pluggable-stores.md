# 1. One API, pluggable stores: local-first with an optional cloud

**Status:** accepted

## Context

PokéLeet started as a local app: `npm start` serves the app, and progress
is saved as JSON files on disk. Adding accounts and a cloud deployment
mustn't break that. People who clone the repo should still be able to run it
with no AWS account and no Docker.

## Decision

Keep one HTTP API (`api/src/app.ts`) and one web app for every setup. The
routes depend only on a `DocumentStore` interface (load, and save if the
revision still matches). Each entry point chooses the implementations:

- `api/src/local/plugin.ts` (Vite plugin): JSON files in `data/`, in the
  format the app always wrote, so existing data keeps working.
- `api/src/lambda.ts`: DynamoDB and Aurora PostgreSQL, user from the Cognito
  token.

The web app finds out which setup it's in from the API's response (`mode`)
and from `config.json`, which only cloud deployments serve.

## Consequences

- The routes, validation and sync protocol are written and tested once.
- A store has to pass the shared contract tests (`api/test/document-store.contract.ts`),
  so adding another is mechanical.
- The local setup is single-user by design: its file stores refuse any other
  user id.
- Features that only make sense locally (writing `solutions/<tag>/` files)
  wrap a store as a decorator (`withSolutionFiles`) in the local entry point.
  The API itself doesn't know about them.

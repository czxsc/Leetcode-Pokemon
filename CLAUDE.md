# CLAUDE.md

Guidance for AI coding agents (and humans) working in this repo.

## Commands

- `npm start`: run the app locally (Vite + the API plugin), data in `data/`.
  Use `POKELEET_DATA_DIR=<scratch dir>` for anything experimental, and never
  touch the real `data/` folder.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`:
  all must pass before committing.
- `npm run build`: production build (`dist/`). `npm run build:demo`: the
  GitHub Pages demo.
- `npm run db:generate`: after editing `api/src/stores/postgres/schema.ts`.
- Infrastructure: `cd infra && npm test && npx cdk synth`. Never run
  `cdk deploy` unless the user asks for it.

## Architecture rules

Read `docs/architecture.md` first. The rules that matter most:

- `src/game/` is pure: no React, DOM, `window`, `localStorage`, `Date.now()`
  or `Math.random()`. Time and randomness come in through `ctx`. Every rule
  returns the next state, or `null` when the action isn't allowed, and has a
  test.
- Components never change state directly. They call `store.<action>()`
  (`src/state/store.ts`), which applies a rule from `src/game/`.
- The API's routes (`api/src/app.ts`) know nothing about storage. Storage goes
  behind `DocumentStore`, and a new store must pass
  `api/test/document-store.contract.ts`.
- `shared/library.ts` is the contract between the web app and the API. If it
  changes, update the normalizer in `src/game/state.ts` so its output still
  passes, as the property test in `src/game/state.test.ts` checks.
- Never break the saved data formats (`data/*.json`, the backup file, the
  DynamoDB item, the SQL schema) without a migration.

## Conventions

- TypeScript for logic (`src/game`, `src/state`, `src/platform`, `api/`,
  `shared/`, `infra/`). JSX for UI components.
- Server-side code (`api/`, `shared/`, `infra/`) imports relative files with
  their `.ts` extension. The web app (`src/`) imports without extensions.
- Prettier formats everything except CSS (`.prettierrc.json`). Imports are
  ordered: packages, then parent folders, then siblings.
- Comments explain why, briefly. Each file starts with a short header saying
  what it is for.
- Commits use Conventional Commits; one logical change per commit.

## Verifying UI changes

There are no component tests. After UI changes, run the app against a
scratch data folder and click through every tab in a browser.

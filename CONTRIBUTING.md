# Contributing

Thanks for helping out! Issues and pull requests are welcome.

## Setup

```bash
npm install
npm start          # the app at http://localhost:5173, data in data/
```

To work against a separate data folder, set `POKELEET_DATA_DIR`, e.g.
`POKELEET_DATA_DIR=../pokeleet-test-data npm start`.

## Checks

These run in CI on every pull request. Run them before pushing:

```bash
npm run format:check   # Prettier (npm run format to fix)
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm test               # Vitest: game rules, API, stores
npm run build
```

Some store tests need DynamoDB Local and a PostgreSQL server; without them
they're skipped:

```bash
docker compose up -d
DYNAMODB_ENDPOINT=http://localhost:8000 POSTGRES_URL=postgres://postgres:local@localhost:5432/postgres npm test
```

Infrastructure changes: `cd infra && npm install && npm test && npx cdk synth`.

## Where things go

See [docs/architecture.md](docs/architecture.md). In short:

- a **game rule** (what an action does to the state) goes in `src/game/`, as
  a pure function with a test next to it
- a **screen or component** goes in `src/features/<screen>/` or
  `src/components/`
- an **API route** goes in `api/src/app.ts`, and a new way of storing
  documents implements `DocumentStore` and runs the contract tests
- a **database schema change**: edit `api/src/stores/postgres/schema.ts`, then
  `npm run db:generate` to write the migration. Commit both.

## Pull requests

- Branch from `main`, keep each PR to one change, and describe what and why.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Behavior changes come with tests.

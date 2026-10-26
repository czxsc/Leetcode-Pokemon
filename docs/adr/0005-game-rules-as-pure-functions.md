# 5. Game rules as pure functions

**Status:** accepted

## Context

The game logic used to live in one 766-line store module (`store.jsx`) that
read global state, called `Math.random()` and `Date.now()` directly, and was
reachable only through `window` globals. None of it could be tested in
isolation.

## Decision

Move every rule into `src/game/` as pure, typed functions of the form
`(state, input, ctx) => nextState | null`, where `ctx` carries the date, the
time and the random source. The store (`src/state/store.ts`) only applies a
rule, persists the result and notifies React.

## Consequences

- Rules are unit-tested deterministically with a seeded RNG
  (`src/game/*.test.ts`), including pity guarantees, item use and session
  timing.
- Rules validate their own preconditions (enough Coins, the right quest step,
  a ready progression quest) instead of trusting the button that calls them.
- **Today the browser is still authoritative.** Each account only affects its
  own data, so a player who tampers with requests can only cheat themselves.
  Leaderboards or trading would change that. The next step would then be
  running these same functions in the API (summon, shop, claims) and
  recording currency changes in a Postgres ledger. Pure rules make that a
  move, not a rewrite.

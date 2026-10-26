// Helpers for the game rule tests (not used by the app).
import { buildState } from './state'
import type { Ctx, GameState } from './types'

// Deterministic random numbers (mulberry32).
export function seeded(seed = 1): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const TODAY = '2026-10-25'

export const ctx = (over: Partial<Ctx> = {}): Ctx => ({
  today: TODAY,
  now: Date.UTC(2026, 9, 25, 12),
  rng: seeded(),
  ...over,
})

// An onboarded account with optional overrides.
export function game(over: Partial<GameState> = {}): GameState {
  return { ...buildState({ onboarded: true }, null, TODAY, ctx().now), ...over }
}

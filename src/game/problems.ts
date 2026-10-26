/* =====================================================================
   The problem library: create / edit / delete problems, claim their
   Shards, and manage custom tags. A problem counts as solved once it
   has a solution (its solvedAt date).
===================================================================== */
import * as Catalog from '../../shared/catalog'
import { giveExp, newId, SHARD_BY_DIFF } from './rules'
import { normalizeProblem } from './state'
import type { Ctx, GameState, Problem } from './types'

const isDay = (d: unknown): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)

export type ProblemFields = Partial<
  Pick<Problem, 'title' | 'difficulty' | 'tags' | 'language' | 'url' | 'code'>
>

export const tags = (s: GameState) => Catalog.tagList(s.customTags)

export function createProblem(s: GameState, fields: ProblemFields, ctx: Ctx) {
  const p = normalizeProblem(
    { ...fields, id: newId('p-', ctx.now, ctx.rng), createdAt: new Date(ctx.now).toISOString() },
    ctx.now,
  )
  if (p.code.trim()) p.solvedAt = ctx.today
  const state = { ...s, problems: [...s.problems, p], preferredLanguage: p.language }
  return { state, id: p.id }
}

export function updateProblem(
  s: GameState,
  id: string,
  fields: ProblemFields,
  ctx: Ctx,
): GameState | null {
  const prev = s.problems.find((p) => p.id === id)
  if (!prev) return null
  const next = normalizeProblem({ ...prev, ...fields, id, createdAt: prev.createdAt }, ctx.now)
  const hadCode = !!prev.code.trim()
  const hasCode = !!next.code.trim()
  if (hasCode && !next.solvedAt) next.solvedAt = ctx.today
  if (hadCode && !hasCode) next.solvedAt = null // solution removed -> back to to-do
  return {
    ...s,
    problems: s.problems.map((p) => (p.id === id ? next : p)),
    preferredLanguage: next.language,
  }
}

export const deleteProblem = (s: GameState, id: string): GameState => ({
  ...s,
  problems: s.problems.filter((p) => p.id !== id),
})

// Claiming a solved problem pays its Shards and 1 EXP to each team member.
function claim(s: GameState, ids: Set<string>, today: string) {
  const ready = s.problems.filter((p) => ids.has(p.id) && p.solvedAt && !p.claimed)
  if (!ready.length) return null
  const shards = ready.reduce((n, p) => n + SHARD_BY_DIFF[p.difficulty], 0)
  const claimed = new Set(ready.map((p) => p.id))
  const state: GameState = {
    ...s,
    shards: s.shards + shards,
    owned: giveExp(s.owned, s.team, ready.length),
    problems: s.problems.map((p) =>
      claimed.has(p.id) ? { ...p, claimed: true, claimedAt: today } : p,
    ),
  }
  return { state, shards }
}

export const claimProblem = (s: GameState, id: string, ctx: Ctx) =>
  claim(s, new Set([id]), ctx.today)

// every solved, unclaimed problem at once
export const claimAllProblems = (s: GameState, ctx: Ctx) =>
  claim(s, new Set(s.problems.map((p) => p.id)), ctx.today)

export function setSolveDate(s: GameState, id: string, date: string): GameState | null {
  if (!isDay(date)) return null
  return {
    ...s,
    problems: s.problems.map((p) => (p.id === id && p.solvedAt ? { ...p, solvedAt: date } : p)),
  }
}

// ---- tags (defaults come from the catalog; custom ones are saved) ----
export function addTag(s: GameState, name: string): { state: GameState; id: string } | null {
  const clean = Catalog.oneLine(name).slice(0, 40)
  const id = Catalog.slugify(clean, 40)
  if (!id) return null
  if (tags(s).some((t) => t.id === id)) return { state: s, id }
  return { state: { ...s, customTags: [...s.customTags, { id, name: clean }] }, id }
}

export function removeTag(s: GameState, id: string): GameState | null {
  if (!s.customTags.some((t) => t.id === id)) return null
  return {
    ...s,
    customTags: s.customTags.filter((t) => t.id !== id),
    problems: s.problems.map((p) =>
      p.tags.includes(id) ? { ...p, tags: p.tags.filter((t) => t !== id) } : p,
    ),
  }
}

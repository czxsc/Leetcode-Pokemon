/* =====================================================================
   Values computed from the state: team power, solve counts, tag
   progress, streaks and the training grid.
===================================================================== */
import * as Catalog from '../../shared/catalog'
import { daysAgo, utcDateFromIso } from './dates'
import { byId, FORM_BONUS, RARITY } from './species'
import type { GameState, OwnedMon, Problem } from './types'

export const isSolved = (p: Problem) => !!p.solvedAt

export function monPower(inst: OwnedMon): number {
  const sp = byId(inst.sp)
  if (!sp) return 0
  let p = inst.level * RARITY[sp.rarity].mult
  if (inst.form) p *= FORM_BONUS[inst.form] || 1
  return Math.round(p)
}

export function solvedCounts(s: GameState) {
  let easy = 0
  let med = 0
  let hard = 0
  for (const p of s.problems) {
    if (!isSolved(p)) continue
    if (p.difficulty === 'Easy') easy++
    else if (p.difficulty === 'Medium') med++
    else hard++
  }
  return { easy, med, hard, total: easy + med + hard }
}

export function weightedPoints(s: GameState): number {
  const c = solvedCounts(s)
  return c.easy * 1 + c.med * 3 + c.hard * 10
}

// Solving problems makes the whole team hit harder: +5% per 50 points, up to 2x.
export const teamMultiplier = (s: GameState) =>
  Math.min(2, 1 + Math.floor(weightedPoints(s) / 50) * 0.05)

export function teamList(s: GameState): OwnedMon[] {
  const byIid = new Map(s.owned.map((o) => [o.iid, o]))
  return s.team.map((iid) => byIid.get(iid)).filter((o): o is OwnedMon => !!o)
}

export const teamBasePower = (s: GameState) => teamList(s).reduce((n, m) => n + monPower(m), 0)
export const teamPower = (s: GameState) => Math.round(teamBasePower(s) * teamMultiplier(s))

export function tagStats(s: GameState) {
  return Catalog.tagList(s.customTags).map((tag) => {
    const probs = s.problems.filter((p) => p.tags.includes(tag.id))
    const solved = probs.filter(isSolved).length
    return { ...tag, solved, count: probs.length, pct: probs.length ? solved / probs.length : 0 }
  })
}

export function solveCountByDate(s: GameState): Record<string, number> {
  const m: Record<string, number> = {}
  for (const p of s.problems) if (p.solvedAt) m[p.solvedAt] = (m[p.solvedAt] || 0) + 1
  return m
}

// Columns of 7 days (Sunday first), ending with the current week.
export function trainingGrid(s: GameState, today: string, weeks = 18) {
  const counts = solveCountByDate(s)
  const todayDow = new Date(utcDateFromIso(today)).getUTCDay() // 0 Sun .. 6 Sat
  const startOffset = (weeks - 1) * 7 + todayDow
  const grid: ({ date: string; count: number } | null)[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: ({ date: string; count: number } | null)[] = []
    for (let d = 0; d < 7; d++) {
      const off = startOffset - (w * 7 + d)
      if (off < 0) {
        col.push(null)
        continue
      }
      const date = daysAgo(off, today)
      col.push({ date, count: counts[date] || 0 })
    }
    grid.push(col)
  }
  return { grid, counts }
}

export function streakInfo(s: GameState, today: string) {
  const counts = solveCountByDate(s)
  let current = 0
  while (counts[daysAgo(current, today)]) current++
  let best = 0
  let run = 0
  for (let o = 220; o >= 0; o--) {
    if (counts[daysAgo(o, today)]) {
      run++
      best = Math.max(best, run)
    } else run = 0
  }
  return { current, best: Math.max(best, current), active: Object.keys(counts).length }
}

export const ownedSpecies = (s: GameState) => new Set(s.owned.map((o) => o.sp))

export function formSets(s: GameState) {
  const shiny = new Set<string>()
  const mega = new Set<string>()
  const gmax = new Set<string>()
  for (const o of s.owned) {
    if (o.shiny) shiny.add(o.sp)
    if (o.unlocked.mega) mega.add(o.sp)
    if (o.unlocked.gmax) gmax.add(o.sp)
  }
  return { shiny, mega, gmax }
}

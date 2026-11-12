/* =====================================================================
   Economy and progression constants, plus the small helpers every
   rule module shares (EXP, levels, release value).
===================================================================== */
import type { Difficulty } from '../../shared/catalog'
import { byId, RARITY } from './species'
import type { GachaItem, OwnedMon } from './types'

export const LEVEL_CAP = 50
export const expToNext = (level: number) => level * 10 // level 1->2 costs 10, 9->10 costs 90

// Shards for solving a problem (claimed from the Dashboard).
export const SHARD_BY_DIFF: Record<Difficulty, number> = { Easy: 150, Medium: 300, Hard: 600 }

// Active Recall: one perfect quiz's worth of Shards a day, so it tops up solving instead of replacing it.
export const RECALL_SHARDS_PER_ANSWER = 50
export const RECALL_DAILY_SHARDS = 1000

// Summon costs and pity thresholds (draws since the last hit).
export const SUMMON_COST = { single: 400, multi: 2000 }
export const EPIC_PITY = 15
export const LEGEND_PITY = 40
export const LEGEND_TARGET_PITY = 100
export const EPIC_TARGET_PITY = 60
export const DUP_REFUND = 25 // Shards back for a duplicate

// Gacha items: bought with Coins in the Shop, spent on a Single Draw.
// A "ball" sets the draw's rarity (one per draw); a Generation Ticket narrows it to one generation.
export const GACHA_ITEMS: GachaItem[] = ['rateBooster', 'greatBall', 'ultraBall', 'genTicket']
export type Ball = 'boost' | 'great' | 'ultra'
export const BALL_ITEM: Record<Ball, GachaItem> = {
  boost: 'rateBooster',
  great: 'greatBall',
  ultra: 'ultraBall',
}

// Shop prices in Coins.
export const PRICES = {
  candy: 200,
  snack: 450,
  mega: 3000,
  gmax: 3000,
  shiny: 5000,
  greatBall: 750,
  genTicket: 1000,
  rateBooster: 1250,
  ultraBall: 2000,
} as const
export const CANDY_EXP = 35
export const SNACK_EXP = 5

// Shards for releasing a friend: 50 x rarity mult (50 / 100 / 150 / 250), doubled when shiny.
// Always well under a 400-Shard draw, so releasing can't be farmed.
const RELEASE_BASE = 50
export function releaseValue(inst: OwnedMon | undefined): number {
  const sp = inst && byId(inst.sp)
  if (!inst || !sp) return 0
  return RELEASE_BASE * RARITY[sp.rarity].mult * (inst.shiny ? 2 : 1)
}

export function addExp(inst: OwnedMon, amount: number): OwnedMon {
  let { level, exp } = inst
  exp += amount
  while (level < LEVEL_CAP && exp >= expToNext(level)) {
    exp -= expToNext(level)
    level++
  }
  if (level >= LEVEL_CAP) {
    level = LEVEL_CAP
    exp = Math.min(exp, expToNext(LEVEL_CAP))
  }
  return { ...inst, level, exp }
}

export function addLevels(inst: OwnedMon, n: number): OwnedMon {
  const level = Math.min(LEVEL_CAP, inst.level + n)
  return { ...inst, level, exp: level >= LEVEL_CAP ? 0 : inst.exp }
}

// EXP for the given friends (e.g. the team), everyone else unchanged.
export function giveExp(owned: OwnedMon[], iids: string[], amount: number): OwnedMon[] {
  const targets = new Set(iids)
  return owned.map((o) => (targets.has(o.iid) ? addExp(o, amount) : o))
}

// Ids for new friends and problems: time-ordered, with a random suffix.
export function newId(prefix: string, now: number, rng: () => number): string {
  return prefix + now.toString(36) + Math.floor(rng() * 1296).toString(36)
}

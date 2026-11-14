/* =====================================================================
   Summoning. Pity: an Epic+ is guaranteed every EPIC_PITY draws and a
   Legendary every LEGEND_PITY; a chosen target arrives within its own
   pity count. Every draw counts toward the targets, chosen or not, so
   draws made before choosing one (or before changing it) still count;
   a target's count starts over only when it arrives. Items (Single Draw
   only) set the draw's rarity or generation; when a pity or target
   guarantee lands, they are kept.
===================================================================== */
import {
  addLevels,
  BALL_ITEM,
  type Ball,
  DUP_REFUND,
  EPIC_PITY,
  EPIC_TARGET_PITY,
  evolveLevel,
  LEGEND_PITY,
  LEGEND_TARGET_PITY,
  newId,
} from './rules'
import {
  byId,
  DUP_LEVELS,
  GENERATIONS,
  randomOfTier,
  rollShiny,
  rollSpecies,
  type Species,
} from './species'
import type { Ctx, GachaItem, GameState, Rarity } from './types'

export interface SummonItems {
  ball?: Ball | null
  gen?: number | null
}

export interface PullResult {
  speciesId: string
  shiny: boolean
  rarity: Rarity
  isNew?: boolean
  isDup?: boolean
  levels?: number // duplicate: levels the matching friend gained (none once at the cap)
  level?: number // duplicate: that friend's level now
  ready?: boolean // duplicate: those levels made it able to evolve
  refund?: number
  pity: boolean
  target: boolean
  targetTier: 'legendary' | 'epic' | null
  used: GachaItem[]
  usedGen: number | null
  kept: boolean
}

// Choosing or changing a target keeps the draws already counted toward it.
export const setLegendaryTarget = (s: GameState, spId: string | null): GameState => ({
  ...s,
  guaranteedLegendary: spId || null,
})

export const setEpicTarget = (s: GameState, spId: string | null): GameState => ({
  ...s,
  guaranteedEpic: spId || null,
})

// Draws `count` friends (the Shards are spent by the caller).
export function pull(
  s: GameState,
  count: number,
  use: SummonItems | null,
  ctx: Ctx,
): { state: GameState; results: PullResult[] } {
  const items = { ...s.items }
  const ball = count === 1 && use?.ball && items[BALL_ITEM[use.ball]] > 0 ? use.ball : null
  const gen =
    count === 1 && use?.gen && items.genTicket > 0 && GENERATIONS.some((g) => g.gen === use.gen)
      ? use.gen
      : null
  const owned = s.owned.slice()
  let shards = s.shards
  let legendPity = s.pity
  let epicPity = s.epicPity
  let totalPulls = s.totalPulls
  let legendTargetPity = s.legendaryTargetPity
  let epicTargetPity = s.epicTargetPityCount
  const legendTarget = s.guaranteedLegendary
  const epicTarget = s.guaranteedEpic
  const results: PullResult[] = []
  let pityHits = 0

  for (let i = 0; i < count; i++) {
    legendPity++
    epicPity++
    // with no target yet, stop one short of the guarantee: choosing one makes the next draw it
    legendTargetPity = Math.min(
      legendTargetPity + 1,
      legendTarget ? Infinity : LEGEND_TARGET_PITY - 1,
    )
    epicTargetPity = Math.min(epicTargetPity + 1, epicTarget ? Infinity : EPIC_TARGET_PITY - 1)
    totalPulls++
    let sp: Species
    let pityHit = false
    let targetHit = false
    let targetTier: PullResult['targetTier'] = null
    let kept = false
    const used: GachaItem[] = []
    if (legendTarget && legendTargetPity >= LEGEND_TARGET_PITY && byId(legendTarget)) {
      sp = byId(legendTarget)!
      targetHit = true
      targetTier = 'legendary'
    } else if (epicTarget && epicTargetPity >= EPIC_TARGET_PITY && byId(epicTarget)) {
      sp = byId(epicTarget)!
      targetHit = true
      targetTier = 'epic'
    } else if (legendPity >= LEGEND_PITY) {
      sp = randomOfTier(ctx.rng, 'legendary')
      pityHit = true
    } else if (epicPity >= EPIC_PITY) {
      sp = ctx.rng() < 0.82 ? randomOfTier(ctx.rng, 'epic') : randomOfTier(ctx.rng, 'legendary')
      kept = !!(ball || gen)
    } else {
      sp = rollSpecies(ctx.rng, {
        boost: ball === 'boost',
        tier: ball === 'great' ? 'rare' : ball === 'ultra' ? 'epic' : null,
        gen,
      })
      if (ball) {
        items[BALL_ITEM[ball]]--
        used.push(BALL_ITEM[ball])
      }
      if (gen) {
        items.genTicket--
        used.push('genTicket')
      }
    }
    if ((pityHit || targetHit) && (ball || gen)) kept = true
    const itemInfo = { used, usedGen: used.includes('genTicket') ? gen : null, kept }
    const luck = { pity: pityHit, target: targetHit, targetTier }
    if (pityHit || targetHit) pityHits++
    if (sp.rarity === 'legendary') legendPity = 0
    if (sp.rarity === 'epic' || sp.rarity === 'legendary') epicPity = 0
    if (legendTarget && sp.id === legendTarget) legendTargetPity = 0
    if (epicTarget && sp.id === epicTarget) epicTargetPity = 0
    const shiny = rollShiny(ctx.rng)
    const base = { speciesId: sp.id, shiny, rarity: sp.rarity, ...luck, ...itemInfo }

    const idx = owned.findIndex((o) => o.sp === sp.id && o.shiny === shiny)
    if (idx >= 0) {
      // a duplicate: some Shards back, and levels for the friend it matches, which speeds up evolving
      shards += DUP_REFUND
      const before = owned[idx].level
      owned[idx] = addLevels(owned[idx], DUP_LEVELS)
      const level = owned[idx].level
      const evolveAt = evolveLevel(sp)
      results.push({
        ...base,
        isDup: true,
        levels: level - before,
        level,
        ready: evolveAt !== null && before < evolveAt && level >= evolveAt,
        refund: DUP_REFUND,
      })
    } else {
      const iid = newId('g' + i, ctx.now, ctx.rng)
      owned.push({ iid, sp: sp.id, level: 1, exp: 0, shiny, form: null, unlocked: {} })
      results.push({ ...base, isNew: true })
    }
  }

  const state: GameState = {
    ...s,
    owned,
    shards,
    items,
    pity: legendPity,
    epicPity,
    legendaryTargetPity: legendTargetPity,
    epicTargetPityCount: epicTargetPity,
    totalPulls,
    stats: { ...s.stats, pityHits: s.stats.pityHits + pityHits },
  }
  return { state, results }
}

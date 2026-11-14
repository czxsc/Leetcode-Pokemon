import { describe, expect, it } from 'vitest'
import {
  DUP_REFUND,
  EPIC_PITY,
  EPIC_TARGET_PITY,
  evolveLevel,
  LEGEND_PITY,
  LEGEND_TARGET_PITY,
  LEVEL_CAP,
} from './rules'
import { byId, DUP_LEVELS } from './species'
import { pull, setEpicTarget, setLegendaryTarget } from './summon'
import { ctx, game, seeded } from './test-helpers'

const rarityOf = (id: string) => byId(id)!.rarity

describe('pull', () => {
  it('guarantees an Epic or better on the EPIC_PITY-th draw', () => {
    const s = game({ epicPity: EPIC_PITY - 1 })
    const { results, state } = pull(s, 1, null, ctx())
    expect(['epic', 'legendary']).toContain(rarityOf(results[0].speciesId))
    expect(state.epicPity).toBe(0)
  })

  it('guarantees a Legendary on the LEGEND_PITY-th draw and counts the pity hit', () => {
    const s = game({ pity: LEGEND_PITY - 1 })
    const { results, state } = pull(s, 1, null, ctx())
    expect(rarityOf(results[0].speciesId)).toBe('legendary')
    expect(results[0].pity).toBe(true)
    expect(state.pity).toBe(0)
    expect(state.stats.pityHits).toBe(1)
  })

  it('delivers the chosen legendary target within LEGEND_TARGET_PITY draws', () => {
    const s = {
      ...setLegendaryTarget(game(), 'mewtwo'),
      legendaryTargetPity: LEGEND_TARGET_PITY - 1,
    }
    const { results, state } = pull(s, 1, null, ctx())
    expect(results[0]).toMatchObject({ speciesId: 'mewtwo', target: true, targetTier: 'legendary' })
    expect(state.legendaryTargetPity).toBe(0)
  })

  it('counts draws made before a target is chosen', () => {
    const before = pull(game({ shards: 10_000 }), 10, null, ctx()).state
    expect(before.legendaryTargetPity).toBe(10)
    expect(before.epicTargetPityCount).toBe(10)
    const chosen = setLegendaryTarget(setEpicTarget(before, 'venusaur'), 'mewtwo')
    expect(chosen.legendaryTargetPity).toBe(10)
    expect(chosen.epicTargetPityCount).toBe(10)
  })

  it('keeps the count when the target changes', () => {
    const s = { ...setLegendaryTarget(game(), 'mewtwo'), legendaryTargetPity: 40 }
    const changed = setLegendaryTarget(s, 'lugia')
    expect(changed.guaranteedLegendary).toBe('lugia')
    expect(changed.legendaryTargetPity).toBe(40)
    expect(setLegendaryTarget(s, null).legendaryTargetPity).toBe(40)
  })

  it('without a target, counts up to one draw short, so a target chosen then comes next', () => {
    const s = game({
      legendaryTargetPity: LEGEND_TARGET_PITY - 1,
      epicTargetPityCount: EPIC_TARGET_PITY - 1,
    })
    const { state } = pull(s, 5, null, ctx())
    expect(state.legendaryTargetPity).toBe(LEGEND_TARGET_PITY - 1)
    expect(state.epicTargetPityCount).toBe(EPIC_TARGET_PITY - 1)
    const { results } = pull(setLegendaryTarget(state, 'mewtwo'), 1, null, ctx())
    expect(results[0]).toMatchObject({ speciesId: 'mewtwo', target: true })
  })

  it('spends an armed ball and forces its rarity', () => {
    const s = game({ items: { rateBooster: 0, greatBall: 0, ultraBall: 1, genTicket: 0 } })
    const { results, state } = pull(s, 1, { ball: 'ultra' }, ctx())
    expect(rarityOf(results[0].speciesId)).toBe('epic')
    expect(results[0].used).toEqual(['ultraBall'])
    expect(state.items.ultraBall).toBe(0)
  })

  it('keeps items when a pity guarantee lands on that draw', () => {
    const s = game({
      pity: LEGEND_PITY - 1,
      items: { rateBooster: 0, greatBall: 1, ultraBall: 0, genTicket: 0 },
    })
    const { results, state } = pull(s, 1, { ball: 'great' }, ctx())
    expect(results[0].kept).toBe(true)
    expect(state.items.greatBall).toBe(1)
  })

  it('ignores items on a x5 draw', () => {
    const s = game({ items: { rateBooster: 0, greatBall: 0, ultraBall: 3, genTicket: 0 } })
    const { state } = pull(s, 5, { ball: 'ultra' }, ctx())
    expect(state.items.ultraBall).toBe(3)
    expect(state.totalPulls).toBe(5)
  })

  it('turns a duplicate into Shards plus levels for the friend it matches', () => {
    // find what the first draw with this seed gives, then own it already
    const first = pull(game({ owned: [] }), 1, null, ctx({ rng: seeded(7) })).results[0]
    const evolveAt = evolveLevel(byId(first.speciesId))
    const dupOf = (level: number) => {
      const owned = [
        {
          iid: 'x',
          sp: first.speciesId,
          level,
          exp: 0,
          shiny: first.shiny,
          form: null,
          unlocked: {},
        },
      ]
      return pull(game({ owned }), 1, null, ctx({ rng: seeded(7) }))
    }
    const { results, state } = dupOf(5)
    expect(results[0]).toMatchObject({ isDup: true, levels: DUP_LEVELS, level: 5 + DUP_LEVELS })
    expect(state.owned).toEqual([expect.objectContaining({ iid: 'x', level: 5 + DUP_LEVELS })])
    expect(state.shards).toBe(game().shards + DUP_REFUND)
    // levels that reach the evolution level say so
    if (evolveAt) expect(dupOf(evolveAt - 1).results[0].ready).toBe(true)
    expect(dupOf(LEVEL_CAP).results[0]).toMatchObject({ levels: 0, level: LEVEL_CAP })
  })

  it('is deterministic for a given random source', () => {
    const a = pull(game(), 5, null, ctx({ rng: seeded(42) })).results.map((r) => r.speciesId)
    const b = pull(game(), 5, null, ctx({ rng: seeded(42) })).results.map((r) => r.speciesId)
    expect(a).toEqual(b)
  })
})

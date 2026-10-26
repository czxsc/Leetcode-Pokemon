import { describe, expect, it } from 'vitest'
import {
  buyGachaItem,
  buyStone,
  completeOnboarding,
  evolveByDuplicates,
  rareCandy,
  releaseCreatures,
  shinyCandy,
  useStone,
} from './collection'
import { PRICES, releaseValue } from './rules'
import { EVO_COPIES } from './species'
import { buildState } from './state'
import { ctx, game, TODAY } from './test-helpers'
import type { OwnedMon } from './types'

const mon = (iid: string, sp: string, extra: Partial<OwnedMon> = {}): OwnedMon => ({
  iid,
  sp,
  level: 5,
  exp: 0,
  shiny: false,
  form: null,
  unlocked: {},
  copies: 0,
  ...extra,
})

describe('onboarding', () => {
  const fresh = () => buildState(null, null, TODAY, ctx().now)
  const team = ['pikachu', 'rattata', 'pidgey', 'zubat', 'oddish', 'growlithe']

  it('creates the starting team with a starter as partner', () => {
    const s = completeOnboarding(fresh(), { name: '  Ash  ', species: team }, ctx())!
    expect(s.onboarded).toBe(true)
    expect(s.trainer.name).toBe('Ash')
    expect(s.owned.map((o) => o.sp)).toEqual(team)
    expect(s.team).toHaveLength(6)
  })

  it('refuses a partner that is not a starter, or running twice', () => {
    expect(
      completeOnboarding(fresh(), { name: 'A', species: ['mewtwo', ...team.slice(1)] }, ctx()),
    ).toBeNull()
    const done = completeOnboarding(fresh(), { name: 'A', species: team }, ctx())!
    expect(completeOnboarding(done, { name: 'B', species: team }, ctx())).toBeNull()
  })
})

describe('shop', () => {
  it('charges Coins and refuses when there are not enough', () => {
    expect(buyStone(game({ coins: PRICES.mega - 1 }), 'mega')).toBeNull()
    const s = buyStone(game({ coins: PRICES.mega }), 'mega')!
    expect(s).toMatchObject({ coins: 0, megaStones: 1 })
    expect(buyGachaItem(game({ coins: PRICES.ultraBall }), 'ultraBall')!.items.ultraBall).toBe(1)
  })

  it('levels a friend with Rare Candy', () => {
    const s = rareCandy(
      game({ coins: PRICES.candy, owned: [mon('a', 'pikachu', { level: 1 })] }),
      'a',
    )!
    expect(s.owned[0].level).toBeGreaterThan(1)
  })

  it('refuses a Shiny Candy when that species already has a shiny', () => {
    const owned = [mon('a', 'pikachu'), mon('b', 'pikachu', { shiny: true })]
    expect(shinyCandy(game({ coins: PRICES.shiny, owned }), 'a')).toBeNull()
  })
})

describe('forms and evolution', () => {
  it('unlocks a mega form with a stone, once', () => {
    const s = useStone(game({ megaStones: 1, owned: [mon('a', 'charizard')] }), 'a', 'mega')!
    expect(s.owned[0]).toMatchObject({ form: 'mega', unlocked: { mega: true } })
    expect(s.megaStones).toBe(0)
    expect(useStone({ ...s, megaStones: 1 }, 'a', 'mega')).toBeNull()
  })

  it('evolves only with enough copies, counting the evolution', () => {
    const owned = [mon('a', 'charmander', { copies: EVO_COPIES - 1 })]
    expect(evolveByDuplicates(game({ owned }), 'a', null, ctx())).toBeNull()
    const s = evolveByDuplicates(
      game({ owned: [{ ...owned[0], copies: EVO_COPIES }] }),
      'a',
      null,
      ctx(),
    )!
    expect(s.owned[0]).toMatchObject({ sp: 'charmeleon', copies: 0 })
    expect(s.stats.evolutions).toBe(1)
  })
})

describe('releaseCreatures', () => {
  const owned = [mon('a', 'pikachu'), mon('b', 'rattata'), mon('c', 'mewtwo', { shiny: true })]

  it('pays Shards and skips team members', () => {
    const r = releaseCreatures(game({ owned, team: ['a'] }), ['a', 'c'])!
    expect(r.state.owned.map((o) => o.iid)).toEqual(['a', 'b'])
    expect(r.shards).toBe(releaseValue(owned[2]))
  })

  it('never releases every friend', () => {
    expect(releaseCreatures(game({ owned, team: [] }), ['a', 'b', 'c'])).toBeNull()
  })
})

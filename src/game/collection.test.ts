import { describe, expect, it } from 'vitest'
import {
  buyGachaItem,
  buyStone,
  completeOnboarding,
  evolve,
  rareCandy,
  releaseCreatures,
  shinyCandy,
  useStone,
} from './collection'
import { evolveLevel, LEVEL_CAP, PRICES, releaseValue, transformLevel } from './rules'
import { byId } from './species'
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
  const at = (sp: string, level: number) => game({ owned: [mon('a', sp, { level })] })

  it('spreads a line’s evolutions evenly up to the level cap', () => {
    const level = (id: string) => evolveLevel(byId(id))
    expect([level('charmander'), level('charmeleon'), level('charizard')]).toEqual([20, 40, null])
    expect([level('magikarp'), level('eevee'), level('mewtwo')]).toEqual([30, 30, null])
    expect(LEVEL_CAP).toBe(60)
  })

  it('unlocks Mega and G-Max 10 levels after the line’s last evolution, from Lv40 at least', () => {
    const level = (id: string) => transformLevel(byId(id)!)
    expect(level('charizard')).toBe(50)
    expect(level('pikachu')).toBe(50) // Raichu's line, even before evolving
    expect([level('gyarados'), level('meowth')]).toEqual([40, 40])
    expect(level('mewtwo')).toBe(40) // never evolves
  })

  it('unlocks a mega form with a stone, once, at its level', () => {
    expect(useStone({ ...at('charizard', 49), megaStones: 1 }, 'a', 'mega')).toBeNull()
    const s = useStone({ ...at('charizard', 50), megaStones: 1 }, 'a', 'mega')!
    expect(s.owned[0]).toMatchObject({ form: 'mega', unlocked: { mega: true } })
    expect(s.megaStones).toBe(0)
    expect(useStone({ ...s, megaStones: 1 }, 'a', 'mega')).toBeNull()
  })

  it('evolves at its level, keeping the level and counting the evolution', () => {
    expect(evolve(at('charmander', 19), 'a', null, ctx())).toBeNull()
    const s = evolve(at('charmander', 20), 'a', null, ctx())!
    expect(s.owned[0]).toMatchObject({ sp: 'charmeleon', level: 20 })
    expect(s.stats.evolutions).toBe(1)
    expect(evolve(s, 'a', null, ctx())).toBeNull() // Charmeleon waits for Lv40
    expect(evolve(at('charizard', 60), 'a', null, ctx())).toBeNull()
  })

  it('lets Eevee’s evolution be chosen', () => {
    expect(evolve(at('eevee', 30), 'a', 'vaporeon', ctx())!.owned[0].sp).toBe('vaporeon')
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

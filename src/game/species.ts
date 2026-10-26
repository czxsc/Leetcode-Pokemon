/* =====================================================================
   Species: the roster, rarities, evolutions, transform forms, and the
   random rolls the summon and onboarding use.
===================================================================== */
import { DEX, EEVEE_EVOS } from './dex'
import type { Form, Rarity } from './types'

export interface Species {
  id: string
  name: string
  types: string[]
  type: string // primary type
  rarity: Rarity
  gen: number
  evo: string | null
  mega: string | null // sprite slug of the mega form
  gmax: boolean
}

export const RARITY: Record<Rarity, { label: string; mult: number; color: string; glow: string }> =
  {
    common: { label: 'Common', mult: 1, color: '#9bb07e', glow: '#d6eeb0' },
    rare: { label: 'Rare', mult: 2, color: '#85bfe0', glow: '#c3e3ec' },
    epic: { label: 'Epic', mult: 3, color: '#b0a0d8', glow: '#d8caf2' },
    legendary: { label: 'Legendary', mult: 5, color: '#ecc46c', glow: '#fbe7b0' },
  }

export const PULL_WEIGHTS: Record<Rarity, number> = { common: 60, rare: 30, epic: 7, legendary: 3 }
// Rate Booster: Epic and Legendary odds doubled, the extra taken from Common
export const BOOSTED_WEIGHTS: Record<Rarity, number> = {
  common: PULL_WEIGHTS.common - PULL_WEIGHTS.epic - PULL_WEIGHTS.legendary,
  rare: PULL_WEIGHTS.rare,
  epic: PULL_WEIGHTS.epic * 2,
  legendary: PULL_WEIGHTS.legendary * 2,
}
export const SHINY_CHANCE = 0.05 // summon shiny odds
export const FORM_BONUS: Record<Form, number> = { mega: 1.6, gmax: 1.9 } // power multiplier when transformed
export const EVO_COPIES = 3 // dupes needed to evolve
export const DUP_LEVELS = 5 // levels for a non-evolvable dupe

export const SPECIES: Species[] = DEX.map((d) => ({
  id: d[0],
  name: d[1],
  types: d[2].split(','),
  type: d[2].split(',')[0],
  rarity: d[3],
  gen: d[4],
  evo: d[5] || null,
  mega: d[6] || null,
  gmax: !!d[7],
}))
const BY_ID = new Map(SPECIES.map((s) => [s.id, s]))

export const GENERATIONS = (
  [
    [1, 'Kanto'],
    [2, 'Johto'],
    [3, 'Hoenn'],
    [4, 'Sinnoh'],
    [5, 'Unova'],
    [6, 'Kalos'],
    [7, 'Alola'],
    [8, 'Galar'],
  ] as const
)
  .map(([gen, region]) => ({ gen, region, count: SPECIES.filter((s) => s.gen === gen).length }))
  .filter((g) => g.count > 0)

export function byId(id: string | null | undefined): Species | undefined {
  return id ? BY_ID.get(id) : undefined
}

export type Rng = () => number

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)]
}

export function tierPool(tier: Rarity, gen?: number | null): Species[] {
  return SPECIES.filter((s) => s.rarity === tier && (!gen || s.gen === gen))
}

// A random species of one rarity, from one generation when it has any.
export function randomOfTier(rng: Rng, tier: Rarity, gen?: number | null): Species {
  const inGen = gen ? tierPool(tier, gen) : []
  return pick(rng, inGen.length ? inGen : tierPool(tier))
}

// boost: Rate Booster odds; tier: force the rarity; gen: limit to one generation
export function rollSpecies(
  rng: Rng,
  opts: { boost?: boolean; tier?: Rarity | null; gen?: number | null } = {},
): Species {
  if (opts.tier) return randomOfTier(rng, opts.tier, opts.gen)
  const weights = opts.boost ? BOOSTED_WEIGHTS : PULL_WEIGHTS
  const r = rng() * 100
  let acc = 0
  for (const tier of ['legendary', 'epic', 'rare', 'common'] as const) {
    acc += weights[tier]
    if (r < acc) return randomOfTier(rng, tier, opts.gen)
  }
  return randomOfTier(rng, 'common', opts.gen)
}

export function rollShiny(rng: Rng): boolean {
  return rng() < SHINY_CHANCE
}

// Species a Pokémon can evolve into (Eevee has a choice).
export function evoOptions(sp: Species | undefined): string[] {
  if (!sp) return []
  if (sp.id === 'eevee') return EEVEE_EVOS.slice()
  return sp.evo ? [sp.evo] : []
}

// ---- onboarding: pick one partner, the other five are random basics ----
// Partner choices: every generation's starter trio plus Pikachu and Eevee.
// Gen 1-5 only, so every partner uses the animated Black/White sprite.
export const STARTERS = [
  'bulbasaur',
  'charmander',
  'squirtle',
  'pikachu',
  'eevee',
  'caterpie',
  'chikorita',
  'cyndaquil',
  'totodile',
  'treecko',
  'torchic',
  'mudkip',
  'turtwig',
  'chimchar',
  'piplup',
  'snivy',
  'tepig',
  'oshawott',
].filter((id) => BY_ID.has(id))

// Basic (unevolved) species, so a starting team never skips ahead in an evolution line.
const EVOLVED = new Set([...SPECIES.map((s) => s.evo).filter(Boolean), ...EEVEE_EVOS])

function pickDistinct(rng: Rng, pool: Species[], n: number): string[] {
  const copy = pool.slice()
  const out: string[] = []
  while (out.length < n && copy.length)
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0].id)
  return out
}

// [partner, 4 commons, 1 rare]; the random five never include a partner choice
export function rollStarterTeam(rng: Rng, partnerId: string): string[] {
  const basic = (tier: Rarity) =>
    SPECIES.filter((s) => s.rarity === tier && !EVOLVED.has(s.id) && !STARTERS.includes(s.id))
  return [
    partnerId,
    ...pickDistinct(rng, basic('common'), 4),
    ...pickDistinct(rng, basic('rare'), 1),
  ]
}

export function canTransform(sp: Species | undefined): boolean {
  return !!(sp && (sp.mega || sp.gmax))
}

// every transform form a species can take (in display order)
export function formsFor(sp: Species | undefined): Form[] {
  const out: Form[] = []
  if (sp && sp.mega) out.push('mega')
  if (sp && sp.gmax) out.push('gmax')
  return out
}

export function formName(sp: Species, form: Form): string {
  if (form === 'gmax') return 'Gigantamax ' + sp.name
  const suffix = sp.mega?.endsWith('-x') ? ' X' : sp.mega?.endsWith('-y') ? ' Y' : ''
  return 'Mega ' + sp.name + suffix
}

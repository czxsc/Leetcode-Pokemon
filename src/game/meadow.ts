/* =====================================================================
   Focus battles. Time spent on LeetCode during a study session is
   fought through in rounds: wild Pokémon appear (quick small ones
   between bigger bosses), the team attacks every TICK_MS of study time,
   and each defeat pays Coins, sometimes Shards, and team EXP. A stronger
   team wins faster, so it earns more per hour. Today's zone and weather
   come from the date.
===================================================================== */
import * as D from './derived'
import { giveExp } from './rules'
import { byId, pick, RARITY, SPECIES, type Rng } from './species'
import type { GameState, Rarity } from './types'

export const TICK_MS = 700 // one round of attacks per 0.7s of study time
export const FIRST_SPAWN_MS = 2200

// ---- zones and weather (one of each per day) ----
export const ZONES = [
  {
    id: 'forest',
    name: 'Viridian Forest',
    desc: 'Lush green woodland',
    types: ['normal', 'bug'],
    coinFloor: 10,
    coinCeil: 40,
    shardChance: 0.04,
    accent: '#a6cf78',
  },
  {
    id: 'moon',
    name: 'Mt. Moon',
    desc: 'Crystal-lit caverns',
    types: ['rock', 'psychic'],
    coinFloor: 25,
    coinCeil: 80,
    shardChance: 0.06,
    accent: '#b0a0d8',
  },
  {
    id: 'seafoam',
    name: 'Seafoam Islands',
    desc: 'Icy coastal grottos',
    types: ['water', 'ice'],
    coinFloor: 50,
    coinCeil: 120,
    shardChance: 0.12,
    accent: '#a9dde0',
  },
  {
    id: 'victory',
    name: 'Victory Road',
    desc: 'Dark mountain pass',
    types: ['dragon', 'psychic'],
    coinFloor: 100,
    coinCeil: 250,
    shardChance: 0.2,
    accent: '#9aa0e0',
  },
]
export type Zone = (typeof ZONES)[number]

// matching types deal 1.4x damage (the in-game note rounds it to 1.5x)
export const WEATHER = [
  { id: 'sunny', icon: '☀️', name: 'Sunny Day', type: 'fire', note: 'Fire types deal 1.5× damage' },
  { id: 'rain', icon: '☔', name: 'Rain', type: 'water', note: 'Water types deal 1.5× damage' },
  {
    id: 'breeze',
    icon: '🍃',
    name: 'Leaf Breeze',
    type: 'grass',
    note: 'Grass types deal 1.5× damage',
  },
  {
    id: 'storm',
    icon: '⚡',
    name: 'Thunderhead',
    type: 'electric',
    note: 'Electric types deal 1.5× damage',
  },
  { id: 'frost', icon: '❄️', name: 'Cold Snap', type: 'ice', note: 'Ice types deal 1.5× damage' },
  {
    id: 'mist',
    icon: '🌫️',
    name: 'Psy Mist',
    type: 'psychic',
    note: 'Psychic types deal 1.5× damage',
  },
]
export type Weather = (typeof WEATHER)[number]

// deterministic per date
export function daySeed(date: string): { zone: Zone; weather: Weather } {
  let h = 0
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0
  return { zone: ZONES[h % ZONES.length], weather: WEATHER[(h >> 3) % WEATHER.length] }
}

// ---- wild Pokémon and combat ----
export type Tier = 'small' | 'normal' | 'elite' | 'legend'

// Per tier: share of spawns, HP and pay (Coins and Shard chance) relative to a normal boss, team
// EXP per defeat, which rarities appear, level as [lowest, spread] and shiny odds.
// Legendaries are VERY infrequent; small ones are quick fights for a few Coins.
const TIERS: Record<
  Tier,
  {
    odds: number
    hp: number
    pay: number
    exp: number
    rarities: Rarity[]
    level: [number, number]
    shiny: number
  }
> = {
  small: { odds: 0.3, hp: 0.2, pay: 0.5, exp: 1, rarities: ['common'], level: [2, 6], shiny: 0.02 },
  normal: {
    odds: 0.52,
    hp: 1,
    pay: 1,
    exp: 1,
    rarities: ['common', 'rare'],
    level: [8, 16],
    shiny: 0.02,
  },
  elite: {
    odds: 0.155,
    hp: 4,
    pay: 5,
    exp: 4,
    rarities: ['rare', 'epic'],
    level: [24, 18],
    shiny: 0.02,
  },
  legend: {
    odds: 0.025,
    hp: 11,
    pay: 20,
    exp: 12,
    rarities: ['legendary'],
    level: [42, 22],
    shiny: 0.06,
  },
}

// Rarest first; whatever is left over is a normal boss.
function rollTier(rng: Rng): Tier {
  let r = rng()
  for (const tier of ['legend', 'elite', 'small'] as const) {
    r -= TIERS[tier].odds
    if (r < 0) return tier
  }
  return 'normal'
}

// About a new player's team (six Lv5s). A team this strong fights each tier for the same time
// whatever it is made of; past it, enemy HP grows only with the square root of team power, so
// every level, rarer friend and solved problem shortens fights (4x the power, half the time).
export const BASE_POWER = 40
function toughness(power: number): number {
  return power <= BASE_POWER ? power : Math.sqrt(BASE_POWER * power)
}

export interface Boss {
  sp: string
  name: string
  rarity: Rarity
  tier: Tier
  shiny: boolean
  level: number
  maxHp: number
  hp: number
  born: number
}

// combat: the current boss, study time left before the next one appears,
// and study time already banked toward the next round of attacks
export interface Combat {
  boss: Boss | null
  wait: number
  carry: number
}

export interface Hit {
  iid: string
  slot: number
  dmg: number
  crit: boolean
  weather: boolean
  id: string
  t: number
}

export interface LogLine {
  k: 'win' | 'spawn'
  tier: Tier
  t: string
}

export interface BattleResult {
  studied: number
  coins: number
  shards: number
  exp: number
  kills: number
  log: LogLine[]
  events: Hit[] // the latest round of attacks, for the damage numbers
  combat: Combat
}

export const newCombat = (): Combat => ({ boss: null, wait: FIRST_SPAWN_MS, carry: 0 })

function rollBoss(s: GameState, zone: Zone, rng: Rng, now: number): Boss {
  const tier = rollTier(rng)
  const t = TIERS[tier]
  // legendaries come from anywhere, the rest from today's zone
  let pool = SPECIES.filter(
    (x) =>
      t.rarities.includes(x.rarity) &&
      (tier === 'legend' || zone.types.some((type) => x.types.includes(type))),
  )
  if (!pool.length) pool = SPECIES.filter((x) => x.rarity === 'common')
  if (!pool.length) pool = SPECIES
  const sp = pick(rng, pool)
  const shiny = rng() < t.shiny
  const maxHp = Math.round(toughness(Math.max(20, D.teamPower(s))) * (26 + rng() * 12) * t.hp)
  const level = t.level[0] + Math.floor(rng() * t.level[1])
  return {
    sp: sp.id,
    name: sp.name,
    rarity: sp.rarity,
    tier,
    shiny,
    level,
    maxHp,
    hp: maxHp,
    born: now,
  }
}

// spawn gap: some downtime so combat isn't back-to-back (7-13s)
const spawnGap = (rng: Rng) => 7000 + Math.floor(rng() * 6000)

// One round of attacks: per-member damage with variation and crits.
function strike(s: GameState, weather: Weather, rng: Rng, now: number) {
  const mult = D.teamMultiplier(s)
  const events: Hit[] = []
  let total = 0
  D.teamList(s).forEach((mem, slot) => {
    const sp = byId(mem.sp)!
    const wBuff = sp.types.includes(weather.type) ? 1.4 : 1
    let dmg = D.monPower(mem) * 0.18 * mult * wBuff * (0.78 + rng() * 0.44)
    const crit = rng() < 0.16
    if (crit) dmg *= 2
    dmg = Math.max(1, Math.round(dmg))
    total += dmg
    events.push({
      iid: mem.iid,
      slot,
      dmg,
      crit,
      weather: wBuff > 1,
      id: rng().toString(36).slice(2),
      t: now,
    })
  })
  return { total, events }
}

function defeat(boss: Boss, zone: Zone, r: BattleResult, rng: Rng) {
  const rMult = RARITY[boss.rarity].mult // 1 / 2 / 3 / 5
  const t = TIERS[boss.tier]
  const lvlFactor = 0.5 + boss.level / 40 // ~0.55 .. ~2.1
  const baseCoins = zone.coinFloor + Math.floor(rng() * (zone.coinCeil - zone.coinFloor + 1))
  const variance = 0.8 + rng() * 0.5
  const coins = Math.round(baseCoins * 0.35 * t.pay * lvlFactor * variance)
  const shardP = Math.min(0.95, zone.shardChance * t.pay)
  const shards =
    rng() < shardP
      ? Math.round((10 + rng() * 30) * (rMult / 2) * (boss.tier === 'legend' ? 3 : 1))
      : 0
  const tag = boss.tier === 'legend' ? '⭐ ' : boss.tier === 'elite' ? '✨ ' : ''
  r.coins += coins
  r.shards += shards
  r.kills++
  r.exp += t.exp
  r.log.push({
    k: 'win',
    tier: boss.tier,
    t: `Defeated ${tag}${boss.name} (Lv${boss.level})!  +${coins}c${shards ? `  +${shards}sh` : ''}`,
  })
}

// Fight through `studied` ms of study time.
export function battle(
  s: GameState,
  combat: Combat,
  studied: number,
  ctx: { today: string; now: number; rng: Rng },
): BattleResult {
  const { zone, weather } = daySeed(ctx.today)
  const hasTeam = D.teamList(s).length > 0
  const r: BattleResult = {
    studied,
    coins: 0,
    shards: 0,
    exp: 0,
    kills: 0,
    log: [],
    events: [],
    combat,
  }
  let { boss, wait } = combat
  let time = combat.carry + studied
  while (hasTeam) {
    if (!boss) {
      if (time < wait) {
        wait -= time
        time = 0
        break
      }
      time -= wait
      wait = 0
      boss = rollBoss(s, zone, ctx.rng, ctx.now)
      const tag =
        boss.tier === 'legend' ? '⭐ LEGENDARY ' : boss.tier === 'elite' ? '✨ ELITE ' : ''
      const shiny = boss.shiny ? 'shiny ' : ''
      r.log.push({
        k: 'spawn',
        tier: boss.tier,
        t:
          boss.tier === 'small'
            ? `A wild ${shiny}${boss.name} wandered in!`
            : `A ${tag}wild ${shiny}${boss.name} appeared!`,
      })
      continue
    }
    if (time < TICK_MS) break
    time -= TICK_MS
    const hit = strike(s, weather, ctx.rng, ctx.now)
    if (time < TICK_MS) r.events = hit.events // only the latest round is animated
    boss = { ...boss, hp: boss.hp - hit.total }
    if (boss.hp <= 0) {
      defeat(boss, zone, r, ctx.rng)
      boss = null
      wait = spawnGap(ctx.rng)
    }
  }
  return { ...r, combat: { boss, wait, carry: hasTeam ? time : 0 } }
}

// Battle rewards: Coins, Shards, team EXP and the day's Focus counters.
export function payOut(s: GameState, r: BattleResult): GameState {
  const m = s.meadow
  return {
    ...s,
    coins: s.coins + r.coins,
    shards: s.shards + r.shards,
    owned: r.exp ? giveExp(s.owned, s.team, r.exp) : s.owned,
    meadow: {
      ...m,
      coinsToday: m.coinsToday + r.coins,
      kills: m.kills + r.kills,
      studyToday: m.studyToday + r.studied,
      studyTotal: m.studyTotal + r.studied,
    },
  }
}

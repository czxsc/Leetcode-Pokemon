/* =====================================================================
   The game's data model. State = game progress + the problem library;
   it is saved as those two documents (see splitState in state.ts).
===================================================================== */
import type { CustomTag, Library, Problem } from '../../shared/library'

export type { CustomTag, Library, Problem }

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Form = 'mega' | 'gmax'
export type GachaItem = 'rateBooster' | 'greatBall' | 'ultraBall' | 'genTicket'

// One owned Pokémon ("friend"). `sp` is the species id; `copies` are
// duplicates banked toward evolving.
export interface OwnedMon {
  iid: string
  sp: string
  level: number
  exp: number
  shiny: boolean
  form: Form | null
  unlocked: Partial<Record<Form, boolean>>
  copies: number
}

export interface Trainer {
  name: string
  avatar?: string // small data: URL
}

// Lifetime counters read by the progression quests.
export interface Stats {
  evolutions: number
  pityHits: number
  recalls: number
  perfectDays: number
  lastPerfectDay: string | null
}

export interface Progress {
  onboarded: boolean
  stats: Stats
  achievements: Record<string, string> // quest id -> day claimed
  trainer: Trainer
  createdAt: string
  preferredLanguage: string
  shards: number
  coins: number
  megaStones: number
  gmaxStones: number
  items: Record<GachaItem, number>
  owned: OwnedMon[]
  team: string[] // up to six iids
  quests: Record<string, number | boolean> // daily quest id -> steps claimed today
  recallBest: number
  recallToday: boolean
  recallShardsToday: number // counts toward the daily limit (see recall.ts)
  pity: number
  epicPity: number
  totalPulls: number
  guaranteedLegendary: string | null
  guaranteedEpic: string | null
  legendaryTargetPity: number
  epicTargetPityCount: number
  // study time in ms; the live session itself is kept by platform/study-session.ts
  meadow: { coinsToday: number; kills: number; studyToday: number; studyTotal: number }
  lastDay: string
  v: 6
}

export type GameState = Progress & Library

// What a rule needs from the outside world, passed in so rules stay pure.
export interface Ctx {
  today: string // local date, YYYY-MM-DD
  now: number // ms since epoch
  rng: () => number // uniform in [0, 1)
}

/* =====================================================================
   Game state: a fresh account, filling in / cleaning up saved data, the
   daily rollover, and the split into the two saved documents.
===================================================================== */
import * as Catalog from '../../shared/catalog'
import { LIMITS } from '../../shared/library'
import { GACHA_ITEMS } from './rules'
import type { CustomTag, GameState, Library, OwnedMon, Problem, Progress, Stats } from './types'

// Saved documents are untrusted JSON: everything read from them is checked and normalized.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Saved = Record<string, any>

const isDay = (d: unknown): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)

// custom trainer photo: a small data: URL (uploads are shrunk before saving)
export const AVATAR_MAX_CHARS = 400000
export const isAvatar = (a: unknown): a is string =>
  typeof a === 'string' &&
  a.length <= AVATAR_MAX_CHARS &&
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(a)

// A brand-new account: 5000 Shards and six placeholder friends until onboarding picks the team.
function starterOwned(): OwnedMon[] {
  const mk = (iid: string, sp: string): OwnedMon => ({
    iid,
    sp,
    level: 5,
    exp: 0,
    shiny: false,
    form: null,
    unlocked: {},
    copies: 0,
  })
  return [
    mk('c1', 'bulbasaur'),
    mk('c2', 'caterpie'),
    mk('c3', 'magikarp'),
    mk('c4', 'charmander'),
    mk('c5', 'squirtle'),
    mk('c6', 'eevee'),
  ]
}

const seedStats = (): Stats => ({
  evolutions: 0,
  pityHits: 0,
  recalls: 0,
  perfectDays: 0,
  lastPerfectDay: null,
})

export function seedProgress(today: string): Progress {
  const owned = starterOwned()
  return {
    onboarded: false,
    stats: seedStats(),
    achievements: {},
    trainer: { name: 'Trainer' },
    createdAt: today,
    preferredLanguage: 'python',
    shards: 5000,
    coins: 0,
    megaStones: 0,
    gmaxStones: 0,
    items: { rateBooster: 0, greatBall: 0, ultraBall: 0, genTicket: 0 },
    owned,
    team: owned.map((o) => o.iid),
    quests: {},
    recallBest: 0,
    recallToday: false,
    pity: 0,
    epicPity: 0,
    totalPulls: 0,
    guaranteedLegendary: null,
    guaranteedEpic: null,
    legendaryTargetPity: 0,
    epicTargetPityCount: 0,
    meadow: { coinsToday: 0, kills: 0, studyToday: 0, studyTotal: 0 },
    lastDay: today,
    v: 6,
  }
}

const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0)

// Fill in anything missing from a saved (or imported) progress document.
export function normalizeProgress(saved: Saved, today: string): Progress {
  const seed = seedProgress(today)
  const meadow = saved.meadow || {}
  const p: Progress = Object.assign(seed, saved, {
    trainer: { ...seed.trainer, ...(saved.trainer || {}) },
    meadow: {
      coinsToday: count(meadow.coinsToday),
      kills: count(meadow.kills),
      studyToday: count(meadow.studyToday),
      studyTotal: count(meadow.studyTotal),
    },
    // saves from before onboarding existed already have a team, so they skip it
    onboarded:
      'onboarded' in saved
        ? !!saved.onboarded
        : Array.isArray(saved.owned) && saved.owned.length > 0,
    stats: { ...seed.stats, ...(saved.stats || {}) },
    items: Object.fromEntries(
      GACHA_ITEMS.map((k) => [k, count((saved.items || {})[k])]),
    ) as Progress['items'],
    achievements: { ...(saved.achievements || {}) },
    v: 6 as const,
  })
  delete (p as Partial<GameState>).problems
  delete (p as Partial<GameState>).customTags
  if (!isAvatar(p.trainer.avatar)) delete p.trainer.avatar
  // every instance has an `unlocked` form set (derived from a legacy `form`)
  p.owned = (Array.isArray(p.owned) ? p.owned : []).map((o) => {
    let unlocked = o.unlocked || {}
    if (o.form && !unlocked[o.form]) unlocked = { ...unlocked, [o.form]: true }
    return { ...o, unlocked }
  })
  p.team = (Array.isArray(p.team) ? p.team : [])
    .filter((iid) => p.owned.some((o) => o.iid === iid))
    .slice(0, 6)
  return p
}

// Saved timestamps are kept in one format (what Date#toISOString gives).
function timestamp(value: unknown, now: number): string {
  const ms =
    typeof value === 'string' || typeof value === 'number' ? Date.parse(String(value)) : NaN
  return new Date(Number.isFinite(ms) ? ms : now).toISOString()
}

// Clean up one problem so it always satisfies shared/library.ts.
export function normalizeProblem(p: Saved, now: number): Problem {
  const difficulty = Catalog.DIFFICULTIES.includes(p.difficulty) ? p.difficulty : 'Medium'
  let url = Catalog.oneLine(p.url)
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url
  return {
    id: String(p.id).slice(0, LIMITS.idLength),
    title: Catalog.oneLine(p.title).slice(0, LIMITS.titleLength) || 'Untitled',
    difficulty,
    tags: [
      ...new Set(
        (Array.isArray(p.tags) ? p.tags : []).filter(
          (t: unknown): t is string =>
            typeof t === 'string' && !!t && t.length <= LIMITS.tagIdLength,
        ),
      ),
    ].slice(0, LIMITS.tagsPerProblem),
    language: Catalog.languageById(p.language).id,
    code: typeof p.code === 'string' ? p.code.replace(/\r\n?/g, '\n') : '',
    url: url.slice(0, LIMITS.urlLength),
    createdAt: timestamp(p.createdAt, now),
    solvedAt: isDay(p.solvedAt) ? p.solvedAt : null,
    claimed: !!p.claimed,
    claimedAt: isDay(p.claimedAt) ? p.claimedAt : null,
  }
}

export function normalizeLibrary(saved: Saved, now: number): Library {
  const customTags: CustomTag[] = Catalog.tagList(saved.customTags)
    .filter((t) => t.custom)
    .map((t) => ({ id: t.id, name: t.name.slice(0, LIMITS.tagNameLength) }))
  const problems = (Array.isArray(saved.problems) ? saved.problems : [])
    .filter((p: Saved) => p && p.id != null && typeof p.title === 'string')
    .map((p: Saved) => normalizeProblem(p, now))
  return { problems, customTags }
}

// Daily quests, the recall refresher and today's Focus counters reset each day.
export function rollDailyState(state: GameState, today: string): GameState {
  if (state.lastDay === today) return state
  return {
    ...state,
    quests: {},
    recallToday: false,
    meadow: { ...state.meadow, coinsToday: 0, studyToday: 0 },
    lastDay: today,
  }
}

export function buildState(
  progress: Saved | null,
  library: Saved | null,
  today: string,
  now: number,
): GameState {
  return rollDailyState(
    { ...normalizeProgress(progress || {}, today), ...normalizeLibrary(library || {}, now) },
    today,
  )
}

// The state is saved as two documents: game progress and the problem library.
export function splitState(state: GameState): { progress: Progress; library: Library } {
  const { problems, customTags, ...progress } = state
  return { progress, library: { problems, customTags } }
}

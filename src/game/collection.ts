/* =====================================================================
   The collection: onboarding, the trainer card, the team, Shop
   purchases, transform forms, evolving and releasing friends.
   Every rule returns the next state, or null when it isn't allowed.
===================================================================== */
import * as Catalog from '../../shared/catalog'
import {
  CANDY_EXP,
  evolveLevel,
  GACHA_ITEMS,
  giveExp,
  PRICES,
  releaseValue,
  SNACK_EXP,
  transformLevel,
} from './rules'
import { byId, evoOptions, pick, STARTERS } from './species'
import { isAvatar } from './state'
import type { Ctx, Form, GachaItem, GameState, OwnedMon } from './types'

type Next = GameState | null

const trainerName = (name: unknown) => Catalog.oneLine(name).slice(0, 24) || 'Trainer'

export const addShards = (s: GameState, n: number): GameState => ({ ...s, shards: s.shards + n })

export const spendShards = (s: GameState, n: number): Next =>
  s.shards < n ? null : { ...s, shards: s.shards - n }

// First run: name, optional photo, and the six species from rollStarterTeam (all Lv5).
export function completeOnboarding(
  s: GameState,
  { name, avatar, species }: { name: string; avatar?: string | null; species: string[] },
  ctx: Ctx,
): Next {
  if (s.onboarded) return null
  if (
    !Array.isArray(species) ||
    species.length !== 6 ||
    !species.every((id) => byId(id)) ||
    !STARTERS.includes(species[0])
  )
    return null
  const stamp = ctx.now.toString(36)
  const owned: OwnedMon[] = species.map((sp, i) => ({
    iid: 's' + i + stamp,
    sp,
    level: 5,
    exp: 0,
    shiny: false,
    form: null,
    unlocked: {},
  }))
  const trainer: GameState['trainer'] = { name: trainerName(name) }
  if (isAvatar(avatar)) trainer.avatar = avatar
  return {
    ...s,
    onboarded: true,
    trainer,
    owned,
    team: owned.map((o) => o.iid),
    createdAt: ctx.today,
  }
}

export const setTrainerName = (s: GameState, name: string): GameState => ({
  ...s,
  trainer: { ...s.trainer, name: trainerName(name) },
})

// dataUrl = a data:image URL, or null to go back to the default avatar
export function setTrainerAvatar(s: GameState, dataUrl: string | null): Next {
  if (dataUrl != null && !isAvatar(dataUrl)) return null
  const trainer = { ...s.trainer }
  if (dataUrl) trainer.avatar = dataUrl
  else delete trainer.avatar
  return { ...s, trainer }
}

export const setTeam = (s: GameState, team: string[]): GameState => ({
  ...s,
  team: team.slice(0, 6),
})

// ---- Shop ----
function spendCoins(s: GameState, price: number, change: (s: GameState) => GameState): Next {
  return s.coins < price ? null : change({ ...s, coins: s.coins - price })
}

export const rareCandy = (s: GameState, iid: string): Next =>
  spendCoins(s, PRICES.candy, (x) => ({ ...x, owned: giveExp(x.owned, [iid], CANDY_EXP) }))

export const teamSnack = (s: GameState): Next =>
  spendCoins(s, PRICES.snack, (x) => ({ ...x, owned: giveExp(x.owned, x.team, SNACK_EXP) }))

export const buyStone = (s: GameState, form: Form): Next =>
  form === 'mega'
    ? spendCoins(s, PRICES.mega, (x) => ({ ...x, megaStones: x.megaStones + 1 }))
    : spendCoins(s, PRICES.gmax, (x) => ({ ...x, gmaxStones: x.gmaxStones + 1 }))

export const buyGachaItem = (s: GameState, id: GachaItem): Next =>
  GACHA_ITEMS.includes(id)
    ? spendCoins(s, PRICES[id], (x) => ({ ...x, items: { ...x.items, [id]: x.items[id] + 1 } }))
    : null

// Shiny Candy: turns one friend shiny (level and forms stay). Its normal version is then
// no longer owned, so the summon pays it out as NEW again and both versions can be collected.
// Refused when a shiny of that species is already owned.
export function shinyCandy(s: GameState, iid: string): Next {
  const inst = s.owned.find((o) => o.iid === iid)
  if (!inst || inst.shiny || s.owned.some((o) => o.sp === inst.sp && o.shiny)) return null
  return spendCoins(s, PRICES.shiny, (x) => ({
    ...x,
    owned: x.owned.map((o) => (o.iid === iid ? { ...o, shiny: true } : o)),
  }))
}

// ---- forms: unlock with a stone once strong enough, then switch freely ----
export function useStone(s: GameState, iid: string, form: Form): Next {
  const inst = s.owned.find((o) => o.iid === iid)
  const sp = inst && byId(inst.sp)
  const stones = form === 'mega' ? s.megaStones : s.gmaxStones
  if (!inst || !sp || !sp[form] || inst.unlocked[form] || stones <= 0) return null
  if (inst.level < transformLevel(sp)) return null
  return {
    ...s,
    ...(form === 'mega' ? { megaStones: stones - 1 } : { gmaxStones: stones - 1 }),
    owned: s.owned.map((o) =>
      o.iid === iid ? { ...o, unlocked: { ...o.unlocked, [form]: true }, form } : o,
    ),
  }
}

export function setForm(s: GameState, iid: string, form: Form | null): Next {
  const inst = s.owned.find((o) => o.iid === iid)
  if (!inst || (form && !inst.unlocked[form])) return null
  return { ...s, owned: s.owned.map((o) => (o.iid === iid ? { ...o, form: form || null } : o)) }
}

// ---- evolve at the species' evolution level (player-initiated, so Eevee's can be chosen) ----
// The level carries over; Mega and G-Max unlocks belonged to the old species.
export function evolve(s: GameState, iid: string, chosenEvo: string | null, ctx: Ctx): Next {
  const inst = s.owned.find((o) => o.iid === iid)
  const sp = byId(inst?.sp)
  const at = evolveLevel(sp)
  if (!inst || at === null || inst.level < at) return null
  const options = evoOptions(sp)
  const evo = chosenEvo && options.includes(chosenEvo) ? chosenEvo : pick(ctx.rng, options)
  return {
    ...s,
    owned: s.owned.map((o) => (o.iid === iid ? { ...o, sp: evo, form: null, unlocked: {} } : o)),
    stats: { ...s.stats, evolutions: s.stats.evolutions + 1 },
  }
}

// ---- release friends for Shards ----
// Team members are skipped, and at least one friend always stays.
export function releaseCreatures(
  s: GameState,
  iids: string[],
): { state: GameState; shards: number } | null {
  const chosen = new Set(iids.filter((iid) => !s.team.includes(iid)))
  const gone = s.owned.filter((o) => chosen.has(o.iid))
  if (!gone.length || gone.length >= s.owned.length) return null
  const shards = gone.reduce((n, o) => n + releaseValue(o), 0)
  return {
    state: { ...s, owned: s.owned.filter((o) => !chosen.has(o.iid)), shards: s.shards + shards },
    shards,
  }
}

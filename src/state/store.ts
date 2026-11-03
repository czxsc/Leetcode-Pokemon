/* =====================================================================
   The app's state container. Holds the game state, applies the pure
   rules in src/game/ to it, and hands every change to persistence.
   Components read it with useStore() and call store.<action>().
===================================================================== */
import { useSyncExternalStore } from 'react'
import * as Catalog from '../../shared/catalog'
import { exportBackup, parseBackup } from '../game/backup'
import * as Chapters from '../game/chapters'
import * as Collection from '../game/collection'
import { todayLocal } from '../game/dates'
import { createDemoData } from '../game/demo-seed'
import { importLegacyState, isLegacyState, LEGACY_KEY } from '../game/legacy-import'
import * as Problems from '../game/problems'
import * as Quests from '../game/quests'
import { buildState, rollDailyState, splitState } from '../game/state'
import * as Summon from '../game/summon'
import type { Ctx, Form, GachaItem, GameState } from '../game/types'
import type { Docs, Persistence } from '../platform/persistence'

let state: GameState
let persistence: Persistence
let version = 0 // bumped on every change, so subscribers re-render
let saveVersion = 0
const subs = new Set<() => void>()
const saveSubs = new Set<() => void>()
const replaceSubs = new Set<() => void>()

const ctx = (): Ctx => ({ today: todayLocal(), now: Date.now(), rng: Math.random })

function notify() {
  version++
  subs.forEach((fn) => fn())
}

function set(next: GameState) {
  state = rollDailyState(next, todayLocal())
  persistence.save(splitState(state))
  notify()
}

// Applies a rule's result; false when the rule refused.
function commit(next: GameState | null): boolean {
  if (!next) return false
  set(next)
  return true
}

// Swap in a whole new state (an imported backup, or data saved from another tab).
function replace(progress: object | null, library: object | null) {
  const { today, now } = ctx()
  state = buildState(progress, library, today, now)
  replaceSubs.forEach((fn) => fn())
}

// A save from the old localStorage-only app, if this browser has one.
function readLegacyState() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null')
    return isLegacyState(legacy) ? legacy : null
  } catch {
    return null
  }
}

export function initStore(p: Persistence) {
  persistence = p
  const { today, now } = ctx()
  let { progress, library }: { progress: object | null; library: object | null } = p.initial
  // first visit to the online demo: sample problems and some Coins
  if (!progress && !library && p.mode === 'browser') ({ progress, library } = createDemoData(today))
  // first launch on this storage: pick up a save from the old app
  const legacy = progress ? null : readLegacyState()
  if (legacy) ({ progress, library } = importLegacyState(legacy, library || {}))
  state = buildState(progress, library, today, now)
  p.save(splitState(state)) // creates the documents on first launch / stores any migration

  p.subscribe(() => {
    saveVersion++
    saveSubs.forEach((fn) => fn())
  })
  // Coming back to this tab: take what another tab or browser saved meanwhile.
  p.onRemoteChange((docs: Partial<Docs>) => {
    const cur = splitState(state)
    replace(docs.progress || cur.progress, docs.library || cur.library)
    p.adopt(splitState(state))
    notify()
  })
}

// where each solved problem's code is written (local app): problemId -> ['arrays/two-sum.py', ...]
let planFor: GameState | null = null
let plan = new Map<string, string[]>()
function solutionPaths(id: string): string[] {
  if (!planFor || planFor.problems !== state.problems || planFor.customTags !== state.customTags) {
    planFor = state
    plan = new Map()
    for (const f of Catalog.solutionPlan(state))
      plan.set(f.problemId, [...(plan.get(f.problemId) || []), f.path])
  }
  return plan.get(id) || []
}

export const store = {
  get: () => state,
  subscribe(fn: () => void) {
    subs.add(fn)
    return () => {
      subs.delete(fn)
    }
  },
  notify,
  // called when the whole state was swapped out (see replace)
  onReplace(fn: () => void) {
    replaceSubs.add(fn)
  },
  // for state/focus.ts: battle rewards computed outside the store
  apply: (next: GameState) => set(next),
  saveStatus: () => persistence.status(),
  onSaveStatus(fn: () => void) {
    saveSubs.add(fn)
  },
  onResume: (fn: () => void) => persistence.onResume(fn),
  // cloud only: deletes the account and its data, then signs out
  deleteAccount: () => persistence.deleteAccount(),

  // ---- collection ----
  addShards: (n: number) => set(Collection.addShards(state, n)),
  spendShards: (n: number) => commit(Collection.spendShards(state, n)),
  completeOnboarding: (choice: Parameters<typeof Collection.completeOnboarding>[1]) =>
    commit(Collection.completeOnboarding(state, choice, ctx())),
  setTrainerName: (name: string) => set(Collection.setTrainerName(state, name)),
  setTrainerAvatar: (dataUrl: string | null) => commit(Collection.setTrainerAvatar(state, dataUrl)),
  setTeam: (team: string[]) => set(Collection.setTeam(state, team)),
  rareCandy: (iid: string) => commit(Collection.rareCandy(state, iid)),
  teamSnack: () => commit(Collection.teamSnack(state)),
  buyStone: (form: Form) => commit(Collection.buyStone(state, form)),
  buyGachaItem: (id: GachaItem) => commit(Collection.buyGachaItem(state, id)),
  shinyCandy: (iid: string) => commit(Collection.shinyCandy(state, iid)),
  useStone: (iid: string, form: Form) => commit(Collection.useStone(state, iid, form)),
  setForm: (iid: string, form: Form | null) => commit(Collection.setForm(state, iid, form)),
  evolveByDuplicates: (iid: string, chosenEvo: string | null = null) =>
    commit(Collection.evolveByDuplicates(state, iid, chosenEvo, ctx())),
  // Returns the Shards paid.
  releaseCreatures(iids: string[]) {
    const r = Collection.releaseCreatures(state, iids)
    if (r) set(r.state)
    return r ? r.shards : 0
  },

  // ---- summon (the Shards are spent by the caller) ----
  setLegendaryTarget: (spId: string | null) => set(Summon.setLegendaryTarget(state, spId)),
  setEpicTarget: (spId: string | null) => set(Summon.setEpicTarget(state, spId)),
  gachaPull(count: number, use: Summon.SummonItems | null) {
    const r = Summon.pull(state, count, use, ctx())
    set(r.state)
    return r.results
  },

  // ---- quests ----
  claimDaily: (questId: string, step: number) =>
    commit(Quests.claimDaily(state, questId, step, ctx())),
  claimAchievements: (ids: string[]) => commit(Chapters.claimAchievements(state, ids, ctx())),
  setRecallBest: (n: number) =>
    set({
      ...state,
      recallBest: Math.max(state.recallBest, n),
      recallToday: true,
      stats: { ...state.stats, recalls: state.stats.recalls + 1 },
    }),

  // ---- problems and tags ----
  tags: () => Problems.tags(state),
  solutionPaths,
  createProblem(fields: Problems.ProblemFields) {
    const r = Problems.createProblem(state, fields, ctx())
    set(r.state)
    return r.id
  },
  updateProblem: (id: string, fields: Problems.ProblemFields) =>
    commit(Problems.updateProblem(state, id, fields, ctx())),
  deleteProblem: (id: string) => set(Problems.deleteProblem(state, id)),
  claimProblem: (id: string) => commit(Problems.claimProblem(state, id, ctx())?.state ?? null),
  // Returns the Shards paid.
  claimAllProblems() {
    const r = Problems.claimAllProblems(state, ctx())
    if (r) set(r.state)
    return r ? r.shards : 0
  },
  setSolveDate: (id: string, date: string) => commit(Problems.setSolveDate(state, id, date)),
  addTag(name: string) {
    const r = Problems.addTag(state, name)
    if (r && r.state !== state) set(r.state)
    return r ? r.id : null
  },
  removeTag: (id: string) => commit(Problems.removeTag(state, id)),

  // ---- backups ----
  exportData: () => exportBackup(state, new Date().toISOString()),
  importData(raw: string) {
    const { progress, library } = parseBackup(raw, splitState(state).library)
    replace(progress, library)
    set(state)
  },
}

export function useStore(): GameState
export function useStore<T>(selector: (s: GameState) => T): T
export function useStore<T>(selector?: (s: GameState) => T) {
  useSyncExternalStore(store.subscribe, () => version)
  return selector ? selector(state) : state
}

export function useSaveStatus() {
  useSyncExternalStore(
    (fn) => {
      saveSubs.add(fn)
      return () => saveSubs.delete(fn)
    },
    () => saveVersion,
  )
  return persistence.status()
}

/* =====================================================================
   Where the study session lives: this browser's localStorage, shared by
   every PokéLeet tab. Each open tab (hidden ones too, since you're on
   LeetCode while it runs) records what the Tracker reports, under a Web
   Lock so tabs don't overwrite each other. Time when no PokéLeet tab was
   running (all closed, computer asleep) never counts.
===================================================================== */
import { isActive, type StudySession } from '../game/study'

const KEY = 'pokeleet:study'
const LOCK = 'pokeleet:study'
const OPEN_LOCK = 'pokeleet:open'

export function load(): StudySession | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    return s && s.v === 1 && typeof s.startedAt === 'number' ? s : null
  } catch {
    return null
  }
}

function store(s: StudySession | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    // storage blocked: the session just won't outlive this page
  }
}

// Read-modify-write: fn gets the saved session (or null) and returns the
// new one (null to clear it; the same object to leave it alone).
export function change(
  fn: (s: StudySession | null) => StudySession | null | Promise<StudySession | null>,
): Promise<StudySession | null> {
  const run = async () => {
    const before = load()
    const after = await fn(before)
    if (after !== before) store(after)
    return after
  }
  return navigator.locks ? navigator.locks.request(LOCK, run) : run()
}

// Another tab changed the session.
export function onChange(fn: () => void) {
  window.addEventListener('storage', (event) => {
    if (event.key === KEY || event.key === null) fn()
  })
}

// Marks this tab as open for as long as it lives. Resolves to whether any
// other PokéLeet tab was already open (so someone was watching meanwhile).
export async function joinTabs(): Promise<boolean> {
  if (!navigator.locks) return true
  let others = true
  try {
    const { held } = await navigator.locks.query()
    others = !!held?.some((lock) => lock.name === OPEN_LOCK)
  } catch {
    // can't tell; assume someone was watching
  }
  navigator.locks.request(OPEN_LOCK, { mode: 'shared' }, () => new Promise(() => {}))
  return others
}

// Called as this tab closes: it was watching until now.
export function leave(now: number) {
  const s = load()
  if (s && isActive(s) && s.seenAt < now) store({ ...s, seenAt: now })
}

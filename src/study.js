/* =====================================================================
   Study sessions — the Meadow's study timer.

   A session starts when you deploy your team. Its timer runs only while
   the PokéLeet Tracker (src/tracker.js) reports that LeetCode is the
   active tab. The session ends after PAUSE_LIMIT paused in a row,
   SESSION_CAP after it started, or when you end it.

   The session lives in this browser's localStorage, shared by every
   PokéLeet tab: each open tab (hidden ones too, since you're on LeetCode
   while it runs) records what the Tracker reports, under a Web Lock so
   tabs don't overwrite each other. Time when no PokéLeet tab was running
   (all closed, computer asleep) never counts.

   Session fields:
     startedAt, target        when you deployed, and where LeetCode opens ({ title, url })
     focusMs                  finished stretches on LeetCode
     runningSince             start of the current stretch (null while paused)
     pausedSince              start of the current pause (null while running)
     watchedFrom              when a tab last started watching after a gap
     seenAt                   last time an open tab brought the session up to date
     endedAt, endReason       'paused' | 'cap' | 'manual'
     settledMs, combat, earned  study time already turned into Meadow battles (store.jsx)
===================================================================== */

export const PAUSE_LIMIT = 5 * 60 * 1000
export const SESSION_CAP = 3 * 60 * 60 * 1000
// Open tabs update seenAt at least once a minute, even when the browser
// throttles them in the background. A longer silence means nothing was
// watching (computer asleep, tab frozen), so that time doesn't count.
const SILENCE_LIMIT = 3 * 60 * 1000
const KEY = 'pokeleet:study'
const LOCK = 'pokeleet:study'
const OPEN_LOCK = 'pokeleet:open'

export function create(target, now, combat) {
  return {
    v: 1,
    id: now.toString(36) + Math.random().toString(36).slice(2, 6),
    startedAt: now,
    target,
    focusMs: 0,
    runningSince: null,
    pausedSince: now,
    watchedFrom: now,
    seenAt: now,
    endedAt: null,
    endReason: null,
    settledMs: 0,
    combat,
    earned: { kills: 0, coins: 0, shards: 0, exp: 0 },
  }
}

export const isActive = (s) => !!s && !s.endedAt
export const isRunning = (s) => isActive(s) && s.runningSince != null
const capAt = (s) => s.startedAt + SESSION_CAP

// Time on LeetCode so far.
export function focusTime(s, now) {
  if (!s) return 0
  if (s.runningSince == null) return s.focusMs
  return s.focusMs + Math.max(0, Math.min(now, capAt(s)) - s.runningSince)
}

// When the session ends if nothing changes: at the cap while running,
// otherwise at the pause limit (or the cap, if that comes first).
export function endsAt(s) {
  if (!isActive(s)) return s ? s.endedAt : null
  return s.runningSince != null ? capAt(s) : Math.min(s.pausedSince + PAUSE_LIMIT, capAt(s))
}

// ---- transitions (mutate a copy made by update/end) ----
function pause(s, at) {
  if (s.runningSince == null) return
  const end = Math.max(s.runningSince, Math.min(at, capAt(s)))
  s.focusMs += end - s.runningSince
  s.runningSince = null
  s.pausedSince = end
}

function finish(s, at, reason) {
  pause(s, at)
  s.endedAt = at
  s.endReason = reason
  s.pausedSince = null
}

// Ends the session if its pause limit or cap came by `at`.
function expire(s, at) {
  const due = endsAt(s)
  if (at < due) return false
  const reason = s.runningSince == null && s.pausedSince + PAUSE_LIMIT <= capAt(s) ? 'paused' : 'cap'
  finish(s, due, reason)
  return true
}

// Brings a session up to date.
//   tracker    { leetcode, since } from the Tracker; null = no usable Tracker
//              (counts as not on LeetCode); undefined = not known yet
//   unwatched  no PokéLeet tab was open between seenAt and now
export function update(session, tracker, now, { unwatched = false } = {}) {
  if (!isActive(session)) return session
  const s = { ...session }
  if (unwatched || now - s.seenAt > SILENCE_LIMIT) {
    if (expire(s, s.seenAt)) return s
    pause(s, s.seenAt)
    s.watchedFrom = now
  }
  if (tracker !== undefined) {
    const since = Math.min(now, tracker && Number.isFinite(tracker.since) ? tracker.since : now)
    if (tracker && tracker.leetcode && s.runningSince == null) {
      // back on LeetCode: unless the session already ran out while paused
      const at = Math.max(since, s.pausedSince, s.watchedFrom)
      if (!expire(s, at)) {
        s.runningSince = at
        s.pausedSince = null
      }
    } else if (!(tracker && tracker.leetcode) && s.runningSince != null) {
      pause(s, Math.max(since, s.watchedFrom))
    }
  }
  if (isActive(s)) expire(s, now)
  s.seenAt = now
  return s
}

export function end(session, tracker, now) {
  if (!isActive(session)) return session
  const s = update(session, tracker, now)
  if (isActive(s)) finish(s, now, 'manual')
  return s
}

// ---- storage (shared by this browser's PokéLeet tabs) ----
export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    return s && s.v === 1 && typeof s.startedAt === 'number' ? s : null
  } catch {
    return null
  }
}

function store(s) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    // storage blocked: the session just won't outlive this page
  }
}

// Read-modify-write: fn gets the saved session (or null) and returns the
// new one (null to clear it; the same object to leave it alone).
export function change(fn) {
  const run = async () => {
    const before = load()
    const after = await fn(before)
    if (after !== before) store(after)
    return after
  }
  return navigator.locks ? navigator.locks.request(LOCK, run) : run()
}

// Another tab changed the session.
export function onChange(fn) {
  window.addEventListener('storage', (event) => {
    if (event.key === KEY || event.key === null) fn()
  })
}

// Marks this tab as open for as long as it lives. Resolves to whether any
// other PokéLeet tab was already open (so someone was watching meanwhile).
export async function joinTabs() {
  if (!navigator.locks) return true
  let others = true
  try {
    const { held } = await navigator.locks.query()
    others = held.some((lock) => lock.name === OPEN_LOCK)
  } catch {
    // can't tell; assume someone was watching
  }
  navigator.locks.request(OPEN_LOCK, { mode: 'shared' }, () => new Promise(() => {}))
  return others
}

// Called as this tab closes: it was watching until now.
export function leave(now) {
  const s = load()
  if (isActive(s) && s.seenAt < now) store({ ...s, seenAt: now })
}

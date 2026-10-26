/* =====================================================================
   Study sessions: the Focus tab's study timer.

   A session starts when you deploy your team. Its timer runs only while
   the PokéLeet Tracker (platform/tracker.ts) reports that LeetCode is the
   active tab. The session ends after PAUSE_LIMIT paused in a row,
   SESSION_CAP after it started, or when you end it. Pure functions; the
   session is stored by platform/study-store.ts.
===================================================================== */
import type { Combat } from './meadow'

export interface StudySession {
  v: 1
  id: string
  startedAt: number // when you deployed
  target: { title: string; url: string } // where LeetCode opens
  focusMs: number // finished stretches on LeetCode
  runningSince: number | null // start of the current stretch (null while paused)
  pausedSince: number | null // start of the current pause (null while running)
  watchedFrom: number // when a tab last started watching after a gap
  seenAt: number // last time an open tab brought the session up to date
  endedAt: number | null
  endReason: 'paused' | 'cap' | 'manual' | null
  // study time already turned into battles (state/focus.ts)
  settledMs: number
  combat: Combat
  earned: { kills: number; coins: number; shards: number; exp: number }
}

// What the Tracker reports: null = no usable Tracker (counts as "not on
// LeetCode"); undefined = not known yet.
export type TrackerReading = { leetcode: boolean; since: number } | null | undefined

export const PAUSE_LIMIT = 5 * 60 * 1000
export const SESSION_CAP = 3 * 60 * 60 * 1000
// Open tabs update seenAt at least once a minute, even when the browser
// throttles them in the background. A longer silence means nothing was
// watching (computer asleep, tab frozen), so that time doesn't count.
const SILENCE_LIMIT = 3 * 60 * 1000

export function create(
  target: StudySession['target'],
  now: number,
  combat: Combat,
  rng: () => number,
): StudySession {
  return {
    v: 1,
    id: now.toString(36) + rng().toString(36).slice(2, 6),
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

type Maybe = StudySession | null | undefined

// active = not ended yet
export const isActive = (s: Maybe): s is StudySession & { endedAt: null } => !!s && !s.endedAt
export const isRunning = (s: Maybe) => isActive(s) && s.runningSince != null
const capAt = (s: StudySession) => s.startedAt + SESSION_CAP

// Time on LeetCode so far.
export function focusTime(s: Maybe, now: number): number {
  if (!s) return 0
  if (s.runningSince == null) return s.focusMs
  return s.focusMs + Math.max(0, Math.min(now, capAt(s)) - s.runningSince)
}

// When the session ends if nothing changes: at the cap while running,
// otherwise at the pause limit (or the cap, if that comes first).
export function endsAt(s: Maybe): number | null {
  if (!isActive(s)) return s ? s.endedAt : null
  return s.runningSince != null ? capAt(s) : Math.min(s.pausedSince! + PAUSE_LIMIT, capAt(s))
}

// ---- transitions (mutate a copy made by update/end) ----
function pause(s: StudySession, at: number) {
  if (s.runningSince == null) return
  const end = Math.max(s.runningSince, Math.min(at, capAt(s)))
  s.focusMs += end - s.runningSince
  s.runningSince = null
  s.pausedSince = end
}

function finish(s: StudySession, at: number, reason: StudySession['endReason']) {
  pause(s, at)
  s.endedAt = at
  s.endReason = reason
  s.pausedSince = null
}

// Ends the session if its pause limit or cap came by `at`.
function expire(s: StudySession, at: number) {
  const due = endsAt(s)!
  if (at < due) return false
  const reason =
    s.runningSince == null && s.pausedSince! + PAUSE_LIMIT <= capAt(s) ? 'paused' : 'cap'
  finish(s, due, reason)
  return true
}

// Brings a session up to date.
//   tracker    { leetcode, since } from the Tracker; null = no usable Tracker
//              (counts as not on LeetCode); undefined = not known yet
//   unwatched  no PokéLeet tab was open between seenAt and now
export function update(
  session: StudySession,
  tracker: TrackerReading,
  now: number,
  { unwatched = false } = {},
): StudySession {
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
      const at = Math.max(since, s.pausedSince!, s.watchedFrom)
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

export function end(session: StudySession, tracker: TrackerReading, now: number): StudySession {
  if (!isActive(session)) return session
  const s = update(session, tracker, now)
  if (isActive(s)) finish(s, now, 'manual')
  return s
}

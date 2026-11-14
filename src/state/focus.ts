/* =====================================================================
   Focus sessions. Every open tab, hidden or not, keeps the shared study
   session (platform/study-store.ts) up to date with the Tracker. Study
   time then turns into battles (game/meadow.ts): live while this tab is
   on screen, or all at once when it comes back into view. Battles run
   only in a visible tab, so two open tabs don't both pay out.
===================================================================== */
import { todayLocal } from '../game/dates'
import { teamList } from '../game/derived'
import { battle, type BattleResult, type Hit, newCombat, payOut, TICK_MS } from '../game/meadow'
import * as Study from '../game/study'
import * as Sessions from '../platform/study-store'
import type { Tracker } from '../platform/tracker'
import { store } from './store'

const STUDY_TARGET = { title: 'LeetCode', url: 'https://leetcode.com/problemset/' } // what Deploy Team opens
const HEARTBEAT_MS = 15000
const BULK_MS = 15000 // settling more study time than this at once is summarized in the log

export interface LogEntry {
  t: string
  k: string
  id: number
}

let tracker: Tracker
let session: Study.StudySession | null = null
let log: LogEntry[] = []
let dmgEvents: Hit[] = []
let engineTimer: ReturnType<typeof setInterval> | null = null
let joined: Promise<unknown> = Promise.resolve()
let settling = false

function pushLog(t: string, k = 'win') {
  log = [{ t, k, id: Math.random() }, ...log].slice(0, 40)
}

function refresh() {
  session = Sessions.load()
  store.notify()
}

// Apply the Tracker's latest report (and the pause limit / cap) to the session.
function sync() {
  return joined
    .then(() => {
      if (!Study.isActive(Sessions.load())) return
      return Sessions.change((s) => s && Study.update(s, tracker.reading(), Date.now()))
    })
    .then(refresh)
}

// Turn study time not yet fought through into battles and rewards.
async function settle() {
  if (settling || !engineTimer) return
  settling = true
  try {
    await joined
    const s = Sessions.load()
    const now = Date.now()
    if (!s) return
    const unfought = Study.focusTime(s, now) > s.settledMs
    if (!unfought && (!Study.isActive(s) || now < Study.endsAt(s)!)) return // nothing to do yet
    let result: BattleResult | null = null
    await Sessions.change((cur) => {
      if (!cur) return cur
      const t = Date.now()
      const next = Study.update(cur, tracker.reading(), t)
      const total = Study.focusTime(next, t)
      if (total <= next.settledMs) return next
      const r = battle(store.get(), next.combat, total - next.settledMs, {
        today: todayLocal(),
        now: t,
        rng: Math.random,
      })
      result = r
      const e = next.earned
      return {
        ...next,
        settledMs: total,
        combat: r.combat,
        earned: {
          kills: e.kills + r.kills,
          coins: e.coins + r.coins,
          shards: e.shards + r.shards,
          exp: e.exp + r.exp,
        },
      }
    })
    if (result) reward(result)
    refresh()
  } finally {
    settling = false
  }
}

function reward(r: BattleResult) {
  store.apply(payOut(store.get(), r))
  if (r.events.length) dmgEvents = [...r.events, ...dmgEvents].slice(0, 48)
  if (r.studied <= BULK_MS) {
    r.log.forEach((l) => pushLog(l.t, l.k))
    return
  }
  // came back after a while: keep the elite and legendary wins, summarize the rest
  r.log
    .filter((l) => l.k === 'win' && (l.tier === 'elite' || l.tier === 'legend'))
    .forEach((l) => pushLog(l.t, l.k))
  const took =
    r.studied < 60000 ? Math.round(r.studied / 1000) + 's' : Math.round(r.studied / 60000) + 'm'
  pushLog(
    `While you studied (${took}): ${r.kills} Pokémon defeated` +
      (r.coins ? '  +' + r.coins + 'c' : '') +
      (r.shards ? '  +' + r.shards + 'sh' : ''),
    'away',
  )
}

function start() {
  if (
    engineTimer ||
    store.saveStatus().state === 'conflict' ||
    document.visibilityState === 'hidden'
  )
    return
  engineTimer = setInterval(settle, TICK_MS)
  settle()
}

function stop() {
  if (engineTimer) clearInterval(engineTimer)
  engineTimer = null
}

export function initFocus(t: Tracker) {
  tracker = t
  session = Sessions.load()
  // Time with no PokéLeet tab open doesn't count: on opening, check whether
  // any other tab was watching in the meantime (and note when this one closes).
  joined = Sessions.joinTabs().then((others) => {
    if (!others) {
      return Sessions.change(
        (s) => s && Study.update(s, undefined, Date.now(), { unwatched: true }),
      )
    }
  })
  window.addEventListener('pagehide', () => Sessions.leave(Date.now()))

  // Another tab took over the data: go quiet. New state swapped in: start over.
  store.onSaveStatus(() => {
    if (store.saveStatus().state === 'conflict') stop()
  })
  store.onReplace(() => {
    stop()
    dmgEvents = []
    start()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop()
  })
  store.onResume(start)

  // Keep the session current in every tab: on each Tracker report, on a
  // heartbeat (also asks the Tracker again, in case a report was missed),
  // and when another tab changes it.
  tracker.subscribe(() => {
    sync().then(settle)
    store.notify()
  })
  setInterval(() => {
    if (Study.isActive(session)) {
      tracker.refresh()
      sync()
    }
  }, HEARTBEAT_MS)
  Sessions.onChange(refresh)
  sync()
}

export const focus = {
  start,
  stop,
  session: () => session,
  log: () => log,
  dmgEvents: () => dmgEvents,
  tracker: () => tracker.status(),
  trackerReady: () => tracker.ready(),

  async deployTeam() {
    if (!tracker.ready() || !teamList(store.get()).length) return
    let created = false
    const s = await Sessions.change((cur) => {
      // one session at a time; an ended one waits until its summary is dismissed
      if (cur && (Study.isActive(cur) || cur.settledMs < cur.focusMs)) return cur
      created = true
      return Study.create(STUDY_TARGET, Date.now(), newCombat(), Math.random)
    })
    if (created) {
      log = []
      dmgEvents = []
    }
    refresh()
    if (s) tracker.openLeetCode(s.target.url)
  },
  async endSession() {
    await Sessions.change((s) => s && Study.end(s, tracker.reading(), Date.now()))
    refresh()
    settle()
  },
  // close the summary of a finished session
  async dismissSession() {
    await Sessions.change((s) => (s && !Study.isActive(s) && s.settledMs >= s.focusMs ? null : s))
    refresh()
  },
  backToLeetCode() {
    if (session) tracker.openLeetCode(session.target.url)
  },
}

/* =====================================================================
   Connection to the PokéLeet Tracker browser extension (extension/).

   A web page can't see which tab is active, so the Focus tab's study timer
   relies on the Tracker: its bridge script on this page answers our
   "hello" with its version, then relays { leetcode, since } whenever
   LeetCode becomes or stops being the active tab.

   status().state:
     checking     waiting for the Tracker to answer
     connected    ready
     outdated     older than this app's copy; update it (download it again, or reload it)
     missing      not installed, switched off, or installed after this page loaded
     gone         reloaded or removed since this page loaded
     unavailable  the online demo, which the Tracker doesn't run on
===================================================================== */

import type { TrackerReading } from '../game/study'

const FROM_APP = 'pokeleet-app'
const FROM_TRACKER = 'pokeleet-tracker'
const HELLO_TIMEOUT = 1500

export type TrackerState =
  'checking' | 'connected' | 'outdated' | 'missing' | 'gone' | 'unavailable'

export interface TrackerStatus {
  state: TrackerState
  version: string | null
  expectedVersion: string
  known: boolean // received at least one report
  leetcode: boolean
  since: number
}

export type Tracker = ReturnType<typeof connectTracker>

// true if version a is older than version b ("1.2.0" < "1.10.0")
function isOlder(a: string, b: string) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x !== y) return x < y
  }
  return false
}

export function connectTracker({
  expectedVersion,
  demo = false,
}: {
  expectedVersion: string
  demo?: boolean
}) {
  const listeners = new Set<() => void>()
  const status: TrackerStatus = {
    state: demo ? 'unavailable' : 'checking',
    version: null,
    expectedVersion,
    known: false,
    leetcode: false,
    since: 0,
  }
  const emit = () => listeners.forEach((fn) => fn())
  const post = (msg: Record<string, unknown>) =>
    window.postMessage({ source: FROM_APP, ...msg }, window.location.origin)

  if (!demo) {
    window.addEventListener('message', (event) => {
      const msg = event.data
      if (event.source !== window || !msg || msg.source !== FROM_TRACKER) return
      if (msg.type === 'hello') {
        status.version = String(msg.version || '')
        status.state = isOlder(status.version, expectedVersion) ? 'outdated' : 'connected'
      } else if (msg.type === 'state') {
        status.known = true
        status.leetcode = !!msg.leetcode
        status.since = Number(msg.since) || Date.now()
      } else if (msg.type === 'gone') {
        status.state = 'gone'
      } else {
        return
      }
      emit()
    })
    post({ type: 'hello' })
    setTimeout(() => {
      if (status.state !== 'checking') return
      status.state = 'missing'
      emit()
    }, HELLO_TIMEOUT)
  }

  return {
    status: () => status,
    ready: () => status.state === 'connected',
    // What the study timer goes by: { leetcode, since }; null when there's
    // no usable Tracker (counts as "not on LeetCode"); undefined while it's
    // still unknown.
    reading(): TrackerReading {
      if (status.state === 'checking') return undefined
      if (status.state !== 'connected') return null
      return status.known ? { leetcode: status.leetcode, since: status.since } : undefined
    },
    // ask again (in case a report was missed); also notices a reloaded Tracker
    refresh() {
      if (status.state === 'connected') post({ type: 'get' })
    },
    // bring an open LeetCode tab to the front, or open the url in a new tab
    openLeetCode(url: string) {
      post({ type: 'open', url })
    },
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

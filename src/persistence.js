/* =====================================================================
   Persistence — keeps the store's state saved somewhere durable.

   Local app (npm start / npm run dev): state is written to disk through
   the storage API (server/plugin.js) as two documents — game progress
   and the problem library. So that nothing gets lost:
   - changes are saved within ~0.25s (library) / ~1.5s (progress), and
     flushed as soon as the tab is hidden or closed;
   - until the server confirms a save, the data is also stashed in this
     browser and restored on the next visit if it never arrived (tab
     closed while the server was stopped, a very large final save...);
   - failed saves are retried until the server is reachable again;
   - when a tab comes back into view it first picks up anything saved
     from another tab or browser, so switching between them is safe.
   Demo build (GitHub Pages): there is no server, so everything lives in
   this browser's localStorage.
===================================================================== */

const DOCS = ['progress', 'library']
const LIBRARY_KEYS = ['problems', 'customTags']
const SAVE_DELAY = { progress: 1500, library: 250 }
const FIRST_RETRY_DELAY = 2000
const MAX_RETRY_DELAY = 15000
const KEEPALIVE_MAX_BYTES = 60000     // browsers cap keepalive request bodies at 64KB
const DEMO_PREFIX = 'pokeleet:demo:'
const STASH_PREFIX = 'pokeleet:unsaved:'
const OFFLINE_MESSAGE = 'Can’t reach the PokéLeet server — is "npm start" still running? ' +
  'Your changes are kept in this browser and will be saved as soon as it’s back.'
const NO_SERVER_MESSAGE = 'Can’t reach PokéLeet’s local server, so there’s nowhere to save your progress. ' +
  'Start the app from the project folder with "npm start" (or "npm run dev") and open the address it prints.'

// The store keeps one flat state object; on disk it is two documents.
export function splitState(state) {
  const progress = {}
  for (const key of Object.keys(state)) {
    if (!LIBRARY_KEYS.includes(key)) progress[key] = state[key]
  }
  return { progress, library: { problems: state.problems, customTags: state.customTags } }
}

function shallowEqual(a, b) {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

// Small non-cryptographic hash (FNV-1a), used to recognise a save we sent.
function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

const local = {
  get(key) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or blocked; the in-memory retry still has the data
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      // nothing to clean up
    }
  },
}

// null = no storage server answering (network error, or a static host
// replying with a web page). Throws if the server is there but can't read
// the data, so a damaged file is reported instead of silently replaced.
async function fetchServerData() {
  let res
  try {
    res = await fetch('/api/data', { cache: 'no-store', headers: { Accept: 'application/json' } })
  } catch {
    return null
  }
  if (!(res.headers.get('content-type') || '').includes('application/json')) return null
  const body = await res.json().catch(() => null)
  if (!body || body.api !== 'pokeleet') return null
  if (!res.ok) throw new Error(body.error || `The storage server answered HTTP ${res.status}.`)
  return body
}

function diskBackend(body) {
  return {
    mode: 'disk',
    location: body.dataDir,
    docs: { progress: body.progress, library: body.library },
    async write(name, json, rev, keepalive) {
      const payload = `{"rev":${rev},"data":${json}}`
      let res
      try {
        res = await fetch(`/api/${name}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: keepalive && new Blob([payload]).size <= KEEPALIVE_MAX_BYTES,
        })
      } catch {
        throw Object.assign(new Error(OFFLINE_MESSAGE), { offline: true })
      }
      const out = await res.json().catch(() => ({}))
      if (res.status === 409) {
        throw Object.assign(new Error(out.error || 'Your data was changed elsewhere.'), { conflict: true })
      }
      if (!res.ok) throw new Error(out.error || `HTTP ${res.status}`)
      return out
    },
  }
}

function browserBackend() {
  const docs = {}
  for (const name of DOCS) {
    const data = local.get(DEMO_PREFIX + name)
    docs[name] = data ? { rev: 0, data } : null
  }
  return {
    mode: 'browser',
    location: 'this browser',
    docs,
    async write(name, json, rev) {
      localStorage.setItem(DEMO_PREFIX + name, json)
      return { rev: rev + 1, savedAt: new Date().toISOString() }
    },
  }
}

// A stash is unsaved data a previous visit left behind. It is ours to
// restore only if the server still holds the version it was based on (or
// exactly the save that was in flight when the tab went away).
function takeStash(name, doc) {
  const stash = local.get(STASH_PREFIX + name)
  if (!stash) return null
  const rev = doc ? doc.rev : 0
  const landed = rev === stash.baseRev + 1 && stash.sentHash && doc &&
    hash(JSON.stringify(doc.data)) === stash.sentHash
  if (rev === stash.baseRev || landed) return stash.data
  local.remove(STASH_PREFIX + name)     // saved since, from this tab or elsewhere
  return null
}

export async function openPersistence({ demo = false } = {}) {
  let backend
  if (demo) {
    backend = browserBackend()
  } else {
    const body = await fetchServerData()
    if (!body) throw new Error(NO_SERVER_MESSAGE)
    backend = diskBackend(body)
  }
  const disk = backend.mode === 'disk'

  const initial = {}
  const restored = []
  for (const name of DOCS) {
    const doc = backend.docs[name]
    initial[name] = doc ? doc.data : null
    const stashed = disk ? takeStash(name, doc) : null
    if (stashed) {
      initial[name] = stashed
      restored.push(name)
    }
  }

  const listeners = new Set()
  const remoteListeners = new Set()
  const resumeListeners = new Set()
  const status = { mode: backend.mode, demo, location: backend.location, state: 'saved', error: null, savedAt: null }
  const savers = {}

  function refresh() {
    const conflict = DOCS.some((name) => savers[name].conflict)
    const error = DOCS.map((name) => savers[name].error).find(Boolean) || null
    status.state = conflict ? 'conflict' : error ? 'error' : 'saved'
    status.error = error
    listeners.forEach((fn) => fn())
  }

  // Coalesces rapid changes into one write, keeps one request in flight at
  // a time, retries failed writes, and stashes anything unconfirmed.
  function createSaver(name) {
    const doc = backend.docs[name]
    const saver = { rev: doc ? doc.rev : 0, error: null, conflict: false }
    const what = name === 'library' ? 'problems' : 'progress'
    let pending = null          // newest data not yet sent
    let inflight = null         // { data, hash } being written
    let unconfirmed = null      // hash of a write whose response never arrived
    let failing = false
    let timer = null
    let dueAt = 0
    let retryDelay = FIRST_RETRY_DELAY

    function arm(delay) {
      if (inflight || saver.conflict || pending === null) return
      const due = Date.now() + delay
      if (timer && dueAt <= due) return
      clearTimeout(timer)
      dueAt = due
      timer = setTimeout(run, delay)
    }

    saver.stash = () => {
      const data = pending || (inflight && inflight.data)
      if (!disk || !data || saver.conflict) return
      local.set(STASH_PREFIX + name, { baseRev: saver.rev, sentHash: inflight ? inflight.hash : unconfirmed, data })
    }

    // After a lost response, a 409 may just mean our own write did land.
    async function wasOurs() {
      if (!unconfirmed) return false
      const body = await fetchServerData().catch(() => null)
      const current = body && body[name]
      if (!current || current.rev !== saver.rev + 1 || hash(JSON.stringify(current.data)) !== unconfirmed) return false
      saver.rev = current.rev
      return true
    }

    async function run(keepalive = false) {
      timer = null
      if (pending === null || inflight || saver.conflict) return
      const json = JSON.stringify(pending)
      inflight = { data: pending, hash: hash(json) }
      pending = null
      let retry = false
      try {
        const out = await backend.write(name, json, saver.rev, keepalive)
        saver.rev = out.rev
        saver.error = out.warning || null
        status.savedAt = out.savedAt || new Date().toISOString()
        unconfirmed = null
        failing = false
        retryDelay = FIRST_RETRY_DELAY
      } catch (err) {
        if (err.conflict && (await wasOurs())) {
          // the earlier write did land; carry on from its revision
          unconfirmed = null
          failing = false
          saver.error = null
          if (pending === null) pending = inflight.data
        } else if (err.conflict) {
          saver.conflict = true
        } else {
          retry = true
          if (err.offline) unconfirmed = inflight.hash
          saver.error = err.offline ? err.message : `Couldn’t save your ${what} (${err.message}). Retrying…`
          if (pending === null) pending = inflight.data
        }
      }
      inflight = null
      if (retry) {
        failing = true
        saver.stash()
        dueAt = Date.now() + retryDelay
        timer = setTimeout(run, retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      } else {
        if (pending === null && disk && !saver.conflict) local.remove(STASH_PREFIX + name)
        arm(SAVE_DELAY[name])
      }
      refresh()
    }

    saver.schedule = (data, delay = SAVE_DELAY[name]) => {
      pending = data
      if (failing) saver.stash()
      arm(delay)
    }
    saver.flush = (keepalive) => {
      clearTimeout(timer)
      timer = null
      run(keepalive)
    }
    saver.retryNow = () => { if (failing && timer) saver.flush(false) }
    saver.busy = () => pending !== null || inflight !== null
    saver.sending = () => inflight !== null
    return saver
  }

  DOCS.forEach((name) => { savers[name] = createSaver(name) })

  let last = null
  function save(state) {
    const next = splitState(state)
    const libraryChanged = !last || next.library.problems !== last.library.problems ||
      next.library.customTags !== last.library.customTags
    if (libraryChanged) savers.library.schedule(next.library)
    if (!last || !shallowEqual(next.progress, last.progress)) {
      // Changes that touch both (e.g. claiming shards for a problem) go out together.
      savers.progress.schedule(next.progress, libraryChanged ? SAVE_DELAY.library : SAVE_DELAY.progress)
    }
    last = next
  }

  // Load what other tabs/browsers saved while this one was in the background.
  let checking = false
  async function checkRemote() {
    if (!disk || checking) return
    checking = true
    try {
      const before = Object.fromEntries(DOCS.map((name) => [name, savers[name].rev]))
      const body = await fetchServerData().catch(() => null)
      if (!body) return
      const changed = {}
      for (const name of DOCS) {
        const saver = savers[name]
        const doc = body[name]
        if (!doc || doc.rev === saver.rev || saver.rev !== before[name] || saver.conflict || saver.sending()) continue
        if (saver.busy()) {
          saver.conflict = true           // unsaved changes here, newer data there
          continue
        }
        saver.rev = doc.rev
        changed[name] = doc.data
      }
      if (Object.keys(changed).length) remoteListeners.forEach((fn) => fn(changed))
      refresh()
    } finally {
      checking = false
    }
  }

  function onHidden() {
    DOCS.forEach((name) => {
      savers[name].flush(true)
      savers[name].stash()
    })
  }
  async function onVisible() {
    await checkRemote()
    DOCS.forEach((name) => savers[name].retryNow())
    resumeListeners.forEach((fn) => fn())
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHidden()
    else onVisible()
  })
  window.addEventListener('pagehide', onHidden)
  window.addEventListener('pageshow', (event) => { if (event.persisted) onVisible() })
  window.addEventListener('online', () => DOCS.forEach((name) => savers[name].retryNow()))
  window.addEventListener('beforeunload', (event) => {
    if (savers.library.conflict || !savers.library.busy()) return
    onHidden()
    event.preventDefault()
    event.returnValue = ''
  })

  return {
    mode: backend.mode,
    demo,
    location: backend.location,
    initial,
    restored,
    save,
    splitState,
    // the store adopted state that is already saved (e.g. from another tab)
    adopt(state) { last = splitState(state) },
    status: () => status,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    onRemoteChange(fn) {
      remoteListeners.add(fn)
      return () => remoteListeners.delete(fn)
    },
    onResume(fn) {
      resumeListeners.add(fn)
      return () => resumeListeners.delete(fn)
    },
  }
}

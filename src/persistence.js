/* =====================================================================
   Persistence — keeps the store's state saved somewhere durable.

   When the dev/preview server is running, state is written to disk
   through the storage API (server/plugin.js): game progress and the
   problem library are saved as two documents. If no storage server
   answers (e.g. a static deploy), it falls back to localStorage.
===================================================================== */

const DOCS = ['progress', 'library']
const LIBRARY_KEYS = ['problems', 'customTags']
const SAVE_DELAY = { progress: 1500, library: 250 }
const FIRST_RETRY_DELAY = 2000
const MAX_RETRY_DELAY = 30000
const KEEPALIVE_MAX_CHARS = 30000     // browsers cap keepalive bodies at 64KB
const LOCAL_PREFIX = 'pokeleet:v6:'

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

// null = no storage server here (network error, or a static host answering
// with index.html). Throws if the server is there but can't read the data,
// so a damaged file is reported instead of silently replaced.
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
    initial: {
      progress: body.progress ? body.progress.data : null,
      library: body.library ? body.library.data : null,
    },
    revs: {
      progress: body.progress ? body.progress.rev : 0,
      library: body.library ? body.library.rev : 0,
    },
    async write(name, data, rev, keepalive) {
      const payload = JSON.stringify({ rev, data })
      const res = await fetch(`/api/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: keepalive && payload.length < KEEPALIVE_MAX_CHARS,
      })
      const out = await res.json().catch(() => ({}))
      if (res.status === 409) {
        throw Object.assign(new Error(out.error || 'Your data was changed elsewhere.'), { conflict: true })
      }
      if (!res.ok) throw new Error(out.error || `Save failed (HTTP ${res.status}).`)
      return out
    },
  }
}

function readLocal(name) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + name)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function browserBackend() {
  return {
    mode: 'browser',
    location: 'this browser’s localStorage',
    initial: { progress: readLocal('progress'), library: readLocal('library') },
    revs: { progress: 0, library: 0 },
    async write(name, data, rev) {
      localStorage.setItem(LOCAL_PREFIX + name, JSON.stringify(data))
      return { rev: rev + 1, savedAt: new Date().toISOString() }
    },
  }
}

export async function openPersistence() {
  const body = await fetchServerData()
  const backend = body ? diskBackend(body) : browserBackend()
  const listeners = new Set()
  const status = { mode: backend.mode, location: backend.location, state: 'saved', error: null, savedAt: null }
  const savers = {}

  function refresh() {
    const conflict = DOCS.some((name) => savers[name].conflict)
    const error = DOCS.map((name) => savers[name].error).find(Boolean) || null
    status.state = conflict ? 'conflict' : error ? 'error' : 'saved'
    status.error = error
    listeners.forEach((fn) => fn())
  }

  // Coalesces rapid changes into one write, keeps one request in flight at
  // a time, and retries with backoff when a write fails.
  function createSaver(name) {
    const saver = { rev: backend.revs[name], error: null, conflict: false }
    let pending = null
    let timer = null
    let dueAt = 0
    let inflight = false
    let retryDelay = FIRST_RETRY_DELAY

    // Start the timer, or pull an already-running one forward.
    function arm(delay) {
      if (inflight || saver.conflict || pending === null) return
      const due = Date.now() + delay
      if (timer && dueAt <= due) return
      clearTimeout(timer)
      dueAt = due
      timer = setTimeout(run, delay)
    }

    async function run(keepalive = false) {
      timer = null
      if (pending === null || inflight || saver.conflict) return
      const data = pending
      pending = null
      inflight = true
      let failed = false
      try {
        const out = await backend.write(name, data, saver.rev, keepalive)
        saver.rev = out.rev
        saver.error = out.warning || null
        status.savedAt = out.savedAt || new Date().toISOString()
        retryDelay = FIRST_RETRY_DELAY
      } catch (err) {
        if (err.conflict) {
          saver.conflict = true
        } else {
          failed = true
          const what = name === 'library' ? 'problems' : 'progress'
          saver.error = `Couldn’t save your ${what} (${(err && err.message) || err}). Retrying…`
          if (pending === null) pending = data
        }
      } finally {
        inflight = false
      }
      if (failed) {
        timer = setTimeout(run, retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      } else {
        arm(SAVE_DELAY[name])
      }
      refresh()
    }

    saver.schedule = (data, delay = SAVE_DELAY[name]) => {
      pending = data
      arm(delay)
    }
    saver.flush = (keepalive) => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      run(keepalive)
    }
    saver.busy = () => pending !== null || inflight
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

  // Write immediately when the tab is hidden or closed.
  const flushAll = () => DOCS.forEach((name) => savers[name].flush(true))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll()
  })
  window.addEventListener('pagehide', flushAll)
  window.addEventListener('beforeunload', (event) => {
    if (savers.library.conflict || !savers.library.busy()) return
    savers.library.flush(true)
    event.preventDefault()
    event.returnValue = ''
  })

  return {
    mode: backend.mode,
    location: backend.location,
    initial: backend.initial,
    save,
    splitState,
    status: () => status,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

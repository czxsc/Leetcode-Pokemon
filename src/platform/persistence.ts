/* =====================================================================
   Persistence — keeps the two saved documents (game progress and the
   problem library) somewhere durable.

   With a server (the local app, or the cloud app signed in) they are
   written through the storage API (api/src/app.ts). So that nothing
   gets lost:
   - changes are saved within ~0.25s (library) / ~1.5s (progress), and
     flushed as soon as the tab is hidden or closed;
   - until the server confirms a save, the data is also stashed in this
     browser and restored on the next visit if it never arrived (tab
     closed while the server was stopped, a very large final save...);
   - failed saves are retried until the server is reachable again;
   - when a tab comes back into view it first picks up anything saved
     from another tab or browser, so switching between them is safe.
   The demo build (GitHub Pages) has no server, so everything lives in
   this browser's localStorage.
===================================================================== */

import type { LeetCodeProblem } from '../../api/src/leetcode'

export type DocName = 'progress' | 'library'
export type Docs = Record<DocName, object>
export interface SavedDoc {
  rev: number
  savedAt?: string | null
  data: object
}
export type Mode = 'local' | 'cloud' | 'browser'

export interface SaveStatus {
  mode: Mode
  location: string
  state: 'saved' | 'error' | 'conflict'
  error: string | null
  savedAt: string | null
}

interface WriteResult {
  rev: number
  savedAt?: string
  warning?: string | null
}

interface Backend {
  mode: Mode
  location: string
  docs: Record<DocName, SavedDoc | null>
  write(name: DocName, json: string, rev: number, keepalive: boolean): Promise<WriteResult>
}

type SaveError = Error & { offline?: boolean; conflict?: boolean; unauthorized?: boolean }

const DOCS: DocName[] = ['progress', 'library']
const SAVE_DELAY: Record<DocName, number> = { progress: 1500, library: 250 }
const FIRST_RETRY_DELAY = 2000
const MAX_RETRY_DELAY = 15000
const KEEPALIVE_MAX_BYTES = 60000 // browsers cap keepalive request bodies at 64KB
const WAKE_RETRY_MS = 3000 // the cloud database answers 503 while it resumes from a pause
const WAKE_TIMEOUT_MS = 90000
const DEMO_PREFIX = 'pokeleet:demo:'
const STASH_PREFIX = 'pokeleet:unsaved:'
const OFFLINE_MESSAGE =
  'Can’t reach the PokéLeet server. Your changes are kept in this browser and will be saved as soon as it’s back.'
const NO_SERVER_MESSAGE =
  'Can’t reach PokéLeet’s local server, so there’s nowhere to save your progress. ' +
  'Start the app from the project folder with "npm start" (or "npm run dev") and open the address it prints.'
const SESSION_MESSAGE = 'Your sign-in expired. Signing you in again…'

function shallowEqual(a: object, b: object) {
  const keys = Object.keys(a) as (keyof typeof a)[]
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

// JSON with object keys sorted, so the same data always hashes the same.
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  )
}

// Small non-cryptographic hash (FNV-1a), used to recognise a save we sent.
function hash(data: unknown): string {
  const text = canonicalJson(data)
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

const local = {
  get(key: string) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or blocked; the in-memory retry still has the data
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      // nothing to clean up
    }
  },
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface ServerAuth {
  id: string // the account's user id, which keeps each account's unsaved changes apart
  // the current access token (kept fresh by the sign-in module)
  token(): string | null
  // the server said the token is no longer valid: sign in again
  renew(): void
  signOut(): void
}

interface ServerData {
  mode: 'local' | 'cloud'
  location: string
  progress: SavedDoc | null
  library: SavedDoc | null
}

function serverBackend(auth: ServerAuth | null) {
  const headers = (extra: Record<string, string> = {}): Record<string, string> => {
    const token = auth?.token()
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
  }

  // null = no storage server answering (network error, or a static host
  // replying with a web page). Throws if the server is there but can't read
  // the data, so a damaged file is reported instead of silently replaced.
  async function fetchData(): Promise<ServerData | null> {
    const started = Date.now()
    for (;;) {
      let res
      try {
        res = await fetch('/api/data', {
          cache: 'no-store',
          headers: headers({ Accept: 'application/json' }),
        })
      } catch {
        return null
      }
      if (!(res.headers.get('content-type') || '').includes('application/json')) return null
      const body = await res.json().catch(() => null)
      if (!body || body.api !== 'pokeleet') return null
      if (res.status === 401 && auth) {
        auth.renew()
        throw new Error(SESSION_MESSAGE)
      }
      if (res.status === 503 && Date.now() - started < WAKE_TIMEOUT_MS) {
        await sleep(WAKE_RETRY_MS) // the database is waking up
        continue
      }
      if (!res.ok) throw new Error(body.error || `The storage server answered HTTP ${res.status}.`)
      return body
    }
  }

  async function write(name: DocName, json: string, rev: number, keepalive: boolean) {
    const payload = `{"rev":${rev},"data":${json}}`
    let res
    try {
      res = await fetch(`/api/${name}`, {
        method: 'PUT',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: payload,
        keepalive: keepalive && new Blob([payload]).size <= KEEPALIVE_MAX_BYTES,
      })
    } catch {
      throw Object.assign(new Error(OFFLINE_MESSAGE), { offline: true })
    }
    const out = await res.json().catch(() => ({}))
    if (res.status === 409) {
      throw Object.assign(new Error(out.error || 'Your data was changed elsewhere.'), {
        conflict: true,
      })
    }
    if (res.status === 401) throw Object.assign(new Error(SESSION_MESSAGE), { unauthorized: true })
    if (!res.ok) throw new Error(out.error || `HTTP ${res.status}`)
    return out as WriteResult
  }

  async function deleteAccount() {
    const started = Date.now()
    for (;;) {
      let res
      try {
        res = await fetch('/api/account', { method: 'DELETE', headers: headers() })
      } catch {
        throw new Error('Can’t reach the PokéLeet server. Check your connection and try again.')
      }
      if (res.status === 503 && Date.now() - started < WAKE_TIMEOUT_MS) {
        await sleep(WAKE_RETRY_MS) // the database is waking up
        continue
      }
      const out = await res.json().catch(() => ({}))
      if (res.status === 401) {
        auth?.renew()
        throw new Error(SESSION_MESSAGE)
      }
      if (!res.ok) throw new Error(out.error || `HTTP ${res.status}`)
      return
    }
  }

  // LeetCode doesn't answer other web pages, so the server asks it for us.
  async function lookupProblem(slug: string) {
    let res
    try {
      res = await fetch('/api/leetcode?slug=' + encodeURIComponent(slug), {
        headers: headers({ Accept: 'application/json' }),
      })
    } catch {
      throw new Error('Can’t reach the PokéLeet server. Check your connection and try again.')
    }
    const out = await res.json().catch(() => ({}))
    if (res.status === 401) {
      auth?.renew()
      throw new Error(SESSION_MESSAGE)
    }
    if (!res.ok || !out.problem) throw new Error(out.error || `Lookup failed (HTTP ${res.status}).`)
    return out.problem as LeetCodeProblem
  }

  return { fetchData, write, deleteAccount, lookupProblem }
}

function browserBackend(): Backend {
  const docs = {} as Backend['docs']
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
function takeStash(key: string, doc: SavedDoc | null): object | null {
  const stash = local.get(key)
  if (!stash) return null
  const rev = doc ? doc.rev : 0
  const landed =
    rev === stash.baseRev + 1 && stash.sentHash && doc && hash(doc.data) === stash.sentHash
  if (rev === stash.baseRev || landed) return stash.data
  local.remove(key) // saved since, from this tab or elsewhere
  return null
}

export type Persistence = Awaited<ReturnType<typeof openPersistence>>

export async function openPersistence({
  demo = false,
  auth = null,
}: { demo?: boolean; auth?: ServerAuth | null } = {}) {
  const server = demo ? null : serverBackend(auth)
  let backend: Backend
  if (server) {
    const body = await server.fetchData()
    if (!body) throw new Error(NO_SERVER_MESSAGE)
    backend = {
      mode: body.mode,
      location: body.location,
      docs: { progress: body.progress, library: body.library },
      write: server.write,
    }
  } else {
    backend = browserBackend()
  }
  const remote = !!server
  // where unsaved changes wait in this browser, per account
  const stashKey = (name: DocName) => STASH_PREFIX + (auth ? `${auth.id}:` : '') + name
  let closed = false // the account is being deleted: save nothing more

  const initial = {} as Record<DocName, object | null>
  const restored: DocName[] = []
  for (const name of DOCS) {
    const doc = backend.docs[name]
    initial[name] = doc ? doc.data : null
    const stashed = remote ? takeStash(stashKey(name), doc) : null
    if (stashed) {
      initial[name] = stashed
      restored.push(name)
    }
  }

  const listeners = new Set<() => void>()
  const remoteListeners = new Set<(docs: Partial<Docs>) => void>()
  const resumeListeners = new Set<() => void>()
  const status: SaveStatus = {
    mode: backend.mode,
    location: backend.location,
    state: 'saved',
    error: null,
    savedAt: null,
  }
  const savers = {} as Record<DocName, ReturnType<typeof createSaver>>

  function refresh() {
    const conflict = DOCS.some((name) => savers[name].conflict)
    const error = DOCS.map((name) => savers[name].error).find(Boolean) || null
    status.state = conflict ? 'conflict' : error ? 'error' : 'saved'
    status.error = error
    listeners.forEach((fn) => fn())
  }

  // Coalesces rapid changes into one write, keeps one request in flight at
  // a time, retries failed writes, and stashes anything unconfirmed.
  function createSaver(name: DocName) {
    const doc = backend.docs[name]
    const what = name === 'library' ? 'problems' : 'progress'
    let pending: object | null = null // newest data not yet sent
    let inflight: { data: object; hash: string } | null = null // being written
    let unconfirmed: string | null = null // hash of a write whose response never arrived
    let failing = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let dueAt = 0
    let retryDelay = FIRST_RETRY_DELAY

    const saver = {
      rev: doc ? doc.rev : 0,
      error: null as string | null,
      conflict: false,
      stash() {
        const data = pending || inflight?.data
        if (!remote || !data || saver.conflict || closed) return
        local.set(stashKey(name), {
          baseRev: saver.rev,
          sentHash: inflight ? inflight.hash : unconfirmed,
          data,
        })
      },
      schedule(data: object, delay = SAVE_DELAY[name]) {
        pending = data
        if (failing) saver.stash()
        arm(delay)
      },
      flush(keepalive: boolean) {
        if (timer) clearTimeout(timer)
        timer = null
        run(keepalive)
      },
      retryNow() {
        if (failing && timer) saver.flush(false)
      },
      busy: () => pending !== null || inflight !== null,
      sending: () => inflight !== null,
    }

    function arm(delay: number) {
      if (inflight || saver.conflict || pending === null) return
      const due = Date.now() + delay
      if (timer && dueAt <= due) return
      if (timer) clearTimeout(timer)
      dueAt = due
      timer = setTimeout(run, delay)
    }

    // After a lost response, a 409 may just mean our own write did land.
    async function wasOurs() {
      if (!unconfirmed || !server) return false
      const body = await server.fetchData().catch(() => null)
      const current = body && body[name]
      if (!current || current.rev !== saver.rev + 1 || hash(current.data) !== unconfirmed)
        return false
      saver.rev = current.rev
      return true
    }

    async function run(keepalive = false) {
      timer = null
      if (pending === null || inflight || saver.conflict || closed) return
      const data = pending
      const sent = { data, hash: hash(data) }
      inflight = sent
      pending = null
      let retry = false
      try {
        const out = await backend.write(name, JSON.stringify(data), saver.rev, keepalive)
        saver.rev = out.rev
        saver.error = out.warning || null
        status.savedAt = out.savedAt || new Date().toISOString()
        unconfirmed = null
        failing = false
        retryDelay = FIRST_RETRY_DELAY
      } catch (e) {
        const err = e as SaveError
        if (err.conflict && (await wasOurs())) {
          // the earlier write did land; carry on from its revision
          unconfirmed = null
          failing = false
          saver.error = null
          if (pending === null) pending = sent.data
        } else if (err.conflict) {
          saver.conflict = true
        } else {
          retry = true
          if (err.offline) unconfirmed = sent.hash
          saver.error =
            err.offline || err.unauthorized
              ? err.message
              : `Couldn’t save your ${what} (${err.message}). Retrying…`
          if (pending === null) pending = sent.data
          if (err.unauthorized) {
            saver.stash()
            auth?.renew()
          }
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
        if (pending === null && remote && !saver.conflict) local.remove(stashKey(name))
        arm(SAVE_DELAY[name])
      }
      refresh()
    }

    return saver
  }

  DOCS.forEach((name) => {
    savers[name] = createSaver(name)
  })

  let last: { progress: object; library: { problems?: unknown; customTags?: unknown } } | null =
    null
  function save(next: { progress: object; library: { problems: unknown; customTags: unknown } }) {
    const libraryChanged =
      !last ||
      next.library.problems !== last.library.problems ||
      next.library.customTags !== last.library.customTags
    if (libraryChanged) savers.library.schedule(next.library)
    if (!last || !shallowEqual(next.progress, last.progress)) {
      // Changes that touch both (e.g. claiming shards for a problem) go out together.
      savers.progress.schedule(
        next.progress,
        libraryChanged ? SAVE_DELAY.library : SAVE_DELAY.progress,
      )
    }
    last = next
  }

  // Load what other tabs/browsers saved while this one was in the background.
  let checking = false
  async function checkRemote() {
    if (!server || checking) return
    checking = true
    try {
      const before = Object.fromEntries(DOCS.map((name) => [name, savers[name].rev]))
      const body = await server.fetchData().catch(() => null)
      if (!body) return
      const changed: Partial<Docs> = {}
      for (const name of DOCS) {
        const saver = savers[name]
        const doc = body[name]
        if (
          !doc ||
          doc.rev === saver.rev ||
          saver.rev !== before[name] ||
          saver.conflict ||
          saver.sending()
        )
          continue
        if (saver.busy()) {
          saver.conflict = true // unsaved changes here, newer data there
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
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) onVisible()
  })
  window.addEventListener('online', () => DOCS.forEach((name) => savers[name].retryNow()))
  window.addEventListener('beforeunload', (event) => {
    if (closed || savers.library.conflict || !savers.library.busy()) return
    onHidden()
    event.preventDefault()
    event.returnValue = '' // older browsers only ask when this is set
  })

  return {
    mode: backend.mode,
    initial,
    restored,
    save,
    // the store adopted documents that are already saved (e.g. from another tab)
    adopt(docs: NonNullable<typeof last>) {
      last = docs
    },
    status: () => status,
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    onRemoteChange(fn: (docs: Partial<Docs>) => void) {
      remoteListeners.add(fn)
      return () => remoteListeners.delete(fn)
    },
    onResume(fn: () => void) {
      resumeListeners.add(fn)
      return () => resumeListeners.delete(fn)
    },
    // A problem's details from LeetCode (title, difficulty, tags), given its slug.
    async lookupProblem(slug: string) {
      if (!server) throw new Error('Looking problems up needs the PokéLeet server.')
      return server.lookupProblem(slug)
    },
    // Cloud only: deletes the account and everything saved for it, then signs out.
    async deleteAccount() {
      if (!server || !auth) throw new Error('There’s no account to delete here.')
      closed = true // no more saves, or copies of unsaved changes: the account is going
      try {
        await server.deleteAccount()
      } catch (err) {
        closed = false
        DOCS.forEach((name) => savers[name].flush(false))
        throw err
      }
      DOCS.forEach((name) => local.remove(stashKey(name)))
      auth.signOut()
    },
  }
}

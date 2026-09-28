/* =====================================================================
   Disk storage for PokéLeet. Everything lives in one data directory
   (data/ by default, or POKELEET_DATA_DIR):

     progress.json          game state — currencies, collection, team…
     library.json           your problems (with code) and custom tags
     solutions/<tag>/…      generated copy of each solved problem's code
     backups/<date>/…       daily snapshot of the two JSON files

   Each JSON file carries a revision number. A save must name the
   revision it was based on, so a stale browser tab can't overwrite
   newer progress from another tab.
===================================================================== */
import fs from 'node:fs/promises'
import path from 'node:path'
import { solutionPlan, tagList } from '../shared/catalog.js'

const DOCS = ['progress', 'library']
const BACKUP_DAYS = 7

function httpError(status, message, extra) {
  return Object.assign(new Error(message), { status }, extra)
}

async function readText(file) {
  try {
    return await fs.readFile(file, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

async function writeFileAtomic(file, text) {
  const tmp = `${file}.${process.pid}.tmp`
  await fs.writeFile(tmp, text, 'utf8')
  try {
    await fs.rename(tmp, file)
  } catch (err) {
    // Windows refuses to replace a file another program has open
    // (editors, antivirus); fall back to writing it in place.
    if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err
    await fs.writeFile(file, text, 'utf8')
    await fs.rm(tmp, { force: true })
  }
}

function localDate() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function validate(name, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw httpError(400, `${name} must be a JSON object`)
  }
  if (name === 'library') {
    if (!Array.isArray(data.problems)) throw httpError(400, 'library.problems must be an array')
    if (data.customTags !== undefined && !Array.isArray(data.customTags)) {
      throw httpError(400, 'library.customTags must be an array')
    }
    for (const p of data.problems) {
      if (!p || typeof p.id !== 'string' || typeof p.title !== 'string') {
        throw httpError(400, 'every problem needs a string id and title')
      }
    }
  }
}

export function createStorage(dataDir) {
  const solutionsDir = path.join(dataDir, 'solutions')
  const backupsDir = path.join(dataDir, 'backups')
  const docs = {}            // name -> { rev, savedAt, data } | null
  let written = new Map()    // solution files this server manages: path -> content
  let snapshotDay = null
  let ready = null
  let queue = Promise.resolve()

  const docFile = (name) => path.join(dataDir, `${name}.json`)
  const solutionFile = (rel) => path.join(solutionsDir, ...rel.split('/'))

  // Run one read-modify-write at a time.
  function exclusive(task) {
    const run = queue.then(task, task)
    queue = run.catch(() => {})
    return run
  }

  async function readDoc(name) {
    const raw = await readText(docFile(name))
    if (raw === null) return null
    try {
      const doc = JSON.parse(raw)
      if (!doc || typeof doc.data !== 'object' || doc.data === null) throw new Error('missing "data" object')
      return { rev: Number(doc.rev) || 0, savedAt: doc.savedAt || null, data: doc.data }
    } catch (err) {
      throw new Error(`${docFile(name)} is not valid PokéLeet data (${err.message}). ` +
        'Fix or move that file (daily copies are in the backups folder), then reload.', { cause: err })
    }
  }

  // Copy the JSON files as they were before the first write of each day.
  async function snapshot() {
    const today = localDate()
    if (snapshotDay === today) return
    const dir = path.join(backupsDir, today)
    const marker = path.join(dir, '.complete')
    if ((await readText(marker)) === null) {
      const files = []
      for (const name of DOCS) {
        const raw = await readText(docFile(name))
        if (raw !== null) files.push([name, raw])
      }
      if (!files.length) return
      await fs.mkdir(dir, { recursive: true })
      for (const [name, raw] of files) await fs.writeFile(path.join(dir, `${name}.json`), raw, 'utf8')
      await fs.writeFile(marker, '', 'utf8')
    }
    snapshotDay = today

    const days = (await fs.readdir(backupsDir, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
      .map((d) => d.name)
      .sort()
    for (const day of days.slice(0, -BACKUP_DAYS)) {
      await fs.rm(path.join(backupsDir, day), { recursive: true, force: true })
    }
  }

  // Bring data/solutions in line with the library. Only files this server
  // wrote are ever deleted; anything else in those folders is left alone.
  async function syncSolutions(library, { verify = false } = {}) {
    const next = new Map(solutionPlan(library).map((f) => [f.path, f.content]))
    const folders = new Set(tagList(library.customTags).map((tag) => tag.id))
    for (const rel of next.keys()) folders.add(rel.split('/')[0])
    for (const folder of folders) await fs.mkdir(path.join(solutionsDir, folder), { recursive: true })

    for (const [rel, content] of next) {
      const file = solutionFile(rel)
      if (!verify && written.get(rel) === content) continue
      if (verify && (await readText(file)) === content) continue
      await fs.writeFile(file, content, 'utf8')
    }
    for (const rel of written.keys()) {
      if (!next.has(rel)) await fs.rm(solutionFile(rel), { force: true })
    }
    // Drop folders of deleted tags once they're empty.
    for (const entry of await fs.readdir(solutionsDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !folders.has(entry.name)) {
        await fs.rmdir(path.join(solutionsDir, entry.name)).catch(() => {})
      }
    }
    written = next
  }

  async function init() {
    await fs.mkdir(solutionsDir, { recursive: true })
    for (const name of DOCS) docs[name] = await readDoc(name)
    await snapshot()
    const library = docs.library ? docs.library.data : { problems: [], customTags: [] }
    await syncSolutions(library, { verify: true })
  }

  // Retried on the next request if it fails (e.g. after fixing a bad file).
  function ensureReady() {
    if (!ready) ready = init().catch((err) => { ready = null; throw err })
    return ready
  }

  return {
    dataDir,
    solutionsDir,

    async load() {
      await ensureReady()
      return { progress: docs.progress, library: docs.library }
    },

    save(name, data, baseRev) {
      return exclusive(async () => {
        await ensureReady()
        if (!DOCS.includes(name)) throw httpError(404, `Unknown document "${name}"`)
        validate(name, data)
        const currentRev = docs[name] ? docs[name].rev : 0
        if (baseRev !== currentRev) {
          throw httpError(409, 'Your data was changed from another tab or window.', { rev: currentRev })
        }
        await snapshot()
        const doc = { rev: currentRev + 1, savedAt: new Date().toISOString(), data }
        await writeFileAtomic(docFile(name), JSON.stringify(doc, null, 2) + '\n')
        docs[name] = doc

        let warning = null
        if (name === 'library') {
          // The library itself is saved at this point; a failure here only
          // affects the generated copies and is retried on the next save.
          try {
            await syncSolutions(data)
          } catch (err) {
            warning = `Saved, but could not update the solutions folder: ${err.message}`
          }
        }
        return { rev: doc.rev, savedAt: doc.savedAt, warning }
      })
    },
  }
}

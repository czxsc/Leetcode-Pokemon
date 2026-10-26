/* =====================================================================
   A document kept as a JSON file on disk (the local app):
     { "rev": 12, "savedAt": "...", "data": { ... } }
   It belongs to the one local user. Before the first write of each day
   the file is copied to backups/<date>/; the last BACKUP_DAYS days are
   kept.
===================================================================== */
import fs from 'node:fs/promises'
import path from 'node:path'
import { ConflictError, type DocumentStore, HttpError, type StoredDoc } from '../documents.ts'

const BACKUP_DAYS = 7

export async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

export async function writeFileAtomic(file: string, text: string) {
  const tmp = `${file}.${process.pid}.tmp`
  await fs.writeFile(tmp, text, 'utf8')
  try {
    await fs.rename(tmp, file)
  } catch (err) {
    // Windows refuses to replace a file another program has open
    // (editors, antivirus); fall back to writing it in place.
    if (!['EPERM', 'EACCES', 'EBUSY'].includes((err as NodeJS.ErrnoException).code || '')) throw err
    await fs.writeFile(file, text, 'utf8')
    await fs.rm(tmp, { force: true })
  }
}

function localDate() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function createFileStore<T>({
  file,
  owner,
  backupsDir,
}: {
  file: string
  owner: string // the only user this store serves
  backupsDir?: string
}): DocumentStore<T> {
  let doc: StoredDoc<T> | null | undefined // undefined = not read yet
  let backedUpOn: string | null = null
  let queue: Promise<unknown> = Promise.resolve()

  // Run one read-modify-write at a time.
  function exclusive<R>(task: () => Promise<R>): Promise<R> {
    const run = queue.then(task, task)
    queue = run.catch(() => {})
    return run
  }

  function checkOwner(userId: string) {
    if (userId !== owner) throw new HttpError(403, 'This data folder belongs to another user.')
  }

  async function read(): Promise<StoredDoc<T> | null> {
    if (doc !== undefined) return doc
    const raw = await readText(file)
    if (raw === null) return (doc = null)
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed.data !== 'object' || parsed.data === null) {
        throw new Error('missing "data" object')
      }
      return (doc = {
        rev: Number(parsed.rev) || 0,
        savedAt: parsed.savedAt || null,
        data: parsed.data,
      })
    } catch (err) {
      throw new HttpError(
        500,
        `${file} is not valid PokéLeet data (${(err as Error).message}). ` +
          'Fix or move that file (daily copies are in the backups folder), then reload.',
        { cause: err },
      )
    }
  }

  // Copy the file as it was before the first write of the day, and drop old copies.
  async function backup() {
    const today = localDate()
    if (!backupsDir || backedUpOn === today) return
    const raw = await readText(file)
    if (raw !== null) {
      const target = path.join(backupsDir, today, path.basename(file))
      if ((await readText(target)) === null) {
        await fs.mkdir(path.dirname(target), { recursive: true })
        await writeFileAtomic(target, raw)
      }
    }
    backedUpOn = today
    const days = (await fs.readdir(backupsDir, { withFileTypes: true }).catch(() => []))
      .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
      .map((d) => d.name)
      .sort()
    for (const day of days.slice(0, -BACKUP_DAYS)) {
      await fs.rm(path.join(backupsDir, day), { recursive: true, force: true })
    }
  }

  return {
    async load(userId) {
      checkOwner(userId)
      return read()
    },
    save(userId, data, baseRev) {
      checkOwner(userId)
      return exclusive(async () => {
        const current = (await read())?.rev ?? 0
        if (baseRev !== current) throw new ConflictError(current)
        await backup()
        const next = { rev: current + 1, savedAt: new Date().toISOString(), data }
        await fs.mkdir(path.dirname(file), { recursive: true })
        await writeFileAtomic(file, JSON.stringify(next, null, 2) + '\n')
        doc = next
        return { rev: next.rev, savedAt: next.savedAt }
      })
    },
  }
}

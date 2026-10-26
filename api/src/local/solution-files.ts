/* =====================================================================
   The local app also writes each solved problem's code to
   data/solutions/<tag>/<problem>.<ext>, so your solutions are plain
   files you can browse or commit. This wraps the library store and
   brings that folder in line after every save. Only files this server
   wrote are ever deleted; anything else in those folders is left alone.
===================================================================== */
import fs from 'node:fs/promises'
import path from 'node:path'
import { solutionPlan, tagList } from '../../../shared/catalog.ts'
import type { Library } from '../../../shared/library.ts'
import type { DocumentStore } from '../documents.ts'
import { readText } from '../stores/file-store.ts'

export function withSolutionFiles(
  store: DocumentStore<Library>,
  dir: string,
): DocumentStore<Library> {
  let written = new Map<string, string>() // files this server manages: path -> content
  let verified = false
  const fileFor = (rel: string) => path.join(dir, ...rel.split('/'))

  async function sync(library: Library) {
    const next = new Map(solutionPlan(library).map((f) => [f.path, f.content]))
    const folders = new Set(tagList(library.customTags).map((tag) => tag.id))
    for (const rel of next.keys()) folders.add(rel.split('/')[0])
    for (const folder of folders) await fs.mkdir(path.join(dir, folder), { recursive: true })

    for (const [rel, content] of next) {
      if (verified ? written.get(rel) === content : (await readText(fileFor(rel))) === content)
        continue
      await fs.writeFile(fileFor(rel), content, 'utf8')
    }
    for (const rel of written.keys()) {
      if (!next.has(rel)) await fs.rm(fileFor(rel), { force: true })
    }
    // Drop folders of deleted tags once they're empty.
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !folders.has(entry.name)) {
        await fs.rmdir(path.join(dir, entry.name)).catch(() => {})
      }
    }
    written = next
    verified = true
  }

  return {
    async load(userId) {
      const doc = await store.load(userId)
      // first load: check every file against the library (they may have been edited)
      if (!verified) await sync(doc?.data ?? { problems: [], customTags: [] })
      return doc
    },
    async save(userId, data, baseRev) {
      const result = await store.save(userId, data, baseRev)
      // The library itself is saved at this point; a failure here only
      // affects the copies and is retried on the next save.
      try {
        await sync(data)
        return result
      } catch (err) {
        return {
          ...result,
          warning: `Saved, but could not update the solutions folder: ${(err as Error).message}`,
        }
      }
    },
  }
}

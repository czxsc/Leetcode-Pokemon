/* =====================================================================
   The problem library as a document store over Postgres. The web app
   saves the whole library at once (with its revision); here that save
   becomes one transaction that locks the user's row, checks the
   revision, and writes only what changed: new or edited problems,
   deleted ones, their tags, and the custom tags.
===================================================================== */
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import type { Library, Problem } from '../../../../shared/library.ts'
import { ConflictError, type ErasableStore } from '../../documents.ts'
import { customTags, libraries, problems, problemTags } from './schema.ts'

// Works with any Postgres driver (PGlite in tests, node-postgres in the cloud).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<PgQueryResultHKT, any>

// Rows per INSERT: a statement takes at most 65,535 parameters (one per column per row).
const BATCH_ROWS = 200

type ProblemRow = typeof problems.$inferSelect

function toRow(userId: string, p: Problem, position: number): ProblemRow {
  return {
    userId,
    id: p.id,
    position,
    title: p.title,
    difficulty: p.difficulty,
    language: p.language,
    code: p.code,
    url: p.url,
    createdAt: new Date(p.createdAt),
    solvedOn: p.solvedAt,
    claimed: p.claimed,
    claimedOn: p.claimedAt,
  }
}

function fromRow(row: ProblemRow, tags: string[]): Problem {
  return {
    id: row.id,
    title: row.title,
    difficulty: row.difficulty as Problem['difficulty'],
    tags,
    language: row.language,
    code: row.code,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
    solvedAt: row.solvedOn,
    claimed: row.claimed,
    claimedAt: row.claimedOn,
  }
}

const sameRow = (a: ProblemRow, b: ProblemRow) =>
  (Object.keys(a) as (keyof ProblemRow)[]).every((k) =>
    a[k] instanceof Date ? +a[k] === +(b[k] as Date) : a[k] === b[k],
  )
const sameList = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b)

// `excluded.<column>`: the value the INSERT tried to write, for ON CONFLICT DO UPDATE
function sqlExcluded(column: string) {
  return sql.raw(`excluded."${column}"`)
}

function batches<T>(items: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += BATCH_ROWS) out.push(items.slice(i, i + BATCH_ROWS))
  return out
}

async function readLibrary(db: Db, userId: string) {
  const rows = await db
    .select()
    .from(problems)
    .where(eq(problems.userId, userId))
    .orderBy(asc(problems.position))
  const tagRows = await db
    .select({ problemId: problemTags.problemId, tagId: problemTags.tagId })
    .from(problemTags)
    .where(eq(problemTags.userId, userId))
    .orderBy(asc(problemTags.problemId), asc(problemTags.position))
  const custom = await db
    .select({ id: customTags.id, name: customTags.name })
    .from(customTags)
    .where(eq(customTags.userId, userId))
    .orderBy(asc(customTags.position))
  const tagsOf = new Map<string, string[]>()
  for (const t of tagRows) tagsOf.set(t.problemId, [...(tagsOf.get(t.problemId) || []), t.tagId])
  return { rows, tagsOf, custom }
}

export function createPostgresLibraryStore(db: Db): ErasableStore<Library> {
  return {
    async load(userId) {
      const [lib] = await db.select().from(libraries).where(eq(libraries.userId, userId))
      if (!lib) return null
      const { rows, tagsOf, custom } = await readLibrary(db, userId)
      return {
        rev: lib.rev,
        savedAt: lib.savedAt.toISOString(),
        data: {
          problems: rows.map((r) => fromRow(r, tagsOf.get(r.id) || [])),
          customTags: custom,
        },
      }
    },

    save: (userId, library, baseRev) =>
      db.transaction(async (tx) => {
        // lock the user's library row so concurrent saves are serialized
        const [lib] = await tx
          .select({ rev: libraries.rev })
          .from(libraries)
          .where(eq(libraries.userId, userId))
          .for('update')
        const current = lib?.rev ?? 0
        if (current !== baseRev) throw new ConflictError(current)
        const savedAt = new Date()
        const rev = current + 1
        if (lib) {
          await tx.update(libraries).set({ rev, savedAt }).where(eq(libraries.userId, userId))
        } else {
          const created = await tx
            .insert(libraries)
            .values({ userId, rev, savedAt })
            .onConflictDoNothing()
            .returning({ rev: libraries.rev })
          if (!created.length) throw new ConflictError(1) // another first save got there first
        }

        const before = await readLibrary(tx, userId)
        const old = new Map(before.rows.map((r) => [r.id, r]))
        const next = library.problems.map((p, i) => toRow(userId, p, i))
        const keep = new Set(next.map((r) => r.id))

        // problems: delete removed ones (their tags go with them), upsert new or edited ones
        const removed = [...old.keys()].filter((id) => !keep.has(id))
        if (removed.length) {
          await tx
            .delete(problems)
            .where(and(eq(problems.userId, userId), inArray(problems.id, removed)))
        }
        const changed = next.filter((r) => !old.has(r.id) || !sameRow(r, old.get(r.id)!))
        for (const batch of batches(changed)) {
          await tx
            .insert(problems)
            .values(batch)
            .onConflictDoUpdate({
              target: [problems.userId, problems.id],
              set: {
                position: sqlExcluded('position'),
                title: sqlExcluded('title'),
                difficulty: sqlExcluded('difficulty'),
                language: sqlExcluded('language'),
                code: sqlExcluded('code'),
                url: sqlExcluded('url'),
                createdAt: sqlExcluded('created_at'),
                solvedOn: sqlExcluded('solved_on'),
                claimed: sqlExcluded('claimed'),
                claimedOn: sqlExcluded('claimed_on'),
              },
            })
        }

        // tags of problems whose tag list changed
        const retag = library.problems.filter(
          (p) => !sameList(p.tags, before.tagsOf.get(p.id) || []),
        )
        if (retag.length) {
          await tx.delete(problemTags).where(
            and(
              eq(problemTags.userId, userId),
              inArray(
                problemTags.problemId,
                retag.map((p) => p.id),
              ),
            ),
          )
          const tagRows = retag.flatMap((p) =>
            p.tags.map((tagId, position) => ({ userId, problemId: p.id, tagId, position })),
          )
          for (const batch of batches(tagRows)) await tx.insert(problemTags).values(batch)
        }

        // custom tags: small list, replaced whole when it changes
        if (!sameList(library.customTags, before.custom)) {
          await tx.delete(customTags).where(eq(customTags.userId, userId))
          const rows = library.customTags.map((t, position) => ({ userId, ...t, position }))
          for (const batch of batches(rows)) await tx.insert(customTags).values(batch)
        }
        return { rev, savedAt: savedAt.toISOString() }
      }),

    // the user's problems, their tags and custom tags go with it (on delete cascade)
    async remove(userId) {
      await db.delete(libraries).where(eq(libraries.userId, userId))
    },
  }
}

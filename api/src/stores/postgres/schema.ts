/* =====================================================================
   The problem library in Postgres. One row per user in `libraries`
   (holding the document revision), their problems, each problem's tags
   (ordered), and their custom tags. Built-in tags live in
   shared/catalog.ts, so problem_tags.tag_id has no foreign key.
   Migrations: npm run db:generate (writes api/drizzle/).
===================================================================== */
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const libraries = pgTable('libraries', {
  userId: text('user_id').primaryKey(),
  rev: integer('rev').notNull(),
  savedAt: timestamp('saved_at', { withTimezone: true, mode: 'date' }).notNull(),
})

const owner = () =>
  text('user_id')
    .notNull()
    .references(() => libraries.userId, { onDelete: 'cascade' })

export const problems = pgTable(
  'problems',
  {
    userId: owner(),
    id: text('id').notNull(),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    difficulty: text('difficulty').notNull(),
    language: text('language').notNull(),
    code: text('code').notNull(),
    url: text('url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    solvedOn: date('solved_on', { mode: 'string' }),
    claimed: boolean('claimed').notNull(),
    claimedOn: date('claimed_on', { mode: 'string' }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    check('problems_difficulty', sql`${t.difficulty} in ('Easy', 'Medium', 'Hard')`),
    // the solve calendar and streaks read problems by solve date
    index('problems_solved_on').on(t.userId, t.solvedOn),
  ],
)

export const problemTags = pgTable(
  'problem_tags',
  {
    userId: text('user_id').notNull(),
    problemId: text('problem_id').notNull(),
    tagId: text('tag_id').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.problemId, t.tagId] }),
    foreignKey({
      columns: [t.userId, t.problemId],
      foreignColumns: [problems.userId, problems.id],
    }).onDelete('cascade'),
    // per-tag progress counts problems by tag
    index('problem_tags_tag').on(t.userId, t.tagId),
  ],
)

export const customTags = pgTable(
  'custom_tags',
  {
    userId: owner(),
    id: text('id').notNull(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
)

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { PGlite } from '@electric-sql/pglite'
import { migrate as migrateNodePg } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import type pg from 'pg'
import { describe, expect, it } from 'vitest'
import type { Library } from '../../shared/library.ts'
import { ensureDatabase, grantAppAccess } from '../src/migrate.ts'
import { createDynamoStore } from '../src/stores/dynamo-store.ts'
import { createFileStore } from '../src/stores/file-store.ts'
import { postgresLibraryStore, withConnection } from '../src/stores/postgres/connection.ts'
import { createPostgresLibraryStore } from '../src/stores/postgres/library-store.ts'
import { documentStoreContract } from './document-store.contract.ts'
import { librarySamples, memoryStore, problem, progressSamples } from './fixtures.ts'

const tmpDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'pokeleet-'))
const migrationsFolder = path.join(import.meta.dirname, '../drizzle')

// ---- in-memory (the route tests' stand-in) ----
documentStoreContract('memory store', { setup: () => memoryStore(), samples: progressSamples })

// ---- JSON files (the local app) ----
documentStoreContract('file store', {
  setup: async () => createFileStore({ file: path.join(await tmpDir(), 'doc.json'), owner: 'me' }),
  samples: progressSamples,
  users: ['me'],
})

describe('file store', () => {
  it('serves only its owner', async () => {
    const store = createFileStore({ file: path.join(await tmpDir(), 'doc.json'), owner: 'me' })
    await expect(store.load('someone-else')).rejects.toMatchObject({ status: 403 })
  })

  it('reads the format the app has always written', async () => {
    const file = path.join(await tmpDir(), 'progress.json')
    await fs.writeFile(file, JSON.stringify({ rev: 7, savedAt: 'then', data: { coins: 3 } }))
    expect(await createFileStore({ file, owner: 'me' }).load('me')).toEqual({
      rev: 7,
      savedAt: 'then',
      data: { coins: 3 },
    })
  })

  it('reports a damaged file instead of overwriting it', async () => {
    const file = path.join(await tmpDir(), 'progress.json')
    await fs.writeFile(file, '{ not json')
    const store = createFileStore({ file, owner: 'me' })
    await expect(store.load('me')).rejects.toThrow(/not valid PokéLeet data/)
    await expect(store.save('me', {}, 0)).rejects.toThrow(/not valid PokéLeet data/)
    expect(await fs.readFile(file, 'utf8')).toBe('{ not json')
  })

  it('keeps a copy of the file from before the first write of the day', async () => {
    const dir = await tmpDir()
    const file = path.join(dir, 'progress.json')
    await fs.writeFile(file, JSON.stringify({ rev: 1, savedAt: null, data: { v: 1 } }))
    const store = createFileStore({ file, owner: 'me', backupsDir: path.join(dir, 'backups') })
    await store.save('me', { v: 2 }, 1)
    await store.save('me', { v: 3 }, 2)
    const [day] = await fs.readdir(path.join(dir, 'backups'))
    const copy = JSON.parse(
      await fs.readFile(path.join(dir, 'backups', day, 'progress.json'), 'utf8'),
    )
    expect(copy.data).toEqual({ v: 1 })
  })
})

// ---- Postgres (the cloud's library), on PGlite: real Postgres, in process ----
async function postgres() {
  const db = drizzle(new PGlite())
  await migrate(db, { migrationsFolder })
  return db
}

documentStoreContract('postgres library store', {
  setup: async () => createPostgresLibraryStore(await postgres()),
  samples: librarySamples,
})

describe('postgres library store', () => {
  it('writes only what changed', async () => {
    const db = await postgres()
    const store = createPostgresLibraryStore(db)
    const lib = (n: number): Library => ({
      problems: Array.from({ length: n }, (_, i) => problem(`p${i}`)),
      customTags: [],
    })
    await store.save('u', lib(3), 0)
    const before = await db.execute('select id, xmin from problems order by id')
    const edited = lib(3)
    edited.problems[1] = { ...edited.problems[1], title: 'Edited' }
    await store.save('u', edited, 1)
    const after = await db.execute('select id, xmin from problems order by id')
    const rewritten = after.rows.filter((r, i) => r.xmin !== before.rows[i].xmin).map((r) => r.id)
    expect(rewritten).toEqual(['p1'])
  })

  it('keeps tags in order and drops them with their problem', async () => {
    const db = await postgres()
    const store = createPostgresLibraryStore(db)
    await store.save(
      'u',
      { problems: [problem('a', { tags: ['dp', 'arrays', 'bfs'] })], customTags: [] },
      0,
    )
    expect((await store.load('u'))!.data.problems[0].tags).toEqual(['dp', 'arrays', 'bfs'])
    await store.save('u', { problems: [], customTags: [] }, 1)
    expect((await db.execute('select count(*)::int as n from problem_tags')).rows[0]).toEqual({
      n: 0,
    })
  })

  it('reads and writes large libraries', async () => {
    const store = createPostgresLibraryStore(await postgres())
    // 40 problems with 60 KB of code each: ~2.4 MB
    const problems = Array.from({ length: 40 }, (_, i) =>
      problem(`big${i}`, { code: `# ${i}\n` + 'x = 1\n'.repeat(10_000), tags: ['dp', `t${i}`] }),
    )
    await store.save('u', { problems, customTags: [] }, 0)
    expect((await store.load('u'))!.data.problems).toEqual(problems)
  })

  it('handles libraries larger than one insert batch', async () => {
    const store = createPostgresLibraryStore(await postgres())
    const problems = Array.from({ length: 250 }, (_, i) => problem(`p${i}`))
    await store.save('u', { problems, customTags: [] }, 0)
    expect((await store.load('u'))!.data.problems).toEqual(problems)
  })
})

// ---- Postgres over a connection per call (as the cloud reaches Aurora) ----
describe('postgres over a connection', () => {
  it('answers 503 while the database is out of reach, so the app retries', async () => {
    const store = postgresLibraryStore({ host: '127.0.0.1', port: 9, connectionTimeoutMillis: 500 })
    await expect(store.load('u')).rejects.toMatchObject({ status: 503 })
  })
})

// Needs a Postgres server, e.g. docker compose up postgres
const postgresUrl = process.env.POSTGRES_URL
describe.runIf(postgresUrl)('postgres over a connection, on a server', () => {
  const server: pg.ClientConfig = { connectionString: postgresUrl }
  const newName = () => `test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`

  // a new, migrated database for each test
  async function freshDatabase(): Promise<pg.ClientConfig> {
    const name = newName()
    await withConnection(server, (_db, client) => ensureDatabase(client, name))
    const url = new URL(postgresUrl!)
    url.pathname = `/${name}`
    const config = { connectionString: url.toString() }
    await withConnection(config, (db) => migrateNodePg(db, { migrationsFolder }))
    return config
  }

  documentStoreContract('postgres library store, a connection per call', {
    setup: async () => postgresLibraryStore(await freshDatabase()),
    samples: librarySamples,
  })

  it("creates the app's database if it's missing, and can run again", async () => {
    const name = newName()
    await withConnection(server, async (_db, client) => {
      await ensureDatabase(client, name)
      await ensureDatabase(client, name)
      const { rowCount } = await client.query('SELECT FROM pg_database WHERE datname = $1', [name])
      expect(rowCount).toBe(1)
    })
  })

  it('reports wrong credentials as an error, not as a database waking up', async () => {
    const url = new URL(postgresUrl!)
    url.password = 'wrong'
    const store = postgresLibraryStore({ connectionString: url.toString() })
    await expect(store.load('u')).rejects.not.toMatchObject({ status: 503 })
  })

  it("gives the API's user access to the app's tables, and can run again", async () => {
    await withConnection(await freshDatabase(), async (_db, client) => {
      // stand-in for Aurora's built-in role for IAM sign-in
      await client.query(
        `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rds_iam') THEN CREATE ROLE rds_iam; END IF; END $$`,
      )
      await grantAppAccess(client, 'pokeleet_app')
      await grantAppAccess(client, 'pokeleet_app')
      const { rows } = await client.query(`SELECT
        pg_has_role('pokeleet_app', 'rds_iam', 'member') AS iam,
        (SELECT bool_and(has_table_privilege('pokeleet_app', 'problems', p))
          FROM unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS p) AS crud,
        has_table_privilege('pokeleet_app', 'problems', 'TRUNCATE') AS truncate`)
      expect(rows[0]).toEqual({ iam: true, crud: true, truncate: false })
    })
  })
})

// ---- DynamoDB (the cloud's progress); needs DynamoDB Local, e.g. docker compose up dynamodb ----
const endpoint = process.env.DYNAMODB_ENDPOINT
describe.runIf(endpoint)('dynamo store', () => {
  documentStoreContract('dynamo store', {
    setup: async () => {
      const raw = new DynamoDBClient({
        endpoint,
        region: 'local',
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      })
      const table = `test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
      await raw.send(
        new CreateTableCommand({
          TableName: table,
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' },
          ],
          AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'sk', AttributeType: 'S' },
          ],
        }),
      )
      const client = DynamoDBDocumentClient.from(raw, {
        marshallOptions: { removeUndefinedValues: true },
      })
      return createDynamoStore({ client, table, name: 'progress' })
    },
    samples: progressSamples,
  })
})

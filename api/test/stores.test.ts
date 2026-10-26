import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { describe, expect, it } from 'vitest'
import type { Library } from '../../shared/library.ts'
import { createDynamoStore } from '../src/stores/dynamo-store.ts'
import { createFileStore } from '../src/stores/file-store.ts'
import { createPostgresLibraryStore } from '../src/stores/postgres/library-store.ts'
import { documentStoreContract } from './document-store.contract.ts'
import { librarySamples, memoryStore, problem, progressSamples } from './fixtures.ts'

const tmpDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'pokeleet-'))

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
  await migrate(db, { migrationsFolder: path.join(import.meta.dirname, '../drizzle') })
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

  it('handles libraries larger than one insert batch', async () => {
    const store = createPostgresLibraryStore(await postgres())
    const problems = Array.from({ length: 250 }, (_, i) => problem(`p${i}`))
    await store.save('u', { problems, customTags: [] }, 0)
    expect((await store.load('u'))!.data.problems).toEqual(problems)
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

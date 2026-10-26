import { describe, expect, it, vi } from 'vitest'
import type { Library } from '../../shared/library.ts'
import { createApp, PROGRESS_MAX_BYTES } from '../src/app.ts'
import { HttpError, UnavailableError } from '../src/documents.ts'
import { librarySamples, memoryStore } from './fixtures.ts'

function setup(user: string | null = 'user-1') {
  const stores = { progress: memoryStore<object>(), library: memoryStore<Library>() }
  const lookup = vi.fn(async (slug: string) => {
    if (slug !== 'two-sum') throw new HttpError(404, 'no such problem')
    return {
      number: '1',
      title: 'Two Sum',
      slug,
      difficulty: 'Easy',
      paidOnly: false,
      url: '',
      tags: [],
    }
  })
  const app = createApp({
    stores,
    identify: () => user,
    lookup,
    mode: 'cloud',
    location: 'your account',
  })
  const put = (doc: string, body: unknown, type = 'application/json') =>
    app.request(`/api/${doc}`, {
      method: 'PUT',
      headers: { 'Content-Type': type },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  return { app, stores, put }
}

describe('API', () => {
  it('returns both documents with where they are stored', async () => {
    const { app, put } = setup()
    await put('progress', { rev: 0, data: { coins: 1 } })
    const res = await app.request('/api/data')
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toMatchObject({
      api: 'pokeleet',
      mode: 'cloud',
      location: 'your account',
      progress: { rev: 1, data: { coins: 1 } },
      library: null,
    })
  })

  it('saves a library and answers with the new revision', async () => {
    const { put, stores } = setup()
    const res = await put('library', { rev: 0, data: librarySamples[0] })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ api: 'pokeleet', rev: 1 })
    expect((await stores.library.load('user-1'))!.data).toEqual(librarySamples[0])
  })

  it('answers 409 with the current revision for a stale save', async () => {
    const { put } = setup()
    await put('progress', { rev: 0, data: {} })
    const res = await put('progress', { rev: 0, data: {} })
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ rev: 1 })
  })

  it('rejects data that does not match the schema', async () => {
    const { put } = setup()
    const bad = {
      problems: [{ ...librarySamples[0].problems[0], difficulty: 'Impossible' }],
      customTags: [],
    }
    const res = await put('library', { rev: 0, data: bad })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/difficulty/)
    expect((await put('progress', { rev: -1, data: {} })).status).toBe(400)
    expect((await put('progress', { rev: 0, data: [1, 2] })).status).toBe(400)
  })

  it('rejects oversized progress, wrong content types and broken JSON', async () => {
    const { put } = setup()
    const big = { blob: 'x'.repeat(PROGRESS_MAX_BYTES) }
    expect((await put('progress', { rev: 0, data: big })).status).toBe(400)
    expect((await put('progress', 'rev=0', 'text/plain')).status).toBe(415)
    expect((await put('progress', '{"rev":0,')).status).toBe(400)
  })

  it('keeps each user to their own data', async () => {
    const a = setup('a')
    await a.put('progress', { rev: 0, data: { coins: 1 } })
    const b = createApp({
      stores: a.stores,
      identify: () => 'b',
      lookup: vi.fn(),
      mode: 'cloud',
      location: '',
    })
    expect(await (await b.request('/api/data')).json()).toMatchObject({ progress: null })
  })

  it('requires a signed-in user', async () => {
    const { app } = setup(null)
    const res = await app.request('/api/data')
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ api: 'pokeleet' })
  })

  it('looks problems up on LeetCode', async () => {
    const { app } = setup()
    const ok = await app.request('/api/leetcode?slug=two-sum')
    expect(await ok.json()).toMatchObject({ problem: { title: 'Two Sum' } })
    expect((await app.request('/api/leetcode?slug=nope')).status).toBe(404)
  })

  it('answers 503 while the database wakes up, so the app retries', async () => {
    const { app, stores } = setup()
    stores.library.load = async () => {
      throw new UnavailableError()
    }
    expect((await app.request('/api/data')).status).toBe(503)
  })

  it('answers unknown routes with JSON', async () => {
    const { app } = setup()
    const res = await app.request('/api/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ api: 'pokeleet' })
  })
})

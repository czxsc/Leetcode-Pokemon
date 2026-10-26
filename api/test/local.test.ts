import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createLocalApp } from '../src/local/plugin.ts'
import { problem } from './fixtures.ts'

const save = (app: ReturnType<typeof createLocalApp>, doc: string, rev: number, data: object) =>
  app.request(`/api/${doc}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rev, data }),
  })

describe('local app', () => {
  it('stores both documents in the data folder, in the format it always has', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pokeleet-'))
    const app = createLocalApp(dir)
    expect((await save(app, 'progress', 0, { coins: 5 })).status).toBe(200)
    const file = JSON.parse(await fs.readFile(path.join(dir, 'progress.json'), 'utf8'))
    expect(file).toMatchObject({ rev: 1, data: { coins: 5 } })
    expect(await (await app.request('/api/data')).json()).toMatchObject({
      mode: 'local',
      location: dir,
    })
  })

  it('mirrors solved problems into solutions/<tag>/', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pokeleet-'))
    const app = createLocalApp(dir)
    const p = problem('two-sum', { title: 'Two Sum', tags: ['arrays', 'hash-table'] })
    await save(app, 'library', 0, { problems: [p], customTags: [] })
    const file = path.join(dir, 'solutions', 'arrays', 'two-sum.py')
    expect(await fs.readFile(file, 'utf8')).toContain('class Solution')
    expect(await fs.readFile(path.join(dir, 'solutions', 'hash-table', 'two-sum.py'), 'utf8')).toBe(
      await fs.readFile(file, 'utf8'),
    )

    await save(app, 'library', 1, { problems: [], customTags: [] })
    await expect(fs.access(file)).rejects.toThrow()
  })
})

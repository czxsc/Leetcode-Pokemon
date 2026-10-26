// The behavior every DocumentStore must have, run against each implementation.
import { beforeEach, describe, expect, it } from 'vitest'
import { ConflictError, type DocumentStore } from '../src/documents.ts'

export function documentStoreContract<T>(
  name: string,
  options: {
    setup: () => Promise<DocumentStore<T>> | DocumentStore<T>
    samples: [T, T, T]
    users?: string[] // a single-user store (the local app) passes just its owner
  },
) {
  const [a, b, c] = options.samples
  const [me, other] = options.users ?? ['user-a', 'user-b']

  describe(`${name} (DocumentStore contract)`, () => {
    let store: DocumentStore<T>
    beforeEach(async () => {
      store = await options.setup()
    })

    it('has nothing for a new user', async () => {
      expect(await store.load(me)).toBeNull()
    })

    it('saves revision by revision and loads exactly what was saved', async () => {
      const first = await store.save(me, a, 0)
      expect(first.rev).toBe(1)
      expect(Date.parse(first.savedAt)).not.toBeNaN()
      expect(await store.load(me)).toEqual({ rev: 1, savedAt: first.savedAt, data: a })
      await store.save(me, b, 1)
      expect((await store.save(me, c, 2)).rev).toBe(3)
      expect((await store.load(me))!.data).toEqual(c)
    })

    it('refuses a save based on an old revision, reporting the current one', async () => {
      await store.save(me, a, 0)
      await store.save(me, b, 1)
      const stale = store.save(me, c, 1)
      await expect(stale).rejects.toBeInstanceOf(ConflictError)
      await expect(stale).rejects.toMatchObject({ status: 409, rev: 2 })
      expect((await store.load(me))!.data).toEqual(b)
    })

    it('refuses a first save when the document already exists', async () => {
      await store.save(me, a, 0)
      await expect(store.save(me, b, 0)).rejects.toMatchObject({ rev: 1 })
    })

    it.runIf(!!other)('keeps users apart', async () => {
      await store.save(me, a, 0)
      expect(await store.load(other)).toBeNull()
      expect((await store.save(other, b, 0)).rev).toBe(1)
      expect((await store.load(me))!.data).toEqual(a)
    })
  })
}

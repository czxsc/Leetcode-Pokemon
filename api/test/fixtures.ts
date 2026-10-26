// Sample documents for the API tests.
import type { Library, Problem } from '../../shared/library.ts'
import type { DocumentStore, StoredDoc } from '../src/documents.ts'
import { ConflictError } from '../src/documents.ts'

export const problem = (id: string, over: Partial<Problem> = {}): Problem => ({
  id,
  title: `Problem ${id}`,
  difficulty: 'Medium',
  tags: ['arrays', 'hash-table'],
  language: 'python',
  code: 'class Solution:\n    pass\n',
  url: `https://leetcode.com/problems/${id}/`,
  createdAt: '2026-10-01T12:00:00.000Z',
  solvedAt: '2026-10-02',
  claimed: false,
  claimedAt: null,
  ...over,
})

// three successive versions of a library: add, edit + retag + reorder, delete
export const librarySamples: [Library, Library, Library] = [
  {
    problems: [problem('two-sum'), problem('3sum', { tags: [], solvedAt: null, code: '' })],
    customTags: [{ id: 'mine', name: 'Mine' }],
  },
  {
    problems: [
      problem('3sum', { tags: ['two-pointers', 'mine'], code: 'pass', solvedAt: '2026-10-03' }),
      problem('two-sum', { claimed: true, claimedAt: '2026-10-04' }),
      problem('lru-cache', { difficulty: 'Hard', tags: ['design'] }),
    ],
    customTags: [
      { id: 'mine', name: 'Mine' },
      { id: 'later', name: 'Later' },
    ],
  },
  { problems: [problem('lru-cache', { difficulty: 'Hard', tags: ['design'] })], customTags: [] },
]

export const progressSamples: [object, object, object] = [
  { shards: 5000, coins: 0, owned: [{ iid: 'a', sp: 'pikachu', level: 5 }], team: ['a'] },
  { shards: 4600, coins: 12, owned: [], team: [], quests: { login: 1 }, trainer: { name: 'Ash' } },
  { shards: 0, coins: 99.5, nested: { deep: [1, null, 'x', { ok: true }] } },
]

// An in-memory DocumentStore, for testing the routes.
export function memoryStore<T>(): DocumentStore<T> {
  const docs = new Map<string, StoredDoc<T>>()
  return {
    async load(userId) {
      return docs.get(userId) ?? null
    },
    async save(userId, data, baseRev) {
      const current = docs.get(userId)?.rev ?? 0
      if (current !== baseRev) throw new ConflictError(current)
      const doc = { rev: current + 1, savedAt: new Date().toISOString(), data }
      docs.set(userId, doc)
      return { rev: doc.rev, savedAt: doc.savedAt }
    },
  }
}

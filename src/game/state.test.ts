import { describe, expect, it } from 'vitest'
import { LibrarySchema } from '../../shared/library'
import { buildState, normalizeLibrary, rollDailyState, splitState } from './state'
import { ctx, game, seeded, TODAY } from './test-helpers'

const NOW = ctx().now

describe('normalizeLibrary', () => {
  it('always produces a library the API accepts', () => {
    const rng = seeded(3)
    const junk = () =>
      [null, 7, '', 'x'.repeat(300), { a: 1 }, ['arrays'], true][Math.floor(rng() * 7)]
    for (let i = 0; i < 200; i++) {
      const raw = {
        problems: Array.from({ length: 5 }, (_, n) => ({
          id: n % 2 ? `p${i}-${n}` : junk(),
          title: n % 3 ? 'T' + junk() : junk(),
          difficulty: junk(),
          tags: [junk(), junk()],
          language: junk(),
          code: junk(),
          url: junk(),
          createdAt: junk(),
          solvedAt: n % 2 ? '2026-01-02' : junk(),
          claimed: junk(),
          claimedAt: junk(),
        })),
        customTags: [
          { id: junk(), name: junk() },
          { id: 'ok', name: 'x'.repeat(200) },
        ],
      }
      expect(() => LibrarySchema.parse(normalizeLibrary(raw, NOW))).not.toThrow()
    }
  })

  it('keeps valid problems as they are', () => {
    const problem = {
      id: 'p1',
      title: 'Two Sum',
      difficulty: 'Easy',
      tags: ['arrays'],
      language: 'python',
      code: 'pass',
      url: 'https://leetcode.com/problems/two-sum/',
      createdAt: '2026-01-02T03:04:05.000Z',
      solvedAt: '2026-01-02',
      claimed: true,
      claimedAt: '2026-01-02',
    }
    expect(normalizeLibrary({ problems: [problem] }, NOW).problems[0]).toEqual(problem)
  })
})

describe('state documents', () => {
  it('splits into progress and library, and builds back the same state', () => {
    const s = game({ coins: 12 })
    const { progress, library } = splitState(s)
    expect(progress).not.toHaveProperty('problems')
    expect(library).toEqual({ problems: [], customTags: [] })
    expect(buildState(progress, library, TODAY, NOW)).toEqual(s)
  })

  it('resets the daily counters on a new day', () => {
    const s = game({ quests: { login: 1 }, recallToday: true, recallShardsToday: 500 })
    const next = rollDailyState(s, '2026-10-26')
    expect(next).toMatchObject({
      quests: {},
      recallToday: false,
      recallShardsToday: 0,
      lastDay: '2026-10-26',
    })
    expect(rollDailyState(s, TODAY)).toBe(s)
  })

  it('treats saves from before onboarding existed as onboarded', () => {
    const owned = [
      { iid: 'a', sp: 'pikachu', level: 3, exp: 0, shiny: false, form: null, copies: 0 },
    ]
    expect(buildState({ owned, team: ['a'] }, null, TODAY, NOW).onboarded).toBe(true)
    expect(buildState(null, null, TODAY, NOW).onboarded).toBe(false)
  })

  it('turns duplicates banked toward evolving (before v7) into levels', () => {
    const mon = { exp: 4, shiny: false, form: null, unlocked: {} }
    const saved = {
      v: 6,
      owned: [
        { ...mon, iid: 'a', sp: 'charmander', level: 5, copies: 2 },
        { ...mon, iid: 'b', sp: 'pidgey', level: 55, copies: 1 },
        { ...mon, iid: 'c', sp: 'rattata', level: 7, copies: 0 },
        // had the 3 copies it needed to evolve, so it still can (Ivysaur evolves at Lv40)
        { ...mon, iid: 'd', sp: 'ivysaur', level: 5, copies: 3 },
      ],
    }
    const s = buildState(saved, null, TODAY, NOW)
    expect(s.v).toBe(7)
    expect(s.owned.map((o) => o.level)).toEqual([25, 60, 7, 40])
    expect(s.owned.every((o) => !('copies' in o))).toBe(true)
    expect(s.owned[0].exp).toBe(4)
  })
})

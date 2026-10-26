import { describe, expect, it } from 'vitest'
import { claimAchievements } from './chapters'
import { claimDaily, QUESTS } from './quests'
import { ctx, game, TODAY } from './test-helpers'

describe('daily quests', () => {
  it('pays only the next step, once', () => {
    const s = claimDaily(game(), 'login', 0, ctx())!
    expect(s.quests.login).toBe(1)
    expect(s.shards).toBe(game().shards + 50)
    expect(claimDaily(s, 'login', 0, ctx())).toBeNull()
  })

  it('refuses a step whose goal is not met', () => {
    expect(claimDaily(game(), 'refresh', 0, ctx())).toBeNull()
  })

  it('counts a perfect day once all quests are claimed', () => {
    const all = Object.fromEntries(QUESTS.map((q) => [q.id, q.steps.length]))
    const almost = game({ quests: { ...all, login: 0 } })
    const s = claimDaily(almost, 'login', 0, ctx())!
    expect(s.stats).toMatchObject({ perfectDays: 1, lastPerfectDay: TODAY })
  })
})

describe('progression quests', () => {
  it('claims ready quests of open chapters only, once', () => {
    const s = game({ totalPulls: 1 })
    const claimed = claimAchievements(s, ['c1-draw', 'c2-solve'], ctx())!
    expect(claimed.achievements).toEqual({ 'c1-draw': TODAY })
    expect(claimed.shards).toBe(s.shards + 100)
    expect(claimAchievements(claimed, ['c1-draw'], ctx())).toBeNull()
  })
})

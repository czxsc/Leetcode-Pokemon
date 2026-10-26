import { describe, expect, it } from 'vitest'
import { battle, newCombat, payOut, TICK_MS } from './meadow'
import * as Study from './study'
import { ctx, game, seeded } from './test-helpers'

const T0 = 1_000_000
const MIN = 60_000
// An open tab reports in at least once a minute; `leetcode` is whether LeetCode is the active tab.
function watch(s: Study.StudySession, leetcode: boolean, from: number, to: number) {
  const since = from
  for (let t = from; t <= to; t += MIN) s = Study.update(s, { leetcode, since }, t)
  return s
}

const session = () =>
  Study.create({ title: 'LeetCode', url: 'https://leetcode.com/' }, T0, newCombat(), seeded())

describe('study sessions', () => {
  it('counts only time with LeetCode as the active tab', () => {
    let s = watch(session(), true, T0, T0 + 10 * MIN)
    s = watch(s, false, T0 + 10 * MIN, T0 + 12 * MIN)
    expect(Study.focusTime(s, T0 + 12 * MIN)).toBe(10 * MIN)
    expect(Study.isActive(s)).toBe(true)
  })

  it('ends after PAUSE_LIMIT paused in a row', () => {
    let s = watch(session(), true, T0, T0 + MIN)
    s = watch(s, false, T0 + MIN, T0 + MIN + Study.PAUSE_LIMIT + MIN)
    expect(s).toMatchObject({ endReason: 'paused', endedAt: T0 + MIN + Study.PAUSE_LIMIT })
  })

  it('stops counting at SESSION_CAP', () => {
    const s = watch(session(), true, T0, T0 + Study.SESSION_CAP + MIN)
    expect(s.endReason).toBe('cap')
    expect(Study.focusTime(s, T0 + Study.SESSION_CAP + MIN)).toBe(Study.SESSION_CAP)
  })

  it("doesn't count time when no tab was watching", () => {
    let s = Study.update(session(), { leetcode: true, since: T0 }, T0)
    s = Study.update(s, undefined, T0 + 30 * MIN, { unwatched: true })
    expect(Study.focusTime(s, T0 + 30 * MIN)).toBe(0)
  })
})

describe('battles', () => {
  it('turns study time into rewards, deterministically', () => {
    const s = game()
    const run = () => battle(s, newCombat(), 10 * MIN, ctx({ rng: seeded(9) }))
    const r = run()
    expect(r.kills).toBeGreaterThan(0)
    expect(r.coins).toBeGreaterThan(0)
    expect(run()).toEqual(r)
  })

  it('carries leftover time toward the next round', () => {
    const r = battle(game(), newCombat(), TICK_MS / 2, ctx())
    expect(r.kills).toBe(0)
    expect(r.combat.wait).toBeGreaterThan(0)
  })

  it('pays out Coins, Shards, EXP and the day counters', () => {
    const s = game()
    const r = battle(s, newCombat(), 10 * MIN, ctx({ rng: seeded(9) }))
    const next = payOut(s, r)
    expect(next.coins).toBe(s.coins + r.coins)
    expect(next.meadow).toMatchObject({
      studyToday: 10 * MIN,
      studyTotal: 10 * MIN,
      kills: r.kills,
    })
  })
})

import { describe, expect, it } from 'vitest'
import { finishQuiz, recallPayout, recallShardsLeft } from './recall'
import { RECALL_DAILY_SHARDS, RECALL_SHARDS_PER_ANSWER } from './rules'
import { buildState } from './state'
import { ctx, game, TODAY } from './test-helpers'

const PER = RECALL_SHARDS_PER_ANSWER
const YESTERDAY = '2026-10-24'

describe('recall rewards', () => {
  it('pays per correct answer below the daily limit', () => {
    const s = game({ shards: 100 })
    const r = finishQuiz(s, 3, ctx())
    expect(r.shards).toBe(3 * PER)
    expect(r.state.shards).toBe(100 + 3 * PER)
    expect(r.state.recallShardsToday).toBe(3 * PER)
  })

  it('stops paying across quizzes once the limit is reached', () => {
    const paid = []
    let s = game()
    // more right answers than the limit pays for
    const quizzes = [6, ...Array(Math.ceil(RECALL_DAILY_SHARDS / (10 * PER)) + 1).fill(10)]
    for (const correct of quizzes) {
      const r = finishQuiz(s, correct, ctx())
      paid.push(r.shards)
      s = r.state
    }
    expect(paid[0]).toBe(6 * PER)
    expect(paid.reduce((a, b) => a + b)).toBe(RECALL_DAILY_SHARDS)
    expect(paid.at(-1)).toBe(0)
    expect(s.recallShardsToday).toBe(RECALL_DAILY_SHARDS)
    expect(recallShardsLeft(s, TODAY)).toBe(0)
  })

  it('never pays more than the limit in one quiz', () => {
    const r = finishQuiz(game(), 1000, ctx())
    expect(r.shards).toBe(RECALL_DAILY_SHARDS)
  })

  it('still counts a quiz that pays nothing', () => {
    const s = game({ recallShardsToday: RECALL_DAILY_SHARDS, recallBest: 4, recallToday: false })
    const r = finishQuiz(s, 7, ctx())
    expect(r.shards).toBe(0)
    expect(r.state).toMatchObject({ recallBest: 7, recallToday: true, shards: s.shards })
    expect(r.state.stats.recalls).toBe(s.stats.recalls + 1)
  })

  it('pays nothing for a score of zero', () => {
    const r = finishQuiz(game(), 0, ctx())
    expect(r.shards).toBe(0)
    expect(r.state.recallShardsToday).toBe(0)
  })

  it('caps the running total a quiz shows at what it can still pay', () => {
    const s = game({ recallShardsToday: RECALL_DAILY_SHARDS - PER })
    expect(recallPayout(s, 1, TODAY)).toBe(PER)
    expect(recallPayout(s, 5, TODAY)).toBe(PER)
  })

  it('refills on a new day, even in a tab left open past midnight', () => {
    const s = game({ recallShardsToday: RECALL_DAILY_SHARDS, lastDay: YESTERDAY })
    expect(recallShardsLeft(s, TODAY)).toBe(RECALL_DAILY_SHARDS)
    const r = finishQuiz(s, 2, ctx())
    expect(r.shards).toBe(2 * PER)
    expect(r.state).toMatchObject({ recallShardsToday: 2 * PER, lastDay: TODAY })
  })

  it('never reports a negative amount left', () => {
    const s = game({ recallShardsToday: RECALL_DAILY_SHARDS + 999 })
    expect(recallShardsLeft(s, TODAY)).toBe(0)
    expect(finishQuiz(s, 3, ctx()).shards).toBe(0)
  })
})

describe('recall rewards in saved data', () => {
  const load = (saved: object) => buildState(saved, null, TODAY, ctx().now).recallShardsToday

  it('starts saves from before the limit existed at zero', () => {
    expect(load({ onboarded: true, lastDay: TODAY })).toBe(0)
  })

  it("keeps today's count through a save and reload", () => {
    expect(load({ recallShardsToday: 150, lastDay: TODAY })).toBe(150)
  })

  it('resets the count when the save is from an earlier day', () => {
    expect(load({ recallShardsToday: 150, lastDay: YESTERDAY })).toBe(0)
  })

  it.each([['lots'], [-50], [null], [{}], [Number.NaN]])('treats %j as zero', (junk) => {
    expect(load({ recallShardsToday: junk, lastDay: TODAY })).toBe(0)
  })
})

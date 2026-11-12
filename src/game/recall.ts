/* =====================================================================
   Active Recall rewards. Correct answers pay Shards up to a daily limit,
   counted per answer rather than per quiz, so replaying quizzes can't
   out-earn solving problems. Quizzes stay free to play past the limit.
===================================================================== */
import { RECALL_DAILY_SHARDS, RECALL_SHARDS_PER_ANSWER } from './rules'
import { rollDailyState } from './state'
import type { Ctx, GameState } from './types'

// Shards Recall can still pay today. A tab left open past midnight still holds yesterday's count.
export function recallShardsLeft(s: GameState, today: string): number {
  if (s.lastDay !== today) return RECALL_DAILY_SHARDS
  return Math.max(0, RECALL_DAILY_SHARDS - s.recallShardsToday)
}

// What a score pays right now, for showing a quiz's running total.
export function recallPayout(s: GameState, correct: number, today: string): number {
  return Math.min(correct * RECALL_SHARDS_PER_ANSWER, recallShardsLeft(s, today))
}

// Finishing a quiz always counts for the daily quest and the best score, even when it pays nothing.
export function finishQuiz(
  state: GameState,
  correct: number,
  ctx: Ctx,
): { state: GameState; shards: number } {
  // roll first, or a quiz finished just after midnight is charged against yesterday's count
  const s = rollDailyState(state, ctx.today)
  const shards = recallPayout(s, correct, ctx.today)
  return {
    shards,
    state: {
      ...s,
      shards: s.shards + shards,
      recallShardsToday: s.recallShardsToday + shards,
      recallBest: Math.max(s.recallBest, correct),
      recallToday: true,
      stats: { ...s.stats, recalls: s.stats.recalls + 1 },
    },
  }
}

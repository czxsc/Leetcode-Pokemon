/* =====================================================================
   Daily quests: log in, solve problems, the daily refresher, and Focus
   time on LeetCode. Solve and Focus are step chains: claiming a step
   moves the quest up to its next, bigger goal. Each step pays once a
   day; claiming every step of every quest counts as a perfect day.
===================================================================== */
import type { Ctx, GameState } from './types'

export interface QuestStep {
  name: string
  desc: string
  goal: number
  reward: number
}

export interface DailyQuest {
  id: string
  unit?: string
  progress: (s: GameState, today: string) => number
  steps: QuestStep[]
}

const step = (name: string, desc: string, goal: number, reward: number): QuestStep => ({
  name,
  desc,
  goal,
  reward,
})

export const QUESTS: DailyQuest[] = [
  { id: 'login', progress: () => 1, steps: [step('Log In', 'Open PokéLeet today.', 1, 50)] },
  {
    id: 'solve',
    progress: (s, today) => s.problems.filter((p) => p.claimedAt === today).length,
    steps: [
      step('Solve 1 Problem', 'Claim shards on any problem.', 1, 100),
      step('Solve 3 Problems', 'Claim shards on three problems.', 3, 150),
      step('Solve 5 Problems', 'Claim shards on five problems.', 5, 250),
    ],
  },
  {
    id: 'refresh',
    progress: (s) => (s.recallToday ? 1 : 0),
    steps: [step('Daily Refresher', 'Finish an Active Recall quiz.', 1, 150)],
  },
  {
    id: 'focus',
    unit: 'min',
    progress: (s) => Math.floor(s.meadow.studyToday / 60000),
    steps: (
      [
        [30, '30 Minutes', 100],
        [60, '1 Hour', 150],
        [90, '1.5 Hours', 200],
        [120, '2 Hours', 300],
      ] as const
    ).map(([m, label, reward]) =>
      step(
        'Focus ' + label,
        'Spend ' + m + ' minutes on LeetCode during Focus sessions.',
        m,
        reward,
      ),
    ),
  },
]

// Where a quest chain stands today.
export function questState(q: DailyQuest, s: GameState, today: string) {
  const claimed = Math.min(q.steps.length, Number(s.quests[q.id]) || 0) // a legacy `true` counts as 1
  const done = claimed >= q.steps.length
  const cur = q.steps[Math.min(claimed, q.steps.length - 1)]
  const value = q.progress(s, today)
  // every step whose goal is reached but not yet claimed
  const ready = q.steps.slice(claimed).filter((x) => value >= x.goal)
  return {
    claimed,
    done,
    cur,
    prog: Math.min(cur.goal, value),
    met: !done && value >= cur.goal,
    ready,
  }
}

// Claims step `step` of a quest (only that step, so a double click can't pay twice).
export function claimDaily(
  s: GameState,
  questId: string,
  stepIndex: number,
  ctx: Ctx,
): GameState | null {
  const q = QUESTS.find((x) => x.id === questId)
  const { claimed, met } = q ? questState(q, s, ctx.today) : { claimed: -1, met: false }
  if (!q || stepIndex !== claimed || !met) return null
  let next: GameState = {
    ...s,
    quests: { ...s.quests, [questId]: claimed + 1 },
    shards: s.shards + q.steps[stepIndex].reward,
  }
  const perfect = QUESTS.every((x) => questState(x, next, ctx.today).done)
  if (perfect && next.stats.lastPerfectDay !== ctx.today) {
    next = {
      ...next,
      stats: { ...next.stats, perfectDays: next.stats.perfectDays + 1, lastPerfectDay: ctx.today },
    }
  }
  return next
}

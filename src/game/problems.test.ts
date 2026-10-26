import { describe, expect, it } from 'vitest'
import {
  addTag,
  claimAllProblems,
  claimProblem,
  createProblem,
  removeTag,
  updateProblem,
} from './problems'
import { SHARD_BY_DIFF } from './rules'
import { ctx, game, TODAY } from './test-helpers'

describe('problems', () => {
  it('counts a problem as solved once it has a solution', () => {
    const todo = createProblem(game(), { title: 'Two Sum', difficulty: 'Easy' }, ctx())
    expect(todo.state.problems[0].solvedAt).toBeNull()
    const solved = updateProblem(todo.state, todo.id, { code: 'return []' }, ctx())!
    expect(solved.problems[0].solvedAt).toBe(TODAY)
    const cleared = updateProblem(solved, todo.id, { code: '  ' }, ctx())!
    expect(cleared.problems[0].solvedAt).toBeNull()
  })

  it('pays a solved problem once, with team EXP', () => {
    const { state, id } = createProblem(
      game(),
      { title: 'A', difficulty: 'Hard', code: 'x' },
      ctx(),
    )
    const claimed = claimProblem(state, id, ctx())!
    expect(claimed.shards).toBe(SHARD_BY_DIFF.Hard)
    expect(claimed.state.shards).toBe(state.shards + SHARD_BY_DIFF.Hard)
    expect(claimed.state.problems[0]).toMatchObject({ claimed: true, claimedAt: TODAY })
    expect(claimProblem(claimed.state, id, ctx())).toBeNull()
  })

  it('claims every solved problem at once', () => {
    const c = ctx() // one random source, so each problem gets its own id
    let s = game()
    for (const difficulty of ['Easy', 'Medium'] as const) {
      s = createProblem(s, { title: difficulty, difficulty, code: 'x' }, c).state
    }
    s = createProblem(s, { title: 'todo' }, c).state
    const r = claimAllProblems(s, c)!
    expect(r.shards).toBe(SHARD_BY_DIFF.Easy + SHARD_BY_DIFF.Medium)
    expect(r.state.problems.filter((p) => p.claimed)).toHaveLength(2)
  })

  it('adds custom tags once and strips removed ones from problems', () => {
    const added = addTag(game(), 'Monotonic Queue')!
    expect(added.id).toBe('monotonic-queue')
    expect(addTag(added.state, 'monotonic queue')!.state).toBe(added.state)
    const { state, id } = createProblem(
      added.state,
      { title: 'P', tags: [added.id, 'arrays'] },
      ctx(),
    )
    const removed = removeTag(state, added.id)!
    expect(removed.customTags).toEqual([])
    expect(removed.problems.find((p) => p.id === id)!.tags).toEqual(['arrays'])
  })
})

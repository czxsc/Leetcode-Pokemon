// Quiz logic, plus checks that keep the question bank well-formed as questions get added.
import { describe, expect, it } from 'vitest'
import { ALL_QUESTIONS, DECKS, deckQuestions, TAG_COLOR, TAG_LABEL } from './questions'
import { TWISTS } from './questions/twists'
import { changedLineCount, diffLines, isRight, norm, pickQuiz } from './quiz'

// a small repeatable random source, so dealing is deterministic
function seeded(seed = 1) {
  let x = seed
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

describe('norm', () => {
  it('ignores spacing, quote style and a trailing colon', () => {
    expect(norm('for i in  range(3) :')).toBe(norm('for i in range(3)'))
    expect(norm('d["a"]')).toBe(norm("d['a']"))
  })

  it('keeps spaces inside strings', () => {
    expect(norm("' '.join(a)")).not.toBe(norm("''.join(a)"))
  })

  it('ignores comments, but not a # inside a string', () => {
    expect(norm('x = 1  # note\ny = 2')).toBe(norm('x = 1\ny = 2'))
    expect(norm("node['#']")).toBe("node['#']")
  })

  it('ignores module names', () => {
    expect(norm('heapq.heappush(h, x)')).toBe(norm('heappush(h, x)'))
    expect(norm('math.gcd(a, b)')).toBe(norm('gcd(a, b)'))
  })
})

describe('isRight', () => {
  const q = { a: 'bisect_left(a, 3)', alt: [/^bisect_right\(a,(\w+)\)$/] }

  it('accepts the answer however it is written', () => {
    expect(isRight(q, 'bisect.bisect_left( a , 3 )')).toBe(true)
  })

  it('accepts an alternative', () => {
    expect(isRight(q, 'bisect_right(a, n)')).toBe(true)
  })

  it('accepts the expression assigned to a name, and a bare one for an assignment', () => {
    expect(isRight(q, 'i = bisect_left(a, 3)')).toBe(true)
    expect(isRight({ a: 'q = deque([root])' }, 'deque([root])')).toBe(true)
  })

  it('does not treat a comparison as an assignment', () => {
    expect(isRight({ a: 'y' }, 'x == y')).toBe(false)
  })

  it('rejects wrong and empty answers', () => {
    expect(isRight(q, 'bisect_left(a, 4)')).toBe(false)
    expect(isRight(q, '   ')).toBe(false)
  })
})

describe('diffLines', () => {
  it('marks unchanged, removed and added lines', () => {
    expect(diffLines('a\nb\nc', 'a\nx\nc')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'del', text: 'b' },
      { type: 'add', text: 'x' },
      { type: 'same', text: 'c' },
    ])
  })

  it('ignores trailing spaces', () => {
    expect(diffLines('a  ', 'a').map((r) => r.type)).toEqual(['same'])
  })

  it('handles whole blocks added at the end', () => {
    expect(diffLines('a', 'a\nb\nc').map((r) => r.type)).toEqual(['same', 'add', 'add'])
  })
})

describe('changedLineCount', () => {
  it('counts a replaced line once', () => {
    expect(changedLineCount('a\nb', 'a\nc')).toBe(1)
  })

  it('counts added lines', () => {
    expect(changedLineCount('a', 'a\nb\nc')).toBe(2)
  })

  it('is 0 for identical code', () => {
    expect(changedLineCount('a\nb', 'a\nb')).toBe(0)
  })
})

describe('pickQuiz', () => {
  const deal = (deck, asked = new Set(), seed = 7) =>
    pickQuiz(deck, { random: seeded(seed), asked })

  it('deals 10 questions from just the chosen deck', () => {
    for (const deck of DECKS) {
      const quiz = deal(deck.id)
      expect(quiz).toHaveLength(10)
      for (const q of quiz) expect(deck.tags).toContain(q.tag)
    }
  })

  it('deals a Mixed quiz in the proportions each deck asks for', () => {
    const quiz = deal('mixed')
    expect(quiz).toHaveLength(10)
    for (const deck of DECKS) {
      expect(quiz.filter((q) => deck.tags.includes(q.tag))).toHaveLength(deck.mix)
    }
  })

  it('never repeats a question within a quiz', () => {
    const quiz = deal('mixed')
    expect(new Set(quiz.map((q) => q.q + (q.code || '') + (q.base || ''))).size).toBe(10)
  })

  it('avoids questions already asked until the deck runs out', () => {
    const asked = new Set()
    const twists = deckQuestions(DECKS.find((d) => d.id === 'twists'))
    const seen = new Set()
    for (let i = 0; i < Math.floor(twists.length / 10); i++) {
      for (const q of deal('twists', asked, i + 1)) {
        expect(seen.has(q.id)).toBe(false)
        seen.add(q.id)
      }
    }
    // the deck has run out now, so it starts again rather than coming up short
    expect(deal('twists', asked)).toHaveLength(10)
  })

  it('moves the answer index along with shuffled options', () => {
    const q = deal('language')
    const original = new Map(ALL_QUESTIONS.map((x) => [x.q + (x.code || ''), x]))
    for (const shuffled of q) {
      const source = original.get(shuffled.q + (shuffled.code || ''))
      expect(shuffled.o[shuffled.a]).toBe(source.o[source.a])
      expect([...shuffled.o].sort()).toEqual([...source.o].sort())
    }
  })

  it('leaves ordered options in order', () => {
    for (const q of deal('complexity')) {
      if (!q.ordered) continue
      const source = ALL_QUESTIONS.find((x) => x.q === q.q && x.code === q.code)
      expect(q.o).toEqual(source.o)
    }
  })
})

describe('question bank', () => {
  // backticks mark code spans, so an odd number would render stray text
  const balanced = (text) => (text.match(/`/g) || []).length % 2 === 0

  it('gives every question a short explanation', () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.why, q.q).toBeTruthy()
      expect(q.why.length, q.q).toBeLessThanOrEqual(240)
    }
  })

  it('has balanced code spans in prompts and explanations', () => {
    for (const q of ALL_QUESTIONS) {
      expect(balanced(q.q), q.q).toBe(true)
      expect(balanced(q.why), q.why).toBe(true)
    }
  })

  it('has a label and color for every tag', () => {
    for (const q of ALL_QUESTIONS) {
      expect(TAG_LABEL[q.tag], q.tag).toBeTruthy()
      expect(TAG_COLOR[q.tag], q.tag).toBeTruthy()
    }
  })

  it('puts every question in exactly one deck', () => {
    for (const q of ALL_QUESTIONS) {
      expect(
        DECKS.filter((d) => d.tags.includes(q.tag)),
        q.q,
      ).toHaveLength(1)
    }
  })

  it('has no duplicate questions', () => {
    const keys = ALL_QUESTIONS.map((q) =>
      [q.q, q.code, q.base, q.kind === 'twist' ? q.a : ''].join(),
    )
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([])
  })

  it('has unique ids', () => {
    const ids = ALL_QUESTIONS.filter((q) => q.id).map((q) => q.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('has four distinct options and a valid answer on multiple choice', () => {
    for (const q of ALL_QUESTIONS.filter((x) => x.kind === 'choice')) {
      expect(q.o, q.q).toHaveLength(4)
      expect(new Set(q.o).size, q.q).toBe(4)
      expect(q.o[q.a], q.q).toBeDefined()
    }
  })

  it('accepts its own model answer on typed questions and twists', () => {
    for (const q of ALL_QUESTIONS.filter((x) => x.kind !== 'choice')) {
      expect(isRight(q, q.a), q.q).toBe(true)
    }
  })

  it('accepts every plain-text alternative on typed questions', () => {
    for (const q of ALL_QUESTIONS.filter((x) => x.kind === 'typed')) {
      for (const alt of q.alt || []) {
        if (typeof alt === 'string') expect(isRight(q, alt), alt).toBe(true)
      }
    }
  })

  it('requires a real edit on every twist', () => {
    for (const q of TWISTS) {
      expect(q.from, q.id).toBeTruthy()
      expect(isRight(q, q.base), q.id).toBe(false)
      expect(changedLineCount(q.base, q.a), q.id).toBeGreaterThan(0)
    }
  })
})

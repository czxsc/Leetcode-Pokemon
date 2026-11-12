// Recall quiz logic: dealing questions from a deck, checking typed answers and diffing edited code.
import { DECKS, deckQuestions, MIXED } from './questions'

const QUIZ_LEN = 10

// Calling heapq.heappush or heappush is the same answer, so module names don't count
const MODULE_PREFIX = /\b(?:heapq|bisect|collections|itertools|functools|math|operator)\./g

// Drop whitespace and comments (outside quotes) and semicolons, treat " as ', ignore module names and
// make a trailing ':' optional, so layout and quote style don't change the result.
export function norm(src) {
  const s = String(src).replace(MODULE_PREFIX, '').replace(/"/g, "'")
  let out = '',
    inStr = false,
    inComment = false
  for (const ch of s) {
    if (inComment) {
      if (ch === '\n') inComment = false
      continue
    }
    if (ch === "'") inStr = !inStr
    if (!inStr && ch === '#') {
      inComment = true
      continue
    }
    if (!inStr && (/\s/.test(ch) || ch === ';')) continue
    out += ch
  }
  return out.replace(/:$/, '')
}

// "x = bisect_left(a, 3)" answers "bisect_left(a, 3)", and the other way round
const dropAssignment = (s) => s.replace(/^\w+=(?!=)/, '')

export function isRight(q, input) {
  const got = norm(input)
  if (!got) return false
  return [q.a, ...(q.alt || [])].some((x) => {
    if (x instanceof RegExp) return x.test(got)
    const want = norm(x)
    return want === got || dropAssignment(want) === dropAssignment(got)
  })
}

// Line diff (longest common subsequence), good enough for snippets of a few dozen lines.
// Returns rows of { type: 'same' | 'add' | 'del', text }. Trailing spaces don't count as changes.
export function diffLines(from, to) {
  const a = String(from).split('\n')
  const b = String(to).split('\n')
  const same = (i, j) => a[i].trimEnd() === b[j].trimEnd()
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = same(i, j) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }
  const rows = []
  let i = 0,
    j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && same(i, j)) {
      rows.push({ type: 'same', text: b[j] })
      i++
      j++
    } else if (i < a.length && (j >= b.length || lcs[i + 1][j] >= lcs[i][j + 1])) {
      rows.push({ type: 'del', text: a[i++] })
    } else {
      rows.push({ type: 'add', text: b[j++] })
    }
  }
  return rows
}

// Roughly how many lines an edit touches: a replaced line counts once
export function changedLineCount(from, to) {
  const rows = diffLines(from, to)
  const count = (type) => rows.filter((r) => r.type === type).length
  return Math.max(count('add'), count('del'))
}

export function shuffle(arr, random = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Most options are written with the answer in a fixed spot, so shuffle them when dealing.
// `ordered` questions run from cheapest to most expensive and read better left as they are.
function withShuffledOptions(q, random) {
  if (q.kind !== 'choice' || q.ordered) return q
  const order = shuffle(
    q.o.map((_, i) => i),
    random,
  )
  return { ...q, o: order.map((i) => q.o[i]), a: order.indexOf(q.a) }
}

// Takes n questions, preferring ones not yet asked. Once a pool runs out, it starts over.
function draw(pool, n, asked, random) {
  const fresh = shuffle(
    pool.filter((q) => !asked.has(q)),
    random,
  )
  if (fresh.length < n) pool.forEach((q) => asked.delete(q))
  const rest = shuffle(
    pool.filter((q) => !fresh.includes(q)),
    random,
  )
  const picked = [...fresh, ...rest].slice(0, n)
  picked.forEach((q) => asked.add(q))
  return picked
}

// Questions already asked this session, so "Again" serves new ones instead of repeats
const sessionAsked = new Set()

export function pickQuiz(deckId = MIXED.id, { random = Math.random, asked = sessionAsked } = {}) {
  const deck = DECKS.find((d) => d.id === deckId)
  const picks = deck
    ? draw(deckQuestions(deck), QUIZ_LEN, asked, random)
    : DECKS.flatMap((d) => draw(deckQuestions(d), d.mix, asked, random))
  return shuffle(picks, random).map((q) => withShuffledOptions(q, random))
}

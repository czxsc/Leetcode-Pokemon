import { CHOICE, TYPED } from './questions'

// questions per quiz, and how many of them are typed answers
const QUIZ_LEN = 10,
  TYPED_PER_QUIZ = 5

// Drop whitespace (outside quotes) and semicolons, treat " as ', and make a trailing ':' optional —
// so spacing, quote style and one-line vs two-line layout don't change the result.
export function norm(src) {
  const s = String(src).replace(/"/g, "'")
  let out = '',
    inStr = false
  for (const ch of s) {
    if (ch === "'") inStr = !inStr
    if (!inStr && (/\s/.test(ch) || ch === ';')) continue
    out += ch
  }
  return out.replace(/:$/, '')
}

export function isRight(q, input) {
  const got = norm(input)
  if (!got) return false
  return [q.a, ...(q.alt || [])].some((x) => (x instanceof RegExp ? x.test(got) : norm(x) === got))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickQuiz() {
  return shuffle([
    ...shuffle(TYPED).slice(0, TYPED_PER_QUIZ),
    ...shuffle(CHOICE).slice(0, QUIZ_LEN - TYPED_PER_QUIZ),
  ])
}

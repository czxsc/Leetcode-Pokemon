// The Recall question bank: every question, how they group into decks, and how tags are shown.
import { CHOICE, TYPED } from './basics'
import { COMPLEXITY } from './complexity'
import { LANGUAGE } from './language'
import { LIBRARY } from './library'
import { STRUCTURES } from './structures'
import { TWISTS } from './twists'

export const ALL_QUESTIONS = [
  ...CHOICE,
  ...TYPED,
  ...COMPLEXITY,
  ...LANGUAGE,
  ...STRUCTURES,
  ...LIBRARY,
  ...TWISTS,
]

// A deck is the set of question tags it deals from. `mix` is how many of each deck a Mixed quiz takes:
// syntax-heavy on purpose, and only one twist since those take the longest.
export const DECKS = [
  {
    id: 'complexity',
    label: 'Time Complexity',
    blurb: 'Read the code, name the Big-O',
    tags: ['complexity', 'cost', 'bigo'],
    mix: 3,
  },
  {
    id: 'language',
    label: 'Language',
    blurb: 'Python and language features, and what prints',
    tags: ['lang', 'output'],
    mix: 1,
  },
  {
    id: 'structures',
    label: 'Data Structures',
    blurb: 'Which one fits the problem, and why',
    tags: ['dsa', 'pseudo'],
    mix: 1,
  },
  {
    id: 'syntax',
    label: 'Syntax',
    blurb: 'Type it: bisect, heapq, collections, itertools',
    tags: ['lib', 'code', 'loop', 'ds', 'syntax'],
    mix: 4,
  },
  {
    id: 'twists',
    label: 'Twists',
    blurb: 'Edit a classic solution for a new rule',
    tags: ['twist'],
    mix: 1,
  },
]

export const MIXED = { id: 'mixed', label: 'Mixed', blurb: 'A bit of everything' }

export function deckQuestions(deck) {
  return ALL_QUESTIONS.filter((q) => deck.tags.includes(q.tag))
}

export const TAG_LABEL = {
  syntax: 'Syntax',
  bigo: 'Big-O',
  pseudo: 'Pseudocode',
  code: 'Python · Type it',
  loop: 'Loops · Type it',
  ds: 'Data Structures · Type it',
  complexity: 'Time Complexity',
  cost: 'Python Costs',
  lang: 'Language',
  output: 'What Prints?',
  dsa: 'Data Structures',
  lib: 'Library · Type it',
  twist: 'Twist · Edit it',
}

export const TAG_COLOR = {
  syntax: 'var(--sky)',
  bigo: 'var(--lav)',
  pseudo: 'var(--pink)',
  code: 'var(--sage-deep)',
  loop: 'var(--coin-deep)',
  ds: 'var(--shard-deep)',
  complexity: 'var(--lav)',
  cost: 'var(--lav)',
  lang: 'var(--sky)',
  output: 'var(--pink)',
  dsa: 'var(--shard-deep)',
  lib: 'var(--sage-deep)',
  twist: 'var(--coin-deep)',
}

/* =====================================================================
   Import for saves from PokéLeet v5 and earlier, which kept everything
   in localStorage ("pokeleet_v5") and tied problems to a hard-coded
   NeetCode list. Game progress carries over as-is, problems created in
   the old app become tagged problems, and old claims / solve dates are
   applied to library problems that kept their old id.
===================================================================== */
import { oneLine, slugify, tagList } from '../shared/catalog.js'

export const LEGACY_KEY = 'pokeleet_v5'

const GAME_KEYS = [
  'shards', 'coins', 'megaStones', 'gmaxStones', 'owned', 'team', 'quests',
  'recallBest', 'recallToday', 'pity', 'epicPity', 'totalPulls',
  'guaranteedLegendary', 'guaranteedEpic', 'legendaryTargetPity', 'epicTargetPityCount',
  'meadow', 'lastDay',
]

// Built-in problem sets of the old app -> default tags.
const OLD_SET_TAGS = {
  arrays: 'arrays', twoptr: 'two-pointers', sliding: 'sliding-window', binsearch: 'binary-search',
  stack: 'stack', trees: 'trees', graphs: 'graphs', dp1: 'dp', dp2: 'dp', greedy: 'greedy',
  backtrack: 'backtracking', linked: 'linked-list', heap: 'heap', tries: 'tries',
  advgraph: 'graphs', intervals: 'intervals', mathgeo: 'math', bit: 'bit-manipulation',
}

export function isLegacyState(state) {
  return !!state && typeof state === 'object' && state.v === 5
}

export function readLegacyState() {
  try {
    const state = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null')
    return isLegacyState(state) ? state : null
  } catch {
    return null
  }
}

// Old custom ids end in a base-36 timestamp ("cust-arrays-lx8k2m1c").
function createdAtFromId(id) {
  const ms = parseInt(String(id).split('-').pop(), 36)
  return new Date(Number.isFinite(ms) && ms > 1e12 && ms < 1e14 ? ms : Date.now()).toISOString()
}

export function importLegacyState(legacy, library) {
  const progress = {}
  for (const key of GAME_KEYS) if (legacy[key] !== undefined) progress[key] = legacy[key]
  if (progress.guaranteedLegendary === undefined && legacy.guaranteedTarget) {
    progress.guaranteedLegendary = legacy.guaranteedTarget
  }
  if (progress.legendaryTargetPity === undefined && typeof legacy.targetPity === 'number') {
    progress.legendaryTargetPity = legacy.targetPity
  }

  const solved = legacy.solved || {}
  const claims = legacy.claims || {}
  const solveDates = legacy.solveDates || {}
  const claimDates = legacy.claimDates || {}

  const problems = ((library && library.problems) || []).map((p) => {
    if (!claims[p.id] && !solveDates[p.id]) return p
    const solvedAt = p.solvedAt ? solveDates[p.id] || p.solvedAt : p.solvedAt
    const claimed = !!(p.claimed || claims[p.id])
    return { ...p, solvedAt, claimed, claimedAt: p.claimedAt || (claimed ? claimDates[p.id] || solvedAt || null : null) }
  })

  // Custom problem sets become custom tags.
  const customTags = [...((library && library.customTags) || [])]
  const known = new Set(tagList(customTags).map((tag) => tag.id))
  const tagForSet = { ...OLD_SET_TAGS }
  for (const set of legacy.customCategories || []) {
    const id = slugify(set && set.name, 40)
    if (!id) continue
    if (!known.has(id)) {
      customTags.push({ id, name: oneLine(set.name) })
      known.add(id)
    }
    tagForSet[set.id] = id
  }

  const ids = new Set(problems.map((p) => p.id))
  for (const [setId, list] of Object.entries(legacy.customProblems || {})) {
    for (const old of list || []) {
      if (!old || !old.id || ids.has(old.id)) continue
      ids.add(old.id)
      const solvedAt = solved[old.id] ? solveDates[old.id] || legacy.lastDay || null : null
      problems.push({
        id: old.id,
        title: oneLine(old.name) || 'Untitled',
        difficulty: old.diff || 'Medium',
        tags: tagForSet[setId] ? [tagForSet[setId]] : [],
        language: 'python',
        code: '',
        url: '',
        createdAt: createdAtFromId(old.id),
        solvedAt,
        claimed: !!claims[old.id],
        claimedAt: claims[old.id] ? claimDates[old.id] || solvedAt : null,
      })
    }
  }

  return { progress, library: { ...(library || {}), problems, customTags } }
}

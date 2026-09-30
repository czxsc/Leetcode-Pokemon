/* =====================================================================
   Save migrations.

   The store used to accept a save only when `state.v === 5` and silently
   reseed a fresh account otherwise. That meant any future schema bump would
   wipe every player's progress. Saves are now upgraded step by step instead:
   each migration takes a state at version N and returns one at version N+1.

   Rules:
   - Migrations must be pure and defensive. They run against real saves that
     may be missing fields entirely.
   - Never delete a migration once it has shipped.
   - Bump CURRENT_VERSION and add an entry to MIGRATIONS in the same commit as
     any breaking shape change.
===================================================================== */

export const CURRENT_VERSION = 6

/* ---------------------------------------------------------------------
   v5 -> v6: problem ids became content-derived slugs.

   Old ids were `category + '-' + globalIndex`, where globalIndex was a single
   counter shared across all 18 categories. Inserting a problem anywhere
   shifted every id after it, rebinding saved progress onto the wrong
   problems. This map is generated from the v5 definition order in data.jsx
   and is frozen — do not regenerate it after new problems are added.
--------------------------------------------------------------------- */
const V5_TO_V6_PROBLEM_IDS = {
  'arrays-0': 'arrays-two-sum',
  'arrays-1': 'arrays-valid-anagram',
  'arrays-2': 'arrays-group-anagrams',
  'arrays-3': 'arrays-top-k-frequent-elements',
  'arrays-4': 'arrays-product-of-array-except-self',
  'arrays-5': 'arrays-contains-duplicate',
  'arrays-6': 'arrays-longest-consecutive-sequence',
  'arrays-7': 'arrays-encode-and-decode-strings',
  'arrays-8': 'arrays-valid-sudoku',
  'twoptr-9': 'twoptr-valid-palindrome',
  'twoptr-10': 'twoptr-two-sum-ii',
  'twoptr-11': 'twoptr-3sum',
  'twoptr-12': 'twoptr-container-with-most-water',
  'twoptr-13': 'twoptr-trapping-rain-water',
  'sliding-14': 'sliding-best-time-to-buy-sell-stock',
  'sliding-15': 'sliding-longest-substring-w-o-repeat',
  'sliding-16': 'sliding-longest-repeating-char-replacement',
  'sliding-17': 'sliding-permutation-in-string',
  'sliding-18': 'sliding-minimum-window-substring',
  'sliding-19': 'sliding-sliding-window-maximum',
  'binsearch-20': 'binsearch-binary-search',
  'binsearch-21': 'binsearch-search-a-2d-matrix',
  'binsearch-22': 'binsearch-koko-eating-bananas',
  'binsearch-23': 'binsearch-find-min-in-rotated-array',
  'binsearch-24': 'binsearch-search-in-rotated-array',
  'binsearch-25': 'binsearch-time-based-key-value-store',
  'binsearch-26': 'binsearch-median-of-two-sorted-arrays',
  'stack-27': 'stack-valid-parentheses',
  'stack-28': 'stack-min-stack',
  'stack-29': 'stack-daily-temperatures',
  'stack-30': 'stack-evaluate-reverse-polish-notation',
  'stack-31': 'stack-generate-parentheses',
  'stack-32': 'stack-car-fleet',
  'stack-33': 'stack-largest-rectangle-in-histogram',
  'trees-34': 'trees-invert-binary-tree',
  'trees-35': 'trees-maximum-depth-of-binary-tree',
  'trees-36': 'trees-diameter-of-binary-tree',
  'trees-37': 'trees-balanced-binary-tree',
  'trees-38': 'trees-same-tree',
  'trees-39': 'trees-lowest-common-ancestor-of-bst',
  'trees-40': 'trees-binary-tree-level-order-traversal',
  'trees-41': 'trees-validate-bst',
  'trees-42': 'trees-kth-smallest-in-bst',
  'trees-43': 'trees-construct-tree-from-pre-inorder',
  'trees-44': 'trees-binary-tree-maximum-path-sum',
  'graphs-45': 'graphs-number-of-islands',
  'graphs-46': 'graphs-clone-graph',
  'graphs-47': 'graphs-course-schedule',
  'graphs-48': 'graphs-pacific-atlantic-water-flow',
  'graphs-49': 'graphs-rotting-oranges',
  'graphs-50': 'graphs-walls-and-gates',
  'graphs-51': 'graphs-max-area-of-island',
  'graphs-52': 'graphs-surrounded-regions',
  'graphs-53': 'graphs-graph-valid-tree',
  'graphs-54': 'graphs-word-ladder',
  'graphs-55': 'graphs-number-of-connected-components',
  'graphs-56': 'graphs-redundant-connection',
  'graphs-57': 'graphs-count-components',
  'dp1-58': 'dp1-climbing-stairs',
  'dp1-59': 'dp1-house-robber',
  'dp1-60': 'dp1-house-robber-ii',
  'dp1-61': 'dp1-coin-change',
  'dp1-62': 'dp1-longest-increasing-subsequence',
  'dp1-63': 'dp1-maximum-product-subarray',
  'dp1-64': 'dp1-word-break',
  'dp1-65': 'dp1-decode-ways',
  'dp1-66': 'dp1-partition-equal-subset-sum',
  'dp1-67': 'dp1-min-cost-climbing-stairs',
  'dp2-68': 'dp2-unique-paths',
  'dp2-69': 'dp2-longest-common-subsequence',
  'dp2-70': 'dp2-edit-distance',
  'dp2-71': 'dp2-coin-change-ii',
  'dp2-72': 'dp2-target-sum',
  'dp2-73': 'dp2-interleaving-string',
  'dp2-74': 'dp2-best-time-to-buy-sell-w-cooldown',
  'dp2-75': 'dp2-distinct-subsequences',
  'dp2-76': 'dp2-burst-balloons',
  'dp2-77': 'dp2-regular-expression-matching',
  'dp2-78': 'dp2-longest-palindromic-substring',
  'greedy-79': 'greedy-maximum-subarray',
  'greedy-80': 'greedy-jump-game',
  'greedy-81': 'greedy-jump-game-ii',
  'greedy-82': 'greedy-gas-station',
  'greedy-83': 'greedy-hand-of-straights',
  'greedy-84': 'greedy-merge-triplets-to-target',
  'greedy-85': 'greedy-partition-labels',
  'greedy-86': 'greedy-valid-parenthesis-string',
  'backtrack-87': 'backtrack-subsets',
  'backtrack-88': 'backtrack-combination-sum',
  'backtrack-89': 'backtrack-permutations',
  'backtrack-90': 'backtrack-subsets-ii',
  'backtrack-91': 'backtrack-word-search',
  'backtrack-92': 'backtrack-palindrome-partitioning',
  'backtrack-93': 'backtrack-letter-combinations-of-phone',
  'backtrack-94': 'backtrack-n-queens',
  'backtrack-95': 'backtrack-combination-sum-ii',
  'linked-96': 'linked-reverse-linked-list',
  'linked-97': 'linked-merge-two-sorted-lists',
  'linked-98': 'linked-linked-list-cycle',
  'linked-99': 'linked-reorder-list',
  'linked-100': 'linked-remove-nth-node-from-end',
  'linked-101': 'linked-copy-list-with-random-pointer',
  'linked-102': 'linked-add-two-numbers',
  'linked-103': 'linked-find-the-duplicate-number',
  'linked-104': 'linked-lru-cache',
  'linked-105': 'linked-merge-k-sorted-lists',
  'linked-106': 'linked-reverse-nodes-in-k-group',
  'heap-107': 'heap-kth-largest-element-in-stream',
  'heap-108': 'heap-last-stone-weight',
  'heap-109': 'heap-k-closest-points-to-origin',
  'heap-110': 'heap-kth-largest-element-in-array',
  'heap-111': 'heap-task-scheduler',
  'heap-112': 'heap-design-twitter',
  'heap-113': 'heap-find-median-from-data-stream',
  'tries-114': 'tries-implement-trie',
  'tries-115': 'tries-design-add-and-search-words',
  'tries-116': 'tries-word-search-ii',
  'advgraph-117': 'advgraph-network-delay-time',
  'advgraph-118': 'advgraph-min-cost-to-connect-points',
  'advgraph-119': 'advgraph-cheapest-flights-k-stops',
  'advgraph-120': 'advgraph-reconstruct-itinerary',
  'advgraph-121': 'advgraph-swim-in-rising-water',
  'advgraph-122': 'advgraph-alien-dictionary',
  'intervals-123': 'intervals-merge-intervals',
  'intervals-124': 'intervals-insert-interval',
  'intervals-125': 'intervals-non-overlapping-intervals',
  'intervals-126': 'intervals-meeting-rooms',
  'intervals-127': 'intervals-meeting-rooms-ii',
  'intervals-128': 'intervals-minimum-interval-to-include-query',
  'mathgeo-129': 'mathgeo-rotate-image',
  'mathgeo-130': 'mathgeo-spiral-matrix',
  'mathgeo-131': 'mathgeo-set-matrix-zeroes',
  'mathgeo-132': 'mathgeo-happy-number',
  'mathgeo-133': 'mathgeo-plus-one',
  'mathgeo-134': 'mathgeo-pow-x-n',
  'mathgeo-135': 'mathgeo-multiply-strings',
  'mathgeo-136': 'mathgeo-detect-squares',
  'bit-137': 'bit-single-number',
  'bit-138': 'bit-number-of-1-bits',
  'bit-139': 'bit-counting-bits',
  'bit-140': 'bit-reverse-bits',
  'bit-141': 'bit-missing-number',
  'bit-142': 'bit-sum-of-two-integers',
  'bit-143': 'bit-reverse-integer',
}

// Rewrite the keys of a `{ problemId: value }` map through `idMap`, leaving
// ids that aren't in the map (custom problems) untouched.
function remapKeys(obj, idMap) {
  if (!obj || typeof obj !== 'object') return {}
  const out = {}
  Object.entries(obj).forEach(([key, value]) => {
    out[idMap[key] || key] = value
  })
  return out
}

function migrate5to6(state) {
  const idMap = V5_TO_V6_PROBLEM_IDS
  return {
    ...state,
    solved: remapKeys(state.solved, idMap),
    solveDates: remapKeys(state.solveDates, idMap),
    claims: remapKeys(state.claims, idMap),
    claimDates: remapKeys(state.claimDates, idMap),
    syncedPaths: remapKeys(state.syncedPaths, idMap),
    v: 6,
  }
}

const MIGRATIONS = {
  5: migrate5to6,
}

/**
 * Upgrade a loaded save to CURRENT_VERSION.
 * Returns { ok, state, from, to, reason } — never throws.
 */
export function migrateState(state) {
  if (!state || typeof state !== 'object') {
    return { ok: false, state: null, reason: 'Save is empty or not an object.' }
  }

  const from = typeof state.v === 'number' ? state.v : null
  if (from === null) {
    return { ok: false, state: null, from, reason: 'Save has no version field.' }
  }
  if (from > CURRENT_VERSION) {
    // A newer build wrote this save. Refuse rather than mangle it, so the raw
    // copy stays recoverable if the player downgrades by mistake.
    return {
      ok: false,
      state: null,
      from,
      reason: `Save is from a newer version (v${from} > v${CURRENT_VERSION}).`,
    }
  }

  let current = state
  let version = from
  while (version < CURRENT_VERSION) {
    const migration = MIGRATIONS[version]
    if (!migration) {
      return {
        ok: false,
        state: null,
        from,
        reason: `No migration path from v${version} to v${version + 1}.`,
      }
    }
    try {
      current = migration(current)
    } catch (err) {
      return {
        ok: false,
        state: null,
        from,
        reason: `Migration v${version} -> v${version + 1} failed: ${err.message}`,
      }
    }
    version += 1
  }

  return { ok: true, state: current, from, to: CURRENT_VERSION }
}

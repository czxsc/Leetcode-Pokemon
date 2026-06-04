const SOLUTION_FILES = import.meta.glob('../Neetcode 150/**/*.py', {
  eager: true,
  import: 'default',
  query: '?raw',
})

const CATEGORY_ALIASES = {
  twopointers: ['twopointerproblems'],
}

const PROBLEM_ALIASES = {
  containsduplicate: ['containsduplicates'],
  containerwithmostwater: ['containerwmostwater'],
  threesum: ['threesum'],
  twosumii: ['twointegersumii'],
}

function normalize(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function dirname(path) {
  const parts = path.split('/')
  return parts[parts.length - 2] || ''
}

function basename(path) {
  const parts = path.split('/')
  return (parts[parts.length - 1] || '').replace(/\.[^.]+$/, '')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function candidateNames(name, aliases) {
  const norm = normalize(name)
  return unique([norm].concat((aliases && aliases[norm]) || []))
}

const FILES = Object.entries(SOLUTION_FILES).map(([path, code]) => ({
  code,
  folder: dirname(path),
  folderNorm: normalize(dirname(path)),
  name: basename(path),
  nameNorm: normalize(basename(path)),
  path: path.replace(/^\.\.\//, ''),
}))

export function createLocalSolutionSync() {
  function syncProblems(problems, categories) {
    const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]))
    const solvedIds = []
    const paths = {}
    const codeById = {}
    const usedPaths = new Set()

    problems.forEach((problem) => {
      const category = categoryById[problem.cat]
      if (!category) return

      const categoryCandidates = candidateNames(category.name, CATEGORY_ALIASES)
      const problemCandidates = candidateNames(problem.name, PROBLEM_ALIASES)
      const match = FILES.find(
        (file) =>
          categoryCandidates.includes(file.folderNorm) &&
          problemCandidates.includes(file.nameNorm),
      )

      if (!match) return

      solvedIds.push(problem.id)
      paths[problem.id] = match.path
      codeById[problem.id] = match.code
      usedPaths.add(match.path)
    })

    return {
      solvedIds,
      paths,
      codeById,
      matched: solvedIds.length,
      totalFiles: FILES.length,
      unmatched: FILES.filter((file) => !usedPaths.has(file.path)).length,
    }
  }

  return {
    normalize,
    rootLabel: 'Neetcode 150',
    syncProblems,
  }
}

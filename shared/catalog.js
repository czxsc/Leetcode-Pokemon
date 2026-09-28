/* =====================================================================
   Catalog — difficulties, default tags, languages and the rules for
   laying solution files out on disk. Shared by the browser app and the
   local storage server (server/storage.js), so keep it dependency-free.
===================================================================== */

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

// Common LeetCode topics. Every tag gets its own folder under
// data/solutions/, named after the tag id.
export const DEFAULT_TAGS = [
  { id: 'arrays', name: 'Arrays' },
  { id: 'hash-table', name: 'Hash Table' },
  { id: 'strings', name: 'Strings' },
  { id: 'two-pointers', name: 'Two Pointers' },
  { id: 'sliding-window', name: 'Sliding Window' },
  { id: 'stack', name: 'Stack' },
  { id: 'binary-search', name: 'Binary Search' },
  { id: 'linked-list', name: 'Linked List' },
  { id: 'trees', name: 'Trees' },
  { id: 'tries', name: 'Tries' },
  { id: 'heap', name: 'Heap / Priority Queue' },
  { id: 'backtracking', name: 'Backtracking' },
  { id: 'graphs', name: 'Graphs' },
  { id: 'bfs', name: 'BFS' },
  { id: 'dfs', name: 'DFS' },
  { id: 'dp', name: 'Dynamic Programming' },
  { id: 'greedy', name: 'Greedy' },
  { id: 'intervals', name: 'Intervals' },
  { id: 'sorting', name: 'Sorting' },
  { id: 'math', name: 'Math & Geometry' },
  { id: 'bit-manipulation', name: 'Bit Manipulation' },
  { id: 'design', name: 'Design' },
]

// Folder for solved problems that have no tags.
export const UNTAGGED_FOLDER = 'untagged'

// `comment` is the line-comment prefix used for the header written at the
// top of each solution file (null = no header).
export const LANGUAGES = [
  { id: 'python', name: 'Python', ext: 'py', comment: '#' },
  { id: 'java', name: 'Java', ext: 'java', comment: '//' },
  { id: 'cpp', name: 'C++', ext: 'cpp', comment: '//' },
  { id: 'c', name: 'C', ext: 'c', comment: '//' },
  { id: 'csharp', name: 'C#', ext: 'cs', comment: '//' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', comment: '//' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', comment: '//' },
  { id: 'go', name: 'Go', ext: 'go', comment: '//' },
  { id: 'rust', name: 'Rust', ext: 'rs', comment: '//' },
  { id: 'kotlin', name: 'Kotlin', ext: 'kt', comment: '//' },
  { id: 'swift', name: 'Swift', ext: 'swift', comment: '//' },
  { id: 'ruby', name: 'Ruby', ext: 'rb', comment: '#' },
  { id: 'sql', name: 'SQL', ext: 'sql', comment: '--' },
  { id: 'other', name: 'Other', ext: 'txt', comment: null },
]

const LANGUAGE_BY_ID = new Map(LANGUAGES.map((lang) => [lang.id, lang]))

export function languageById(id) {
  return LANGUAGE_BY_ID.get(id) || LANGUAGE_BY_ID.get('other')
}

// Names Windows refuses to use for files or folders.
const RESERVED_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
])

// "Best Time to Buy & Sell Stock" -> "best-time-to-buy-and-sell-stock".
// Output only ever contains [a-z0-9-], so it is safe as a file or folder name.
export function slugify(text, maxLength = 80) {
  const slug = String(text || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '')
  return RESERVED_NAMES.has(slug) ? `${slug}-file` : slug
}

export function oneLine(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

// Default tags first (in catalog order), then the user's custom tags.
export function tagList(customTags) {
  const tags = DEFAULT_TAGS.map((tag) => ({ ...tag, custom: false }))
  const seen = new Set(tags.map((tag) => tag.id))
  for (const tag of customTags || []) {
    const id = tag && slugify(tag.id)
    if (!id || seen.has(id)) continue
    seen.add(id)
    tags.push({ id, name: oneLine(tag.name) || id, custom: true })
  }
  return tags
}

function solutionFileContent(problem, language, tagNames) {
  const code = problem.code.replace(/\r\n?/g, '\n').replace(/\s+$/, '') + '\n'
  if (!language.comment) return code
  const c = language.comment
  const header = [
    `${c} ${oneLine(problem.title)} (${oneLine(problem.difficulty)})`,
    `${c} Tags: ${tagNames.length ? tagNames.join(', ') : 'none'}`,
  ]
  if (problem.url) header.push(`${c} ${oneLine(problem.url)}`)
  return `${header.join('\n')}\n\n${code}`
}

// Every file the app keeps under data/solutions/: one copy of each solved
// problem's code in the folder of each of its tags.
// Returns [{ problemId, path: 'arrays/two-sum.py', content }].
export function solutionPlan(library) {
  const tags = tagList(library && library.customTags)
  const tagById = new Map(tags.map((tag) => [tag.id, tag]))
  const taken = new Set()
  const plan = []

  const problems = ((library && library.problems) || [])
    .filter((p) => p && typeof p.code === 'string' && p.code.trim())
    .sort((a, b) =>
      String(a.createdAt || '').localeCompare(String(b.createdAt || '')) ||
      String(a.id).localeCompare(String(b.id)))

  for (const problem of problems) {
    const language = languageById(problem.language)
    const folders = [...new Set((problem.tags || []).filter((id) => tagById.has(id)))]
    if (!folders.length) folders.push(UNTAGGED_FOLDER)

    // Same file name in every folder; add -2, -3... if another problem has it.
    const base = slugify(problem.title) || 'untitled'
    let name = `${base}.${language.ext}`
    for (let n = 2; folders.some((folder) => taken.has(`${folder}/${name}`)); n++) {
      name = `${base}-${n}.${language.ext}`
    }

    const tagNames = folders.filter((id) => tagById.has(id)).map((id) => tagById.get(id).name)
    const content = solutionFileContent(problem, language, tagNames)
    for (const folder of folders) {
      const path = `${folder}/${name}`
      taken.add(path)
      plan.push({ problemId: problem.id, path, content })
    }
  }
  return plan
}

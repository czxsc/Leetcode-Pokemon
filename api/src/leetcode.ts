/* =====================================================================
   Looks a problem up on LeetCode by its slug ("two-sum"). LeetCode's API
   doesn't allow calls from other web pages, so the browser asks the API
   (GET /api/leetcode?slug=...) and the API asks LeetCode.
===================================================================== */
import { HttpError } from './documents.ts'

const GRAPHQL_URL = 'https://leetcode.com/graphql'
const TIMEOUT_MS = 10000

const QUERY = `query question($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId title titleSlug difficulty isPaidOnly
    topicTags { name slug }
  }
}`

export interface LeetCodeProblem {
  number: string
  title: string
  slug: string
  difficulty: string
  paidOnly: boolean
  url: string
  tags: { name: string; slug: string }[]
}

export async function fetchLeetCodeProblem(slug: string): Promise<LeetCodeProblem> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) {
    throw new HttpError(400, 'That doesn’t look like a LeetCode problem link.')
  }

  let res
  try {
    res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: `https://leetcode.com/problems/${slug}/`,
      },
      body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new HttpError(
      502,
      'Couldn’t reach LeetCode. Check your internet connection and try again.',
    )
  }
  const body = await res.json().catch(() => null)
  if (!res.ok || !body)
    throw new HttpError(502, `LeetCode answered HTTP ${res.status}. Try again in a moment.`)

  const q = body.data?.question
  if (!q) throw new HttpError(404, `LeetCode has no problem called “${slug}”.`)
  return {
    number: q.questionFrontendId,
    title: q.title,
    slug: q.titleSlug,
    difficulty: q.difficulty,
    paidOnly: !!q.isPaidOnly,
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    tags: (q.topicTags || []).map((t: { name: string; slug: string }) => ({
      name: t.name,
      slug: t.slug,
    })),
  }
}

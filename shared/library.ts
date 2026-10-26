/* =====================================================================
   The problem library: the shape both the web app and the API agree on.
   The API validates every save against LibrarySchema; the web app's
   normalizer (src/game/state.ts) only ever produces data that passes it.
===================================================================== */
import { z } from 'zod'
import { DIFFICULTIES, LANGUAGES } from './catalog'

export const LIMITS = {
  idLength: 100,
  titleLength: 120,
  tagIdLength: 80,
  tagNameLength: 80,
  tagsPerProblem: 50,
  urlLength: 2048,
  codeLength: 200_000,
  problems: 5000,
  customTags: 500,
} as const

const languageIds = LANGUAGES.map((lang) => lang.id) as [string, ...string[]]
const day = z.iso.date()

export const ProblemSchema = z.object({
  id: z.string().min(1).max(LIMITS.idLength),
  title: z.string().min(1).max(LIMITS.titleLength),
  difficulty: z.enum(DIFFICULTIES),
  tags: z.array(z.string().min(1).max(LIMITS.tagIdLength)).max(LIMITS.tagsPerProblem),
  language: z.enum(languageIds),
  code: z.string().max(LIMITS.codeLength),
  url: z.string().max(LIMITS.urlLength),
  createdAt: z.iso.datetime(),
  solvedAt: day.nullable(),
  claimed: z.boolean(),
  claimedAt: day.nullable(),
})

export const CustomTagSchema = z.object({
  id: z.string().min(1).max(LIMITS.tagIdLength),
  name: z.string().min(1).max(LIMITS.tagNameLength),
})

export const LibrarySchema = z.object({
  problems: z.array(ProblemSchema).max(LIMITS.problems),
  customTags: z.array(CustomTagSchema).max(LIMITS.customTags),
})

export type Problem = z.infer<typeof ProblemSchema>
export type CustomTag = z.infer<typeof CustomTagSchema>
export type Library = z.infer<typeof LibrarySchema>

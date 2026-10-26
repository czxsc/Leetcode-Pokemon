/* =====================================================================
   The problem library: the shape both the web app and the API agree on.
   The API validates every save against LibrarySchema; the web app's
   normalizer (src/game/state.ts) only ever produces data that passes it.
===================================================================== */
import { z } from 'zod'
import { DIFFICULTIES, LANGUAGES, LIMITS } from './catalog.ts'

const unique = (keys: string[]) => new Set(keys).size === keys.length

const languageIds = LANGUAGES.map((lang) => lang.id) as [string, ...string[]]
const day = z.iso.date()

export const ProblemSchema = z.object({
  id: z.string().min(1).max(LIMITS.idLength),
  title: z.string().min(1).max(LIMITS.titleLength),
  difficulty: z.enum(DIFFICULTIES),
  tags: z
    .array(z.string().min(1).max(LIMITS.tagIdLength))
    .max(LIMITS.tagsPerProblem)
    .refine(unique, 'tags must not repeat'),
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
  problems: z
    .array(ProblemSchema)
    .max(LIMITS.problems)
    .refine((list) => unique(list.map((p) => p.id)), 'problem ids must be unique'),
  customTags: z
    .array(CustomTagSchema)
    .max(LIMITS.customTags)
    .refine((list) => unique(list.map((t) => t.id)), 'custom tag ids must be unique'),
})

export type Problem = z.infer<typeof ProblemSchema>
export type CustomTag = z.infer<typeof CustomTagSchema>
export type Library = z.infer<typeof LibrarySchema>

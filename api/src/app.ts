/* =====================================================================
   The HTTP API, shared by the local app (api/src/local) and the cloud
   (api/src/lambda.ts). Each of those decides where documents are stored
   and who the user is; the routes here don't know or care.

     GET /api/data             -> { mode, location, progress, library }
     PUT /api/progress         <- { rev, data }  -> { rev, savedAt }
     PUT /api/library          <- { rev, data }  -> { rev, savedAt, warning }
     GET /api/leetcode?slug=   -> { problem }    (title, difficulty, tags...)

   Every JSON response carries `api: 'pokeleet'`, so the web app can tell
   it apart from a static host answering with a web page.
===================================================================== */
import { type Context, Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'
import { type Library, LibrarySchema } from '../../shared/library.ts'
import { type DocumentStore, HttpError } from './documents.ts'
import type { LeetCodeProblem } from './leetcode.ts'

// A progress document is stored as one DynamoDB item (max 400 KB) in the cloud.
export const PROGRESS_MAX_BYTES = 350_000
const BODY_MAX_BYTES = 5_000_000

export interface AppOptions {
  stores: { progress: DocumentStore<object>; library: DocumentStore<Library> }
  // the signed-in user's id, or null (-> 401)
  identify: (c: Context) => string | null
  lookup: (slug: string) => Promise<LeetCodeProblem>
  mode: 'local' | 'cloud'
  location: string // where the data lives, as shown to the user
}

const SaveBody = z.object({ rev: z.number().int().min(0), data: z.unknown() })

const ProgressSchema = z
  .record(z.string(), z.unknown())
  .refine((data) => JSON.stringify(data).length <= PROGRESS_MAX_BYTES, {
    message: `progress must be at most ${PROGRESS_MAX_BYTES} bytes`,
  })

const send = (c: Context, body: object, status: ContentfulStatusCode = 200) => {
  c.header('Cache-Control', 'no-store')
  return c.json({ api: 'pokeleet', ...body }, status)
}

function zodMessage(err: z.ZodError) {
  const issue = err.issues[0]
  return `${issue.path.join('.') || 'body'}: ${issue.message}`
}

export function createApp({ stores, identify, lookup, mode, location }: AppOptions) {
  const app = new Hono<{ Variables: { userId: string } }>().basePath('/api')

  // Every route acts on behalf of a user.
  app.use(async (c, next) => {
    const userId = identify(c)
    if (!userId) return send(c, { error: 'Sign in to continue.' }, 401)
    c.set('userId', userId)
    await next()
  })

  app.get('/data', async (c) => {
    const userId = c.get('userId')
    const [progress, library] = await Promise.all([
      stores.progress.load(userId),
      stores.library.load(userId),
    ])
    return send(c, { mode, location, progress, library })
  })

  app.put(
    '/:doc{progress|library}',
    bodyLimit({
      maxSize: BODY_MAX_BYTES,
      onError: (c) => send(c, { error: 'Request body is too large' }, 413),
    }),
    async (c) => {
      if (!(c.req.header('content-type') || '').includes('application/json')) {
        return send(c, { error: 'Expected a JSON body' }, 415)
      }
      const body = SaveBody.parse(await c.req.json().catch(() => null))
      const userId = c.get('userId')
      const result =
        c.req.param('doc') === 'library'
          ? await stores.library.save(userId, LibrarySchema.parse(body.data), body.rev)
          : await stores.progress.save(userId, ProgressSchema.parse(body.data), body.rev)
      return send(c, result)
    },
  )

  app.get('/leetcode', async (c) => send(c, { problem: await lookup(c.req.query('slug') || '') }))

  app.notFound((c) => send(c, { error: `No API route for ${c.req.method} ${c.req.path}` }, 404))

  app.onError((err, c) => {
    if (err instanceof z.ZodError) return send(c, { error: zodMessage(err) }, 400)
    if (err instanceof HttpError) {
      const extra = 'rev' in err ? { rev: err.rev } : {}
      return send(c, { error: err.message, ...extra }, err.status as ContentfulStatusCode)
    }
    console.error('[pokeleet-api]', err)
    return send(c, { error: err.message || 'Something went wrong.' }, 500)
  })

  return app
}

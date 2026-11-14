/* =====================================================================
   The HTTP API, shared by the local app (api/src/local) and the cloud
   (api/src/lambda.ts). Each of those decides where documents are stored
   and who the user is; the routes here don't know or care.

     GET /api/data             -> { mode, location, progress, library }
     PUT /api/progress         <- { rev, data }  -> { rev, savedAt }
     PUT /api/library          <- { rev, data }  -> { rev, savedAt, warning }
     GET /api/leetcode?slug=   -> { problem }    (title, difficulty, tags...)
     POST /api/wake            -> { awake }      (resumes a paused database ahead of a save)
     DELETE /api/account       -> { deleted }    (cloud only: the account and its data)

   Every JSON response carries `api: 'pokeleet'`, so the web app can tell
   it apart from a static host answering with a web page.
===================================================================== */
import { type Context, Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'
import { type Library, LibrarySchema } from '../../shared/library.ts'
import { type DocumentStore, type ErasableStore, HttpError } from './documents.ts'
import type { LeetCodeProblem } from './leetcode.ts'

// A progress document is stored as one DynamoDB item (max 400 KB) in the cloud.
export const PROGRESS_MAX_BYTES = 350_000
const BODY_MAX_BYTES = 5_000_000

export type AppOptions = {
  // the signed-in user's id, or null (-> 401)
  identify: (c: Context) => string | null
  lookup: (slug: string) => Promise<LeetCodeProblem>
  mode: 'local' | 'cloud'
  location: string // where the data lives, as shown to the user
} & (
  | { stores: { progress: DocumentStore<object>; library: DocumentStore<Library> } }
  | {
      stores: { progress: ErasableStore<object>; library: ErasableStore<Library> }
      // Cloud only: deletes the user's sign-in once their data is gone. Without
      // it there's no DELETE /api/account (the local app has no accounts).
      deleteSignIn: (c: Context) => Promise<void>
    }
)

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

export function createApp(options: AppOptions) {
  const { stores, identify, lookup, mode, location } = options
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

  // 503 while still waking, like any other route
  app.post('/wake', async (c) => {
    await Promise.all([stores.progress.wake?.(), stores.library.wake?.()])
    return send(c, { awake: true })
  })

  if ('deleteSignIn' in options) {
    const { stores, deleteSignIn } = options
    // Data first: if deleting the sign-in then fails, the user can try again.
    app.delete('/account', async (c) => {
      const userId = c.get('userId')
      await Promise.all([stores.progress.remove(userId), stores.library.remove(userId)])
      await deleteSignIn(c)
      return send(c, { deleted: true })
    })
  }

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

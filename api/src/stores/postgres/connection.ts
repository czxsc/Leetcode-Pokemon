/* =====================================================================
   Postgres over a real connection, as in the cloud: Aurora's express
   configuration has no VPC and is reached through its internet access
   gateway, over TLS, signing in with short-lived IAM tokens instead of
   a password.

   Every call opens its own connection and closes it afterwards. Aurora
   only pauses while nobody is connected, and a Lambda that's kept warm
   would otherwise hold a connection open between requests.
===================================================================== */
import { Signer } from '@aws-sdk/rds-signer'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import type { Library } from '../../../../shared/library.ts'
import { type ErasableStore, UnavailableError } from '../../documents.ts'
import { createPostgresLibraryStore } from './library-store.ts'

const PORT = 5432
// While the database wakes up from a pause, connecting just waits. Giving up
// well before the Lambda's timeout answers 503 sooner, so the app tries
// again sooner; a normal connection takes well under a second.
const CONNECT_TIMEOUT_MS = 5_000

// Signs in as `user` with an IAM token (the caller needs rds-db:connect for that user).
export function iamAuth({
  host,
  database,
  user,
}: {
  host: string
  database: string
  user: string
}) {
  const signer = new Signer({ hostname: host, port: PORT, username: user })
  return {
    host,
    port: PORT,
    database,
    user,
    password: () => signer.getAuthToken(),
    ssl: true,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  } satisfies pg.ClientConfig
}

// SQLSTATE class 28: invalid authorization (wrong user, password or token)
const isAuthError = (err: unknown) => /^28/.test(String((err as { code?: unknown }).code ?? ''))

// Runs `fn` on a fresh connection and always closes it.
export async function withConnection<T>(
  config: pg.ClientConfig,
  fn: (db: NodePgDatabase, client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client(config)
  try {
    await client.connect()
  } catch (err) {
    // Bad credentials are a bug. Anything else means the database is out of
    // reach for now, most often because it's resuming from a pause.
    if (isAuthError(err)) throw err
    console.warn('[pokeleet-api] database unreachable:', (err as Error).message)
    throw new UnavailableError({ cause: err })
  }
  try {
    return await fn(drizzle(client), client)
  } finally {
    await client.end().catch(() => {})
  }
}

export function postgresLibraryStore(config: pg.ClientConfig): ErasableStore<Library> {
  const run = <T>(fn: (store: ErasableStore<Library>) => Promise<T>) =>
    withConnection(config, (db) => fn(createPostgresLibraryStore(db)))
  return {
    load: (userId) => run((store) => store.load(userId)),
    save: (userId, data, baseRev) => run((store) => store.save(userId, data, baseRev)),
    remove: (userId) => run((store) => store.remove(userId)),
    // trying to connect is what resumes a paused database
    wake: () => withConnection(config, async () => {}),
  }
}

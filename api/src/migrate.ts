/* =====================================================================
   Sets up the cloud database: creates the app's database if it's missing,
   applies the SQL migrations in api/drizzle/, then sets up the API's own
   database user. Runs as a Lambda after every deploy that changes it (a
   CDK trigger in infra/lib/database.ts), signed in as the master user;
   whatever is already in place is skipped.
===================================================================== */
import path from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import type pg from 'pg'
import { UnavailableError } from './documents.ts'
import { iamAuth, withConnection } from './stores/postgres/connection.ts'

const RETRY_WAIT_MS = 5000
const TRIES = 40 // a new or paused database can take a while to accept connections
const MAINTENANCE_DB = 'postgres' // exists on every PostgreSQL server

// Names go into SQL as identifiers, which can't be query parameters.
function identifier(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Unexpected database name: ${name}`)
  return name
}

// Aurora's express configuration can't create a database along with the
// cluster, so the first run creates it. `client` is connected to another
// database (CREATE DATABASE can't run inside a transaction or a DO block).
export async function ensureDatabase(client: pg.Client, name: string) {
  const { rowCount } = await client.query('SELECT FROM pg_database WHERE datname = $1', [name])
  if (!rowCount) await client.query(`CREATE DATABASE ${identifier(name)}`)
}

// The API's user signs in with IAM only (rds_iam) and may only read and
// write the app's tables. Safe to run again: it only adds what's missing.
export async function grantAppAccess(client: pg.Client, user: string) {
  identifier(user)
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${user}') THEN CREATE ROLE ${user} LOGIN; END IF;
    END $$;
    GRANT rds_iam TO ${user};
    GRANT USAGE ON SCHEMA public TO ${user};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${user};
  `)
}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

export async function handler() {
  const migrationsFolder = path.join(process.env.LAMBDA_TASK_ROOT || '.', 'drizzle')
  const signIn = (database: string) =>
    iamAuth({ host: env('DB_HOST'), database, user: env('DB_USER') })
  for (let attempt = 1; ; attempt++) {
    try {
      await withConnection(signIn(MAINTENANCE_DB), (_db, client) =>
        ensureDatabase(client, env('DB_NAME')),
      )
      return await withConnection(signIn(env('DB_NAME')), async (db, client) => {
        await migrate(db, { migrationsFolder })
        await grantAppAccess(client, env('DB_APP_USER'))
        return { ok: true }
      })
    } catch (err) {
      if (!(err instanceof UnavailableError) || attempt >= TRIES) throw err
      await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT_MS))
    }
  }
}

/* =====================================================================
   Applies the SQL migrations in api/drizzle/ to the cloud database.
   Runs as a Lambda after every deploy that changes it (a CDK trigger in
   infra/lib/database.ts); already-applied migrations are skipped.
===================================================================== */
import path from 'node:path'
import { migrate } from 'drizzle-orm/aws-data-api/pg/migrator'
import { dataApiDb, isResuming } from './stores/postgres/data-api.ts'

const RESUME_WAIT_MS = 5000
const RESUME_TRIES = 24 // a paused database takes a few seconds to wake up

export async function handler() {
  const migrationsFolder = path.join(process.env.LAMBDA_TASK_ROOT || '.', 'drizzle')
  for (let attempt = 1; ; attempt++) {
    try {
      await migrate(dataApiDb(process.env as Parameters<typeof dataApiDb>[0]), { migrationsFolder })
      return { ok: true }
    } catch (err) {
      if (!isResuming(err) || attempt >= RESUME_TRIES) throw err
      await new Promise((resolve) => setTimeout(resolve, RESUME_WAIT_MS))
    }
  }
}

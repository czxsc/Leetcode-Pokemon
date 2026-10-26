/* =====================================================================
   Aurora PostgreSQL through the RDS Data API (the cloud). The database
   scales to zero when idle; the first requests after that are refused
   with DatabaseResumingException for a few seconds while it wakes up.
===================================================================== */
import { RDSDataClient } from '@aws-sdk/client-rds-data'
import { drizzle } from 'drizzle-orm/aws-data-api/pg'
import { type DocumentStore, UnavailableError } from '../../documents.ts'

export function dataApiDb(env: { DB_NAME: string; DB_CLUSTER_ARN: string; DB_SECRET_ARN: string }) {
  return drizzle(new RDSDataClient({}), {
    database: env.DB_NAME,
    resourceArn: env.DB_CLUSTER_ARN,
    secretArn: env.DB_SECRET_ARN,
  })
}

export function isResuming(err: unknown): boolean {
  for (let e = err as { name?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.name === 'DatabaseResumingException') return true
  }
  return false
}

// Answers 503 while the database wakes up; the web app retries.
export function whileResuming<T>(store: DocumentStore<T>): DocumentStore<T> {
  const guard = async <R>(run: () => Promise<R>) => {
    try {
      return await run()
    } catch (err) {
      throw isResuming(err) ? new UnavailableError({ cause: err }) : err
    }
  }
  return {
    load: (userId) => guard(() => store.load(userId)),
    save: (userId, data, baseRev) => guard(() => store.save(userId, data, baseRev)),
  }
}

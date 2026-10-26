/* =====================================================================
   The cloud API: one Lambda behind API Gateway. API Gateway has already
   checked the Cognito access token, so the user is the token's `sub`.
   Game progress lives in DynamoDB, the problem library in Aurora
   PostgreSQL (through the RDS Data API, so no VPC or connection pool).
   Configuration comes from the environment (set by infra/lib/api.ts).
===================================================================== */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { handle, type LambdaEvent } from 'hono/aws-lambda'
import { createApp } from './app.ts'
import { fetchLeetCodeProblem } from './leetcode.ts'
import { createDynamoStore } from './stores/dynamo-store.ts'
import { dataApiDb, whileResuming } from './stores/postgres/data-api.ts'
import { createPostgresLibraryStore } from './stores/postgres/library-store.ts'

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

const app = createApp({
  stores: {
    progress: createDynamoStore({
      client: DynamoDBDocumentClient.from(new DynamoDBClient({}), {
        marshallOptions: { removeUndefinedValues: true },
      }),
      table: env('TABLE_NAME'),
      name: 'progress',
    }),
    library: whileResuming(
      createPostgresLibraryStore(
        dataApiDb({
          DB_NAME: env('DB_NAME'),
          DB_CLUSTER_ARN: env('DB_CLUSTER_ARN'),
          DB_SECRET_ARN: env('DB_SECRET_ARN'),
        }),
      ),
    ),
  },
  identify: (c) => {
    const event = (c.env as { event?: LambdaEvent } | undefined)?.event
    const claims =
      event && 'requestContext' in event && 'authorizer' in event.requestContext
        ? (event.requestContext.authorizer as { jwt?: { claims?: Record<string, unknown> } }).jwt
            ?.claims
        : undefined
    return typeof claims?.sub === 'string' ? claims.sub : null
  },
  lookup: fetchLeetCodeProblem,
  mode: 'cloud',
  location: 'your PokéLeet account',
})

export const handler = handle(app)

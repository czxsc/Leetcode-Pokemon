/* =====================================================================
   The cloud API: one Lambda behind API Gateway. API Gateway has already
   checked the Cognito access token, so the user is the token's `sub`.
   Game progress lives in DynamoDB, the problem library in Aurora
   PostgreSQL (signing in with IAM tokens, see stores/postgres/connection.ts).
   Configuration comes from the environment (set by infra/lib/api.ts).
===================================================================== */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { handle } from 'hono/aws-lambda'
import { createApp } from './app.ts'
import { fetchLeetCodeProblem } from './leetcode.ts'
import { createDynamoStore } from './stores/dynamo-store.ts'
import { iamAuth, postgresLibraryStore } from './stores/postgres/connection.ts'

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

// The part of an API Gateway (HTTP API, JWT authorizer) event we read.
interface LambdaEnv {
  event?: { requestContext?: { authorizer?: { jwt?: { claims?: Record<string, unknown> } } } }
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
    library: postgresLibraryStore(
      iamAuth({ host: env('DB_HOST'), database: env('DB_NAME'), user: env('DB_USER') }),
    ),
  },
  // API Gateway already checked the token; its claims arrive with the event.
  identify: (c) => {
    const sub = (c.env as LambdaEnv | undefined)?.event?.requestContext?.authorizer?.jwt?.claims
      ?.sub
    return typeof sub === 'string' ? sub : null
  },
  lookup: fetchLeetCodeProblem,
  mode: 'cloud',
  location: 'your PokéLeet account',
})

export const handler = handle(app)

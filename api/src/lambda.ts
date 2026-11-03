/* =====================================================================
   The cloud API: one Lambda behind API Gateway. API Gateway has already
   checked the Cognito access token, so the user is the token's `sub`.
   Game progress lives in DynamoDB, the problem library in Aurora
   PostgreSQL (signing in with IAM tokens, see stores/postgres/connection.ts).
   Deleting an account removes both, then the Cognito user.
   Configuration comes from the environment (set by infra/lib/api.ts).
===================================================================== */
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import type { Context } from 'hono'
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

// The access token's claims, which API Gateway checked and passes along.
function claim(c: Context, name: string): string | null {
  const claims = (c.env as LambdaEnv | undefined)?.event?.requestContext?.authorizer?.jwt?.claims
  const value = claims?.[name]
  return typeof value === 'string' ? value : null
}

const cognito = new CognitoIdentityProviderClient({})

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
  identify: (c) => claim(c, 'sub'),
  lookup: fetchLeetCodeProblem,
  mode: 'cloud',
  location: 'your PokéLeet account',
  async deleteSignIn(c) {
    // Cognito's own user name (a UUID, or google_<id> for Google sign-ins)
    const username = claim(c, 'username')
    if (!username) throw new Error('The access token has no username claim')
    await cognito.send(
      new AdminDeleteUserCommand({ UserPoolId: env('USER_POOL_ID'), Username: username }),
    )
  },
})

export const handler = handle(app)

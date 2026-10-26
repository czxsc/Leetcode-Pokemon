/* =====================================================================
   A document per user as one DynamoDB item (the cloud's game progress).
   The game state is always read and written whole, by user: a key-value
   access pattern, so DynamoDB rather than Postgres. The revision check
   is a conditional write, so two devices can't overwrite each other.

   Single-table keys:  pk = USER#<user id>   sk = DOC#<name>
===================================================================== */
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { type DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { ConflictError, type DocumentStore } from '../documents.ts'

export function createDynamoStore<T extends object>({
  client,
  table,
  name,
}: {
  client: DynamoDBDocumentClient
  table: string
  name: string
}): DocumentStore<T> {
  const key = (userId: string) => ({ pk: `USER#${userId}`, sk: `DOC#${name}` })

  async function load(userId: string) {
    const { Item } = await client.send(
      new GetCommand({ TableName: table, Key: key(userId), ConsistentRead: true }),
    )
    return Item
      ? { rev: Item.rev as number, savedAt: Item.savedAt as string, data: Item.data as T }
      : null
  }

  return {
    load,
    async save(userId, data, baseRev) {
      const savedAt = new Date().toISOString()
      const rev = baseRev + 1
      try {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: { ...key(userId), rev, savedAt, data },
            // only if nobody saved since `baseRev` (0 = the item doesn't exist yet)
            ConditionExpression: baseRev === 0 ? 'attribute_not_exists(pk)' : '#rev = :base',
            ...(baseRev === 0
              ? {}
              : {
                  ExpressionAttributeNames: { '#rev': 'rev' },
                  ExpressionAttributeValues: { ':base': baseRev },
                }),
          }),
        )
      } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
          throw new ConflictError((await load(userId))?.rev ?? 0)
        }
        throw err
      }
      return { rev, savedAt }
    },
  }
}

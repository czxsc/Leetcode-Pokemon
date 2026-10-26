/* =====================================================================
   The whole cloud app for one stage (dev or prod):

     browser ─► CloudFront ─┬─► S3 (the built web app + config.json)
                            └─► /api/* ─► API Gateway (Cognito JWT) ─► Lambda
                                                                 ├─► DynamoDB (game progress)
                                                                 └─► Aurora PostgreSQL (problem library)
===================================================================== */
import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as budgets from 'aws-cdk-lib/aws-budgets'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import type { Construct } from 'constructs'
import { Api } from './api.ts'
import { Auth } from './auth.ts'
import { Database } from './database.ts'
import { Web } from './web.ts'

export interface PokeleetStackProps extends StackProps {
  stage: string
  webAssetsDir: string // the built web app (npm run build -> dist/)
  budgetEmail?: string // monthly cost alert recipient
  monthlyBudgetUsd?: number
}

export class PokeleetStack extends Stack {
  constructor(scope: Construct, id: string, props: PokeleetStackProps) {
    super(scope, id, props)
    const prod = props.stage === 'prod'

    // One table, keyed by user (pk) and item (sk); see api/src/stores/dynamo-store.ts.
    const table = new dynamodb.TableV2(this, 'GameTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      deletionProtection: prod,
      removalPolicy: prod ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    const database = new Database(this, 'Database', { prod })

    const auth = new Auth(this, 'Auth', {
      prod,
      domainPrefix: `pokeleet-${props.stage}-${this.account}`,
    })
    const api = new Api(this, 'Api', { auth, database, table })
    const web = new Web(this, 'Web', { prod, api: api.httpApi })
    auth.addWebClient([`${web.url}/`]) // where sign-in returns to
    web.deploy(props.webAssetsDir, { auth: auth.webConfig() })

    if (props.budgetEmail) {
      new budgets.CfnBudget(this, 'MonthlyBudget', {
        budget: {
          budgetName: `pokeleet-${props.stage}`,
          budgetType: 'COST',
          timeUnit: 'MONTHLY',
          budgetLimit: { amount: props.monthlyBudgetUsd ?? 5, unit: 'USD' },
        },
        notificationsWithSubscribers: [80, 100].map((threshold) => ({
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{ subscriptionType: 'EMAIL', address: props.budgetEmail! }],
        })),
      })
    }

    new CfnOutput(this, 'AppUrl', { value: web.url })
    new CfnOutput(this, 'UserPoolId', { value: auth.userPool.userPoolId })
  }
}

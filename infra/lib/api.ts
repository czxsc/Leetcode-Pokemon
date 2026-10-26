/* =====================================================================
   The API: one Lambda (api/src/lambda.ts) behind an HTTP API. Every
   route requires a valid Cognito access token, checked by API Gateway
   before the Lambda runs; the stage is rate-limited to cap the cost of
   abuse. Game progress goes to a DynamoDB table, the library to the
   Aurora cluster.
===================================================================== */
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import type { Auth } from './auth.ts'
import { apiFunction } from './bundling.ts'
import type { Database } from './database.ts'

export class Api extends Construct {
  readonly httpApi: apigw.HttpApi

  constructor(
    scope: Construct,
    id: string,
    { auth, database, table }: { auth: Auth; database: Database; table: dynamodb.ITableV2 },
  ) {
    super(scope, id)

    const handler = apiFunction(this, 'Handler', {
      entry: 'api/src/lambda.ts',
      environment: { TABLE_NAME: table.tableName, ...database.environment() },
    })
    table.grantReadWriteData(handler)
    database.grantAccess(handler)

    this.httpApi = new apigw.HttpApi(this, 'Http', {
      createDefaultStage: false,
      defaultAuthorizer: new HttpJwtAuthorizer('Cognito', auth.issuer, {
        jwtAudience: [auth.clientId],
      }),
    })
    new apigw.HttpStage(this, 'Stage', {
      httpApi: this.httpApi,
      stageName: '$default',
      autoDeploy: true,
      throttle: { rateLimit: 25, burstLimit: 50 },
    })
    this.httpApi.addRoutes({
      path: '/api/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration: new HttpLambdaIntegration('Lambda', handler),
    })
  }
}

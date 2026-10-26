// Checks the synthesized CloudFormation for the properties the design relies on.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { beforeAll, describe, expect, it } from 'vitest'
import { PokeleetStack } from '../lib/pokeleet-stack.ts'

function synth(stage: string) {
  // skip esbuild/Docker bundling: these tests are about the infrastructure, not the code
  const app = new App({ context: { 'aws:cdk:bundling-stacks': [] } })
  const webAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pokeleet-web-'))
  fs.writeFileSync(path.join(webAssetsDir, 'index.html'), '<!doctype html>')
  const stack = new PokeleetStack(app, `Test-${stage}`, {
    stage,
    webAssetsDir,
    budgetEmail: 'me@example.com',
    env: { account: '123456789012', region: 'us-east-1' },
  })
  return Template.fromStack(stack)
}

describe('PokeleetStack', () => {
  let dev: Template
  let prod: Template
  beforeAll(() => {
    dev = synth('dev')
    prod = synth('prod')
  })

  it('runs Aurora PostgreSQL Serverless v2 that pauses when idle, behind the Data API', () => {
    dev.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
      EnableHttpEndpoint: true,
      StorageEncrypted: true,
      ServerlessV2ScalingConfiguration: Match.objectLike({ MinCapacity: 0 }),
    })
  })

  it('pays for no NAT gateway, and gives the database no internet access', () => {
    dev.resourceCountIs('AWS::EC2::NatGateway', 0)
    dev.resourceCountIs('AWS::EC2::InternetGateway', 0)
  })

  it('keeps game progress in an on-demand DynamoDB table with point-in-time recovery', () => {
    dev.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      Replicas: [
        Match.objectLike({
          PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        }),
      ],
    })
  })

  it('requires a Cognito token on every API route, and rate-limits the API', () => {
    dev.hasResourceProperties('AWS::ApiGatewayV2::Authorizer', { AuthorizerType: 'JWT' })
    const routes = dev.findResources('AWS::ApiGatewayV2::Route')
    expect(Object.values(routes).length).toBeGreaterThan(0)
    for (const route of Object.values(routes)) {
      expect(route.Properties.AuthorizationType).toBe('JWT')
    }
    dev.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      DefaultRouteSettings: Match.objectLike({ ThrottlingRateLimit: 25 }),
    })
  })

  it('signs in with the authorization code flow and no client secret', () => {
    dev.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      AllowedOAuthFlows: ['code'],
      GenerateSecret: false,
    })
  })

  it('serves the app from a private bucket and routes /api/* to the API, uncached', () => {
    dev.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectLike({ BlockPublicAcls: true }),
    })
    dev.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CacheBehaviors: [
          Match.objectLike({ PathPattern: '/api/*', AllowedMethods: Match.arrayWith(['PUT']) }),
        ],
      }),
    })
  })

  it('protects prod data from deletion, and lets dev be torn down', () => {
    prod.hasResource('AWS::RDS::DBCluster', { DeletionPolicy: 'Snapshot' })
    prod.hasResourceProperties('AWS::RDS::DBCluster', { DeletionProtection: true })
    prod.hasResource('AWS::DynamoDB::GlobalTable', { DeletionPolicy: 'Retain' })
    dev.hasResource('AWS::DynamoDB::GlobalTable', { DeletionPolicy: 'Delete' })
  })

  it('migrates the database on deploy and alerts on cost', () => {
    dev.resourceCountIs('Custom::Trigger', 1)
    dev.hasResourceProperties('AWS::Budgets::Budget', {
      Budget: Match.objectLike({ BudgetLimit: { Amount: 5, Unit: 'USD' } }),
    })
  })
})

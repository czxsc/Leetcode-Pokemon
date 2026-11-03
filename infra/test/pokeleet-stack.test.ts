// Checks the synthesized CloudFormation for the properties the design relies on.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { beforeAll, describe, expect, it } from 'vitest'
import { PokeleetStack, type PokeleetStackProps } from '../lib/pokeleet-stack.ts'

const env = { account: '123456789012', region: 'us-east-1' }

function synth(stage: string, extra: Partial<PokeleetStackProps> = {}) {
  // skip esbuild/Docker bundling: these tests are about the infrastructure, not the code
  const app = new App({ context: { 'aws:cdk:bundling-stacks': [] } })
  const webAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pokeleet-web-'))
  fs.writeFileSync(path.join(webAssetsDir, 'index.html'), '<!doctype html>')
  const stack = new PokeleetStack(app, `Test-${stage}`, {
    stage,
    webAssetsDir,
    budgetEmail: 'me@example.com',
    env,
    ...extra,
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

  it('runs Aurora PostgreSQL Serverless v2 in express configuration, pausing when idle', () => {
    dev.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
      WithExpressConfiguration: true,
      // express configuration's default pause (5 minutes); its create rejects
      // settings it doesn't support, such as an initial database
      ServerlessV2ScalingConfiguration: Match.exact({ MinCapacity: 0, MaxCapacity: 2 }),
      DatabaseName: Match.absent(),
    })
  })

  it('needs no VPC and stores no database password', () => {
    dev.resourceCountIs('AWS::EC2::VPC', 0)
    dev.resourceCountIs('AWS::SecretsManager::Secret', 0)
  })

  it('lets the API sign in to the database as its own user only, and migrations as the master', () => {
    const grants = Object.values(dev.findResources('AWS::IAM::Policy'))
      .flatMap((p) => p.Properties.PolicyDocument.Statement)
      .filter((s) => s.Action === 'rds-db:connect')
      .map((s) => JSON.stringify(s.Resource))
    expect(grants).toHaveLength(2)
    expect(grants.some((r) => r.includes('/pokeleet_app'))).toBe(true)
    expect(grants.some((r) => r.includes('/postgres'))).toBe(true)
    const api = Object.entries(dev.findResources('AWS::IAM::Policy')).find(([id]) =>
      id.startsWith('ApiHandlerServiceRoleDefaultPolicy'),
    )!
    expect(JSON.stringify(api[1])).toContain('/pokeleet_app')
    expect(JSON.stringify(api[1])).not.toContain('/postgres')
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

  it('lets the API delete Cognito users (account deletion) and do nothing else with them', () => {
    const api = Object.entries(dev.findResources('AWS::IAM::Policy')).find(([id]) =>
      id.startsWith('ApiHandlerServiceRoleDefaultPolicy'),
    )!
    const cognito = api[1].Properties.PolicyDocument.Statement.filter((s: { Action: unknown }) =>
      JSON.stringify(s.Action).includes('cognito-idp'),
    )
    expect(cognito.map((s: { Action: unknown }) => s.Action)).toEqual([
      'cognito-idp:AdminDeleteUser',
    ])
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

  it("signs in on Cognito's managed login pages, styled like the app", () => {
    dev.hasResourceProperties('AWS::Cognito::UserPool', { UserPoolTier: 'ESSENTIALS' })
    dev.hasResourceProperties('AWS::Cognito::UserPoolDomain', { ManagedLoginVersion: 2 })
    dev.hasResourceProperties('AWS::Cognito::ManagedLoginBranding', {
      Settings: Match.objectLike({
        categories: Match.objectLike({ global: Match.objectLike({ colorSchemeMode: 'LIGHT' }) }),
      }),
      Assets: Match.arrayWith([Match.objectLike({ Category: 'FORM_LOGO', Extension: 'PNG' })]),
    })
  })

  it('links the terms and privacy policy from the sign-up page', () => {
    const terms = Object.values(dev.findResources('AWS::Cognito::Terms')).map((r) => [
      r.Properties.TermsName,
      JSON.stringify(r.Properties.Links['cognito:default']),
    ])
    expect(terms).toHaveLength(2)
    expect(terms.find(([name]) => name === 'terms-of-use')![1]).toContain('/terms.html')
    expect(terms.find(([name]) => name === 'privacy-policy')![1]).toContain('/privacy.html')
  })

  it('links sign-ins with the same email: a pre sign-up trigger allowed to do just that', () => {
    dev.hasResourceProperties('AWS::Cognito::UserPool', {
      LambdaConfig: { PreSignUp: Match.anyValue() },
    })
    const policy = Object.entries(dev.findResources('AWS::IAM::Policy')).find(([id]) =>
      id.startsWith('AuthPreSignUpAccess'),
    )!
    expect(policy[1].Properties.PolicyDocument.Statement).toEqual([
      expect.objectContaining({
        Action: ['cognito-idp:ListUsers', 'cognito-idp:AdminLinkProviderForUser'],
        Resource: { 'Fn::GetAtt': [expect.stringMatching(/^AuthUsers/), 'Arn'] },
      }),
    ])
  })

  it('offers Google sign-in only when given a Google client, keeping its secret out of the template', () => {
    dev.resourceCountIs('AWS::Cognito::UserPoolIdentityProvider', 0)
    const google = synth('dev', { googleClientId: 'abc.apps.googleusercontent.com' })
    google.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
      ProviderName: 'Google',
      ProviderDetails: Match.objectLike({
        client_id: 'abc.apps.googleusercontent.com',
        client_secret:
          '{{resolve:secretsmanager:pokeleet-dev/google-client-secret:SecretString::AWSCURRENT:}}',
      }),
    })
    google.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      SupportedIdentityProviders: ['COGNITO', 'Google'],
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

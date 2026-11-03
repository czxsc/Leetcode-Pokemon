/* =====================================================================
   The whole cloud app for one stage (dev or prod):

     browser ─► CloudFront ─┬─► S3 (the built web app + config.json)
                            └─► /api/* ─► API Gateway (Cognito JWT) ─► Lambda
                                                                 ├─► DynamoDB (game progress)
                                                                 └─► Aurora PostgreSQL (problem library)

   Optionally at the app's own domain (e.g. pokeleet.sharonchen.dev), with
   sign-in at auth.<domain>: one certificate for both, and their records in
   the domain's Route 53 zone (dns-stack.ts).
===================================================================== */
import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as budgets from 'aws-cdk-lib/aws-budgets'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
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
  // "Continue with Google": the Google OAuth client's ID. Its secret goes in
  // Secrets Manager as pokeleet-<stage>/google-client-secret (docs/deploying.md).
  googleClientId?: string
  // The app's own address and its Route 53 zone (DnsStack).
  domain?: { name: string; zone: route53.IHostedZone }
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

    const domain = props.domain
    const signInDomain = domain && `auth.${domain.name}`
    const certificate =
      domain &&
      new acm.Certificate(this, 'Certificate', {
        domainName: domain.name,
        subjectAlternativeNames: [signInDomain!],
        validation: acm.CertificateValidation.fromDns(domain.zone),
      })

    const auth = new Auth(this, 'Auth', {
      prod,
      domainPrefix: `pokeleet-${props.stage}-${this.account}`,
      customDomain: domain && { name: signInDomain!, certificate: certificate! },
      google: props.googleClientId
        ? {
            clientId: props.googleClientId,
            secretName: `pokeleet-${props.stage}/google-client-secret`,
          }
        : undefined,
    })
    const api = new Api(this, 'Api', { auth, database, table })
    const web = new Web(this, 'Web', {
      prod,
      api: api.httpApi,
      domain: domain && { name: domain.name, certificate: certificate! },
    })
    auth.addWebClient(`${web.url}/`, domain ? [`${web.cloudFrontUrl}/`] : [])
    web.deploy(props.webAssetsDir, { auth: auth.webConfig() })

    if (domain) {
      const app = new targets.CloudFrontTarget(web.distribution)
      const appRecord = new route53.ARecord(this, 'AppRecord', {
        zone: domain.zone,
        target: route53.RecordTarget.fromAlias(app),
      })
      new route53.AaaaRecord(this, 'AppRecordIpv6', {
        zone: domain.zone,
        target: route53.RecordTarget.fromAlias(app),
      })
      // Cognito only creates auth.<domain> once <domain> itself resolves.
      auth.customDomain!.node.addDependency(appRecord)
      new route53.ARecord(this, 'SignInRecord', {
        zone: domain.zone,
        recordName: signInDomain,
        // Cognito serves its sign-in domain from a CloudFront distribution of its own
        target: route53.RecordTarget.fromAlias({
          bind: () => ({
            dnsName: auth.customDomain!.cloudFrontEndpoint,
            hostedZoneId: targets.CloudFrontTarget.getHostedZoneId(this),
          }),
        }),
      })
    }

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

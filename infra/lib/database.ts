/* =====================================================================
   Aurora PostgreSQL Serverless v2 for the problem library, created with
   Aurora's express configuration (which the AWS Free plan requires):
   - No VPC. The cluster is reached through Aurora's internet access
     gateway, over TLS, and only with IAM authentication: short-lived
     tokens, no passwords anywhere.
   - Scales to zero ACUs after 5 idle minutes (express configuration's
     default), so an unused app costs only storage; the first request
     after that waits a few seconds.
   - Two database users: the master (postgres), used only by migrations,
     and the API's user, which may only read and write the app's tables.
   - The app's database and its schema are created by a Lambda that runs
     after each deploy that changes it, applying the SQL migrations in
     api/drizzle/. (Express configuration can't create a database along
     with the cluster.)
===================================================================== */
import path from 'node:path'
import { ArnFormat, Duration, RemovalPolicy, Stack, Validations } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import type * as lambda from 'aws-cdk-lib/aws-lambda'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as triggers from 'aws-cdk-lib/triggers'
import { Construct } from 'constructs'
import { apiFunction, REPO_ROOT } from './bundling.ts'

const DB_NAME = 'pokeleet' // created by api/src/migrate.ts
const MASTER_USER = 'postgres' // express configuration's default
const APP_USER = 'pokeleet_app' // created by api/src/migrate.ts

export class Database extends Construct {
  readonly cluster: rds.CfnDBCluster

  constructor(scope: Construct, id: string, { prod }: { prod: boolean }) {
    super(scope, id)

    // Only settings express configuration accepts at creation; it rejects the
    // rest (an initial database name, for one).
    this.cluster = new rds.CfnDBCluster(this, 'Cluster', {
      engine: 'aurora-postgresql', // version: express configuration's default
      serverlessV2ScalingConfiguration: { minCapacity: 0, maxCapacity: 2 },
      deletionProtection: prod,
    })
    // Not in aws-cdk-lib's types or bundled schema yet (CloudFormation has it).
    // Also sets up the internet access gateway and IAM sign-in for the master
    // user, and creates the serverless writer.
    this.cluster.addPropertyOverride('WithExpressConfiguration', true)
    Validations.of(this.cluster).acknowledge({
      id: 'CloudFormation-Validate::F3002',
      reason: 'WithExpressConfiguration is newer than the bundled CloudFormation schema',
    })
    this.cluster.applyRemovalPolicy(prod ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY)

    // Apply SQL migrations after the cluster exists, and again whenever they change.
    const migrate = apiFunction(this, 'Migrate', {
      entry: 'api/src/migrate.ts',
      timeout: Duration.minutes(5), // allows for the database waking up
      environment: { ...this.environment(MASTER_USER), DB_APP_USER: APP_USER },
      copyIntoBundle: { from: path.join(REPO_ROOT, 'api', 'drizzle'), to: 'drizzle' },
    })
    this.grantAccess(migrate, MASTER_USER)
    new triggers.Trigger(this, 'MigrateOnDeploy', {
      handler: migrate,
      executeAfter: [this.cluster],
      executeOnHandlerChange: true,
    })
  }

  // What api/src/stores/postgres/connection.ts (iamAuth) reads.
  environment(user = APP_USER): Record<string, string> {
    return { DB_HOST: this.cluster.attrEndpointAddress, DB_NAME, DB_USER: user }
  }

  // Lets fn sign in to the database as `user`, and as no one else.
  grantAccess(fn: lambda.IFunction, user = APP_USER) {
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['rds-db:connect'],
        resources: [
          Stack.of(this).formatArn({
            service: 'rds-db',
            resource: 'dbuser',
            resourceName: `${this.cluster.attrDbClusterResourceId}/${user}`,
            arnFormat: ArnFormat.COLON_RESOURCE_NAME,
          }),
        ],
      }),
    )
  }
}

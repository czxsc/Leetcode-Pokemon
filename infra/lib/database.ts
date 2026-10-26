/* =====================================================================
   Aurora PostgreSQL Serverless v2 for the problem library.
   - Scales to zero ACUs after AUTO_PAUSE idle, so an unused app costs
     only storage; the first request after that waits a few seconds.
   - Reached through the RDS Data API (HTTPS + IAM), so Lambdas need no
     VPC, NAT gateway or connection pool. The VPC exists only to host the
     cluster: isolated subnets, no internet access.
   - Schema changes ship as SQL migrations (api/drizzle/), applied by a
     Lambda that runs after each deploy that changes them.
===================================================================== */
import path from 'node:path'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import type * as lambda from 'aws-cdk-lib/aws-lambda'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as triggers from 'aws-cdk-lib/triggers'
import { Construct } from 'constructs'
import { apiFunction, REPO_ROOT } from './bundling.ts'

const DB_NAME = 'pokeleet'
const AUTO_PAUSE = Duration.minutes(10)

export class Database extends Construct {
  readonly cluster: rds.DatabaseCluster

  constructor(scope: Construct, id: string, { prod }: { prod: boolean }) {
    super(scope, id)

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2, // Aurora needs subnets in two availability zones
      natGateways: 0,
      subnetConfiguration: [{ name: 'db', subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    })

    this.cluster = new rds.DatabaseCluster(this, 'Cluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_13,
      }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 2,
      serverlessV2AutoPauseDuration: AUTO_PAUSE,
      enableDataApi: true,
      credentials: rds.Credentials.fromGeneratedSecret('pokeleet'),
      defaultDatabaseName: DB_NAME,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      storageEncrypted: true,
      backup: { retention: Duration.days(prod ? 7 : 1) },
      deletionProtection: prod,
      removalPolicy: prod ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY,
    })

    // Apply SQL migrations after the cluster exists, and again whenever they change.
    const migrate = apiFunction(this, 'Migrate', {
      entry: 'api/src/migrate.ts',
      timeout: Duration.minutes(5), // allows for the database waking up
      environment: this.environment(),
      copyIntoBundle: { from: path.join(REPO_ROOT, 'api', 'drizzle'), to: 'drizzle' },
    })
    this.grantAccess(migrate)
    new triggers.Trigger(this, 'MigrateOnDeploy', {
      handler: migrate,
      executeAfter: [this.cluster],
      executeOnHandlerChange: true,
    })
  }

  // What api/src/stores/postgres/data-api.ts reads.
  environment(): Record<string, string> {
    return {
      DB_NAME,
      DB_CLUSTER_ARN: this.cluster.clusterArn,
      DB_SECRET_ARN: this.cluster.secret!.secretArn,
    }
  }

  grantAccess(fn: lambda.IFunction) {
    this.cluster.grantDataApiAccess(fn) // rds-data:* on the cluster, and reading its secret
  }
}

/* =====================================================================
   The web app: static files in a private S3 bucket behind CloudFront.
   CloudFront also routes /api/* to the HTTP API, so the app and its API
   share one origin (no CORS, and the app's relative /api/... calls work
   unchanged). config.json tells the app how to sign in.
===================================================================== */
import { RemovalPolicy, Stack } from 'aws-cdk-lib'
import type * as apigw from 'aws-cdk-lib/aws-apigatewayv2'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'

export class Web extends Construct {
  readonly distribution: cloudfront.Distribution
  readonly bucket: s3.Bucket

  constructor(scope: Construct, id: string, { prod, api }: { prod: boolean; api: apigw.HttpApi }) {
    super(scope, id)
    const { region, urlSuffix } = Stack.of(this)
    const apiDomain = `${api.apiId}.execute-api.${region}.${urlSuffix}`

    this.bucket = new s3.Bucket(this, 'Site', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: prod ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !prod,
    })

    this.distribution = new cloudfront.Distribution(this, 'Cdn', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(apiDomain, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          // forwards the Authorization header and query string to the API
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    })
  }

  // Uploads the built app (dist/) plus its config.json, then clears the CDN cache.
  deploy(assetsDir: string, config: object) {
    new s3deploy.BucketDeployment(this, 'Deploy', {
      destinationBucket: this.bucket,
      sources: [s3deploy.Source.asset(assetsDir), s3deploy.Source.jsonData('config.json', config)],
      distribution: this.distribution,
      distributionPaths: ['/*'],
      memoryLimit: 512,
    })
  }

  get url(): string {
    return `https://${this.distribution.distributionDomainName}`
  }
}

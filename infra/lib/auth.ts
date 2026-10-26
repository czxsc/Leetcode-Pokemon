/* =====================================================================
   Sign-in: a Cognito user pool with its hosted sign-in page. The web app
   uses the authorization code flow with PKCE (a public client, no
   secret); API Gateway checks the resulting access tokens.
===================================================================== */
import { Duration, Lazy, RemovalPolicy, Stack } from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

export class Auth extends Construct {
  readonly userPool: cognito.UserPool
  readonly domain: cognito.UserPoolDomain
  private client?: cognito.UserPoolClient

  constructor(
    scope: Construct,
    id: string,
    { prod, domainPrefix }: { prod: boolean; domainPrefix: string },
  ) {
    super(scope, id)

    this.userPool = new cognito.UserPool(this, 'Users', {
      featurePlan: cognito.FeaturePlan.LITE,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      passwordPolicy: { minLength: 10 },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      deletionProtection: prod,
      removalPolicy: prod ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    this.domain = this.userPool.addDomain('SignIn', { cognitoDomain: { domainPrefix } })
  }

  // The web app's sign-in client, added once the app's URL is known.
  addWebClient(appUrls: string[]) {
    this.client = this.userPool.addClient('WebApp', {
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL],
        callbackUrls: appUrls,
        logoutUrls: appUrls,
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    })
  }

  // Resolved at synth time, so the API can be wired up before the client exists.
  get clientId(): string {
    return Lazy.string({
      produce: () => {
        if (!this.client) throw new Error('Auth.addWebClient() was never called')
        return this.client.userPoolClientId
      },
    })
  }

  // Token issuer, as API Gateway and the web app's OIDC client expect it.
  get issuer(): string {
    return `https://cognito-idp.${Stack.of(this).region}.amazonaws.com/${this.userPool.userPoolId}`
  }

  // What the web app reads from config.json (src/config.ts).
  webConfig() {
    return { authority: this.issuer, clientId: this.clientId, domain: this.domain.baseUrl() }
  }
}

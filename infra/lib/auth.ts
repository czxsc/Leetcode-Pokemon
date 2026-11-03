/* =====================================================================
   Sign-in: a Cognito user pool with its managed sign-in pages, styled
   like the app (sign-in-style.ts), and optionally "Continue with
   Google". One email is one account: a pre sign-up trigger links a
   Google sign-in to the account that already has its email
   (api/src/pre-sign-up.ts).
   The web app uses the authorization code flow with PKCE (a public
   client, no secret); API Gateway checks the resulting access tokens.
===================================================================== */
import { Duration, Lazy, RemovalPolicy, SecretValue, Stack } from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { apiFunction } from './bundling.ts'
import { signInAssets, signInSettings } from './sign-in-style.ts'

export interface GoogleSignIn {
  clientId: string // the Google OAuth client's ID (not a secret)
  secretName: string // Secrets Manager secret holding its client secret
}

export interface AuthProps {
  prod: boolean
  domainPrefix: string // the <prefix>.auth.<region>.amazoncognito.com domain
  google?: GoogleSignIn
}

export class Auth extends Construct {
  readonly userPool: cognito.UserPool
  readonly domain: cognito.UserPoolDomain
  private readonly google?: cognito.UserPoolIdentityProviderGoogle
  private client?: cognito.UserPoolClient

  constructor(scope: Construct, id: string, { prod, domainPrefix, google }: AuthProps) {
    super(scope, id)

    const preSignUp = apiFunction(this, 'PreSignUp', { entry: 'api/src/pre-sign-up.ts' })

    this.userPool = new cognito.UserPool(this, 'Users', {
      // Essentials for the styled sign-in pages (Lite only has the classic
      // ones); both are free up to 10,000 monthly users.
      featurePlan: cognito.FeaturePlan.ESSENTIALS,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      passwordPolicy: { minLength: 10 },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      deletionProtection: prod,
      removalPolicy: prod ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      lambdaTriggers: { preSignUp },
    })
    // Its own policy, not the function's: the pool depends on the function,
    // and this depends on the pool, so the function mustn't depend on this.
    new iam.Policy(this, 'PreSignUpAccess', {
      roles: [preSignUp.role!],
      statements: [
        new iam.PolicyStatement({
          actions: ['cognito-idp:ListUsers', 'cognito-idp:AdminLinkProviderForUser'],
          resources: [this.userPool.userPoolArn],
        }),
      ],
    })

    this.domain = this.userPool.addDomain('SignIn', {
      cognitoDomain: { domainPrefix },
      managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    })

    if (google) {
      this.google = new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
        userPool: this.userPool,
        clientId: google.clientId,
        // Resolved by CloudFormation at deploy time, never in the template. It's
        // only read again when this resource changes (see docs/deploying.md).
        clientSecretValue: SecretValue.secretsManager(google.secretName, {
          versionStage: 'AWSCURRENT',
        }),
        scopes: ['openid', 'email'],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          emailVerified: cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
        },
      })
    }
  }

  // The web app's sign-in client, added once the app's URL (ending in /) is known.
  addWebClient(appUrl: string) {
    this.client = this.userPool.addClient('WebApp', {
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL],
        callbackUrls: [appUrl], // where sign-in returns to
        logoutUrls: [appUrl],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        ...(this.google ? [cognito.UserPoolClientIdentityProvider.GOOGLE] : []),
      ],
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    })
    if (this.google) this.client.node.addDependency(this.google)

    // Managed login shows an error page for a client without a style.
    new cognito.CfnManagedLoginBranding(this, 'SignInStyle', {
      userPoolId: this.userPool.userPoolId,
      clientId: this.client.userPoolClientId,
      settings: signInSettings,
      assets: signInAssets,
    })

    // Linked from the sign-up page (Cognito shows them once both exist).
    const terms = [
      ['TermsOfUse', 'terms-of-use', 'terms.html'],
      ['PrivacyPolicy', 'privacy-policy', 'privacy.html'],
    ]
    for (const [id, termsName, page] of terms) {
      new cognito.CfnTerms(this, id, {
        userPoolId: this.userPool.userPoolId,
        clientId: this.client.userPoolClientId,
        termsName,
        termsSource: 'LINK',
        enforcement: 'NONE',
        links: { 'cognito:default': appUrl + page },
      })
    }
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
    return {
      authority: this.issuer,
      clientId: this.clientId,
      domain: this.domain.baseUrl(), // sign-in pages
      providers: this.google ? ['Google'] : [], // buttons for the landing page
    }
  }
}

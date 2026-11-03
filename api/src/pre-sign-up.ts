/* =====================================================================
   Cognito's pre sign-up trigger: one email address, one account.
   - The first Google sign-in with the verified email of an existing
     account is linked to that account, so it opens the same problems and
     progress instead of an empty new account.
   - Creating a password account for an email that already signs in with
     Google is refused, with a hint to continue with Google instead.
   Only verified addresses are linked: otherwise someone could sign up with
   another person's email and receive their Google sign-in later.
===================================================================== */
import {
  AdminLinkProviderForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider'

// The part of Cognito's pre sign-up event this reads (it's returned as is).
export interface PreSignUpEvent {
  triggerSource: string
  userPoolId: string
  userName: string // e.g. google_1234 for a first Google sign-in
  request: { userAttributes: Record<string, string> }
}

type Cognito = Pick<CognitoIdentityProviderClient, 'send'>

// user name prefix -> the provider's name in the user pool
const PROVIDERS: Record<string, string> = { google: 'Google' }

export const GOOGLE_EMAIL_TAKEN =
  'An account with this email already signs in with Google. Use Continue with Google instead.'

const attribute = (user: UserType, name: string) =>
  user.Attributes?.find((a) => a.Name === name)?.Value

// ListUsers filters quote their value; escape anything that would end it.
const quoted = (value: string) => `"${value.replace(/["\\]/g, '\\$&')}"`

export function createPreSignUp(cognito: Cognito) {
  async function usersWithEmail(userPoolId: string, email: string) {
    const out = await cognito.send(
      new ListUsersCommand({ UserPoolId: userPoolId, Filter: `email = ${quoted(email)}` }),
    )
    return out.Users ?? []
  }

  return async function preSignUp<E extends PreSignUpEvent>(event: E): Promise<E> {
    const { email, email_verified } = event.request.userAttributes
    if (!email) return event

    if (event.triggerSource === 'PreSignUp_ExternalProvider') {
      const separator = event.userName.indexOf('_')
      const provider = PROVIDERS[event.userName.slice(0, separator).toLowerCase()]
      if (!provider || email_verified !== 'true') return event
      const account = (await usersWithEmail(event.userPoolId, email)).find(
        (user) =>
          user.UserStatus !== 'EXTERNAL_PROVIDER' && attribute(user, 'email_verified') === 'true',
      )
      if (account?.Username) {
        await cognito.send(
          new AdminLinkProviderForUserCommand({
            UserPoolId: event.userPoolId,
            DestinationUser: { ProviderName: 'Cognito', ProviderAttributeValue: account.Username },
            SourceUser: {
              ProviderName: provider,
              ProviderAttributeName: 'Cognito_Subject',
              ProviderAttributeValue: event.userName.slice(separator + 1),
            },
          }),
        )
      }
    } else if (event.triggerSource === 'PreSignUp_SignUp') {
      const users = await usersWithEmail(event.userPoolId, email)
      if (users.some((user) => user.UserStatus === 'EXTERNAL_PROVIDER')) {
        throw new Error(GOOGLE_EMAIL_TAKEN)
      }
    }
    return event
  }
}

export const handler = createPreSignUp(new CognitoIdentityProviderClient({}))

import {
  AdminLinkProviderForUserCommand,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider'
import { describe, expect, it } from 'vitest'
import { createPreSignUp, GOOGLE_EMAIL_TAKEN, type PreSignUpEvent } from '../src/pre-sign-up.ts'

const user = (Username: string, status: UserType['UserStatus'], verified = true): UserType => ({
  Username,
  UserStatus: status,
  Attributes: [
    { Name: 'email', Value: 'ash@example.com' },
    { Name: 'email_verified', Value: String(verified) },
  ],
})

// A stand-in for Cognito that answers ListUsers with `users` and records every call.
function cognito(users: UserType[]) {
  const sent: unknown[] = []
  return {
    sent,
    async send(command: unknown) {
      sent.push(command)
      return command instanceof ListUsersCommand ? { Users: users } : {}
    },
  }
}

const event = (triggerSource: string, userName: string, verified = 'true'): PreSignUpEvent => ({
  triggerSource,
  userPoolId: 'us-east-1_pool',
  userName,
  request: { userAttributes: { email: 'ash@example.com', email_verified: verified } },
})

const links = (sent: unknown[]) =>
  sent.filter(
    (c) => c instanceof AdminLinkProviderForUserCommand,
  ) as AdminLinkProviderForUserCommand[]

describe('pre sign-up: one email, one account', () => {
  it('links a first Google sign-in to the account with that verified email', async () => {
    const fake = cognito([user('uuid-1', 'CONFIRMED')])
    const e = event('PreSignUp_ExternalProvider', 'google_1234567890')
    expect(await createPreSignUp(fake)(e)).toBe(e)
    const list = fake.sent[0] as ListUsersCommand
    expect(list.input).toEqual({
      UserPoolId: 'us-east-1_pool',
      Filter: 'email = "ash@example.com"',
    })
    expect(links(fake.sent).map((c) => c.input)).toEqual([
      {
        UserPoolId: 'us-east-1_pool',
        DestinationUser: { ProviderName: 'Cognito', ProviderAttributeValue: 'uuid-1' },
        SourceUser: {
          ProviderName: 'Google',
          ProviderAttributeName: 'Cognito_Subject',
          ProviderAttributeValue: '1234567890',
        },
      },
    ])
  })

  it('creates a new account when no account has that email', async () => {
    const fake = cognito([])
    await createPreSignUp(fake)(event('PreSignUp_ExternalProvider', 'Google_42'))
    expect(links(fake.sent)).toEqual([])
  })

  it('never links to an account whose email was not verified', async () => {
    const fake = cognito([user('uuid-1', 'UNCONFIRMED', false)])
    await createPreSignUp(fake)(event('PreSignUp_ExternalProvider', 'google_42'))
    expect(links(fake.sent)).toEqual([])
  })

  it("doesn't link when Google hasn't verified the email", async () => {
    const fake = cognito([user('uuid-1', 'CONFIRMED')])
    await createPreSignUp(fake)(event('PreSignUp_ExternalProvider', 'google_42', 'false'))
    expect(fake.sent).toEqual([])
  })

  it('refuses a password account for an email that signs in with Google', async () => {
    const fake = cognito([user('google_42', 'EXTERNAL_PROVIDER')])
    await expect(createPreSignUp(fake)(event('PreSignUp_SignUp', 'uuid-2'))).rejects.toThrow(
      GOOGLE_EMAIL_TAKEN,
    )
  })

  it('lets a new email sign up with a password', async () => {
    const fake = cognito([])
    const e = event('PreSignUp_SignUp', 'uuid-2')
    expect(await createPreSignUp(fake)(e)).toBe(e)
  })

  it('escapes quotes in the email it searches for', async () => {
    const fake = cognito([])
    const e = event('PreSignUp_SignUp', 'uuid-2')
    e.request.userAttributes.email = 'a"b\\c@example.com'
    await createPreSignUp(fake)(e)
    expect((fake.sent[0] as ListUsersCommand).input.Filter).toBe('email = "a\\"b\\\\c@example.com"')
  })
})

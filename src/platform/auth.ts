/* =====================================================================
   Sign-in for the cloud app: OAuth 2.0 authorization code flow with PKCE
   against the Cognito user pool's sign-in pages. The access token goes
   on every API call; refresh tokens keep it fresh in the background, so
   a session lasts until the refresh token expires.
===================================================================== */
import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import type { AuthConfig } from '../config'

export interface Session {
  id: string // the Cognito user id (sub)
  email: string
  token(): string | null
  renew(): void
  signOut(): void
}

const appUrl = () => window.location.origin + import.meta.env.BASE_URL
const RETRIED_KEY = 'pokeleet:sign-in-retried'

function userManager(cfg: AuthConfig) {
  return new UserManager({
    authority: cfg.authority,
    client_id: cfg.clientId,
    redirect_uri: appUrl(),
    response_type: 'code',
    scope: 'openid email',
    automaticSilentRenew: true,
    // shared by all tabs, so opening another one doesn't sign in again
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  })
}

// Leaves for Cognito's sign-in page, or with a provider ('Google') straight
// to that provider's. The app boots again when Cognito sends the user back.
export async function signIn(cfg: AuthConfig, provider?: string): Promise<never> {
  const extraQueryParams = provider ? { identity_provider: provider } : undefined
  await userManager(cfg).signinRedirect({ extraQueryParams })
  return new Promise<never>(() => {}) // the page is navigating away
}

// The signed-in session: from a sign-in Cognito just sent the user back
// from, or saved in this browser. When there's none, `error` says why the
// sign-in that was just tried didn't finish (if one was).
export async function restoreSession(
  cfg: AuthConfig,
): Promise<{ session: Session | null; error: string | null }> {
  const manager = userManager(cfg)
  let user: User | null
  let error: string | null = null
  const params = new URLSearchParams(window.location.search)
  if (params.has('state') && (params.has('code') || params.has('error'))) {
    // a cancelled or failed sign-in comes back with an error instead of a code
    try {
      user = await manager.signinRedirectCallback()
    } catch (err) {
      console.warn('[pokeleet] sign-in did not finish:', err)
      error = (err as Error).message || 'Something went wrong. Please try again.'
      user = null
    }
    window.history.replaceState(null, '', appUrl())
    // Cognito turns down the first Google sign-in it links to an existing
    // account (api/src/pre-sign-up.ts); signing in again goes through.
    const linked = error?.match(/already found an entry for username ([a-z]+)_/i)
    if (linked && !sessionStorage.getItem(RETRIED_KEY)) {
      sessionStorage.setItem(RETRIED_KEY, '1')
      return signIn(cfg, linked[1].toLowerCase() === 'google' ? 'Google' : undefined)
    }
    sessionStorage.removeItem(RETRIED_KEY)
  } else {
    user = await manager.getUser()
    if (user?.expired)
      user = user.refresh_token ? await manager.signinSilent().catch(() => null) : null
  }
  if (!user) return { session: null, error }

  manager.events.addUserLoaded((next) => {
    user = next
  })
  const session: Session = {
    id: user.profile.sub,
    email: String(user.profile.email || ''),
    token: () => user?.access_token ?? null,
    renew: () => void manager.signinRedirect(),
    async signOut() {
      await manager.removeUser()
      const query = new URLSearchParams({ client_id: cfg.clientId, logout_uri: appUrl() })
      window.location.assign(`${cfg.domain}/logout?${query}`)
    },
  }
  return { session, error: null }
}

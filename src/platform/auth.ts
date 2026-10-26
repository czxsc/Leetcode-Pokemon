/* =====================================================================
   Sign-in for the cloud app: OAuth 2.0 authorization code flow with PKCE
   against the Cognito user pool's hosted sign-in page. The access token
   goes on every API call; refresh tokens keep it fresh in the
   background, so a session lasts until the refresh token expires.
===================================================================== */
import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import type { AuthConfig } from '../config'

export interface Session {
  email: string
  token(): string | null
  renew(): void
  signOut(): void
}

// Resolves once signed in. Without a session it redirects to the sign-in
// page instead, and the app boots again when Cognito sends the user back.
export async function signIn(cfg: AuthConfig): Promise<Session> {
  const appUrl = window.location.origin + import.meta.env.BASE_URL
  const manager = new UserManager({
    authority: cfg.authority,
    client_id: cfg.clientId,
    redirect_uri: appUrl,
    response_type: 'code',
    scope: 'openid email',
    automaticSilentRenew: true,
    // shared by all tabs, so opening another one doesn't sign in again
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  })

  let user: User | null
  const params = new URLSearchParams(window.location.search)
  if (params.has('code') && params.has('state')) {
    user = await manager.signinRedirectCallback()
    window.history.replaceState(null, '', appUrl)
  } else {
    user = await manager.getUser()
    if (user?.expired)
      user = user.refresh_token ? await manager.signinSilent().catch(() => null) : null
  }
  if (!user) {
    await manager.signinRedirect()
    return new Promise<never>(() => {}) // the page is navigating away
  }

  manager.events.addUserLoaded((next) => {
    user = next
  })
  return {
    email: String(user.profile.email || ''),
    token: () => user?.access_token ?? null,
    renew: () => void manager.signinRedirect(),
    async signOut() {
      await manager.removeUser()
      const query = new URLSearchParams({ client_id: cfg.clientId, logout_uri: appUrl })
      window.location.assign(`${cfg.domain}/logout?${query}`)
    },
  }
}

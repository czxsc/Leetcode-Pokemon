/* =====================================================================
   Settings. Build time: the online demo is built with `--mode demo`
   (see .env.demo). Run time: a cloud deployment serves config.json next
   to the app (written by infra/lib/web.ts) with its sign-in settings;
   the local app and the demo have none.
===================================================================== */

export const config = {
  demo: import.meta.env.MODE === 'demo',
  repoUrl: (import.meta.env.VITE_REPO_URL as string | undefined) || '',
}

export interface AuthConfig {
  authority: string // Cognito user pool issuer URL
  clientId: string
  domain: string // Cognito hosted sign-in domain, for signing out
}

export async function loadAuthConfig(): Promise<AuthConfig | null> {
  if (config.demo) return null
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return null
    const body = await res.json()
    return body.auth || null
  } catch {
    return null
  }
}

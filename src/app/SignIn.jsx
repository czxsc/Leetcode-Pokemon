import { useState } from 'react'
import { Pokeball } from '../components/icons'
import { config } from '../config'
import { DISCLAIMER } from './disclaimer'

// The cloud app's sign-in screen, for visitors who aren't signed in: Google,
// email (Cognito's sign-in page, which also creates accounts), or the demo.

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

// auth: the cloud app's sign-in settings; error: why the last sign-in didn't
// finish, if it didn't; onSignIn(provider?) leaves for the sign-in page
export function SignIn({ auth, error, onSignIn }) {
  const [leaving, setLeaving] = useState(null) // which button was clicked
  const google = (auth.providers || []).includes('Google')
  function signIn(provider) {
    setLeaving(provider || 'email')
    onSignIn(provider)
  }
  return (
    <div className="signin">
      <div className="panel signin-panel">
        <div className="onb-head">
          <Pokeball size={30} />
          <h1 className="pixel-font">Sign in to PokéLeet</h1>
        </div>
        <div className="signin-body">
          {error ? (
            <div className="chip-card demo-warning" role="alert">
              <div className="demo-warning-title">⚠ Sign-in didn&rsquo;t finish</div>
              <div className="signin-error">{error}</div>
            </div>
          ) : null}
          {google ? (
            <button
              className="btn signin-google"
              disabled={!!leaving}
              onClick={() => signIn('Google')}
            >
              <GoogleLogo />
              {leaving === 'Google' ? 'Opening Google…' : 'Continue with Google'}
            </button>
          ) : null}
          <button className="btn green" disabled={!!leaving} onClick={() => signIn()}>
            {leaving === 'email' ? 'Opening sign-in…' : 'Continue with email'}
          </button>
          <div className="signin-or">or</div>
          <a className="btn lav" href="?demo">
            Try the demo
          </a>
          <p className="signin-note">No account needed. Saved in this browser only.</p>
        </div>
        <div className="signin-links">
          <a href="privacy.html">Privacy</a>
          <a href="terms.html">Terms</a>
          {config.repoUrl ? (
            <a href={config.repoUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          ) : null}
        </div>
        <p className="signin-disclaimer">{DISCLAIMER}</p>
      </div>
    </div>
  )
}

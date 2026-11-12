import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import trackerManifest from '../extension/manifest.json'
import { App } from './app/App'
import { rememberLoadingPartner } from './app/loading-screen'
import { LoadingScreen } from './app/LoadingScreen'
import { StorageError } from './app/StorageError'
import { config, loadAuthConfig } from './config'
import { openPersistence } from './platform/persistence'
import { connectTracker } from './platform/tracker'
import { initFocus } from './state/focus'
import { initStore, store } from './state/store'
import './theme.css'

const root = createRoot(document.getElementById('root'))

// Sign in (cloud app only), load the saved data, then start the app.
async function boot() {
  root.render(<LoadingScreen />) // until the app or the sign-in screen replaces it
  let session = null
  try {
    const auth = await loadAuthConfig()
    if (auth && new URLSearchParams(window.location.search).has('demo')) {
      // the cloud app's demo, from its sign-in screen: no account, this browser only
      config.demo = config.cloudDemo = true
    } else if (auth) {
      // the sign-in library and screen are only downloaded by the cloud app
      const { restoreSession, signIn } = await import('./platform/auth')
      const restored = await restoreSession(auth)
      session = restored.session
      if (!session) {
        const { SignIn } = await import('./app/SignIn')
        root.render(
          <SignIn
            auth={auth}
            error={restored.error}
            onSignIn={(provider) => signIn(auth, provider)}
          />,
        )
        return
      }
    }
    initStore(await openPersistence({ demo: config.demo, auth: session }))
  } catch (err) {
    root.render(<StorageError message={err.message} />)
    return
  }
  // the next loading screen shows the lead Pokémon as it is now
  rememberLoadingPartner(store.get())
  store.subscribe(() => rememberLoadingPartner(store.get()))
  // The Tracker extension from this repo's extension/ folder; an older copy
  // loaded in the browser is reported as needing a reload.
  initFocus(connectTracker({ expectedVersion: trackerManifest.version, demo: config.demo }))
  root.render(
    <StrictMode>
      <App session={session} />
    </StrictMode>,
  )
}

boot()

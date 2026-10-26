import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import trackerManifest from '../extension/manifest.json'
import { App } from './app/App'
import { StorageError } from './app/StorageError'
import { config, loadAuthConfig } from './config'
import { openPersistence } from './platform/persistence'
import { connectTracker } from './platform/tracker'
import { initFocus } from './state/focus'
import { initStore } from './state/store'
import './theme.css'

const root = createRoot(document.getElementById('root'))

// Sign in (cloud app only), load the saved data, then start the app.
async function boot() {
  let session = null
  try {
    const auth = await loadAuthConfig()
    // the sign-in library is only downloaded by the cloud app
    if (auth) session = await (await import('./platform/auth')).signIn(auth)
    initStore(await openPersistence({ demo: config.demo, auth: session }))
  } catch (err) {
    root.render(<StorageError message={err.message} />)
    return
  }
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

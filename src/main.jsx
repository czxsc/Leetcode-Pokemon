import { StrictMode } from 'react'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App, { StorageError } from './App.jsx'
import * as Catalog from '../shared/catalog.js'
import * as DateUtil from './date-utils.js'
import * as LegacyImport from './legacy-import.js'
import { openPersistence } from './persistence.js'
import pokeAvatar from './assets/PokeAvatar.png'
import './theme.css'

window.React = React
window.ReactDOM = { createRoot }
window.Catalog = Catalog
window.DateUtil = DateUtil
window.LegacyImport = LegacyImport
window.AppAssets = { pokeAvatar }

const root = createRoot(document.getElementById('root'))

async function boot() {
  try {
    // The store reads its starting state from here, so load it first.
    window.Persistence = await openPersistence()
  } catch (err) {
    root.render(<StorageError message={err.message} />)
    return
  }

  await import('./legacy/js/dex.jsx')
  await import('./legacy/js/pixelmon.jsx')
  await import('./legacy/js/data.jsx')
  await import('./legacy/js/store.jsx')
  await import('./legacy/js/ui.jsx')
  await import('./legacy/js/detail.jsx')
  await import('./legacy/js/dashboard.jsx')
  await import('./legacy/js/gacha.jsx')
  await import('./legacy/js/quests.jsx')
  await import('./legacy/js/recall.jsx')
  await import('./legacy/js/team.jsx')
  await import('./legacy/js/pokedex.jsx')
  await import('./legacy/js/shop.jsx')
  await import('./legacy/js/meadow.jsx')
  await import('./legacy/js/app.jsx')

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

boot()

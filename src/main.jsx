import { StrictMode } from 'react'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { createLocalSolutionSync } from './local-sync.js'
import './theme.css'

window.React = React
window.ReactDOM = { createRoot }
window.LocalSolutionSync = createLocalSolutionSync()

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* =====================================================================
   The PokéLeet Tracker as a download: extension/ zipped in the browser,
   ready for chrome://extensions → Load unpacked. Its manifest also lets
   it run on the address this page came from, so a copy downloaded from
   a deployed PokéLeet works there without editing anything.
===================================================================== */
import { strToU8, zipSync } from 'fflate'
import background from '../../extension/background.js?raw'
import bridge from '../../extension/bridge.js?raw'
import icon128 from '../../extension/icons/icon128.png?inline'
import icon16 from '../../extension/icons/icon16.png?inline'
import icon32 from '../../extension/icons/icon32.png?inline'
import icon48 from '../../extension/icons/icon48.png?inline'
import manifest from '../../extension/manifest.json'

export const TRACKER_FOLDER = 'pokeleet-tracker'

// a base64 data: URL's bytes
const bytes = (dataUrl: string) =>
  Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (c) => c.charCodeAt(0))

// The manifest, also matching `site` (a match pattern) for the app's pages.
function manifestFor(site: string) {
  const out = structuredClone(manifest)
  if (!out.host_permissions.includes(site)) out.host_permissions.push(site)
  for (const script of out.content_scripts)
    if (!script.matches.includes(site)) script.matches.push(site)
  return out
}

export function downloadTracker() {
  // match patterns leave out the port: localhost:5173 is http://localhost/*
  const site = `${window.location.protocol}//${window.location.hostname}/*`
  const files: Record<string, Uint8Array> = {
    'manifest.json': strToU8(JSON.stringify(manifestFor(site), null, 2) + '\n'),
    'background.js': strToU8(background),
    'bridge.js': strToU8(bridge),
    'icons/icon16.png': bytes(icon16),
    'icons/icon32.png': bytes(icon32),
    'icons/icon48.png': bytes(icon48),
    'icons/icon128.png': bytes(icon128),
  }
  const zip = zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, data]) => [`${TRACKER_FOLDER}/${name}`, data]),
    ),
  )
  const href = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }))
  const link = Object.assign(document.createElement('a'), {
    href,
    download: `${TRACKER_FOLDER}.zip`,
  })
  link.click()
  setTimeout(() => URL.revokeObjectURL(href), 60_000)
}

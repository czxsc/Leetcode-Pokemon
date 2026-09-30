/* =====================================================================
   PokéLeet Tracker — runs on localhost pages.

   Stays silent until the page introduces itself as PokéLeet (a "hello"
   message from src/tracker.js). From then on it relays the background
   worker's reports of whether LeetCode is the active tab to the page,
   and the page's requests to bring LeetCode to the front. Other
   localhost pages never hear from it.
===================================================================== */

const FROM_APP = 'pokeleet-app'
const FROM_TRACKER = 'pokeleet-tracker'
let joined = false

function toPage(msg) {
  window.postMessage({ source: FROM_TRACKER, ...msg }, window.location.origin)
}

async function ask(msg) {
  try {
    return await chrome.runtime.sendMessage(msg)
  } catch {
    // the Tracker was reloaded or removed since this page loaded
    toPage({ type: 'gone' })
    return null
  }
}

async function sendState() {
  const state = await ask({ type: 'get' })
  if (state) toPage({ type: 'state', leetcode: state.leetcode, since: state.since })
}

window.addEventListener('message', (event) => {
  const msg = event.data
  if (event.source !== window || !msg || msg.source !== FROM_APP) return
  if (msg.type === 'hello') {
    let version
    try {
      version = chrome.runtime.getManifest().version
    } catch {
      toPage({ type: 'gone' })
      return
    }
    joined = true
    toPage({ type: 'hello', version })
    sendState()
  } else if (joined && msg.type === 'get') {
    sendState()
  } else if (joined && msg.type === 'open') {
    ask({ type: 'open', url: String(msg.url || '') })
  }
})

chrome.runtime.onMessage.addListener((msg) => {
  if (joined && msg && msg.type === 'state') toPage({ type: 'state', leetcode: msg.leetcode, since: msg.since })
})

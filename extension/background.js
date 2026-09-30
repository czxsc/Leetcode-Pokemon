/* =====================================================================
   PokéLeet Tracker — background worker.

   Works out whether a leetcode.com page is the active tab of the browser
   window you used last, and tells every open PokéLeet tab (through
   bridge.js) whenever that changes: { leetcode, since }. Switching to
   another app doesn't change the answer; switching tabs or windows does.

   The browser only shows this extension the addresses of leetcode.com
   and localhost tabs, so it never sees the rest of your browsing. It
   stores nothing and sends nothing over the network.
===================================================================== */

const LEETCODE = /^https:\/\/leetcode\.com(\/|$)/
const APP_PAGES = ['http://localhost/*', 'http://127.0.0.1/*']
const PROBLEM_LIST = 'https://leetcode.com/problemset/'

// The last answer sent to PokéLeet. Lost when the browser puts this worker
// to sleep; the next check just sends the (unchanged) answer again.
let tracked = null

async function activeTabUrl() {
  try {
    const win = await chrome.windows.getLastFocused({ populate: true, windowTypes: ['normal'] })
    const tab = win.tabs && win.tabs.find((t) => t.active)
    return (tab && tab.url) || ''
  } catch {
    return ''     // no browser window open
  }
}

async function recheck() {
  const leetcode = LEETCODE.test(await activeTabUrl())
  if (tracked && tracked.leetcode === leetcode) return tracked
  tracked = { leetcode, since: Date.now() }
  const tabs = await chrome.tabs.query({ url: APP_PAGES })
  for (const tab of tabs) {
    // tabs that aren't PokéLeet (or have no bridge yet) just don't answer
    chrome.tabs.sendMessage(tab.id, { type: 'state', ...tracked }).catch(() => {})
  }
  return tracked
}

// One check at a time, so bursts of tab events can't interleave.
let queue = Promise.resolve()
function check() {
  queue = queue.then(recheck, recheck)
  return queue
}

// Bring LeetCode to the front: the tab already showing that problem (or,
// with no problem given, any LeetCode tab), otherwise a new tab.
function problemSlug(url) {
  const match = /^https:\/\/leetcode\.com\/problems\/([^/?#]+)/.exec(url || '')
  return match ? match[1] : null
}
async function openLeetCode(url) {
  const target = LEETCODE.test(url || '') ? url : PROBLEM_LIST
  const slug = problemSlug(url)
  const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' })
  const tab = tabs
    .filter((t) => !slug || problemSlug(t.url) === slug)
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0]
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true })
    await chrome.windows.update(tab.windowId, { focused: true })
  } else {
    await chrome.tabs.create({ url: target })
  }
}

chrome.tabs.onActivated.addListener(() => check())
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (tab.active && (change.url || change.status)) check()
})
chrome.tabs.onRemoved.addListener(() => check())
chrome.tabs.onAttached.addListener(() => check())
chrome.windows.onFocusChanged.addListener(() => check())
chrome.windows.onRemoved.addListener(() => check())
chrome.runtime.onStartup.addListener(() => check())
chrome.runtime.onInstalled.addListener(() => check())

// Requests from bridge.js on a PokéLeet page.
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || !sender.tab) return false
  if (msg.type === 'get') {
    // PokéLeet records study time from the background, so don't let the
    // browser discard its tab to save memory.
    chrome.tabs.update(sender.tab.id, { autoDiscardable: false }).catch(() => {})
    check().then(reply, () => reply(null))
    return true
  }
  if (msg.type === 'open') {
    openLeetCode(msg.url).then(() => reply(true), () => reply(false))
    return true
  }
  return false
})

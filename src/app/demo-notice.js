// Whether this browser has already seen the online demo's welcome notice.
const DEMO_SEEN_KEY = 'pokeleet:demo:welcome-seen'

export function demoNoticeSeen() {
  try {
    return !!localStorage.getItem(DEMO_SEEN_KEY)
  } catch {
    return false
  }
}

export function markDemoNoticeSeen() {
  try {
    localStorage.setItem(DEMO_SEEN_KEY, '1')
  } catch {
    // private window: show it again next time
  }
}

import { useSyncExternalStore } from 'react'

// The current time, re-rendering the caller every `TICK_MS` (for live timers).
const TICK_MS = 250
let now = Date.now()

function subscribe(onChange) {
  const id = setInterval(() => {
    now = Date.now()
    onChange()
  }, TICK_MS)
  return () => clearInterval(id)
}

function snapshot() {
  if (Date.now() - now > TICK_MS) now = Date.now() // nobody was ticking: catch up
  return now
}

export function useNow() {
  return useSyncExternalStore(subscribe, snapshot)
}

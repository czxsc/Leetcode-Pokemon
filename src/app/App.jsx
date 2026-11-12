import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { config } from '../config'
import { Dashboard } from '../features/dashboard/Dashboard'
import { Focus } from '../features/focus/Focus'
import { Onboarding } from '../features/onboarding/Onboarding'
import { Pokedex } from '../features/pokedex/Pokedex'
import { Quests } from '../features/quests/Quests'
import { Recall } from '../features/recall/Recall'
import { Shop } from '../features/shop/Shop'
import { Summon } from '../features/summon/Summon'
import { Team } from '../features/team/Team'
import { focus } from '../state/focus'
import { useStore } from '../state/store'
import { demoNoticeSeen } from './demo-notice'
import { DemoNotice } from './DemoNotice'
import { SaveBanner } from './SaveBanner'
import { screenSize } from './screen-size'
import { TopNav } from './TopNav'

const PAGES = {
  dashboard: Dashboard,
  summon: Summon,
  quests: Quests,
  recall: Recall,
  team: Team,
  pokedex: Pokedex,
  shop: Shop,
  focus: Focus,
}

// Sizes the app's screen for the window (screen-size.js decides how).
function fit() {
  const screen = document.getElementById('screen')
  if (!screen) return
  const { width, height, scale, left, top } = screenSize(window.innerWidth, window.innerHeight)
  screen.style.left = left + 'px'
  screen.style.top = top + 'px'
  screen.style.width = width + 'px'
  screen.style.height = height + 'px'
  screen.style.transform = `scale(${scale})`
}

// session: the signed-in account (cloud app only)
export function App({ session }) {
  const [page, setPage] = useState('dashboard')
  const [demoNotice, setDemoNotice] = useState(() => config.demo && !demoNoticeSeen())
  const onboarded = useStore((s) => s.onboarded)
  const frame = useRef(null)
  useEffect(() => {
    focus.start()
    return () => focus.stop()
  }, [])
  // before the first paint, so the app never shows at the wrong size
  useLayoutEffect(() => {
    window.addEventListener('resize', fit)
    fit()
    return () => window.removeEventListener('resize', fit)
  }, [])
  // on a narrow screen the whole page scrolls, so a new tab starts at its top
  useLayoutEffect(() => {
    frame.current.scrollTop = 0
  }, [page])
  const Page = PAGES[page]
  return (
    <div id="screen-wrap">
      <div id="screen" data-screen-label="App">
        <div className="scene-bg"></div>
        <div id="app" style={{ position: 'absolute', inset: 0 }}>
          <div ref={frame} className="app-frame">
            {/* first run: name, photo and starting team before anything else */}
            {onboarded ? (
              <TopNav
                page={page}
                setPage={setPage}
                onDemo={() => setDemoNotice(true)}
                session={session}
              />
            ) : null}
            <div key={page} className={'app-page' + (onboarded ? ' fade-in' : '')}>
              {onboarded ? <Page /> : <Onboarding />}
            </div>
            {demoNotice ? <DemoNotice onClose={() => setDemoNotice(false)} /> : null}
            <SaveBanner />
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
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

// The app is laid out on a fixed 1280x800 screen, scaled to fit the window.
function fit() {
  const wrap = document.getElementById('screen-wrap')
  const screen = document.getElementById('screen')
  if (!wrap || !screen) return
  const s = Math.min(wrap.clientWidth / 1280, wrap.clientHeight / 800)
  screen.style.transform = `scale(${s})`
}

// session: the signed-in account (cloud app only)
export function App({ session }) {
  const [page, setPage] = useState('dashboard')
  const [demoNotice, setDemoNotice] = useState(() => config.demo && !demoNoticeSeen())
  const onboarded = useStore((s) => s.onboarded)
  useEffect(() => {
    focus.start()
    window.addEventListener('resize', fit)
    fit()
    const fitSoon = setTimeout(fit, 60)
    const fitLater = setTimeout(fit, 300)
    return () => {
      window.removeEventListener('resize', fit)
      clearTimeout(fitSoon)
      clearTimeout(fitLater)
      focus.stop()
    }
  }, [])
  const Page = PAGES[page]
  return (
    <div id="screen-wrap">
      <div id="screen" data-screen-label="App">
        <div className="scene-bg"></div>
        <div id="app" style={{ position: 'absolute', inset: 0 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: 16,
            }}
          >
            {/* first run: name, photo and starting team before anything else */}
            {onboarded ? (
              <TopNav
                page={page}
                setPage={setPage}
                onDemo={() => setDemoNotice(true)}
                session={session}
              />
            ) : null}
            <div
              key={page}
              className={onboarded ? 'fade-in' : ''}
              style={{ flex: 1, minHeight: 0 }}
            >
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

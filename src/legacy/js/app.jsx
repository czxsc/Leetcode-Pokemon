/* =====================================================================
   App shell — page routing, fixed-screen scaling, stub pages.
===================================================================== */
;(function () {
  const { useState, useEffect } = React
  const PAGES = {
    dashboard: () => <window.Dashboard />,
    gacha: () => <window.Gacha />,
    quests: () => <window.Quests />,
    recall: () => <window.Recall />,
    team: () => <window.Team />,
    pokedex: () => <window.Pokedex />,
    shop: () => <window.Shop />,
    map: () => <window.Meadow />,
  }
  function App() {
    const [page, setPage] = useState('dashboard')
    const [demoNotice, setDemoNotice] = useState(
      () => window.AppConfig.demo && !window.demoNoticeSeen(),
    )
    const onboarded = window.useStore((s) => s.onboarded)
    useEffect(() => {
      if (window.Store && window.Store.startEngine) window.Store.startEngine()
      const onResize = () => fit()
      window.addEventListener('resize', onResize)
      fit()
      const fitSoon = setTimeout(fit, 60)
      const fitLater = setTimeout(fit, 300)
      return () => {
        window.removeEventListener('resize', onResize)
        clearTimeout(fitSoon)
        clearTimeout(fitLater)
        if (window.Store && window.Store.stopEngine) window.Store.stopEngine()
      }
    }, [])
    return (
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
          <TopNav page={page} setPage={setPage} onDemo={() => setDemoNotice(true)} />
        ) : null}
        {onboarded ? (
          <div
            key={page}
            className="fade-in"
            style={{
              flex: 1,
              minHeight: 0,
            }}
          >
            {(PAGES[page] || PAGES.dashboard)()}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
            }}
          >
            <window.Onboarding />
          </div>
        )}
        {demoNotice ? <window.DemoNotice onClose={() => setDemoNotice(false)} /> : null}
        <window.SaveBanner />
      </div>
    )
  }

  // ---- fit the 1280x800 screen into the viewport ----
  function fit() {
    const wrap = document.getElementById('screen-wrap')
    const screen = document.getElementById('screen')
    if (!wrap || !screen) return
    const s = Math.min(wrap.clientWidth / 1280, wrap.clientHeight / 800)
    screen.style.transform = `scale(${s})`
  }
  window.LegacyApp = App
})()

export {}

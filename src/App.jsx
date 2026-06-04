function App() {
  const LegacyApp = window.LegacyApp

  return (
    <div id="screen-wrap">
      <div id="screen" data-screen-label="App">
        <div className="scene-bg"></div>
        <div id="app" style={{ position: 'absolute', inset: 0 }}>
          {LegacyApp ? <LegacyApp /> : null}
        </div>
      </div>
    </div>
  )
}

export default App

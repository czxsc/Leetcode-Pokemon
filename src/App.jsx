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

// Shown instead of the app when saved data exists but can't be read, so
// nothing gets overwritten until the problem is fixed.
export function StorageError({ message }) {
  return (
    <div className="boot-error">
      <div className="panel">
        <div className="panel-title"><span className="dot"></span>Couldn&rsquo;t load your data</div>
        <p>{message}</p>
        <button className="btn green" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </div>
  )
}

export default App

import { useSaveStatus } from '../state/store'

// Blocks the app if another tab took over the data; warns if saving fails.
export function SaveBanner() {
  const s = useSaveStatus()
  if (s.state === 'conflict') {
    return (
      <div
        className="modal-veil"
        style={{
          zIndex: 90,
        }}
      >
        <div
          className="panel modal"
          style={{
            width: 460,
            textAlign: 'center',
          }}
        >
          <div
            className="panel-title"
            style={{
              justifyContent: 'center',
            }}
          >
            <span className="dot" />
            Opened somewhere else
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--ink-soft)',
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            Your PokéLeet data was saved from another tab or window, so this one stopped saving to
            avoid overwriting it. Reload to continue with the latest progress.
          </div>
          <button className="btn green" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    )
  }
  if (s.state === 'error') return <div className="save-banner">{'\u26a0 ' + s.error}</div>
  return null
}

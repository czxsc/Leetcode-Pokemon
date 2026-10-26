import { config } from '../config'
import { markDemoNoticeSeen } from './demo-notice'

// Welcome notice of the online demo (GitHub Pages build only).

export function DemoNotice({ onClose }) {
  const repo = config.repoUrl
  const folder = repo.split('/').pop() || 'Leetcode-Pokemon'
  function close() {
    markDemoNoticeSeen()
    onClose()
  }
  return (
    <div
      className="modal-veil"
      style={{
        zIndex: 85,
      }}
      onClick={close}
    >
      <div className="panel modal demo-notice" onClick={(ev) => ev.stopPropagation()}>
        <div className="panel-title">
          <span className="dot" />
          Welcome to the PokéLeet demo
        </div>
        <div className="chip-card demo-warning">
          <div className="demo-warning-title">⚠ This online version is for demo purposes only</div>
          <ul>
            <li>
              Progress is saved in this browser only — clearing site data, a private window, or
              another browser or device starts over.
            </li>
            <li>Nothing is uploaded: there are no accounts, sync or backups here.</li>
          </ul>
        </div>
        <p>
          To use PokéLeet for real, clone it from GitHub and run it on your computer. It saves
          everything to your own disk:
        </p>
        {repo ? (
          <pre className="demo-cmd">{`git clone ${repo}.git\ncd ${folder}\nnpm install\nnpm start`}</pre>
        ) : null}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {repo ? (
            <a className="btn" href={repo} target="_blank" rel="noopener noreferrer">
              View on GitHub ↗
            </a>
          ) : null}
          <button className="btn green" onClick={close}>
            Try the demo
          </button>
        </div>
      </div>
    </div>
  )
}

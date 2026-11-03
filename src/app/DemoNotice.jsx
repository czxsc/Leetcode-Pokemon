import { config } from '../config'
import { markDemoNoticeSeen } from './demo-notice'

// Welcome notice of the online demo: the GitHub Pages build, or the cloud
// app's own demo (config.cloudDemo), which offers an account instead.

export function DemoNotice({ onClose }) {
  const repo = config.repoUrl
  const folder = repo.split('/').pop() || 'Leetcode-Pokemon'
  const cloud = config.cloudDemo
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
          <div className="demo-warning-title">
            {cloud
              ? '⚠ The demo is saved in this browser only'
              : '⚠ This online version is for demo purposes only'}
          </div>
          <ul>
            <li>
              Progress is saved in this browser only — clearing site data, a private window, or
              another browser or device starts over.
            </li>
            <li>
              {cloud
                ? 'Nothing is uploaded while you’re in the demo.'
                : 'Nothing is uploaded: there are no accounts, sync or backups here.'}
            </li>
          </ul>
        </div>
        {cloud ? (
          <p>
            Want to keep your progress? Create a free account and it’s saved to the cloud, ready on
            any device you sign in on. Accounts start fresh, separate from the demo.
          </p>
        ) : (
          <>
            <p>
              To use PokéLeet for real, clone it from GitHub and run it on your computer. It saves
              everything to your own disk:
            </p>
            {repo ? (
              <pre className="demo-cmd">{`git clone ${repo}.git\ncd ${folder}\nnpm install\nnpm start`}</pre>
            ) : null}
          </>
        )}
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
          {cloud ? (
            <a className="btn lav" href={import.meta.env.BASE_URL}>
              Create an account
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

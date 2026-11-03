import { useEffect, useRef, useState } from 'react'
import { config } from '../../config'
import { todayLocal } from '../../game/dates'
import { store, useSaveStatus } from '../../state/store'
import { hintStyle } from './shared'

// ---------- deleting the account (cloud app) ----------
function DeleteAccount({ onCancel }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)
  useEffect(() => ref.current?.scrollIntoView({ block: 'nearest' }), [])
  async function deleteAccount() {
    setDeleting(true)
    setError(null)
    try {
      await store.deleteAccount() // signs out, leaving the page
    } catch (err) {
      setError(err.message || 'Could not delete your account.')
      setDeleting(false)
    }
  }
  return (
    <div ref={ref} className="chip-card demo-warning">
      <div className="demo-warning-title">⚠ Delete your account?</div>
      <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}>
        This permanently deletes your account, problems and progress. It can&rsquo;t be undone, so
        export a backup first if you want a copy.
      </p>
      {error ? (
        <div style={{ fontSize: 13, color: 'var(--hard)', marginBottom: 10 }}>{'✖ ' + error}</div>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn" type="button" disabled={deleting} onClick={onCancel}>
          Cancel
        </button>
        <button className="btn pink" type="button" disabled={deleting} onClick={deleteAccount}>
          {deleting ? 'Deleting…' : 'Delete everything'}
        </button>
      </div>
    </div>
  )
}

// ---------- data / backups ----------
export function DataModal({ onClose }) {
  const status = useSaveStatus()
  const [msg, setMsg] = useState(null)
  const [askDelete, setAskDelete] = useState(false)
  const fileRef = useRef(null)
  const disk = status.mode === 'local'
  function exportBackup() {
    try {
      const blob = new Blob([store.exportData()], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pokeleet-backup-${todayLocal()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMsg({
        ok: true,
        text: 'Backup exported — it has your problems, solutions and game progress.',
      })
    } catch (err) {
      setMsg({
        ok: false,
        text: err.message || 'Could not export backup.',
      })
    }
  }
  function importBackup(ev) {
    const file = ev.target.files && ev.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        store.importData(String(reader.result || ''))
        setMsg({
          ok: true,
          text: 'Backup imported successfully.',
        })
      } catch (err) {
        setMsg({
          ok: false,
          text: err.message || 'Could not import backup.',
        })
      }
    }
    reader.onerror = () =>
      setMsg({
        ok: false,
        text: 'Could not read the selected backup file.',
      })
    reader.readAsText(file)
    ev.target.value = ''
  }
  function askImport() {
    if (window.confirm('Importing a backup replaces your current problems and progress. Continue?'))
      fileRef.current && fileRef.current.click()
  }
  const saved = status.savedAt ? new Date(status.savedAt).toLocaleTimeString() : null
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="panel modal" onClick={(ev) => ev.stopPropagation()}>
        <div className="panel-title">
          <span className="dot" />
          Your Data
        </div>
        <div
          className="chip-card"
          style={{
            padding: '12px 14px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 11,
              color: status.state === 'saved' ? 'var(--sage-deep)' : 'var(--hard)',
              marginBottom: 8,
            }}
          >
            {status.state !== 'saved'
              ? '✖ Not saving right now'
              : disk
                ? '✔ Saved to disk automatically'
                : status.mode === 'cloud'
                  ? '✔ Saved to your account automatically'
                  : '✔ Saved in this browser (demo)'}
          </div>
          {disk ? (
            <div>
              <div className="data-path">{status.location}</div>
              <div
                style={{
                  ...hintStyle,
                  marginBottom: 0,
                  marginTop: 8,
                }}
              >
                {
                  'progress.json and library.json hold everything. Solved problems are also written to '
                }
                <b>{'solutions/<tag>/'}</b>
                {' — one folder per tag — and a daily copy of your data is kept in '}
                <b>backups/</b>.
              </div>
            </div>
          ) : status.mode === 'cloud' ? (
            <div style={{ ...hintStyle, marginBottom: 0 }}>
              Your progress and problems are saved to your PokéLeet account, so they are there in
              any browser where you sign in.
            </div>
          ) : config.cloudDemo ? (
            <div style={{ ...hintStyle, marginBottom: 0 }}>
              This is the demo, so your progress is kept in this browser only. With a{' '}
              <a href={import.meta.env.BASE_URL}>free account</a>, it&rsquo;s saved to the cloud and
              follows you to any device.
            </div>
          ) : (
            <div
              style={{
                ...hintStyle,
                marginBottom: 0,
              }}
            >
              {
                'This is the online demo, so your progress is kept in this browser only. To save progress and a folder of your solutions on your own computer, clone PokéLeet from '
              }
              {config.repoUrl ? (
                <a href={config.repoUrl} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              ) : (
                'GitHub'
              )}
              {' and run it with '}
              <b>npm start</b>.
            </div>
          )}
          {saved ? (
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 8,
                color: 'var(--ink-faint)',
                marginTop: 8,
              }}
            >
              {'last saved ' + saved}
            </div>
          ) : null}
          {status.error ? (
            <div
              style={{
                fontSize: 13,
                color: 'var(--hard)',
                marginTop: 8,
              }}
            >
              {status.error}
            </div>
          ) : null}
        </div>
        <div style={hintStyle}>
          Backups are a single JSON file you can keep anywhere or import on another computer.
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <button className="btn" type="button" onClick={exportBackup}>
            Export Backup
          </button>
          <button className="btn" type="button" onClick={askImport}>
            Import Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={importBackup}
            style={{
              display: 'none',
            }}
          />
        </div>
        {msg ? (
          <div
            style={{
              fontSize: 13,
              color: msg.ok ? 'var(--sage-deep)' : 'var(--hard)',
              marginBottom: 12,
              fontFamily: "'Silkscreen'",
              lineHeight: 1.5,
            }}
          >
            {(msg.ok ? '✔ ' : '✖ ') + msg.text}
          </div>
        ) : null}
        {askDelete ? <DeleteAccount onCancel={() => setAskDelete(false)} /> : null}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: askDelete ? 14 : 0,
          }}
        >
          {status.mode === 'cloud' && !askDelete ? (
            <button className="iconbtn" type="button" onClick={() => setAskDelete(true)}>
              Delete account…
            </button>
          ) : (
            <span />
          )}
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

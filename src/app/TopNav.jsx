import { useEffect, useRef, useState } from 'react'
import { Coin, Pokeball, Shard } from '../components/icons'
import { config } from '../config'
import { DataModal } from '../features/dashboard/DataModal'
import { useSaveStatus, useStore } from '../state/store'
import { DISCLAIMER } from './disclaimer'

// ---- top nav ----
const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    dot: 'var(--sage)',
  },
  {
    id: 'summon',
    label: 'Summon',
    dot: 'var(--lav)',
  },
  {
    id: 'quests',
    label: 'Quests',
    dot: 'var(--pink)',
  },
  {
    id: 'recall',
    label: 'Recall',
    dot: 'var(--sky)',
  },
  {
    id: 'team',
    label: 'Team',
    dot: 'var(--sage-deep)',
  },
  {
    id: 'pokedex',
    label: 'Pok\u00e9dex',
    dot: 'var(--coin-deep)',
  },
  {
    id: 'shop',
    label: 'Shop',
    dot: 'var(--coin)',
  },
  {
    id: 'focus',
    label: 'Focus',
    dot: 'var(--mint)',
  },
]

function CurrencyCluster() {
  const st = useStore((s) => ({
    shards: s.shards,
    coins: s.coins,
  }))
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
      }}
    >
      <div className="cur-badge" title="Poké-Shards — spent on summons">
        <Shard size={17} />
        {st.shards.toLocaleString()}
      </div>
      <div className="cur-badge" title="Poké-Coins — spent in the shop">
        <Coin size={16} />
        {st.coins.toLocaleString()}
      </div>
    </div>
  )
}

function SaveStatus() {
  const s = useSaveStatus()
  const title =
    s.state === 'conflict'
      ? 'Stopped saving \u2014 your data was changed in another tab'
      : s.state === 'error'
        ? s.error
        : s.mode === 'browser'
          ? 'Demo: progress is saved in this browser only'
          : 'Progress is saved to ' + s.location
  return <span className={'save-dot ' + (s.state === 'saved' ? s.mode : 'bad')} title={title} />
}

// The logo's dropdown: the account, its data and the legal pages.
function BrandMenu({ session, onData }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const button = useRef(null)
  useEffect(() => {
    if (!open) return
    function clickAway(ev) {
      if (!root.current.contains(ev.target)) setOpen(false)
    }
    function escape(ev) {
      if (ev.key !== 'Escape') return
      setOpen(false)
      button.current.focus()
    }
    document.addEventListener('pointerdown', clickAway)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', clickAway)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  // The legal pages describe the website, not a copy run on your own computer.
  const hosted = session || config.demo
  return (
    <div ref={root}>
      <button
        ref={button}
        className="brand-btn"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Pokeball size={26} />
        <span className="pixel-font brand-word">PokéLeet</span>
        <span className="brand-caret" />
      </button>
      {open ? (
        <div className="brand-pop">
          {session ? (
            <div className="brand-account">
              Signed in as <b>{session.email}</b>
            </div>
          ) : null}
          <button
            className="brand-item"
            onClick={() => {
              setOpen(false)
              onData()
            }}
          >
            {session ? 'Account & backups' : 'Backups'}
          </button>
          {/* a new tab, since leaving the app would end a running study session */}
          {hosted
            ? [
                ['privacy.html', 'Privacy Policy'],
                ['terms.html', 'Terms of Service'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  className="brand-item"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              ))
            : null}
          {session ? (
            <button className="brand-item" onClick={() => session.signOut()}>
              Sign out
            </button>
          ) : null}
          <p className="brand-note">{DISCLAIMER}</p>
        </div>
      ) : null}
    </div>
  )
}

// session: the signed-in account (cloud app only)
export function TopNav({ page, setPage, onDemo, session }) {
  const [dataOpen, setDataOpen] = useState(false)
  return (
    <div className="topnav">
      <div className="wood-sign topnav-brand">
        <BrandMenu session={session} onData={() => setDataOpen(true)} />
        {config.demo ? (
          <button className="demo-badge" title="Online demo — click for details" onClick={onDemo}>
            Demo
          </button>
        ) : null}
        <SaveStatus />
      </div>
      <nav className="nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'nav-tab' + (page === t.id ? ' active' : '')}
            onClick={() => setPage(t.id)}
          >
            <span
              className="tdot"
              style={{
                background: t.dot,
              }}
            />
            {t.label}
          </button>
        ))}
      </nav>
      <div className="wood-sign topnav-cur">
        <CurrencyCluster />
      </div>
      {/* out here so its veil covers the screen, not just the positioned sign */}
      {dataOpen ? <DataModal onClose={() => setDataOpen(false)} /> : null}
    </div>
  )
}

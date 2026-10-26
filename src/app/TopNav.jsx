import { Coin, Pokeball, Shard } from '../components/icons'
import { config } from '../config'
import { useSaveStatus, useStore } from '../state/store'

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

// session: the signed-in account (cloud app only)
export function TopNav({ page, setPage, onDemo, session }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div
        className="wood-sign"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
        }}
      >
        <Pokeball size={26} />
        <div
          className="pixel-font"
          style={{
            fontSize: 15,
            lineHeight: 1,
            color: '#5d4026',
          }}
        >
          PokéLeet
        </div>
        {config.demo ? (
          <button className="demo-badge" title="Online demo — click for details" onClick={onDemo}>
            Demo
          </button>
        ) : null}
        <SaveStatus />
      </div>
      <nav
        className="nav"
        style={{
          flex: 1,
        }}
      >
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
      <div
        className="wood-sign"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
        }}
      >
        <CurrencyCluster />
        {session ? (
          <button
            className="demo-badge"
            style={{ marginLeft: 8 }}
            title={'Signed in as ' + session.email}
            onClick={() => session.signOut()}
          >
            Sign out
          </button>
        ) : null}
      </div>
    </div>
  )
}

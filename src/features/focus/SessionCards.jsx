import { useState } from 'react'
import { Coin, Shard } from '../../components/icons'
import { config } from '../../config'
import * as Study from '../../game/study'
import { focus } from '../../state/focus'
import { clock } from './shared'

// ---- Tracker status (side panel) ----
export function TrackerStatus({ tracker }) {
  const cfg = {
    checking: {
      color: 'var(--ink-faint)',
      label: 'Looking for the Tracker…',
    },
    connected: {
      color: 'var(--sage-deep)',
      label: 'Tracker connected',
      text: 'The timer runs while LeetCode is your active tab.',
    },
    missing: {
      color: 'var(--hard)',
      label: 'Tracker not found',
      text: 'Study sessions need the PokéLeet Tracker extension. Open chrome://extensions, turn on Developer mode, click Load unpacked and pick the extension folder inside your PokéLeet folder. Then reload this page.',
    },
    outdated: {
      color: 'var(--coin-deep)',
      label: 'Tracker needs a reload',
      text:
        'Your Tracker (v' +
        tracker.version +
        ') is older than this PokéLeet (v' +
        tracker.expectedVersion +
        '). On chrome://extensions click the reload icon on PokéLeet Tracker, then reload this page.',
    },
    gone: {
      color: 'var(--coin-deep)',
      label: 'Tracker was reloaded',
      text: 'Reload this page to reconnect to it.',
    },
    unavailable: {
      color: 'var(--ink-faint)',
      label: 'Not available in the demo',
      text: 'Study sessions need PokéLeet running on your computer, plus its Tracker browser extension.',
    },
  }[tracker.state]
  const reload =
    tracker.state === 'missing' || tracker.state === 'outdated' || tracker.state === 'gone'
  const repo = config.repoUrl
  return (
    <div
      className="chip-card"
      style={{
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <span
          className={tracker.state === 'connected' ? 'live-dot' : ''}
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: cfg.color,
            flex: 'none',
          }}
        />
        <span
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 10,
            color: 'var(--wood-dark)',
          }}
        >
          {cfg.label}
        </span>
        <span
          style={{
            flex: 1,
          }}
        />
        {reload ? (
          <button
            className="iconbtn"
            style={{
              padding: '4px 8px',
              fontSize: 9,
            }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        ) : null}
      </div>
      {cfg.text ? (
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-soft)',
            lineHeight: 1.45,
            marginTop: 6,
          }}
        >
          {cfg.text}
          {tracker.state === 'unavailable' && repo ? (
            <span>
              {' '}
              <a
                href={repo}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--lav-deep)',
                  fontWeight: 600,
                }}
              >
                Get PokéLeet ↗
              </a>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

// ---- idle: deploy (field centre) ----
export function DeployCard({ team, tracker }) {
  const [busy, setBusy] = useState(false)
  const blocker =
    tracker.state === 'unavailable'
      ? 'Study sessions only run in the local app.'
      : tracker.state === 'checking'
        ? 'Looking for the Tracker…'
        : !tracker.ready
          ? 'Set up the Tracker to start (see the side panel).'
          : team.length === 0
            ? 'Add Pokémon to your team first!'
            : null
  async function deploy() {
    if (blocker || busy) return
    setBusy(true)
    try {
      await focus.deployTeam()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="panel cream study-card">
      <div className="panel-title">
        <span className="dot" />
        Ready to focus?
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-soft)',
          lineHeight: 1.45,
          marginBottom: 14,
        }}
      >
        Deploy your team and LeetCode opens. They battle for Coins while LeetCode is your active
        tab.
      </div>
      <button
        className="btn green"
        disabled={!!blocker || busy}
        onClick={deploy}
        style={{
          width: '100%',
          fontSize: 13,
          padding: '12px 18px',
        }}
      >
        ▶ Deploy Team
      </button>
      {blocker ? (
        <div
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--ink-faint)',
            textAlign: 'center',
            marginTop: 9,
          }}
        >
          {blocker}
        </div>
      ) : null}
    </div>
  )
}

// ---- ended: summary (field centre) ----
const END_TEXT = {
  paused: 'Ended after 5 minutes away from LeetCode.',
  cap: 'You hit the 3-hour limit. Great session!',
  manual: 'You ended the session.',
}

export function SummaryCard({ s }) {
  const tallying = s.settledMs < s.focusMs
  const stat = (label, value, icon) => (
    <div className="stile">
      <div className="lab">{label}</div>
      <div
        className="val"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        {icon || null}
        {value}
      </div>
    </div>
  )
  return (
    <div className="panel cream study-card">
      <div className="panel-title">
        <span className="dot" />
        Session complete
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-soft)',
          marginBottom: 12,
        }}
      >
        {END_TEXT[s.endReason] || ''}
      </div>
      <div
        style={{
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--ink-faint)',
            textTransform: 'uppercase',
          }}
        >
          Time on LeetCode
        </div>
        <div
          className="study-clock"
          style={{
            fontSize: 34,
          }}
        >
          {clock(s.focusMs)}
        </div>
      </div>
      {tallying ? (
        <div
          style={{
            fontFamily: "'VT323'",
            fontSize: 17,
            color: 'var(--ink-faint)',
            textAlign: 'center',
            padding: '12px 0',
          }}
        >
          Tallying your team’s battles…
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 14,
          }}
        >
          {stat('Bosses defeated', s.earned.kills)}
          {stat('Team EXP', '+' + s.earned.exp)}
          {stat('Coins', '+' + s.earned.coins, <Coin size={13} />)}
          {stat('Shards', '+' + s.earned.shards, <Shard size={14} />)}
        </div>
      )}
      <button
        className="btn green"
        disabled={tallying}
        style={{
          width: '100%',
        }}
        onClick={() => focus.dismissSession()}
      >
        Done
      </button>
    </div>
  )
}

// ---- active: paused notice (field top) ----
export function PausedNotice({ s, tracker, now }) {
  const opening = s.focusMs === 0 && now - s.startedAt < 5000
  const why = opening
    ? 'Opening LeetCode…'
    : tracker.ready
      ? 'Paused — LeetCode isn’t your active tab'
      : 'Paused — the Tracker isn’t connected'
  return (
    <div className="panel cream paused-notice">
      <div
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: 11,
          color: 'var(--wood-dark)',
        }}
      >
        {(opening ? '' : '❚❚ ') + why}
      </div>
      {opening ? null : (
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-soft)',
            margin: '5px 0 9px',
          }}
        >
          {'Session ends in '}
          <b>{clock(Study.endsAt(s) - now)}</b>
          {' unless you go back.'}
        </div>
      )}
      {opening || !tracker.ready ? null : (
        <button
          className="btn green"
          style={{
            fontSize: 10,
            padding: '7px 14px',
          }}
          onClick={() => focus.backToLeetCode()}
        >
          Back to LeetCode ↗
        </button>
      )}
    </div>
  )
}

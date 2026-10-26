/* =====================================================================
   Meadow (the Focus tab) — study sessions. Deploy your team and LeetCode opens; the
   session timer (src/study.js) runs while the PokéLeet Tracker reports
   LeetCode as the active tab, and your team battles daily-seeded
   mini-bosses only for that time. Combat runs in the store; this page
   visualizes it: big boss sprite, HP bar, team gathered round.
===================================================================== */
;(function () {
  const { useState, useEffect, useRef } = React
  const RARITY = window.PixelMon.RARITY
  const Study = window.Study

  // 6 slots arranged around the boss (percent positions in the field)
  const RING = [
    {
      x: 24,
      y: 40,
    },
    {
      x: 24,
      y: 66,
    },
    {
      x: 38,
      y: 78,
    },
    {
      x: 76,
      y: 40,
    },
    {
      x: 76,
      y: 66,
    },
    {
      x: 62,
      y: 78,
    },
  ]
  const IDLE = [
    {
      x: 18,
      y: 30,
    },
    {
      x: 34,
      y: 62,
    },
    {
      x: 50,
      y: 36,
    },
    {
      x: 66,
      y: 64,
    },
    {
      x: 80,
      y: 34,
    },
    {
      x: 46,
      y: 72,
    },
  ]
  const pad = (n) => String(n).padStart(2, '0')
  // 1:02:03 / 25:13
  function clock(ms) {
    const t = Math.max(0, Math.floor(ms / 1000)),
      h = Math.floor(t / 3600),
      m = Math.floor(t / 60) % 60,
      s = t % 60
    return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s)
  }
  // 1h 05m / 25m / 40s
  function short(ms) {
    const t = Math.max(0, Math.round(ms / 1000))
    if (t < 60) return t + 's'
    const m = Math.round(t / 60)
    return m >= 60 ? Math.floor(m / 60) + 'h ' + pad(m % 60) + 'm' : m + 'm'
  }

  // ---- Tracker status (side panel) ----
  function TrackerStatus({ tracker }) {
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
    const repo = window.AppConfig.repoUrl
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
  function DeployCard({ team, tracker }) {
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
        await window.Store.deployTeam()
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
  function SummaryCard({ s }) {
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
          onClick={() => window.Store.dismissSession()}
        >
          Done
        </button>
      </div>
    )
  }

  // ---- active: paused notice (field top) ----
  function PausedNotice({ s, tracker, now }) {
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
            onClick={() => window.Store.backToLeetCode()}
          >
            Back to LeetCode ↗
          </button>
        )}
      </div>
    )
  }
  function Meadow() {
    const st = window.useStore()
    const { zone, weather } = window.DATA.daySeed(window.Store.TODAY)
    const team = window.Derived.teamList()
    const s = window.Store.study()
    const trackerStatus = window.Tracker.status()
    const tracker = {
      ...trackerStatus,
      ready: window.Tracker.ready(),
    }
    const active = Study.isActive(s)
    const running = Study.isRunning(s)
    const boss = active && s.combat ? s.combat.boss : null
    const now = Date.now()

    // re-render for the timer and live log (ephemeral, not in store state)
    const [, force] = useState(0)
    useEffect(() => {
      const id = setInterval(() => force((x) => x + 1), 250)
      return () => clearInterval(id)
    }, [])
    const tufts = useRef(
      Array.from({
        length: 26,
      }).map(() => ({
        x: Math.random() * 96,
        y: Math.random() * 92,
        s: 0.7 + Math.random(),
      })),
    ).current
    const log = window.Store.meadowLog
    const weatherMatch = team.some((m) => window.PixelMon.byId(m.sp).type === weather.type)
    return (
      <div
        style={{
          height: '100%',
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 14,
          overflow: 'hidden',
        }}
      >
        {/* FIELD */}
        <div
          className="panel"
          style={{
            padding: 8,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            className={'meadow-field' + (active && !running ? ' paused' : '')}
            style={{
              background: 'linear-gradient(160deg, ' + zone.accent + '55, var(--mint))',
            }}
          >
            {tufts.map((t, i) => (
              <div
                key={i}
                className="grass-tuft"
                style={{
                  left: t.x + '%',
                  top: t.y + '%',
                  transform: 'scale(' + t.s + ')',
                }}
              />
            ))}
            {/* BIG boss in the centre */}
            {boss ? (
              <div
                className="boss-wrap"
                style={{
                  left: '50%',
                  top: '46%',
                }}
              >
                <div
                  className={
                    boss.tier === 'legend'
                      ? 'boss-legend glow-pulse'
                      : boss.tier === 'elite'
                        ? 'boss-elite glow-pulse'
                        : 'glow-pulse'
                  }
                >
                  <Creature
                    species={boss.sp}
                    shiny={boss.shiny}
                    size={boss.tier === 'legend' ? 190 : boss.tier === 'elite' ? 168 : 148}
                  />
                </div>
                {/* boss nameplate + HP */}
                <div
                  style={{
                    position: 'absolute',
                    top: -46,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 230,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginBottom: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    {boss.tier !== 'normal' ? (
                      <span
                        className="type-tag"
                        style={{
                          background: boss.tier === 'legend' ? 'var(--coin)' : 'var(--lav)',
                          color: '#fff',
                          fontSize: 8,
                        }}
                      >
                        {boss.tier === 'legend' ? '⭐ LEGENDARY' : '✨ ELITE'}
                      </span>
                    ) : null}
                    <span
                      className="type-tag"
                      style={{
                        background: RARITY[boss.rarity].color,
                        color: '#fff',
                        fontSize: 8,
                      }}
                    >
                      {RARITY[boss.rarity].label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Silkscreen'",
                        fontSize: 11,
                        color: 'var(--wood-dark)',
                        textShadow: '0 1px 0 #fff',
                      }}
                    >
                      {boss.name + '  Lv' + boss.level}
                    </span>
                  </div>
                  <div className="hpbar">
                    <i
                      style={{
                        width: Math.max(0, (boss.hp / boss.maxHp) * 100) + '%',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {/* team gathered around boss (or idling) */}
            {team.map((m, i) => {
              const p = boss ? RING[i] : IDLE[i]
              return (
                <div
                  key={m.iid}
                  className="wanderer"
                  style={{
                    left: p.x + '%',
                    top: p.y + '%',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                    }}
                  >
                    <Creature inst={m} size={46} bob={running || !active} />
                    <div
                      style={{
                        position: 'absolute',
                        top: -9,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontFamily: "'Silkscreen'",
                        fontSize: 7,
                        color: 'var(--wood-dark)',
                        background: 'rgba(255,255,255,.75)',
                        padding: '1px 3px',
                        borderRadius: 3,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {'Lv' + m.level}
                    </div>
                  </div>
                </div>
              )
            })}
            {/* floating damage numbers (per-tick, per-pokemon) */}
            {boss && running
              ? (window.Store.dmgEvents || [])
                  .filter((d) => now - d.t < 850)
                  .map((d) => {
                    const p = RING[d.slot] || RING[0]
                    const jx = ((d.id.charCodeAt(0) || 0) % 16) - 8
                    return (
                      <div
                        key={d.id}
                        className={'float-dmg' + (d.crit ? ' crit' : '')}
                        style={{
                          left: 'calc(' + p.x + '% + ' + jx + 'px)',
                          top: p.y - 7 + '%',
                        }}
                      >
                        {(d.crit ? '✷' : '') + '-' + d.dmg}
                      </div>
                    )
                  })
              : null}
            {/* header signs */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <div
                className="wood-sign"
                style={{
                  padding: '6px 12px',
                  fontFamily: "'Silkscreen'",
                  fontSize: 11,
                }}
              >
                {zone.name}
              </div>
              <div
                className="wood-sign"
                style={{
                  padding: '6px 10px',
                  fontSize: 14,
                }}
              >
                {weather.icon + ' ' + weather.name}
              </div>
            </div>
            {/* session timer */}
            {active ? (
              <div
                className="wood-sign"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {running ? (
                  <span className="live-dot" />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Silkscreen'",
                      fontSize: 9,
                      color: 'var(--coin-deep)',
                    }}
                  >
                    ❚❚
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "'Silkscreen'",
                    fontSize: 9,
                    color: running ? 'var(--sage-deep)' : 'var(--coin-deep)',
                  }}
                >
                  {running ? 'STUDYING' : 'PAUSED'}
                </span>
                <span
                  className="study-clock"
                  style={{
                    fontSize: 20,
                  }}
                >
                  {clock(Study.focusTime(s, now))}
                </span>
              </div>
            ) : null}
            {active && !running ? <PausedNotice s={s} tracker={tracker} now={now} /> : null}
            {!s ? <DeployCard team={team} tracker={tracker} /> : null}
            {s && !active ? <SummaryCard s={s} /> : null}
            {/* control */}
            {active ? (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <button className="btn" onClick={() => window.Store.endSession()}>
                  End Session
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {/* SIDE */}
        <div
          className="panel cream"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div className="panel-title">
            <span className="dot" />
            Study Session
          </div>
          <TrackerStatus tracker={tracker} />
          {active ? (
            <div
              className="chip-card"
              style={{
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: "'Silkscreen'",
                  fontSize: 8,
                  color: 'var(--ink-faint)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                <span>This session</span>
                <span>{short(s.startedAt + Study.SESSION_CAP - now) + ' left'}</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-soft)',
                  marginBottom: 6,
                }}
              >
                <b
                  style={{
                    color: 'var(--coin-deep)',
                  }}
                >
                  {s.earned.coins + 'c'}
                </b>
                {' · ' + s.earned.shards + ' shards · ' + s.earned.kills + ' KO'}
              </div>
              <button
                className="study-target"
                title="Bring LeetCode to the front"
                onClick={() => window.Store.backToLeetCode()}
              >
                Back to LeetCode ↗
              </button>
            </div>
          ) : null}
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
                gap: 6,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 11,
                  color: 'var(--wood-dark)',
                }}
              >
                {zone.name}
              </span>
              <span
                style={{
                  flex: 1,
                }}
              />
              {zone.types.map((t) => (
                <TypeTag key={t} type={t} />
              ))}
            </div>
            <div
              style={{
                fontSize: 12,
                color: weatherMatch ? 'var(--sage-deep)' : 'var(--ink-soft)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {weather.icon}
              <span>{weather.note + (weatherMatch ? '  — active!' : '')}</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <div
              className="stile"
              style={{
                flex: 1,
                padding: '8px 4px',
              }}
            >
              <div className="lab">Studied today</div>
              <div className="val">{short(st.meadow.studyToday)}</div>
            </div>
            <div
              className="stile"
              style={{
                flex: 1,
                padding: '8px 4px',
              }}
            >
              <div className="lab">Coins today</div>
              <div
                className="val"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  color: 'var(--coin-deep)',
                }}
              >
                <Coin size={13} />
                {st.meadow.coinsToday}
              </div>
            </div>
            <div
              className="stile"
              style={{
                flex: 1,
                padding: '8px 4px',
              }}
            >
              <div className="lab">Bosses KO’d</div>
              <div className="val">{st.meadow.kills}</div>
            </div>
          </div>
          <div
            className="chip-card"
            style={{
              padding: '8px 12px',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 9,
                color: 'var(--ink-faint)',
                marginBottom: 6,
              }}
            >
              BATTLE LOG
            </div>
            {!log || log.length === 0 ? (
              <div
                style={{
                  fontSize: 14,
                  color: 'var(--ink-faint)',
                  fontFamily: "'VT323'",
                }}
              >
                {active
                  ? 'Your team is heading out…'
                  : 'Deploy your team to battle mini-bosses while you study.'}
              </div>
            ) : (
              log.map((l) => (
                <div
                  key={l.id}
                  className="log-line"
                  style={{
                    color:
                      l.k === 'spawn'
                        ? 'var(--lav-deep)'
                        : l.k === 'away'
                          ? 'var(--coin-deep)'
                          : 'var(--ink-soft)',
                  }}
                >
                  {'› ' + l.t}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }
  window.Meadow = Meadow
})()

export {}

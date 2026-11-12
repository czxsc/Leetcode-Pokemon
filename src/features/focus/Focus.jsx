import { Creature } from '../../components/Creature'
import { Coin } from '../../components/icons'
import { TypeTag } from '../../components/Tags'
import { todayLocal } from '../../game/dates'
import * as D from '../../game/derived'
import { daySeed } from '../../game/meadow'
import * as PM from '../../game/species'
import { RARITY } from '../../game/species'
import * as Study from '../../game/study'
import { useNow } from '../../lib/useNow'
import { focus } from '../../state/focus'
import { useStore } from '../../state/store'
import { DeployCard, PausedNotice, SummaryCard, TrackerStatus } from './SessionCards'
import { clock, pad } from './shared'

// 1h 05m / 25m / 40s
function short(ms) {
  const t = Math.max(0, Math.round(ms / 1000))
  if (t < 60) return t + 's'
  const m = Math.round(t / 60)
  return m >= 60 ? Math.floor(m / 60) + 'h ' + pad(m % 60) + 'm' : m + 'm'
}

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

// grass tufts scattered over the field
const TUFTS = Array.from({ length: 26 }, () => ({
  x: Math.random() * 96,
  y: Math.random() * 92,
  s: 0.7 + Math.random(),
}))

export function Focus() {
  const st = useStore()
  const { zone, weather } = daySeed(todayLocal())
  const team = D.teamList(st)
  const s = focus.session()
  const trackerStatus = focus.tracker()
  const tracker = {
    ...trackerStatus,
    ready: focus.trackerReady(),
  }
  const active = Study.isActive(s)
  const running = Study.isRunning(s)
  const boss = active && s.combat ? s.combat.boss : null
  // re-renders for the timer and the live log
  const now = useNow()
  const log = focus.log()
  const weatherMatch = team.some((m) => PM.byId(m.sp).type === weather.type)
  return (
    <div className="split">
      {/* FIELD */}
      <div
        className="panel focus-field"
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
          {TUFTS.map((t, i) => (
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
            ? focus
                .dmgEvents()
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
            className="focus-signs"
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
              className="wood-sign focus-weather"
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
              className="wood-sign focus-clock"
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
              <button className="btn" onClick={() => focus.endSession()}>
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
              onClick={() => focus.backToLeetCode()}
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

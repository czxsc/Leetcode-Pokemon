import { useRef, useState } from 'react'
import pokeAvatar from '../../assets/PokeAvatar.png'
import { Creature } from '../../components/Creature'
import { Coin, Shard } from '../../components/icons'
import { todayLocal } from '../../game/dates'
import * as D from '../../game/derived'
import { monPower } from '../../game/derived'
import { expToNext, readyToEvolve, readyToTransform } from '../../game/rules'
import * as PM from '../../game/species'
import { shrinkPhoto } from '../../lib/photo'
import { store, useSaveStatus, useStore } from '../../state/store'
import { MonDetailModal } from '../team/MonDetailModal'
import { DataModal } from './DataModal'
import { ellipsis, scrollBody } from './shared'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ---------- RIGHT: trainer card ----------
function CommitGrid() {
  const st = useStore()
  const { grid } = D.trainingGrid(st, todayLocal(), 18)
  const lvl = (c) => (c <= 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c === 3 ? 3 : 4)
  // month label above a column when its first in-range day starts a new month
  const labels = []
  let lastMon = -1
  for (const wk of grid) {
    const cell = wk.find((c) => c)
    const mo = cell ? +cell.date.slice(5, 7) - 1 : lastMon
    labels.push(mo !== lastMon ? MON[mo] : '')
    lastMon = mo
  }
  const monthRow = labels.map((label, wi) => {
    return (
      <div
        key={wi}
        style={{
          width: 13,
          fontFamily: "'Silkscreen'",
          fontSize: 7,
          color: 'var(--ink-faint)',
          textAlign: 'left',
        }}
      >
        {label}
      </div>
    )
  })
  const fmt = (d) => {
    const mo = +d.slice(5, 7) - 1,
      day = +d.slice(8, 10)
    return MON[mo] + ' ' + day
  }
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 2,
          paddingLeft: 0,
        }}
      >
        {monthRow}
      </div>
      <div className="commit">
        {grid.map((wk, wi) => (
          <div className="wk" key={wi}>
            {wk.map((c, di) =>
              c ? (
                <div
                  key={di}
                  className={'cl l' + lvl(c.count)}
                  title={fmt(c.date) + (c.count ? '  ·  ' + c.count + ' solved' : '  ·  no solves')}
                />
              ) : (
                <div
                  key={di}
                  className="cl"
                  style={{
                    opacity: 0,
                  }}
                />
              ),
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          fontFamily: "'Silkscreen'",
          fontSize: 8,
          color: 'var(--ink-faint)',
        }}
      >
        less
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={'cl l' + l} />
        ))}
        more
        <span
          style={{
            marginLeft: 'auto',
          }}
        >
          hover a day
        </span>
      </div>
    </div>
  )
}

function TrainerName({ name }) {
  const [draft, setDraft] = useState(null) // null = not editing
  const skipBlur = useRef(false)
  if (draft === null) {
    return (
      <button
        className="trainer-name pixel-font"
        title="Rename your trainer"
        onClick={() => setDraft(name)}
      >
        {name}
        <span className="pencil">✎</span>
      </button>
    )
  }
  function commit() {
    if (skipBlur.current) {
      skipBlur.current = false
      return
    }
    store.setTrainerName(draft)
    setDraft(null)
  }
  return (
    <input
      className="trainer-name-input"
      value={draft}
      autoFocus={true}
      maxLength={24}
      onChange={(ev) => setDraft(ev.target.value)}
      onBlur={commit}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter') ev.target.blur()
        if (ev.key === 'Escape') {
          skipBlur.current = true
          setDraft(null)
        }
      }}
    />
  )
}

function TrainerAvatar({ avatar, onMessage }) {
  const fileRef = useRef(null)
  async function pick(ev) {
    const file = ev.target.files && ev.target.files[0]
    ev.target.value = ''
    if (!file) return
    if (!/^image\//.test(file.type)) {
      onMessage('That file isn’t an image.')
      return
    }
    try {
      const dataUrl = await shrinkPhoto(file)
      onMessage(store.setTrainerAvatar(dataUrl) ? null : 'Couldn’t use that image.')
    } catch (err) {
      onMessage(err.message || 'Couldn’t use that image.')
    }
  }
  return (
    <div className="trainer-avatar">
      <button
        type="button"
        className="avatar-upload"
        title="Upload a profile picture"
        aria-label="Upload a profile picture"
        onClick={() => fileRef.current && fileRef.current.click()}
      >
        <img
          src={avatar || pokeAvatar}
          alt="Trainer avatar"
          draggable={false}
          style={{
            imageRendering: avatar ? 'auto' : 'pixelated',
          }}
        />
        <span className="avatar-overlay" aria-hidden={true}>
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4" />
            <path d="M7 9l5-5 5 5" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
          <span className="avatar-overlay-label">upload</span>
        </span>
      </button>
      {avatar ? (
        <button
          type="button"
          className="avatar-reset"
          title="Use the default avatar"
          aria-label="Use the default avatar"
          onClick={() => {
            store.setTrainerAvatar(null)
            onMessage(null)
          }}
        >
          ×
        </button>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={pick}
        style={{
          display: 'none',
        }}
      />
    </div>
  )
}

export function TrainerCard() {
  const st = useStore()
  const today = todayLocal()
  const [detail, setDetail] = useState(null)
  const [avatarMsg, setAvatarMsg] = useState(null)
  const [dataOpen, setDataOpen] = useState(false)
  const saveStatus = useSaveStatus()
  const power = D.teamPower(st)
  const mult = D.teamMultiplier(st)
  const streak = D.streakInfo(st, today)
  const counts = D.solvedCounts(st)
  const byId = Object.fromEntries(st.owned.map((o) => [o.iid, o]))
  const team = st.team.map((iid) => byId[iid]).filter(Boolean)
  const since = st.createdAt
    ? 'since ' + MON[+st.createdAt.slice(5, 7) - 1] + ' ' + st.createdAt.slice(0, 4)
    : ''

  // strongest = most solved; needs training = fewest solved (catalog order breaks ties)
  const stats = D.tagStats(st)
  const maxSolved = Math.max(1, ...stats.map((c) => c.solved))
  const strong = stats
    .filter((c) => c.solved > 0)
    .sort((a, b) => b.solved - a.solved)
    .slice(0, 3)
  const weak = stats
    .filter((c) => !strong.includes(c))
    .sort((a, b) => a.solved - b.solved)
    .slice(0, 3)
  const TopicRow = (c, kind) => (
    <div
      key={c.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: 'var(--ink)',
          ...ellipsis,
        }}
      >
        {c.name}
      </span>
      <div
        className="minibar"
        style={{
          width: 54,
        }}
      >
        <i
          style={{
            width: (c.solved / maxSolved) * 100 + '%',
            background: kind === 'weak' ? 'var(--medium)' : 'var(--sage-deep)',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: 9,
          color: 'var(--ink-faint)',
          width: 30,
          textAlign: 'right',
        }}
      >
        {c.solved}
      </span>
    </div>
  )
  return (
    <div className="panel dash-col dash-trainer">
      {detail ? <MonDetailModal iid={detail} onClose={() => setDetail(null)} /> : null}
      {dataOpen ? <DataModal onClose={() => setDataOpen(false)} /> : null}
      <div style={scrollBody}>
        {/* header */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: avatarMsg ? 6 : 12,
          }}
        >
          <TrainerAvatar avatar={st.trainer.avatar} onMessage={setAvatarMsg} />
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <TrainerName name={st.trainer.name} />
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-faint)',
                marginTop: 3,
              }}
            >
              LeetCode Trainer
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--ink-faint)',
                marginTop: 2,
              }}
            >
              {since}
            </div>
          </div>
        </div>
        {avatarMsg ? (
          <div
            className="form-error"
            style={{
              margin: '0 0 10px',
            }}
          >
            {'✖ ' + avatarMsg}
          </div>
        ) : null}
        {/* stat tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            className="stile"
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                flex: 1,
              }}
            >
              <div className="lab">Team Fighting Power</div>
              <div
                className="val"
                style={{
                  fontSize: 24,
                }}
              >
                {power.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 10,
                color: 'var(--sage-deep)',
                textAlign: 'right',
              }}
            >
              <div>{'×' + mult.toFixed(2)}</div>
              <div
                style={{
                  color: 'var(--ink-faint)',
                  marginTop: 3,
                }}
              >
                team mult
              </div>
            </div>
          </div>
          <div className="stile">
            <div className="lab">Shards</div>
            <div
              className="val"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                color: 'var(--shard-deep)',
              }}
            >
              <Shard size={14} />
              {st.shards.toLocaleString()}
            </div>
          </div>
          <div className="stile">
            <div className="lab">Coins</div>
            <div
              className="val"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                color: 'var(--coin-deep)',
              }}
            >
              <Coin size={14} />
              {st.coins.toLocaleString()}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 0,
          }}
        >
          <div
            className="stile"
            style={{
              flex: 1,
            }}
          >
            <div className="lab">Streak</div>
            <div
              className="val"
              style={{
                fontSize: 14,
              }}
            >
              {streak.current + 'd'}
            </div>
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 8,
                color: 'var(--ink-faint)',
                marginTop: 2,
              }}
            >
              {'best ' + streak.best}
            </div>
          </div>
          <div
            className="stile"
            style={{
              flex: 1,
            }}
          >
            <div className="lab">Solved</div>
            <div
              className="val"
              style={{
                fontSize: 14,
              }}
            >
              {counts.total}
            </div>
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 8,
                color: 'var(--ink-faint)',
                marginTop: 2,
              }}
            >{`${counts.easy}/${counts.med}/${counts.hard}`}</div>
          </div>
        </div>
        {/* team strip */}
        <div
          className="panel-title"
          style={{
            marginTop: 14,
            alignItems: 'center',
          }}
        >
          <span className="dot" />
          Active Team
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: "'Silkscreen'",
              fontSize: 8,
              color: 'var(--ink-faint)',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            tap for details →
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 7,
            marginBottom: 6,
          }}
        >
          {team.map((m) => {
            const sp = PM.byId(m.sp)
            const need = expToNext(m.level)
            const evoReady = readyToEvolve(m)
            // strong enough for a Mega or G-Max form it hasn't unlocked yet
            const formReady =
              readyToTransform(m) &&
              ((sp.mega && !m.unlocked.mega) || (sp.gmax && !m.unlocked.gmax))
            return (
              <button
                key={m.iid}
                className="chip-card team-chip"
                onClick={() => setDetail(m.iid)}
                style={{
                  padding: '7px 4px 6px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  font: 'inherit',
                  width: '100%',
                }}
              >
                {evoReady ? (
                  <span
                    title="Ready to evolve"
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -5,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'var(--sage-deep)',
                      color: '#fff',
                      fontFamily: "'Silkscreen'",
                      fontSize: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #fff',
                      boxShadow: '0 0 6px var(--sage)',
                    }}
                  >
                    ↑
                  </span>
                ) : formReady ? (
                  <span
                    title="Ready for a Mega or G-Max form"
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -4,
                      width: 13,
                      height: 13,
                      borderRadius: '50%',
                      background: 'var(--lav)',
                      border: '2px solid #fff',
                    }}
                  />
                ) : null}
                <Creature inst={m} size={42} bob={true} />
                <div
                  style={{
                    fontFamily: "'Silkscreen'",
                    fontSize: 8,
                    color: 'var(--ink)',
                    marginTop: 2,
                    ...ellipsis,
                  }}
                >
                  {sp.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Silkscreen'",
                    fontSize: 8,
                    color: 'var(--ink-faint)',
                    marginBottom: 3,
                  }}
                >
                  {'Lv' + m.level + ' · ⚔' + monPower(m)}
                </div>
                <div className="expbar">
                  <i
                    style={{
                      width: Math.round((m.exp / need) * 100) + '%',
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>
        {/* commit grid */}
        <div
          className="panel-title"
          style={{
            marginTop: 14,
          }}
        >
          <span className="dot" />
          Training Log
        </div>
        <div
          className="chip-card"
          style={{
            padding: '10px 10px 8px',
          }}
        >
          <CommitGrid />
        </div>
        {/* strong / weak */}
        <div
          className="panel-title"
          style={{
            marginTop: 14,
          }}
        >
          <span className="dot" />
          Strongest Topics
        </div>
        {strong.length ? (
          strong.map((c) => TopicRow(c, 'strong'))
        ) : (
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-faint)',
              marginBottom: 6,
            }}
          >
            Solve a few problems to see your best topics.
          </div>
        )}
        <div
          className="panel-title"
          style={{
            marginTop: 10,
          }}
        >
          <span
            className="dot"
            style={{
              background: 'var(--medium)',
            }}
          />
          Needs Training
        </div>
        {weak.map((c) => TopicRow(c, 'weak'))}
        {/* where the save lives, backups */}
        <div
          className="panel-title"
          style={{
            marginTop: 14,
          }}
        >
          <span
            className="dot"
            style={{
              background: 'var(--sky)',
            }}
          />
          Data
        </div>
        <div
          className="chip-card"
          style={{
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 8,
                color: 'var(--ink-faint)',
              }}
            >
              SAVED TO
            </div>
            {/* a data folder path is long, so show its last two folders (full path on hover) */}
            <div
              title={saveStatus.location}
              style={{
                fontSize: 13,
                color: 'var(--ink)',
                marginTop: 3,
                ...ellipsis,
              }}
            >
              {saveStatus.mode === 'local'
                ? '…/' +
                  String(saveStatus.location)
                    .split(/[\\/]+/)
                    .filter(Boolean)
                    .slice(-2)
                    .join('/')
                : saveStatus.location}
            </div>
          </div>
          <button
            className="iconbtn"
            title="Where your data is saved, backups"
            onClick={() => setDataOpen(true)}
          >
            Backups
          </button>
        </div>
      </div>
    </div>
  )
}

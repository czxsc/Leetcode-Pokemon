import { useState } from 'react'
import { Creature } from '../../components/Creature'
import { Shard } from '../../components/icons'
import { Toast } from '../../components/Toast'
import * as D from '../../game/derived'
import { monPower } from '../../game/derived'
import { releaseValue } from '../../game/rules'
import * as PM from '../../game/species'
import { store, useStore } from '../../state/store'
import { MonCard } from './MonCard'
import { MonDetailModal } from './MonDetailModal'

const monName = (o) => (o.shiny ? 'Shiny ' : '') + PM.byId(o.sp).name

const RANK = {
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
}

export function Team() {
  const st = useStore()
  const [sortKey, setSortKey] = useState('rarity')
  const [detail, setDetail] = useState(null)
  const [releasing, setReleasing] = useState(false)
  const [picked, setPicked] = useState([])
  const [toast, setToast] = useState(null)
  const byId = Object.fromEntries(st.owned.map((o) => [o.iid, o]))
  const team = st.team
  const full = team.length >= 6
  function toggle(iid) {
    if (team.includes(iid)) store.setTeam(team.filter((x) => x !== iid))
    else if (!full) store.setTeam([...team, iid])
  }
  function pick(iid) {
    setPicked((p) => (p.includes(iid) ? p.filter((x) => x !== iid) : [...p, iid]))
  }
  function stopReleasing() {
    setReleasing(false)
    setPicked([])
  }
  const pickedMons = picked.map((i) => byId[i]).filter((o) => o && !team.includes(o.iid))
  const releaseTotal = pickedMons.reduce((n, o) => n + releaseValue(o), 0)
  const keepsOne = pickedMons.length < st.owned.length
  function release() {
    if (!pickedMons.length || !keepsOne) return
    const leaving = new Set(pickedMons.map((o) => o.iid))
    const notes = []
    const formed = pickedMons.filter((o) => o.unlocked && (o.unlocked.mega || o.unlocked.gmax))
    if (formed.length)
      notes.push(
        'Mega / G-Max forms unlocked on ' +
          formed.map(monName).join(', ') +
          ' are lost (stones aren’t refunded).',
      )
    const lastOf = pickedMons.filter(
      (o) => !st.owned.some((x) => !leaving.has(x.iid) && x.sp === o.sp),
    )
    if (lastOf.length)
      notes.push(
        lastOf.map((o) => PM.byId(o.sp).name).join(', ') +
          ' will leave your Pokédex until you catch ' +
          (lastOf.length === 1 ? 'it' : 'them') +
          ' again.',
      )
    const ask =
      'Release ' +
      pickedMons.map(monName).join(', ') +
      ' for ' +
      releaseTotal.toLocaleString() +
      ' Shards?' +
      (notes.length ? '\n\n' + notes.map((n) => '• ' + n).join('\n') : '')
    if (!window.confirm(ask)) return
    const got = store.releaseCreatures(pickedMons.map((o) => o.iid))
    stopReleasing()
    if (got) {
      setToast('Released ' + pickedMons.length + '  ·  +' + got.toLocaleString() + ' Shards')
      setTimeout(() => setToast(null), 2200)
    }
  }
  const sorted = [...st.owned].sort((a, b) => {
    const sa = PM.byId(a.sp),
      sb = PM.byId(b.sp)
    if (sortKey === 'level') {
      return b.level - a.level || RANK[sb.rarity] - RANK[sa.rarity] || monPower(b) - monPower(a)
    }
    return RANK[sb.rarity] - RANK[sa.rarity] || b.level - a.level || monPower(b) - monPower(a)
  })
  const power = D.teamPower(st)
  const base = D.teamBasePower(st)
  const mult = D.teamMultiplier(st)
  const SortBtn = (k, label) => (
    <button
      key={k}
      onClick={() => setSortKey(k)}
      style={{
        fontFamily: "'Silkscreen'",
        fontSize: 9,
        padding: '5px 10px',
        borderRadius: 7,
        cursor: 'pointer',
        border: '2px solid ' + (sortKey === k ? 'var(--sage-deep)' : 'var(--card-line)'),
        background: sortKey === k ? 'var(--sage-lite)' : 'var(--card-2)',
        color: sortKey === k ? 'var(--sage-deep)' : 'var(--ink-soft)',
      }}
    >
      {label}
    </button>
  )
  return (
    <div className="split">
      {toast ? <Toast msg={toast} /> : null}
      {detail ? <MonDetailModal iid={detail} onClose={() => setDetail(null)} /> : null}
      {/* collection grid */}
      <div
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div className="team-head">
          <div className="panel-title head-title">
            <span className="dot" />
            {'Collection \u00b7 ' + st.owned.length}
          </div>
          <span
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 8,
              color: 'var(--ink-faint)',
            }}
          >
            sort
          </span>
          {SortBtn('rarity', 'Rarity')}
          {SortBtn('level', 'Level')}
          <div
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 10,
              color: full ? 'var(--sage-deep)' : 'var(--ink-faint)',
              marginLeft: 6,
            }}
          >
            {team.length + '/6'}
          </div>
          <button
            className="iconbtn"
            type="button"
            style={{
              marginLeft: 4,
            }}
            onClick={releasing ? stopReleasing : () => setReleasing(true)}
            title={releasing ? 'Stop releasing' : 'Let Pokémon go for a few Shards'}
          >
            {releasing ? 'Cancel' : 'Release'}
          </button>
        </div>
        {releasing ? (
          <div
            className="chip-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 13,
                color: 'var(--ink-soft)',
                lineHeight: 1.45,
              }}
            >
              {!keepsOne
                ? 'Keep at least one Pokémon.'
                : pickedMons.length
                  ? pickedMons.length + ' picked'
                  : 'Tap Pokémon to release them for Shards. Team members can’t be released.'}
            </div>
            <button
              className="btn pink"
              type="button"
              disabled={!pickedMons.length || !keepsOne}
              onClick={release}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
              }}
            >
              Release
              {pickedMons.length ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  · +
                  <Shard
                    size={13}
                    style={{
                      filter: 'brightness(1.6)',
                    }}
                  />
                  {releaseTotal.toLocaleString()}
                </span>
              ) : null}
            </button>
          </div>
        ) : null}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            // room for the slot badges, which stick out of the cards' top left corner
            margin: '-10px 0 0 -10px',
            padding: '10px 4px 0 10px',
          }}
        >
          <div className="team-grid">
            {sorted.map((m) => (
              <MonCard
                key={m.iid}
                inst={m}
                inTeam={team.includes(m.iid)}
                slot={team.indexOf(m.iid) + 1}
                full={full}
                releasing={releasing}
                picked={releasing && picked.includes(m.iid)}
                onToggle={releasing ? pick : toggle}
              />
            ))}
          </div>
        </div>
      </div>
      {/* team preview */}
      <div
        className="panel cream team-side"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <div className="panel-title">
          <span className="dot" />
          Your Team
        </div>
        <div
          className="chip-card"
          style={{
            padding: 16,
            textAlign: 'center',
          }}
        >
          <div
            className="lab"
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 9,
              color: 'var(--ink-faint)',
            }}
          >
            TEAM FIGHTING POWER
          </div>
          <div
            className="pixel-font"
            style={{
              fontSize: 34,
              color: 'var(--wood-dark)',
              margin: '6px 0',
            }}
          >
            {power.toLocaleString()}
          </div>
          <div
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 10,
              color: 'var(--ink-faint)',
            }}
          >
            {base + ' base \u00d7 ' + mult.toFixed(2) + ' mult'}
          </div>
        </div>
        {/* 6 slots — tap a filled one for its detail card */}
        <div className="team-slots">
          {Array.from({
            length: 6,
          }).map((_, i) => {
            const m = byId[team[i]]
            if (!m)
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 10,
                    border: '2px dashed var(--card-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--card-2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Silkscreen'",
                      fontSize: 9,
                      color: 'var(--ink-faint)',
                    }}
                  >
                    empty
                  </span>
                </div>
              )
            const sp = PM.byId(m.sp)
            return (
              <button
                key={i}
                className="chip-card team-chip"
                onClick={() => setDetail(m.iid)}
                style={{
                  aspectRatio: '1',
                  padding: '6px 2px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  font: 'inherit',
                  width: '100%',
                }}
              >
                {m.form ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: -5,
                      left: -4,
                      fontFamily: "'Silkscreen'",
                      fontSize: 6,
                      background: m.form === 'gmax' ? 'var(--pink)' : 'var(--lav)',
                      color: '#fff',
                      padding: '2px 3px',
                      borderRadius: 4,
                      border: '1px solid #fff',
                    }}
                  >
                    {m.form === 'gmax' ? 'GX' : 'M'}
                  </span>
                ) : null}
                <Creature inst={m} size={40} bob={true} />
                <div
                  style={{
                    fontFamily: "'Silkscreen'",
                    fontSize: 7,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {sp.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Silkscreen'",
                    fontSize: 7,
                    color: 'var(--ink-faint)',
                  }}
                >
                  {'Lv' + m.level}
                </div>
              </button>
            )
          })}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-faint)',
            lineHeight: 1.5,
            marginTop: 'auto',
          }}
        >
          {'Power = each member\u2019s '}
          <b>level × rarity</b>, summed, then scaled by your solved-problem multiplier (capped at
          2×).
        </div>
      </div>
    </div>
  )
}

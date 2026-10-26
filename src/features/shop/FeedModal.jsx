import { useState } from 'react'
import { Creature } from '../../components/Creature'
import { ItemIcon } from '../../components/ItemIcon'
import { SearchBox } from '../../components/SearchBox'
import * as PM from '../../game/species'
import { RARITY } from '../../game/species'
import { useStore } from '../../state/store'
import { PriceBtn } from './PriceBtn'

function PickerMon({ inst, selected, reason, onPick }) {
  const sp = PM.byId(inst.sp)
  const off = !!reason
  return (
    <button
      onClick={off ? undefined : () => onPick(inst.iid)}
      disabled={off}
      title={off ? sp.name + ' — ' + reason : sp.name}
      style={{
        textAlign: 'center',
        padding: '8px 4px 6px',
        borderRadius: 10,
        opacity: off ? 0.4 : 1,
        background: selected ? 'var(--lav-lite)' : 'var(--card-2)',
        border: '3px solid ' + (selected ? 'var(--lav-deep)' : 'var(--card-line)'),
        cursor: off ? 'not-allowed' : 'pointer',
        boxShadow: selected ? '0 0 10px var(--lav-lite)' : 'none',
      }}
    >
      <Creature inst={inst} size={42} bob={selected} />
      <div
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: 8,
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
          fontSize: 8,
          color: 'var(--ink-faint)',
        }}
      >
        {'Lv' + inst.level}
      </div>
    </button>
  )
}

// ---- "feed to" picker for friend items ----
export function FeedModal({ item, onClose, onDone }) {
  const st = useStore()
  const [q, setQ] = useState('')
  // team first, then everyone else in collection order
  const ordered = [
    ...st.team.map((iid) => st.owned.find((o) => o.iid === iid)).filter(Boolean),
    ...st.owned.filter((o) => !st.team.includes(o.iid)),
  ]
  const reasonOf = (inst) => item.eligible(inst, st)
  const [pick, setPick] = useState(() => (ordered.find((o) => !reasonOf(o)) || {}).iid)
  const ql = q.trim().toLowerCase()
  const list = ql ? ordered.filter((o) => PM.byId(o.sp).name.toLowerCase().includes(ql)) : ordered
  const target = st.owned.find((o) => o.iid === pick)
  const targetOk = !!(target && !reasonOf(target))
  const short = st.coins < item.price
  function confirm() {
    if (!targetOk || short) return
    const sp = PM.byId(target.sp)
    if (item.buy(target.iid)) onDone(item.done(target, sp))
  }
  const preview = target ? (
    (function () {
      const sp = PM.byId(target.sp)
      const info = item.info(target)
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              background: RARITY[sp.rarity].glow,
              borderRadius: 10,
              padding: 4,
              flex: 'none',
            }}
          >
            <Creature inst={target} size={52} bob={true} />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 12,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {sp.name + '  ·  Lv ' + target.level}
            </div>
            {info.bar != null ? (
              <div
                className="expbar"
                style={{
                  height: 8,
                  margin: '6px 0 4px',
                  maxWidth: 220,
                }}
              >
                <i
                  style={{
                    width: Math.min(100, Math.round(info.bar * 100)) + '%',
                  }}
                />
              </div>
            ) : null}
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 8,
                color: 'var(--ink-faint)',
                marginTop: info.bar != null ? 0 : 5,
              }}
            >
              {info.text}
            </div>
          </div>
        </div>
      )
    })()
  ) : (
    <div
      style={{
        flex: 1,
        fontSize: 13,
        color: 'var(--ink-faint)',
      }}
    >
      No friend can use this right now
    </div>
  )
  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="panel modal fade-in"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: 540,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '86%',
          position: 'relative',
        }}
      >
        <button className="modal-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            paddingRight: 24,
          }}
        >
          <ItemIcon item={item} size={40} />
          <div
            style={{
              flex: 1,
            }}
          >
            <div
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 13,
                color: 'var(--ink)',
              }}
            >
              {item.name + ' — feed to…'}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-faint)',
                marginTop: 3,
              }}
            >
              {item.desc}
            </div>
          </div>
        </div>
        <SearchBox value={q} autoFocus={true} placeholder="Search your friends…" onChange={setQ} />
        <div
          style={{
            flex: '1 1 300px',
            minHeight: 0,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))',
            gap: 7,
            paddingRight: 4,
            alignContent: 'start',
          }}
        >
          {list.map((m) => (
            <PickerMon
              key={m.iid}
              inst={m}
              selected={m.iid === pick}
              reason={reasonOf(m)}
              onPick={setPick}
            />
          ))}
          {list.length === 0 ? (
            <div
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                color: 'var(--ink-faint)',
                padding: 20,
              }}
            >
              No matches
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '2px dashed var(--card-line)',
          }}
        >
          {preview}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              flex: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <button
                className="btn"
                style={{
                  fontSize: 11,
                }}
                onClick={onClose}
              >
                Cancel
              </button>
              <PriceBtn item={item} label="Buy" disabled={short || !targetOk} onClick={confirm} />
            </div>
            {short ? (
              <div
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 8,
                  color: 'var(--pink-deep)',
                }}
              >
                Not enough coins
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Creature } from '../../components/Creature'
import { SearchBox } from '../../components/SearchBox'
import * as PM from '../../game/species'
import { RARITY } from '../../game/species'
import { store } from '../../state/store'

// ---- target picker modal ----
export function TargetModal({ tier, onClose }) {
  const [q, setQ] = useState('')
  const all = PM.SPECIES
  const ql = q.trim().toLowerCase()
  const pool = all.filter((s) => s.rarity === tier)
  const list = (
    ql ? pool.filter((s) => s.name.toLowerCase().includes(ql) || s.id.includes(ql)) : pool
  ).slice(0, 140)
  function pick(id) {
    tier === 'legendary' ? store.setLegendaryTarget(id) : store.setEpicTarget(id)
    onClose()
  }
  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="panel modal"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: 560,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '82%',
        }}
      >
        <div className="panel-title">
          <span className="dot" />
          {tier === 'legendary' ? 'Choose a Legendary Target' : 'Choose an Epic Target'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-faint)',
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          {tier === 'legendary'
            ? [
                'Pick a ',
                <b>legendary</b>,
                ' to chase. You\u2019re guaranteed to pull it within ',
                <b>100 draws</b>,
                ', counting the draws you\u2019ve already made.',
              ]
            : [
                'Pick an ',
                <b>epic</b>,
                ' to chase. You\u2019re guaranteed to pull it within ',
                <b>60 draws</b>,
                ', counting the draws you\u2019ve already made.',
              ]}
        </div>
        <SearchBox
          value={q}
          autoFocus={true}
          placeholder={`Search ${tier} Pok\u00e9mon\u2026`}
          onChange={setQ}
        />
        <div
          style={{
            flex: '1 1 360px',
            minHeight: 0,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(6,1fr)',
            gap: 8,
            paddingRight: 4,
            alignContent: 'start',
          }}
        >
          {list.map((s) => (
            <button
              key={s.id}
              onClick={() => pick(s.id)}
              title={s.name}
              style={{
                textAlign: 'center',
                padding: '8px 3px 5px',
                borderRadius: 9,
                cursor: 'pointer',
                background: 'var(--card-2)',
                border: '2px solid ' + RARITY[s.rarity].color,
              }}
            >
              <Creature species={s.id} size={40} />
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
                {s.name}
              </div>
            </button>
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
            gap: 10,
            justifyContent: 'flex-end',
            marginTop: 12,
          }}
        >
          <button
            className="btn"
            onClick={() => {
              tier === 'legendary' ? store.setLegendaryTarget(null) : store.setEpicTarget(null)
              onClose()
            }}
          >
            Clear Target
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

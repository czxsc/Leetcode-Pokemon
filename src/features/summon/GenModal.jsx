import { useState } from 'react'
import { Creature } from '../../components/Creature'
import { ItemIcon } from '../../components/ItemIcon'
import * as PM from '../../game/species'
import { RARITY } from '../../game/species'
import { ITEM_BY_ID, describeArmed } from './items'

// ---- Generation Ticket: pick which generation the next draw comes from ----
export function GenModal({ ball, current, onClose, onPick }) {
  const [pick, setPick] = useState(current || null)
  const item = ITEM_BY_ID.genTicket
  const tier = ball === 'great' ? 'rare' : ball === 'ultra' ? 'epic' : null
  // three faces per generation: its starters where we have them, else its first species
  const faces = (gen) => {
    const s = PM.STARTERS.filter((id) => PM.byId(id).gen === gen)
    return (s.length >= 3 ? s : PM.SPECIES.filter((x) => x.gen === gen).map((x) => x.id)).slice(
      0,
      3,
    )
  }
  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="panel modal fade-in"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: 600,
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
            marginBottom: 14,
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
              {item.name + ' — choose a generation'}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-faint)',
                marginTop: 3,
              }}
            >
              Your next Single Draw comes from this generation.
            </div>
          </div>
        </div>
        <div className="gen-grid">
          {PM.GENERATIONS.map((g) => (
            <button
              key={g.gen}
              type="button"
              className={'gen-card' + (pick === g.gen ? ' on' : '')}
              onClick={() => setPick(g.gen)}
            >
              <div
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 12,
                  color: 'var(--ink)',
                }}
              >
                {'GEN ' + g.gen}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-soft)',
                }}
              >
                {g.region}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  margin: '4px 0 2px',
                }}
              >
                {faces(g.gen).map((id) => (
                  <Creature key={id} species={id} size={36} fill={true} />
                ))}
              </div>
              <div
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 8,
                  color: 'var(--ink-faint)',
                }}
              >
                {tier
                  ? PM.tierPool(tier, g.gen).length + ' ' + RARITY[tier].label + ' of ' + g.count
                  : g.count + ' Pokémon'}
              </div>
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '2px dashed var(--card-line)',
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: 13,
              color: 'var(--ink-soft)',
            }}
          >
            {pick
              ? ['Next Single Draw: ', <b key="b">{describeArmed(ball, pick)}</b>]
              : 'Pick a generation'}
          </div>
          <button
            className="btn"
            style={{
              fontSize: 11,
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn pink"
            style={{
              fontSize: 11,
            }}
            disabled={!pick}
            onClick={() => onPick(pick)}
          >
            Use Ticket
          </button>
        </div>
      </div>
    </div>
  )
}

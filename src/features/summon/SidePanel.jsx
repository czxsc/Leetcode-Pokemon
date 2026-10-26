import { Creature } from '../../components/Creature'
import { ItemIcon } from '../../components/ItemIcon'
import { RarityTag } from '../../components/Tags'
import { RARITY } from '../../game/species'
import { ITEMS, describeArmed, genLabel } from './items'

// ---- arm items for the next Single Draw ----
export function ItemsPanel({ st, ball, gen, setBall, onTicket, disabled }) {
  const count = (id) => st.items[id] || 0
  const armed = !!(ball || gen)
  return (
    <div
      className="chip-card"
      style={{
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 9,
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--ink-faint)',
          }}
        >
          ITEMS · NEXT SINGLE DRAW
        </span>
        {armed ? (
          <button
            className="iconbtn"
            style={{
              padding: '4px 8px',
              fontSize: 9,
            }}
            disabled={disabled}
            onClick={() => {
              setBall(null)
              onTicket(null)
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 7,
        }}
      >
        {ITEMS.map((it) => {
          const on = it.ball ? ball === it.ball : !!gen
          const n = count(it.id)
          return (
            <button
              key={it.id}
              type="button"
              className={'gitem' + (on ? ' on' : '')}
              disabled={disabled || (!on && n <= 0)}
              title={n <= 0 && !on ? 'None in your bag — buy them in the Shop' : it.desc}
              onClick={() =>
                it.ball ? setBall(on ? null : it.ball) : on ? onTicket(null) : onTicket('pick')
              }
            >
              <ItemIcon item={it} size={28} />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'left',
                }}
              >
                <div className="gitem-name" title={on && !it.ball ? genLabel(gen) : it.name}>
                  {on && !it.ball ? 'Gen ' + gen : it.short}
                </div>
                <div className="gitem-count">{'×' + n + (on ? ' · ARMED' : '')}</div>
              </div>
            </button>
          )
        })}
      </div>
      {armed ? (
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-faint)',
            lineHeight: 1.4,
            marginTop: 9,
          }}
        >
          {'Next Single Draw: '}
          <b
            style={{
              color: 'var(--ink)',
            }}
          >
            {describeArmed(ball, gen)}
          </b>
          . x5 Draw is paused while items are armed.
        </div>
      ) : null}
    </div>
  )
}

export function Bar({ label, left, frac, color }) {
  return (
    <div
      className="chip-card"
      style={{
        padding: '11px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--ink-faint)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 10,
            color: color,
          }}
        >
          {left + ' left'}
        </span>
      </div>
      <div
        className="minibar"
        style={{
          height: 8,
        }}
      >
        <i
          style={{
            width: Math.min(100, frac * 100) + '%',
            background: color,
          }}
        />
      </div>
    </div>
  )
}

export function TargetSummary({
  label,
  target,
  chooseLabel,
  onChoose,
  pity,
  pityMax,
  color,
  emptyText,
}) {
  return [
    <div
      key={label + '-head'}
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 9,
      }}
    >
      <span
        style={{
          flex: 1,
          fontFamily: "'Silkscreen'",
          fontSize: 9,
          color: 'var(--ink-faint)',
        }}
      >
        {label}
      </span>
      <button className="iconbtn" onClick={onChoose}>
        {target ? 'Change' : chooseLabel}
      </button>
    </div>,
    target ? (
      <div key={label + '-body'}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              background: RARITY[target.rarity].glow,
              borderRadius: 9,
              padding: 4,
              flex: 'none',
            }}
          >
            <Creature species={target.id} size={38} bob={true} />
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
                fontSize: 11,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {target.name}
            </div>
            <div
              style={{
                marginTop: 3,
              }}
            >
              <RarityTag rarity={target.rarity} />
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 8,
              color: 'var(--ink-faint)',
            }}
          >
            {'in ' + Math.max(0, pityMax - pity) + ' draws'}
          </span>
          <span
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 8,
              color,
            }}
          >
            {pity + '/' + pityMax}
          </span>
        </div>
        <div
          className="minibar"
          style={{
            height: 8,
          }}
        >
          <i
            style={{
              width: (pity / pityMax) * 100 + '%',
              background: `linear-gradient(90deg,${color === 'var(--lav-deep)' ? 'var(--lav)' : 'var(--sage)'},${color})`,
            }}
          />
        </div>
      </div>
    ) : (
      <div
        key={label + '-empty'}
        style={{
          fontSize: 12,
          color: 'var(--ink-faint)',
          lineHeight: 1.4,
        }}
      >
        {emptyText}
      </div>
    ),
  ]
}

import { Shard } from '../../components/icons'

export function Stars({ level, total }) {
  return (
    <span
      title={'Step ' + level + ' of ' + total}
      style={{
        fontSize: 15,
        letterSpacing: 1,
        lineHeight: 1,
      }}
    >
      {Array.from({
        length: total,
      }).map((_, i) =>
        i < level ? (
          <span
            key={i}
            style={{
              color: 'var(--coin-deep)',
            }}
          >
            ★
          </span>
        ) : (
          <span
            key={i}
            style={{
              color: 'var(--ink-faint)',
              opacity: 0.6,
            }}
          >
            ☆
          </span>
        ),
      )}
    </span>
  )
}

// one quest card (daily and progression): done = claimed for good, met = ready to claim
export function QuestCard({
  name,
  badge,
  desc,
  prog,
  goal,
  unit,
  reward,
  done,
  met,
  locked,
  doneLabel,
  onClaim,
}) {
  // locked quests keep their shape but hide the details until the chapter opens
  const hidden = locked
    ? {
        filter: 'blur(5px)',
        userSelect: 'none',
        pointerEvents: 'none',
      }
    : null
  return (
    <div
      className="chip-card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: done ? 0.7 : 1,
        borderColor: met && !locked ? 'var(--sage-deep)' : 'var(--card-line)',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: done ? 'var(--sage)' : met && !locked ? 'var(--sage-lite)' : 'var(--cream-2)',
          border: '2px solid var(--card-line)',
        }}
      >
        <span
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 16,
            color: done ? '#fff' : 'var(--wood-dark)',
          }}
        >
          {done ? '✔' : locked ? '🔒' : '★'}
        </span>
      </div>
      <div
        aria-hidden={locked || undefined}
        style={{
          flex: 1,
          minWidth: 0,
          ...hidden,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 13,
              color: 'var(--ink)',
            }}
          >
            {name}
          </span>
          {badge}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-faint)',
            marginBottom: 7,
          }}
        >
          {desc}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <div
            className="minibar"
            style={{
              flex: 1,
              height: 8,
            }}
          >
            <i
              style={{
                width: (prog / goal) * 100 + '%',
                background: 'var(--sage-deep)',
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 9,
              color: 'var(--ink-faint)',
              whiteSpace: 'nowrap',
            }}
          >
            {prog.toLocaleString() + '/' + goal.toLocaleString() + (unit ? ' ' + unit : '')}
          </span>
        </div>
      </div>
      <div
        aria-hidden={locked || undefined}
        style={{
          textAlign: 'center',
          flex: 'none',
          width: 96,
          ...hidden,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            marginBottom: 7,
          }}
        >
          <Shard size={15} />
          <span
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 13,
              color: 'var(--shard-deep)',
            }}
          >
            {reward}
          </span>
        </div>
        {done ? (
          <div
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 9,
              color: 'var(--sage-deep)',
            }}
          >
            {doneLabel}
          </div>
        ) : (
          <button
            className="btn green"
            disabled={!met || locked}
            style={{
              fontSize: 10,
              padding: '7px 12px',
            }}
            onClick={onClaim}
          >
            Claim
          </button>
        )}
      </div>
    </div>
  )
}

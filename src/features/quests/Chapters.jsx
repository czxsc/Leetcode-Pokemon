import { store } from '../../state/store'
import { QuestCard } from './QuestCard'
import { labelStyle, listStyle } from './shared'

export function ChapterList({ chapters, sel, setSel }) {
  const total = chapters.reduce((n, c) => n + c.quests.length, 0)
  const done = chapters.reduce((n, c) => n + c.done, 0)
  return [
    <div key="t" className="panel-title">
      <span className="dot" />
      Chapters
    </div>,
    <div
      key="o"
      className="chip-card"
      style={{
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          ...labelStyle,
        }}
      >
        <span>OVERALL</span>
        <span>{done + ' / ' + total}</span>
      </div>
      <div
        className="minibar"
        style={{
          height: 8,
        }}
      >
        <i
          style={{
            width: (done / total) * 100 + '%',
            background: 'var(--coin-deep)',
          }}
        />
      </div>
    </div>,
    <div
      key="l"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      }}
    >
      {chapters.map((c) => (
        <button
          key={c.index}
          className={'cat-item' + (sel === c.index ? ' active' : '')}
          onClick={() => setSel(c.index)}
          style={{
            opacity: c.open ? 1 : 0.6,
          }}
        >
          <span className={'chapter-num' + (c.complete ? ' done' : '')}>
            {c.complete ? '✔' : c.open ? c.index + 1 : '🔒'}
          </span>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                className="cname"
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {c.title}
              </span>
              {c.ready.length ? (
                <span
                  className="type-tag"
                  style={{
                    background: 'var(--sage-deep)',
                    color: '#fff',
                    fontSize: 7,
                    padding: '1px 5px',
                  }}
                >
                  {c.ready.length + ' READY'}
                </span>
              ) : null}
              <span
                className="ccount"
                style={{
                  marginLeft: 'auto',
                }}
              >
                {c.done + '/' + c.quests.length}
              </span>
            </div>
            <div
              className="minibar"
              style={{
                marginTop: 5,
              }}
            >
              <i
                style={{
                  width: (c.done / c.quests.length) * 100 + '%',
                }}
              />
            </div>
          </div>
        </button>
      ))}
    </div>,
  ]
}

export function ChapterQuests({ ch, prev }) {
  const claimAll = () => store.claimAchievements(ch.ready.map((x) => x.id))
  return [
    <div
      key="h"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
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
            fontSize: 14,
            color: 'var(--ink)',
          }}
        >
          {ch.blurb}
        </div>
        {ch.open ? null : (
          <div
            style={{
              fontSize: 13,
              color: 'var(--medium)',
              marginTop: 3,
            }}
          >
            {'🔒 Claim every quest in Chapter ' +
              (prev.index + 1) +
              ' (' +
              prev.title +
              ') to unlock.'}
          </div>
        )}
      </div>
      {ch.ready.length > 1 ? (
        <button
          className="btn green"
          style={{
            fontSize: 10,
            padding: '8px 12px',
          }}
          onClick={claimAll}
        >
          {'Claim All (' + ch.ready.length + ')'}
        </button>
      ) : null}
    </div>,
    <div key="l" style={listStyle}>
      {ch.quests.map((x) => (
        <QuestCard
          key={x.id}
          name={x.name}
          desc={x.desc}
          prog={x.prog}
          goal={x.goal}
          unit={x.unit}
          reward={x.reward}
          done={x.claimed}
          met={x.met}
          locked={!ch.open}
          doneLabel="CLAIMED"
          onClaim={() => store.claimAchievements([x.id])}
        />
      ))}
    </div>,
  ]
}

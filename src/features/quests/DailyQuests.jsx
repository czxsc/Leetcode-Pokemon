import { Pokeball, Shard } from '../../components/icons'
import { todayLocal } from '../../game/dates'
import { QUESTS, questState } from '../../game/quests'
import { store } from '../../state/store'
import { QuestCard, Stars } from './QuestCard'
import { labelStyle } from './shared'

export function DailyRow({ q, st }) {
  const { claimed, done, cur, prog, met } = questState(q, st, todayLocal())
  const chain = q.steps.length > 1
  return (
    <QuestCard
      name={cur.name}
      desc={cur.desc}
      prog={prog}
      goal={cur.goal}
      unit={q.unit}
      reward={cur.reward}
      done={done}
      met={met}
      badge={
        chain ? (
          <Stars level={Math.min(claimed + 1, q.steps.length)} total={q.steps.length} />
        ) : null
      }
      doneLabel={chain ? 'COMPLETE' : 'CLAIMED'}
      onClaim={() => store.claimDaily(q.id, claimed)}
    />
  )
}

export function DailySummary({ st }) {
  const today = todayLocal()
  const states = QUESTS.map((q) => questState(q, st, today))
  const total = QUESTS.reduce((n, q) => n + q.steps.length, 0)
  const done = states.reduce((n, s) => n + s.claimed, 0)
  const unclaimed = states.reduce((n, s) => n + s.ready.reduce((r, x) => r + x.reward, 0), 0)
  return [
    <div key="t" className="panel-title">
      <span className="dot" />
      Today
    </div>,
    <div
      key="b"
      style={{
        textAlign: 'center',
        padding: '12px 0',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <div className={done < total ? 'pokeball-spin' : ''}>
          <Pokeball size={72} />
        </div>
      </div>
      <div
        className="pixel-font"
        style={{
          fontSize: 22,
          color: 'var(--wood-dark)',
          marginTop: 14,
        }}
      >
        {done + ' / ' + total}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-faint)',
          marginTop: 5,
        }}
      >
        quest steps complete
      </div>
    </div>,
    <div
      key="u"
      className="chip-card"
      style={{
        padding: 14,
        textAlign: 'center',
      }}
    >
      <div style={labelStyle}>UNCLAIMED REWARDS</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        <Shard size={20} />
        <span
          className="pixel-font"
          style={{
            fontSize: 20,
            color: 'var(--shard-deep)',
          }}
        >
          {unclaimed}
        </span>
      </div>
    </div>,
  ]
}

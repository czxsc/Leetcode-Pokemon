import { useState } from 'react'
import { chapterStatus } from '../../game/chapters'
import { todayLocal } from '../../game/dates'
import { QUESTS } from '../../game/quests'
import { useStore } from '../../state/store'
import { ChapterList, ChapterQuests } from './Chapters'
import { DailyRow, DailySummary } from './DailyQuests'
import { listStyle } from './shared'

function TabBar({ tab, setTab, readyCount }) {
  return (
    <div className="seg seg-mini quests-tabs">
      {[
        ['daily', 'Daily'],
        ['progress', readyCount ? `Progression · ${readyCount}` : 'Progression'],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={'seg-btn' + (tab === id ? ' on' : '')}
          onClick={() => setTab(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Quests() {
  const st = useStore()
  const chapters = chapterStatus(st, todayLocal())
  const [tab, setTab] = useState('daily')
  // start on the furthest open chapter that still has something to do
  const [sel, setSel] = useState(() => {
    const c = chapters.find((c) => c.open && !c.complete)
    return c ? c.index : chapters.filter((c) => c.open).length - 1
  })
  const ch = chapters[sel]
  const readyCount = chapters.reduce((n, c) => n + c.ready.length, 0)
  return (
    <div className="split">
      <div
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div className="quests-head">
          <div className="panel-title head-title">
            <span className="dot" />
            {tab === 'daily' ? 'Daily Quests' : 'Chapter ' + (ch.index + 1) + ' · ' + ch.title}
          </div>
          <TabBar tab={tab} setTab={setTab} readyCount={readyCount} />
        </div>
        {tab === 'daily' ? (
          <div style={listStyle}>
            {QUESTS.map((q) => (
              <DailyRow key={q.id} q={q} st={st} />
            ))}
          </div>
        ) : (
          <ChapterQuests ch={ch} prev={chapters[sel - 1]} />
        )}
      </div>
      <div
        className="panel cream"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          minHeight: 0,
        }}
      >
        {tab === 'daily' ? (
          <DailySummary st={st} />
        ) : (
          <ChapterList chapters={chapters} sel={sel} setSel={setSel} />
        )}
      </div>
    </div>
  )
}

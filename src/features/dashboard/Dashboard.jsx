import { useState } from 'react'
import { ProblemList } from './ProblemList'
import { ALL } from './shared'
import { TagMenu } from './TagMenu'
import { TrainerCard } from './TrainerCard'

// A narrow screen can't fit the three columns, so it shows one at a time.
// theme.css hides the others, and this switcher when it isn't needed.
const PANES = [
  ['problems', 'Problems'],
  ['tags', 'Tags'],
  ['trainer', 'Trainer'],
]

export function Dashboard() {
  const [by, setBy] = useState('tag') // 'tag' | 'difficulty'
  const [sel, setSel] = useState(ALL)
  const [pane, setPane] = useState('problems')
  return (
    <div className="dashboard" data-pane={pane}>
      <div className="seg seg-mini dash-panes">
        {PANES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={'seg-btn dash-pane-' + id + (pane === id ? ' on' : '')}
            onClick={() => setPane(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <TagMenu
        by={by}
        setBy={setBy}
        sel={sel}
        setSel={setSel}
        onPicked={() => setPane('problems')}
      />
      <ProblemList by={by} sel={sel} />
      <TrainerCard />
    </div>
  )
}

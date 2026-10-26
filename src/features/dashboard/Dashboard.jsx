import { useState } from 'react'
import { ProblemList } from './ProblemList'
import { ALL } from './shared'
import { TagMenu } from './TagMenu'
import { TrainerCard } from './TrainerCard'

export function Dashboard() {
  const [by, setBy] = useState('tag') // 'tag' | 'difficulty'
  const [sel, setSel] = useState(ALL)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '258px minmax(0,1fr) 318px',
        gap: 14,
        height: '100%',
        minHeight: 0,
      }}
    >
      <TagMenu by={by} setBy={setBy} sel={sel} setSel={setSel} />
      <ProblemList by={by} sel={sel} />
      <TrainerCard />
    </div>
  )
}

import * as PM from '../game/species'
import { TYPE_COLOR } from './sprites'

export function TypeTag({ type }) {
  const c = (TYPE_COLOR && TYPE_COLOR[type]) || '#c9b78c'
  return (
    <span
      className="type-tag"
      style={{
        background: c,
      }}
    >
      {type}
    </span>
  )
}

export function RarityTag({ rarity }) {
  const r = PM.RARITY[rarity]
  return (
    <span
      className="type-tag"
      style={{
        background: r.color,
        color: '#fff',
      }}
    >
      {r.label}
    </span>
  )
}

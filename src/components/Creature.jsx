import { useState } from 'react'
import { byId } from '../game/species'
import { PixelSparkle } from './PixelSparkle'
import { spriteZoom } from './sprite-zoom'
import { homeUrl, spriteUrl, TYPE_COLOR } from './sprites'

// A Pokémon sprite. Falls back from the animated sprite to a static one,
// then to a colored type blob, if an image fails to load.
export function Creature(props) {
  const { species, inst, size = 48, bob = false, className = '', style = {} } = props
  const sp = typeof species === 'object' && species ? species : byId(species || (inst && inst.sp))
  const shiny = !!(props.shiny || (inst && inst.shiny))
  const form = props.form || (inst && inst.form) || null
  // 0 primary, 1 home static, 2 blob; starts over when the sprite changes
  const key = sp ? `${sp.id}|${shiny}|${form}` : ''
  const [failed, setFailed] = useState({ key, stage: 0 })
  const stage = failed.key === key ? failed.stage : 0
  const nextStage = () => setFailed({ key, stage: stage + 1 })
  const box = {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...style,
  }
  if (!sp) return <div style={box} />
  if (stage >= 2) {
    return (
      <div
        className={className}
        style={{
          ...box,
          background: TYPE_COLOR[sp.type] || '#ccc',
          borderRadius: '50%',
          fontFamily: "'Silkscreen'",
          fontSize: size * 0.4,
          color: '#fff',
          border: '2px solid rgba(0,0,0,.15)',
        }}
      >
        {sp.name[0]}
      </div>
    )
  }
  const url =
    stage === 0
      ? spriteUrl(sp, {
          shiny,
          form,
        })
      : homeUrl(sp, shiny)
  // fill: scale the sprite up to the box. Gen 6+ sprites are also zoomed to make up for their padding.
  const padded = sp.gen > 5 && !form && stage === 0
  const fit = {
    ...(props.fill ? { width: '100%', height: '100%' } : { maxWidth: '100%', maxHeight: '100%' }),
    ...(padded ? { transform: `scale(${spriteZoom(sp)})`, pointerEvents: 'none' } : {}),
  }
  return (
    <div className={(bob ? 'mon-bob ' : '') + className} style={box}>
      {shiny ? (
        <PixelSparkle
          unit={props.fill ? Math.max(1, Math.round(size / 60)) : 1}
          style={{
            top: -2,
            right: -2,
          }}
        />
      ) : null}
      <img
        src={url}
        onError={nextStage}
        style={{
          ...fit,
          objectFit: 'contain',
          imageRendering: stage === 0 ? 'pixelated' : 'auto',
        }}
        alt={sp.name}
        draggable={false}
      />
    </div>
  )
}

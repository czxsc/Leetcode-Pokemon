import { useEffect, useRef, useState } from 'react'
import { Creature } from '../components/Creature'
import { Pokeball, Shard } from '../components/icons'
import { byId } from '../game/species'
import { bestCatch, loadingPartner, saveBestCatch } from './loading-screen'

// Shown while the app loads its save, instead of an empty page. The cloud
// database pauses after a few quiet minutes and takes about 15 seconds to
// wake, so there's something to do meanwhile: the trainer's lead Pokémon
// rolls along, and hops (tap, click or Space) to catch Shards. Only the best
// catch is kept, in this browser.

const SPEED = 150 // px per second, of the ground and the Shards on it
const SIZE = 64 // the rolling Pokémon's box
const RUNNER_X = 44 // its left edge
const HOP_MS = 650
const HOP_PX = 80
const CATCH_PX = 30 // how near a Shard must pass the Pokémon's middle
const SHARDS = 5 // on screen at once, at most

function hop(game) {
  const now = performance.now()
  if (now - game.hopAt >= HOP_MS) game.hopAt = now
}

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function LoadingScreen() {
  const [partner] = useState(loadingPartner)
  const [still] = useState(reducedMotion)
  const [best] = useState(bestCatch) // before this visit
  const [caught, setCaught] = useState(0)
  const [pops, setPops] = useState([]) // "+1" where a Shard was caught
  const scene = useRef(null)
  const runner = useRef(null)
  const roller = useRef(null)
  const shadow = useRef(null)
  const ground = useRef(null)
  const shardEls = useRef([])
  const game = useRef({
    hopAt: -Infinity,
    caught: 0,
    best: 0,
    shards: Array.from({ length: SHARDS }, () => ({ on: false, x: 0, y: 0 })),
  })

  // the game: everything moves by setting styles each frame, outside React
  useEffect(() => {
    if (still) return
    const g = game.current
    g.best = bestCatch()
    const start = performance.now()
    let last = start
    let nextShard = start + 1200
    let popId = 0
    let frameId
    function frame(now) {
      if (!ground.current) return // the app has replaced this screen; the cleanup is on its way
      const dt = Math.min(now - last, 50) / 1000 // a background tab doesn't teleport anything
      last = now
      const travelled = ((now - start) / 1000) * SPEED
      ground.current.style.backgroundPositionX = `${-(travelled % 32)}px`
      const t = (now - g.hopAt) / HOP_MS
      const up = t < 1 ? 4 * HOP_PX * t * (1 - t) : 0
      runner.current.style.transform = `translateY(${-up}px)`
      // rolls rather than slides, facing the way it's going (the sprites face left)
      roller.current.style.transform = `rotate(${travelled / (SIZE / 2)}rad) scaleX(-1)`
      shadow.current.style.transform = `scale(${1 - up / HOP_PX / 2})`

      if (now >= nextShard) {
        const free = g.shards.find((s) => !s.on)
        if (free)
          Object.assign(free, {
            on: true,
            x: scene.current.clientWidth + 12,
            y: 26 + Math.random() * 84,
          })
        nextShard = now + 650 + Math.random() * 1100
      }
      const cx = RUNNER_X + SIZE / 2
      const cy = SIZE / 2 + up
      g.shards.forEach((s, i) => {
        if (s.on) {
          s.x -= SPEED * dt
          if (Math.hypot(s.x - cx, s.y - cy) < CATCH_PX) {
            s.on = false
            g.caught++
            if (g.caught > g.best) saveBestCatch((g.best = g.caught))
            const pop = { id: ++popId, x: s.x, y: s.y }
            setPops((p) => [...p, pop])
            setCaught(g.caught)
          } else if (s.x < -12) s.on = false
        }
        const el = shardEls.current[i]
        el.style.visibility = s.on ? 'visible' : 'hidden'
        el.style.transform = `translate(${s.x}px, ${-s.y}px)`
      })
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    function onKey(e) {
      if (e.key !== ' ' && e.key !== 'ArrowUp') return
      e.preventDefault()
      hop(g)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('keydown', onKey)
    }
  }, [still])

  const name = byId(partner.sp)?.name || 'Your partner'
  return (
    <div className="loading">
      <div className="panel loading-panel">
        <div className="onb-head">
          <Pokeball size={30} className="loading-ball" />
          <h1 className="pixel-font" role="status">
            Loading your save…
          </h1>
        </div>
        <p className="loading-note">Just a moment.</p>
        <div
          className={'loading-scene' + (still ? ' still' : '')}
          ref={scene}
          onPointerDown={still ? undefined : () => hop(game.current)}
        >
          <div className="loading-cloud" />
          <div className="loading-cloud far" />
          <div className="loading-shards">
            {Array.from({ length: SHARDS }, (_, i) => (
              <div
                key={i}
                className="loading-shard"
                ref={(el) => {
                  shardEls.current[i] = el
                }}
              >
                <Shard size={18} />
              </div>
            ))}
            {pops.map((p) => (
              <div
                key={p.id}
                className="loading-pop pixel-font"
                style={{ left: p.x, bottom: p.y }}
                onAnimationEnd={() => setPops((all) => all.filter((q) => q.id !== p.id))}
              >
                +1
              </div>
            ))}
          </div>
          <div className="loading-shadow" ref={shadow} />
          <div className="loading-runner" ref={runner}>
            <div className="loading-roller" ref={roller}>
              <Creature
                species={partner.sp}
                shiny={partner.shiny}
                form={partner.form}
                size={SIZE}
                fill
              />
            </div>
          </div>
          <div className="loading-ground" ref={ground} />
        </div>
        <div className="loading-game">
          <span>
            {still
              ? `${name} is waiting with you.`
              : `Tap or press Space: ${name} hops for Shards!`}
          </span>
          {still ? null : (
            <span className="loading-score">
              <Shard size={14} /> {caught}
              <span className="loading-best">Best {Math.max(best, caught)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

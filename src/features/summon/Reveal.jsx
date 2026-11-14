import { Creature } from '../../components/Creature'
import { Pokeball } from '../../components/icons'
import { RarityTag } from '../../components/Tags'
import * as PM from '../../game/species'
import { RARITY } from '../../game/species'
import { ITEM_BY_ID, genLabel } from './items'

const LEGEND_COLORS = ['var(--coin)', '#fff', 'var(--coin-deep)', '#fbe7b0']

// match ballcharge and the iris timeline in theme.css
const SPARK_COLORS = [
  'var(--shard-deep)',
  'var(--lav-deep)',
  'var(--coin-deep)',
  'var(--pink-deep)',
]

const legendTwinkles = [
  [-88, -96],
  [92, -74],
  [-104, 34],
  [98, 58],
  [6, -128],
  [-14, 122],
]

const legendSparks = Array.from({
  length: 20,
}).map((_, i) => {
  const a = (i / 20) * Math.PI * 2 + (i % 2) * 0.15,
    d = 110 + (i % 3) * 38
  return {
    dx: Math.cos(a) * d,
    dy: Math.sin(a) * d,
    color: LEGEND_COLORS[i % 4],
    size: 16 + (i % 3) * 7,
    lag: (i % 4) * 0.05,
  }
})

const twinkles = [
  [-142, -78],
  [150, -44],
  [-124, 98],
  [134, 104],
  [8, -158],
  [-18, 150],
].map(([x, y], i) => (
  <span
    key={'t' + i}
    className="ready-twinkle"
    style={{
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      color: SPARK_COLORS[i % 4],
      fontSize: 20 + (i % 2) * 8 + 'px',
      animationDelay: i * 0.31 + 's',
    }}
  >
    ✦
  </span>
))

// sparks thrown off while the ball charges up
const sparks = Array.from({
  length: 16,
}).map((_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 2) * 0.2,
    d = 130 + (i % 3) * 40
  return (
    <span
      key={'s' + i}
      className="charge-spark"
      style={{
        '--dx': (Math.cos(a) * d).toFixed(0) + 'px',
        '--dy': (Math.sin(a) * d).toFixed(0) + 'px',
        color: SPARK_COLORS[i % 4],
        fontSize: 22 + (i % 3) * 8 + 'px',
        animationDelay: 0.3 + (i % 4) * 0.13 + 's',
      }}
    >
      ✦
    </span>
  )
})

// charge: spins, grows and throws sparks · ready: floats and waits for a tap · open: pops into the iris
export function BigBall({ phase, rarity, onOpen }) {
  const ready = phase === 'ready'
  return (
    <button
      type="button"
      className={'bigball-wrap' + (ready ? ' tappable' : '')}
      disabled={!ready}
      onClick={onOpen}
      aria-label={ready ? 'Open the Poké Ball' : 'Poké Ball'}
      style={{
        '--aura': RARITY[rarity].glow,
        '--aura-core': RARITY[rarity].color,
      }}
    >
      {phase === 'charge' || ready ? <div className="ball-aura" /> : null}
      {phase === 'charge'
        ? [0, 1, 2].map((i) => (
            <div
              key={'r' + i}
              className="charge-ring"
              style={{
                animationDelay: 0.25 + i * 0.28 + 's',
              }}
            />
          ))
        : null}
      {phase === 'charge' ? sparks : null}
      {ready ? twinkles : null}
      <div className={'bigball' + (phase !== 'idle' ? ' ball-' + phase : '')}>
        <div className="bb-top" />
        <div className="bb-belt" />
        <div className="bb-btn" />
        <div className="bb-shine" />
      </div>
      {phase === 'open' ? <div className="burst-flash" /> : null}
    </button>
  )
}

// the ball bursts into a red badge that squares off and opens into a framed window holding the pulls
export function Iris({ settled, results, onContinue }) {
  return (
    <div className={'iris' + (settled ? ' settled' : '')}>
      <div className="iris-win">
        {settled ? (
          <div className="iris-content">
            {results.length === 1 ? (
              <ResultCard r={results[0]} big={true} i={0} />
            ) : (
              <div className="reveal-grid">
                {results.map((r, i) => (
                  <ResultCard key={i} r={r} i={i} />
                ))}
              </div>
            )}
            <button
              className="btn lav result-pop"
              style={{
                animationDelay: results.length * 0.09 + 0.15 + 's',
              }}
              onClick={onContinue}
            >
              Continue
            </button>
          </div>
        ) : null}
      </div>
      {settled ? null : (
        <div className="iris-icon">
          <Pokeball size={36} />
        </div>
      )}
    </div>
  )
}

// ---- legendary reveal: a golden burst right after the card pops in, then lingering twinkles ----

function LegendFx({ big, delay }) {
  const k = big ? 1 : 0.62 // x5 cards are smaller, so keep the effect closer
  return [
    <div
      key="glow"
      className="legend-glow"
      style={{
        animationDelay: delay + 0.1 + 's',
      }}
    />,
    <div key="fx" className="legend-fx" aria-hidden={true}>
      <div
        className="legend-ring"
        style={{
          animationDelay: delay + 's',
        }}
      />
      <div
        className="legend-ring"
        style={{
          animationDelay: delay + 0.18 + 's',
        }}
      />
      {legendSparks.map((s, j) => (
        <span
          key={'s' + j}
          className="legend-spark"
          style={{
            '--dx': (s.dx * k).toFixed(0) + 'px',
            '--dy': (s.dy * k).toFixed(0) + 'px',
            color: s.color,
            fontSize: Math.round(s.size * (big ? 1 : 0.8)) + 'px',
            animationDelay: delay + s.lag + 's',
          }}
        >
          ✦
        </span>
      ))}
      {legendTwinkles.map(([x, y], j) => (
        <span
          key={'t' + j}
          className="ready-twinkle legend-twinkle"
          style={{
            left: (x * k).toFixed(0) + 'px',
            top: (y * k).toFixed(0) + 'px',
            color: LEGEND_COLORS[j % 4],
            fontSize: (big ? 20 : 14) + (j % 2) * 6 + 'px',
            animationDelay: delay + 0.7 + j * 0.28 + 's',
          }}
        >
          ✦
        </span>
      ))}
    </div>,
  ]
}

function ResultCard({ r, big, i = 0 }) {
  const sp = PM.byId(r.speciesId)
  const rar = RARITY[sp.rarity]
  const size = big ? 112 : 80
  return (
    <div
      className="gacha-result result-pop"
      style={{
        animationDelay: i * 0.09 + 's',
        background: 'var(--card-2)',
        border: '3px solid ' + rar.color,
        borderRadius: 14,
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 0 0 3px rgba(255,255,255,.5), 0 0 18px ' + rar.glow,
      }}
    >
      {/* starts as the card finishes popping in */}
      {sp.rarity === 'legendary' ? <LegendFx big={big} delay={i * 0.09 + 0.3} /> : null}
      {r.isNew ? (
        <div style={badge('var(--pink)', 'var(--pink-deep)')}>NEW!</div>
      ) : (
        <div style={badge('var(--sky)', '#5f93a6')}>DUPE</div>
      )}
      {r.pity ? <div style={corner('var(--coin)', 'var(--coin-line)', '#7a5a14')}>PITY</div> : null}
      {r.target ? (
        <div style={corner('var(--sage)', 'var(--sage-deep)', '#3e5226')}>
          {r.targetTier === 'epic' ? 'EPIC TARGET' : 'LEGEND TARGET'}
        </div>
      ) : null}
      <div
        style={{
          background: rar.glow,
          borderRadius: 10,
          padding: big ? 8 : 6,
          display: 'inline-block',
          marginBottom: 6,
        }}
      >
        <Creature species={r.speciesId} shiny={r.shiny} size={size} bob={true} />
      </div>
      <div
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: big ? 13 : 10,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
        }}
      >
        {sp.name}
      </div>
      <div
        style={{
          margin: '5px 0 0',
        }}
      >
        <RarityTag rarity={sp.rarity} />
      </div>
      {r.used && r.used.length ? (
        <div className="used-items">
          {r.used.map((id) => (
            <span key={id}>
              {id === 'genTicket' ? '🎟️ ' + genLabel(r.usedGen) : ITEM_BY_ID[id].name}
            </span>
          ))}
        </div>
      ) : null}
      {r.kept ? (
        <div className="used-items">
          <span>Pity landed first — items kept</span>
        </div>
      ) : null}
      {r.isDup ? (
        <div style={dupMsg()}>
          {/* a duplicate levels up the friend it matches (nothing more once it is at the cap) */}
          {r.levels ? '+' + r.levels + ' levels \u2192 Lv ' + r.level : 'Already Lv ' + r.level}
          <br />
          {r.ready ? 'Ready to evolve! \u00b7 +' + r.refund + 'sh' : '+' + r.refund + ' shards'}
        </div>
      ) : null}
    </div>
  )
}

function badge(bg, bd) {
  return {
    position: 'absolute',
    top: -10,
    right: -8,
    transform: 'rotate(8deg)',
    background: bg,
    color: '#fff',
    fontFamily: "'Silkscreen'",
    fontSize: 8,
    padding: '3px 6px',
    borderRadius: 6,
    border: '2px solid ' + bd,
  }
}

function corner(bg, bd, col) {
  return {
    position: 'absolute',
    top: -10,
    left: -8,
    transform: 'rotate(-8deg)',
    background: bg,
    color: col,
    fontFamily: "'Silkscreen'",
    fontSize: 8,
    padding: '3px 6px',
    borderRadius: 6,
    border: '2px solid ' + bd,
  }
}

function dupMsg() {
  return {
    fontFamily: "'Silkscreen'",
    fontSize: 8,
    color: 'var(--shard-deep)',
    marginTop: 6,
    lineHeight: 1.5,
  }
}

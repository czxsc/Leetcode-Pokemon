import { useEffect, useRef, useState } from 'react'
import { Shard } from '../../components/icons'
import {
  BALL_ITEM,
  EPIC_PITY,
  EPIC_TARGET_PITY,
  LEGEND_PITY,
  LEGEND_TARGET_PITY,
  SUMMON_COST as COST,
} from '../../game/rules'
import * as PM from '../../game/species'
import { store, useStore } from '../../state/store'
import { GenModal } from './GenModal'
import { InfoModal } from './InfoModal'
import { BigBall, Iris } from './Reveal'
import { Bar, ItemsPanel, TargetSummary } from './SidePanel'
import { TargetModal } from './TargetModal'

const CHARGE_MS = 1500,
  OPEN_MS = 1350

const RANK = ['common', 'rare', 'epic', 'legendary']

const draws = (n) => n + (n === 1 ? ' draw' : ' draws')

export function Summon() {
  const st = useStore()
  const [phase, setPhase] = useState('idle')
  const [results, setResults] = useState(null)
  const [picker, setPicker] = useState(null)
  const [info, setInfo] = useState(false)
  const [armedBall, setArmedBall] = useState(null) // 'boost' | 'great' | 'ultra'
  const [armedGen, setArmedGen] = useState(null) // generation number
  const [genPicker, setGenPicker] = useState(false)
  const busy = useRef(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  // an armed item only counts while one is still in the bag
  const ball = armedBall && (st.items[BALL_ITEM[armedBall]] || 0) > 0 ? armedBall : null
  const gen = armedGen && (st.items.genTicket || 0) > 0 ? armedGen : null
  const armed = !!(ball || gen)

  // the pull is saved right away; the animation only decides when it is shown
  function draw(kind) {
    if (busy.current) return
    if (kind === 'multi' && armed) return
    const cost = COST[kind]
    if (st.shards < cost) return
    if (!store.spendShards(cost)) return
    busy.current = true
    const pulled = store.gachaPull(
      kind === 'single' ? 1 : 5,
      kind === 'single' && armed
        ? {
            ball,
            gen,
          }
        : null,
    )
    // spent items disarm; if pity landed first they stay armed for the next draw
    if (pulled[0].used && pulled[0].used.length) {
      setArmedBall(null)
      setArmedGen(null)
    }
    setResults(pulled)
    setPhase('charge')
    timer.current = setTimeout(() => setPhase('ready'), CHARGE_MS)
  }
  function open() {
    if (phase !== 'ready') return
    setPhase('open')
    timer.current = setTimeout(() => {
      setPhase('reveal')
      busy.current = false
    }, OPEN_MS)
  }
  const idle = phase === 'idle' || phase === 'reveal'
  // the aura hints at the best pull, in its rarity's glow
  const best = results
    ? RANK[Math.max(...results.map((r) => RANK.indexOf(PM.byId(r.speciesId).rarity)))]
    : 'common'
  const legendaryTarget = st.guaranteedLegendary ? PM.byId(st.guaranteedLegendary) : null
  const epicTarget = st.guaranteedEpic ? PM.byId(st.guaranteedEpic) : null
  return (
    <div className="split side-360">
      {picker ? <TargetModal tier={picker} onClose={() => setPicker(null)} /> : null}
      {info ? <InfoModal onClose={() => setInfo(false)} /> : null}
      {genPicker ? (
        <GenModal
          ball={ball}
          current={gen}
          onClose={() => setGenPicker(false)}
          onPick={(g) => {
            setArmedGen(g)
            setGenPicker(false)
          }}
        />
      ) : null}
      {/* LEFT stage */}
      <div
        className="panel cream summon-stage"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="panel-title"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
          }}
        >
          <span className="dot" />
          Summon a New Friend
        </div>
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
          }}
          className="cur-badge"
        >
          <Shard size={16} />
          {st.shards.toLocaleString()}
        </div>
        {phase === 'reveal' ? null : <BigBall phase={phase} rarity={best} onOpen={open} />}
        {phase === 'open' || phase === 'reveal' ? (
          <Iris
            settled={phase === 'reveal'}
            results={results}
            onContinue={() => {
              setPhase('idle')
              setResults(null)
            }}
          />
        ) : null}
        {/* kept in the layout through every phase so the ball never jumps */}
        {phase === 'reveal' ? null : (
          <div
            className={phase === 'ready' ? 'tap-hint' : ''}
            style={{
              marginTop: 30,
              fontFamily: "'Silkscreen'",
              fontSize: 11,
              color: 'var(--ink-faint)',
              textAlign: 'center',
              visibility: phase === 'idle' || phase === 'ready' ? 'visible' : 'hidden',
            }}
          >
            {phase === 'ready' ? 'Tap the ball to open it!' : 'Tap to draw a new pokemon!'}
          </div>
        )}
      </div>
      {/* RIGHT controls */}
      <div
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto',
        }}
      >
        <div
          className="panel-title"
          style={{
            margin: 0,
          }}
        >
          <span className="dot" />
          Summon
          <button
            className="info-btn"
            title={'Rates, pity & dupes'}
            aria-label="Summon info"
            onClick={() => setInfo(true)}
          >
            i
          </button>
        </div>
        <button
          className="btn shard"
          disabled={!idle || st.shards < COST.single}
          style={{
            fontSize: 13,
            padding: '16px',
          }}
          onClick={() => draw('single')}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {'Single Draw  \u00b7  '}
            <Shard
              size={16}
              style={{
                filter: 'brightness(1.6)',
              }}
            />
            {COST.single}
          </div>
        </button>
        <button
          className="btn lav"
          disabled={!idle || st.shards < COST.multi || armed}
          style={{
            fontSize: 13,
            padding: '16px',
          }}
          onClick={() => draw('multi')}
          title={armed ? 'Items work on Single Draws \u2014 clear them to use x5' : undefined}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {'x5 Draw  \u00b7  '}
            <Shard
              size={16}
              style={{
                filter: 'brightness(1.6)',
              }}
            />
            {COST.multi}
          </div>
        </button>
        {/* items for the next single draw */}
        <ItemsPanel
          st={st}
          ball={ball}
          gen={gen}
          disabled={!idle}
          setBall={setArmedBall}
          onTicket={(v) => (v === 'pick' ? setGenPicker(true) : setArmedGen(null))}
        />
        {/* pity meters */}
        <Bar
          label="EPIC+ PITY"
          left={Math.max(0, EPIC_PITY - st.epicPity)}
          frac={st.epicPity / EPIC_PITY}
          color="var(--lav-deep)"
        />
        <Bar
          label="LEGENDARY PITY"
          left={Math.max(0, LEGEND_PITY - st.pity)}
          frac={st.pity / LEGEND_PITY}
          color="var(--coin-deep)"
        />
        {/* guaranteed targets */}
        <div className="chip-card" style={{ padding: 12 }}>
          <TargetSummary
            label="LEGENDARY TARGET"
            target={legendaryTarget}
            chooseLabel="Choose"
            onChoose={() => setPicker('legendary')}
            pity={st.legendaryTargetPity}
            pityMax={LEGEND_TARGET_PITY}
            color="var(--sage-deep)"
            emptyText={`No legendary target set. Choose one to guarantee it within ${draws(LEGEND_TARGET_PITY - st.legendaryTargetPity)}.`}
          />
          <div
            style={{
              height: 1,
              background: 'var(--card-line)',
              margin: '10px 0 11px',
            }}
          />
          <TargetSummary
            label="EPIC TARGET"
            target={epicTarget}
            chooseLabel="Choose"
            onChoose={() => setPicker('epic')}
            pity={st.epicTargetPityCount}
            pityMax={EPIC_TARGET_PITY}
            color="var(--lav-deep)"
            emptyText={`No epic target set. Choose one to guarantee it within ${draws(EPIC_TARGET_PITY - st.epicTargetPityCount)}.`}
          />
        </div>
      </div>
    </div>
  )
}

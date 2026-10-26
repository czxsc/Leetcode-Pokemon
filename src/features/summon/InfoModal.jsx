import { PixelSparkle } from '../../components/PixelSparkle'
import {
  DUP_REFUND,
  EPIC_PITY,
  EPIC_TARGET_PITY,
  LEGEND_PITY,
  LEGEND_TARGET_PITY,
} from '../../game/rules'
import * as PM from '../../game/species'
import { RARITY } from '../../game/species'

// ---- summon info modal: rates, pity rules, dupes, shinies ----
export function InfoModal({ onClose }) {
  const W = PM.PULL_WEIGHTS
  const head = (text) => (
    <div
      style={{
        fontFamily: "'Silkscreen'",
        fontSize: 9,
        color: 'var(--ink-faint)',
        margin: '14px 0 8px',
      }}
    >
      {text}
    </div>
  )
  const para = {
    fontSize: 13,
    color: 'var(--ink)',
    lineHeight: 1.5,
    margin: '0 0 6px',
  }
  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="panel modal"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          position: 'relative',
        }}
      >
        <button className="modal-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="panel-title">
          <span className="dot" />
          Summon Info
        </div>
        {head('PULL RATES')}
        {[
          ['legendary', W.legendary],
          ['epic', W.epic],
          ['rare', W.rare],
          ['common', W.common],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 7,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: RARITY[k].color,
                border: '1px solid rgba(0,0,0,.15)',
              }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: 'var(--ink)',
              }}
            >
              {RARITY[k].label}
            </span>
            <span
              style={{
                fontFamily: "'Silkscreen'",
                fontSize: 11,
                color: 'var(--ink-soft)',
              }}
            >
              {v + '%'}
            </span>
          </div>
        ))}
        <div style={para}>
          <b>
            <PixelSparkle inline={true} still={true} />
            {' Shiny'}
          </b>
          {` chance is ${Math.round(PM.SHINY_CHANCE * 100)}% on every draw. `}A x5 Draw is simply
          five single draws for the same price.
        </div>
        {head('PITY')}
        <div style={para}>
          <b>Epic+ pity</b>
          {` — at most ${EPIC_PITY} draws without an epic or legendary; the guaranteed pull is usually epic, sometimes legendary.`}
        </div>
        <div style={para}>
          <b>Legendary pity</b>
          {` — a legendary within ${LEGEND_PITY} draws.`}
        </div>
        <div style={para}>
          <b>Targets</b>
          {` — a chosen legendary within ${LEGEND_TARGET_PITY} draws, a chosen epic within ${EPIC_TARGET_PITY}. `}
          Each counter resets when you pull it (early or on pity), and changing the target restarts
          it.
        </div>
        {head('DUPLICATES')}
        <div style={para}>
          {`Every dupe refunds `}
          <b>{`+${DUP_REFUND} Shards`}</b>.
        </div>
        <div style={para}>
          {'Dupes of evolvable mons build toward '}
          <b>evolution</b>
          {` (${PM.EVO_COPIES} copies — evolve from a friend’s card); non-evolvable dupes give `}
          <b>{`+${PM.DUP_LEVELS} levels`}</b>.
        </div>
        <div style={para}>
          {
            'A shiny and a normal of the same species are two different friends, so the first of each counts as new. '
          }
          Made one shiny with a Shiny Candy? Its normal version can be pulled as new again.
        </div>
        {head('ITEMS')}
        <div style={para}>
          {'Buy them with Coins in the Shop, then arm them here for your next '}
          <b>Single Draw</b>.
        </div>
        <div style={para}>
          <b>Rate Booster</b>
          {` — Epic ${PM.BOOSTED_WEIGHTS.epic}%, Legendary ${PM.BOOSTED_WEIGHTS.legendary}% (double), Rare ${PM.BOOSTED_WEIGHTS.rare}%, Common ${PM.BOOSTED_WEIGHTS.common}%.`}
        </div>
        <div style={para}>
          <b>Great Ball</b>
          {' — exactly Rare. '}
          <b>Ultra Ball</b>
          {' — exactly Epic. Only one of Booster / Great / Ultra per draw.'}
        </div>
        <div style={para}>
          <b>Generation Ticket</b>
          {' — the Pokémon comes from the generation you pick. Works with any ball or the Booster.'}
        </div>
        <div style={para}>
          If a pity or target guarantee lands on that draw, it wins and your items stay in the bag.
        </div>
      </div>
    </div>
  )
}

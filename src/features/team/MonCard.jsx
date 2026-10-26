import { Creature } from '../../components/Creature'
import { Shard } from '../../components/icons'
import { RarityTag } from '../../components/Tags'
import { monPower } from '../../game/derived'
import { expToNext, releaseValue } from '../../game/rules'
import * as PM from '../../game/species'
import { RARITY } from '../../game/species'

export function MonCard({ inst, inTeam, slot, onToggle, full, releasing, picked }) {
  const sp = PM.byId(inst.sp)
  const r = RARITY[sp.rarity]
  const need = expToNext(inst.level)
  const disabled = releasing ? inTeam : !inTeam && full
  return (
    <button
      onClick={() => (!disabled || (inTeam && !releasing)) && onToggle(inst.iid)}
      disabled={disabled}
      title={releasing && inTeam ? 'On your team — take it off the team to release it' : undefined}
      style={{
        textAlign: 'center',
        padding: '10px 6px 8px',
        borderRadius: 12,
        position: 'relative',
        background: picked ? 'var(--cream-2)' : inTeam ? 'var(--sage-lite)' : 'var(--card-2)',
        border: '3px solid ' + (picked ? 'var(--hard)' : inTeam ? 'var(--sage-deep)' : r.color),
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: inTeam
          ? 'inset 0 2px 0 rgba(255,255,255,.6), 0 0 10px ' + r.glow
          : 'inset 0 2px 0 rgba(255,255,255,.5)',
      }}
    >
      {inTeam ? (
        <div
          style={{
            position: 'absolute',
            top: -9,
            left: -7,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--sage-deep)',
            color: '#fff',
            fontFamily: "'Silkscreen'",
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}
        >
          {slot}
        </div>
      ) : picked ? (
        <div
          style={{
            position: 'absolute',
            top: -9,
            left: -7,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--hard)',
            color: '#fff',
            fontFamily: "'Silkscreen'",
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}
        >
          ✓
        </div>
      ) : null}
      {inst.form ? (
        <span
          className="type-tag"
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            background: inst.form === 'gmax' ? 'var(--pink)' : 'var(--lav)',
            color: '#fff',
            fontSize: 7,
          }}
        >
          {inst.form === 'gmax' ? 'GMAX' : 'MEGA'}
        </span>
      ) : null}
      <div
        style={{
          background: r.glow,
          borderRadius: 9,
          padding: 5,
          display: 'inline-block',
          marginBottom: 5,
        }}
      >
        <Creature inst={inst} size={50} bob={inTeam} />
      </div>
      <div
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: 9,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {inst.form ? PM.formName(sp, inst.form) : sp.name}
      </div>
      <div
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: 8,
          color: 'var(--ink-faint)',
          margin: '3px 0 4px',
        }}
      >
        {'Lv' + inst.level + '  \u2694' + monPower(inst)}
      </div>
      <div
        className="expbar"
        style={{
          marginBottom: 4,
        }}
      >
        <i
          style={{
            width: Math.round((inst.exp / need) * 100) + '%',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <RarityTag rarity={sp.rarity} />
      </div>
      {releasing && !inTeam ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            marginTop: 5,
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--ink-soft)',
          }}
        >
          +<Shard size={11} />
          {releaseValue(inst)}
        </div>
      ) : null}
    </button>
  )
}

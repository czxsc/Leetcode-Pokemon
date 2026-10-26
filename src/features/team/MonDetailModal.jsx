import { useEffect, useRef, useState } from 'react'
import { Creature } from '../../components/Creature'
import { PixelSparkle } from '../../components/PixelSparkle'
import { RarityTag, TypeTag } from '../../components/Tags'
import { monPower } from '../../game/derived'
import { expToNext } from '../../game/rules'
import * as PM from '../../game/species'
import { store, useStore } from '../../state/store'

function DetailTag({ label, bg, color, muted, border }) {
  return (
    <span
      className="type-tag"
      style={{
        background: bg,
        color: color || '#4a3a22',
        border: '2px solid ' + (border || 'rgba(124,90,61,.2)'),
        opacity: muted ? 0.55 : 1,
        letterSpacing: '.5px',
      }}
    >
      {label}
    </span>
  )
}

function FormSwitch({ inst, onSet }) {
  const sp = PM.byId(inst.sp)
  const opts = [
    {
      id: null,
      label: 'Normal',
    },
  ]
  if (sp.mega && inst.unlocked && inst.unlocked.mega)
    opts.push({
      id: 'mega',
      label: 'Mega',
    })
  if (sp.gmax && inst.unlocked && inst.unlocked.gmax)
    opts.push({
      id: 'gmax',
      label: 'G-Max',
    })
  if (opts.length < 2) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderRadius: 9,
        overflow: 'hidden',
        border: '2px solid var(--lav-deep)',
        marginBottom: 12,
      }}
    >
      {opts.map((o, i) => (
        <button
          key={o.label}
          onClick={() => onSet(o.id)}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            cursor: 'pointer',
            border: 'none',
            borderLeft: i ? '2px solid var(--lav-deep)' : 'none',
            background: (inst.form || null) === o.id ? 'var(--lav)' : 'var(--card-2)',
            color: (inst.form || null) === o.id ? '#fff' : 'var(--ink-soft)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function EvolutionChoice({ inst, onChoose }) {
  const sp = PM.byId(inst.sp)
  const opts = PM.evoOptions(sp)
  if (!opts || opts.length < 2) return null
  return (
    <div
      style={{
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: 9,
          color: 'var(--ink-faint)',
          marginBottom: 7,
        }}
      >
        CHOOSE EVOLUTION
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2,1fr)',
          gap: 7,
        }}
      >
        {opts.map((id) => {
          const evo = PM.byId(id)
          return (
            <button
              key={id}
              className="btn"
              style={{
                fontSize: 10,
                padding: '9px 8px',
              }}
              onClick={() => onChoose(id)}
            >
              {evo ? evo.name : id}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MonDetailModal({ iid, onClose }) {
  const st = useStore()
  const inst = st.owned.find((o) => o.iid === iid)
  const [anim, setAnim] = useState(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  if (!inst) return null
  const sp = PM.byId(inst.sp)
  const rar = PM.RARITY[sp.rarity]
  const need = expToNext(inst.level)
  const power = monPower(inst)
  const canEvo = !!(sp.evo || sp.id === 'eevee')
  const copies = inst.copies || 0
  const evoReady = canEvo && copies >= PM.EVO_COPIES
  const evoOptions = PM.evoOptions(sp)
  const evoName =
    evoOptions.length === 1 && PM.byId(evoOptions[0]) ? PM.byId(evoOptions[0]).name : null
  const unlocked = inst.unlocked || {}
  const megaUnlocked = !!unlocked.mega,
    gmaxUnlocked = !!unlocked.gmax
  function ceremony(action, makeForm) {
    if (anim) return
    setAnim(makeForm)
    timers.current.push(
      setTimeout(() => {
        action()
      }, 540),
    )
    timers.current.push(
      setTimeout(() => {
        setAnim(null)
      }, 1260),
    )
  }
  const sparks = anim
    ? Array.from({
        length: 16,
      }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2,
          d = 66 + (i % 3) * 18
        return (
          <span
            key={i}
            className="evo-spark"
            style={{
              '--dx': (Math.cos(a) * d).toFixed(0) + 'px',
              '--dy': (Math.sin(a) * d).toFixed(0) + 'px',
              fontSize: 12 + (i % 3) * 6 + 'px',
            }}
          >
            ✨
          </span>
        )
      })
    : null
  const tagRow = (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
        margin: '8px 0 2px',
      }}
    >
      {sp.types.map((t) => (
        <TypeTag key={t} type={t} />
      ))}
      <DetailTag label={'LV ' + inst.level} bg="var(--cream-2)" color="var(--ink-soft)" />
      {inst.shiny ? (
        <DetailTag
          label={
            <>
              <PixelSparkle inline={true} still={true} />
              {' SHINY'}
            </>
          }
          bg="var(--coin)"
          color="#7a5a14"
          border="var(--coin-line)"
        />
      ) : null}
      {sp.mega ? (
        <DetailTag
          label={inst.form === 'mega' ? '\u2b50 MEGA' : 'MEGA'}
          bg={inst.form === 'mega' ? 'var(--lav)' : '#d6cdbb'}
          color={inst.form === 'mega' ? '#fff' : '#8a8170'}
          border={inst.form === 'mega' ? 'var(--lav-deep)' : 'rgba(124,90,61,.25)'}
          muted={inst.form !== 'mega'}
        />
      ) : null}
      {sp.gmax ? (
        <DetailTag
          label={inst.form === 'gmax' ? '\u2b50 G-MAX' : 'G-MAX'}
          bg={inst.form === 'gmax' ? 'var(--pink)' : '#d6cdbb'}
          color={inst.form === 'gmax' ? '#fff' : '#8a8170'}
          border={inst.form === 'gmax' ? 'var(--pink-deep)' : 'rgba(124,90,61,.25)'}
          muted={inst.form !== 'gmax'}
        />
      ) : null}
    </div>
  )

  // stone buttons
  const stoneRows = []
  if (sp.mega) {
    stoneRows.push(
      megaUnlocked ? (
        <div
          key="mu"
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--sage-deep)',
            padding: '4px 0',
          }}
        >
          ✔ Mega Evolution unlocked
        </div>
      ) : (
        <button
          key="mb"
          className="btn lav"
          disabled={(st.megaStones || 0) <= 0 || !!anim}
          style={{
            width: '100%',
            fontSize: 11,
            padding: '11px',
            marginBottom: 6,
          }}
          onClick={() => ceremony(() => store.useStone(iid, 'mega'), 'mega')}
        >
          {(st.megaStones || 0) <= 0
            ? 'No Mega Stones in bag'
            : '\ud83d\udd2e Use Mega Stone  \u00b7  \u00d7' + (st.megaStones || 0)}
        </button>
      ),
    )
  }
  if (sp.gmax) {
    stoneRows.push(
      gmaxUnlocked ? (
        <div
          key="gu"
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 9,
            color: 'var(--sage-deep)',
            padding: '4px 0',
          }}
        >
          ✔ Gigantamax unlocked
        </div>
      ) : (
        <button
          key="gb"
          className="btn pink"
          disabled={(st.gmaxStones || 0) <= 0 || !!anim}
          style={{
            width: '100%',
            fontSize: 11,
            padding: '11px',
          }}
          onClick={() => ceremony(() => store.useStone(iid, 'gmax'), 'gmax')}
        >
          {(st.gmaxStones || 0) <= 0
            ? 'No G-Max Stones in bag'
            : '\ud83c\udf00 Use G-Max Stone  \u00b7  \u00d7' + (st.gmaxStones || 0)}
        </button>
      ),
    )
  }
  if (!sp.mega && !sp.gmax) {
    stoneRows.push(
      <div
        key="none"
        style={{
          fontFamily: "'Silkscreen'",
          fontSize: 9,
          color: 'var(--ink-faint)',
          textAlign: 'center',
          padding: '4px 0',
        }}
      >
        No Mega or Gigantamax form
      </div>,
    )
  }
  return (
    <div className="modal-veil" onClick={anim ? undefined : onClose}>
      <div
        className="panel modal fade-in"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: 386,
          maxWidth: '92%',
          padding: '18px 20px 20px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          disabled={!!anim}
          title="Close"
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            fontFamily: "'Silkscreen'",
            fontSize: 14,
            color: 'var(--ink-faint)',
            background: 'transparent',
            border: 'none',
            cursor: anim ? 'default' : 'pointer',
            padding: 4,
          }}
        >
          ×
        </button>
        {/* sprite stage */}
        <div
          style={{
            display: 'inline-block',
            background: rar.glow,
            borderRadius: 18,
            padding: 20,
            marginBottom: 4,
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5), 0 0 0 3px rgba(255,255,255,.4)',
          }}
        >
          <div className={'evo-stage' + (anim ? ' go' : '')}>
            {anim ? <div className="evo-burst" /> : null}
            {anim ? <div className="evo-ring" /> : null}
            <div
              className="evo-mon"
              style={{
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Creature inst={inst} size={120} bob={!anim} fill={true} />
            </div>
            {sparks}
          </div>
        </div>
        <div
          className="pixel-font"
          style={{
            fontSize: 17,
            color: 'var(--wood-dark)',
            marginTop: 4,
          }}
        >
          {inst.form ? PM.formName(sp, inst.form) : sp.name}
        </div>
        <div
          style={{
            marginTop: 6,
          }}
        >
          <RarityTag rarity={sp.rarity} />
        </div>
        {tagRow}
        <div
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 11,
            color: 'var(--ink-soft)',
            margin: '12px 0 5px',
          }}
        >
          {'Lv ' + inst.level + '  \u00b7  \u2694 ' + power + ' power'}
        </div>
        <div
          className="expbar"
          style={{
            height: 9,
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
            fontFamily: "'Silkscreen'",
            fontSize: 8,
            color: 'var(--ink-faint)',
            marginTop: 5,
          }}
        >
          {inst.exp + ' / ' + need + ' EXP'}
        </div>
        {/* form switch (only if something unlocked) */}
        <div
          style={{
            marginTop: 14,
          }}
        >
          <FormSwitch inst={inst} onSet={(f) => store.setForm(iid, f)} />
        </div>
        <div
          style={{
            height: 1,
            background: 'var(--card-line)',
            margin: '4px 0 14px',
          }}
        />
        {/* duplicates / evolution */}
        {canEvo ? (
          <div
            className="chip-card"
            style={{
              padding: '12px 14px',
              marginBottom: 10,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontFamily: "'Silkscreen'",
                  fontSize: 9,
                  color: 'var(--ink-faint)',
                }}
              >
                DUPLICATES COLLECTED
              </span>
              <span
                style={{
                  fontFamily: "'Silkscreen'",
                  fontSize: 11,
                  color: evoReady ? 'var(--sage-deep)' : 'var(--lav-deep)',
                }}
              >
                {copies + ' / ' + PM.EVO_COPIES}
              </span>
            </div>
            <div
              className="evo-dots"
              style={{
                justifyContent: 'flex-start',
                marginBottom: 11,
              }}
            >
              {Array.from({
                length: PM.EVO_COPIES,
              }).map((_, i) => (
                <i
                  key={i}
                  className={i < copies ? 'on' : ''}
                  style={{
                    width: 13,
                    height: 13,
                  }}
                />
              ))}
            </div>
            {evoReady && evoOptions.length > 1 ? (
              <EvolutionChoice
                inst={inst}
                onChoose={(id) => ceremony(() => store.evolveByDuplicates(iid, id), 'evolve')}
              />
            ) : null}
            <button
              className="btn green"
              disabled={!evoReady || !!anim || evoOptions.length > 1}
              style={{
                width: '100%',
                fontSize: 11,
                padding: '11px',
              }}
              onClick={() => ceremony(() => store.evolveByDuplicates(iid), 'evolve')}
            >
              {evoReady
                ? evoOptions.length > 1
                  ? '\u2728 Choose an evolution above'
                  : '\u2728 Evolve' + (evoName ? ' into ' + evoName : '') + '!'
                : 'Collect ' + (PM.EVO_COPIES - copies) + ' more to evolve'}
            </button>
          </div>
        ) : (
          <div
            className="chip-card"
            style={{
              padding: '10px 14px',
              marginBottom: 10,
              fontFamily: "'Silkscreen'",
              fontSize: 9,
              color: 'var(--ink-faint)',
            }}
          >
            ✔ Fully evolved — no further evolution
          </div>
        )}
        {/* stones */}
        <div
          className="chip-card"
          style={{
            padding: '12px 14px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 9,
              color: 'var(--ink-faint)',
              marginBottom: 10,
            }}
          >
            FORM STONES
          </div>
          {stoneRows}
        </div>
      </div>
    </div>
  )
}

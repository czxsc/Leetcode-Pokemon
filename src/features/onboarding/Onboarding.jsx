import { useRef, useState } from 'react'
import pokeAvatar from '../../assets/PokeAvatar.png'
import { Creature } from '../../components/Creature'
import { Pokeball } from '../../components/icons'
import { RarityTag } from '../../components/Tags'
import * as PM from '../../game/species'
import { shrinkPhoto } from '../../lib/photo'
import { store } from '../../state/store'

const STEPS = [
  ['trainer', 'Trainer'],
  ['partner', 'Partner'],
  ['team', 'Team'],
]

function StepDots({ step }) {
  const at = STEPS.findIndex((s) => s[0] === step)
  return (
    <div className="onb-steps">
      {STEPS.map(([id, label], i) => (
        <div key={id} className={'onb-step' + (i === at ? ' on' : i < at ? ' done' : '')}>
          <span className="onb-step-n">{i < at ? '✔' : i + 1}</span>
          {label}
        </div>
      ))}
    </div>
  )
}

function TrainerStep({ name, setName, avatar, setAvatar, onNext }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)
  async function pick(ev) {
    const file = ev.target.files && ev.target.files[0]
    ev.target.value = ''
    if (!file) return
    if (!/^image\//.test(file.type)) {
      setMsg('That file isn’t an image.')
      return
    }
    try {
      setAvatar(await shrinkPhoto(file))
      setMsg(null)
    } catch (err) {
      setMsg(err.message || 'Couldn’t use that image.')
    }
  }
  return (
    <div className="onb-body">
      <div className="onb-lead">First things first — what should we call you?</div>
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          margin: '26px auto 0',
          width: 520,
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            className="trainer-avatar"
            style={{
              width: 112,
              height: 112,
            }}
          >
            <button
              type="button"
              className="avatar-upload"
              title="Upload a profile picture (optional)"
              aria-label="Upload a profile picture"
              onClick={() => fileRef.current && fileRef.current.click()}
            >
              <img
                src={avatar || pokeAvatar}
                alt="Trainer avatar"
                draggable={false}
                style={{
                  imageRendering: avatar ? 'auto' : 'pixelated',
                }}
              />
              <span className="avatar-overlay" aria-hidden={true}>
                <span className="avatar-overlay-label">upload</span>
              </span>
            </button>
            {avatar ? (
              <button
                type="button"
                className="avatar-reset"
                title="Use the default avatar"
                aria-label="Use the default avatar"
                onClick={() => setAvatar(null)}
              >
                ×
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={pick}
              style={{
                display: 'none',
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'Silkscreen'",
              fontSize: 8,
              color: 'var(--ink-faint)',
              marginTop: 8,
            }}
          >
            PHOTO (OPTIONAL)
          </div>
        </div>
        <div
          className="field"
          style={{
            flex: 1,
            margin: 0,
          }}
        >
          <label>Trainer name</label>
          <input
            value={name}
            autoFocus={true}
            maxLength={24}
            placeholder="Trainer"
            onChange={(ev) => setName(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') onNext()
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink-faint)',
            }}
          >
            You can change both later from your trainer card.
          </div>
        </div>
      </div>
      {msg ? (
        <div
          className="form-error"
          style={{
            textAlign: 'center',
            margin: '14px 0 0',
          }}
        >
          {'✖ ' + msg}
        </div>
      ) : null}
      <div className="onb-actions">
        <span />
        <button className="btn green" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  )
}

function PartnerStep({ partner, setPartner, onBack, onNext }) {
  const sp = partner && PM.byId(partner)
  return (
    <div className="onb-body">
      <div className="onb-lead">
        Choose your partner Pokémon — your favorite joins you from day one.
      </div>
      <div className="onb-grid">
        {PM.STARTERS.map((id) => {
          const s = PM.byId(id)
          return (
            <button
              key={id}
              type="button"
              className={'onb-mon' + (partner === id ? ' on' : '')}
              onClick={() => setPartner(id)}
              title={s.name}
            >
              <Creature species={id} size={52} bob={partner === id} fill={true} />
              <div className="onb-mon-name">{s.name}</div>
            </button>
          )
        })}
      </div>
      <div className="onb-actions">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
        <div
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: 10,
            color: 'var(--ink-soft)',
          }}
        >
          {sp ? 'Partner: ' + sp.name : 'Pick one to continue'}
        </div>
        <button className="btn green" disabled={!partner} onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  )
}

function TeamStep({ team, name, onBack, onDone }) {
  const [lead, ...rest] = team
  const leadSp = PM.byId(lead)
  const card = (id, big) => {
    const s = PM.byId(id)
    return (
      <div
        key={id}
        className={'onb-teamcard' + (big ? ' lead' : '')}
        style={{
          borderColor: PM.RARITY[s.rarity].color,
        }}
      >
        {big ? <div className="onb-partner-tag">PARTNER</div> : null}
        <div
          style={{
            background: PM.RARITY[s.rarity].glow,
            borderRadius: 10,
            padding: big ? 10 : 5,
            display: 'inline-block',
          }}
        >
          <Creature species={id} size={big ? 110 : 58} bob={true} fill={true} />
        </div>
        <div
          style={{
            fontFamily: "'Silkscreen'",
            fontSize: big ? 13 : 9,
            color: 'var(--ink)',
            margin: '6px 0 4px',
            whiteSpace: 'nowrap',
          }}
        >
          {s.name}
        </div>
        <RarityTag rarity={s.rarity} />
      </div>
    )
  }
  return (
    <div className="onb-body">
      <div className="onb-lead">
        {'Meet your team! '}
        <b>{leadSp.name}</b>
        {' brought along five friends.'}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 22,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 22,
        }}
      >
        {card(lead, true)}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 120px)',
            gap: 12,
          }}
        >
          {rest.map((id) => card(id, false))}
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-faint)',
          textAlign: 'center',
          marginTop: 18,
          lineHeight: 1.5,
        }}
      >
        Everyone starts at Lv5. Solve problems to earn Shards, then catch more friends on the Summon
        tab.
      </div>
      <div className="onb-actions">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
        <span />
        <button className="btn lav" onClick={onDone}>
          {'Start your journey, ' + (name.trim() || 'Trainer') + '!'}
        </button>
      </div>
    </div>
  )
}

export function Onboarding() {
  const [step, setStep] = useState('trainer')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [partner, setPartner] = useState(null)
  const [team, setTeam] = useState(null)
  function toTeam() {
    // keep the same five when coming back with the same partner
    if (!team || team[0] !== partner) setTeam(PM.rollStarterTeam(Math.random, partner))
    setStep('team')
  }
  function finish() {
    store.completeOnboarding({
      name,
      avatar,
      species: team,
    })
  }
  return (
    <div className="onb-wrap">
      <div className="panel onb-panel fade-in">
        <div className="onb-head">
          <Pokeball size={30} />
          <div
            className="pixel-font"
            style={{
              fontSize: 20,
              color: 'var(--wood-dark)',
              flex: 1,
            }}
          >
            Welcome to PokéLeet
          </div>
          <StepDots step={step} />
        </div>
        {step === 'trainer' ? (
          <TrainerStep
            name={name}
            setName={setName}
            avatar={avatar}
            setAvatar={setAvatar}
            onNext={() => setStep('partner')}
          />
        ) : step === 'partner' ? (
          <PartnerStep
            partner={partner}
            setPartner={setPartner}
            onBack={() => setStep('trainer')}
            onNext={toTeam}
          />
        ) : (
          <TeamStep team={team} name={name} onBack={() => setStep('partner')} onDone={finish} />
        )}
      </div>
    </div>
  )
}

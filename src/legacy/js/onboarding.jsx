/* =====================================================================
   Onboarding — first run only (state.onboarded is false).
   1. Trainer: name + optional photo.  2. Partner: pick a favorite from
   every generation's starters, Pikachu and Eevee.  3. Team: the partner
   plus 4 random commons and 1 random rare (PixelMon.rollStarterTeam).
   Exposes window.Onboarding.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useRef, useState } = React;
  const PM = window.PixelMon;
  const STEPS = [['trainer','Trainer'],['partner','Partner'],['team','Team']];

  function StepDots({ step }){
    const at = STEPS.findIndex(s=>s[0]===step);
    return e('div',{ className:'onb-steps' },
      STEPS.map(([id,label],i)=> e('div',{ key:id, className:'onb-step'+(i===at?' on':i<at?' done':'') },
        e('span',{ className:'onb-step-n' }, i<at ? '✔' : i+1), label)));
  }

  function TrainerStep({ name, setName, avatar, setAvatar, onNext }){
    const fileRef = useRef(null);
    const [msg, setMsg] = useState(null);
    async function pick(ev){
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if(!file) return;
      if(!/^image\//.test(file.type)){ setMsg('That file isn’t an image.'); return; }
      try{ setAvatar(await window.shrinkPhoto(file)); setMsg(null); }
      catch(err){ setMsg(err.message || 'Couldn’t use that image.'); }
    }
    return e('div',{ className:'onb-body' },
      e('div',{ className:'onb-lead' }, 'First things first — what should we call you?'),
      e('div',{ style:{ display:'flex', gap:24, alignItems:'center', margin:'26px auto 0', width:520 } },
        e('div',{ style:{ textAlign:'center' } },
          e('div',{ className:'trainer-avatar', style:{ width:112, height:112 } },
            e('button',{ type:'button', className:'avatar-upload', title:'Upload a profile picture (optional)',
                'aria-label':'Upload a profile picture', onClick:()=> fileRef.current && fileRef.current.click() },
              e('img',{ src: avatar || window.AppAssets.pokeAvatar, alt:'Trainer avatar', draggable:false,
                style:{ imageRendering: avatar ? 'auto' : 'pixelated' } }),
              e('span',{ className:'avatar-overlay', 'aria-hidden':true }, e('span',{ className:'avatar-overlay-label' }, 'upload'))),
            avatar ? e('button',{ type:'button', className:'avatar-reset', title:'Use the default avatar',
              'aria-label':'Use the default avatar', onClick:()=>setAvatar(null) }, '×') : null,
            e('input',{ ref:fileRef, type:'file', accept:'image/png,image/jpeg,image/webp,image/gif', onChange:pick, style:{ display:'none' } })),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop:8 } }, 'PHOTO (OPTIONAL)')),
        e('div',{ className:'field', style:{ flex:1, margin:0 } },
          e('label',{}, 'Trainer name'),
          e('input',{ value:name, autoFocus:true, maxLength:24, placeholder:'Trainer',
            onChange:(ev)=>setName(ev.target.value), onKeyDown:(ev)=>{ if(ev.key==='Enter') onNext(); } }),
          e('div',{ style:{ fontSize:12, color:'var(--ink-faint)' } }, 'You can change both later from your trainer card.'))),
      msg ? e('div',{ className:'form-error', style:{ textAlign:'center', margin:'14px 0 0' } }, '✖ '+msg) : null,
      e('div',{ className:'onb-actions' },
        e('span'),
        e('button',{ className:'btn green', onClick:onNext }, 'Next →')));
  }

  function PartnerStep({ partner, setPartner, onBack, onNext }){
    const sp = partner && PM.byId(partner);
    return e('div',{ className:'onb-body' },
      e('div',{ className:'onb-lead' }, 'Choose your partner Pokémon — your favorite joins you from day one.'),
      e('div',{ className:'onb-grid' },
        PM.STARTERS.map(id=>{
          const s = PM.byId(id);
          return e('button',{ key:id, type:'button', className:'onb-mon'+(partner===id?' on':''), onClick:()=>setPartner(id), title:s.name },
            e(Creature,{ species:id, size:52, bob:partner===id, fill:true }),
            e('div',{ className:'onb-mon-name' }, s.name));
        })),
      e('div',{ className:'onb-actions' },
        e('button',{ className:'btn', onClick:onBack }, '← Back'),
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:'var(--ink-soft)' } }, sp ? 'Partner: '+sp.name : 'Pick one to continue'),
        e('button',{ className:'btn green', disabled:!partner, onClick:onNext }, 'Next →')));
  }

  function TeamStep({ team, name, onBack, onDone }){
    const [lead, ...rest] = team;
    const leadSp = PM.byId(lead);
    const card = (id, big)=>{
      const s = PM.byId(id);
      return e('div',{ key:id, className:'onb-teamcard'+(big?' lead':''), style:{ borderColor:PM.RARITY[s.rarity].color } },
        big ? e('div',{ className:'onb-partner-tag' }, 'PARTNER') : null,
        e('div',{ style:{ background:PM.RARITY[s.rarity].glow, borderRadius:10, padding:big?10:5, display:'inline-block' } },
          e(Creature,{ species:id, size:big?110:58, bob:true, fill:true })),
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:big?13:9, color:'var(--ink)', margin:'6px 0 4px', whiteSpace:'nowrap' } }, s.name),
        e(RarityTag,{ rarity:s.rarity }));
    };
    return e('div',{ className:'onb-body' },
      e('div',{ className:'onb-lead' }, 'Meet your team! ', e('b',{}, leadSp.name), ' brought along five friends.'),
      e('div',{ style:{ display:'flex', gap:22, alignItems:'center', justifyContent:'center', marginTop:22 } },
        card(lead, true),
        e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(3, 120px)', gap:12 } }, rest.map(id=> card(id, false)))),
      e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', textAlign:'center', marginTop:18, lineHeight:1.5 } },
        'Everyone starts at Lv5. Solve problems to earn Shards, then catch more friends on the Summon tab.'),
      e('div',{ className:'onb-actions' },
        e('button',{ className:'btn', onClick:onBack }, '← Back'),
        e('span'),
        e('button',{ className:'btn lav', onClick:onDone }, 'Start your journey, '+(name.trim() || 'Trainer')+'!')));
  }

  function Onboarding(){
    const [step, setStep] = useState('trainer');
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [partner, setPartner] = useState(null);
    const [team, setTeam] = useState(null);

    function toTeam(){
      // keep the same five when coming back with the same partner
      if(!team || team[0]!==partner) setTeam(PM.rollStarterTeam(partner));
      setStep('team');
    }
    function finish(){ window.Store.completeOnboarding({ name, avatar, species:team }); }

    return e('div',{ className:'onb-wrap' },
      e('div',{ className:'panel onb-panel fade-in' },
        e('div',{ className:'onb-head' },
          e(Pokeball,{ size:30 }),
          e('div',{ className:'pixel-font', style:{ fontSize:20, color:'var(--wood-dark)', flex:1 } }, 'Welcome to PokéLeet'),
          e(StepDots,{ step })),
        step==='trainer' ? e(TrainerStep,{ name, setName, avatar, setAvatar, onNext:()=>setStep('partner') })
        : step==='partner' ? e(PartnerStep,{ partner, setPartner, onBack:()=>setStep('trainer'), onNext:toTeam })
        : e(TeamStep,{ team, name, onBack:()=>setStep('partner'), onDone:finish })));
  }

  window.Onboarding = Onboarding;
})();

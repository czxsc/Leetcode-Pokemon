/* =====================================================================
   MonDetailModal — big card for one owned creature. Shows detailed
   sprite, type/level/shiny/mega/gmax tags, duplicate-evolution, and
   mega/gigantamax stone unlocking + form switching. Shared by the
   Team tab (primary) and the Dashboard active-team strip.
   Exposes window.MonDetailModal.
===================================================================== */
(function(){
  const e = React.createElement;
  const PM = window.PixelMon;

  function DetailTag({ label, bg, color, muted, border }){
    return e('span',{ className:'type-tag', style:{
      background: bg, color: color||'#4a3a22',
      border: '2px solid '+(border||'rgba(124,90,61,.2)'),
      opacity: muted?0.55:1, letterSpacing:'.5px' } }, label);
  }

  function FormSwitch({ inst, onSet }){
    const sp = PM.byId(inst.sp);
    const opts = [{ id:null, label:'Normal' }];
    if(sp.mega && inst.unlocked && inst.unlocked.mega) opts.push({ id:'mega', label:'Mega' });
    if(sp.gmax && inst.unlocked && inst.unlocked.gmax) opts.push({ id:'gmax', label:'G-Max' });
    if(opts.length<2) return null;
    return e('div',{ style:{ display:'flex', gap:0, borderRadius:9, overflow:'hidden', border:'2px solid var(--lav-deep)', marginBottom:12 } },
      opts.map((o,i)=> e('button',{ key:o.label, onClick:()=>onSet(o.id),
        style:{ flex:1, padding:'8px 4px', fontFamily:"'Silkscreen'", fontSize:9, cursor:'pointer',
          border:'none', borderLeft: i? '2px solid var(--lav-deep)':'none',
          background: (inst.form||null)===o.id ? 'var(--lav)' : 'var(--card-2)',
          color: (inst.form||null)===o.id ? '#fff' : 'var(--ink-soft)' } }, o.label))
    );
  }

  function MonDetailModal({ iid, onClose }){
    const st = window.useStore();
    const inst = st.owned.find(o=>o.iid===iid);
    const [anim, setAnim] = React.useState(null);
    const timers = React.useRef([]);
    React.useEffect(()=> ()=> timers.current.forEach(clearTimeout), []);
    if(!inst) return null;

    const sp = PM.byId(inst.sp);
    const rar = PM.RARITY[sp.rarity];
    const need = window.Derived.expToNext(inst.level);
    const power = window.Derived.monPower(inst);

    const canEvo = !!(sp.evo || sp.id==='eevee');
    const copies = inst.copies||0;
    const evoReady = canEvo && copies >= PM.EVO_COPIES;
    const evoName = (sp.id==='eevee') ? null : (sp.evo && PM.byId(sp.evo) ? PM.byId(sp.evo).name : null);

    const unlocked = inst.unlocked || {};
    const megaUnlocked = !!unlocked.mega, gmaxUnlocked = !!unlocked.gmax;

    function ceremony(fnName, makeForm){
      if(anim) return;
      setAnim(makeForm);
      timers.current.push(setTimeout(()=>{ window.Store[fnName](iid); }, 540));
      timers.current.push(setTimeout(()=>{ setAnim(null); }, 1260));
    }

    const sparks = anim ? Array.from({length:16}).map((_,i)=>{
      const a = (i/16)*Math.PI*2, d = 66 + (i%3)*18;
      return e('span',{ key:i, className:'evo-spark',
        style:{ '--dx':(Math.cos(a)*d).toFixed(0)+'px', '--dy':(Math.sin(a)*d).toFixed(0)+'px', fontSize:(12+(i%3)*6)+'px' } }, '\u2728');
    }) : null;

    const tagRow = e('div',{ style:{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', margin:'8px 0 2px' } },
      sp.types.map(t=> e(TypeTag,{ key:t, type:t })),
      e(DetailTag,{ label:'LV '+inst.level, bg:'var(--cream-2)', color:'var(--ink-soft)' }),
      inst.shiny ? e(DetailTag,{ label:'\u2728 SHINY', bg:'var(--coin)', color:'#7a5a14', border:'var(--coin-line)' }) : null,
      sp.mega ? e(DetailTag,{ label: inst.form==='mega'?'\u2b50 MEGA':'MEGA',
        bg: inst.form==='mega'?'var(--lav)':'#d6cdbb', color: inst.form==='mega'?'#fff':'#8a8170',
        border: inst.form==='mega'?'var(--lav-deep)':'rgba(124,90,61,.25)', muted: inst.form!=='mega' }) : null,
      sp.gmax ? e(DetailTag,{ label: inst.form==='gmax'?'\u2b50 G-MAX':'G-MAX',
        bg: inst.form==='gmax'?'var(--pink)':'#d6cdbb', color: inst.form==='gmax'?'#fff':'#8a8170',
        border: inst.form==='gmax'?'var(--pink-deep)':'rgba(124,90,61,.25)', muted: inst.form!=='gmax' }) : null
    );

    // stone buttons
    const stoneRows = [];
    if(sp.mega){
      stoneRows.push(megaUnlocked
        ? e('div',{ key:'mu', style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--sage-deep)', padding:'4px 0' } }, '\u2714 Mega Evolution unlocked')
        : e('button',{ key:'mb', className:'btn lav', disabled:(st.megaStones||0)<=0 || !!anim, style:{ width:'100%', fontSize:11, padding:'11px', marginBottom:6 },
            onClick:()=> ceremony('useMegaStone','mega') },
            (st.megaStones||0)<=0 ? 'No Mega Stones in bag' : ('\ud83d\udd2e Use Mega Stone  \u00b7  \u00d7'+(st.megaStones||0))));
    }
    if(sp.gmax){
      stoneRows.push(gmaxUnlocked
        ? e('div',{ key:'gu', style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--sage-deep)', padding:'4px 0' } }, '\u2714 Gigantamax unlocked')
        : e('button',{ key:'gb', className:'btn pink', disabled:(st.gmaxStones||0)<=0 || !!anim, style:{ width:'100%', fontSize:11, padding:'11px' },
            onClick:()=> ceremony('useGmaxStone','gmax') },
            (st.gmaxStones||0)<=0 ? 'No G-Max Stones in bag' : ('\ud83c\udf00 Use G-Max Stone  \u00b7  \u00d7'+(st.gmaxStones||0))));
    }
    if(!sp.mega && !sp.gmax){
      stoneRows.push(e('div',{ key:'none', style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', textAlign:'center', padding:'4px 0' } }, 'No Mega or Gigantamax form'));
    }

    return e('div',{ className:'modal-veil', onClick: anim?undefined:onClose },
      e('div',{ className:'panel modal fade-in', onClick:(ev)=>ev.stopPropagation(),
        style:{ width:386, maxWidth:'92%', padding:'18px 20px 20px', textAlign:'center', position:'relative' } },
        e('button',{ onClick:onClose, disabled:!!anim, title:'Close', style:{ position:'absolute', top:10, right:12,
          fontFamily:"'Silkscreen'", fontSize:14, color:'var(--ink-faint)', background:'transparent', border:'none', cursor: anim?'default':'pointer', padding:4 } }, '\u00d7'),

        // sprite stage
        e('div',{ style:{ display:'inline-block', background:rar.glow, borderRadius:18, padding:18, marginBottom:4,
          boxShadow:'inset 0 2px 0 rgba(255,255,255,.5), 0 0 0 3px rgba(255,255,255,.4)' } },
          e('div',{ className:'evo-stage'+(anim?' go':'') },
            anim ? e('div',{ className:'evo-burst' }) : null,
            anim ? e('div',{ className:'evo-ring' }) : null,
            e('div',{ className:'evo-mon', style:{ position:'relative', zIndex:1 } },
              e(Creature,{ inst, size:132, bob:!anim })),
            sparks
          )),

        e('div',{ className:'pixel-font', style:{ fontSize:17, color:'var(--wood-dark)', marginTop:4 } },
          (inst.shiny?'\u2728 ':'')+(inst.form?PM.formName(sp,inst.form):sp.name)),
        e('div',{ style:{ marginTop:6 } }, e(RarityTag,{ rarity:sp.rarity })),
        tagRow,

        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-soft)', margin:'12px 0 5px' } },
          'Lv '+inst.level+'  \u00b7  \u2694 '+power+' power'),
        e('div',{ className:'expbar', style:{ height:9 } }, e('i',{ style:{ width:Math.round(inst.exp/need*100)+'%' } })),
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop:5 } }, inst.exp+' / '+need+' EXP'),

        // form switch (only if something unlocked)
        e('div',{ style:{ marginTop:14 } }, e(FormSwitch,{ inst, onSet:(f)=> window.Store.setForm(iid, f) })),

        e('div',{ style:{ height:1, background:'var(--card-line)', margin:'4px 0 14px' } }),

        // duplicates / evolution
        canEvo ? e('div',{ className:'chip-card', style:{ padding:'12px 14px', marginBottom:10, textAlign:'left' } },
            e('div',{ style:{ display:'flex', alignItems:'center', marginBottom:8 } },
              e('span',{ style:{ flex:1, fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'DUPLICATES COLLECTED'),
              e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color: evoReady?'var(--sage-deep)':'var(--lav-deep)' } }, copies+' / '+PM.EVO_COPIES)),
            e('div',{ className:'evo-dots', style:{ justifyContent:'flex-start', marginBottom:11 } },
              Array.from({length:PM.EVO_COPIES}).map((_,i)=> e('i',{ key:i, className:i<copies?'on':'', style:{ width:13, height:13 } }))),
            e('button',{ className:'btn green', disabled: !evoReady || !!anim, style:{ width:'100%', fontSize:11, padding:'11px' },
              onClick:()=> ceremony('evolveByDuplicates','evolve') },
              evoReady ? ('\u2728 Evolve'+(evoName?(' into '+evoName):'')+'!') : ('Collect '+(PM.EVO_COPIES-copies)+' more to evolve'))
          )
        : e('div',{ className:'chip-card', style:{ padding:'10px 14px', marginBottom:10, fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } },
            '\u2714 Fully evolved \u2014 no further evolution'),

        // stones
        e('div',{ className:'chip-card', style:{ padding:'12px 14px', textAlign:'left' } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginBottom:10 } }, 'FORM STONES'),
          stoneRows
        )
      )
    );
  }

  window.MonDetailModal = MonDetailModal;
})();

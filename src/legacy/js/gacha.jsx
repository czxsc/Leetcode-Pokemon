/* =====================================================================
   Gacha page — spend Shards on draws off a big central Pokeball.
   Pity: epic-or-better within 15 · legendary within 40 · a chosen
   target mon within 100. Duplicate cash-back. Animated reveal.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState, useRef } = React;
  const RARITY = window.PixelMon.RARITY;
  const COST = { single:500, multi:2000 };
  const EPIC_PITY = 15, LEGEND_PITY = 40, TARGET_PITY = 100;

  function BigBall({ phase }){
    const cls = phase==='shake' ? 'ball-shake' : phase==='burst' ? 'ball-burst' : '';
    return e('div',{ className:'bigball-wrap' },
      e('div',{ className:'bigball '+cls },
        e('div',{ className:'bb-top' }), e('div',{ className:'bb-belt' }),
        e('div',{ className:'bb-btn' }), e('div',{ className:'bb-shine' })),
      phase==='burst' ? e('div',{ className:'burst-flash' }) : null
    );
  }

  function ResultCard({ r, big }){
    const sp = window.PixelMon.byId(r.speciesId);
    const rar = RARITY[sp.rarity];
    const size = big?112:60;
    return e('div',{ className:'gacha-result fade-in', style:{
        background:'var(--card-2)', border:'3px solid '+rar.color, borderRadius:14,
        padding: big?'18px 24px':'12px 8px', textAlign:'center', position:'relative',
        boxShadow:'0 0 0 3px rgba(255,255,255,.5), 0 0 18px '+rar.glow } },
      r.isNew ? e('div',{ style:badge('var(--pink)','var(--pink-deep)') }, r.shiny?'\u2728NEW':'NEW!')
        : e('div',{ style:badge('var(--sky)','#5f93a6') }, 'DUPE'),
      r.pity ? e('div',{ style:corner('var(--coin)','var(--coin-line)','#7a5a14') }, 'PITY') : null,
      r.target ? e('div',{ style:corner('var(--sage)','var(--sage-deep)','#3e5226') }, 'TARGET') : null,
      e('div',{ style:{ background:rar.glow, borderRadius:10, padding:big?8:5, display:'inline-block', marginBottom:6 } },
        e(Creature,{ species:r.speciesId, shiny:r.shiny, size, bob:true })),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:big?13:9, color:'var(--ink)', whiteSpace:'nowrap' } }, (r.shiny?'\u2728':'')+sp.name),
      e('div',{ style:{ margin:'5px 0 0' } }, e(RarityTag,{ rarity:sp.rarity })),
      r.levels ? e('div',{ style:dupMsg() }, '+'+r.levels+' levels', e('br'), '+'+r.refund+' shards')
      : r.isDup ? e('div',{ style:dupMsg() },
          e('div',{ className:'evo-dots', style:{ marginBottom:4 } }, Array.from({length:r.need}).map((_,i)=> e('i',{ key:i, className: i<r.copies?'on':'' }))),
          r.ready ? 'Ready to evolve! \u00b7 +'+r.refund+'sh' : 'Evo '+r.copies+'/'+r.need+'  \u00b7  +'+r.refund+'sh')
      : null
    );
  }
  function badge(bg,bd){ return { position:'absolute', top:-10, right:-8, transform:'rotate(8deg)',
    background:bg, color:'#fff', fontFamily:"'Silkscreen'", fontSize:8, padding:'3px 6px', borderRadius:6, border:'2px solid '+bd }; }
  function corner(bg,bd,col){ return { position:'absolute', top:-10, left:-8, transform:'rotate(-8deg)',
    background:bg, color:col, fontFamily:"'Silkscreen'", fontSize:8, padding:'3px 6px', borderRadius:6, border:'2px solid '+bd }; }
  function dupMsg(){ return { fontFamily:"'Silkscreen'", fontSize:8, color:'var(--shard-deep)', marginTop:6, lineHeight:1.5 }; }

  // ---- target picker modal ----
  function TargetModal({ onClose }){
    const [q, setQ] = useState('');
    const all = window.PixelMon.SPECIES;
    const ql = q.trim().toLowerCase();
    const list = (ql ? all.filter(s=> s.name.toLowerCase().includes(ql) || s.id.includes(ql))
                     : all.filter(s=> s.rarity==='legendary' || s.rarity==='epic')).slice(0,140);
    function pick(id){ window.Store.setGuaranteedTarget(id); onClose(); }
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation(), style:{ width:560, display:'flex', flexDirection:'column', maxHeight:'82%' } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Choose a Guaranteed Target'),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginBottom:10 } },
          'Pick any Pok\u00e9mon to chase for a completion goal. You\u2019re guaranteed to pull it within ', e('b',{},'100 draws'),
          ' \u2014 the counter resets if you get it sooner. (Showing epics & legendaries; search for any.)'),
        e('input',{ value:q, autoFocus:true, placeholder:'Search all Pok\u00e9mon\u2026', onChange:(ev)=>setQ(ev.target.value),
          style:{ marginBottom:12 } }),
        e('div',{ style:{ flex:1, minHeight:0, overflowY:'auto', display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, paddingRight:4 } },
          list.map(s=> e('button',{ key:s.id, onClick:()=>pick(s.id), title:s.name,
              style:{ textAlign:'center', padding:'8px 3px 5px', borderRadius:9, cursor:'pointer',
                background:'var(--card-2)', border:'2px solid '+RARITY[s.rarity].color } },
            e(Creature,{ species:s.id, size:40 }),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, s.name))),
          list.length===0 ? e('div',{ style:{ gridColumn:'1/-1', textAlign:'center', color:'var(--ink-faint)', padding:20 } }, 'No matches') : null),
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:12 } },
          e('button',{ className:'btn', onClick:()=>{ window.Store.setGuaranteedTarget(null); onClose(); } }, 'Clear Target'),
          e('button',{ className:'btn', onClick:onClose }, 'Close'))
      )
    );
  }

  function Bar({ label, left, frac, color }){
    return e('div',{ className:'chip-card', style:{ padding:'11px 14px' } },
      e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 } },
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, label),
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:color } }, left+' left')),
      e('div',{ className:'minibar', style:{ height:8 } }, e('i',{ style:{ width:Math.min(100,frac*100)+'%', background:color } })));
  }

  function Gacha(){
    const st = window.useStore();
    const [phase, setPhase] = useState('idle');
    const [results, setResults] = useState(null);
    const [picker, setPicker] = useState(false);
    const busy = useRef(false);

    function draw(kind){
      if(busy.current) return;
      const cost = COST[kind];
      if(st.shards < cost) return;
      if(!window.Store.spendShards(cost)) return;
      busy.current = true; setResults(null); setPhase('shake');
      const n = kind==='single'?1:5;
      setTimeout(()=>{
        setPhase('burst');
        const drawn = window.Store.gachaPull(n);
        setTimeout(()=>{ setResults(drawn); setPhase('reveal'); busy.current=false; }, 520);
      }, 1100);
    }

    const idle = phase==='idle' || phase==='reveal';
    const W = window.PixelMon.PULL_WEIGHTS;
    const target = st.guaranteedTarget ? window.PixelMon.byId(st.guaranteedTarget) : null;

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 360px', gap:14 } },
      picker ? e(TargetModal,{ onClose:()=>setPicker(false) }) : null,
      // LEFT stage
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' } },
        e('div',{ className:'panel-title', style:{ position:'absolute', top:16, left:16 } }, e('span',{className:'dot'}), 'Gacha Lab'),
        e('div',{ style:{ position:'absolute', top:14, right:16 }, className:'cur-badge' }, e(Shard,{size:16}), st.shards.toLocaleString()),

        phase==='reveal' && results
          ? e('div',{ style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:18 } },
              results.length===1
                ? e(ResultCard,{ r:results[0], big:true })
                : e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 } },
                    results.map((r,i)=> e(ResultCard,{ key:i, r }))),
              e('button',{ className:'btn lav', onClick:()=>{ setPhase('idle'); setResults(null); } }, 'Continue'))
          : e(BigBall,{ phase }),

        phase==='idle' ? e('div',{ style:{ marginTop:30, fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-faint)', textAlign:'center' } },
          'Tap a draw to summon a new friend!') : null
      ),

      // RIGHT controls
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', gap:12, overflowY:'auto' } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Summon'),
        e('button',{ className:'btn shard', disabled:!idle||st.shards<COST.single, style:{ fontSize:13, padding:'16px' }, onClick:()=>draw('single') },
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 } },
            'Single Draw  \u00b7  ', e(Shard,{size:16,style:{filter:'brightness(1.6)'}}), COST.single)),
        e('button',{ className:'btn lav', disabled:!idle||st.shards<COST.multi, style:{ fontSize:13, padding:'16px' }, onClick:()=>draw('multi') },
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 } },
            'x5 Draw  \u00b7  ', e(Shard,{size:16,style:{filter:'brightness(1.6)'}}), COST.multi)),

        // pity meters
        e(Bar,{ label:'EPIC+ PITY', left:Math.max(0,EPIC_PITY-st.epicPity), frac:st.epicPity/EPIC_PITY, color:'var(--lav-deep)' }),
        e(Bar,{ label:'LEGENDARY PITY', left:Math.max(0,LEGEND_PITY-st.pity), frac:st.pity/LEGEND_PITY, color:'var(--coin-deep)' }),

        // pull rates + guaranteed target
        e('div',{ className:'chip-card', style:{ padding:12 } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginBottom:8 } }, 'PULL RATES'),
          [['legendary',W.legendary],['epic',W.epic],['rare',W.rare],['common',W.common]].map(([k,v])=>
            e('div',{ key:k, style:{ display:'flex', alignItems:'center', gap:8, marginBottom:7 } },
              e('span',{ style:{ width:9, height:9, borderRadius:'50%', background:RARITY[k].color, border:'1px solid rgba(0,0,0,.15)' } }),
              e('span',{ style:{ flex:1, fontSize:13, color:'var(--ink)' } }, RARITY[k].label),
              e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-soft)' } }, v+'%'))),

          // ----- guaranteed target -----
          e('div',{ style:{ height:1, background:'var(--card-line)', margin:'6px 0 11px' } }),
          e('div',{ style:{ display:'flex', alignItems:'center', marginBottom:9 } },
            e('span',{ style:{ flex:1, fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'GUARANTEED TARGET'),
            e('button',{ className:'iconbtn', onClick:()=>setPicker(true) }, target?'Change':'Choose')),
          target
            ? e('div',{},
                e('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:8 } },
                  e('div',{ style:{ background:RARITY[target.rarity].glow, borderRadius:9, padding:4, flex:'none' } }, e(Creature,{ species:target.id, size:38, bob:true })),
                  e('div',{ style:{ flex:1, minWidth:0 } },
                    e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, target.name),
                    e('div',{ style:{ marginTop:3 } }, e(RarityTag,{ rarity:target.rarity })))),
                e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 } },
                  e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, 'in '+Math.max(0,TARGET_PITY-st.targetPity)+' draws'),
                  e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--sage-deep)' } }, st.targetPity+'/'+TARGET_PITY)),
                e('div',{ className:'minibar', style:{ height:8 } }, e('i',{ style:{ width:(st.targetPity/TARGET_PITY*100)+'%', background:'linear-gradient(90deg,var(--sage),var(--sage-deep))' } })))
            : e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.4 } },
                'No target set. Choose one to guarantee it within 100 draws \u2014 great for finishing the Pok\u00e9dex.')),

        e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.5, marginTop:'auto' } },
          'Dupes of evolvable mons build toward ', e('b',{},'evolution'), ' (5 copies \u2014 evolve from a friend\u2019s card); non-evolvable dupes give ',
          e('b',{},'+5 levels'), '. ', e('b',{},'\u2728Shiny'), ' (10%) are separate collectibles \u2014 a shiny and normal of the same species are kept as two different friends.')
      )
    );
  }
  window.Gacha = Gacha;
})();

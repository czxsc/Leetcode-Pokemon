/* =====================================================================
   Gacha page — spend Shards on draws off a big central Pokeball.
   60/25/10/5 rates · 50-pull legendary pity · duplicate cash-back.
   Animated reveal: charge -> shake -> burst -> rarity flash.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState, useRef } = React;
  const RARITY = window.PixelMon.RARITY;
  const COST = { single:500, multi:2000 };

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
    const showSp = r.evolvedTo ? window.PixelMon.byId(r.evolvedTo) : sp;
    const rar = RARITY[showSp.rarity];
    const size = big?112:60;
    return e('div',{ className:'gacha-result fade-in', style:{
        background:'var(--card-2)', border:'3px solid '+rar.color, borderRadius:14,
        padding: big?'18px 24px':'12px 8px', textAlign:'center', position:'relative',
        boxShadow:'0 0 0 3px rgba(255,255,255,.5), 0 0 18px '+rar.glow } },
      r.isNew ? e('div',{ style:badge('var(--pink)','var(--pink-deep)') }, r.shiny?'\u2728NEW':'NEW!')
        : r.evolvedTo ? e('div',{ style:badge('var(--lav)','var(--lav-deep)') }, 'EVOLVED')
        : e('div',{ style:badge('var(--sky)','#5f93a6') }, 'DUPE'),
      r.pity ? e('div',{ style:{ position:'absolute', top:-10, left:-8, transform:'rotate(-8deg)',
        background:'var(--coin)', color:'#7a5a14', fontFamily:"'Silkscreen'", fontSize:8, padding:'3px 6px', borderRadius:6, border:'2px solid var(--coin-line)' } }, 'PITY') : null,
      e('div',{ style:{ background:rar.glow, borderRadius:10, padding:big?8:5, display:'inline-block', marginBottom:6 } },
        e(Creature,{ species:r.evolvedTo||r.speciesId, shiny:r.shiny, size, bob:true })),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:big?13:9, color:'var(--ink)', whiteSpace:'nowrap' } }, (r.shiny?'\u2728':'')+showSp.name),
      e('div',{ style:{ margin:'5px 0 0' } }, e(RarityTag,{ rarity:showSp.rarity })),
      // dup details
      r.evolvedTo ? e('div',{ style:dupMsg() }, 'Evolved into '+showSp.name+'!')
      : r.levels ? e('div',{ style:dupMsg() }, '+'+r.levels+' levels', e('br'), '+'+r.refund+' shards')
      : r.isDup ? e('div',{ style:dupMsg() },
          e('div',{ className:'evo-dots', style:{ marginBottom:4 } }, Array.from({length:r.need}).map((_,i)=> e('i',{ key:i, className: i<r.copies?'on':'' }))),
          'Evo '+r.copies+'/'+r.need+'  \u00b7  +'+r.refund+'sh')
      : null
    );
  }
  function badge(bg,bd){ return { position:'absolute', top:-10, right:-8, transform:'rotate(8deg)',
    background:bg, color:'#fff', fontFamily:"'Silkscreen'", fontSize:8, padding:'3px 6px', borderRadius:6, border:'2px solid '+bd }; }
  function dupMsg(){ return { fontFamily:"'Silkscreen'", fontSize:8, color:'var(--shard-deep)', marginTop:6, lineHeight:1.5 }; }

  function Gacha(){
    const st = window.useStore(s=>({ shards:s.shards, pity:s.pity }));
    const [phase, setPhase] = useState('idle');
    const [results, setResults] = useState(null);
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
    const pityLeft = 50 - st.pity;

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 360px', gap:14 } },
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
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', gap:12 } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Summon'),
        e('button',{ className:'btn shard', disabled:!idle||st.shards<COST.single, style:{ fontSize:13, padding:'16px' }, onClick:()=>draw('single') },
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 } },
            'Single Draw  \u00b7  ', e(Shard,{size:16,style:{filter:'brightness(1.6)'}}), COST.single)),
        e('button',{ className:'btn lav', disabled:!idle||st.shards<COST.multi, style:{ fontSize:13, padding:'16px' }, onClick:()=>draw('multi') },
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 } },
            'x5 Draw  \u00b7  ', e(Shard,{size:16,style:{filter:'brightness(1.6)'}}), COST.multi)),

        // pity meter
        e('div',{ className:'chip-card', style:{ padding:'12px 14px' } },
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 } },
            e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'LEGENDARY PITY'),
            e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:'var(--coin-deep)' } }, pityLeft+' left')),
          e('div',{ className:'minibar', style:{ height:9 } }, e('i',{ style:{ width:(st.pity/50*100)+'%', background:'linear-gradient(90deg,var(--coin),var(--coin-deep))' } })),
          e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', marginTop:7, lineHeight:1.4 } },
            'Guaranteed Legendary within 50 pulls.')),

        e('div',{ className:'chip-card', style:{ padding:12 } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginBottom:8 } }, 'PULL RATES'),
          [['legendary',W.legendary],['epic',W.epic],['rare',W.rare],['common',W.common]].map(([k,v])=>
            e('div',{ key:k, style:{ display:'flex', alignItems:'center', gap:8, marginBottom:7 } },
              e('span',{ style:{ width:9, height:9, borderRadius:'50%', background:RARITY[k].color, border:'1px solid rgba(0,0,0,.15)' } }),
              e('span',{ style:{ flex:1, fontSize:13, color:'var(--ink)' } }, RARITY[k].label),
              e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-soft)' } }, v+'%')))),

        e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.5, marginTop:'auto' } },
          'Dupes of evolvable mons build toward ', e('b',{},'evolution'), ' (5 copies); non-evolvable dupes give ',
          e('b',{},'+5 levels'), '. ', e('b',{},'\u2728Shiny'), ' (4%) are separate cosmetic collectibles.')
      )
    );
  }
  window.Gacha = Gacha;
})();

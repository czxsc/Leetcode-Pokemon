/* =====================================================================
   Gacha page — spend Shards on draws off a big central Pokeball.
   Pity: epic-or-better within 15 · legendary within 40 · a chosen
   target mon within 100. Duplicate cash-back. Animated reveal.
   Items from the Shop can be armed for a Single Draw: one of Rate
   Booster / Great Ball (Rare) / Ultra Ball (Epic), plus a Generation
   Ticket for a chosen generation.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState, useRef, useEffect } = React;
  const RARITY = window.PixelMon.RARITY;
  const COST = { single:400, multi:2000 };
  const EPIC_PITY = 15, LEGEND_PITY = 40, LEGEND_TARGET_PITY = 100, EPIC_TARGET_PITY = 60;
  const DUP_REFUND = 25;                                // matches Store.gachaPull
  const RANK = ['common','rare','epic','legendary'];
  const CHARGE_MS = 1500, OPEN_MS = 1350;              // match ballcharge and the iris timeline in theme.css
  const SPARK_COLORS = ['var(--shard-deep)','var(--lav-deep)','var(--coin-deep)','var(--pink-deep)'];
  const PM = window.PixelMon;

  // ---- gacha items (bought in the Shop, which shows the same list) ----
  // ball: the rarity setting it arms (only one per draw); the Generation Ticket stacks with any of them.
  // sprite: pokemondb item icon (see ItemIcon in ui.jsx); line: the bag tag color in the Shop
  const ITEMS = [
    { id:'rateBooster', ball:'boost', name:'Rate Booster', short:'Rate Booster', sprite:'lucky-egg', emoji:'🍀', line:'var(--sage-deep)', btn:'green',
      desc:'Next draw: Epic and Legendary odds doubled' },
    { id:'greatBall', ball:'great', name:'Great Ball', short:'Great Ball', sprite:'great-ball', emoji:'🔵', line:'#4a86d4', btn:'shard',
      desc:'Next draw is guaranteed to be Rare' },
    { id:'ultraBall', ball:'ultra', name:'Ultra Ball', short:'Ultra Ball', sprite:'ultra-ball', emoji:'🟡', line:'#34323c', btn:'lav',
      desc:'Next draw is guaranteed to be Epic' },
    { id:'genTicket', name:'Generation Ticket', short:'Gen Ticket', sprite:'eon-ticket', emoji:'🎟️', line:'var(--pink-deep)', btn:'pink',
      desc:'Next draw comes from a generation you choose' },
  ];
  const ITEM_BY_ID = Object.fromEntries(ITEMS.map(it=>[it.id,it]));
  const BALL_ITEM = Object.fromEntries(ITEMS.filter(it=>it.ball).map(it=>[it.ball, it.id]));
  const genLabel = (gen)=>{ const g = PM.GENERATIONS.find(x=>x.gen===gen); return g ? 'Gen '+gen+' · '+g.region : 'Gen '+gen; };
  // what an armed setup does to the next Single Draw, in words
  function describeArmed(ball, gen){
    const what = ball==='great' ? 'a guaranteed Rare' : ball==='ultra' ? 'a guaranteed Epic' : ball==='boost' ? 'doubled Epic & Legendary odds' : 'normal odds';
    return what + (gen ? ' from ' + genLabel(gen) : '');
  }

  // sparks thrown off while the ball charges up
  const sparks = Array.from({length:16}).map((_,i)=>{
    const a = (i/16)*Math.PI*2 + (i%2)*0.2, d = 130 + (i%3)*40;
    return e('span',{ key:'s'+i, className:'charge-spark',
      style:{ '--dx':(Math.cos(a)*d).toFixed(0)+'px', '--dy':(Math.sin(a)*d).toFixed(0)+'px',
        color:SPARK_COLORS[i%4], fontSize:(22+(i%3)*8)+'px', animationDelay:(0.3+(i%4)*0.13)+'s' } }, '✦');
  });
  const twinkles = [[-142,-78],[150,-44],[-124,98],[134,104],[8,-158],[-18,150]].map(([x,y],i)=>
    e('span',{ key:'t'+i, className:'ready-twinkle',
      style:{ left:`calc(50% + ${x}px)`, top:`calc(50% + ${y}px)`, color:SPARK_COLORS[i%4], fontSize:(20+(i%2)*8)+'px', animationDelay:(i*0.31)+'s' } }, '✦'));

  // charge: spins, grows and throws sparks · ready: floats and waits for a tap · open: pops into the iris
  function BigBall({ phase, rarity, onOpen }){
    const ready = phase==='ready';
    return e('button',{ type:'button', className:'bigball-wrap'+(ready?' tappable':''), disabled:!ready, onClick:onOpen,
        'aria-label': ready ? 'Open the Poké Ball' : 'Poké Ball', style:{ '--aura':RARITY[rarity].glow, '--aura-core':RARITY[rarity].color } },
      phase==='charge' || ready ? e('div',{ className:'ball-aura' }) : null,
      phase==='charge' ? [0,1,2].map(i=> e('div',{ key:'r'+i, className:'charge-ring', style:{ animationDelay:(0.25+i*0.28)+'s' } })) : null,
      phase==='charge' ? sparks : null,
      ready ? twinkles : null,
      e('div',{ className:'bigball'+(phase!=='idle' ? ' ball-'+phase : '') },
        e('div',{ className:'bb-top' }), e('div',{ className:'bb-belt' }),
        e('div',{ className:'bb-btn' }), e('div',{ className:'bb-shine' })),
      phase==='open' ? e('div',{ className:'burst-flash' }) : null
    );
  }

  // the ball bursts into a red badge that squares off and opens into a framed window holding the pulls
  function Iris({ settled, results, onContinue }){
    return e('div',{ className:'iris'+(settled?' settled':'') },
      e('div',{ className:'iris-win' },
        settled ? e('div',{ className:'iris-content' },
          results.length===1
            ? e(ResultCard,{ r:results[0], big:true, i:0 })
            : e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 } },
                results.map((r,i)=> e(ResultCard,{ key:i, r, i }))),
          e('button',{ className:'btn lav result-pop', style:{ animationDelay:(results.length*0.09+0.15)+'s' }, onClick:onContinue }, 'Continue'))
        : null),
      settled ? null : e('div',{ className:'iris-icon' }, e(Pokeball,{ size:36 }))
    );
  }

  // ---- legendary reveal: a golden burst right after the card pops in, then lingering twinkles ----
  const LEGEND_COLORS = ['var(--coin)', '#fff', 'var(--coin-deep)', '#fbe7b0'];
  const legendSparks = Array.from({length:20}).map((_,i)=>{
    const a = (i/20)*Math.PI*2 + (i%2)*0.15, d = 110 + (i%3)*38;
    return { dx:Math.cos(a)*d, dy:Math.sin(a)*d, color:LEGEND_COLORS[i%4], size:16+(i%3)*7, lag:(i%4)*0.05 };
  });
  const legendTwinkles = [[-88,-96],[92,-74],[-104,34],[98,58],[6,-128],[-14,122]];
  function LegendFx({ big, delay }){
    const k = big ? 1 : 0.62;                          // x5 cards are smaller, so keep the effect closer
    return [
      e('div',{ key:'glow', className:'legend-glow', style:{ animationDelay:(delay+0.1)+'s' } }),
      e('div',{ key:'fx', className:'legend-fx', 'aria-hidden':true },
        e('div',{ className:'legend-ring', style:{ animationDelay:delay+'s' } }),
        e('div',{ className:'legend-ring', style:{ animationDelay:(delay+0.18)+'s' } }),
        legendSparks.map((s,j)=> e('span',{ key:'s'+j, className:'legend-spark',
          style:{ '--dx':(s.dx*k).toFixed(0)+'px', '--dy':(s.dy*k).toFixed(0)+'px', color:s.color,
            fontSize:Math.round(s.size*(big?1:0.8))+'px', animationDelay:(delay+s.lag)+'s' } }, '✦')),
        legendTwinkles.map(([x,y],j)=> e('span',{ key:'t'+j, className:'ready-twinkle legend-twinkle',
          style:{ left:(x*k).toFixed(0)+'px', top:(y*k).toFixed(0)+'px', color:LEGEND_COLORS[j%4],
            fontSize:(big?20:14)+(j%2)*6+'px', animationDelay:(delay+0.7+j*0.28)+'s' } }, '✦')))
    ];
  }

  function ResultCard({ r, big, i=0 }){
    const sp = window.PixelMon.byId(r.speciesId);
    const rar = RARITY[sp.rarity];
    const size = big?112:80;
    return e('div',{ className:'gacha-result result-pop', style:{ animationDelay:(i*0.09)+'s',
        background:'var(--card-2)', border:'3px solid '+rar.color, borderRadius:14,
        padding: big?'18px 24px':'14px 12px', textAlign:'center', position:'relative',
        boxShadow:'0 0 0 3px rgba(255,255,255,.5), 0 0 18px '+rar.glow } },
      // starts as the card finishes popping in
      sp.rarity==='legendary' ? LegendFx({ big, delay:i*0.09 + 0.3 }) : null,
      r.isNew ? e('div',{ style:badge('var(--pink)','var(--pink-deep)') }, r.shiny?'\u2728NEW':'NEW!')
        : e('div',{ style:badge('var(--sky)','#5f93a6') }, 'DUPE'),
      r.pity ? e('div',{ style:corner('var(--coin)','var(--coin-line)','#7a5a14') }, 'PITY') : null,
      r.target ? e('div',{ style:corner('var(--sage)','var(--sage-deep)','#3e5226') }, r.targetTier==='epic'?'EPIC TARGET':'LEGEND TARGET') : null,
      e('div',{ style:{ background:rar.glow, borderRadius:10, padding:big?8:6, display:'inline-block', marginBottom:6 } },
        e(Creature,{ species:r.speciesId, shiny:r.shiny, size, bob:true })),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:big?13:10, color:'var(--ink)', whiteSpace:'nowrap' } }, (r.shiny?'\u2728':'')+sp.name),
      e('div',{ style:{ margin:'5px 0 0' } }, e(RarityTag,{ rarity:sp.rarity })),
      r.used && r.used.length ? e('div',{ className:'used-items' },
        r.used.map(id=> e('span',{ key:id }, id==='genTicket' ? '🎟️ '+genLabel(r.usedGen) : ITEM_BY_ID[id].name))) : null,
      r.kept ? e('div',{ className:'used-items' }, e('span',{}, 'Pity landed first — items kept')) : null,
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
  function TargetModal({ tier, onClose }){
    const [q, setQ] = useState('');
    const all = window.PixelMon.SPECIES;
    const ql = q.trim().toLowerCase();
    const pool = all.filter(s=> s.rarity===tier);
    const list = (ql ? pool.filter(s=> s.name.toLowerCase().includes(ql) || s.id.includes(ql)) : pool).slice(0,140);
    function pick(id){ tier==='legendary' ? window.Store.setLegendaryTarget(id) : window.Store.setEpicTarget(id); onClose(); }
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation(), style:{ width:560, display:'flex', flexDirection:'column', maxHeight:'82%' } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), tier==='legendary'?'Choose a Legendary Target':'Choose an Epic Target'),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginBottom:10 } },
          tier==='legendary'
            ? ['Pick a ', e('b',{},'legendary'), ' to chase. You\u2019re guaranteed to pull it within ', e('b',{},'100 draws'),
              ' \u2014 the counter resets if you get it sooner.']
            : ['Pick an ', e('b',{},'epic'), ' to chase. You\u2019re guaranteed to pull it within ', e('b',{},'60 draws'),
              ' \u2014 the counter resets if you get it sooner.']),
        e(SearchBox,{ value:q, autoFocus:true, placeholder:`Search ${tier} Pok\u00e9mon\u2026`, onChange:setQ }),
        e('div',{ style:{ flex:'1 1 360px', minHeight:0, overflowY:'auto', display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, paddingRight:4, alignContent:'start' } },
          list.map(s=> e('button',{ key:s.id, onClick:()=>pick(s.id), title:s.name,
              style:{ textAlign:'center', padding:'8px 3px 5px', borderRadius:9, cursor:'pointer',
                background:'var(--card-2)', border:'2px solid '+RARITY[s.rarity].color } },
            e(Creature,{ species:s.id, size:40 }),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, s.name))),
          list.length===0 ? e('div',{ style:{ gridColumn:'1/-1', textAlign:'center', color:'var(--ink-faint)', padding:20 } }, 'No matches') : null),
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:12 } },
          e('button',{ className:'btn', onClick:()=>{ tier==='legendary' ? window.Store.setLegendaryTarget(null) : window.Store.setEpicTarget(null); onClose(); } }, 'Clear Target'),
          e('button',{ className:'btn', onClick:onClose }, 'Close'))
      )
    );
  }

  // ---- summon info modal: rates, pity rules, dupes, shinies ----
  function InfoModal({ onClose }){
    const W = window.PixelMon.PULL_WEIGHTS;
    const PM = window.PixelMon;
    const head = (text)=> e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', margin:'14px 0 8px' } }, text);
    const para = { fontSize:13, color:'var(--ink)', lineHeight:1.5, margin:'0 0 6px' };
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation(), style:{ position:'relative' } },
        e('button',{ className:'modal-x', onClick:onClose, 'aria-label':'Close' }, '×'),
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Summon Info'),
        head('PULL RATES'),
        [['legendary',W.legendary],['epic',W.epic],['rare',W.rare],['common',W.common]].map(([k,v])=>
          e('div',{ key:k, style:{ display:'flex', alignItems:'center', gap:8, marginBottom:7 } },
            e('span',{ style:{ width:9, height:9, borderRadius:'50%', background:RARITY[k].color, border:'1px solid rgba(0,0,0,.15)' } }),
            e('span',{ style:{ flex:1, fontSize:13, color:'var(--ink)' } }, RARITY[k].label),
            e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-soft)' } }, v+'%'))),
        e('div',{ style:para }, e('b',{},'✨Shiny'), ` chance is ${Math.round(PM.SHINY_CHANCE*100)}% on every draw. `,
          'A x5 Draw is simply five single draws for the same price.'),
        head('PITY'),
        e('div',{ style:para }, e('b',{},'Epic+ pity'), ` — at most ${EPIC_PITY} draws without an epic or legendary; the guaranteed pull is usually epic, sometimes legendary.`),
        e('div',{ style:para }, e('b',{},'Legendary pity'), ` — a legendary within ${LEGEND_PITY} draws.`),
        e('div',{ style:para }, e('b',{},'Targets'), ` — a chosen legendary within ${LEGEND_TARGET_PITY} draws, a chosen epic within ${EPIC_TARGET_PITY}. `,
          'Each counter resets when you pull it (early or on pity), and changing the target restarts it.'),
        head('DUPLICATES'),
        e('div',{ style:para }, `Every dupe refunds `, e('b',{},`+${DUP_REFUND} Shards`), '.'),
        e('div',{ style:para }, 'Dupes of evolvable mons build toward ', e('b',{},'evolution'),
          ` (${PM.EVO_COPIES} copies — evolve from a friend’s card); non-evolvable dupes give `, e('b',{},`+${PM.DUP_LEVELS} levels`), '.'),
        e('div',{ style:para }, 'A shiny and a normal of the same species are two different friends, so the first of each counts as new. ',
          'Made one shiny with a Shiny Candy? Its normal version can be pulled as new again.'),
        head('ITEMS'),
        e('div',{ style:para }, 'Buy them with Coins in the Shop, then arm them here for your next ', e('b',{},'Single Draw'), '.'),
        e('div',{ style:para }, e('b',{},'Rate Booster'), ` — Epic ${PM.BOOSTED_WEIGHTS.epic}%, Legendary ${PM.BOOSTED_WEIGHTS.legendary}% (double), Rare ${PM.BOOSTED_WEIGHTS.rare}%, Common ${PM.BOOSTED_WEIGHTS.common}%.`),
        e('div',{ style:para }, e('b',{},'Great Ball'), ' — exactly Rare. ', e('b',{},'Ultra Ball'), ' — exactly Epic. Only one of Booster / Great / Ultra per draw.'),
        e('div',{ style:para }, e('b',{},'Generation Ticket'), ' — the Pokémon comes from the generation you pick. Works with any ball or the Booster.'),
        e('div',{ style:para }, 'If a pity or target guarantee lands on that draw, it wins and your items stay in the bag.')
      )
    );
  }

  // ---- Generation Ticket: pick which generation the next draw comes from ----
  function GenModal({ ball, current, onClose, onPick }){
    const [pick, setPick] = useState(current || null);
    const item = ITEM_BY_ID.genTicket;
    const tier = ball==='great' ? 'rare' : ball==='ultra' ? 'epic' : null;
    // three faces per generation: its starters where we have them, else its first species
    const faces = (gen)=>{ const s = PM.STARTERS.filter(id=> PM.byId(id).gen===gen);
      return (s.length>=3 ? s : PM.SPECIES.filter(x=>x.gen===gen).map(x=>x.id)).slice(0,3); };
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal fade-in', onClick:(ev)=>ev.stopPropagation(), style:{ width:600, position:'relative' } },
        e('button',{ className:'modal-x', onClick:onClose, 'aria-label':'Close' }, '×'),
        e('div',{ style:{ display:'flex', alignItems:'center', gap:12, marginBottom:14, paddingRight:24 } },
          e(ItemIcon,{ item, size:40 }),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, item.name+' — choose a generation'),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, 'Your next Single Draw comes from this generation.'))),
        e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9 } },
          PM.GENERATIONS.map(g=> e('button',{ key:g.gen, type:'button', className:'gen-card'+(pick===g.gen?' on':''), onClick:()=>setPick(g.gen) },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--ink)' } }, 'GEN '+g.gen),
            e('div',{ style:{ fontSize:13, color:'var(--ink-soft)' } }, g.region),
            e('div',{ style:{ display:'flex', justifyContent:'center', margin:'4px 0 2px' } }, faces(g.gen).map(id=> e(Creature,{ key:id, species:id, size:36, fill:true }))),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } },
              tier ? PM.tierPool(tier, g.gen).length+' '+RARITY[tier].label+' of '+g.count : g.count+' Pokémon')))),
        e('div',{ style:{ display:'flex', alignItems:'center', gap:12, marginTop:14, paddingTop:12, borderTop:'2px dashed var(--card-line)' } },
          e('div',{ style:{ flex:1, fontSize:13, color:'var(--ink-soft)' } },
            pick ? ['Next Single Draw: ', e('b',{ key:'b' }, describeArmed(ball, pick))] : 'Pick a generation'),
          e('button',{ className:'btn', style:{ fontSize:11 }, onClick:onClose }, 'Cancel'),
          e('button',{ className:'btn pink', style:{ fontSize:11 }, disabled:!pick, onClick:()=>onPick(pick) }, 'Use Ticket'))
      )
    );
  }

  // ---- arm items for the next Single Draw ----
  function ItemsPanel({ st, ball, gen, setBall, onTicket, disabled }){
    const count = (id)=> st.items[id] || 0;
    const armed = !!(ball || gen);
    return e('div',{ className:'chip-card', style:{ padding:12 } },
      e('div',{ style:{ display:'flex', alignItems:'center', marginBottom:9 } },
        e('span',{ style:{ flex:1, fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'ITEMS · NEXT SINGLE DRAW'),
        armed ? e('button',{ className:'iconbtn', style:{ padding:'4px 8px', fontSize:9 }, disabled, onClick:()=>{ setBall(null); onTicket(null); } }, 'Clear') : null),
      e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:7 } },
        ITEMS.map(it=>{
          const on = it.ball ? ball===it.ball : !!gen;
          const n = count(it.id);
          return e('button',{ key:it.id, type:'button', className:'gitem'+(on?' on':''), disabled: disabled || (!on && n<=0),
              title: n<=0 && !on ? 'None in your bag — buy them in the Shop' : it.desc,
              onClick:()=> it.ball ? setBall(on ? null : it.ball) : (on ? onTicket(null) : onTicket('pick')) },
            e(ItemIcon,{ item:it, size:28 }),
            e('div',{ style:{ flex:1, minWidth:0, textAlign:'left' } },
              e('div',{ className:'gitem-name', title: on && !it.ball ? genLabel(gen) : it.name }, on && !it.ball ? 'Gen '+gen : it.short),
              e('div',{ className:'gitem-count' }, '×'+n+(on ? ' · ARMED' : ''))));
        })),
      armed ? e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.4, marginTop:9 } },
        'Next Single Draw: ', e('b',{ style:{ color:'var(--ink)' } }, describeArmed(ball, gen)), '. x5 Draw is paused while items are armed.') : null);
  }

  function Bar({ label, left, frac, color }){
    return e('div',{ className:'chip-card', style:{ padding:'11px 14px' } },
      e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 } },
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, label),
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:color } }, left+' left')),
      e('div',{ className:'minibar', style:{ height:8 } }, e('i',{ style:{ width:Math.min(100,frac*100)+'%', background:color } })));
  }

  function TargetSummary({ label, target, chooseLabel, onChoose, pity, pityMax, color, emptyText }){
    return [
      e('div',{ key:label+'-head', style:{ display:'flex', alignItems:'center', marginBottom:9 } },
        e('span',{ style:{ flex:1, fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, label),
        e('button',{ className:'iconbtn', onClick:onChoose }, target?'Change':chooseLabel)),
      target
        ? e('div',{ key:label+'-body' },
            e('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:8 } },
              e('div',{ style:{ background:RARITY[target.rarity].glow, borderRadius:9, padding:4, flex:'none' } }, e(Creature,{ species:target.id, size:38, bob:true })),
              e('div',{ style:{ flex:1, minWidth:0 } },
                e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, target.name),
                e('div',{ style:{ marginTop:3 } }, e(RarityTag,{ rarity:target.rarity })))),
            e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 } },
              e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, 'in '+Math.max(0,pityMax-pity)+' draws'),
              e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color } }, pity+'/'+pityMax)),
            e('div',{ className:'minibar', style:{ height:8 } }, e('i',{ style:{ width:(pity/pityMax*100)+'%', background:`linear-gradient(90deg,${color==='var(--lav-deep)'?'var(--lav)':'var(--sage)'},${color})` } })))
          : e('div',{ key:label+'-empty', style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.4 } }, emptyText)
    ];
  }

  function Gacha(){
    const st = window.useStore();
    const [phase, setPhase] = useState('idle');
    const [results, setResults] = useState(null);
    const [picker, setPicker] = useState(null);
    const [info, setInfo] = useState(false);
    const [armedBall, setArmedBall] = useState(null);   // 'boost' | 'great' | 'ultra'
    const [armedGen, setArmedGen] = useState(null);     // generation number
    const [genPicker, setGenPicker] = useState(false);
    const busy = useRef(false);
    const timer = useRef(null);
    useEffect(()=> ()=> clearTimeout(timer.current), []);
    // an armed item only counts while one is still in the bag
    const ball = armedBall && (st.items[BALL_ITEM[armedBall]]||0)>0 ? armedBall : null;
    const gen = armedGen && (st.items.genTicket||0)>0 ? armedGen : null;
    const armed = !!(ball || gen);

    // the pull is saved right away; the animation only decides when it is shown
    function draw(kind){
      if(busy.current) return;
      if(kind==='multi' && armed) return;
      const cost = COST[kind];
      if(st.shards < cost) return;
      if(!window.Store.spendShards(cost)) return;
      busy.current = true;
      const pulled = window.Store.gachaPull(kind==='single'?1:5, kind==='single' && armed ? { ball, gen } : null);
      // spent items disarm; if pity landed first they stay armed for the next draw
      if(pulled[0].used && pulled[0].used.length){ setArmedBall(null); setArmedGen(null); }
      setResults(pulled); setPhase('charge');
      timer.current = setTimeout(()=> setPhase('ready'), CHARGE_MS);
    }
    function open(){
      if(phase!=='ready') return;
      setPhase('open');
      timer.current = setTimeout(()=>{ setPhase('reveal'); busy.current=false; }, OPEN_MS);
    }

    const idle = phase==='idle' || phase==='reveal';
    // the aura hints at the best pull, in its rarity's glow
    const best = results ? RANK[Math.max(...results.map(r=> RANK.indexOf(window.PixelMon.byId(r.speciesId).rarity)))] : 'common';
    const legendaryTarget = st.guaranteedLegendary ? window.PixelMon.byId(st.guaranteedLegendary) : null;
    const epicTarget = st.guaranteedEpic ? window.PixelMon.byId(st.guaranteedEpic) : null;

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 360px', gap:14 } },
      picker ? e(TargetModal,{ tier:picker, onClose:()=>setPicker(null) }) : null,
      info ? e(InfoModal,{ onClose:()=>setInfo(false) }) : null,
      genPicker ? e(GenModal,{ ball, current:gen, onClose:()=>setGenPicker(false), onPick:(g)=>{ setArmedGen(g); setGenPicker(false); } }) : null,
      // LEFT stage
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' } },
        e('div',{ className:'panel-title', style:{ position:'absolute', top:16, left:16 } }, e('span',{className:'dot'}), 'Summon a New Friend'),
        e('div',{ style:{ position:'absolute', top:14, right:16 }, className:'cur-badge' }, e(Shard,{size:16}), st.shards.toLocaleString()),

        phase==='reveal' ? null : e(BigBall,{ phase, rarity:best, onOpen:open }),
        phase==='open' || phase==='reveal'
          ? e(Iris,{ settled:phase==='reveal', results, onContinue:()=>{ setPhase('idle'); setResults(null); } }) : null,

        // kept in the layout through every phase so the ball never jumps
        phase==='reveal' ? null : e('div',{ className: phase==='ready'?'tap-hint':'',
            style:{ marginTop:30, fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-faint)', textAlign:'center',
              visibility: phase==='idle' || phase==='ready' ? 'visible' : 'hidden' } },
          phase==='ready' ? 'Tap the ball to open it!' : 'Tap to draw a new pokemon!')
      ),

      // RIGHT controls
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', gap:12, overflowY:'auto' } },
        e('div',{ className:'panel-title', style:{ margin:0 } }, e('span',{className:'dot'}), 'Summon',
          e('button',{ className:'info-btn', title:'Rates, pity & dupes', 'aria-label':'Summon info', onClick:()=>setInfo(true) }, 'i')),
        e('button',{ className:'btn shard', disabled:!idle||st.shards<COST.single, style:{ fontSize:13, padding:'16px' }, onClick:()=>draw('single') },
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 } },
            'Single Draw  \u00b7  ', e(Shard,{size:16,style:{filter:'brightness(1.6)'}}), COST.single)),
        e('button',{ className:'btn lav', disabled:!idle||st.shards<COST.multi||armed, style:{ fontSize:13, padding:'16px' }, onClick:()=>draw('multi'),
            title: armed ? 'Items work on Single Draws \u2014 clear them to use x5' : undefined },
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 } },
            'x5 Draw  \u00b7  ', e(Shard,{size:16,style:{filter:'brightness(1.6)'}}), COST.multi)),

        // items for the next single draw
        e(ItemsPanel,{ st, ball, gen, disabled:!idle, setBall:setArmedBall,
          onTicket:(v)=> v==='pick' ? setGenPicker(true) : setArmedGen(null) }),

        // pity meters
        e(Bar,{ label:'EPIC+ PITY', left:Math.max(0,EPIC_PITY-st.epicPity), frac:st.epicPity/EPIC_PITY, color:'var(--lav-deep)' }),
        e(Bar,{ label:'LEGENDARY PITY', left:Math.max(0,LEGEND_PITY-st.pity), frac:st.pity/LEGEND_PITY, color:'var(--coin-deep)' }),

        // guaranteed targets
        e('div',{ className:'chip-card', style:{ padding:12 } },
          ...TargetSummary({
            label:'LEGENDARY TARGET',
            target:legendaryTarget,
            chooseLabel:'Choose',
            onChoose:()=>setPicker('legendary'),
            pity:st.legendaryTargetPity,
            pityMax:LEGEND_TARGET_PITY,
            color:'var(--sage-deep)',
            emptyText:'No legendary target set. Choose one to guarantee it within 100 draws.',
          }),
          e('div',{ style:{ height:1, background:'var(--card-line)', margin:'10px 0 11px' } }),
          ...TargetSummary({
            label:'EPIC TARGET',
            target:epicTarget,
            chooseLabel:'Choose',
            onChoose:()=>setPicker('epic'),
            pity:st.epicTargetPityCount,
            pityMax:EPIC_TARGET_PITY,
            color:'var(--lav-deep)',
            emptyText:'No epic target set. Choose one to guarantee it within 60 draws.',
          })
        )
      )
    );
  }
  window.Gacha = Gacha;
  window.GachaItems = ITEMS;                             // the Shop sells these
})();

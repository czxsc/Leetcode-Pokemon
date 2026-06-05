/* =====================================================================
   Meadow — daily-seeded zone + weather. Mini-boss combat runs on the
   GLOBAL engine in the store (keeps going when you switch pages). This
   page just visualizes it: big boss sprite, HP bar, team gathered round.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState, useEffect, useRef } = React;
  const RARITY = window.PixelMon.RARITY;

  // 6 slots arranged around the boss (percent positions in the field)
  const RING = [
    { x:24, y:40 }, { x:24, y:66 }, { x:38, y:78 },
    { x:76, y:40 }, { x:76, y:66 }, { x:62, y:78 },
  ];
  const IDLE = [
    { x:18, y:30 }, { x:34, y:62 }, { x:50, y:36 },
    { x:66, y:64 }, { x:80, y:34 }, { x:46, y:72 },
  ];

  function Meadow(){
    const st = window.useStore();
    const D = window.Derived;
    const { zone, weather } = window.DATA.daySeed(window.Store.TODAY);
    const team = D.teamList();
    const boss = st.meadow.boss;
    const patrolling = st.meadow.patrolling;

    // re-render for the live log (ephemeral, not in store state)
    const [, force] = useState(0);
    useEffect(()=>{ const id=setInterval(()=>force(x=>x+1), 250); return ()=>clearInterval(id); }, []);

    const tufts = useRef(Array.from({length:26}).map(()=>({ x:Math.random()*96, y:Math.random()*92, s:0.7+Math.random() }))).current;
    const log = window.Store.meadowLog;
    const weatherMatch = team.some(m=> window.PixelMon.byId(m.sp).type===weather.type);

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 320px', gap:14 } },
      // FIELD
      e('div',{ className:'panel', style:{ padding:8, position:'relative', overflow:'hidden' } },
        e('div',{ className:'meadow-field', style:{ background:'linear-gradient(160deg, '+zone.accent+'55, var(--mint))' } },
          tufts.map((t,i)=> e('div',{ key:i, className:'grass-tuft', style:{ left:t.x+'%', top:t.y+'%', transform:'scale('+t.s+')' } })),

          // BIG boss in the centre
          boss && patrolling ? e('div',{ className:'boss-wrap', style:{ left:'50%', top:'46%' } },
            e('div',{ className: boss.tier==='legend'?'boss-legend glow-pulse':boss.tier==='elite'?'boss-elite glow-pulse':'glow-pulse' },
              e(Creature,{ species:boss.sp, shiny:boss.shiny, size: boss.tier==='legend'?190:boss.tier==='elite'?168:148 })),
            // boss nameplate + HP
            e('div',{ style:{ position:'absolute', top:-46, left:'50%', transform:'translateX(-50%)', width:230, textAlign:'center' } },
              e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:4, flexWrap:'wrap' } },
                boss.tier!=='normal' ? e('span',{ className:'type-tag', style:{ background: boss.tier==='legend'?'var(--coin)':'var(--lav)', color:'#fff', fontSize:8 } }, boss.tier==='legend'?'\u2b50 LEGENDARY':'\u2728 ELITE') : null,
                e('span',{ className:'type-tag', style:{ background:RARITY[boss.rarity].color, color:'#fff', fontSize:8 } }, RARITY[boss.rarity].label),
                e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--wood-dark)', textShadow:'0 1px 0 #fff' } }, (boss.shiny?'\u2728':'')+boss.name+'  Lv'+boss.level)),
              e('div',{ className:'hpbar' }, e('i',{ style:{ width:Math.max(0, boss.hp/boss.maxHp*100)+'%' } })))
          ) : null,

          // team gathered around boss (or idling)
          team.map((m,i)=>{
            const p = (boss && patrolling) ? RING[i] : IDLE[i];
            return e('div',{ key:m.iid, className:'wanderer', style:{ left:p.x+'%', top:p.y+'%' } },
              e('div',{ style:{ position:'relative' } },
                e(Creature,{ inst:m, size:46, bob:true }),
                e('div',{ style:{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', fontFamily:"'Silkscreen'", fontSize:7, color:'var(--wood-dark)', background:'rgba(255,255,255,.75)', padding:'1px 3px', borderRadius:3, whiteSpace:'nowrap' } }, 'Lv'+m.level)));
          }),

          // floating damage numbers (per-tick, per-pokemon)
          (boss && patrolling) ? (function(){
            const now = Date.now();
            return (window.Store.dmgEvents||[]).filter(d=> now-d.t < 850).map(d=>{
              const p = RING[d.slot] || RING[0];
              const jx = ((d.id.charCodeAt(0)||0)%16) - 8;
              return e('div',{ key:d.id, className:'float-dmg'+(d.crit?' crit':''),
                style:{ left:'calc('+p.x+'% + '+jx+'px)', top:(p.y-7)+'%' } },
                (d.crit?'\u2737':'')+'-'+d.dmg);
            });
          })() : null,

          // header signs
          e('div',{ style:{ position:'absolute', top:10, left:10, display:'flex', gap:8, alignItems:'center' } },
            e('div',{ className:'wood-sign', style:{ padding:'6px 12px', fontFamily:"'Silkscreen'", fontSize:11 } }, zone.name),
            e('div',{ className:'wood-sign', style:{ padding:'6px 10px', fontSize:14 } }, weather.icon+' '+weather.name)),

          // control
          e('div',{ style:{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)' } },
            patrolling
              ? e('button',{ className:'btn', onClick:()=>window.Store.stopPatrol() }, 'Recall Team')
              : e('button',{ className:'btn green', style:{ fontSize:13, padding:'12px 24px' },
                  onClick:()=>{ if(team.length===0){ return; } window.Store.startPatrol(); } }, '\u25b6 Send Team Out')),
          patrolling ? e('div',{ style:{ position:'absolute', bottom:14, right:14, fontFamily:"'Silkscreen'", fontSize:9, color:'var(--sage-deep)', display:'flex', alignItems:'center', gap:5 } },
            e('span',{ className:'live-dot' }), 'PATROLLING') : null
        )
      ),
      // SIDE
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:12 } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Patrol'),
        e('div',{ className:'chip-card', style:{ padding:14 } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--wood-dark)', marginBottom:4 } }, zone.name),
          e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginBottom:9 } }, zone.desc),
          e('div',{ style:{ display:'flex', gap:6, marginBottom:9 } }, zone.types.map(t=> e(TypeTag,{ key:t, type:t }))),
          e('div',{ style:{ fontSize:13, color: weatherMatch?'var(--sage-deep)':'var(--ink-soft)', display:'flex', alignItems:'center', gap:6 } },
            weather.icon, e('span',{}, weather.note + (weatherMatch?'  \u2014 active!':'')))),
        e('div',{ style:{ display:'flex', gap:8 } },
          e('div',{ className:'stile', style:{ flex:1 } }, e('div',{ className:'lab' }, 'Coins today'),
            e('div',{ className:'val', style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, color:'var(--coin-deep)' } }, e(Coin,{size:13}), st.meadow.coinsToday)),
          e('div',{ className:'stile', style:{ flex:1 } }, e('div',{ className:'lab' }, 'Bosses KO\u2019d'),
            e('div',{ className:'val' }, st.meadow.kills))),
        e('div',{ className:'chip-card', style:{ padding:'8px 12px', flex:1, minHeight:0, overflowY:'auto' } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginBottom:6 } }, 'PATROL LOG'),
          (!log || log.length===0)
            ? e('div',{ style:{ fontSize:14, color:'var(--ink-faint)', fontFamily:"'VT323'" } }, 'Send your team out to fight mini-bosses and earn Coins...')
            : log.map((l)=> e('div',{ key:l.id, className:'log-line', style:{ color: l.k==='spawn'?'var(--lav-deep)':l.k==='away'?'var(--coin-deep)':'var(--ink-soft)' } }, '\u203a '+l.t))),
        team.length===0 ? e('div',{ style:{ fontSize:12, color:'var(--hard)', textAlign:'center' } }, 'Add friends to your team first!') : null,
        e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.5 } },
          'Patrol keeps running while you visit other pages \u2014 come back to a pile of Coins.')
      )
    );
  }
  window.Meadow = Meadow;
})();

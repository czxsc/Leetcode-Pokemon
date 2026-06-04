/* =====================================================================
   Team Select — choose up to 6 from your collection. Live power preview.
===================================================================== */
(function(){
  const e = React.createElement;
  const RARITY = window.PixelMon.RARITY;

  function MonCard({ inst, inTeam, slot, onToggle, full }){
    const sp = window.PixelMon.byId(inst.sp);
    const r = RARITY[sp.rarity];
    const need = window.Derived.expToNext(inst.level);
    const disabled = !inTeam && full;
    return e('button',{ onClick:()=> (!disabled||inTeam) && onToggle(inst.iid), disabled,
      style:{ textAlign:'center', padding:'10px 6px 8px', borderRadius:12, position:'relative',
        background: inTeam?'var(--sage-lite)':'var(--card-2)',
        border:'3px solid '+(inTeam?'var(--sage-deep)':r.color),
        opacity: disabled?0.45:1, cursor: disabled?'not-allowed':'pointer',
        boxShadow: inTeam?'inset 0 2px 0 rgba(255,255,255,.6), 0 0 10px '+r.glow:'inset 0 2px 0 rgba(255,255,255,.5)' } },
      inTeam ? e('div',{ style:{ position:'absolute', top:-9, left:-7, width:22, height:22, borderRadius:'50%',
        background:'var(--sage-deep)', color:'#fff', fontFamily:"'Silkscreen'", fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' } }, slot) : null,
      inst.form ? e('div',{ style:{ position:'absolute', top:-9, right:-7, fontSize:12 } }, '\u2728') : null,
      e('div',{ style:{ background:r.glow, borderRadius:9, padding:5, display:'inline-block', marginBottom:5 } },
        e(Creature,{ inst, size:50, bob:inTeam })),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, (inst.shiny?'\u2728':'')+(inst.form?window.PixelMon.formName(sp,inst.form):sp.name)),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', margin:'3px 0 4px' } },
        'Lv'+inst.level+'  \u2694'+window.Derived.monPower(inst)),
      e('div',{ className:'expbar', style:{ marginBottom:4 } }, e('i',{ style:{ width:Math.round(inst.exp/need*100)+'%' } })),
      e('div',{ style:{ display:'flex', justifyContent:'center' } }, e(RarityTag,{ rarity:sp.rarity }))
    );
  }

  function Team(){
    const st = window.useStore();
    const D = window.Derived;
    const byId = Object.fromEntries(st.owned.map(o=>[o.iid,o]));
    const team = st.team;
    const full = team.length >= 6;

    function toggle(iid){
      if(team.includes(iid)) window.Store.setTeam(team.filter(x=>x!==iid));
      else if(!full) window.Store.setTeam([...team, iid]);
    }

    // sort collection: team first, then by power desc
    const sorted = [...st.owned].sort((a,b)=>{
      const ta=team.includes(a.iid), tb=team.includes(b.iid);
      if(ta!==tb) return ta?-1:1;
      return D.monPower(b)-D.monPower(a);
    });

    const power = D.teamPower();
    const base = D.teamBasePower();
    const mult = D.teamMultiplier();

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 320px', gap:14 } },
      // collection grid
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column' } },
        e('div',{ style:{ display:'flex', alignItems:'center', marginBottom:10 } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Collection \u00b7 '+st.owned.length),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color: full?'var(--sage-deep)':'var(--ink-faint)' } }, team.length+'/6 selected')),
        e('div',{ style:{ flex:1, minHeight:0, overflowY:'auto', paddingRight:4 } },
          e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 } },
            sorted.map(m=> e(MonCard,{ key:m.iid, inst:m, inTeam:team.includes(m.iid),
              slot: team.indexOf(m.iid)+1, full, onToggle:toggle }))))
      ),
      // team preview
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:12 } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Your Team'),
        e('div',{ className:'chip-card', style:{ padding:16, textAlign:'center' } },
          e('div',{ className:'lab', style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'TEAM FIGHTING POWER'),
          e('div',{ className:'pixel-font', style:{ fontSize:34, color:'var(--wood-dark)', margin:'6px 0' } }, power.toLocaleString()),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:'var(--ink-faint)' } },
            base+' base \u00d7 '+mult.toFixed(2)+' mult')),
        // 6 slots
        e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 } },
          Array.from({length:6}).map((_,i)=>{
            const m = byId[team[i]];
            if(!m) return e('div',{ key:i, style:{ aspectRatio:'1', borderRadius:10, border:'2px dashed var(--card-line)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--card-2)' } },
              e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'empty'));
            const sp = window.PixelMon.byId(m.sp);
            return e('div',{ key:i, className:'chip-card', style:{ padding:'6px 2px', textAlign:'center' } },
              e(Creature,{ inst:m, size:40, bob:true }),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, sp.name),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink-faint)' } }, 'Lv'+m.level));
          })),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginTop:'auto' } },
          'Tap a friend to add or remove. Power = each member\u2019s ', e('b',{},'level \u00d7 rarity'),
          ', summed, then scaled by your solved-problem multiplier (capped at 2\u00d7).')
      )
    );
  }

  window.Team = Team;
})();

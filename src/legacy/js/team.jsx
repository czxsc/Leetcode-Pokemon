/* =====================================================================
   Team Select — choose up to 6 from your collection (sortable by
   rarity or level). Tap a member under "Your Team" to open its detail
   card (evolve / mega / gigantamax). Live power preview.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;
  const RARITY = window.PixelMon.RARITY;
  const RANK = { legendary:4, epic:3, rare:2, common:1 };

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
      inst.shiny ? e('div',{ title:'Shiny', style:{ position:'absolute', top:-9, right:-7, width:22, height:22, borderRadius:'50%',
        background:'var(--coin)', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, boxShadow:'0 0 8px var(--coin)' } }, '\u2728') : null,
      inst.form ? e('span',{ className:'type-tag', style:{ position:'absolute', bottom:6, right:6, background: inst.form==='gmax'?'var(--pink)':'var(--lav)', color:'#fff', fontSize:7 } }, inst.form==='gmax'?'GMAX':'MEGA') : null,
      e('div',{ style:{ background:r.glow, borderRadius:9, padding:5, display:'inline-block', marginBottom:5 } },
        e(Creature,{ inst, size:50, bob:inTeam })),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, (inst.form?window.PixelMon.formName(sp,inst.form):sp.name)),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', margin:'3px 0 4px' } },
        'Lv'+inst.level+'  \u2694'+window.Derived.monPower(inst)),
      e('div',{ className:'expbar', style:{ marginBottom:4 } }, e('i',{ style:{ width:Math.round(inst.exp/need*100)+'%' } })),
      e('div',{ style:{ display:'flex', justifyContent:'center' } }, e(RarityTag,{ rarity:sp.rarity }))
    );
  }

  function Team(){
    const st = window.useStore();
    const D = window.Derived;
    const [sortKey, setSortKey] = useState('rarity');
    const [detail, setDetail] = useState(null);
    const byId = Object.fromEntries(st.owned.map(o=>[o.iid,o]));
    const team = st.team;
    const full = team.length >= 6;

    function toggle(iid){
      if(team.includes(iid)) window.Store.setTeam(team.filter(x=>x!==iid));
      else if(!full) window.Store.setTeam([...team, iid]);
    }

    const sorted = [...st.owned].sort((a,b)=>{
      const sa=window.PixelMon.byId(a.sp), sb=window.PixelMon.byId(b.sp);
      if(sortKey==='level'){ return b.level-a.level || RANK[sb.rarity]-RANK[sa.rarity] || D.monPower(b)-D.monPower(a); }
      return RANK[sb.rarity]-RANK[sa.rarity] || b.level-a.level || D.monPower(b)-D.monPower(a);
    });

    const power = D.teamPower();
    const base = D.teamBasePower();
    const mult = D.teamMultiplier();

    const SortBtn = (k,label)=> e('button',{ key:k, onClick:()=>setSortKey(k),
      style:{ fontFamily:"'Silkscreen'", fontSize:9, padding:'5px 10px', borderRadius:7, cursor:'pointer',
        border:'2px solid '+(sortKey===k?'var(--sage-deep)':'var(--card-line)'),
        background: sortKey===k?'var(--sage-lite)':'var(--card-2)', color: sortKey===k?'var(--sage-deep)':'var(--ink-soft)' } }, label);

    return e('div',{ style:{ height:'100%', minHeight:0, display:'grid', gridTemplateColumns:'1fr 320px', gap:14 } },
      detail ? e(window.MonDetailModal,{ iid:detail, onClose:()=>setDetail(null) }) : null,
      // collection grid
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', minHeight:0 } },
        e('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:10 } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Collection \u00b7 '+st.owned.length),
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, 'sort'),
          SortBtn('rarity','Rarity'), SortBtn('level','Level'),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color: full?'var(--sage-deep)':'var(--ink-faint)', marginLeft:6 } }, team.length+'/6')),
        e('div',{ style:{ flex:1, minHeight:0, overflowY:'auto', paddingRight:4 } },
          e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 } },
            sorted.map(m=> e(MonCard,{ key:m.iid, inst:m, inTeam:team.includes(m.iid),
              slot: team.indexOf(m.iid)+1, full, onToggle:toggle }))))
      ),
      // team preview
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:12, minHeight:0, overflowY:'auto' } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Your Team'),
        e('div',{ className:'chip-card', style:{ padding:16, textAlign:'center' } },
          e('div',{ className:'lab', style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'TEAM FIGHTING POWER'),
          e('div',{ className:'pixel-font', style:{ fontSize:34, color:'var(--wood-dark)', margin:'6px 0' } }, power.toLocaleString()),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:'var(--ink-faint)' } },
            base+' base \u00d7 '+mult.toFixed(2)+' mult')),
        // 6 slots — tap a filled one for its detail card
        e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 } },
          Array.from({length:6}).map((_,i)=>{
            const m = byId[team[i]];
            if(!m) return e('div',{ key:i, style:{ aspectRatio:'1', borderRadius:10, border:'2px dashed var(--card-line)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--card-2)' } },
              e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, 'empty'));
            const sp = window.PixelMon.byId(m.sp);
            return e('button',{ key:i, className:'chip-card team-chip', onClick:()=>setDetail(m.iid),
                style:{ padding:'6px 2px', textAlign:'center', cursor:'pointer', position:'relative', font:'inherit', width:'100%' } },
              m.shiny ? e('span',{ title:'Shiny', style:{ position:'absolute', top:-5, right:-4, width:16, height:16, borderRadius:'50%', background:'var(--coin)', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 } }, '\u2728') : null,
              m.form ? e('span',{ style:{ position:'absolute', top:-5, left:-4, fontFamily:"'Silkscreen'", fontSize:6, background: m.form==='gmax'?'var(--pink)':'var(--lav)', color:'#fff', padding:'2px 3px', borderRadius:4, border:'1px solid #fff' } }, m.form==='gmax'?'GX':'M') : null,
              e(Creature,{ inst:m, size:40, bob:true }),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, sp.name),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink-faint)' } }, 'Lv'+m.level));
          })),
        e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.5, marginTop:'auto' } },
          'Power = each member\u2019s ', e('b',{},'level \u00d7 rarity'),
          ', summed, then scaled by your solved-problem multiplier (capped at 2\u00d7).')
      )
    );
  }

  window.Team = Team;
})();

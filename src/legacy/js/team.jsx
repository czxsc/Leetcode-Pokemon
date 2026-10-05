/* =====================================================================
   Team Select — choose up to 6 from your collection (sortable by
   rarity or level). Tap a member under "Your Team" to open its detail
   card (evolve / mega / gigantamax). Live power preview. Release mode
   lets friends that aren't on the team go for a few Shards.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;
  const RARITY = window.PixelMon.RARITY;
  const RANK = { legendary:4, epic:3, rare:2, common:1 };

  function MonCard({ inst, inTeam, slot, onToggle, full, releasing, picked }){
    const sp = window.PixelMon.byId(inst.sp);
    const r = RARITY[sp.rarity];
    const need = window.Derived.expToNext(inst.level);
    const disabled = releasing ? inTeam : (!inTeam && full);
    return e('button',{ onClick:()=> (!disabled||(inTeam && !releasing)) && onToggle(inst.iid), disabled,
      title: releasing && inTeam ? 'On your team — take it off the team to release it' : undefined,
      style:{ textAlign:'center', padding:'10px 6px 8px', borderRadius:12, position:'relative',
        background: picked?'var(--cream-2)':inTeam?'var(--sage-lite)':'var(--card-2)',
        border:'3px solid '+(picked?'var(--hard)':inTeam?'var(--sage-deep)':r.color),
        opacity: disabled?0.45:1, cursor: disabled?'not-allowed':'pointer',
        boxShadow: inTeam?'inset 0 2px 0 rgba(255,255,255,.6), 0 0 10px '+r.glow:'inset 0 2px 0 rgba(255,255,255,.5)' } },
      inTeam ? e('div',{ style:{ position:'absolute', top:-9, left:-7, width:22, height:22, borderRadius:'50%',
        background:'var(--sage-deep)', color:'#fff', fontFamily:"'Silkscreen'", fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' } }, slot)
      : picked ? e('div',{ style:{ position:'absolute', top:-9, left:-7, width:22, height:22, borderRadius:'50%',
        background:'var(--hard)', color:'#fff', fontFamily:"'Silkscreen'", fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' } }, '✓') : null,
      inst.form ? e('span',{ className:'type-tag', style:{ position:'absolute', bottom:6, right:6, background: inst.form==='gmax'?'var(--pink)':'var(--lav)', color:'#fff', fontSize:7 } }, inst.form==='gmax'?'GMAX':'MEGA') : null,
      e('div',{ style:{ background:r.glow, borderRadius:9, padding:5, display:'inline-block', marginBottom:5 } },
        e(Creature,{ inst, size:50, bob:inTeam })),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, (inst.form?window.PixelMon.formName(sp,inst.form):sp.name)),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', margin:'3px 0 4px' } },
        'Lv'+inst.level+'  \u2694'+window.Derived.monPower(inst)),
      e('div',{ className:'expbar', style:{ marginBottom:4 } }, e('i',{ style:{ width:Math.round(inst.exp/need*100)+'%' } })),
      e('div',{ style:{ display:'flex', justifyContent:'center' } }, e(RarityTag,{ rarity:sp.rarity })),
      releasing && !inTeam ? e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, marginTop:5,
        fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-soft)' } }, '+', e(Shard,{ size:11 }), window.Store.releaseValue(inst)) : null
    );
  }

  function Toast({ msg }){
    return e('div',{ className:'fade-in', style:{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', zIndex:60,
      background:'var(--sage-deep)', color:'#fff', fontFamily:"'Silkscreen'", fontSize:11, padding:'10px 18px',
      borderRadius:10, border:'2px solid #fff', boxShadow:'0 4px 0 rgba(124,90,61,.25)', whiteSpace:'nowrap' } }, msg);
  }

  const monName = (o)=> (o.shiny?'Shiny ':'')+window.PixelMon.byId(o.sp).name;

  function Team(){
    const st = window.useStore();
    const D = window.Derived;
    const [sortKey, setSortKey] = useState('rarity');
    const [detail, setDetail] = useState(null);
    const [releasing, setReleasing] = useState(false);
    const [picked, setPicked] = useState([]);
    const [toast, setToast] = useState(null);
    const byId = Object.fromEntries(st.owned.map(o=>[o.iid,o]));
    const team = st.team;
    const full = team.length >= 6;

    function toggle(iid){
      if(team.includes(iid)) window.Store.setTeam(team.filter(x=>x!==iid));
      else if(!full) window.Store.setTeam([...team, iid]);
    }
    function pick(iid){ setPicked(p=> p.includes(iid) ? p.filter(x=>x!==iid) : [...p, iid]); }
    function stopReleasing(){ setReleasing(false); setPicked([]); }

    const pickedMons = picked.map(i=>byId[i]).filter(o=> o && !team.includes(o.iid));
    const releaseTotal = pickedMons.reduce((n,o)=> n+window.Store.releaseValue(o), 0);
    const keepsOne = pickedMons.length < st.owned.length;
    function release(){
      if(!pickedMons.length || !keepsOne) return;
      const leaving = new Set(pickedMons.map(o=>o.iid));
      const notes = [];
      const formed = pickedMons.filter(o=> o.unlocked && (o.unlocked.mega || o.unlocked.gmax));
      if(formed.length) notes.push('Mega / G-Max forms unlocked on '+formed.map(monName).join(', ')+' are lost (stones aren’t refunded).');
      const copied = pickedMons.filter(o=> o.copies>0);
      if(copied.length) notes.push('Duplicates collected toward evolution on '+copied.map(monName).join(', ')+' are lost.');
      const lastOf = pickedMons.filter(o=> !st.owned.some(x=> !leaving.has(x.iid) && x.sp===o.sp));
      if(lastOf.length) notes.push(lastOf.map(o=>window.PixelMon.byId(o.sp).name).join(', ')+' will leave your Pokédex until you catch '+(lastOf.length===1?'it':'them')+' again.');
      const ask = 'Release '+pickedMons.map(monName).join(', ')+' for '+releaseTotal.toLocaleString()+' Shards?'
        + (notes.length ? '\n\n'+notes.map(n=>'• '+n).join('\n') : '');
      if(!window.confirm(ask)) return;
      const got = window.Store.releaseCreatures(pickedMons.map(o=>o.iid));
      stopReleasing();
      if(got){
        setToast('Released '+pickedMons.length+'  ·  +'+got.toLocaleString()+' Shards');
        setTimeout(()=>setToast(null), 2200);
      }
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

    return e('div',{ style:{ height:'100%', minHeight:0, display:'grid', gridTemplateColumns:'1fr 320px', gap:14, position:'relative' } },
      toast ? e(Toast,{ msg:toast }) : null,
      detail ? e(window.MonDetailModal,{ iid:detail, onClose:()=>setDetail(null) }) : null,
      // collection grid
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', minHeight:0 } },
        e('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:10 } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Collection \u00b7 '+st.owned.length),
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, 'sort'),
          SortBtn('rarity','Rarity'), SortBtn('level','Level'),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color: full?'var(--sage-deep)':'var(--ink-faint)', marginLeft:6 } }, team.length+'/6'),
          e('button',{ className:'iconbtn', type:'button', style:{ marginLeft:4 }, onClick: releasing ? stopReleasing : ()=>setReleasing(true),
            title: releasing ? 'Stop releasing' : 'Let Pokémon go for a few Shards' }, releasing ? 'Cancel' : 'Release')),
        releasing ? e('div',{ className:'chip-card', style:{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', marginBottom:10 } },
          e('div',{ style:{ flex:1, fontSize:13, color:'var(--ink-soft)', lineHeight:1.45 } },
            !keepsOne ? 'Keep at least one Pokémon.'
              : pickedMons.length ? pickedMons.length+' picked'
              : 'Tap Pokémon to release them for Shards. Team members can’t be released.'),
          e('button',{ className:'btn pink', type:'button', disabled:!pickedMons.length || !keepsOne, onClick:release,
              style:{ display:'flex', alignItems:'center', gap:6, fontSize:11 } },
            'Release', pickedMons.length ? e('span',{ style:{ display:'inline-flex', alignItems:'center', gap:3 } },
              '· +', e(Shard,{ size:13, style:{ filter:'brightness(1.6)' } }), releaseTotal.toLocaleString()) : null)) : null,
        e('div',{ style:{ flex:1, minHeight:0, overflowY:'auto', paddingRight:4 } },
          e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 } },
            sorted.map(m=> e(MonCard,{ key:m.iid, inst:m, inTeam:team.includes(m.iid),
              slot: team.indexOf(m.iid)+1, full, releasing, picked: releasing && picked.includes(m.iid),
              onToggle: releasing ? pick : toggle }))))
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

/* =====================================================================
   Pokedex — completion tracker. Owned species show in full colour;
   un-collected ones show as grey silhouettes. Tracks shiny, mega and
   gigantamax form completion too. Browse by generation + filter.
   Exposes window.Pokedex.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;
  const RARITY = window.PixelMon.RARITY;
  const GENS = [1,2,3,4,5,6,7,8];

  function Badge({ label, color, on }){
    return e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, lineHeight:1, padding:'2px 3px', borderRadius:4,
      background: on?color:'#d6cdbb', color: on?'#fff':'#9a917e', border:'1px solid '+(on?'rgba(0,0,0,.15)':'rgba(124,90,61,.18)'),
      opacity: on?1:0.7 } }, label);
  }

  function DexCell({ sp, owned, shinyOwned, megaOn, gmaxOn, showShiny }){
    const r = RARITY[sp.rarity];
    const renderShiny = showShiny && shinyOwned;
    return e('div',{ title: owned?sp.name:'Not yet caught', style:{ textAlign:'center', padding:'9px 4px 7px', borderRadius:10, position:'relative',
        background: owned?'var(--card-2)':'rgba(120,108,90,.08)',
        border:'2px solid '+(owned?r.color:'var(--card-line)') } },
      e('span',{ style:{ position:'absolute', top:5, right:5, width:8, height:8, borderRadius:'50%',
        background: owned?r.color:'#c8bfa8', border:'1px solid rgba(0,0,0,.12)' } }),
      shinyOwned ? e('span',{ title:'Shiny collected', style:{ position:'absolute', top:3, left:4, fontSize:10, filter:'drop-shadow(0 0 2px #ffe39a)' } }, '\u2728') : null,
      e('div',{ className: owned?'':'dex-locked', style:{ display:'inline-block' } },
        e(Creature,{ species:sp.id, shiny:renderShiny, size:46, bob:false })),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, marginTop:2, color: owned?'var(--ink)':'var(--ink-faint)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } },
        owned ? sp.name : '???'),
      (sp.mega || sp.gmax) ? e('div',{ style:{ display:'flex', gap:3, justifyContent:'center', marginTop:4 } },
        sp.mega ? e(Badge,{ label:'M', color:'var(--lav-deep)', on:megaOn }) : null,
        sp.gmax ? e(Badge,{ label:'G', color:'var(--pink-deep)', on:gmaxOn }) : null
      ) : null
    );
  }

  function StatChip({ icon, label, have, total, color }){
    return e('div',{ className:'chip-card', style:{ padding:'7px 11px', display:'flex', alignItems:'center', gap:7 } },
      e('span',{ style:{ fontSize:14 } }, icon),
      e('div',{},
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color } }, have+'/'+total),
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink-faint)', marginTop:2 } }, label)));
  }

  function Pokedex(){
    const st = window.useStore();
    const [gen, setGen] = useState(1);
    const [filter, setFilter] = useState('all');           // all | shiny | mega | gmax
    const ownedSet = window.Derived.ownedSpecies();
    const forms = window.Derived.formSets();
    const all = window.PixelMon.SPECIES;
    const ownedTotal = all.filter(s=> ownedSet.has(s.id)).length;
    const megaPossible = all.filter(s=>s.mega).length;
    const gmaxPossible = all.filter(s=>s.gmax).length;
    const pct = Math.round(ownedTotal/all.length*100);

    let list = all.filter(s=> s.gen===gen);
    if(filter==='mega') list = list.filter(s=> s.mega);
    else if(filter==='gmax') list = list.filter(s=> s.gmax);
    else if(filter==='shiny') list = list.filter(s=> forms.shiny.has(s.id));
    const genAll = all.filter(s=>s.gen===gen);
    const genOwned = genAll.filter(s=> ownedSet.has(s.id)).length;

    const GenBtn = (g)=>{
      const gl = all.filter(s=>s.gen===g);
      const go = gl.filter(s=>ownedSet.has(s.id)).length;
      const done = go===gl.length;
      return e('button',{ key:g, onClick:()=>setGen(g),
        style:{ fontFamily:"'Silkscreen'", fontSize:10, padding:'8px 12px', borderRadius:8, cursor:'pointer', whiteSpace:'nowrap',
          border:'2px solid '+(gen===g?'var(--lav-deep)':'var(--card-line)'),
          background: gen===g?'var(--lav-lite)':'var(--card-2)', color: gen===g?'var(--lav-deep)':'var(--ink-soft)' } },
        'Gen '+g, e('span',{ style:{ marginLeft:6, color: done?'var(--sage-deep)':'var(--ink-faint)', fontSize:8 } }, go+'/'+gl.length));
    };
    const FilterBtn = (id,label)=> e('button',{ key:id, onClick:()=>setFilter(id),
      style:{ fontFamily:"'Silkscreen'", fontSize:9, padding:'6px 10px', borderRadius:7, cursor:'pointer', whiteSpace:'nowrap',
        border:'2px solid '+(filter===id?'var(--sage-deep)':'var(--card-line)'),
        background: filter===id?'var(--sage-lite)':'var(--card-2)', color: filter===id?'var(--sage-deep)':'var(--ink-soft)' } }, label);

    return e('div',{ style:{ height:'100%', minHeight:0, display:'flex', flexDirection:'column', gap:12 } },
      // header
      e('div',{ className:'panel', style:{ display:'flex', alignItems:'center', gap:16, padding:'12px 18px', flex:'none' } },
        e('div',{ style:{ flex:1 } },
          e('div',{ className:'panel-title', style:{ margin:0 } }, e('span',{className:'dot'}), 'Pok\u00e9dex'),
          e('div',{ style:{ display:'flex', gap:8, marginTop:8 } },
            e(StatChip,{ icon:'\ud83d\udcd8', label:'CAUGHT', have:ownedTotal, total:all.length, color:'var(--sage-deep)' }),
            e(StatChip,{ icon:'\u2728', label:'SHINY', have:forms.shiny.size, total:all.length, color:'var(--coin-deep)' }),
            e(StatChip,{ icon:'\ud83d\udd2e', label:'MEGA', have:forms.mega.size, total:megaPossible, color:'var(--lav-deep)' }),
            e(StatChip,{ icon:'\ud83c\udf00', label:'G-MAX', have:forms.gmax.size, total:gmaxPossible, color:'var(--pink-deep)' }))),
        e('div',{ style:{ textAlign:'right' } },
          e('div',{ className:'pixel-font', style:{ fontSize:24, color:'var(--wood-dark)' } }, pct+'%'),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginTop:3 } }, 'complete')),
        e('div',{ style:{ width:90 } }, e('div',{ className:'minibar', style:{ height:12 } }, e('i',{ style:{ width:pct+'%', background:'linear-gradient(90deg,var(--sage),var(--sage-deep))' } })))
      ),
      // gen tabs + filter
      e('div',{ style:{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', flex:'none' } },
        GENS.map(GenBtn),
        e('div',{ style:{ flex:1 } }),
        FilterBtn('all','All'), FilterBtn('shiny','\u2728 Shiny'), FilterBtn('mega','\ud83d\udd2e Mega'), FilterBtn('gmax','\ud83c\udf00 G-Max')),
      // grid
      e('div',{ className:'panel', style:{ flex:1, minHeight:0, display:'flex', flexDirection:'column' } },
        e('div',{ style:{ display:'flex', alignItems:'center', marginBottom:10 } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot', style:{background:'var(--lav)'}}), 'Generation '+gen+(filter!=='all'?(' \u00b7 '+filter):'')),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color: genOwned===genAll.length?'var(--sage-deep)':'var(--ink-faint)' } }, genOwned+' / '+genAll.length+' caught')),
        e('div',{ style:{ flex:1, minHeight:0, overflowY:'auto', paddingRight:4 } },
          list.length===0
            ? e('div',{ style:{ textAlign:'center', color:'var(--ink-faint)', fontFamily:"'Silkscreen'", fontSize:11, padding:40 } },
                filter==='shiny' ? 'No shiny '+'Pok\u00e9mon caught in this generation yet \u2014 pull some \u2728shinies!' : 'None in this generation.')
            : e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:8 } },
                list.map(s=> e(DexCell,{ key:s.id, sp:s, owned: ownedSet.has(s.id),
                  shinyOwned: forms.shiny.has(s.id), megaOn: forms.mega.has(s.id), gmaxOn: forms.gmax.has(s.id),
                  showShiny: filter==='shiny' }))))
      )
    );
  }

  window.Pokedex = Pokedex;
})();

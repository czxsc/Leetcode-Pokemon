/* =====================================================================
   Shop — spend Coins (earned in the Meadow) on EXP items.
   Rare Candy: +35 EXP to one chosen friend. Team Snack: +5 EXP to team.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;
  const RARITY = window.PixelMon.RARITY;

  function PickerMon({ inst, selected, onPick }){
    const sp = window.PixelMon.byId(inst.sp);
    const r = RARITY[sp.rarity];
    return e('button',{ onClick:()=>onPick(inst.iid),
      style:{ textAlign:'center', padding:'8px 4px 6px', borderRadius:10,
        background: selected?'var(--lav-lite)':'var(--card-2)',
        border:'3px solid '+(selected?'var(--lav-deep)':'var(--card-line)'), cursor:'pointer',
        boxShadow: selected?'0 0 10px var(--lav-lite)':'none' } },
      e(Creature,{ inst, size:42, bob:selected }),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, sp.name),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, (inst.form?'\u2728':'')+'Lv'+inst.level));
  }

  function Toast({ msg }){
    return e('div',{ className:'fade-in', style:{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)',
      background:'var(--sage-deep)', color:'#fff', fontFamily:"'Silkscreen'", fontSize:11, padding:'10px 18px',
      borderRadius:10, border:'2px solid #fff', boxShadow:'0 4px 0 rgba(124,90,61,.25)', whiteSpace:'nowrap' } }, msg);
  }

  function Shop(){
    const st = window.useStore();
    const [pick, setPick] = useState(st.team[0] || st.owned[0]?.iid);
    const [toast, setToast] = useState(null);
    const flash = (m)=>{ setToast(m); setTimeout(()=>setToast(null), 1800); };

    const byId = Object.fromEntries(st.owned.map(o=>[o.iid,o]));
    const candyTarget = byId[pick];
    const copyTarget = candyTarget && window.PixelMon.byId(candyTarget.sp);
    const canBuyCopy = !!(copyTarget && window.PixelMon.evoOptions(copyTarget).length);

    function buyCandy(){
      if(!candyTarget) return;
      const before = candyTarget.level;
      if(window.Store.rareCandy(pick)){
        const after = window.Store.get().owned.find(o=>o.iid===pick).level;
        flash(after>before ? window.PixelMon.byId(candyTarget.sp).name+' grew to Lv'+after+'!' : '+35 EXP to '+window.PixelMon.byId(candyTarget.sp).name);
      }
    }
    function buySnack(){ if(window.Store.teamSnack()) flash('+5 EXP to all team members!'); }
    function buyMega(){ if(window.Store.buyMegaStone()) flash('Mega Stone added to your bag!'); }
    function buyGmax(){ if(window.Store.buyGmaxStone()) flash('Gigantamax Stone added to your bag!'); }
    function buyCopy(){
      if(!candyTarget || !copyTarget) return;
      if(window.Store.buyEvolutionCopy(pick)) flash('+1 copy for '+copyTarget.name+'!');
    }

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 360px', gap:14, position:'relative' } },
      // LEFT — items + picker
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', gap:14, overflowY:'auto' } },
        e('div',{ style:{ display:'flex', alignItems:'center' } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Trainer Shop'),
          e('div',{ className:'cur-badge' }, e(Coin,{size:16}), st.coins.toLocaleString())),

        // Rare Candy
        e('div',{ className:'chip-card', style:{ padding:16 } },
          e('div',{ style:{ display:'flex', alignItems:'center', gap:12, marginBottom:12 } },
            e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--pink-lite)', border:'2px solid var(--pink-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '\ud83c\udf6c'),
            e('div',{ style:{ flex:1 } },
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Rare Candy'),
              e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, '+35 EXP to one chosen friend')),
            e('button',{ className:'btn', disabled: st.coins<200 || !candyTarget, style:{ fontSize:11 }, onClick:buyCandy },
              e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '200'))),
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginBottom:8 } }, 'FEED TO:'),
          e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:7, maxHeight:148, overflowY:'auto', paddingRight:4 } },
            st.owned.map(m=> e(PickerMon,{ key:m.iid, inst:m, selected:m.iid===pick, onPick:setPick })))),

        // Team Snack
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--sage-lite)', border:'2px solid var(--sage-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '\ud83c\udf6e'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Team Snack'),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, '+5 EXP to all 6 current team members')),
          e('button',{ className:'btn green', disabled: st.coins<500, style:{ fontSize:11 }, onClick:buySnack },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '500'))),

        // Evolution Copy
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--lav-lite)', border:'2px solid var(--lav-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '\ud83e\udde9'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Evolution Copy'),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } },
              canBuyCopy ? ('Buy +1 duplicate copy for '+copyTarget.name) : 'Select an evolvable friend to buy a copy')),
          e('button',{ className:'btn lav', disabled: st.coins<800 || !canBuyCopy, style:{ fontSize:11 }, onClick:buyCopy },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '800'))),

        // Mega Stone
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--lav-lite)', border:'2px solid var(--lav-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '\ud83d\udd2e'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ display:'flex', alignItems:'center', gap:8 } },
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Mega Stone'),
              e('span',{ className:'type-tag', style:{ background:'var(--lav)', color:'#fff' } }, 'bag '+(st.megaStones||0))),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, 'Unlock a Mega Evolution from a friend\u2019s detail card')),
          e('button',{ className:'btn lav', disabled: st.coins<1500, style:{ fontSize:11 }, onClick:buyMega },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '1500'))),

        // Gigantamax Stone
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--pink-lite)', border:'2px solid var(--pink-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '\ud83c\udf00'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ display:'flex', alignItems:'center', gap:8 } },
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Gigantamax Stone'),
              e('span',{ className:'type-tag', style:{ background:'var(--pink)', color:'#fff' } }, 'bag '+(st.gmaxStones||0))),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, 'Unlock a Gigantamax form from a friend\u2019s detail card')),
          e('button',{ className:'btn pink', disabled: st.coins<1500, style:{ fontSize:11 }, onClick:buyGmax },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '1500')))
      ),

      // RIGHT — selected preview
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:12 } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Selected'),
        candyTarget ? (function(){
          const sp = window.PixelMon.byId(candyTarget.sp);
          const need = window.Derived.expToNext(candyTarget.level);
          return e('div',{ style:{ textAlign:'center' } },
            e('div',{ style:{ background:RARITY[sp.rarity].glow, borderRadius:14, padding:16, display:'inline-block', marginBottom:10 } },
              e(Creature,{ inst:candyTarget, size:96, bob:true })),
            e('div',{ className:'pixel-font', style:{ fontSize:16, color:'var(--wood-dark)' } }, candyTarget.form?window.PixelMon.formName(sp, candyTarget.form):sp.name),
            e('div',{ style:{ margin:'6px 0' } }, e(RarityTag,{ rarity:sp.rarity })),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-soft)', margin:'8px 0 5px' } },
              'Lv '+candyTarget.level+'  \u00b7  \u2694 '+window.Derived.monPower(candyTarget)),
            e('div',{ className:'expbar', style:{ height:9 } }, e('i',{ style:{ width:Math.round(candyTarget.exp/need*100)+'%' } })),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop:5 } }, candyTarget.exp+' / '+need+' EXP to Lv'+(candyTarget.level+1)));
        })() : e('div',{ style:{ color:'var(--ink-faint)', textAlign:'center', padding:20 } }, 'Pick a friend below'),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginTop:'auto' } },
          'Coins are earned by sending your team into the ', e('b',{},'Meadow'),
          '. Spend them here to level up faster \u2014 higher levels mean more Fighting Power.'),
        toast ? e(Toast,{ msg:toast }) : null
      )
    );
  }

  window.Shop = Shop;
})();

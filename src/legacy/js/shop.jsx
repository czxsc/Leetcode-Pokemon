/* =====================================================================
   Shop — spend Coins (earned in the Meadow) on EXP items.
   Rare Candy: +35 EXP to one chosen friend. Team Snack: +5 EXP to team.
   The right panel is the shop-wide friend selector: whoever is picked
   there is the target for Rare Candy and Evolution Copy.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;
  const RARITY = window.PixelMon.RARITY;

  function PickerMon({ inst, selected, onPick }){
    const sp = window.PixelMon.byId(inst.sp);
    const r = RARITY[sp.rarity];
    return e('button',{ onClick:()=>onPick(inst.iid), title:sp.name,
      style:{ textAlign:'center', padding:'8px 4px 6px', borderRadius:10,
        background: selected?'var(--lav-lite)':'var(--card-2)',
        border:'3px solid '+(selected?'var(--lav-deep)':r.color), cursor:'pointer',
        boxShadow: selected?'0 0 10px var(--lav-lite)':'none' } },
      e(Creature,{ inst, size:42, bob:selected }),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, sp.name),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, (inst.form?'✨':'')+'Lv'+inst.level));
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
    const target = byId[pick];
    const targetSp = target && window.PixelMon.byId(target.sp);
    const targetName = target ? (target.form?window.PixelMon.formName(targetSp, target.form):targetSp.name) : null;
    const canBuyCopy = !!(targetSp && window.PixelMon.evoOptions(targetSp).length);

    function buyCandy(){
      if(!target) return;
      const before = target.level;
      if(window.Store.rareCandy(pick)){
        const after = window.Store.get().owned.find(o=>o.iid===pick).level;
        flash(after>before ? targetSp.name+' grew to Lv'+after+'!' : '+35 EXP to '+targetSp.name);
      }
    }
    function buySnack(){ if(window.Store.teamSnack()) flash('+5 EXP to all team members!'); }
    function buyMega(){ if(window.Store.buyMegaStone()) flash('Mega Stone added to your bag!'); }
    function buyGmax(){ if(window.Store.buyGmaxStone()) flash('Gigantamax Stone added to your bag!'); }
    function buyCopy(){
      if(!target || !targetSp) return;
      if(window.Store.buyEvolutionCopy(pick)) flash('+1 copy for '+targetSp.name+'!');
    }

    return e('div',{ style:{ height:'100%', minHeight:0, display:'grid', gridTemplateColumns:'1fr 360px', gap:14, position:'relative' } },
      // LEFT — items
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', gap:14, minHeight:0, overflowY:'auto' } },
        e('div',{ style:{ display:'flex', alignItems:'center' } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Trainer Shop'),
          e('div',{ className:'cur-badge' }, e(Coin,{size:16}), st.coins.toLocaleString())),

        // Rare Candy
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--pink-lite)', border:'2px solid var(--pink-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '🍬'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Rare Candy'),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } },
              target ? ('+35 EXP to '+targetName) : '+35 EXP — select a friend to feed')),
          e('button',{ className:'btn', disabled: st.coins<200 || !target, style:{ fontSize:11 }, onClick:buyCandy },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '200'))),

        // Team Snack
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--sage-lite)', border:'2px solid var(--sage-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '🍮'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Team Snack'),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, '+5 EXP to all 6 current team members')),
          e('button',{ className:'btn green', disabled: st.coins<500, style:{ fontSize:11 }, onClick:buySnack },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '500'))),

        // Evolution Copy
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--lav-lite)', border:'2px solid var(--lav-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '🧩'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Evolution Copy'),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } },
              canBuyCopy ? ('Buy +1 duplicate copy for '+targetSp.name) : 'Select an evolvable friend to buy a copy')),
          e('button',{ className:'btn lav', disabled: st.coins<800 || !canBuyCopy, style:{ fontSize:11 }, onClick:buyCopy },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '800'))),

        // Mega Stone
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--lav-lite)', border:'2px solid var(--lav-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '🔮'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ display:'flex', alignItems:'center', gap:8 } },
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Mega Stone'),
              e('span',{ className:'type-tag', style:{ background:'var(--lav)', color:'#fff' } }, 'bag '+(st.megaStones||0))),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, 'Unlock a Mega Evolution from a friend’s detail card')),
          e('button',{ className:'btn lav', disabled: st.coins<1500, style:{ fontSize:11 }, onClick:buyMega },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '1500'))),

        // Gigantamax Stone
        e('div',{ className:'chip-card', style:{ padding:16, display:'flex', alignItems:'center', gap:12 } },
          e('div',{ style:{ width:46, height:46, borderRadius:10, background:'var(--pink-lite)', border:'2px solid var(--pink-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 } }, '🌀'),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ display:'flex', alignItems:'center', gap:8 } },
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, 'Gigantamax Stone'),
              e('span',{ className:'type-tag', style:{ background:'var(--pink)', color:'#fff' } }, 'bag '+(st.gmaxStones||0))),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, 'Unlock a Gigantamax form from a friend’s detail card')),
          e('button',{ className:'btn pink', disabled: st.coins<1500, style:{ fontSize:11 }, onClick:buyGmax },
            e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, e(Coin,{size:13}), '1500')))
      ),

      // RIGHT — shop-wide friend selector
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:12, minHeight:0 } },
        e('div',{ style:{ display:'flex', alignItems:'center', gap:8 } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Selected Friend'),
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, st.owned.length+' owned')),

        target ? (function(){
          const need = window.Derived.expToNext(target.level);
          return e('div',{ className:'chip-card', style:{ padding:'11px 14px', display:'flex', alignItems:'center', gap:11 } },
            e('div',{ style:{ background:RARITY[targetSp.rarity].glow, borderRadius:9, padding:5, flex:'none' } },
              e(Creature,{ inst:target, size:44, bob:true })),
            e('div',{ style:{ flex:1, minWidth:0 } },
              e('div',{ style:{ display:'flex', alignItems:'center', gap:7 } },
                e('div',{ style:{ flex:1, minWidth:0, fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, targetName),
                e(RarityTag,{ rarity:targetSp.rarity })),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-soft)', margin:'5px 0' } },
                'Lv '+target.level+'  ·  ⚔ '+window.Derived.monPower(target)),
              e('div',{ className:'expbar', style:{ height:8 } }, e('i',{ style:{ width:Math.round(target.exp/need*100)+'%' } })),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop:4 } }, target.exp+' / '+need+' EXP to Lv'+(target.level+1))));
        })() : e('div',{ className:'chip-card', style:{ padding:16, textAlign:'center', color:'var(--ink-faint)', fontSize:13 } }, 'Pick a friend below'),

        e('div',{ style:{ flex:1, minHeight:0, overflowY:'auto', paddingRight:4 } },
          e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7 } },
            st.owned.map(m=> e(PickerMon,{ key:m.iid, inst:m, selected:m.iid===pick, onPick:setPick })))),

        e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.5 } },
          'The friend picked here receives ', e('b',{},'Rare Candy'), ' and ', e('b',{},'Evolution Copy'),
          ' purchases. Coins are earned in the ', e('b',{},'Meadow'), '.'),
        toast ? e(Toast,{ msg:toast }) : null
      )
    );
  }

  window.Shop = Shop;
})();

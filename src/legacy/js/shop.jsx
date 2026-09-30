/* =====================================================================
   Shop — spend Coins (earned in Focus sessions) on items.
   Friend items (Rare Candy, Shiny Candy) open a small "feed to" picker
   on Buy; team/bag items and gacha items (Rate Booster, Great / Ultra
   Ball, Generation Ticket) go straight into the bag.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;
  const RARITY = window.PixelMon.RARITY;
  const PM = window.PixelMon;

  // ---- item catalogue (prices live in Store.PRICES) ----
  const withPrice = (item)=> ({ ...item, price:window.Store.PRICES[item.id] });
  // `eligible(inst, st)` returns null when the item can be used on that friend, else a short reason.
  const FRIEND_ITEMS = [
    { id:'candy', name:'Rare Candy', sprite:'rare-candy', emoji:'🍬', btn:'',
      desc:'+35 EXP to one friend of your choice',
      eligible:()=> null,
      info:(inst)=>{ const need = window.Derived.expToNext(inst.level);
        return { bar: inst.exp/need, text: inst.exp+' / '+need+' EXP to Lv'+(inst.level+1) }; },
      buy:(iid)=> window.Store.rareCandy(iid),
      done:(inst, sp)=>{ const after = window.Store.get().owned.find(o=>o.iid===inst.iid).level;
        return after>inst.level ? sp.name+' grew to Lv'+after+'!' : '+35 EXP to '+sp.name; } },
    { id:'shiny', name:'Shiny Candy', sprite:'shiny-charm', emoji:'✨', btn:'gold',
      desc:'Make a friend shiny — its normal form can be pulled again as new',
      eligible:(inst, st)=>{
        if(inst.shiny) return 'Already shiny';
        if(st.owned.some(o=> o.sp===inst.sp && o.shiny)) return 'You already have a shiny one';
        return null; },
      info:()=> ({ text:'Will become ✨ shiny' }),
      buy:(iid)=> window.Store.shinyCandy(iid),
      done:(inst, sp)=> '✨ '+sp.name+' is now shiny!' },
  ].map(withPrice);
  const BAG_ITEMS = [
    { id:'snack', name:'Team Snack', sprite:'lava-cookie', emoji:'🍮', btn:'green',
      desc:'+5 EXP to all 6 current team members',
      buy:()=> window.Store.teamSnack() && '+5 EXP to all team members!' },
    { id:'mega', name:'Mega Stone', sprite:'key-stone', emoji:'🔮', btn:'lav',
      desc:'Unlock a Mega Evolution from a friend’s detail card', bag:(st)=> st.megaStones||0, tag:'var(--lav)',
      buy:()=> window.Store.buyMegaStone() && 'Mega Stone added to your bag!' },
    { id:'gmax', name:'Gigantamax Stone', sprite:'red-shard', emoji:'🌀', btn:'pink',
      desc:'Unlock a Gigantamax form from a friend’s detail card', bag:(st)=> st.gmaxStones||0, tag:'var(--pink)',
      buy:()=> window.Store.buyGmaxStone() && 'Gigantamax Stone added to your bag!' },
  ].map(withPrice);
  // Rate Booster, Great / Ultra Ball, Generation Ticket — used from the Gacha tab (defined in gacha.jsx)
  const GACHA_ITEMS = window.GachaItems.map(it=> withPrice({ ...it,
    bag:(st)=> st.items[it.id]||0, tag:it.line,
    buy:()=> window.Store.buyGachaItem(it.id) && it.name+' added to your bag!' }));

  function PriceBtn({ item, disabled, onClick, label }){
    return e('button',{ className:'btn '+item.btn, disabled, style:{ fontSize:11 }, onClick },
      e('span',{ style:{ display:'flex', alignItems:'center', gap:5 } }, label ? label+' ·' : null, e(Coin,{size:13}), item.price.toLocaleString()));
  }

  function ItemCard({ item, st, onBuy }){
    return e('div',{ className:'chip-card', style:{ padding:'22px 22px', display:'flex', alignItems:'center', gap:16 } },
      e(ItemIcon,{ item, size:58 }),
      e('div',{ style:{ flex:1, minWidth:0 } },
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, item.name),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:6, lineHeight:1.45 } }, item.desc)),
      // price, with how many are already in the bag underneath
      e('div',{ style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:7, flex:'none' } },
        e(PriceBtn,{ item, disabled: st.coins<item.price, onClick:onBuy }),
        item.bag ? e('span',{ className:'type-tag', style:{ background:item.tag, color:'#fff', whiteSpace:'nowrap' } }, 'in bag: '+item.bag(st)) : null));
  }

  function PickerMon({ inst, selected, reason, onPick }){
    const sp = PM.byId(inst.sp);
    const off = !!reason;
    return e('button',{ onClick: off ? undefined : ()=>onPick(inst.iid), disabled:off, title: off ? sp.name+' — '+reason : sp.name,
      style:{ textAlign:'center', padding:'8px 4px 6px', borderRadius:10, opacity: off?.4:1,
        background: selected?'var(--lav-lite)':'var(--card-2)',
        border:'3px solid '+(selected?'var(--lav-deep)':'var(--card-line)'), cursor: off?'not-allowed':'pointer',
        boxShadow: selected?'0 0 10px var(--lav-lite)':'none' } },
      e(Creature,{ inst, size:42, bob:selected }),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, sp.name),
      e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, (inst.shiny?'✨':'')+'Lv'+inst.level));
  }

  // ---- "feed to" picker for friend items ----
  function FeedModal({ item, onClose, onDone }){
    const st = window.useStore();
    const [q, setQ] = useState('');
    // team first, then everyone else in collection order
    const ordered = [
      ...st.team.map(iid=> st.owned.find(o=>o.iid===iid)).filter(Boolean),
      ...st.owned.filter(o=> !st.team.includes(o.iid)),
    ];
    const reasonOf = (inst)=> item.eligible(inst, st);
    const [pick, setPick] = useState(()=> (ordered.find(o=> !reasonOf(o)) || {}).iid);
    const ql = q.trim().toLowerCase();
    const list = ql ? ordered.filter(o=> PM.byId(o.sp).name.toLowerCase().includes(ql)) : ordered;
    const target = st.owned.find(o=> o.iid===pick);
    const targetOk = !!(target && !reasonOf(target));
    const short = st.coins < item.price;

    function confirm(){
      if(!targetOk || short) return;
      const sp = PM.byId(target.sp);
      if(item.buy(target.iid)) onDone(item.done(target, sp));
    }

    const preview = target ? (function(){
      const sp = PM.byId(target.sp); const info = item.info(target);
      return e('div',{ style:{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 } },
        e('div',{ style:{ background:RARITY[sp.rarity].glow, borderRadius:10, padding:4, flex:'none' } }, e(Creature,{ inst:target, size:52, bob:true })),
        e('div',{ style:{ flex:1, minWidth:0 } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } },
            (target.shiny?'✨ ':'')+sp.name+'  ·  Lv '+target.level),
          info.bar!=null ? e('div',{ className:'expbar', style:{ height:8, margin:'6px 0 4px', maxWidth:220 } },
            e('i',{ style:{ width:Math.min(100, Math.round(info.bar*100))+'%' } })) : null,
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop: info.bar!=null?0:5 } }, info.text)));
    })() : e('div',{ style:{ flex:1, fontSize:13, color:'var(--ink-faint)' } }, 'No friend can use this right now');

    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal fade-in', onClick:(ev)=>ev.stopPropagation(),
          style:{ width:540, display:'flex', flexDirection:'column', maxHeight:'86%', position:'relative' } },
        e('button',{ className:'modal-x', onClick:onClose, 'aria-label':'Close' }, '×'),
        e('div',{ style:{ display:'flex', alignItems:'center', gap:12, marginBottom:12, paddingRight:24 } },
          e(ItemIcon,{ item, size:40 }),
          e('div',{ style:{ flex:1 } },
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, item.name+' — feed to…'),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, item.desc))),
        e(SearchBox,{ value:q, autoFocus:true, placeholder:'Search your friends…', onChange:setQ }),
        e('div',{ style:{ flex:'1 1 300px', minHeight:0, overflowY:'auto', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(72px,1fr))', gap:7, paddingRight:4, alignContent:'start' } },
          list.map(m=> e(PickerMon,{ key:m.iid, inst:m, selected:m.iid===pick, reason:reasonOf(m), onPick:setPick })),
          list.length===0 ? e('div',{ style:{ gridColumn:'1/-1', textAlign:'center', color:'var(--ink-faint)', padding:20 } }, 'No matches') : null),
        e('div',{ style:{ display:'flex', alignItems:'center', gap:12, marginTop:12, paddingTop:12, borderTop:'2px dashed var(--card-line)' } },
          preview,
          e('div',{ style:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flex:'none' } },
            e('div',{ style:{ display:'flex', gap:8 } },
              e('button',{ className:'btn', style:{ fontSize:11 }, onClick:onClose }, 'Cancel'),
              e(PriceBtn,{ item, label:'Buy', disabled: short || !targetOk, onClick:confirm })),
            short ? e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--pink-deep)' } }, 'Not enough coins') : null))
      )
    );
  }

  function Toast({ msg }){
    return e('div',{ className:'fade-in', style:{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', zIndex:60,
      background:'var(--sage-deep)', color:'#fff', fontFamily:"'Silkscreen'", fontSize:11, padding:'10px 18px',
      borderRadius:10, border:'2px solid #fff', boxShadow:'0 4px 0 rgba(124,90,61,.25)', whiteSpace:'nowrap' } }, msg);
  }

  function Shop(){
    const st = window.useStore();
    const [feeding, setFeeding] = useState(null);   // friend item whose picker is open
    const [toast, setToast] = useState(null);
    const flash = (m)=>{ setToast(m); setTimeout(()=>setToast(null), 1800); };

    return e('div',{ style:{ height:'100%', position:'relative' } },
      e('div',{ className:'panel', style:{ height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:24, overflowY:'auto', padding:'26px 30px' } },
        e('div',{ style:{ display:'flex', alignItems:'center', gap:12, paddingBottom:18, borderBottom:'2px dashed var(--card-line)' } },
          e('div',{ style:{ flex:1 } },
            e('div',{ className:'panel-title', style:{ margin:0 } }, e('span',{className:'dot'}), 'Trainer Shop')),
          e('div',{ className:'cur-badge' }, e(Coin,{size:16}), st.coins.toLocaleString())),
        // one grid: friend items open the "feed to" picker, everything else goes straight into the bag
        e('div',{ style:{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gridAutoRows:'minmax(132px, 1fr)', gap:18 } },
          FRIEND_ITEMS.map(item=> e(ItemCard,{ key:item.id, item, st, onBuy:()=>setFeeding(item) })),
          [...BAG_ITEMS, ...GACHA_ITEMS].map(item=> e(ItemCard,{ key:item.id, item, st, onBuy:()=>{ const msg = item.buy(); if(msg) flash(msg); } })))
      ),
      feeding ? e(FeedModal,{ item:feeding, onClose:()=>setFeeding(null), onDone:(msg)=>{ setFeeding(null); flash(msg); } }) : null,
      toast ? e(Toast,{ msg:toast }) : null
    );
  }

  window.Shop = Shop;
})();

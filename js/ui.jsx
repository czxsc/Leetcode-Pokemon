/* =====================================================================
   Shared UI atoms + top navigation. Exposes globals via window.
===================================================================== */
(function(){
  const e = React.createElement;

  // ---- Pokéball icon (pure CSS/divs) ----
  function Pokeball({ size=20, className='', style={} }){
    const b = Math.max(2, Math.round(size/11));
    return e('div',{ className, style:{ width:size, height:size, borderRadius:'50%',
        border:`${b}px solid #1c1922`, position:'relative', overflow:'hidden',
        background:'#fff', flex:'none', ...style } },
      e('div',{ style:{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'var(--ball-red)' } }),
      e('div',{ style:{ position:'absolute', top:'50%', left:0, right:0, height:b, transform:`translateY(${-b/2}px)`, background:'#1c1922' } }),
      e('div',{ style:{ position:'absolute', top:'50%', left:'50%', width:size*0.36, height:size*0.36,
        transform:'translate(-50%,-50%)', borderRadius:'50%', background:'#fff', border:`${b}px solid #1c1922` } })
    );
  }

  // ---- shard glyph (teal crystal) ----
  function Shard({ size=18, style={} }){
    const s=size;
    return e('svg',{ width:s, height:s, viewBox:'0 0 16 16', style:{ flex:'none', ...style } },
      e('polygon',{ points:'8,1 14,6 8,15 2,6', fill:'var(--shard)', stroke:'var(--shard-deep)', strokeWidth:1.4, strokeLinejoin:'round' }),
      e('polygon',{ points:'8,1 14,6 8,7', fill:'var(--shard-lite)' }),
      e('line',{ x1:8, y1:1, x2:8, y2:15, stroke:'var(--shard-deep)', strokeWidth:0.8, opacity:0.5 })
    );
  }

  // ---- coin glyph (gold disc with P) ----
  function Coin({ size=18, style={} }){
    return e('div',{ style:{ width:size, height:size, borderRadius:'50%',
      border:`${Math.max(2,size/9)}px solid var(--coin-line)`,
      background:'radial-gradient(circle at 38% 32%, #fbe7b0, var(--coin) 70%)',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Silkscreen'", fontSize:size*0.5, color:'#7a5a14', flex:'none', ...style } }, 'C');
  }

  function TypeTag({ type }){
    const c = (window.PixelMon.TYPE_COLOR && window.PixelMon.TYPE_COLOR[type]) || '#c9b78c';
    return e('span',{ className:'type-tag', style:{ background:c } }, type);
  }
  function RarityTag({ rarity }){
    const r = window.PixelMon.RARITY[rarity];
    return e('span',{ className:'type-tag', style:{ background:r.color, color:'#fff' } }, r.label);
  }

  // ---- top nav ----
  const TABS = [
    { id:'dashboard', label:'Dashboard', dot:'var(--sage)' },
    { id:'gacha',     label:'Gacha',     dot:'var(--lav)' },
    { id:'quests',    label:'Quests',    dot:'var(--pink)' },
    { id:'recall',    label:'Recall',    dot:'var(--sky)' },
    { id:'team',      label:'Team',      dot:'var(--sage-deep)' },
    { id:'shop',      label:'Shop',      dot:'var(--coin)' },
    { id:'map',       label:'Meadow',    dot:'var(--mint)' },
  ];

  function CurrencyCluster(){
    const st = window.useStore(s=>({ shards:s.shards, coins:s.coins }));
    return e('div',{ style:{ display:'flex', gap:8 } },
      e('div',{ className:'cur-badge', title:'Pok\u00e9-Shards \u2014 spent on gacha' },
        e(Shard,{ size:17 }), st.shards.toLocaleString()),
      e('div',{ className:'cur-badge', title:'Pok\u00e9-Coins \u2014 spent in the shop' },
        e(Coin,{ size:16 }), st.coins.toLocaleString())
    );
  }

  function TopNav({ page, setPage }){
    return e('div',{ style:{ display:'flex', alignItems:'stretch', gap:12, marginBottom:14 } },
      e('div',{ className:'wood-sign', style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px' } },
        e(Pokeball,{ size:26 }),
        e('div',{ className:'pixel-font', style:{ fontSize:15, lineHeight:1, color:'#5d4026' } }, 'Pok\u00e9Leet')
      ),
      e('nav',{ className:'nav', style:{ flex:1 } },
        TABS.map(t=> e('button',{ key:t.id, className:'nav-tab'+(page===t.id?' active':''),
            onClick:()=>setPage(t.id) },
          e('span',{ className:'tdot', style:{ background:t.dot } }), t.label))
      ),
      e('div',{ className:'wood-sign', style:{ display:'flex', alignItems:'center', padding:'8px 12px' } },
        e(CurrencyCluster))
    );
  }

  // ---- naive python syntax highlighter ----
  const KW = new Set(('class def return if elif else for while in not and or is None True False '+
    'self import from as with try except lambda yield break continue global pass raise').split(' '));
  function highlight(code){
    const esc = s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const lines = code.split('\n').map(line=>{
      // comment
      const ci = line.indexOf('#');
      let comment='';
      let main=line;
      if(ci>=0 && !/['"].*#/.test(line)){ comment=line.slice(ci); main=line.slice(0,ci); }
      let out = esc(main)
        .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, m=>`<span class="tok-str">${m}</span>`)
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
        .replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (m)=> KW.has(m)?`<span class="tok-kw">${m}</span>`:m);
      if(comment) out += `<span class="tok-com">${esc(comment)}</span>`;
      return out;
    });
    return lines.join('\n');
  }

  function CodeBlock({ code }){
    return e('pre',{ dangerouslySetInnerHTML:{ __html: highlight(code) } });
  }

  Object.assign(window, { Pokeball, Shard, Coin, TypeTag, RarityTag, TopNav, CodeBlock, NAV_TABS:TABS });
})();

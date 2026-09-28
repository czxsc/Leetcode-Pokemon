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
    { id:'pokedex',   label:'Pok\u00e9dex',  dot:'var(--coin-deep)' },
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

  // ---- save status (window.Persistence) ----
  function usePersistenceStatus(){
    const [, force] = React.useReducer(x=>x+1, 0);
    React.useEffect(()=> window.Persistence.subscribe(force), []);
    return window.Persistence.status();
  }

  function SaveStatus(){
    const s = usePersistenceStatus();
    const title = s.state==='conflict' ? 'Stopped saving \u2014 your data was changed in another tab'
      : s.state==='error' ? s.error
      : s.mode==='disk' ? 'Progress is saved to '+s.location
      : 'Progress is saved in this browser only \u2014 run the app with "npm run dev" to save it to disk';
    return e('span',{ className:'save-dot '+(s.state==='saved' ? s.mode : 'bad'), title });
  }

  // Blocks the app if another tab took over the data; warns if saving fails.
  function SaveBanner(){
    const s = usePersistenceStatus();
    if(s.state==='conflict'){
      return e('div',{ className:'modal-veil', style:{ zIndex:90 } },
        e('div',{ className:'panel modal', style:{ width:460, textAlign:'center' } },
          e('div',{ className:'panel-title', style:{ justifyContent:'center' } }, e('span',{className:'dot'}), 'Opened somewhere else'),
          e('div',{ style:{ fontSize:14, color:'var(--ink-soft)', lineHeight:1.5, marginBottom:16 } },
            'Your Pok\u00e9Leet data was saved from another tab or window, so this one stopped saving to avoid overwriting it. Reload to continue with the latest progress.'),
          e('button',{ className:'btn green', onClick:()=>window.location.reload() }, 'Reload')));
    }
    if(s.state==='error') return e('div',{ className:'save-banner' }, '\u26a0 '+s.error);
    return null;
  }

  function TopNav({ page, setPage }){
    return e('div',{ style:{ display:'flex', alignItems:'stretch', gap:12, marginBottom:14 } },
      e('div',{ className:'wood-sign', style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px' } },
        e(Pokeball,{ size:26 }),
        e('div',{ className:'pixel-font', style:{ fontSize:15, lineHeight:1, color:'#5d4026' } }, 'Pok\u00e9Leet'),
        e(SaveStatus)
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

  // ---- small multi-language syntax highlighter ----
  // Single left-to-right scan: comments, strings, numbers, keywords, and the
  // name after def/class/function/... Anything else is escaped plain text.
  const words = (s)=> new Set(s.split(' '));
  const KEYWORDS = {
    python: words('and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return self True try while with yield'),
    clike: words('abstract auto bool boolean break byte case catch char class const constexpr continue default defer delete do double else enum explicit export extends extern false final finally float fn for from func function go goto if impl implements import in inline instanceof int interface internal let long loop match mod mut namespace new nil null of operator override package private protected pub public range readonly return self Self short signed sizeof static struct super switch template this throw throws trait true try type typedef typeof undefined union unsigned use using val var virtual void volatile when where while yield async await'),
    ruby: words('alias and begin break case class def do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield'),
    sql: words('select from where and or not insert into values update set delete create table join left right inner outer full cross on group by order having limit offset as distinct union all case when then else end null is in exists count sum avg min max with over partition rank dense_rank row_number between like asc desc if ifnull coalesce'),
  };
  const SYNTAX = {
    python: { kw:'python', line:'#', quotes:'\'"', triple:true },
    ruby:   { kw:'ruby', line:'#', quotes:'\'"' },
    sql:    { kw:'sql', line:'--', block:['/*','*/'], quotes:'\'"', nocase:true },
    other:  { kw:null, quotes:'' },
  };
  const CLIKE = { kw:'clike', line:'//', block:['/*','*/'], quotes:'\'"`' };
  const DEFINERS = words('def class function fn func struct interface trait enum');
  const NUM = /\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[a-zA-Z]*/y;
  const WORD = /[A-Za-z_$][\w$]*/y;
  const esc = (s)=> s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function highlight(code, language){
    const cfg = SYNTAX[language] || CLIKE;
    const kw = cfg.kw ? KEYWORDS[cfg.kw] : null;
    const n = code.length;
    const tok = (cls, text)=> '<span class="tok-'+cls+'">'+esc(text)+'</span>';
    let out = '', i = 0, plain = '', defining = false;
    const flush = ()=>{ if(plain){ out += esc(plain); plain = ''; } };
    while(i < n){
      const ch = code[i];
      if(cfg.line && code.startsWith(cfg.line, i)){
        let j = code.indexOf('\n', i); if(j < 0) j = n;
        flush(); out += tok('com', code.slice(i, j)); i = j; continue;
      }
      if(cfg.block && code.startsWith(cfg.block[0], i)){
        let j = code.indexOf(cfg.block[1], i + cfg.block[0].length);
        j = j < 0 ? n : j + cfg.block[1].length;
        flush(); out += tok('com', code.slice(i, j)); i = j; continue;
      }
      if(cfg.quotes.includes(ch)){
        let j;
        if(cfg.triple && code.startsWith(ch+ch+ch, i)){
          j = code.indexOf(ch+ch+ch, i + 3); j = j < 0 ? n : j + 3;
        } else {
          j = i + 1;
          while(j < n && code[j] !== ch && (ch === '`' || code[j] !== '\n')){ if(code[j] === '\\') j++; j++; }
          j = Math.min(n, j + 1);
        }
        flush(); out += tok('str', code.slice(i, j)); i = j; continue;
      }
      if(kw && /[0-9]/.test(ch) && !/[\w$]/.test(code[i-1] || '')){
        NUM.lastIndex = i; const m = NUM.exec(code);
        flush(); out += tok('num', m[0]); i += m[0].length; continue;
      }
      if(kw && /[A-Za-z_$]/.test(ch)){
        WORD.lastIndex = i; const w = WORD.exec(code)[0];
        const key = cfg.nocase ? w.toLowerCase() : w;
        flush();
        if(kw.has(key)){ out += tok('kw', w); defining = DEFINERS.has(key); }
        else if(defining){ out += tok('def', w); defining = false; }
        else out += esc(w);
        i += w.length; continue;
      }
      if(!/\s/.test(ch)) defining = false;
      plain += ch; i++;
    }
    flush();
    return out;
  }

  function CodeBlock({ code, language }){
    return e('pre',{ dangerouslySetInnerHTML:{ __html: highlight(code, language || 'python') } });
  }

  Object.assign(window, { Pokeball, Shard, Coin, TypeTag, RarityTag, TopNav, CodeBlock, SaveBanner,
    usePersistenceStatus, NAV_TABS:TABS });
})();

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

  // full-width search field for pickers: magnifier on the left, × to clear once there's text
  function SearchBox({ value, onChange, placeholder, autoFocus }){
    return e('div',{ className:'search-box' },
      e('svg',{ className:'search-box-icon', width:14, height:14, viewBox:'0 0 14 14', 'aria-hidden':true, shapeRendering:'crispEdges' },
        e('rect',{ x:2, y:0, width:6, height:2 }), e('rect',{ x:2, y:8, width:6, height:2 }),
        e('rect',{ x:0, y:2, width:2, height:6 }), e('rect',{ x:8, y:2, width:2, height:6 }),
        e('rect',{ x:9, y:9, width:2, height:2 }), e('rect',{ x:11, y:11, width:3, height:3 })),
      e('input',{ className:'search-input', value, autoFocus, placeholder, spellCheck:false,
        onChange:(ev)=>onChange(ev.target.value),
        onKeyDown:(ev)=>{ if(ev.key==='Escape' && value){ ev.stopPropagation(); onChange(''); } } }),
      value ? e('button',{ className:'search-box-clear', 'aria-label':'Clear search', onClick:()=>onChange('') }, '×') : null);
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
    { id:'gacha',     label:'Summon',    dot:'var(--lav)' },
    { id:'quests',    label:'Quests',    dot:'var(--pink)' },
    { id:'recall',    label:'Recall',    dot:'var(--sky)' },
    { id:'team',      label:'Team',      dot:'var(--sage-deep)' },
    { id:'pokedex',   label:'Pok\u00e9dex',  dot:'var(--coin-deep)' },
    { id:'shop',      label:'Shop',      dot:'var(--coin)' },
    { id:'map',       label:'Focus',     dot:'var(--mint)' },
  ];

  function CurrencyCluster(){
    const st = window.useStore(s=>({ shards:s.shards, coins:s.coins }));
    return e('div',{ style:{ display:'flex', gap:8 } },
      e('div',{ className:'cur-badge', title:'Pok\u00e9-Shards \u2014 spent on summons' },
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
      : 'Demo: progress is saved in this browser only';
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

  // ---- online demo (GitHub Pages build only) ----
  const DEMO_SEEN_KEY = 'pokeleet:demo:welcome-seen';
  function demoNoticeSeen(){ try{ return !!localStorage.getItem(DEMO_SEEN_KEY); }catch{ return false; } }

  function DemoNotice({ onClose }){
    const repo = window.AppConfig.repoUrl;
    const folder = repo.split('/').pop() || 'Leetcode-Pokemon';
    function close(){
      try{ localStorage.setItem(DEMO_SEEN_KEY, '1'); }catch{ /* private window: show it again next time */ }
      onClose();
    }
    return e('div',{ className:'modal-veil', style:{ zIndex:85 }, onClick:close },
      e('div',{ className:'panel modal demo-notice', onClick:(ev)=>ev.stopPropagation() },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Welcome to the Pok\u00e9Leet demo'),
        e('div',{ className:'chip-card demo-warning' },
          e('div',{ className:'demo-warning-title' }, '\u26a0 This online version is for demo purposes only'),
          e('ul',{},
            e('li',{}, 'Progress is saved in this browser only \u2014 clearing site data, a private window, or another browser or device starts over.'),
            e('li',{}, 'Nothing is uploaded: there are no accounts, sync or backups here.'))),
        e('p',{}, 'To use Pok\u00e9Leet for real, clone it from GitHub and run it on your computer. It saves everything to your own disk:'),
        repo ? e('pre',{ className:'demo-cmd' }, `git clone ${repo}.git\ncd ${folder}\nnpm install\nnpm start`) : null,
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end', alignItems:'center' } },
          repo ? e('a',{ className:'btn', href:repo, target:'_blank', rel:'noopener noreferrer' }, 'View on GitHub \u2197') : null,
          e('button',{ className:'btn green', onClick:close }, 'Try the demo'))
      )
    );
  }

  function TopNav({ page, setPage, onDemo }){
    return e('div',{ style:{ display:'flex', alignItems:'stretch', gap:12, marginBottom:14 } },
      e('div',{ className:'wood-sign', style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px' } },
        e(Pokeball,{ size:26 }),
        e('div',{ className:'pixel-font', style:{ fontSize:15, lineHeight:1, color:'#5d4026' } }, 'Pok\u00e9Leet'),
        window.AppConfig.demo ? e('button',{ className:'demo-badge', title:'Online demo \u2014 click for details', onClick:onDemo }, 'Demo') : null,
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

  // Center-crop an uploaded photo to a small square JPEG so it stays light in the save file.
  // (trainer avatar on the dashboard and in onboarding)
  const AVATAR_PX = 192;
  function shrinkPhoto(file){
    return new Promise((resolve, reject)=>{
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = ()=>{
        URL.revokeObjectURL(url);
        const w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h);
        if(!side){ reject(new Error('That image looks empty.')); return; }
        const px = Math.min(AVATAR_PX, side);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = px;
        const ctx = canvas.getContext('2d');
        // JPEG has no transparency, so see-through parts get the frame's color
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--lav-lite').trim() || '#cabfee';
        ctx.fillRect(0, 0, px, px);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (w-side)/2, (h-side)/2, side, side, 0, 0, px, px);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error('Couldn’t open that image — try a JPG, PNG or WebP.')); };
      img.src = url;
    });
  }

  // ---- item icon (Shop + Gacha): a pixel item sprite on a standard tile ----
  // item: { sprite: pokemondb item slug, emoji: shown if the sprite can't load }
  function ItemIcon({ item, size }){
    const [broken, setBroken] = React.useState(false);
    return e('div',{ className:'item-icon', style:{ width:size, height:size } },
      broken ? e('span',{ style:{ fontSize:Math.round(size*.5) } }, item.emoji)
        : e('img',{ src:`https://img.pokemondb.net/sprites/items/${item.sprite}.png`, alt:'', draggable:false,
            width:Math.round(size*.8), height:Math.round(size*.8), onError:()=>setBroken(true) }));
  }

  Object.assign(window, { Pokeball, Shard, Coin, SearchBox, TypeTag, RarityTag, TopNav, CodeBlock, SaveBanner,
    DemoNotice, demoNoticeSeen, usePersistenceStatus, shrinkPhoto, ItemIcon, NAV_TABS:TABS });
})();

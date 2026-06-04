/* =====================================================================
   Dashboard page — left category menu / center problem list / right
   trainer card with power, streak commit grid and strong-weak topics.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;

  // ---------- LEFT: category menu ----------
  function NewCategoryModal({ onClose, onCreate }){
    const [name,setName] = useState('');
    function add(){ if(!name.trim()) return; onCreate(name.trim()); }
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation() },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'New Problem Set'),
        e('div',{ className:'field' }, e('label',{},'Set name'),
          e('input',{ value:name, autoFocus:true, placeholder:'e.g. Amazon Tagged',
            onChange:(ev)=>setName(ev.target.value), onKeyDown:(ev)=>ev.key==='Enter'&&add() })),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginBottom:14 } },
          'Create your own category \u2014 then add problems to it with the ', e('b',{},'+ Add'), ' button. It tracks progress and feeds your stats just like the built-in sets.'),
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end' } },
          e('button',{ className:'btn', onClick:onClose }, 'Cancel'),
          e('button',{ className:'btn green', disabled:!name.trim(), onClick:add }, 'Create'))
      )
    );
  }

  function CategoryMenu({ sel, setSel }){
    window.useStore();                       // re-render when categories/problems change
    const stats = window.Derived.categoryStats();
    const [modal, setModal] = useState(false);
    return e('div',{ className:'panel', style:colStyle },
      modal ? e(NewCategoryModal,{ onClose:()=>setModal(false),
        onCreate:(name)=>{ const id=window.Store.addCategory(name); setModal(false); setSel(id); } }) : null,
      e('div',{ style:{ display:'flex', alignItems:'center', marginBottom:10 } },
        e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Problem Sets'),
        e('button',{ className:'iconbtn', onClick:()=>setModal(true) }, '+ New')),
      e('div',{ style:scrollBody },
        stats.map(c=> e('button',{ key:c.id, className:'cat-item'+(sel===c.id?' active':''),
            onClick:()=>setSel(c.id), style:{ width:'100%', textAlign:'left', background: sel===c.id?undefined:'transparent', border:'2px solid '+(sel===c.id?'var(--sage-deep)':'transparent') } },
          e('div',{ style:{ flex:1, minWidth:0 } },
            e('div',{ style:{ display:'flex', alignItems:'center', gap:6 } },
              e('span',{ className:'cname', style:{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, c.name),
              c.custom ? e('span',{ className:'type-tag', style:{ background:'var(--lav)', color:'#fff', fontSize:7, padding:'1px 4px' } }, 'MINE') : null,
              e('span',{ className:'ccount', style:{ marginLeft:'auto' } }, c.solved+'/'+c.count)),
            e('div',{ className:'minibar', style:{ marginTop:5 } },
              e('i',{ style:{ width:(c.pct*100)+'%' } }))
          ),
          c.custom ? e('span',{ title:'Delete set', onClick:(ev)=>{ ev.stopPropagation(); if(sel===c.id) setSel('arrays'); window.Store.removeCategory(c.id); },
            style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--ink-faint)', cursor:'pointer', padding:'0 2px' } }, '\u00d7') : null
        ))
      )
    );
  }

  // ---------- GitHub sync helpers ----------
  const norm = (s)=> (s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  async function syncRepo(repo){
    const { owner, name, branch } = repo;
    const treeUrl = `https://api.github.com/repos/${owner}/${name}/git/trees/${branch||'main'}?recursive=1`;
    const res = await fetch(treeUrl);
    if(!res.ok) throw new Error(res.status===404?'Repo or branch not found':'GitHub error '+res.status);
    const data = await res.json();
    const files = (data.tree||[]).filter(t=> t.type==='blob' && /\.(py|js|ts|java|cpp|cc|c|go|rb|kt|swift|rs)$/i.test(t.path));
    const fileMap = {};
    files.forEach(f=>{ const base = f.path.split('/').pop().replace(/\.[^.]+$/,''); fileMap[norm(base)] = f.path; });
    const probs = window.Store.allProblemsLive();
    const solvedIds = []; const paths = {}; const usedFiles = new Set();
    probs.forEach(p=>{
      const np = norm(p.name);
      for(const nf in fileMap){
        if(np===nf || (np.length>=4 && nf.length>=4 && (np.startsWith(nf)||nf.startsWith(np)))){
          solvedIds.push(p.id); paths[p.id] = fileMap[nf]; usedFiles.add(nf); break;
        }
      }
    });
    return { solvedIds, paths, fileCount:files.length, matched:solvedIds.length,
      unmatched: Object.keys(fileMap).filter(k=>!usedFiles.has(k)).length };
  }
  async function fetchCode(p){
    const st = window.Store.get(); const path = st.syncedPaths[p.id]; const repo = st.repo;
    if(!path || !repo.owner) return;
    const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${repo.branch||'main'}`;
    const res = await fetch(url); if(!res.ok) return;
    const data = await res.json();
    try{ const code = decodeURIComponent(escape(atob((data.content||'').replace(/\n/g,'')))); window.Store.cacheCode(p.id, code); }catch(e){}
  }

  // ---------- modals ----------
  function AddProblemModal({ catId, onClose }){
    const [name,setName] = useState(''); const [diff,setDiff] = useState('Medium');
    const cat = window.Store.categories().find(c=>c.id===catId);
    function add(){ if(!name.trim()) return; window.Store.addProblem(catId, name.trim(), diff); onClose(); }
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation() },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Add Problem \u2014 '+cat.name),
        e('div',{ className:'field' }, e('label',{},'Problem name'),
          e('input',{ value:name, autoFocus:true, placeholder:'e.g. Maximum Subarray',
            onChange:(ev)=>setName(ev.target.value), onKeyDown:(ev)=>ev.key==='Enter'&&add() })),
        e('div',{ className:'field' }, e('label',{},'Difficulty'),
          e('select',{ value:diff, onChange:(ev)=>setDiff(ev.target.value) },
            ['Easy','Medium','Hard'].map(d=> e('option',{ key:d, value:d }, d)))),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginBottom:14 } },
          'It\u2019ll auto-mark as solved when a matching file (', e('b',{},norm(name||'problemname')||'\u2026'),
          '.py) is found on your next GitHub sync.'),
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end' } },
          e('button',{ className:'btn', onClick:onClose }, 'Cancel'),
          e('button',{ className:'btn green', disabled:!name.trim(), onClick:add }, 'Add'))
      )
    );
  }

  function SyncModal({ onClose }){
    const repo = window.useStore(s=>s.repo);
    const [owner,setOwner] = useState(repo.owner||''); const [name,setName] = useState(repo.name||'');
    const [branch,setBranch] = useState(repo.branch||'main');
    const [status,setStatus] = useState(null); const [busy,setBusy] = useState(false);
    async function run(){
      if(!owner.trim()||!name.trim()) return;
      setBusy(true); setStatus(null);
      window.Store.setRepo(owner.trim(), name.trim(), branch.trim()||'main');
      try{
        const r = await syncRepo({ owner:owner.trim(), name:name.trim(), branch:branch.trim()||'main' });
        window.Store.applySync(r.solvedIds, r.paths);
        setStatus({ ok:true, msg:`Matched ${r.matched} solved problem${r.matched===1?'':'s'} from ${r.fileCount} code files. ${r.unmatched} unmatched file${r.unmatched===1?'':'s'}.` });
      }catch(err){ setStatus({ ok:false, msg:err.message||'Sync failed' }); }
      setBusy(false);
    }
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation() },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Sync from GitHub'),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginBottom:14 } },
          'Point at your public solutions repo. Files are matched to problems by name (case/space-insensitive, e.g. ',
          e('b',{},'TwoSum.py'), ' \u2192 \u201cTwo Sum\u201d). Matches auto-mark as solved; code loads when you expand a problem.'),
        e('div',{ style:{ display:'flex', gap:10 } },
          e('div',{ className:'field', style:{ flex:1 } }, e('label',{},'GitHub user'),
            e('input',{ value:owner, placeholder:'username', onChange:(ev)=>setOwner(ev.target.value) })),
          e('div',{ className:'field', style:{ flex:1 } }, e('label',{},'Repo name'),
            e('input',{ value:name, placeholder:'leetcode-solutions', onChange:(ev)=>setName(ev.target.value) }))),
        e('div',{ className:'field' }, e('label',{},'Branch'),
          e('input',{ value:branch, placeholder:'main', onChange:(ev)=>setBranch(ev.target.value) })),
        status ? e('div',{ style:{ fontSize:13, color: status.ok?'var(--sage-deep)':'var(--hard)', marginBottom:12, fontFamily:"'Silkscreen'", lineHeight:1.5 } }, (status.ok?'\u2714 ':'\u2716 ')+status.msg) : null,
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end' } },
          e('button',{ className:'btn', onClick:onClose }, 'Close'),
          e('button',{ className:'btn green', disabled:busy||!owner.trim()||!name.trim(), onClick:run }, busy?'Syncing\u2026':'Sync'))
      )
    );
  }

  // ---------- CENTER: problem list ----------
  function ProblemRow({ p }){
    const st = window.useStore();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const solved = window.Store.isSolved(p);
    const claimed = !!st.claims[p.id];
    const code = window.Store.codeFor(p);
    const isCustom = (''+p.id).startsWith('cust-');
    const amount = window.DATA.SHARD_BY_DIFF[p.diff];
    const synced = !!st.syncedPaths[p.id];

    function toggleOpen(){
      if(!solved) return;
      const n = !open; setOpen(n);
      if(n && !code && synced){ setLoading(true); fetchCode(p).finally(()=>setLoading(false)); }
    }
    function toggleSolved(ev){ ev.stopPropagation(); if(isCustom) window.Store.setSolved(p.id, !solved); }

    return e('div',{ className:'prow'+(open?' open':'')+(solved?'':' unsolved') },
      e('div',{ className:'prow-head', style:{ cursor: solved?'pointer':'default' }, onClick:toggleOpen },
        e('span',{ onClick: isCustom?toggleSolved:undefined,
            title: isCustom?'Toggle solved':'',
            style:{ fontFamily:"'Silkscreen'", fontSize:11, color: solved?'var(--sage-deep)':'var(--ink-faint)', width:14, cursor:isCustom?'pointer':'inherit' } }, solved?'\u2714':'\u25cb'),
        e('span',{ className:'nm' }, p.name,
          isCustom?e('span',{ className:'lock', style:{ color:'var(--lav-deep)' } },'\u00b7 custom'):null,
          solved?null:e('span',{className:'lock'},'\u00b7 not solved')),
        claimed ? e(Shard,{ size:15, style:{ marginRight:2 } }) : null,
        e('span',{ className:'pill '+p.diff.toLowerCase() }, p.diff),
        isCustom ? e('span',{ onClick:(ev)=>{ ev.stopPropagation(); window.Store.removeProblem(p.cat, p.id); },
          title:'Remove', style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--ink-faint)', cursor:'pointer', width:14, textAlign:'center' } }, '\u00d7') : null,
        solved ? e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--ink-faint)', width:14, textAlign:'center' } }, open?'\u25be':'\u25b8') : null
      ),
      open && solved ? e('div',{ className:'code-wrap fade-in' },
        code ? e(CodeBlock,{ code })
          : e('pre',{ style:{ color:'#9a8fb5' } }, loading?'Fetching solution from GitHub\u2026' : synced?'Could not load file \u2014 check the repo is public.' : 'No solution code yet.\nPush it to your repo and Sync, or it\u2019s a manual solve.'),
        e('div',{ className:'code-bar' },
          e('button',{ className:'coin'+(claimed?' claimed':''), title: claimed?'Claimed':'Claim reward',
            onClick:()=> window.Store.claimSolve(p.id, amount) }, claimed?'\u2666':'?'),
          e('span',{ className:'earn' }, claimed ? 'Shards claimed \u00b7 +1 EXP to team' : `Claim +${amount} Shards`),
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--shard-lite)' } }, 'Completed'),
          e('input',{ type:'date', value: window.Store.solveDate(p) || '', max: window.Store.TODAY,
            onChange:(ev)=> window.Store.setSolveDate(p.id, ev.target.value),
            title:'Date this problem was completed \u2014 feeds your Training Log',
            style:{ fontFamily:"'Silkscreen'", fontSize:11, padding:'4px 6px', borderRadius:6, border:'2px solid var(--lav-deep)',
              background:'#efeaf6', color:'#3a3147', colorScheme:'light' } })
        )
      ) : null
    );
  }

  function ProblemList({ catId }){
    const st = window.useStore();
    const cat = window.Store.categories().find(c=>c.id===catId);
    const probs = window.Store.problemsFor(catId);
    const solvedN = probs.filter(window.Store.isSolved).length;
    const [modal, setModal] = useState(null);
    return e('div',{ className:'panel card', style:colStyle },
      modal==='add' ? e(AddProblemModal,{ catId, onClose:()=>setModal(null) }) : null,
      modal==='sync' ? e(SyncModal,{ onClose:()=>setModal(null) }) : null,
      e('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 } },
        e('div',{ style:{ flex:1 } },
          e('div',{ className:'pixel-font', style:{ fontSize:17, color:'var(--wood-dark)' } }, cat.name),
          e('div',{ style:{ fontSize:14, color:'var(--ink-faint)', marginTop:3 } },
            `${solvedN} solved \u00b7 ${probs.length} total`)),
        e('button',{ className:'iconbtn', onClick:()=>setModal('add') }, '+ Add'),
        e('button',{ className:'iconbtn', onClick:()=>setModal('sync') }, '\u21bb Sync')
      ),
      e('div',{ style:scrollBody },
        probs.map(p=> e(ProblemRow,{ key:p.id, p })),
        e('div',{ style:{ textAlign:'center', padding:'12px 0 4px', fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } },
          '\u2014 end of set \u2014')
      )
    );
  }

  // ---------- RIGHT: trainer card ----------
  function CommitGrid(){
    const { grid } = window.Derived.trainingGrid(18);
    const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const lvl = (c)=> c<=0?0 : c===1?1 : c===2?2 : c===3?3 : 4;
    // month label above a column when its first in-range day starts a new month
    let lastMon = -1;
    const monthRow = grid.map((wk,wi)=>{
      const cell = wk.find(c=>c);
      let label = '';
      if(cell){ const mo = +cell.date.slice(5,7)-1; if(mo!==lastMon){ label = MON[mo]; lastMon = mo; } }
      return e('div',{ key:wi, style:{ width:13, fontFamily:"'Silkscreen'", fontSize:7, color:'var(--ink-faint)', textAlign:'left' } }, label);
    });
    const fmt = (d)=>{ const mo=+d.slice(5,7)-1, day=+d.slice(8,10); return MON[mo]+' '+day; };
    return e('div',{},
      e('div',{ style:{ display:'flex', gap:2, marginBottom:2, paddingLeft:0 } }, monthRow),
      e('div',{ className:'commit' },
        grid.map((wk,wi)=> e('div',{ className:'wk', key:wi },
          wk.map((c,di)=> c
            ? e('div',{ key:di, className:'cl l'+lvl(c.count),
                title: fmt(c.date)+(c.count? ('  \u00b7  '+c.count+' solved') : '  \u00b7  no solves') })
            : e('div',{ key:di, className:'cl', style:{ opacity:0 } }))))
      ),
      e('div',{ style:{ display:'flex', alignItems:'center', gap:6, marginTop:8, fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } },
        'less',
        [0,1,2,3,4].map(l=> e('div',{ key:l, className:'cl l'+l })),
        'more',
        e('span',{ style:{ marginLeft:'auto' } }, 'hover a day'))
    );
  }

  function TrainerCard(){
    const st = window.useStore();
    const D = window.Derived;
    const [detail, setDetail] = useState(null);
    const power = D.teamPower();
    const mult = D.teamMultiplier();
    const streak = D.streakInfo();
    const counts = D.solvedCounts();
    const byId = Object.fromEntries(st.owned.map(o=>[o.iid,o]));
    const team = st.team.map(iid=>byId[iid]).filter(Boolean);

    const cats = D.categoryStats().filter(c=>c.count>0);
    const strong = [...cats].sort((a,b)=> b.solved-a.solved || b.pct-a.pct).slice(0,3);
    const weak = [...cats].sort((a,b)=> a.pct-b.pct || a.solved-b.solved).slice(0,3);

    const TopicRow = (c, kind)=> e('div',{ key:c.id, style:{ display:'flex', alignItems:'center', gap:8, marginBottom:6 } },
      e('span',{ style:{ flex:1, fontSize:13, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, c.name),
      e('div',{ className:'minibar', style:{ width:54 } }, e('i',{ style:{ width:(c.pct*100)+'%', background: kind==='weak'?'var(--medium)':'var(--sage-deep)' } })),
      e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', width:30, textAlign:'right' } }, c.solved+'/'+c.count)
    );

    return e('div',{ className:'panel', style:{ ...colStyle, gap:0 } },
      detail ? e(window.MonDetailModal,{ iid:detail, onClose:()=>setDetail(null) }) : null,
      e('div',{ style:scrollBody },
        // header
        e('div',{ style:{ display:'flex', gap:12, alignItems:'center', marginBottom:12 } },
          e('div',{ style:{ width:78, height:78, borderRadius:12, background:'var(--lav-lite)', border:'3px solid var(--lav-deep)', overflow:'hidden', flex:'none', boxShadow:'inset 0 2px 0 rgba(255,255,255,.4), 0 3px 0 rgba(124,90,61,.18)' } },
            e('img',{ src:'assets/PokeAvatar.png', alt:'Trainer avatar', draggable:false,
              style:{ width:'100%', height:'100%', objectFit:'cover', imageRendering:'pixelated', display:'block' } })),
          e('div',{ style:{ flex:1 } },
            e('div',{ className:'pixel-font', style:{ fontSize:15, color:'var(--wood-dark)' } }, st && window.DATA.TRAINER.name),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, window.DATA.TRAINER.title),
            e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', marginTop:2 } }, `since ${window.DATA.TRAINER.joined}`))
        ),
        // stat tiles
        e('div',{ style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 } },
          e('div',{ className:'stile', style:{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:10, textAlign:'left' } },
            e('div',{ style:{ flex:1 } },
              e('div',{ className:'lab' }, 'Team Fighting Power'),
              e('div',{ className:'val', style:{ fontSize:24 } }, power.toLocaleString())),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:'var(--sage-deep)', textAlign:'right' } },
              e('div',{}, '\u00d7'+mult.toFixed(2)), e('div',{ style:{ color:'var(--ink-faint)', marginTop:3 } }, 'team mult'))),
          e('div',{ className:'stile' }, e('div',{ className:'lab' }, 'Shards'),
            e('div',{ className:'val', style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, color:'var(--shard-deep)' } }, e(Shard,{size:14}), st.shards.toLocaleString())),
          e('div',{ className:'stile' }, e('div',{ className:'lab' }, 'Coins'),
            e('div',{ className:'val', style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, color:'var(--coin-deep)' } }, e(Coin,{size:14}), st.coins.toLocaleString()))
        ),
        e('div',{ style:{ display:'flex', gap:8, marginTop:0 } },
          e('div',{ className:'stile', style:{ flex:1 } }, e('div',{ className:'lab' }, 'Streak'), e('div',{ className:'val', style:{fontSize:14} }, streak.current+'d'),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop:2 } }, 'best '+streak.best)),
          e('div',{ className:'stile', style:{ flex:1 } }, e('div',{ className:'lab' }, 'Solved'), e('div',{ className:'val', style:{fontSize:14} }, counts.total),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop:2 } }, `${counts.easy}/${counts.med}/${counts.hard}`))),
        // team strip
        e('div',{ className:'panel-title', style:{ marginTop:14, alignItems:'center' } }, e('span',{className:'dot'}), 'Active Team',
          e('span',{ style:{ marginLeft:'auto', fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', textTransform:'none', letterSpacing:0 } }, 'tap for details →')),
        e('div',{ style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:6 } },
          team.map(m=>{
            const sp = window.PixelMon.byId(m.sp);
            const need = window.Derived.expToNext(m.level);
            const evoReady = (sp.evo||sp.id==='eevee') && (m.copies||0) >= window.PixelMon.EVO_COPIES;
            const megaCap = window.PixelMon.canTransform(sp);
            return e('button',{ key:m.iid, className:'chip-card team-chip', onClick:()=>setDetail(m.iid),
                style:{ padding:'7px 4px 6px', textAlign:'center', cursor:'pointer', position:'relative', font:'inherit', width:'100%' } },
              evoReady ? e('span',{ title:'Ready to evolve', style:{ position:'absolute', top:-6, right:-5, width:16, height:16, borderRadius:'50%', background:'var(--sage-deep)', color:'#fff', fontFamily:"'Silkscreen'", fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff', boxShadow:'0 0 6px var(--sage)' } }, '↑')
                : (megaCap && !m.form) ? e('span',{ title:'Can Mega-Evolve', style:{ position:'absolute', top:-5, right:-4, width:13, height:13, borderRadius:'50%', background:'var(--lav)', border:'2px solid #fff' } })
                : null,
              e(Creature,{ inst:m, size:42, bob:true }),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, (m.shiny||m.form?'\u2728':'')+sp.name),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginBottom:3 } }, 'Lv'+m.level+' \u00b7 \u2694'+window.Derived.monPower(m)),
              e('div',{ className:'expbar' }, e('i',{ style:{ width:Math.round(m.exp/need*100)+'%' } })));
          })
        ),
        // commit grid
        e('div',{ className:'panel-title', style:{ marginTop:14 } }, e('span',{className:'dot'}), 'Training Log'),
        e('div',{ className:'chip-card', style:{ padding:'10px 10px 8px' } }, e(CommitGrid)),
        // strong / weak
        e('div',{ className:'panel-title', style:{ marginTop:14 } }, e('span',{className:'dot'}), 'Strongest Topics'),
        strong.map(c=>TopicRow(c,'strong')),
        e('div',{ className:'panel-title', style:{ marginTop:10 } }, e('span',{className:'dot', style:{background:'var(--medium)'}}), 'Needs Training'),
        weak.map(c=>TopicRow(c,'weak'))
      )
    );
  }

  // ---------- layout constants ----------
  const colStyle = { display:'flex', flexDirection:'column', height:'100%', minHeight:0 };
  const scrollBody = { flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', paddingRight:4 };

  function Dashboard(){
    const [sel, setSel] = useState('arrays');
    return e('div',{ style:{ display:'grid', gridTemplateColumns:'258px 1fr 318px', gap:14, height:'100%', minHeight:0 } },
      e(CategoryMenu,{ sel, setSel }),
      e(ProblemList,{ catId:sel }),
      e(TrainerCard)
    );
  }

  window.Dashboard = Dashboard;
})();

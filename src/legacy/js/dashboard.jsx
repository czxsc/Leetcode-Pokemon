/* =====================================================================
   Dashboard page — left tag menu / center problem list (create, edit,
   paste solutions, claim rewards) / right trainer card with power,
   streak commit grid and strong-weak topics.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useEffect, useRef, useState } = React;
  const Catalog = window.Catalog;
  const ALL = '__all';
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ---------- layout constants ----------
  const colStyle = { display:'flex', flexDirection:'column', height:'100%', minHeight:0 };
  const scrollBody = { flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', paddingRight:4 };
  const hintStyle = { fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginBottom:14 };
  const ellipsis = { overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' };

  // ---------- LEFT: tag menu ----------
  function NewTagModal({ onClose, onCreate }){
    const [name,setName] = useState('');
    const slug = Catalog.slugify(name, 40);
    function add(){ if(!slug) return; onCreate(name.trim()); }
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation() },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'New Tag'),
        e('div',{ className:'field' }, e('label',{},'Tag name'),
          e('input',{ value:name, autoFocus:true, maxLength:40, placeholder:'e.g. Union Find',
            onChange:(ev)=>setName(ev.target.value), onKeyDown:(ev)=>ev.key==='Enter'&&add() })),
        e('div',{ style:hintStyle },
          'Tags group your problems and feed your topic stats. Each tag gets its own folder of solutions: ',
          e('b',{}, 'solutions/'+(slug||'tag-name')+'/'), '.'),
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end' } },
          e('button',{ className:'btn', onClick:onClose }, 'Cancel'),
          e('button',{ className:'btn green', disabled:!slug, onClick:add }, 'Create'))
      )
    );
  }

  function TagItem({ item, active, onSelect, onDelete }){
    return e('button',{ className:'cat-item'+(active?' active':'')+(item.count?'':' empty'), onClick:onSelect,
        style:{ width:'100%', textAlign:'left', background: active?undefined:'transparent', border:'2px solid '+(active?'var(--sage-deep)':'transparent') } },
      e('div',{ style:{ flex:1, minWidth:0 } },
        e('div',{ style:{ display:'flex', alignItems:'center', gap:6 } },
          e('span',{ className:'cname', style:ellipsis }, item.name),
          item.custom ? e('span',{ className:'type-tag', style:{ background:'var(--lav)', color:'#fff', fontSize:7, padding:'1px 4px' } }, 'MINE') : null,
          e('span',{ className:'ccount', style:{ marginLeft:'auto' } }, item.solved+'/'+item.count)),
        e('div',{ className:'minibar', style:{ marginTop:5 } },
          e('i',{ style:{ width:(item.pct*100)+'%' } }))
      ),
      onDelete ? e('span',{ title:'Delete tag', onClick:(ev)=>{ ev.stopPropagation(); onDelete(); },
        style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--ink-faint)', cursor:'pointer', padding:'0 2px' } }, '×') : null
    );
  }

  function TagMenu({ sel, setSel }){
    const st = window.useStore();                       // re-render when tags/problems change
    const stats = window.Derived.tagStats();
    const [modal, setModal] = useState(false);
    const solved = st.problems.filter(window.Store.isSolved).length;
    const all = { id:ALL, name:'All Problems', solved, count:st.problems.length, pct: st.problems.length?solved/st.problems.length:0 };

    function removeTag(tag){
      const note = tag.count ? ` It will be removed from ${tag.count} problem${tag.count===1?'':'s'} (the problems stay).` : '';
      if(!window.confirm(`Delete the tag "${tag.name}"?${note}`)) return;
      if(sel===tag.id) setSel(ALL);
      window.Store.removeTag(tag.id);
    }

    return e('div',{ className:'panel', style:colStyle },
      modal ? e(NewTagModal,{ onClose:()=>setModal(false),
        onCreate:(name)=>{ const id=window.Store.addTag(name); setModal(false); if(id) setSel(id); } }) : null,
      e('div',{ style:{ display:'flex', alignItems:'center', marginBottom:10 } },
        e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}), 'Tags'),
        e('button',{ className:'iconbtn', onClick:()=>setModal(true) }, '+ Tag')),
      e('div',{ style:scrollBody },
        e(TagItem,{ item:all, active:sel===ALL, onSelect:()=>setSel(ALL) }),
        e('div',{ style:{ height:1, background:'var(--card-line)', margin:'4px 6px 8px' } }),
        stats.map(c=> e(TagItem,{ key:c.id, item:c, active:sel===c.id, onSelect:()=>setSel(c.id),
          onDelete: c.custom ? ()=>removeTag(c) : null }))
      )
    );
  }

  // ---------- problem editor ----------
  function ProblemEditor({ problem, defaultTag, onClose, onSaved }){
    const st = window.useStore();
    const [start] = useState(()=>({
      title: problem ? problem.title : '',
      difficulty: problem ? problem.difficulty : 'Medium',
      tags: problem ? problem.tags : (defaultTag ? [defaultTag] : []),
      language: problem ? problem.language : st.preferredLanguage,
      url: problem ? problem.url : '',
      code: problem ? problem.code : '',
    }));
    const [title, setTitle] = useState(start.title);
    const [difficulty, setDifficulty] = useState(start.difficulty);
    const [tags, setTags] = useState(start.tags);
    const [newTags, setNewTags] = useState([]);          // typed here; created on save
    const [tagDraft, setTagDraft] = useState('');
    const [language, setLanguage] = useState(start.language);
    const [url, setUrl] = useState(start.url);
    const [code, setCode] = useState(start.code);

    const allTags = window.Store.tags().concat(newTags);
    const slug = Catalog.slugify(title);
    const clash = slug ? st.problems.find(p=> p.id!==(problem && problem.id) && Catalog.slugify(p.title)===slug) : null;
    const canSave = !!title.trim() && !clash;
    const lang = Catalog.languageById(language);
    const dirty = JSON.stringify({ title, difficulty, tags, language, url, code }) !== JSON.stringify(start);

    function toggleTag(id){ setTags(tags.includes(id) ? tags.filter(t=>t!==id) : [...tags, id]); }
    function addDraftTag(){
      const name = Catalog.oneLine(tagDraft).slice(0,40);
      const id = Catalog.slugify(name, 40);
      if(!id) return;
      if(!allTags.some(t=>t.id===id)) setNewTags([...newTags, { id, name, custom:true }]);
      if(!tags.includes(id)) setTags([...tags, id]);
      setTagDraft('');
    }
    function save(){
      if(!canSave) return;
      const ids = tags.filter(id=> allTags.some(t=>t.id===id)).map(id=>{
        const created = newTags.find(t=>t.id===id);
        return created ? window.Store.addTag(created.name) : id;
      }).filter(Boolean);
      const fields = { title, difficulty, tags:ids, language, url, code };
      if(problem){ window.Store.updateProblem(problem.id, fields); onSaved(problem.id); }
      else onSaved(window.Store.createProblem(fields));
    }
    function cancel(){ if(!dirty || window.confirm('Discard your changes to this problem?')) onClose(); }
    function onCodeKey(ev){
      if(ev.key==='Enter' && (ev.ctrlKey || ev.metaKey)){ ev.preventDefault(); save(); return; }
      if(ev.key!=='Tab' || ev.shiftKey) return;
      ev.preventDefault();
      const el = ev.target, from = el.selectionStart, to = el.selectionEnd;
      setCode(code.slice(0,from)+'    '+code.slice(to));
      requestAnimationFrame(()=>{ el.selectionStart = el.selectionEnd = from+4; });
    }

    const folders = tags.length ? tags : [Catalog.UNTAGGED_FOLDER];
    const fileName = (slug||'problem-name')+'.'+lang.ext;
    const where = !code.trim()
      ? 'No solution yet? Save it anyway and it stays on your list as a to-do.'
      : window.Persistence.mode!=='disk'
        ? 'In the full version (clone it from GitHub), your solution is also saved as a file in a folder for each tag.'
        : ['Your solution will be saved to ', e('b',{ key:'p' }, 'solutions/'+folders[0]+'/'+fileName),
           folders.length>1 ? ` and ${folders.length-1} more tag folder${folders.length===2?'':'s'}.` : '.'];

    return e('div',{ className:'modal-veil' },
      e('div',{ className:'panel modal editor', onClick:(ev)=>ev.stopPropagation() },
        e('button',{ className:'modal-x', title:'Close', onClick:cancel }, '×'),
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), problem ? 'Edit Problem' : 'New Problem'),
        e('div',{ style:{ display:'flex', gap:12 } },
          e('div',{ className:'field', style:{ flex:1 } }, e('label',{},'Title'),
            e('input',{ value:title, autoFocus:!problem, maxLength:120, placeholder:'e.g. Two Sum',
              onChange:(ev)=>setTitle(ev.target.value) })),
          e('div',{ className:'field' }, e('label',{},'Difficulty'),
            e('div',{ className:'seg' }, Catalog.DIFFICULTIES.map(d=> e('button',{ key:d, type:'button',
              className:'seg-btn '+d.toLowerCase()+(difficulty===d?' on':''), onClick:()=>setDifficulty(d) }, d))))),
        clash ? e('div',{ className:'form-error' }, `You already have “${clash.title}” — edit that one instead.`) : null,
        e('div',{ style:{ display:'flex', gap:12 } },
          e('div',{ className:'field', style:{ flex:1 } }, e('label',{},'Link (optional)'),
            e('input',{ value:url, placeholder:'https://leetcode.com/problems/two-sum/', onChange:(ev)=>setUrl(ev.target.value) })),
          e('div',{ className:'field', style:{ width:160 } }, e('label',{},'Language'),
            e('select',{ value:language, onChange:(ev)=>setLanguage(ev.target.value) },
              Catalog.LANGUAGES.map(l=> e('option',{ key:l.id, value:l.id }, l.name))))),
        e('div',{ className:'field' }, e('label',{},'Tags'),
          e('div',{ className:'tag-picker' },
            allTags.map(t=> e('button',{ key:t.id, type:'button', className:'tag-toggle'+(tags.includes(t.id)?' on':''),
              onClick:()=>toggleTag(t.id) }, t.name))),
          e('div',{ style:{ display:'flex', gap:8, marginTop:6 } },
            e('input',{ value:tagDraft, maxLength:40, placeholder:'New tag…', style:{ flex:1 },
              onChange:(ev)=>setTagDraft(ev.target.value),
              onKeyDown:(ev)=>{ if(ev.key==='Enter'){ ev.preventDefault(); addDraftTag(); } } }),
            e('button',{ className:'iconbtn', type:'button', disabled:!Catalog.slugify(tagDraft,40), onClick:addDraftTag }, '+ Add Tag'))),
        e('div',{ className:'field' }, e('label',{},'Solution'),
          e('textarea',{ className:'code-input', value:code, spellCheck:false, rows:7,
            placeholder:'Paste your accepted solution here…',
            onChange:(ev)=>setCode(ev.target.value), onKeyDown:onCodeKey })),
        e('div',{ style:{ ...hintStyle, marginBottom:12 } }, where),
        e('div',{ style:{ display:'flex', gap:10, justifyContent:'flex-end', alignItems:'center' } },
          e('span',{ style:{ flex:1, fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } }, 'Ctrl+Enter to save'),
          e('button',{ className:'btn', onClick:cancel }, 'Cancel'),
          e('button',{ className:'btn green', disabled:!canSave, onClick:save }, problem ? 'Save' : 'Add Problem'))
      )
    );
  }

  // ---------- data / backups ----------
  function DataModal({ onClose }){
    const status = window.usePersistenceStatus();
    const [msg,setMsg] = useState(null);
    const fileRef = useRef(null);
    const disk = status.mode==='disk';

    function exportBackup(){
      try{
        const blob = new Blob([window.Store.exportData()], { type:'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pokeleet-backup-${window.Store.TODAY}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setMsg({ ok:true, text:'Backup exported — it has your problems, solutions and game progress.' });
      }catch(err){
        setMsg({ ok:false, text:err.message||'Could not export backup.' });
      }
    }
    function importBackup(ev){
      const file = ev.target.files && ev.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        try{
          window.Store.importData(String(reader.result||''));
          setMsg({ ok:true, text:'Backup imported successfully.' });
        }catch(err){
          setMsg({ ok:false, text:err.message||'Could not import backup.' });
        }
      };
      reader.onerror = ()=> setMsg({ ok:false, text:'Could not read the selected backup file.' });
      reader.readAsText(file);
      ev.target.value = '';
    }
    function askImport(){
      if(window.confirm('Importing a backup replaces your current problems and progress. Continue?')) fileRef.current && fileRef.current.click();
    }

    const saved = status.savedAt ? new Date(status.savedAt).toLocaleTimeString() : null;
    return e('div',{ className:'modal-veil', onClick:onClose },
      e('div',{ className:'panel modal', onClick:(ev)=>ev.stopPropagation() },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Your Data'),
        e('div',{ className:'chip-card', style:{ padding:'12px 14px', marginBottom:14 } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color: status.state==='saved'?'var(--sage-deep)':'var(--hard)', marginBottom:8 } },
            status.state!=='saved' ? '✖ Not saving right now'
              : disk ? '✔ Saved to disk automatically' : '✔ Saved in this browser (demo)'),
          disk
            ? e('div',{},
                e('div',{ className:'data-path' }, status.location),
                e('div',{ style:{ ...hintStyle, marginBottom:0, marginTop:8 } },
                  'progress.json and library.json hold everything. Solved problems are also written to ',
                  e('b',{},'solutions/<tag>/'), ' — one folder per tag — and a daily copy of your data is kept in ',
                  e('b',{},'backups/'), '.'))
            : e('div',{ style:{ ...hintStyle, marginBottom:0 } },
                'This is the online demo, so your progress is kept in this browser only. To save progress and a folder of your solutions on your own computer, clone PokéLeet from ',
                window.AppConfig.repoUrl ? e('a',{ href:window.AppConfig.repoUrl, target:'_blank', rel:'noopener noreferrer' }, 'GitHub') : 'GitHub',
                ' and run it with ', e('b',{},'npm start'), '.'),
          saved ? e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginTop:8 } }, 'last saved '+saved) : null,
          status.error ? e('div',{ style:{ fontSize:13, color:'var(--hard)', marginTop:8 } }, status.error) : null),
        e('div',{ style:hintStyle }, 'Backups are a single JSON file you can keep anywhere or import on another computer.'),
        e('div',{ style:{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' } },
          e('button',{ className:'btn', type:'button', onClick:exportBackup }, 'Export Backup'),
          e('button',{ className:'btn', type:'button', onClick:askImport }, 'Import Backup'),
          e('input',{ ref:fileRef, type:'file', accept:'application/json,.json', onChange:importBackup, style:{ display:'none' } })),
        msg ? e('div',{ style:{ fontSize:13, color: msg.ok?'var(--sage-deep)':'var(--hard)', marginBottom:12, fontFamily:"'Silkscreen'", lineHeight:1.5 } }, (msg.ok?'✔ ':'✖ ')+msg.text) : null,
        e('div',{ style:{ display:'flex', justifyContent:'flex-end' } },
          e('button',{ className:'btn', onClick:onClose }, 'Close'))
      )
    );
  }

  // ---------- CENTER: problem list ----------
  function ProblemRow({ p, open, onToggle, onEdit, hideTag, tagById }){
    const [confirmDelete, setConfirmDelete] = useState(false);
    const headRef = useRef(null);
    // e.g. a problem you just added: bring it into view when it opens
    useEffect(()=>{ if(open && headRef.current) headRef.current.scrollIntoView({ block:'nearest' }); }, [open]);
    const solved = window.Store.isSolved(p);
    const hasCode = !!p.code.trim();
    const amount = window.DATA.SHARD_BY_DIFF[p.difficulty];
    const lang = Catalog.languageById(p.language);
    const tagNames = p.tags.filter(id=> id!==hideTag && tagById[id]).map(id=> tagById[id].name);
    const paths = window.Persistence.mode==='disk' ? window.Store.solutionPaths(p.id) : [];

    return e('div',{ className:'prow'+(open?' open':'')+(solved?'':' unsolved') },
      e('div',{ ref:headRef, className:'prow-head', style:{ cursor:'pointer' }, onClick:onToggle },
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color: solved?'var(--sage-deep)':'var(--ink-faint)', width:14 } }, solved?'✔':'○'),
        e('span',{ className:'nm', title:p.title }, p.title,
          solved?null:e('span',{className:'lock'},'· to do')),
        tagNames.slice(0,2).map(n=> e('span',{ key:n, className:'tag-chip' }, n)),
        tagNames.length>2 ? e('span',{ className:'tag-chip', title:tagNames.slice(2).join(', ') }, '+'+(tagNames.length-2)) : null,
        p.claimed ? e(Shard,{ size:15, style:{ marginRight:2 } }) : null,
        e('span',{ className:'pill '+p.difficulty.toLowerCase() }, p.difficulty),
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color:'var(--ink-faint)', width:14, textAlign:'center' } }, open?'▾':'▸')
      ),
      open ? e('div',{ className:'code-wrap fade-in' },
        hasCode ? e(CodeBlock,{ code:p.code, language:p.language })
          : e('div',{ className:'code-empty' },
              e('div',{}, solved ? 'Marked solved, but no solution is saved for it yet.'
                : 'No solution yet — paste yours to mark this problem solved and unlock its Shard reward.'),
              e('button',{ className:'btn lav', style:{ fontSize:10, padding:'7px 12px', marginTop:10 }, onClick:onEdit }, '+ Add Solution')),
        solved ? e('div',{ className:'code-bar' },
          e('button',{ className:'coin'+(p.claimed?' claimed':''), title: p.claimed?'Claimed':'Claim reward',
            onClick:()=> window.Store.claimProblem(p.id) }, p.claimed?'♦':'?'),
          e('span',{ className:'earn' }, p.claimed ? 'Shards claimed · +1 EXP to team' : `Claim +${amount} Shards`),
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--shard-lite)' } }, 'Solved'),
          e('input',{ type:'date', value: p.solvedAt || '', max: window.Store.TODAY,
            onChange:(ev)=> window.Store.setSolveDate(p.id, ev.target.value),
            title:'Date this problem was solved — feeds your Training Log',
            style:{ fontFamily:"'Silkscreen'", fontSize:11, padding:'4px 6px', borderRadius:6, border:'2px solid var(--lav-deep)',
              background:'#efeaf6', color:'#3a3147', colorScheme:'light' } })
        ) : null,
        e('div',{ className:'code-meta' },
          e('span',{ className:'lang' }, lang.name),
          paths.length ? e('span',{ className:'path', title:paths.map(x=>'solutions/'+x).join('\n') },
            'solutions/'+paths[0]+(paths.length>1?`  +${paths.length-1} more`:'')) : null,
          e('span',{ style:{ flex:1 } }),
          p.url ? e('a',{ className:'meta-btn', href:p.url, target:'_blank', rel:'noopener noreferrer' }, 'Open ↗') : null,
          confirmDelete
            ? [ e('span',{ key:'q', className:'lang' }, 'Delete?'),
                e('button',{ key:'y', className:'meta-btn danger', onClick:()=>window.Store.deleteProblem(p.id) }, 'Yes'),
                e('button',{ key:'n', className:'meta-btn', onClick:()=>setConfirmDelete(false) }, 'No') ]
            : [ e('button',{ key:'e', className:'meta-btn', onClick:onEdit }, 'Edit'),
                e('button',{ key:'d', className:'meta-btn danger', onClick:()=>setConfirmDelete(true) }, 'Delete') ])
      ) : null
    );
  }

  function EmptyList({ tag, query, onNew }){
    const st = window.useStore();
    let text;
    if(query) text = `No problems match “${query}”.`;
    else if(st.problems.length && tag) text = `Nothing tagged ${tag.name} yet.`;
    else text = 'No problems yet! Solved something on LeetCode? Add it here with your solution and claim Shards for the gacha.';
    return e('div',{ style:{ textAlign:'center', padding:'40px 24px', color:'var(--ink-faint)' } },
      e('div',{ style:{ display:'inline-block', marginBottom:12 } }, e(Pokeball,{ size:40 })),
      e('div',{ style:{ fontSize:15, lineHeight:1.5, maxWidth:360, margin:'0 auto 16px' } }, text),
      query ? null : e('button',{ className:'btn green', onClick:onNew }, '+ New Problem'));
  }

  function ProblemList({ tagId }){
    const st = window.useStore();
    const tags = window.Store.tags();
    const tagById = Object.fromEntries(tags.map(t=>[t.id,t]));
    const tag = tagById[tagId] || null;
    const [query, setQuery] = useState('');
    const [openId, setOpenId] = useState(null);
    const [modal, setModal] = useState(null);           // 'data' | { problem? }
    const inTag = tag ? st.problems.filter(p=> p.tags.includes(tag.id)) : st.problems;
    const q = query.trim().toLowerCase();
    const probs = (q ? inTag.filter(p=> p.title.toLowerCase().includes(q)) : inTag)
      .slice().sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt)));
    const solvedN = inTag.filter(window.Store.isSolved).length;
    const openEditor = (problem)=> setModal({ problem });

    return e('div',{ className:'panel card', style:colStyle },
      modal==='data' ? e(DataModal,{ onClose:()=>setModal(null) }) : null,
      modal && modal!=='data' ? e(ProblemEditor,{ problem:modal.problem, defaultTag: tag && tag.id,
        onClose:()=>setModal(null), onSaved:(id)=>{ setModal(null); setOpenId(id); } }) : null,
      e('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 } },
        e('div',{ style:{ flex:1, minWidth:0 } },
          e('div',{ className:'pixel-font', style:{ fontSize:17, color:'var(--wood-dark)', ...ellipsis } }, tag ? tag.name : 'All Problems'),
          e('div',{ style:{ fontSize:14, color:'var(--ink-faint)', marginTop:3 } },
            `${solvedN} solved · ${inTag.length} total`)),
        e('input',{ className:'search-input', value:query, placeholder:'Search…', onChange:(ev)=>setQuery(ev.target.value) }),
        e('button',{ className:'iconbtn', onClick:()=>openEditor(null) }, '+ New Problem'),
        e('button',{ className:'iconbtn', title:'Where your data is saved, backups', onClick:()=>setModal('data') }, 'Data')
      ),
      e('div',{ style:scrollBody },
        probs.length === 0 ? e(EmptyList,{ tag, query:query.trim(), onNew:()=>openEditor(null) })
          : [
            ...probs.map(p=> e(ProblemRow,{ key:p.id, p, tagById, hideTag: tag && tag.id,
              open: openId===p.id, onToggle:()=>setOpenId(openId===p.id?null:p.id), onEdit:()=>openEditor(p) })),
            e('div',{ key:'end', style:{ textAlign:'center', padding:'12px 0 4px', fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } },
              '— end of list —')
          ]
      )
    );
  }

  // ---------- RIGHT: trainer card ----------
  function CommitGrid(){
    const { grid } = window.Derived.trainingGrid(18);
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
                title: fmt(c.date)+(c.count? ('  ·  '+c.count+' solved') : '  ·  no solves') })
            : e('div',{ key:di, className:'cl', style:{ opacity:0 } }))))
      ),
      e('div',{ style:{ display:'flex', alignItems:'center', gap:6, marginTop:8, fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)' } },
        'less',
        [0,1,2,3,4].map(l=> e('div',{ key:l, className:'cl l'+l })),
        'more',
        e('span',{ style:{ marginLeft:'auto' } }, 'hover a day'))
    );
  }

  function TrainerName({ name }){
    const [draft, setDraft] = useState(null);           // null = not editing
    const skipBlur = useRef(false);
    if(draft===null){
      return e('button',{ className:'trainer-name pixel-font', title:'Rename your trainer', onClick:()=>setDraft(name) },
        name, e('span',{ className:'pencil' }, '✎'));
    }
    function commit(){
      if(skipBlur.current){ skipBlur.current = false; return; }
      window.Store.setTrainerName(draft); setDraft(null);
    }
    return e('input',{ className:'trainer-name-input', value:draft, autoFocus:true, maxLength:24,
      onChange:(ev)=>setDraft(ev.target.value), onBlur:commit,
      onKeyDown:(ev)=>{
        if(ev.key==='Enter') ev.target.blur();
        if(ev.key==='Escape'){ skipBlur.current = true; setDraft(null); }
      } });
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
    const since = st.createdAt ? 'since '+MON[+st.createdAt.slice(5,7)-1]+' '+st.createdAt.slice(0,4) : '';

    // strongest = most solved; needs training = fewest solved (catalog order breaks ties)
    const stats = D.tagStats();
    const maxSolved = Math.max(1, ...stats.map(c=>c.solved));
    const strong = stats.filter(c=>c.solved>0).sort((a,b)=> b.solved-a.solved).slice(0,3);
    const weak = stats.filter(c=>!strong.includes(c)).sort((a,b)=> a.solved-b.solved).slice(0,3);

    const TopicRow = (c, kind)=> e('div',{ key:c.id, style:{ display:'flex', alignItems:'center', gap:8, marginBottom:6 } },
      e('span',{ style:{ flex:1, fontSize:13, color:'var(--ink)', ...ellipsis } }, c.name),
      e('div',{ className:'minibar', style:{ width:54 } }, e('i',{ style:{ width:(c.solved/maxSolved*100)+'%', background: kind==='weak'?'var(--medium)':'var(--sage-deep)' } })),
      e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', width:30, textAlign:'right' } }, c.solved)
    );

    return e('div',{ className:'panel', style:{ ...colStyle, gap:0 } },
      detail ? e(window.MonDetailModal,{ iid:detail, onClose:()=>setDetail(null) }) : null,
      e('div',{ style:scrollBody },
        // header
        e('div',{ style:{ display:'flex', gap:12, alignItems:'center', marginBottom:12 } },
          e('div',{ style:{ width:78, height:78, borderRadius:12, background:'var(--lav-lite)', border:'3px solid var(--lav-deep)', overflow:'hidden', flex:'none', boxShadow:'inset 0 2px 0 rgba(255,255,255,.4), 0 3px 0 rgba(124,90,61,.18)' } },
            e('img',{ src:window.AppAssets && window.AppAssets.pokeAvatar, alt:'Trainer avatar', draggable:false,
              style:{ width:'100%', height:'100%', objectFit:'cover', imageRendering:'pixelated', display:'block' } })),
          e('div',{ style:{ flex:1, minWidth:0 } },
            e(TrainerName,{ name:st.trainer.name }),
            e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:3 } }, 'LeetCode Trainer'),
            e('div',{ style:{ fontSize:12, color:'var(--ink-faint)', marginTop:2 } }, since))
        ),
        // stat tiles
        e('div',{ style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 } },
          e('div',{ className:'stile', style:{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:10, textAlign:'left' } },
            e('div',{ style:{ flex:1 } },
              e('div',{ className:'lab' }, 'Team Fighting Power'),
              e('div',{ className:'val', style:{ fontSize:24 } }, power.toLocaleString())),
            e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:10, color:'var(--sage-deep)', textAlign:'right' } },
              e('div',{}, '×'+mult.toFixed(2)), e('div',{ style:{ color:'var(--ink-faint)', marginTop:3 } }, 'team mult'))),
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
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink)', marginTop:2, ...ellipsis } }, (m.shiny||m.form?'✨':'')+sp.name),
              e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:8, color:'var(--ink-faint)', marginBottom:3 } }, 'Lv'+m.level+' · ⚔'+window.Derived.monPower(m)),
              e('div',{ className:'expbar' }, e('i',{ style:{ width:Math.round(m.exp/need*100)+'%' } })));
          })
        ),
        // commit grid
        e('div',{ className:'panel-title', style:{ marginTop:14 } }, e('span',{className:'dot'}), 'Training Log'),
        e('div',{ className:'chip-card', style:{ padding:'10px 10px 8px' } }, e(CommitGrid)),
        // strong / weak
        e('div',{ className:'panel-title', style:{ marginTop:14 } }, e('span',{className:'dot'}), 'Strongest Topics'),
        strong.length ? strong.map(c=>TopicRow(c,'strong'))
          : e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginBottom:6 } }, 'Solve a few problems to see your best topics.'),
        e('div',{ className:'panel-title', style:{ marginTop:10 } }, e('span',{className:'dot', style:{background:'var(--medium)'}}), 'Needs Training'),
        weak.map(c=>TopicRow(c,'weak'))
      )
    );
  }

  function Dashboard(){
    const [sel, setSel] = useState(ALL);
    return e('div',{ style:{ display:'grid', gridTemplateColumns:'258px minmax(0,1fr) 318px', gap:14, height:'100%', minHeight:0 } },
      e(TagMenu,{ sel, setSel }),
      e(ProblemList,{ tagId:sel }),
      e(TrainerCard)
    );
  }

  window.Dashboard = Dashboard;
})();

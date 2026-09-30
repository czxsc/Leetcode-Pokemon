/* =====================================================================
   Quests — two tabs.
   Daily: log in, solve problems, daily refresher, and Focus time on
   LeetCode. Solve and Focus are step chains: claiming a step moves the
   quest up to its next, bigger goal (stars show the step). Claims grant
   Shards once per step per day.
   Progression: six chapters of one-time quests (js/chapters.jsx); a
   chapter opens once every quest in the one before it is claimed.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;

  const claimedToday = (s)=> s.problems.filter(p=> p.claimedAt===window.Store.TODAY).length;
  const focusMinutesToday = (s)=> Math.floor(s.meadow.studyToday/60000);
  const step = (name, desc, goal, reward)=> ({ name, desc, goal, reward });
  const QUESTS = [
    { id:'login', progress:()=>1, steps:[
      step('Log In', 'Open PokéLeet today.', 1, 50) ] },
    { id:'solve', progress:claimedToday, steps:[
      step('Solve 1 Problem',  'Claim shards on any problem.',   1, 100),
      step('Solve 3 Problems', 'Claim shards on three problems.', 3, 150),
      step('Solve 5 Problems', 'Claim shards on five problems.',  5, 250) ] },
    { id:'refresh', progress:(s)=>s.recallToday?1:0, steps:[
      step('Daily Refresher', 'Finish an Active Recall quiz.', 1, 150) ] },
    { id:'focus', unit:'min', progress:focusMinutesToday, steps:[
      [30,'30 Minutes',100], [60,'1 Hour',150], [90,'1.5 Hours',200], [120,'2 Hours',300],
    ].map(([m,label,reward])=> step('Focus '+label, 'Spend '+m+' minutes on LeetCode during Focus sessions.', m, reward)) },
  ];

  // where a quest chain stands today
  function questState(q, st){
    const claimed = Math.min(q.steps.length, Number(st.quests[q.id]) || 0);
    const done = claimed >= q.steps.length;
    const cur = q.steps[Math.min(claimed, q.steps.length-1)];
    const value = q.progress(st);
    // every step whose goal is reached but not yet claimed
    const ready = q.steps.slice(claimed).filter(s=> value >= s.goal);
    return { claimed, done, cur, prog:Math.min(cur.goal, value), met:!done && value >= cur.goal, ready };
  }

  function claimDaily(q, step, reward){
    window.Store.grantQuest(q.id, step, reward);
    const st = window.Store.get();
    if(QUESTS.every(x=> questState(x, st).done)) window.Store.markPerfectDay();
  }

  function Stars({ level, total }){
    return e('span',{ title:'Step '+level+' of '+total, style:{ fontSize:15, letterSpacing:1, lineHeight:1 } },
      Array.from({ length:total }).map((_,i)=> i<level
        ? e('span',{ key:i, style:{ color:'var(--coin-deep)' } }, '★')
        : e('span',{ key:i, style:{ color:'var(--ink-faint)', opacity:.6 } }, '☆')));
  }

  // one quest card (daily and progression): done = claimed for good, met = ready to claim
  function QuestCard({ name, badge, desc, prog, goal, unit, reward, done, met, locked, doneLabel, onClaim }){
    // locked quests keep their shape but hide the details until the chapter opens
    const hidden = locked ? { filter:'blur(5px)', userSelect:'none', pointerEvents:'none' } : null;
    return e('div',{ className:'chip-card', style:{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14,
        opacity: done?0.7:1, borderColor: met&&!locked?'var(--sage-deep)':'var(--card-line)' } },
      e('div',{ style:{ width:42, height:42, borderRadius:10, flex:'none', display:'flex', alignItems:'center', justifyContent:'center',
          background: done?'var(--sage)':met&&!locked?'var(--sage-lite)':'var(--cream-2)', border:'2px solid var(--card-line)' } },
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:16, color: done?'#fff':'var(--wood-dark)' } }, done?'✔':locked?'🔒':'★')),
      e('div',{ 'aria-hidden':locked||undefined, style:{ flex:1, minWidth:0, ...hidden } },
        e('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:4 } },
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)' } }, name), badge),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginBottom:7 } }, desc),
        e('div',{ style:{ display:'flex', alignItems:'center', gap:9 } },
          e('div',{ className:'minibar', style:{ flex:1, height:8 } }, e('i',{ style:{ width:(prog/goal*100)+'%', background:'var(--sage-deep)' } })),
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', whiteSpace:'nowrap' } },
            prog.toLocaleString()+'/'+goal.toLocaleString()+(unit?' '+unit:'')))
      ),
      e('div',{ 'aria-hidden':locked||undefined, style:{ textAlign:'center', flex:'none', width:96, ...hidden } },
        e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:7 } },
          e(Shard,{size:15}), e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--shard-deep)' } }, reward)),
        done
          ? e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--sage-deep)' } }, doneLabel)
          : e('button',{ className:'btn green', disabled:!met || locked, style:{ fontSize:10, padding:'7px 12px' }, onClick:onClaim }, 'Claim'))
    );
  }

  function DailyRow({ q, st }){
    const { claimed, done, cur, prog, met } = questState(q, st);
    const chain = q.steps.length > 1;
    return e(QuestCard,{ name:cur.name, desc:cur.desc, prog, goal:cur.goal, unit:q.unit, reward:cur.reward, done, met,
      badge: chain ? e(Stars,{ level:Math.min(claimed+1, q.steps.length), total:q.steps.length }) : null,
      doneLabel: chain ? 'COMPLETE' : 'CLAIMED', onClaim:()=> claimDaily(q, claimed, cur.reward) });
  }

  const listStyle = { display:'flex', flexDirection:'column', gap:10, flex:1, minHeight:0, overflowY:'auto', paddingRight:4 };
  const labelStyle = { fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginBottom:8 };
  function TabBar({ tab, setTab, readyCount }){
    return e('div',{ className:'seg seg-mini', style:{ width:280, flex:'none' } },
      [['daily','Daily'],['progress', readyCount ? `Progression · ${readyCount}` : 'Progression']].map(([id,label])=>
        e('button',{ key:id, type:'button', className:'seg-btn'+(tab===id?' on':''), onClick:()=>setTab(id) }, label)));
  }

  function DailySummary({ st }){
    const states = QUESTS.map(q=> questState(q, st));
    const total = QUESTS.reduce((n,q)=> n+q.steps.length, 0);
    const done = states.reduce((n,s)=> n+s.claimed, 0);
    const unclaimed = states.reduce((n,s)=> n+s.ready.reduce((r,x)=> r+x.reward, 0), 0);
    return [
      e('div',{ key:'t', className:'panel-title' }, e('span',{className:'dot'}), 'Today'),
      e('div',{ key:'b', style:{ textAlign:'center', padding:'12px 0' } },
        e('div',{ style:{ position:'relative', display:'inline-block' } },
          e('div',{ className: done<total?'pokeball-spin':'' }, e(Pokeball,{ size:72 }))),
        e('div',{ className:'pixel-font', style:{ fontSize:22, color:'var(--wood-dark)', marginTop:14 } }, done+' / '+total),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:5 } }, 'quest steps complete')),
      e('div',{ key:'u', className:'chip-card', style:{ padding:14, textAlign:'center' } },
        e('div',{ style:labelStyle }, 'UNCLAIMED REWARDS'),
        e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:7 } },
          e(Shard,{size:20}), e('span',{ className:'pixel-font', style:{ fontSize:20, color:'var(--shard-deep)' } }, unclaimed))),
    ];
  }

  function ChapterList({ chapters, sel, setSel }){
    const total = chapters.reduce((n,c)=> n+c.quests.length, 0);
    const done = chapters.reduce((n,c)=> n+c.done, 0);
    return [
      e('div',{ key:'t', className:'panel-title' }, e('span',{className:'dot'}), 'Chapters'),
      e('div',{ key:'o', className:'chip-card', style:{ padding:'12px 14px' } },
        e('div',{ style:{ display:'flex', justifyContent:'space-between', ...labelStyle } },
          e('span',{}, 'OVERALL'), e('span',{}, done+' / '+total)),
        e('div',{ className:'minibar', style:{ height:8 } }, e('i',{ style:{ width:(done/total*100)+'%', background:'var(--coin-deep)' } }))),
      e('div',{ key:'l', style:{ display:'flex', flexDirection:'column', gap:2, flex:1, minHeight:0, overflowY:'auto' } },
        chapters.map(c=> e('button',{ key:c.index, className:'cat-item'+(sel===c.index?' active':''), onClick:()=>setSel(c.index),
            style:{ opacity: c.open?1:0.6 } },
          e('span',{ className:'chapter-num'+(c.complete?' done':'') }, c.complete ? '✔' : c.open ? c.index+1 : '🔒'),
          e('div',{ style:{ flex:1, minWidth:0 } },
            e('div',{ style:{ display:'flex', alignItems:'center', gap:6 } },
              e('span',{ className:'cname', style:{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, c.title),
              c.ready.length ? e('span',{ className:'type-tag', style:{ background:'var(--sage-deep)', color:'#fff', fontSize:7, padding:'1px 5px' } }, c.ready.length+' READY') : null,
              e('span',{ className:'ccount', style:{ marginLeft:'auto' } }, c.done+'/'+c.quests.length)),
            e('div',{ className:'minibar', style:{ marginTop:5 } }, e('i',{ style:{ width:(c.done/c.quests.length*100)+'%' } })))))),
    ];
  }

  function ChapterQuests({ ch, prev }){
    const claimAll = ()=> ch.ready.forEach(x=> window.Store.claimAchievement(x.id, x.reward));
    return [
      e('div',{ key:'h', style:{ display:'flex', alignItems:'center', gap:12, marginBottom:10 } },
        e('div',{ style:{ flex:1, minWidth:0 } },
          e('div',{ style:{ fontSize:14, color:'var(--ink)' } }, ch.blurb),
          ch.open ? null : e('div',{ style:{ fontSize:13, color:'var(--medium)', marginTop:3 } },
            '🔒 Claim every quest in Chapter '+(prev.index+1)+' ('+prev.title+') to unlock.')),
        ch.ready.length>1 ? e('button',{ className:'btn green', style:{ fontSize:10, padding:'8px 12px' }, onClick:claimAll },
          'Claim All ('+ch.ready.length+')') : null),
      e('div',{ key:'l', style:listStyle },
        ch.quests.map(x=> e(QuestCard,{ key:x.id, name:x.name, desc:x.desc, prog:x.prog, goal:x.goal, unit:x.unit, reward:x.reward,
          done:x.claimed, met:x.met, locked:!ch.open, doneLabel:'CLAIMED',
          onClaim:()=> window.Store.claimAchievement(x.id, x.reward) })))
    ];
  }

  function Quests(){
    const st = window.useStore();
    const chapters = window.Chapters.status(st);
    const [tab, setTab] = useState('daily');
    // start on the furthest open chapter that still has something to do
    const [sel, setSel] = useState(()=>{ const c = chapters.find(c=> c.open && !c.complete); return c ? c.index : chapters.filter(c=>c.open).length-1; });
    const ch = chapters[sel];
    const readyCount = chapters.reduce((n,c)=> n+c.ready.length, 0);

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 320px', gap:14 } },
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column', minHeight:0 } },
        e('div',{ style:{ display:'flex', alignItems:'center', gap:12, marginBottom:12 } },
          e('div',{ className:'panel-title', style:{ margin:0, flex:1 } }, e('span',{className:'dot'}),
            tab==='daily' ? 'Daily Quests' : 'Chapter '+(ch.index+1)+' · '+ch.title),
          e(TabBar,{ tab, setTab, readyCount })),
        tab==='daily'
          ? e('div',{ style:listStyle }, QUESTS.map(q=> e(DailyRow,{ key:q.id, q, st })))
          : ChapterQuests({ ch, prev: chapters[sel-1] })
      ),
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:14, minHeight:0 } },
        tab==='daily' ? DailySummary({ st }) : ChapterList({ chapters, sel, setSel }))
    );
  }

  window.Quests = Quests;
})();

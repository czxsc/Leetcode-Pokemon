/* =====================================================================
   Daily Quests — log in, solve 1, solve 3, daily refresher.
   Progress reads live state; claim grants Shards once per day.
===================================================================== */
(function(){
  const e = React.createElement;

  const QUESTS = [
    { id:'login',  name:'Log In',            desc:'Open Pok\u00e9Leet today.',              reward:50,  goal:1,
      progress:()=>1 },
    { id:'solve1', name:'Solve 1 Problem',   desc:'Claim shards on any problem.',           reward:100, goal:1,
      progress:(s)=>Object.keys(s.claims).length },
    { id:'solve3', name:'Solve 3 Problems',  desc:'Claim shards on three problems.',        reward:250, goal:3,
      progress:(s)=>Object.keys(s.claims).length },
    { id:'refresh',name:'Daily Refresher',   desc:'Finish an Active Recall quiz.',          reward:150, goal:1,
      progress:(s)=>s.recallBest>0?1:0 },
  ];

  function QuestRow({ q, st }){
    const prog = Math.min(q.goal, q.progress(st));
    const met = prog >= q.goal;
    const claimed = !!st.quests[q.id];
    return e('div',{ className:'chip-card', style:{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14,
        opacity: claimed?0.7:1, borderColor: met&&!claimed?'var(--sage-deep)':'var(--card-line)' } },
      e('div',{ style:{ width:42, height:42, borderRadius:10, flex:'none', display:'flex', alignItems:'center', justifyContent:'center',
          background: claimed?'var(--sage)':met?'var(--sage-lite)':'var(--cream-2)', border:'2px solid var(--card-line)' } },
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:16, color: claimed?'#fff':'var(--wood-dark)' } }, claimed?'\u2714':'\u2605')),
      e('div',{ style:{ flex:1 } },
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--ink)', marginBottom:4 } }, q.name),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginBottom:7 } }, q.desc),
        e('div',{ style:{ display:'flex', alignItems:'center', gap:9 } },
          e('div',{ className:'minibar', style:{ flex:1, height:8 } }, e('i',{ style:{ width:(prog/q.goal*100)+'%', background:'var(--sage-deep)' } })),
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)' } }, prog+'/'+q.goal))
      ),
      e('div',{ style:{ textAlign:'center', flex:'none', width:96 } },
        e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:7 } },
          e(Shard,{size:15}), e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:13, color:'var(--shard-deep)' } }, q.reward)),
        claimed
          ? e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--sage-deep)' } }, 'CLAIMED')
          : e('button',{ className:'btn green', disabled:!met, style:{ fontSize:10, padding:'7px 12px' },
              onClick:()=> window.Store.grantQuest(q.id, q.reward) }, 'Claim'))
    );
  }

  function Quests(){
    const st = window.useStore();
    const total = QUESTS.length;
    const done = QUESTS.filter(q=>st.quests[q.id]).length;
    const unclaimed = QUESTS.filter(q=> !st.quests[q.id] && q.progress(st) >= q.goal);

    return e('div',{ style:{ height:'100%', display:'grid', gridTemplateColumns:'1fr 320px', gap:14 } },
      e('div',{ className:'panel', style:{ display:'flex', flexDirection:'column' } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Daily Quests'),
        e('div',{ style:{ display:'flex', flexDirection:'column', gap:10, flex:1, minHeight:0, overflowY:'auto', paddingRight:4 } },
          QUESTS.map(q=> e(QuestRow,{ key:q.id, q, st })))
      ),
      // side summary
      e('div',{ className:'panel cream', style:{ display:'flex', flexDirection:'column', gap:14 } },
        e('div',{ className:'panel-title' }, e('span',{className:'dot'}), 'Today'),
        e('div',{ style:{ textAlign:'center', padding:'12px 0' } },
          e('div',{ style:{ position:'relative', display:'inline-block' } },
            e('div',{ className: done<total?'pokeball-spin':'' }, e(Pokeball,{ size:72 }))),
          e('div',{ className:'pixel-font', style:{ fontSize:22, color:'var(--wood-dark)', marginTop:14 } }, done+' / '+total),
          e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', marginTop:5 } }, 'quests complete')
        ),
        e('div',{ className:'chip-card', style:{ padding:14, textAlign:'center' } },
          e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:9, color:'var(--ink-faint)', marginBottom:8 } }, 'UNCLAIMED REWARDS'),
          e('div',{ style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:7 } },
            e(Shard,{size:20}),
            e('span',{ className:'pixel-font', style:{ fontSize:20, color:'var(--shard-deep)' } },
              unclaimed.reduce((s,q)=>s+q.reward,0)))
        ),
        e('div',{ style:{ fontSize:13, color:'var(--ink-faint)', lineHeight:1.5, marginTop:'auto' } },
          'Quests refresh daily. Shard rewards go straight to your gacha fund \u2014 keep the streak alive!')
      )
    );
  }

  window.Quests = Quests;
})();

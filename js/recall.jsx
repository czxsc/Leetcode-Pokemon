/* =====================================================================
   Active Recall — Duolingo-style 10Q quiz. Mixed bank: Python syntax /
   shortcuts, pseudo-code recall of solved problems, Big-O drills.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;

  // q: prompt, options[], answer index, tag
  const BANK = [
    { tag:'syntax', q:'Count occurrences of each element in a list?', o:['Counter(nums)','sorted(nums)','set(nums)','list(nums)'], a:0 },
    { tag:'syntax', q:'Reverse a list `a` in one expression?', o:['a.sort()','a[::-1]','a.pop()','reversed()'], a:1 },
    { tag:'syntax', q:'Default dict of lists?', o:['dict()','defaultdict(list)','{}.list','Counter()'], a:1 },
    { tag:'syntax', q:'Heap: pop the smallest item?', o:['heapq.heappush','heapq.heappop','heapq.nlargest','min()'], a:1 },
    { tag:'syntax', q:'Iterate index + value together?', o:['zip(nums)','range(nums)','enumerate(nums)','items(nums)'], a:2 },
    { tag:'syntax', q:'Unpack-swap a and b?', o:['a,b=b,a','swap(a,b)','a=b=0','a<->b'], a:0 },
    { tag:'bigo',   q:'Big-O of binary search?', o:['O(1)','O(log n)','O(n)','O(n log n)'], a:1 },
    { tag:'bigo',   q:'Big-O of building a hash set from n items?', o:['O(log n)','O(n)','O(n^2)','O(1)'], a:1 },
    { tag:'bigo',   q:'Time to sort n items (Timsort)?', o:['O(n)','O(n log n)','O(n^2)','O(log n)'], a:1 },
    { tag:'bigo',   q:'Space of recursion depth n with no memo?', o:['O(1)','O(log n)','O(n)','O(n^2)'], a:2 },
    { tag:'bigo',   q:'Lookup in a dict by key?', o:['O(1) avg','O(log n)','O(n)','O(n log n)'], a:0 },
    { tag:'pseudo', q:'Two Sum core idea?', o:['Sort then 2 pointers from ends','Hash map of complement \u2192 index','Brute force all pairs','Binary search each'], a:1 },
    { tag:'pseudo', q:'Detect a cycle in a linked list?', o:['Reverse the list','Fast & slow pointers','Sort the nodes','Hash every value'], a:1 },
    { tag:'pseudo', q:'Number of Islands traversal?', o:['Binary search','DFS/BFS flood fill','Topological sort','Dijkstra'], a:1 },
    { tag:'pseudo', q:'Course Schedule detects what?', o:['Shortest path','A cycle in a DAG','Min spanning tree','Max flow'], a:1 },
    { tag:'pseudo', q:'Climbing Stairs recurrence?', o:['f(n)=f(n-1)*2','f(n)=f(n-1)+f(n-2)','f(n)=n!','f(n)=f(n/2)+1'], a:1 },
    { tag:'pseudo', q:'Kadane\u2019s (Max Subarray) keeps?', o:['A sorted window','Running max ending here','A min-heap','Two pointers'], a:1 },
    { tag:'syntax', q:'Merge dict b into a (3.9+)?', o:['a+b','a|b','a&b','a.merge(b)'], a:1 },
  ];
  const TAG_LABEL = { syntax:'Syntax', bigo:'Big-O', pseudo:'Pseudocode' };
  const TAG_COLOR = { syntax:'var(--sky)', bigo:'var(--lav)', pseudo:'var(--pink)' };
  const REWARD_PER = 25; // shards per correct

  function pick10(){
    const arr=[...BANK]; for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    return arr.slice(0,10);
  }

  function Recall(){
    const st = window.useStore(s=>({ recallBest:s.recallBest }));
    const [quiz, setQuiz] = useState(null);   // {qs, i, score, picked, answered}
    const [done, setDone] = useState(null);

    function start(){ setDone(null); setQuiz({ qs:pick10(), i:0, score:0, picked:null, answered:false }); }
    function choose(idx){
      if(quiz.answered) return;
      const correct = idx === quiz.qs[quiz.i].a;
      setQuiz({ ...quiz, picked:idx, answered:true, score: quiz.score + (correct?1:0) });
    }
    function next(){
      if(quiz.i+1 >= quiz.qs.length){
        const reward = quiz.score * REWARD_PER;
        window.Store.addShards(reward);
        window.Store.setRecallBest(quiz.score);
        setDone({ score:quiz.score, total:quiz.qs.length, reward });
        setQuiz(null);
      } else {
        setQuiz({ ...quiz, i:quiz.i+1, picked:null, answered:false });
      }
    }

    // ---------- intro ----------
    if(!quiz && !done){
      return e('div',{ className:'panel cream', style:{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 } },
        e('div',{ className:'mon-bob' }, e(Creature,{ species:'psybloom', size:96 })),
        e('div',{ className:'pixel-font', style:{ fontSize:22, color:'var(--wood-dark)' } }, 'Active Recall'),
        e('div',{ style:{ fontSize:15, color:'var(--ink-soft)', maxWidth:420, textAlign:'center', lineHeight:1.5 } },
          '10 quick questions on Python syntax, Big-O, and pseudo-code from problems you\u2019ve solved. Earn ',
          e('b',{},'25 Shards'), ' per correct answer.'),
        st.recallBest>0 ? e('div',{ className:'cur-badge' }, 'Best: '+st.recallBest+'/10') : null,
        e('button',{ className:'btn lav', style:{ fontSize:14, padding:'14px 28px' }, onClick:start }, 'Start Quiz')
      );
    }

    // ---------- results ----------
    if(done){
      const pct = done.score/done.total;
      const mon = pct>=0.8?'aurigon':pct>=0.5?'voltace':'sproutle';
      return e('div',{ className:'panel cream', style:{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18 } },
        e('div',{ className:'mon-bob' }, e(Creature,{ species:mon, size:96 })),
        e('div',{ className:'pixel-font', style:{ fontSize:30, color:'var(--wood-dark)' } }, done.score+' / '+done.total),
        e('div',{ style:{ fontSize:15, color:'var(--ink-soft)' } }, pct>=0.8?'Sharp as ever!':pct>=0.5?'Solid refresher.':'Keep drilling!'),
        e('div',{ className:'chip-card', style:{ padding:'12px 22px', display:'flex', alignItems:'center', gap:9 } },
          e(Shard,{size:22}), e('span',{ className:'pixel-font', style:{ fontSize:20, color:'var(--shard-deep)' } }, '+'+done.reward)),
        e('div',{ style:{ display:'flex', gap:10 } },
          e('button',{ className:'btn lav', onClick:start }, 'Again'))
      );
    }

    // ---------- in quiz ----------
    const cur = quiz.qs[quiz.i];
    return e('div',{ style:{ height:'100%', display:'flex', flexDirection:'column', gap:14 } },
      // progress header
      e('div',{ className:'panel', style:{ padding:'12px 16px', display:'flex', alignItems:'center', gap:14 } },
        e('span',{ className:'type-tag', style:{ background:TAG_COLOR[cur.tag], fontSize:9, padding:'4px 8px' } }, TAG_LABEL[cur.tag]),
        e('div',{ className:'minibar', style:{ flex:1, height:10 } }, e('i',{ style:{ width:((quiz.i)/quiz.qs.length*100)+'%', background:'var(--lav)' } })),
        e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:11, color:'var(--ink-faint)' } }, (quiz.i+1)+'/'+quiz.qs.length),
        e('span',{ style:{ display:'flex', alignItems:'center', gap:5, fontFamily:"'Silkscreen'", fontSize:11, color:'var(--shard-deep)' } }, e(Shard,{size:13}), quiz.score*REWARD_PER)
      ),
      // question
      e('div',{ className:'panel cream', style:{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:18, padding:'28px 32px' } },
        e('div',{ className:'pixel-font', style:{ fontSize:18, color:'var(--ink)', lineHeight:1.5, textAlign:'center' } }, cur.q),
        e('div',{ style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:640, width:'100%', margin:'0 auto' } },
          cur.o.map((opt,idx)=>{
            let bg='var(--card-2)', bd='var(--card-line)', col='var(--ink)';
            if(quiz.answered){
              if(idx===cur.a){ bg='var(--sage-lite)'; bd='var(--sage-deep)'; }
              else if(idx===quiz.picked){ bg='#f4d2cd'; bd='var(--hard)'; }
            }
            return e('button',{ key:idx, disabled:quiz.answered,
              onClick:()=>choose(idx),
              className: !quiz.answered?'quiz-opt':'',
              style:{ background:bg, border:'3px solid '+bd, borderRadius:12, padding:'16px 14px',
                fontFamily:"'VT323', monospace", fontSize:19, color:col, textAlign:'center', cursor: quiz.answered?'default':'pointer',
                boxShadow:'inset 0 2px 0 rgba(255,255,255,.5)' } }, opt);
          })
        ),
        quiz.answered ? e('div',{ style:{ textAlign:'center', minHeight:24 } },
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color: quiz.picked===cur.a?'var(--sage-deep)':'var(--hard)' } },
            quiz.picked===cur.a?'\u2714 Correct!':'\u2716 Answer: '+cur.o[cur.a])
        ) : e('div',{ style:{ minHeight:24 } })
      ),
      // footer
      e('div',{ style:{ display:'flex', justifyContent:'flex-end' } },
        e('button',{ className:'btn lav', disabled:!quiz.answered, style:{ fontSize:13, padding:'12px 28px' }, onClick:next },
          quiz.i+1>=quiz.qs.length?'Finish':'Next \u2192'))
    );
  }

  window.Recall = Recall;
})();

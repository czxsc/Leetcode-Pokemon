/* =====================================================================
   Active Recall — Duolingo-style 10Q quiz. Mixed bank: multiple-choice
   Python syntax / Big-O / pseudo-code, plus typed one- and two-liners
   (write the line: reverse a list, sort with a lambda, loop with a step,
   heapq / deque / Counter / bisect idioms). Each quiz is half typed.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState, useRef, useEffect } = React;

  // multiple choice — q: prompt, o: options[], a: answer index
  const CHOICE = [
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
  ].map(x=>({ ...x, kind:'choice' }));

  // typed — code: setup shown above the prompt, a: model answer, alt: other accepted answers.
  // Answers are compared after norm() below; a RegExp alt is tested against the normalized input
  // (no whitespace, ' quotes) so loop and lambda variable names can be anything.
  const TYPED = [
    // ---- Python idioms ----
    { tag:'code', code:"a = ['a', 'b', 'c']", q:'Write an expression for a reversed copy of `a`.', a:'a[::-1]', alt:['list(reversed(a))'] },
    { tag:'code', code:"a = ['a', 'b', 'c']", q:'Reverse `a` in place (no new list).', a:'a.reverse()', alt:['a[:] = a[::-1]'] },
    { tag:'code', code:"s = 'hello'", q:'Reverse the string `s`.', a:'s[::-1]', alt:["''.join(reversed(s))"] },
    { tag:'code', code:"s = 'racecar'", q:'Expression: is `s` a palindrome?', a:'s == s[::-1]', alt:['s[::-1] == s'] },
    { tag:'code', code:'a = [3, 1, 4, 1, 5]', q:'Get the last element of `a`.', a:'a[-1]' },
    { tag:'code', code:'a = [3, 1, 4, 1, 5]', q:'Slice: every element except the first.', a:'a[1:]' },
    { tag:'code', code:'nums = [3, 1, 2]', q:'Sort `nums` in place, largest first.', a:'nums.sort(reverse=True)' },
    { tag:'code', code:"words = ['kiwi', 'fig', 'banana']", q:'New list of `words` sorted by length.', a:'sorted(words, key=len)' },
    { tag:'code', code:"words = ['kiwi', 'fig', 'banana']", q:'The longest word, in one call.', a:'max(words, key=len)' },
    { tag:'code', code:'intervals = [[5, 7], [1, 3], [2, 4]]', q:'Sort `intervals` in place by start, using a lambda.',
      a:'intervals.sort(key=lambda x: x[0])', alt:[/^intervals\.sort\(key=lambda(\w+):\1\[0\]\)$/, 'intervals.sort()'] },
    { tag:'code', code:"people = [('ann', 30), ('bob', 25), ('cy', 30)]", q:'Sort `people` in place: oldest first, then name A\u2192Z.',
      a:'people.sort(key=lambda p: (-p[1], p[0]))', alt:[/^people\.sort\(key=lambda(\w+):\(-\1\[1\],\1\[0\]\)\)$/] },
    { tag:'code', code:'points = [[3, 4], [1, 1], [0, 2]]', q:'Sort `points` in place by distance from the origin (lambda).',
      a:'points.sort(key=lambda p: p[0]**2 + p[1]**2)', alt:[
        /^points\.sort\(key=lambda(\w+):\1\[0\]\*\*2\+\1\[1\]\*\*2\)$/,
        /^points\.sort\(key=lambda(\w+):\1\[0\]\*\1\[0\]\+\1\[1\]\*\1\[1\]\)$/,
        /^points\.sort\(key=lambda(\w+):math\.hypot\(\*\1\)\)$/] },
    { tag:'code', code:'n = 5', q:'A list of `n` zeros.', a:'[0] * n', alt:['n * [0]'] },
    { tag:'code', code:'rows, cols = 3, 4', q:'A `rows` \u00d7 `cols` grid of zeros (each row its own list).',
      a:'[[0] * cols for _ in range(rows)]', alt:[/^\[\[0\]\*colsfor(\w+)inrange\(rows\)\]$/, /^\[\[0for(\w+)inrange\(cols\)\]for(\w+)inrange\(rows\)\]$/] },
    { tag:'code', code:"chars = ['c', 'a', 't']", q:'Join the characters into one string.', a:"''.join(chars)" },
    { tag:'code', code:"s = 'the quick fox'", q:'Split the sentence into a list of words.', a:'s.split()', alt:["s.split(' ')"] },
    { tag:'code', code:"c = 'd'", q:'Position of lowercase letter `c` in the alphabet (a \u2192 0).', a:"ord(c) - ord('a')", alt:['ord(c) - 97'] },
    { tag:'code', code:'i = 3', q:'Turn index `i` (0\u201325) back into a lowercase letter.', a:"chr(i + ord('a'))", alt:["chr(ord('a') + i)", 'chr(i + 97)', 'chr(97 + i)'] },
    { tag:'code', code:'nums = [1, 2, 3]', q:'List comprehension: the square of every number.', a:'[x * x for x in nums]',
      alt:[/^\[(\w+)\*\1for\1innums\]$/, /^\[(\w+)\*\*2for\1innums\]$/] },
    { tag:'code', code:'nums = [1, 2, 3, 4]', q:'List comprehension: only the even numbers.', a:'[x for x in nums if x % 2 == 0]',
      alt:[/^\[(\w+)for\1innumsif\1%2==0\]$/, /^\[(\w+)for\1innumsifnot\1%2\]$/] },
    { tag:'code', code:'grid = [[1, 2], [3, 4]]', q:'Flatten `grid` into one list.', a:'[x for row in grid for x in row]',
      alt:[/^\[(\w+)for(\w+)ingridfor\1in\2\]$/, 'sum(grid, [])', 'list(chain(*grid))', 'list(itertools.chain(*grid))'] },
    { tag:'code', code:'matrix = [[1, 2, 3], [4, 5, 6]]', q:'Transpose `matrix` (rows become columns).', a:'list(zip(*matrix))',
      alt:['zip(*matrix)', /^\[list\((\w+)\)for\1inzip\(\*matrix\)\]$/] },
    { tag:'code', code:'a = [1, 2, 3, 4]', q:'Pair each element with the next: (1, 2), (2, 3), (3, 4).', a:'zip(a, a[1:])',
      alt:['list(zip(a, a[1:]))', 'pairwise(a)', 'itertools.pairwise(a)', 'list(pairwise(a))'] },
    { tag:'code', code:'a = [1, 2, 3]\ni, j = 0, 2', q:'Swap `a[i]` and `a[j]` in one line.', a:'a[i], a[j] = a[j], a[i]' },
    { tag:'code', code:'from itertools import accumulate\nnums = [1, 2, 3]', q:'Running prefix sums of `nums`, as a list.', a:'list(accumulate(nums))',
      alt:['list(itertools.accumulate(nums))'] },
    { tag:'code', code:"s = 'leetcode'", q:'Count the vowels in `s` in one line.', a:"sum(c in 'aeiou' for c in s)",
      alt:[/^sum\((\w+)in'aeiou'for\1ins\)$/, /^sum\(1for(\w+)insif\1in'aeiou'\)$/, /^len\(\[(\w+)for\1insif\1in'aeiou'\]\)$/] },

    // ---- loops ----
    { tag:'loop', code:'a = [5, 8, 1, 9, 3]', q:'Write the `for` line that visits every other index of `a` (0, 2, 4, \u2026).',
      a:'for i in range(0, len(a), 2):', alt:[/^for(\w+)inrange\(0,len\(a\),2\)$/] },
    { tag:'loop', code:'n = 5', q:'Write the `for` line that counts `i` down from `n - 1` to 0.',
      a:'for i in range(n - 1, -1, -1):', alt:[/^for(\w+)inrange\(n-1,-1,-1\)$/, /^for(\w+)inreversed\(range\(n\)\)$/] },
    { tag:'loop', code:'nums = [4, 2, 7]', q:'Write the `for` line that gets each index and value of `nums`.',
      a:'for i, x in enumerate(nums):', alt:[/^for(\w+),(\w+)inenumerate\(nums\)$/] },
    { tag:'loop', code:"d = {'a': 1, 'b': 2}", q:'Write the `for` line over each key and value of `d`.',
      a:'for k, v in d.items():', alt:[/^for(\w+),(\w+)ind\.items\(\)$/] },
    { tag:'loop', code:'a = [1, 2]\nb = [3, 4]', q:'Write the `for` line that walks `a` and `b` side by side.',
      a:'for x, y in zip(a, b):', alt:[/^for(\w+),(\w+)inzip\(a,b\)$/] },
    { tag:'loop', code:'n = 3', q:'Write the `for` line that repeats `n` times when you don\u2019t need the counter.', a:'for _ in range(n):' },
    { tag:'loop', code:'s = "abcdef"\nk = 2', q:'Write the `for` line over the start of every chunk of size `k` (0, 2, 4).',
      a:'for i in range(0, len(s), k):', alt:[/^for(\w+)inrange\(0,len\(s\),k\)$/] },
    { tag:'loop', code:'graph = defaultdict(list)\nedges = [[0, 1], [1, 2]]', q:'Two lines: build an undirected adjacency list from `edges`.',
      a:'for u, v in edges:\n    graph[u].append(v)\n    graph[v].append(u)', alt:[
        /^for(\w+),(\w+)inedges:graph\[\1\]\.append\(\2\)graph\[\2\]\.append\(\1\)$/,
        /^for(\w+),(\w+)inedges:graph\[\2\]\.append\(\1\)graph\[\1\]\.append\(\2\)$/] },
    { tag:'loop', code:'cnt = {}\nnums = [1, 1, 2]', q:'Two lines: count each number into the plain dict `cnt`.',
      a:'for x in nums:\n    cnt[x] = cnt.get(x, 0) + 1', alt:[
        /^for(\w+)innums:cnt\[\1\]=cnt\.get\(\1,0\)\+1$/, /^for(\w+)innums:cnt\[\1\]=1\+cnt\.get\(\1,0\)$/] },
    { tag:'loop', code:'q = deque([root])', q:'Two lines: BFS — keep going while `q` has nodes, taking the next one from the front.',
      a:'while q:\n    node = q.popleft()', alt:[/^whileq:(\w+)=q\.popleft\(\)$/, /^whilelen\(q\)>0:(\w+)=q\.popleft\(\)$/] },

    // ---- data structures ----
    { tag:'ds', code:"s = 'banana'", q:'Count how many times each character appears in `s`.', a:'Counter(s)', alt:['collections.Counter(s)'] },
    { tag:'ds', code:'cnt = Counter(nums)', q:'The 2 most common elements from `cnt`.', a:'cnt.most_common(2)' },
    { tag:'ds', code:'d = {}', q:'Add 1 to `d[x]` even if `x` isn\u2019t a key yet (plain dict).', a:'d[x] = d.get(x, 0) + 1', alt:['d[x] = 1 + d.get(x, 0)'] },
    { tag:'ds', code:'from collections import defaultdict', q:'Make `groups` a dict whose missing keys start as empty lists.', a:'groups = defaultdict(list)' },
    { tag:'ds', code:"w = 'eat'", q:'A hashable anagram-group key for word `w`.', a:'tuple(sorted(w))', alt:["''.join(sorted(w))"] },
    { tag:'ds', code:'a, b = {1, 2, 3}, {2, 3, 4}', q:'The elements in both sets.', a:'a & b', alt:['b & a', 'a.intersection(b)'] },
    { tag:'ds', code:'import heapq\nh = []', q:'Push `x` onto the min-heap `h`.', a:'heapq.heappush(h, x)', alt:['heappush(h, x)'] },
    { tag:'ds', code:'import heapq', q:'Pop the smallest item from heap `h`.', a:'heapq.heappop(h)', alt:['heappop(h)'] },
    { tag:'ds', code:'import heapq', q:'heapq only makes min-heaps. Push `x` so `h` works as a MAX-heap.', a:'heapq.heappush(h, -x)', alt:['heappush(h, -x)'] },
    { tag:'ds', code:'import heapq\nnums = [5, 1, 4]', q:'Turn `nums` into a heap in place.', a:'heapq.heapify(nums)', alt:['heapify(nums)'] },
    { tag:'ds', code:'from collections import deque', q:'Create a BFS queue `q` that starts with `root`.', a:'q = deque([root])' },
    { tag:'ds', code:'q = deque([1, 2, 3])', q:'Take the next item from the front of `q`.', a:'q.popleft()', alt:[/^(\w+)=q\.popleft\(\)$/] },
    { tag:'ds', code:'stack = [1, 2, 3]', q:'Peek at the top of `stack` without popping.', a:'stack[-1]' },
    { tag:'ds', code:'import bisect\na = [1, 3, 5]', q:'Leftmost index where `x` could be inserted to keep `a` sorted.', a:'bisect.bisect_left(a, x)', alt:['bisect_left(a, x)'] },
    { tag:'ds', code:'best = ...', q:'Positive infinity, e.g. to start a running minimum.', a:"float('inf')", alt:['math.inf', "best = float('inf')", 'best = math.inf'] },
    { tag:'ds', code:'lo, hi = 0, 9', q:'Binary search: set `mid` to the midpoint of `lo` and `hi`.', a:'mid = (lo + hi) // 2',
      alt:['mid = lo + (hi - lo) // 2', 'mid = (lo + hi) >> 1'] },
    { tag:'ds', code:'from functools import cache', q:'The decorator that memoizes a recursive function.', a:'@cache',
      alt:['@functools.cache', '@lru_cache(None)', '@lru_cache(maxsize=None)', '@functools.lru_cache(None)'] },
    { tag:'ds', code:'n, i = 5, 2', q:'Expression: is bit `i` of `n` set?', a:'(n >> i) & 1', alt:['n >> i & 1', 'n & (1 << i)', 'n & 1 << i'] },
    { tag:'ds', code:'n = 12', q:'Clear the lowest set bit of `n`.', a:'n & (n - 1)', alt:['n &= n - 1', 'n = n & (n - 1)'] },
  ].map(x=>({ ...x, kind:'typed' }));

  const TAG_LABEL = { syntax:'Syntax', bigo:'Big-O', pseudo:'Pseudocode', code:'Python \u00b7 Type it', loop:'Loops \u00b7 Type it', ds:'Data Structures \u00b7 Type it' };
  const TAG_COLOR = { syntax:'var(--sky)', bigo:'var(--lav)', pseudo:'var(--pink)', code:'var(--sage-deep)', loop:'var(--coin-deep)', ds:'var(--shard-deep)' };
  const REWARD_PER = 50; // shards per correct
  const QUIZ_LEN = 10, TYPED_PER_QUIZ = 5;

  // Drop whitespace (outside quotes) and semicolons, treat " as ', and make a trailing ':' optional —
  // so spacing, quote style and one-line vs two-line layout don't change the result.
  function norm(src){
    const s = String(src).replace(/"/g, "'");
    let out = '', inStr = false;
    for(const ch of s){
      if(ch==="'") inStr = !inStr;
      if(!inStr && (/\s/.test(ch) || ch===';')) continue;
      out += ch;
    }
    return out.replace(/:$/, '');
  }
  function isRight(q, input){
    const got = norm(input);
    if(!got) return false;
    return [q.a, ...(q.alt||[])].some(x=> x instanceof RegExp ? x.test(got) : norm(x)===got);
  }

  function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function pickQuiz(){
    return shuffle([...shuffle(TYPED).slice(0, TYPED_PER_QUIZ), ...shuffle(CHOICE).slice(0, QUIZ_LEN-TYPED_PER_QUIZ)]);
  }

  // prompt text with `code` spans
  function Prompt({ text }){
    return e('div',{ className:'pixel-font', style:{ fontSize:18, color:'var(--ink)', lineHeight:1.5, textAlign:'center' } },
      text.split(/(`[^`]+`)/).map((part,i)=> part.startsWith('`')
        ? e('code',{ key:i, className:'recall-code' }, part.slice(1,-1)) : part));
  }

  function TypedAnswer({ cur, quiz, onCheck, onOverride }){
    const [text, setText] = useState('');
    const ref = useRef(null);
    useEffect(()=>{ setText(''); if(ref.current) ref.current.focus(); }, [cur]);
    function onKeyDown(ev){
      if(ev.key==='Enter' && !ev.shiftKey){ ev.preventDefault(); if(!quiz.answered) onCheck(text); return; }
      if(ev.key==='Tab'){                                        // indent for two-liners
        ev.preventDefault();
        const el = ev.target, { selectionStart:a, selectionEnd:b } = el;
        setText(text.slice(0,a)+'    '+text.slice(b));
        requestAnimationFrame(()=>{ el.selectionStart = el.selectionEnd = a+4; });
      }
    }
    const lines = Math.max(2, cur.a.split('\n').length);
    return e('div',{ style:{ maxWidth:640, width:'100%', margin:'0 auto' } },
      e('div',{ className:'field', style:{ margin:0 } },
        e('textarea',{ ref, className:'code-input', value:text, rows:lines, spellCheck:false, readOnly:quiz.answered,
          placeholder: lines>1 ? 'Type your answer\u2026 (Tab indents, Shift+Enter for a new line)' : 'Type your answer\u2026',
          onChange:(ev)=>setText(ev.target.value), onKeyDown, style:{ resize:'none', fontSize:19 } })),
      quiz.answered ? null : e('div',{ style:{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:10 } },
        e('button',{ className:'btn', style:{ fontSize:11 }, onClick:()=>onCheck('') }, 'Show Answer'),
        e('button',{ className:'btn green', style:{ fontSize:11 }, disabled:!text.trim(), onClick:()=>onCheck(text) }, 'Check')),
      quiz.answered ? e('div',{ style:{ marginTop:12, textAlign:'center' } },
        e('div',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color: quiz.correct?'var(--sage-deep)':'var(--hard)', marginBottom:8 } },
          quiz.correct ? (quiz.overridden ? '\u2714 Counted!' : '\u2714 Correct!') : '\u2716 Not quite \u2014 one answer:'),
        quiz.correct && !quiz.overridden && norm(text)===norm(cur.a) ? null
          : e('div',{ className:'code-wrap', style:{ borderRadius:10, border:'2px solid var(--lav-deep)', textAlign:'left', display:'inline-block', minWidth:320 } },
              e(CodeBlock,{ code:cur.a, language:'python' })),
        !quiz.correct && text.trim() ? e('div',{ style:{ marginTop:8 } },
          e('button',{ className:'iconbtn', onClick:onOverride, title:'Your answer does the same thing? Count it.' }, 'Mine works too \u2014 count it')) : null
      ) : null
    );
  }

  function Recall(){
    const st = window.useStore(s=>({ recallBest:s.recallBest }));
    const [quiz, setQuiz] = useState(null);   // {qs, i, score, picked, answered, correct, overridden}
    const [done, setDone] = useState(null);

    function start(){ setDone(null); setQuiz({ qs:pickQuiz(), i:0, score:0, picked:null, answered:false, correct:false, overridden:false }); }
    function answer(correct, picked){
      if(quiz.answered) return;
      setQuiz({ ...quiz, picked, answered:true, correct, score: quiz.score + (correct?1:0) });
    }
    function override(){
      if(!quiz.answered || quiz.correct) return;
      setQuiz({ ...quiz, correct:true, overridden:true, score: quiz.score+1 });
    }
    function next(){
      if(quiz.i+1 >= quiz.qs.length){
        const reward = quiz.score * REWARD_PER;
        window.Store.addShards(reward);
        window.Store.setRecallBest(quiz.score);
        setDone({ score:quiz.score, total:quiz.qs.length, reward });
        setQuiz(null);
      } else {
        setQuiz({ ...quiz, i:quiz.i+1, picked:null, answered:false, correct:false, overridden:false });
      }
    }

    // ---------- intro ----------
    if(!quiz && !done){
      return e('div',{ className:'panel cream', style:{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 } },
        e('div',{ className:'mon-bob' }, e(Creature,{ species:'psybloom', size:96 })),
        e('div',{ className:'pixel-font', style:{ fontSize:22, color:'var(--wood-dark)' } }, 'Active Recall'),
        e('div',{ style:{ fontSize:15, color:'var(--ink-soft)', maxWidth:440, textAlign:'center', lineHeight:1.5 } },
          'Practice some basic Python syntax, shortcuts and complexity refreshers. Earn ',
          // the number in Silkscreen: this body font draws a bold 5 like an S
          e('b',{}, e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:13 } }, REWARD_PER), ' Shards'), ' per correct answer.'),
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
      e('div',{ className:'panel cream', style:{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', justifyContent:'center', gap:18, padding:'28px 32px' } },
        cur.kind==='typed' ? e('div',{ className:'code-wrap', style:{ borderRadius:10, border:'2px solid var(--lav-deep)', maxWidth:640, width:'100%', margin:'0 auto' } },
          e(CodeBlock,{ code:cur.code, language:'python' })) : null,
        e(Prompt,{ text:cur.q }),
        cur.kind==='typed'
          ? e(TypedAnswer,{ cur, quiz, onCheck:(text)=>answer(isRight(cur, text), null), onOverride:override })
          : e('div',{ style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:640, width:'100%', margin:'0 auto' } },
              cur.o.map((opt,idx)=>{
                let bg='var(--card-2)', bd='var(--card-line)', col='var(--ink)';
                if(quiz.answered){
                  if(idx===cur.a){ bg='var(--sage-lite)'; bd='var(--sage-deep)'; }
                  else if(idx===quiz.picked){ bg='#f4d2cd'; bd='var(--hard)'; }
                }
                return e('button',{ key:idx, disabled:quiz.answered,
                  onClick:()=>answer(idx===cur.a, idx),
                  className: !quiz.answered?'quiz-opt':'',
                  style:{ background:bg, border:'3px solid '+bd, borderRadius:12, padding:'16px 14px',
                    fontFamily:"'VT323', monospace", fontSize:19, color:col, textAlign:'center', cursor: quiz.answered?'default':'pointer',
                    boxShadow:'inset 0 2px 0 rgba(255,255,255,.5)' } }, opt);
              })),
        cur.kind==='choice' ? (quiz.answered ? e('div',{ style:{ textAlign:'center', minHeight:24 } },
          e('span',{ style:{ fontFamily:"'Silkscreen'", fontSize:12, color: quiz.correct?'var(--sage-deep)':'var(--hard)' } },
            quiz.correct?'\u2714 Correct!':'\u2716 Answer: '+cur.o[cur.a])
        ) : e('div',{ style:{ minHeight:24 } })) : null
      ),
      // footer
      e('div',{ style:{ display:'flex', justifyContent:'flex-end' } },
        e('button',{ className:'btn lav', disabled:!quiz.answered, style:{ fontSize:13, padding:'12px 28px' }, onClick:next },
          quiz.i+1>=quiz.qs.length?'Finish':'Next \u2192'))
    );
  }

  window.Recall = Recall;
})();

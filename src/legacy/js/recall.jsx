/* =====================================================================
   Active Recall — Duolingo-style 10Q quiz. Mixed bank: Python syntax /
   shortcuts, pseudo-code recall of solved problems, Big-O drills.
===================================================================== */
(function(){
  const e = React.createElement;
  const { useState } = React;

  // q: prompt, options[], answer index, tag
  const BANK = [
    // \u2500\u2500\u2500 ORIGINALS \u2500\u2500\u2500
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

    // \u2500\u2500\u2500 DIVISION & ROUNDING \u2500\u2500\u2500
    { tag:'syntax', q:'`int(-7 / 2)` evaluates to?', o:['-3','-4','3','-3.5'], a:0 },
    { tag:'syntax', q:'`-7 // 2` evaluates to?', o:['-3','-4','3','3.5'], a:1 },
    { tag:'syntax', q:'Which truncates toward zero (not negative infinity)?', o:['a // b','math.floor(a/b)','int(a/b)','round(a/b)'], a:2 },
    { tag:'syntax', q:'`round(2.5)` in Python 3 (banker\u2019s rounding)?', o:['2','3','2.5','3.0'], a:0 },
    { tag:'syntax', q:'`round(3.5)` in Python 3 (banker\u2019s rounding)?', o:['3','4','3.5','3.0'], a:1 },

    // \u2500\u2500\u2500 STRING CHARACTER CHECKS \u2500\u2500\u2500
    { tag:'syntax', q:'`"-3".isdigit()` returns?', o:['True','False','Error','None'], a:1 },
    { tag:'syntax', q:'Check if ALL chars are letters OR digits?', o:['isdigit()','isalpha()','isalnum()','isspace()'], a:2 },
    { tag:'syntax', q:'`"abc".isalpha()` \u2192 True; `"abc123".isalpha()` \u2192 ?', o:['True','False','None','Error'], a:1 },
    { tag:'syntax', q:'Convert a character to its ASCII integer?', o:['int(c)','ord(c)','chr(c)','ascii(c)'], a:1 },
    { tag:'syntax', q:'Convert an ASCII integer back to a character?', o:['str(n)','ord(n)','chr(n)','char(n)'], a:2 },

    // \u2500\u2500\u2500 DEFAULT / MISSING-KEY HANDLING \u2500\u2500\u2500
    { tag:'syntax', q:'Key diff: `d.get(k,v)` vs `d.setdefault(k,v)`?', o:['Same behavior','setdefault inserts key if missing; get does not','get inserts key if missing','Only get works on nested dicts'], a:1 },
    { tag:'syntax', q:'`defaultdict(int)` \u2014 accessing a missing key returns?', o:['None','KeyError','0','False'], a:2 },
    { tag:'syntax', q:'`defaultdict(set)` \u2014 accessing a missing key returns?', o:['{}','None','set()','KeyError'], a:2 },
    { tag:'syntax', q:'`d.get("x")` when "x" is absent \u2014 returns?', o:['KeyError','None','0','False'], a:1 },

    // \u2500\u2500\u2500 LAMBDA & SORTING \u2500\u2500\u2500
    { tag:'syntax', q:'Lambda that squares its input?', o:['def f(x): x**2','lambda x: x**2','lambda x => x**2','fn x: x**2'], a:1 },
    { tag:'syntax', q:'Sort list of tuples by the second element?', o:['sorted(a)','sorted(a, key=lambda x: x[1])','a.sort(x[1])','sorted(a[1])'], a:1 },
    { tag:'syntax', q:'`min([3,1,2])` vs `min([3,1,2], key=lambda x: -x)`?', o:['1 and 1','1 and 3','3 and 3','3 and 1'], a:1 },

    // \u2500\u2500\u2500 COUNTER \u2500\u2500\u2500
    { tag:'syntax', q:'`Counter("aabbc").most_common(1)` returns?', o:["[('a',2)]","{'a':2}","('a',2)","'a'"], a:0 },
    { tag:'syntax', q:'Counter `c1 & c2` produces?', o:['Union (max counts)','Intersection (min counts)','Difference','Sum of counts'], a:1 },
    { tag:'syntax', q:'Counter `c1 | c2` produces?', o:['Union (max counts)','Intersection (min counts)','Difference','Product'], a:0 },
    { tag:'syntax', q:'`Counter("aab") - Counter("a")` keeps?', o:['All original counts','Only positive remaining counts','Negative counts','Throws an error'], a:1 },

    // \u2500\u2500\u2500 ZIP & ENUMERATE \u2500\u2500\u2500
    { tag:'syntax', q:'`zip([1,2,3], [4,5])` \u2014 how many pairs emitted?', o:['3','2','5','Error'], a:1 },
    { tag:'syntax', q:'Zip two lists, padding the shorter one with None?', o:['zip(fill=None)','zip_longest()','itertools.zip_longest()','itertools.zip_fill()'], a:2 },
    { tag:'syntax', q:'`list(enumerate(["a","b"], start=1))` first element?', o:['(0,"a")','(1,"a")','("a",1)','(1,1)'], a:1 },

    // \u2500\u2500\u2500 COMPREHENSIONS \u2500\u2500\u2500
    { tag:'syntax', q:'Squares of even numbers 0\u20139, one line?', o:['[x**2 if x%2==0 for x in range(10)]','[x**2 for x in range(10) if x%2==0]','[x**2 for x in range(10)] if x%2==0','(x**2 for x if x%2==0 in range(10))'], a:1 },
    { tag:'syntax', q:'Flatten `[[1,2],[3,4]]` with a comprehension?', o:['[x for x in grid]','[x for row in grid for x in row]','[x for x in row for row in grid]','[*grid]'], a:1 },
    { tag:'syntax', q:'`[0]*3` creates?', o:['[0,0,0]','[[0],[0],[0]]','[0,1,2]','Error'], a:0 },
    { tag:'syntax', q:'Pitfall: all rows in `[[0]*3]*3` share the same list object?', o:['True','False','Only for mutable items','Only in Python 3'], a:0 },
    { tag:'syntax', q:'Correct way to init independent r\xd7c 2-D grid of zeros?', o:['[[0]*c]*r','[[0]*r]*c','[[0 for _ in range(c)] for _ in range(r)]','[0]*(r*c)'], a:2 },

    // \u2500\u2500\u2500 TRUTHY / NONE / TERNARY \u2500\u2500\u2500
    { tag:'syntax', q:'Preferred way to check if x is None?', o:['x == None','x is None','not x','x != None'], a:1 },
    { tag:'syntax', q:'Which value is NOT falsy in Python?', o:['0','[]','"hello"','{}'], a:2 },
    { tag:'syntax', q:'`bool("")` returns?', o:['True','False','None','Error'], a:1 },
    { tag:'syntax', q:'Python ternary expression syntax?', o:['x ? a : b','a if x else b','if x then a else b','x and a or b'], a:1 },
    { tag:'syntax', q:'Walrus operator `:=` does what?', o:['Floor division','Assign AND return value in same expression','String interpolation','Unpack iterable'], a:1 },

    // \u2500\u2500\u2500 SETS & DICTS \u2500\u2500\u2500
    { tag:'syntax', q:'Set intersection operator?', o:['a | b','a & b','a - b','a ^ b'], a:1 },
    { tag:'syntax', q:'Set union operator?', o:['a | b','a & b','a - b','a ^ b'], a:0 },
    { tag:'syntax', q:'Set symmetric difference (elements in exactly one set)?', o:['a | b','a & b','a - b','a ^ b'], a:3 },
    { tag:'syntax', q:'`{}` in Python creates a \u2014 dict or set?', o:['set','dict','frozenset','OrderedDict'], a:1 },
    { tag:'syntax', q:'Create an empty set?', o:['{}','set()','set[]','{set}'], a:1 },

    // \u2500\u2500\u2500 STRINGS \u2500\u2500\u2500
    { tag:'syntax', q:'Join list of strings with commas?', o:['",".join(lst)','lst.join(",")','str.join(",",lst)','",".concat(lst)'], a:0 },
    { tag:'syntax', q:'`"a b  c".split()` (no argument) \u2192 ?', o:["['a','b','','c']","['a','b','c']","['a b  c']","['a','b','  c']"], a:1 },
    { tag:'syntax', q:'`" hello ".strip()` \u2192 ?', o:['" hello "','"hello"','" hello"','"hello "'], a:1 },
    { tag:'syntax', q:'`s[::-1]` does what to string s?', o:['Removes last char','Reverses the string','Every other char','Copies s'], a:1 },
    { tag:'syntax', q:'`"aabbc".count("b")` returns?', o:['1','2','3','True'], a:1 },

    // \u2500\u2500\u2500 MATH / NUMBERS \u2500\u2500\u2500
    { tag:'syntax', q:'Python float infinity literal?', o:['math.INF','float("inf")','sys.MAXINT','Infinity'], a:1 },
    { tag:'syntax', q:'`divmod(7, 3)` returns?', o:['(2, 1)','(2.33, 1)','[2, 1]','7'], a:0 },
    { tag:'syntax', q:'Sign of `-7 % 3` in Python?', o:['Negative (-1)','Positive (2)','Always zero','Error'], a:1 },
    { tag:'syntax', q:'Sign of `7 % -3` in Python?', o:['Positive (1)','Negative (-2)','Always zero','Error'], a:1 },

    // \u2500\u2500\u2500 BIT MANIPULATION \u2500\u2500\u2500
    { tag:'syntax', q:'`n & 1` checks that n is?', o:['Positive','Odd','A power of 2','Even'], a:1 },
    { tag:'syntax', q:'`n & (n-1) == 0` is True when n is?', o:['Odd','Even','A power of 2 (or 0)','Prime'], a:2 },
    { tag:'syntax', q:'`n << 1` is equivalent to?', o:['n // 2','n * 2','n + 1','n % 2'], a:1 },
    { tag:'syntax', q:'`n >> 1` is equivalent to?', o:['n // 2','n * 2','n + 2','n - 1'], a:0 },
    { tag:'syntax', q:'`a ^ a` equals?', o:['a','2*a','0','1'], a:2 },
    { tag:'syntax', q:'`a ^ 0` equals?', o:['0','a','1','a+1'], a:1 },
    { tag:'syntax', q:'XOR trick: find the one non-duplicate in array of pairs?', o:['Sum all then subtract expected','XOR all values \u2014 dupes cancel to 0','Sort then compare neighbors','Use a Counter'], a:1 },

    // \u2500\u2500\u2500 HEAPQ / BISECT / ITERTOOLS \u2500\u2500\u2500
    { tag:'syntax', q:'`heapq.heapify(lst)` in-place \u2014 complexity?', o:['O(n log n)','O(n)','O(log n)','O(n^2)'], a:1 },
    { tag:'syntax', q:'Push item onto heap then pop smallest \u2014 single efficient call?', o:['heapreplace(heap,item)','heappushpop(heap,item)','heapify(heap)','nsmallest(1,heap)'], a:1 },
    { tag:'syntax', q:'`bisect.bisect_left(a, x)` returns?', o:['Index of x in a','Leftmost valid insert position for x','Rightmost valid insert position','Number of elements equal to x'], a:1 },
    { tag:'syntax', q:'With duplicates: bisect_left vs bisect_right?', o:['Identical results','bisect_left \u2192 before dupes; bisect_right \u2192 after','bisect_right \u2192 before dupes; bisect_left \u2192 after','Only bisect_right handles duplicates'], a:1 },
    { tag:'syntax', q:'`list(itertools.combinations([1,2,3], 2))` \u2192 ?', o:['[(1,2),(1,3),(2,3)]','[(1,2),(2,1),(1,3),(3,1),(2,3),(3,2)]','[(2,1),(3,1),(3,2)]','6 tuples total'], a:0 },
    { tag:'syntax', q:'`@functools.lru_cache(maxsize=None)` \u2014 maxsize=None means?', o:['No caching','Cache up to 128 entries','Unlimited cache size','Cache is per-thread'], a:2 },

    // \u2500\u2500\u2500 TYPE CONVERSION \u2500\u2500\u2500
    { tag:'syntax', q:'String "42" \u2192 integer?', o:['int("42")','Integer("42")','parse("42")','number("42")'], a:0 },
    { tag:'syntax', q:'Integer 42 \u2192 string?', o:['int(42)','str(42)','string(42)','42.str()'], a:1 },
    { tag:'syntax', q:'Remove duplicates from a list (order not needed)?', o:['lst.unique()','set(lst)','list.dedup(lst)','Counter(lst)'], a:1 },
    { tag:'syntax', q:'Convert a set to a sorted list?', o:['list(s)','sorted(s)','s.sort()','s.list()'], a:1 },
    { tag:'syntax', q:'One-liner: read space-separated ints into a list?', o:['list(input())','list(map(int, input().split()))','int(input()).split()','input().split().map(int)'], a:1 },

    // \u2500\u2500\u2500 DEQUE \u2500\u2500\u2500
    { tag:'syntax', q:'`deque.appendleft()` and `popleft()` complexity?', o:['O(n)','O(log n)','O(1)','O(n^2)'], a:2 },
    { tag:'syntax', q:'`deque(maxlen=k)` \u2014 what happens when full and you append?', o:['Raises IndexError','Oldest element is auto-dropped','Newest element is ignored','Capacity doubles'], a:1 },

    // \u2500\u2500\u2500 UNPACKING & MISC \u2500\u2500\u2500
    { tag:'syntax', q:'`a, *rest = [1,2,3,4]` \u2014 what is rest?', o:['[2,3,4]','[1,2,3]','(2,3,4)','[4]'], a:0 },
    { tag:'syntax', q:'`any([False, False, True])` returns?', o:['False','True','None','[True]'], a:1 },
    { tag:'syntax', q:'`all([True, True, False])` returns?', o:['True','False','None','Error'], a:1 },
    { tag:'syntax', q:'`sum([[1,2],[3,4]], [])` does what?', o:['Sums all integers to 10','Flattens list of lists','Error','Returns []'], a:1 },
    { tag:'syntax', q:'Chained comparison `1 < x < 10` in Python?', o:['Always True','Invalid syntax','Equivalent to 1<x and x<10','Same as (1<x)<10'], a:2 },

    // \u2500\u2500\u2500 RECURSION & CLASSES \u2500\u2500\u2500
    { tag:'syntax', q:'Default Python recursion limit?', o:['100','500','1000','10000'], a:2 },
    { tag:'syntax', q:'How to raise the recursion limit?', o:['os.setrecursionlimit(n)','sys.setrecursionlimit(n)','sys.setlimit(n)','recursion.limit(n)'], a:1 },
    { tag:'syntax', q:'`@lru_cache` on a recursive function avoids?', o:['Stack overflows','Redundant sub-problem recomputation','Type errors','Import cycles'], a:1 },
    { tag:'syntax', q:'`self` in a Python class method refers to?', o:['The class itself','The instance','A static variable','The parent class'], a:1 },
    { tag:'syntax', q:'Minimum signature for an instance method?', o:['def f():','def f(self):','def f(cls):','def f(instance):'], a:1 },

    // \u2500\u2500\u2500 BIG-O \u2500\u2500\u2500
    { tag:'bigo', q:'Append to end of a Python list?', o:['O(1) amortized','O(n)','O(log n)','O(n^2)'], a:0 },
    { tag:'bigo', q:'Insert at index 0 of a Python list?', o:['O(1)','O(log n)','O(n)','O(n log n)'], a:2 },
    { tag:'bigo', q:'`deque.appendleft()` / `popleft()`?', o:['O(n)','O(1)','O(log n)','O(n^2)'], a:1 },
    { tag:'bigo', q:'`in` operator on a Python set?', o:['O(n)','O(log n)','O(1) avg','O(n log n)'], a:2 },
    { tag:'bigo', q:'`in` operator on a Python list?', o:['O(1)','O(log n)','O(n)','O(n log n)'], a:2 },
    { tag:'bigo', q:'`heappush` / `heappop` on heap of size n?', o:['O(1)','O(log n)','O(n)','O(n log n)'], a:1 },
    { tag:'bigo', q:'`bisect.bisect_left` on sorted list of size n?', o:['O(1)','O(log n)','O(n)','O(n log n)'], a:1 },
    { tag:'bigo', q:'String concat `s += c` in a loop of n iterations?', o:['O(n)','O(n^2)','O(n log n)','O(1) amortized'], a:1 },
    { tag:'bigo', q:'`"".join(lst)` where lst has n total characters?', o:['O(n^2)','O(n log n)','O(n)','O(1)'], a:2 },
    { tag:'bigo', q:'DFS / BFS on graph with V vertices and E edges?', o:['O(V)','O(E)','O(V + E)','O(V \xd7 E)'], a:2 },
    { tag:'bigo', q:'Quicksort worst-case time?', o:['O(n log n)','O(n^2)','O(n)','O(log n)'], a:1 },
    { tag:'bigo', q:'`heapq.heapify(lst)` to build heap from n items?', o:['O(n log n)','O(n)','O(log n)','O(n^2)'], a:1 },
    { tag:'bigo', q:'k-th largest: scan n items, maintain min-heap of size k?', o:['O(n log n)','O(n log k)','O(k log n)','O(n)'], a:1 },
    { tag:'bigo', q:'Two-pointer scan of a sorted array?', o:['O(n^2)','O(n log n)','O(n)','O(log n)'], a:2 },
    { tag:'bigo', q:'Sliding window over array of size n?', o:['O(n^2)','O(n log n)','O(n)','O(1)'], a:2 },
    { tag:'bigo', q:'BFS space on tree with branching factor b, depth d?', o:['O(d)','O(b^d)','O(b\xd7d)','O(n)'], a:1 },
    { tag:'bigo', q:'DFS call-stack on a balanced binary tree of n nodes?', o:['O(n)','O(log n)','O(n log n)','O(1)'], a:1 },
    { tag:'bigo', q:'Counting sort on n elements with value range k?', o:['O(n log n)','O(n + k)','O(n \xd7 k)','O(k log k)'], a:1 },
    { tag:'bigo', q:'Trie insert of a word of length L?', o:['O(n)','O(L)','O(L log n)','O(1)'], a:1 },
    { tag:'bigo', q:'Union-Find per op (path compression + union by rank)?', o:['O(log n)','O(n)','O(\u03b1(n)) \u2248 O(1)','O(n log n)'], a:2 },

    // \u2500\u2500\u2500 PATTERNS & PSEUDOCODE \u2500\u2500\u2500
    { tag:'pseudo', q:'Two-pointer: best suited for?', o:['Sorted-array pair/target problems','Graph cycle detection','String hashing','Heap maintenance'], a:0 },
    { tag:'pseudo', q:'Sliding window: shrink the left pointer when?', o:['Constraint is violated','Window size > n/2','Window sum < target','Right pointer stalls'], a:0 },
    { tag:'pseudo', q:'Prefix sum: what does `prefix[i]` store?', o:['nums[i] \xd7 i','Sum of nums[0..i-1]','Max of nums[0..i]','nums[i] - nums[i-1]'], a:1 },
    { tag:'pseudo', q:'Prefix sum: subarray sum from index l to r inclusive?', o:['prefix[r] - prefix[l]','prefix[r+1] - prefix[l]','prefix[r] - prefix[l+1]','prefix[l] + prefix[r]'], a:1 },
    { tag:'pseudo', q:'Monotonic stack: elements are kept in?', o:['Heap order','Strictly increasing or decreasing order','Frequency order','Random insertion order'], a:1 },
    { tag:'pseudo', q:'Shortest path in an unweighted graph \u2014 prefer?', o:['DFS','BFS','Dijkstra','Bellman-Ford'], a:1 },
    { tag:'pseudo', q:'Topological sort is only valid when graph has no?', o:['Leaf nodes','Cycles','Weighted edges','Self-loops'], a:1 },
    { tag:'pseudo', q:'Backtracking: when do you prune a branch?', o:['Only at the base case','When current path can\u2019t lead to a valid solution','After exploring all children','Randomly to save time'], a:1 },
    { tag:'pseudo', q:'DP top-down approach uses?', o:['Iteration + bottom-up table','Recursion + memoization','Greedy choices','BFS level tracking'], a:1 },
    { tag:'pseudo', q:'Merge Intervals: after sorting by start, merge when?', o:['Always merge consecutive intervals','Current start \u2264 last merged end','Starts differ by \u22641','Ends are equal'], a:1 },
    { tag:'pseudo', q:'In-order traversal of a valid BST produces?', o:['Arbitrary order','Strictly increasing (sorted) values','Decreasing values','Level-order values'], a:1 },
    { tag:'pseudo', q:'LRU Cache optimal data structures?', o:['Array + set','Doubly linked list + hash map','Min-heap + hash set','Deque + Counter'], a:1 },
    { tag:'pseudo', q:'Anagram check of two length-n strings in O(n)?', o:['Sort both and compare O(n log n)','Compare character Counters O(n)','Brute-force all permutations','Use a Trie'], a:1 },
    { tag:'pseudo', q:'Word search in a grid \u2014 standard approach?', o:['BFS only','DFS with backtracking','Topological sort','Binary search on rows'], a:1 },
    { tag:'pseudo', q:'Dijkstra\u2019s algorithm fails with?', o:['Undirected graphs','Negative edge weights','Large graphs','Sparse graphs'], a:1 },
    { tag:'pseudo', q:'Trie (prefix tree) excels at?', o:['Sorting integers efficiently','Prefix search / autocomplete','Cycle detection','Shortest-path queries'], a:1 },
    { tag:'pseudo', q:'"Binary search on the answer" \u2014 applicable when?', o:['Array is pre-sorted','Search space is monotone (feasible/not)','Graph is a DAG','DP recurrence exists'], a:1 },
    { tag:'pseudo', q:'Floyd-Warshall algorithm finds?', o:['Single-source shortest paths','All-pairs shortest paths','Minimum spanning tree','Topological order'], a:1 },
    { tag:'pseudo', q:'Kruskal\u2019s MST algorithm relies on which data structure?', o:['Priority queue only','Union-Find (DSU)','Adjacency matrix','BFS queue'], a:1 },
    { tag:'pseudo', q:'Next Greater Element \u2014 classic pattern uses?', o:['Two pointers','Monotonic stack','Min-heap','DP table'], a:1 },
    { tag:'pseudo', q:'Level-order BFS: track current level by?', o:['Depth variable on node','Queue size at start of each layer loop','DFS call depth','Sorting nodes by index'], a:1 },
    { tag:'pseudo', q:'Find median from a data stream efficiently?', o:['Sorted array insert','Two heaps: max-heap (lower half) + min-heap (upper half)','Count sort each insert','Running average'], a:1 },
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

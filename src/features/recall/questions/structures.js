// Data structures deck: which structure or algorithm fits a problem, and why. Options are written
// with the answer first; the quiz shuffles them when it deals a question.

const QUESTIONS = [
  // ---- pick the structure ----
  {
    q: 'You always need the smallest remaining item, and items arrive in any order. Use a...',
    o: ['Heap', 'Queue', 'Stack', 'Linked list'],
    why: 'A heap gives the min in O(1) and pops or pushes in O(log n). A queue only knows arrival order.',
  },
  {
    q: 'Heap vs queue: what actually differs?',
    o: [
      'A heap serves by priority, a queue by arrival order',
      'A heap is always faster',
      'A queue is sorted',
      'A heap can only hold numbers',
    ],
    why: 'A queue is first-in, first-out, at O(1). A heap serves the smallest first, at O(log n). Pick one by what "next" should mean.',
  },
  {
    q: 'Handle requests strictly in the order they arrived. Use a...',
    o: ['Queue', 'Stack', 'Heap', 'Set'],
    why: 'First in, first out, with O(1) at both ends. In Python, use `deque`.',
  },
  {
    q: 'An undo feature should reverse the most recent action first. Use a...',
    o: ['Stack', 'Queue', 'Heap', 'Hash map'],
    why: 'Last in, first out. The same shape appears in matching brackets and call stacks.',
  },
  {
    q: 'Which structure drives BFS?',
    o: ['Queue', 'Stack', 'Heap', 'Trie'],
    why: 'First in, first out visits nodes in order of distance, so BFS finds shortest paths in unweighted graphs.',
  },
  {
    q: 'Which structure drives an iterative DFS?',
    o: ['Stack', 'Queue', 'Heap', 'Hash map'],
    why: 'Last in, first out keeps going deeper before backing up. Recursion does the same using the call stack.',
  },
  {
    q: 'Array vs linked list: what does an array do better?',
    o: [
      'Random access, plus better cache use',
      'Inserting at the front',
      'Removing a known node',
      'Growing without any copying',
    ],
    why: 'Items sit side by side, so `a[i]` is O(1) and the CPU cache helps. Linked lists have to walk node by node.',
  },
  {
    q: 'Array vs linked list: what does a linked list do better?',
    o: [
      'O(1) insert or remove at a node you already hold',
      'Random access by index',
      'Using less memory per item',
      'Binary search',
    ],
    why: 'You only relink pointers and nothing shifts. But you must already have the node, or finding it costs O(n).',
  },
  {
    q: 'When is a balanced BST better than a hash map?',
    o: [
      'When you need sorted order or range queries',
      'When you need the fastest single lookup',
      'When keys are strings',
      'When memory does not matter',
    ],
    why: 'A BST keeps keys ordered, so "next larger" and range queries are O(log n). A hash map is O(1) on average but has no order.',
  },
  {
    q: 'Python has no built-in TreeMap. What is the usual stand-in?',
    o: ['A sorted list with bisect', 'A dict', 'A heap', 'A deque'],
    why: 'Lookups are O(log n), though inserts shift items in O(n). The `sortedcontainers` package is the fuller option if you can install it.',
  },
  {
    q: 'Membership checks on a big collection. List or set?',
    o: ['Set: O(1) on average', 'List: O(1)', 'List: O(log n)', 'Same speed'],
    why: 'A set hashes straight to the item, while a list has to scan. Converting a list to a set is often the easiest speedup.',
  },
  {
    q: 'Why use a deque instead of a list as a queue?',
    o: [
      'popleft is O(1), list.pop(0) is O(n)',
      'It uses less memory',
      'It keeps items sorted',
      'Indexing the middle is faster',
    ],
    why: 'Popping the front of a list shifts every item. The trade-off is that deques are slow at indexing the middle.',
  },
  {
    q: 'Keep only the last k items, dropping older ones automatically. Use...',
    o: ['deque(maxlen=k)', 'A heap of size k', 'A set', 'A sorted list'],
    why: 'Once full, appending to one end silently drops from the other, like a ring buffer.',
  },
  {
    q: 'Remove duplicates but keep the first-seen order. Use...',
    o: ['list(dict.fromkeys(a))', 'list(set(a))', 'sorted(a)', 'Counter(a).most_common()'],
    why: 'Dicts keep insertion order and keys are unique. `set` removes duplicates but makes no promise about order.',
  },

  // ---- match the pattern ----
  {
    q: 'Find the k-th largest in a stream of numbers. Use...',
    o: ['A min-heap of size k', 'A max-heap of all items', 'A queue', 'A stack'],
    why: 'Keep the k largest seen so far. The smallest of those, `heap[0]`, is the answer, and each new number costs O(log k).',
  },
  {
    q: 'Median of a stream of numbers. Use...',
    o: ['Two heaps', 'One heap', 'A queue', 'A hash map'],
    why: 'A max-heap holds the lower half and a min-heap the upper half. Balanced, the median is at their tops. Adding is O(log n).',
  },
  {
    q: 'Maximum of every sliding window, in O(n). Use...',
    o: ['A monotonic deque', 'A heap with re-sorting', 'A stack only', 'A hash set'],
    why: 'Keep indices with decreasing values. The front is the max, and each index enters and leaves at most once.',
  },
  {
    q: 'Next greater element for every position, in O(n). Use...',
    o: ['A monotonic stack', 'Binary search', 'A heap', 'A hash set'],
    why: 'The stack holds items still waiting for something greater. A new larger value pops and answers them.',
  },
  {
    q: 'Autocomplete: find all words with a given prefix. Use a...',
    o: ['Trie', 'Hash set', 'Heap', 'Queue'],
    why: 'Words sharing a prefix share a path, so a prefix check costs only its length, however many words there are.',
  },
  {
    q: 'Edges arrive one at a time, and you must keep answering "are a and b connected?" Use...',
    o: ['Union-Find', 'BFS after every edge', 'A heap', 'A trie'],
    why: 'Union-Find merges groups in nearly O(1). Rerunning BFS each time would be O(V + E) per query.',
  },
  {
    q: 'Many range-sum queries, and the array never changes. Use...',
    o: ['Prefix sums', 'A segment tree', 'A heap', 'Sorting'],
    why: 'Build in O(n), then each query is one subtraction. Anything fancier is wasted when there are no updates.',
  },
  {
    q: 'Range-sum queries AND point updates, both fast. Use...',
    o: ['A Fenwick or segment tree', 'Prefix sums', 'A plain array', 'A hash map'],
    why: 'Both operations are O(log n). Prefix sums would need O(n) to rebuild after every update.',
  },
  {
    q: 'An LRU cache with O(1) get and put uses...',
    o: [
      'A hash map plus a doubly linked list',
      'A heap plus a stack',
      'A sorted array',
      'Two queues',
    ],
    why: 'The map finds the node, and the list moves it to the front and evicts from the back. In Python, `OrderedDict` packages both.',
  },
  {
    q: 'Merge k sorted lists efficiently. Use...',
    o: ['A heap of size k', 'Concatenate, then sort', 'A stack', 'A trie'],
    why: 'The heap holds the current head of each list, so each item costs O(log k). Sorting everything ignores the existing order.',
  },
  {
    q: 'Top k frequent items in O(n). Use...',
    o: ['Bucket sort by count', 'Sort by count', 'A BST', 'A stack'],
    why: 'Counts can never exceed n, so index buckets by count and read from the top. A heap gives O(n log k).',
  },
  {
    q: 'Minimum meeting rooms for a set of intervals. Use...',
    o: [
      'Sort by start, plus a min-heap of end times',
      'Sort by end, plus a stack',
      'Union-Find',
      'A trie',
    ],
    why: 'The heap holds the end time of each room in use. If the earliest end is before the next start, reuse that room.',
  },
  {
    q: 'Max number of non-overlapping intervals. Sort by...',
    o: ['End time, then pick greedily', 'Start time', 'Length', 'Input order'],
    why: 'Finishing earliest leaves the most room for the rest. This is a classic greedy proof.',
  },
  {
    q: 'A two-pointer sweep usually needs the data to be...',
    o: ['Sorted, or otherwise monotonic', 'In a hash map', 'In a tree', 'Unique'],
    why: 'You need to know which pointer to move. Sorted order tells you a sum that is too small needs a larger left value.',
  },
  {
    q: 'What does binary search really need?',
    o: [
      'A condition that flips once from false to true',
      'A sorted array of numbers only',
      'Unique values',
      'An even number of items',
    ],
    why: 'That is why it also works on answer ranges, like "can we finish at speed s?". Sorted arrays are only one example.',
  },
  {
    q: 'When does greedy work instead of DP?',
    o: [
      'When a locally best choice is always safe',
      'When subproblems overlap',
      'Whenever the input is sorted',
      'Whenever recursion is too slow',
    ],
    why: 'DP tries every choice and reuses results. Greedy commits to one, which only works if you can prove it never hurts.',
  },
  {
    q: 'What makes a problem a good fit for DP?',
    o: [
      'Overlapping subproblems and optimal substructure',
      'A sorted input',
      'A graph with no edges',
      'Only needing a single pass',
    ],
    why: 'The same smaller questions keep recurring, and their best answers combine into the best overall answer.',
  },

  // ---- graphs ----
  {
    q: 'Shortest path with no edge weights. Use...',
    o: ['BFS', 'DFS', 'Dijkstra', 'Topological sort'],
    why: 'BFS reaches nodes in order of hop count, in O(V + E). Dijkstra would work but only adds a log factor.',
  },
  {
    q: 'Shortest path with non-negative weights. Use...',
    o: ['Dijkstra', 'BFS', 'DFS', 'Union-Find'],
    why: 'It always settles the closest unsettled node, using a heap. Non-negative weights guarantee that distance is final.',
  },
  {
    q: 'Shortest path when some edges are negative. Use...',
    o: ['Bellman-Ford', 'Dijkstra', 'BFS', 'Prim'],
    why: 'It relaxes every edge V - 1 times, so it needs no greedy assumption, and it can also detect negative cycles.',
  },
  {
    q: 'Shortest path when every edge costs 0 or 1. The neat trick is...',
    o: ['0-1 BFS with a deque', 'Plain DFS', 'Union-Find', 'Sorting the edges'],
    why: 'Push 0-cost edges to the front and 1-cost edges to the back. It is O(V + E), with no heap.',
  },
  {
    q: 'Shortest paths between ALL pairs on a small graph. Use...',
    o: ['Floyd-Warshall', 'One BFS', 'Kruskal', 'Topological sort'],
    why: 'It is O(V³) and only a few lines of code, which is fine for a few hundred nodes.',
  },
  {
    q: 'Order tasks that have prerequisites. Use...',
    o: ['Topological sort', 'Dijkstra', 'Binary search', 'A trie'],
    why: 'Kahn’s algorithm repeatedly takes tasks with no remaining prerequisites. If some are left over, there is a cycle.',
  },
  {
    q: 'Connect all nodes at minimum total cost. Use...',
    o: ['Kruskal or Prim', 'BFS', 'Topological sort', 'Floyd-Warshall'],
    why: 'That is a minimum spanning tree. Kruskal sorts edges and uses Union-Find, while Prim grows out from a node with a heap.',
  },
  {
    q: 'Detect a cycle in a DIRECTED graph. Use...',
    o: [
      'DFS with three colors, or Kahn’s algorithm',
      'Union-Find alone',
      'BFS with one visited set',
      'A heap',
    ],
    why: 'You need "on the current path", not just "visited". Reaching a node twice is not a cycle in a directed graph.',
  },
  {
    q: 'Detect a cycle in an UNDIRECTED graph, simply. Use...',
    o: ['Union-Find', 'Topological sort', 'A heap', 'Bellman-Ford'],
    why: 'If an edge joins two nodes already in the same group, it closes a cycle. DFS tracking the parent also works.',
  },
  {
    q: 'Adjacency list or matrix for a sparse graph?',
    o: [
      'List: O(V + E) space',
      'Matrix: O(V²) space',
      'Matrix: faster iteration',
      'They use the same space',
    ],
    why: 'Most real graphs are sparse. A matrix wastes space but gives O(1) "is there an edge?" on dense graphs.',
  },
  {
    q: 'BFS vs DFS on a very wide, shallow tree: which uses less memory?',
    o: ['DFS', 'BFS', 'They use the same', 'It depends only on node values'],
    why: 'BFS stores a whole level at once, and DFS stores only the current path. On a very deep, thin tree it flips.',
  },

  // ---- how they work ----
  {
    q: 'Is a min-heap list fully sorted?',
    o: [
      'No: only each parent <= its children',
      'Yes, always',
      'Only after heapify',
      'Only with unique items',
    ],
    why: 'Only `h[0]` is guaranteed to be the minimum. The rest of the list is only partly ordered.',
  },
  {
    q: 'What is the cost of finding an arbitrary value in a heap?',
    o: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    why: 'A heap only helps with the top item, so anything else needs a full scan.',
  },
  {
    q: 'What is a binary heap’s underlying storage?',
    o: ['An array', 'A linked list', 'A hash map', 'A BST with pointers'],
    why: 'Children of index i are at 2i + 1 and 2i + 2, so no pointers are needed.',
  },
  {
    q: 'In-order traversal of a BST gives...',
    o: [
      'Values in sorted order',
      'Values in reverse insertion order',
      'Level by level',
      'Random order',
    ],
    why: 'Left subtree (smaller), then the node, then right subtree (larger). Useful for "k-th smallest" and validating a BST.',
  },
  {
    q: 'What happens if you insert sorted values into a plain BST?',
    o: [
      'It degrades to a linked list: O(n) operations',
      'It stays balanced',
      'It raises an error',
      'It becomes a heap',
    ],
    why: 'Every new value goes to the same side. Self-balancing trees (AVL, red-black) exist to prevent this.',
  },
  {
    q: 'Why is a hash map not worst-case O(1)?',
    o: [
      'Keys can collide into the same slot',
      'Hashing is O(n²)',
      'It must stay sorted',
      'It only works on integers',
    ],
    why: 'Many keys in one slot force a scan. Good hash functions and resizing make this rare, so it is O(1) on average.',
  },
  {
    q: 'What happens when a hash table gets too full?',
    o: [
      'It allocates a larger table and rehashes everything',
      'New inserts are rejected',
      'It deletes the oldest key',
      'It becomes a linked list',
    ],
    why: 'That single resize is O(n), but rare enough that inserts stay amortized O(1).',
  },
  {
    q: 'How can two stacks make a queue?',
    o: [
      'Push to one, pop from the other, moving items only when it is empty',
      'Alternate pushes between them',
      'Keep one stack sorted',
      'It cannot be done',
    ],
    why: 'Each item moves once, so operations are amortized O(1) even though a single pop can be O(n).',
  },
  {
    q: 'Why do databases use B-trees rather than binary trees?',
    o: [
      'High fan-out means few slow disk reads',
      'They use less CPU per comparison',
      'They avoid all balancing',
      'They only store integers',
    ],
    why: 'Each node holds many keys and fits a disk page, so the tree stays only a few levels tall.',
  },
  {
    q: 'What is a Bloom filter good for?',
    o: [
      'Compact "definitely not present" checks, with some false positives',
      'Exact counting',
      'Sorted iteration',
      'Shortest paths',
    ],
    why: 'It uses a few bits per item. "No" is certain, "yes" only means probably, and items cannot be listed back.',
  },
  {
    q: 'Python list vs tuple for a fixed record?',
    o: [
      'Tuple: immutable, hashable if its items are, and a little smaller',
      'List: faster to read',
      'Tuple: supports append',
      'List: can be a dict key',
    ],
    why: 'Use a tuple when the shape is fixed, such as coordinates or memo keys. Use a list when items change.',
  },
  {
    q: 'What does OrderedDict still add over a plain dict?',
    o: [
      'move_to_end and popitem(last=False)',
      'Keeping insertion order',
      'Sorted keys',
      'Faster lookups',
    ],
    why: 'Plain dicts keep insertion order too. `OrderedDict` adds cheap reordering, which is what LRU caches need.',
  },
]

export const STRUCTURES = QUESTIONS.map((x) => ({ ...x, a: 0, tag: 'dsa', kind: 'choice' }))

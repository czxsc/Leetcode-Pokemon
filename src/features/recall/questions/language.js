// Language deck: what Python is good and bad at, how it compares to other languages, general
// programming concepts, and "what does this print?" snippets that catch common surprises.

const CONCEPTS = [
  // ---- Python strengths and weaknesses ----
  {
    q: 'Python’s biggest strength in a coding interview?',
    o: [
      'Short syntax and a big standard library',
      'It runs CPU-heavy loops faster than C++',
      'The compiler catches type errors',
      'Threads use every core by default',
    ],
    a: 0,
    why: 'Things like `Counter`, `heapq`, slicing and big integers mean less code to write, so you can focus on the algorithm.',
  },
  {
    q: 'Python’s main weakness compared with C++ or Rust?',
    o: [
      'Slower execution and more memory per object',
      'It has no hash maps',
      'It cannot do recursion',
      'It has no standard library for sorting',
    ],
    a: 0,
    why: 'Every value is a full heap object and the interpreter does extra work per operation. Loops can run 10 to 100 times slower.',
  },
  {
    q: 'What does the GIL do in standard CPython?',
    o: [
      'Lets only one thread run Python bytecode at a time',
      'Frees unused memory',
      'Compiles code to machine code',
      'Blocks all network calls',
    ],
    a: 0,
    why: 'The Global Interpreter Lock keeps the interpreter safe, but threads cannot run Python code in parallel. Newer versions offer an optional free-threaded build.',
  },
  {
    q: 'Where does the GIL hurt most?',
    o: [
      'CPU-bound work split across threads',
      'Waiting on network calls',
      'Reading files',
      'Single-threaded scripts',
    ],
    a: 0,
    why: 'Threads waiting on I/O release the GIL, so I/O still benefits. CPU-bound threads just take turns.',
  },
  {
    q: 'Best way to speed up CPU-heavy Python across many cores?',
    o: ['multiprocessing', 'threading', 'asyncio', 'More recursion'],
    a: 0,
    why: 'Each process has its own interpreter and its own GIL, so they truly run in parallel. The cost is copying data between them.',
  },
  {
    q: 'Best fit for 10,000 concurrent network requests in Python?',
    o: ['asyncio', 'multiprocessing', 'A tight for loop', 'Recursion'],
    a: 0,
    why: 'The work is mostly waiting. `async`/`await` juggles many waits on one thread, with far less overhead than one thread or process each.',
  },
  {
    q: 'Why is NumPy so much faster than a Python loop?',
    o: [
      'Typed arrays processed in compiled C',
      'It uses a bigger GIL',
      'It caches every answer',
      'It runs on the GPU by default',
    ],
    a: 0,
    why: 'Values sit side by side in one block of memory with one type, and the loop runs in C, so there is no per-item interpreter work.',
  },
  {
    q: 'How does CPython run your code?',
    o: [
      'Compiles to bytecode, then a VM interprets it',
      'Compiles straight to a native binary',
      'Reads the source line by line, with no compile step',
      'Translates it to C++ first',
    ],
    a: 0,
    why: 'Source becomes bytecode (the `.pyc` files), and the interpreter loop runs that. So "interpreted" still includes a compile step.',
  },
  {
    q: 'How does CPython free most objects?',
    o: [
      'Reference counting, plus a cycle collector',
      'You must call free()',
      'Only when the program exits',
      'Compile-time ownership rules',
    ],
    a: 0,
    why: 'An object is freed as soon as its count hits zero. The cycle collector handles objects that only point at each other.',
  },
  {
    q: 'What happens with very deep recursion in Python?',
    o: [
      'RecursionError, around depth 1000 by default',
      'It runs forever safely',
      'Python turns it into a loop',
      'It silently returns None',
    ],
    a: 0,
    why: 'CPython has a recursion limit and no tail-call optimization. Use `sys.setrecursionlimit` or write it iteratively.',
  },
  {
    q: 'What happens when a Python int gets very large?',
    o: [
      'It grows, with no overflow',
      'It wraps around like C',
      'It becomes a float',
      'It raises OverflowError',
    ],
    a: 0,
    why: 'Python ints are arbitrary precision. That is why bit tricks that rely on 32-bit overflow need a manual mask such as `& 0xFFFFFFFF`.',
  },
  {
    q: 'How should you compare two floats?',
    o: ['math.isclose(a, b)', 'a == b', 'a is b', 'str(a) == str(b)'],
    a: 0,
    why: 'Most decimals have no exact binary form, so `0.1 + 0.2 != 0.3`. Compare within a tolerance.',
  },

  // ---- typing ----
  {
    q: 'What does "dynamically typed" mean?',
    o: [
      'Types belong to values and are checked at runtime',
      'Variables can never change',
      'The compiler checks every type',
      'Everything is a string',
    ],
    a: 0,
    why: 'A name can point at any type, and errors only show up when the line runs. Static languages check before running.',
  },
  {
    q: 'Python is dynamically typed. Is it also strongly typed?',
    o: [
      "Yes: '1' + 1 raises TypeError",
      "No: '1' + 1 gives '11'",
      "No: '1' + 1 gives 2",
      'Only with type hints',
    ],
    a: 0,
    why: 'Strong means it will not silently convert between unrelated types. JavaScript gives `"11"`, which is the weakly typed behavior.',
  },
  {
    q: 'What do type hints do when Python runs?',
    o: [
      'Almost nothing: tools like mypy check them instead',
      'They raise TypeError on a mismatch',
      'They make code faster',
      'They convert arguments automatically',
    ],
    a: 0,
    why: 'Hints are stored as metadata and not enforced at runtime. Their value is in editors and type checkers.',
  },
  {
    q: 'What is duck typing?',
    o: [
      'If it has the methods you need, it works, whatever its class',
      'Every class must inherit from one base',
      'Types are checked at compile time',
      'Variables must declare a type',
    ],
    a: 0,
    why: 'Anything with `__iter__` can be looped over and anything with `__len__` works with `len()`. Behavior matters, not the class name.',
  },
  {
    q: 'What do you gain from a static compile step (Java, Go, Rust)?',
    o: [
      'Errors found earlier and usually faster code',
      'Shorter programs',
      'No need for tests',
      'Automatic parallelism',
    ],
    a: 0,
    why: 'The compiler knows the types, so it rejects mistakes before running and can generate efficient machine code.',
  },

  // ---- Python data model ----
  {
    q: 'Difference between `is` and `==`?',
    o: [
      'is: same object. ==: equal values',
      'is: equal values. ==: same object',
      'They are identical',
      'is only works on numbers',
    ],
    a: 0,
    why: '`[1] == [1]` is True, but `[1] is [1]` is False. Use `is` only for `None`.',
  },
  {
    q: 'Which of these is mutable?',
    o: ['list', 'tuple', 'str', 'frozenset'],
    a: 0,
    why: 'Lists, dicts and sets can change after creation. Strings, tuples, numbers and frozensets cannot.',
  },
  {
    q: 'Which of these can be a dict key?',
    o: ['(1, 2)', '[1, 2]', '{1, 2}', '([1], 2)'],
    a: 0,
    why: 'Keys must be hashable. A tuple is hashable only if everything inside it is, so `([1], 2)` fails.',
  },
  {
    q: 'Why can a list not be a dict key?',
    o: [
      'It is mutable, so its hash could change',
      'Lists are too slow',
      'Dicts only allow strings',
      'Lists have no length',
    ],
    a: 0,
    why: 'If a key changed after insertion, the dict would look in the wrong slot and lose it. Convert it with `tuple(lst)`.',
  },
  {
    q: 'You define `__eq__` on a class but not `__hash__`. What happens?',
    o: [
      'Instances become unhashable',
      'Python compares by id',
      'It raises a SyntaxError',
      'Nothing changes',
    ],
    a: 0,
    why: 'Equal objects must have equal hashes, so Python removes the default hash. Add `__hash__`, or use `@dataclass(frozen=True)`.',
  },
  {
    q: 'How does Python pass arguments to functions?',
    o: [
      'It passes references to objects',
      'It always copies the value',
      'Like C++ references, so reassigning changes the caller',
      'As strings',
    ],
    a: 0,
    why: 'Mutating the object is visible to the caller, because it is the same object. Reassigning the name only changes the local variable.',
  },
  {
    q: 'What is the difference between a shallow and a deep copy?',
    o: [
      'Shallow shares nested objects, deep copies them too',
      'Shallow is only for strings',
      'Deep copies only the top level',
      'They differ only in speed',
    ],
    a: 0,
    why: '`a[:]` and `list(a)` are shallow, so inner lists stay shared. `copy.deepcopy(a)` duplicates everything.',
  },
  {
    q: 'Does a dict keep insertion order?',
    o: [
      'Yes, guaranteed since Python 3.7',
      'No, the order is random',
      'Only with fewer than 8 keys',
      'It sorts keys automatically',
    ],
    a: 0,
    why: 'Regular dicts remember insertion order. Sets make no such promise.',
  },
  {
    q: 'What does a stable sort guarantee?',
    o: [
      'Equal items keep their original order',
      'It always runs in O(n)',
      'It uses no extra memory',
      'It never compares items',
    ],
    a: 0,
    why: 'Python’s sort is stable, so you can sort by a secondary key first and then by the primary key.',
  },

  // ---- functions, generators, classes ----
  {
    q: 'Why use a generator instead of building a list?',
    o: [
      'It produces items lazily, using O(1) memory',
      'It can be iterated many times',
      'It supports indexing',
      'It sorts the items',
    ],
    a: 0,
    why: 'Values are made on demand, so huge or infinite sequences are fine. The catch is that it can only be consumed once.',
  },
  {
    q: 'Iterable vs iterator?',
    o: [
      'An iterable makes iterators. An iterator tracks position and has next()',
      'They are the same thing',
      'Iterators are always lists',
      'Iterables can only be looped once',
    ],
    a: 0,
    why: 'A list is iterable: every `for` gets a fresh iterator. `iter(lst)` is an iterator: once used up, it stays empty.',
  },
  {
    q: 'What is a decorator?',
    o: [
      'A function that takes a function and returns a replacement',
      'A comment the interpreter reads',
      'A kind of class',
      'A way to import modules',
    ],
    a: 0,
    why: '`@cache` above `def f` is shorthand for `f = cache(f)`. It wraps the function with extra behavior.',
  },
  {
    q: 'What does `with open(path) as f:` guarantee?',
    o: [
      'The file closes even if an exception happens',
      'The file is read into memory',
      'The file is locked from others',
      'The file exists',
    ],
    a: 0,
    why: 'Context managers run `__exit__` however the block ends. The same pattern works for locks and connections.',
  },
  {
    q: 'What do `*args` and `**kwargs` collect?',
    o: [
      'Extra positional args as a tuple, extra keyword args as a dict',
      'Pointers and references',
      'Both collect lists',
      'Required arguments only',
    ],
    a: 0,
    why: 'The stars collect in a function definition. In a call they do the reverse and unpack: `f(*lst, **opts)`.',
  },
  {
    q: '`@staticmethod` vs `@classmethod`?',
    o: [
      'Static gets no implicit arg, class gets cls',
      'Static gets self, class gets nothing',
      'They are the same',
      'Class methods cannot be inherited',
    ],
    a: 0,
    why: 'Class methods know which class they were called on, so they suit alternate constructors. Static methods are plain functions kept in the class.',
  },
  {
    q: 'Why add `__lt__` to a class?',
    o: [
      'So sort and heapq can compare instances',
      'So it can be hashed',
      'So it can be printed',
      'So it can be copied',
    ],
    a: 0,
    why: 'Sorting and heaps only use `<`. Without `__lt__`, comparing two instances raises `TypeError`.',
  },
  {
    q: '`__str__` vs `__repr__`?',
    o: [
      'str is for users, repr is for developers and debugging',
      'repr is for users, str is for debugging',
      'They are always identical',
      'str only works on strings',
    ],
    a: 0,
    why: '`print` uses `__str__`. Containers and the REPL show `__repr__`. If only `__repr__` is defined, `str()` falls back to it.',
  },
  {
    q: 'What does `@dataclass` give you?',
    o: [
      'Generated __init__, __repr__ and __eq__ from the fields',
      'Faster attribute access',
      'A database table',
      'Automatic type checking',
    ],
    a: 0,
    why: 'It removes boilerplate for classes that mostly hold data. `order=True` also adds comparisons, and `frozen=True` makes it hashable.',
  },
  {
    q: 'What does a leading underscore like `self._x` mean?',
    o: [
      'A convention: treat it as internal',
      'Python blocks access from outside',
      'It is a constant',
      'It is a class variable',
    ],
    a: 0,
    why: 'Python has no real private fields. `__x` only renames the attribute to avoid subclass clashes.',
  },
  {
    q: 'When does the `else` of a `try` block run?',
    o: [
      'When no exception was raised',
      'When an exception was raised',
      'Always, like finally',
      'Only inside a loop',
    ],
    a: 0,
    why: 'Order: `try`, then `except` if it failed or `else` if it did not, then `finally` every time.',
  },
  {
    q: 'What does EAFP mean in Python style?',
    o: [
      'Try it, and catch the exception if it fails',
      'Check every condition first',
      'Avoid exceptions completely',
      'Always use type hints',
    ],
    a: 0,
    why: '"Easier to ask forgiveness than permission": `try: d[k]` with `except KeyError`. Checking first is called LBYL, "look before you leap".',
  },
  {
    q: 'Which keyword lets an inner function reassign a variable of its enclosing function?',
    o: ['nonlocal', 'global', 'static', 'extern'],
    a: 0,
    why: 'Assigning makes a name local unless you say otherwise. Common in DFS helpers: `nonlocal best`. Mutating (like `.append`) needs no keyword.',
  },

  // ---- other languages ----
  {
    q: 'Which language gives memory safety without a garbage collector?',
    o: ['Rust', 'Java', 'Python', 'JavaScript'],
    a: 0,
    why: 'Rust checks ownership and borrowing at compile time, so memory is freed predictably and with no GC pauses.',
  },
  {
    q: 'In Java, what does `==` compare on two String objects?',
    o: ['References', 'Characters', 'Lengths', 'Hash codes'],
    a: 0,
    why: 'Use `.equals()` for contents. Python is the opposite: `==` compares values and `is` compares identity.',
  },
  {
    q: 'JavaScript runs your code on...',
    o: [
      'One thread with an event loop',
      'One thread per function',
      'All cores by default',
      'A new process per call',
    ],
    a: 0,
    why: 'Async callbacks wait in a queue and run when the stack is empty. Long CPU work blocks everything else.',
  },
  {
    q: 'What is Go best known for making easy?',
    o: [
      'Lightweight concurrency with goroutines and channels',
      'Manual memory management',
      'Multiple inheritance',
      'Metaprogramming with macros',
    ],
    a: 0,
    why: 'Goroutines are cheap to start, with the runtime scheduling them onto OS threads. Go also compiles to fast static binaries.',
  },
  {
    q: 'What does `std::map` use in C++, compared to `std::unordered_map`?',
    o: [
      'map: balanced tree. unordered_map: hash table',
      'map: hash table. unordered_map: balanced tree',
      'Both are hash tables',
      'Both are arrays',
    ],
    a: 0,
    why: 'Trees keep keys sorted with O(log n) operations. Hash tables are O(1) on average with no order. Java has the same split: TreeMap vs HashMap.',
  },
  {
    q: 'What is RAII in C++?',
    o: [
      'A resource is tied to an object’s lifetime, freed by its destructor',
      'A kind of garbage collector',
      'A sorting algorithm',
      'Runtime type checking',
    ],
    a: 0,
    why: 'When the object goes out of scope, the resource is released, even on exceptions. Python’s `with` solves a similar problem.',
  },
  {
    q: 'What does integer division `-7 / 2` give in Java or C++?',
    o: ['-3', '-4', '-3.5', 'A compile error'],
    a: 0,
    why: 'They truncate toward zero. Python’s `//` floors instead, giving -4. This matters for mid-points and modulo with negatives.',
  },
  {
    q: 'Why avoid `s += c` in a Java loop?',
    o: [
      'Strings are immutable, so each one copies: O(n²)',
      'It does not compile',
      'It changes the original string',
      'It only works on chars',
    ],
    a: 0,
    why: 'Use `StringBuilder` in Java and `"".join(parts)` in Python. Both build the result once.',
  },
  {
    q: 'What does a garbage collector cost you?',
    o: [
      'Extra memory and occasional pauses',
      'It leaks memory',
      'It makes code unsafe',
      'Nothing at all',
    ],
    a: 0,
    why: 'You stop managing memory by hand, but the runtime has to track and collect it. That is why low-latency systems may avoid GC languages.',
  },

  // ---- concurrency and memory ----
  {
    q: 'Concurrency vs parallelism?',
    o: [
      'Concurrency: managing many tasks. Parallelism: running at the same instant',
      'They mean the same thing',
      'Parallelism needs one core',
      'Concurrency needs many cores',
    ],
    a: 0,
    why: 'One core can be concurrent by switching between tasks. Parallelism needs multiple cores working at once.',
  },
  {
    q: 'Thread vs process?',
    o: [
      'Threads share memory, processes have their own',
      'Processes share memory, threads do not',
      'Threads cannot run at the same time in any language',
      'They are the same',
    ],
    a: 0,
    why: 'Threads are lighter and share data easily, but need locks. Processes are isolated and heavier to start and communicate between.',
  },
  {
    q: 'What is a race condition?',
    o: [
      'The result depends on the timing of threads touching shared data',
      'Two threads waiting on each other forever',
      'A thread running too slowly',
      'A process running out of memory',
    ],
    a: 0,
    why: '`count += 1` is a read, an add and a write, so two threads can overwrite each other. A lock or atomic operation fixes it.',
  },
  {
    q: 'What is a deadlock?',
    o: [
      'Threads wait on each other forever',
      'Two threads corrupt shared data',
      'A thread crashes',
      'A loop never ends',
    ],
    a: 0,
    why: 'Thread A holds lock 1 and wants 2, while B holds 2 and wants 1. Always taking locks in the same order prevents it.',
  },
  {
    q: 'Stack vs heap memory?',
    o: [
      'Stack: call frames, freed on return. Heap: objects that outlive a call',
      'Stack is for objects, heap is for frames',
      'The heap is always faster',
      'They are the same memory',
    ],
    a: 0,
    why: 'Stack allocation is just moving a pointer, but its size is limited (hence stack overflow). This "heap" has nothing to do with the heap data structure.',
  },

  // ---- general design ----
  {
    q: 'What does polymorphism let you do?',
    o: [
      'Call the same method on different types',
      'Hide fields from callers',
      'Inherit from many classes',
      'Run code in parallel',
    ],
    a: 0,
    why: '`shape.area()` works whether `shape` is a circle or a square, and each type supplies its own version.',
  },
  {
    q: 'What is encapsulation?',
    o: [
      'Hiding internal details behind a small interface',
      'Copying objects',
      'Inheriting behavior',
      'Running code in a container',
    ],
    a: 0,
    why: 'Callers use the public methods, so you can change the internals without breaking them.',
  },
  {
    q: 'Why prefer composition over inheritance?',
    o: [
      'Parts stay loosely coupled and easy to swap',
      'It is always faster',
      'Python has no inheritance',
      'It uses less memory',
    ],
    a: 0,
    why: 'Holding a helper object avoids the deep hierarchies and tight coupling that come with subclassing. Use inheritance for true "is-a" relations.',
  },
  {
    q: 'What makes a function "pure"?',
    o: [
      'Same input gives same output, with no side effects',
      'It has no arguments',
      'It is written in one line',
      'It only uses integers',
    ],
    a: 0,
    why: 'Pure functions are easy to test, cache and run in parallel, which is what makes `@cache` safe to use.',
  },
]

// The first option is the real result: what the snippet prints, or the error it raises
const OUTPUTS = [
  {
    code: `
def add(x, items=[]):
    items.append(x)
    return items

add(1)
print(add(2))`,
    o: ['[1, 2]', '[2]', '[1]', 'TypeError'],
    why: 'The default list is created once, when `def` runs, and shared by every call. Use `items=None`, then create the list inside.',
  },
  {
    code: `
grid = [[0] * 2] * 2
grid[0][0] = 1
print(grid)`,
    o: ['[[1, 0], [1, 0]]', '[[1, 0], [0, 0]]', '[[1, 1], [1, 1]]', '[[0, 0], [0, 0]]'],
    why: 'The outer `* 2` repeats a reference to the same inner list, so both rows are one list. Build it with a comprehension instead.',
  },
  {
    code: `
fs = [lambda: i for i in range(3)]
print([f() for f in fs])`,
    o: ['[2, 2, 2]', '[0, 1, 2]', '[0, 0, 0]', 'NameError'],
    why: 'Closures capture the variable, not its value, and `i` ends at 2. Bind it early with `lambda i=i: i`.',
  },
  {
    code: `
a = [[1], [2]]
b = a[:]
b[0].append(9)
b.append([3])
print(a)`,
    o: ['[[1, 9], [2]]', '[[1], [2]]', '[[1, 9], [2], [3]]', '[[1], [2], [3]]'],
    why: '`a[:]` is shallow: a new outer list holding the same inner lists. Changing an inner list shows up in both, but appending to `b` does not.',
  },
  {
    code: `
print(-7 // 2, -7 % 3)`,
    o: ['-4 2', '-3 -1', '-4 -1', '-3 2'],
    why: '`//` rounds down, not toward zero. `%` takes the sign of the divisor, so the result here is non-negative.',
  },
  {
    code: `
print(int(-3.7), round(2.5), round(3.5))`,
    o: ['-3 2 4', '-4 3 4', '-3 3 4', '-4 2 4'],
    why: '`int` truncates toward zero. `round` sends exact halves to the nearest even number, known as banker’s rounding.',
  },
  {
    code: `
a = [1, 2, 3]
print(a[1:100], a[5:])`,
    o: ['[2, 3] []', 'IndexError', '[2, 3] None', '[1, 2, 3] []'],
    why: 'Slices clamp to the list bounds and never raise. Only a single index like `a[5]` raises `IndexError`.',
  },
  {
    code: `
print([1, 2, 3, 4, 5][::-2])`,
    o: ['[5, 3, 1]', '[4, 2]', '[1, 3, 5]', '[5, 4]'],
    why: 'A negative step starts at the end and walks backwards, here taking every second item.',
  },
  {
    code: `
t = (1)
u = (1,)
print(type(t).__name__, type(u).__name__)`,
    o: ['int tuple', 'tuple tuple', 'int int', 'tuple int'],
    why: 'The comma makes a tuple, not the parentheses. `(1)` is just the number 1 in brackets.',
  },
  {
    code: `
x = [1, 2]
y = x
y += [3]
y = y + [4]
print(x, y)`,
    o: [
      '[1, 2, 3] [1, 2, 3, 4]',
      '[1, 2] [1, 2, 3, 4]',
      '[1, 2, 3, 4] [1, 2, 3, 4]',
      '[1, 2, 3] [1, 2, 3]',
    ],
    why: '`+=` extends the shared list in place, so `x` sees it. `y + [4]` builds a new list and points only `y` at it.',
  },
  {
    code: `
s = 'abc'
s.upper()
print(s)`,
    o: ['abc', 'ABC', 'None', 'AttributeError'],
    why: 'Strings are immutable, so `.upper()` returns a new string, and here it is thrown away. You need `s = s.upper()`.',
  },
  {
    code: `
print([3, 1, 2].sort())`,
    o: ['None', '[1, 2, 3]', '[3, 1, 2]', 'TypeError'],
    why: '`.sort()` works in place and returns `None`. Use `sorted(...)` when you want the result as a value.',
  },
  {
    code: `
print(sorted(['bb', 'a', 'dd', 'ccc', 'e'], key=len))`,
    o: [
      "['a', 'e', 'bb', 'dd', 'ccc']",
      "['e', 'a', 'dd', 'bb', 'ccc']",
      "['a', 'bb', 'ccc', 'dd', 'e']",
      "['ccc', 'bb', 'dd', 'a', 'e']",
    ],
    why: 'The sort is stable, so items of equal length keep their original order.',
  },
  {
    code: `
from collections import defaultdict

d = defaultdict(int)
if d['x'] == 0:
    pass
print(len(d))`,
    o: ['1', '0', 'KeyError', 'None'],
    why: 'Just reading a missing key creates it. Use `"x" in d` or `d.get("x")` to check without adding it.',
  },
  {
    code: `
from collections import Counter

c = Counter('aab')
print(c['z'], len(c))`,
    o: ['0 2', '0 3', 'KeyError', 'None 2'],
    why: 'A `Counter` returns 0 for missing keys but, unlike `defaultdict`, does not add them when read.',
  },
  {
    code: `
print(any([]), all([]))`,
    o: ['False True', 'False False', 'True True', 'True False'],
    why: '`any` looks for one truthy item and finds none. `all` looks for a falsy one and finds none, so it is True.',
  },
  {
    code: `
a = [1, 2, 3, 4]
for x in a:
    a.remove(x)
print(a)`,
    o: ['[2, 4]', '[]', '[1, 3]', '[4]'],
    why: 'Removing shifts items left while the loop index keeps moving, so every other item is skipped. Loop over a copy, or build a new list.',
  },
  {
    code: `
for i in range(3):
    if i == 5:
        break
else:
    print('done')`,
    o: ['done', 'Nothing prints', '2', 'SyntaxError'],
    why: 'A loop’s `else` runs when the loop finishes without `break`. It is useful for search loops.',
  },
  {
    code: `
g = (x for x in [1, 2])
print(sum(g), sum(g))`,
    o: ['3 0', '3 3', '0 0', 'TypeError'],
    why: 'A generator can only be consumed once. The second `sum` finds it already empty.',
  },
  {
    code: `
print(list(zip([1, 2, 3], 'ab')))`,
    o: [
      "[(1, 'a'), (2, 'b')]",
      "[(1, 'a'), (2, 'b'), (3, None)]",
      'ValueError',
      "[(1, 2, 3), ('a', 'b')]",
    ],
    why: '`zip` stops at the shorter input. `zip_longest` fills the gaps, and `zip(..., strict=True)` raises instead.',
  },
  {
    code: `
print(True + True, sum([True, False, True]))`,
    o: ['2 2', 'True True', 'TypeError', '1 2'],
    why: '`bool` is a subclass of `int`, with `True` = 1 and `False` = 0. That is why `sum` can count matches.',
  },
  {
    code: `
import heapq

h = [(2, 'b'), (1, 'z'), (1, 'a')]
heapq.heapify(h)
print(heapq.heappop(h))`,
    o: ["(1, 'a')", "(1, 'z')", "(2, 'b')", 'TypeError'],
    why: 'Tuples compare left to right, so a tie on 1 is broken by the string. If the second item cannot be compared, this raises `TypeError`.',
  },
  {
    code: `
a, *b, c = [1, 2, 3, 4]
print(b)`,
    o: ['[2, 3]', '(2, 3)', '2', 'ValueError'],
    why: 'The starred name collects whatever is left over, always as a list.',
  },
  {
    code: `
count = 0
def inc():
    count += 1
inc()
print(count)`,
    o: ['UnboundLocalError', '1', '0', 'NameError'],
    why: 'Assigning anywhere in a function makes that name local, so `count += 1` reads a local that has no value yet. Declare it `global` or `nonlocal`.',
  },
  {
    code: `
d = {}
d.setdefault('k', []).append(1)
d.setdefault('k', []).append(2)
print(d)`,
    o: ["{'k': [1, 2]}", "{'k': [2]}", "{'k': [1]}", 'KeyError'],
    why: '`setdefault` returns the existing value, adding the default only when the key is missing. So both appends hit the same list.',
  },
  {
    code: `
print([1, 2] < [1, 2, 0], 'Z' < 'a')`,
    o: ['True True', 'False True', 'True False', 'TypeError'],
    why: 'Sequences compare item by item, and a shorter prefix comes first. Uppercase letters have lower character codes than lowercase ones.',
  },
  {
    code: `
print(2 ** 3 ** 2)`,
    o: ['512', '64', '256', '12'],
    why: '`**` is right-associative, so this is 2 ** 9. Most other operators group left to right.',
  },
  {
    code: `
print(1 if [] else 2, 1 if [0] else 2)`,
    o: ['2 1', '1 2', '2 2', '1 1'],
    why: 'Empty containers are falsy. `[0]` has one item, so it is truthy, whatever that item is.',
  },
  {
    code: `
print(~5, 5 ^ 3)`,
    o: ['-6 6', '-5 6', '-6 2', '-5 125'],
    why: '`~x` equals `-x - 1` (two’s complement). `^` is XOR, not power: `101 ^ 011 = 110`.',
  },
  {
    code: `
print('a,b,,c'.split(','), '  a  b '.split())`,
    o: [
      "['a', 'b', '', 'c'] ['a', 'b']",
      "['a', 'b', 'c'] ['a', 'b']",
      "['a', 'b', '', 'c'] ['', 'a', '', 'b', '']",
      "['a', 'b', 'c'] ['', 'a', 'b', '']",
    ],
    why: 'With a separator, empty pieces are kept. With no argument, it splits on runs of whitespace and drops the empties.',
  },
  {
    code: `
from bisect import bisect_left, bisect_right

a = [1, 2, 2, 3]
print(bisect_left(a, 2), bisect_right(a, 2))`,
    o: ['1 3', '1 2', '2 3', '0 3'],
    why: '`bisect_left` gives the first index with a value >= 2. `bisect_right` gives the first index with a value > 2. Their difference is the count of 2s.',
  },
  {
    code: `
from collections import deque

d = deque([1, 2, 3])
d.rotate(1)
print(list(d))`,
    o: ['[3, 1, 2]', '[2, 3, 1]', '[1, 2, 3]', '[3, 2, 1]'],
    why: 'A positive rotate moves items right, wrapping the end around to the front. `rotate(-1)` goes left.',
  },
  {
    code: `
print({1: 'a', 1.0: 'b', True: 'c'})`,
    o: ["{1: 'c'}", "{1: 'a', 1.0: 'b', True: 'c'}", "{True: 'c'}", 'TypeError'],
    why: '`1`, `1.0` and `True` are equal with the same hash, so they are one key. The first key stays and the last value wins.',
  },
  {
    code: `
print(list(range(5, 0, -2)))`,
    o: ['[5, 3, 1]', '[5, 3, 1, 0]', '[4, 2, 0]', '[]'],
    why: 'It starts at 5 and steps by -2. The stop value 0 is excluded and would not be landed on anyway.',
  },
  {
    code: `
d = {1: 'a'}
for k in d:
    d[k + 1] = 'b'
print(len(d))`,
    o: ['RuntimeError', '2', '1', 'KeyError'],
    why: 'Adding keys while looping over a dict raises `RuntimeError`. Loop over `list(d)` instead.',
  },
  {
    code: `
print('abc'.index('z'))`,
    o: ['ValueError', '-1', 'None', 'IndexError'],
    why: '`index` raises `ValueError` when nothing is found. `find` returns -1 instead, so use it when a miss is normal.',
  },
]

export const LANGUAGE = [
  ...CONCEPTS.map((x) => ({ ...x, tag: 'lang', kind: 'choice' })),
  ...OUTPUTS.map((x) => ({
    ...x,
    code: x.code.trim(),
    q: 'What does this print or raise?',
    a: 0,
    tag: 'output',
    kind: 'choice',
  })),
]

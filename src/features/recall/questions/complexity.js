// Time complexity deck: read an implementation, name its Big-O. Options run cheapest to most
// expensive, so they keep their order on screen (`ordered`) instead of being shuffled.

const SNIPPETS = [
  // ---- shrinking a number ----
  {
    id: 'digits',
    code: `
def count_digits(n):
    count = 0
    while n > 0:
        n //= 10
        count += 1
    return count`,
    q: 'Time complexity, in terms of the value `n`?',
    o: ['O(1)', 'O(log n)', 'O(√n)', 'O(n)'],
    a: 1,
    why: 'Each `//= 10` drops one digit, and `n` has about log₁₀(n) digits. The base of a log is only a constant factor, so this is O(log n).',
  },
  {
    id: 'subtract-10',
    code: `
def countdown(n):
    steps = 0
    while n > 0:
        n -= 10
        steps += 1
    return steps`,
    o: ['O(1)', 'O(log n)', 'O(√n)', 'O(n)'],
    a: 3,
    why: 'Subtracting a constant takes n/10 steps, and n/10 is still O(n). Only dividing makes it logarithmic.',
  },
  {
    id: 'shrink-09',
    code: `
def decay(n):
    steps = 0
    while n > 1:
        n *= 0.9
        steps += 1
    return steps`,
    o: ['O(1)', 'O(log n)', 'O(√n)', 'O(n)'],
    a: 1,
    why: 'Shrinking by any constant ratio is logarithmic, even a slow one. This is log base 10/9 of n.',
  },
  {
    id: 'div-growing',
    code: `
def f(n):
    d = 2
    steps = 0
    while n > 0:
        n //= d
        d += 1
        steps += 1
    return steps`,
    q: 'Tightest bound?',
    o: ['O(log log n)', 'O(log n / log log n)', 'O(log n)', 'O(√n)'],
    a: 1,
    why: 'After k loops `n` has been divided by k!, so it stops once k! > n. That k grows like log n / log log n, a little slower than log n.',
  },
  {
    id: 'div-inner',
    code: `
def f(n):
    total = 0
    while n > 0:
        n //= 10
        for _ in range(n):
            total += 1
    return total`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 1,
    why: 'The inner loop runs n/10 + n/100 + n/1000 + ... times. That geometric series adds up to O(n), not O(n log n).',
  },
  {
    id: 'str-in-loop',
    code: `
def f(n):
    total = 0
    while n > 0:
        total += len(str(n))
        n //= 10
    return total`,
    q: 'Treat `str(n)` as O(digits). Time complexity?',
    o: ['O(log n)', 'O(log² n)', 'O(n)', 'O(n log n)'],
    a: 1,
    why: 'There are log n loops, and each builds a string of up to log n digits, so O(log n · log n).',
  },
  {
    id: 'all-digits',
    code: `
def total_digits(n):
    total = 0
    for i in range(1, n + 1):
        while i > 0:
            i //= 10
            total += 1
    return total`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 2,
    why: 'n numbers, each with up to log n digits. Changing `i` inside the body is safe here: the `for` takes its next value from `range`, not from `i`.',
  },
  {
    id: 'digital-root',
    code: `
def digital_root(n):
    while n >= 10:
        n = sum(int(d) for d in str(n))
    return n`,
    o: ['O(log log n)', 'O(log n)', 'O(log² n)', 'O(n)'],
    a: 1,
    why: 'The first pass walks all log n digits. The digit sum is tiny by comparison (at most 9 per digit), so later passes barely add anything.',
  },
  {
    id: 'happy',
    code: `
def is_happy(n):
    seen = set()
    while n != 1 and n not in seen:
        seen.add(n)
        n = sum(int(d) ** 2 for d in str(n))
    return n == 1`,
    o: ['O(1)', 'O(log n)', 'O(√n)', 'O(n)'],
    a: 1,
    why: 'The first step costs log n digits and collapses `n` to at most 81 per digit. From there it stays under a few hundred, so the remaining steps are bounded.',
  },
  {
    id: 'sqrt-steps',
    code: `
def f(n):
    steps = 0
    while n > 1:
        n = int(n ** 0.5)
        steps += 1
    return steps`,
    o: ['O(log log n)', 'O(log n)', 'O(√n)', 'O(n)'],
    a: 0,
    why: 'A square root halves the number of digits. Halving log n until it reaches 1 takes log(log n) steps.',
  },
  {
    id: 'sub-sqrt',
    code: `
from math import isqrt

def f(n):
    steps = 0
    while n > 0:
        n -= max(1, isqrt(n))
        steps += 1
    return steps`,
    o: ['O(log n)', 'O(√n)', 'O(n / log n)', 'O(n)'],
    a: 1,
    why: 'Taking √n off each time gets from n to n/4 in about √n steps. The next stretch is half as long, and that series sums to O(√n).',
  },
  {
    id: 'steps-binary',
    code: `
def steps_to_zero(n):
    steps = 0
    while n:
        n = n - 1 if n % 2 else n // 2
        steps += 1
    return steps`,
    o: ['O(log n)', 'O(√n)', 'O(n)', 'O(n log n)'],
    a: 0,
    why: 'An odd `n` becomes even on the next step, so `n` halves at least every 2 steps: at most 2·log₂(n) steps.',
  },
  {
    id: 'kernighan',
    code: `
def count_bits(n):
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count`,
    o: ['O(1)', 'O(k), k = number of 1 bits', 'O(k²), k = number of 1 bits', 'O(n)'],
    a: 1,
    why: '`n & (n - 1)` clears the lowest 1 bit, so it loops once per set bit, which is at most log n.',
  },
  {
    id: 'gcd-mod',
    code: `
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a`,
    o: ['O(log min(a, b))', 'O(√(a + b))', 'O(max(a, b))', 'O(a · b)'],
    a: 0,
    why: 'Euclid: every two steps the numbers at least halve. Consecutive Fibonacci numbers are the worst case.',
  },
  {
    id: 'gcd-sub',
    code: `
def gcd(a, b):
    while a != b:
        if a > b:
            a -= b
        else:
            b -= a
    return a`,
    q: 'Worst-case time, for `a, b >= 1`?',
    o: ['O(log min(a, b))', 'O(√(a + b))', 'O(max(a, b))', 'O(a · b)'],
    a: 2,
    why: 'Try `gcd(n, 1)`: it subtracts 1 about n times. Using `%` does all those subtractions at once, which is what makes Euclid logarithmic.',
  },
  {
    id: 'collatz',
    code: `
def steps(n):
    count = 0
    while n != 1:
        n = n // 2 if n % 2 == 0 else 3 * n + 1
        count += 1
    return count`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'No bound is proven'],
    a: 3,
    why: 'This is the Collatz conjecture. Nobody has proven it even terminates for every `n`, so there is no known bound.',
  },
  {
    id: 'prime-factors',
    code: `
def factorize(n):
    factors = []
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors.append(d)
            n //= d
        d += 1
    if n > 1:
        factors.append(n)
    return factors`,
    q: 'Worst-case time?',
    o: ['O(log n)', 'O(√n)', 'O(n)', 'O(n log n)'],
    a: 1,
    why: 'The worst input is a prime: `d` climbs all the way to √n. A power of 2 is the best case, at O(log n).',
  },
  {
    id: 'trailing-zeros',
    code: `
def trailing_zeros_of_factorial(n):
    count = 0
    while n:
        n //= 5
        count += n
    return count`,
    o: ['O(1)', 'O(log n)', 'O(√n)', 'O(n)'],
    a: 1,
    why: 'It only divides by 5 each loop. You never compute n! itself.',
  },
  {
    id: 'triangular',
    code: `
def f(n):
    i = 0
    step = 1
    while i < n:
        i += step
        step += 1
    return step`,
    o: ['O(log n)', 'O(√n)', 'O(n)', 'O(n²)'],
    a: 1,
    why: 'After k loops, `i` is 1 + 2 + ... + k ≈ k²/2. It reaches `n` when k ≈ √(2n).',
  },
  {
    id: 'cube-root',
    code: `
def f(n):
    i = 1
    while i * i * i <= n:
        i += 1
    return i`,
    o: ['O(log n)', 'O(n^(1/3))', 'O(√n)', 'O(n)'],
    a: 1,
    why: 'The loop stops when i³ > n, so i reaches the cube root of n.',
  },
  {
    id: 'squaring',
    code: `
def f(n):
    x = 2
    steps = 0
    while x < n:
        x = x * x
        steps += 1
    return steps`,
    o: ['O(log log n)', 'O(log n)', 'O(√n)', 'O(n)'],
    a: 0,
    why: '`x` goes 2, 4, 16, 256, 65536: the exponent doubles each time. It reaches `n` after log(log n) steps.',
  },
  {
    id: 'fixed-step',
    code: `
def f(n):
    i = 0
    steps = 0
    step = max(1, n // 10)
    while i < n:
        i += step
        steps += 1
    return steps`,
    o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    a: 0,
    why: 'The step scales with `n`, so it always takes about 10 loops no matter how large `n` is.',
  },
  {
    id: 'range-frozen',
    code: `
def f(n):
    count = 0
    for i in range(n):
        n //= 2
        count += 1
    return count`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 1,
    why: '`range(n)` is built once, before the first loop. Halving `n` afterwards changes nothing, so it still runs n times.',
  },
  {
    id: 'i-reassign',
    code: `
def count_runs(a):
    count = 0
    for i in range(len(a)):
        j = i
        while j < len(a) and a[j] == a[i]:
            j += 1
        count += 1
        i = j
    return count`,
    q: 'Worst-case time, for `n = len(a)`?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 2,
    why: 'Trap: `i = j` does not skip ahead, because the `for` overwrites `i` on the next loop. An all-equal list costs n + (n-1) + ... = O(n²). A `while` loop would make it O(n).',
  },

  // ---- nested loops ----
  {
    id: 'geo-down',
    code: `
def f(n):
    total = 0
    i = n
    while i > 0:
        for j in range(i):
            total += 1
        i //= 2
    return total`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 1,
    why: 'Log n outer loops, but the inner work is n + n/2 + n/4 + ... < 2n. Multiplying the two loops would wrongly give O(n log n).',
  },
  {
    id: 'outer-log',
    code: `
def f(n):
    total = 0
    i = 1
    while i <= n:
        for j in range(n):
            total += 1
        i *= 2
    return total`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 2,
    why: 'The outer loop doubles (log n times), and the inner loop always does the full n. Compare it to the version where the inner bound shrinks with `i`.',
  },
  {
    id: 'harmonic',
    code: `
def f(n):
    total = 0
    for i in range(1, n + 1):
        for j in range(0, n, i):
            total += 1
    return total`,
    o: ['O(n)', 'O(n log n)', 'O(n√n)', 'O(n²)'],
    a: 1,
    why: 'The inner loop runs n/i times. n/1 + n/2 + ... + n/n = n · (harmonic series) ≈ n ln n.',
  },
  {
    id: 'log-log',
    code: `
def f(n):
    count = 0
    i = 1
    while i < n:
        j = 1
        while j < n:
            count += 1
            j *= 2
        i *= 2
    return count`,
    o: ['O(log n)', 'O(log² n)', 'O(n)', 'O(n log n)'],
    a: 1,
    why: 'Both loops double up to `n`, and the inner one restarts each time: log n × log n.',
  },
  {
    id: 'inner-doubling',
    code: `
def f(n):
    count = 0
    for i in range(n):
        j = 1
        while j < i:
            j *= 2
            count += 1
    return count`,
    o: ['O(log² n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 2,
    why: 'The inner loop takes log(i) steps. Summed over i up to n, that is log(n!) = O(n log n).',
  },
  {
    id: 'i-squared',
    code: `
def f(n):
    total = 0
    for i in range(n):
        for j in range(i * i):
            total += 1
    return total`,
    o: ['O(n²)', 'O(n² log n)', 'O(n³)', 'O(n⁴)'],
    a: 2,
    why: 'The sum of i² for i up to n is about n³/3.',
  },
  {
    id: 'sqrt-nest',
    code: `
def f(n):
    count = 0
    for i in range(n):
        j = 1
        while j * j <= i:
            j += 1
            count += 1
    return count`,
    o: ['O(n)', 'O(n log n)', 'O(n√n)', 'O(n²)'],
    a: 2,
    why: 'The inner loop runs √i times, and the sum of √i up to n is about n^1.5.',
  },
  {
    id: 'no-reset',
    code: `
def merge_scan(a, b):
    j = 0
    hits = 0
    for x in a:
        while j < len(b) and b[j] < x:
            j += 1
        hits += j
    return hits`,
    q: '`a` and `b` are sorted, with lengths `a` and `b`. Time complexity?',
    o: ['O(a + b)', 'O(a log b)', 'O(b log a)', 'O(a · b)'],
    a: 0,
    why: '`j` never resets, so the `while` runs at most `b` times in total across all the loops. Nested does not always mean multiplied.',
  },
  {
    id: 'zip-short',
    code: `
def f(a, b):
    total = 0
    for x, y in zip(a, b):
        total += x * y
    return total`,
    q: 'Lengths `a` and `b`. Time complexity?',
    o: ['O(min(a, b))', 'O(a + b)', 'O(a · b)', 'O(max(a, b)²)'],
    a: 0,
    why: '`zip` stops as soon as the shorter input runs out.',
  },
  {
    id: 'letters-26',
    code: `
def f(s):
    total = 0
    for c in s:
        for letter in 'abcdefghijklmnopqrstuvwxyz':
            if c == letter:
                total += 1
    return total`,
    q: '`n = len(s)`. Time complexity?',
    o: ['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 1,
    why: 'The inner loop is a fixed 26 steps, so it is a constant: 26n = O(n).',
  },
  {
    id: 'anagram-windows',
    code: `
from collections import Counter

def anagram_windows(s, p):
    need = Counter(p)
    count = 0
    for i in range(len(s) - len(p) + 1):
        if Counter(s[i:i + len(p)]) == need:
            count += 1
    return count`,
    q: '`n = len(s)`, `m = len(p)`. Time complexity?',
    o: ['O(n)', 'O(n + m)', 'O(n · m)', 'O(n²)'],
    a: 2,
    why: 'Each of the n windows rebuilds an m-sized slice and Counter. Sliding one counter across `s` instead gives O(n + m).',
  },
  {
    id: 'bitmask',
    code: `
def f(nums):
    n = len(nums)
    best = 0
    for mask in range(1 << n):
        total = 0
        for i in range(n):
            if mask >> i & 1:
                total += nums[i]
        best = max(best, total)
    return best`,
    o: ['O(n²)', 'O(2^n)', 'O(n · 2^n)', 'O(n!)'],
    a: 2,
    why: '2^n masks, and n bits checked for each.',
  },
  {
    id: 'interval-dp',
    code: `
def f(a):
    n = len(a)
    dp = [[0] * n for _ in range(n)]
    for size in range(2, n + 1):
        for i in range(n - size + 1):
            j = i + size - 1
            dp[i][j] = min(dp[i][k] + dp[k + 1][j] + a[i]
                           for k in range(i, j))
    return dp[0][n - 1]`,
    o: ['O(n²)', 'O(n² log n)', 'O(n³)', 'O(2^n)'],
    a: 2,
    why: 'O(n²) intervals, and each tries O(n) split points. This is the interval DP shape from Burst Balloons and Matrix Chain.',
  },

  // ---- costs hidden inside one line ----
  {
    id: 'prepend',
    code: `
def build(chars):
    s = ''
    for c in chars:
        s = c + s
    return s`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: 'Strings are immutable, so every `c + s` copies the whole string: 1 + 2 + ... + n.',
  },
  {
    id: 'join-reversed',
    code: `
def build(chars):
    parts = []
    for c in chars:
        parts.append(c)
    return ''.join(parts[::-1])`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 0,
    why: 'Appends are amortized O(1), and the reverse and `join` each make one O(n) pass. This is the standard fix for string-building loops.',
  },
  {
    id: 'slice-recur',
    code: `
def total(nums):
    if not nums:
        return 0
    return nums[0] + total(nums[1:])`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 2,
    why: 'n calls, and `nums[1:]` copies the rest each time. Passing an index instead makes it O(n).',
  },
  {
    id: 'bfs-pop0',
    code: `
def bfs(graph, start):
    queue = [start]
    seen = {start}
    while queue:
        node = queue.pop(0)
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    return seen`,
    q: 'Worst-case time?',
    o: ['O(V + E)', 'O((V + E) log V)', 'O(V² + E)', 'O(V · E)'],
    a: 2,
    why: '`list.pop(0)` shifts every remaining item, and the queue can hold up to V nodes (a star graph). `deque.popleft()` brings this back to O(V + E).',
  },
  {
    id: 'not-in-list',
    code: `
def unique(nums):
    seen = []
    for x in nums:
        if x not in seen:
            seen.append(x)
    return seen`,
    q: 'Worst-case time?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: '`in` on a list is a linear scan. Making `seen` a set makes it O(n).',
  },
  {
    id: 'list-plus',
    code: `
def f(n):
    res = []
    for i in range(n):
        res = res + [i]
    return res`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: '`res + [i]` builds a brand new list on every loop. It looks harmless, but it is quadratic.',
  },
  {
    id: 'list-iadd',
    code: `
def f(n):
    res = []
    for i in range(n):
        res += [i]
    return res`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 0,
    why: '`+=` on a list extends it in place (amortized O(1) here). `res = res + [i]` copies, so these two lines look alike but differ in Big-O.',
  },
  {
    id: 'set-union',
    code: `
def f(groups):
    items = set()
    for g in groups:
        items = items | g
    return items`,
    q: '`n` groups of `k` distinct items each. Worst-case time?',
    o: ['O(n · k)', 'O(n · k²)', 'O(n² · k)', 'O(n² · k²)'],
    a: 2,
    why: '`items | g` copies everything collected so far: k + 2k + ... + nk = O(n²k). `items |= g` only costs O(k) per group.',
  },
  {
    id: 'insort-loop',
    code: `
from bisect import insort

def f(nums):
    seen = []
    for x in nums:
        insort(seen, x)
    return seen`,
    q: 'Worst-case time?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n² log n)'],
    a: 2,
    why: 'Finding the spot is O(log n), but inserting into a list shifts up to n items. The shift dominates.',
  },
  {
    id: 'bsearch-slice',
    code: `
def search(a, x):
    if not a:
        return False
    mid = len(a) // 2
    if a[mid] == x:
        return True
    if x < a[mid]:
        return search(a[:mid], x)
    return search(a[mid + 1:], x)`,
    q: 'Worst-case time?',
    o: ['O(log n)', 'O(log² n)', 'O(n)', 'O(n log n)'],
    a: 2,
    why: 'It makes log n calls, but each slice copies: n/2 + n/4 + ... ≈ n. Slicing quietly turns binary search into O(n).',
  },
  {
    id: 'max-in-loop',
    code: `
def count_max(nums):
    count = 0
    for x in nums:
        if x == max(nums):
            count += 1
    return count`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: '`max(nums)` rescans the list on every loop. Compute it once before the loop for O(n).',
  },
  {
    id: 'substrings-set',
    code: `
def distinct_substrings(s):
    seen = set()
    for i in range(len(s)):
        for j in range(i + 1, len(s) + 1):
            seen.add(s[i:j])
    return len(seen)`,
    o: ['O(n²)', 'O(n² log n)', 'O(n³)', 'O(2^n)'],
    a: 2,
    why: 'O(n²) substrings, and each slice and hash costs O(length). Strings are not O(1) keys.',
  },
  {
    id: 'dict-first-key',
    code: `
def drain(d):
    while d:
        key = list(d)[0]
        del d[key]`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: '`list(d)` copies every key just to read the first one.',
  },
  {
    id: 'deque-mid',
    code: `
from collections import deque

def f(n):
    q = deque(range(n))
    total = 0
    for _ in range(n):
        total += q[len(q) // 2]
    return total`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: 'A deque is a linked list of blocks. Both ends are O(1), but indexing into the middle walks the blocks, so it is O(n).',
  },
  {
    id: 'sum-slice-queries',
    code: `
def answer(nums, queries):
    return [sum(nums[l:r]) for l, r in queries]`,
    q: '`n = len(nums)`, `q = len(queries)`. Worst-case time?',
    o: ['O(n + q)', 'O(q log n)', 'O(n · q)', 'O(n² · q)'],
    a: 2,
    why: 'Each query slices and sums up to n items. Prefix sums make this O(n + q).',
  },
  {
    id: 'prefix-queries',
    code: `
from itertools import accumulate

def answer(nums, queries):
    pre = [0, *accumulate(nums)]
    return [pre[r] - pre[l] for l, r in queries]`,
    q: '`n = len(nums)`, `q = len(queries)`. Time complexity?',
    o: ['O(n + q)', 'O(q log n)', 'O(n · q)', 'O(n² · q)'],
    a: 0,
    why: 'One O(n) pass to build the prefix sums, then O(1) per query.',
  },
  {
    id: 'remove-while',
    code: `
def remove_all(a, x):
    while x in a:
        a.remove(x)
    return a`,
    q: 'Worst-case time?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: 'Each round scans for `x` and then shifts the list. `[y for y in a if y != x]` does it in O(n).',
  },
  {
    id: 'grow-by-10',
    code: `
class Stack:
    def __init__(self):
        self.data = [None] * 10
        self.size = 0

    def push(self, x):
        if self.size == len(self.data):
            self.data = self.data + [None] * 10
        self.data[self.size] = x
        self.size += 1`,
    q: 'Total time for `n` pushes?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n² log n)'],
    a: 2,
    why: 'Growing by a fixed amount copies everything every 10 pushes, so about n²/20 copies. Fixed growth is not amortized O(1).',
  },
  {
    id: 'grow-by-double',
    code: `
class Stack:
    def __init__(self):
        self.data = [None] * 10
        self.size = 0

    def push(self, x):
        if self.size == len(self.data):
            self.data = self.data + [None] * len(self.data)
        self.data[self.size] = x
        self.size += 1`,
    q: 'Total time for `n` pushes?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n² log n)'],
    a: 0,
    why: 'Doubling makes copies rare: 10 + 20 + 40 + ... < 2n in total. That is why `list.append` is amortized O(1).',
  },
  {
    id: 'bin-count',
    code: `
def count_bits(n):
    return [bin(i).count('1') for i in range(n + 1)]`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 2,
    why: 'n numbers, and each `bin(i)` builds a string of log n characters.',
  },
  {
    id: 'bits-dp',
    code: `
def count_bits(n):
    bits = [0] * (n + 1)
    for i in range(1, n + 1):
        bits[i] = bits[i >> 1] + (i & 1)
    return bits`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 1,
    why: 'Each answer reuses the answer for `i >> 1` in O(1). This DP removes the log factor from the `bin(i)` version.',
  },
  {
    id: 'linked-get',
    code: `
def values(head, n):
    out = []
    for i in range(n):
        node = head
        for _ in range(i):
            node = node.next
        out.append(node.val)
    return out`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 2,
    why: 'Each read walks from the head again: 0 + 1 + ... + (n-1). A single moving pointer makes it O(n).',
  },

  // ---- recursion ----
  {
    id: 'halve-sum',
    code: `
def f(a):
    if len(a) <= 1:
        return 0
    return sum(a) + f(a[:len(a) // 2])`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 1,
    why: 'T(n) = T(n/2) + O(n), one call on half the input. The work n + n/2 + n/4 + ... sums to O(n).',
  },
  {
    id: 'merge-sum',
    code: `
def f(a):
    if len(a) <= 1:
        return sum(a)
    mid = len(a) // 2
    return f(a[:mid]) + f(a[mid:]) + sum(a)`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 2,
    why: 'T(n) = 2T(n/2) + O(n), the merge sort recurrence. Every level does O(n) work, across log n levels.',
  },
  {
    id: 'two-halves',
    code: `
def f(n):
    if n <= 1:
        return 1
    return f(n // 2) + f(n // 2)`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 1,
    why: 'Depth is log n, but the calls double per level: 1 + 2 + 4 + ... + n = O(n). Halving alone does not make it logarithmic if you branch.',
  },
  {
    id: 'two-halves-memo',
    code: `
from functools import cache

@cache
def f(n):
    if n <= 1:
        return 1
    return f(n // 2) + f(n // 2)`,
    o: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    a: 0,
    why: 'Only log n distinct arguments exist (n, n/2, n/4, ...), and `@cache` computes each one once.',
  },
  {
    id: 'three-halves',
    code: `
def f(n):
    if n <= 1:
        return 1
    return f(n // 2) + f(n // 2) + f(n // 2)`,
    o: ['O(n)', 'O(n log n)', 'O(n^1.58)', 'O(n²)'],
    a: 2,
    why: 'Master theorem: T(n) = 3T(n/2) + O(1) gives n^(log₂3) ≈ n^1.58. Karatsuba multiplication has the same shape.',
  },
  {
    id: 'double-self',
    code: `
def f(n):
    if n == 0:
        return 1
    return f(n - 1) + f(n - 1)`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 3,
    why: 'Two calls that each shrink by only 1: the call tree has 2^n leaves.',
  },
  {
    id: 'double-self-mult',
    code: `
def f(n):
    if n == 0:
        return 1
    return 2 * f(n - 1)`,
    q: 'Ignore big-integer cost. Time complexity?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 0,
    why: 'Same value as `f(n-1) + f(n-1)`, but only one call per level, so it makes n calls. Count the calls, not the result.',
  },
  {
    id: 'power',
    code: `
def power(x, n):
    if n == 0:
        return 1
    half = power(x, n // 2)
    return half * half * (x if n % 2 else 1)`,
    q: 'How many calls, as a function of `n`?',
    o: ['O(log n)', 'O(√n)', 'O(n)', 'O(n²)'],
    a: 0,
    why: 'One recursive call per halving. Saving the result in `half` is what makes it logarithmic.',
  },
  {
    id: 'power-double',
    code: `
def power(x, n):
    if n == 0:
        return 1
    if n % 2:
        return x * power(x, n // 2) * power(x, n // 2)
    return power(x, n // 2) * power(x, n // 2)`,
    q: 'How many calls, as a function of `n`?',
    o: ['O(log n)', 'O(√n)', 'O(n)', 'O(n²)'],
    a: 2,
    why: 'Calling `power` twice instead of saving it doubles the calls per level: 2^(log n) = n.',
  },
  {
    id: 'max-remove',
    code: `
def sort_desc(a, out):
    if not a:
        return out
    m = max(a)
    a.remove(m)
    out.append(m)
    return sort_desc(a, out)`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: 'T(n) = T(n-1) + O(n): this is selection sort written recursively.',
  },
  {
    id: 'subsets',
    code: `
def subsets(nums):
    res = [[]]
    for x in nums:
        res += [r + [x] for r in res]
    return res`,
    o: ['O(n²)', 'O(2^n)', 'O(n · 2^n)', 'O(n!)'],
    a: 2,
    why: 'There are 2^n subsets, and each `r + [x]` copy costs up to n.',
  },
  {
    id: 'perms',
    code: `
def permute(nums):
    out = []
    def go(path, left):
        if not left:
            out.append(path)
            return
        for i in range(len(left)):
            go(path + [left[i]], left[:i] + left[i + 1:])
    go([], nums)
    return out`,
    o: ['O(2^n)', 'O(n · 2^n)', 'O(n · n!)', 'O(n^n)'],
    a: 2,
    why: 'n! results, and building each one takes O(n) of copying. The calls higher up the tree do not change the bound.',
  },
  {
    id: 'gen-parens',
    code: `
def generate(n):
    out = []
    def go(s, opened, closed):
        if len(s) == 2 * n:
            out.append(s)
            return
        if opened < n:
            go(s + '(', opened + 1, closed)
        if closed < opened:
            go(s + ')', opened, closed + 1)
    go('', 0, 0)
    return out`,
    q: 'How many results, roughly?',
    o: ['O(n²)', 'O(2^n)', 'O(4^n / n^1.5)', 'O(n!)'],
    a: 2,
    why: 'The answer count is the n-th Catalan number, about 4^n / n^1.5. Multiply by n for the string-building time.',
  },
  {
    id: 'n-queens',
    code: `
def queens(n):
    def go(r, cols, d1, d2):
        if r == n:
            return 1
        total = 0
        for c in range(n):
            if c in cols or r + c in d1 or r - c in d2:
                continue
            total += go(r + 1, cols | {c}, d1 | {r + c}, d2 | {r - c})
        return total
    return go(0, frozenset(), frozenset(), frozenset())`,
    q: 'Usual upper bound on the search?',
    o: ['O(n²)', 'O(2^n)', 'O(n!)', 'O(n^n)'],
    a: 2,
    why: 'Row 1 has n choices, row 2 at most n-1, and so on, because a column cannot repeat. The diagonal checks only prune further.',
  },
  {
    id: 'word-search',
    code: `
def exists(board, word):
    R, C = len(board), len(board[0])
    def go(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < R and 0 <= c < C) or board[r][c] != word[i]:
            return False
        board[r][c] = '#'
        found = any(go(r + a, c + b, i + 1)
                    for a, b in ((0, 1), (1, 0), (0, -1), (-1, 0)))
        board[r][c] = word[i]
        return found
    return any(go(r, c, 0) for r in range(R) for c in range(C))`,
    q: '`R × C` board, word length `L`. Worst-case time?',
    o: ['O(R · C · L)', 'O(R · C · 3^L)', 'O(R · C · L!)', 'O(2^(R · C))'],
    a: 1,
    why: 'Every cell can be a start. After the first step only 3 directions remain, since you cannot go straight back.',
  },
  {
    id: 'take-skip',
    code: `
def can_sum(nums, target, i=0):
    if target == 0:
        return True
    if i == len(nums) or target < 0:
        return False
    return (can_sum(nums, target - nums[i], i + 1)
            or can_sum(nums, target, i + 1))`,
    q: 'Worst-case time, with no memo?',
    o: ['O(n · target)', 'O(n²)', 'O(2^n)', 'O(n!)'],
    a: 2,
    why: 'Take or skip for every item: 2^n paths. Adding a memo on `(i, target)` brings it to O(n · target).',
  },
  {
    id: 'memo-two-args',
    code: `
from functools import cache

def can_sum(nums, target):
    @cache
    def go(i, left):
        if left == 0:
            return True
        if i == len(nums) or left < 0:
            return False
        return go(i + 1, left - nums[i]) or go(i + 1, left)
    return go(0, target)`,
    q: '`n = len(nums)`, positive numbers. Time complexity?',
    o: ['O(n + target)', 'O(n · target)', 'O(2^n)', 'O(target^n)'],
    a: 1,
    why: 'Memoized time is distinct states × work per state: n × target states at O(1) each. It is called pseudo-polynomial because it depends on the value of `target`.',
  },

  // ---- space ----
  {
    id: 'fib-space',
    code: `
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)`,
    q: 'SPACE complexity (call stack)?',
    o: ['O(1)', 'O(log n)', 'O(n)', 'O(2^n)'],
    a: 2,
    why: 'Time is exponential, but only one root-to-leaf path is on the stack at a time. Depth is n, so space is O(n).',
  },
  {
    id: 'slice-space',
    code: `
def total(nums):
    if not nums:
        return 0
    return nums[0] + total(nums[1:])`,
    q: 'SPACE complexity at the deepest point?',
    o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    a: 3,
    why: 'n frames are live at once, and each holds its own slice: n + (n-1) + ... + 1.',
  },
  {
    id: 'tree-stack-space',
    code: `
def height(node):
    if not node:
        return 0
    return 1 + max(height(node.left), height(node.right))`,
    q: 'SPACE complexity on a balanced tree of `n` nodes?',
    o: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    a: 1,
    why: 'The stack depth equals the tree height, which is log n when balanced. A skewed tree degrades to O(n).',
  },
  {
    id: 'bfs-width-space',
    code: `
from collections import deque

def level_sum(root):
    total = 0
    q = deque([root])
    while q:
        node = q.popleft()
        total += node.val
        if node.left:
            q.append(node.left)
        if node.right:
            q.append(node.right)
    return total`,
    q: 'SPACE complexity on a perfect binary tree of `n` nodes?',
    o: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    a: 2,
    why: 'The bottom level holds about n/2 nodes, and they all sit in the queue together. On this shape DFS only needs O(log n).',
  },
  {
    id: 'gen-space',
    code: `
def squares_total(nums):
    return sum(x * x for x in nums)`,
    q: 'EXTRA space complexity?',
    o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    a: 0,
    why: 'A generator yields one value at a time. `sum([x * x for x in nums])` would first build a whole O(n) list.',
  },
  {
    id: 'memo-space',
    code: `
from functools import cache

@cache
def paths(r, c):
    if r == 0 or c == 0:
        return 1
    return paths(r - 1, c) + paths(r, c - 1)`,
    q: 'SPACE complexity of `paths(R, C)`?',
    o: ['O(R + C)', 'O(R · C)', 'O((R + C)²)', 'O(2^(R + C))'],
    a: 1,
    why: 'The stack is only R + C deep, but the cache stores all R × C states, and that dominates.',
  },
  {
    id: 'rolling-dp-space',
    code: `
def paths(R, C):
    row = [1] * (C + 1)
    for _ in range(R):
        for c in range(1, C + 1):
            row[c] += row[c - 1]
    return row[C]`,
    q: 'SPACE complexity?',
    o: ['O(C)', 'O(R + C)', 'O(R · C)', 'O(2^C)'],
    a: 0,
    why: 'Each row only depends on the one before it, so one rolling row is enough. Time is still O(R · C).',
  },

  // ---- trees, graphs and heaps ----
  {
    id: 'inorder-concat',
    code: `
def inorder(node):
    if not node:
        return []
    return inorder(node.left) + [node.val] + inorder(node.right)`,
    q: 'Worst-case time, on a skewed tree?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 2,
    why: 'Every `+` copies the sublist: 1 + 2 + ... + n on a left-skewed tree. Appending to one shared list is O(n).',
  },
  {
    id: 'height-balanced',
    code: `
def height(node):
    if not node:
        return 0
    return 1 + max(height(node.left), height(node.right))

def balanced(node):
    if not node:
        return True
    if abs(height(node.left) - height(node.right)) > 1:
        return False
    return balanced(node.left) and balanced(node.right)`,
    q: 'Time on a perfectly balanced tree of `n` nodes?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 1,
    why: 'Each level recomputes heights for all its nodes: O(n) per level over log n levels. Returning height and balance together gives O(n).',
  },
  {
    id: 'complete-count',
    code: `
def count(root):
    if not root:
        return 0
    l, r = root, root
    hl = hr = 0
    while l:
        l, hl = l.left, hl + 1
    while r:
        r, hr = r.right, hr + 1
    if hl == hr:
        return 2 ** hl - 1
    return 1 + count(root.left) + count(root.right)`,
    q: 'Time on a COMPLETE binary tree of `n` nodes?',
    o: ['O(log n)', 'O(log² n)', 'O(√n)', 'O(n)'],
    a: 1,
    why: 'At each level at least one child is a perfect tree that returns right away. That leaves log n real calls, each measuring heights in O(log n).',
  },
  {
    id: 'heapify-k',
    code: `
import heapq

def k_smallest(nums, k):
    heapq.heapify(nums)
    return [heapq.heappop(nums) for _ in range(k)]`,
    o: ['O(k log n)', 'O(n + k log n)', 'O(n log k)', 'O(n log n)'],
    a: 1,
    why: '`heapify` is O(n), which surprises most people, and then k pops cost O(log n) each.',
  },
  {
    id: 'heap-size-k',
    code: `
import heapq

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`,
    o: ['O(k log n)', 'O(n + k log n)', 'O(n log k)', 'O(n log n)'],
    a: 2,
    why: 'The heap never holds more than k + 1 items, so each operation is O(log k), repeated for n items.',
  },
  {
    id: 'merge-sequential',
    code: `
def merge_all(lists):
    result = []
    for lst in lists:
        result = merge(result, lst)  # O(len(result) + len(lst))
    return result`,
    q: '`k` lists of length `m` each. Time complexity?',
    o: ['O(k · m)', 'O(k · m · log k)', 'O(k² · m)', 'O(k² · m²)'],
    a: 2,
    why: 'The result keeps growing: m + 2m + ... + km = O(k²m). A heap of size k (or pairwise merging) gives O(km log k).',
  },
  {
    id: 'merge-heap',
    code: `
import heapq

def merge_all(lists):
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)
    out = []
    while heap:
        val, i, j = heapq.heappop(heap)
        out.append(val)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
    return out`,
    q: '`k` lists with `N` items in total. Time complexity?',
    o: ['O(N)', 'O(N log k)', 'O(N log N)', 'O(N · k)'],
    a: 1,
    why: 'The heap holds one item per list, at most k, and each of the N items goes through one push and one pop.',
  },
  {
    id: 'dijkstra',
    code: `
import heapq

def dijkstra(graph, start):
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist.get(v, float('inf')):
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist`,
    o: ['O(V + E)', 'O((V + E) log V)', 'O(V · E)', 'O(V³)'],
    a: 1,
    why: 'Each edge can push once, and a heap operation costs O(log E) = O(log V), since E is at most V².',
  },
  {
    id: 'floyd',
    code: `
def all_pairs(dist):
    n = len(dist)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
    return dist`,
    o: ['O(V + E)', 'O((V + E) log V)', 'O(V · E)', 'O(V³)'],
    a: 3,
    why: 'Floyd-Warshall: three nested loops over the vertices. Note that `k` has to be the outermost loop.',
  },
  {
    id: 'bellman-ford',
    code: `
def bellman_ford(n, edges, start):
    dist = [float('inf')] * n
    dist[start] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            dist[v] = min(dist[v], dist[u] + w)
    return dist`,
    o: ['O(V + E)', 'O((V + E) log V)', 'O(V · E)', 'O(V³)'],
    a: 2,
    why: 'V - 1 rounds, each relaxing every edge. Slower than Dijkstra, but it handles negative weights.',
  },
  {
    id: 'uf-naive',
    code: `
def groups(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            x = parent[x]
        return x
    for a, b in edges:
        parent[find(a)] = find(b)
    return len({find(i) for i in range(n)})`,
    q: 'Worst-case time, with `E` edges and no path compression or rank?',
    o: ['O(V + E)', 'O((V + E) log V)', 'O(V · (V + E))', 'O(V³)'],
    a: 2,
    why: 'Without compression or rank the parents can form a chain, so each `find` costs O(V). With both, it is nearly O(1) per operation.',
  },
  {
    id: 'kahn',
    code: `
from collections import deque

def topo(n, edges):
    graph = [[] for _ in range(n)]
    indegree = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indegree[b] += 1
    q = deque(i for i in range(n) if indegree[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indegree[v] -= 1
            if indegree[v] == 0:
                q.append(v)
    return order`,
    o: ['O(V + E)', 'O((V + E) log V)', 'O(V · E)', 'O(V²)'],
    a: 0,
    why: 'Every vertex enters the queue once, and every edge is looked at once.',
  },
  {
    id: 'grid-dfs',
    code: `
def islands(grid):
    def sink(r, c):
        if 0 <= r < len(grid) and 0 <= c < len(grid[0]) and grid[r][c]:
            grid[r][c] = 0
            sink(r + 1, c)
            sink(r - 1, c)
            sink(r, c + 1)
            sink(r, c - 1)
    count = 0
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c]:
                sink(r, c)
                count += 1
    return count`,
    q: 'Time on an `R × C` grid?',
    o: ['O(R + C)', 'O(R · C)', 'O((R · C)²)', 'O(4^(R · C))'],
    a: 1,
    why: 'Each cell is sunk at most once, and its 4 neighbor checks are constant. The nested look does not multiply, because sunk cells stop right away.',
  },
  {
    id: 'trie-insert',
    code: `
def build(words):
    root = {}
    for w in words:
        node = root
        for c in w:
            node = node.setdefault(c, {})
        node['$'] = True
    return root`,
    q: '`n` words, `S` characters in total. Time complexity?',
    o: ['O(n)', 'O(S)', 'O(n · S)', 'O(S log n)'],
    a: 1,
    why: 'One dict step per character, no matter how many words share the trie.',
  },
  {
    id: 'quickselect',
    code: `
def kth_smallest(a, k):
    pivot = a[0]
    low = [x for x in a[1:] if x < pivot]
    high = [x for x in a[1:] if x >= pivot]
    if k < len(low):
        return kth_smallest(low, k)
    if k == len(low):
        return pivot
    return kth_smallest(high, k - len(low) - 1)`,
    q: 'Worst-case time (first-element pivot)?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 2,
    why: 'On sorted input the pivot only removes itself: n + (n-1) + ... With a random pivot the average is O(n).',
  },
  {
    id: 'quicksort-sorted',
    code: `
def quicksort(a):
    if len(a) < 2:
        return a
    p = a[0]
    return (quicksort([x for x in a[1:] if x < p]) + [p]
            + quicksort([x for x in a[1:] if x >= p]))`,
    q: 'Time on already-sorted input?',
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 2,
    why: 'The first element is the smallest, so one side is always empty. A random or median pivot avoids this.',
  },
  {
    id: 'bsearch-answer',
    code: `
def min_speed(piles, hours):
    lo, hi = 1, max(piles)
    while lo < hi:
        speed = (lo + hi) // 2
        if sum((p + speed - 1) // speed for p in piles) <= hours:
            hi = speed
        else:
            lo = speed + 1
    return lo`,
    q: '`n = len(piles)`, `M = max(piles)`. Time complexity?',
    o: ['O(n + M)', 'O(n log n)', 'O(n log M)', 'O(M log n)'],
    a: 2,
    why: 'Binary search over the answer range takes log M rounds, and each round checks all n piles.',
  },
  {
    id: 'lis-dp',
    code: `
def lis(nums):
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 2,
    why: 'Every index looks back at all earlier indices.',
  },
  {
    id: 'lis-bisect',
    code: `
from bisect import bisect_left

def lis(nums):
    tails = []
    for x in nums:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    a: 1,
    why: 'One binary search per item, and overwriting `tails[i]` shifts nothing. Compare this with `insort`, which does shift.',
  },
  {
    id: 'monostack',
    code: `
def next_greater(nums):
    out = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            out[stack.pop()] = x
        stack.append(i)
    return out`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 0,
    why: 'Amortized: each index is pushed once and popped at most once, so the `while` runs at most n times overall.',
  },
  {
    id: 'sliding-set',
    code: `
def longest(s):
    seen = set()
    best = left = 0
    for right, c in enumerate(s):
        while c in seen:
            seen.remove(s[left])
            left += 1
        seen.add(c)
        best = max(best, right - left + 1)
    return best`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 0,
    why: '`left` only moves forward, so across the whole run the `while` executes at most n times.',
  },
  {
    id: 'matrix-power',
    code: `
def mul(a, b):
    return [[a[0][0] * b[0][0] + a[0][1] * b[1][0],
             a[0][0] * b[0][1] + a[0][1] * b[1][1]],
            [a[1][0] * b[0][0] + a[1][1] * b[1][0],
             a[1][0] * b[0][1] + a[1][1] * b[1][1]]]

def fib(n):
    result = [[1, 0], [0, 1]]
    base = [[1, 1], [1, 0]]
    while n:
        if n & 1:
            result = mul(result, base)
        base = mul(base, base)
        n >>= 1
    return result[0][1]`,
    q: 'How many matrix multiplications?',
    o: ['O(log n)', 'O(√n)', 'O(n)', 'O(2^n)'],
    a: 0,
    why: 'Square-and-multiply makes one pass per bit of `n`. This is the fast way to compute large Fibonacci numbers.',
  },
  {
    id: 'sieve',
    code: `
def primes(n):
    is_prime = [True] * (n + 1)
    for i in range(2, int(n ** 0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):
                is_prime[j] = False
    return [i for i in range(2, n + 1) if is_prime[i]]`,
    o: ['O(n)', 'O(n log log n)', 'O(n log n)', 'O(n√n)'],
    a: 1,
    why: 'Sieve of Eratosthenes: n/2 + n/3 + n/5 + ... over the primes, which sums to n log log n.',
  },
  {
    id: 'counting-sort',
    code: `
def counting_sort(nums, k):
    counts = [0] * k
    for x in nums:
        counts[x] += 1
    out = []
    for value, c in enumerate(counts):
        out.extend([value] * c)
    return out`,
    q: '`n` numbers, all in `range(k)`. Time complexity?',
    o: ['O(n)', 'O(n + k)', 'O(n log n)', 'O(n · k)'],
    a: 1,
    why: 'One pass over the numbers, one pass over the counts. It beats O(n log n) only when k is not much bigger than n.',
  },
  {
    id: 'group-anagrams',
    code: `
from collections import defaultdict

def group(words):
    groups = defaultdict(list)
    for w in words:
        groups[''.join(sorted(w))].append(w)
    return list(groups.values())`,
    q: '`n` words of length up to `L`. Time complexity?',
    o: ['O(n · L)', 'O(n · L log L)', 'O(n log n · L)', 'O(n² · L)'],
    a: 1,
    why: 'Each word is sorted on its own. A 26-letter count tuple as the key gives O(n · L).',
  },
  {
    id: 'sort-strings',
    code: `
def f(words):
    return sorted(words)`,
    q: '`n` strings of length up to `L`. Worst-case time?',
    o: ['O(n log n)', 'O(n · L)', 'O(L · n log n)', 'O(n · L²)'],
    a: 2,
    why: 'Sorting makes O(n log n) comparisons, and comparing two strings can take O(L). Comparison cost is easy to forget.',
  },
  {
    id: 'palindrome-brute',
    code: `
def longest_pal(s):
    best = ''
    for i in range(len(s)):
        for j in range(i, len(s)):
            t = s[i:j + 1]
            if t == t[::-1] and len(t) > len(best):
                best = t
    return best`,
    o: ['O(n²)', 'O(n² log n)', 'O(n³)', 'O(2^n)'],
    a: 2,
    why: 'O(n²) substrings, and each one is sliced and reversed in O(n).',
  },
  {
    id: 'palindrome-expand',
    code: `
def count_pal(s):
    total = 0
    for center in range(2 * len(s) - 1):
        l, r = center // 2, center // 2 + center % 2
        while l >= 0 and r < len(s) and s[l] == s[r]:
            total += 1
            l, r = l - 1, r + 1
    return total`,
    o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    a: 2,
    why: '2n - 1 centers, and each can expand up to n/2 times. No slicing means no extra factor of n.',
  },
  {
    id: 'naive-match',
    code: `
def find(s, t):
    for i in range(len(s) - len(t) + 1):
        if s[i:i + len(t)] == t:
            return i
    return -1`,
    q: '`n = len(s)`, `m = len(t)`. Worst-case time?',
    o: ['O(n + m)', 'O(n log m)', 'O(n · m)', 'O(n² · m)'],
    a: 2,
    why: 'Each of the n positions slices and compares m characters. KMP reaches O(n + m).',
  },
  {
    id: 'staircase',
    code: `
def search(matrix, x):
    r, c = 0, len(matrix[0]) - 1
    while r < len(matrix) and c >= 0:
        if matrix[r][c] == x:
            return True
        if matrix[r][c] > x:
            c -= 1
        else:
            r += 1
    return False`,
    q: 'Rows and columns are sorted, size `R × C`. Time complexity?',
    o: ['O(log(R · C))', 'O(R + C)', 'O(R log C)', 'O(R · C)'],
    a: 1,
    why: 'Starting from the top-right corner, each step rules out a whole row or column, and only R + C of those exist.',
  },
  {
    id: 'binary-rows',
    code: `
from bisect import bisect_left

def search(matrix, x):
    for row in matrix:
        i = bisect_left(row, x)
        if i < len(row) and row[i] == x:
            return True
    return False`,
    q: 'Every row is sorted, size `R × C`. Time complexity?',
    o: ['O(log(R · C))', 'O(R + C)', 'O(R log C)', 'O(R · C)'],
    a: 2,
    why: 'One binary search of cost log C for each of the R rows.',
  },
  {
    id: 'three-sum',
    code: `
def three_sum_exists(nums, target):
    nums.sort()
    for i in range(len(nums)):
        lo, hi = i + 1, len(nums) - 1
        while lo < hi:
            total = nums[i] + nums[lo] + nums[hi]
            if total == target:
                return True
            if total < target:
                lo += 1
            else:
                hi -= 1
    return False`,
    o: ['O(n log n)', 'O(n²)', 'O(n² log n)', 'O(n³)'],
    a: 1,
    why: 'Sorting is O(n log n), then n outer loops each do one O(n) two-pointer sweep. The n² dominates.',
  },
]

// Cost of one built-in operation. Most share the same options; a fourth element overrides them.
const COST_OPTIONS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)']

const COSTS = [
  [
    '`a.insert(0, x)` on a list',
    'O(n)',
    'Every item shifts right. A deque gives O(1) with `appendleft`.',
  ],
  ['`a.pop()` on a list', 'O(1)', 'Removing the last item shifts nothing.'],
  ['`a.pop(0)` on a list', 'O(n)', 'Every remaining item shifts left. Use `deque.popleft()`.'],
  ['`q.popleft()` on a deque', 'O(1)', 'Deques are built for fast ends.'],
  ['`x in a` on a list', 'O(n)', 'A linear scan, even if the list happens to be sorted.'],
  ['`x in s` on a set (average)', 'O(1)', 'A hash lookup.'],
  [
    '`d[k] = v` on a dict (average)',
    'O(1)',
    'A hash lookup. Worst case is O(n) with many collisions.',
  ],
  [
    '`a.sort()` on an already-sorted list',
    'O(n)',
    'Timsort spots existing runs, so it only makes one pass here.',
  ],
  [
    '`sorted(a)` on random data',
    'O(n log n)',
    'Comparison sorting cannot beat n log n in general.',
  ],
  [
    '`heapify(a)`',
    'O(n)',
    'Bottom-up sifting is linear. Pushing n items one by one is O(n log n).',
  ],
  ['`heappush(h, x)`', 'O(log n)', 'Sifts up one path of the tree.'],
  ['`heappop(h)`', 'O(log n)', 'Sifts down one path of the tree.'],
  ['`h[0]` on a heap', 'O(1)', 'The smallest item is always at index 0.'],
  ['`bisect_left(a, x)`', 'O(log n)', 'Plain binary search, no shifting.'],
  ['`insort(a, x)`', 'O(n)', 'The search is O(log n), but the insert shifts items.'],
  ['`a.remove(x)`', 'O(n)', 'It scans for `x`, then shifts everything after it.'],
  ['`min(a)` on a list', 'O(n)', 'It has to look at every item.'],
  ['`len(a)`', 'O(1)', 'The length is stored, not counted.'],
  ['`a.reverse()`', 'O(n)', 'It swaps from both ends toward the middle.'],
  ['`set(a)`', 'O(n)', 'One hash insert per item, on average.'],
  ['`d.pop(k)` on a dict (average)', 'O(1)', 'A hash lookup and removal.'],
  ['`q[len(q) // 2]` on a deque', 'O(n)', 'Deques are fast at the ends and slow in the middle.'],
  ['`Counter(a)`', 'O(n)', 'One dict update per item.'],
  ['`a.count(x)`', 'O(n)', 'It scans the whole list.'],
  ['`a[:]`', 'O(n)', 'A slice always copies.'],
  [
    '`od.move_to_end(k)` on an OrderedDict',
    'O(1)',
    'A hash lookup plus relinking a doubly linked list, which is why it fits LRU caches.',
  ],
  [
    '`pow(b, e, m)`, with `n = e`',
    'O(log n)',
    'Square-and-multiply: one step per bit of the exponent.',
  ],
  [
    '`nlargest(k, a)`',
    'O(n log k)',
    'It keeps a heap of size k while scanning.',
    ['O(n)', 'O(k log n)', 'O(n log k)', 'O(n log n)'],
  ],
  [
    '`Counter(a).most_common(k)`',
    'O(n log k)',
    'Counting is O(n), then it uses `nlargest` on the counts.',
    ['O(n)', 'O(k log n)', 'O(n log k)', 'O(n log n)'],
  ],
  [
    '`a[i:j]`',
    'O(j - i)',
    'It copies just the slice, so a short slice of a huge list is cheap.',
    ['O(1)', 'O(log n)', 'O(j - i)', 'O(n)'],
  ],
  [
    '`a + b` on two lists',
    'O(len(a) + len(b))',
    'It copies both into a new list.',
    ['O(1)', 'O(len(b))', 'O(len(a) + len(b))', 'O(len(a) · len(b))'],
  ],
  [
    '`a.extend(b)`',
    'O(len(b))',
    'It only appends the new items. `a` itself is not copied (amortized).',
    ['O(1)', 'O(len(b))', 'O(len(a) + len(b))', 'O(len(a) · len(b))'],
  ],
  [
    '`s & t` on two sets',
    'O(min(len(s), len(t)))',
    'It loops over the smaller set and probes the larger one.',
    ['O(1)', 'O(min(len(s), len(t)))', 'O(len(s) + len(t))', 'O(len(s) · len(t))'],
  ],
  [
    "`''.join(parts)`, with `S` total characters",
    'O(S)',
    'It sizes the result once, then copies each part once.',
    ['O(1)', 'O(number of parts)', 'O(S)', 'O(S²)'],
  ],
  [
    '`q.rotate(k)` on a deque',
    'O(k)',
    'It moves k items from one end to the other.',
    ['O(1)', 'O(log n)', 'O(k)', 'O(n · k)'],
  ],
  [
    '`hash(s)` on a new string of length `L`',
    'O(L)',
    'It reads every character. The result is then cached on that string object.',
    ['O(1)', 'O(log L)', 'O(L)', 'O(L²)'],
  ],
]

// Reasoning about Big-O itself, no implementation needed
const CONCEPTS = [
  {
    q: 'Dividing by 10 vs dividing by 2 in a loop: which has the better Big-O?',
    o: ['Dividing by 10', 'Dividing by 2', 'They are the same', 'It depends on n'],
    a: 2,
    why: 'log₁₀(n) and log₂(n) differ only by a constant factor, so both are O(log n). Dividing by 10 is just faster in practice.',
  },
  {
    q: 'What does "amortized O(1)" mean for `list.append`?',
    o: [
      'Every single call is O(1)',
      'Occasional O(n) resizes average out to O(1) per call',
      'It is O(1) only with a small list',
      'It is O(1) on average over random inputs',
    ],
    a: 1,
    why: 'It is an average over a sequence of operations, not over inputs. One append can still cost O(n).',
  },
  {
    q: 'Why is O(n · W) knapsack called pseudo-polynomial?',
    o: [
      'It only works on small inputs',
      'W is a value, and its size in bits is only log W',
      'It is a randomized algorithm',
      'It uses recursion',
    ],
    a: 1,
    why: 'Adding one bit to W doubles the work, so it is exponential in the size of the input.',
  },
  {
    q: 'Trial division checks primes in O(√n). In terms of the BITS of `n`, that is...',
    o: ['Logarithmic', 'Linear', 'Polynomial', 'Exponential'],
    a: 3,
    why: 'n has b bits, so √n = 2^(b/2). Fast in the value, exponential in the input length.',
  },
  {
    q: 'Which grows fastest as n gets large?',
    o: ['n^100', '2^n', 'n log n', 'n²'],
    a: 1,
    why: 'Any exponential eventually beats any polynomial, however large the power.',
  },
  {
    q: 'Of these, which has the fastest growth?',
    o: ['2^n', '10^n', 'n!', 'n^10'],
    a: 2,
    why: 'Each step of n! multiplies by a growing factor, while 10^n always multiplies by 10.',
  },
  {
    q: 'Which grows slowest as n gets large?',
    o: ['√n', 'log² n', 'n / log n', 'n^0.01'],
    a: 1,
    why: 'Any power of log n is eventually beaten by any positive power of n, even n^0.01.',
  },
  {
    q: 'An O(n) algorithm vs an O(n²) one on 10 items: which is faster?',
    o: [
      'Always the O(n) one',
      'Always the O(n²) one',
      'It can be either: Big-O hides constants',
      'They take the same time',
    ],
    a: 2,
    why: 'Big-O describes growth, not speed at small n. This is why Timsort uses insertion sort on short runs.',
  },
  {
    q: 'Two inputs: one loop over `a`, then a separate loop over `b`. Time complexity?',
    o: ['O(a + b)', 'O(max(a, b)²)', 'O(a · b)', 'O(a)'],
    a: 0,
    why: 'Sequential work adds, nested work multiplies. Do not collapse them into a single n unless the lengths are tied.',
  },
  {
    q: 'A grid has `R` rows and `C` columns, `N = R · C` cells. Visiting every cell once is...',
    o: ['O(N²)', 'O(N)', 'O(N log N)', 'O(R²)'],
    a: 1,
    why: 'It looks like nested loops, but it is linear in the number of cells. Say which n you mean.',
  },
  {
    q: 'What is the time of a memoized recursive function?',
    o: [
      'Depth × branching factor',
      'Distinct states × work per state',
      'Always O(n)',
      'The same as without a memo',
    ],
    a: 1,
    why: 'Each state runs its body once, so count the states. Stack depth only matters for space.',
  },
  {
    q: 'What is the space complexity of recursion?',
    o: [
      'Total number of calls',
      'Maximum depth of the call stack, plus what each frame holds',
      'Always O(1)',
      'Branching factor squared',
    ],
    a: 1,
    why: 'Only the active path is on the stack at any moment, not every call ever made.',
  },
  {
    q: 'Worst-case extra space of `a.sort()` (Timsort)?',
    o: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    a: 2,
    why: 'Timsort merges with a temporary buffer of up to n/2 items, so "in place" here refers to the result, not the memory used.',
  },
]

export const COMPLEXITY = [
  ...SNIPPETS.map((x) => ({
    q: 'Time complexity?',
    ...x,
    code: x.code.trim(),
    tag: 'complexity',
    kind: 'choice',
    ordered: true,
  })),
  ...COSTS.map(([op, answer, why, o = COST_OPTIONS]) => ({
    tag: 'cost',
    kind: 'choice',
    ordered: true,
    q: 'Cost of ' + op + '?',
    o,
    a: o.indexOf(answer),
    why,
  })),
  ...CONCEPTS.map((x) => ({ ...x, tag: 'bigo', kind: 'choice' })),
]

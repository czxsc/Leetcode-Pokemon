// Twists deck: start from a classic solution (`base`) and edit it for a new rule. `a` is one model
// answer, kept as close to the base as possible so the diff shows only what the twist really needs.

const VALID_PARENS = `
def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack`

const NUM_ISLANDS = `
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    def dfs(r, c):
        if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != 1:
            return
        grid[r][c] = 0
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            dfs(r + dr, c + dc)
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                dfs(r, c)
                count += 1
    return count`

const TWO_SUM = `
def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`

const BINARY_SEARCH = `
def search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return mid
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`

const STAIRS = `
def climb(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        dp[i] = dp[i - 1] + (dp[i - 2] if i >= 2 else 0)
    return dp[n]`

const KADANE = `
def max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best`

const REVERSE_LIST = `
def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    return prev`

const MERGE_INTERVALS = `
def merge(intervals):
    intervals.sort()
    out = []
    for start, end in intervals:
        if out and start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out`

const LEVEL_ORDER = `
from collections import deque

def level_order(root):
    if not root:
        return []
    out = []
    q = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level)
    return out`

const MAX_DEPTH = `
def max_depth(root):
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))`

const PATH_SUM = `
def has_path_sum(root, target):
    if not root:
        return False
    if not root.left and not root.right:
        return root.val == target
    left = target - root.val
    return has_path_sum(root.left, left) or has_path_sum(root.right, left)`

const SUBSETS = `
def subsets(nums):
    out = []
    path = []
    def go(start):
        out.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            go(i + 1)
            path.pop()
    go(0)
    return out`

const COMBO_SUM = `
def combo_sum(nums, target):
    out = []
    path = []
    def go(start, left):
        if left == 0:
            out.append(path[:])
            return
        for i in range(start, len(nums)):
            if nums[i] <= left:
                path.append(nums[i])
                go(i, left - nums[i])
                path.pop()
    go(0, target)
    return out`

const PERMUTATIONS = `
def permute(nums):
    out = []
    path = []
    used = [False] * len(nums)
    def go():
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            go()
            path.pop()
            used[i] = False
    go()
    return out`

const COIN_CHANGE = `
def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`

const HOUSE_ROBBER = `
def rob(nums):
    take = skip = 0
    for x in nums:
        take, skip = skip + x, max(take, skip)
    return max(take, skip)`

const LONGEST_UNIQUE = `
def longest(s):
    seen = set()
    best = left = 0
    for right, c in enumerate(s):
        while c in seen:
            seen.remove(s[left])
            left += 1
        seen.add(c)
        best = max(best, right - left + 1)
    return best`

const TOP_K = `
from collections import Counter

def top_k(words, k):
    return [w for w, _ in Counter(words).most_common(k)]`

const KTH_LARGEST = `
import heapq

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`

const COURSE_SCHEDULE = `
from collections import defaultdict, deque

def can_finish(n, prereqs):
    graph = defaultdict(list)
    indegree = [0] * n
    for course, pre in prereqs:
        graph[pre].append(course)
        indegree[course] += 1
    q = deque(i for i in range(n) if indegree[i] == 0)
    taken = 0
    while q:
        node = q.popleft()
        taken += 1
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                q.append(nxt)
    return taken == n`

const BFS_PATH = `
from collections import deque

def shortest(graph, start, goal):
    dist = {start: 0}
    q = deque([start])
    while q:
        node = q.popleft()
        if node == goal:
            return dist[node]
        for nxt in graph[node]:
            if nxt not in dist:
                dist[nxt] = dist[node] + 1
                q.append(nxt)
    return -1`

const GRID_BFS = `
from collections import deque

def shortest(grid):
    rows, cols = len(grid), len(grid[0])
    q = deque([(0, 0, 0)])
    seen = {(0, 0)}
    while q:
        r, c, steps = q.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return steps
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                if grid[nr][nc] == 0 and (nr, nc) not in seen:
                    seen.add((nr, nc))
                    q.append((nr, nc, steps + 1))
    return -1`

const SPREAD_BFS = `
from collections import deque

def farthest(grid, start):
    rows, cols = len(grid), len(grid[0])
    dist = {start: 0}
    q = deque([start])
    while q:
        r, c = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                if grid[nr][nc] == 1 and (nr, nc) not in dist:
                    dist[(nr, nc)] = dist[(r, c)] + 1
                    q.append((nr, nc))
    return max(dist.values())`

const GROUP_ANAGRAMS = `
from collections import defaultdict

def group(words):
    groups = defaultdict(list)
    for w in words:
        key = ''.join(sorted(w))
        groups[key].append(w)
    return list(groups.values())`

const PALINDROME = `
def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return False
        l, r = l + 1, r - 1
    return True`

const SUBARRAY_SUM = `
from collections import Counter

def subarray_sum(nums, k):
    seen = Counter({0: 1})
    prefix = count = 0
    for x in nums:
        prefix += x
        count += seen[prefix - k]
        seen[prefix] += 1
    return count`

const NEXT_GREATER = `
def next_greater(nums):
    out = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            out[stack.pop()] = x
        stack.append(i)
    return out`

const TRIE = `
class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node['$'] = True

    def search(self, word):
        node = self.root
        for c in word:
            if c not in node:
                return False
            node = node[c]
        return '$' in node`

const UNION_FIND = `
def components(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    count = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            count -= 1
    return count`

const LCS = `
def lcs(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]`

const EDIT_DISTANCE = `
def edit_distance(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        dp[i][0] = i
    for j in range(len(b) + 1):
        dp[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[-1][-1]`

const LIS_DP = `
def lis(nums):
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)`

const LIS_BISECT = `
from bisect import bisect_left

def lis(nums):
    tails = []
    for x in nums:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)`

const UNIQUE_PATHS = `
def unique_paths(rows, cols):
    dp = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if r == 0 and c == 0:
                dp[r][c] = 1
            else:
                dp[r][c] = (dp[r - 1][c] if r else 0) + (dp[r][c - 1] if c else 0)
    return dp[-1][-1]`

const WORD_BREAK = `
def word_break(s, words):
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for w in words:
            if s[:i].endswith(w) and dp[i - len(w)]:
                dp[i] = True
    return dp[-1]`

const ROTATE = `
def rotate(m):
    return [list(r) for r in zip(*m[::-1])]`

const REMOVE_DUPES = `
def remove_duplicates(nums):
    k = 0
    for x in nums:
        if k < 1 or x != nums[k - 1]:
            nums[k] = x
            k += 1
    return k`

const HAS_CYCLE = `
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`

const MIDDLE = `
def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow`

const LRU = `
from collections import OrderedDict

class LRU:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)`

const STACK = `
class Stack:
    def __init__(self):
        self.items = []

    def push(self, x):
        self.items.append(x)

    def pop(self):
        return self.items.pop()

    def top(self):
        return self.items[-1]`

const WINDOW_MAX = `
def window_max(nums, k):
    out = []
    for i in range(len(nums) - k + 1):
        out.append(max(nums[i:i + k]))
    return out`

const TWO_POINTERS = `
def two_sum_sorted(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        total = nums[lo] + nums[hi]
        if total == target:
            return [lo, hi]
        if total < target:
            lo += 1
        else:
            hi -= 1
    return []`

const EXPAND_CENTER = `
def longest_palindrome(s):
    best = ''
    for center in range(2 * len(s) - 1):
        l, r = center // 2, center // 2 + center % 2
        while l >= 0 and r < len(s) and s[l] == s[r]:
            if r - l + 1 > len(best):
                best = s[l:r + 1]
            l, r = l - 1, r + 1
    return best`

const BEST_STOCK = `
def max_profit(prices):
    low = prices[0]
    best = 0
    for p in prices:
        low = min(low, p)
        best = max(best, p - low)
    return best`

const QUESTIONS = [
  {
    id: 'colored-parens',
    from: 'Valid Parentheses',
    base: VALID_PARENS,
    q: 'Brackets now have colors: `s` is a list of `(char, color)` tuples. A closer must match its opener in type AND color.',
    a: `
def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c, color in s:
        if c in pairs:
            if not stack or stack.pop() != (pairs[c], color):
                return False
        else:
            stack.append((c, color))
    return not stack`,
    why: 'Unpack each tuple, push `(char, color)`, and compare whole tuples when popping. Tuples compare by value, so one `!=` checks both fields.',
  },
  {
    id: 'parens-depth',
    from: 'Valid Parentheses',
    base: VALID_PARENS,
    q: 'Return the deepest nesting level if `s` is valid, or -1 if it is not. Empty string → 0.',
    a: `
def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    best = 0
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return -1
        else:
            stack.append(c)
            best = max(best, len(stack))
    return best if not stack else -1`,
    why: 'The stack size is the current nesting depth, so track its maximum right after each push.',
  },
  {
    id: 'distinct-islands',
    from: 'Number of Islands',
    base: NUM_ISLANDS,
    q: 'Count DISTINCT islands: two islands are the same if one can be moved (no rotating) onto the other.',
    a: `
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    def dfs(r, c, r0, c0, shape):
        if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != 1:
            return
        grid[r][c] = 0
        shape.append((r - r0, c - c0))
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            dfs(r + dr, c + dc, r0, c0, shape)
    shapes = set()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                shape = []
                dfs(r, c, r, c, shape)
                shapes.add(tuple(shape))
    return len(shapes)`,
    why: 'Subtracting the start cell makes coordinates relative, so position no longer matters. A list cannot go in a set, so store `tuple(shape)`, and the set size is the answer.',
  },
  {
    id: 'max-island',
    from: 'Number of Islands',
    base: NUM_ISLANDS,
    q: 'Return the AREA of the largest island instead of the count.',
    a: `
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    def dfs(r, c):
        if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != 1:
            return 0
        grid[r][c] = 0
        area = 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            area += dfs(r + dr, c + dc)
        return area
    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                best = max(best, dfs(r, c))
    return best`,
    why: 'Make `dfs` return a size: 0 for water, or 1 plus whatever its neighbors return. Then keep the largest.',
  },
  {
    id: 'closed-islands',
    from: 'Number of Islands',
    base: NUM_ISLANDS,
    q: 'Count only islands that never touch the edge of the grid.',
    a: `
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    def dfs(r, c):
        if not (0 <= r < rows and 0 <= c < cols):
            return False
        if grid[r][c] != 1:
            return True
        grid[r][c] = 0
        closed = True
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            closed = dfs(r + dr, c + dc) and closed
        return closed
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and dfs(r, c):
                count += 1
    return count`,
    why: 'Stepping off the grid means the island touched the edge. Trap: writing `closed and dfs(...)` short-circuits and stops flooding, so call `dfs` first.',
  },
  {
    id: 'two-sum-count',
    from: 'Two Sum',
    base: TWO_SUM,
    q: 'Count all pairs `i < j` with `nums[i] + nums[j] == target`. Duplicates count separately.',
    a: `
from collections import Counter

def two_sum(nums, target):
    seen = Counter()
    count = 0
    for x in nums:
        count += seen[target - x]
        seen[x] += 1
    return count`,
    why: 'Store how many times each value has appeared, not its index. Each new `x` pairs with every earlier `target - x`, and a missing key counts as 0.',
  },
  {
    id: 'leftmost',
    from: 'Binary Search',
    base: BINARY_SEARCH,
    q: '`a` now has duplicates. Return the FIRST index of `x`, or -1.',
    a: `
def search(a, x):
    lo, hi = 0, len(a) - 1
    ans = -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            ans = mid
            hi = mid - 1
        elif a[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return ans`,
    why: 'A match might not be the first one, so save it and keep searching left.',
  },
  {
    id: 'rotated',
    from: 'Binary Search',
    base: BINARY_SEARCH,
    q: 'The sorted array was rotated at an unknown pivot, like `[4, 5, 1, 2, 3]`, with no duplicates. Still return the index of `x`, or -1.',
    a: `
def search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return mid
        if a[lo] <= a[mid]:
            if a[lo] <= x < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if a[mid] < x <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`,
    why: 'One half is always sorted. Find which one, check whether `x` falls inside it, and search that side or the other.',
  },
  {
    id: 'bisect-rewrite',
    from: 'Binary Search',
    base: BINARY_SEARCH,
    q: 'Rewrite it using the `bisect` module instead of a hand-written loop.',
    a: `
from bisect import bisect_left

def search(a, x):
    i = bisect_left(a, x)
    return i if i < len(a) and a[i] == x else -1`,
    why: '`bisect_left` does the whole loop and gives the insertion point. You still have to check that the spot exists and really holds `x`.',
  },
  {
    id: 'stairs-steps',
    from: 'Climbing Stairs',
    base: STAIRS,
    q: 'You may take any step size listed in `steps`. New signature: `climb(n, steps)`.',
    a: `
def climb(n, steps):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        dp[i] = sum(dp[i - s] for s in steps if s <= i)
    return dp[n]`,
    why: 'The last move could be any size `s`, so add the ways to reach `i - s` for each one. The filter keeps the index from going negative.',
  },
  {
    id: 'stairs-broken',
    from: 'Climbing Stairs',
    base: STAIRS,
    q: 'Some stairs are broken and can’t be stepped on. New signature: `climb(n, broken)`, where `broken` is a set.',
    a: `
def climb(n, broken):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        if i in broken:
            continue
        dp[i] = dp[i - 1] + (dp[i - 2] if i >= 2 else 0)
    return dp[n]`,
    why: 'Leave broken stairs at 0 ways. Stairs above them then automatically get nothing from that route.',
  },
  {
    id: 'kadane-indices',
    from: 'Maximum Subarray',
    base: KADANE,
    q: 'Return the `(start, end)` indices of the best subarray instead of its sum.',
    a: `
def max_subarray(nums):
    best = cur = nums[0]
    start = best_l = best_r = 0
    for i in range(1, len(nums)):
        if cur + nums[i] < nums[i]:
            cur = nums[i]
            start = i
        else:
            cur += nums[i]
        if cur > best:
            best = cur
            best_l, best_r = start, i
    return best_l, best_r`,
    why: 'Restarting at `x` is the moment a new subarray begins, so split the `max` into an `if` and remember `start`. Save both indices when the best improves.',
  },
  {
    id: 'kadane-product',
    from: 'Maximum Subarray',
    base: KADANE,
    q: 'Find the maximum PRODUCT subarray instead (negatives are allowed).',
    a: `
def max_subarray(nums):
    best = hi = lo = nums[0]
    for x in nums[1:]:
        candidates = (x, hi * x, lo * x)
        hi, lo = max(candidates), min(candidates)
        best = max(best, hi)
    return best`,
    why: 'A negative times a negative can become the new max, so track both the largest and the smallest product ending here.',
  },
  {
    id: 'kadane-circular',
    from: 'Maximum Subarray',
    base: KADANE,
    q: 'The array is now circular: a subarray may wrap from the end to the start.',
    a: `
def max_subarray(nums):
    best = cur = nums[0]
    worst = low = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
        low = min(x, low + x)
        worst = min(worst, low)
    if best < 0:
        return best
    return max(best, sum(nums) - worst)`,
    why: 'A wrapping subarray is everything except a middle piece, so its best sum is the total minus the minimum subarray. If all are negative, that would leave nothing, so return `best`.',
  },
  {
    id: 'reverse-first-k',
    from: 'Reverse Linked List',
    base: REVERSE_LIST,
    q: 'Reverse only the first `k` nodes, and keep the rest attached. New signature: `reverse(head, k)`, with `k` at least 1.',
    a: `
def reverse(head, k):
    prev, cur = None, head
    while cur and k > 0:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
        k -= 1
    head.next = cur
    return prev`,
    why: 'Stop after k steps. At that point `cur` is the first untouched node, and the old `head` is the tail of the reversed part, so link them.',
  },
  {
    id: 'meeting-rooms',
    from: 'Merge Intervals',
    base: MERGE_INTERVALS,
    q: 'Treat intervals as meetings and return the minimum number of rooms. A meeting can start exactly when another ends.',
    a: `
import heapq

def merge(intervals):
    intervals.sort()
    rooms = []
    for start, end in intervals:
        if rooms and start >= rooms[0]:
            heapq.heapreplace(rooms, end)
        else:
            heapq.heappush(rooms, end)
    return len(rooms)`,
    why: 'The heap holds each room’s end time, so `rooms[0]` frees up first. Reuse it if possible, otherwise open a new room. The heap size is the answer.',
  },
  {
    id: 'zigzag',
    from: 'Level Order Traversal',
    base: LEVEL_ORDER,
    q: 'Zigzag: left to right on the first level, then right to left, and so on.',
    a: `
from collections import deque

def level_order(root):
    if not root:
        return []
    out = []
    q = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level[::-1] if len(out) % 2 else level)
    return out`,
    why: 'Keep the traversal the same and only flip what you store. `len(out) % 2` tells you whether this level is odd.',
  },
  {
    id: 'right-view',
    from: 'Level Order Traversal',
    base: LEVEL_ORDER,
    q: 'Return the right-side view: only the last value of each level.',
    a: `
from collections import deque

def level_order(root):
    if not root:
        return []
    out = []
    q = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level[-1])
    return out`,
    why: 'Children go in left to right, so the last value collected on a level is the rightmost node.',
  },
  {
    id: 'min-depth',
    from: 'Maximum Depth of Binary Tree',
    base: MAX_DEPTH,
    q: 'Return the MINIMUM depth: the number of nodes on the shortest path from the root down to a LEAF.',
    a: `
def min_depth(root):
    if not root:
        return 0
    if not root.left:
        return 1 + min_depth(root.right)
    if not root.right:
        return 1 + min_depth(root.left)
    return 1 + min(min_depth(root.left), min_depth(root.right))`,
    why: 'Swapping `max` for `min` is the trap: a node with one child would take the empty side as depth 0, but that is not a leaf. So follow the only child.',
  },
  {
    id: 'diameter',
    from: 'Maximum Depth of Binary Tree',
    base: MAX_DEPTH,
    q: 'Return the tree’s diameter: the most edges on any path between two nodes.',
    a: `
def diameter(root):
    best = 0
    def depth(node):
        nonlocal best
        if not node:
            return 0
        left, right = depth(node.left), depth(node.right)
        best = max(best, left + right)
        return 1 + max(left, right)
    depth(root)
    return best`,
    why: 'The best path through a node uses its left depth plus its right depth. Return depth as usual, and record the best on the side with `nonlocal`.',
  },
  {
    id: 'path-sum-all',
    from: 'Path Sum',
    base: PATH_SUM,
    q: 'Return ALL root-to-leaf paths that add up to `target`, as lists of values.',
    a: `
def has_path_sum(root, target):
    out = []
    path = []
    def go(node, left):
        if not node:
            return
        path.append(node.val)
        if not node.left and not node.right and node.val == left:
            out.append(path[:])
        go(node.left, left - node.val)
        go(node.right, left - node.val)
        path.pop()
    go(root, target)
    return out`,
    why: 'Backtracking: push on the way in, pop on the way out. Store `path[:]`, a copy, because `path` keeps changing.',
  },
  {
    id: 'subsets-dupes',
    from: 'Subsets',
    base: SUBSETS,
    q: '`nums` may now contain duplicates. Return each distinct subset only once.',
    a: `
def subsets(nums):
    nums.sort()
    out = []
    path = []
    def go(start):
        out.append(path[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue
            path.append(nums[i])
            go(i + 1)
            path.pop()
    go(0)
    return out`,
    why: 'Sorting puts duplicates side by side. Skipping `i > start` repeats means each value is tried only once at this depth, though it can still be used deeper.',
  },
  {
    id: 'combo-once',
    from: 'Combination Sum',
    base: COMBO_SUM,
    q: 'Each number may be used at most once, and `nums` may have duplicates. Return each distinct combination once.',
    a: `
def combo_sum(nums, target):
    nums.sort()
    out = []
    path = []
    def go(start, left):
        if left == 0:
            out.append(path[:])
            return
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue
            if nums[i] <= left:
                path.append(nums[i])
                go(i + 1, left - nums[i])
                path.pop()
    go(0, target)
    return out`,
    why: '`go(i + 1, ...)` stops an item being reused. Sorting plus the `i > start` skip removes repeated combinations.',
  },
  {
    id: 'perms-dupes',
    from: 'Permutations',
    base: PERMUTATIONS,
    q: '`nums` may now contain duplicates. Return each distinct permutation once.',
    a: `
def permute(nums):
    nums.sort()
    out = []
    path = []
    used = [False] * len(nums)
    def go():
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:
                continue
            used[i] = True
            path.append(nums[i])
            go()
            path.pop()
            used[i] = False
    go()
    return out`,
    why: 'Equal values must be used in order. Skipping when the previous copy is unused stops two swapped copies from producing the same result.',
  },
  {
    id: 'coin-ways',
    from: 'Coin Change',
    base: COIN_CHANGE,
    q: 'Return the number of COMBINATIONS that make `amount` (order doesn’t matter: 1+2 and 2+1 are one way).',
    a: `
def coin_change(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]`,
    why: 'Loop over coins on the OUTSIDE, so each combination is built in one coin order. Keeping amounts on the outside would count permutations instead.',
  },
  {
    id: 'rob-circular',
    from: 'House Robber',
    base: HOUSE_ROBBER,
    q: 'The houses are now in a circle, so the first and last are neighbors.',
    a: `
def rob(nums):
    def line(houses):
        take = skip = 0
        for x in houses:
            take, skip = skip + x, max(take, skip)
        return max(take, skip)
    if len(nums) == 1:
        return nums[0]
    return max(line(nums[1:]), line(nums[:-1]))`,
    why: 'You can never rob both ends, so solve the line twice: once without the first house, once without the last. One house needs its own case.',
  },
  {
    id: 'k-distinct',
    from: 'Longest Substring Without Repeats',
    base: LONGEST_UNIQUE,
    q: 'Longest substring with AT MOST `k` distinct characters. New signature: `longest(s, k)`.',
    a: `
from collections import Counter

def longest(s, k):
    cnt = Counter()
    best = left = 0
    for right, c in enumerate(s):
        cnt[c] += 1
        while len(cnt) > k:
            cnt[s[left]] -= 1
            if cnt[s[left]] == 0:
                del cnt[s[left]]
            left += 1
        best = max(best, right - left + 1)
    return best`,
    why: 'Repeats are now allowed, so count characters instead of using a set. Delete keys at zero so `len(cnt)` stays the number of distinct characters.',
  },
  {
    id: 'char-replace',
    from: 'Longest Substring Without Repeats',
    base: LONGEST_UNIQUE,
    q: 'Longest substring you could make all ONE letter by replacing at most `k` characters. New signature: `longest(s, k)`.',
    a: `
from collections import Counter

def longest(s, k):
    cnt = Counter()
    best = left = 0
    for right, c in enumerate(s):
        cnt[c] += 1
        while (right - left + 1) - max(cnt.values()) > k:
            cnt[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
    why: 'Replacements needed = window size minus the most common letter’s count. Shrink while that exceeds `k`.',
  },
  {
    id: 'top-k-ties',
    from: 'Top K Frequent Words',
    base: TOP_K,
    q: 'Break frequency ties alphabetically.',
    a: `
from collections import Counter

def top_k(words, k):
    cnt = Counter(words)
    return sorted(cnt, key=lambda w: (-cnt[w], w))[:k]`,
    why: '`most_common` breaks ties by first-seen order, so sort yourself. A tuple key with a negated count gives highest count first, then A→Z.',
  },
  {
    id: 'k-closest',
    from: 'Kth Largest Element',
    base: KTH_LARGEST,
    q: 'Return the `k` closest `[x, y]` points to the origin. New signature: `k_closest(points, k)`.',
    a: `
import heapq

def k_closest(points, k):
    heap = []
    for x, y in points:
        heapq.heappush(heap, (-(x * x + y * y), x, y))
        if len(heap) > k:
            heapq.heappop(heap)
    return [[x, y] for _, x, y in heap]`,
    why: 'To keep the smallest distances you need to evict the largest, so negate to make a max-heap. Squared distance is enough for ordering.',
  },
  {
    id: 'course-order',
    from: 'Course Schedule',
    base: COURSE_SCHEDULE,
    q: 'Return a valid order of the courses, or `[]` if it’s impossible.',
    a: `
from collections import defaultdict, deque

def can_finish(n, prereqs):
    graph = defaultdict(list)
    indegree = [0] * n
    for course, pre in prereqs:
        graph[pre].append(course)
        indegree[course] += 1
    q = deque(i for i in range(n) if indegree[i] == 0)
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                q.append(nxt)
    return order if len(order) == n else []`,
    why: 'The order nodes leave the queue is already a topological order, so record it instead of counting. Any missing course means a cycle.',
  },
  {
    id: 'course-semesters',
    from: 'Course Schedule',
    base: COURSE_SCHEDULE,
    q: 'Return the minimum number of semesters if you can take any number of courses at once, or -1 if impossible.',
    a: `
from collections import defaultdict, deque

def can_finish(n, prereqs):
    graph = defaultdict(list)
    indegree = [0] * n
    for course, pre in prereqs:
        graph[pre].append(course)
        indegree[course] += 1
    q = deque(i for i in range(n) if indegree[i] == 0)
    taken = semesters = 0
    while q:
        semesters += 1
        for _ in range(len(q)):
            node = q.popleft()
            taken += 1
            for nxt in graph[node]:
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    q.append(nxt)
    return semesters if taken == n else -1`,
    why: 'Each level of the BFS is one semester, so use the `for _ in range(len(q))` pattern to take a whole level at a time.',
  },
  {
    id: 'bfs-to-dijkstra',
    from: 'BFS Shortest Path',
    base: BFS_PATH,
    q: 'Edges now have weights: `graph[u]` is a list of `(v, weight)`, all non-negative. Return the cheapest distance.',
    a: `
import heapq

def shortest(graph, start, goal):
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, node = heapq.heappop(heap)
        if node == goal:
            return d
        if d > dist[node]:
            continue
        for nxt, w in graph[node]:
            if d + w < dist.get(nxt, float('inf')):
                dist[nxt] = d + w
                heapq.heappush(heap, (d + w, nxt))
    return -1`,
    why: 'Swap the deque for a heap so the closest node comes out first: that is Dijkstra. A node can now be pushed twice, so skip stale entries.',
  },
  {
    id: 'grid-eliminate',
    from: 'Shortest Path in a Grid',
    base: GRID_BFS,
    q: 'You may now remove up to `k` walls along the way. New signature: `shortest(grid, k)`.',
    a: `
from collections import deque

def shortest(grid, k):
    rows, cols = len(grid), len(grid[0])
    q = deque([(0, 0, k, 0)])
    seen = {(0, 0, k)}
    while q:
        r, c, left, steps = q.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return steps
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                remaining = left - grid[nr][nc]
                if remaining >= 0 and (nr, nc, remaining) not in seen:
                    seen.add((nr, nc, remaining))
                    q.append((nr, nc, remaining, steps + 1))
    return -1`,
    why: 'The same cell can be worth revisiting with more removals left, so the state becomes `(r, c, left)`. Walls are 1, so `left - grid[nr][nc]` handles both cases.',
  },
  {
    id: 'multi-source',
    from: 'BFS on a Grid',
    base: SPREAD_BFS,
    q: 'Rotting Oranges style: the spread now starts from a whole list of cells at once. New signature: `farthest(grid, starts)`.',
    a: `
from collections import deque

def farthest(grid, starts):
    rows, cols = len(grid), len(grid[0])
    dist = {s: 0 for s in starts}
    q = deque(starts)
    while q:
        r, c = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                if grid[nr][nc] == 1 and (nr, nc) not in dist:
                    dist[(nr, nc)] = dist[(r, c)] + 1
                    q.append((nr, nc))
    return max(dist.values())`,
    why: 'Only the setup changes: put every source in the queue at distance 0. BFS then spreads from all of them evenly, with no extra loop.',
  },
  {
    id: 'count-key',
    from: 'Group Anagrams',
    base: GROUP_ANAGRAMS,
    q: 'Avoid sorting: build each key in O(L) from letter counts (lowercase letters only).',
    a: `
from collections import defaultdict

def group(words):
    groups = defaultdict(list)
    for w in words:
        counts = [0] * 26
        for c in w:
            counts[ord(c) - ord('a')] += 1
        groups[tuple(counts)].append(w)
    return list(groups.values())`,
    why: 'Anagrams have identical letter counts. A list cannot be a dict key, so convert it to a tuple.',
  },
  {
    id: 'shifted-strings',
    from: 'Group Anagrams',
    base: GROUP_ANAGRAMS,
    q: 'Group words that are SHIFTS of each other instead: `abc`, `bcd` and `xyz` belong together (`z` wraps to `a`).',
    a: `
from collections import defaultdict

def group(words):
    groups = defaultdict(list)
    for w in words:
        key = tuple((ord(c) - ord(w[0])) % 26 for c in w)
        groups[key].append(w)
    return list(groups.values())`,
    why: 'Shifted words have the same gaps from their first letter. `% 26` handles the wrap, and in Python it stays non-negative.',
  },
  {
    id: 'palindrome-one-removal',
    from: 'Valid Palindrome',
    base: PALINDROME,
    q: 'You may delete AT MOST one character. Can `s` become a palindrome?',
    a: `
def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            skip_l, skip_r = s[l + 1:r + 1], s[l:r]
            return skip_l == skip_l[::-1] or skip_r == skip_r[::-1]
        l, r = l + 1, r - 1
    return True`,
    why: 'Everything matches until the first mismatch. Then the only choices are to drop the left character or the right one, so check both. It stays O(n).',
  },
  {
    id: 'palindrome-alnum',
    from: 'Valid Palindrome',
    base: PALINDROME,
    q: 'Ignore case and anything that isn’t a letter or digit.',
    a: `
def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if not s[l].isalnum():
            l += 1
        elif not s[r].isalnum():
            r -= 1
        elif s[l].lower() != s[r].lower():
            return False
        else:
            l, r = l + 1, r - 1
    return True`,
    why: 'Skip one junk character per step and only compare when both sides are valid. This stays O(1) space, unlike cleaning into a new string.',
  },
  {
    id: 'subarray-divisible',
    from: 'Subarray Sum Equals K',
    base: SUBARRAY_SUM,
    q: 'Count subarrays whose sum is DIVISIBLE by `k` instead.',
    a: `
from collections import Counter

def subarray_sum(nums, k):
    seen = Counter({0: 1})
    prefix = count = 0
    for x in nums:
        prefix += x
        count += seen[prefix % k]
        seen[prefix % k] += 1
    return count`,
    why: 'A subarray is divisible by `k` when two prefix sums have the same remainder. So key the counter by `prefix % k`.',
  },
  {
    id: 'subarray-longest',
    from: 'Subarray Sum Equals K',
    base: SUBARRAY_SUM,
    q: 'Return the LENGTH of the longest subarray summing to `k`, or 0 if none.',
    a: `
def subarray_sum(nums, k):
    first = {0: -1}
    prefix = best = 0
    for i, x in enumerate(nums):
        prefix += x
        if prefix - k in first:
            best = max(best, i - first[prefix - k])
        first.setdefault(prefix, i)
    return best`,
    why: 'To get the longest, store the EARLIEST index of each prefix sum. `setdefault` keeps the first one, and the `-1` handles subarrays starting at 0.',
  },
  {
    id: 'next-greater-circular',
    from: 'Next Greater Element',
    base: NEXT_GREATER,
    q: 'The array is now circular: the search for something greater can wrap around.',
    a: `
def next_greater(nums):
    n = len(nums)
    out = [-1] * n
    stack = []
    for i in range(2 * n):
        x = nums[i % n]
        while stack and nums[stack[-1]] < x:
            out[stack.pop()] = x
        if i < n:
            stack.append(i)
    return out`,
    why: 'Walk the array twice using `% n`. The second pass only answers waiting indices, so nothing new gets pushed.',
  },
  {
    id: 'previous-smaller',
    from: 'Next Greater Element',
    base: NEXT_GREATER,
    q: 'For each position, return the PREVIOUS SMALLER value, or -1.',
    a: `
def next_greater(nums):
    out = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] >= x:
            stack.pop()
        if stack:
            out[i] = nums[stack[-1]]
        stack.append(i)
    return out`,
    why: 'Pop everything `>= x`, since those can never be the answer again. Whatever remains on top is the nearest smaller value on the left.',
  },
  {
    id: 'trie-count',
    from: 'Implement Trie',
    base: TRIE,
    q: 'Add `count_prefix(prefix)`: how many inserted words start with `prefix`? (Each word is inserted once.)',
    a: `
class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
            node['#'] = node.get('#', 0) + 1
        node['$'] = True

    def search(self, word):
        node = self.root
        for c in word:
            if c not in node:
                return False
            node = node[c]
        return '$' in node

    def count_prefix(self, prefix):
        node = self.root
        for c in prefix:
            if c not in node:
                return 0
            node = node[c]
        return node.get('#', 0)`,
    why: 'Bump a counter at every node on the way down. Each node then knows how many words pass through it, so a query is just a walk.',
  },
  {
    id: 'trie-wildcard',
    from: 'Implement Trie',
    base: TRIE,
    q: '`search` must now support `.`, which matches any one letter.',
    a: `
class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node['$'] = True

    def search(self, word):
        def go(node, i):
            if i == len(word):
                return '$' in node
            if word[i] == '.':
                return any(k != '$' and go(child, i + 1) for k, child in node.items())
            return word[i] in node and go(node[word[i]], i + 1)
        return go(self.root, 0)`,
    why: 'A wildcard has to try every child, so the loop becomes recursion. Skip the `$` end marker, because its value is not a node.',
  },
  {
    id: 'uf-largest',
    from: 'Union-Find Components',
    base: UNION_FIND,
    q: 'Return the size of the LARGEST component instead of the count.',
    a: `
def components(n, edges):
    parent = list(range(n))
    size = [1] * n
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    best = 1
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            size[rb] += size[ra]
            best = max(best, size[rb])
    return best`,
    why: 'Keep a size at each root, and add the sizes together when merging. Only sizes at roots are meaningful.',
  },
  {
    id: 'lc-substring',
    from: 'Longest Common Subsequence',
    base: LCS,
    q: 'Return the longest common SUBSTRING instead: the characters must be contiguous.',
    a: `
def lcs(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    best = 0
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                best = max(best, dp[i][j])
    return best`,
    why: 'A mismatch breaks a substring, so the cell stays 0 instead of inheriting. The best answer can end anywhere, so track the maximum.',
  },
  {
    id: 'edit-no-replace',
    from: 'Edit Distance',
    base: EDIT_DISTANCE,
    q: 'Only insert and delete are allowed now: no replacing.',
    a: `
def edit_distance(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        dp[i][0] = i
    for j in range(len(b) + 1):
        dp[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]`,
    why: '`dp[i - 1][j - 1]` in the `min` was the replace option, so drop it. The diagonal stays for matching characters.',
  },
  {
    id: 'lis-to-bisect',
    from: 'Longest Increasing Subsequence',
    base: LIS_DP,
    q: 'Rewrite it in O(n log n) using `bisect` and a `tails` list.',
    a: LIS_BISECT,
    why: '`tails[i]` is the smallest possible ending of an increasing run of length `i + 1`. Each number replaces the first tail >= it, or extends the list.',
  },
  {
    id: 'lis-nondecreasing',
    from: 'Longest Increasing Subsequence',
    base: LIS_BISECT,
    q: 'Allow equal neighbors: longest NON-DECREASING subsequence.',
    a: `
from bisect import bisect_right

def lis(nums):
    tails = []
    for x in nums:
        i = bisect_right(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)`,
    why: '`bisect_right` lands after equal values, so an equal number can extend a run instead of replacing its tail.',
  },
  {
    id: 'paths-obstacles',
    from: 'Unique Paths',
    base: UNIQUE_PATHS,
    q: 'The grid now has obstacles: `grid[r][c] == 1` is blocked. New signature: `unique_paths(grid)`.',
    a: `
def unique_paths(grid):
    rows, cols = len(grid), len(grid[0])
    dp = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                continue
            if r == 0 and c == 0:
                dp[r][c] = 1
            else:
                dp[r][c] = (dp[r - 1][c] if r else 0) + (dp[r][c - 1] if c else 0)
    return dp[-1][-1]`,
    why: 'A blocked cell keeps 0 paths, so nothing flows through it. Checking it first also covers a blocked start.',
  },
  {
    id: 'word-break-count',
    from: 'Word Break',
    base: WORD_BREAK,
    q: 'Return the NUMBER of ways to split `s`, not just whether one exists.',
    a: `
def word_break(s, words):
    dp = [0] * (len(s) + 1)
    dp[0] = 1
    for i in range(1, len(s) + 1):
        for w in words:
            if s[:i].endswith(w):
                dp[i] += dp[i - len(w)]
    return dp[-1]`,
    why: 'The same DP, but counting: booleans become numbers, and `True` becomes `+=`. If a word does not fit, `endswith` is false, so the index stays safe.',
  },
  {
    id: 'rotate-ccw',
    from: 'Rotate Image',
    base: ROTATE,
    q: 'This rotates clockwise. Make it rotate COUNTER-clockwise.',
    a: `
def rotate(m):
    return [list(r) for r in zip(*m)][::-1]`,
    why: 'Clockwise is flip the rows, then transpose. Counter-clockwise is transpose, then flip the rows.',
  },
  {
    id: 'dedupe-two',
    from: 'Remove Duplicates from Sorted Array',
    base: REMOVE_DUPES,
    q: 'Each value may now appear up to TWICE.',
    a: `
def remove_duplicates(nums):
    k = 0
    for x in nums:
        if k < 2 or x != nums[k - 2]:
            nums[k] = x
            k += 1
    return k`,
    why: 'Compare with the item two slots back: if it equals `x`, there are already two copies. The same idea generalizes to any limit.',
  },
  {
    id: 'cycle-start',
    from: 'Linked List Cycle',
    base: HAS_CYCLE,
    q: 'Return the NODE where the cycle begins, or `None`.',
    a: `
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            slow = head
            while slow is not fast:
                slow, fast = slow.next, fast.next
            return slow
    return None`,
    why: 'Floyd’s second phase: after they meet, reset one pointer to `head` and move both one step at a time. They meet again at the cycle’s start.',
  },
  {
    id: 'middle-first',
    from: 'Middle of the Linked List',
    base: MIDDLE,
    q: 'For an even length, return the FIRST of the two middle nodes (the base returns the second).',
    a: `
def middle(head):
    slow = fast = head
    while fast.next and fast.next.next:
        slow = slow.next
        fast = fast.next.next
    return slow`,
    why: 'Stopping one step earlier leaves `slow` one node back on even lengths. This form is what you want when splitting a list for merge sort.',
  },
  {
    id: 'lru-plain-dict',
    from: 'LRU Cache',
    base: LRU,
    q: 'Rewrite it with a plain `dict` and no `OrderedDict`. Plain dicts keep insertion order.',
    a: `
class LRU:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = {}

    def get(self, key):
        if key not in self.data:
            return -1
        self.data[key] = self.data.pop(key)
        return self.data[key]

    def put(self, key, value):
        self.data.pop(key, None)
        self.data[key] = value
        if len(self.data) > self.capacity:
            del self.data[next(iter(self.data))]`,
    why: 'Pop and re-insert moves a key to the end, and `next(iter(d))` reads the oldest key. Two neat language tricks in one.',
  },
  {
    id: 'min-stack',
    from: 'Stack',
    base: STACK,
    q: 'Add `get_min()` in O(1).',
    a: `
class Stack:
    def __init__(self):
        self.items = []

    def push(self, x):
        low = min(x, self.items[-1][1]) if self.items else x
        self.items.append((x, low))

    def pop(self):
        return self.items.pop()[0]

    def top(self):
        return self.items[-1][0]

    def get_min(self):
        return self.items[-1][1]`,
    why: 'Store `(value, min so far)` in each entry. The min at any depth never changes while that entry is on the stack, so popping restores the old one.',
  },
  {
    id: 'window-deque',
    from: 'Sliding Window Maximum',
    base: WINDOW_MAX,
    q: 'This is O(n · k). Make it O(n) with a deque.',
    a: `
from collections import deque

def window_max(nums, k):
    out = []
    q = deque()
    for i, x in enumerate(nums):
        while q and nums[q[-1]] < x:
            q.pop()
        q.append(i)
        if q[0] <= i - k:
            q.popleft()
        if i >= k - 1:
            out.append(nums[q[0]])
    return out`,
    why: 'Keep indices with decreasing values. Smaller older values can never win again, so pop them. The front is the max, unless it has left the window.',
  },
  {
    id: 'two-pointer-all',
    from: 'Two Sum II (sorted)',
    base: TWO_POINTERS,
    q: 'Return ALL unique value pairs that hit `target`, as `[low, high]` lists. `nums` is sorted and may have duplicates.',
    a: `
def two_sum_sorted(nums, target):
    lo, hi = 0, len(nums) - 1
    out = []
    while lo < hi:
        total = nums[lo] + nums[hi]
        if total == target:
            out.append([nums[lo], nums[hi]])
            lo += 1
            while lo < hi and nums[lo] == nums[lo - 1]:
                lo += 1
            hi -= 1
        elif total < target:
            lo += 1
        else:
            hi -= 1
    return out`,
    why: 'Keep going after a match, and skip over equal values so no pair repeats. 3Sum uses this same inner loop.',
  },
  {
    id: 'count-palindromes',
    from: 'Longest Palindromic Substring',
    base: EXPAND_CENTER,
    q: 'COUNT all palindromic substrings instead.',
    a: `
def longest_palindrome(s):
    total = 0
    for center in range(2 * len(s) - 1):
        l, r = center // 2, center // 2 + center % 2
        while l >= 0 and r < len(s) and s[l] == s[r]:
            total += 1
            l, r = l - 1, r + 1
    return total`,
    why: 'Every successful expansion is exactly one palindrome, so count them. There are 2n - 1 centers, because even-length palindromes center between letters.',
  },
  {
    id: 'stock-days',
    from: 'Best Time to Buy and Sell Stock',
    base: BEST_STOCK,
    q: 'Return the `(buy_day, sell_day)` indices for the best profit instead of the profit. If no profit is possible, return `(0, 0)`.',
    a: `
def max_profit(prices):
    low = 0
    best = 0
    days = (0, 0)
    for i, p in enumerate(prices):
        if p < prices[low]:
            low = i
        if p - prices[low] > best:
            best = p - prices[low]
            days = (low, i)
    return days`,
    why: 'Track the index of the lowest price instead of its value, and save both days whenever the profit improves.',
  },
  {
    id: 'stock-unlimited',
    from: 'Best Time to Buy and Sell Stock',
    base: BEST_STOCK,
    q: 'You may now make as many buy-and-sell trades as you like. Return the total best profit.',
    a: `
def max_profit(prices):
    best = 0
    for a, b in zip(prices, prices[1:]):
        best += max(0, b - a)
    return best`,
    why: 'Collect every upward step. Any rising stretch equals the sum of its daily gains, so holding longer never earns more. `zip` with a shifted slice gives neighboring days.',
  },
]

export const TWISTS = QUESTIONS.map((x) => ({
  ...x,
  base: x.base.trim(),
  a: x.a.trim(),
  tag: 'twist',
  kind: 'twist',
}))

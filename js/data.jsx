/* =====================================================================
   Sample data — categories, solved problems (with code), owned creatures,
   streak history. All "live" progress (coins, claims, team) lives in the
   store; this is the static seed.
===================================================================== */
(function(){
  const SHARD_BY_DIFF = { Easy:50, Medium:150, Hard:500 };

  // 18 NeetCode-style categories. counts = total problems available (flavor)
  const CATEGORIES = [
    { id:'arrays',     name:'Arrays & Hashing',  total:9 },
    { id:'twoptr',     name:'Two Pointers',      total:5 },
    { id:'sliding',    name:'Sliding Window',    total:6 },
    { id:'binsearch',  name:'Binary Search',     total:7 },
    { id:'stack',      name:'Stack',             total:7 },
    { id:'trees',      name:'Trees',             total:11 },
    { id:'graphs',     name:'Graphs',            total:13 },
    { id:'dp1',        name:'1D DP',             total:10 },
    { id:'dp2',        name:'2D DP',             total:11 },
    { id:'greedy',     name:'Greedy',            total:8 },
    { id:'backtrack',  name:'Backtracking',      total:9 },
    { id:'linked',     name:'Linked List',       total:11 },
    { id:'heap',       name:'Heap / PQ',         total:7 },
    { id:'tries',      name:'Tries',             total:3 },
    { id:'advgraph',   name:'Advanced Graphs',   total:6 },
    { id:'intervals',  name:'Intervals',         total:6 },
    { id:'mathgeo',    name:'Math & Geometry',   total:8 },
    { id:'bit',        name:'Bit Manipulation',  total:7 },
  ];

  const code = (s)=>s.replace(/^\n/,'').replace(/\n$/,'');

  // helper to build a problem
  let _n=0;
  const P = (cat,name,diff,solved,src)=>({ id:cat+'-'+(_n++), cat, name, diff, solved, code: src?code(src):'' });

  const PROBLEMS = {
    arrays:[
      P('arrays','Two Sum','Easy',true,`
class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, x in enumerate(nums):
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i`),
      P('arrays','Valid Anagram','Easy',true,`
class Solution:
    def isAnagram(self, s, t):
        return Counter(s) == Counter(t)`),
      P('arrays','Group Anagrams','Medium',true,`
class Solution:
    def groupAnagrams(self, strs):
        groups = defaultdict(list)
        for w in strs:
            key = tuple(sorted(w))
            groups[key].append(w)
        return list(groups.values())`),
      P('arrays','Top K Frequent Elements','Medium',true,`
class Solution:
    def topKFrequent(self, nums, k):
        count = Counter(nums)
        return [n for n, _ in count.most_common(k)]`),
      P('arrays','Product of Array Except Self','Medium',true,`
class Solution:
    def productExceptSelf(self, nums):
        res = [1] * len(nums)
        pre = 1
        for i in range(len(nums)):
            res[i] = pre
            pre *= nums[i]
        post = 1
        for i in range(len(nums)-1, -1, -1):
            res[i] *= post
            post *= nums[i]
        return res`),
      P('arrays','Contains Duplicate','Easy',true,`
class Solution:
    def containsDuplicate(self, nums):
        return len(set(nums)) != len(nums)`),
      P('arrays','Longest Consecutive Sequence','Medium',false),
      P('arrays','Encode and Decode Strings','Medium',false),
      P('arrays','Valid Sudoku','Medium',false),
    ],
    twoptr:[
      P('twoptr','Valid Palindrome','Easy',true,`
class Solution:
    def isPalindrome(self, s):
        s = [c for c in s.lower() if c.isalnum()]
        return s == s[::-1]`),
      P('twoptr','Two Sum II','Medium',true,`
class Solution:
    def twoSum(self, numbers, target):
        l, r = 0, len(numbers) - 1
        while l < r:
            cur = numbers[l] + numbers[r]
            if cur == target: return [l+1, r+1]
            if cur < target: l += 1
            else: r -= 1`),
      P('twoptr','3Sum','Medium',true,`
class Solution:
    def threeSum(self, nums):
        nums.sort(); res = []
        for i in range(len(nums)):
            if i and nums[i] == nums[i-1]: continue
            l, r = i+1, len(nums)-1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0: l += 1
                elif s > 0: r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    l += 1
                    while l < r and nums[l] == nums[l-1]: l += 1
        return res`),
      P('twoptr','Container With Most Water','Medium',false),
      P('twoptr','Trapping Rain Water','Hard',false),
    ],
    sliding:[
      P('sliding','Best Time to Buy/Sell Stock','Easy',true,`
class Solution:
    def maxProfit(self, prices):
        lo = float('inf'); best = 0
        for p in prices:
            lo = min(lo, p)
            best = max(best, p - lo)
        return best`),
      P('sliding','Longest Substring w/o Repeat','Medium',true,`
class Solution:
    def lengthOfLongestSubstring(self, s):
        seen = {}; l = 0; best = 0
        for r, c in enumerate(s):
            if c in seen and seen[c] >= l:
                l = seen[c] + 1
            seen[c] = r
            best = max(best, r - l + 1)
        return best`),
      P('sliding','Longest Repeating Char Replacement','Medium',false),
      P('sliding','Permutation in String','Medium',false),
      P('sliding','Minimum Window Substring','Hard',false),
      P('sliding','Sliding Window Maximum','Hard',false),
    ],
    binsearch:[
      P('binsearch','Binary Search','Easy',true,`
class Solution:
    def search(self, nums, target):
        l, r = 0, len(nums) - 1
        while l <= r:
            m = (l + r) // 2
            if nums[m] == target: return m
            if nums[m] < target: l = m + 1
            else: r = m - 1
        return -1`),
      P('binsearch','Search a 2D Matrix','Medium',true,`
class Solution:
    def searchMatrix(self, matrix, target):
        rows, cols = len(matrix), len(matrix[0])
        l, r = 0, rows*cols - 1
        while l <= r:
            m = (l+r)//2
            v = matrix[m//cols][m%cols]
            if v == target: return True
            if v < target: l = m+1
            else: r = m-1
        return False`),
      P('binsearch','Koko Eating Bananas','Medium',true,`
class Solution:
    def minEatingSpeed(self, piles, h):
        l, r = 1, max(piles)
        while l < r:
            k = (l+r)//2
            if sum(ceil(p/k) for p in piles) <= h: r = k
            else: l = k+1
        return l`),
      P('binsearch','Find Min in Rotated Array','Medium',false),
      P('binsearch','Search in Rotated Array','Medium',false),
      P('binsearch','Time Based Key-Value Store','Medium',false),
      P('binsearch','Median of Two Sorted Arrays','Hard',false),
    ],
    stack:[
      P('stack','Valid Parentheses','Easy',true,`
class Solution:
    def isValid(self, s):
        pairs = {')':'(', ']':'[', '}':'{'}
        st = []
        for c in s:
            if c in pairs:
                if not st or st.pop() != pairs[c]: return False
            else: st.append(c)
        return not st`),
      P('stack','Min Stack','Medium',true,`
class MinStack:
    def __init__(self):
        self.st = []
    def push(self, x):
        m = min(x, self.st[-1][1]) if self.st else x
        self.st.append((x, m))
    def pop(self): self.st.pop()
    def top(self): return self.st[-1][0]
    def getMin(self): return self.st[-1][1]`),
      P('stack','Daily Temperatures','Medium',true,`
class Solution:
    def dailyTemperatures(self, temps):
        res = [0]*len(temps); st = []
        for i, t in enumerate(temps):
            while st and temps[st[-1]] < t:
                j = st.pop()
                res[j] = i - j
            st.append(i)
        return res`),
      P('stack','Evaluate Reverse Polish Notation','Medium',false),
      P('stack','Generate Parentheses','Medium',false),
      P('stack','Car Fleet','Medium',false),
      P('stack','Largest Rectangle in Histogram','Hard',false),
    ],
    trees:[
      P('trees','Invert Binary Tree','Easy',true,`
class Solution:
    def invertTree(self, root):
        if not root: return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root`),
      P('trees','Maximum Depth of Binary Tree','Easy',true,`
class Solution:
    def maxDepth(self, root):
        if not root: return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`),
      P('trees','Diameter of Binary Tree','Easy',true,`
class Solution:
    def diameterOfBinaryTree(self, root):
        self.best = 0
        def depth(n):
            if not n: return 0
            l, r = depth(n.left), depth(n.right)
            self.best = max(self.best, l + r)
            return 1 + max(l, r)
        depth(root)
        return self.best`),
      P('trees','Balanced Binary Tree','Easy',true),
      P('trees','Same Tree','Easy',true),
      P('trees','Lowest Common Ancestor of BST','Medium',true),
      P('trees','Binary Tree Level Order Traversal','Medium',false),
      P('trees','Validate BST','Medium',false),
      P('trees','Kth Smallest in BST','Medium',false),
      P('trees','Construct Tree from Pre/Inorder','Medium',false),
      P('trees','Binary Tree Maximum Path Sum','Hard',false),
    ],
    graphs:[
      P('graphs','Number of Islands','Medium',true,`
class Solution:
    def numIslands(self, grid):
        rows, cols = len(grid), len(grid[0])
        def dfs(r, c):
            if r<0 or c<0 or r>=rows or c>=cols or grid[r][c] != '1': return
            grid[r][c] = '0'
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)): dfs(r+dr, c+dc)
        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    count += 1; dfs(r, c)
        return count`),
      P('graphs','Clone Graph','Medium',true),
      P('graphs','Course Schedule','Medium',true,`
class Solution:
    def canFinish(self, n, prereqs):
        adj = defaultdict(list)
        for a, b in prereqs: adj[a].append(b)
        state = [0]*n  # 0 unseen 1 visiting 2 done
        def dfs(x):
            if state[x] == 1: return False
            if state[x] == 2: return True
            state[x] = 1
            for nxt in adj[x]:
                if not dfs(nxt): return False
            state[x] = 2
            return True
        return all(dfs(i) for i in range(n))`),
      P('graphs','Pacific Atlantic Water Flow','Medium',false),
      P('graphs','Rotting Oranges','Medium',true),
      P('graphs','Walls and Gates','Medium',false),
      P('graphs','Max Area of Island','Medium',true),
      P('graphs','Surrounded Regions','Medium',false),
      P('graphs','Graph Valid Tree','Medium',false),
      P('graphs','Word Ladder','Hard',false),
      P('graphs','Number of Connected Components','Medium',false),
      P('graphs','Redundant Connection','Medium',false),
      P('graphs','Count Components','Medium',false),
    ],
    dp1:[
      P('dp1','Climbing Stairs','Easy',true,`
class Solution:
    def climbStairs(self, n):
        a, b = 1, 1
        for _ in range(n):
            a, b = b, a + b
        return a`),
      P('dp1','House Robber','Medium',true,`
class Solution:
    def rob(self, nums):
        prev, cur = 0, 0
        for x in nums:
            prev, cur = cur, max(cur, prev + x)
        return cur`),
      P('dp1','House Robber II','Medium',true),
      P('dp1','Coin Change','Medium',true,`
class Solution:
    def coinChange(self, coins, amount):
        dp = [0] + [float('inf')] * amount
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a: dp[a] = min(dp[a], dp[a-c] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1`),
      P('dp1','Longest Increasing Subsequence','Medium',false),
      P('dp1','Maximum Product Subarray','Medium',false),
      P('dp1','Word Break','Medium',false),
      P('dp1','Decode Ways','Medium',false),
      P('dp1','Partition Equal Subset Sum','Medium',false),
      P('dp1','Min Cost Climbing Stairs','Easy',true),
    ],
    dp2:[
      P('dp2','Unique Paths','Medium',true,`
class Solution:
    def uniquePaths(self, m, n):
        row = [1] * n
        for _ in range(m - 1):
            for j in range(1, n):
                row[j] += row[j-1]
        return row[-1]`),
      P('dp2','Longest Common Subsequence','Medium',true),
      P('dp2','Edit Distance','Hard',false),
      P('dp2','Coin Change II','Medium',false),
      P('dp2','Target Sum','Medium',false),
      P('dp2','Interleaving String','Medium',false),
      P('dp2','Best Time to Buy/Sell w/ Cooldown','Medium',false),
      P('dp2','Distinct Subsequences','Hard',false),
      P('dp2','Burst Balloons','Hard',false),
      P('dp2','Regular Expression Matching','Hard',false),
      P('dp2','Longest Palindromic Substring','Medium',true),
    ],
    greedy:[
      P('greedy','Maximum Subarray','Medium',true,`
class Solution:
    def maxSubArray(self, nums):
        best = cur = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            best = max(best, cur)
        return best`),
      P('greedy','Jump Game','Medium',true,`
class Solution:
    def canJump(self, nums):
        goal = len(nums) - 1
        for i in range(len(nums) - 1, -1, -1):
            if i + nums[i] >= goal: goal = i
        return goal == 0`),
      P('greedy','Jump Game II','Medium',false),
      P('greedy','Gas Station','Medium',true),
      P('greedy','Hand of Straights','Medium',false),
      P('greedy','Merge Triplets to Target','Medium',false),
      P('greedy','Partition Labels','Medium',false),
      P('greedy','Valid Parenthesis String','Medium',false),
    ],
    backtrack:[
      P('backtrack','Subsets','Medium',true,`
class Solution:
    def subsets(self, nums):
        res = []
        def bt(start, path):
            res.append(path[:])
            for i in range(start, len(nums)):
                path.append(nums[i])
                bt(i + 1, path)
                path.pop()
        bt(0, [])
        return res`),
      P('backtrack','Combination Sum','Medium',true),
      P('backtrack','Permutations','Medium',true,`
class Solution:
    def permute(self, nums):
        res = []
        def bt(path, rem):
            if not rem: res.append(path[:]); return
            for i in range(len(rem)):
                bt(path + [rem[i]], rem[:i] + rem[i+1:])
        bt([], nums)
        return res`),
      P('backtrack','Subsets II','Medium',false),
      P('backtrack','Word Search','Medium',false),
      P('backtrack','Palindrome Partitioning','Medium',false),
      P('backtrack','Letter Combinations of Phone','Medium',true),
      P('backtrack','N-Queens','Hard',false),
      P('backtrack','Combination Sum II','Medium',false),
    ],
    linked:[
      P('linked','Reverse Linked List','Easy',true,`
class Solution:
    def reverseList(self, head):
        prev = None
        while head:
            head.next, prev, head = prev, head, head.next
        return prev`),
      P('linked','Merge Two Sorted Lists','Easy',true),
      P('linked','Linked List Cycle','Easy',true,`
class Solution:
    def hasCycle(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast: return True
        return False`),
      P('linked','Reorder List','Medium',false),
      P('linked','Remove Nth Node From End','Medium',true),
      P('linked','Copy List with Random Pointer','Medium',false),
      P('linked','Add Two Numbers','Medium',true),
      P('linked','Find the Duplicate Number','Medium',false),
      P('linked','LRU Cache','Medium',false),
      P('linked','Merge K Sorted Lists','Hard',false),
      P('linked','Reverse Nodes in k-Group','Hard',false),
    ],
    heap:[
      P('heap','Kth Largest Element in Stream','Easy',true,`
class KthLargest:
    def __init__(self, k, nums):
        self.k = k
        self.heap = nums
        heapq.heapify(self.heap)
        while len(self.heap) > k: heapq.heappop(self.heap)
    def add(self, val):
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k: heapq.heappop(self.heap)
        return self.heap[0]`),
      P('heap','Last Stone Weight','Easy',true),
      P('heap','K Closest Points to Origin','Medium',true),
      P('heap','Kth Largest Element in Array','Medium',false),
      P('heap','Task Scheduler','Medium',false),
      P('heap','Design Twitter','Medium',false),
      P('heap','Find Median from Data Stream','Hard',false),
    ],
    tries:[
      P('tries','Implement Trie','Medium',true,`
class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

class Trie:
    def __init__(self): self.root = TrieNode()
    def insert(self, word):
        node = self.root
        for c in word:
            node = node.children.setdefault(c, TrieNode())
        node.end = True
    def search(self, word):
        node = self.root
        for c in word:
            if c not in node.children: return False
            node = node.children[c]
        return node.end`),
      P('tries','Design Add and Search Words','Medium',false),
      P('tries','Word Search II','Hard',false),
    ],
    advgraph:[
      P('advgraph','Network Delay Time','Medium',true),
      P('advgraph','Min Cost to Connect Points','Medium',false),
      P('advgraph','Cheapest Flights K Stops','Medium',false),
      P('advgraph','Reconstruct Itinerary','Hard',false),
      P('advgraph','Swim in Rising Water','Hard',false),
      P('advgraph','Alien Dictionary','Hard',false),
    ],
    intervals:[
      P('intervals','Merge Intervals','Medium',true,`
class Solution:
    def merge(self, intervals):
        intervals.sort()
        res = [intervals[0]]
        for s, e in intervals[1:]:
            if s <= res[-1][1]: res[-1][1] = max(res[-1][1], e)
            else: res.append([s, e])
        return res`),
      P('intervals','Insert Interval','Medium',true),
      P('intervals','Non-overlapping Intervals','Medium',false),
      P('intervals','Meeting Rooms','Easy',true),
      P('intervals','Meeting Rooms II','Medium',false),
      P('intervals','Minimum Interval to Include Query','Hard',false),
    ],
    mathgeo:[
      P('mathgeo','Rotate Image','Medium',true,`
class Solution:
    def rotate(self, matrix):
        matrix.reverse()
        for i in range(len(matrix)):
            for j in range(i):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]`),
      P('mathgeo','Spiral Matrix','Medium',false),
      P('mathgeo','Set Matrix Zeroes','Medium',true),
      P('mathgeo','Happy Number','Easy',true),
      P('mathgeo','Plus One','Easy',true),
      P('mathgeo','Pow(x, n)','Medium',false),
      P('mathgeo','Multiply Strings','Medium',false),
      P('mathgeo','Detect Squares','Medium',false),
    ],
    bit:[
      P('bit','Single Number','Easy',true,`
class Solution:
    def singleNumber(self, nums):
        res = 0
        for x in nums: res ^= x
        return res`),
      P('bit','Number of 1 Bits','Easy',true,`
class Solution:
    def hammingWeight(self, n):
        count = 0
        while n:
            n &= n - 1
            count += 1
        return count`),
      P('bit','Counting Bits','Easy',true),
      P('bit','Reverse Bits','Easy',false),
      P('bit','Missing Number','Easy',true),
      P('bit','Sum of Two Integers','Medium',false),
      P('bit','Reverse Integer','Medium',false),
    ],
  };

  // ---- owned creatures (instances) ----
  // {iid, sp:speciesId, level, exp, mega?}  exp = progress toward next level
  const OWNED = [
    { iid:'c1',  sp:'arcanine',  level:24, exp:5  },
    { iid:'c2',  sp:'gyarados',  level:21, exp:12 },
    { iid:'c3',  sp:'alakazam',  level:19, exp:3  },
    { iid:'c4',  sp:'bulbasaur', level:17, exp:9  },
    { iid:'c5',  sp:'gengar',    level:22, exp:7  },
    { iid:'c6',  sp:'dragonite', level:20, exp:15 },
    { iid:'c7',  sp:'pikachu',   level:12, exp:2  },
    { iid:'c8',  sp:'charmander',level:14, exp:6  },
    { iid:'c9',  sp:'squirtle',  level:11, exp:8  },
    { iid:'c10', sp:'caterpie',  level:9,  exp:1  },
    { iid:'c11', sp:'eevee',     level:7,  exp:4  },
    { iid:'c12', sp:'lapras',    level:13, exp:0  },
    { iid:'c13', sp:'geodude',   level:10, exp:5  },
    { iid:'c14', sp:'starmie',   level:16, exp:11 },
    { iid:'c15', sp:'rattata',   level:6,  exp:3  },
    { iid:'c16', sp:'snorlax',   level:15, exp:9  },
  ];
  const TEAM = ['c1','c2','c3','c4','c5','c6'];

  // ---- meadow zones (4, daily-seeded) ----
  const ZONES = [
    { id:'forest', name:'Viridian Forest', desc:'Lush green woodland', types:['normal','bug'],
      coinFloor:10, coinCeil:40,  shardChance:0.04, candyChance:0.0,  accent:'#a6cf78' },
    { id:'moon',   name:'Mt. Moon',        desc:'Crystal-lit caverns',  types:['rock','psychic'],
      coinFloor:25, coinCeil:80,  shardChance:0.06, candyChance:0.05, accent:'#b0a0d8' },
    { id:'seafoam',name:'Seafoam Islands',  desc:'Icy coastal grottos',  types:['water','ice'],
      coinFloor:50, coinCeil:120, shardChance:0.12, candyChance:0.0,  accent:'#a9dde0' },
    { id:'victory',name:'Victory Road',     desc:'Dark mountain pass',   types:['dragon','psychic'],
      coinFloor:100,coinCeil:250, shardChance:0.20, candyChance:0.03, accent:'#9aa0e0' },
  ];

  // ---- daily weather modifiers (buff one type 1.5x) ----
  const WEATHER = [
    { id:'sunny',  icon:'\u2600\ufe0f', name:'Sunny Day',  type:'fire',     note:'Fire types deal 1.5\u00d7 damage' },
    { id:'rain',   icon:'\u2614',       name:'Rain',       type:'water',    note:'Water types deal 1.5\u00d7 damage' },
    { id:'breeze', icon:'\ud83c\udf43', name:'Leaf Breeze', type:'grass',    note:'Grass types deal 1.5\u00d7 damage' },
    { id:'storm',  icon:'\u26a1',       name:'Thunderhead', type:'electric', note:'Electric types deal 1.5\u00d7 damage' },
    { id:'frost',  icon:'\u2744\ufe0f', name:'Cold Snap',   type:'ice',      note:'Ice types deal 1.5\u00d7 damage' },
    { id:'mist',   icon:'\ud83c\udf2b\ufe0f', name:'Psy Mist', type:'psychic', note:'Psychic types deal 1.5\u00d7 damage' },
  ];

  // ---- shop items (spend coins) ----
  const SHOP = [
    { id:'candy', name:'Rare Candy',  cost:200, kind:'candy_one',  amount:20,
      desc:'+20 EXP to one chosen Pok\u00e9mon. Your main upgrade lever.' },
    { id:'snack', name:'Team Snack',  cost:500, kind:'exp_all',    amount:5,
      desc:'+5 EXP to all 6 current team members.' },
    { id:'mega',  name:'Mega Stone', cost:1500, kind:'mega',
      desc:'Mega-Evolve OR Gigantamax one eligible Pok\u00e9mon \u2014 new form + big power boost.' },
  ];

  // deterministic daily seed -> {zone, weather, encounterSec}
  function daySeed(dateStr){
    let h=0; for(let i=0;i<dateStr.length;i++){ h=(h*31+dateStr.charCodeAt(i))>>>0; }
    const zone = ZONES[h % ZONES.length];
    const weather = WEATHER[(h>>3) % WEATHER.length];
    const encounterSec = 60 + ((h>>6) % 61); // 60..120
    return { zone, weather, encounterSec, seed:h };
  }

  // ---- streak commit grid: 18 weeks x 7 days, value 0..4 ----
  function genStreak(){
    const weeks=18, today=new Date('2026-06-03'); const cells=[];
    let rng=12345; const rnd=()=>{ rng=(rng*1103515245+12345)&0x7fffffff; return rng/0x7fffffff; };
    for(let w=0; w<weeks; w++){
      const col=[];
      for(let d=0; d<7; d++){
        const idxFromEnd = (weeks-1-w)*7 + (6-d);
        let v;
        if(idxFromEnd>118) v=0;
        else { const r=rnd(); v = r<0.30?0 : r<0.5?1 : r<0.72?2 : r<0.9?3 : 4; }
        if(idxFromEnd<3) v=Math.max(v,2); // recent active
        col.push(v);
      }
      cells.push(col);
    }
    return cells;
  }

  window.DATA = {
    SHARD_BY_DIFF, CATEGORIES, PROBLEMS, OWNED, TEAM,
    ZONES, WEATHER, SHOP, daySeed,
    STREAK: genStreak(),
    TRAINER: { name:'trainer001', title:'LeetCode Trainer', joined:'2026' },
    LEVEL_CAP: 50,
    expToNext: (level)=> level * 10,       // level 1->2 costs 10, 9->10 costs 90
    allProblems(){ return Object.values(PROBLEMS).flat(); },
  };
})();

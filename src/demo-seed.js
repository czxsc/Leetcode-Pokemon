/* =====================================================================
   Starting data for the online demo only: a few solved example problems
   (some rewards already claimed, some left to claim), one to-do, and
   Coins to spend in the Shop. Loaded on a visitor's first visit.
===================================================================== */
import { daysAgo } from './date-utils.js'

const EXAMPLES = [
  {
    title: 'Two Sum', difficulty: 'Easy', tags: ['arrays', 'hash-table'], language: 'python', days: 12, claimed: true,
    url: 'https://leetcode.com/problems/two-sum/',
    code: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}  # value -> index
        for i, num in enumerate(nums):
            if target - num in seen:
                return [seen[target - num], i]
            seen[num] = i
`,
  },
  {
    title: 'Valid Parentheses', difficulty: 'Easy', tags: ['stack', 'strings'], language: 'python', days: 9, claimed: true,
    url: 'https://leetcode.com/problems/valid-parentheses/',
    code: `class Solution:
    def isValid(self, s: str) -> bool:
        pairs = {")": "(", "]": "[", "}": "{"}
        stack = []
        for c in s:
            if c in pairs:
                if not stack or stack.pop() != pairs[c]:
                    return False
            else:
                stack.append(c)
        return not stack
`,
  },
  {
    title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', tags: ['arrays', 'sliding-window'], language: 'javascript',
    days: 6, claimed: true, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    code: `var maxProfit = function (prices) {
  let lowest = Infinity, best = 0;
  for (const price of prices) {
    lowest = Math.min(lowest, price);
    best = Math.max(best, price - lowest);
  }
  return best;
};
`,
  },
  {
    title: 'Number of Islands', difficulty: 'Medium', tags: ['graphs', 'dfs', 'bfs'], language: 'python', days: 3, claimed: true,
    url: 'https://leetcode.com/problems/number-of-islands/',
    code: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        rows, cols = len(grid), len(grid[0])

        def sink(r, c):
            if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1":
                grid[r][c] = "0"
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    sink(r + dr, c + dc)

        islands = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    islands += 1
                    sink(r, c)
        return islands
`,
  },
  {
    title: 'Climbing Stairs', difficulty: 'Easy', tags: ['dp', 'math'], language: 'java', days: 1, claimed: false,
    url: 'https://leetcode.com/problems/climbing-stairs/',
    code: `class Solution {
    public int climbStairs(int n) {
        int prev = 1, curr = 1; // ways to reach steps i-1 and i
        for (int i = 2; i <= n; i++) {
            int next = prev + curr;
            prev = curr;
            curr = next;
        }
        return curr;
    }
}
`,
  },
  {
    title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium',
    tags: ['sliding-window', 'hash-table', 'strings'], language: 'cpp', days: 0, claimed: false,
    url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    code: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> last;  // char -> last index seen
        int best = 0, left = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            if (last.count(s[right]) && last[s[right]] >= left) left = last[s[right]] + 1;
            last[s[right]] = right;
            best = max(best, right - left + 1);
        }
        return best;
    }
};
`,
  },
  {
    title: 'Merge Intervals', difficulty: 'Medium', tags: ['arrays', 'intervals', 'sorting'], language: 'python', days: 0,
    claimed: false, url: 'https://leetcode.com/problems/merge-intervals/', code: '',
  },
]

export function createDemoData() {
  const problems = EXAMPLES.map((ex, i) => {
    const date = daysAgo(ex.days)
    const solved = !!ex.code
    return {
      id: `demo-${i + 1}`, title: ex.title, difficulty: ex.difficulty, tags: ex.tags, language: ex.language,
      code: ex.code, url: ex.url, createdAt: `${date}T12:00:0${i}.000Z`,
      solvedAt: solved ? date : null, claimed: ex.claimed, claimedAt: ex.claimed ? date : null,
    }
  })
  return { progress: { coins: 2500 }, library: { problems, customTags: [] } }
}

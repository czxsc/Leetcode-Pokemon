class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        dict = defaultdict(int)
        for n in nums:
            dict[n] += 1
        d = sorted(dict.items(), key = lambda x : x[1], reverse=True)
        return [k for k, v in d[:k]]
        
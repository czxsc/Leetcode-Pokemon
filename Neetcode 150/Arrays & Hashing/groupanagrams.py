class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        d = defaultdict(list)
        for word in strs:
            w = "".join(sorted(word))
            d[w].append(word)
        
        return list(d.values())

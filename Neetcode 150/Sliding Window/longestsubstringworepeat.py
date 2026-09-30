class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        m = 0
        currrent = 0
        l = 0
        r = 1
        while r <= len(s):
            if len(s[l:r]) != len(set(s[l:r])): #string has duplicates
                l += 1
                current = r - l
                m = max(m, current)
            else:
                current = r - l
                m = max(m, current)
                r += 1

        return m
        
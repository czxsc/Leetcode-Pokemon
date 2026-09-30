#Solved UNOPTIMALLY
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        l = 0
        r = len(s1)
        s1 = sorted(s1)
        while r <= len(s2):
            if sorted(s2[l:r]) == s1:
                return True
            else:
                l += 1
                r += 1
        return False
        
class Solution:

    def encode(self, strs: List[str]) -> str:
        st = ""
        for s in strs:
            l = len(s)
            st += str(l) + "~" + s
        print(st)
        return st


    def decode(self, s: str) -> List[str]:
        i = 0
        lst = []
        while i < len(s):
            #first make a current length searcher
            ii = i
            while s[ii] != "~":
                ii += 1
            currentLength = int(s[i:ii])
            lst.append(s[ii+1:int(currentLength) + 1 + ii])
            i = ii + int(currentLength) + 1
        return lst

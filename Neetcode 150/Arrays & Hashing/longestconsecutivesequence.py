class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        if nums == []: return 0
        s = sorted(set(nums))
        print(s)
        counter = 1
        currentLongest = 1
        
        for i in range(1, len(s)):
            if (s[i - 1] == s[i] - 1):
                print(s[i], " is consecutive after ", s[i - 1])
                counter += 1
            else:
                currentLongest = max(counter, currentLongest)
                print(s[i], " is NOT consecutive after ", s[i - 1])
                print("currentLongest ", currentLongest, " counter ", counter)
                counter = 1

        return max(counter, currentLongest)


    # 1 2 3 8 9 10 11 12 13 20 21 22

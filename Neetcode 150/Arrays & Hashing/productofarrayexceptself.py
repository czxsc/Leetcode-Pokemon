class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        pre = [0] * n
        pre[0] = 1

        suf = [0] * n
        suf[n - 1] = 1

        final = [0] * n

        for i in range(1, n):
            pre[i] = pre[i - 1] * nums[i - 1]
        
        for i in range(n - 2, -1, -1): 
            #ex. length 4, iters through 3, 2, 1, 0
            suf[i] = suf[i + 1] * nums[i + 1]
        

        for i in range(n):
            final[i] = pre[i] * suf[i]

        return final

        
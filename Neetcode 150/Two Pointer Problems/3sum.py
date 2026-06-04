class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums = sorted(nums)
        finalList = []
        for i, n in enumerate(nums):
            if i > 0 and nums[i] == nums[i-1]:
                continue
            p1 = i + 1
            p2 = len(nums) - 1
            while p1 < p2:
                sum = nums[p1] + nums[p2] + n
                if sum < 0:
                    p1 += 1
                elif sum > 0:
                    p2 -= 1
                else:
                    finalList.append([n, nums[p1], nums[p2]])
                    p1 += 1
                    while nums[p1] == nums[p1 - 1] and p1 < p2:
                        p1 += 1
        return finalList
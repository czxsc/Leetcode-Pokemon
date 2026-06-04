class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        dict = {}
        for i, num in enumerate(nums):
            difference = target - num
            if difference in dict:
                return [dict[difference], i]
            else:
                dict[num] = i

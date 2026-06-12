#Iterative Method
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        l = 0
        r = len(nums) - 1
        while l <= r:
            pivot = l + ((r - l) // 2)

            if nums[pivot] < target:
                l = pivot + 1
            elif nums[pivot] > target:
                r = pivot - 1
            else:
                return pivot
            
        return -1
    
#Recursive Method
class Solution:
    def binary_search(self, l:int, r:int, nums:List[int], target):
        if l > r:
            return -1
        pivot = l + ((r - l) // 2)
        if nums[pivot] == target:
            return pivot
        elif nums[pivot] > target:
            return self.binary_search(l, pivot-1, nums, target)
        return self.binary_search(pivot+1, r, nums, target)
    def search(self, nums: List[int], target: int) -> int:
        return self.binary_search(0, len(nums)-1, nums, target)
        
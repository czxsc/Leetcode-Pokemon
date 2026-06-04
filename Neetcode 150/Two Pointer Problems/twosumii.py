#solution with two pointers (strategy where you start at opposite ends)

class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        l = 0
        r = len(numbers) - 1
        #[1, 3, 4, 7, 8, 9]   11
        while (numbers[l] + numbers[r]) != target:
            if (numbers[l] + numbers[r]) > target:
                r -= 1
            else:
                l += 1

        return [l+1, r+1]

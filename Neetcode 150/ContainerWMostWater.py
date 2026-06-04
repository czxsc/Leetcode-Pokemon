#Greedy + Opposite End Two Pointer Approach

class Solution:
    def maxArea(self, heights: List[int]) -> int:
        l = 0
        r = len(heights) - 1
        currentMax = min(heights[l], heights[r]) * (r - l)
        while l < r:
            if heights[l] < heights[r]:
                l += 1
                currentMax = max(currentMax, min(heights[l], heights[r]) * (r - l))
            else:
                r -= 1
                currentMax = max(currentMax, min(heights[l], heights[r]) * (r - l))



        return currentMax

            
            
        
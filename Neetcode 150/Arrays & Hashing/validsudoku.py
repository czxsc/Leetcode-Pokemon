class Solution:
    def isValidSudoku(self, board: List[List[str]]) -> bool:
        #horizontal rows
        for row in range(9):
            rowSet = set()
            for i in range(9):
                if board[row][i] in rowSet:
                    return False
                elif board[row][i] == ".":
                    continue
                else:
                    rowSet.add(board[row][i])
        
        for col in range(9):
            colSet = set()
            for i in range(9):
                if board[i][col] in colSet:
                    return False
                elif board[i][col] == ".":
                    continue
                else:
                    colSet.add(board[i][col])

        for square in range(9):
            sqSet = set()
            for i in range(3):
                for j in range(3):
                    row = (square // 3) * 3 + i
                    col =  (square % 3) * 3 + j
                    if board[row][col] == ".":
                        continue
                    elif board[row][col] in sqSet:
                        return False
                    else:
                        sqSet.add(board[row][col])
        return True


        
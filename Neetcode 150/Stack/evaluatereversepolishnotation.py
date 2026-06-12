class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []
        for t in tokens:
            print("iter ", t)
            print("Current stack: ", stack)
            if t.isdigit() or (t.startswith("-") and t[1:].isdigit()):
                stack.append(int(t))
                print("appended ", t)
            if t == "+":
                a = stack.pop()
                b = stack.pop()
                stack.append(a + b)
                print("a + b", a, " ", b, " ", a+b)
            if t == "-":
                b = stack.pop()
                a = stack.pop()
                stack.append(a - b)
                print("a - b", a, " ", b, " ", a-b)
            if t == "*":
                a = stack.pop()
                b = stack.pop()
                stack.append(a * b)
                print("a * b", a, " ", b, " ", a*b)
            if t == "/":
                b = stack.pop()
                a = stack.pop()
                stack.append(int(a / b))
                print("a / b", a, " ", b, " ", int(a / b))
            print()
        return stack.pop()

        
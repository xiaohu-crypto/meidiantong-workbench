import re
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\src\components\ui\LayoutFrame.tsx"
c = open(p, encoding="utf-8").read()
c = c.replace('  { id: "cockpit", name: "今日驾驶舱", icon: "📊", tabs: ["全局概览"] },\n', '')
open(p, "w", encoding="utf-8").write(c)
print("done")

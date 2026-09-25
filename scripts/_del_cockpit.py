import re
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\src\App.tsx"
c = open(p, encoding="utf-8").read()

# 1. 删 import Cockpit
c = c.replace('const Cockpit = lazy(() => import("./pages/Dashboard/Cockpit"));\n', '')

# 2. View 类型删 cockpit
c = c.replace('"cockpit" | ', '')

# 3. VIEW_KEYS 删 cockpit
c = c.replace('"cockpit", ', '')

# 4. 默认视图改 today
c = c.replace('useState<View>("cockpit")', 'useState<View>("today")')

# 5. 删 Cockpit 渲染块（多行）
c = re.sub(r'\s*\{view === "cockpit" \? \([^)]*?\) : null\}', '', c, flags=re.S)

open(p, "w", encoding="utf-8").write(c)
print("done")

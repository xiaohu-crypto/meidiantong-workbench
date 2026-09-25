p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\src\App.tsx"
lines = open(p, encoding="utf-8").readlines()
# 删 297-301 行（0-indexed: 296-300）
del lines[296:301]
open(p, "w", encoding="utf-8").writelines(lines)
print("deleted lines 297-301")

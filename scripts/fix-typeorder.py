"""修复Dev.tsx拖拽类型 + Kb.tsx notes声明顺序。"""
import io

# Dev.tsx: 拖拽处 stage 为 string（自定义阶段），断言为 Deal["stage"]
P1 = r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\Dev.tsx"
with io.open(P1, "r", encoding="utf-8-sig") as f:
    d = f.read()
old1 = 'void repos.deals.update(d.id, { stage, probability: probOf(stage) }, `拖拽商机「${d.title}」到 ${stage}`);'
new1 = 'void repos.deals.update(d.id, { stage: stage as Deal["stage"], probability: probOf(stage) }, `拖拽商机「${d.title}」到 ${stage}`);'
if old1 in d:
    d = d.replace(old1, new1, 1)
    print("Dev拖拽: 类型断言已加")
else:
    print("Dev拖拽: 未匹配")
with io.open(P1, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(d)

# Kb.tsx: 统计 useMemo 移到 notes 声明之后
P2 = r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\Kb.tsx"
with io.open(P2, "r", encoding="utf-8-sig") as f:
    k = f.read()
stat_block = (
    '  /* 知识库统计（融自知识库管理） */\n'
    '  const kbTotalChars = useMemo(() => notes.reduce((s, n) => s + (n.content ?? "").length, 0), [notes]);\n'
    '  const kbTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags ?? []))), [notes]);\n'
)
if stat_block in k:
    k = k.replace(stat_block, "", 1)
    # 插到 const sel = ... 之后
    anchor = '  const sel = notes.find((n) => n.id === selId) ?? null;\n'
    if anchor in k:
        k = k.replace(anchor, anchor + "\n" + stat_block, 1)
        print("Kb统计: 已移到notes之后")
    else:
        print("Kb统计: 锚点未匹配")
else:
    print("Kb统计块: 未找到")
with io.open(P2, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(k)
print("完成")

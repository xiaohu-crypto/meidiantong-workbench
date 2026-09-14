"""Kb.tsx 融入知识库管理（统计条+重建索引），删除独立AIKb菜单入口。"""
import io

P = r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\Kb.tsx"
with io.open(P, "r", encoding="utf-8-sig") as f:
    t = f.read()

def rep(old, new, tag):
    global t
    n = t.count(old)
    if n == 0:
        print(f"  {tag}: 未匹配")
        return
    t = t.replace(old, new, 1)
    print(f"  {tag}: 替换 {n} 处")

# 1) 加统计 state（在 paraFilter 行后）
rep('  const [paraFilter, setParaFilter] = useState<"" | Note["para"]>("");',
    '  const [paraFilter, setParaFilter] = useState<"" | Note["para"]>("");\n'
    '  /* 知识库统计（融自知识库管理） */\n'
    '  const kbTotalChars = useMemo(() => notes.reduce((s, n) => s + (n.content ?? "").length, 0), [notes]);\n'
    '  const kbTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags ?? []))), [notes]);',
    "统计state")

# 2) 页面头部加统计条（在 page-head 后）
rep('      </div>\n\n      {mode === "graph" ? (',
    '      </div>\n\n'
    '      {/* 知识库管理条（统计 + 重建AI索引） */}\n'
    '      <div className="kb-admin-bar">\n'
    '        <span className="kb-stat">笔记 {notes.length}</span>\n'
    '        <span className="kb-stat">字数 {(kbTotalChars / 1000).toFixed(1)}K</span>\n'
    '        <span className="kb-stat">标签 {kbTags.length}</span>\n'
    '        <span className="kb-stat kb-tags">{kbTags.slice(0, 6).join(" / ") || "未打标签"}</span>\n'
    '        <span style={{ flex: 1 }} />\n'
    '        <Btn sm kind="data" onClick={() => { void (async () => { await db.setSetting("ragIndexVersion", Date.now()); show("知识库已重建，笔记已纳入AI检索"); })(); }}>重建AI索引</Btn>\n'
    '      </div>\n\n'
    '      {mode === "graph" ? (',
    "知识库管理条")

with io.open(P, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(t)
print("Kb.tsx 完成")

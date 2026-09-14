import { useEffect, useRef, useState } from "react";
import { searchAll, type SearchDoc } from "../core/search";
import { IconSearch } from "./icons";

const TYPE_ORDER = ["客户", "联系人", "商机", "任务", "笔记"] as const;
const typeLabel: Record<string, string> = { 客户: "客户", 联系人: "联系人", 商机: "商机", 任务: "任务", 笔记: "笔记" };

export default function TopSearch(props: { onSelect: (doc: SearchDoc) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<(SearchDoc & { score: number })[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = searchAll(q);
    // 分组排序:客户→联系人→商机→任务→笔记,组内按相关度
    const order = (t: string) => { const i = TYPE_ORDER.indexOf(t as typeof TYPE_ORDER[number]); return i === -1 ? 9 : i; };
    r.sort((a, b) => order(a.type) - order(b.type));
    setResults(r);
    setActive(0);
  }, [q]);

  /* 任务4b: 计算每组数量 */
  const typeCounts = new Map<string, number>();
  for (const r of results) { typeCounts.set(r.type, (typeCounts.get(r.type) ?? 0) + 1); }

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(r: SearchDoc & { score: number }) {
    props.onSelect(r);
    setOpen(false);
    setQ("");
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); return; }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); const r = results[active]; if (r) pick(r); }
  }

  return (
    <div ref={boxRef} style={{ position: "relative", flex: 1, maxWidth: 340 }}>
      <div className="filter-input" style={{ maxWidth: "none" }}>
        <IconSearch size={14} />
        <input value={q} placeholder="搜索客户、商机、笔记…  ↑↓ 选择 · 回车打开"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey} />
      </div>
      {open && q ? (
        <div className="ts-pop" style={{ position: "absolute", top: 40, left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-md)", zIndex: 80, overflow: "hidden", maxHeight: 420, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "var(--ink-3)", fontSize: "var(--text-xs)" }}>无匹配结果</div>
          ) : results.map((r, idx) => {
            const prev = idx > 0 ? results[idx - 1] : null;
            const showGroup = !prev || prev.type !== r.type;
            return (
              <div key={r.type + r.id}>
                {showGroup ? (
                  <div style={{ padding: "6px 12px 2px", fontSize: 10, fontWeight: 700, color: "var(--ink-3)", letterSpacing: ".06em" }}>{typeLabel[r.type] ?? r.type} · {typeCounts.get(r.type) ?? 0}条</div>
                ) : null}
                <div
                  data-active={idx === active ? "1" : "0"}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", fontSize: "var(--text-sm)", background: idx === active ? "var(--surface-2)" : "transparent" }}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => pick(r)}>
                  <span className="chip data" style={{ fontSize: 10, padding: "0 6px" }}>{typeLabel[r.type] ?? r.type}</span>
                  <span style={{ fontWeight: 550 }}>{r.title}</span>
                  <span className="muted" style={{ marginLeft: "auto", fontSize: "var(--text-xs)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
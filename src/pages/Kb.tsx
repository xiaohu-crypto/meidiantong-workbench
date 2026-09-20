import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../db/db";
import type { Note } from "../types";
import { Btn, Chip, Field, uid, useToast } from "../ui/common";
import { IconPlus } from "../components/icons";

/** PARA 方法论分类显示映射(数据值保持英文,仅UI中文化) */
const PARA_LABELS: Record<string, string> = { Projects: "项目", Areas: "领域", Resources: "资源", Archives: "归档" };

interface Props { notes: Note[]; reload: () => Promise<void>; focusId?: string | null }

export default function Kb(props: Props) {
  const { show, node } = useToast();
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(props.focusId ?? props.notes[0]?.id ?? null);
  const [draft, setDraft] = useState<{ title: string; content: string; tags: string; para: Note["para"] } | null>(null);

  const [mode, setMode] = useState<"list" | "graph">("list");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQ, setAiQ] = useState("");
  const [aiA, setAiA] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [paraFilter, setParaFilter] = useState<"" | Note["para"]>("");
  const notes = props.notes.filter((n) => !n.deletedAt);
  const sel = notes.find((n) => n.id === selId) ?? null;

  /* 知识库统计（融自知识库管理） */
  const kbTotalChars = useMemo(() => notes.reduce((s, n) => s + (n.content ?? "").length, 0), [notes]);
  const kbTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags ?? []))), [notes]);

  useEffect(() => {
    if (props.focusId) { setSelId(props.focusId); setDraft(null); }
  }, [props.focusId]);

  const [draftDirty, setDraftDirty] = useState(false);
  /* 记录最近一次编辑,供切换笔记时立即落盘 */
  const draftRef = useRef<{ id: string; draft: { title: string; content: string; tags: string; para: Note["para"] } } | null>(null);
  useEffect(() => {
    draftRef.current = selId && draft ? { id: selId, draft } : null;
  }, [draft, selId]);

  /* 切换笔记:先落盘上一笔记未保存草稿,再载入新笔记(有草稿优先恢复) */
  useEffect(() => {
    if (draftRef.current && draftRef.current.id !== selId) {
      void db.setSetting("kbDraft:" + draftRef.current.id, draftRef.current.draft);
    }
    const n = notes.find((x) => x.id === selId) ?? null;
    if (!n) { setDraft(null); setDraftDirty(false); return; }
    setDraft({ title: n.title, content: n.content, tags: n.tags.join(", "), para: n.para });
    setDraftDirty(false);
    let alive = true;
    void (async () => {
      const saved = await db.getSetting<{ title: string; content: string; tags: string; para: Note["para"] } | null>("kbDraft:" + n.id, null);
      if (alive && saved) { setDraft(saved); setDraftDirty(false); }
    })();
    return () => { alive = false; };
  }, [selId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 草稿自动保存:内容变更 800ms 后写入 settings,防切换/关闭丢失 */
  useEffect(() => {
    if (!selId || !draft) return;
    setDraftDirty(true);
    const t = window.setTimeout(() => {
      void db.setSetting("kbDraft:" + selId, draft);
      setDraftDirty(false);
    }, 800);
    return () => window.clearTimeout(t);
  }, [draft, selId]);

  const backlinks = useMemo(() => {
    if (!sel) return [];
    return notes.filter((n) => n.id !== sel.id && n.content.includes(`[[${sel.title}]]`));
  }, [sel, notes]);

  const outbound = useMemo(() => {
    if (!sel) return [];
    const titles = notes.map((n) => n.title);
    return titles.filter((t) => t !== sel.title && sel.content.includes(`[[${t}]]`));
  }, [sel, notes]);

async function askAi() {
  if (!aiQ.trim() || !window.mta?.chatStream) return;
  setAiBusy(true); setAiA("");
  try {
    const { getActiveAi } = await import("../core/ai/client");
    const active = await getActiveAi();
    const key = active.key;
    if (!key) { setAiA("未配置 API Key"); setAiBusy(false); return; }
    const ctx = props.notes.filter((n) => !n.deletedAt).slice(0, 20).map((n) => "【" + n.title + "】\n" + n.content.slice(0, 800)).join("\n\n");
    window.mta.onStreamChunk((chunk) => setAiA((prev) => prev + chunk));
    window.mta.onStreamDone(() => setAiBusy(false));
    window.mta.onStreamError((err) => { setAiA("调用失败:" + err); setAiBusy(false); });
    await window.mta.chatStream({
      baseUrl: active.baseUrl, apiKey: key, model: active.model,
      messages: [
        { role: "system", content: "你是知识库助手。基于以下笔记内容回答用户问题,引用来源笔记标题。若笔记中没有相关信息,直接说未找到。\n\n知识库:\n" + ctx },
        { role: "user", content: aiQ },
      ],
    });
  } catch (e) { setAiA("错误:" + String(e)); setAiBusy(false); }
}

  function openNew() {
    const n: Note = { id: uid("n"), title: "未命名笔记", content: "", tags: [], para: "Resources", versions: [] };
    void (async () => { await db.put("notes", n, "新建笔记"); await props.reload(); setSelId(n.id); })();
  }

  async function save() {
    if (!sel || !draft) return;
    const versions = sel.content !== draft.content ? [...sel.versions, { ts: Date.now(), content: sel.content }] : sel.versions;
    await db.put("notes", {
      ...sel, title: draft.title.trim() || "未命名笔记", content: draft.content,
      tags: draft.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean), para: draft.para, versions,
    }, `保存笔记「${draft.title}」${versions.length > sel.versions.length ? "(旧版入历史)" : ""}`);
    show("已保存" + (versions.length > (sel.versions?.length ?? 0) ? ",旧版本入历史" : ""));
    await props.reload();
  }

  async function remove() {
    if (!sel) return;
    await db.softDelete("notes", sel.id, `删除笔记「${sel.title}」`);
    setSelId(null);
    await props.reload();
  }

  const filtered = notes.filter((n) => (paraFilter === "" || n.para === paraFilter) && (q === "" || n.title.includes(q) || n.content.includes(q) || n.tags.some((t) => t.includes(q))));

  return (
    <div>
      <div className="page-head">
        <div><h1>知识库</h1><div className="date">PARA 归档 · 双链 [[]] · 版本历史 · 标签检索</div></div>
        <div className="actions">
          <Btn kind={mode === "graph" ? "data" : "ghost"} onClick={() => setMode(mode === "graph" ? "list" : "graph")}>{mode === "graph" ? "列表视图" : "知识图谱"}</Btn>
          <Btn kind="ghost" onClick={() => { const url = prompt("粘贴网页链接或标题:"); if (url) { void (async () => { const n: Note = { id: uid("n"), title: url.slice(0, 40), content: "来源:" + url + "\n\n", tags: ["外链"], para: "Resources", versions: [] }; await db.put("notes", n, "导入网页笔记"); await props.reload(); setSelId(n.id); })(); } }}>网页剪藏</Btn>
          <Btn kind="data" onClick={() => setAiOpen(true)}>AI 问答</Btn>
          <Btn kind="primary" onClick={openNew}><IconPlus size={14} /> 新建笔记</Btn>
        </div>
      </div>

      {/* 知识库管理条（统计 + 重建AI索引） */}
      <div className="kb-admin-bar">
        <span className="kb-stat">笔记 {notes.length}</span>
        <span className="kb-stat">字数 {(kbTotalChars / 1000).toFixed(1)}K</span>
        <span className="kb-stat">标签 {kbTags.length}</span>
        <span className="kb-stat kb-tags">{kbTags.slice(0, 6).join(" / ") || "未打标签"}</span>
        <span style={{ flex: 1 }} />
        <Btn sm kind="data" onClick={() => { void (async () => { await db.setSetting("ragIndexVersion", Date.now()); show("知识库已重建，笔记已纳入AI检索"); })(); }}>重建AI索引</Btn>
      </div>

      {mode === "graph" ? (
        <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
          <div className="h-row"><span className="h-title sm">知识图谱</span><span className="chip data" style={{ marginLeft: "auto" }}>节点 = 笔记 · 连线 = [[双链]] · 点击打开</span></div>
          <svg viewBox="0 0 800 400" style={{ width: "100%", height: 360 }}>
            {(() => {
              const list = notes;
              const cx = 400, cy = 200, r = 150;
              const pos = list.map((n, i) => {
                const ang = (i / Math.max(list.length, 1)) * Math.PI * 2 - Math.PI / 2;
                return { id: n.id, title: n.title, x: cx + r * Math.cos(ang), y: cy + r * 0.85 * Math.sin(ang) };
              });
              const byTitle = new Map(list.map((n) => [n.title, n.id]));
              const edges: { a: number; b: number }[] = [];
              for (const n of list) {
                const re = /\[\[([^\]]+)\]\]/g; let m;
                while ((m = re.exec(n.content))) {
                  const tid = byTitle.get(m[1]);
                  if (tid && tid !== n.id) edges.push({ a: pos.findIndex((p) => p.id === n.id), b: pos.findIndex((p) => p.id === tid) });
                }
              }
              return (
                <>
                  {edges.map((e, i) => <line key={i} x1={pos[e.a].x} y1={pos[e.a].y} x2={pos[e.b].x} y2={pos[e.b].y} stroke="var(--border)" strokeWidth="1.2" />)}
                  {pos.map((p) => (
                    <g key={p.id} style={{ cursor: "pointer" }} onClick={() => { setSelId(p.id); setMode("list"); }}>
                      <circle cx={p.x} cy={p.y} r="7" fill="var(--data)" />
                      <text x={p.x} y={p.y - 12} textAnchor="middle" style={{ fontSize: 11, fill: "var(--ink-2)" }}>{p.title.slice(0, 8)}</text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      ) : null}      <div className="grid-c" style={{ gridTemplateColumns: "300px minmax(0,1fr)" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="toolbar-row" style={{ padding: "12px 12px 4px", marginBottom: 0 }}>
            <div className="filter-input" style={{ maxWidth: "none" }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索标题/内容/标签…" />
            </div>
          </div>
          <div style={{ padding: "6px 10px 0", display: "flex", gap: 3, flexWrap: "nowrap" }}>
            {(["", "Projects", "Areas", "Resources", "Archives"] as const).map((p) => (
              <button key={p || "all"} onClick={() => setParaFilter(p)}
                style={{ padding: "2px 8px", fontSize: 11, borderRadius: 999, border: "1px solid var(--border)",
                  background: paraFilter === p ? "var(--brand)" : "transparent", color: paraFilter === p ? "#fff" : "var(--ink-2)", cursor: "pointer" }}>
                {p === "" ? "全部" : PARA_LABELS[p] ?? p}
              </button>
            ))}
          </div>
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {filtered.map((n) => (
              <div key={n.id} onClick={() => { setSelId(n.id); setDraft(null); }}
                style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border-soft)", background: n.id === selId ? "var(--brand-soft)" : "transparent" }}>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{n.title}</div>
                <div className="cell-sub">{PARA_LABELS[n.para] ?? n.para} · {n.tags.map((t) => "#" + t).join(" ")}</div>
              </div>
            ))}
            {notes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>暂无笔记</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: 12 }}>创建第一篇笔记，构建你的知识库</div>
                <Btn kind="primary" sm onClick={openNew}><IconPlus size={12} /> 新建笔记</Btn>
              </div>
            ) : filtered.length === 0 ? <p className="muted" style={{ padding: 16 }}>无匹配笔记</p> : null}
          </div>
        </div>

        <div className="card card-pad">
          {sel && draft ? (
            <>
              <div className="h-row" style={{ marginBottom: 8 }}>
                <input className="inp" style={{ flex: 1, fontWeight: 650, fontSize: "var(--text-lg)" }} value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <span className="cell-sub" style={{ marginRight: 4 }}>{draftDirty ? "编辑中…" : "已自动保存"}</span>
                {draftDirty ? <Btn kind="primary" onClick={() => { void save(); }}>保存</Btn> : null}
                <Btn kind="done" onClick={() => { void remove(); }}>删除</Btn>
              </div>
              <div className="h-row" style={{ marginBottom: 8 }}>
                <select className="sel" value={draft.para} onChange={(e) => setDraft({ ...draft, para: e.target.value as Note["para"] })}>
                  {["Projects", "Areas", "Resources", "Archives"].map((p) => <option key={p} value={p}>{PARA_LABELS[p] ?? p}</option>)}
                </select>
                <input className="inp" style={{ flex: 1 }} value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="标签,逗号分隔" />
              </div>
              <textarea className="inp" style={{ width: "100%", minHeight: 260, lineHeight: 1.7 }}
                value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="支持 [[笔记标题]] 双链语法" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                <div>
                  <div className="dsec" style={{ padding: 0 }}>双链引用此笔记({backlinks.length})</div>
                  {backlinks.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)", padding: "4px 0" }}>暂无双链引用</p> : backlinks.map((n) => <div className="mini-row" key={n.id}><span className="ev" style={{ cursor: "pointer" }} onClick={() => setSelId(n.id)}>{n.title}</span></div>)}
                  <div className="dsec" style={{ padding: "10px 0 0" }}>此笔记引用({outbound.length})</div>
                  {outbound.map((t) => {
                    const target = notes.find((n) => n.title === t);
                    return <div className="mini-row" key={t}><span className="ev" style={{ cursor: "pointer" }} onClick={() => target && setSelId(target.id)}>{t}</span></div>;
                  })}
                </div>
                <div>
                  <div className="dsec" style={{ padding: 0 }}>版本历史</div>
                  <div style={{ maxHeight: 180, overflowY: "auto" }}>
                    {sel.versions.slice().reverse().map((v) => (
                      <div className="mini-row" key={v.ts}>
                        <time>{new Date(v.ts).toLocaleString("zh-CN")}</time>
                        <Btn kind="done" sm onClick={() => { setDraft({ ...draft, content: v.content }); show("已载入该版本到编辑器,保存后生效"); }}>载入</Btn>
                      </div>
                    ))}
                    {sel.versions.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)" }}>保存后自动留档旧版本</p> : null}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {sel.tags.map((t) => <Chip key={t} kind="data">#{t}</Chip>)}
              </div>
            </>
          ) : (
            <div className="ph"><div><div className="big">N</div><h2 style={{ fontSize: "var(--text-xl)", fontWeight: 650 }}>选择或新建一条笔记</h2><p>支持 [[双链]]、PARA 归档、标签与版本历史。</p></div></div>
          )}

          {node}
      {aiOpen ? (
        <div className="drawer-mask open" onClick={() => setAiOpen(false)} />
      ) : null}
      {aiOpen ? (
        <div className="drawer open" style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 480, zIndex: 100, background: "var(--surface)", boxShadow: "var(--shadow-md)" }}>
          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="h-row"><span className="h-title sm">AI 知识库问答</span><button className="icon-btn" onClick={() => setAiOpen(false)}>×</button></div>
          </div>
          <div style={{ padding: 16, overflowY: "auto", height: "calc(100% - 140px)" }}>
            {aiA ? <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{aiA}</div> : <p className="muted">基于本地笔记内容回答,已脱敏路由。</p>}
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <input className="inp" style={{ flex: 1 }} placeholder="问点什么…" value={aiQ} onChange={(e) => setAiQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void askAi(); }} />
            <button className="btn primary" disabled={aiBusy || !aiQ.trim()} onClick={() => { void askAi(); }}>{aiBusy ? "思考中…" : "提问"}</button>
          </div>
        </div>
      ) : null}
          <Field label=""><span /></Field>
        </div>
      </div>
    </div>
  );
}

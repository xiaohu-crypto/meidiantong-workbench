import { useState, useMemo } from "react";
import type { Task, Deal, ContactPoint, Note, Payment } from "../types";
import { Btn, Chip, money, uid, useToast } from "../ui/common";
import { db } from "../db/db";

interface Props {
  tasks: Task[];
  payments: Payment[];
  deals: Deal[];
  cps: ContactPoint[];
  notes: Note[];
  reload: () => Promise<void>;
  onNavigate: (view: string) => void;
}

const STAGE_PCT: Record<string, number> = {
  "线索": 10, "MQL": 20, "SQL": 35, "商机": 50, "报价": 65, "谈判": 80, "签约": 100,
};

const TEMPLATES: Record<string, string> = {
  "写日报": "【工作日报】\n日期：\n\n一、今日完成\n1.\n2.\n\n二、明日计划\n1.\n2.\n\n三、需要支持\n",
  "写周报": "【工作周报】\n\n一、本周总结\n1.\n2.\n\n二、关键数据\n- 新增客户：\n- 在途商机：\n- 回款：\n\n三、下周计划\n1.\n2.\n",
};

export default function Growth({ tasks, payments, deals, cps, notes, reload, onNavigate }: Props) {
  const toast = useToast();
  const [editor, setEditor] = useState<{ type: string; template: string } | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorBody, setEditorBody] = useState("");

  /* 今日待办：未完成任务，按到期排序 */
  const openTasks = useMemo(
    () => tasks.filter((t) => !t.deletedAt && t.kanbanCol !== "完成").sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999")).slice(0, 6),
    [tasks]
  );
  /* 今日到期：7天内到期的未收回款 */
  const dueSoon = useMemo(
    () => payments.filter((p) => !p.deletedAt && p.status !== "已收" && (() => {
      const diff = (new Date(p.dueDate).getTime() - Date.now()) / 86400000;
      return diff <= 7 && diff > -30;
    })()),
    [payments]
  );
  /* 在途商机 */
  const activeDeals = useMemo(
    () => deals.filter((d) => !d.deletedAt && !["输单", "流失", "签约"].includes(d.stage)).slice(0, 5),
    [deals]
  );
  /* 最近跟进 */
  const recentCps = useMemo(
    () => [...cps].filter((c) => !c.deletedAt).sort((a, b) => b.time - a.time).slice(0, 5),
    [cps]
  );
  /* 最近笔记 */
  const recentNotes = useMemo(
    () => [...notes].filter((n) => !n.deletedAt).sort((a, b) => (b.versions.at(-1)?.ts ?? 0) - (a.versions.at(-1)?.ts ?? 0)).slice(0, 5),
    [notes]
  );

  async function toggleTask(t: Task) {
    const done = t.kanbanCol === "完成";
    await db.put<Task>("tasks", { ...t, kanbanCol: done ? "待办" : "完成" }, done ? "恢复任务" : "完成任务");
    await reload();
  }

  function openEditor(type: string) {
    setEditor({ type, template: TEMPLATES[type] ?? "" });
    setEditorTitle(type === "写日报" ? `工作日报 ${new Date().toISOString().slice(0, 10)}` : "工作周报");
    setEditorBody(TEMPLATES[type] ?? "");
  }

  async function saveNote() {
    if (!editor || !editorBody.trim()) { toast.show("内容为空"); return; }
    await db.put<Note>("notes", {
      id: uid("note"), title: editorTitle || "未命名笔记", content: editorBody,
      tags: [editor.type === "写日报" ? "日报" : "周报"], para: "Projects",
      versions: [{ ts: Date.now(), content: editorBody }],
    }, "新建笔记");
    toast.show("已保存到知识库");
    setEditor(null);
    await reload();
  }

  const todayStr = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
          {todayStr} · {openTasks.length} 项待办 · {dueSoon.length} 笔到期回款 · {activeDeals.length} 个在途商机
        </div>
        <Btn kind="primary" sm onClick={() => onNavigate("work")}>＋ 快速创建任务</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 14 }}>
        {/* 左栏：待办 + 到期回款 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>今日待办</div>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{openTasks.length} 项待完成</span>
            </div>
            {openTasks.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>🎉 全部完成</div> :
              openTasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <input type="checkbox" checked={false} onChange={() => void toggleTask(t)} style={{ accentColor: "var(--brand-primary)", cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.due ? `到期 ${t.due}` : "无截止日"} · {t.priority}优先级</div>
                  </div>
                </div>
              ))}
          </div>

          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>近期到期回款</div>
              <Btn kind="ghost" sm onClick={() => onNavigate("dev")}>去合同台账</Btn>
            </div>
            {dueSoon.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>近期无到期回款</div> :
              dueSoon.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.status === "逾期" ? "var(--status-danger)" : "var(--text-primary)" }}>{money(p.amount)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>到期 {p.dueDate}</div>
                  </div>
                  <Chip kind={p.status === "逾期" ? "danger" : "warn"}>{p.status}</Chip>
                </div>
              ))}
          </div>
        </div>

        {/* 中栏：在途商机 + 最近跟进 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>在途商机进度</div>
              <Btn kind="ghost" sm onClick={() => onNavigate("crm")}>全部商机</Btn>
            </div>
            {activeDeals.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>暂无在途商机</div> :
              activeDeals.map((d) => {
                const pct = STAGE_PCT[d.stage] ?? 20;
                return (
                  <div key={d.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ color: "var(--text-primary)" }}>{d.title} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {d.stage}</span></span>
                      <span style={{ color: "var(--text-secondary)" }}>{money(d.value)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--bg-muted)", overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: "var(--brand-primary)", borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
          </div>

          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>最近跟进记录</div>
            {recentCps.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>暂无跟进记录</div> :
              recentCps.map((cp) => (
                <div key={cp.id} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <Chip kind="brand">{cp.channel}</Chip>
                  <div style={{ flex: 1, fontSize: 11, color: "var(--text-secondary)" }}>{cp.summary}</div>
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{new Date(cp.time).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span>
                </div>
              ))}
          </div>
        </div>

        {/* 右栏：快速录入 + 最近笔记 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>快速录入</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.keys(TEMPLATES).map((label) => (
                <button key={label} onClick={() => openEditor(label)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--bg-app)", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 16 }}>{label === "写日报" ? "📝" : "📊"}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-primary)" }}>{label}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{label === "写日报" ? "今日完成·明日计划" : "本周总结·下周计划"}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>最近笔记</div>
              <Btn kind="ghost" sm onClick={() => onNavigate("kb")}>知识库</Btn>
            </div>
            {recentNotes.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>暂无笔记</div> :
              recentNotes.map((n) => (
                <div key={n.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}
                  onClick={() => onNavigate("kb")}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{n.title}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{n.tags.join(" · ")}</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editor && (
        <div onClick={() => setEditor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 24, width: 560, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)" }}>{editor.type}</div>
              <button onClick={() => setEditor(null)} style={{ border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>
            <input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} placeholder="标题"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-subtle)", marginBottom: 10, fontSize: 13, background: "var(--bg-app)" }} />
            <textarea rows={12} value={editorBody} onChange={(e) => setEditorBody(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-subtle)", fontSize: 12, background: "var(--bg-app)", resize: "vertical", fontFamily: "ui-monospace,monospace", lineHeight: 1.6 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <Btn kind="ghost" sm onClick={() => setEditor(null)}>取消</Btn>
              <Btn kind="primary" sm onClick={() => void saveNote()}>保存到知识库</Btn>
            </div>
          </div>
        </div>
      )}
      {toast.node}
    </div>
  );
}

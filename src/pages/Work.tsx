import { useState } from "react";
import { db } from "../db/db";
import type { Customer, KanbanCol, Objective, Task } from "../types";
import { Btn, Chip, Modal, Field, uid, useToast } from "../ui/common";
import { IconPlus } from "../components/icons";

const COLS: KanbanCol[] = ["待办", "进行中", "待审核", "完成"];
const WIP_LIMIT = 5;

interface Props {
  tasks: Task[]; objectives: Objective[]; customers: Customer[];
  reload: () => Promise<void>;
  goCrm?: (customerId: string) => void;
}

export default function Work(props: Props) {
  const { show, node } = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<KanbanCol | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [eform, setEform] = useState<{ title: string; priority: Task["priority"]; due: string; customerId: string; kanbanCol: KanbanCol }>({ title: "", priority: "中", due: "", customerId: "", kanbanCol: "待办" });

  function openEdit(t: Task) {
    setEditId(t.id);
    setEform({ title: t.title, priority: t.priority, due: t.due ?? "", customerId: t.customerId ?? "", kanbanCol: t.kanbanCol });
  }

  async function submitEdit() {
    if (!editId || !eform.title.trim()) { show("任务标题必填"); return; }
    const t0 = tasks.find((x) => x.id === editId);
    if (!t0) return;
    await db.put("tasks", { ...t0, title: eform.title.trim(), priority: eform.priority, due: eform.due || undefined, customerId: eform.customerId || undefined, kanbanCol: eform.kanbanCol }, "编辑任务");
    show("任务已更新");
    setEditId(null);
    await props.reload();
  }

  async function removeTask() {
    if (!editId) return;
    const t0 = tasks.find((x) => x.id === editId);
    if (!t0) return;
    await db.softDelete("tasks", editId, "删除任务「" + t0.title + "」");
    const deleted = t0;
    show("任务已删除", async () => {
      await db.put("tasks", { ...deleted, deletedAt: undefined }, "撤销删除");
      await props.reload();
    });
    setEditId(null);
    await props.reload();
  }
  const [form, setForm] = useState<{ title: string; priority: Task["priority"]; type: Task["type"]; due: string; customerId: string }>({ title: "", priority: "中", type: "任务", due: "", customerId: "" });
  const [viewMode, setViewMode] = useState<"board" | "table" | "calendar">("board");

  const tasks = props.tasks.filter((t) => !t.deletedAt);
  const wip = tasks.filter((t) => t.kanbanCol === "进行中").length;
  const obj = props.objectives[0];

  /* P3 AI 智能聚合(纯本地计算,不调云端) */
  const nameOfCust = (id: string) => props.customers.find((c) => c.id === id)?.name ?? "未知客户";
  const groupedByCust = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.customerId) continue;
    if (!groupedByCust.has(t.customerId)) groupedByCust.set(t.customerId, []);
    groupedByCust.get(t.customerId)!.push(t);
  }
  const focusCustomers = [...groupedByCust.entries()].map(([cid, ts]) => {
    const high = ts.filter((t) => t.priority === "高").length;
    const nearest = ts.filter((t) => t.kanbanCol !== "完成" && t.due).sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))[0] ?? null;
    return { cid, total: ts.length, high, nearest };
  }).sort((a, b) => b.high - a.high || (a.nearest?.due ?? "9999").localeCompare(b.nearest?.due ?? "9999")).slice(0, 5);
  const highTodos = tasks.filter((t) => t.priority === "高" && t.kanbanCol !== "完成").slice(0, 5);
  const nowDate = new Date();
  const dow = (nowDate.getDay() + 6) % 7; // 周一为 0
  const monday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - dow);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const iso = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const highTodoIds = new Set(highTodos.map((t) => t.id));
  const weekTasks = tasks
    .filter((t) => t.kanbanCol !== "完成" && t.due && t.due >= iso(monday) && t.due <= iso(sunday) && !highTodoIds.has(t.id))
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? "")).slice(0, 5);

  async function drop(col: KanbanCol) {
    setOver(null);
    if (!dragId) return;
    const t = tasks.find((x) => x.id === dragId);
    if (!t || t.kanbanCol === col) return;
    await db.put("tasks", { ...t, kanbanCol: col }, `任务「${t.title}」移动到 ${col}`);
    setDragId(null);
    await props.reload();
  }

  async function submitAdd() {
    if (!form.title.trim()) { show("任务标题必填"); return; }
    await db.put("tasks", { id: uid("t"), title: form.title.trim(), type: form.type, priority: form.priority, due: form.due || undefined, kanbanCol: "待办", customerId: form.customerId || undefined }, "新建任务");
    show("任务已创建(待办)");
    setAddOpen(false);
    setForm({ title: "", priority: "中", type: "任务", due: "", customerId: "" });
    await props.reload();
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>任务看板</h1><div className="date">看板四列 · 拖拽流转 · 进行中 WIP 上限 {WIP_LIMIT}(当前 {wip})</div></div>
        <div className="actions">
          <div style={{ display: "inline-flex", gap: 4, marginRight: 8 }}>
            {([["board", "看板"], ["table", "表格"], ["calendar", "日历"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setViewMode(k)}
                style={{ padding: "5px 12px", fontSize: 12, borderRadius: 6, border: "1px solid var(--border)",
                  background: viewMode === k ? "var(--brand)" : "transparent", color: viewMode === k ? "#fff" : "var(--ink-2)", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <Btn kind="primary" onClick={() => setAddOpen(true)}><IconPlus size={14} /> 新建任务</Btn>
        </div>
      </div>

      {obj ? (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="h-row"><span className="h-title sm">{obj.quarter} · {obj.title}</span><Chip kind="data">OKR 只读</Chip></div>
          {obj.keyResults.map((kr) => (
            <div key={kr.name} className="progress">
              <div className="pl"><span>{kr.name}</span><b className="num">{kr.progress}%</b></div>
              <div className="bar-track"><div className="bar-fill" style={{ width: kr.progress + "%", background: kr.name.includes("回款") && kr.progress < 90 ? "var(--warning)" : "var(--success)" }} /></div>
            </div>
          ))}
        </div>
      ) : null}

      { /* P3 AI 智能聚合卡片:近期关注客户 / 高优先级待办 / 本周截止 */ }
      <div className="card card-pad ai-aggregate" style={{ marginBottom: 16 }}>
        <div className="h-row" style={{ marginBottom: 10 }}>
          <span className="h-title sm">AI 智能聚合</span>
          <Chip kind="data">本地计算</Chip>
        </div>
        <div className="ai-agg-grid">
          <div className="ai-agg-col">
            <div className="ai-agg-head"><Chip kind="brand">近期关注客户</Chip></div>
            {focusCustomers.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)" }}>暂无关联客户的任务</p> : focusCustomers.map((g) => (
              <div key={g.cid} className="ai-agg-row" style={{ cursor: props.goCrm ? "pointer" : "default" }} onClick={() => props.goCrm?.(g.cid)}>
                <span className="ai-agg-name">{nameOfCust(g.cid)}</span>
                <Chip kind="gray">{g.total} 任务</Chip>
                {g.high > 0 ? <Chip kind="danger">高 {g.high}</Chip> : null}
                {g.nearest ? <span className="cell-sub">最近截止:{g.nearest.title} · {g.nearest.due}</span> : null}
              </div>
            ))}
          </div>
          <div className="ai-agg-col">
            <div className="ai-agg-head"><Chip kind="danger">高优先级待办</Chip></div>
            {highTodos.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)" }}>暂无高优先级未完成任务</p> : highTodos.map((t) => (
              <div key={t.id} className="ai-agg-row" onClick={() => openEdit(t)} style={{ cursor: "pointer" }}>
                <span className="ai-agg-name">{t.title}</span>
                {t.due ? <span className="cell-sub">截止 {t.due}</span> : null}
              </div>
            ))}
          </div>
          <div className="ai-agg-col">
            <div className="ai-agg-head"><Chip kind="warn">本周截止</Chip></div>
            {weekTasks.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)" }}>本周暂无到期任务</p> : weekTasks.map((t) => (
              <div key={t.id} className="ai-agg-row" onClick={() => openEdit(t)} style={{ cursor: "pointer" }}>
                <span className="ai-agg-name">{t.title}</span>
                <span className="cell-sub">{t.due}{t.customerId ? " · " + nameOfCust(t.customerId) : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {viewMode === "board" && (
      <div className="kanban">
        {COLS.map((col) => {
          const colTasks = tasks.filter((t) => t.kanbanCol === col);
          const isOverLimit = col === "进行中" && colTasks.length > WIP_LIMIT;
          return (
            <div className="kcol" key={col}
              onDragOver={(e) => { e.preventDefault(); setOver(col); }}
              onDragLeave={() => setOver((c) => (c === col ? null : c))}
              onDrop={() => { void drop(col); }}
              style={over === col ? { borderColor: "var(--data)" } : undefined}>
              <div className="kcol-head" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {col}
                <span className={"chip " + (isOverLimit ? "danger" : "gray")} style={{ marginLeft: "auto" }} title={isOverLimit ? "超过 WIP 上限,先完成再领取新任务" : undefined}>{colTasks.length}</span>
              </div>
              <div className="kcol-body">
                {colTasks.map((t) => (
                  <div className="kcard" key={t.id} draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)} onClick={() => openEdit(t)} title="点击编辑,拖拽流转" style={{ cursor: "pointer" }}>
                    <div className="t">{t.title}</div>
                    <div className="m">
                      <Chip kind={t.priority === "高" ? "danger" : t.priority === "中" ? "warn" : "gray"}>{t.priority}</Chip>
                      <Chip gray>{t.type}</Chip>
                      {t.due ? <span className="cell-sub num">截止 {t.due}</span> : null}
                      {t.amount ? <span className="cell-sub num">¥{t.amount}</span> : null}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 8px" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
                    <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 2, fontSize: "var(--text-sm)" }}>暂无任务</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: 10 }}>拖拽卡片到这里，或新建任务</div>
                    <Btn kind="primary" sm onClick={() => setAddOpen(true)}>新建任务</Btn>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {viewMode === "table" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tgrid">
            <thead><tr><th>任务</th><th>优先级</th><th>状态</th><th>类型</th><th>截止</th><th>客户</th><th></th></tr></thead>
            <tbody>
              {tasks.sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999")).map((t) => (
                <tr key={t.id} onClick={() => openEdit(t)} style={{ cursor: "pointer" }}>
                  <td style={{ fontWeight: 600 }}>{t.title}</td>
                  <td><Chip kind={t.priority === "高" ? "danger" : t.priority === "中" ? "warn" : "gray"}>{t.priority}</Chip></td>
                  <td><Chip gray>{t.kanbanCol}</Chip></td>
                  <td>{t.type}</td>
                  <td className="num">{t.due ?? "-"}</td>
                  <td>{t.customerId ? props.customers.find((c) => c.id === t.customerId)?.name ?? "-" : "-"}</td>
                  <td><Btn kind="data" sm onClick={() => openEdit(t)}>编辑</Btn></td>
                </tr>
              ))}
              {tasks.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>暂无任务</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "calendar" && (
        <CalendarView tasks={tasks} customers={props.customers} onOpen={openEdit} />
      )}

      {addOpen ? (
        <Modal title="新建任务" onClose={() => setAddOpen(false)} footer={
          <div className="grow">
            <Btn kind="ghost" onClick={() => setAddOpen(false)}>取消</Btn>
            <Btn kind="primary" onClick={() => { void submitAdd(); }}>创建</Btn>
          </div>
        }>
          <Field label="标题">
            <input className="inp" style={{ width: "100%" }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="field-row">
            <Field label="优先级">
              <select className="sel" style={{ width: "100%" }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}>
                {["高", "中", "低"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="截止日(可选)">
              <input className="inp num" type="date" style={{ width: "100%" }} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            </Field>
          </div>
          <Field label="关联客户(可选)">
            <select className="sel" style={{ width: "100%" }} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">不关联</option>
              {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </Modal>
      ) : null}
      {editId ? (
        <Modal title="编辑任务" onClose={() => setEditId(null)} footer={
          <div className="grow" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn kind="danger" onClick={() => { void removeTask(); }}>删除</Btn>
            <Btn kind="ghost" onClick={() => setEditId(null)}>取消</Btn>
            <Btn kind="primary" onClick={() => { void submitEdit(); }}>保存</Btn>
          </div>
        }>
          <Field label="标题">
            <input className="inp" style={{ width: "100%" }} value={eform.title} onChange={(e) => setEform({ ...eform, title: e.target.value })} />
          </Field>
          <div className="field-row">
            <Field label="优先级">
              <select className="sel" style={{ width: "100%" }} value={eform.priority} onChange={(e) => setEform({ ...eform, priority: e.target.value as Task["priority"] })}>
                {["高", "中", "低"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="所在列">
              <select className="sel" style={{ width: "100%" }} value={eform.kanbanCol} onChange={(e) => setEform({ ...eform, kanbanCol: e.target.value as KanbanCol })}>
                {COLS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </div>
          <div className="field-row">
            <Field label="截止日(可选)">
              <input className="inp num" type="date" style={{ width: "100%" }} value={eform.due} onChange={(e) => setEform({ ...eform, due: e.target.value })} />
            </Field>
            <Field label="关联客户(可选)">
              <select className="sel" style={{ width: "100%" }} value={eform.customerId} onChange={(e) => setEform({ ...eform, customerId: e.target.value })}>
                <option value="">不关联</option>
                {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </Modal>
      ) : null}
      {node}
    </div>
  );


function CalendarView(props: { tasks: Task[]; customers: Customer[]; onOpen: (t: Task) => void }) {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // 周一为0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const tasksByDay = new Map<string, Task[]>();
  for (const t of props.tasks) {
    if (!t.due) continue;
    const key = t.due;
    if (!tasksByDay.has(key)) tasksByDay.set(key, []);
    tasksByDay.get(key)!.push(t);
  }
  const fmt = (d: number) => year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="h-row" style={{ marginBottom: 10 }}>
        <span className="h-title sm">{year}年{month + 1}月</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, fontSize: 11 }}>
        {["一","二","三","四","五","六","日"].map((d) => <div key={d} style={{ textAlign: "center", fontWeight: 700, color: "var(--ink-4)", padding: 4 }}>{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} style={{ minHeight: 70, border: "1px solid var(--border-soft)", borderRadius: 6, padding: 4, background: d === now.getDate() ? "var(--brand-soft)" : "transparent" }}>
            {d !== null ? <div style={{ fontSize: 11, fontWeight: 600 }}>{d}</div> : null}
            {d !== null ? (tasksByDay.get(fmt(d)) ?? []).map((t) => (
              <div key={t.id} onClick={() => props.onOpen(t)} style={{ fontSize: 10, padding: "2px 4px", margin: "2px 0", borderRadius: 3, background: t.priority === "高" ? "var(--danger-bg)" : "var(--surface-2)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
            )) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
}

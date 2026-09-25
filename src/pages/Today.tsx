import { useState } from "react";
import type { Customer, Deal, Payment, ContactPoint, Task } from "../types";
import { Btn, Chip, money, useToast } from "../ui/common";
import { uid } from "../ui/common";
import { db } from "../db/db";

interface Props {
  customers: Customer[]; deals: Deal[]; payments: Payment[]; cps: ContactPoint[];
  tasks: Task[];
  reload: () => Promise<void>;
  goCrm: (customerId: string) => void;
  onNavigate: (view: string) => void;
}

interface ActionItem {
  kind: "task" | "payment" | "followup";
  level: "high" | "mid" | "low";
  title: string;
  sub?: string;
  refId?: string;      // customerId 或 taskId
  taskId?: string;
  paymentId?: string;
  dealId?: string;
}

const day = 86400000;

export default function Today(props: Props) {
  const { show, node } = useToast();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const nameOf = (id: string) => props.customers.find((c) => c.id === id)?.name ?? "未知客户";

  // 🔴 高优：今天到期/已逾期的任务 + 逾期回款
  const overduePayments = props.payments.filter((p) => p.status === "逾期" && !p.deletedAt);
  const dueTasks = props.tasks.filter((t) => !t.deletedAt && t.kanbanCol !== "完成" && t.due);
  const todayMs = new Date(); todayMs.setHours(23, 59, 59, 999);
  const urgentTasks = dueTasks.filter((t) => new Date(t.due!).getTime() <= todayMs.getTime());

  // 🟡 中优：沉默≥7天的在途商机（该跟进了）
  const STALE = 7;
  const staleDeals = props.deals
    .filter((d) => !["签约", "输单", "流失"].includes(d.stage) && !d.deletedAt)
    .map((d) => {
      const last = props.cps.filter((cp) => cp.customerId === d.customerId && !cp.deletedAt).sort((a, b) => b.time - a.time)[0];
      const days = last ? Math.floor((Date.now() - last.time) / day) : 999;
      return { deal: d, days };
    })
    .filter((x) => x.days >= STALE)
    .sort((a, b) => b.days - a.days)
    .slice(0, 6);

  // 🟢 低优：本周到期
  const weekMs = Date.now() + 7 * day;
  const thisWeekTasks = dueTasks.filter((t) => {
    const d = new Date(t.due!).getTime();
    return d > todayMs.getTime() && d <= weekMs;
  });
  const upcomingPayments = props.payments.filter((p) => p.status === "未到" && !p.deletedAt
    && new Date(p.dueDate).getTime() <= weekMs);

  async function completeTask(t: Task) {
    await db.put("tasks", { ...t, kanbanCol: "完成", completedAt: Date.now() }, "完成任务");
    setDoneIds((s) => new Set(s).add(t.id));
    show("已完成");
    await props.reload();
  }

  async function markPaid(p: Payment) {
    await db.put("payments", { ...p, status: "已收", paidDate: new Date().toISOString().slice(0, 10) }, "登记回款");
    show("已登记回款");
    await props.reload();
  }

  async function quickFollowup(customerId: string) {
    const text = window.prompt("写一条跟进记录：");
    if (!text?.trim()) return;
    await db.put("contactPoints", {
      id: uid(), customerId, type: "拜访", summary: text.trim(), time: Date.now(),
    }, "新增跟进");
    show("跟进已记录");
    await props.reload();
  }

  const levels = [
    { key: "high" as const, label: "今天必须处理", color: "#EF4444" },
    { key: "mid" as const, label: "该跟进了", color: "#F59E0B" },
    { key: "low" as const, label: "本周内", color: "#10B981" },
  ];

  function renderRow(item: ActionItem) {
    const isDone = item.taskId && doneIds.has(item.taskId);
    return (
      <div key={item.kind + item.title} style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: 12,
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        opacity: isDone ? 0.5 : 1,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.level === "high" ? "#EF4444" : item.level === "mid" ? "#F59E0B" : "#10B981", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
          {item.sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.sub}</div>}
        </div>
        {item.kind === "task" && (
          <Btn kind="done" sm onClick={() => { const t = props.tasks.find((x) => x.id === item.taskId); if (t) void completeTask(t); }}>✓ 完成</Btn>
        )}
        {item.kind === "payment" && (
          <Btn kind="primary" sm onClick={() => { const p = props.payments.find((x) => x.id === item.paymentId); if (p) void markPaid(p); }}>登记回款</Btn>
        )}
        {item.kind === "followup" && (
          <>
            <Btn kind="ghost" sm onClick={() => item.refId && props.goCrm(item.refId)}>看客户</Btn>
            <Btn kind="primary" sm onClick={() => item.refId && void quickFollowup(item.refId)}>写跟进</Btn>
          </>
        )}
      </div>
    );
  }

  const groups: { level: "high"|"mid"|"low"; items: ActionItem[] }[] = [
    {
      level: "high",
      items: [
        ...urgentTasks.map((t): ActionItem => ({
          kind: "task", level: "high", taskId: t.id,
          title: t.title, sub: t.due ? `截止 ${t.due}` : undefined,
        })),
        ...overduePayments.map((p): ActionItem => ({
          kind: "payment", level: "high", paymentId: p.id,
          title: `${nameOf(p.customerId)} · ${money(p.amount)}`,
          sub: `已逾期 · 应回款 ${p.dueDate}`,
        })),
      ],
    },
    {
      level: "mid",
      items: staleDeals.map(({ deal, days }): ActionItem => ({
        kind: "followup", level: "mid", refId: deal.customerId, dealId: deal.id,
        title: `${nameOf(deal.customerId)} · ${deal.title}`,
        sub: `沉默 ${days} 天 · 商机 ${deal.stage}`,
      })),
    },
    {
      level: "low",
      items: [
        ...thisWeekTasks.map((t): ActionItem => ({
          kind: "task", level: "low", taskId: t.id,
          title: t.title, sub: `截止 ${t.due}`,
        })),
        ...upcomingPayments.map((p): ActionItem => ({
          kind: "payment", level: "low", paymentId: p.id,
          title: `${nameOf(p.customerId)} · ${money(p.amount)}`,
          sub: `待回款 · ${p.dueDate}`,
        })),
      ],
    },
  ];

  const totalActions = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div style={{ padding: "8px 4px", maxWidth: 880 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)" }}>
          {new Date().getMonth() + 1}月{new Date().getDate()}日 {["周日","周一","周二","周三","周四","周五","周六"][new Date().getDay()]}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
          今天有 <b style={{ color: "var(--brand-primary)" }}>{totalActions}</b> 件事要处理
        </div>
      </div>

      {totalActions === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>全部搞定</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>没有待办，可以休息一下</div>
        </div>
      ) : (
        groups.map((g) => {
          const lv = levels.find((l) => l.key === g.level)!;
          if (g.items.length === 0) return null;
          return (
            <div key={g.level} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: lv.color }} />
                <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>{lv.label}</span>
                <Chip kind="gray">{g.items.length}</Chip>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.items.map(renderRow)}
              </div>
            </div>
          );
        })
      )}
      {node}
    </div>
  );
}

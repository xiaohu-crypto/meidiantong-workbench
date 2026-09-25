import { useState } from "react";
import { PageActionBar } from "../components/ui/PageActionBar";
import { nextBestActions } from "../core/metrics";
import { daysSince, healthOf } from "../core/derive";
import type { Customer, Deal, Milestone, Objective, Payment, ContactPoint, Task } from "../types";
import { Btn, Chip, money, Progress, useToast } from "../ui/common";
import { genScript } from "../core/ai/script";
import { uid } from "../ui/common";
import { db } from "../db/db";
import { IconWallet } from "../components/icons";

interface Props {
  customers: Customer[]; deals: Deal[]; payments: Payment[]; cps: ContactPoint[];
  objectives: Objective[]; tasks: Task[]; milestones: Milestone[];
  reload: () => Promise<void>;
  openQuick: () => void; goCrm: (customerId: string) => void;
  onNavigate: (view: string) => void;
}

type FeaturedTab = "今日待办" | "经营数据" | "快捷操作";

export default function Today(props: Props) {
  const { show, node } = useToast();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [gen, setGen] = useState<Record<string, { busy?: boolean; text?: string; badge?: "云" | "本地"; reason?: string; error?: string }>>({});
  const [featuredTab, setFeaturedTab] = useState<FeaturedTab>("今日待办");

  const active = props.deals.filter((d) => !["签约", "输单", "流失"].includes(d.stage) && !d.deletedAt);
  const nameOf = (id: string) => props.customers.find((c) => c.id === id)?.name ?? "未知客户";
  const gradeOf = (id: string) => props.customers.find((c) => c.id === id)?.grade ?? "C";
  const overdueCids = new Set(props.payments.filter((p) => p.status === "逾期" && !p.deletedAt).map((p) => p.customerId));

  const nba = nextBestActions(
    active.map((d) => ({
      deal: { ...d, lastTouchDays: daysSince(d.lastTouchAt) },
      grade: gradeOf(d.customerId),
      hasOverduePayment: overdueCids.has(d.customerId),
    })),
    5
  );
  const dealById = (id: string) => props.deals.find((d) => d.id === id);

  const today = new Date();
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][today.getDay()];
  const obj = props.objectives[0];

  const lowHealth = props.customers.filter((c) => !c.deletedAt && healthOf(c.id, props.cps, props.payments) < 60);
  const overdue = props.payments.filter((p) => p.status === "逾期" && !p.deletedAt);
  // D-05 跟进超期:14 天无任何接触点的在册客户(无接触记录的新客户不误报)
  const STALE_DAYS = 14;
  const staleList = props.customers.filter((c) => {
    if (c.deletedAt) return false;
    const last = props.cps.filter((cp) => cp.customerId === c.id && !cp.deletedAt).sort((a, b) => b.time - a.time)[0];
    return !!last && Date.now() - last.time > STALE_DAYS * 86400000;
  });
  const dueSoon = props.payments.filter((p) => {
    if (p.status !== "未到" || p.deletedAt) return false;
    const diff = (new Date(p.dueDate).getTime() - Date.now()) / 86400000;
    return diff <= 7;
  });

  const shownTasks = props.tasks.filter((t) => !t.deletedAt && t.due && t.kanbanCol !== "完成").slice(0, 4);
  const dueTotal = overdue.reduce((s, p) => s + p.amount, 0) + dueSoon.reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ padding: "20px 24px" }}>
      <PageActionBar title="待办事项" subtitle="智能建议 · 营销节点提醒" onRefresh={() => window.location.reload()} />
        <div className="grid-c">
          <div className="card card-pad">
            <div className="h-row">
              <span className="h-title">待办</span>
              <Chip kind="brand">智能建议</Chip>
              <span style={{ marginLeft: "auto", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>规则引擎:沉默天数 × 价值 × 阶段</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nba.map((n, i) => {
                const d = dealById(n.dealId);
                if (!d) return null;
                const cName = nameOf(d.customerId);
                const displayTitle = d.title.startsWith(cName) ? d.title.slice(cName.length).trim() : d.title;
                const isOverdue = overdueCids.has(d.customerId);
                const color = isOverdue ? "#EF4444" : n.daysSilent > 14 ? "#F59E0B" : "#10B981";
                return (
                  <div key={n.dealId} style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 14, background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderLeft: `3px solid ${color}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>{cName}</span>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>· {displayTitle}</span>
                        <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "ui-monospace,monospace", color: "var(--text-primary)" }}>{money(d.value)}</span>
                        {isOverdue ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "var(--status-danger-bg)", color: "var(--status-danger)", fontWeight: 800 }}>有逾期回款</span> : null}
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "var(--text-muted)", flexWrap: "wrap" }}>
                        <span>沉默 <b style={{ color: n.daysSilent > 14 ? "var(--status-pending)" : "var(--text-secondary)" }}>{n.daysSilent}天</b></span>
                        <span>阶段: {d.stage}</span>
                        <span>等级: {gradeOf(d.customerId)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <Btn kind="done" sm onClick={() => { setDone((s) => ({ ...s, [n.dealId]: true })); show("已记录:今日已跟进"); }}>✓ 已跟进</Btn>
                        <Btn kind="ghost" sm disabled={!!gen[d.id]?.busy}
                          onClick={() => {
                            const c = props.customers.find((x) => x.id === d.customerId);
                            if (!c) return;
                            setGen((s) => ({ ...s, [d.id]: { busy: true } }));
                            void genScript(d, c, props.cps).then((r) => {
                              setGen((s) => ({ ...s, [d.id]: { busy: false, text: r.ok ? r.content : undefined, badge: r.badge, reason: r.reason, error: r.error } }));
                            });
                          }}>{gen[d.id]?.busy ? "生成中…" : "✍️ 生成话术"}</Btn>
                        <Btn kind="ghost" sm onClick={() => props.goCrm(d.customerId)}>查看客户 →</Btn>
                      </div>
                      {gen[d.id]?.text ? (
                        <div style={{ marginTop: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "10px 12px", whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.6 }}>
                          <Chip kind={gen[d.id]?.badge === "云" ? "data" : "gray"} style={{ marginBottom: 6 }}>{gen[d.id]?.badge} · {gen[d.id]?.reason}</Chip>
                          <div>{gen[d.id]?.text}</div>
                        </div>
                      ) : null}
                      {done[n.dealId] ? <Chip kind="green" style={{ marginTop: 6 }}>✓ 已跟进</Chip> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="side-stack">
            <div className="card card-pad">
              <div className="h-row"><span className="h-title sm">营销节点</span><span style={{ marginLeft: "auto", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>本月</span></div>
              {[
                { name: "国庆节", date: "10月1日", days: 6, industry: "全行业", color: "#EF4444" },
                { name: "双11", date: "11月11日", days: 47, industry: "电商/美妆", color: "#FF5A36" },
                { name: "万圣节", date: "10月31日", days: 37, industry: "美妆/文旅", color: "#F59E0B" },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{m.date} · {m.industry}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "ui-monospace,monospace", color: m.days <= 7 ? "var(--status-danger)" : "var(--text-secondary)" }}>{m.days}天</span>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}
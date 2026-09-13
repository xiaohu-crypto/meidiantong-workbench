import { useEffect, useState } from "react";
import { nextBestActions } from "../core/metrics";
import { daysSince, healthOf } from "../core/derive";
import type { Customer, Deal, Milestone, Objective, Payment, ContactPoint, Task } from "../types";
import { Btn, Chip, money, Modal, Progress, useToast } from "../ui/common";
import { genScript } from "../core/ai/script";
import { uid } from "../ui/common";
import { db } from "../db/db";
import {
  IconWallet, IconUsers, IconTask, IconFunnel, IconChart, IconMedia, IconKb,
  IconGrowth, IconToday,
} from "../components/icons";

interface Props {
  customers: Customer[]; deals: Deal[]; payments: Payment[]; cps: ContactPoint[];
  objectives: Objective[]; tasks: Task[]; milestones: Milestone[];
  reload: () => Promise<void>;
  openQuick: () => void; goCrm: (customerId: string) => void;
  onNavigate: (view: string) => void;
}

type ToolIcon = (p: { size?: number }) => JSX.Element;

interface ToolItem { key: string; name: string; desc: string; icon: ToolIcon; group: "工作区" | "业务模块" }

const ALL_TOOLS: ToolItem[] = [
  { key: "today", name: "今日驾驶舱", desc: "每日行动总览", icon: IconToday, group: "工作区" },
  { key: "crm", name: "客户管理", desc: "客户档案与 360° 视图", icon: IconUsers, group: "业务模块" },
  { key: "work", name: "任务看板", desc: "看板任务管理", icon: IconTask, group: "业务模块" },
  { key: "dev", name: "商机管理", desc: "销售漏斗推进", icon: IconFunnel, group: "业务模块" },
  { key: "media", name: "媒介资源", desc: "媒介资源与策略", icon: IconMedia, group: "业务模块" },
  { key: "kb", name: "知识库", desc: "笔记与学习库", icon: IconKb, group: "业务模块" },
  { key: "data", name: "数据报表", desc: "经营分析报表", icon: IconChart, group: "业务模块" },
  { key: "growth", name: "成长规划", desc: "个人成长规划", icon: IconGrowth, group: "业务模块" },
];

const DEFAULT_PINNED = ["crm", "dev", "work", "data"];
const PINNABLE = ALL_TOOLS.filter((t) => t.group !== "工作区");

type FeaturedTab = "今日待办" | "经营数据" | "快捷操作";

export default function Today(props: Props) {
  const { show, node } = useToast();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [gen, setGen] = useState<Record<string, { busy?: boolean; text?: string; badge?: "云" | "本地"; reason?: string; error?: string }>>({});
  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINNED);
  const [pinnedEdit, setPinnedEdit] = useState(false);
  const [featuredTab, setFeaturedTab] = useState<FeaturedTab>("今日待办");

  useEffect(() => {
    void (async () => {
      const p = await db.getSetting<string[]>("homePinned", DEFAULT_PINNED);
      setPinned(Array.isArray(p) ? p : DEFAULT_PINNED);
    })();
  }, []);

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

  async function savePinned(next: string[]) {
    setPinned(next);
    await db.setSetting("homePinned", next);
    show("常用工具已保存");
  }

  const pinnedTools = pinned.map((k) => ALL_TOOLS.find((t) => t.key === k)).filter(Boolean) as ToolItem[];
  const shownTasks = props.tasks.filter((t) => !t.deletedAt && t.due && t.kanbanCol !== "完成").slice(0, 4);
  const dueTotal = overdue.reduce((s, p) => s + p.amount, 0) + dueSoon.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="home-banner">
        <div>
          <div className="hb-title">今日驾驶舱</div>
          <div className="hb-date">{today.getFullYear()} 年 {today.getMonth() + 1} 月 {today.getDate()} 日 {week}</div>
          <div className="hb-greet">在途商机 {active.length} 个 · 逾期回款 {overdue.length} 笔 — 行动清单已按规则引擎排好。</div>
        </div>
      </div>

      <div className="pinned-tools">
        {pinnedTools.map((t) => (
          <div className="pinned-item" key={t.key} onClick={() => props.onNavigate(t.key)}>
            <span className="pi-icon"><t.icon size={20} /></span>
            <span className="pi-name">{t.name}</span>
          </div>
        ))}
        <div className="pinned-item" onClick={() => setPinnedEdit(true)} title="编辑常用工具">
          <span className="pi-icon">✎</span>
          <span className="pi-name">编辑</span>
        </div>
      </div>

      <div className="featured-tabs">
        {(["今日待办", "经营数据", "快捷操作"] as const).map((t) => (
          <span key={t} className={"feat-tab" + (featuredTab === t ? " active" : "")} onClick={() => setFeaturedTab(t)}>{t}</span>
        ))}
      </div>

      {featuredTab === "今日待办" ? (
        <div className="grid-c">
          <div className="card card-pad">
            <div className="h-row">
              <span className="h-title">今日建议 · Next-Best-Action</span>
              <Chip kind="brand">Next-Best-Action</Chip>
              <span className="muted" style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}>规则引擎:沉默天数 × 价值 × 阶段(非 AI)</span>
            </div>
            <div className="nbxs">
              {nba.map((n, i) => {
                const d = dealById(n.dealId);
                if (!d) return null;
                const cName = nameOf(d.customerId);
                const displayTitle = d.title.startsWith(cName) ? d.title.slice(cName.length).trim() : d.title;
                return (
                  <div className="nbx-item" key={n.dealId}>
                    <div className={"prio " + (i === 0 ? "hot" : i < 3 ? "warm" : "cool")}>{i + 1}</div>
                    <div className="nbx-body">
                      <div className="nbx-title">{cName} · {displayTitle} <span className="tag num">· 商机 {money(d.value)}</span></div>
                      <div className="nbx-meta">
                        <span className="dot-flag" style={{ background: overdueCids.has(d.customerId) ? "var(--danger)" : n.daysSilent > 14 ? "var(--warning)" : "var(--data)" }} />
                        已沉默 {n.daysSilent} 天 · 阶段:{d.stage} · 等级:{gradeOf(d.customerId)}
                        {overdueCids.has(d.customerId) ? <Chip kind="danger">有逾期回款</Chip> : null}
                      </div>
                      <div className="nbx-actions">
                        <Btn kind="done" sm onClick={() => { setDone((s) => ({ ...s, [n.dealId]: true })); show("已记录:今日已跟进"); }}>记录为已跟进</Btn>
                        <Btn kind="ghost" sm disabled={!!gen[d.id]?.busy}
                          onClick={() => {
                            const c = props.customers.find((x) => x.id === d.customerId);
                            if (!c) return;
                            setGen((s) => ({ ...s, [d.id]: { busy: true } }));
                            void genScript(d, c, props.cps).then((r) => {
                              setGen((s) => ({ ...s, [d.id]: { busy: false, text: r.ok ? r.content : undefined, badge: r.badge, reason: r.reason, error: r.error } }));
                            });
                          }}>{gen[d.id]?.busy ? "生成中…" : "生成跟进话术草稿"}</Btn>
                      </div>
                      {gen[d.id]?.text ? (
                        <div style={{ marginTop: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 12px", whiteSpace: "pre-wrap", fontSize: "var(--text-sm)" }}>
                          <Chip kind={gen[d.id]?.badge === "云" ? "data" : "gray"} style={{ marginBottom: 4 }}>{gen[d.id]?.badge} · {gen[d.id]?.reason}</Chip>
                          <div>{gen[d.id]?.text}</div>
                        </div>
                      ) : null}
                      {gen[d.id]?.error ? <div className="cell-sub" style={{ color: "var(--danger)", marginTop: 6 }}>云调用失败:{gen[d.id]?.error}(已保留本地路径)</div> : null}
                      {done[n.dealId] ? <Chip kind="green">已跟进</Chip> : null}
                    </div>
                  </div>
                );
              })}
              {nba.length === 0 ? <p className="muted" style={{ padding: "16px 0" }}>暂无在途商机 — 按 Ctrl+K 快速采集，或前往商机管理新建。</p> : null}
            </div>
          </div>
          <div className="side-stack">
            <div className="card card-pad">
              <div className="h-row"><span className="h-title sm">今日日程</span><span className="muted" style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}>来自任务</span></div>
              {shownTasks.map((t) => (
                <div className="mini-row" key={t.id}><time>{t.priority === "高" ? "!!" : "·"}</time><span className="ev">{t.title}</span></div>
              ))}
              {shownTasks.length === 0 ? <p className="muted">今日无截止任务</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {featuredTab === "经营数据" ? (
        <div className="grid-c">
          <div className="side-stack">
            {props.milestones.slice(0, 1).map((m) => {
              const days = Math.max(0, Math.ceil((new Date(m.date).getTime() - Date.now()) / 86400000));
              return (
                <div className="card" key={m.name}>
                  <div className="countdown">
                    <div className="num">{days}<span style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", fontWeight: 600 }}>天</span></div>
                    <div>
                      <div className="lbl">下一个营销节点</div>
                      <div style={{ fontWeight: 650, marginTop: 2 }}>{m.name}</div>
                      <div className="lbl" style={{ marginTop: 2 }}>{m.date}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {obj ? (
              <div className="card card-pad">
                <div className="h-row"><span className="h-title sm">{obj.quarter} 目标 KR 进度</span></div>
                {obj.keyResults.map((kr) => (
                  <Progress key={kr.name} label={kr.name} v={kr.progress} warn={kr.name.includes("回款") && kr.progress < 90} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="card card-pad">
            <div className="h-row" style={{ marginBottom: 4 }}>
              <span className="h-title sm">待回款汇总</span>
              <span style={{ marginLeft: "auto", color: "var(--brand)" }}><IconWallet size={18} /></span>
            </div>
            <div className="cell-sub" style={{ marginBottom: 8 }}>逾期 {overdue.length} 笔 · 7 日内到期 {dueSoon.length} 笔 · 合计 {money(dueTotal)}</div>
            {overdue.map((p) => (
              <div className="alert-line" key={p.id}>
                <span className="txt">{nameOf(p.customerId)} · <Chip kind="danger">逾期</Chip></span>
                <span className="amt num">{money(p.amount)}</span>
                <time>{p.dueDate}</time>
              </div>
            ))}
            {dueSoon.map((p) => (
              <div className="alert-line" key={p.id}>
                <span className="txt">{nameOf(p.customerId)} · <Chip kind="warn">7 日内到期</Chip></span>
                <span className="amt num">{money(p.amount)}</span>
                <time>{p.dueDate}</time>
              </div>
            ))}
            {overdue.length + dueSoon.length === 0 ? <p className="muted">暂无待回款</p> : null}
          </div>
        </div>
      ) : null}

      {featuredTab === "快捷操作" ? (
        <div className="grid-c">
          <div className="card card-pad">
            <div className="h-row" style={{ marginBottom: 4 }}>
              <span className="h-title sm">预警</span>
              <Chip kind="danger">{lowHealth.length + staleList.length > 0 ? "需关注 " + (lowHealth.length + staleList.length) : "无"}</Chip>
            </div>
            {lowHealth.map((c) => (
              <div className="alert-line" key={c.id}>
                <span className="dot-flag" style={{ background: "var(--danger)" }} />
                <span className="txt">健康度偏低:<b>{c.name}</b>(<span className="num">{healthOf(c.id, props.cps, props.payments)}</span> 分)</span>
                <span style={{ display: "inline-flex", gap: 6 }}>
                  <button className="btn done sm" onClick={() => props.goCrm(c.id)}>查看</button>
                  <button className="btn done sm" onClick={() => { void (async () => {
                    const list = await db.getSetting<{ id: string; at: number; title: string; body: string }[]>("snoozed", []);
                    list.push({ id: uid("sn"), at: Date.now() + 3600000, title: "健康度预警 · " + c.name, body: "1 小时前设置的稍后提醒:该客户健康度偏低,建议跟进。" });
                    await db.setSetting("snoozed", list);
                    show("已设 1 小时后提醒");
                  })(); }}>稍后提醒</button>
                </span>
              </div>
            ))}
            {staleList.map((c) => (
              <div className="alert-line" key={"s-" + c.id}>
                <span className="dot-flag" style={{ background: "var(--warning)" }} />
                <span className="txt">跟进超期:<b>{c.name}</b>(超过 {STALE_DAYS} 天无接触记录)</span>
                <span style={{ display: "inline-flex", gap: 6 }}>
                  <button className="btn done sm" onClick={() => props.goCrm(c.id)}>去跟进</button>
                </span>
              </div>
            ))}
            {lowHealth.length === 0 && staleList.length === 0 ? <p className="muted">暂无预警</p> : null}
          </div>
          <div className="side-stack">
            <div className="card card-pad">
              <div className="h-row"><span className="h-title sm">快速入口</span></div>
              <div className="nbx-actions">
                <Btn kind="data" onClick={() => props.onNavigate("crm")}>打开 CRM</Btn>
                <Btn kind="ghost" onClick={() => props.onNavigate("dev")}>查看商机漏斗</Btn>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pinnedEdit ? (
        <Modal title="编辑常用工具" onClose={() => setPinnedEdit(false)} footer={
          <div className="grow">
            <Btn kind="ghost" onClick={() => setPinnedEdit(false)}>取消</Btn>
            <Btn kind="primary" onClick={() => setPinnedEdit(false)}>完成</Btn>
          </div>
        }>
          <p className="muted" style={{ marginBottom: 10, fontSize: "var(--text-sm)" }}>勾选要固定到首页顶部的工具(最多 6 个)。</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PINNABLE.map((t) => {
              const on = pinned.includes(t.key);
              return (
                <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "var(--text-sm)" }}>
                  <input type="checkbox" checked={on} onChange={() => {
                    let next = on ? pinned.filter((k) => k !== t.key) : [...pinned, t.key];
                    if (next.length > 6) { show("最多固定 6 个工具"); next = pinned; }
                    void savePinned(next);
                  }} />
                  <t.icon size={14} /> {t.name}
                </label>
              );
            })}
          </div>
        </Modal>
      ) : null}
      {node}
    </div>
  );
}

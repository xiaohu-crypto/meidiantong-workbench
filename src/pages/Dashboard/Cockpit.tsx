// File: src/pages/Dashboard/Cockpit.tsx
import { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Metric from "../../components/ui/Metric";
import Button from "../../components/ui/Button";
import StatusPill from "../../components/ui/StatusPill";
import { Btn, Modal } from "../../ui/common";
import { db } from "../../db/db";
import type { Customer, Deal, Payment, Task } from "../../types";

/** 在途阶段：除签约/输单/流失外的销售漏斗阶段 */
const ACTIVE_STAGES: Deal["stage"][] = ["线索", "MQL", "SQL", "商机", "报价", "谈判"];

interface CockpitProps {
  customers: Customer[];
  deals: Deal[];
  payments: Payment[];
  tasks: Task[];
  /** 数据变更后通知上层刷新（写库后驱动全局数据回流） */
  onDataChange?: () => void | Promise<void>;
  /** 页面内跳转（如：查看全部 → 任务看板） */
  onNavigate?: (view: string) => void;
}

interface RuleRow {
  id: string;
  customer: string;
  value: string;
  note: string;
}

interface TodoItem {
  id: string;
  time: string;
  title: string;
  type: "success" | "pending" | "danger";
}

const TODO_LABELS: Record<TodoItem["type"], string> = {
  success: "已完成",
  pending: "进行中",
  danger: "已逾期",
};

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

/** 本地日期 YYYY-MM-DD（避免 toISOString 的 UTC 偏移） */
function localDateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 生成 IndexedDB 主键（与 db.ts nowId 同构） */
function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 基于真实商机/客户字段生成跟进话术草稿 */
function buildScript(deal: Deal, cust: Customer | undefined): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const t = localDateStr(tomorrow);
  const name = cust?.name ?? "客户";
  const industry = cust?.industry ?? "贵行业";
  return [
    `跟进话术草稿 ｜ ${deal.title}`,
    `客户：${name}（${industry}）`,
    `阶段：${deal.stage} ｜ 预估赢率：${deal.probability}%`,
    "——————————————",
    `【开场】${name}您好，我是媒电通的跟进顾问，今天想跟您同步「${deal.title}」的最新进展。`,
    `【进展确认】上次我们推进到 ${deal.stage} 阶段。想确认一下：近期预算或排期是否有变化，需要我们同步调整方案？`,
    `【行动项】如您方便，我把最新方案与报价明细整理好，${t} 上午发您邮箱，并做一次简短对齐。`,
  ].join("\n");
}

/**
 * 今日驾驶舱 · 非对称黄金比例：主工作区 7 列 + 右侧日程 3 列
 * 数据全部来自 IndexedDB 真实聚合；操作按钮已接通写库/话术/导航闭环。
 */
export default function Cockpit({
  customers,
  deals,
  payments,
  tasks,
  onDataChange,
  onNavigate,
}: CockpitProps) {
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(new Date()),
    []
  );

  const customerOf = useMemo(() => {
    const map = new Map(customers.map((c) => [c.id, c]));
    return (id: string): Customer | undefined => map.get(id);
  }, [customers]);
  const customerName = useMemo(
    () => (id: string) => customerOf(id)?.name ?? "未知客户",
    [customerOf]
  );

  // —— 在途商机：活跃阶段 deals 金额合计 ——
  const inFlight = useMemo(
    () => deals.filter((d) => !d.deletedAt && ACTIVE_STAGES.includes(d.stage)),
    [deals]
  );
  const pipelineValue = useMemo(
    () => inFlight.reduce((s, d) => s + d.value, 0),
    [inFlight]
  );
  const dealById = useMemo(() => new Map(inFlight.map((d) => [d.id, d])), [inFlight]);

  // —— 逾期回款：status=逾期 的 payments 金额合计 ——
  const overdue = useMemo(
    () => payments.filter((p) => !p.deletedAt && p.status === "逾期"),
    [payments]
  );
  const overdueValue = useMemo(
    () => overdue.reduce((s, p) => s + p.amount, 0),
    [overdue]
  );

  // —— 规则引擎建议列表：在途商机按金额降序 Top5，附阶段/赢率/最近跟进 ——
  const rules = useMemo<RuleRow[]>(
    () =>
      [...inFlight]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((d) => ({
          id: d.id,
          customer: customerName(d.customerId),
          value: money.format(d.value),
          note: `${d.stage} · ${d.probability}% 赢率 · 近 ${Math.max(
            0,
            Math.round((Date.now() - d.lastTouchAt) / 86400000)
          )} 天跟进`,
        })),
    [inFlight, customerName]
  );

  // —— 今日待办：逾期回款（danger）+ 到期未完成任务（pending）+ 今日已完成（success） ——
  const todos = useMemo<TodoItem[]>(() => {
    const now = new Date();
    const todayStr = localDateStr(now);
    const items: TodoItem[] = [];

    for (const p of overdue.slice(0, 2)) {
      items.push({
        id: p.id,
        time: p.dueDate.slice(5),
        title: `${customerName(p.customerId)} 逾期回款 ${money.format(p.amount)}`,
        type: "danger",
      });
    }

    const openTasks = tasks
      .filter((t) => !t.deletedAt && t.due && t.due <= todayStr && t.kanbanCol !== "完成")
      .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))
      .slice(0, 3);
    for (const t of openTasks) {
      items.push({ id: t.id, time: (t.due ?? "").slice(5), title: t.title, type: "pending" });
    }

    const doneToday = tasks
      .filter((t) => !t.deletedAt && t.due === todayStr && t.kanbanCol === "完成")
      .slice(0, 1);
    for (const t of doneToday) {
      items.push({ id: t.id, time: (t.due ?? "").slice(5), title: t.title, type: "success" });
    }

    return items;
  }, [overdue, tasks, customerName]);

  const pipelineTrend = useMemo(
    () => ({ value: `${inFlight.length} 笔`, isPositive: true, text: "在途合计" }),
    [inFlight.length]
  );
  const overdueTrend = useMemo(
    () => ({ value: `${overdue.length} 笔`, isPositive: false, text: "逾期合计" }),
    [overdue.length]
  );

  // —— 操作状态 ——
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [followBusy, setFollowBusy] = useState<string | null>(null);
  const [draftDeal, setDraftDeal] = useState<Deal | null>(null);
  const [copied, setCopied] = useState(false);

  /** 记录为已跟进：为该商机落一条跟进任务（IndexedDB）→ 全局刷新 */
  async function handleFollow(deal: Deal): Promise<void> {
    if (followed.has(deal.id) || followBusy) return;
    setFollowBusy(deal.id);
    try {
      await db.put("tasks", {
        id: newId(),
        title: `跟进：${customerName(deal.customerId)} · ${deal.title}`,
        type: "跟进",
        priority: "中",
        due: localDateStr(new Date()),
        kanbanCol: "待办",
        customerId: deal.customerId,
      });
      setFollowed((s) => new Set(s).add(deal.id));
      await onDataChange?.();
    } finally {
      setFollowBusy(null);
    }
  }

  /** 生成跟进话术草稿：弹窗展示 + 复制到剪贴板 */
  async function handleCopyScript(): Promise<void> {
    if (!draftDeal) return;
    try {
      await navigator.clipboard.writeText(buildScript(draftDeal, customerOf(draftDeal.customerId)));
      setCopied(true);
    } catch {
      /* 剪贴板不可用（非安全上下文）时保持原状 */
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6">
      {/* 页面头部 */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text-primary)]">
            今日驾驶舱
          </h1>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            {todayLabel} · 数据来自本地 IndexedDB 实时聚合
          </p>
        </div>
        <StatusPill
          type={overdue.length > 0 ? "danger" : "success"}
          text={overdue.length > 0 ? `存在 ${overdue.length} 笔逾期` : "回款健康"}
        />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        {/* 左侧主工作区（7 列） */}
        <div className="space-y-6 lg:col-span-7">
          {/* 顶部指标横排 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Metric label="在途商机" value={money.format(pipelineValue)} trend={pipelineTrend} />
            <Metric
              label="逾期回款"
              value={money.format(overdueValue)}
              variant="danger"
              trend={overdueTrend}
            />
          </div>

          {/* 规则引擎建议列表 */}
          <Card
            title="规则引擎建议列表"
            extra={
              <span className="text-xs text-[color:var(--text-muted)]">
                在途商机按金额降序 Top5
              </span>
            }
          >
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[color:var(--text-muted)]">
                  <th className="pb-3 font-medium">客户名称</th>
                  <th className="pb-3 font-medium">商机价值</th>
                  <th className="pb-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border-subtle)]">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-sm text-[color:var(--text-muted)]">
                      暂无在途商机，请在「商机管理」录入
                    </td>
                  </tr>
                ) : (
                  rules.map((row) => {
                    const deal = dealById.get(row.id);
                    const isFollowed = followed.has(row.id);
                    const isBusy = followBusy === row.id;
                    return (
                      <tr key={row.id}>
                        <td className="py-3.5 pr-4">
                          <p className="text-sm font-medium text-[color:var(--text-primary)]">
                            {row.customer}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            {row.note}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-sm font-semibold tabular-nums text-[color:var(--text-primary)]">
                          {row.value}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={isFollowed ? "secondary" : "primary"}
                              disabled={isFollowed || isBusy}
                              onClick={() => {
                                if (deal) void handleFollow(deal);
                              }}
                            >
                              {isBusy ? "记录中…" : isFollowed ? "已跟进 ✓" : "记录为已跟进"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (deal) {
                                  setDraftDeal(deal);
                                  setCopied(false);
                                }
                              }}
                            >
                              生成跟进话术草稿
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* 右侧日程区（3 列） */}
        <aside className="lg:col-span-3">
          <Card
            title="今日待办"
            extra={
              <Button size="sm" variant="ghost" onClick={() => onNavigate?.("work")}>
                查看全部
              </Button>
            }
          >
            {todos.length === 0 ? (
              <p className="py-4 text-center text-sm text-[color:var(--text-muted)]">
                今日无待办事项
              </p>
            ) : (
              <ul className="space-y-1">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-start gap-3 rounded-[var(--radius-md)] px-2 py-2.5 hover:bg-[var(--bg-muted)]"
                  >
                    <span className="mt-0.5 font-mono text-xs tabular-nums text-[color:var(--text-muted)]">
                      {todo.time}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-[color:var(--text-primary)]">
                      {todo.title}
                    </p>
                    <StatusPill type={todo.type} text={TODO_LABELS[todo.type]} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      {/* 跟进话术草稿弹窗 */}
      {draftDeal ? (
        <Modal
          title="生成跟进话术草稿"
          onClose={() => {
            setDraftDeal(null);
            setCopied(false);
          }}
          footer={
            <>
              <Btn
                kind="ghost"
                sm
                onClick={() => {
                  setDraftDeal(null);
                  setCopied(false);
                }}
              >
                关闭
              </Btn>
              <Btn kind="primary" sm onClick={() => void handleCopyScript()}>
                {copied ? "已复制 ✓" : "复制到剪贴板"}
              </Btn>
            </>
          }
        >
          <pre className="whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--bg-muted)] p-4 text-sm leading-relaxed text-[color:var(--text-primary)]">
            {buildScript(draftDeal, customerOf(draftDeal.customerId))}
          </pre>
        </Modal>
      ) : null}
    </div>
  );
}

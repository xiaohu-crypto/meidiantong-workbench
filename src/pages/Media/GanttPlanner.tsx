// File: src/pages/Media/GanttPlanner.tsx
import { useMemo } from "react";
import Card from "../../components/ui/Card";
import StatusPill from "../../components/ui/StatusPill";
import type { MediaResource, ScheduleItem } from "../../types";

/* ================= 排期引擎常量 ================= */
const COL_W = 64; // 每周列宽（px）
const LEFT_W = 216; // 左侧固定轨道宽（px）
const WEEK_COUNT = 17; // 9月-12月 共 17 个自然周
const START = new Date(2026, 8, 7); // 2026-09-07（周一）刻度起点
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

interface Week {
  index: number;
  start: Date;
  month: number;
  label: string;
}

interface GanttPlannerProps {
  items: ScheduleItem[];
  resources: MediaResource[];
}

interface GanttBar {
  id: string;
  name: string;
  start: number; // 周索引（0 = 第 1 周，越界自动钳制到可视窗口）
  span: number;
}

interface ChannelRow {
  key: string;
  name: string;
  meta: string;
  bars: GanttBar[];
}

interface Finance {
  cost: number;
  quote: number;
  margin: number;
  rebate: number;
  count: number;
}

/** ISO 周号（周一为一周起点） */
function isoWeekOf(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** 生成 W37..W53 的周刻度（含所属月份） */
function buildWeeks(): Week[] {
  const weeks: Week[] = [];
  const cursor = new Date(START.getFullYear(), START.getMonth(), START.getDate());
  for (let i = 0; i < WEEK_COUNT; i += 1) {
    const start = new Date(cursor);
    weeks.push({ index: i, start, month: start.getMonth(), label: `W${isoWeekOf(start)}` });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

/** 解析 "YYYY-MM-DD" 为本地日期 */
function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 日期 → 相对甘特起点的周索引（可能为负/越界，由调用方钳制） */
function weekIndexOf(dateStr: string): number {
  const diffDays = Math.round(
    (parseDate(dateStr).getTime() - START.getTime()) / 86400000
  );
  return Math.floor(diffDays / 7);
}

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

/** 图例（卡片 extra 位） */
const LEGEND = (
  <div className="flex items-center gap-4 text-xs text-[color:var(--text-secondary)]">
    <span className="inline-flex items-center gap-1.5">
      <span className="rounded-md border border-[color:var(--brand-primary)] bg-[var(--brand-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--brand-primary)]">
        排期中
      </span>
      已排期
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-3 w-0.5 rounded-full bg-[var(--brand-primary)]" />
      今日
    </span>
  </div>
);

/**
 * 媒介资源排期甘特图
 * 顶部高密度财务看板（真实排期聚合）+ 左侧 Sticky 渠道轨道 + 右侧 9月-12月 周刻度水平矩阵
 * 排期条全部来自 IndexedDB scheduleItems（按资源分组，日期区间换算为周跨度）。
 */
export default function GanttPlanner({ items, resources }: GanttPlannerProps) {
  const weeks = useMemo(buildWeeks, []);

  // 按“周起点所在月”聚合出月刻度带
  const monthGroups = useMemo(() => {
    const groups: { month: number; count: number }[] = [];
    weeks.forEach((w) => {
      const last = groups[groups.length - 1];
      if (last && last.month === w.month) last.count += 1;
      else groups.push({ month: w.month, count: 1 });
    });
    return groups;
  }, [weeks]);

  // 今日所在周索引（用于垂直“今日线”定位，无匹配返回 -1）
  const todayIdx = useMemo(() => {
    const now = new Date();
    return weeks.findIndex(
      (w) => now >= w.start && now < new Date(w.start.getTime() + 7 * 86400000)
    );
  }, [weeks]);

  // —— 财务总览：真实排期聚合（成本/报价/毛利/未结返点） ——
  const finance = useMemo<Finance>(() => {
    const active = items.filter((i) => !i.deletedAt);
    const cost = active.reduce((s, i) => s + i.cost, 0);
    const quote = active.reduce((s, i) => s + i.sellPrice, 0);
    const rebate = active.reduce(
      (s, i) => s + (i.rebateSettled ? 0 : (i.rebate ?? 0)),
      0
    );
    return {
      cost,
      quote,
      margin: quote > 0 ? ((quote - cost) / quote) * 100 : 0,
      rebate,
      count: active.length,
    };
  }, [items]);

  // —— 渠道行：按 resourceId 分组，日期区间 → 周跨度（自动钳制到 9-12月 窗口） ——
  const rows = useMemo<ChannelRow[]>(() => {
    const resMap = new Map(resources.map((r) => [r.id, r]));
    const groups = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      if (it.deletedAt) continue;
      const g = groups.get(it.resourceId) ?? [];
      g.push(it);
      groups.set(it.resourceId, g);
    }

    const out: ChannelRow[] = [];
    for (const [rid, list] of groups) {
      const bars: GanttBar[] = [];
      for (const it of list) {
        const sIdx = weekIndexOf(it.start);
        const eIdx = weekIndexOf(it.end);
        // 完全落在可视窗口之外（早于起点或晚于终点）则跳过
        if (eIdx < 0 || sIdx >= WEEK_COUNT) continue;
        const start = Math.max(0, sIdx);
        const end = Math.min(WEEK_COUNT - 1, eIdx);
        bars.push({ id: it.id, name: it.name, start, span: end - start + 1 });
      }
      if (bars.length > 0) {
        out.push({
          key: rid,
          name: resMap.get(rid)?.name ?? rid,
          meta: `${bars.length} 档排期`,
          bars,
        });
      }
    }
    return out;
  }, [items, resources]);

  const trackWidth = LEFT_W + weeks.length * COL_W;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6 animate-fade-in">
      {/* 页面头部 */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text-primary)]">
            媒介资源排期甘特图
          </h1>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            9月 – 12月 · {weeks.length} 周滚动排期视图 · 数据来自本地 IndexedDB
          </p>
        </div>
        <StatusPill type={finance.count > 0 ? "pending" : "success"} text={finance.count > 0 ? "预算执行中" : "暂无排期"} />
      </header>

      {/* 财务看板区：一行紧凑呈现 4 项资金指标（真实聚合） */}
      <Card
        title="财务总览"
        extra={
          <span className="text-xs text-[color:var(--text-muted)]">
            {finance.count} 条排期 · 含未结返点
          </span>
        }
        className="mb-6"
      >
        <div className="grid grid-cols-2 divide-y divide-[color:var(--border-subtle)] lg:grid-cols-4 lg:divide-y-0 lg:divide-x">
          <div className="px-4 py-1 first:pl-0">
            <p className="text-xs font-medium text-[color:var(--text-muted)]">媒介采购成本</p>
            <p className="mt-1.5 font-mono text-xl font-bold tracking-tight tabular-nums text-[color:var(--text-primary)]">
              {money.format(finance.cost)}
            </p>
          </div>
          <div className="px-4 py-1 first:pl-0">
            <p className="text-xs font-medium text-[color:var(--text-muted)]">客户总报价</p>
            <p className="mt-1.5 font-mono text-xl font-bold tracking-tight tabular-nums text-[color:var(--text-primary)]">
              {money.format(finance.quote)}
            </p>
          </div>
          <div className="px-4 py-1 first:pl-0">
            <p className="text-xs font-medium text-[color:var(--text-muted)]">预估毛利率</p>
            <p className="mt-1.5 font-mono text-xl font-bold tracking-tight tabular-nums text-[color:var(--status-success)]">
              {finance.margin.toFixed(1)}%
            </p>
          </div>
          <div className="px-4 py-1 first:pl-0">
            <p className="text-xs font-medium text-[color:var(--text-muted)]">待返点金额</p>
            <p className="mt-1.5 font-mono text-xl font-bold tracking-tight tabular-nums text-[color:var(--status-pending)]">
              {money.format(finance.rebate)}
            </p>
          </div>
        </div>
      </Card>

      {/* 甘特主矩阵：Sticky Track + Horizontal Matrix Sheet */}
      <Card title="投放排期矩阵" extra={LEGEND}>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-[color:var(--text-muted)]">
            暂无排期数据，请在「媒介资源」页录入排期后展示
          </p>
        ) : (
          <div className="gantt-scroll overflow-x-auto rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)]">
            <div style={{ width: trackWidth }} className="min-w-full">
              {/* 月刻度带 */}
              <div className="flex h-7 items-stretch border-b border-[color:var(--border-subtle)]">
                <div className="sticky left-0 z-30 flex w-[216px] shrink-0 items-center border-r border-[color:var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[color:var(--text-muted)]">
                  投放渠道
                </div>
                <div className="flex">
                  {monthGroups.map((g) => (
                    <div
                      key={g.month}
                      style={{ width: g.count * COL_W }}
                      className="flex items-center justify-center border-r border-[color:var(--border-subtle)] text-[11px] font-medium text-[color:var(--text-secondary)] last:border-r-0"
                    >
                      {MONTH_NAMES[g.month]}
                    </div>
                  ))}
                </div>
              </div>

              {/* 周刻度带 */}
              <div className="flex h-8 items-stretch border-b border-[color:var(--border-subtle)]">
                <div className="sticky left-0 z-30 flex w-[216px] shrink-0 items-center border-r border-[color:var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[color:var(--text-primary)]">
                  渠道 / 周次
                </div>
                <div className="flex">
                  {weeks.map((w) => (
                    <div
                      key={w.index}
                      style={{ width: COL_W }}
                      className="flex items-center justify-center border-r border-[color:var(--border-subtle)] font-mono text-[11px] tabular-nums text-[color:var(--text-muted)] last:border-r-0"
                    >
                      {w.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* 渠道排期行 */}
              {rows.map((ch) => (
                <div
                  key={ch.key}
                  className="flex h-12 items-stretch border-b border-[color:var(--border-subtle)] last:border-b-0"
                >
                  {/* Sticky 渠道轨道 */}
                  <div className="sticky left-0 z-20 flex w-[216px] shrink-0 items-center border-r border-[color:var(--border-subtle)] bg-[var(--bg-surface)] px-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[color:var(--text-primary)]">
                        {ch.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[color:var(--text-muted)]">
                        {ch.meta}
                      </p>
                    </div>
                  </div>

                  {/* 水平矩阵轨道：周网格线 + 软胶囊排期条 + 今日线 */}
                  <div
                    className="relative flex-1"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to right, var(--border-subtle) 0 1px, transparent 1px ${COL_W}px)`,
                    }}
                  >
                    {ch.bars.map((bar) => (
                      <div
                        key={bar.id}
                        title={`${bar.name} · 第 ${bar.start + 1}-${bar.start + bar.span} 周`}
                        className="absolute top-1.5 bottom-1.5 flex items-center overflow-hidden rounded-lg border border-[color:var(--brand-primary)] bg-[var(--brand-subtle)] p-2 text-xs font-medium text-[color:var(--brand-primary)]"
                        style={{
                          left: bar.start * COL_W + 4,
                          width: bar.span * COL_W - 8,
                        }}
                      >
                        <span className="truncate">{bar.name}</span>
                      </div>
                    ))}

                    {todayIdx >= 0 && (
                      <div
                        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[var(--brand-primary)]"
                        style={{ left: todayIdx * COL_W }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

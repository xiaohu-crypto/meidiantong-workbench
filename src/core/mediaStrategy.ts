/**
 * P1 §权威数据契约:MediaStrategyFormState
 *
 * 来源:媒电通工作台「媒介策划」表单权威 Schema(老板下发)。
 * 该 Schema 是策略表单 UI 的唯一真源——UI 必须按本类型驱动:
 *  - selectedChannels      多选驱动 channelAllocations 行增删(动态渠道分配)
 *  - channelAllocations    逐渠道占比,合计须=100%
 *  - estimatedAmount       由 totalBudget × Σ(pct)/100 自动计算,不可手填
 *  - validationStatus      实时校验(合计是否=100)
 *  - errors                各字段标红文案(危险红 #FF6B6E,非品牌红 #FE2C55)
 *
 * 所有派生/校验逻辑集中在本文件纯函数,UI 仅消费,保证单一真源。
 */
export type MediaStrategyChannel =
  | "信息流" | "种草" | "品牌" | "达人"
  | "OOH" | "KOL" | "搜索" | "私域";

export interface ChannelAllocation {
  channel: string;
  pct: number;
}

export type StrategyValidationStatus = "valid" | "invalid";

export interface MediaStrategyFormState {
  /** 已选渠道集合,驱动 channelAllocations 行增删 */
  selectedChannels: MediaStrategyChannel[];
  /** 目标受众 */
  audience: string;
  /** 总预算(文本,自动计算分配金额) */
  totalBudget: string;
  /** 各渠道预算分配(随 selectedChannels 动态生成) */
  channelAllocations: ChannelAllocation[];
  /** 首选资源 */
  preferredResources: string;
  /** 备注 */
  note: string;
  /** 附件 */
  attachments: { name: string; path: string }[];
  /** 预估总分配金额(由 totalBudget × Σ(pct)/100 自动计算,不可手填) */
  estimatedAmount: number;
  /** 实时校验状态(合计是否=100%) */
  validationStatus: StrategyValidationStatus;
  /** 各字段错误提示,标红用危险红 */
  errors: Record<string, string>;
}

export const ALL_CHANNELS: MediaStrategyChannel[] =
  ["信息流", "种草", "品牌", "达人", "OOH", "KOL", "搜索", "私域"];

/** 占比合计 */
export function mixTotal(allocs: ChannelAllocation[]): number {
  return allocs.reduce((s, a) => s + (Number(a.pct) || 0), 0);
}

/** 解析 totalBudget 文本里的数值(去掉非数字,如 "800万" → 800) */
export function parseBudget(text: string): number {
  return Number((text ?? "").replace(/[^\d.]/g, "")) || 0;
}

/** 预估分配金额 = totalBudget × Σ(pct)/100,保留整数 */
export function computeEstimatedAmount(totalBudget: string, allocs: ChannelAllocation[]): number {
  const base = parseBudget(totalBudget);
  if (base <= 0) return 0;
  return Math.round(base * (mixTotal(allocs) / 100));
}

/** 实时校验:渠道占比合计须=100 */
export function isStrategyValid(allocs: ChannelAllocation[]): boolean {
  return allocs.length === 0 || mixTotal(allocs) === 100;
}

/** 校验文案 */
export function strategyError(allocs: ChannelAllocation[]): string {
  if (isStrategyValid(allocs)) return "";
  return "❌ 各媒体渠道的预算配比相加必须等于 100%（当前总计为 " + mixTotal(allocs) + "%），请修正后再提交。";
}

/** selectedChannels 变化时,同步生成/移除对应分配行,保留已有 pct */
export function syncAllocations(
  sel: Set<MediaStrategyChannel>,
  prev: ChannelAllocation[],
): ChannelAllocation[] {
  const kept = prev.filter((a) => sel.has(a.channel as MediaStrategyChannel));
  const added: ChannelAllocation[] = [];
  sel.forEach((c) => {
    if (!kept.some((a) => a.channel === c)) added.push({ channel: c, pct: 0 });
  });
  return [...kept, ...added];
}

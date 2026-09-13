import { db } from "../db/db";
import type { ContactPoint, Contract, Customer, Deal, Objective, Payment, Rel, Task, Contact, Milestone } from "../types";

const DAY = 86400000;
const ago = (d: number) => Date.now() - d * DAY;
const dateStr = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

export async function clearAllData(): Promise<void> {
  await db.clearAll();
}

export async function seedIfEmpty(): Promise<boolean> {
  const existing = await db.getAll<Customer>("customers");
  if (existing.length > 0) return false;

  const c = (id: string, name: string, industry: string, grade: Customer["grade"], parentId?: string | null, billingTitle?: string, billingTaxNo?: string): Customer =>
    ({ id, name, industry, grade, parentId: parentId ?? null, billingTitle, billingTaxNo });

  const customers: Customer[] = [
    c("c-hold", "华宇控股", "综合集团", "B"),
    c("c-1", "盛达集团", "美妆日化", "A", "c-hold", "盛达集团有限公司", "91310000MA1FL1001X"),
    c("c-2", "云裳服饰", "服饰鞋包", "A", null, "云裳服饰股份有限公司", "91330000MA2CL2002Y"),
    c("c-3", "星海互动", "互联网", "B"),
    c("c-4", "悦己美妆", "美妆日化", "A"),
    c("c-5", "蓝湾文旅", "文旅", "B"),
    c("c-6", "腾达传媒", "传媒", "B"),
    c("c-7", "恒诺电子", "消费电子", "C"),
    c("c-8", "启程教育", "教育", "C"),
    c("c-9", "味觉食品", "食品饮料", "B"),
  ];
  for (const x of customers) await db.put("customers", x);

  const ct = (id: string, name: string, title: string, phone: string, org: string, status: Contact["employmentStatus"] = "在职"): Contact =>
    ({ id, name, title, phone, orgCustomerId: org, employmentStatus: status });
  const contacts: Contact[] = [
    ct("ct-1", "张伟", "市场总监", "13800138001", "c-1"),
    ct("ct-2", "孙丽", "媒介经理", "13800138002", "c-1"),
    ct("ct-3", "刘建国", "分管副总", "13800138003", "c-1"),
    ct("ct-4", "陈静", "媒介总监", "13800138004", "c-2"),
    ct("ct-5", "李莉", "采购负责人", "13800138005", "c-3"),
    ct("ct-6", "王芳", "品牌经理", "13800138006", "c-4"),
    ct("ct-7", "赵磊", "副总", "13800138007", "c-5"),
    ct("ct-8", "周洁", "市场经理", "13800138008", "c-6", "离职"),
    ct("ct-9", "吴凯", "市场专员", "13800138009", "c-7"),
    ct("ct-10", "郑楠", "品牌总监", "13800138010", "c-9"),
    ct("ct-11", "何雪", "市场经理", "13800138011", "c-2"),
    ct("ct-12", "马涛", "采购经理", "13800138012", "c-3"),
  ];
  for (const x of contacts) await db.put("contacts", x);

  const rel = (id: string, contactId: string, customerId: string, role: Rel["role"]): Rel => ({ id, contactId, customerId, role });
  const rels: Rel[] = [
    rel("r-1", "ct-1", "c-1", "决策人DM"), rel("r-2", "ct-2", "c-1", "影响者"), rel("r-3", "ct-3", "c-1", "审批人"),
    rel("r-4", "ct-4", "c-2", "决策人DM"), rel("r-5", "ct-11", "c-2", "影响者"),
    rel("r-6", "ct-5", "c-3", "使用者"), rel("r-7", "ct-12", "c-3", "把关人"),
    rel("r-8", "ct-6", "c-4", "决策人DM"), rel("r-9", "ct-7", "c-5", "影响者"),
    rel("r-10", "ct-8", "c-6", "影响者"), rel("r-11", "ct-10", "c-9", "决策人DM"),
  ];
  for (const x of rels) await db.put("customerContactRels", x);

  const d = (id: string, customerId: string, title: string, stage: Deal["stage"], value: number, probability: number, touchDaysAgo: number): Deal =>
    ({ id, customerId, title, stage, value, probability, lastTouchAt: ago(touchDaysAgo) });
  const deals: Deal[] = [
    d("d-1", "c-1", "盛达集团 双11 整合投放", "签约", 950000, 1, 23),
    d("d-2", "c-2", "云裳服饰 双11 Campaign", "签约", 1200000, 0.95, 1),
    d("d-3", "c-4", "悦己美妆 新品种草", "商机", 560000, 0.5, 2),
    d("d-4", "c-3", "星海互动 Q4 效果投放", "商机", 180000, 0.4, 5),
    d("d-5", "c-5", "蓝湾文旅 冬季推广", "报价", 120000, 0.6, 4),
    d("d-6", "c-7", "恒诺电子 年终大促", "SQL", 80000, 0.3, 9),
    d("d-7", "c-8", "启程教育 春季招生", "MQL", 50000, 0.2, 12),
    d("d-8", "c-9", "味觉食品 年货节", "线索", 30000, 0.1, 20),
  ];
  for (const x of deals) await db.put("deals", x);

  const contracts: Contract[] = [
    { id: "ht-1", customerId: "c-2", name: "云裳服饰 全年框架", amount: 1200000, signDate: "2026-08-20", status: "履行中" },
    { id: "ht-2", customerId: "c-1", name: "盛达集团 双11 单点", amount: 950000, signDate: "2026-07-10", status: "履行中" },
    { id: "ht-3", customerId: "c-6", name: "腾达传媒 Q3 投放", amount: 600000, signDate: "2026-06-15", status: "履行中" },
    { id: "ht-4", customerId: "c-4", name: "悦己美妆 种草项目", amount: 400000, signDate: "2026-07-01", status: "履行中" },
    { id: "ht-5", customerId: "c-9", name: "味觉食品 中秋项目", amount: 200000, signDate: "2026-05-20", status: "已完成" },
    { id: "ht-6", customerId: "c-7", name: "恒诺电子 618 项目", amount: 150000, signDate: "2026-04-10", status: "已完成" },
  ];
  for (const x of contracts) await db.put("contracts", x);

  const p = (id: string, contractId: string, customerId: string, amount: number, dueOffset: number, status: Payment["status"], paid?: boolean): Payment =>
    ({ id, contractId, customerId, amount, dueDate: dateStr(dueOffset), status, paidDate: paid ? dateStr(dueOffset - 2) : undefined });
  const payments: Payment[] = [
    p("pm-1", "ht-1", "c-2", 600000, -30, "已收", true),
    p("pm-2", "ht-2", "c-1", 475000, -20, "已收", true),
    p("pm-3", "ht-3", "c-6", 300000, -10, "已收", true),
    p("pm-4", "ht-5", "c-9", 200000, -40, "已收", true),
    p("pm-5", "ht-4", "c-3", 180000, -12, "逾期"),
    p("pm-6", "ht-5", "c-5", 60000, -3, "逾期"),
    p("pm-7", "ht-2", "c-1", 95000, 5, "未到"),
    p("pm-8", "ht-4", "c-4", 40000, 15, "未到"),
  ];
  for (const x of payments) await db.put("payments", x);

  const tasks: Task[] = [
    { id: "t-1", title: "盛达报价跟进电话", type: "跟进", priority: "高", due: dateStr(0), kanbanCol: "待办", customerId: "c-1" },
    { id: "t-2", title: "双11 媒介排期表确认", type: "任务", priority: "高", due: dateStr(2), kanbanCol: "待办", customerId: "c-2" },
    { id: "t-3", title: "更新行业基准值表", type: "任务", priority: "低", kanbanCol: "待办" },
    { id: "t-4", title: "云裳达人名单内审", type: "跟进", priority: "高", due: dateStr(1), kanbanCol: "进行中", customerId: "c-2" },
    { id: "t-5", title: "星海催款函草拟", type: "跟进", priority: "高", kanbanCol: "进行中", customerId: "c-3" },
    { id: "t-6", title: "电梯媒体 Q4 框架谈判", type: "任务", priority: "中", kanbanCol: "进行中" },
    { id: "t-7", title: "悦己方案 V2 修订", type: "任务", priority: "中", kanbanCol: "进行中", customerId: "c-4" },
    { id: "t-8", title: "整理竞品投放监测表", type: "任务", priority: "低", kanbanCol: "进行中" },
    { id: "t-9", title: "月度费用记账", type: "费用", priority: "低", kanbanCol: "进行中", amount: 320 },
    { id: "t-10", title: "客户拜访纪要归档", type: "任务", priority: "中", kanbanCol: "待审核", customerId: "c-1" },
    { id: "t-11", title: "周复盘 AAR 草稿", type: "想法", priority: "中", kanbanCol: "完成" },
    { id: "t-12", title: "名片 OCR 批量建档", type: "客户", priority: "低", kanbanCol: "完成" },
  ];
  for (const x of tasks) await db.put("tasks", x);

  const objectives: Objective[] = [
    { id: "o-1", quarter: "Q3", title: "季度签约额 680 万", keyResults: [
      { name: "签约额 ¥680 万", progress: 68 },
      { name: "新签客户 8 家", progress: 50 },
      { name: "回款率 ≥ 90%", progress: 83 },
    ] },
  ];
  for (const x of objectives) await db.put("objectives", x);

  const cp = (id: string, customerId: string, channel: ContactPoint["channel"], dAgo: number, summary: string): ContactPoint =>
    ({ id, customerId, channel, time: ago(dAgo), summary });
  const cps: ContactPoint[] = [
    cp("cp-1", "c-1", "拜访", 6, "拜访沟通 Q4 投放框架,对电梯媒体兴趣高。"),
    cp("cp-2", "c-1", "邮件", 23, "发送报价单 V3(客户版脱敏,刊例版本 2026-Q3)。"),
    cp("cp-3", "c-1", "微信", 27, "微信确认全年预算 400-500 万区间。"),
    cp("cp-4", "c-2", "拜访", 1, "双11 排期确认会,3 个媒体位待锁定。"),
    cp("cp-5", "c-2", "微信", 3, "达人名单内部过审中。"),
    cp("cp-6", "c-3", "电话", 5, "催收尾款,承诺本周付款。"),
    cp("cp-7", "c-4", "拜访", 2, "新品种草方案讲解,倾向加大小红书预算。"),
    cp("cp-8", "c-5", "微信", 4, "冬季推广 brief 已接收。"),
    cp("cp-9", "c-6", "电话", 8, "年框续签意向确认,9/30 到期。"),
    cp("cp-10", "c-9", "邮件", 20, "年货节初步需求收集。"),
  ];
  for (const x of cps) await db.put("contactPoints", x);

  const milestones: Milestone[] = [
    { name: "Q4 预算季", date: dateStr(23) },
    { name: "双11 预热", date: dateStr(42) },
  ];
  await db.setSetting("milestones", milestones);
  await db.setSetting("theme", "dark");
  return true;
}

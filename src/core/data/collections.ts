/* ===== Collection 数据模型定义（复刻NocoBase数据建模）=====
 * 将现有25个IndexedDB store映射为运行时Collection定义。
 * UI可根据fields元数据自动生成表格/表单/筛选器（数据驱动UI）。
 * 纯新增，不影响现有types.ts类型定义。
 */

export type FieldType =
  | "string" | "text" | "number" | "date" | "select" | "boolean"
  | "relation" | "attachment" | "json";

export interface FieldDef {
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[];
  /** 关联定义 */
  relation?: { collection: string; type: "hasMany" | "belongsTo" };
  /** 表单跨列 2=整行 */
  span?: 1 | 2;
  /** 是否在列表中默认显示 */
  list?: boolean;
  /** 数字字段单位 */
  unit?: string;
}

export interface CollectionDef {
  name: string;
  label: string;
  /** 图标emoji，用于Builder面板 */
  icon: string;
  fields: Record<string, FieldDef>;
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  customers: {
    name: "customers",
    label: "客户",
    icon: "👥",
    fields: {
      id: { type: "string", label: "ID", required: true },
      name: { type: "string", label: "客户名称", required: true, list: true },
      industry: { type: "string", label: "行业", list: true },
      grade: { type: "select", label: "等级", options: ["S", "A", "B", "C"], list: true },
      parentId: { type: "relation", label: "上级客户", relation: { collection: "customers", type: "belongsTo" } },
      billingTitle: { type: "string", label: "开票抬头" },
      billingTaxNo: { type: "string", label: "税号" },
      custom: { type: "json", label: "自定义字段" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  contacts: {
    name: "contacts",
    label: "联系人",
    icon: "🧑‍💼",
    fields: {
      id: { type: "string", label: "ID", required: true },
      name: { type: "string", label: "姓名", required: true, list: true },
      phone: { type: "string", label: "电话", list: true },
      wechat: { type: "string", label: "微信" },
      title: { type: "string", label: "职位" },
      orgCustomerId: { type: "relation", label: "所属客户", relation: { collection: "customers", type: "belongsTo" }, list: true },
      employmentStatus: { type: "select", label: "在职状态", options: ["在职", "离职", "换岗"] },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  customerContactRels: {
    name: "customerContactRels",
    label: "客户联系人关联",
    icon: "🔗",
    fields: {
      id: { type: "string", label: "ID", required: true },
      contactId: { type: "relation", label: "联系人", relation: { collection: "contacts", type: "belongsTo" } },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" } },
      role: { type: "select", label: "角色", options: ["决策人DM", "影响者", "使用者", "把关人", "审批人"] },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  deals: {
    name: "deals",
    label: "商机",
    icon: "🎯",
    fields: {
      id: { type: "string", label: "ID", required: true },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" }, list: true },
      title: { type: "string", label: "商机名称", required: true, list: true },
      stage: { type: "select", label: "阶段", options: ["线索", "MQL", "SQL", "商机", "报价", "谈判", "签约", "输单", "流失"], list: true },
      value: { type: "number", label: "金额", unit: "元", list: true },
      probability: { type: "number", label: "胜率", unit: "%" },
      lastTouchAt: { type: "number", label: "最近接触时间" },
      custom: { type: "json", label: "自定义字段" },
      meddic: { type: "json", label: "MEDDIC" },
      bant: { type: "json", label: "BANT" },
      closeDate: { type: "date", label: "预计签约日期" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  contracts: {
    name: "contracts",
    label: "合同",
    icon: "📄",
    fields: {
      id: { type: "string", label: "ID", required: true },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" }, list: true },
      name: { type: "string", label: "合同名称", required: true, list: true },
      amount: { type: "number", label: "合同金额", unit: "元", list: true },
      signDate: { type: "date", label: "签约日期", list: true },
      status: { type: "string", label: "状态", list: true },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  payments: {
    name: "payments",
    label: "回款",
    icon: "💰",
    fields: {
      id: { type: "string", label: "ID", required: true },
      contractId: { type: "relation", label: "合同", relation: { collection: "contracts", type: "belongsTo" } },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" }, list: true },
      amount: { type: "number", label: "金额", unit: "元", list: true },
      dueDate: { type: "date", label: "应收到期日", list: true },
      paidDate: { type: "date", label: "实收日期" },
      status: { type: "select", label: "状态", options: ["未到", "已收", "逾期", "部分"], list: true },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  tasks: {
    name: "tasks",
    label: "任务",
    icon: "✅",
    fields: {
      id: { type: "string", label: "ID", required: true },
      title: { type: "string", label: "任务标题", required: true, list: true },
      type: { type: "select", label: "类型", options: ["跟进", "客户", "想法", "费用", "任务"] },
      priority: { type: "select", label: "优先级", options: ["高", "中", "低"], list: true },
      due: { type: "date", label: "截止日期" },
      kanbanCol: { type: "select", label: "看板列", options: ["待办", "进行中", "待审核", "完成"], list: true },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" } },
      amount: { type: "number", label: "金额", unit: "元" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  objectives: {
    name: "objectives",
    label: "目标",
    icon: "🏁",
    fields: {
      id: { type: "string", label: "ID", required: true },
      quarter: { type: "string", label: "季度", list: true },
      title: { type: "string", label: "目标名称", required: true, list: true },
      keyResults: { type: "json", label: "关键结果" },
    },
  },
  contactPoints: {
    name: "contactPoints",
    label: "接触点",
    icon: "🤝",
    fields: {
      id: { type: "string", label: "ID", required: true },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" }, list: true },
      channel: { type: "select", label: "渠道", options: ["微信", "拜访", "电话", "邮件"], list: true },
      time: { type: "number", label: "时间", list: true },
      summary: { type: "text", label: "内容摘要", list: true },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  pitches: {
    name: "pitches",
    label: "比稿",
    icon: "🏆",
    fields: {
      id: { type: "string", label: "ID", required: true },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" } },
      name: { type: "string", label: "比稿名称", required: true, list: true },
      date: { type: "date", label: "日期", list: true },
      investment: { type: "number", label: "投入", unit: "元" },
      competitors: { type: "string", label: "竞争对手" },
      result: { type: "select", label: "结果", options: ["胜", "败", "待定"], list: true },
      lossReason: { type: "string", label: "失利原因" },
      reviewNote: { type: "text", label: "复盘笔记" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  suppliers: {
    name: "suppliers",
    label: "供应商",
    icon: "🏭",
    fields: {
      id: { type: "string", label: "ID", required: true },
      name: { type: "string", label: "供应商名称", required: true, list: true },
      type: { type: "select", label: "类型", options: ["官方", "代理", "达人机构"], list: true },
      rebatePolicy: { type: "string", label: "返点政策" },
      intro: { type: "text", label: "简介" },
      contact: { type: "string", label: "联系方式" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  resources: {
    name: "resources",
    label: "媒介资源",
    icon: "📺",
    fields: {
      id: { type: "string", label: "ID", required: true },
      name: { type: "string", label: "资源名称", required: true, list: true },
      type: { type: "string", label: "资源类型", list: true },
      supplierId: { type: "relation", label: "供应商", relation: { collection: "suppliers", type: "belongsTo" } },
      intro: { type: "text", label: "简介" },
      advantage: { type: "text", label: "优势" },
      cases: { type: "text", label: "案例" },
      places: { type: "json", label: "点位" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  ratecards: {
    name: "ratecards",
    label: "刊例价",
    icon: "📊",
    fields: {
      id: { type: "string", label: "ID", required: true },
      resourceId: { type: "relation", label: "资源", relation: { collection: "resources", type: "belongsTo" } },
      version: { type: "string", label: "版本", list: true },
      effectiveFrom: { type: "date", label: "生效日期" },
      listPrice: { type: "number", label: "刊例价", unit: "元", list: true },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  scheduleItems: {
    name: "scheduleItems",
    label: "排期",
    icon: "📅",
    fields: {
      id: { type: "string", label: "ID", required: true },
      customerId: { type: "relation", label: "客户", relation: { collection: "customers", type: "belongsTo" }, list: true },
      name: { type: "string", label: "排期名称", required: true, list: true },
      resourceId: { type: "relation", label: "资源", relation: { collection: "resources", type: "belongsTo" } },
      start: { type: "date", label: "开始日期" },
      end: { type: "date", label: "结束日期" },
      cost: { type: "number", label: "成本", unit: "元" },
      sellPrice: { type: "number", label: "售价", unit: "元", list: true },
      rebate: { type: "number", label: "返点", unit: "元" },
      rebateSettled: { type: "boolean", label: "返点已结算" },
      status: { type: "select", label: "状态", options: ["已确认", "待确认"], list: true },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  postbuys: {
    name: "postbuys",
    label: "售后数据",
    icon: "📈",
    fields: {
      id: { type: "string", label: "ID", required: true },
      resourceId: { type: "relation", label: "资源", relation: { collection: "resources", type: "belongsTo" } },
      month: { type: "string", label: "月份", list: true },
      actualImpression: { type: "number", label: "实际曝光" },
      cpm: { type: "number", label: "CPM" },
      roi: { type: "number", label: "ROI" },
      ctr: { type: "number", label: "CTR" },
      clicks: { type: "number", label: "点击量" },
      thirdParty: { type: "string", label: "第三方" },
      dataSource: { type: "select", label: "数据来源", options: ["手动", "CSV回填"] },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  notes: {
    name: "notes",
    label: "笔记",
    icon: "📝",
    fields: {
      id: { type: "string", label: "ID", required: true },
      title: { type: "string", label: "标题", required: true, list: true },
      content: { type: "text", label: "内容" },
      tags: { type: "json", label: "标签" },
      para: { type: "select", label: "分类", options: ["Projects", "Areas", "Resources", "Archives"] },
      versions: { type: "json", label: "版本历史" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  baselines: {
    name: "baselines",
    label: "基线数据",
    icon: "📐",
    fields: {
      id: { type: "string", label: "ID", required: true },
      dimension: { type: "string", label: "维度", list: true },
      metric: { type: "string", label: "指标", list: true },
      value: { type: "string", label: "数值" },
      source: { type: "string", label: "来源" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  aars: {
    name: "aars",
    label: "复盘",
    icon: "🔍",
    fields: {
      id: { type: "string", label: "ID", required: true },
      period: { type: "string", label: "周期", list: true },
      stats: { type: "text", label: "数据" },
      lessons: { type: "text", label: "经验教训" },
      createdAt: { type: "number", label: "创建时间" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
  influencers: {
    name: "influencers",
    label: "达人",
    icon: "🌟",
    fields: {
      id: { type: "string", label: "ID", required: true },
      name: { type: "string", label: "达人名称", required: true, list: true },
      platform: { type: "select", label: "平台", options: ["抖音", "小红书", "B站", "微博", "快手"], list: true },
      followers: { type: "number", label: "粉丝数" },
      category: { type: "string", label: "领域" },
      tags: { type: "json", label: "标签" },
      contact: { type: "string", label: "联系方式" },
      history: { type: "text", label: "合作历史" },
      pricePerPost: { type: "number", label: "单条报价", unit: "元" },
      deletedAt: { type: "number", label: "删除时间" },
    },
  },
};

/** 获取所有Collection（含用户自定义，后续可从settings扩展） */
export function listCollections(): CollectionDef[] {
  return Object.values(COLLECTIONS);
}

/** 按名称获取Collection */
export function getCollection(name: string): CollectionDef | undefined {
  return COLLECTIONS[name];
}

/** 获取列表默认显示的字段 */
export function listFields(name: string): { key: string; def: FieldDef }[] {
  const col = COLLECTIONS[name];
  if (!col) return [];
  return Object.entries(col.fields)
    .filter(([, def]) => def.list && def.type !== "json")
    .map(([key, def]) => ({ key, def }));
}

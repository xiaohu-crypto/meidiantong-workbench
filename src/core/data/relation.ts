/* ===== 关联定义（复刻NocoBase Relation）=====
 * 现有数据模型的关联关系声明，用于详情区块/关联列表。
 */

export interface RelationDef {
  /** 当前Collection */
  from: string;
  /** 目标Collection */
  to: string;
  /** 关联类型 */
  type: "hasMany" | "belongsTo";
  /** 外键字段（belongsTo时本表字段；hasMany时对端表字段） */
  foreignKey: string;
  /** 关系名称 */
  label: string;
}

/** 预定义关联关系（基于现有数据模型外键） */
export const RELATIONS: RelationDef[] = [
  { from: "customers", to: "deals", type: "hasMany", foreignKey: "customerId", label: "商机" },
  { from: "customers", to: "contracts", type: "hasMany", foreignKey: "customerId", label: "合同" },
  { from: "customers", to: "payments", type: "hasMany", foreignKey: "customerId", label: "回款" },
  { from: "customers", to: "contactPoints", type: "hasMany", foreignKey: "customerId", label: "接触点" },
  { from: "customers", to: "tasks", type: "hasMany", foreignKey: "customerId", label: "任务" },
  { from: "customers", to: "contacts", type: "hasMany", foreignKey: "orgCustomerId", label: "联系人" },
  { from: "deals", to: "customers", type: "belongsTo", foreignKey: "customerId", label: "客户" },
  { from: "contracts", to: "customers", type: "belongsTo", foreignKey: "customerId", label: "客户" },
  { from: "payments", to: "contracts", type: "belongsTo", foreignKey: "contractId", label: "合同" },
  { from: "payments", to: "customers", type: "belongsTo", foreignKey: "customerId", label: "客户" },
  { from: "scheduleItems", to: "resources", type: "belongsTo", foreignKey: "resourceId", label: "资源" },
  { from: "resources", to: "suppliers", type: "belongsTo", foreignKey: "supplierId", label: "供应商" },
  { from: "resources", to: "ratecards", type: "hasMany", foreignKey: "resourceId", label: "刊例价" },
  { from: "resources", to: "scheduleItems", type: "hasMany", foreignKey: "resourceId", label: "排期" },
  { from: "resources", to: "postbuys", type: "hasMany", foreignKey: "resourceId", label: "售后数据" },
  { from: "contacts", to: "customerContactRels", type: "hasMany", foreignKey: "contactId", label: "客户关联" },
];

/** 获取某Collection的所有关联 */
export function relationsOf(collection: string): RelationDef[] {
  return RELATIONS.filter((r) => r.from === collection);
}

/** 获取某Collection的被引用关系 */
export function relationsTo(collection: string): RelationDef[] {
  return RELATIONS.filter((r) => r.to === collection);
}

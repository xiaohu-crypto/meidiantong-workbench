import { db } from "../db/db";

export interface SopScript {
  id: string;
  scene: string;
  text: string;
  builtin?: boolean;
}

/** 内置4模板(不可删除,可复制) */
export const BUILTIN_SCRIPTS: SopScript[] = [
  { id: "builtin-1", scene: "首次触达", text: "X 总您好,我是专注[行业]媒介投放的顾问。看到贵司近期在[节点]的动作,我们服务过同类客户的组合打法可将获客成本降低 20-30%,方便约 15 分钟交流吗?", builtin: true },
  { id: "builtin-2", scene: "报价跟进(沉默7天+)", text: "X 总,上次报价单(V3,基于 2026-Q3 刊例)不知是否收到?针对贵司量级我们可以再争取[返点/赠量]政策,本周内锁定还可保 Q4 排期优先权。", builtin: true },
  { id: "builtin-3", scene: "催款(逾期)", text: "X 总,合同[编号]尾款¥[金额]已于[到期日]到期,麻烦安排一下财务;如需对账单或发票重开,我这边马上配合。", builtin: true },
  { id: "builtin-4", scene: "年框续约", text: "X 总,今年合作复盘:整体 ROI 1:X,优于行业基准 1:2.5。明年框架若提前锁定,可保留今年返点政策并加赠 Q1 排期优先权。", builtin: true },
];

/** 获取所有话术(内置+自定义) */
export async function getAllScripts(): Promise<SopScript[]> {
  const custom = (await db.getSetting<SopScript[]>("sopScripts", [])) ?? [];
  return [...BUILTIN_SCRIPTS, ...custom];
}

/** 新增自定义话术 */
export async function addScript(scene: string, text: string): Promise<SopScript> {
  const custom = (await db.getSetting<SopScript[]>("sopScripts", [])) ?? [];
  const s: SopScript = { id: "custom-" + Date.now(), scene, text };
  await db.setSetting("sopScripts", [...custom, s]);
  return s;
}

/** 更新自定义话术 */
export async function updateScript(id: string, scene: string, text: string): Promise<void> {
  const custom = (await db.getSetting<SopScript[]>("sopScripts", [])) ?? [];
  await db.setSetting("sopScripts", custom.map((s) => s.id === id ? { ...s, scene, text } : s));
}

/** 删除自定义话术 */
export async function deleteScript(id: string): Promise<void> {
  const custom = (await db.getSetting<SopScript[]>("sopScripts", [])) ?? [];
  await db.setSetting("sopScripts", custom.filter((s) => s.id !== id));
}

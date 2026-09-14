/* ===== 配置持久化（复刻NocoBase Persistence）=====
 * 在settings store中保存flowModels（页面配置），不新建表。
 * 支持保存/加载/删除/列出用户自定义页面。
 */

import { db } from "../../db/db";
import type { FlowModel } from "./model";

const KEY = "flowModels";

export interface SavedPage {
  uid: string;
  name: string;
  updatedAt: number;
}

/** 读取全部已保存页面 */
export async function loadSavedPages(): Promise<FlowModel[]> {
  const raw = await db.getSetting<unknown>(KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw as FlowModel[];
}

/** 按uid查找页面 */
export async function loadPage(uid: string): Promise<FlowModel | undefined> {
  const pages = await loadSavedPages();
  return pages.find((p) => p.uid === uid);
}

/** 保存页面（新增或覆盖） */
export async function savePage(model: FlowModel): Promise<void> {
  const pages = await loadSavedPages();
  const idx = pages.findIndex((p) => p.uid === model.uid);
  const entry = { ...model, updatedAt: Date.now() };
  if (idx >= 0) pages[idx] = entry;
  else pages.push(entry);
  await db.setSetting(KEY, pages);
}

/** 删除页面 */
export async function deletePage(uid: string): Promise<void> {
  const pages = await loadSavedPages();
  await db.setSetting(KEY, pages.filter((p) => p.uid !== uid));
}

/** 页面概要列表 */
export async function listPageSummaries(): Promise<SavedPage[]> {
  const pages = await loadSavedPages();
  return pages.map((p) => {
    const stored = p as FlowModel & { updatedAt?: number };
    return { uid: p.uid, name: p.name ?? p.uid, updatedAt: stored.updatedAt ?? 0 };
  });
}

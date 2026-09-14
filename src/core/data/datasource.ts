/* ===== DataSource 数据源抽象（复刻NocoBase DataSource）=====
 * 当前实现：IndexedDB主数据源（复用现有db.ts）。
 * 预留多数据源接口：未来可扩展JSON文件/CSV/REST API。
 */

import { db, type StoreName } from "../../db/db";

export interface DataSource {
  readonly name: string;
  readonly kind: "indexeddb" | "json" | "rest";
  /** 读取Collection全部记录 */
  findAll(store: StoreName): Promise<unknown[]>;
  /** 写入单条 */
  putRecord(store: StoreName, record: { id: string }): Promise<void>;
  /** 删除 */
  removeRecord(store: StoreName, id: string): Promise<void>;
}

/** IndexedDB主数据源（现有db.ts适配） */
export class IndexedDbDataSource implements DataSource {
  readonly name = "主数据库";
  readonly kind = "indexeddb" as const;

  async findAll(store: StoreName): Promise<unknown[]> {
    return db.getAll(store);
  }

  async putRecord(store: StoreName, record: { id: string }): Promise<void> {
    await db.put(store, record as never);
  }

  async removeRecord(store: StoreName, id: string): Promise<void> {
    await db.purge(store, id);
  }
}

/** 全局数据源注册表 */
const sources = new Map<string, DataSource>();

/** 注册数据源 */
export function registerDataSource(ds: DataSource): void {
  sources.set(ds.name, ds);
}

/** 获取默认数据源（IndexedDB） */
export function defaultDataSource(): DataSource {
  if (!sources.has("主数据库")) registerDataSource(new IndexedDbDataSource());
  return sources.get("主数据库")!;
}

/** 按名称获取数据源 */
export function getDataSource(name: string): DataSource | undefined {
  return sources.get(name);
}

/** 列出全部数据源 */
export function listDataSources(): DataSource[] {
  return Array.from(sources.values());
}

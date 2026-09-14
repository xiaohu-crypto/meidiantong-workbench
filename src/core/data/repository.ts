/* ===== Repository 数据访问层（复刻NocoBase Repository）=====
 * 适配现有 db.ts（AES加密/软删除/审计全保留），提供统一CRUD入口。
 * 页面/Resource/Flow 通过 Repository 访问数据，不再直接调db。
 * 纯新增，不修改db.ts。
 */

import { db, type StoreName } from "../../db/db";

/** 生成唯一ID（与ui/common一致，避免UI层依赖） */
export function uid(prefix: string): string {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export interface HasId {
  id: string;
  deletedAt?: number;
}

/** 通用Repository：一个Collection一个实例 */
export class Repository<T extends HasId> {
  constructor(public readonly store: StoreName) {}

  /** 查询全部（过滤软删除） */
  async find(): Promise<T[]> {
    const rows = await db.getAll<T>(this.store);
    return rows.filter((r) => !r.deletedAt);
  }

  /** 查询全部（含已删除） */
  async findAllIncludingDeleted(): Promise<T[]> {
    return db.getAll<T>(this.store);
  }

  /** 按ID查询 */
  async findOne(id: string): Promise<T | undefined> {
    return db.get<T>(this.store, id);
  }

  /** 新增记录（触发工作流recordCreated；logWhat可选，缺省"创建"） */
  async create(data: Omit<T, "id">, logWhat?: string): Promise<T> {
    const rec = { ...data, id: uid(this.store) } as T;
    await db.put(this.store, rec, logWhat ?? "创建");
    void fireAfterWrite(this.store, rec, "recordCreated");
    return rec;
  }

  /** 更新记录（合并字段，触发工作流recordUpdated；logWhat可选，缺省"更新"） */
  async update(id: string, data: Partial<Omit<T, "id">>, logWhat?: string): Promise<T | undefined> {
    const cur = await db.get<T>(this.store, id);
    if (!cur) return undefined;
    const rec = { ...cur, ...data, id } as T;
    await db.put(this.store, rec, logWhat ?? "更新");
    void fireAfterWrite(this.store, rec, "recordUpdated");
    return rec;
  }

  /** 软删除（触发工作流recordDeleted；logWhat可选，缺省"删除"） */
  async destroy(id: string, logWhat?: string): Promise<void> {
    await db.softDelete(this.store, id, logWhat ?? "删除");
    void fireAfterWrite(this.store, { id } as T, "recordDeleted");
  }

  /** 恢复软删除 */
  async restore(id: string): Promise<void> {
    await db.restore(this.store, id);
  }

  /** 物理删除 */
  async purge(id: string): Promise<void> {
    await db.purge(this.store, id);
  }

  /** 批量新增 */
  async bulkCreate(list: Array<Omit<T, "id">>): Promise<T[]> {
    const recs = list.map((d) => ({ ...d, id: uid(this.store) } as T));
    await db.putMany(this.store, recs);
    return recs;
  }

  /** 按条件过滤 */
  async findWhere(predicate: (r: T) => boolean): Promise<T[]> {
    const all = await this.find();
    return all.filter(predicate);
  }
}

/** 预构建Repository实例（25个store） */
export const repos = {
  customers: new Repository<import("../../types").Customer>("customers"),
  contacts: new Repository<import("../../types").Contact>("contacts"),
  rels: new Repository<import("../../types").Rel>("customerContactRels"),
  deals: new Repository<import("../../types").Deal>("deals"),
  contracts: new Repository<import("../../types").Contract>("contracts"),
  payments: new Repository<import("../../types").Payment>("payments"),
  tasks: new Repository<import("../../types").Task>("tasks"),
  objectives: new Repository<import("../../types").Objective>("objectives"),
  cps: new Repository<import("../../types").ContactPoint>("contactPoints"),
  pitches: new Repository<import("../../types").Pitch>("pitches"),
  suppliers: new Repository<import("../../types").Supplier>("suppliers"),
  resources: new Repository<import("../../types").MediaResource>("resources"),
  ratecards: new Repository<import("../../types").RateCard>("ratecards"),
  items: new Repository<import("../../types").ScheduleItem>("scheduleItems"),
  postbuys: new Repository<import("../../types").PostBuy>("postbuys"),
  notes: new Repository<import("../../types").Note>("notes"),
  baselines: new Repository<import("../../types").Baseline>("baselines"),
  aars: new Repository<import("../../types").Aar>("aars"),
  influencers: new Repository<import("../../types").Influencer>("influencers"),
} as const;

/** 按store名获取Repository（通用） */
export function getRepo<T extends HasId>(store: StoreName): Repository<T> {
  return new Repository<T>(store);
}

/* ===== 自定义模型通用数据仓库（dynData）=====
 * 自定义 Collection 的记录统一存 db.ts 的 dynData store，按 collection 字段过滤。
 * 对外返回"行"形状（{ id, ...字段 }），与内置 store 的记录形状一致，
 * 供 TableBlock/FormBlock/DetailsBlock 等数据驱动组件无差别使用。
 */
export interface DynRecord extends HasId {
  collection: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface DynRow extends HasId {
  [key: string]: unknown;
}

export interface DynRepo {
  find(): Promise<DynRow[]>;
  create(data: Record<string, unknown>): Promise<DynRow>;
  update(id: string, data: Record<string, unknown>): Promise<DynRow | undefined>;
  destroy(id: string): Promise<void>;
}

export function getDynRepo(collection: string): DynRepo {
  const repo = new Repository<DynRecord>("dynData");
  return {
    async find(): Promise<DynRow[]> {
      const all = await repo.find();
      return all.filter((r) => r.collection === collection).map((r) => ({ id: r.id, ...r.data }));
    },
    async create(data: Record<string, unknown>): Promise<DynRow> {
      const now = Date.now();
      const rec = await repo.create({ collection, data, createdAt: now, updatedAt: now } as never);
      return { id: rec.id, ...rec.data };
    },
    async update(id: string, data: Record<string, unknown>): Promise<DynRow | undefined> {
      const cur = await repo.findOne(id);
      if (!cur) return undefined;
      const merged: DynRecord = { ...cur, data: { ...(cur.data ?? {}), ...data }, updatedAt: Date.now() };
      await db.put("dynData", merged, "更新");
      void fireAfterWrite("dynData", merged, "recordUpdated");
      return { id: merged.id, ...merged.data };
    },
    async destroy(id: string): Promise<void> {
      await repo.destroy(id);
    },
  };
}

/** 触发工作流记录事件（动态import避免循环依赖） */
function fireAfterWrite(store: string, record: HasId, event: "recordCreated" | "recordUpdated" | "recordDeleted"): void {
  void import("../workflow/triggers").then((m) => m.afterRecordWrite(store, record as unknown as Record<string, unknown>, event)).catch(() => { /* 工作流失败不影响主流程 */ });
}

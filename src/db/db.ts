import { openDB, type IDBPDatabase } from "idb";
import { ensureVault, encryptRecord, decryptRecord, vaultHasKey } from "../core/vault";

/** 仓库名清单(schema v1) */
export const STORES = [
  "meta", "customers", "contacts", "customerContactRels", "deals",
  "contracts", "payments", "tasks", "objectives", "contactPoints",
  "operationLogs", "settings",
  "pitches", "suppliers", "resources", "ratecards", "scheduleItems", "postbuys", "notes", "baselines", "aars",
  "influencers",
  "dynData",
] as const;

export type StoreName = (typeof STORES)[number];

export interface OpLog {
  id: string;
  ts: number;
  who: string;
  what: string;
  entityType: string;
  entityId: string;
  before: unknown | null;
}

const DB_NAME = "meidiantong";
const NEW_V2_STORES = ["pitches", "suppliers", "resources", "ratecards", "scheduleItems", "postbuys", "notes", "baselines", "aars", "influencers"];
const SCHEMA_VERSION = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

/** 幂等迁移表:up 仅在从 prevVersion 升级时执行 */
export const migrations: { version: number; up: (db: IDBPDatabase) => Promise<void> }[] = [
  {
    version: 1,
    up: async (db) => {
      for (const s of STORES) {
        if (!db.objectStoreNames.contains(s)) {
          const os = db.createObjectStore(s, { keyPath: "id" });
          // dynData：自定义模型通用容器，按 collection 索引过滤
          if (s === "dynData") os.createIndex("collection", "collection");
        }
      }
    },
  },
  {
    version: 2,
    up: async (db) => {
      for (const s of NEW_V2_STORES) {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
      }
    },
  },
  {
    version: 3,
    up: async (db) => {
      // 旧库（v1/v2 时代）升级：补充 dynData 容器与 collection 索引。
      // 新库由 v1 迁移直接建好（upgrade 期间不可再开事务，故此处仅处理旧库补建）。
      if (!db.objectStoreNames.contains("dynData")) {
        const os = db.createObjectStore("dynData", { keyPath: "id" });
        os.createIndex("collection", "collection");
      }
    },
  },
];

async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    await ensureVault(); // 密钥解析须在 openDB 前(版本 change 事务内不可等待非 IDB 异步)
    dbPromise = (async () => {
      const d = await openDB(DB_NAME, SCHEMA_VERSION, {
        upgrade: async (db, oldVersion) => {
          for (const m of migrations) {
            if (m.version > oldVersion) await m.up(db);
          }
        },
      });
      await encryptPlaintextLegacy(d); // 一次性静态加密迁移(幂等,见函数注释)
      return d;
    })();
  }
  return dbPromise;
}

/**
 * 静态加密数据迁移:存量明文库 → 全量加密(验收 8.1-6「迁移现有明文库」)。
 * 不能放在 versionchange 升级事务里:await WebCrypto 期间事务会自动提交;
 * 故开库后独立执行,逐仓读写各自独立事务,以 meta["enc:atRest"]=v1 为幂等标记,
 * 中断可续(已加密记录带 __enc 标记自动跳过)。
 */
async function encryptPlaintextLegacy(d: IDBPDatabase): Promise<void> {
  if (!vaultHasKey()) return;
  const flagRec = await decryptRecord<{ value?: string } | undefined>(await d.get("meta", "enc:atRest"));
  if (flagRec?.value === "v1") return;
  for (const s of STORES) {
    const rows = (await d.getAll(s)) as { id: string; __enc?: number }[];
    for (const row of rows) {
      if (row.__enc) continue;
      await d.put(s, await encryptRecord(row));
    }
  }
  await d.put("meta", await encryptRecord({ id: "enc:atRest", value: "v1" }));
}

function nowId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const db = {
  async put<T extends { id: string }>(store: StoreName, value: T, logWhat?: string): Promise<T> {
    const d = await getDB();
    const before = await decryptRecord(await d.get(store, value.id));
    const rec = { ...value, updatedAt: Date.now() } as T & { updatedAt: number };
    await putRec(d, store, rec);
    if (logWhat) await log(d, store, value.id, logWhat, before ?? null);
    return rec;
  },

  async get<T>(store: StoreName, id: string): Promise<T | undefined> {
    const d = await getDB();
    const raw = await d.get(store, id);
    return raw === undefined ? undefined : await decryptRecord<T>(raw);
  },

  async getAll<T>(store: StoreName): Promise<T[]> {
    const d = await getDB();
    return getAllDec<T>(d, store);
  },

  /** 批量写入:全部加密完成后单事务提交(性能:万级导入从分钟级降到秒级) */

  async putMany<T extends { id: string }>(store: StoreName, values: T[]): Promise<void> {

    const d = await getDB();

    const recs: unknown[] = [];

    for (const v of values) recs.push(await encryptRecord({ ...v, updatedAt: Date.now() }));

    const tx = d.transaction(store, "readwrite");

    const st = tx.objectStore(store);

    for (const r of recs) st.put(r);

    await tx.done;

  },



  /** 软删除:打 deletedAt 标记,主列表应过滤 */
  async softDelete(store: StoreName, id: string, what: string): Promise<void> {
    const d = await getDB();
    const rec = await decryptRecord<{ id: string; deletedAt?: number } | undefined>(await d.get(store, id));
    if (!rec) return;
    const before = { ...rec };
    rec.deletedAt = Date.now();
    await putRec(d, store, rec);
    await log(d, store, id, what, before);
  },

  async restore(store: StoreName, id: string): Promise<void> {
    const d = await getDB();
    const rec = await decryptRecord<{ deletedAt?: number } | undefined>(await d.get(store, id));
    if (!rec) return;
    delete rec.deletedAt;
    await putRec(d, store, rec);
  },

  async purge(store: StoreName, id: string): Promise<void> {
    const d = await getDB();
    await d.delete(store, id);
  },

  /** 回收站:全部仓中带 deletedAt 的记录 */
  async listTrashed(): Promise<{ store: StoreName; id: string; title: string; deletedAt: number }[]> {
    const d = await getDB();
    const out: { store: StoreName; id: string; title: string; deletedAt: number }[] = [];
    const titleFields = ["name", "title", "what"] as const;
    for (const s of STORES) {
      if (s === "meta" || s === "settings") continue;
      const rows = await getAllDec<{ id: string; deletedAt?: number }>(d, s);
      for (const r of rows) {
        if (r.deletedAt) {
          const any = r as unknown as Record<string, unknown>;
          const title = titleFields.map((f) => any[f]).find((v) => typeof v === "string") as string | undefined;
          out.push({ store: s, id: r.id, title: title ?? r.id, deletedAt: r.deletedAt });
        }
      }
    }
    return out;
  },

  async logOp(entry: Omit<OpLog, "id" | "ts" | "who"> & { who?: string }): Promise<void> {
    const d = await getDB();
    await putRec(d, "operationLogs", { id: nowId(), ts: Date.now(), who: entry.who ?? "本地用户", ...entry });
  },

  /** 撤销:按日志 before 快照恢复实体 */
  async undoLog(logId: string): Promise<void> {
    const d = await getDB();
    const entry = await decryptRecord<OpLog | undefined>(await d.get("operationLogs", logId));
    if (!entry) throw new Error("日志不存在");
    if (!entry.before) throw new Error("该操作无回滚快照(新建操作请用删除)");
    await putRec(d, entry.entityType as StoreName, entry.before);
  },

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const d = await getDB();
    const rec = await decryptRecord<{ id: string; value: T } | undefined>(await d.get("settings", key));
    return rec ? rec.value : fallback;
  },

  async setSetting<T>(key: string, value: T): Promise<void> {
    const d = await getDB();
    await putRec(d, "settings", { id: key, value });
  },

  /** 备份导出:全部仓 JSON */
  async dumpAll(): Promise<Record<string, unknown[]>> {
    const d = await getDB();
    const out: Record<string, unknown[]> = {};
    for (const s of STORES) out[s] = await getAllDec<unknown>(d, s);
    return out;
  },

  /** 恢复:逐仓覆盖 */
  async restoreAll(dump: Record<string, unknown[]>): Promise<void> {
    const d = await getDB();
    for (const s of STORES) {
      if (!dump[s]) continue;
      await d.clear(s);
      for (const row of dump[s]) await putRec(d, s, row);
    }
  },

  async clearAll(): Promise<void> {
    const d = await getDB();
    for (const s of STORES) await d.clear(s);
  },
};

/** 门面层加解密通道:写入前加密,读取后解密(静态加密唯一入口,别处不得直开 DB) */
async function putRec(d: IDBPDatabase, store: StoreName, rec: unknown): Promise<void> {
  await d.put(store, await encryptRecord(rec as { id: string }));
}

async function getAllDec<T>(d: IDBPDatabase, store: StoreName): Promise<T[]> {
  const rows = (await d.getAll(store)) as unknown[];
  return Promise.all(rows.map((r) => decryptRecord<T>(r)));
}

async function log(d: IDBPDatabase, store: string, entityId: string, what: string, before: unknown): Promise<void> {
  await putRec(d, "operationLogs", {
    id: nowId(), ts: Date.now(), who: "本地用户",
    what, entityType: store, entityId, before,
  });
}

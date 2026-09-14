/* ===== Resource 前端数据访问（复刻NocoBase Resource）=====
 * MultiRecordResource：列表/看板数据（data/loading/error/refresh/create/update/destroy）
 * SingleRecordResource：表单/详情数据（record/loading/save/destroy/refresh）
 * 内部调用 Repository，自动处理加载/错误/刷新状态。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRepo, getDynRepo, type HasId, type DynRow } from "../data/repository";
import { getCollection, getCollectionAllWithExt, type CollectionDef } from "../data/collections";
import { STORES } from "../../db/db";
import type { StoreName } from "../../db/db";

export interface ResourceState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (data: Omit<T, "id">) => Promise<T>;
  update: (id: string, data: Partial<Omit<T, "id">>) => Promise<T | undefined>;
  destroy: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
}

/** 多记录Resource：自动加载列表，支持刷新/增删改 */
export function useMultiRecordResource<T extends HasId>(store: StoreName): ResourceState<T> {
  const repo = useMemo(() => getRepo<T>(store), [store]);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await repo.find();
      setData(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (d: Omit<T, "id">) => {
    const rec = await repo.create(d);
    setData((prev) => [...prev, rec]);
    return rec;
  }, [repo]);

  const update = useCallback(async (id: string, d: Partial<Omit<T, "id">>) => {
    const rec = await repo.update(id, d);
    if (rec) setData((prev) => prev.map((r) => (r.id === id ? rec : r)));
    return rec;
  }, [repo]);

  const destroy = useCallback(async (id: string) => {
    await repo.destroy(id);
    setData((prev) => prev.filter((r) => r.id !== id));
  }, [repo]);

  const restore = useCallback(async (id: string) => {
    await repo.restore(id);
    await refresh();
  }, [repo, refresh]);

  return { data, loading, error, refresh, create, update, destroy, restore };
}

export interface SingleResourceState<T> {
  record: T | null;
  loading: boolean;
  error: string | null;
  /** 根据记录是否存在自动区分 新增/编辑 */
  isNew: boolean;
  save: (data: Omit<T, "id">) => Promise<T>;
  destroy: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

/** 单记录Resource：用于表单/详情，save自动区分新增与编辑 */
export function useSingleRecordResource<T extends HasId>(store: StoreName, id?: string | null): SingleResourceState<T> {
  const repo = useMemo(() => getRepo<T>(store), [store]);
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedId = useRef<string | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!id) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rec = await repo.findOne(id);
      setRecord(rec ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [repo, id]);

  useEffect(() => {
    if (loadedId.current !== id) {
      loadedId.current = id;
      void refresh();
    }
  }, [id, refresh]);

  const isNew = !id || !record;

  const save = useCallback(async (d: Omit<T, "id">) => {
    if (id && record) {
      const rec = await repo.update(id, d as Partial<Omit<T, "id">>);
      if (rec) setRecord(rec);
      return rec ?? record;
    }
    const rec = await repo.create(d);
    setRecord(rec);
    return rec;
  }, [repo, id, record]);

  const destroy = useCallback(async () => {
    if (!id) return;
    await repo.destroy(id);
    setRecord(null);
  }, [repo, id]);

  const reset = useCallback(() => {
    setRecord(null);
    setError(null);
  }, []);

  return { record, loading, error, isNew, save, destroy, refresh, reset };
}

/* ===== 自定义模型统一数据源 =====
 * 数据驱动组件（TableBlock/FormBlock/DetailsBlock）同时支持内置25 store 与
 * 用户自定义 Collection：内置走原 Repository；自定义走 dynData 通用容器。
 */

/** 是否为内置 store（非内置视为自定义模型） */
export function isBuiltinStore(store: string): boolean {
  return (STORES as readonly string[]).includes(store);
}

/** 获取 Collection 定义（内置+自定义+扩展字段，异步合并） */
export function useCollection(store: string): CollectionDef | undefined {
  const builtin = getCollection(store);
  const [col, setCol] = useState<CollectionDef | undefined>(builtin);
  useEffect(() => {
    let cancelled = false;
    void getCollectionAllWithExt(store).then((c) => { if (!cancelled) setCol(c); }).catch(() => {});
    return () => { cancelled = true; };
  }, [store]);
  return col;
}

/** 自定义模型多记录数据源（dynData 过滤） */
function useDynRecordList(collection: string): ResourceState<Record<string, unknown>> {
  const repo = useMemo(() => getDynRepo(collection), [collection]);
  const [data, setData] = useState<DynRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await repo.find());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (d: Record<string, unknown>) => {
    const rec = await repo.create(d);
    setData((prev) => [...prev, rec]);
    return rec;
  }, [repo]);

  const update = useCallback(async (id: string, d: Record<string, unknown>) => {
    const rec = await repo.update(id, d);
    if (rec) setData((prev) => prev.map((r) => (r.id === id ? rec : r)));
    return rec;
  }, [repo]);

  const destroy = useCallback(async (id: string) => {
    await repo.destroy(id);
    setData((prev) => prev.filter((r) => r.id !== id));
  }, [repo]);

  const restore = useCallback(async () => { await refresh(); }, [refresh]);

  return { data, loading, error, refresh, create, update, destroy, restore };
}

/** 统一多记录数据源：内置→Repository，自定义→dynData */
export function useStoreRecordList(store: string): ResourceState<Record<string, unknown>> {
  const isDyn = !isBuiltinStore(store);
  const builtin = useMultiRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName);
  const dyn = useDynRecordList(store);
  return isDyn ? (dyn as ResourceState<Record<string, unknown>>) : (builtin as unknown as ResourceState<Record<string, unknown>>);
}

export interface SingleRowState {
  record: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  isNew: boolean;
  save: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  destroy: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

/** 自定义模型单记录数据源 */
function useDynRecordSingle(store: string, id?: string | null): SingleRowState {
  const repo = useMemo(() => getDynRepo(store), [store]);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) { setRecord(null); setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await repo.find();
      setRecord(rows.find((r) => r.id === id) ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [repo, id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const isNew = !id || !record;

  const save = useCallback(async (d: Record<string, unknown>) => {
    if (id && record) {
      const rec = await repo.update(id, d);
      if (rec) setRecord(rec);
      return rec ?? record;
    }
    const rec = await repo.create(d);
    setRecord(rec);
    return rec;
  }, [repo, id, record]);

  const destroy = useCallback(async () => {
    if (!id) return;
    await repo.destroy(id);
    setRecord(null);
  }, [repo, id]);

  const reset = useCallback(() => { setRecord(null); setError(null); }, []);

  return { record, loading, error, isNew, save, destroy, refresh, reset };
}

/** 统一单记录数据源：内置→Repository，自定义→dynData */
export function useStoreRecordSingle(store: string, id?: string | null): SingleRowState {
  const isDyn = !isBuiltinStore(store);
  const builtin = useSingleRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName, id ?? null);
  const dyn = useDynRecordSingle(store, id);
  if (isDyn) return dyn;
  return {
    record: builtin.record as Record<string, unknown> | null,
    loading: builtin.loading,
    error: builtin.error,
    isNew: builtin.isNew,
    save: builtin.save as unknown as (d: Record<string, unknown>) => Promise<Record<string, unknown>>,
    destroy: builtin.destroy,
    refresh: builtin.refresh,
    reset: builtin.reset,
  };
}

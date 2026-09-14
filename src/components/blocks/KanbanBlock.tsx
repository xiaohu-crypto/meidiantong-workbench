/* ===== KanbanBlock 看板区块（复刻NocoBase KanbanBlock）=====
 * 绑定Collection的select字段作为列分组，卡片展示记录。
 * 支持HTML5拖拽跨列（更新分组字段值）。
 */

import { useMemo, useState } from "react";
import { useMultiRecordResource } from "../../core/resource/useResource";
import { getCollection } from "../../core/data/collections";
import { useT } from "../../core/i18n/useT";
import type { StoreName } from "../../db/db";

interface KanbanBlockProps {
  store: string;
  /** 分组字段（select类型） */
  groupField: string;
  /** 卡片标题字段 */
  titleField: string;
  /** 卡片副标题字段（可选） */
  subField?: string;
  /** 金额字段（可选，列头汇总） */
  amountField?: string;
  title?: string;
  editable?: boolean;
  onOpen?: (id: string) => void;
  notify?: (text: string, kind?: "ok" | "err" | "info") => void;
}

export function KanbanBlock({ store, groupField, titleField, subField, amountField, title, editable = true, onOpen, notify }: KanbanBlockProps) {
  const t = useT();
  const col = getCollection(store);
  const res = useMultiRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const groupDef = col?.fields[groupField];

  /** 列定义：分组字段的所有选项 */
  const columns = useMemo(() => {
    if (!groupDef || groupDef.type !== "select") return [];
    return groupDef.options ?? [];
  }, [groupDef]);

  const colAmounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of res.data) {
      const g = String(row[groupField] ?? "");
      if (!map[g]) map[g] = 0;
      if (amountField && typeof row[amountField] === "number") map[g] += row[amountField] as number;
    }
    return map;
  }, [res.data, groupField, amountField]);

  /** 未匹配任何列的记录 */
  const orphans = useMemo(() => res.data.filter((r) => !columns.includes(String(r[groupField] ?? ""))), [res.data, groupField, columns]);

  if (!col || !groupDef) return <div className="block-empty">看板区块需要有效的分组字段（select类型）</div>;

  async function handleDrop(target: string) {
    setOverCol(null);
    setDragId(null);
    if (!dragId) return;
    if (String(res.data.find((r) => r.id === dragId)?.[groupField] ?? "") === target) return;
    try {
      await res.update(dragId, { [groupField]: target } as never);
      notify?.(t("common.success"), "ok");
    } catch (e) {
      notify?.(e instanceof Error ? e.message : String(e), "err");
    }
  }

  return (
    <div className="kanban-block block-card">
      <div className="block-head">
        <span className="block-title">{title ?? col.label}</span>
        {columns.length === 0 ? <ChipSmall>{t("common.none")}</ChipSmall> : null}
      </div>
      <div className="kanban-scroll">
        <div className="kanban" style={{ gridTemplateColumns: `repeat(${columns.length + (orphans.length ? 1 : 0)},minmax(200px,1fr))` }}>
          {columns.map((g) => {
            const rows = res.data.filter((r) => String(r[groupField]) === g);
            return (
              <div key={g} className={"kcol" + (overCol === g ? " kcol-over" : "")}
                onDragOver={(e) => { e.preventDefault(); setOverCol(g); }}
                onDragLeave={() => setOverCol((c) => (c === g ? null : c))}
                onDrop={() => void handleDrop(g)}>
                <div className="kcol-head">
                  <span>{g}</span>
                  <span className="kcol-count">{rows.length}{amountField && colAmounts[g] ? ` · ${colAmounts[g].toLocaleString("zh-CN")}` : ""}</span>
                </div>
                <div className="kcol-body">
                  {rows.map((row) => (
                    <div key={String(row.id)} className="kcard"
                      draggable={editable}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(row.id)); e.dataTransfer.effectAllowed = "move"; setDragId(String(row.id)); }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      onClick={() => onOpen?.(String(row.id))}
                      style={onOpen ? { cursor: "pointer" } : undefined}>
                      <div className="kcard-title">{String(row[titleField] ?? "—")}</div>
                      {subField ? <div className="kcard-sub">{String(row[subField] ?? "")}</div> : null}
                    </div>
                  ))}
                  {rows.length === 0 ? <div className="kcol-empty">拖拽商机到此处</div> : null}
                </div>
              </div>
            );
          })}
          {orphans.length > 0 ? (
            <div className="kcol kcol-orphan">
              <div className="kcol-head"><span>{t("common.none")}</span><span className="kcol-count">{orphans.length}</span></div>
              <div className="kcol-body">
                {orphans.map((row) => (
                  <div key={String(row.id)} className="kcard" onClick={() => onOpen?.(String(row.id))}>
                    <div className="kcard-title">{String(row[titleField] ?? "—")}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ChipSmall({ children }: { children: React.ReactNode }) {
  return <span className="chip gray">{children}</span>;
}

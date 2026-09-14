/* ===== DetailsBlock 详情区块（复刻NocoBase DetailsBlock）=====
 * 展示单条记录的所有字段（字段区块），可切换编辑。
 * 数据源：useSingleRecordResource。
 */

import { useMemo } from "react";
import { useSingleRecordResource } from "../../core/resource/useResource";
import { getCollection, type FieldDef } from "../../core/data/collections";
import { Btn, Chip } from "../../ui/common";
import { useT } from "../../core/i18n/useT";
import type { StoreName } from "../../db/db";

interface DetailsBlockProps {
  store: string;
  recordId: string | null;
  onEdit?: () => void;
}

export function DetailsBlock({ store, recordId, onEdit }: DetailsBlockProps) {
  const t = useT();
  const col = getCollection(store);
  const res = useSingleRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName, recordId);

  const fields = useMemo(() => {
    if (!col) return [];
    return Object.entries(col.fields).filter(([k, f]) => k !== "id" && k !== "deletedAt" && f.type !== "json");
  }, [col]);

  if (!col) return <div className="block-empty">未找到数据模型：{store}</div>;
  if (res.loading) return <div className="block-empty">{t("common.loading")}</div>;
  if (!res.record) return <div className="block-empty">{t("common.empty")}</div>;

  const rec = res.record;

  return (
    <div className="details-block block-card">
      <div className="block-head">
        <span className="block-title">{col.label} · {String(rec[col.fields.name ? "name" : "title"] ?? rec.id)}</span>
        {onEdit ? <Btn sm kind="ghost" onClick={onEdit}>{t("common.edit")}</Btn> : null}
      </div>
      <div className="details-grid">
        {fields.map(([key, def]) => (
          <div key={key} className="details-item">
            <span className="details-label">{def.label}</span>
            <span className="details-value">{renderValue(def, rec[key])}</span>
          </div>
        ))}
      </div>
      {res.error ? <div className="details-error">{res.error}</div> : null}
    </div>
  );
}

function renderValue(def: FieldDef, v: unknown) {
  if (v === undefined || v === null || v === "") return <span className="details-muted">—</span>;
  switch (def.type) {
    case "select": return <Chip kind={chipKind(def.options?.indexOf(String(v)) ?? -1)}>{String(v)}</Chip>;
    case "boolean": return v ? "✓" : "✗";
    case "number": return def.unit ? `${Number(v).toLocaleString("zh-CN")} ${def.unit}` : Number(v).toLocaleString("zh-CN");
    case "text": return <span className="details-text">{String(v)}</span>;
    default: return String(v);
  }
}

function chipKind(idx: number): "brand" | "data" | "green" | "warn" | "danger" {
  const kinds: ("brand" | "data" | "green" | "warn" | "danger")[] = ["brand", "data", "green", "warn", "danger"];
  return idx >= 0 && idx < kinds.length ? kinds[idx] : "data";
}

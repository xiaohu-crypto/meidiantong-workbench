/* ===== ListBlock 列表区块（复刻NocoBase ListBlock）=====
 * 简单卡片列表：标题+副标题+摘要，点击回调。
 */

import { useMemo } from "react";
import { useMultiRecordResource } from "../../core/resource/useResource";
import { getCollection } from "../../core/data/collections";
import { useT } from "../../core/i18n/useT";
import type { StoreName } from "../../db/db";

interface ListBlockProps {
  store: string;
  titleField: string;
  subField?: string;
  descField?: string;
  title?: string;
  max?: number;
  onOpen?: (id: string) => void;
}

export function ListBlock({ store, titleField, subField, descField, title, max = 10, onOpen }: ListBlockProps) {
  const t = useT();
  const col = getCollection(store);
  const res = useMultiRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName);

  const rows = useMemo(() => res.data.slice(0, max), [res.data, max]);

  if (!col) return <div className="block-empty">未找到数据模型：{store}</div>;

  return (
    <div className="list-block block-card">
      <div className="block-head">
        <span className="block-title">{title ?? col.label}</span>
        <span className="chip data">{res.data.length}</span>
      </div>
      <div className="list-body">
        {rows.map((row) => (
          <div key={String(row.id)} className="list-item"
            onClick={() => onOpen?.(String(row.id))}
            style={onOpen ? { cursor: "pointer" } : undefined}>
            <div className="list-item-title">{String(row[titleField] ?? "—")}</div>
            {subField ? <div className="list-item-sub">{String(row[subField] ?? "")}</div> : null}
            {descField ? <div className="list-item-desc">{String(row[descField] ?? "")}</div> : null}
          </div>
        ))}
        {rows.length === 0 ? <div className="block-empty">{t("common.empty")}</div> : null}
      </div>
    </div>
  );
}

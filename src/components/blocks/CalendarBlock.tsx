/* ===== CalendarBlock 日历区块（复刻NocoBase CalendarBlock）=====
 * 按月展示Collection中date字段的记录（月视图）。
 */

import { useMemo, useState } from "react";
import { useMultiRecordResource } from "../../core/resource/useResource";
import { getCollection } from "../../core/data/collections";
import { Btn } from "../../ui/common";
import { useT } from "../../core/i18n/useT";
import type { StoreName } from "../../db/db";

interface CalendarBlockProps {
  store: string;
  /** 日期字段 */
  dateField: string;
  /** 标题字段 */
  titleField: string;
  title?: string;
  onOpen?: (id: string) => void;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export function CalendarBlock({ store, dateField, titleField, title, onOpen }: CalendarBlockProps) {
  const t = useT();
  const col = getCollection(store);
  const res = useMultiRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: ({ day: number | null; rows: Array<{ id: string; title: string }> })[] = [];
    for (let i = 0; i < startWeekday; i++) out.push({ day: null, rows: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const rows = res.data
        .filter((r) => String(r[dateField] ?? "").startsWith(dayStr))
        .map((r) => ({ id: String(r.id), title: String(r[titleField] ?? "—") }));
      out.push({ day: d, rows });
    }
    return out;
  }, [cursor, res.data, dateField, titleField]);

  if (!col) return <div className="block-empty">未找到数据模型：{store}</div>;

  const monthLabel = `${cursor.y}年${cursor.m + 1}月`;

  return (
    <div className="calendar-block block-card">
      <div className="block-head">
        <span className="block-title">{title ?? col.label}</span>
        <div className="block-tools">
          <Btn sm onClick={() => setCursor((c) => ({ y: c.m === 0 ? c.y - 1 : c.y, m: c.m === 0 ? 11 : c.m - 1 }))}>{t("common.prev")}</Btn>
          <span className="calendar-month">{monthLabel}</span>
          <Btn sm onClick={() => setCursor((c) => ({ y: c.m === 11 ? c.y + 1 : c.y, m: c.m === 11 ? 0 : c.m + 1 }))}>{t("common.next")}</Btn>
        </div>
      </div>
      <div className="calendar-grid">
        {WEEK.map((w) => <div key={w} className="calendar-week">{w}</div>)}
        {cells.map((cell, i) => (
          <div key={i} className={"calendar-cell" + (cell.day === null ? " empty" : "")}>
            {cell.day !== null ? (
              <>
                <span className="calendar-day">{cell.day}</span>
                {cell.rows.slice(0, 3).map((r) => (
                  <div key={r.id} className="calendar-event" onClick={() => onOpen?.(r.id)}>{r.title}</div>
                ))}
                {cell.rows.length > 3 ? <div className="calendar-more">+{cell.rows.length - 3}</div> : null}
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

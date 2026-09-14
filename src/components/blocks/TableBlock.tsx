/* ===== TableBlock 表格区块（复刻NocoBase TableBlock）=====
 * 绑定Collection自动生成表格：列/排序/筛选/分页/操作（新增/编辑/删除）。
 * 数据源：useMultiRecordResource（内部走Repository → db.ts）。
 */

import { useMemo, useState } from "react";
import { useMultiRecordResource } from "../../core/resource/useResource";
import { getCollection, listFields, type FieldDef } from "../../core/data/collections";
import { Btn, Chip, Modal, Field } from "../../ui/common";
import { validateRecord, serializeValue } from "../../core/data/field";
import { useT } from "../../core/i18n/useT";
import { uid } from "../../core/data/repository";
import type { StoreName } from "../../db/db";

interface TableBlockProps {
  store: string;
  title?: string;
  pageSize?: number;
  /** 允许行内操作（新增/编辑/删除） */
  editable?: boolean;
  onOpenDetail?: (id: string) => void;
  notify?: (text: string, kind?: "ok" | "err" | "info") => void;
}

export function TableBlock({ store, title, pageSize = 20, editable = true, onOpenDetail, notify }: TableBlockProps) {
  const t = useT();
  const col = getCollection(store);
  const res = useMultiRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<null | { id?: string }>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = useMemo(() => {
    if (!col) return [];
    return Object.entries(col.fields).filter(([, f]) => f.type !== "json");
  }, [col]);

  /** 列表展示字段（list标记优先，否则取前5个非id字段） */
  const shownFields = useMemo(() => {
    if (!col) return [];
    const listed = listFields(store);
    if (listed.length > 0) return listed.map((f) => ({ key: f.key, def: f.def }));
    return Object.entries(col.fields)
      .filter(([k, f]) => k !== "id" && f.type !== "json" && f.type !== "text")
      .slice(0, 5)
      .map(([key, def]) => ({ key, def }));
  }, [col, store]);

  const filtered = useMemo(() => {
    let rows = res.data;
    if (keyword) {
      const kw = keyword.toLowerCase();
      rows = rows.filter((r) => shownFields.some(({ key }) => String(r[key] ?? "").toLowerCase().includes(kw)));
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (av === bv) return 0;
        const cmp = (av ?? "") > (bv ?? "") ? 1 : -1;
        return sortDesc ? -cmp : cmp;
      });
    }
    return rows;
  }, [res.data, keyword, shownFields, sortKey, sortDesc]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (!col) return <div className="block-empty">未找到数据模型：{store}</div>;

  function openCreate() {
    setEditing({});
    setForm({});
    setErrors({});
  }
  function openEdit(row: Record<string, unknown>) {
    setEditing({ id: String(row.id) });
    setForm({ ...row });
    setErrors({});
  }
  async function submit() {
    if (!editing) return;
    if (!col) return;
    const errs = validateRecord(col.fields, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const data: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(col.fields)) {
      if (key === "id" || key === "deletedAt") continue;
      data[key] = serializeValue(def, form[key]);
    }
    try {
      if (editing.id) {
        await res.update(editing.id, data);
        notify?.(t("common.success"), "ok");
      } else {
        await res.create(data as never);
        notify?.(t("common.success"), "ok");
      }
      setEditing(null);
    } catch (e) {
      notify?.(e instanceof Error ? e.message : String(e), "err");
    }
  }
  async function remove(id: string) {
    try {
      await res.destroy(id);
      notify?.(t("common.success"), "ok");
    } catch (e) {
      notify?.(e instanceof Error ? e.message : String(e), "err");
    }
  }

  function renderCellValue(def: FieldDef, v: unknown): string {
    if (v === undefined || v === null || v === "") return "—";
    switch (def.type) {
      case "select": return String(v);
      case "boolean": return v ? "✓" : "✗";
      case "number": return def.unit ? `${Number(v).toLocaleString("zh-CN")} ${def.unit}` : Number(v).toLocaleString("zh-CN");
      case "date": return String(v);
      default: return String(v);
    }
  }

  return (
    <div className="table-block block-card">
      <div className="block-head">
        <span className="block-title">{title ?? col.label}</span>
        <div className="block-tools">
          <input className="inp inp-sm" placeholder={t("common.search")} value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
          {editable ? <Btn kind="primary" sm onClick={openCreate}>{t("common.add")}</Btn> : null}
        </div>
      </div>

      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {shownFields.map(({ key, def }) => (
                <th key={key} onClick={() => {
                  if (sortKey === key) setSortDesc(!sortDesc); else { setSortKey(key); setSortDesc(false); }
                }} style={{ cursor: "pointer" }}>
                  {def.label}{sortKey === key ? (sortDesc ? " ↓" : " ↑") : ""}
                </th>
              ))}
              {editable ? <th>{t("common.actions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={String(row.id)} className="tbl-row"
                onClick={() => onOpenDetail?.(String(row.id))}
                style={onOpenDetail ? { cursor: "pointer" } : undefined}>
                {shownFields.map(({ key, def }) => (
                  <td key={key}>{renderCellValue(def, row[key])}</td>
                ))}
                {editable ? (
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row-actions">
                      <Btn sm onClick={() => openEdit(row)}>{t("common.edit")}</Btn>
                      <Btn sm kind="danger" onClick={() => void remove(String(row.id))}>{t("common.delete")}</Btn>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr><td colSpan={shownFields.length + (editable ? 1 : 0)} className="tbl-empty">{t("common.empty")}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="block-pager">
          <Btn sm disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("common.prev")}</Btn>
          <Chip kind="data">{page} / {pages}</Chip>
          <Btn sm disabled={page >= pages} onClick={() => setPage(page + 1)}>{t("common.next")}</Btn>
        </div>
      ) : null}

      {editing ? (
        <Modal title={editing.id ? t("common.edit") + " · " + col.label : t("common.create") + " · " + col.label}
          onClose={() => setEditing(null)}
          footer={
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setEditing(null)}>{t("common.cancel")}</Btn>
              <Btn kind="primary" onClick={() => void submit()}>{t("common.save")}</Btn>
            </div>
          }>
          <div className="modal-form-grid">
            {fields.filter(([k]) => k !== "id" && k !== "deletedAt" && k !== "custom").map(([key, def]) => (
              <div key={key} className={def.span === 2 ? "span-2" : ""}>
                <Field label={def.label + (def.required ? " *" : "")} error={errors[key]}>
                  {renderInput(def, form[key], (v) => setForm((p) => ({ ...p, [key]: v })))}
                </Field>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function renderInput(def: FieldDef, value: unknown, onChange: (v: unknown) => void) {
  switch (def.type) {
    case "select":
      return (
        <select className="inp" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(def.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "number":
      return <input className="inp" type="number" value={String(value ?? "")} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />;
    case "date":
      return <input className="inp" type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "boolean":
      return (
        <label className="switch-line">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{value ? "✓" : "✗"}</span>
        </label>
      );
    case "text":
      return <textarea className="inp" rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "relation": {
      const target = def.relation?.collection;
      const relLabel = target ? getCollection(target)?.label ?? target : "关联";
      return (
        <input className="inp" placeholder={`${relLabel}ID`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      );
    }
    default:
      return <input className="inp" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** 供Builder使用：新建空id占位 */
export function newBlockUid(use: string): string {
  return uid(use);
}

/* ===== FormBlock 表单区块（复刻NocoBase FormBlock）=====
 * 绑定Collection自动生成表单：字段/校验/保存（新增或编辑）。
 * 数据源：useSingleRecordResource（save自动区分新增/编辑）。
 */

import { useEffect, useMemo, useState } from "react";
import { useSingleRecordResource } from "../../core/resource/useResource";
import { getCollection, type FieldDef } from "../../core/data/collections";
import { Btn, Field } from "../../ui/common";
import { validateRecord, serializeValue } from "../../core/data/field";
import { useT } from "../../core/i18n/useT";
import type { StoreName } from "../../db/db";

interface FormBlockProps {
  store: string;
  /** 编辑的记录id；缺省为新增 */
  recordId?: string | null;
  /** 保存后回调（返回新记录id） */
  onSaved?: (id: string) => void;
  /** 保存后是否自动关闭（父组件控制） */
  onClose?: () => void;
  notify?: (text: string, kind?: "ok" | "err" | "info") => void;
  /** 内联模式：隐藏操作按钮（由外部触发保存） */
  embedded?: boolean;
}

export function FormBlock({ store, recordId, onSaved, onClose, notify, embedded }: FormBlockProps) {
  const t = useT();
  const col = getCollection(store);
  const res = useSingleRecordResource<{ id: string; deletedAt?: number } & Record<string, unknown>>(store as StoreName, recordId ?? null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // 记录加载后回填表单
  useEffect(() => {
    if (res.record) setForm({ ...res.record });
    else if (!recordId) setForm({});
  }, [res.record, recordId]);

  const fields = useMemo(() => {
    if (!col) return [];
    return Object.entries(col.fields).filter(([k]) => k !== "id" && k !== "deletedAt" && k !== "custom");
  }, [col]);

  if (!col) return <div className="block-empty">未找到数据模型：{store}</div>;

  async function submit() {
    if (!col) return;
    const errs = validateRecord(col.fields, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      for (const [key, def] of Object.entries(col.fields)) {
        if (key === "id" || key === "deletedAt" || key === "custom") continue;
        data[key] = serializeValue(def, form[key]);
      }
      const saved = await res.save(data as never);
      notify?.(t("common.success"), "ok");
      onSaved?.(saved.id);
      if (onClose) onClose();
    } catch (e) {
      notify?.(e instanceof Error ? e.message : String(e), "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-block">
      <div className="modal-form-grid">
        {fields.map(([key, def]) => (
          <div key={key} className={def.span === 2 ? "span-2" : ""}>
            <Field label={def.label + (def.required ? " *" : "")} error={errors[key]}>
              {renderInput(def, form[key], (v) => setForm((p) => ({ ...p, [key]: v })))}
            </Field>
          </div>
        ))}
      </div>
      {!embedded ? (
        <div className="form-actions">
          <Btn onClick={onClose}>{t("common.cancel")}</Btn>
          <Btn kind="primary" disabled={saving} onClick={() => void submit()}>{saving ? t("common.loading") : t("common.save")}</Btn>
        </div>
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
      const relLabel = def.relation?.collection ? getCollection(def.relation.collection)?.label ?? def.relation.collection : "关联";
      return (
        <input className="inp" placeholder={`${relLabel}ID`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      );
    }
    default:
      return <input className="inp" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

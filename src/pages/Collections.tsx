/* ===== 数据建模页（复刻NocoBase Collections管理）=====
 * 查看内置模型+自定义模型，浏览/编辑字段定义。
 * - 内置模型：字段只读，可"添加扩展字段"（settings.customFields，合并展示，可删除）
 * - 自定义模型：可编辑结构（名称/图标/字段增删改，含必填/列表显示/下拉选项）
 * 保存后广播 data-changed(collections)，构建器数据源/我的页面实时刷新。
 */

import { useCallback, useEffect, useState } from "react";
import { db } from "../db/db";
import {
  listCollections,
  CUSTOM_COLLECTIONS_KEY,
  CUSTOM_FIELDS_KEY,
  type CollectionDef,
  type FieldDef,
  type FieldType,
  type CustomFieldDef,
} from "../core/data/collections";
import { FIELD_TYPES } from "../core/data/field";
import { useT } from "../core/i18n/useT";
import { Btn, Chip, Field, Modal } from "../ui/common";
import { TableBlock } from "../components/blocks/TableBlock";
import { getDynRepo } from "../core/data/repository";
import { emitDataChanged } from "../core/events";

/** 新建/编辑字段的草稿（options 用逗号分隔输入） */
interface FieldDraft {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  list?: boolean;
  options?: string;
}

function draftToDef(d: FieldDraft): FieldDef {
  const opts = (d.options ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return {
    type: d.type,
    label: d.label.trim() || d.key.trim() || "字段",
    required: d.required,
    list: d.list,
    options: opts.length > 0 ? opts : undefined,
  };
}

export default function CollectionsPage() {
  const t = useT();
  const [custom, setCustom] = useState<CollectionDef[]>([]);
  const [extFields, setExtFields] = useState<CustomFieldDef[]>([]);
  const [selected, setSelected] = useState<string>("customers");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CollectionDef | null>(null);
  const [addingExt, setAddingExt] = useState(false);
  const [sub, setSub] = useState<"结构" | "数据">("结构");

  const refresh = useCallback(async () => {
    const [stored, ext] = await Promise.all([
      db.getSetting<CollectionDef[]>(CUSTOM_COLLECTIONS_KEY, []),
      db.getSetting<CustomFieldDef[]>(CUSTOM_FIELDS_KEY, []),
    ]);
    setCustom(Array.isArray(stored) ? stored : []);
    setExtFields(Array.isArray(ext) ? ext : []);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const all = [...listCollections(), ...custom];
  const current = all.find((c) => c.name === selected) ?? all[0];

  async function addCustom(col: CollectionDef) {
    const next = [...custom, col];
    setCustom(next);
    await db.setSetting(CUSTOM_COLLECTIONS_KEY, next);
    emitDataChanged("collections");
  }

  async function updateCustom(col: CollectionDef) {
    const next = custom.map((c) => (c.name === col.name ? col : c));
    setCustom(next);
    await db.setSetting(CUSTOM_COLLECTIONS_KEY, next);
    emitDataChanged("collections");
  }

  async function removeCustom(name: string) {
    // 同步清理该自定义模型下的全部记录（dynData）
    const repo = getDynRepo(name);
    for (const r of await repo.find()) await repo.destroy(r.id);
    const next = custom.filter((c) => c.name !== name);
    setCustom(next);
    await db.setSetting(CUSTOM_COLLECTIONS_KEY, next);
    emitDataChanged("collections");
  }

  async function addExtField(f: Omit<CustomFieldDef, "id">) {
    const next = [...extFields, { ...f, id: `ext-${Date.now().toString(36)}` }];
    setExtFields(next);
    await db.setSetting(CUSTOM_FIELDS_KEY, next);
    emitDataChanged("collections");
  }

  async function removeExtField(id: string) {
    const next = extFields.filter((f) => f.id !== id);
    setExtFields(next);
    await db.setSetting(CUSTOM_FIELDS_KEY, next);
    emitDataChanged("collections");
  }

  /** 合并内置/自定义字段 + 扩展字段（扩展字段覆盖同名并追加在后） */
  function mergedFields(col: CollectionDef): Record<string, FieldDef> {
    const fields: Record<string, FieldDef> = { ...col.fields };
    for (const f of extFields) {
      if (f.entity !== col.name || !f.key || f.key === "id" || f.key === "deletedAt") continue;
      fields[f.key] = {
        type: f.type,
        label: f.label || f.key,
        required: f.required,
        list: f.list,
        options: f.options && f.options.length > 0 ? f.options : undefined,
      };
    }
    return fields;
  }

  const isCustomCol = current ? custom.some((c) => c.name === current.name) : false;
  const extForCurrent = extFields.filter((f) => f.entity === current?.name);

  return (
    <div className="page page-collections">
      <div className="h-row">
        <span className="h-title">{t("collection.title")}</span>
        <Btn sm kind="primary" onClick={() => setCreating(true)}>{t("collection.newCollection")}</Btn>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>{t("collection.desc")}（与「数据报表」区分：数据表负责定义模型与录入数据；数据报表展示经营仪表盘）</p>

      <div className="col-layout">
        <div className="col-side">
          {all.map((c) => (
            <div key={c.name} className={"col-item" + (selected === c.name ? " active" : "")} onClick={() => setSelected(c.name)}>
              <span className="col-icon">{c.icon}</span>
              <span className="col-label">{c.label}</span>
              <span className="col-name">{c.name}</span>
              {custom.some((x) => x.name === c.name) ? (
                <button className="col-del" title="删除自定义模型" onClick={(e) => { e.stopPropagation(); void removeCustom(c.name); }}>×</button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="col-detail">
          {current ? (
            <>
              <div className="col-head">
                <span className="col-title">{current.icon} {current.label}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Chip kind="data">{Object.keys(mergedFields(current)).length} 个字段</Chip>
                  {isCustomCol ? (
                    <Btn sm onClick={() => setEditing(current)}>编辑结构</Btn>
                  ) : (
                    <Btn sm onClick={() => setAddingExt(true)}>+ 添加扩展字段</Btn>
                  )}
                </div>
              </div>
              <div className="tabs" style={{ margin: "10px 0" }}>
                <span className={"tab" + (sub === "结构" ? " active" : "")} onClick={() => setSub("结构")}>结构</span>
                <span className={"tab" + (sub === "数据" ? " active" : "")} onClick={() => setSub("数据")}>数据</span>
              </div>
              {sub === "数据" ? (
                <TableBlock store={current.name} title={`${current.label} · 记录`} pageSize={10} editable notify={() => {}} />
              ) : (
                <div className="col-fields">
                  {Object.entries(mergedFields(current)).map(([key, f]) => {
                    const isExt = extForCurrent.some((e) => e.key === key);
                    return (
                      <div key={key} className="col-field">
                        <span className="col-field-name">{key}</span>
                        <span className="col-field-label">{f.label}</span>
                        <span className="col-field-type">{typeLabel(f)}</span>
                        {f.required ? <Chip kind="danger" gray={false}>必填</Chip> : null}
                        {f.list ? <Chip kind="brand">列表显示</Chip> : null}
                        {f.options ? <span className="col-field-options">{f.options.join(" / ")}</span> : null}
                        {isExt ? (
                          <button className="col-del" title="删除扩展字段" onClick={() => void removeExtField(extForCurrent.find((e) => e.key === key)!.id)}>×</button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : <p className="muted">未找到模型</p>}
        </div>
      </div>

      {creating ? (
        <CreateCollectionModal onClose={() => setCreating(false)} onCreate={async (col) => { await addCustom(col); setCreating(false); }} />
      ) : null}
      {editing ? (
        <EditCollectionModal initial={editing} onClose={() => setEditing(null)} onSave={async (col) => { await updateCustom(col); setEditing(null); }} />
      ) : null}
      {addingExt && current ? (
        <AddExtFieldModal entity={current.name} onClose={() => setAddingExt(false)} onSave={async (f) => { await addExtField(f); setAddingExt(false); }} />
      ) : null}
    </div>
  );
}

function typeLabel(f: FieldDef): string {
  const ft = FIELD_TYPES.find((x) => x.type === f.type);
  return ft?.label ?? f.type;
}

/** 字段编辑行（新建/编辑模型共用） */
function FieldRow({ f, onChange, onRemove }: { f: FieldDraft; onChange: (f: FieldDraft) => void; onRemove: () => void }) {
  return (
    <div className="col-create-field">
      <input className="inp" placeholder="字段名" value={f.key} onChange={(e) => onChange({ ...f, key: e.target.value })} />
      <input className="inp" placeholder="标签" value={f.label} onChange={(e) => onChange({ ...f, label: e.target.value })} />
      <select className="inp" value={f.type} onChange={(e) => onChange({ ...f, type: e.target.value as FieldType })}>
        {FIELD_TYPES.map((ft) => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
      </select>
      <label className="switch-line" title="必填"><input type="checkbox" checked={!!f.required} onChange={(e) => onChange({ ...f, required: e.target.checked })} /><span>必填</span></label>
      <label className="switch-line" title="列表显示"><input type="checkbox" checked={!!f.list} onChange={(e) => onChange({ ...f, list: e.target.checked })} /><span>列表</span></label>
      {f.type === "select" ? (
        <input className="inp" placeholder="选项(逗号分隔)" value={f.options ?? ""} onChange={(e) => onChange({ ...f, options: e.target.value })} />
      ) : null}
      <button className="icon-btn" onClick={onRemove}>×</button>
    </div>
  );
}

function CreateCollectionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (col: CollectionDef) => Promise<void> }) {
  const t = useT();
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📦");
  const [fields, setFields] = useState<FieldDraft[]>([
    { key: "name", label: "名称", type: "string", required: true, list: true },
  ]);

  async function submit() {
    if (!name.trim() || !label.trim()) return;
    const col: CollectionDef = {
      name: name.trim(),
      label: label.trim(),
      icon: icon.trim() || "📦",
      fields: {
        id: { type: "string", label: "ID", required: true },
      },
    };
    for (const f of fields) {
      if (!f.key.trim()) continue;
      const key = f.key.trim().replace(/\s+/g, "_");
      col.fields[key] = draftToDef(f);
    }
    await onCreate(col);
  }

  return (
    <Modal title={t("collection.newCollection")} onClose={onClose}
      footer={<><Btn onClick={onClose}>{t("common.cancel")}</Btn><Btn kind="primary" onClick={() => void submit()}>{t("common.save")}</Btn></>}>
      <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label={t("collection.name")}>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：activities" />
        </Field>
        <Field label={t("collection.label")}>
          <input className="inp" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例如：活动" />
        </Field>
        <Field label="图标(Emoji)">
          <input className="inp" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </Field>
        <div className="wf-detail-title">字段：</div>
        {fields.map((f, i) => (
          <FieldRow key={i} f={f} onChange={(nf) => setFields((p) => p.map((x, j) => (j === i ? nf : x)))} onRemove={() => setFields((p) => p.filter((_, j) => j !== i))} />
        ))}
        <Btn sm onClick={() => setFields((p) => [...p, { key: "", label: "", type: "string" }])}>+ {t("collection.addField")}</Btn>
      </div>
    </Modal>
  );
}

/** 编辑自定义模型结构（名称只读；字段增删改） */
function EditCollectionModal({ initial, onClose, onSave }: { initial: CollectionDef; onClose: () => void; onSave: (col: CollectionDef) => Promise<void> }) {
  const t = useT();
  const [label, setLabel] = useState(initial.label);
  const [icon, setIcon] = useState(initial.icon);
  const [fields, setFields] = useState<FieldDraft[]>(
    Object.entries(initial.fields)
      .filter(([k]) => k !== "id" && k !== "deletedAt")
      .map(([k, f]) => ({
        key: k,
        label: f.label,
        type: f.type,
        required: f.required,
        list: f.list,
        options: (f.options ?? []).join(", "),
      })),
  );

  async function submit() {
    const col: CollectionDef = {
      ...initial,
      label: label.trim() || initial.label,
      icon: icon.trim() || initial.icon,
      fields: {
        id: { type: "string", label: "ID", required: true },
      },
    };
    for (const f of fields) {
      if (!f.key.trim()) continue;
      const key = f.key.trim().replace(/\s+/g, "_");
      col.fields[key] = draftToDef(f);
    }
    await onSave(col);
  }

  return (
    <Modal title={`编辑模型 · ${initial.name}`} onClose={onClose}
      footer={<><Btn onClick={onClose}>{t("common.cancel")}</Btn><Btn kind="primary" onClick={() => void submit()}>{t("common.save")}</Btn></>}>
      <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label="模型名（不可修改）">
          <input className="inp" value={initial.name} disabled />
        </Field>
        <Field label={t("collection.label")}>
          <input className="inp" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="图标(Emoji)">
          <input className="inp" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </Field>
        <div className="wf-detail-title">字段：</div>
        {fields.map((f, i) => (
          <FieldRow key={i} f={f} onChange={(nf) => setFields((p) => p.map((x, j) => (j === i ? nf : x)))} onRemove={() => setFields((p) => p.filter((_, j) => j !== i))} />
        ))}
        <Btn sm onClick={() => setFields((p) => [...p, { key: "", label: "", type: "string" }])}>+ {t("collection.addField")}</Btn>
      </div>
    </Modal>
  );
}

/** 内置模型添加扩展字段（存 settings.customFields，随模型合并展示） */
function AddExtFieldModal({ entity, onClose, onSave }: { entity: string; onClose: () => void; onSave: (f: Omit<CustomFieldDef, "id">) => Promise<void> }) {
  const t = useT();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("string");
  const [required, setRequired] = useState(false);
  const [list, setList] = useState(true);
  const [options, setOptions] = useState("");

  async function submit() {
    if (!key.trim()) return;
    const opts = options.split(",").map((x) => x.trim()).filter(Boolean);
    await onSave({
      entity,
      key: key.trim().replace(/\s+/g, "_"),
      label: label.trim() || key.trim(),
      type,
      required,
      list,
      options: opts.length > 0 ? opts : undefined,
    });
  }

  return (
    <Modal title={`添加扩展字段 · ${entity}`} onClose={onClose}
      footer={<><Btn onClick={onClose}>{t("common.cancel")}</Btn><Btn kind="primary" onClick={() => void submit()}>{t("common.save")}</Btn></>}>
      <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label="字段名">
          <input className="inp" value={key} onChange={(e) => setKey(e.target.value)} placeholder="例如：channel" />
        </Field>
        <Field label="标签">
          <input className="inp" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例如：渠道" />
        </Field>
        <Field label="类型">
          <select className="inp" value={type} onChange={(e) => setType(e.target.value as FieldType)}>
            {FIELD_TYPES.map((ft) => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
          </select>
        </Field>
        {type === "select" ? (
          <Field label="选项(逗号分隔)">
            <input className="inp" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="抖音, 小红书, B站" />
          </Field>
        ) : null}
        <label className="switch-line"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /><span>必填</span></label>
        <label className="switch-line"><input type="checkbox" checked={list} onChange={(e) => setList(e.target.checked)} /><span>列表显示</span></label>
      </div>
    </Modal>
  );
}

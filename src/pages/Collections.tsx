/* ===== 数据建模页（复刻NocoBase Collections管理）=====
 * 查看内置25个模型+自定义模型，浏览字段定义。
 * 支持新建自定义模型（持久化到settings）。
 */

import { useCallback, useEffect, useState } from "react";
import { db } from "../db/db";
import { listCollections, type CollectionDef, type FieldDef, type FieldType } from "../core/data/collections";
import { FIELD_TYPES } from "../core/data/field";
import { useT } from "../core/i18n/useT";
import { Btn, Chip, Field, Modal } from "../ui/common";
import { TableBlock } from "../components/blocks/TableBlock";
import { getDynRepo } from "../core/data/repository";

const CUSTOM_KEY = "customCollections";

export default function CollectionsPage() {
  const t = useT();
  const [custom, setCustom] = useState<CollectionDef[]>([]);
  const [selected, setSelected] = useState<string>("customers");
  const [creating, setCreating] = useState(false);
  const [sub, setSub] = useState<"结构" | "数据">("结构");

  const refresh = useCallback(async () => {
    const stored = await db.getSetting<CollectionDef[]>(CUSTOM_KEY, []);
    setCustom(stored);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const all = [...listCollections(), ...custom];
  const current = all.find((c) => c.name === selected) ?? all[0];

  async function addCustom(col: CollectionDef) {
    const next = [...custom, col];
    setCustom(next);
    await db.setSetting(CUSTOM_KEY, next);
  }

  async function removeCustom(name: string) {
    // 同步清理该自定义模型下的全部记录（dynData）
    const repo = getDynRepo(name);
    for (const r of await repo.find()) await repo.destroy(r.id);
    const next = custom.filter((c) => c.name !== name);
    setCustom(next);
    await db.setSetting(CUSTOM_KEY, next);
  }

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
                <Chip kind="data">{Object.keys(current.fields).length} 个字段</Chip>
              </div>
              <div className="tabs" style={{ margin: "10px 0" }}>
                <span className={"tab" + (sub === "结构" ? " active" : "")} onClick={() => setSub("结构")}>结构</span>
                <span className={"tab" + (sub === "数据" ? " active" : "")} onClick={() => setSub("数据")}>数据</span>
              </div>
              {sub === "数据" ? (
                <TableBlock store={current.name} title={`${current.label} · 记录`} pageSize={10} editable notify={() => {}} />
              ) : (
                <div className="col-fields">
                  {Object.entries(current.fields).map(([key, f]) => (
                    <div key={key} className="col-field">
                      <span className="col-field-name">{key}</span>
                      <span className="col-field-label">{f.label}</span>
                      <span className="col-field-type">{typeLabel(f)}</span>
                      {f.required ? <Chip kind="danger" gray={false}>必填</Chip> : null}
                      {f.list ? <Chip kind="brand">列表显示</Chip> : null}
                      {f.options ? <span className="col-field-options">{f.options.join(" / ")}</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : <p className="muted">未找到模型</p>}
        </div>
      </div>

      {creating ? (
        <CreateCollectionModal onClose={() => setCreating(false)} onCreate={async (col) => { await addCustom(col); setCreating(false); }} />
      ) : null}
    </div>
  );
}

function typeLabel(f: FieldDef): string {
  const ft = FIELD_TYPES.find((x) => x.type === f.type);
  return ft?.label ?? f.type;
}

function CreateCollectionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (col: CollectionDef) => Promise<void> }) {
  const t = useT();
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<{ key: string; label: string; type: FieldType }[]>([
    { key: "name", label: "名称", type: "string" },
  ]);

  async function submit() {
    if (!name.trim() || !label.trim()) return;
    const col: CollectionDef = {
      name: name.trim(),
      label: label.trim(),
      icon: "📦",
      fields: {
        id: { type: "string", label: "ID", required: true },
      },
    };
    for (const f of fields) {
      if (!f.key.trim()) continue;
      col.fields[f.key.trim()] = { type: f.type, label: f.label.trim() || f.key.trim(), list: true };
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
        <div className="wf-detail-title">字段：</div>
        {fields.map((f, i) => (
          <div key={i} className="col-create-field">
            <input className="inp" placeholder="字段名" value={f.key} onChange={(e) => setFields((p) => p.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
            <input className="inp" placeholder="标签" value={f.label} onChange={(e) => setFields((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <select className="inp" value={f.type} onChange={(e) => setFields((p) => p.map((x, j) => (j === i ? { ...x, type: e.target.value as FieldType } : x)))}>
              {FIELD_TYPES.map((ft) => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
            </select>
            <button className="icon-btn" onClick={() => setFields((p) => p.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <Btn sm onClick={() => setFields((p) => [...p, { key: "", label: "", type: "string" }])}>+ {t("collection.addField")}</Btn>
      </div>
    </Modal>
  );
}

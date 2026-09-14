/* ===== Builder 设置面板（复刻NocoBase Builder Settings）=====
 * 编辑选中区块的props：根据Block类型动态渲染配置表单。
 */

import { useEffect, useState } from "react";
import { getCollection, listCollectionsAll, type CollectionDef } from "../../core/data/collections";
import { onDataChanged } from "../../core/events";
import { Btn, Field } from "../../ui/common";
import { useT } from "../../core/i18n/useT";
import type { FlowModel } from "../../core/model/model";
import { PALETTE_ITEMS } from "./Palette";

interface SettingsPanelProps {
  /** 当前选中的区块 */
  block: FlowModel | null;
  /** 页面级model */
  page: FlowModel;
  onUpdateBlock: (uid: string, patch: Partial<FlowModel>) => void;
  onUpdatePage: (patch: Partial<FlowModel>) => void;
  onDeleteBlock: (uid: string) => void;
}

/** 数据源列表（内置+自定义模型；监听数据表变更实时刷新） */
function useStores(): CollectionDef[] {
  const [stores, setStores] = useState<CollectionDef[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = () => { void listCollectionsAll().then((cs) => { if (!cancelled) setStores(cs); }).catch(() => {}); };
    load();
    const off = onDataChanged((src) => { if (src === "collections" || src === "records") load(); });
    return () => { cancelled = true; off(); };
  }, []);
  return stores;
}

export function SettingsPanel({ block, page, onUpdateBlock, onUpdatePage, onDeleteBlock }: SettingsPanelProps) {
  const t = useT();
  const meta = PALETTE_ITEMS.find((p) => p.use === block?.use);
  const stores = useStores();

  if (!block) {
    return (
      <div className="builder-settings">
        <div className="builder-panel-title">{t("builder.settings")}</div>
        <div className="settings-empty">{t("builder.addBlock")}</div>
      </div>
    );
  }

  return (
    <div className="builder-settings">
      <div className="builder-panel-title">{t("builder.settings")}</div>
      <div className="settings-scroll">
        <Field label={t("builder.pageName")}>
          <input className="inp" value={page.name ?? ""} onChange={(e) => onUpdatePage({ name: e.target.value })} />
        </Field>

        <Field label={t("block.title")}>
          <input className="inp" value={String(block.props?.title ?? "")} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, title: e.target.value } })} />
        </Field>

        {meta?.use === "MarkdownBlock" ? (
          <Field label="内容（Markdown）">
            <textarea className="inp" rows={6} value={String(block.props?.content ?? "")} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, content: e.target.value } })} />
          </Field>
        ) : null}

        {block.use === "TableBlock" || block.use === "FormBlock" || block.use === "DetailsBlock" ? (
          <>
            <Field label={t("block.collection")}>
              <select className="inp" value={String(block.props?.store ?? "")} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, store: e.target.value } })}>
                {stores.map((c) => <option key={c.name} value={c.name}>{c.label}（{c.name}）</option>)}
              </select>
            </Field>
            {(() => {
              const selStore = String(block.props?.store ?? "");
              const col = stores.find((c) => c.name === selStore);
              if (!col) return null;
              const keys = Object.keys(col.fields).filter((k) => k !== "id" && k !== "deletedAt" && k !== "custom");
              const chosen: string[] = Array.isArray(block.props?.fields) ? (block.props.fields as string[]) : [];
              return (
                <Field label="显示/表单字段（留空=全部）">
                  <div className="field-pick-list">
                    {keys.map((k) => (
                      <label key={k} className="switch-line">
                        <input type="checkbox" checked={chosen.includes(k)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...chosen, k] : chosen.filter((x) => x !== k);
                            onUpdateBlock(block.uid, { props: { ...block.props, fields: next } });
                          }} />
                        <span>{col.fields[k].label}（{k}）</span>
                      </label>
                    ))}
                  </div>
                </Field>
              );
            })()}
          </>
        ) : null}

        {block.use === "KanbanBlock" ? (
          <KanbanSettings block={block} onUpdateBlock={onUpdateBlock} />
        ) : null}

        {block.use === "CalendarBlock" || block.use === "ListBlock" ? (
          <>
            <Field label={t("block.collection")}>
              <select className="inp" value={String(block.props?.store ?? "")} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, store: e.target.value } })}>
                {stores.map((c) => <option key={c.name} value={c.name}>{c.label}（{c.name}）</option>)}
              </select>
            </Field>
            <Field label={meta?.use === "CalendarBlock" ? "日期字段" : "标题字段"}>
              <input className="inp" value={String(block.props?.dateField ?? block.props?.titleField ?? "")}
                onChange={(e) => onUpdateBlock(block.uid, {
                  props: meta?.use === "CalendarBlock"
                    ? { ...block.props, dateField: e.target.value }
                    : { ...block.props, titleField: e.target.value },
                })} />
            </Field>
          </>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <Btn kind="danger" sm onClick={() => onDeleteBlock(block.uid)}>{t("builder.removeBlock")}</Btn>
        </div>
      </div>
    </div>
  );
}

function KanbanSettings({ block, onUpdateBlock }: { block: FlowModel; onUpdateBlock: (uid: string, patch: Partial<FlowModel>) => void }) {
  const t = useT();
  const store = String(block.props?.store ?? "");
  const col = getCollection(store);
  const stores = useStores();
  const selectFields = col ? Object.entries(col.fields).filter(([, f]) => f.type === "select") : [];
  return (
    <>
      <Field label={t("block.collection")}>
        <select className="inp" value={store} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, store: e.target.value } })}>
          {stores.map((c) => <option key={c.name} value={c.name}>{c.label}（{c.name}）</option>)}
        </select>
      </Field>
      <Field label="分组字段">
        <select className="inp" value={String(block.props?.groupField ?? "")} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, groupField: e.target.value } })}>
          {selectFields.map(([k, f]) => <option key={k} value={k}>{f.label}（{k}）</option>)}
        </select>
      </Field>
      <Field label="标题字段">
        <input className="inp" value={String(block.props?.titleField ?? "")} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, titleField: e.target.value } })} />
      </Field>
      <Field label="金额字段（列头汇总，可选）">
        <input className="inp" value={String(block.props?.amountField ?? "")} onChange={(e) => onUpdateBlock(block.uid, { props: { ...block.props, amountField: e.target.value } })} />
      </Field>
    </>
  );
}

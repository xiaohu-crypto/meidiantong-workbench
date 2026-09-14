/* ===== Builder 页面构建器主界面（复刻NocoBase Builder）=====
 * 三栏布局：Palette（组件面板） | Canvas（画布） | SettingsPanel（设置面板）
 * 支持：添加/删除/重排区块、页面配置、保存/预览、已保存页面管理。
 */

import { useEffect, useState } from "react";
import { useT } from "../../core/i18n/useT";
import { Btn, Chip } from "../../ui/common";
import { FlowModel, modelUid } from "../../core/model/model";
import { modelRegistry, type ModelRenderCtx } from "../../core/model/registry";
import { registerBuiltinModels } from "../../core/model/blocks";
import { savePage, deletePage, loadPage, listPageSummaries } from "../../core/model/persist";
import { getCollection } from "../../core/data/collections";
import { Palette, PALETTE_ITEMS, type PaletteItem } from "./Palette";
import { SettingsPanel } from "./SettingsPanel";
import { engine } from "../../core/flow/engine";

/** 确保内置模型已注册（幂等） */
let builtinRegistered = false;
function ensureBuiltin() {
  if (!builtinRegistered) {
    registerBuiltinModels();
    builtinRegistered = true;
  }
}

export function Builder() {
  const t = useT();
  ensureBuiltin();

  const [page, setPage] = useState<FlowModel>(() => ({ uid: modelUid("page"), use: "PageModel", name: "新页面", children: [] }));
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [savedPages, setSavedPages] = useState<Array<{ uid: string; name: string; updatedAt: number }>>([]);
  const [saved, setSaved] = useState(false);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  useEffect(() => { void refreshPages(); }, []);

  async function refreshPages() {
    setSavedPages(await listPageSummaries());
  }

  const selectedBlock = selected ? page.children?.find((c) => c.uid === selected) ?? null : null;

  /** 构建ModelRenderCtx（预览模式用） */
  const renderCtx: ModelRenderCtx = {
    refresh: (store) => engine.emitEvent({ type: "refresh", payload: { store } }),
    openForm: (store, id) => engine.emitEvent({ type: "openForm", payload: { store, id } }),
    openDetail: (store, id) => engine.emitEvent({ type: "openDetail", payload: { store, id } }),
    notify: (text, kind) => engine.emitEvent({ type: "notify", payload: { text, kind } }),
    nav: (view, params) => window.dispatchEvent(new CustomEvent("nav", { detail: params ? { view, ...params } : view })),
    getCollection,
  };

  function addBlock(item: PaletteItem) {
    const block: FlowModel = {
      uid: modelUid(item.use.slice(0, 2).toLowerCase()),
      use: item.use,
      name: item.label,
      props: { ...item.defaults },
    };
    setPage((p) => ({ ...p, children: [...(p.children ?? []), block] }));
    setSelected(block.uid);
    setSaved(false);
  }

  function updateBlock(uid: string, patch: Partial<FlowModel>) {
    setPage((p) => ({ ...p, children: (p.children ?? []).map((c) => (c.uid === uid ? { ...c, ...patch } : c)) }));
    setSaved(false);
  }

  function updatePage(patch: Partial<FlowModel>) {
    setPage((p) => ({ ...p, ...patch }));
    setSaved(false);
  }

  function deleteBlock(uid: string) {
    setPage((p) => ({ ...p, children: (p.children ?? []).filter((c) => c.uid !== uid) }));
    setSelected(null);
    setSaved(false);
  }

  function moveBlock(from: number, to: number) {
    setPage((p) => {
      const children = [...(p.children ?? [])];
      if (from < 0 || from >= children.length) return p;
      const [moved] = children.splice(from, 1);
      children.splice(to, 0, moved);
      return { ...p, children };
    });
  }

  async function handleSave() {
    await savePage(page);
    setSaved(true);
    setSavedPages(await listPageSummaries());
  }

  function loadPageModel(m: FlowModel) {
    setPage(m);
    setSelected(null);
    setSaved(true);
  }

  async function handleDeletePage(uid: string) {
    if (page.uid === uid) {
      setPage({ uid: modelUid("page"), use: "PageModel", name: "新页面", children: [] });
      setSelected(null);
    }
    await deletePage(uid);
    await refreshPages();
  }

  function newPage() {
    setPage({ uid: modelUid("page"), use: "PageModel", name: "新页面", children: [] });
    setSelected(null);
  }

  return (
    <div className="builder">
      {/* 顶部工具栏 */}
      <div className="builder-toolbar">
        <div className="builder-toolbar-left">
          <Btn sm kind={mode === "edit" ? "primary" : "ghost"} onClick={() => setMode("edit")}>{t("builder.edit")}</Btn>
          <Btn sm kind={mode === "preview" ? "primary" : "ghost"} onClick={() => setMode("preview")}>{t("builder.preview")}</Btn>
          {saved ? <Chip kind="green">已保存</Chip> : null}
        </div>
        <div className="builder-toolbar-right">
          <Btn sm onClick={newPage}>新建页面</Btn>
          <Btn sm kind="primary" onClick={() => void handleSave()}>{t("builder.save")}</Btn>
        </div>
      </div>

      {/* 已保存页面列表 */}
      {savedPages.length > 0 ? (
        <div className="builder-pages">
          {savedPages.map((sp) => (
            <div key={sp.uid} className={"builder-page-chip" + (sp.uid === page.uid ? " active" : "")}>
              <span className="builder-page-name" onClick={() => void loadSaved(sp.uid)}>{sp.name}</span>
              <button className="builder-page-del" title="删除页面" onClick={() => void handleDeletePage(sp.uid)}>×</button>
            </div>
          ))}
        </div>
      ) : null}

      {/* 三栏布局 */}
      <div className="builder-layout">
        <Palette onAdd={addBlock} />

        <div className="builder-canvas"
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const use = e.dataTransfer.getData("application/x-block");
            const item = PALETTE_ITEMS.find((p) => p.use === use);
            if (item) addBlock(item);
          }}>
          <div className="builder-canvas-head">
            <input className="inp" value={page.name ?? ""} onChange={(e) => updatePage({ name: e.target.value })} placeholder="页面名称" />
          </div>

          {mode === "preview" ? (
            <div className="builder-preview-body">
              {renderPreview(page, renderCtx)}
            </div>
          ) : (
            <div className="builder-canvas-body">
              {(page.children ?? []).map((child, idx) => (
                <div key={child.uid}
                  className={"builder-block-card" + (selected === child.uid ? " selected" : "") + (dropIdx === idx ? " drop-target" : "")}
                  onClick={() => setSelected(child.uid)}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(idx)); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { e.preventDefault(); setDropIdx(idx); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const from = Number(e.dataTransfer.getData("text/plain"));
                    if (!Number.isNaN(from)) moveBlock(from, idx);
                    setDropIdx(null);
                  }}
                  onDragEnd={() => setDropIdx(null)}>
                  <div className="builder-block-label">
                    <span>{PALETTE_ITEMS.find((p) => p.use === child.use)?.icon} {PALETTE_ITEMS.find((p) => p.use === child.use)?.label}</span>
                    <span className="builder-block-uid">{child.use}</span>
                  </div>
                  <div className="builder-block-mini">{renderPreview(child, renderCtx)}</div>
                </div>
              ))}
              {(page.children ?? []).length === 0 ? (
                <div className="builder-canvas-empty">{t("builder.dragHint")}</div>
              ) : null}
            </div>
          )}
        </div>

        <SettingsPanel block={selectedBlock} page={page}
          onUpdateBlock={updateBlock}
          onUpdatePage={updatePage}
          onDeleteBlock={deleteBlock} />
      </div>
    </div>
  );

  async function loadSaved(uid: string) {
    const m = await loadPage(uid);
    if (m) loadPageModel(m);
  }
}

/** 渲染模型（编辑模式用轻量版） */
function renderPreview(model: FlowModel, ctx: ModelRenderCtx) {
  const factory = modelRegistry.resolve(model.use);
  if (!factory) return <div className="model-unknown">未知区块：{model.use}</div>;
  return factory(model, ctx);
}

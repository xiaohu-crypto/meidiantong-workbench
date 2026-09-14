/* ===== 我的页面 =====
 * 运行入口：列出页面构建器中已保存的页面，点击进入全屏运行视图。
 * 运行视图直接渲染 FlowModel（TableBlock/FormBlock/Kanban/Calendar 等），
 * 数据交互经 FlowEngine 桥接到 App 全局（新增/编辑/详情/刷新/通知）。
 */

import { useCallback, useEffect, useState } from "react";
import { loadPage, listPageSummaries } from "../core/model/persist";
import type { FlowModel } from "../core/model/model";
import { renderModel } from "../core/model/renderer";
import { registerBuiltinModels } from "../core/model/blocks";
import type { ModelRenderCtx } from "../core/model/registry";
import { engine } from "../core/flow/engine";
import { getCollection } from "../core/data/collections";
import { Btn } from "../ui/common";
import { onDataChanged } from "../core/events";
import { IconLayout } from "../components/icons";

/** 确保内置模型已注册（幂等） */
let builtinRegistered = false;
function ensureBuiltin() {
  if (!builtinRegistered) {
    registerBuiltinModels();
    builtinRegistered = true;
  }
}

export default function MyPages() {
  ensureBuiltin();

  const [pages, setPages] = useState<Array<{ uid: string; name: string; updatedAt: number }>>([]);
  const [running, setRunning] = useState<FlowModel | null>(null);
  const [opening, setOpening] = useState(false);

  const refresh = useCallback(async () => {
    setPages(await listPageSummaries());
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // 数据变更实时刷新：构建器保存/删除页面后列表自动更新（无需重挂载/手动刷新）
  useEffect(() => {
    const off = onDataChanged((src) => {
      if (src === "pages" || src === "collections") void refresh();
    });
    return off;
  }, [refresh]);

  /** 运行视图的渲染上下文（与构建器预览一致，经 FlowEngine 桥接全局交互） */
  const renderCtx: ModelRenderCtx = {
    refresh: (store) => engine.emitEvent({ type: "refresh", payload: { store } }),
    openForm: (store, id) => engine.emitEvent({ type: "openForm", payload: { store, id } }),
    openDetail: (store, id) => engine.emitEvent({ type: "openDetail", payload: { store, id } }),
    notify: (text, kind) => engine.emitEvent({ type: "notify", payload: { text, kind } }),
    nav: (view, params) => window.dispatchEvent(new CustomEvent("nav", { detail: params ? { view, ...params } : view })),
    getCollection,
  };

  async function openPage(uid: string) {
    setOpening(true);
    try {
      const m = await loadPage(uid);
      if (m) setRunning(m);
    } finally {
      setOpening(false);
    }
  }

  function editPage(uid: string) {
    // 交回 App 桥接：切换视图到"页面构建器"并载入该页面
    engine.emitEvent({ type: "openBuilder", payload: { pageUid: uid } });
  }

  /* ---- 运行视图 ---- */
  if (running) {
    return (
      <div className="page page-mypages">
        <div className="mypages-runbar">
          <Btn sm kind="ghost" onClick={() => setRunning(null)}>← 返回列表</Btn>
          <span className="mypages-runtitle">{running.name}</span>
          <span className="mypages-run-actions">
            <Btn sm kind="ghost" onClick={() => editPage(running.uid)}>编辑</Btn>
            <Btn sm onClick={() => void window.mta?.windowMaximize?.()}>全屏</Btn>
          </span>
        </div>
        <div className="mypages-runtime">
          {(running.children ?? []).map((child) => (
            <div key={child.uid} className="model-child">{renderModel(child, renderCtx)}</div>
          ))}
          {(running.children ?? []).length === 0 ? (
            <div className="block-empty">此页面暂无区块，请前往「页面构建器」添加区块并保存</div>
          ) : null}
        </div>
      </div>
    );
  }

  /* ---- 列表视图 ---- */
  return (
    <div className="page page-mypages">
      <div className="page-head">
        <h2>我的页面</h2>
        <div className="muted">在「页面构建器」中设计并保存的页面，可在此直接运行使用</div>
        <div className="actions">
          <Btn sm kind="ghost" onClick={() => void refresh()}>刷新列表</Btn>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="block-empty">
          还没有已保存的页面。前往「页面构建器」新建页面、添加区块并保存后，即可在此运行。
        </div>
      ) : (
        <div className="mypages-grid">
          {pages.map((p) => (
            <div key={p.uid} className="mypages-card">
              <div className="mypages-card-head">
                <IconLayout size={18} />
                <span className="mypages-card-name">{p.name}</span>
              </div>
              <div className="mypages-card-meta">
                更新于 {new Date(p.updatedAt).toLocaleString("zh-CN")}
              </div>
              <div className="mypages-card-actions">
                <Btn sm kind="primary" disabled={opening} onClick={() => void openPage(p.uid)}>运行</Btn>
                <Btn sm kind="ghost" onClick={() => editPage(p.uid)}>编辑</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

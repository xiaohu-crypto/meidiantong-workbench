/* ===== ModelRenderer 模型渲染器（复刻NocoBase Model Renderer）=====
 * 读取FlowModel → 从registry解析工厂 → 渲染React组件。
 * 未注册类型渲染占位提示（中文）。
 */

import type { ReactNode } from "react";
import type { FlowModel } from "./model";
import { modelRegistry, type ModelRenderCtx } from "./registry";

/** 渲染单个模型 */
export function renderModel(model: FlowModel, ctx: ModelRenderCtx): ReactNode {
  const factory = modelRegistry.resolve(model.use);
  if (!factory) return <div className="model-unknown">未知模型类型：{model.use}</div>;
  try {
    return factory(model, ctx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <div className="model-error">模型渲染失败：{msg}</div>;
  }
}

/** 渲染模型的子模型列表 */
export function renderChildren(model: FlowModel, ctx: ModelRenderCtx): ReactNode[] {
  return (model.children ?? []).map((child) => (
    <div key={child.uid} className={"model-child " + child.use}>
      {renderModel(child, ctx)}
    </div>
  ));
}

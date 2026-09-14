/* ===== BlockModel注册（复刻NocoBase Model注册）=====
 * 将Block组件注册为ModelFactory，供ModelRenderer按use渲染。
 * Builder保存的FlowModel通过这些工厂渲染为真实UI。
 */

import { modelRegistry, type ModelRenderCtx } from "./registry";
import type { FlowModel } from "./model";
import { TableBlock } from "../../components/blocks/TableBlock";
import { FormBlock } from "../../components/blocks/FormBlock";
import { KanbanBlock } from "../../components/blocks/KanbanBlock";
import { DetailsBlock } from "../../components/blocks/DetailsBlock";
import { ListBlock } from "../../components/blocks/ListBlock";
import { CalendarBlock } from "../../components/blocks/CalendarBlock";
import { MarkdownBlock } from "../../components/blocks/MarkdownBlock";

/** 从props安全取值 */
function str(props: Record<string, unknown> | undefined, key: string, fallback = ""): string {
  const v = props?.[key];
  return v === undefined || v === null ? fallback : String(v);
}

/** 从props安全取字段白名单（构建器"选择字段"配置） */
function fieldsProp(model: FlowModel): string[] | undefined {
  const f = model.props?.fields;
  return Array.isArray(f) ? f.map(String) : undefined;
}

/** 注册内置BlockModel */
export function registerBuiltinModels(): void {
  modelRegistry.register("PageModel", (model, ctx) => (
    <div className="builder-page">
      <div className="builder-page-head"><h3>{model.name ?? "页面"}</h3></div>
      <div className="builder-page-body">{renderBlocks(model, ctx)}</div>
    </div>
  ));

  modelRegistry.register("TableBlock", (model, ctx) => (
    <TableBlock
      store={str(model.props, "store")}
      title={str(model.props, "title")}
      pageSize={Number(model.props?.pageSize ?? 20)}
      editable={model.props?.editable !== false}
      fields={fieldsProp(model)}
      notify={ctx.notify}
      onOpenDetail={(id) => ctx.openDetail(str(model.props, "store"), id)}
    />
  ));

  modelRegistry.register("FormBlock", (model, ctx) => (
    <FormBlock
      store={str(model.props, "store")}
      recordId={model.props?.recordId ? String(model.props.recordId) : null}
      fields={fieldsProp(model)}
      notify={ctx.notify}
    />
  ));

  modelRegistry.register("KanbanBlock", (model, ctx) => (
    <KanbanBlock
      store={str(model.props, "store")}
      groupField={str(model.props, "groupField")}
      titleField={str(model.props, "titleField")}
      subField={str(model.props, "subField")}
      amountField={str(model.props, "amountField")}
      title={str(model.props, "title")}
      notify={ctx.notify}
      onOpen={(id) => ctx.openDetail(str(model.props, "store"), id)}
    />
  ));

  modelRegistry.register("DetailsBlock", (model) => (
    <DetailsBlock
      store={str(model.props, "store")}
      recordId={model.props?.recordId ? String(model.props.recordId) : null}
      fields={fieldsProp(model)}
    />
  ));

  modelRegistry.register("ListBlock", (model, ctx) => (
    <ListBlock
      store={str(model.props, "store")}
      titleField={str(model.props, "titleField", "title")}
      subField={str(model.props, "subField")}
      descField={str(model.props, "descField")}
      title={str(model.props, "title")}
      max={Number(model.props?.max ?? 10)}
      onOpen={(id) => ctx.openDetail(str(model.props, "store"), id)}
    />
  ));

  modelRegistry.register("CalendarBlock", (model, ctx) => (
    <CalendarBlock
      store={str(model.props, "store")}
      dateField={str(model.props, "dateField")}
      titleField={str(model.props, "titleField", "title")}
      title={str(model.props, "title")}
      onOpen={(id) => ctx.openDetail(str(model.props, "store"), id)}
    />
  ));

  modelRegistry.register("MarkdownBlock", (model) => (
    <MarkdownBlock content={str(model.props, "content")} title={str(model.props, "title")} />
  ));
}

/** 渲染Model的子区块集合 */
function renderBlocks(model: FlowModel, ctx: ModelRenderCtx) {
  const children = model.children ?? [];
  if (children.length === 0) return <div className="builder-placeholder">画布为空，从左侧拖拽区块开始搭建</div>;
  return children.map((child) => (
    <div key={child.uid} className={"builder-block " + child.use}>
      <div className="builder-block-inner">{renderBlock(child, ctx)}</div>
    </div>
  ));
}

function renderBlock(model: FlowModel, ctx: ModelRenderCtx) {
  const factory = modelRegistry.resolve(model.use);
  if (!factory) return <div className="model-unknown">未知区块类型：{model.use}</div>;
  return factory(model, ctx);
}

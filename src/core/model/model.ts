/* ===== FlowModel UI模型（复刻NocoBase FlowModel）=====
 * Model是页面/区块的可配置描述，可序列化为JSON持久化。
 * 结构：PageModel → BlockModel → FieldModel/ActionModel
 */

import type { FlowDef } from "../flow/flow";

export interface FlowModel {
  /** 唯一标识 */
  uid: string;
  /** 模型类型（PageModel/TableBlock/FormBlock/...） */
  use: string;
  /** 展示名称 */
  name?: string;
  /** 配置参数（因类型而异） */
  props?: Record<string, unknown>;
  /** 父模型uid */
  parent?: string;
  /** 子模型（Block的字段/动作等） */
  children?: FlowModel[];
  /** 事件绑定：event名 -> Flow */
  flows?: Record<string, FlowDef>;
  /** 本地状态（不持久化） */
  state?: Record<string, unknown>;
}

/** 生成唯一uid */
export function modelUid(prefix = "m"): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 深层查找子模型 */
export function findModel(root: FlowModel, uid: string): FlowModel | undefined {
  if (root.uid === uid) return root;
  for (const child of root.children ?? []) {
    const found = findModel(child, uid);
    if (found) return found;
  }
  return undefined;
}

/** 收集全部模型（先序） */
export function collectModels(root: FlowModel): FlowModel[] {
  const out: FlowModel[] = [root];
  for (const child of root.children ?? []) out.push(...collectModels(child));
  return out;
}

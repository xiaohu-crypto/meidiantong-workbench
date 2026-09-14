/* ===== ModelRegistry 模型注册表（复刻NocoBase Model Registry）=====
 * 注册Model类型到渲染工厂（React组件）。
 * 渲染工厂签名：(model, ctx) => ReactNode
 */

import type { ReactNode } from "react";
import type { FlowModel } from "./model";

/** 渲染上下文：UI层注入能力 */
export interface ModelRenderCtx {
  /** 数据刷新 */
  refresh: (store: string) => void;
  /** 打开表单（新增/编辑） */
  openForm: (store: string, id?: string) => void;
  /** 打开详情 */
  openDetail: (store: string, id: string) => void;
  /** 通知 */
  notify: (text: string, kind?: "ok" | "err" | "info") => void;
  /** 当前页面路由 */
  nav: (view: string, params?: Record<string, unknown>) => void;
  /** 访问数据（数据模型等） */
  getCollection: (name: string) => import("../data/collections").CollectionDef | undefined;
}

export type ModelFactory = (model: FlowModel, ctx: ModelRenderCtx) => ReactNode;

class ModelRegistryImpl {
  private factories = new Map<string, ModelFactory>();

  register(use: string, factory: ModelFactory): void {
    this.factories.set(use, factory);
  }

  resolve(use: string): ModelFactory | undefined {
    return this.factories.get(use);
  }

  has(use: string): boolean {
    return this.factories.has(use);
  }

  list(): string[] {
    return Array.from(this.factories.keys());
  }
}

export const modelRegistry = new ModelRegistryImpl();

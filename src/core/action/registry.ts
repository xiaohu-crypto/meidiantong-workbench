/* ===== Action 动作系统（复刻NocoBase Action）=====
 * Action是可复用的业务动作：create/update/destroy/submit/approve等。
 * Action绑定一个Flow（复用FlowEngine），可被按钮/菜单/工作流调用。
 */

import type { FlowDef } from "../flow/flow";

export interface ActionDefinition {
  /** 动作名（唯一） */
  name: string;
  /** 中文标签 */
  label: string;
  /** 绑定的Flow */
  flow: FlowDef;
  /** 默认参数（注入Flow执行） */
  defaultParams?: Record<string, unknown>;
  /** 可见条件（可选，返回false隐藏） */
  visible?: (ctx?: Record<string, unknown>) => boolean;
  /** 禁用条件（可选） */
  disabled?: (ctx?: Record<string, unknown>) => boolean;
}

/** Action注册表 */
class ActionRegistryImpl {
  private actions = new Map<string, ActionDefinition>();

  register(def: ActionDefinition): void {
    this.actions.set(def.name, def);
  }

  has(name: string): boolean {
    return this.actions.has(name);
  }

  get(name: string): ActionDefinition | undefined {
    return this.actions.get(name);
  }

  list(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  /** 移除（供插件/停用用） */
  unregister(name: string): void {
    this.actions.delete(name);
  }
}

export const actionRegistry = new ActionRegistryImpl();

/** 便捷构造Action */
export function defineAction(def: ActionDefinition): ActionDefinition {
  if (!actionRegistry.has(def.name)) actionRegistry.register(def);
  return def;
}

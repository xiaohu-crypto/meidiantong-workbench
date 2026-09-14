/* ===== 插件系统（复刻NocoBase Plugin）=====
 * 插件接口 + PluginManager：注册/加载/卸载/列表。
 * 插件可注册：Model类型、Action、Step、Field、路由。
 * 本地应用不做热加载，启动时安装插件。
 */

import { modelRegistry } from "../model/registry";
import type { ModelFactory } from "../model/registry";
import { actionRegistry } from "../action/registry";
import type { ActionDefinition } from "../action/registry";
import { stepRegistry } from "../flow/step";
import type { StepHandler } from "../flow/step";

/** 插件上下文：插件可访问的注册表 */
export interface PluginContext {
  model: typeof modelRegistry;
  action: typeof actionRegistry;
  step: typeof stepRegistry;
}

/** 插件接口 */
export interface Plugin {
  /** 插件唯一名 */
  name: string;
  /** 中文展示名 */
  displayName: string;
  /** 版本 */
  version: string;
  /** 加载时调用：注册Model/Action/Step */
  load(ctx: PluginContext): void;
  /** 卸载时调用（可选） */
  unload?(ctx: PluginContext): void;
}

/** 插件管理器 */
class PluginManagerImpl {
  private plugins = new Map<string, Plugin>();
  private ctx: PluginContext = {
    model: modelRegistry,
    action: actionRegistry,
    step: stepRegistry,
  };

  /** 安装插件 */
  install(plugin: Plugin): boolean {
    if (this.plugins.has(plugin.name)) return false;
    try {
      plugin.load(this.ctx);
      this.plugins.set(plugin.name, plugin);
      return true;
    } catch (e) {
      console.error(`插件[${plugin.name}]加载失败`, e);
      return false;
    }
  }

  /** 卸载插件 */
  uninstall(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    try {
      plugin.unload?.(this.ctx);
      this.plugins.delete(name);
      return true;
    } catch (e) {
      console.error(`插件[${name}]卸载失败`, e);
      return false;
    }
  }

  /** 是否已安装 */
  isInstalled(name: string): boolean {
    return this.plugins.has(name);
  }

  /** 列出已安装插件 */
  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginManager = new PluginManagerImpl();

/** 便捷注册Model类型 */
export function registerModel(use: string, factory: ModelFactory): void {
  modelRegistry.register(use, factory);
}

/** 便捷注册Action */
export function registerAction(def: ActionDefinition): void {
  actionRegistry.register(def);
}

/** 便捷注册Step */
export function registerStep(use: string, handler: StepHandler): void {
  stepRegistry.register(use, handler);
}

/* ===== FlowContext 运行上下文（复刻NocoBase FlowContext）=====
 * Step 不直接访问全局对象，通过 ctx 获取运行环境。
 * 层级：RuntimeContext（当前Flow执行状态）→ ModelContext（当前模型）→ EngineContext（引擎能力）。
 */

import { repos, getRepo } from "../data/repository";
import { db, type StoreName } from "../../db/db";
import { resolveTemplate, getByPath } from "./template";
import type { HasId } from "../data/repository";

export interface FlowEvent {
  type: string;
  payload?: unknown;
}

/** 通知回调：由UI层注入（useToast等） */
export type NotifyFn = (text: string, kind?: "ok" | "err" | "info") => void;

/** Flow执行时的运行环境 */
export class FlowContext {
  /** 当前Flow执行参数 */
  params: Record<string, unknown> = {};
  /** 每个Step的执行结果（按step name） */
  results: Record<string, unknown> = {};
  /** 当前模型（UI层注入） */
  model: unknown = null;
  /** 当前记录（如详情页的当前记录） */
  record: Record<string, unknown> | null = null;

  constructor(
    public readonly notifyFn: NotifyFn,
    public readonly emitEvent: (e: FlowEvent) => void,
  ) {}

  /** 获取指定Step的结果 */
  getStepResult(name: string): unknown {
    return this.results[name];
  }

  /** 获取全部Step结果 */
  getStepResults(): Record<string, unknown> {
    return { ...this.results };
  }

  /** 记录某个Step的结果 */
  setStepResult(name: string, value: unknown): void {
    this.results[name] = value;
  }

  /** 按路径获取变量：优先 context / record / params / step结果 */
  getVar(path: string): unknown {
    if (path.startsWith("$step.")) return getByPath(this.results as unknown as Record<string, unknown>, path.slice(6));
    if (path.startsWith("$params.")) return getByPath(this.params, path.slice(8));
    if (path.startsWith("$context.")) {
      const ctxPath = path.slice(9);
      if (ctxPath === "model") return this.model;
      if (ctxPath === "record") return this.record;
      if (ctxPath === "now") return Date.now();
      if (ctxPath === "today") return toDateStr(Date.now());
      if (ctxPath.startsWith("today+")) {
        const n = Number(ctxPath.slice(6));
        return toDateStr(Date.now() + n * 86400000);
      }
      return undefined;
    }
    if (path.startsWith("$record.")) return getByPath(this.record ?? {}, path.slice(8));
    return getByPath(this.params, path);
  }

  /** 解析模板字符串 */
  resolveTemplate(tpl: string): string {
    return resolveTemplate(tpl, (p) => this.getVar(p));
  }

  /** 数据访问：通过Repository（唯一入口） */
  get repo() {
    return repos;
  }

  /** 底层数据访问（高级用途） */
  get db() {
    return db;
  }

/** 获取指定store的Repository */
  repoOf<T extends HasId>(store: StoreName): ReturnType<typeof getRepo<T>> {
    return getRepo<T>(store);
  }
}

/** 日期转YYYY-MM-DD */
function toDateStr(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/* ===== Step 步骤系统（复刻NocoBase Step + StepRegistry）=====
 * Step是Flow中最小执行单位。StepRegistry注册/解析/执行标准步骤。
 * 内置Step：创建记录/更新记录/删除记录/通知/刷新/条件/延时/计算/HTTP/打开表单。
 */

import { FlowContext } from "./context";
import { resolveValue } from "./template";
import type { StoreName } from "../../db/db";

export interface StepDef {
  /** 步骤名（用于引用结果） */
  name: string;
  /** 步骤类型（对应registry中的handler） */
  use: string;
  /** 步骤参数（可含模板变量，执行时解析） */
  params?: Record<string, unknown>;
}

export type StepHandler = (ctx: FlowContext, params: Record<string, unknown>) => Promise<unknown>;

/** Step注册表 */
class StepRegistryImpl {
  private handlers = new Map<string, StepHandler>();

  register(use: string, handler: StepHandler): void {
    this.handlers.set(use, handler);
  }

  has(use: string): boolean {
    return this.handlers.has(use);
  }

  async execute(ctx: FlowContext, step: StepDef): Promise<unknown> {
    const handler = this.handlers.get(step.use);
    if (!handler) throw new Error(`未注册的步骤类型: ${step.use}`);
    // 解析参数中的模板变量
    const params = resolveParams(ctx, step.params ?? {});
    const result = await handler(ctx, params);
    ctx.setStepResult(step.name, result);
    return result;
  }

  list(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/** 递归解析参数对象中的模板字符串（支持num/bool类型前缀） */
function resolveParams(ctx: FlowContext, params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") out[k] = resolveValue(v, (p) => ctx.getVar(p));
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === "string" ? resolveValue(x, (p) => ctx.getVar(p)) : x));
    else if (v !== null && typeof v === "object") out[k] = resolveParams(ctx, v as Record<string, unknown>);
    else out[k] = v;
  }
  return out;
}

export const stepRegistry = new StepRegistryImpl();

/* ===== 内置标准Step ===== */

function storeOf(params: Record<string, unknown>): StoreName {
  const s = params.store ?? params.collection;
  if (typeof s !== "string") throw new Error("步骤缺少store参数");
  return s as StoreName;
}

/** 创建记录 */
stepRegistry.register("createRecord", async (ctx, params) => {
  const store = storeOf(params);
  const data = (params.data ?? {}) as Record<string, unknown>;
  const resolved: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    resolved[k] = typeof v === "string" ? ctx.resolveTemplate(v) : v;
  }
  const repo = ctx.repoOf(store);
  return repo.create(resolved as never);
});

/** 更新记录 */
stepRegistry.register("updateRecord", async (ctx, params) => {
  const store = storeOf(params);
  const id = String(params.id ?? "");
  const data = (params.data ?? {}) as Record<string, unknown>;
  const resolved: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    resolved[k] = typeof v === "string" ? ctx.resolveTemplate(v) : v;
  }
  const repo = ctx.repoOf(store);
  return repo.update(id, resolved as never);
});

/** 删除记录（软删除） */
stepRegistry.register("deleteRecord", async (ctx, params) => {
  const store = storeOf(params);
  const id = String(params.id ?? "");
  const repo = ctx.repoOf(store);
  await repo.destroy(id);
  return { ok: true, id };
});

/** 发送通知 */
stepRegistry.register("notify", async (ctx, params) => {
  const text = String(params.text ?? "操作完成");
  const kind = String(params.kind ?? "ok") as "ok" | "err" | "info";
  ctx.notifyFn(text, kind);
  return { ok: true, text };
});

/** 刷新数据（广播事件，由UI层监听reload） */
stepRegistry.register("refresh", async (ctx, params) => {
  const store = storeOf(params);
  ctx.emitEvent({ type: "refresh", payload: { store } });
  return { ok: true, store };
});

/** 打开表单（广播事件，由UI层监听） */
stepRegistry.register("openForm", async (ctx, params) => {
  const store = storeOf(params);
  const id = params.id ? String(params.id) : undefined;
  ctx.emitEvent({ type: "openForm", payload: { store, id } });
  return { ok: true, store, id };
});

/** 关闭抽屉/弹窗 */
stepRegistry.register("closeDrawer", async (ctx) => {
  ctx.emitEvent({ type: "closeDrawer", payload: {} });
  return { ok: true };
});

/** 条件判断：params { field, op, value, then: StepDef[], else: StepDef[] } */
stepRegistry.register("condition", async (ctx, params) => {
  const field = String(params.field ?? "");
  const op = String(params.op ?? "eq");
  const expected = params.value;
  const actual = ctx.getVar(field);
  const pass = evaluate(actual, op, expected);
  const branch = pass ? (params.then as StepDef[] | undefined) : (params.else as StepDef[] | undefined);
  const results: unknown[] = [];
  if (branch) {
    for (const step of branch) {
      results.push(await stepRegistry.execute(ctx, step));
    }
  }
  return { pass, results };
});

function evaluate(actual: unknown, op: string, expected: unknown): boolean {
  switch (op) {
    case "eq": return actual === expected;
    case "neq": return actual !== expected;
    case "gt": return Number(actual) > Number(expected);
    case "lt": return Number(actual) < Number(expected);
    case "gte": return Number(actual) >= Number(expected);
    case "lte": return Number(actual) <= Number(expected);
    case "contains": return String(actual).includes(String(expected));
    case "empty": return actual === undefined || actual === null || actual === "";
    default: return false;
  }
}

/** 延时等待 */
stepRegistry.register("delay", async (_ctx, params) => {
  const ms = Math.max(0, Number(params.ms ?? 0));
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
  return { ok: true, ms };
});

/** 计算字段：params { expression, varName }，expression形如 "{{ $params.a }} + {{ $params.b }}" */
stepRegistry.register("calculate", async (ctx, params) => {
  const expr = String(params.expression ?? "0");
  const varName = String(params.varName ?? "result");
  // 安全求值：仅支持数字四则运算（解析模板后校验字符）
  const resolved = ctx.resolveTemplate(expr);
  const cleaned = resolved.replace(/[^0-9+\-*/().\s]/g, "");
  // eslint-disable-next-line no-eval
  const value = Function(`"use strict"; return (${cleaned});`)() as number;
  ctx.setStepResult(varName, value);
  return { value };
});

/** HTTP请求（通过fetch，Electron渲染进程可发外部请求） */
stepRegistry.register("http", async (_ctx, params) => {
  const url = String(params.url ?? "");
  if (!url) throw new Error("HTTP步骤缺少url");
  const method = String(params.method ?? "GET");
  const body = params.body as Record<string, unknown> | undefined;
  const resp = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* 非JSON响应 */ }
  return { status: resp.status, ok: resp.ok, json, text: text.slice(0, 2000) };
});

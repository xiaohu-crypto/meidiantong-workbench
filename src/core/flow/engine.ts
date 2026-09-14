/* ===== FlowEngine 工作流引擎（复刻NocoBase FlowEngine）=====
 * 负责：Flow执行、事件分发、Step执行、结果传递、事件总线。
 * 事件总线用于Flow与UI解耦（openForm/refresh等由UI监听）。
 */

import { FlowDef } from "./flow";
import { FlowContext, FlowEvent, NotifyFn } from "./context";
import { stepRegistry, StepDef } from "./step";

type EventListener = (e: FlowEvent) => void;

/** Flow执行结果 */
export interface FlowRunResult {
  ok: boolean;
  results: Record<string, unknown>;
  error?: string;
  durationMs: number;
}

class FlowEngineImpl {
  private listeners = new Set<EventListener>();
  /** 已注册的自动化Flow（按event+store索引） */
  private autoFlows: FlowDef[] = [];

  /** UI层订阅Flow事件（如openForm/refresh） */
  onEvent(cb: EventListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** 广播事件给UI层 */
  emitEvent(e: FlowEvent): void {
    for (const cb of this.listeners) {
      try { cb(e); } catch { /* 单个监听器失败不影响其他 */ }
    }
  }

  /** 注册自动化Flow（记录变更/定时触发用） */
  registerAutoFlow(flow: FlowDef): void {
    this.autoFlows = this.autoFlows.filter((f) => f.uid !== flow.uid);
    this.autoFlows.push(flow);
  }

  unregisterAutoFlow(uid: string): void {
    this.autoFlows = this.autoFlows.filter((f) => f.uid !== uid);
  }

  listAutoFlows(): FlowDef[] {
    return [...this.autoFlows];
  }

  /** 执行单个Flow */
  async run(flow: FlowDef, opts: { params?: Record<string, unknown>; notify?: NotifyFn; model?: unknown; record?: Record<string, unknown> } = {}): Promise<FlowRunResult> {
    const ctx = new FlowContext(
      opts.notify ?? (() => { /* 默认静默 */ }),
      (e) => this.emitEvent(e),
    );
    ctx.params = opts.params ?? {};
    ctx.model = opts.model ?? null;
    ctx.record = opts.record ?? null;

    const start = Date.now();
    try {
      for (const step of flow.steps) {
        await this.executeStep(ctx, step);
      }
      return { ok: true, results: ctx.getStepResults(), durationMs: Date.now() - start };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, results: ctx.getStepResults(), error: msg, durationMs: Date.now() - start };
    }
  }

  private async executeStep(ctx: FlowContext, step: StepDef): Promise<void> {
    if (!stepRegistry.has(step.use)) {
      throw new Error(`未注册的步骤类型: ${step.use}`);
    }
    await stepRegistry.execute(ctx, step);
  }

  /** 触发记录变更事件：查找匹配的自动化Flow并执行 */
  async triggerRecordEvent(event: "recordCreated" | "recordUpdated" | "recordDeleted", store: string, record?: Record<string, unknown>): Promise<FlowRunResult[]> {
    const matched = this.autoFlows.filter((f) =>
      f.enabled !== false &&
      f.event === event &&
      (!f.trigger?.store || f.trigger.store === store),
    );
    const out: FlowRunResult[] = [];
    for (const flow of matched) {
      const r = await this.run(flow, { record, params: { event, store, record } });
      out.push(r);
    }
    return out;
  }

  /** 触发手动Flow */
  async triggerManual(uid: string, opts?: { params?: Record<string, unknown> }): Promise<FlowRunResult | undefined> {
    const flow = this.autoFlows.find((f) => f.uid === uid && f.event === "manual");
    if (!flow) return undefined;
    return this.run(flow, { params: opts?.params });
  }
}

export const engine = new FlowEngineImpl();

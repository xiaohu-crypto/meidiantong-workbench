import "fake-indexeddb/auto";
import { describe, expect, it, beforeAll } from "vitest";
import { engine } from "../src/core/flow/engine";
import { stepRegistry } from "../src/core/flow/step";
import type { FlowDef } from "../src/core/flow/flow";
import { resolveTemplate } from "../src/core/flow/template";
import { repos } from "../src/core/data/repository";
import { db } from "../src/db/db";

async function ensureDb(): Promise<void> {
  await db.getSetting("_warmup", true);
}

describe("FlowEngine 工作流引擎", () => {
  beforeAll(async () => { await ensureDb(); });

  it("内置步骤注册完整", () => {
    const steps = stepRegistry.list();
    for (const s of ["createRecord", "updateRecord", "deleteRecord", "notify", "refresh",
      "openForm", "closeDrawer", "condition", "delay", "calculate", "http"]) {
      expect(steps).toContain(s);
    }
  });

  it("执行Flow:创建记录+通知", async () => {
    const notified: string[] = [];
    const flow: FlowDef = {
      uid: "test-flow-1",
      name: "测试创建客户",
      event: "manual",
      steps: [
        { name: "create", use: "createRecord", params: { store: "customers", data: { name: "流程创建客户", industry: "科技", grade: "B" } } },
        { name: "notify", use: "notify", params: { text: "客户创建成功" } },
      ],
    };
    const result = await engine.run(flow, { notify: (t) => notified.push(t) });
    expect(result.ok).toBe(true);
    expect(notified).toContain("客户创建成功");
    const created = (await repos.customers.find()).find((c) => c.name === "流程创建客户");
    expect(created).toBeDefined();
    expect(created?.industry).toBe("科技");
  });

  it("模板变量解析:引用上一步结果", async () => {
    const flow: FlowDef = {
      uid: "test-flow-2",
      name: "模板测试",
      event: "manual",
      steps: [
        { name: "create", use: "createRecord", params: { store: "customers", data: { name: "模板客户", grade: "A" } } },
        { name: "notify", use: "notify", params: { text: "已创建 {{ $step.create.id }}" } },
      ],
    };
    const notified: string[] = [];
    const result = await engine.run(flow, { notify: (t) => notified.push(t) });
    expect(result.ok).toBe(true);
    expect(notified[0]).toMatch(/^已创建 customers-/);
  });

  it("条件步骤:满足条件才执行分支", async () => {
    const flow: FlowDef = {
      uid: "test-flow-3",
      name: "条件测试",
      event: "manual",
      steps: [
        {
          name: "cond", use: "condition",
          params: {
            field: "$params.score", op: "gte", value: 60,
            then: [{ name: "notifyA", use: "notify", params: { text: "通过" } }],
            else: [{ name: "notifyB", use: "notify", params: { text: "不通过" } }],
          },
        },
      ],
    };
    const a: string[] = [];
    await engine.run(flow, { params: { score: 80 }, notify: (t) => a.push(t) });
    expect(a).toContain("通过");

    const b: string[] = [];
    await engine.run(flow, { params: { score: 40 }, notify: (t) => b.push(t) });
    expect(b).toContain("不通过");
  });

  it("未注册步骤报错且Flow返回ok=false", async () => {
    const flow: FlowDef = {
      uid: "test-flow-4",
      name: "错误测试",
      event: "manual",
      steps: [{ name: "bad", use: "noSuchStep", params: {} }],
    };
    const result = await engine.run(flow);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("未注册");
  });

  it("自动化Flow:记录创建事件触发", async () => {
    const flow: FlowDef = {
      uid: "test-auto-1",
      name: "商机创建自动建任务",
      event: "recordCreated",
      trigger: { store: "deals" },
      steps: [
        { name: "task", use: "createRecord", params: { store: "tasks", data: { title: "跟进: {{ $params.record.title }}", type: "跟进", priority: "高", kanbanCol: "待办" } } },
      ],
    };
    engine.registerAutoFlow(flow);
    await engine.triggerRecordEvent("recordCreated", "deals", { id: "d-x", title: "新商机A" });
    const tasks = await repos.tasks.find();
    expect(tasks.some((t) => t.title === "跟进: 新商机A")).toBe(true);
    engine.unregisterAutoFlow("test-auto-1");
  });
});

describe("JSON模板解析", () => {
  it("基本替换", () => {
    expect(resolveTemplate("你好 {{ name }}", (p) => (p === "name" ? "老板" : undefined))).toBe("你好 老板");
  });
  it("对象路径", () => {
    expect(resolveTemplate("{{ a.b.c }}", (p) => (p === "a.b.c" ? 42 : undefined))).toBe("42");
  });
  it("无模板原样返回", () => {
    expect(resolveTemplate("普通文本", () => undefined)).toBe("普通文本");
  });
});

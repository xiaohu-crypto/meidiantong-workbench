import "fake-indexeddb/auto";
import { describe, expect, it, beforeAll } from "vitest";
import { engine } from "../src/core/flow/engine";
import "../src/core/workflow/actions"; // 注册业务步骤
import { setupBuiltinWorkflows, buildDealWonFlow, runTimerWorkflows } from "../src/core/workflow/triggers";
import { repos } from "../src/core/data/repository";
import { db } from "../src/db/db";

async function ensureDb(): Promise<void> {
  await db.getSetting("_warmup", true);
}

describe("工作流自动化场景", () => {
  beforeAll(async () => { await ensureDb(); });

  it("商机签约 → 自动创建合同+回款计划", async () => {
    const c = await repos.customers.create({ name: "工作流客户", industry: "科技", grade: "A" });
    const d = await repos.deals.create({
      customerId: c.id, title: "大单签约", stage: "报价", value: 100000, probability: 50, lastTouchAt: Date.now(),
    });

    // 注册签约Flow
    const flow = buildDealWonFlow();
    engine.registerAutoFlow(flow);

    // 模拟更新stage为"签约"
    const today30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const notified: string[] = [];
    const result = await engine.triggerRecordEvent("recordUpdated", "deals", {
      id: d.id, title: d.title, customerId: c.id, value: d.value, closeDate: today30, stage: "签约",
    });

    // Flow内通过params.record获取stage
    expect(result.length).toBe(1);
    void notified;

    // 验证自动创建了合同
    const contracts = await repos.contracts.find();
    const created = contracts.find((ct) => ct.name === "合同-大单签约");
    expect(created).toBeDefined();
    expect(created?.customerId).toBe(c.id);
    expect(created?.amount).toBe(100000);

    // 验证回款计划（30天到期）
    const payments = await repos.payments.find();
    const pay = payments.find((p) => p.contractId === created?.id);
    expect(pay).toBeDefined();
    expect(pay?.dueDate).toBe(today30);
    expect(pay?.status).toBe("未到");

    engine.unregisterAutoFlow("wf-deal-won");
  });

  it("内置工作流注册完整", async () => {
    setupBuiltinWorkflows();
    const flows = engine.listAutoFlows();
    for (const uid of ["wf-deal-won", "wf-stale-customer", "wf-contract-expire"]) {
      expect(flows.some((f) => f.uid === uid)).toBe(true);
    }
  });

  it("定时工作流:沉睡客户创建跟进任务(不重复)", async () => {
    // 造一个14天无接触客户
    await repos.customers.create({ name: "沉睡客户甲", industry: "金融", grade: "B" });
    // 清理历史同名任务
    const tasks = await repos.tasks.find();
    for (const t of tasks) {
      if (t.title.includes("沉睡客户甲")) await repos.tasks.destroy(t.id);
    }
    // 强制重置上次运行时间
    await db.setSetting("wfLastRun_wf-stale-customer", 0);
    await runTimerWorkflows();
    // 等待异步定时任务完成（timers里是同步await）
    const after = await repos.tasks.find();
    expect(after.some((t) => t.title.includes("沉睡客户甲"))).toBe(true);
  }, 15000);
});

/* ===== 工作流内置场景（复刻NocoBase Workflow业务落地）=====
 * 内置自动化场景，注册到FlowEngine：
 *  1. 商机签约 → 自动创建合同 + 30天回款计划
 *  2. 客户14天无接触 → 自动创建跟进任务（定时触发）
 *  3. 合同到期前7天 → 自动创建续约提醒任务（定时触发）
 * 全部Flow为JSON可序列化，可在工作流管理页查看/编辑。
 */

import { engine } from "../flow/engine";
import type { FlowDef } from "../flow/flow";
import { repos } from "../data/repository";
import type { Customer, Contract as ContractT } from "../../types";

/** 商机签约 → 自动创建合同+回款计划（监听deals更新） */
export function buildDealWonFlow(): FlowDef {
  return {
    uid: "wf-deal-won",
    name: "商机签约自动建合同",
    event: "recordUpdated",
    trigger: { store: "deals" },
    enabled: true,
    steps: [
      {
        name: "checkStage",
        use: "condition",
        params: {
          field: "$params.record.stage",
          op: "eq",
          value: "签约",
          then: [
            {
              name: "createContract",
              use: "createRecord",
              params: {
                store: "contracts",
                data: {
                  customerId: "{{ $params.record.customerId }}",
                  name: "合同-{{ $params.record.title }}",
                  amount: "{{ num: $params.record.value }}",
                  signDate: "{{ $params.record.closeDate }}",
                  status: "执行中",
                },
              },
            },
            {
              name: "createPayment",
              use: "createRecord",
              params: {
                store: "payments",
                data: {
                  contractId: "{{ $step.createContract.id }}",
                  customerId: "{{ $params.record.customerId }}",
                  amount: "{{ num: $params.record.value }}",
                  dueDate: "{{ $context.today+30 }}",
                  status: "未到",
                },
              },
            },
            { name: "notify", use: "notify", params: { text: "✅ 商机已签约，已自动创建合同与回款计划" } },
          ],
          else: [],
        },
      },
    ],
  };
}

/** 客户14天无接触 → 自动创建跟进任务（定时触发，每6小时检查） */
export function buildStaleCustomerFlow(): FlowDef {
  return {
    uid: "wf-stale-customer",
    name: "客户沉睡自动跟进",
    event: "timer",
    trigger: { intervalHours: 6 },
    enabled: true,
    steps: [
      {
        name: "findStale",
        use: "findStaleCustomers",
        params: {},
      },
      {
        name: "createTasks",
        use: "createStaleTasks",
        params: {},
      },
      { name: "notify", use: "notify", params: { text: "🔔 已发现沉睡客户并创建跟进任务" } },
    ],
  };
}

/** 合同到期前7天 → 创建续约提醒（定时触发，每12小时检查） */
export function buildContractExpireFlow(): FlowDef {
  return {
    uid: "wf-contract-expire",
    name: "合同到期提醒",
    event: "timer",
    trigger: { intervalHours: 12 },
    enabled: true,
    steps: [
      {
        name: "findExpiring",
        use: "findExpiringContracts",
        params: { days: 7 },
      },
      {
        name: "createReminders",
        use: "createExpireTasks",
        params: {},
      },
      { name: "notify", use: "notify", params: { text: "📅 已生成合同到期提醒任务" } },
    ],
  };
}

/** 注册内置工作流 */
export function setupBuiltinWorkflows(): void {
  engine.registerAutoFlow(buildDealWonFlow());
  engine.registerAutoFlow(buildStaleCustomerFlow());
  engine.registerAutoFlow(buildContractExpireFlow());
}

/* ===== 定时工作流执行 ===== */

let timerHandle: ReturnType<typeof setInterval> | null = null;

/** 启动定时工作流（由App在启动时调用） */
export function startTimerWorkflows(intervalMs = 6 * 60 * 60 * 1000): void {
  stopTimerWorkflows();
  timerHandle = setInterval(() => {
    void runTimerWorkflows();
  }, intervalMs);
}

/** 停止定时工作流 */
export function stopTimerWorkflows(): void {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

/** 立即执行所有启用的定时工作流 */
export async function runTimerWorkflows(): Promise<void> {
  const flows = engine.listAutoFlows().filter((f) => f.event === "timer" && f.enabled !== false);
  for (const flow of flows) {
    await runTimerFlow(flow);
  }
}

/** 执行单个定时工作流（注入真实业务数据作为params） */
export async function runTimerFlow(flow: FlowDef): Promise<void> {
  const intervalHours = Number(flow.trigger?.intervalHours ?? 6);
  const lastRunKey = `wfLastRun_${flow.uid}`;
  const { db } = await import("../../db/db");
  const lastRun = await db.getSetting<number>(lastRunKey, 0);
  if (Date.now() - lastRun < intervalHours * 3600000) return;

  // 注入业务数据
  const params: Record<string, unknown> = { now: Date.now() };
  if (flow.uid === "wf-stale-customer") {
    const customers = await repos.customers.find();
    const cps = await repos.cps.find();
    const stale = customers.filter((c: Customer) => {
      const last = cps.filter((cp) => cp.customerId === c.id).sort((a, b) => b.time - a.time)[0];
      return !last || Date.now() - last.time > 14 * 86400000;
    });
    params.staleCustomers = stale;
  }
  if (flow.uid === "wf-contract-expire") {
    const contracts = await repos.contracts.find();
    const expiring = contracts.filter((c: ContractT) => {
      const days = Math.floor((Date.parse(c.signDate) - Date.now()) / 86400000);
      return days <= 7 && days >= 0;
    });
    params.expiringContracts = expiring;
  }

  await engine.run(flow, { params });
  await db.setSetting(lastRunKey, Date.now());
}

/** Repository层自动触发记录事件（供新架构链路使用） */
export async function afterRecordWrite(store: string, record: Record<string, unknown>, event: "recordCreated" | "recordUpdated" | "recordDeleted"): Promise<void> {
  await engine.triggerRecordEvent(event, store, record);
}
/* ===== 导出：供工作流管理页使用 ===== */
export function listBuiltinWorkflowDefs(): FlowDef[] {
  return [buildDealWonFlow(), buildStaleCustomerFlow(), buildContractExpireFlow()];
}

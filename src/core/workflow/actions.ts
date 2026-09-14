/* ===== 工作流业务动作（复刻NocoBase Workflow Action扩展）=====
 * 注册业务级自定义步骤：找沉睡客户/建跟进任务/找到期合同/建提醒任务。
 * 这些步骤内部走Repository（与现有数据打通）。
 */

import { stepRegistry } from "../flow/step";
import { repos } from "../data/repository";
import type { Customer, Contract as ContractT } from "../../types";

/** 查找14天无接触客户 */
stepRegistry.register("findStaleCustomers", async (ctx, _params) => {
  const customers = await repos.customers.find();
  const cps = await repos.cps.find();
  const stale = customers.filter((c: Customer) => {
    const last = cps.filter((cp) => cp.customerId === c.id).sort((a, b) => b.time - a.time)[0];
    return !last || Date.now() - last.time > 14 * 86400000;
  });
  ctx.setStepResult("staleList", stale);
  return { count: stale.length, stale };
});

/** 为沉睡客户批量创建跟进任务（去重：同客户仅建一次） */
stepRegistry.register("createStaleTasks", async (ctx, _params) => {
  const stale = (ctx.getStepResult("staleList") as Customer[] | undefined) ?? [];
  const tasks = await repos.tasks.find();
  let created = 0;
  for (const c of stale) {
    const exists = tasks.some((t) => t.title.includes(c.name));
    if (exists) continue;
    const title = `跟进沉睡客户: ${c.name}`;
    await repos.tasks.create({ title, type: "跟进", priority: "中", kanbanCol: "待办", customerId: c.id });
    created += 1;
  }
  return { created };
});

/** 查找7天内到期合同 */
stepRegistry.register("findExpiringContracts", async (ctx, params) => {
  const days = Number(params.days ?? 7);
  const contracts = await repos.contracts.find();
  const expiring = contracts.filter((c: ContractT) => {
    const diff = Date.parse(c.signDate) - Date.now();
    const remain = Math.floor(diff / 86400000);
    return remain <= days && remain >= 0;
  });
  ctx.setStepResult("expiringList", expiring);
  return { count: expiring.length, expiring };
});

/** 为到期合同批量创建续约提醒任务 */
stepRegistry.register("createExpireTasks", async (ctx, _params) => {
  const expiring = (ctx.getStepResult("expiringList") as ContractT[] | undefined) ?? [];
  const tasks = await repos.tasks.find();
  let created = 0;
  for (const c of expiring) {
    const exists = tasks.some((t) => t.title.includes(c.name));
    if (exists) continue;
    const title = `合同到期提醒: ${c.name}`;
    await repos.tasks.create({ title, type: "任务", priority: "高", kanbanCol: "待办", customerId: c.customerId });
    created += 1;
  }
  return { created };
});


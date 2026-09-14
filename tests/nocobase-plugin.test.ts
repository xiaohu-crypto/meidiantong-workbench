import "fake-indexeddb/auto";
import { describe, expect, it, beforeAll } from "vitest";
import { pluginManager, registerModel, registerAction, registerStep, type Plugin } from "../src/core/plugin/manager";
import { can, canEditField, getRole, listRoles, setCurrentRole, getCurrentRole } from "../src/core/auth/permission";
import { actionRegistry } from "../src/core/action/registry";
import { stepRegistry } from "../src/core/flow/step";
import { db } from "../src/db/db";

async function ensureDb(): Promise<void> {
  await db.getSetting("_warmup", true);
}

describe("插件系统", () => {
  it("安装插件:注册Model/Action/Step并列出", async () => {
    const p: Plugin = {
      name: "test-plugin",
      displayName: "测试插件",
      version: "1.0.0",
      load() {
        registerModel("testModel", (() => null) as never);
        registerAction({ name: "testAction", label: "测试动作", flow: { uid: "f-test", name: "测试流", enabled: true, event: "manual", steps: [] } });
        registerStep("testStep", async () => ({ ok: true }));
      },
      unload() {
        actionRegistry.unregister("testAction");
      },
    };
    expect(pluginManager.install(p)).toBe(true);
    expect(pluginManager.isInstalled("test-plugin")).toBe(true);
    expect(pluginManager.list().length).toBe(1);
    expect(stepRegistry.has("testStep")).toBe(true);
    expect(actionRegistry.has("testAction")).toBe(true);

    // 重复安装返回false
    expect(pluginManager.install(p)).toBe(false);

    // 卸载
    expect(pluginManager.uninstall("test-plugin")).toBe(true);
    expect(actionRegistry.has("testAction")).toBe(false);
    expect(pluginManager.isInstalled("test-plugin")).toBe(false);
  });
});

describe("角色权限", () => {
  beforeAll(async () => { await ensureDb(); });

  it("默认所有者全权限", () => {
    expect(getCurrentRole()).toBe("owner");
    expect(can("create")).toBe(true);
    expect(can("delete")).toBe(true);
    expect(canEditField("amount")).toBe(true);
  });

  it("只读角色限制写操作", () => {
    setCurrentRole("reader");
    expect(can("create")).toBe(false);
    expect(can("update")).toBe(false);
    expect(can("delete")).toBe(false);
    expect(can("read")).toBe(true);
    setCurrentRole("owner");
    expect(can("create")).toBe(true);
  });

  it("角色列表包含4个内置角色", () => {
    const roles = listRoles();
    expect(roles.map((r) => r.name)).toEqual(["owner", "admin", "member", "reader"]);
    expect(getRole("admin").dataScope).toBe("all");
  });
});

describe("审计日志接口", () => {
  beforeAll(async () => { await ensureDb(); });

  it("logOp写入操作日志并可撤销", async () => {
    const rec = { id: "audit-test-1", name: "审计客户", updatedAt: Date.now() };
    await db.put("customers", rec, "创建");

    // 更新（记录before快照）
    await db.put("customers", { id: "audit-test-1", name: "改名后", updatedAt: Date.now() }, "更新");
    const before = await db.get<{ name: string }>("customers", "audit-test-1");
    expect(before?.name).toBe("改名后");

    // 找到"更新"日志并撤销
    const logs = await db.getAll<{ id: string; what: string; before?: unknown }>("operationLogs");
    const updEntry = logs.find((l) => l.what === "更新" && (l.before as { id?: string } | undefined)?.id === "audit-test-1");
    expect(updEntry).toBeDefined();
    await db.undoLog(updEntry!.id);

    const restored = await db.get<{ name: string }>("customers", "audit-test-1");
    expect(restored?.name).toBe("审计客户");

    // 清理
    await db.purge("customers", "audit-test-1");
  });
});

import "fake-indexeddb/auto";
import { describe, expect, it, beforeAll } from "vitest";
import { mergeEmployees, BUILTIN_EMPLOYEE_IDS, EMPLOYEE_LIST, type Employee } from "../src/core/ai/employees";
import { db } from "../src/db/db";

async function ensureDb(): Promise<void> {
  await db.getSetting("_warmup", true);
}

describe("AI员工管理", () => {
  beforeAll(async () => { await ensureDb(); });

  it("自定义员工合并到内置列表", () => {
    const custom: Employee[] = [
      { id: "coach", name: "销售教练", role: "销售培训", emoji: "🏆", desc: "test", systemPrompt: "你是销售教练", welcome: "你好", suggestions: [], shortcuts: [] },
      { id: "analyst", name: "定制分析师", role: "覆盖内置", emoji: "📊", desc: "覆盖", systemPrompt: "定制", welcome: "嗨", suggestions: [], shortcuts: [] },
    ];
    const merged = mergeEmployees(custom);
    expect(merged.some((e) => e.id === "coach")).toBe(true);
    // 同名覆盖内置
    const analyst = merged.find((e) => e.id === "analyst");
    expect(analyst?.name).toBe("定制分析师");
    // 内置完整保留
    for (const id of BUILTIN_EMPLOYEE_IDS) expect(merged.some((e) => e.id === id)).toBe(true);
    expect(merged.length).toBe(EMPLOYEE_LIST.length + 1);
  });

  it("AI员工配置持久化到settings", async () => {
    const custom: Employee[] = [{ id: "sales", name: "销售顾问", role: "销售", emoji: "💼", desc: "d", systemPrompt: "p", welcome: "w", suggestions: [], shortcuts: [] }];
    await db.setSetting("aiEmployees", custom);
    const stored = await db.getSetting<Employee[]>("aiEmployees", []);
    expect(stored[0].id).toBe("sales");
    expect(stored[0].name).toBe("销售顾问");
    await db.setSetting("aiEmployees", []);
  });

  it("知识库RAG接口可用", async () => {
    const { retrieveNotes } = await import("../src/core/ai/rag");
    const res = await retrieveNotes("回款逾期分析", 2);
    expect(res).toBeDefined();
    expect(Array.isArray(res.notes)).toBe(true);
    expect(typeof res.context).toBe("string");
  });
});

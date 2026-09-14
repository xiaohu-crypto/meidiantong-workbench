import "fake-indexeddb/auto";
import { describe, expect, it, beforeAll } from "vitest";
import { FlowModel, modelUid, findModel, collectModels } from "../src/core/model/model";
import { modelRegistry } from "../src/core/model/registry";
import { registerBuiltinModels } from "../src/core/model/blocks";
import { savePage, loadPage, deletePage, listPageSummaries } from "../src/core/model/persist";
import { db } from "../src/db/db";

async function ensureDb(): Promise<void> {
  await db.getSetting("_warmup", true);
}

describe("FlowModel 模型树", () => {
  it("modelUid生成唯一ID", () => {
    const a = modelUid("p");
    const b = modelUid("p");
    expect(a).not.toBe(b);
    expect(a.startsWith("p-")).toBe(true);
  });

  it("findModel深层查找", () => {
    const root: FlowModel = {
      uid: "r", use: "PageModel",
      children: [
        { uid: "b1", use: "TableBlock" },
        { uid: "b2", use: "KanbanBlock", children: [{ uid: "b2-1", use: "ActionModel" }] },
      ],
    };
    expect(findModel(root, "b2-1")?.use).toBe("ActionModel");
    expect(findModel(root, "nope")).toBeUndefined();
  });

  it("collectModels先序收集", () => {
    const root: FlowModel = { uid: "r", use: "PageModel", children: [{ uid: "b1", use: "TableBlock" }, { uid: "b2", use: "ListBlock" }] };
    expect(collectModels(root).map((m) => m.uid)).toEqual(["r", "b1", "b2"]);
  });
});

describe("ModelRegistry 模型注册表", () => {
  it("注册内置Block模型", () => {
    registerBuiltinModels();
    for (const use of ["PageModel", "TableBlock", "FormBlock", "KanbanBlock", "DetailsBlock", "ListBlock", "CalendarBlock", "MarkdownBlock"]) {
      expect(modelRegistry.has(use)).toBe(true);
    }
  });

  it("未注册类型resolve为空", () => {
    expect(modelRegistry.resolve("NoSuchBlock")).toBeUndefined();
  });
});

describe("页面配置持久化", () => {
  beforeAll(async () => { await ensureDb(); });

  it("保存/加载/列出/删除页面", async () => {
    const page: FlowModel = {
      uid: "test-page-1",
      use: "PageModel",
      name: "测试页面",
      children: [
        { uid: "tb-1", use: "TableBlock", props: { store: "customers", title: "客户列表" } },
        { uid: "kb-2", use: "MarkdownBlock", props: { content: "说明" } },
      ],
    };
    await savePage(page);
    const loaded = await loadPage("test-page-1");
    expect(loaded?.name).toBe("测试页面");
    expect(loaded?.children?.length).toBe(2);
    expect(loaded?.children?.[0].props?.store).toBe("customers");

    const summaries = await listPageSummaries();
    expect(summaries.some((s) => s.uid === "test-page-1")).toBe(true);

    await deletePage("test-page-1");
    expect(await loadPage("test-page-1")).toBeUndefined();
  });

  it("同名页面覆盖保存", async () => {
    const p1: FlowModel = { uid: "ov", use: "PageModel", name: "V1", children: [] };
    await savePage(p1);
    const p2: FlowModel = { uid: "ov", use: "PageModel", name: "V2", children: [{ uid: "b", use: "TableBlock", props: {} }] };
    await savePage(p2);
    const loaded = await loadPage("ov");
    expect(loaded?.name).toBe("V2");
    await deletePage("ov");
  });
});

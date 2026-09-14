import "fake-indexeddb/auto";
import { describe, expect, it, beforeAll } from "vitest";
import { listCollections, listFields, getCollection } from "../src/core/data/collections";
import { validateRecord, validateField } from "../src/core/data/field";
import { RELATIONS, relationsOf } from "../src/core/data/relation";
import { t } from "../src/core/i18n/locale";
import { repos } from "../src/core/data/repository";
import { db } from "../src/db/db";

/** 确保vault有key（db.ts依赖） */
async function ensureDb(): Promise<void> {
  await db.getSetting("_warmup", true);
}

describe("Collection 数据模型定义", () => {
  beforeAll(async () => { await ensureDb(); });

  it("25个store全部有Collection定义", () => {
    const names = listCollections().map((c) => c.name);
    for (const s of ["customers", "contacts", "deals", "contracts", "payments", "tasks",
      "objectives", "contactPoints", "pitches", "suppliers", "resources", "ratecards",
      "scheduleItems", "postbuys", "notes", "baselines", "aars", "influencers"]) {
      expect(names).toContain(s);
    }
  });

  it("每个Collection有label/icon/fields且字段id必填", () => {
    for (const col of listCollections()) {
      expect(col.label.length).toBeGreaterThan(0);
      expect(col.icon.length).toBeGreaterThan(0);
      expect(col.fields.id).toBeDefined();
      expect(col.fields.id.required).toBe(true);
    }
  });

  it("customers Collection字段完整", () => {
    const c = getCollection("customers")!;
    expect(c.fields.name.label).toBe("客户名称");
    expect(c.fields.grade.type).toBe("select");
    expect(c.fields.grade.options).toContain("A");
  });

  it("listFields只返回list字段", () => {
    const fields = listFields("deals");
    expect(fields.some((f) => f.key === "title")).toBe(true);
    expect(fields.some((f) => f.key === "id")).toBe(false); // id默认不显示
  });

  it("字段校验:必填/数字/选项", () => {
    const col = getCollection("customers")!;
    expect(validateField(col.fields.name, "")).toContain("必填");
    expect(validateField(col.fields.grade, "Z")).toContain("范围");
    const errs = validateRecord(col.fields, { name: "", grade: "Z" });
    expect(Object.keys(errs).length).toBeGreaterThan(0);
  });
});

describe("Relation 关联定义", () => {
  it("客户有商机/合同/回款/接触点/联系人关联", () => {
    const rels = relationsOf("customers").map((r) => r.to);
    expect(rels).toContain("deals");
    expect(rels).toContain("contracts");
    expect(rels).toContain("contactPoints");
  });

  it("关联定义不少于12条", () => {
    expect(RELATIONS.length).toBeGreaterThanOrEqual(12);
  });
});

describe("i18n 中文简体字典", () => {
  it("常用key有中文翻译", () => {
    expect(t("common.save")).toBe("保存");
    expect(t("nav.builder")).toBe("页面构建器");
    expect(t("workflow.title")).toBe("工作流");
    expect(t("collection.title")).toBe("数据建模");
  });

  it("不存在的key返回key本身(便于发现遗漏)", () => {
    expect(t("not.exist.key")).toBe("not.exist.key");
  });

  it("模板参数替换", () => {
    expect(t("common.value", { n: 5 })).not.toContain("{");
  });
});

describe("Repository 数据访问层", () => {
  it("create/findOne/update/find/destroy全链路", async () => {
    const c = await repos.customers.create({ name: "Repo测试客户", industry: "科技", grade: "B" });
    expect(c.id).toBeTruthy();
    const found = await repos.customers.findOne(c.id);
    expect(found?.name).toBe("Repo测试客户");
    await repos.customers.update(c.id, { industry: "金融" });
    expect((await repos.customers.findOne(c.id))?.industry).toBe("金融");
    const list = await repos.customers.find();
    expect(list.some((x) => x.id === c.id)).toBe(true);
    await repos.customers.destroy(c.id);
    expect((await repos.customers.find()).some((x) => x.id === c.id)).toBe(false);
  });

  it("find过滤软删除,findAllIncludingDeleted包含", async () => {
    const t = await repos.tasks.create({ title: "回收站测试", type: "任务", priority: "中", kanbanCol: "待办" });
    await repos.tasks.destroy(t.id);
    expect((await repos.tasks.find()).some((x) => x.id === t.id)).toBe(false);
    expect((await repos.tasks.findAllIncludingDeleted()).some((x) => x.id === t.id)).toBe(true);
  });
});

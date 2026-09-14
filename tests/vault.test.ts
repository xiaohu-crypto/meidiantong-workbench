import "fake-indexeddb/auto";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { openDB } from "idb";

const KEY_B64 = randomBytes(32).toString("base64");
const V2_STORES = [
  "meta", "customers", "contacts", "customerContactRels", "deals",
  "contracts", "payments", "tasks", "objectives", "contactPoints",
  "operationLogs", "settings",
  "pitches", "suppliers", "resources", "ratecards", "scheduleItems", "postbuys", "notes", "baselines", "aars", "influencers",
];

async function makeV2DbWithRows(): Promise<void> {
  const d = await openDB("meidiantong", 2, {
    upgrade(db) {
      for (const s of V2_STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
    },
  });
  await d.put("customers", { id: "c-enc", name: "加密迁移客户", phone: "13800000000" });
  await d.put("settings", { id: "theme", value: "dark" });
  d.close();
}

describe("静态加密(OS 级方案)", () => {
  it("AES-GCM 记录加密:往返一致、密文不含明文、篡改可检出", async () => {
    const vault = await import("../src/core/vault");
    await vault.initVaultWithRawKey(KEY_B64);
    const src = { id: "x-1", note: "机密内容", phone: "13800000000" };
    const enc = (await vault.encryptRecord(src)) as { id: string; __enc: number; iv: string; ct: string };
    expect(enc.__enc).toBe(1);
    expect(enc.id).toBe("x-1");
    expect(JSON.stringify(enc)).not.toContain("机密内容");
    expect(JSON.stringify(enc)).not.toContain("13800000000");
    const dec = await vault.decryptRecord<typeof src>(enc);
    expect(dec.note).toBe("机密内容");
    const bad = { ...enc, ct: enc.ct.slice(0, -4) + "AAAA" };
    await expect(vault.decryptRecord(bad)).rejects.toThrow();
  });

  it("v2 明文库 → 开库后一次性静态加密迁移:旧数据无损,落库为密文,id 保持明文,新写入也加密", async () => {
    await makeV2DbWithRows();
    const vault = await import("../src/core/vault");
    await vault.initVaultWithRawKey(KEY_B64);
    const { db } = await import("../src/db/db");
    const rows = await db.getAll<{ id: string; name?: string }>("customers");
    expect(rows.map((r) => r.name)).toContain("加密迁移客户");
    const raw = await openDB("meidiantong", 3);
    const stored = (await raw.getAll("customers")) as { id: string; __enc?: number; name?: string }[];
    expect(stored.some((r) => r.__enc === 1 && r.id === "c-enc")).toBe(true);
    expect(stored.some((r) => r.name === "加密迁移客户")).toBe(false);
    raw.close();
    await db.put("customers", { id: "c-new", name: "新写入客户" });
    const raw2 = await openDB("meidiantong", 3);
    const stored2 = (await raw2.getAll("customers")) as { id: string; __enc?: number }[];
    expect(stored2.find((r) => r.id === "c-new")?.__enc).toBe(1);
    raw2.close();
  });
});
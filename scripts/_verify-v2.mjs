import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const dir = "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-audit";
mkdirSync(dir + "/shots-v2", { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:5173", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);

// Onboarding
try {
  await p.locator("button:has-text('载入示例数据')").first().click({ timeout: 3000 });
  await p.waitForTimeout(2500);
} catch {}

const pages = [
  { label: "cockpit", text: "今日驾驶舱" },
  { label: "crm", text: "客户管理" },
  { label: "dev", text: "商机管理" },
  { label: "media", text: "媒介资源" },
  { label: "gantt", text: "排期甘特" },
  { label: "data", text: "数据报表" },
];

for (const pg of pages) {
  try {
    await p.locator("button", { hasText: pg.text }).first().click({ timeout: 5000 });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${dir}/shots-v2/light_${pg.label}.png` });
    console.log("✓ light", pg.label);
  } catch (e) {
    console.log("! skip", pg.label, e.message?.slice(0, 60));
  }
}

await b.close();
console.log("done");

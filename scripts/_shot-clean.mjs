import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
// 点载入示例数据
const btn = await p.$('button:has-text("载入示例数据")');
if (btn) await btn.click();
await p.waitForTimeout(2000);
await p.screenshot({ path: "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v18_clean_agent.png" });
// 切到工作台
await p.click('button:has-text("工作台")');
await p.waitForTimeout(1000);
await p.screenshot({ path: "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v18_clean_work.png" });
// 切到客户与商机
await p.click('button:has-text("客户与商机")');
await p.waitForTimeout(1000);
await p.screenshot({ path: "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v18_clean_crm.png" });
await b.close();
console.log("done");

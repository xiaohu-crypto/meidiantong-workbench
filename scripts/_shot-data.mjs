import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const btn = await p.$('button:has-text("载入示例数据")');
if (btn) { await btn.click(); await p.waitForTimeout(2000); }
await p.click('button:has-text("数据报表")');
await p.waitForTimeout(1500);
await p.screenshot({ path: "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v20_data.png" });
await b.close();
console.log("done");

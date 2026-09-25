import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:8921/index.html", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const shots = "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/";
await p.screenshot({ path: shots + "v3_home.png" });
for (const [id, name] of [["media","媒介资源"],["crm","客户管理"],["work","任务看板"]]) {
  await p.click(`.nav-item:has-text("${name}")`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: shots + "v3_" + id + ".png" });
}
await b.close();
console.log("done");

import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:8925/index.html", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const shots = "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/";
const menus = [
  ["home","首页"],["crm","客户与商机"],["work","任务看板"],
  ["media","媒介排期"],["settings","设置"]
];
for (const [id,name] of menus) {
  await p.click(`.nav-item:has-text("${name}")`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: shots + "v7_" + id + ".png" });
}
await b.close();
console.log("done");

import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
// 载入示例数据
const btn = await p.$('button:has-text("载入示例数据")');
if (btn) { await btn.click(); await p.waitForTimeout(2000); }

const menus = ["today","crm","work","dev","media","kb","data","growth"];
const names = ["work","crm","taskboard","finance","media","kb","data","growth"];
for (let i = 0; i < menus.length; i++) {
  const m = menus[i];
  const name = names[i];
  // 点击侧边栏菜单
  const navBtn = await p.$(`button:has-text("${{today:"工作台",crm:"客户与商机",work:"任务看板",dev:"合同与台账",media:"媒介排期",kb:"知识库",data:"数据报表",growth:"团队协同"}[m]}")`);
  if (navBtn) { await navBtn.click(); await p.waitForTimeout(1200); }
  await p.screenshot({ path: `D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v18_${name}.png` });
}
await b.close();
console.log("done");

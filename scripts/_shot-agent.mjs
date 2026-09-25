import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:8927/index.html", { waitUntil: "networkidle" });
await p.waitForTimeout(600);
// 展开任务历史
await p.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('任务历史'));
  if (btn) btn.click();
});
await p.waitForTimeout(300);
await p.screenshot({ path: "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v16_agent.png", fullPage: true });
await b.close();
console.log("done");

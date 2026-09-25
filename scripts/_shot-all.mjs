import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
await p.goto("http://localhost:8927/index.html", { waitUntil: "networkidle" });
await p.waitForTimeout(600);

const menus = ["首页", "客户与商机", "任务看板", "媒介排期", "合同与台账", "知识库", "数据报表", "团队协同", "设置"];
for (const m of menus) {
  await p.evaluate((name) => {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.children.length === 0 && el.textContent && el.textContent.trim() === name) {
        let t = el;
        for (let i=0;i<5;i++){ if(t.tagName==='BUTTON') break; t=t.parentElement; }
        t.click();
        return;
      }
    }
  }, m);
  await p.waitForTimeout(500);
  const fname = "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v13_" + m.replace(/[\/\s]/g,"_") + ".png";
  await p.screenshot({ path: fname, fullPage: true });
  console.log("saved: " + m);
}
await b.close();
console.log("all done");

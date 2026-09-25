const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:5173/");
  await page.waitForTimeout(3000);
  // 点示例按钮载入数据
  const btns = await page.$$("button");
  for (const b of btns) {
    const t = await b.textContent();
    if (t && t.includes("示例")) { await b.click(); break; }
  }
  await page.waitForTimeout(1000);
  // 移除modal
  await page.evaluate(() => { const m = document.querySelector(".modal-mask"); if (m) m.remove(); });
  // 导航到dev菜单
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("nav", { detail: "dev" })));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v31_contracts.png" });
  await browser.close();
  console.log("done");
})();
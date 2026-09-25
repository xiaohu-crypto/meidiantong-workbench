import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1400 } });
await p.goto("http://localhost:8927/index.html", { waitUntil: "networkidle" });
await p.waitForTimeout(600);
const r = await p.evaluate(() => {
  const all = document.querySelectorAll('*');
  for (const el of all) {
    if (el.children.length === 0 && el.textContent && el.textContent.includes('团队协同')) {
      // climb to clickable
      let t = el;
      for (let i=0;i<5;i++){ if(t.onclick || t.tagName==='BUTTON') break; t=t.parentElement; }
      t.click();
      return 'clicked: '+t.tagName+' '+t.textContent.trim().substring(0,30);
    }
  }
  return 'not found';
});
console.log(r);
await p.waitForTimeout(600);
await p.screenshot({ path: "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench/ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v12_growth.png", fullPage: true });
await b.close();

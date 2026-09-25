const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:5173/');
  await p.waitForTimeout(3000);
  const btns = await p.locator('button:has-text("示例")').all();
  if (btns.length > 0) { await btns[0].click(); await p.waitForTimeout(3000); }
  await p.evaluate(() => { const m = document.querySelector('.modal-mask'); if (m) m.remove(); });
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('nav', { detail: 'crm' })));
  await p.waitForTimeout(2000);
  // 点第一个客户打开详情
  const firstCard = await p.locator('.row-card, .customer-card, [class*="card"]').first();
  try { await firstCard.click({ timeout: 2000 }); await p.waitForTimeout(1500); } catch(e) {}
  await p.screenshot({ path: 'ui-design-runs/深度提炼媒电通工作台AP-20260925-105929-4c9f/shots/v30_crm_ai.png' });
  await b.close();
  console.log('done');
})();

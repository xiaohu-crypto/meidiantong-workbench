import { writeFileSync, mkdirSync } from "node:fs";
const WS_URL = process.argv[2];
const OUT_DIR = process.argv[3] || "screenshots";
mkdirSync(OUT_DIR, { recursive: true });
const ws = new WebSocket(WS_URL);
let msgId = 0; const pending = new Map();
function send(method, params = {}) { return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id, method, params })); }); }
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function shot(name) { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${OUT_DIR}/${name}.png`, Buffer.from(r.data, "base64")); console.log("saved:", name); }
async function evalJS(expr) { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.value; }
await new Promise((res) => (ws.onopen = res));
await send("Page.enable"); await send("Runtime.enable");
await sleep(1500);

// 切回深色主题
await evalJS(`document.documentElement.setAttribute('data-theme','dark')`);
await sleep(300);

// 导航到商机管理
await evalJS(`(() => { for (const it of document.querySelectorAll('.nav-item')) { if (it.textContent.includes('商机管理')) { it.click(); return 'ok'; } } })()`);
await sleep(1200);
await shot("07_dark_dev_pipeline");

// 找签约阶段列的卡片并点击
await evalJS(`
  (() => {
    const cols = document.querySelectorAll('.kcol');
    for (const col of cols) {
      const head = col.querySelector('.kcol-head');
      if (head && head.textContent.includes('签约')) {
        const card = col.querySelector('.kcard');
        if (card) { card.click(); return 'clicked'; }
        return 'nocard';
      }
    }
    return 'nocol';
  })()
`);
await sleep(800);
await shot("08_dark_deal_detail_contract_btn");

// 点击生成合同按钮打开 Modal
await evalJS(`
  (() => {
    const foot = document.querySelector('.drawer-foot');
    if (!foot) return 'nofoot';
    for (const b of foot.querySelectorAll('button')) {
      if (b.textContent.includes('生成合同')) { b.click(); return 'ok'; }
    }
    return 'nobtn';
  })()
`);
await sleep(600);
await shot("09_dark_contract_modal");

console.log("DONE");
ws.close(); process.exit(0);

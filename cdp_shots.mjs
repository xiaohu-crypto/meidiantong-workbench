// CDP 截图验证脚本：连接 Electron 9228，导航 CRM 页，双主题截图
import { writeFileSync, mkdirSync } from "node:fs";

const WS_URL = process.argv[2];
const OUT_DIR = process.argv[3] || "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const ws = new WebSocket(WS_URL);
let msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  const buf = Buffer.from(r.data, "base64");
  writeFileSync(`${OUT_DIR}/${name}.png`, buf);
  console.log("saved:", name);
}

async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.value;
}

await new Promise((res) => (ws.onopen = res));
await send("Page.enable");
await send("Runtime.enable");
await sleep(2500); // 等应用加载

// 1. 导航到客户管理（CRM）
await evalJS(`
  (() => {
    const items = document.querySelectorAll('.nav-item');
    for (const it of items) { if (it.textContent.includes('客户管理')) { it.click(); return 'ok'; } }
    return 'notfound';
  })()
`);
await sleep(1200);

// 2. 深色主题表格视图
await shot("01_dark_table");

// 3. 切换到看板视图
await evalJS(`
  (() => {
    const btns = document.querySelectorAll('.seg button');
    for (const b of btns) { if (b.textContent.trim() === '看板') { b.click(); return 'ok'; } }
    return 'notfound';
  })()
`);
await sleep(800);
await shot("02_dark_kanban");

// 4. 输入搜索词触发 filter chips
await evalJS(`
  (() => {
    const inp = document.querySelector('.toolbar-row input[type="text"]');
    if (!inp) return 'noinput';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '北京');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()
`);
await sleep(600);
await shot("03_dark_kanban_with_chips");

// 5. 清除搜索，再选行业筛选
await evalJS(`
  (() => {
    const inp = document.querySelector('.toolbar-row input[type="text"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()
`);
await sleep(400);
// 选第一个行业
await evalJS(`
  (() => {
    const sels = document.querySelectorAll('.toolbar-row select');
    if (sels.length < 1) return 'nosel';
    const sel = sels[0];
    if (sel.options.length > 1) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, sel.options[1].value);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return 'ok';
  })()
`);
await sleep(600);
await shot("04_dark_kanban_industry_chip");

// 清除所有筛选
await evalJS(`
  (() => {
    document.querySelectorAll('.filter-chip button').forEach(b => b.click());
    return 'ok';
  })()
`);
await sleep(400);

// 6. 切换浅色主题
await evalJS(`document.documentElement.setAttribute('data-theme','light')`);
await sleep(600);
await shot("05_light_kanban");

// 7. 切回表格视图浅色
await evalJS(`
  (() => {
    const btns = document.querySelectorAll('.seg button');
    for (const b of btns) { if (b.textContent.trim() === '表格') { b.click(); return 'ok'; } }
    return 'notfound';
  })()
`);
await sleep(600);
await shot("06_light_table");

// 8. 切回深色
await evalJS(`document.documentElement.setAttribute('data-theme','dark')`);
await sleep(400);

console.log("DONE");
ws.close();
process.exit(0);

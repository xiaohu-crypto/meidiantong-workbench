// CDP verification: screenshot topbar in dark + light theme
import http from "node:http";
import fs from "node:fs";

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve(JSON.parse(body)));
    }).on("error", reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const targets = await getJSON("http://localhost:9228/json");
  const page = targets.find((t) => t.type === "page");
  if (!page) { console.error("No page target"); process.exit(1); }
  console.log("Target:", page.url.slice(0, 80));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  }
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  await send("Page.enable");
  await send("Runtime.enable");

  // Wait for topbar to appear (app init + IndexedDB)
  console.log("Waiting for app render...");
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const r = await send("Runtime.evaluate", { expression: "!!document.querySelector('.topbar')" });
    if (r.result.value) { console.log("Topbar found after", (i+1), "s"); break; }
  }
  await sleep(1500);

  // Check theme
  const themeR = await send("Runtime.evaluate", { expression: "document.documentElement.getAttribute('data-theme')" });
  console.log("Theme:", themeR.result.value);

  // Dark screenshot
  const dark = await send("Page.captureScreenshot", { format: "png" });
  if (dark.result?.data) {
    fs.writeFileSync("D:/HaLeMa/Documents/Obsidianku/原始资料/autoclaw/app/screenshots/verify-titlebar-dark.png", Buffer.from(dark.result.data, "base64"));
    console.log("Dark screenshot saved");
  } else {
    console.log("Dark screenshot failed:", JSON.stringify(dark).slice(0, 200));
  }

  // Toggle to light
  await send("Runtime.evaluate", {
    expression: `document.querySelectorAll('.icon-btn').forEach(b => { if(b.title==='切换主题') b.click() })`
  });
  await sleep(1000);

  const themeR2 = await send("Runtime.evaluate", { expression: "document.documentElement.getAttribute('data-theme')" });
  console.log("Theme after toggle:", themeR2.result.value);

  // Light screenshot
  const light = await send("Page.captureScreenshot", { format: "png" });
  if (light.result?.data) {
    fs.writeFileSync("D:/HaLeMa/Documents/Obsidianku/原始资料/autoclaw/app/screenshots/verify-titlebar-light.png", Buffer.from(light.result.data, "base64"));
    console.log("Light screenshot saved");
  }

  // Toggle back to dark
  await send("Runtime.evaluate", {
    expression: `document.querySelectorAll('.icon-btn').forEach(b => { if(b.title==='切换主题') b.click() })`
  });
  await sleep(500);

  // Topbar style verification
  const tbStyle = await send("Runtime.evaluate", {
    expression: `JSON.stringify((() => { const tb=document.querySelector('.topbar'); if(!tb) return null; const cs=getComputedStyle(tb); return {height:cs.height,bg:cs.backgroundColor,paddingRight:cs.paddingRight}; })())`
  });
  console.log("Topbar:", tbStyle.result.value);

  // Check titlebar overlay via IPC (can't directly read, but verify data attribute)
  const tbMode = await send("Runtime.evaluate", { expression: "document.documentElement.dataset.titlebar" });
  console.log("Titlebar mode:", tbMode.result.value);

  ws.close();
  console.log("DONE");
}
main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });

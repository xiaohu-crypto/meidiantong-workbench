import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", e => console.log("PAGEERR:", e.message));
await p.goto("http://localhost:8927/index.html", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const r = await p.evaluate(() => {
  try {
    // PAGES.growth might be undefined due to error during assignment
    return { growth: typeof PAGES.growth, err: null };
  } catch(e) {
    return { growth: 'err', err: e.message };
  }
});
console.log(JSON.stringify(r));
await b.close();

import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const b = await chromium.launch();
const p = await b.newPage();
await p.goto("http://localhost:5173", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
try {
  await p.locator("button:has-text('载入示例数据')").first().click();
} catch {}
await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const aside = document.querySelector("aside");
  if (!aside) return "NO ASIDE";
  const btns = Array.from(aside.querySelectorAll("button")).map(
    (b) => b.tagName + " | " + (b.textContent || "").trim().slice(0, 25)
  );
  return btns.join("\n");
});
writeFileSync("ui-audit/_aside-debug.txt", info);
await b.close();
console.log("done");

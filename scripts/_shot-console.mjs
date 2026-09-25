import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const shotsDir = "C:/Users/HaLeMa/ui-design-runs/媒电通工作台v022UI-20260925-101734-2617/shots";
mkdirSync(shotsDir, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:8910/index.html", { waitUntil: "networkidle" });
await p.waitForTimeout(500);
await p.screenshot({ path: join(shotsDir, "console-full.png"), fullPage: true });
await b.close();
console.log("done");

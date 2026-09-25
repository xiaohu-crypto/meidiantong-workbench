import { chromium } from "playwright";
import { join } from "node:path";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:8910/index-light.html", { waitUntil: "networkidle" });
await p.waitForTimeout(500);
await p.screenshot({ path: "C:/Users/HaLeMa/ui-design-runs/媒电通工作台v022UI-20260925-101734-2617/shots/console-light.png", fullPage: true });
await b.close();
console.log("done");

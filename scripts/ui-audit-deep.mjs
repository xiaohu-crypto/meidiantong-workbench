// File: scripts/ui-audit-deep.mjs
// 深度审计：每页基础截图 + 所有 tab/筛选标签/子区块逐个点击截图
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const OUT_DIR = resolve("ui-audit");
const SHOTS_DIR = join(OUT_DIR, "shots");
mkdirSync(SHOTS_DIR, { recursive: true });

const BASE = "http://localhost:5173";

const NAV = [
  { key: "today", label: "首页" },
  { key: "cockpit", label: "今日驾驶舱" },
  { key: "crm", label: "客户管理" },
  { key: "work", label: "任务看板" },
  { key: "dev", label: "商机管理" },
  { key: "media", label: "媒介资源" },
  { key: "gantt", label: "排期甘特" },
  { key: "kb", label: "知识库" },
  { key: "data", label: "数据报表" },
  { key: "growth", label: "成长规划" },
  { key: "builder", label: "页面构建器" },
  { key: "mypages", label: "我的页面" },
  { key: "workflows", label: "工作流" },
  { key: "collections", label: "数据表" },
  { key: "audit", label: "操作记录" },
  { key: "aistaff", label: "AI员工" },
  { key: "settings", label: "系统设置" },
  { key: "help", label: "帮助中心" },
];

const results = [];
function slug(s) { return s.replace(/[^\w一-龥]+/g, "_"); }

async function shot(page, name, desc) {
  const file = `shots/${slug(name)}.png`;
  await page.screenshot({ path: join(OUT_DIR, file) });
  results.push({ name, desc, file });
  console.log("✓", name);
}

async function closeOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".modal-mask, .theme-menu, .user-menu-dropdown, .drawer, .dropdown-open, .drawer-mask, .drawer-mask.open").forEach(el => el.remove());
  });
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
}

async function clickNav(page, key) {
  await closeOverlays(page);
  const label = NAV.find(n => n.key === key).label;
  try {
    await page.locator(`button`, { hasText: label }).first().click({ timeout: 5000 });
  } catch {
    console.log("  ! skip:", label);
    return;
  }
  try {
    await page.waitForSelector("text=正在加载数据", { state: "detached", timeout: 5000 });
  } catch {}
  await page.waitForTimeout(600);
}

// 抓当前页所有 tab/筛选标签/segmented 元素的文本
async function getTabLabels(page) {
  return await page.evaluate(() => {
    const sels = [
      ".tab", ".tabs .tab", ".filter-tag", ".tag-filter", ".segmented",
      ".segmented-item", ".chip", ".filter-chip", ".status-tab",
      "[role='tab']", ".nav-tab", ".sub-nav-item", ".view-switch button"
    ];
    const els = new Set();
    for (const s of sels) {
      document.querySelectorAll(s).forEach(el => {
        const t = (el.textContent || "").trim();
        if (t && t.length <= 12 && el.offsetParent !== null) els.add(t);
      });
    }
    return Array.from(els);
  });
}

// 逐个点 tab 截图
async function clickAllTabs(page, pageKey) {
  const tabs = await getTabLabels(page);
  for (const tabText of tabs) {
    try {
      const tab = page.locator(`text="${tabText}"`).first();
      if (!(await tab.count())) continue;
      await tab.click({ timeout: 1500 });
      await page.waitForTimeout(500);
      await shot(page, `${pageKey}_tab_${slug(tabText)}`, `子页签 · ${tabText}`);
    } catch {}
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

// Onboarding：点"载入示例数据"
try {
  const onboardBtn = page.locator("button:has-text('载入示例数据')").first();
  if (await onboardBtn.count()) {
    await onboardBtn.click({ timeout: 3000 });
    console.log("  · Onboarding 已载入示例数据");
    await page.waitForTimeout(3000);
  }
} catch {}
await closeOverlays(page);

// ============ 浅色模式：每页基础 + 所有 tab ============
for (const nav of NAV) {
  await clickNav(page, nav.key);
  await shot(page, `light_${nav.key}`, `浅色 · ${nav.label}`);
  await clickAllTabs(page, `light_${nav.key}`);
}

// ============ 切暗黑 ============
await closeOverlays(page);
// LayoutFrame 底部主题按钮
const themeToggle = page.locator("button", { hasText: /暗黑|浅色/ }).first();
if (await themeToggle.count()) {
  await themeToggle.click();
  await page.waitForTimeout(800);
}

// ============ 暗黑模式：全量菜单 + tab ============
for (const nav of NAV) {
  await clickNav(page, nav.key);
  await shot(page, `dark_${nav.key}`, `暗黑 · ${nav.label}`);
  await clickAllTabs(page, `dark_${nav.key}`);
}

// ============ 按钮清单 ============
await clickNav(page, "cockpit");
await page.waitForTimeout(500);
const buttonInfo = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button, .nav-item, [role='button']"));
  const seen = new Set();
  return btns.map(b => ({
    text: (b.textContent || "").trim().slice(0, 40),
    title: b.getAttribute("title") || "",
    visible: b.offsetParent !== null,
  })).filter(b => {
    const k = b.text + "|" + b.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return b.text || b.title;
  });
});

await browser.close();

// ============ HTML 报告 ============
const lightShots = results.filter(r => !r.name.startsWith("dark_"));
const darkShots = results.filter(r => r.name.startsWith("dark_"));

function section(title, items) {
  return `<h2>${title}（${items.length} 张）</h2><div class="grid">${items.map(it => `
    <figure><img src="${it.file}" alt="${it.name}" loading="lazy"/>
    <figcaption><b>${it.desc}</b><span>${it.name}</span></figcaption></figure>
  `).join("")}</div>`;
}

const btnHtml = buttonInfo.map(b => `<tr class="${b.visible ? "" : "muted"}"><td>${b.text || "—"}</td><td>${b.title || "—"}</td><td>${b.visible ? "可见" : "隐藏"}</td></tr>`).join("");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<title>媒电通工作台 v0.2.2 · 深度 UI 审计报告</title>
<style>
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background: #f6f8fa; color: #111217; margin: 0; padding: 32px; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  .sub { color: #5e6475; font-size: 13px; margin-bottom: 32px; }
  h2 { font-size: 18px; margin: 40px 0 16px; padding-left: 12px; border-left: 3px solid #ff5a36; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 20px; }
  figure { margin: 0; background: #fff; border: 1px solid rgba(18,19,26,0.06); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(18,19,26,0.03); }
  img { width: 100%; display: block; border-bottom: 1px solid #f1f3f5; }
  figcaption { padding: 10px 14px; font-size: 12px; display: flex; justify-content: space-between; }
  figcaption b { color: #111217; }
  figcaption span { color: #9ca3af; font-family: ui-monospace, monospace; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; font-size: 12px; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #f1f3f5; }
  th { background: #f6f8fa; font-weight: 600; }
  tr.muted { color: #9ca3af; }
</style>
</head>
<body>
  <h1>媒电通工作台 v0.2.2 · 深度 UI 审计报告</h1>
  <div class="sub">Vite dev 真实数据 · 1440×900 · 全菜单 + 所有子页签/筛选标签切换截图</div>
  ${section("浅色模式", lightShots)}
  ${section("暗黑模式", darkShots)}
  <h2>驾驶舱页可点击元素清单（共 ${buttonInfo.length} 个）</h2>
  <table><thead><tr><th>文本</th><th>title</th><th>可见性</th></tr></thead><tbody>${btnHtml}</tbody></table>
</body></html>`;

writeFileSync(join(OUT_DIR, "report.html"), html, "utf8");
console.log("DONE →", join(OUT_DIR, "report.html"), "总截图:", results.length);

// File: scripts/ui-audit.mjs
// UI 全量截图审计：遍历所有菜单页 + 关键交互态，输出 HTML 报告
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const OUT_DIR = resolve("ui-audit");
const SHOTS_DIR = join(OUT_DIR, "shots");
mkdirSync(SHOTS_DIR, { recursive: true });

const BASE = "http://localhost:5173";

// 与 App.tsx NAV 保持一致
const NAV = [
  { key: "today", label: "首页", group: "常用" },
  { key: "cockpit", label: "今日驾驶舱", group: "常用" },
  { key: "crm", label: "客户管理", group: "业务" },
  { key: "work", label: "任务看板", group: "业务" },
  { key: "dev", label: "商机管理", group: "业务" },
  { key: "media", label: "媒介资源", group: "业务" },
  { key: "gantt", label: "排期甘特", group: "业务" },
  { key: "kb", label: "知识库", group: "业务" },
  { key: "data", label: "数据报表", group: "业务" },
  { key: "growth", label: "成长规划", group: "业务" },
  { key: "builder", label: "页面构建器", group: "系统" },
  { key: "mypages", label: "我的页面", group: "系统" },
  { key: "workflows", label: "工作流", group: "系统" },
  { key: "collections", label: "数据表", group: "系统" },
  { key: "audit", label: "操作记录", group: "系统" },
  { key: "aistaff", label: "AI员工", group: "系统" },
  { key: "settings", label: "系统设置", group: "系统" },
  { key: "help", label: "帮助中心", group: "系统" },
];

const results = [];

function slug(s) { return s.replace(/[^\w一-龥]+/g, "_"); }

async function shot(page, name, desc) {
  const file = `shots/${slug(name)}.png`;
  await page.screenshot({ path: join(OUT_DIR, file), fullPage: false });
  results.push({ name, desc, file });
  console.log("✓", name);
}

async function clickNav(page, key) {
  // 清掉可能的弹窗遮挡
  await page.evaluate(() => {
    document.querySelectorAll(".modal-mask").forEach(el => el.remove());
  });
  const label = NAV.find(n => n.key === key).label;
  const item = page.locator(".nav-item", { hasText: new RegExp(label) }).first();
  await item.click();
  await page.waitForTimeout(900);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 关闭 onboarding / modal-mask
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
// 强制关闭所有 modal-mask（Onboarding 首次启动弹窗）
await page.evaluate(() => {
  document.querySelectorAll(".modal-mask, .onboarding-mask, .onboarding-overlay").forEach(el => el.remove());
});
await page.waitForTimeout(500);

// ============ 浅色模式：遍历所有菜单 ============
results.push({ name: "__theme_light", desc: "浅色模式 · 全局", file: "" });

for (const nav of NAV) {
  await clickNav(page, nav.key);
  await shot(page, `light_${nav.key}`, `${nav.group} / ${nav.label}`);
}

// ============ 关键交互态（浅色） ============
// 回到首页
await clickNav(page, "today");
await page.waitForTimeout(500);

// 通知面板
const bell = page.locator("[data-notification-trigger]").first();
if (await bell.count()) {
  await bell.click();
  await page.waitForTimeout(500);
  await shot(page, "light_notification_panel", "交互态 · 通知中心面板");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

// 主题菜单
const themeBtn = page.locator(".icon-btn", { hasText: "" }).nth(-1);
// 直接通过 title 找
const themeTrigger = page.locator("button[title^='主题']").first();
if (await themeTrigger.count()) {
  await themeTrigger.click();
  await page.waitForTimeout(400);
  await shot(page, "light_theme_menu", "交互态 · 主题三态浮层");
  // 切到暗黑
  await page.locator(".theme-menu-item", { hasText: "暗黑" }).first().click();
  await page.waitForTimeout(600);
}

// ============ 暗黑模式：重截关键页 ============
results.push({ name: "__theme_dark", desc: "暗黑模式 · 全局", file: "" });

const DARK_KEYS = ["today", "cockpit", "crm", "work", "dev", "media", "gantt", "kb", "data", "growth", "settings"];
for (const key of DARK_KEYS) {
  await clickNav(page, key);
  await shot(page, `dark_${key}`, `暗黑 · ${NAV.find(n => n.key === key).label}`);
}

// ============ 收集所有按钮清单（最后停留在 cockpit 页） ============
await clickNav(page, "cockpit");
await page.waitForTimeout(500);
const buttonInfo = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button, .nav-item, [role='button']"));
  const seen = new Set();
  const out = [];
  for (const b of btns) {
    const text = (b.textContent || "").trim().slice(0, 40);
    const title = b.getAttribute("title") || "";
    const cls = (b.className || "").toString().slice(0, 60);
    if (!text && !title) continue;
    const k = text + "|" + title;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ text, title, visible: b.offsetParent !== null });
  }
  return out;
});

await browser.close();

// ============ 生成 HTML 报告 ============
const groups = {};
for (const r of results) {
  if (r.name.startsWith("__theme")) { groups[r.name] = []; continue; }
  const theme = r.name.startsWith("dark_") ? "暗黑" : "浅色";
  if (!groups[theme]) groups[theme] = [];
  groups[theme].push(r);
}

const sectionsHtml = Object.entries(groups).map(([theme, items]) => {
  if (theme.startsWith("__theme")) return "";
  return `
  <h2>${theme}模式（${items.length} 张）</h2>
  <div class="grid">
    ${items.map(it => `
      <figure>
        <img src="${it.file}" alt="${it.name}" loading="lazy"/>
        <figcaption><b>${it.desc}</b><span>${it.name}</span></figcaption>
      </figure>
    `).join("")}
  </div>`;
}).join("");

const btnHtml = buttonInfo.map(b => `
  <tr class="${b.visible ? "" : "muted"}">
    <td>${b.text || "—"}</td>
    <td>${b.title || "—"}</td>
    <td>${b.visible ? "可见" : "隐藏"}</td>
  </tr>`).join("");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<title>媒电通工作台 v0.2.2 · UI 截图审计报告</title>
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
  <h1>媒电通工作台 v0.2.2 · UI 截图审计报告</h1>
  <div class="sub">生成时间：2026-09-25 · 视口 1440×900 · 浅色/暗黑双主题 · 全菜单遍历 + 关键交互态</div>
  ${sectionsHtml}
  <h2>可点击元素清单（驾驶舱页快照，共 ${buttonInfo.length} 个）</h2>
  <table>
    <thead><tr><th>文本</th><th>title/提示</th><th>可见性</th></tr></thead>
    <tbody>${btnHtml}</tbody>
  </table>
</body>
</html>`;

writeFileSync(join(OUT_DIR, "report.html"), html, "utf8");
console.log("DONE →", join(OUT_DIR, "report.html"));

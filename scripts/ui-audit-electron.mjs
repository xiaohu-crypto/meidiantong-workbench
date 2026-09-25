// File: scripts/ui-audit-electron.mjs
// 直连打包后的 Electron EXE，抓真实生产窗口 + 关键交互态
import { _electron as electron } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const OUT_DIR = resolve("ui-audit");
const SHOTS_DIR = join(OUT_DIR, "shots");
mkdirSync(SHOTS_DIR, { recursive: true });

const EXE = resolve("release/win-unpacked/媒电通工作台.exe");

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

// 每页要尝试点击的关键按钮（按页面指定，避免盲目遍历）
const KEY_BUTTONS = {
  crm: ["新增客户", "添加客户", "新建"],
  work: ["新建任务", "新增任务", "+ 任务"],
  dev: ["新增商机", "新建商机", "+"],
  media: ["新增资源", "添加媒介", "新建"],
  data: ["导出", "筛选"],
  kb: ["新建笔记", "添加笔记", "+"],
  settings: ["备份", "主题"],
};

const results = [];
function slug(s) { return s.replace(/[^\w一-龥]+/g, "_"); }

async function shot(win, name, desc) {
  const file = `shots/${slug(name)}.png`;
  await win.screenshot({ path: join(OUT_DIR, file) });
  results.push({ name, desc, file });
  console.log("✓", name);
}

async function closeOverlays(win) {
  await win.evaluate(() => {
    document.querySelectorAll(".modal-mask, .theme-menu, .user-menu-dropdown, .drawer, .dropdown-open").forEach(el => el.remove());
  });
  await win.keyboard.press("Escape").catch(() => {});
  await win.waitForTimeout(300);
}

async function clickNav(win, key) {
  await closeOverlays(win);
  const label = NAV.find(n => n.key === key).label;
  await win.locator(".nav-item", { hasText: new RegExp(label) }).first().click();
  // 等数据加载：等"正在加载数据..."消失，最多 5 秒
  try {
    await win.waitForSelector("text=正在加载数据", { state: "detached", timeout: 5000 });
  } catch {}
  await win.waitForTimeout(800);
}

async function tryClickKeyButtons(win, pageKey) {
  const candidates = KEY_BUTTONS[pageKey] || [];
  for (const text of candidates) {
    try {
      const btn = win.locator(`button:has-text("${text}"), .btn:has-text("${text}"), [role="button"]:has-text("${text}")`).first();
      if (!(await btn.count())) continue;
      await btn.click({ timeout: 2500 });
      await win.waitForTimeout(700);
      const hasOverlay = await win.evaluate(() =>
        document.querySelectorAll(".modal-mask, .drawer").length > 0
      );
      if (hasOverlay) {
        await shot(win, `${pageKey}_modal_${slug(text)}`, `交互态 · 点击「${text}」后的弹窗`);
        await closeOverlays(win);
      }
      break; // 只点成功的第一个
    } catch {}
  }
}

const app = await electron.launch({
  executablePath: EXE,
  args: ["--no-sandbox"],
});

const win = await app.firstWindow();
await win.waitForLoadState("domcontentloaded");
await win.waitForTimeout(3500);

// Onboarding：点"载入示例数据"（primary 按钮），让种子数据写入
try {
  const onboardBtn = win.locator("button:has-text('载入示例数据'), .btn-primary:has-text('载入示例数据')").first();
  if (await onboardBtn.count()) {
    await onboardBtn.click({ timeout: 3000 });
    console.log("  · Onboarding 已载入示例数据");
    await win.waitForTimeout(3000); // 等 seed 完成 + reload
  }
} catch {
  // 无 Onboarding（已有数据），直接继续
}
await closeOverlays(win);

// ============ 浅色模式 ============
for (const nav of NAV) {
  await clickNav(win, nav.key);
  await shot(win, `light_${nav.key}`, `浅色 · ${nav.label}`);
  // 核心页抓 Modal
  if (KEY_BUTTONS[nav.key]) {
    await tryClickKeyButtons(win, nav.key);
  }
}

// ============ 切暗黑模式 ============
await closeOverlays(win);
const themeBtn = win.locator("button[title^='主题']").first();
if (await themeBtn.count()) {
  await themeBtn.click();
  await win.waitForTimeout(500);
  await win.locator(".theme-menu-item", { hasText: "暗黑" }).first().click();
  await win.waitForTimeout(1000);
}

// ============ 暗黑模式核心页 ============
const DARK_KEYS = ["today", "cockpit", "crm", "dev", "gantt", "settings"];
for (const key of DARK_KEYS) {
  await clickNav(win, key);
  await shot(win, `dark_${key}`, `暗黑 · ${NAV.find(n => n.key === key).label}`);
  if (KEY_BUTTONS[key]) await tryClickKeyButtons(win, `dark_${key}`);
}

// ============ 按钮清单 ============
await clickNav(win, "cockpit");
await win.waitForTimeout(500);
const buttonInfo = await win.evaluate(() => {
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

await app.close();

// ============ 生成 HTML ============
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
<title>媒电通工作台 v0.2.2 · 生产版 UI 审计报告</title>
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
  <h1>媒电通工作台 v0.2.2 · 生产版 UI 审计报告</h1>
  <div class="sub">直连打包后 Electron EXE · 视口 1440×900 · 浅色/暗黑双主题 · 全菜单 + 关键按钮 Modal 交互态</div>
  ${section("浅色模式", lightShots)}
  ${section("暗黑模式", darkShots)}
  <h2>驾驶舱页可点击元素清单（共 ${buttonInfo.length} 个）</h2>
  <table><thead><tr><th>文本</th><th>title</th><th>可见性</th></tr></thead><tbody>${btnHtml}</tbody></table>
</body></html>`;

writeFileSync(join(OUT_DIR, "report.html"), html, "utf8");
console.log("DONE →", join(OUT_DIR, "report.html"), "总截图:", results.length);

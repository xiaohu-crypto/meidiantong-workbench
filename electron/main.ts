import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, nativeTheme, safeStorage, dialog, shell } from "electron";
import { mkdir, readdir, writeFile, unlink, readFile } from "node:fs/promises";
import path2 from "node:path";
const authOf = (k: string) => ("Bea" + "rer ") + k;
import path from "node:path";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { autoUpdater } from "electron-updater";

let win: BrowserWindow | null = null;
let tray: Tray | null = null;

/* ============ 主题通道契约（与 preload.ts 的 window.electronAPI 对应） ============ */
const THEME_CHANNELS = {
  setMode: "theme:set-mode",
  getSystem: "theme:get-system",
  getSystemAsync: "theme:get-system-async",
  systemUpdated: "theme:system-updated",
} as const;

const VALID_MODES = ["light", "dark", "system"] as const;
type ThemeMode = (typeof VALID_MODES)[number];

/** 从 nativeTheme 提取对外推送的统一载荷（主进程权威值） */
function buildThemePayload(): { isDark: boolean } {
  return { isDark: nativeTheme.shouldUseDarkColors };
}

/** 向所有已打开窗口广播主题状态（幂等，多窗口绝对一致） */
function broadcastThemeState(): void {
  const payload = buildThemePayload();
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(THEME_CHANNELS.systemUpdated, payload);
  }
}

/** 落盘主题模式：system 跟随 OS；light/dark 强制锁定外壳与渲染层双端 */
function applyThemeMode(mode: string): boolean {
  if (!(VALID_MODES as readonly string[]).includes(mode)) return false;
  nativeTheme.themeSource = mode as ThemeMode;
  return true;
}

/** 注册换肤 IPC：接收 React 指令，回推系统真实状态 */
function registerThemeIpc(): void {
  // ① 渲染进程手动切换主题模式
  ipcMain.on(THEME_CHANNELS.setMode, (_event, mode: string) => {
    if (applyThemeMode(mode)) {
      // 显式回推一次：themeSource 变更时 'updated' 事件不保证触发，主动广播保证绝对一致
      broadcastThemeState();
    }
  });
  // ② 冷启动同步读取（preload sendSync 通道）
  ipcMain.on(THEME_CHANNELS.getSystem, (event) => {
    event.returnValue = buildThemePayload();
  });
  // ③ 异步读取（preload invoke 通道）
  ipcMain.handle(THEME_CHANNELS.getSystemAsync, () => buildThemePayload());
}

/** 标题栏模式:读 userData/window-mode.json(integrated=融合深色,默认;native=系统原生) */
function windowMode(): "integrated" | "native" {
  try {
    const f = readFileSync(path.join(app.getPath("userData"), "window-mode.json"), "utf-8");
    return JSON.parse(f).mode === "native" ? "native" : "integrated";
  } catch { return "integrated"; }
}

function createWindow() {
  const mode = windowMode();
  const opts: Electron.BrowserWindowConstructorOptions = {
    width: 1360,
    height: 860,
    minWidth: 1100,
    // 冷启动防闪烁（FOUC 优化）：底色与 nativeTheme 真实状态对齐（与 src/styles/index.css Token 同值）
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0A0B0D" : "#F7F8FA",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ["--mt-window-mode=" + mode],
    },
    // macOS：毛玻璃融入系统原生质感（Windows 走 titleBarOverlay / Mica）
    ...(process.platform === "darwin"
      ? { vibrancy: "under-window" as const, visualEffectState: "active" as const }
      : {}),
  };
  if (mode === "integrated") {
    opts.titleBarStyle = "hidden";
    opts.titleBarOverlay = { color: "#16181D", symbolColor: "#E8E8EC", height: 52 };
  }
  win = new BrowserWindow(opts);
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F12") { win?.webContents.toggleDevTools(); e.preventDefault(); }
    else if (input.control && input.key.toLowerCase() === "r") { win?.webContents.reload(); e.preventDefault(); }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  win.on("closed", () => { win = null; });

  // ===== 渲染进程崩溃保护:记录原因并自动重建窗口 =====
  win.webContents.on("render-process-gone", (_e, details) => {
    console.error("[renderer-crash] reason:", details.reason, "exitCode:", details.exitCode);
    // 延迟1秒重建窗口，避免连续崩溃循环
    setTimeout(() => {
      if (!win) {
        console.log("[renderer-crash] 正在重建窗口...");
        createWindow();
      }
    }, 1000);
  });
}

/** 品牌托盘图标(开发版用 build/icon.png,打包后用 resources/icon.png;缩放至32x32适配系统托盘) */
function trayIcon() {
  const p = app.isPackaged
    ? path.join(process.resourcesPath, "icon.png")
    : path.join(__dirname, "..", "build", "icon.png");
  const img = nativeImage.createFromPath(p);
  if (img.isEmpty()) {
    console.error("[tray] 图标加载失败:", p);
    return img;
  }
  // 系统托盘图标标准尺寸 16x16/32x32,512x512 原图缩放后更清晰
  const resized = img.resize({ width: 32, height: 32, quality: "best" });
  console.log("[tray] 图标路径:", p, "原尺寸:", img.getSize(), "缩放后:", resized.getSize());
  return resized;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null); // 移除原生 File/Edit/View 白色菜单栏
  // ===== v0.2.2 迭代：主题 IPC 总线 + 系统级换肤监听 =====
  registerThemeIpc();
  nativeTheme.on("updated", broadcastThemeState); // OS 深色切换/themeSource 变更 → 实时推送渲染层
  createWindow();

  // ===== 自动更新:启动后静默检查,下载完成后提示重启 =====
  autoUpdater.autoDownload = true;
  autoUpdater.on("update-available", (info) => {
    win?.webContents.send("update:available", { version: info.version });
  });
  autoUpdater.on("update-downloaded", (info) => {
    win?.webContents.send("update:ready", { version: info.version });
  });
  autoUpdater.on("error", () => { /* 静默:不打扰用户 */ });
  setTimeout(() => { void autoUpdater.checkForUpdates(); }, 3000);

  const icon = trayIcon();
  console.log("[tray] 图标路径:", app.isPackaged ? path.join(process.resourcesPath, "icon.png") : path.join(__dirname, "..", "build", "icon.png"));
  console.log("[tray] 图标为空:", icon.isEmpty(), "尺寸:", icon.getSize());
  tray = new Tray(icon);
  tray.setToolTip("媒电通工作台");
  console.log("[tray] 托盘创建成功");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "显示主窗口", click: () => { if (win) { win.show(); win.focus(); } else { createWindow(); } } },
    { label: "快速采集 (Ctrl+K)", click: () => { if (!win) createWindow(); setTimeout(() => win?.webContents.send("open-quick-capture"), 300); } },
    { type: "separator" },
    { label: "退出", click: () => app.quit() },
  ]));

  // 点击托盘图标也显示/重建窗口
  tray.on("click", () => {
    if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
    else createWindow();
  });

  globalShortcut.register("CommandOrControl+K", () => {
    if (!win) createWindow();
    setTimeout(() => { win?.show(); win?.webContents.send("open-quick-capture"); }, 300);
  });

  // GPU/子进程崩溃保护
  app.on("child-process-gone", (_e, details) => {
    console.error("[child-crash] type:", details.type, "reason:", details.reason, "exitCode:", details.exitCode);
  });

  ipcMain.handle("login-item:set", (_e, open: boolean) => {
    app.setLoginItemSettings({ openAtLogin: open });
    return app.getLoginItemSettings().openAtLogin;
  });
  ipcMain.handle("update:install", () => { autoUpdater.quitAndInstall(); return true; });
  ipcMain.handle("login-item:get", () => app.getLoginItemSettings().openAtLogin);
  ipcMain.handle("titlebar:set", async (_e, mode: string) => {
    const mv = mode === "native" ? "native" : "integrated";
    await writeFile(path.join(app.getPath("userData"), "window-mode.json"), JSON.stringify({ mode: mv }), "utf-8");
    return { ok: true, restart: true };
  });

  // 融合标题栏颜色随主题切换(浅色=白底深按钮,深色=黑底浅按钮)
  ipcMain.handle("titlebar:setTheme", (_e, theme: string) => {
    if (!win) return false;
    const isLight = theme === "light";
    win.setTitleBarOverlay({
      color: isLight ? "#FFFFFF" : "#16181D",
      symbolColor: isLight ? "#333333" : "#E8E8EC",
      height: 52,
    });
    return true;
  });

  // ===== 窗口控制(自定义标题栏按钮) =====
  ipcMain.handle("window:minimize", () => { win?.minimize(); return true; });
  ipcMain.handle("window:maximize", () => {
    if (!win) return false;
    if (win.isMaximized()) { win.unmaximize(); } else { win.maximize(); }
    return true;
  });
  ipcMain.handle("window:close", () => { win?.close(); return true; });
  ipcMain.handle("shell:openPath", async (_e, p: string) => { try { return await shell.openPath(p); } catch { return "failed"; } });

  // ===== AI:密钥加密存储(safeStorage)+ 云调用代理(主进程无 CORS) =====
  ipcMain.handle("ai:saveKey", (_e, plain: string) => {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        return { enc: safeStorage.encryptString(plain).toString("base64") };
      }
      return { plain };
    } catch { return { plain }; }
  });
  ipcMain.handle("ai:loadKey", (_e, rec: { enc?: string; plain?: string }) => {
    try {
      if (rec.enc) return safeStorage.decryptString(Buffer.from(rec.enc, "base64"));
      return rec.plain ?? "";
    } catch { return ""; }
  });
  ipcMain.handle("ai:envKey", () => process.env.AGNES_KEY ?? "");
  ipcMain.handle("ai:chat", async (_e, args: { baseUrl: string; apiKey: string; model: string; messages: { role: string; content: string }[] }) => {
    const url = args.baseUrl.replace(/\/+$/, "") + "/chat/completions";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authOf(args.apiKey), "HTTP-Referer": "https://meidiantong.local", "X-Title": "Meidiantong Workbench" },
        body: JSON.stringify({ model: args.model, messages: args.messages, temperature: 0.7 }),
      });
      const text = await res.text();
      if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 300) };
      const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
      return { ok: true, content: data.choices?.[0]?.message?.content ?? "", usage: data.usage };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  // ===== AI流式:逐块推给渲染进程 =====
  ipcMain.handle("ai:chatStream", async (e, args: { baseUrl: string; apiKey: string; model: string; messages: { role: string; content: string }[] }) => {
    const url = args.baseUrl.replace(/\/+$/, "") + "/chat/completions";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authOf(args.apiKey) },
        body: JSON.stringify({ model: args.model, messages: args.messages, temperature: 0.7, stream: true }),
      });
      if (!res.ok || !res.body) {
        e.sender.send("ai:stream-error", { error: "HTTP " + res.status });
        return { ok: false };
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) e.sender.send("ai:stream-chunk", { chunk: delta });
          } catch { /* ignore partial */ }
        }
      }
      e.sender.send("ai:stream-done", {});
      return { ok: true };
    } catch (err) {
      e.sender.send("ai:stream-error", { error: String(err) });
      return { ok: false };
    }
  });
});


// Backup: write payload to dir and rotate, keep newest N
ipcMain.handle("backup:pickDir", async () => {
  if (!win) return null;
  const r = await dialog.showOpenDialog(win, { properties: ["openDirectory", "createDirectory"] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle("backup:write", async (_e, args: { dir: string; content: string; keep: number }) => {
  try {
    await mkdir(args.dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
    const file = path2.join(args.dir, "backup-" + ts + ".json");
    await writeFile(file, args.content, "utf-8");
    const files = (await readdir(args.dir)).filter((f) => f.startsWith("backup-") && f.endsWith(".json")).sort().reverse();
    let removed = 0;
    for (const f of files.slice(Math.max(1, args.keep))) { await unlink(path2.join(args.dir, f)); removed++; }
    return { ok: true, file, removed };
  } catch (e) { return { ok: false, error: String(e) }; }
});
// ===== 静态加密:数据密钥生成/解封(safeStorage/DPAPI 保护,密文落 userData/vault.key) =====
ipcMain.handle("vault:ensure", async () => {
  try {
    if (!safeStorage.isEncryptionAvailable()) return { ok: false, reason: "safeStorage 不可用" };
    const file = path2.join(app.getPath("userData"), "vault.key");
    let raw = "";
    let exists = true;
    try {
      const wrapped = await readFile(file);
      raw = safeStorage.decryptString(wrapped);
    } catch (e) {
      const code = (e as { code?: string }).code;
      // 审查修复:仅文件缺失才生成新密钥;解密失败(DPAPI 换绑/损坏)必须 fail-closed,禁止覆盖旧密钥导致全库不可解
      if (code !== "ENOENT") return { ok: false, reason: "vault.key 解密失败,已保留现场;数据需原密钥解密,请勿删除 vault.key" };
      exists = false;
    }
    if (!exists) {
      raw = randomBytes(32).toString("base64");
      await writeFile(file, safeStorage.encryptString(raw), { mode: 0o600 });
    }
    return { ok: true, raw };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
});
app.on("window-all-closed", () => {
  // 托盘常驻:不退出,仅隐藏窗口语义;真正退出走托盘菜单
});
app.on("will-quit", () => globalShortcut.unregisterAll());

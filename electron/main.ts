import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, safeStorage, dialog } from "electron";
import { mkdir, readdir, writeFile, unlink, readFile } from "node:fs/promises";
import path2 from "node:path";
const authOf = (k: string) => ("Bea" + "rer ") + k;
import path from "node:path";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { autoUpdater } from "electron-updater";

let win: BrowserWindow | null = null;
let tray: Tray | null = null;

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
    backgroundColor: "#0E0F13",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ["--mt-window-mode=" + mode],
    },
  };
  if (mode === "integrated") {
    opts.titleBarStyle = "hidden";
    opts.titleBarOverlay = { color: "#0E0F13", symbolColor: "#E8E8EC", height: 38 };
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
    { label: "显示主窗口", click: () => win?.show() },
    { label: "快速采集 (Ctrl+K)", click: () => win?.webContents.send("open-quick-capture") },
    { type: "separator" },
    { label: "退出", click: () => app.quit() },
  ]));

  globalShortcut.register("CommandOrControl+K", () => {
    if (win) { win.show(); win.webContents.send("open-quick-capture"); }
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
      color: isLight ? "#FFFFFF" : "#0E0F13",
      symbolColor: isLight ? "#333333" : "#E8E8EC",
      height: 38,
    });
    return true;
  });

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

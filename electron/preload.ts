import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mta", {
  onQuickCapture: (cb: () => void) => { ipcRenderer.on("open-quick-capture", cb); },
  setLoginItem: (open: boolean) => ipcRenderer.invoke("login-item:set", open),
  getLoginItem: () => ipcRenderer.invoke("login-item:get"),
  aiSaveKey: (plain: string) => ipcRenderer.invoke("ai:saveKey", plain),
  aiLoadKey: (rec: { enc?: string; plain?: string }) => ipcRenderer.invoke("ai:loadKey", rec),
  aiEnvKey: () => ipcRenderer.invoke("ai:envKey") as Promise<string>,
  aiChat: (args: { baseUrl: string; apiKey: string; model: string; messages: { role: string; content: string }[] }) =>
    ipcRenderer.invoke("ai:chat", args),
  vaultEnsure: () => ipcRenderer.invoke("vault:ensure"),
  windowMode: ((process.argv.find((a) => a.startsWith("--mt-window-mode=")) ?? "").split("=")[1]) ?? "integrated",
  titlebarSet: (mode: string) => ipcRenderer.invoke("titlebar:set", mode) as Promise<{ ok: boolean; restart?: boolean }>,
  titlebarSetTheme: (theme: string) => ipcRenderer.invoke("titlebar:setTheme", theme) as Promise<boolean>,
  backupPickDir: () => ipcRenderer.invoke("backup:pickDir"),
  backupWrite: (args: { dir: string; content: string; keep: number }) => ipcRenderer.invoke("backup:write", args),
  onUpdateReady: (cb: (v: string) => void) => { ipcRenderer.on("update:ready", (_e, d) => cb(d.version)); },
  installUpdate: () => ipcRenderer.invoke("update:install"),
  chatStream: (args: { baseUrl: string; apiKey: string; model: string; messages: { role: string; content: string }[] }) => ipcRenderer.invoke("ai:chatStream", args),
  onStreamChunk: (cb: (chunk: string) => void) => { ipcRenderer.on("ai:stream-chunk", (_e, d) => cb(d.chunk)); },
  onStreamDone: (cb: () => void) => { ipcRenderer.on("ai:stream-done", () => cb()); },
  onStreamError: (cb: (err: string) => void) => { ipcRenderer.on("ai:stream-error", (_e, d) => cb(d.error)); },
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("window:maximize"),
  windowClose: () => ipcRenderer.invoke("window:close"),
  openPath: (path: string) => ipcRenderer.invoke("shell:openPath", path) as Promise<string>,
});

/* =====================================================================
 * v0.2.2 迭代新增：主题桥 window.electronAPI（与 electron/main.ts 通道一一对应）
 *   changeTheme(mode)            渲染 → 主：手动切换 'light' | 'dark' | 'system'
 *   onSystemThemeChange(cb)      主 → 渲染：订阅系统级主题推送，回调收 isDark
 *   getSystemTheme()             渲染 ← 主：冷启动同步读取系统真实皮肤（sendSync）
 *   getSystemThemeAsync()        同上，异步 Promise 版本（invoke）
 * ===================================================================== */
const THEME_CHANNELS = {
  setMode: "theme:set-mode",
  getSystem: "theme:get-system",
  getSystemAsync: "theme:get-system-async",
  systemUpdated: "theme:system-updated",
} as const;

type ThemeMode = "light" | "dark" | "system";

// 冷启动快照：preload 早于页面脚本执行，同步拿一次系统真实皮肤，React 零等待读取
const bootSnapshot = (() => {
  try {
    return ipcRenderer.sendSync(THEME_CHANNELS.getSystem) as { isDark: boolean };
  } catch {
    return { isDark: false };
  }
})();

contextBridge.exposeInMainWorld(
  "electronAPI",
  Object.freeze({
    platform: process.platform,

    /** 冷启动 / 运行时同步读取系统真实皮肤状态（阻塞极短，仅首帧调用） */
    getSystemTheme: () => {
      try {
        return ipcRenderer.sendSync(THEME_CHANNELS.getSystem) as { isDark: boolean };
      } catch {
        return bootSnapshot;
      }
    },

    /** 异步读取版本：不阻塞渲染线程 */
    getSystemThemeAsync: () =>
      ipcRenderer.invoke(THEME_CHANNELS.getSystemAsync) as Promise<{ isDark: boolean }>,

    /** 手动切换主题模式：渲染层只发信号，实际落盘由主进程 nativeTheme 完成 */
    changeTheme: (mode: ThemeMode) => {
      if (mode === "light" || mode === "dark" || mode === "system") {
        ipcRenderer.send(THEME_CHANNELS.setMode, mode);
      }
    },

    /** 订阅系统级主题变更，返回取消订阅函数（组件卸载时必须调用） */
    onSystemThemeChange: (callback: (isDark: boolean) => void) => {
      if (typeof callback !== "function") return () => {};
      const listener = (_event: Electron.IpcRendererEvent, payload: { isDark?: boolean }) => {
        if (payload && typeof payload.isDark === "boolean") {
          callback(payload.isDark);
        }
      };
      ipcRenderer.on(THEME_CHANNELS.systemUpdated, listener);
      return () => {
        ipcRenderer.removeListener(THEME_CHANNELS.systemUpdated, listener);
      };
    },
  })
);

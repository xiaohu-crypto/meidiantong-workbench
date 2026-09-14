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
});

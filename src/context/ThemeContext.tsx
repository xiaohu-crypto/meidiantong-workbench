// File: src/context/ThemeContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** 渲染进程侧 Electron 桥类型（与 electron/preload.ts 暴露的 window.electronAPI 对应） */
export interface ElectronThemeApi {
  platform: string;
  getSystemTheme(): { isDark: boolean };
  getSystemThemeAsync(): Promise<{ isDark: boolean }>;
  changeTheme(mode: ThemeMode): void;
  onSystemThemeChange(callback: (isDark: boolean) => void): () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronThemeApi;
  }
}

const STORAGE_KEY = "mdt_theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const VALID_MODES: ThemeMode[] = ["light", "dark", "system"];

/** 渲染进程可用的 Electron 桥（纯浏览器环境为 undefined，自动降级 matchMedia） */

/** 从 localStorage 读取用户选择，非法值 / 不可用一律回退 system */
function readStoredMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored != null && (VALID_MODES as string[]).includes(stored)
      ? (stored as ThemeMode)
      : "system";
  } catch {
    return "system";
  }
}

/**
 * 冷启动系统态读取（防闪烁关键）：
 * Electron 下优先取主进程同步快照（preload sendSync，零等待、无白闪）；
 * 纯浏览器降级 matchMedia。
 */
function readSystemDark(): boolean {
  const api = window.electronAPI;
  if (api) {
    try {
      const snapshot = api.getSystemTheme();
      if (snapshot && typeof snapshot.isDark === "boolean") {
        return snapshot.isDark;
      }
    } catch {
      /* 桥异常时降级 matchMedia */
    }
  }
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(MEDIA_QUERY).matches
    : false;
}

/**
 * 模块加载即写入首帧主题（早于 React 首次渲染）：
 * 配合 Electron 主进程 backgroundColor，双端杜绝冷启动白闪/异色。
 */
(function applyBootTheme() {
  if (typeof document === "undefined") return;
  const mode = readStoredMode();
  const dark = readSystemDark();
  const resolved: ResolvedTheme = mode === "system" ? (dark ? "dark" : "light") : mode;
  document.documentElement.setAttribute("data-theme", resolved);
})();

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [systemDark, setSystemDark] = useState<boolean>(readSystemDark);

  /**
   * 系统级主题源：
   * Electron —— 订阅主进程 nativeTheme 'updated' 推送（{ isDark }），主进程是唯一权威事实源；
   * 纯浏览器 —— 订阅 matchMedia（开发调试降级通道）。
   */
  useEffect(() => {
    const api = window.electronAPI;
    if (api) {
      return api.onSystemThemeChange((isDark) => {
        setSystemDark(isDark);
      });
    }

    if (!window.matchMedia) return undefined;

    const mq = window.matchMedia(MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    // 旧内核降级通道（Safari < 14）
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  // 解析最终生效主题：system 模式映射到系统实际主题
  const resolvedTheme: ResolvedTheme = useMemo(
    () => (mode === "system" ? (systemDark ? "dark" : "light") : mode),
    [mode, systemDark]
  );

  // 写入 <html data-theme> 驱动全部 CSS 变量（既有 tokens + 新组件 token），同时持久化用户选择
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* 隐私模式 / 配额满时静默忽略 */
    }
  }, [resolvedTheme, mode]);

  /**
   * Electron 回传：模式（含冷启动读回的持久化值）变更时通知主进程，
   * 主进程据此设置 nativeTheme.themeSource，锁定外壳 + 渲染层双端。
   */
  useEffect(() => {
    window.electronAPI?.changeTheme(mode);
  }, [mode]);

  // 多窗口同步：Electron 多个渲染窗口 / 浏览器跨标签页间主题联动
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEY &&
        (VALID_MODES as string[]).includes(event.newValue ?? "")
      ) {
        setMode(event.newValue as ThemeMode);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** 显式切换：'light' | 'dark' | 'system' */
  const setThemeMode = useCallback((next: ThemeMode) => {
    if (VALID_MODES.includes(next)) setMode(next);
  }, []);

  /** 便捷翻转：在明/暗之间切换（system 模式按当前解析结果翻转） */
  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === "system") return systemDark ? "light" : "dark";
      return prev === "dark" ? "light" : "dark";
    });
  }, [systemDark]);

  const value = useMemo(
    () => ({ mode, resolvedTheme, setThemeMode, toggleTheme }),
    [mode, resolvedTheme, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** 业务组件侧取用主题状态的唯一入口 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme 必须在 <ThemeProvider> 内部使用");
  }
  return ctx;
}

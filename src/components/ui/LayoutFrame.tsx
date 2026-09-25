// File: src/components/ui/LayoutFrame.tsx
// Finexy v0.3.0 · 9菜单 + AI助手首页 + 任务历史折叠 + 顶栏齿轮
import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export interface MenuGroup {
  id: string;
  name: string;
  icon: string;
  tabs: string[];
}

export interface LayoutFrameProps {
  children: React.ReactNode;
  currentMenu: string;
  currentTab: string;
  onSelect: (menu: string, tab: string) => void;
}

const MENU_STRUCTURE: MenuGroup[] = [
  { id: "agent", name: "AI助手", icon: "✦", tabs: [] },
  { id: "today", name: "待办事项", icon: "☰", tabs: ["全局概览"] },
  { id: "crm", name: "客户与商机", icon: "◉", tabs: ["常规视图"] },
  { id: "work", name: "任务看板", icon: "▦", tabs: ["本地计算"] },
  { id: "media", name: "媒介排期", icon: "◈", tabs: ["排期"] },
  { id: "dev", name: "合同与台账", icon: "❑", tabs: ["合同"] },
  { id: "kb", name: "知识库", icon: "▤", tabs: ["PARA"] },
  { id: "data", name: "数据报表", icon: "◭", tabs: ["仪表盘"] },
  { id: "growth", name: "团队协同", icon: "◆", tabs: ["会议"] },
];

// 任务历史（模拟，后续从 IndexedDB 读）
const TASK_HISTORY = [
  { icon: "📝", title: "帮我做一份「持合体检」单页", time: "17天前" },
  { icon: "💼", title: "代码侧已无可做项，唯一的突破是...", time: "17天前" },
  { icon: "👥", title: "了解公益专家任务完成方式", time: "24天前" },
  { icon: "🔍", title: "查找并安装 ponytail 插件", time: "50天前" },
  { icon: "📄", title: "编辑 Obsidian skill", time: "55天前" },
  { icon: "🎨", title: "画布/简历优化", time: "56天前" },
  { icon: "📊", title: "查看项目对话生成存储位置", time: "68天前" },
  { icon: "⚡", title: "继续设计相关技能", time: "68天前" },
];

export const LayoutFrame: React.FC<LayoutFrameProps> = ({
  children,
  currentMenu,
  currentTab,
  onSelect,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const winBtnStyle: React.CSSProperties = {
    width: 32, height: 28, border: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)", cursor: "pointer",
    fontSize: 13, color: "var(--text-secondary)", borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const [taskOpen, setTaskOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const activeGroup = MENU_STRUCTURE.find((m) => m.id === currentMenu);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] select-none" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif' }}>
      {/* ── 左侧边栏 240px ── */}
      <aside style={{
        width: collapsed ? 72 : 220, flexShrink: 0, transition: "width 0.2s",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column",
        padding: "20px 12px", alignItems: "center",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "0" : "0 4px", marginBottom: 20, justifyContent: collapsed ? "center" : "flex-start", flexDirection: collapsed ? "column" : "row", gap: collapsed ? 10 : 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--brand-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#fff", flexShrink: 0,
          }}>媒</div>
          {!collapsed && (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "-0.3px", color: "var(--text-primary)" }}>媒电通工作台</div>
                <div style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 1 }}>Local-First</div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "none",
                  background: "transparent", color: "var(--text-muted)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0,
                }}
                title="收起侧边栏"
              >‹</button>
            </>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, flexShrink: 0, boxShadow: "var(--shadow-card)",
              }}
              title="展开侧边栏"
            >›</button>
          )}
        </div>

        {/* 菜单 */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {MENU_STRUCTURE.map((m) => {
            const active = currentMenu === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id, m.tabs[0] ?? "")}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: collapsed ? "0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start", flexDirection: collapsed ? "column" : "row", gap: collapsed ? 10 : 10,
                  width: collapsed ? 48 : "100%", height: collapsed ? 48 : "auto",
                  borderRadius: collapsed ? 14 : "var(--radius-lg)",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  border: "none",
                  color: active ? "var(--brand-primary)" : "var(--text-secondary)",
                  background: active ? "var(--brand-subtle)" : "transparent",
                  transition: "all 0.2s",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-app)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                title={collapsed ? m.name : undefined}
              >
                {active && <div style={{ position: "absolute", left: collapsed ? -12 : 0, top: 12, bottom: 12, width: 3, borderRadius: 3, background: "var(--brand-primary)" }} />}
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                {!collapsed && <span>{m.name}</span>}
              </button>
            );
          })}

          {/* 任务历史折叠 */}
          <button
            onClick={() => setTaskOpen(!taskOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: collapsed ? "0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start", flexDirection: collapsed ? "column" : "row", gap: collapsed ? 10 : 10,
              width: collapsed ? 48 : "100%", height: collapsed ? 48 : "auto",
              borderRadius: collapsed ? 14 : "var(--radius-lg)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
              color: "var(--text-secondary)", background: "transparent", marginTop: 4,
            }}
            title={collapsed ? `任务历史 (${TASK_HISTORY.length})` : undefined}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>📋</span>
            {!collapsed && <span>任务历史 ({TASK_HISTORY.length})</span>}
          </button>
          {taskOpen && false && (
            <div style={{ padding: "4px 0 4px 20px" }}>
              {TASK_HISTORY.map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                  fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-app)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 12 }}>{t.icon}</span>
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "ui-monospace,monospace", flexShrink: 0 }}>{t.time}</span>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* 底部 */}
        <div style={{ paddingTop: 12, display: "flex", gap: 8, alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", flexDirection: collapsed ? "column" : "row", gap: collapsed ? 10 : 10, paddingLeft: collapsed ? 0 : 4 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "transparent", border: "none",
              fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="切换主题"
          >
            {resolvedTheme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            onClick={() => onSelect("settings", "")}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "transparent", border: "none",
              cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="设置"
          >⚙️</button>
        </div>
      </aside>

      {/* ── 主区域 ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* 顶部栏 64px */}
        <header style={{
          height: 48, flexShrink: 0,
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
          background: "var(--bg-app)",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.5px", color: "var(--text-primary)" }}>
              {activeGroup?.name ?? "AI助手"}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, fontFamily: "ui-monospace,monospace", marginTop: 2 }}>
              2026-09-25 FRI · LOCAL-FIRST
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button onClick={() => window.mta?.windowMinimize?.()} style={winBtnStyle} title="最小化">−</button>
            <button onClick={() => window.mta?.windowMaximize?.()} style={winBtnStyle} title="最大化">▢</button>
            <button onClick={() => window.mta?.windowClose?.()} style={{ ...winBtnStyle, color: "#EF4444" }} title="关闭">✕</button>
          </div>
        </header>

        {/* 子页签 */}
        {activeGroup && activeGroup.tabs.length > 1 && (
          <div style={{
            background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-subtle)",
            padding: "10px 32px", display: "flex", gap: 8, flexShrink: 0,
          }}>
            {activeGroup.tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onSelect(currentMenu, tab)}
                style={{
                  padding: "4px 12px", borderRadius: "var(--radius-md)",
                  fontSize: 10, fontWeight: 900, cursor: "pointer",
                  border: "1px solid " + (currentTab === tab ? "transparent" : "var(--border-subtle)"),
                  background: currentTab === tab ? "var(--text-primary)" : "transparent",
                  color: currentTab === tab ? "var(--bg-surface)" : "var(--text-secondary)",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* 内容区 */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32, background: "var(--bg-app)" }}>
          {children}
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
};

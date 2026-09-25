// File: src/pages/AgentPage.tsx
// AI助手首页 · WorkBuddy风格居中对话式 · 大屏自适应放大
import React, { useState } from "react";
import { PageActionBar } from "../components/ui/PageActionBar";

const SCENARIOS = [
  { icon: "💼", name: "日常办公" },
  { icon: "👥", name: "客户跟进" },
  { icon: "🌐", name: "媒介排期" },
  { icon: "📈", name: "数据分析" },
];

const QUICK_TOOLS = [
  "📊 财报分析全流程 ›",
  "📄 MD转PDF文档 ›",
  "🔍 竞品对比分析 ›",
  "📝 项目周报转Word ›",
];

const CASE_CARDS = [
  { bg: "#F0F4FF", title: "Orders API 接口文档" },
  { bg: "#F0FFF4", title: "《思考，快与慢》精读笔记卡" },
  { bg: "#FFF8F0", title: "协作办公工具竞品调研分析" },
  { bg: "#FFF0F0", title: "合同条款风险审查雷达" },
];

const AgentPage: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState("日常办公");
  const [input, setInput] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>("文档处理");

  return (
    <div style={{
      minHeight: "calc(100vh - 120px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 40px 20px",
    }}>
      {/* 大标题 */}
      <h1 style={{ fontSize: 48, fontWeight: 900, color: "var(--text-primary)", letterSpacing: -1.5, marginBottom: 8 }}>
        媒电通，我帮你
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
        本地优先 · AI 驱动 · 你的随身商务参谋
      </p>

      {/* 场景胶囊 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {SCENARIOS.map((s) => (
          <button
            key={s.name}
            onClick={() => setActiveScenario(s.name)}
            style={{
              padding: "10px 22px", borderRadius: 999,
              border: "1px solid var(--border-subtle)",
              background: activeScenario === s.name ? "var(--bg-surface)" : "transparent",
              boxShadow: activeScenario === s.name ? "var(--shadow-card)" : "none",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              color: activeScenario === s.name ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* 快捷工具 */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 36, maxWidth: 680 }}>
        {QUICK_TOOLS.map((t) => (
          <button key={t} style={{
            padding: "8px 18px", borderRadius: 12,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer",
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* 输入框 */}
      <div style={{
        width: "100%", maxWidth: 720,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 24, boxShadow: "var(--shadow-card)",
        padding: 24,
      }}>
        {activeTag && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 8,
            background: "var(--status-success-bg)", color: "var(--status-success)",
            fontSize: 12, fontWeight: 800, marginBottom: 16,
          }}>
            📄 {activeTag}
            <span style={{ cursor: "pointer" }} onClick={() => setActiveTag(null)}>×</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button style={{
            width: 36, height: 36, borderRadius: 10,
            border: "1px solid var(--border-subtle)", background: "transparent",
            color: "var(--text-secondary)", fontSize: 16, cursor: "pointer",
          }}>+</button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="今天帮你做些什么？"
            style={{
              flex: 1, height: 36, border: "none", outline: "none",
              background: "transparent", fontSize: 15, color: "var(--text-primary)",
            }}
          />
          <button style={{
            padding: "5px 12px", borderRadius: 8,
            border: "1px solid var(--border-subtle)", background: "transparent",
            fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer",
          }}>Hy3 ▾</button>
          <button style={{
            width: 36, height: 36, borderRadius: 10,
            border: "1px solid var(--border-subtle)", background: "transparent",
            color: "var(--text-secondary)", fontSize: 14, cursor: "pointer",
          }}>🎤</button>
          <button style={{
            width: 40, height: 36, borderRadius: 10,
            background: "var(--brand-primary)", color: "#fff",
            border: "none", fontSize: 18, cursor: "pointer",
          }}>↑</button>
        </div>
        <div style={{
          display: "flex", gap: 20, paddingTop: 12,
          borderTop: "1px solid var(--border-subtle)",
          fontSize: 11, color: "var(--text-muted)",
        }}>
          <span style={{ cursor: "pointer" }}>📁 选择工作空间 ▾</span>
          <span style={{ cursor: "pointer" }}>✅ 默认权限 ▾</span>
        </div>
      </div>

      {/* 底部最佳案例 */}
      <div style={{ width: "100%", maxWidth: 720, marginTop: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-secondary)" }}>📄 文档处理最佳案例</div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
            🔄 换一批 <span style={{ marginLeft: 10 }}>✕</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {CASE_CARDS.map((c, i) => (
            <div key={i} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16, overflow: "hidden", cursor: "pointer",
              transition: "transform 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div style={{ height: 100, background: c.bg, display: "grid", placeItems: "center", fontSize: 32 }}>📑</div>
              <div style={{ padding: 12, fontSize: 12, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
                {c.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentPage;

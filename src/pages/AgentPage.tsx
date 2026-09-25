// File: src/pages/AgentPage.tsx
// AI助手首页 · WorkBuddy风格居中对话式 · 输入框直连 AIAssistant 面板
import React, { useEffect, useState } from "react";
import { emitAskAI } from "../core/events";
import { db } from "../db/db";
import { getAiConfig, saveAiConfig, DEFAULT_AI_CONFIG } from "../core/ai/client";

const MODELS = [
  { id: "z-ai/glm-5.3-flash", label: "GLM-5.3 Flash", desc: "快速轻量" },
  { id: "z-ai/glm-5.3", label: "GLM-5.3", desc: "均衡能力" },
  { id: "deepseek/deepseek-chat", label: "DeepSeek V3", desc: "深度推理" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", desc: "OpenRouter" },
];

const SCENARIOS = [
  { icon: "💼", name: "日常办公", view: "today" },
  { icon: "👥", name: "客户跟进", view: "crm" },
  { icon: "🌐", name: "媒介排期", view: "media" },
  { icon: "📈", name: "数据分析", view: "data" },
];

const QUICK_TOOLS = [
  { icon: "📊", label: "财报分析", prompt: "帮我做一份财报分析" },
  { icon: "📄", label: "MD转PDF", prompt: "如何把 Markdown 转成 PDF" },
  { icon: "🔍", label: "竞品对比", prompt: "帮我做竞品对比分析" },
  { icon: "📝", label: "项目周报", prompt: "帮我写一份项目周报" },
];

function nav(view: string) {
  window.dispatchEvent(new CustomEvent("nav", { detail: view }));
}

const AgentPage: React.FC = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState(DEFAULT_AI_CONFIG.model);
  const [openModels, setOpenModels] = useState(false);

  useEffect(() => {
    void (async () => {
      const cfg = await getAiConfig();
      setModel(cfg.model);
    })();
  }, []);

  async function pickModel(id: string) {
    setModel(id);
    setOpenModels(false);
    const cfg = await getAiConfig();
    await saveAiConfig({ ...cfg, model: id });
  }

  function submit() {
    const q = input.trim();
    if (!q) return;
    emitAskAI(q);
    setInput("");
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 120px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 40px 20px",
    }}>
      <h1 style={{ fontSize: 48, fontWeight: 900, color: "var(--text-primary)", letterSpacing: -1.5, marginBottom: 8 }}>
        媒电通，我帮你
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
        本地优先 · AI 驱动 · 你的随身商务参谋
      </p>

      {/* 场景胶囊：点击跳真实页面 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {SCENARIOS.map((s) => (
          <button
            key={s.name}
            onClick={() => nav(s.view)}
            style={{
              padding: "10px 22px", borderRadius: 999,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* 快捷工具：点击唤起 AI */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 36, maxWidth: 680 }}>
        {QUICK_TOOLS.map((t) => (
          <button key={t.label} onClick={() => emitAskAI(t.prompt)} style={{
            padding: "8px 18px", borderRadius: 12,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer",
          }}>
            {t.icon} {t.label} ›
          </button>
        ))}
      </div>

      {/* 输入框：发送直连 AI 面板 */}
      <div style={{
        width: "100%", maxWidth: 720,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 24, boxShadow: "var(--shadow-card)",
        padding: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="今天帮你做些什么？"
            style={{
              flex: 1, height: 40, border: "none", outline: "none",
              background: "transparent", fontSize: 15, color: "var(--text-primary)",
            }}
          />
          <button
            onClick={submit}
            disabled={!input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: input.trim() ? "var(--brand-primary)" : "var(--bg-muted)",
              color: "#fff", border: "none", fontSize: 18, cursor: input.trim() ? "pointer" : "default",
            }}
            title="发送给 AI 助手"
          >↑</button>
        </div>
      </div>

      {/* 模型选择器 */}
      <div style={{ position: "relative", marginTop: 12 }}>
        <button
          onClick={() => setOpenModels(!openModels)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 999,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-primary)", display: "inline-block" }} />
          {MODELS.find(m => m.id === model)?.label ?? "选择模型"}
          <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
        </button>
        {openModels && (
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            marginTop: 6, background: "var(--bg-surface)", borderRadius: 12,
            border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)",
            padding: 6, minWidth: 220, zIndex: 100,
          }}>
            {MODELS.map(m => (
              <button key={m.id} onClick={() => pickModel(m.id)} style={{
                display: "flex", flexDirection: "column", width: "100%",
                padding: "8px 12px", borderRadius: 8, border: "none",
                cursor: "pointer", textAlign: "left",
                background: m.id === model ? "var(--bg-muted)" : "transparent",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{m.label}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div style={{ marginTop: 40, fontSize: 11, color: "var(--text-muted)" }}>
        输入问题后按回车，AI 助手会在右下角打开并回答
      </div>
    </div>
  );
};

export default AgentPage;

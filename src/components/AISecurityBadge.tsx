import { useEffect, useState } from "react";
import { getActiveAi } from "../core/ai/client";

/**
 * P1 Finexy "AI 安全网关状态卡"(方案二)
 * 挂载在工作台右下角 AI 助手面板头部下方,显式表达:
 *  - 敏感数据分级路由:本地绝对保密(AES-256) vs 脱敏云端协作
 *  - 当前供应商(providerName)+ 多供应商 Key 状态灯
 * 数据源:getActiveAi()(读 aiConfig),无 key 时显"本地绝对保密模式"。
 */

type RouteState = "loading" | "local" | "cloud";

interface AISecurityBadgeProps {
  /** 由 AIAssistant 传入:是否处于敏感数据本地完全隔离状态 */
  isLocalOnlyRoute?: boolean;
}

export default function AISecurityBadge({ isLocalOnlyRoute }: AISecurityBadgeProps) {
  const [providerName, setProviderName] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getActiveAi().then((a) => {
      if (cancelled) return;
      setProviderName(a.providerName ?? "Custom Local");
      setHasKey(!!a.key);
    });
    return () => { cancelled = true; };
  }, []);

  // 路由模式:有 key 且未强制本地隔离 → 脱敏云端协作;否则 → 本地绝对保密
  const route: RouteState = hasKey ? (isLocalOnlyRoute ? "local" : "cloud") : "local";
  const isLocal = route === "local";
  const accent = isLocal ? "var(--success)" : "var(--brand)";
  const accentBg = isLocal ? "var(--success-bg)" : "var(--brand-soft)";

  return (
    <div className="ai-sec-badge" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="ai-sec-left">
        {/* 动态安全状态盾牌图标 */}
        <div className="ai-sec-shield" style={{ background: accentBg, color: accent }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
            {isLocal ? <path d="M9 12l2 2 4-4" /> : <path d="M9 12h6" />}
          </svg>
        </div>
        <div className="ai-sec-text">
          <span className="ai-sec-title">{isLocal ? "AES-256 本地绝对保密模式" : "脱敏云端协作模式"}</span>
          <span className="ai-sec-sub">网关端点：<b>{providerName}</b></span>
        </div>
      </div>
      {/* 实时状态呼吸指示灯 */}
      <div className="ai-sec-status">
        <span className="ai-sec-pulse" style={{ background: accent }} />
        <span className="ai-sec-enc">{isLocal ? "已加密" : "脱敏上云"}</span>
      </div>
    </div>
  );
}

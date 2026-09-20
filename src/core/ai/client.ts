import { db } from "../../db/db";
import { quotaState } from "./quota";

export type AgentId = "script";

/** AI Agent 清单:按 Agent 粒度开关(需求 8.7) */
export const AI_AGENTS: { id: AgentId; label: string; desc: string }[] = [
  { id: "script", label: "跟进话术生成", desc: "CRM 商机抽屉 · 云话术(敏感数据强制脱敏)" },
];

export interface KeyRecord { enc?: string; plain?: string }

/** 多供应商预设:每个供应商独立的 baseUrl / model / 密钥 */
export interface AiProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  keyRecord?: KeyRecord;
}

export interface AiConfig {
  baseUrl: string; model: string;
  cloudEnabled: boolean; allowSensitiveCloud: boolean;
  agents: Record<AgentId, boolean>;
  monthlyTokenLimit: number; // 0 = 不限;≥100% 暂停云调用,≥80% 告警
  providers: AiProvider[];
  activeProviderId: string | null;
}

/** 云供应商定案:OpenRouter(区域可用性实测 2026-09-09,google/gemini-3.8-flash 因 Geo 限制弃用) */
export const DEFAULT_AI_CONFIG: AiConfig = {
  baseUrl: "https://openrouter.ai/api/v1",
  model: "z-ai/glm-5.3-flash",
  cloudEnabled: true,
  allowSensitiveCloud: true,
  agents: { script: true },
  monthlyTokenLimit: 0,
  providers: [],
  activeProviderId: null,
};

export async function getAiConfig(): Promise<AiConfig> {
  const stored = await db.getSetting<Partial<AiConfig> | null>("aiConfig", null);
  return {
    ...DEFAULT_AI_CONFIG,
    ...(stored ?? {}),
    agents: { ...DEFAULT_AI_CONFIG.agents, ...(stored?.agents ?? {}) },
    providers: Array.isArray(stored?.providers) ? stored!.providers! : [],
    activeProviderId: stored?.activeProviderId ?? null,
  };
}

export async function saveAiConfig(cfg: AiConfig): Promise<void> {
  await db.setSetting("aiConfig", cfg);
}

/** 仅加密密钥为 KeyRecord,不写入全局 aiKey(供多供应商使用) */
export async function encryptKey(plain: string): Promise<{ rec: KeyRecord; encrypted: boolean }> {
  if (window.mta?.aiSaveKey) {
    const rec = await window.mta.aiSaveKey(plain);
    return { rec, encrypted: !!rec.enc };
  }
  return { rec: { plain }, encrypted: false };
}

/** 解密指定 KeyRecord */
export async function decryptKeyRecord(rec?: KeyRecord): Promise<string> {
  if (!rec) return "";
  if (rec.enc && window.mta?.aiLoadKey) return await window.mta.aiLoadKey(rec);
  return rec.plain ?? "";
}

/**
 * 统一获取当前生效的 AI 调用配置(baseUrl/model/key)。
 * 优先使用 activeProviderId 指向的供应商预设;否则回退到旧版全局配置 + 全局密钥(向后兼容)。
 */
export async function getActiveAi(): Promise<{ baseUrl: string; model: string; key: string; providerName: string | null }> {
  const cfg = await getAiConfig();
  const provider = cfg.activeProviderId ? cfg.providers.find((p) => p.id === cfg.activeProviderId) : null;
  if (provider) {
    let key = await decryptKeyRecord(provider.keyRecord);
    if (!key) { const g = await loadAiKey(); key = g.key; } // 供应商未配 key 时回退全局 key
    return { baseUrl: provider.baseUrl, model: provider.model, key, providerName: provider.name };
  }
  const { key } = await loadAiKey();
  return { baseUrl: cfg.baseUrl, model: cfg.model, key, providerName: null };
}

/** 密钥:Electron 下经 safeStorage 加密存储;浏览器回退明文并标记;支持 AGNES_KEY 环境变量一次性导入 */
export async function saveAiKey(plain: string): Promise<{ encrypted: boolean }> {
  if (window.mta?.aiSaveKey) {
    const rec = await window.mta.aiSaveKey(plain);
    await db.setSetting("aiKey", rec);
    return { encrypted: !!rec.enc };
  }
  await db.setSetting("aiKey", { plain } as KeyRecord);
  return { encrypted: false };
}

export async function loadAiKey(): Promise<{ key: string; encrypted: boolean; fromEnv?: boolean }> {
  const rec = await db.getSetting<KeyRecord | null>("aiKey", null);
  if (rec) {
    if (rec.enc && window.mta?.aiLoadKey) {
      const key = await window.mta.aiLoadKey(rec);
      return { key, encrypted: true };
    }
    return { key: rec.plain ?? "", encrypted: false };
  }
  if (window.mta?.aiEnvKey) {
    const k = await window.mta.aiEnvKey();
    if (k) {
      const r = await saveAiKey(k);
      return { key: k, encrypted: r.encrypted, fromEnv: true };
    }
  }
  return { key: "", encrypted: false };
}

export interface ChatResult { ok: boolean; content?: string; error?: string; tokens?: number; model?: string }

export async function aiChat(messages: { role: string; content: string }[]): Promise<ChatResult> {
  const cfg = await getAiConfig();
  const active = await getActiveAi();
  const key = active.key;
  if (!key) return { ok: false, error: "未配置 API Key(系统管理 → AI 设置,或以 AGNES_KEY 环境变量启动一次应用)", model: active.model };
  if (!window.mta?.aiChat) return { ok: false, error: "云模型调用需要 Electron 环境", model: active.model };
  const month = new Date().toISOString().slice(0, 7);
  const u = await db.getSetting("aiUsage", { month, calls: 0, tokens: 0 });
  const q = quotaState(u, cfg.monthlyTokenLimit);
  if (q.level === "exceeded") {
    return { ok: false, error: `月度 tokens 限额已达(${u.tokens}/${cfg.monthlyTokenLimit}),云调用暂停;可在系统管理调整限额`, model: active.model };
  }
  const r = await window.mta.aiChat({ baseUrl: active.baseUrl, apiKey: key, model: active.model, messages });
  if (!r.ok) return { ok: false, error: r.error ?? `HTTP ${r.status ?? "?"}`, model: active.model };
  const tokens = r.usage?.total_tokens ?? 0;
  if (tokens > 0) {
    const nu = u.month === month ? { month, calls: u.calls + 1, tokens: u.tokens + tokens } : { month, calls: 1, tokens };
    await db.setSetting("aiUsage", nu);
  }
  return { ok: true, content: r.content ?? "", tokens, model: active.model };
}
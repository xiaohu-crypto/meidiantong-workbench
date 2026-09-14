import { useEffect, useRef, useState } from "react";
import { db } from "../db/db";
import { seedIfEmpty } from "../data/seed";
import { AI_AGENTS, DEFAULT_AI_CONFIG, getAiConfig, loadAiKey, saveAiKey, saveAiConfig, type AiConfig } from "../core/ai/client";
import { quotaState } from "../core/ai/quota";
import { getDnd, type Dnd } from "../core/notify";
import { ensureVault, getVaultStatus, type VaultStatus } from "../core/vault";
import { Btn, Chip, Field, useToast } from "../ui/common";
import { IconRefresh } from "../components/icons";

type Tab = "外观" | "AI模型" | "通知与备份" | "数据与隐私" | "回收站" | "操作日志" | "标签治理" | "自定义字段";

const TAB_GROUPS: { group: string; tabs: Tab[] }[] = [
  { group: "偏好", tabs: ["外观", "AI模型", "通知与备份", "数据与隐私"] },
  { group: "管理", tabs: ["自定义字段", "标签治理", "回收站", "操作日志"] },
];

interface LogRow { id: string; ts: number; who: string; what: string; entityType: string; entityId: string; before: unknown | null }

export default function SettingsPage(props: { theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void; reload: () => Promise<void>; customers: { id: string; name: string }[]; notes: { id: string; title: string; tags: string[]; content: string }[]; customFields: { id: string; entity: string; key: string; label: string; type: string; options?: string[] }[] }) {
  const { show, node } = useToast();
  const [tab, setTab] = useState<Tab>("外观");
  const [trash, setTrash] = useState<{ store: string; id: string; title: string; deletedAt: number }[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [autostart, setAutostart] = useState(false);
  const [aiCfg, setAiCfg] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [keyInput, setKeyInput] = useState("");
  const [keyState, setKeyState] = useState<{ has: boolean; encrypted: boolean; fromEnv?: boolean }>({ has: false, encrypted: false });
  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ month: string; calls: number; tokens: number } | null>(null);
  const [ab, setAb] = useState<{ enabled: boolean; intervalHours: number; dir: string; keep: number; lastAt: number }>({ enabled: false, intervalHours: 24, dir: "", keep: 7, lastAt: 0 });
  const [dnd, setDnd] = useState<Dnd>({ enabled: false, start: "22:00", end: "08:00" });
  const [vs, setVs] = useState<VaultStatus>({ mode: "plain", reason: "检测中…" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      setTrash(await db.listTrashed());
      const logs = await db.getAll<LogRow>("operationLogs");
      setLogs(logs.sort((a, b) => b.ts - a.ts));
      if (window.mta) setAutostart(await window.mta.getLoginItem());
      setAiCfg(await getAiConfig());
      const k = await loadAiKey();
      setKeyState({ has: !!k.key, encrypted: k.encrypted, fromEnv: k.fromEnv });
      setUsage(await db.getSetting("aiUsage", null));
      setAb(await db.getSetting("autoBackup", { enabled: false, intervalHours: 24, dir: "", keep: 7, lastAt: 0 }));
      await ensureVault();
      setVs(getVaultStatus());
      setDnd(await getDnd());
    })();
  }, [tab]);

  function applyTheme(t: "dark" | "light") {
    props.setTheme(t);
    void db.setSetting("theme", t);
    show("主题已切换，重启应用后生效");
  }

  async function backupNow() {
    const dump = await db.dumpAll();
    const payload = { app: "meidiantong-workbench", schemaVersion: 1, exportedAt: new Date().toISOString(), stores: dump };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${ts}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    show("备份已导出(JSON);轮转保留策略属系统管理 P0 验收:默认保留最近 7 份由用户目录管理");
  }

  async function restoreFile(f: File) {
    try {
      const text = await f.text();
      const parsed = JSON.parse(text) as { stores?: Record<string, unknown[]> };
      if (!parsed.stores || !Array.isArray(parsed.stores.customers)) { show("文件格式不正确:缺少 stores 字段"); return; }
      await db.restoreAll(parsed.stores);
      await props.reload();
      show("恢复完成,数据已覆盖写入");
    } catch {
      show("恢复失败:无法解析该文件");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>设置</h1><div className="date">设置 / 回收站(30 天) / 操作日志(可撤销)</div></div>
      </div>

      <div>
        <div className="card" style={{ padding: "4px 12px 0", marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
            {TAB_GROUPS.map((g, gi) => (
              <div key={g.group} style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                {gi > 0 ? <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 10px" }} /> : null}
                <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 700, letterSpacing: ".06em", marginRight: 8 }}>{g.group}</span>
                {g.tabs.map((t) => (
                  <span key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
      {tab === "外观" && (
        <div className="card card-pad">
          <div className="alert-line"><span className="txt">主题</span>
            <select className="sel" value={props.theme} onChange={(e) => applyTheme(e.target.value as "dark" | "light")}>
              <option value="dark">深色(默认)</option>
              <option value="light">浅色</option>
            </select>
          </div>
          <div className="alert-line"><span className="txt">标题栏(融合深色=默认;系统原生=Windows 白条;切换后需重启)</span>
            {window.mta ? (
              <span style={{ display: "inline-flex", gap: 8 }}>
                <Btn kind={(window.mta.windowMode ?? "integrated") === "integrated" ? "data" : "ghost"} sm onClick={() => { void (async () => { await window.mta!.titlebarSet("integrated"); show("已保存:融合深色标题栏,重启应用后生效"); })(); }}>融合深色</Btn>
                <Btn kind={(window.mta.windowMode ?? "integrated") === "native" ? "data" : "ghost"} sm onClick={() => { void (async () => { await window.mta!.titlebarSet("native"); show("已保存:系统原生标题栏,重启应用后生效"); })(); }}>系统原生</Btn>
              </span>
            ) : <Chip gray>浏览器模式不适用</Chip>}
          </div>
          <div className="alert-line"><span className="txt">专注模式(侧栏收窄为图标、强调色灰化)</span>
            <Btn kind="ghost" onClick={() => { document.documentElement.classList.toggle("focus-mode"); show("专注模式已切换"); }}>切换</Btn>
          </div>
          <div className="alert-line"><span className="txt">开机自启(Electron 环境)</span>
            {window.mta ? (
              <Btn kind="ghost" onClick={() => { void (async () => { const v = await window.mta!.setLoginItem(!autostart); setAutostart(v); show(v ? "已开启开机自启" : "已关闭开机自启"); })(); }}>{autostart ? "已开启" : "已关闭"}</Btn>
            ) : <Chip gray>浏览器模式不可用</Chip>}
          </div>
          <div className="alert-line"><span className="txt">系统通知</span><Chip kind="green">已开启(P0)</Chip></div>
          <div className="alert-line"><span className="txt">邮件导入渠道</span><Chip gray>默认关闭(二期可开)</Chip></div>
          <div className="alert-line"><span className="txt">静态加密(IndexedDB 落盘,密钥经 OS 凭据保护)</span>
            {vs.mode === "os-protected" ? <Chip kind="green">已启用 · AES-256-GCM</Chip> : <Chip gray>{vs.reason}</Chip>}
          </div>

          <div className="h-row" style={{ marginTop: 20 }}><span className="h-title sm">快捷键</span></div>
          <div className="alert-line">
            <span className="txt">全局搜索 / 快速采集(可自定义)</span>
            <span className="chip data">Ctrl + <input style={{ width: 28, border: "1px solid var(--border)", borderRadius: 4, textAlign: "center", background: "transparent", color: "var(--ink)" }} defaultValue="K" onChange={(e) => { const v = e.target.value.toLowerCase(); if (v.length === 1) void db.setSetting("quickKey", { key: v }); }} /> — ↑↓ 选择 · 回车打开 · Esc 关闭</span>
          </div>
          <div className="alert-line"><span className="txt">搜索框内清空</span><span className="chip data">Esc</span></div>
          <p className="muted" style={{ fontSize: "var(--text-xs)", marginTop: 6 }}>更多快捷键自定义(如切换视图)将在后续版本支持;当前为系统内置。</p>

        </div>
      )}

      {tab === "通知与备份" && (
        <div className="card card-pad">
          <div className="h-row" style={{ marginTop: 0, marginBottom: 10 }}>
            <span className="h-title sm">备份与恢复</span>
            <span style={{ marginLeft: "auto" }}><IconRefresh size={16} /></span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn kind="primary" onClick={() => { void backupNow(); }}>立即备份(导出 JSON)</Btn>
            <Btn kind="ghost" onClick={() => fileRef.current?.click()}>从备份恢复</Btn>
            <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void restoreFile(f); e.target.value = ""; }} />
            <Btn kind="danger" onClick={() => { void (async () => { await db.clearAll(); await seedIfEmpty(); await props.reload(); show("已重置并重建示例数据"); })(); }}>重置示例数据</Btn>
          </div>
          <div className="h-row" style={{ marginTop: 20 }}><span className="h-title sm">自动备份轮转</span></div>
          <div className="alert-line"><span className="txt">安全提示:备份/自动备份当前导出为明文 JSON(加密备份属下一迭代)</span><Chip kind="warn">注意保管</Chip></div>
          <div className="alert-line"><span className="txt">开启后按间隔自动写盘到所选目录,保留最近份数,错过时点启动补跑</span>
            <Btn kind={ab.enabled ? "data" : "ghost"} sm onClick={() => { const v = { ...ab, enabled: !ab.enabled }; setAb(v); void db.setSetting("autoBackup", v); show(v.enabled ? "自动备份已开启" : "自动备份已关闭"); }}>{ab.enabled ? "已开启" : "已关闭"}</Btn>
          </div>
          <div className="alert-line"><span className="txt">备份目录</span>
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span className="cell-sub num" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ab.dir || "未设置"}</span>
              {window.mta?.backupPickDir ? <Btn kind="ghost" sm onClick={() => { void (async () => { const d = await window.mta!.backupPickDir(); if (d) { const v = { ...ab, dir: d }; setAb(v); await db.setSetting("autoBackup", v); show("目录已设置"); } })(); }}>选择目录</Btn> : <Chip gray>需 Electron</Chip>}
            </span>
          </div>
          <div className="alert-line"><span className="txt">间隔(小时) / 保留份数</span>
            <span style={{ display: "inline-flex", gap: 8 }}>
              <input className="inp num" style={{ width: 70, minHeight: 28 }} value={String(ab.intervalHours)} onChange={(e) => { const v = { ...ab, intervalHours: Number(e.target.value) || 24 }; setAb(v); void db.setSetting("autoBackup", v); }} />
              <input className="inp num" style={{ width: 70, minHeight: 28 }} value={String(ab.keep)} onChange={(e) => { const v = { ...ab, keep: Number(e.target.value) || 7 }; setAb(v); void db.setSetting("autoBackup", v); }} />
            </span>
          </div>

          <div className="h-row" style={{ marginTop: 20 }}><span className="h-title sm">通知与免打扰</span></div>
          <div className="alert-line"><span className="txt">免打扰时段(期间不弹桌面通知,只进通知中心)</span>
            <Btn kind={dnd.enabled ? "data" : "ghost"} sm onClick={() => { const v = { ...dnd, enabled: !dnd.enabled }; setDnd(v); void db.setSetting("dnd", v); }}>{dnd.enabled ? "已开启" : "已关闭"}</Btn>
          </div>
          <div className="alert-line"><span className="txt">时段(起 / 止,支持跨午夜)</span>
            <span style={{ display: "inline-flex", gap: 8 }}>
              <input className="inp num" type="time" style={{ width: 110, minHeight: 28 }} value={dnd.start} onChange={(e) => { const v = { ...dnd, start: e.target.value }; setDnd(v); void db.setSetting("dnd", v); }} />
              <input className="inp num" type="time" style={{ width: 110, minHeight: 28 }} value={dnd.end} onChange={(e) => { const v = { ...dnd, end: e.target.value }; setDnd(v); void db.setSetting("dnd", v); }} />
            </span>
          </div>
          <div className="alert-line"><span className="txt">错过补发</span><Chip kind="green">已启用(启动时检查,超 8 小时自动补一条汇总)</Chip></div>

        </div>
      )}

      {tab === "AI模型" && (
        <div className="card card-pad">
          <div className="h-row" style={{ marginTop: 0, marginBottom: 10 }}><span className="h-title sm">AI 模型(OpenRouter · 云)</span></div>
          <div className="alert-line"><span className="txt">云模型总开关</span>
            <Btn kind={aiCfg.cloudEnabled ? "data" : "ghost"} sm onClick={() => { const v = !aiCfg.cloudEnabled; setAiCfg({ ...aiCfg, cloudEnabled: v }); void saveAiConfig({ ...aiCfg, cloudEnabled: v }); show(v ? "云模型已开启" : "云模型已关闭(全部走本地)"); }}>{aiCfg.cloudEnabled ? "已开启" : "已关闭"}</Btn>
          </div>
          <div className="alert-line"><span className="txt">敏感数据脱敏后允许上云</span>
            <Btn kind={aiCfg.allowSensitiveCloud ? "data" : "ghost"} sm onClick={() => { const v = !aiCfg.allowSensitiveCloud; setAiCfg({ ...aiCfg, allowSensitiveCloud: v }); void saveAiConfig({ ...aiCfg, allowSensitiveCloud: v }); }}>{aiCfg.allowSensitiveCloud ? "允许(默认,强制脱敏)" : "不允许(纯本地)"}</Btn>
          </div>
          <div className="alert-line"><span className="txt">Agent 粒度开关(关闭后该能力走本地模板)</span>
            {AI_AGENTS.map((a) => (
              <span key={a.id} style={{ display: "inline-flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
                <span style={{ fontSize: "var(--text-xs)" }}>{a.label}</span>
                <Btn kind={(aiCfg.agents?.[a.id] ?? true) ? "data" : "ghost"} sm onClick={() => { const on = aiCfg.agents?.[a.id] ?? true; const v = { ...aiCfg, agents: { ...aiCfg.agents, [a.id]: !on } }; setAiCfg(v); void saveAiConfig(v); }}>{(aiCfg.agents?.[a.id] ?? true) ? "已开启" : "已关闭"}</Btn>
              </span>
            ))}
          </div>
          <div className="alert-line"><span className="txt">月度 tokens 限额(0=不限;≥80% 告警,≥100% 暂停云调用)</span>
            <input className="inp num" style={{ width: 120, minHeight: 28 }} value={String(aiCfg.monthlyTokenLimit ?? 0)} onChange={(e) => { const v = { ...aiCfg, monthlyTokenLimit: Math.max(0, Number(e.target.value) || 0) }; setAiCfg(v); void saveAiConfig(v); }} />
          </div>
<div className="field-row">
            <Field label="接口地址"><input className="inp" style={{ width: "100%" }} value={aiCfg.baseUrl} onChange={(e) => setAiCfg({ ...aiCfg, baseUrl: e.target.value })} onBlur={() => { void saveAiConfig(aiCfg); }} /></Field>
            <Field label="模型 ID"><input className="inp" style={{ width: "100%" }} value={aiCfg.model} onChange={(e) => setAiCfg({ ...aiCfg, model: e.target.value })} onBlur={() => { void saveAiConfig(aiCfg); }} /></Field>
          </div>
          <div className="alert-line"><span className="txt">接口密钥（当前：{keyState.has ? (keyState.encrypted ? (keyState.fromEnv ? "已加密存储(自 AGNES_KEY 环境变量导入)" : "已加密存储") : "明文(浏览器回退)") : "未配置"})</span></div>
          <div className="field-row">
            <Field label={keyState.has ? "更换 Key" : "填入 Key"}>
              <input className="inp" type="password" style={{ width: "100%" }} value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="sk-…" />
            </Field>
            <Field label=" ">
              <div style={{ display: "flex", gap: 8 }}>
                <Btn kind="primary" sm disabled={!keyInput.trim()} onClick={() => { void (async () => { const r = await saveAiKey(keyInput.trim()); setKeyState({ has: true, encrypted: r.encrypted }); setKeyInput(""); show(r.encrypted ? "密钥已通过系统凭据加密存储" : "密钥已保存(浏览器模式:明文本地)"); })(); }}>保存密钥</Btn>
                <Btn kind="data" sm disabled={aiTesting || !keyState.has} onClick={() => { void (async () => {
                  setAiTesting(true); setAiResult(null);
                  try {
                    const { aiChat } = await import("../core/ai/client");
                    const r = await aiChat([{ role: "user", content: "ping,请回复 pong" }]);
                    setAiResult(r.ok ? "连接成功 · 模型 " + (r.model ?? "") + (r.tokens ? " · tokens " + r.tokens : "") : "连接失败:" + (r.error ?? "未知"));
                  } finally { setAiTesting(false); }
                })(); }}>{aiTesting ? "测试中…" : "测试连接"}</Btn>
              </div>
            </Field>
          </div>
          {aiResult ? <p style={{ fontSize: "var(--text-xs)", color: aiResult.startsWith("连接成功") ? "var(--success)" : "var(--danger)" }}>{aiResult}</p> : null}
          {usage ? (() => { const q = quotaState(usage, aiCfg.monthlyTokenLimit ?? 0); return (<p className="muted" style={{ fontSize: "var(--text-xs)" }}>本月云调用:{usage.calls} 次 / {usage.tokens} tokens{aiCfg.monthlyTokenLimit ? ` · 限额 ${aiCfg.monthlyTokenLimit}` : ""}{q.level !== "ok" ? <span style={{ marginLeft: 6 }}><Chip kind={q.level === "exceeded" ? "danger" : "data"}>{q.level === "exceeded" ? "已达限额,云调用暂停" : "接近限额(≥80%)"}</Chip></span> : null}</p>); })() : null}

        </div>
      )}

      {tab === "数据与隐私" && (
        <div className="card card-pad">
          <div className="h-row" style={{ marginTop: 0, marginBottom: 10 }}><span className="h-title sm">数据打包交接(按客户)</span></div>
          <CustomerPack customers={props.customers} onDone={show} />
          <p className="muted" style={{ fontSize: "var(--text-xs)", marginTop: 10 }}>
            备份含 schemaVersion 与导出时间;恢复按仓覆盖写入;往返一致性由单元测试保障(tests/core.test.ts + 存储层)。
          </p>
          <p className="muted" style={{ fontSize: "var(--text-xs)", marginTop: 10 }}>
            数据全部本地存储,静态加密(AES-256-GCM),密钥经 OS 凭据保护。不上云、不上传。
          </p>
        </div>
      )}

      {tab === "回收站" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tgrid">
            <thead><tr><th>对象</th><th>来源仓</th><th>删除时间</th><th>操作</th></tr></thead>
            <tbody>
              {trash.map((r) => (
                <tr key={r.store + r.id} style={{ cursor: "default" }}>
                  <td>{r.title}</td><td><Chip gray>{r.store}</Chip></td>
                  <td className="num">{new Date(r.deletedAt).toLocaleString("zh-CN")}</td>
                  <td>
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <Btn kind="data" sm onClick={() => { void (async () => { await db.restore(r.store as never, r.id); setTrash(await db.listTrashed()); await props.reload(); show("已恢复"); })(); }}>恢复</Btn>
                      <Btn kind="danger" sm onClick={() => { void (async () => { await db.purge(r.store as never, r.id); setTrash(await db.listTrashed()); show("已彻底删除"); })(); }}>彻底删除</Btn>
                    </span>
                  </td>
                </tr>
              ))}
              {trash.length === 0 ? <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>回收站为空(软删除记录 30 天后可由系统清理)</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {tab === "操作日志" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tgrid">
            <thead><tr><th>时间</th><th>对象</th><th>动作</th><th>操作</th></tr></thead>
            <tbody>
              {logs.slice(0, 50).map((l) => (
                <tr key={l.id} style={{ cursor: "default" }}>
                  <td className="num">{new Date(l.ts).toLocaleString("zh-CN")}</td>
                  <td><Chip gray>{l.entityType}</Chip></td>
                  <td>{l.what}</td>
                  <td>
                    <Btn kind="data" sm disabled={!l.before} title={l.before ? "按 before 快照恢复" : "新建操作无回滚快照"}
                      onClick={() => { void (async () => { try { await db.undoLog(l.id); await props.reload(); show("已撤销该变更"); } catch { show("撤销失败"); } })(); }}>撤销</Btn>
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>暂无操作日志</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
      {tab === "标签治理" && <TagGovernance notes={props.notes} reload={props.reload} />}
      {tab === "自定义字段" && <CustomFieldsGov defs={props.customFields} reload={props.reload} />}
        </div>
      </div>

      {node}
    </div>
  );
}

/** 标签治理:列出全部笔记标签,重命名=全量合并 */
function TagGovernance(props: { notes: { id: string; title: string; tags: string[]; content: string }[]; reload: () => Promise<void> }) {
  const { show, node } = useToast();
  const tagMap = new Map<string, number>();
  for (const n of props.notes) for (const t of n.tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
  const [renames, setRenames] = useState<Record<string, string>>({});

  async function rename(from: string) {
    const to = (renames[from] ?? "").trim();
    if (!to || to === from) { show("请输入新标签名"); return; }
    for (const n of props.notes) {
      if (n.tags.includes(from)) {
        const tags = Array.from(new Set(n.tags.map((x) => (x === from ? to : x))));
        const full = await db.get<{ id: string }>("notes", n.id);
        if (full) await db.put("notes", { ...full, tags }, `标签治理:「
${from}
」合并为「
${to}
」`);
      }
    }
    show(`已合并:${from} → ${to}`);
    await props.reload();
  }

  return (
    <div className="card card-pad" style={{ maxWidth: 640 }}>
      <div className="h-row" style={{ marginBottom: 8 }}>
        <span className="h-title sm">用户标签治理</span>
        <Chip gray style={{ marginLeft: "auto" }}>系统枚举不受此影响</Chip>
      </div>
      {Array.from(tagMap.entries()).map(([tag, count]) => (
        <div className="alert-line" key={tag}>
          <Chip kind="data">#{tag}</Chip>
          <span className="txt cell-sub">{count} 条笔记使用</span>
          <input className="inp" style={{ width: 140, minHeight: 28, padding: "2px 8px", fontSize: "var(--text-xs)" }}
            placeholder="合并为…" value={renames[tag] ?? ""} onChange={(e) => setRenames((s) => ({ ...s, [tag]: e.target.value }))} />
          <Btn kind="done" sm onClick={() => { void rename(tag); }}>合并</Btn>
        </div>
      ))}
      {tagMap.size === 0 ? <p className="muted">暂无用户标签(来自知识库笔记)</p> : null}
      {node}
    </div>
  );
}

function CustomerPack(props: { customers: { id: string; name: string }[]; onDone: (m: string) => void }) {
  const [cid, setCid] = useState("");
  function pack() {
    if (!cid) { props.onDone("请选择客户"); return; }
    const blob = new Blob([JSON.stringify({ customerId: cid, exportedAt: new Date().toISOString(), note: "完整包请从 CRM 抽屉导出(含关联明细)" })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `客户包索引_${cid}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    props.onDone("已导出索引;完整客户包在 CRM 抽屉内导出");
  }
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <select className="sel" value={cid} onChange={(e) => setCid(e.target.value)}>
        <option value="">选择客户…</option>
        {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <Btn kind="ghost" onClick={pack}>导出索引</Btn>
    </div>
  );
}


/** 自定义字段管理:定义客户/商机扩展字段 */
function CustomFieldsGov(props: { defs: { id: string; entity: string; key: string; label: string; type: string; options?: string[] }[]; reload: () => Promise<void> }) {
  const { show, node } = useToast();
  const [entity, setEntity] = useState("customers");
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");

  async function add() {
    if (!key.trim() || !label.trim()) { show("字段标识与名称必填"); return; }
    if (props.defs.some((d) => d.entity === entity && d.key === key.trim())) { show("该实体下已存在同标识字段"); return; }
    const next = [...props.defs, { id: "cf-" + Date.now().toString(36), entity, key: key.trim(), label: label.trim(), type, options: type === "select" ? options.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : undefined }];
    await db.setSetting("customFields", next);
    setKey(""); setLabel(""); setOptions("");
    show("自定义字段已添加");
    await props.reload();
  }

  async function del(id: string) {
    const next = props.defs.filter((d) => d.id !== id);
    await db.setSetting("customFields", next);
    show("已删除字段定义(已有数据保留)");
    await props.reload();
  }

  return (
    <div className="card card-pad" style={{ maxWidth: 680 }}>
      <div className="h-row" style={{ marginBottom: 8 }}>
        <span className="h-title sm">自定义字段(客户 / 商机)</span>
        <Chip gray style={{ marginLeft: "auto" }}>新增表单与 360° 视图自动渲染</Chip>
      </div>
      <div className="field-row">
        <Field label="实体">
          <select className="sel" style={{ width: "100%" }} value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="customers">客户</option>
            <option value="deals">商机</option>
          </select>
        </Field>
        <Field label="字段标识"><input className="inp" style={{ width: "100%" }} value={key} onChange={(e) => setKey(e.target.value)} placeholder="如:channel" /></Field>
      </div>
      <div className="field-row">
        <Field label="显示名称"><input className="inp" style={{ width: "100%" }} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="如:获客渠道" /></Field>
        <Field label="类型">
          <select className="sel" style={{ width: "100%" }} value={type} onChange={(e) => setType(e.target.value)}>
            {["text", "number", "date", "select"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
      </div>
      {type === "select" ? <Field label="选项(逗号分隔)"><input className="inp" style={{ width: "100%" }} value={options} onChange={(e) => setOptions(e.target.value)} /></Field> : null}
      <Btn kind="primary" onClick={() => { void add(); }}>添加字段</Btn>

'      <div className="h-row" style={{ marginTop: 20 }}><span className="h-title sm">自定义商机阶段</span><Chip gray style={{ marginLeft: "auto" }}>插入到默认阶段后,不可删除系统阶段</Chip></div>
      <CustomStages />

      <div className="h-row" style={{ marginTop: 14 }}><span className="h-title sm">已定义({props.defs.length})</span></div>'
      {props.defs.map((d) => (
        <div className="alert-line" key={d.id}>
          <span className="txt"><b>{d.label}</b> <code>{d.key}</code> · {d.entity === "customers" ? "客户" : "商机"} · {d.type}{d.options ? "(" + d.options.join("/") + ")" : ""}</span>
          <Btn kind="danger" sm onClick={() => { void del(d.id); }}>删除</Btn>
        </div>
      ))}
      {props.defs.length === 0 ? <p className="muted">暂无自定义字段</p> : null}
      {node}
    </div>
  );
}

function CustomStages() {
  const { show, node } = useToast();
  const [name, setName] = useState("");
  const [stages, setStages] = useState<string[]>([]);
  useEffect(() => { void (async () => setStages(await db.getSetting<string[]>("customStages", [])))(); }, []);
  async function add() {
    if (!name.trim()) { show("阶段名必填"); return; }
    const next = Array.from(new Set([...stages, name.trim()]));
    setStages(next); await db.setSetting("customStages", next);
    setName(""); show("自定义阶段已添加,客户开发页可选");
  }
  async function del(s: string) {
    const next = stages.filter((x) => x !== s);
    setStages(next); await db.setSetting("customStages", next);
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input className="inp" style={{ width: 200 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="阶段名,如:联合利华专项" />
        <Btn kind="primary" sm onClick={() => { void add(); }}>添加</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {stages.map((s) => (
          <span key={s} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            <Chip kind="data">{s}</Chip>
            <button className="btn done sm" onClick={() => { void del(s); }}>×</button>
          </span>
        ))}
        {stages.length === 0 ? <span className="muted" style={{ fontSize: "var(--text-xs)" }}>暂无自定义阶段</span> : null}
      </div>
      {node}
    </div>
  );
}
/* ===== AI员工管理页（复刻NocoBase AI Employees管理）=====
 * 新增/编辑/删除自定义AI员工，与AI助手悬浮面板打通。
 * 自定义员工持久化到 settings.aiEmployees。
 */

import { useCallback, useEffect, useState } from "react";
import { db } from "../db/db";
import { BUILTIN_EMPLOYEE_IDS, EMPLOYEE_LIST, type Employee } from "../core/ai/employees";
import { useT } from "../core/i18n/useT";
import { Btn, Chip, Field, Modal } from "../ui/common";
import { engine } from "../core/flow/engine";
import { emitDataChanged, emitOpenAIStaff } from "../core/events";

export default function AIStaffPage() {
  const t = useT();
  const [custom, setCustom] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    const stored = await db.getSetting<Employee[]>("aiEmployees", []);
    setCustom(stored);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(emp: Employee) {
    const next = custom.filter((e) => e.id !== emp.id);
    next.push(emp);
    setCustom(next);
    await db.setSetting("aiEmployees", next);
    emitDataChanged("aiEmployees");
    engine.emitEvent({ type: "notify", payload: { text: "员工已保存，AI助手面板已同步", kind: "ok" } });
  }

  async function remove(id: string) {
    const next = custom.filter((e) => e.id !== id);
    setCustom(next);
    await db.setSetting("aiEmployees", next);
    emitDataChanged("aiEmployees");
    engine.emitEvent({ type: "notify", payload: { text: "已删除自定义员工" } });
  }

  const all = [...custom, ...EMPLOYEE_LIST.filter((e) => !custom.some((c) => c.id === e.id))];

  return (
    <div className="page page-aistaff">
      <div className="h-row">
        <span className="h-title">{t("aistaff.title")}</span>
        <Btn sm kind="primary" onClick={() => setCreating(true)}>{t("aistaff.newEmployee")}</Btn>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>{t("aistaff.desc")}</p>
      <div className="alert-strip" style={{ marginBottom: 14 }}>
        <div className="card card-pad" style={{ padding: "10px 14px" }}>
          <div className="alert-line"><span className="txt">配置角色 / 提示词 / 欢迎语，保存后 <b>AI 助手面板（右下角）实时同步</b>；点击员工卡片可直接在面板中打开对话。</span></div>
        </div>
      </div>

      <div className="aistaff-list">
        {all.map((e) => {
          const isBuiltin = BUILTIN_EMPLOYEE_IDS.includes(e.id);
          const isCustom = custom.some((c) => c.id === e.id);
          return (
            <div key={e.id} className="aistaff-card" onClick={() => emitOpenAIStaff(e.id)} style={{ cursor: "pointer" }} title="点击在AI助手面板中打开对话">
              <div className="aistaff-head">
                <span className="aistaff-emoji">{e.emoji}</span>
                <span className="aistaff-name">{e.name}</span>
                <Chip kind={isCustom ? "brand" : isBuiltin ? "data" : "green"}>{isCustom ? "自定义" : "内置"}</Chip>
              </div>
              <div className="aistaff-role">{e.role}</div>
              <div className="aistaff-desc">{e.desc}</div>
              <div className="aistaff-actions">
                {isCustom ? (
                  <>
                    <span onClick={(ev) => ev.stopPropagation()}><Btn sm onClick={() => setEditing(e)}>{t("common.edit")}</Btn></span>
                    <span onClick={(ev) => ev.stopPropagation()}><Btn sm kind="danger" onClick={() => void remove(e.id)}>{t("common.delete")}</Btn></span>
                  </>
                ) : (
                  <span onClick={(ev) => ev.stopPropagation()}><Btn sm onClick={() => setEditing({ ...e, id: e.id + "-copy" })}>复制为自定义</Btn></span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {creating ? <EmployeeModal onClose={() => setCreating(false)} onSave={async (e) => { await save(e); setCreating(false); }} /> : null}
      {editing ? <EmployeeModal initial={editing} onClose={() => setEditing(null)} onSave={async (e) => { await save(e); setEditing(null); }} /> : null}
    </div>
  );
}

function EmployeeModal({ initial, onClose, onSave }: { initial?: Employee; onClose: () => void; onSave: (e: Employee) => Promise<void> }) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🤖");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [welcome, setWelcome] = useState(initial?.welcome ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const emp: Employee = {
        id: initial?.id ?? `emp-${Date.now().toString(36)}`,
        name: name.trim(),
        role: role.trim() || "AI 员工",
        emoji: emoji.trim() || "🤖",
        desc: desc.trim(),
        systemPrompt: systemPrompt.trim() || `你是媒电通工作台的${name.trim()}，请用简洁专业的中文回答用户问题。`,
        welcome: welcome.trim() || `你好，我是${name.trim()}。请告诉我你的需求。`,
        suggestions: initial?.suggestions ?? [],
        shortcuts: initial?.shortcuts ?? [],
      };
      await onSave(emp);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={initial ? t("aistaff.editEmployee") : t("aistaff.newEmployee")} onClose={onClose}
      footer={<><Btn onClick={onClose}>{t("common.cancel")}</Btn><Btn kind="primary" disabled={busy} onClick={() => void submit()}>{t("common.save")}</Btn></>}>
      <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label={t("aistaff.name")}>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：销售教练" />
        </Field>
        <Field label={t("aistaff.role")}>
          <input className="inp" value={role} onChange={(e) => setRole(e.target.value)} placeholder="例如：销售策略 · 话术优化" />
        </Field>
        <Field label={t("aistaff.emoji")}>
          <input className="inp" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        </Field>
        <Field label={t("aistaff.desc")}>
          <input className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="一句话说明职责" />
        </Field>
        <Field label={t("aistaff.systemPrompt")}>
          <textarea className="inp" rows={4} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="设定角色行为与回答风格" />
        </Field>
        <Field label={t("aistaff.welcome")}>
          <input className="inp" value={welcome} onChange={(e) => setWelcome(e.target.value)} placeholder="欢迎语" />
        </Field>
      </div>
    </Modal>
  );
}

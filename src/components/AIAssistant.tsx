import { useEffect, useRef, useState } from "react";
import { aiChat } from "../core/ai/client";
import { EMPLOYEE_LIST, type Employee, type EmployeeId, buildContext } from "../core/ai/employees";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: number;
}

/** AI助手悬浮面板(复刻NocoBase AI Employees右下角聊天入口) */
export default function AIAssistant({ currentPage }: { currentPage: string }) {
  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState<EmployeeId>("analyst");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const emp: Employee = EMPLOYEE_LIST.find((e) => e.id === empId) ?? EMPLOYEE_LIST[0];

  // 切换角色时清空消息并显示欢迎语
  useEffect(() => {
    setMsgs([{ id: "welcome", role: "assistant", content: emp.welcome, time: Date.now() }]);
  }, [empId]);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, loading]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: q, time: Date.now() };
    setMsgs((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const ctx = buildContext(currentPage);
      const messages = [
        { role: "system", content: emp.systemPrompt + "\n\n" + ctx },
        ...msgs.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: q },
      ];
      const r = await aiChat(messages);
      const reply: Msg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: r.ok ? r.content ?? "（无回复）" : `⚠️ ${r.error ?? "调用失败"}`,
        time: Date.now(),
      };
      setMsgs((prev) => [...prev, reply]);
    } catch (e) {
      setMsgs((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: `⚠️ 异常：${String(e)}`, time: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="ai-fab" title="AI助手" onClick={() => setOpen(true)}>
        <span className="ai-fab-icon">✨</span>
      </button>
    );
  }

  return (
    <div className="ai-panel">
      {/* 头部：角色切换 */}
      <div className="ai-panel-head">
        <div className="ai-panel-title">
          <span className="ai-emp-emoji">{emp.emoji}</span>
          <span className="ai-emp-name">{emp.name}</span>
          <span className="ai-emp-role">{emp.role}</span>
        </div>
        <button className="ai-close" onClick={() => setOpen(false)} title="关闭">✕</button>
      </div>
      {/* 角色切换tab */}
      <div className="ai-emp-tabs">
        {EMPLOYEE_LIST.map((e) => (
          <button
            key={e.id}
            className={`ai-emp-tab ${e.id === empId ? "active" : ""}`}
            onClick={() => setEmpId(e.id)}
            title={e.desc}
          >
            {e.emoji} {e.name}
          </button>
        ))}
      </div>
      {/* 快捷任务(一键执行) */}
      <div className="ai-shortcuts">
        {emp.shortcuts.map((s) => (
          <button key={s.id} className="ai-shortcut" onClick={() => void send(s.prompt)} title={s.prompt}>
            <span className="ai-shortcut-emoji">{s.emoji}</span>
            <span className="ai-shortcut-label">{s.label}</span>
          </button>
        ))}
      </div>
      {/* 消息列表 */}
      <div className="ai-msg-list" ref={listRef}>
        {msgs.map((m) => (
          <div key={m.id} className={`ai-msg ${m.role}`}>
            <div className="ai-msg-bubble">{m.content}</div>
          </div>
        ))}
        {loading && <div className="ai-msg assistant"><div className="ai-msg-bubble ai-typing">思考中…</div></div>}
      </div>
      {/* 快捷建议 */}
      <div className="ai-suggestions">
        {emp.suggestions.map((s) => (
          <button key={s} className="ai-suggestion" onClick={() => void send(s)}>{s}</button>
        ))}
      </div>
      {/* 输入区 */}
      <div className="ai-input-row">
        <input
          className="ai-input"
          placeholder={`向${emp.name}提问…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
          disabled={loading}
        />
        <button className="ai-send" onClick={() => void send()} disabled={loading || !input.trim()}>发送</button>
      </div>
    </div>
  );
}

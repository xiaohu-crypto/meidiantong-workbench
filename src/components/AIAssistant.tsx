import { useEffect, useRef, useState } from "react";
import { getAiConfig, loadAiKey } from "../core/ai/client";
import { EMPLOYEE_LIST, mergeEmployees, type Employee, type EmployeeId, buildContext } from "../core/ai/employees";
import { onDataChanged, onOpenAIStaff } from "../core/events";
import { retrieveNotes } from "../core/ai/rag";
import { Markdown } from "./Markdown";
import { db } from "../db/db";

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
  const [msgs, setMsgs] = useState<Msg[]>([{ id: "welcome", role: "assistant", content: EMPLOYEE_LIST[0].welcome, time: Date.now() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [empList, setEmpList] = useState<Employee[]>(EMPLOYEE_LIST);
  const listRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);

  const emp: Employee = empList.find((e) => e.id === empId) ?? empList[0];

  // 加载自定义员工配置
  useEffect(() => {
    void db.getSetting<Employee[]>("aiEmployees", []).then((custom) => {
      setEmpList(mergeEmployees(custom));
    });
  }, []);

  // 实时同步：AI员工页保存/删除后刷新员工列表；当前员工被删除时回退默认
  useEffect(() => {
    const offData = onDataChanged((src) => {
      if (src !== "aiEmployees") return;
      void db.getSetting<Employee[]>("aiEmployees", []).then((custom) => {
        const next = mergeEmployees(custom);
        setEmpList(next);
        if (!next.some((e) => e.id === empId)) {
          const fallback = next[0] ?? EMPLOYEE_LIST[0];
          if (fallback) {
            setEmpId(fallback.id);
            setLoaded(false);
            setMsgs([{ id: "welcome", role: "assistant", content: fallback.welcome, time: Date.now() }]);
          }
        }
      });
    });
    // AI员工页卡片点击 → 打开面板并切到该员工（先显示欢迎语，等待用户提出需求）
    const offOpen = onOpenAIStaff((targetId) => {
      setOpen(true);
      setLoaded(false);
      setEmpId(targetId);
      setInput("");
      setLoading(false);
    });
    return () => { offData(); offOpen(); };
  }, [empId]);

  // 停止生成
  function stopGeneration() {
    stoppedRef.current = true;
    setLoading(false);
    setMsgs((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant" && !last.content.includes("已停止生成")) {
        return [...prev.slice(0, -1), { ...last, content: last.content + "\n\n⏹ 已停止生成" }];
      }
      return prev;
    });
  }

  // 加载该角色的对话历史
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await db.getSetting<Msg[] | null>(`aiChat_${empId}`, null);
        if (!cancelled && saved && saved.length > 0) {
          setMsgs(saved);
        } else {
          setMsgs([{ id: "welcome", role: "assistant", content: emp.welcome, time: Date.now() }]);
        }
      } catch {
        setMsgs([{ id: "welcome", role: "assistant", content: emp.welcome, time: Date.now() }]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [empId]);

  // 保存对话历史(防抖)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      void db.setSetting(`aiChat_${empId}`, msgs);
    }, 500);
    return () => clearTimeout(t);
  }, [msgs, empId, loaded]);

  // 切换角色:加载该角色历史或显示欢迎语
  function switchEmployee(id: EmployeeId) {
    if (id === empId) return;
    setLoaded(false);
    setEmpId(id);
    setInput("");
    setLoading(false);
  }

  // 清空当前角色对话
  function clearChat() {
    setMsgs([{ id: "welcome", role: "assistant", content: emp.welcome, time: Date.now() }]);
    setInput("");
    setLoading(false);
  }

  // 复制回复
  function copyReply(content: string) {
    void navigator.clipboard.writeText(content).catch(() => {});
  }

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, loading]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    stoppedRef.current = false;
    setInput("");
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: q, time: Date.now() };
    const replyId = `a-${Date.now()}`;
    setMsgs((prev) => [...prev, userMsg, { id: replyId, role: "assistant", content: "", time: Date.now() }]);
    setLoading(true);
    try {
      const ctx = buildContext(currentPage);
      const rag = await retrieveNotes(q);
      const systemContent = emp.systemPrompt + "\n\n" + ctx + (rag.context ? "\n\n" + rag.context + "\n\n请参考以上知识库资料回答问题，如资料与问题无关可忽略。" : "");
      const messages = [
        { role: "system", content: systemContent },
        ...msgs.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: q },
      ];
      // 获取AI配置
      const cfg = await getAiConfig();
      const { key } = await loadAiKey();
      if (!key) {
        setMsgs((prev) => prev.map((m) => m.id === replyId ? { ...m, content: "⚠️ 未配置 API Key（系统管理 → AI 设置）" } : m));
        setLoading(false);
        return;
      }
      // 流式输出
      let fullContent = "";
      const chunkHandler = (chunk: string) => {
        if (stoppedRef.current) return;
        fullContent += chunk;
        setMsgs((prev) => prev.map((m) => m.id === replyId ? { ...m, content: fullContent } : m));
      };
      const doneHandler = () => {
        if (stoppedRef.current) { cleanup(); return; }
        const refSuffix = rag.notes.length > 0 ? `\n\n📚 参考知识库：${rag.notes.map((n) => "《" + n.title + "》").join("、")}` : "";
        setMsgs((prev) => prev.map((m) => m.id === replyId ? { ...m, content: fullContent + refSuffix } : m));
        setLoading(false);
        cleanup();
      };
      const errorHandler = (err: string) => {
        setMsgs((prev) => prev.map((m) => m.id === replyId ? { ...m, content: `⚠️ ${err ?? "调用失败"}` } : m));
        setLoading(false);
        cleanup();
      };
      const cleanup = () => {
        window.mta?.onStreamChunk?.(() => {});
        window.mta?.onStreamDone?.(() => {});
        window.mta?.onStreamError?.(() => {});
      };
      window.mta?.onStreamChunk?.(chunkHandler);
      window.mta?.onStreamDone?.(doneHandler);
      window.mta?.onStreamError?.(errorHandler);
      await window.mta?.chatStream?.({ baseUrl: cfg.baseUrl, apiKey: key, model: cfg.model, messages });
    } catch (e) {
      setMsgs((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: `⚠️ 异常：${String(e)}`, time: Date.now() }]);
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
        <div style={{display:"flex",gap:"4px"}}>
          <button className="ai-close" onClick={clearChat} title="清空对话">🗑</button>
          <button className="ai-close" onClick={() => setOpen(false)} title="关闭">✕</button>
        </div>
      </div>
      {/* 角色切换tab */}
      <div className="ai-emp-tabs">
        {empList.map((e) => (
          <button
            key={e.id}
            className={`ai-emp-tab ${e.id === empId ? "active" : ""}`}
            onClick={() => switchEmployee(e.id)}
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
            <div className="ai-msg-bubble">
              {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
            </div>
            {m.role === "assistant" && m.id !== "welcome" && (
              <button className="ai-copy-btn" onClick={() => copyReply(m.content)} title="复制">📋</button>
            )}
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
        {loading ? (
          <button className="ai-send" onClick={stopGeneration} style={{ background: "var(--danger)" }}>停止</button>
        ) : (
          <button className="ai-send" onClick={() => void send()} disabled={!input.trim()}>发送</button>
        )}
      </div>
    </div>
  );
}

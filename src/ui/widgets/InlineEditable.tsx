import { useState } from "react";

/**
 * P1 行内可编辑字段(对标 Antd Typography.Text editable):
 * - 展示态:悬浮显示青色铅笔图标,提示可编辑
 * - 编辑态:点击原地变输入框,失焦/回车提交,Esc 取消
 * - 提交后回写库并触发重载,实现"行内无感编辑"
 */
export function InlineEditable({ value, placeholder, onCommit }: { value: string; placeholder?: string; onCommit: (v: string) => Promise<void> | void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  function start() { setDraft(value); setEditing(true); }
  async function commit() { setEditing(false); await onCommit(draft); }
  function cancel() { setEditing(false); setDraft(value); }
  return editing ? (
    <input
      className="inp"
      style={{ width: 150, minHeight: 26, padding: "2px 6px", fontSize: "var(--text-sm)" }}
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { void commit(); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); void commit(); }
        else if (e.key === "Escape") cancel();
      }}
    />
  ) : (
    <span className="wb-editable" onClick={start} title="点击行内编辑">
      <span className="v" style={{ fontSize: "var(--text-sm)", color: value ? "var(--ink)" : "var(--ink-4)" }}>{value || placeholder || "—"}</span>
      <span className="pencil">✎</span>
    </span>
  );
}

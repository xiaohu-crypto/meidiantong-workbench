import { useState } from "react";
import { PageActionBar } from "../components/ui/PageActionBar";
import { Btn } from "../ui/common";

interface Props {
  tasks?: any[];
  payments?: any[];
  contracts?: any[];
  reload?: () => Promise<void>;
}

const TODOS = [
  { title: "星海互动电话催收", due: "今日 18:00", tag: "紧急", done: false },
  { title: "悦己提案v3发送客户", due: "今日 14:00", tag: "高", done: false },
  { title: "双11达人锁定2个", due: "周五", tag: "高", done: false },
  { title: "李姐工作日报提交", due: "明日 10:00", tag: "中", done: true },
];

const MEETINGS = [
  { time: "09:30", title: "晨会 · 昨日复盘", status: "已结束" },
  { time: "14:00", title: "星海互动催款专题会", status: "即将开始" },
  { time: "16:30", title: "双11媒介策略脑暴", status: "待开始" },
];

const PROJECTS = [
  { name: "双11美妆战役", pct: 72, color: "#10B981", owner: "小张" },
  { name: "星海互动催收", pct: 33, color: "#EF4444", owner: "李姐" },
  { name: "达人矩阵拓展", pct: 66, color: "#6366F1", owner: "王哥" },
];

const REPORTS = [
  { title: "李姐 · 工作日报", period: "今日", status: "已提交", owner: "李姐" },
  { title: "王哥 · 第39周周报", period: "9/22-28", status: "待提交", owner: "王哥" },
  { title: "小张 · 月度复盘", period: "9月", status: "AI草稿", owner: "小张" },
];

const ACTIVITIES = [
  { name: "小张", text: "完成提案v3", time: "10分" },
  { name: "李姐", text: "更新催收SOP", time: "25分" },
  { name: "王哥", text: "建甘特图", time: "1时" },
  { name: "赵助理", text: "上传拜访纪要", time: "2时" },
];

export default function Growth(_props: Props) {
  const [editor, setEditor] = useState<{ type: string; title: string; template?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"待办" | "会议" | "报告">("待办");

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>
      {/* 顶部工具栏 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>9月25日 周五 · 3场会议 · 4项待办 · 2份报告待写</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-muted)" }}>🔍 搜索会议/报告/任务...</div>
          <Btn kind="primary" size="sm">＋ 快速创建</Btn>
        </div>
      </div>

      {/* 三栏布局 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 14 }}>
        {/* 左栏：待办 + 会议 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 待办 */}
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>今日待办</div>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{TODOS.filter(t => !t.done).length} 项待完成</span>
            </div>
            {TODOS.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < TODOS.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <input type="checkbox" checked={t.done} readOnly style={{ accentColor: "var(--brand-primary)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.due}</div>
                </div>
                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: t.tag === "紧急" ? "var(--status-danger-bg)" : t.tag === "高" ? "var(--status-pending-bg)" : "var(--status-success-bg)", color: t.tag === "紧急" ? "var(--status-danger)" : t.tag === "高" ? "var(--status-pending)" : "var(--status-success)" }}>{t.tag}</span>
              </div>
            ))}
          </div>

          {/* 会议日程 */}
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>今日会议</div>
              <Btn kind="ghost" size="sm">日历</Btn>
            </div>
            {MEETINGS.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < MEETINGS.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ fontSize: 11, fontWeight: 800, fontFamily: "ui-monospace,monospace", color: "var(--text-secondary)", minWidth: 40 }}>{m.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: m.status === "已结束" ? "var(--status-success)" : m.status === "即将开始" ? "var(--status-pending)" : "var(--text-muted)" }}>● {m.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中栏：项目进度 + 报告中心 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 项目进度 */}
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>项目协同进度</div>
              <Btn kind="ghost" size="sm">AI拆解</Btn>
            </div>
            {PROJECTS.map((p, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-primary)" }}>{p.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {p.owner}</span></span>
                  <span style={{ color: "var(--text-secondary)" }}>{p.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--bg-muted)", overflow: "hidden" }}>
                  <div style={{ width: p.pct + "%", height: "100%", background: p.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* 报告中心 */}
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)", marginBottom: 12 }}>
              {["日报", "周报", "月报", "季报"].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} style={{ padding: "6px 12px", border: "none", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 800, borderBottom: activeTab === t ? "2px solid var(--brand-primary)" : "2px solid transparent", color: activeTab === t ? "var(--brand-primary)" : "var(--text-secondary)" }}>{t}</button>
              ))}
            </div>
            {REPORTS.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < REPORTS.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.period} · {r.owner}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: r.status === "已提交" ? "var(--status-success)" : r.status === "AI草稿" ? "var(--status-pending)" : "var(--text-secondary)" }}>{r.status}</span>
                <Btn kind="ghost" size="sm">编辑</Btn>
              </div>
            ))}
          </div>
        </div>

        {/* 右栏：团队动态 + 快速录入 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 快速录入 */}
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>快速录入</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: "📅", label: "发起会议", desc: "记录议程·决议·待办", template: "【会议纪要】\n时间：\n参会人：\n\n一、会议议程\n1.\n2.\n\n二、讨论要点\n\n三、会议决议\n1.\n2.\n\n四、待办事项\n□ 负责人 - 事项 - 截止日期\n□ 负责人 - 事项 - 截止日期" },
                { icon: "📝", label: "写日报", desc: "今日完成·明日计划", template: "【工作日报】\n日期：2026-09-25\n姓名：\n\n一、今日完成\n1.\n2.\n\n二、明日计划\n1.\n2.\n\n三、遇到的问题/需要支持\n\n四、其他备注" },
                { icon: "📊", label: "写周报", desc: "本周总结·下周计划", template: "【工作周报】\n周期：9月22日-9月28日\n姓名：\n\n一、本周工作总结\n1.\n2.\n\n二、关键数据\n- 新增客户：\n- 在途商机：\n- 回款：\n\n三、下周计划\n1.\n2.\n\n四、风险与问题\n" },
              ].map((item, i) => (
                <button key={i} onClick={() => setEditor({ type: item.label, title: item.label, template: item.template })} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--bg-app)", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-primary)" }}>{item.label}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 团队动态 */}
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>团队动态</div>
            {ACTIVITIES.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < ACTIVITIES.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: "#FF5A36", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{a.name[0]}</div>
                <div style={{ flex: 1, fontSize: 11, color: "var(--text-secondary)" }}><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{a.name}</span> {a.text}</div>
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editor && (
        <div onClick={() => setEditor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 24, width: 520, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)" }}>{editor.title}</div>
              <button onClick={() => setEditor(null)} style={{ border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>
            <input placeholder="标题" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-subtle)", marginBottom: 10, fontSize: 13, background: "var(--bg-app)" }} />
            <textarea rows={10} defaultValue={editor.template || ""} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-subtle)", fontSize: 12, background: "var(--bg-app)", resize: "vertical", fontFamily: "ui-monospace,monospace", lineHeight: 1.6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <Btn kind="ghost" size="sm">🤖 AI生成草稿</Btn>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn kind="ghost" size="sm" onClick={() => setEditor(null)}>取消</Btn>
                <Btn kind="primary" size="sm" onClick={() => setEditor(null)}>保存</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
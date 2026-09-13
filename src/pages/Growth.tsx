import { useEffect, useState } from "react";
import { db } from "../db/db";
import type { Aar, ContactPoint, Contract, Payment, Pitch, Task } from "../types";
import { Btn, Chip, Field, money, uid, useToast } from "../ui/common";

const SKILLS = ["媒介策划", "客户沟通", "数据分析", "创意提案"];

interface Props { tasks: Task[]; payments: Payment[]; pitches: Pitch[]; cps: ContactPoint[]; contracts: Contract[]; reload: () => Promise<void> }

export default function Growth(props: Props) {
  const { show, node } = useToast();
  const [aars, setAars] = useState<Aar[]>([]);
  const [lessons, setLessons] = useState("");
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [targets, setTargets] = useState<{ weeklyVisits: number; monthlySign: number; monthlyAar: number }>({ weeklyVisits: 2, monthlySign: 500000, monthlyAar: 1 });
  const [hasTargets, setHasTargets] = useState(false);

  useEffect(() => {
    void (async () => {
      setAars((await db.getAll<Aar>("aars")).filter((a) => !a.deletedAt).sort((a, b) => b.createdAt - a.createdAt));
      setSkills(await db.getSetting<Record<string, number>>("skills", { 媒介策划: 2, 客户沟通: 2, 数据分析: 1, 创意提案: 2 }));
      const savedT = await db.getSetting<typeof targets | null>("growthTargets", null);
      setHasTargets(savedT !== null);
      setTargets(savedT ?? { weeklyVisits: 2, monthlySign: 500000, monthlyAar: 1 });
    })();
  }, []);

  const doneTasks = props.tasks.filter((t) => !t.deletedAt && t.kanbanCol === "完成").length;
  const received = props.payments.filter((p) => !p.deletedAt && p.status === "已收").reduce((s, p) => s + p.amount, 0);
  const decided = props.pitches.filter((p) => !p.deletedAt && p.result !== "待定");
  const win = decided.length ? Math.round((decided.filter((p) => p.result === "胜").length / decided.length) * 100) : null;
  const week = `第 ${Math.ceil(((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)} 周`;

  // D-30 目标 vs 实际:全部来自真实业务数据,来源对用户透明
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const monthPrefix = now.toISOString().slice(0, 7);
  const actVisits = props.cps.filter((cp) => !cp.deletedAt && cp.time >= weekStart).length;
  const actSign = props.contracts.filter((c) => !c.deletedAt && (c.signDate ?? "").startsWith(monthPrefix)).reduce((s, c) => s + c.amount, 0);
  const actAar = aars.filter((a) => a.createdAt && new Date(a.createdAt).toISOString().startsWith(monthPrefix)).length;

  async function saveAar() {
    if (!lessons.trim()) { show("经验总结必填"); return; }
    await db.put("aars", {
      id: uid("aar"), period: week,
      stats: `完成任务 ${doneTasks};已收回款 ${money(received)};比稿胜率 ${win ?? "—"}%`,
      lessons: lessons.trim(), createdAt: Date.now(),
    }, "保存 AAR 周复盘(自动预填数据)");
    setLessons("");
    setAars((await db.getAll<Aar>("aars")).filter((a) => !a.deletedAt).sort((a, b) => b.createdAt - a.createdAt));
    show("复盘已保存");
  }

  async function setSkill(name: string, level: number) {
    const next = { ...skills, [name]: level };
    setSkills(next);
    await db.setSetting("skills", next);
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>成长规划</h1><div className="date">{week} · AAR 自动预填真实数据,你只写原因与经验 · IDP/职业锚属 P2 扩展</div></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="h-row"><span className="h-title sm">我的目标 · 本周 / 本月(目标可改,实际自动统计)</span><Chip kind="data" style={{ marginLeft: "auto" }}>规划 = 目标 vs 实际</Chip></div>
        {!hasTargets ? (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
            <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>暂无成长目标</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: 12 }}>设定目标，规划你的职业成长路径</div>
            <Btn kind="primary" sm onClick={() => { const v = { weeklyVisits: 2, monthlySign: 500000, monthlyAar: 1 }; setTargets(v); setHasTargets(true); void db.setSetting("growthTargets", v); }}>设定默认目标</Btn>
          </div>
        ) : (
          <>
            <div className="alert-line" title="数据来源:接触点记录(contactPoints)中本周新增的条目,含微信/拜访/电话/邮件">
              <span className="txt">周拜访数<small style={{ display: "block", color: "var(--ink-4)", fontSize: 11 }}>来源:本周新增接触点记录</small></span>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input className="inp num" style={{ width: 64, minHeight: 28 }} value={String(targets.weeklyVisits)} onChange={(e) => { const v = { ...targets, weeklyVisits: Math.max(0, Number(e.target.value) || 0) }; setTargets(v); void db.setSetting("growthTargets", v); }} />
                <b className="num">{actVisits}</b>
                <div className="progress" style={{ width: 120 }}><div className="bar-track"><div className="bar-fill" style={{ width: Math.min(100, Math.round(actVisits * 100 / Math.max(1, targets.weeklyVisits))) + "%" }} /></div></div>
              </span>
            </div>
            <div className="alert-line" title="数据来源:合同表(contracts)中 signDate 在本月的合同金额合计">
              <span className="txt">月签约额<small style={{ display: "block", color: "var(--ink-4)", fontSize: 11 }}>来源:本月新签合同金额</small></span>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input className="inp num" style={{ width: 90, minHeight: 28 }} value={String(targets.monthlySign)} onChange={(e) => { const v = { ...targets, monthlySign: Math.max(0, Number(e.target.value) || 0) }; setTargets(v); void db.setSetting("growthTargets", v); }} />
                <b className="num">{money(actSign)}</b>
                <div className="progress" style={{ width: 120 }}><div className="bar-track"><div className="bar-fill" style={{ width: Math.min(100, Math.round(actSign * 100 / Math.max(1, targets.monthlySign))) + "%" }} /></div></div>
              </span>
            </div>
            <div className="alert-line" title="数据来源:AAR 周复盘中 createdAt 在本月的复盘条数">
              <span className="txt">月复盘次数<small style={{ display: "block", color: "var(--ink-4)", fontSize: 11 }}>来源:本月已保存的 AAR 周复盘</small></span>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input className="inp num" style={{ width: 64, minHeight: 28 }} value={String(targets.monthlyAar)} onChange={(e) => { const v = { ...targets, monthlyAar: Math.max(0, Number(e.target.value) || 0) }; setTargets(v); void db.setSetting("growthTargets", v); }} />
                <b className="num">{actAar}</b>
                <div className="progress" style={{ width: 120 }}><div className="bar-track"><div className="bar-fill" style={{ width: Math.min(100, Math.round(actAar * 100 / Math.max(1, targets.monthlyAar))) + "%" }} /></div></div>
              </span>
            </div>
          </>
        )}
      </div>

      <div className="grid-c">
        <div className="card card-pad">
          <div className="h-row"><span className="h-title sm">AAR 周复盘(数据自动预填)</span><Chip kind="data" style={{ marginLeft: "auto" }}>四步法 · 第3/4步手填</Chip></div>
          <div className="alert-line"><span className="txt">回顾目标 · 评估结果(自动)</span><span className="amt num">完成任务 {doneTasks}</span></div>
          <div className="alert-line"><span className="txt">经营数据(自动)</span><span className="amt num">已收 {money(received)}</span></div>
          <div className="alert-line"><span className="txt">比稿成功率(自动)</span><span className="amt num">{win === null ? "—" : win + "%"}</span></div>
          <Field label="分析原因 + 总结经验(手填)">
            <textarea className="inp" rows={3} style={{ width: "100%" }} value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="什么做得好?什么没做成?下一步改什么?" />
          </Field>
          <Btn kind="primary" onClick={() => { void saveAar(); }}>保存本周复盘</Btn>

          <div className="h-row" style={{ marginTop: 18 }}><span className="h-title sm">历史复盘</span></div>
          {aars.map((a) => (
            <div key={a.id} style={{ borderBottom: "1px solid var(--border-soft)", padding: "8px 0" }}>
              <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{a.period} <Chip gray style={{ marginLeft: 6 }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString("zh-CN") : ""}</Chip></div>
              <div className="cell-sub">{a.stats}</div>
              <div style={{ fontSize: "var(--text-sm)", marginTop: 4 }}>{a.lessons}</div>
            </div>
          ))}
          {aars.length === 0 ? <p className="muted">暂无复盘记录</p> : <p className="muted" style={{ fontSize: "var(--text-xs)", textAlign: "center", padding: "8px 0 4px" }}>暂无更多历史复盘</p>}
        </div>

        <div className="side-stack">
          <div className="card card-pad">
            <div className="h-row"><span className="h-title sm">能力素质自评</span><Chip gray style={{ marginLeft: "auto" }}>初学者→专家 四级</Chip></div>
            {SKILLS.map((s) => (
              <div className="alert-line" key={s}>
                <span className="txt">{s}</span>
                <span style={{ display: "inline-flex", gap: 4 }}>
                  {[1, 2, 3, 4].map((lv) => {
                    const selLv = (skills[s] ?? 0) >= lv;
                    return (
                      <button key={lv} className={"btn " + (selLv ? "data" : "done")}
                        style={{ minWidth: 30, minHeight: 30, border: selLv ? "2px solid var(--brand)" : "1px solid var(--border)", fontWeight: selLv ? 700 : 400 }}
                        onClick={() => { void setSkill(s, lv); }}>{selLv ? "✓" + lv : lv}</button>
                    );
                  })}
                </span>
              </div>
            ))}
            <p className="muted" style={{ fontSize: "var(--text-xs)" }}>1 初学者 · 2 经验者 · 3 精通者 · 4 专家</p>
          </div>
          <div className="card card-pad">
            <div className="h-row"><span className="h-title sm">70-20-10 学习分布</span></div>
            <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
              实战(任务/项目)与向他人学习(复盘)已由工作数据覆盖;课程/阅读追踪接入知识库后自动统计(属 P2)。
            </p>
          </div>
        </div>
      </div>
      {node}
    </div>
  );
}

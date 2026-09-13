import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { db } from "../db/db";
import { weightedValue } from "../core/metrics";
import type { Customer, Deal, DealStage, Pitch } from "../types";
import { Btn, Chip, Field, Modal, money, uid, useToast } from "../ui/common";
import { IconPlus, IconClose } from "../components/icons";
import { RecordPage, type WidgetDef, type RecordLayout } from "../ui/RecordPage";
import { FieldsWidget } from "../ui/widgets/FieldsWidget";

const STAGES: DealStage[] = ["线索", "MQL", "SQL", "商机", "报价", "谈判", "签约", "输单", "流失"];
const PROB: Record<DealStage, number> = { 线索: 0.05, MQL: 0.1, SQL: 0.25, 商机: 0.4, 报价: 0.6, 谈判: 0.75, 签约: 1, 输单: 0, 流失: 0 };
/** 自定义阶段概率兜底:未命中 PROB 的自定义阶段按中漏斗 40% 计,保证加权金额/百分比展示不为 NaN */
function probOf(stage: string): number {
  return PROB[stage as DealStage] ?? 0.4;
}
const MEDDIC = ["Metrics 指标", "Economic buyer 经济决策人", "Decision criteria 决策标准", "Decision process 决策流程", "Identify pain 痛点确认", "Champion 支持者"];
const BANT = ["Budget 预算", "Authority 决策权", "Need 需求", "Timeline 时间"];

/** P1 商机详情默认布局(P4 再做拖拽,数据结构预留) */
const DEFAULT_DEAL_LAYOUT: RecordLayout = {
  entity: "deal",
  tabs: [
    { id: "详情", title: "详情", widgets: [
      { id: "info", type: "fields", title: "商机信息", span: 2 },
      { id: "meddic", type: "custom", title: "MEDDIC" },
      { id: "bant", type: "custom", title: "BANT" },
    ]},
  ],
};

const SCRIPTS = [
  { scene: "首次触达", text: "X 总您好,我是专注[行业]媒介投放的顾问。看到贵司近期在[节点]的动作,我们服务过同类客户的组合打法可将获客成本降低 20-30%,方便约 15 分钟交流吗?" },
  { scene: "报价跟进(沉默 7 天+)", text: "X 总,上次报价单(V3,基于 2026-Q3 刊例)不知是否收到?针对贵司量级我们可以再争取[返点/赠量]政策,本周内锁定还可保 Q4 排期优先权。" },
  { scene: "催款(逾期)", text: "X 总,合同[编号]尾款¥[金额]已于[到期日]到期,麻烦安排一下财务;如需对账单或发票重开,我这边马上配合。" },
  { scene: "年框续约", text: "X 总,今年合作复盘:整体 ROI 1:X,优于行业基准 1:2.5。明年框架若提前锁定,可保留今年返点政策并加赠 Q1 排期优先权。" },
];

interface Props {
  deals: Deal[]; customers: Customer[]; pitches: Pitch[];
  reload: () => Promise<void>;
}

export default function Dev(props: Props) {
  const { show, node } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [extraStages, setExtraStages] = useState<string[]>([]);
  const [dealLayout, setDealLayout] = useState<RecordLayout>(DEFAULT_DEAL_LAYOUT);
  /* P4 布局编辑模式 */
  const [editingLayout, setEditingLayout] = useState(false);
  useEffect(() => { void (async () => setExtraStages(await db.getSetting<string[]>("customStages", [])))(); }, []);
  /* P1 记录布局预留:从 settings.recordLayouts 合并默认 */
  useEffect(() => {
    void (async () => {
      const saved = await db.getSetting<Record<string, RecordLayout>>("recordLayouts", {});
      const d = saved["deal"];
      if (d && Array.isArray(d.tabs) && d.tabs.length > 0) {
        setDealLayout({ ...DEFAULT_DEAL_LAYOUT, ...d, tabs: d.tabs });
      }
    })();
  }, []);
  const [pf, setPf] = useState({ name: "", customerId: "", date: new Date().toISOString().slice(0, 10), investment: "", competitors: "", result: "待定", lossReason: "", reviewNote: "" });
  const [aiPitchBusy, setAiPitchBusy] = useState(false);

  const deals = props.deals.filter((d) => !d.deletedAt);
  const nameOf = (id: string) => props.customers.find((c) => c.id === id)?.name ?? "未知客户";
  const active = deals.filter((d) => !["签约", "输单", "流失"].includes(d.stage));
  const weightedTotal = active.reduce((s, d) => s + weightedValue(d), 0);

  /* Pipeline 列:默认在途 7 阶段 + 设置(customStages)/数据中实际存在的自定义阶段(去重保序,追加在后;输单/流失为终态不进列) */
  const colStages = (() => {
    const base = STAGES.slice(0, 7);
    const customs = [...extraStages, ...deals.map((d) => d.stage)]
      .filter((s) => !base.includes(s as DealStage) && s !== "输单" && s !== "流失");
    return [...base, ...Array.from(new Set(customs))];
  })();

  const pitches = props.pitches.filter((p) => !p.deletedAt);
  const decided = pitches.filter((p) => p.result !== "待定");
  const winRate = decided.length ? Math.round((decided.filter((p) => p.result === "胜").length / decided.length) * 100) : null;

  const sel = deals.find((d) => d.id === selected) ?? null;

  const [efOpen, setEfOpen] = useState(false);
  const [ef, setEf] = useState<{ title: string; value: string; closeDate: string }>({ title: "", value: "", closeDate: "" });

  function openDealEdit(d: Deal) {
    setEf({ title: d.title, value: String(d.value), closeDate: d.closeDate ?? "" });
    setEfOpen(true);
  }

  async function submitDealEdit() {
    if (!sel) return;
    if (!ef.title.trim()) { show("商机标题必填"); return; }
    await db.put("deals", { ...sel, title: ef.title.trim(), value: Number(ef.value) || 0, closeDate: ef.closeDate || undefined }, "编辑商机「" + ef.title.trim() + "」");
    show("商机已更新");
    setEfOpen(false);
    await props.reload();
  }

  async function setStage(d: Deal, stage: DealStage) {
    await db.put("deals", { ...d, stage, probability: probOf(stage) }, `商机「${d.title}」阶段改为 ${stage}`);
    await props.reload();
  }

  async function toggleTag(d: Deal, kind: "meddic" | "bant", tag: string) {
    const arr = d[kind] ?? [];
    const next = arr.includes(tag) ? arr.filter((x) => x !== tag) : [...arr, tag];
    await db.put("deals", { ...d, [kind]: next }, `商机「${d.title}」更新${kind === "meddic" ? "MEDDIC" : "BANT"}`);
    await props.reload();
  }

  async function submitPitch() {
    if (!pf.name.trim()) { show("比稿名称必填"); return; }
    await db.put("pitches", {
      id: uid("pi"), name: pf.name.trim(), customerId: pf.customerId || undefined,
      date: pf.date, investment: Number(pf.investment) || 0, competitors: pf.competitors,
      result: pf.result as Pitch["result"], lossReason: pf.lossReason || undefined, reviewNote: pf.reviewNote || undefined,
    }, "新增比稿记录");
    show("比稿已记录");
    setPitchOpen(false);
    setPf({ name: "", customerId: "", date: new Date().toISOString().slice(0, 10), investment: "", competitors: "", result: "待定", lossReason: "", reviewNote: "" });
    await props.reload();
  }

  /** P1:根据 WidgetDef 渲染商机详情具体 Widget */
  /* P4 拖拽重排回调 */
  function handleLayoutChange(next: RecordLayout) {
    setDealLayout(next);
  }
  /* P4 info 字段可见性 */
  function setInfoVisibleFields(visible: string[]) {
    setDealLayout((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => ({
        ...t,
        widgets: t.widgets.map((w) =>
          w.id === "info" ? { ...w, config: { ...(w.config ?? {}), visibleFields: visible } } : w
        ),
      })),
    }));
  }
  /* P4 退出编辑:完整覆盖保存 recordLayouts.deal */
  async function finishEditLayout() {
    const all = await db.getSetting<Record<string, RecordLayout>>("recordLayouts", {});
    await db.setSetting("recordLayouts", { ...all, deal: dealLayout });
    show("布局已保存");
    setEditingLayout(false);
  }

  function renderDealWidget(w: WidgetDef): ReactNode {
    if (!sel) return null;
    if (w.id === "info") {
      return (
        <FieldsWidget title="商机信息" fields={[
          { label: "商机金额", value: money(sel.value) },
          { label: "阶段", value: sel.stage },
          { label: "概率", value: Math.round(probOf(sel.stage) * 100) + "%" },
          { label: "预计成交日", value: sel.closeDate ?? "未设定" },
          { label: "加权金额", value: money(weightedValue(sel)) },
        ]} editing={editingLayout} visibleFields={w.config?.visibleFields as string[] | undefined} onVisibleFieldsChange={setInfoVisibleFields} />
      );
    }
    if (w.id === "meddic") {
      return (
        <div className="card widget-card">
          <div className="h-row" style={{ padding: "14px 16px 0", marginBottom: 4 }}><span className="h-title sm">MEDDIC 成熟度</span></div>
          <div style={{ padding: "4px 16px 14px" }}>
            {MEDDIC.map((m) => (
              <div className="mini-row" key={m}>
                <span className="ev">{m}</span>
                <Btn kind={(sel.meddic ?? []).includes(m) ? "primary" : "ghost"} sm onClick={() => { void toggleTag(sel, "meddic", m); }}>{(sel.meddic ?? []).includes(m) ? "已确认" : "标记"}</Btn>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (w.id === "bant") {
      return (
        <div className="card widget-card">
          <div className="h-row" style={{ padding: "14px 16px 0", marginBottom: 4 }}><span className="h-title sm">BANT 资格</span></div>
          <div style={{ padding: "4px 16px 14px" }}>
            {BANT.map((b) => (
              <div className="mini-row" key={b}>
                <span className="ev">{b}</span>
                <Btn kind={(sel.bant ?? []).includes(b) ? "primary" : "ghost"} sm onClick={() => { void toggleTag(sel, "bant", b); }}>{(sel.bant ?? []).includes(b) ? "已确认" : "标记"}</Btn>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>商机管理</h1><div className="date">Deal 唯一漏斗 · 加权在途 {money(weightedTotal)} · 比稿胜率 {winRate === null ? "—" : winRate + "%"}({decided.length} 场)</div></div>
        <div className="actions"><Btn kind="primary" onClick={() => setPitchOpen(true)}><IconPlus size={14} /> 登记比稿</Btn></div>
      </div>

      <div className="h-row"><span className="h-title">Pipeline(按阶段)</span><Chip kind="data">点击卡片查看详情</Chip></div>
      <div className="kanban" style={{ gridTemplateColumns: "repeat(" + colStages.length + ",1fr)", marginBottom: 16 }}>
        {colStages.map((stage) => {
          const col = deals.filter((d) => d.stage === stage);
          return (
            <div className="kcol" key={stage} style={{ minHeight: 200 }}>
              <div className="kcol-head">{stage}<span className="chip gray" style={{ marginLeft: "auto" }}>{col.length}</span></div>
              <div className="kcol-body">
                {col.map((d) => (
                  <div className="kcard" key={d.id} onClick={() => setSelected(d.id)}
                    style={selected === d.id ? { borderColor: "var(--brand)" } : undefined}>
                    <div className="t" style={{ fontSize: "var(--text-xs)" }}>{nameOf(d.customerId)}</div>
                    <div className="cell-sub">{d.title.startsWith(nameOf(d.customerId)) ? d.title.slice(nameOf(d.customerId).length).trim() : d.title}</div>
                    <div className="m"><span className="num" style={{ fontWeight: 650 }}>{money(d.value)}</span>
                      <span className="chip data" style={{ fontSize: 10, padding: "0 6px" }}>{Math.round(probOf(d.stage) * 100)}%</span></div>
                  </div>
                ))}
                {col.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)", textAlign: "center" }}>—</p> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className={"drawer-mask" + (sel ? " open" : "")} onClick={() => setSelected(null)} />
      <aside className={"drawer" + (sel ? " open" : "")}>
        {sel ? (
          <>
            <div className="drawer-head">
              <div className="detail-avatar">{nameOf(sel.customerId).slice(0, 1)}</div>
              <div>
                <div className="detail-title">{sel.title}</div>
                <div className="detail-sub">
                  <Chip kind="data">{nameOf(sel.customerId)}</Chip>
                  <select
                    className="sel"
                    style={{ minHeight: 26, padding: "2px 8px", fontSize: "var(--text-xs)" }}
                    value={sel.stage}
                    onChange={(e) => { void setStage(sel, e.target.value as DealStage); }}
                  >
                    {[...STAGES, ...extraStages.filter((s) => !STAGES.includes(s as DealStage))].map((s) => <option key={s} value={s}>{s}({Math.round(probOf(s) * 100)}%)</option>)}
                  </select>
                </div>
              </div>
              <Btn kind={editingLayout ? "data" : "ghost"} sm style={{ marginLeft: "auto" }} onClick={() => { if (editingLayout) void finishEditLayout(); else setEditingLayout(true); }}>{editingLayout ? "完成" : "编辑布局"}</Btn>
              <button className="icon-btn" onClick={() => setSelected(null)} aria-label="关闭"><IconClose size={16} /></button>
            </div>
            <div className="drawer-body">
              <RecordPage
                layout={dealLayout}
                activeTab="详情"
                onTabChange={() => {}}
                renderWidget={renderDealWidget}
                editing={editingLayout}
                onLayoutChange={handleLayoutChange}
              />
            </div>
            <div className="drawer-foot">
              <Btn kind="primary" onClick={() => openDealEdit(sel)}>编辑商机</Btn>
            </div>
          </>
        ) : null}
      </aside>

      {efOpen && sel ? (
        <Modal title="编辑商机" onClose={() => setEfOpen(false)} footer={
          <div className="grow" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn kind="ghost" onClick={() => setEfOpen(false)}>取消</Btn>
            <Btn kind="primary" onClick={() => { void submitDealEdit(); }}>保存</Btn>
          </div>
        }>
          <Field label="商机标题">
            <input className="inp" style={{ width: "100%" }} value={ef.title} onChange={(e) => setEf({ ...ef, title: e.target.value })} />
          </Field>
          <div className="field-row">
            <Field label="金额(元)">
              <input className="inp num" style={{ width: "100%" }} value={ef.value} onChange={(e) => setEf({ ...ef, value: e.target.value })} />
            </Field>
            <Field label="预计成交日(可选)">
              <input className="inp num" type="date" style={{ width: "100%" }} value={ef.closeDate} onChange={(e) => setEf({ ...ef, closeDate: e.target.value })} />
            </Field>
          </div>
          <p className="muted" style={{ fontSize: "var(--text-xs)" }}>概率由阶段自动派生;阶段在抽屉头部下拉调整。</p>
        </Modal>
      ) : null}


      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="h-row" style={{ padding: "12px 16px 0" }}><span className="h-title sm">比稿管理(投入/竞对/结果/复盘)</span></div>
        <div className="tgrid-wrap">
          <table className="tgrid">
            <thead><tr><th>比稿</th><th>客户</th><th>日期</th><th>投入</th><th>竞对</th><th>结果</th><th>复盘</th></tr></thead>
            <tbody>
              {pitches.map((p) => (
                <tr key={p.id} style={{ cursor: "default" }}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.customerId ? nameOf(p.customerId) : "—"}</td>
                  <td className="num">{p.date}</td>
                  <td className="num">{money(p.investment)}</td>
                  <td>{p.competitors || "—"}</td>
                  <td><Chip kind={p.result === "胜" ? "green" : p.result === "败" ? "danger" : "warn"}>{p.result}</Chip></td>
                  <td className="cell-sub" style={{ maxWidth: 220 }}>{p.reviewNote || p.lossReason || "—"}</td>
                </tr>
              ))}
              {pitches.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-3)", padding: 20 }}>暂无比稿记录</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-pad">
        <div className="h-row"><span className="h-title sm">SOP 话术库</span><Chip gray>内置 4 模板 · 自定义维护属二期</Chip></div>
        {SCRIPTS.map((s) => (
          <div className="alert-line" key={s.scene}>
            <Chip kind="data">{s.scene}</Chip>
            <span className="txt">{s.text}</span>
            <Btn kind="done" sm onClick={() => { void navigator.clipboard.writeText(s.text).then(() => show("话术已复制")); }}>复制</Btn>
          </div>
        ))}
      </div>

      {pitchOpen ? (
        <Modal title="登记比稿" onClose={() => setPitchOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setPitchOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void submitPitch(); }}>保存</Btn></div>
        }>
          <Field label="比稿名称"><input className="inp" style={{ width: "100%" }} value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} /></Field>
          <div className="field-row">
            <Field label="客户(可选)">
              <select className="sel" style={{ width: "100%" }} value={pf.customerId} onChange={(e) => setPf({ ...pf, customerId: e.target.value })}>
                <option value="">未关联</option>
                {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="日期"><input className="inp num" type="date" style={{ width: "100%" }} value={pf.date} onChange={(e) => setPf({ ...pf, date: e.target.value })} /></Field>
          </div>
          <div className="field-row">
            <Field label="投入成本(元)"><input className="inp num" style={{ width: "100%" }} value={pf.investment} onChange={(e) => setPf({ ...pf, investment: e.target.value })} /></Field>
            <Field label="竞对"><input className="inp" style={{ width: "100%" }} value={pf.competitors} onChange={(e) => setPf({ ...pf, competitors: e.target.value })} /></Field>
          </div>
          <div className="field-row">
            <Field label="结果">
              <select className="sel" style={{ width: "100%" }} value={pf.result} onChange={(e) => setPf({ ...pf, result: e.target.value })}>
                {["待定", "胜", "败"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label={pf.result === "败" ? "败稿原因" : "备注(可选)"}><input className="inp" style={{ width: "100%" }} value={pf.lossReason} onChange={(e) => setPf({ ...pf, lossReason: e.target.value })} /></Field>
          </div>
          <Field label={"复盘要点 " + (pf.customerId ? "" : "(选客户后可用AI)")}>
          <div style={{ display: "flex", gap: 6 }}>
            <textarea className="inp" rows={2} style={{ flex: 1, width: "100%" }} value={pf.reviewNote} onChange={(e) => setPf({ ...pf, reviewNote: e.target.value })} />
            <Btn kind="ghost" sm disabled={aiPitchBusy || !pf.customerId} onClick={() => {
              setAiPitchBusy(true);
              void (async () => {
                const { aiChat } = await import("../core/ai/client");
                const cust = props.customers.find((c) => c.id === pf.customerId);
                const r = await aiChat([
                  { role: "system", content: "你是资深广告投放策划,根据客户信息写一段比稿复盘话术,200字以内,突出投放亮点和下一步建议。" },
                  { role: "user", content: "客户:" + (cust?.name ?? "") + "\n行业:" + (cust?.industry ?? "") + "\n竞争对手:" + pf.competitors + "\n投入:" + pf.investment },
                ]);
                setPf((prev) => ({ ...prev, reviewNote: r.ok ? (r.content ?? "") : "AI调用失败" }));
                setAiPitchBusy(false);
              })();
            }}>{aiPitchBusy ? "…" : "✦"}</Btn>
          </div>
        </Field>
        </Modal>
      ) : null}
      {node}
    </div>
  );
}

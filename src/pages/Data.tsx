import { useEffect, useState, type ReactNode } from "react";
import { db } from "../db/db";
import { weightedValue } from "../core/metrics";
import type { Baseline, Contract, Deal, Payment, ScheduleItem, PostBuy, Task } from "../types";
import { Btn, Chip, Field, money, uid, useToast } from "../ui/common";
import { Dashboard, type DashboardDef, type DashboardWidgetDef } from "../ui/Dashboard";
import { KpiWidget } from "../ui/widgets/KpiWidget";
import { BarChartWidget } from "../ui/widgets/BarChartWidget";
import { TableWidget } from "../ui/widgets/TableWidget";

interface Props {
  contracts: Contract[]; payments: Payment[]; deals: Deal[]; items: ScheduleItem[]; baselines: Baseline[];
  postbuys?: import("../types").PostBuy[]; resources?: import("../types").MediaResource[];
  tasks: Task[];
  reload: () => Promise<void>;
}

type Metric = "签约额" | "回款" | "毛利";

const DEFAULT_DASHBOARD: DashboardDef = {
  id: "overview",
  name: "数据报表",
  tabs: [{
    id: "main",
    title: "概览",
    widgets: [
      { id: "kpi-sign", type: "kpi", title: "累计签约额", span: 1 },
      { id: "kpi-paid", type: "kpi", title: "已收回款", span: 1 },
      { id: "kpi-margin", type: "kpi", title: "综合毛利率", span: 1 },
      { id: "kpi-weighted", type: "kpi", title: "在途加权商机", span: 1 },
      { id: "bar-sign-trend", type: "bar", title: "签约额趋势(近6月)", span: 2 },
      { id: "bar-funnel", type: "bar", title: "商机漏斗", span: 2 },
      { id: "table-overdue", type: "table", title: "逾期回款", span: 2 },
      { id: "table-tasks", type: "table", title: "待办任务", span: 2 },
    ],
  }],
};

export default function Data(props: Props) {
  const { show, node } = useToast();
  const [metric, setMetric] = useState<Metric>("签约额");
  const [bl, setBl] = useState({ dimension: "", metric: "", value: "" });
  const [dashTab, setDashTab] = useState<"dashboard" | "detail">("dashboard");
  const [activeDashTab, setActiveDashTab] = useState("main");
  /* P4 仪表盘布局:从 settings.dashboards 合并默认 */
  const [dashboard, setDashboard] = useState<DashboardDef>(DEFAULT_DASHBOARD);
  const [editingDash, setEditingDash] = useState(false);
  useEffect(() => {
    void (async () => {
      const saved = await db.getSetting<Record<string, DashboardDef>>("dashboards", {});
      const ov = saved["overview"];
      if (ov && Array.isArray(ov.tabs) && ov.tabs.length > 0) {
        setDashboard({ ...DEFAULT_DASHBOARD, ...ov, tabs: ov.tabs });
      }
    })();
  }, []);

  const contracts = props.contracts.filter((c) => !c.deletedAt);
  const payments = props.payments.filter((p) => !p.deletedAt);
  const items = props.items.filter((i) => !i.deletedAt);
  const baselines = props.baselines.filter((b) => !b.deletedAt);

  const mediaCost = items.reduce((s, i) => s + i.cost, 0);
  const kpiSign = contracts.reduce((s, c) => s + c.amount, 0);
  const kpiPaid = payments.filter((p) => p.status === "已收").reduce((s, p) => s + p.amount, 0);
  const dueNow = payments.filter((p) => new Date(p.dueDate).getTime() <= Date.now());
  const paidOfDue = dueNow.filter((p) => p.status === "已收").reduce((s, p) => s + p.amount, 0);
  const dueTotal = dueNow.reduce((s, p) => s + p.amount, 0);
  const collectRate = dueTotal ? Math.round((paidOfDue / dueTotal) * 100) : 100;
  const marginRate = kpiSign ? Math.round(((kpiSign - mediaCost) / kpiSign) * 100) : 0;
  const activeDeals = props.deals.filter((d) => !d.deletedAt && !["输单", "流失", "签约"].includes(d.stage));
  const weighted = activeDeals.reduce((s, d) => s + weightedValue(d), 0);

  /* 近 6 个月趋势(按口径) */
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthVal = (m: string): number => {
    if (metric === "签约额") return contracts.filter((c) => c.signDate.startsWith(m)).reduce((s, c) => s + c.amount, 0);
    if (metric === "回款") return payments.filter((p) => p.paidDate?.startsWith(m)).reduce((s, p) => s + p.amount, 0);
    /* 毛利口径:月度毛利 = 本月签约额 − 本月分摊媒体成本;媒体成本按全部合同数均摊,每月合同减同一分摊值(与需求文档 2.3 一致) */
    const total = contracts.length || 1;
    return contracts.filter((c) => c.signDate.startsWith(m)).reduce((s, c) => s + (c.amount - mediaCost / total), 0);
  };
  const vals = months.map(monthVal);
  const maxV = Math.max(...vals, 1);

  /* 仪表盘固定签约额口径 */
  const signVals = months.map((m) => contracts.filter((c) => c.signDate.startsWith(m)).reduce((s, c) => s + c.amount, 0));
  const signMom = signVals[4] ? Math.round(((signVals[5] - signVals[4]) / signVals[4]) * 100) : 0;

  /* 商机漏斗数据 */
  const funnelStages = ["线索", "MQL", "SQL", "商机", "报价", "谈判", "签约"];
  const funnelCounts = funnelStages.map((st) => props.deals.filter((d) => !d.deletedAt && d.stage === st).length);

  /* 逾期回款表格 */
  const contractName = (cid: string) => contracts.find((c) => c.id === cid)?.name ?? cid;
  const overdueRows = payments.filter((p) => p.status === "逾期").map((p) => ({
    contract: contractName(p.contractId),
    amount: money(p.amount),
    dueDate: p.dueDate,
  }));

  /* 待办任务表格 */
  const activeTasks = props.tasks.filter((t) => !t.deletedAt && t.kanbanCol !== "完成")
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  const taskRows = activeTasks.map((t) => ({
    title: t.title,
    priority: t.priority,
    due: t.due ?? "—",
  }));

  const thisMonth = months[5];
  function momArrow(cur: number, prev: number) {
    if (!prev) return " · 环比—";
    const pct = Math.round(((cur - prev) / prev) * 100);
    const up = pct >= 0;
    return ' · <span style="color:' + (up ? "var(--success)" : "var(--danger)") + '">' + (up ? "▲" : "▼") + " " + Math.abs(pct) + "%</span>";
  }
  const monthContracts = contracts.filter((c) => c.signDate.startsWith(thisMonth));

  async function addBaseline() {
    if (!bl.dimension || !bl.metric || !bl.value) { show("三项均必填"); return; }
    await db.put("baselines", { id: uid("bl"), dimension: bl.dimension, metric: bl.metric, value: bl.value, source: "手动维护" }, "新增基准值");
    setBl({ dimension: "", metric: "", value: "" });
    show("基准值已保存");
    await props.reload();
  }

  /* 导出物(HTML 成绩单)使用独立浅色打印样式,色值属导出文档而非应用 UI */
  function exportReport() {
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>月度成绩单 ${thisMonth}</title><style>:root{--brand:#E01844;--ink:#17181C;--ink-2:#7A7F89;--surface:#F5F6F8;--surface-2:#fff;--border:#E4E6EB;--border-soft:#EEF0F3}body{font-family:'PingFang SC',sans-serif;max-width:680px;margin:48px auto;color:var(--ink);background:var(--surface);padding:32px;border-radius:16px}.card{background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:28px}.k{color:var(--ink-2);font-size:12px;text-transform:uppercase;letter-spacing:.06em}.v{font-size:30px;font-weight:800;margin:4px 0 18px}.v b{color:var(--brand)}h1{font-size:22px}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}td{padding:8px 6px;border-bottom:1px solid var(--border-soft)}</style></head><body><div class="card"><h1>月度成绩单 · ${thisMonth}</h1><p class="k">媒体广告个人工作台 · 自动生成</p><div class="v"><b class="num">${money(monthContracts.reduce((s, c) => s + c.amount, 0))}</b></div><table>
      <tr><td>本月新签合同</td><td class="num">${monthContracts.length} 份</td></tr>
      <tr><td>累计签约额(口径:${metric})</td><td class="num">${money(metric === "回款" ? kpiPaid : metric === "毛利" ? kpiSign - mediaCost : kpiSign)}</td></tr>
      <tr><td>回款率(到期口径)</td><td class="num">${collectRate}%</td></tr>
      <tr><td>综合毛利率</td><td class="num">${marginRate}%</td></tr>
      <tr><td>在途加权商机</td><td class="num">${money(weighted)}</td></tr>
      <tr><td>本月完成任务</td><td class="num">见工作管理看板</td></tr>
    </table><p style="color:var(--ink-2);font-size:11px;margin-top:16px">品牌高光面排版 · 数据口径见需求文档 2.3 · 本地生成不上传</p></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `月度成绩单_${thisMonth}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    show("月度成绩单已导出");
  }

  /* Dashboard renderWidget:根据 widget.id 返回对应组件 */
  /* P4 仪表盘拖拽重排回调 */
  function handleDashChange(next: DashboardDef) {
    setDashboard(next);
  }
  /* P4 退出仪表盘编辑:完整覆盖保存 dashboards.overview */
  async function finishDashEdit() {
    const all = await db.getSetting<Record<string, DashboardDef>>("dashboards", {});
    await db.setSetting("dashboards", { ...all, overview: dashboard });
    show("仪表盘布局已保存");
    setEditingDash(false);
  }

  function renderWidget(w: DashboardWidgetDef): ReactNode {
    switch (w.id) {
      case "kpi-sign":
        return <KpiWidget title="累计签约额" value={money(kpiSign)} sub="合同口径" trend={{ value: signMom, label: "环比上月" }} />;
      case "kpi-paid":
        return <KpiWidget title="已收回款" value={money(kpiPaid)} sub={`回款率(到期口径) ${collectRate}%`} />;
      case "kpi-margin":
        return <KpiWidget title="综合毛利率" value={`${marginRate}%`} sub="含所有签约商机的(签约额-媒体成本)/签约额" />;
      case "kpi-weighted":
        return <KpiWidget title="在途加权商机" value={money(weighted)} sub={`${activeDeals.length} 个商机`} />;
      case "bar-sign-trend":
        return (
          <BarChartWidget
            title="签约额趋势(近6月)"
            data={months.map((m, i) => ({ label: m.slice(5) + "月", value: signVals[i] }))}
            valueFormatter={(v) => money(v)}
            highlightLast
          />
        );
      case "bar-funnel":
        return (
          <BarChartWidget
            title="商机漏斗"
            data={funnelStages.map((s, i) => ({ label: s, value: funnelCounts[i] }))}
            horizontal
          />
        );
      case "table-overdue":
        return (
          <TableWidget
            title="逾期回款"
            columns={[
              { key: "contract", label: "合同" },
              { key: "amount", label: "金额", align: "right" },
              { key: "dueDate", label: "到期日" },
            ]}
            rows={overdueRows}
            emptyText="暂无逾期回款"
          />
        );
      case "table-tasks":
        return (
          <TableWidget
            title="待办任务"
            columns={[
              { key: "title", label: "任务" },
              { key: "priority", label: "优先级" },
              { key: "due", label: "到期日" },
            ]}
            rows={taskRows}
            emptyText="暂无待办任务"
          />
        );
      default:
        return null;
    }
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>数据报表</h1><div className="date">经营分析仪表盘 · 自动汇总客户与商机数据</div></div>
      </div>
      <div className="tabs">
        <span className={"tab" + (dashTab === "dashboard" ? " active" : "")} onClick={() => setDashTab("dashboard")}>仪表盘</span>
        <span className={"tab" + (dashTab === "detail" ? " active" : "")} onClick={() => setDashTab("detail")}>详细报表</span>
      </div>
      {contracts.length === 0 && activeDeals.length === 0 && payments.length === 0 ? (
        <div className="empty-state">
          <div className="es-icon">&#128202;</div>
          <div className="es-title">暂无数据</div>
          <div className="es-desc">添加客户和商机后，这里会自动生成经营分析</div>
          <Btn kind="primary" onClick={() => window.dispatchEvent(new CustomEvent("nav", { detail: "crm" }))}>去添加客户</Btn>
        </div>
      ) : (

        <>
      {dashTab === "dashboard" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0 0" }}>
            <Btn kind={editingDash ? "data" : "ghost"} title="自定义可见字段" onClick={() => { if (editingDash) void finishDashEdit(); else setEditingDash(true); }}>{editingDash ? "完成" : "编辑布局"}</Btn>
          </div>
          <Dashboard
            dashboard={dashboard}
            activeTab={activeDashTab}
            onTabChange={setActiveDashTab}
            renderWidget={renderWidget}
            editing={editingDash}
            onLayoutChange={handleDashChange}
          />
        </div>
      ) : (
        <>
          <div className="page-head">
            <div className="date">口径可切换(签约额/回款/毛利)· 基准值表让数据可解读 · 演示口径:合同签约额</div>
            <div className="actions">
              <select className="sel" value={metric} onChange={(e) => setMetric(e.target.value as Metric)}>
                {["签约额", "回款", "毛利"].map((m) => <option key={m}>{m}</option>)}
              </select>
              <Btn kind="primary" onClick={exportReport}>生成月度成绩单</Btn>
            </div>
          </div>

          <div className="kpis" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
            <div className="kpi card-pad card"><div className="muted" style={{ fontSize: "var(--text-xs)" }}>累计签约额</div><div style={{ fontSize: 22, fontWeight: 750 }} className="num">{money(kpiSign)}</div><div className="cell-sub">合同口径<span dangerouslySetInnerHTML={{ __html: momArrow(vals[5], vals[4]) }} /></div></div>
            <div className="kpi card-pad card"><div className="muted" style={{ fontSize: "var(--text-xs)" }}>已收回款</div><div style={{ fontSize: 22, fontWeight: 750 }} className="num">{money(kpiPaid)}</div><div className="cell-sub">回款率(到期口径)<span className="num"> {collectRate}%</span></div></div>
            <div className="kpi card-pad card"><div className="muted" style={{ fontSize: "var(--text-xs)" }}>综合毛利率</div><div style={{ fontSize: 22, fontWeight: 750 }} className="num">{marginRate}%</div><div className="cell-sub">含所有签约商机的(签约额-媒体成本)/签约额</div></div>
            <div className="kpi card-pad card"><div className="muted" style={{ fontSize: "var(--text-xs)" }}>在途加权商机</div><div style={{ fontSize: 22, fontWeight: 750 }} className="num">{money(weighted)}</div><div className="cell-sub">{activeDeals.length} 个商机</div></div>
          </div>

          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="h-row"><span className="h-title sm">{metric}趋势(近 6 个月)</span><Chip kind="data" style={{ marginLeft: "auto" }}>青=数据系列</Chip></div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 160, padding: "12px 4px 0" }}>
              {months.map((m, i) => (
                <div key={m} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: 4 }} className="num">{vals[i] ? money(vals[i]).replace("¥", "") : "—"}</div>
                  <div style={{ height: Math.max(4, (vals[i] / maxV) * 110), background: i === 5 ? "var(--brand)" : "var(--chart-1)", borderRadius: "6px 6px 0 0", opacity: i === 5 ? 1 : .85 }} />
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginTop: 6 }}>{m.slice(5)}月</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="h-row"><span className="h-title sm">商机漏斗</span><Chip kind="data" style={{ marginLeft: "auto" }}>各阶段数量</Chip></div>
            {(() => {
              const stages = ["线索", "MQL", "SQL", "商机", "报价", "谈判", "签约"];
              const counts = stages.map((st) => props.deals.filter((d) => !d.deletedAt && d.stage === st).length);
              const maxC = Math.max(...counts, 1);
              const lost = props.deals.filter((d) => !d.deletedAt && (d.stage === "输单" || d.stage === "流失")).length;
              return (
                <div style={{ padding: "12px 0" }}>
                  {stages.map((st, i) => (
                    <div key={st} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 40, fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>{st}</div>
                      <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: (counts[i] / maxC) * 100 + "%", background: i === stages.length - 1 ? "var(--success)" : "var(--chart-1)", height: 22, display: "flex", alignItems: "center", paddingLeft: 6, fontSize: 11, color: "var(--ink)", fontWeight: 600 }}>
                          {counts[i]}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
                    <div style={{ width: 40, textAlign: "right" }}>输单</div>
                    <div style={{ flex: 1, color: "var(--danger)" }}>{lost} 个</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="h-row"><span className="h-title sm">投放ROI看板</span><Chip kind="data" style={{ marginLeft: "auto" }}>PostBuy 口径</Chip></div>
            {(() => {
              const pbs = (props.postbuys ?? []).filter((p) => !p.deletedAt);
              if (pbs.length === 0) return <p className="muted" style={{ padding: 12 }}>暂无投后数据,去媒介页录入PostBuy</p>;
              const resName = (id: string) => (props.resources ?? []).find((r) => r.id === id)?.name ?? id;
              return (
                <table className="tgrid">
                  <thead><tr><th>媒体资源</th><th>月份</th><th>曝光</th><th>CPM</th><th>ROI</th><th>CTR</th></tr></thead>
                  <tbody>
                    {pbs.slice(-10).reverse().map((pb: PostBuy) => (
                      <tr key={pb.id}>
                        <td style={{ fontWeight: 600 }}>{resName(pb.resourceId)}</td>
                        <td>{pb.month}</td>
                        <td className="num">{pb.actualImpression.toLocaleString()}</td>
                        <td className="num">¥{pb.cpm}</td>
                        <td className="num" style={{ color: pb.roi >= 1 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>{pb.roi}x</td>
                        <td className="num">{pb.ctr ? pb.ctr + "%" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>

          <div className="card card-pad">
            <div className="h-row"><span className="h-title sm">行业基准值表</span><button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={() => window.print()}>导出PDF</button><Chip gray style={{ marginLeft: "auto" }}>可维护 · 图表解读依据</Chip></div>
            <table className="tgrid">
              <thead><tr><th>行业/维度</th><th>指标</th><th>基准值</th><th>来源</th></tr></thead>
              <tbody>
                {baselines.map((b) => (
                  <tr key={b.id} style={{ cursor: "default" }}>
                    <td style={{ fontWeight: 600 }}>{b.dimension}</td><td>{b.metric}</td>
                    <td className="num" style={{ fontWeight: 650 }}>{b.value}</td><td className="cell-sub">{b.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="field-row" style={{ marginTop: 10 }}>
              <Field label="行业/维度"><input className="inp" style={{ width: "100%" }} value={bl.dimension} onChange={(e) => setBl({ ...bl, dimension: e.target.value })} /></Field>
              <Field label="指标"><input className="inp" style={{ width: "100%" }} value={bl.metric} onChange={(e) => setBl({ ...bl, metric: e.target.value })} /></Field>
            </div>
            <Field label="基准值(如 ¥45-70 / ≥1:2.5)"><input className="inp num" style={{ width: "100%" }} value={bl.value} onChange={(e) => setBl({ ...bl, value: e.target.value })} /></Field>
            <Btn kind="data" onClick={() => { void addBaseline(); }}>保存基准值</Btn>
          </div>
        </>
      )}
        </>
      )}
      {node}
    </div>
  );
}

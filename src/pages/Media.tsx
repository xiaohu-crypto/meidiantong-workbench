import { useMemo, useState } from "react";
import { db } from "../db/db";
import type { Customer, Influencer, MediaResource, PostBuy, PricePoint, RateCard, ScheduleItem, Supplier } from "../types";
import { Btn, Chip, Field, Modal, money, uid, useToast } from "../ui/common";
import { IconPlus } from "../components/icons";
import { parseCsv } from "../core/importer";

interface Props {
  suppliers: Supplier[]; resources: MediaResource[]; ratecards: RateCard[];
  items: ScheduleItem[]; postbuys: PostBuy[]; customers: Customer[]; influencers: Influencer[];
  reload: () => Promise<void>;
}

const emptyRf = { name: "", type: "效果广告", supplierId: "", intro: "", advantage: "", cases: "" };
const emptyIf = { name: "", platform: "抖音" as Influencer["platform"], followers: "", category: "", tags: "", contact: "", history: "", pricePerPost: "" };

export default function Media(props: Props) {
  const { show, node } = useToast();
  const [tab, setTab] = useState<"排期" | "资源与刊例" | "达人库" | "报价器" | "投后 PostBuy">("排期");
  const [resOpen, setResOpen] = useState(false);
  const [editResId, setEditResId] = useState<string | null>(null);
  const [rf, setRf] = useState(emptyRf);
  const [rcFor, setRcFor] = useState<string | null>(null);
  const [rc, setRc] = useState({ version: "", effectiveFrom: "2026-10-01", listPrice: "" });
  const [buyOpen, setBuyOpen] = useState(false);
  const [bf, setBf] = useState({ customerId: "", name: "", resourceId: "", start: "2026-10-01", end: "2026-11-30", cost: "", sellPrice: "", rebate: "", status: "待确认" });
  const [csv, setCsv] = useState("");
  const [pointModal, setPointModal] = useState<{ resourceId: string; point?: PricePoint; idx: number } | null>(null);
  const [pf, setPf] = useState<PricePoint>({ name: "", city: "", form: "", size: "", qty: 1, footfall: 0, price: 0, status: "可售" });

  /* 达人库 */
  const [ifOpen, setIfOpen] = useState(false);
  const [editIfId, setEditIfId] = useState<string | null>(null);
  const [ifForm, setIfForm] = useState(emptyIf);

  /* PostBuy 手动表单 */
  const [pbOpen, setPbOpen] = useState(false);
  const [pbForm, setPbForm] = useState({ resourceId: "", month: "", actualImpression: "", cpm: "", roi: "", ctr: "", clicks: "", thirdParty: "" });

  /* 报价器 */
  const [qCustomer, setQCustomer] = useState("");
  const [qPicks, setQPicks] = useState<{ resourceId: string; pointIdx: number; months: number }[]>([]);

  const suppliers = props.suppliers.filter((s) => !s.deletedAt);
  const resources = props.resources.filter((r) => !r.deletedAt);
  const items = props.items.filter((s) => !s.deletedAt);
  const postbuys = props.postbuys.filter((p) => !p.deletedAt);
  const influencers = props.influencers.filter((i) => !i.deletedAt);
  const nameOf = (id: string) => props.customers.find((c) => c.id === id)?.name ?? "未知客户";
  const resName = (id: string) => resources.find((r) => r.id === id)?.name ?? "未知资源";
  const suName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";

  const cost = items.reduce((s, i) => s + i.cost, 0);
  const sell = items.reduce((s, i) => s + i.sellPrice, 0);
  const rebatePending = items.filter((i) => i.rebate && !i.rebateSettled).reduce((s, i) => s + (i.rebate ?? 0), 0);
  const margin = sell - cost;

  const W0 = new Date("2026-09-01").getTime();
  const W1 = new Date("2026-12-31").getTime();
  const pct = (d: string) => Math.min(100, Math.max(0, ((new Date(d).getTime() - W0) / (W1 - W0)) * 100));

  function openNewResource() { setEditResId(null); setRf(emptyRf); setResOpen(true); }
  function openEditResource(r: MediaResource) {
    setEditResId(r.id);
    setRf({ name: r.name, type: r.type, supplierId: r.supplierId, intro: r.intro ?? "", advantage: r.advantage ?? "", cases: r.cases ?? "" });
    setResOpen(true);
  }
  async function saveResource() {
    if (!rf.name.trim()) { show("资源名称必填"); return; }
    const base = { name: rf.name.trim(), type: rf.type, supplierId: rf.supplierId || (suppliers[0]?.id ?? ""), intro: rf.intro.trim(), advantage: rf.advantage.trim(), cases: rf.cases.trim() };
    if (editResId) {
      const old = resources.find((r) => r.id === editResId);
      await db.put("resources", { ...(old as MediaResource), ...base }, "编辑资源「" + base.name + "」");
    } else {
      await db.put("resources", { id: uid("re"), ...base, places: [] }, "新增媒体资源");
    }
    setResOpen(false); setRf(emptyRf); setEditResId(null);
    show("资源已保存");
    await props.reload();
  }

  async function addRateCard() {
    if (!rcFor || !rc.version.trim()) { show("版本号必填"); return; }
    await db.put("ratecards", { id: uid("rc"), resourceId: rcFor, version: rc.version.trim(), effectiveFrom: rc.effectiveFrom, listPrice: Number(rc.listPrice) || 0 }, "新增刊例价版本");
    setRcFor(null); setRc({ version: "", effectiveFrom: "2026-10-01", listPrice: "" });
    show("刊例版本已登记");
    await props.reload();
  }

  async function addBuy() {
    if (!bf.name.trim() || !bf.resourceId) { show("名称与资源必填"); return; }
    await db.put("scheduleItems", {
      id: uid("sc"), customerId: bf.customerId || (props.customers[0]?.id ?? ""), name: bf.name.trim(), resourceId: bf.resourceId,
      start: bf.start, end: bf.end, cost: Number(bf.cost) || 0, sellPrice: Number(bf.sellPrice) || 0,
      rebate: Number(bf.rebate) || undefined, rebateSettled: false, status: bf.status as ScheduleItem["status"],
    }, "新增排期");
    setBuyOpen(false);
    show("排期已创建");
    await props.reload();
  }

  /* 点位 */
  function openPoint(r: MediaResource, idx: number) {
    const list = r.places ?? [];
    const p = list[idx];
    setPointModal({ resourceId: r.id, point: p, idx });
    setPf(p ?? { name: "", city: "", form: "", size: "", qty: 1, footfall: 0, price: 0, status: "可售" });
  }
  async function savePoint() {
    if (!pointModal) return;
    if (!pf.name.trim()) { show("点位名称必填"); return; }
    const r = resources.find((x) => x.id === pointModal.resourceId);
    if (!r) return;
    const list = [...(r.places ?? [])];
    const np: PricePoint = { ...pf, name: pf.name.trim(), qty: Math.max(1, Number(pf.qty) || 1), footfall: Number(pf.footfall) || 0, price: Number(pf.price) || 0 };
    if (pointModal.point) list[pointModal.idx] = np; else list.push(np);
    await db.put("resources", { ...r, places: list }, "保存点位");
    setPointModal(null); show("点位已保存"); await props.reload();
  }
  async function delPoint(idx: number) {
    if (!pointModal) return;
    const r = resources.find((x) => x.id === pointModal.resourceId);
    if (!r) return;
    const list = [...(r.places ?? [])]; list.splice(idx, 1);
    await db.put("resources", { ...r, places: list }, "删除点位");
    setPointModal(null); await props.reload();
  }

  /* 达人库 CRUD */
  function openNewIf() { setEditIfId(null); setIfForm(emptyIf); setIfOpen(true); }
  function openEditIf(i: Influencer) {
    setEditIfId(i.id);
    setIfForm({ name: i.name, platform: i.platform, followers: String(i.followers), category: i.category, tags: i.tags.join(","), contact: i.contact ?? "", history: i.history ?? "", pricePerPost: i.pricePerPost ? String(i.pricePerPost) : "" });
    setIfOpen(true);
  }
  async function saveIf() {
    if (!ifForm.name.trim()) { show("达人名称必填"); return; }
    const base = {
      name: ifForm.name.trim(), platform: ifForm.platform,
      followers: Number(ifForm.followers) || 0, category: ifForm.category.trim(),
      tags: ifForm.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      contact: ifForm.contact.trim(), history: ifForm.history.trim(),
      pricePerPost: Number(ifForm.pricePerPost) || undefined,
    };
    if (editIfId) {
      const old = influencers.find((x) => x.id === editIfId);
      await db.put("influencers", { ...(old as Influencer), ...base }, "编辑达人「" + base.name + "」");
    } else {
      await db.put("influencers", { id: uid("inf"), ...base }, "新增达人「" + base.name + "」");
    }
    setIfOpen(false); setIfForm(emptyIf); setEditIfId(null);
    show("达人已保存"); await props.reload();
  }
  async function delIf(i: Influencer) {
    await db.softDelete("influencers", i.id, "删除达人「" + i.name + "」");
    show("已移入回收站"); await props.reload();
  }

  /* PostBuy 手动保存 */
  async function savePostBuy() {
    if (!pbForm.resourceId || !pbForm.month) { show("资源和月份必填"); return; }
    await db.put("postbuys", {
      id: uid("pb"), resourceId: pbForm.resourceId, month: pbForm.month,
      actualImpression: Number(pbForm.actualImpression) || 0, cpm: Number(pbForm.cpm) || 0, roi: Number(pbForm.roi) || 0,
      ctr: pbForm.ctr ? Number(pbForm.ctr) : undefined, clicks: pbForm.clicks ? Number(pbForm.clicks) : undefined,
      thirdParty: pbForm.thirdParty.trim() || undefined,
      dataSource: "手动",
    }, "PostBuy 手动录入");
    setPbOpen(false); setPbForm({ resourceId: "", month: "", actualImpression: "", cpm: "", roi: "", ctr: "", clicks: "", thirdParty: "" });
    show("已保存"); await props.reload();
  }

  function exportPostBuyReport() {
    const rows = postbuys.sort((a, b) => b.month.localeCompare(a.month)).map((p) => {
      const r = resources.find((x) => x.id === p.resourceId);
      return `<tr><td>${r?.name ?? "—"}</td><td>${p.month}</td><td style="text-align:right">${p.actualImpression.toLocaleString()}</td><td style="text-align:right">${p.ctr ? p.ctr + "%" : "—"}</td><td style="text-align:right">${p.clicks?.toLocaleString() ?? "—"}</td><td style="text-align:right">${money(p.cpm)}</td><td style="text-align:right">1:${p.roi}</td><td>${p.thirdParty ?? p.dataSource}</td></tr>`;
    }).join("");
    const avgRoi = postbuys.length ? (postbuys.reduce((s, p) => s + p.roi, 0) / postbuys.length).toFixed(2) : "0";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>PostBuy 分析报告</title><style>:root{--brand:#E01844;--border:#E4E6EB;--surface:#F5F6F8}body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;max-width:900px;margin:40px auto}h1{font-size:22px}h1 span{color:var(--brand)}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}th,td{border:1px solid var(--border);padding:8px 10px}th{background:var(--surface)}</style></head><body><h1>PostBuy 分析报告 <span>· ${new Date().toLocaleDateString("zh-CN")}</span></h1><p>共 ${postbuys.length} 条 · 平均 ROI 1:${avgRoi}</p><table><tr><th>资源</th><th>月份</th><th>曝光</th><th>CTR</th><th>点击</th><th>CPM</th><th>ROI</th><th>数据来源</th></tr>${rows}</table></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `PostBuy分析报告_${new Date().toISOString().slice(0, 10)}.html`; a.click();
    URL.revokeObjectURL(a.href);
    show("分析报告已导出");
  }

  /* 报价器 */
  function addQuoteLine() { setQPicks([...qPicks, { resourceId: resources[0]?.id ?? "", pointIdx: -1, months: 1 }]); }
  function updLine(i: number, patch: Partial<typeof qPicks[number]>) {
    const arr = [...qPicks]; arr[i] = { ...arr[i], ...patch }; setQPicks(arr);
  }
  const quoteRows = useMemo(() => qPicks.map((p) => {
    const r = resources.find((x) => x.id === p.resourceId);
    const pt = r?.places?.[p.pointIdx];
    const unitPrice = pt?.price ?? 0;
    const months = Math.max(1, p.months || 1);
    return { resource: r?.name ?? "—", point: pt?.name ?? "—", city: pt?.city ?? "—", months, unitPrice, total: unitPrice * months * (pt?.qty ?? 1) };
  }), [qPicks, resources]);
  const quoteTotal = quoteRows.reduce((s, r) => s + r.total, 0);
  function exportQuoteHtml() {
    const rows = quoteRows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.resource}</td><td>${r.point}(${r.city})</td><td>${r.months}个月</td><td style="text-align:right">${money(r.unitPrice)}/月</td><td style="text-align:right">${money(r.total)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>自助报价单</title><style>:root{--brand:#E01844;--border:#E4E6EB;--surface:#F5F6F8}body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;max-width:760px;margin:40px auto}h1{font-size:22px}h1 span{color:var(--brand)}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}th,td{border:1px solid var(--border);padding:8px 10px}th{background:var(--surface)}.total{margin-top:12px;font-size:16px;font-weight:700}</style></head><body><h1>自助报价单 <span>· ${nameOf(qCustomer)}</span></h1><table><tr><th>#</th><th>媒体资源</th><th>点位</th><th>时长</th><th>单价</th><th>小计</th></tr>${rows}</table><p class="total">合计:${money(quoteTotal)}</p></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `自助报价单_${new Date().toISOString().slice(0, 10)}.html`; a.click();
    URL.revokeObjectURL(a.href); show("报价单已导出");
  }
  function exportScheduleQuote() {
    const rows = items.map((i) => `<tr><td>${i.name}</td><td>${resName(i.resourceId)}</td><td>${i.start} ~ ${i.end}</td><td style="text-align:right">${money(i.sellPrice)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>排期报价单</title><style>:root{--border:#E4E6EB;--surface:#F5F6F8}body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;max-width:760px;margin:40px auto}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}th,td{border:1px solid var(--border);padding:8px 10px}th{background:var(--surface)}.total{margin-top:12px;font-size:16px;font-weight:700}</style></head><body><h1>媒介排期报价单</h1><table><tr><th>项目</th><th>媒体</th><th>窗口</th><th>报价</th></tr>${rows}</table><p class="total">合计:${money(sell)}</p></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `排期报价单_${new Date().toISOString().slice(0, 10)}.html`; a.click();
    URL.revokeObjectURL(a.href); show("已导出CSV到下载目录");
  }
  async function importCsv() {
    const rows = parseCsv(csv);
    let n = 0;
    for (const cols of rows) {
      if (cols.length < 5) continue;
      const [resourceName, month, imp, cpm, roi] = cols;
      const res = resources.find((r) => r.name === resourceName);
      if (!res) continue;
      await db.put("postbuys", { id: uid("pb"), resourceId: res.id, month, actualImpression: Number(imp) || 0, cpm: Number(cpm) || 0, roi: Number(roi) || 0, dataSource: "CSV回填" }, "PostBuy CSV");
      n++;
    }
    setCsv(""); show(`CSV 回填:${n} 条`); await props.reload();
  }
  function exportMediaCsv() {
    const esc = (s: string) => "\"" + (s ?? "").replace(/"/g, "\"\"") + "\"";
    const head = "资源名称,类型,供应商,简介,优势,历史案例,点位名称,城市,形式,规格,数量,月人流,点位月价,点位状态";
    const lines = [head];
    for (const r of resources) {
      const pts = r.places ?? [];
      if (pts.length === 0) {
        lines.push([r.name, r.type, suName(r.supplierId), r.intro ?? "", r.advantage ?? "", r.cases ?? "", "", "", "", "", "", "", "", ""].map(esc).join(","));
      } else {
        for (const p of pts) lines.push([r.name, r.type, suName(r.supplierId), r.intro ?? "", r.advantage ?? "", r.cases ?? "", p.name, p.city, p.form, p.size, String(p.qty), String(p.footfall), String(p.price), p.status].map(esc).join(","));
      }
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `媒介库模板_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(a.href); show("CSV 已导出");
  }
  async function importMediaCsv(text: string) {
    const rows = parseCsv(text.replace(/^\uFEFF/, ""));
    if (rows.length < 2) { show("无数据"); return; }
    let resN = 0, ptN = 0;
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length < 6) continue;
      const [name, type, suName_, intro, advantage, cases, pName, city, form, size, qty, footfall, price, pStatus] = cols;
      if (!name) continue;
      let r = resources.find((x) => x.name === name);
      const sup = suppliers.find((s) => s.name === suName_);
      const base = { name, type: type || "效果广告", supplierId: sup?.id ?? suppliers[0]?.id ?? "", intro, advantage, cases };
      if (!r) {
        r = { id: uid("re"), ...base, places: [] };
        await db.put("resources", r, "CSV导入资源"); resN++;
      } else {
        await db.put("resources", { ...r, ...base }, "CSV更新资源");
      }
      if (pName) {
        const places = [...(r.places ?? [])];
        const existing = places.findIndex((p) => p.name === pName);
        const np: PricePoint = { name: pName, city, form, size, qty: Number(qty) || 1, footfall: Number(footfall) || 0, price: Number(price) || 0, status: (pStatus as PricePoint["status"]) || "可售" };
        if (existing >= 0) places[existing] = np; else places.push(np);
        await db.put("resources", { ...r, places }, "CSV导入点位"); ptN++;
      }
    }
    show(`导入完成:资源 ${resN},点位 ${ptN}`); await props.reload();
  }
  function onMediaCsvFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]; if (!f) return;
    const fr = new FileReader(); fr.onload = () => void importMediaCsv(String(fr.result ?? ""));
    fr.readAsText(f, "utf-8");
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>媒介资源</h1><div className="date">资源档案 / 达人库 / 自助报价 / PostBuy</div></div>
        <div className="actions">
          <Btn kind="ghost" onClick={exportScheduleQuote}>导出排期报价单</Btn>
          <Btn kind="primary" onClick={() => setBuyOpen(true)}><IconPlus size={14} /> 新建排期</Btn>
        </div>
      </div>

      <div className="tabs">
        {(["排期", "资源与刊例", "达人库", "报价器", "投后 PostBuy"] as const).map((t) => (
          <span key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>

      {tab === "排期" && (
        <>
          <div className="alert-strip" style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="card card-pad">
              <div className="h-row" style={{ marginBottom: 4 }}><span className="h-title sm">采购与报价双口径</span><Chip kind="danger" style={{ marginLeft: "auto" }}>仅内部</Chip></div>
              <div className="alert-line"><span className="txt">媒体成本</span><span className="amt num">{money(cost)}</span></div>
              <div className="alert-line"><span className="txt">报价给客户</span><span className="amt num">{money(sell)}</span></div>
              <div className="alert-line"><span className="txt">预估毛利</span><span className="amt num" style={{ color: "var(--success)" }}>{money(margin)}({sell ? Math.round((margin / sell) * 100) : 0}%)</span></div>
              <div className="alert-line"><span className="txt">返点后返(未核销)</span><span className="amt num" style={{ color: "var(--warning)" }}>{money(rebatePending)}</span></div>
            </div>
          </div>
          <div className="card" style={{ overflow: "hidden", padding: "16px 18px" }}>
            <div className="month-lbls" style={{ display: "grid", gridTemplateColumns: `180px repeat(4,1fr)`, marginBottom: 4 }}>
              <span /><span>9 月</span><span>10 月</span><span>11 月</span><span>12 月</span>
            </div>
            {items.map((i, idx) => {
              const prevSameRes = idx > 0 && items[idx - 1].resourceId === i.resourceId;
              return (
              <div key={i.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", borderTop: "1px solid var(--border-soft)", minHeight: 44 }}>
                <div style={{ padding: "8px 12px", fontWeight: 600, fontSize: "var(--text-sm)" }}>{i.name}{prevSameRes ? null : <div className="cell-sub">{resName(i.resourceId)}</div>}</div>
                <div style={{ position: "relative", height: 44 }}>
                  {[0, 1, 2, 3].map((k) => <div key={k} style={{ position: "absolute", top: 0, bottom: 0, left: `${k * 25}%`, borderLeft: "1px dashed var(--border-soft)" }} />)}
                  <div style={{
                    position: "absolute", top: 11, height: 20, borderRadius: 6, padding: "0 10px",
                    left: pct(i.start) + "%", width: Math.max(4, pct(i.end) - pct(i.start)) + "%",
                    background: i.status === "已确认" ? "var(--data)" : "var(--surface-2)",
                    color: i.status === "已确认" ? "var(--bg)" : "var(--ink-3)",
                    display: "flex", alignItems: "center", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden",
                  }}>{money(i.cost)}</div>
                </div>
              </div>
            );})}
            {items.length === 0 ? <p className="muted" style={{ padding: 16 }}>暂无排期</p> : null}
          </div>
        </>
      )}

      {tab === "资源与刊例" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="toolbar-row" style={{ padding: "12px 14px" }}>
            <span className="h-title sm">媒体资源库({resources.length})</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Btn kind="ghost" sm onClick={exportMediaCsv}>导出CSV</Btn>
              <label className="btn ghost sm" style={{ margin: 0 }}>导入CSV<input type="file" accept=".csv" style={{ display: "none" }} onChange={onMediaCsvFile} /></label>
              <Btn kind="primary" sm onClick={openNewResource}><IconPlus size={12} /> 新增</Btn>
            </div>
          </div>
          {resources.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>暂无媒介资源</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginBottom: 16 }}>添加媒介资源，管理你的广告位库存</div>
              <Btn kind="primary" onClick={openNewResource}><IconPlus size={14} /> 新增资源</Btn>
            </div>
          ) : (
          <table className="tgrid">
            <thead><tr><th>资源</th><th>供应商</th><th>档案</th><th>点位</th><th>刊例价</th><th>操作</th></tr></thead>
            <tbody>
              {resources.map((r) => {
                const cards = props.ratecards.filter((x) => x.resourceId === r.id && !x.deletedAt).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
                const pts = r.places ?? [];
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}<div className="cell-sub">{r.type}</div></td>
                    <td>{suName(r.supplierId)}</td>
                    <td style={{ maxWidth: 220 }}>
                      {r.intro ? <div className="cell-sub">{r.intro}</div> : null}
                      {r.advantage ? <div className="cell-sub" style={{ color: "var(--success)" }}>优:{r.advantage}</div> : null}
                      {r.cases ? <div className="cell-sub" style={{ color: "var(--ink-3)" }}>案例:{r.cases}</div> : null}
                    </td>
                    <td>
                      {pts.map((p, i) => (
                        <div key={i} className="cell-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className={"chip " + (p.status === "可售" ? "data" : "warn")} style={{ fontSize: 10, padding: "0 5px" }}>{p.status}</span>
                          {p.name}({p.city}) {money(p.price)}
                          <a href="#" onClick={(e) => { e.preventDefault(); openPoint(r, i); }}>改</a>
                        </div>
                      ))}
                      <a href="#" style={{ fontSize: 11, color: "var(--brand)" }} onClick={(e) => { e.preventDefault(); openPoint(r, -1); }}>+ 点位</a>
                    </td>
                    <td>{cards.map((c) => <div key={c.id} className="cell-sub num">{c.version} {money(c.listPrice)}</div>)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Btn kind="data" sm onClick={() => openEditResource(r)}>编辑</Btn>
                      <Btn kind="ghost" sm onClick={() => { setRcFor(r.id); setRc({ version: "2026-Q4", effectiveFrom: "2026-10-01", listPrice: String(cards[0]?.listPrice ?? "") }); }}>刊例</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      )}

      {tab === "达人库" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="toolbar-row" style={{ padding: "12px 14px" }}>
            <span className="h-title sm">达人库({influencers.length})</span>
            <Btn kind="primary" sm style={{ marginLeft: "auto" }} onClick={openNewIf}><IconPlus size={12} /> 新增达人</Btn>
          </div>
          <table className="tgrid">
            <thead><tr><th>达人</th><th>平台</th><th>粉丝(万)</th><th>垂类</th><th>画像标签</th><th>单条报价</th><th>历史合作</th><th>操作</th></tr></thead>
            <tbody>
              {influencers.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.name}<div className="cell-sub">{i.contact ?? ""}</div></td>
                  <td><Chip kind="data">{i.platform}</Chip></td>
                  <td className="num">{i.followers}</td>
                  <td>{i.category}</td>
                  <td>{i.tags.map((t) => <Chip key={t} gray style={{ fontSize: 10, marginRight: 2 }}>#{t}</Chip>)}</td>
                  <td className="num">{i.pricePerPost ? money(i.pricePerPost) : "—"}</td>
                  <td style={{ maxWidth: 180 }}><div className="cell-sub">{i.history ?? "—"}</div></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Btn kind="data" sm onClick={() => openEditIf(i)}>编辑</Btn>
                    <Btn kind="ghost" sm onClick={() => { void delIf(i); }}>删</Btn>
                  </td>
                </tr>
              ))}
              {influencers.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>暂无达人 — 点"新增达人"录入</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {tab === "报价器" && (
        <div className="card card-pad">
          <div className="h-row" style={{ marginBottom: 12 }}>
            <span className="h-title sm">自助报价器 · 选点位 × 时长自动算价</span>
            <Btn kind="primary" sm style={{ marginLeft: "auto" }} onClick={addQuoteLine}><IconPlus size={12} /> 添加一行</Btn>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Field label="客户"><select className="sel" style={{ maxWidth: 280 }} value={qCustomer} onChange={(e) => setQCustomer(e.target.value)}>
              <option value="">不指定</option>
              {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></Field>
          </div>
          <table className="tgrid">
            <thead><tr><th>媒体资源</th><th>点位</th><th>月数</th><th>单价/月</th><th>小计</th><th></th></tr></thead>
            <tbody>
              {quoteRows.map((r, i) => {
                const res = resources.find((x) => x.id === qPicks[i].resourceId);
                return (
                  <tr key={i}>
                    <td><select className="sel" style={{ width: 200 }} value={qPicks[i].resourceId} onChange={(e) => { const rid = e.target.value; const pts = resources.find((x) => x.id === rid)?.places ?? []; updLine(i, { resourceId: rid, pointIdx: pts.length ? 0 : -1 }); }}>
                      {resources.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select></td>
                    <td><select className="sel" style={{ width: 200 }} value={qPicks[i].pointIdx} onChange={(e) => updLine(i, { pointIdx: Number(e.target.value) })}>
                      <option value={-1}>选择点位…</option>
                      {(res?.places ?? []).map((p, pi) => <option key={pi} value={pi}>{p.name}({p.city}) {money(p.price)}</option>)}
                    </select></td>
                    <td><input className="inp num" type="number" min={1} style={{ width: 80 }} value={qPicks[i].months} onChange={(e) => updLine(i, { months: Number(e.target.value) })} /></td>
                    <td className="num">{money(r.unitPrice)}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{money(r.total)}</td>
                    <td><Btn kind="ghost" sm onClick={() => setQPicks(qPicks.filter((_, j) => j !== i))}>删</Btn></td>
                  </tr>
                );
              })}
              {qPicks.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-3)", padding: 20 }}>点"添加一行"开始</td></tr> : null}
            </tbody>
          </table>
          {qPicks.length > 0 ? (
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>合计:{money(quoteTotal)}</span>
              <Btn kind="primary" onClick={exportQuoteHtml}>导出报价单</Btn>
            </div>
          ) : null}
        </div>
      )}

      {tab === "投后 PostBuy" && (
        <>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="h-row">
              <span className="h-title sm">PostBuy 数据</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <Btn kind="ghost" sm onClick={exportPostBuyReport}>导出分析报告</Btn>
                <Btn kind="primary" sm onClick={() => setPbOpen(true)}>手动录入</Btn>
              </div>
            </div>
            <textarea className="inp" rows={2} style={{ width: "100%", fontFamily: "var(--mono)", fontSize: "var(--text-xs)", marginTop: 8 }}
              value={csv} onChange={(e) => setCsv(e.target.value)}
              placeholder="CSV批量回填:资源名,月份,曝光,CPM,ROI" />
            <div style={{ marginTop: 6 }}><Btn kind="data" sm disabled={!csv.trim()} onClick={() => { void importCsv(); }}>解析CSV</Btn></div>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tgrid">
              <thead><tr><th>资源</th><th>月份</th><th>曝光</th><th>CTR</th><th>点击</th><th>CPM</th><th>ROI</th><th>来源</th></tr></thead>
              <tbody>
                {postbuys.sort((a, b) => b.month.localeCompare(a.month)).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{resName(p.resourceId)}</td>
                    <td className="num">{p.month}</td>
                    <td className="num">{p.actualImpression.toLocaleString()}</td>
                    <td className="num">{p.ctr ? p.ctr + "%" : "—"}</td>
                    <td className="num">{p.clicks ? p.clicks.toLocaleString() : "—"}</td>
                    <td className="num">{money(p.cpm)}</td>
                    <td className="num" style={{ color: p.roi >= 2.5 ? "var(--success)" : "var(--danger)" }}>1:{p.roi}</td>
                    <td><Chip kind={p.dataSource === "CSV回填" ? "data" : "gray"}>{p.thirdParty ?? p.dataSource}</Chip></td>
                  </tr>
                ))}
                {postbuys.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ink-3)", padding: 20 }}>暂无投后数据</td></tr> : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      {resOpen ? (
        <Modal title={editResId ? "编辑资源" : "新增资源"} onClose={() => setResOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setResOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void saveResource(); }}>保存</Btn></div>
        }>
          <Field label="资源名称"><input className="inp" style={{ width: "100%" }} value={rf.name} onChange={(e) => setRf({ ...rf, name: e.target.value })} /></Field>
          <div className="field-row">
            <Field label="类型"><select className="sel" style={{ width: "100%" }} value={rf.type} onChange={(e) => setRf({ ...rf, type: e.target.value })}>
              {["效果广告", "内容种草", "品牌曝光", "线下", "达人"].map((x) => <option key={x}>{x}</option>)}
            </select></Field>
            <Field label="供应商"><select className="sel" style={{ width: "100%" }} value={rf.supplierId} onChange={(e) => setRf({ ...rf, supplierId: e.target.value })}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></Field>
          </div>
          <Field label="媒体介绍"><textarea className="inp" rows={2} style={{ width: "100%" }} value={rf.intro} onChange={(e) => setRf({ ...rf, intro: e.target.value })} /></Field>
          <Field label="核心优势"><input className="inp" style={{ width: "100%" }} value={rf.advantage} onChange={(e) => setRf({ ...rf, advantage: e.target.value })} /></Field>
          <Field label="历史合作品牌"><input className="inp" style={{ width: "100%" }} value={rf.cases} onChange={(e) => setRf({ ...rf, cases: e.target.value })} /></Field>
        </Modal>
      ) : null}

      {rcFor ? (
        <Modal title={`刊例价版本 · ${resName(rcFor)}`} onClose={() => setRcFor(null)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setRcFor(null)}>取消</Btn><Btn kind="primary" onClick={() => { void addRateCard(); }}>保存</Btn></div>
        }>
          <div className="field-row">
            <Field label="版本"><input className="inp" style={{ width: "100%" }} value={rc.version} onChange={(e) => setRc({ ...rc, version: e.target.value })} /></Field>
            <Field label="生效日"><input className="inp num" type="date" style={{ width: "100%" }} value={rc.effectiveFrom} onChange={(e) => setRc({ ...rc, effectiveFrom: e.target.value })} /></Field>
          </div>
          <Field label="刊例价"><input className="inp num" style={{ width: "100%" }} value={rc.listPrice} onChange={(e) => setRc({ ...rc, listPrice: e.target.value })} /></Field>
        </Modal>
      ) : null}

      {buyOpen ? (
        <Modal title="新建排期" onClose={() => setBuyOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setBuyOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void addBuy(); }}>保存</Btn></div>
        }>
          <Field label="名称"><input className="inp" style={{ width: "100%" }} value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} /></Field>
          <div className="field-row">
            <Field label="客户"><select className="sel" style={{ width: "100%" }} value={bf.customerId} onChange={(e) => setBf({ ...bf, customerId: e.target.value })}>
              {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></Field>
            <Field label="资源"><select className="sel" style={{ width: "100%" }} value={bf.resourceId} onChange={(e) => setBf({ ...bf, resourceId: e.target.value })}>
              <option value="">选择…</option>{resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select></Field>
          </div>
          <div className="field-row">
            <Field label="开始"><input className="inp num" type="date" style={{ width: "100%" }} value={bf.start} onChange={(e) => setBf({ ...bf, start: e.target.value })} /></Field>
            <Field label="结束"><input className="inp num" type="date" style={{ width: "100%" }} value={bf.end} onChange={(e) => setBf({ ...bf, end: e.target.value })} /></Field>
          </div>
          <div className="field-row">
            <Field label="媒体成本"><input className="inp num" style={{ width: "100%" }} value={bf.cost} onChange={(e) => setBf({ ...bf, cost: e.target.value })} /></Field>
            <Field label="报价"><input className="inp num" style={{ width: "100%" }} value={bf.sellPrice} onChange={(e) => setBf({ ...bf, sellPrice: e.target.value })} /></Field>
          </div>
          <div className="field-row">
            <Field label="返点"><input className="inp num" style={{ width: "100%" }} value={bf.rebate} onChange={(e) => setBf({ ...bf, rebate: e.target.value })} /></Field>
            <Field label="状态"><select className="sel" style={{ width: "100%" }} value={bf.status} onChange={(e) => setBf({ ...bf, status: e.target.value })}>
              {["待确认", "已确认"].map((s) => <option key={s}>{s}</option>)}
            </select></Field>
          </div>
        </Modal>
      ) : null}

      {ifOpen ? (
        <Modal title={editIfId ? "编辑达人" : "新增达人"} onClose={() => setIfOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setIfOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void saveIf(); }}>保存</Btn></div>
        }>
          <div className="field-row">
            <Field label="达人名称"><input className="inp" style={{ width: "100%" }} value={ifForm.name} onChange={(e) => setIfForm({ ...ifForm, name: e.target.value })} /></Field>
            <Field label="平台"><select className="sel" style={{ width: "100%" }} value={ifForm.platform} onChange={(e) => setIfForm({ ...ifForm, platform: e.target.value as typeof ifForm.platform })}>
              {["抖音", "小红书", "B站", "微博", "快手"].map((x) => <option key={x}>{x}</option>)}
            </select></Field>
          </div>
          <div className="field-row">
            <Field label="粉丝(万)"><input className="inp num" style={{ width: "100%" }} value={ifForm.followers} onChange={(e) => setIfForm({ ...ifForm, followers: e.target.value })} /></Field>
            <Field label="垂类"><input className="inp" style={{ width: "100%" }} value={ifForm.category} onChange={(e) => setIfForm({ ...ifForm, category: e.target.value })} placeholder="如:美妆/穿搭/母婴" /></Field>
          </div>
          <Field label="画像标签(逗号分隔)"><input className="inp" style={{ width: "100%" }} value={ifForm.tags} onChange={(e) => setIfForm({ ...ifForm, tags: e.target.value })} placeholder="如:年轻女性,二线城市,高消费" /></Field>
          <div className="field-row">
            <Field label="联系方式"><input className="inp" style={{ width: "100%" }} value={ifForm.contact} onChange={(e) => setIfForm({ ...ifForm, contact: e.target.value })} /></Field>
            <Field label="单条报价(元)"><input className="inp num" style={{ width: "100%" }} value={ifForm.pricePerPost} onChange={(e) => setIfForm({ ...ifForm, pricePerPost: e.target.value })} /></Field>
          </div>
          <Field label="历史合作品牌"><input className="inp" style={{ width: "100%" }} value={ifForm.history} onChange={(e) => setIfForm({ ...ifForm, history: e.target.value })} /></Field>
        </Modal>
      ) : null}

      {pbOpen ? (
        <Modal title="PostBuy 手动录入" onClose={() => setPbOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setPbOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void savePostBuy(); }}>保存</Btn></div>
        }>
          <div className="field-row">
            <Field label="资源"><select className="sel" style={{ width: "100%" }} value={pbForm.resourceId} onChange={(e) => setPbForm({ ...pbForm, resourceId: e.target.value })}>
              <option value="">选择…</option>{resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select></Field>
            <Field label="月份"><input className="inp" style={{ width: "100%" }} value={pbForm.month} onChange={(e) => setPbForm({ ...pbForm, month: e.target.value })} placeholder="2026-09" /></Field>
          </div>
          <div className="field-row">
            <Field label="实际曝光"><input className="inp num" style={{ width: "100%" }} value={pbForm.actualImpression} onChange={(e) => setPbForm({ ...pbForm, actualImpression: e.target.value })} /></Field>
            <Field label="CPM(元)"><input className="inp num" style={{ width: "100%" }} value={pbForm.cpm} onChange={(e) => setPbForm({ ...pbForm, cpm: e.target.value })} /></Field>
          </div>
          <div className="field-row">
            <Field label="ROI(1:x)"><input className="inp num" style={{ width: "100%" }} value={pbForm.roi} onChange={(e) => setPbForm({ ...pbForm, roi: e.target.value })} placeholder="如 3.5" /></Field>
            <Field label="CTR(%)"><input className="inp num" style={{ width: "100%" }} value={pbForm.ctr} onChange={(e) => setPbForm({ ...pbForm, ctr: e.target.value })} placeholder="如 2.8" /></Field>
          </div>
          <div className="field-row">
            <Field label="点击数"><input className="inp num" style={{ width: "100%" }} value={pbForm.clicks} onChange={(e) => setPbForm({ ...pbForm, clicks: e.target.value })} /></Field>
            <Field label="第三方监测"><input className="inp" style={{ width: "100%" }} value={pbForm.thirdParty} onChange={(e) => setPbForm({ ...pbForm, thirdParty: e.target.value })} placeholder="如:秒针/AdMaster/CTR报告" /></Field>
          </div>
        </Modal>
      ) : null}

      {pointModal ? (
        <Modal title={pointModal.point ? "编辑点位" : "新增点位"} onClose={() => setPointModal(null)} footer={
          <div className="grow" style={{ display: "flex", gap: 8 }}>
            {pointModal.point ? <Btn kind="danger" onClick={() => { void delPoint(pointModal.idx); }}>删除</Btn> : <span />}
            <Btn kind="ghost" onClick={() => setPointModal(null)}>取消</Btn>
            <Btn kind="primary" onClick={() => { void savePoint(); }}>保存</Btn>
          </div>
        }>
          <Field label="点位名称"><input className="inp" style={{ width: "100%" }} value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} /></Field>
          <div className="field-row">
            <Field label="城市"><input className="inp" style={{ width: "100%" }} value={pf.city} onChange={(e) => setPf({ ...pf, city: e.target.value })} /></Field>
            <Field label="形式"><input className="inp" style={{ width: "100%" }} value={pf.form} onChange={(e) => setPf({ ...pf, form: e.target.value })} /></Field>
          </div>
          <div className="field-row">
            <Field label="规格"><input className="inp" style={{ width: "100%" }} value={pf.size} onChange={(e) => setPf({ ...pf, size: e.target.value })} /></Field>
            <Field label="数量"><input className="inp num" type="number" min={1} style={{ width: "100%" }} value={pf.qty} onChange={(e) => setPf({ ...pf, qty: Number(e.target.value) })} /></Field>
          </div>
          <div className="field-row">
            <Field label="月人流/曝光"><input className="inp num" style={{ width: "100%" }} value={pf.footfall} onChange={(e) => setPf({ ...pf, footfall: Number(e.target.value) })} /></Field>
            <Field label="月单价"><input className="inp num" style={{ width: "100%" }} value={pf.price} onChange={(e) => setPf({ ...pf, price: Number(e.target.value) })} /></Field>
          </div>
          <Field label="状态"><select className="sel" style={{ width: "100%" }} value={pf.status} onChange={(e) => setPf({ ...pf, status: e.target.value as PricePoint["status"] })}>
            {(["可售", "占用", "锁位"] as const).map((s) => <option key={s}>{s}</option>)}
          </select></Field>
        </Modal>
      ) : null}
      {node}
    </div>
  );
}

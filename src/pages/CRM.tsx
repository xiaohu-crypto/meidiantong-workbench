import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { db } from "../db/db";
import { repos } from "../core/data/repository";
import { funnel } from "../core/metrics";
import { healthOf, latestTouch, customerStage, type CustomerStage } from "../core/derive";
import { validateCustomer } from "../core/validators";
import type { Contact, ContactPoint, Contract, Customer, Deal, Payment, Rel, RelRole, Task } from "../types";
import { Btn, Chip, money, Modal, Field, useToast } from "../ui/common";
import { IconClose, IconPlus, IconSearch, IconUsers } from "../components/icons";
import ImportCustomers from "../components/ImportCustomers";
import { RecordPage, type WidgetDef, type RecordLayout } from "../ui/RecordPage";
import { FieldsWidget } from "../ui/widgets/FieldsWidget";
import { RelatedListWidget } from "../ui/widgets/RelatedListWidget";
import { getAllScripts, addScript, updateScript, deleteScript, type SopScript } from "../core/sop";
import { TimelineWidget } from "../ui/widgets/TimelineWidget";
import { askCustomer, type AskContext } from "../core/ai/ask";

interface Props {
  customers: Customer[]; contacts: Contact[]; rels: Rel[]; deals: Deal[];
  contracts: Contract[]; payments: Payment[]; cps: ContactPoint[]; tasks: Task[];
  reload: () => Promise<void>;
  focusCustomerId?: string | null;
  customFields: { id: string; entity: string; key: string; label: string; type: string; options?: string[] }[];
}

interface SavedView { name: string; q: string; industry: string; sortKey: "name" | "health" | "deal" }

type Density = "精简" | "紧凑" | "舒适";
const DEFAULT_COLS: Record<string, boolean> = { name: true, industry: true, grade: true, health: true, stage: true, deal: true, touch: true };
const COL_LIST: { key: string; label: string }[] = [
  { key: "name", label: "客户名称" },
  { key: "industry", label: "行业" },
  { key: "grade", label: "等级" },
  { key: "health", label: "健康度" },
  { key: "stage", label: "客户阶段" },
  { key: "deal", label: "在途商机" },
  { key: "touch", label: "最近跟进" },
];

/** P1 客户详情默认布局(P4 再做拖拽编辑,数据结构预留) */
const DEFAULT_CUSTOMER_LAYOUT: RecordLayout = {
  entity: "customer",
  tabs: [
    { id: "概览", title: "概览", widgets: [
      { id: "base", type: "fields", title: "客户基本信息", span: 2 },
      { id: "contacts", type: "related", title: "决策链联系人", span: 2 },
      { id: "deals", type: "related", title: "在途商机" },
      { id: "contracts", type: "related", title: "合同与回款" },
    ]},
    { id: "跟进", title: "跟进", widgets: [
      { id: "timeline", type: "timeline", title: "跟进时间线", span: 2 },
      { id: "tasks", type: "related", title: "关联任务" },
    ]},
    { id: "决策链", title: "决策链", widgets: [] },
    { id: "媒介策略", title: "媒介策略", widgets: [] },
    { id: "AI建议", title: "AI建议", widgets: [] },
    { id: "SOP话术", title: "SOP话术", widgets: [] },
  ],
};

function MediaStrategyView(props: { customer: Customer; onEdit: () => void }) {
  const s = ((props.customer.custom ?? {}) as Record<string, Record<string, string>>).mediaStrategy;
  const empty = !s || (!s.audience && !s.budget && !s.mix && !s.resources && !s.note);
  return (
    <div style={{ padding: "12px 18px" }}>
      <div className="h-row" style={{ marginBottom: 8 }}>
        <span className="h-title sm" style={{ fontSize: 13 }}>客户专属媒介策略(每客户独立,不共用)</span>
        <Btn kind="primary" sm style={{ marginLeft: "auto" }} onClick={props.onEdit}>{empty ? "填写策略" : "编辑"}</Btn>
      </div>
      {empty ? (
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>该客户尚未配置专属媒介策略。点"填写策略"记录目标受众、预算、建议配比、首选资源。</p>
      ) : (
        <div className="kv-grid" style={{ gap: 10 }}>
          {s?.audience ? <div className="kv"><span className="k">目标受众</span><span className="v" style={{ fontSize: "var(--text-sm)" }}>{s.audience}</span></div> : null}
          {s?.budget ? <div className="kv"><span className="k">预算区间</span><span className="v" style={{ fontSize: "var(--text-sm)" }}>{s.budget}</span></div> : null}
          {s?.mix ? <div className="kv"><span className="k">建议配比</span><span className="v" style={{ fontSize: "var(--text-sm)" }}>{s.mix}</span></div> : null}
          {s?.resources ? <div className="kv"><span className="k">首选资源</span><span className="v" style={{ fontSize: "var(--text-sm)" }}>{s.resources}</span></div> : null}
          {s?.note ? <div className="kv"><span className="k">备注</span><span className="v" style={{ fontSize: "var(--text-sm)" }}>{s.note}</span></div> : null}
        </div>
      )}
    </div>
  );
}

export default function CRM(props: Props) {
  const { show, node } = useToast();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "health" | "deal">("name");
  const [stageFilter, setStageFilter] = useState<"" | CustomerStage>("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const [openId, setOpenId] = useState<string | null>(props.focusCustomerId ?? null);
  const [timeline, setTimeline] = useState<{ ts: number; kind: string; title: string }[]>([]);
  useEffect(() => {
    void (async () => {
      if (!openId) { setTimeline([]); return; }
      const items: { ts: number; kind: string; title: string }[] = [];
      const deals = (await db.getAll<Deal>("deals")).filter((d) => d.customerId === openId && !d.deletedAt);
      const dealIds = new Set(deals.map((d) => d.id));
      for (const cp of (await db.getAll<ContactPoint>("contactPoints"))) {
        if (!cp.deletedAt && cp.customerId === openId) items.push({ ts: cp.time, kind: "接触", title: cp.channel + " · " + cp.summary });
      }
      for (const t of (await db.getAll<Task>("tasks"))) {
        if (!t.deletedAt && t.customerId === openId) items.push({ ts: t.due ? new Date(t.due).getTime() : t.kanbanCol === "完成" ? Date.now() : Date.now(), kind: "任务", title: "[" + t.kanbanCol + "] " + t.title });
      }
      for (const lg of (await db.getAll<{ id: string; ts: number; what: string; entityType: string; entityId: string }>("operationLogs"))) {
        if (lg.entityType === "deals" && dealIds.has(lg.entityId)) items.push({ ts: lg.ts, kind: "商机", title: lg.what });
        else if (lg.entityType === "payments") {
          const pay = (await db.get<Payment>("payments", lg.entityId));
          if (pay && pay.customerId === openId) items.push({ ts: lg.ts, kind: "回款", title: lg.what });
        }
      }
      items.sort((a, b) => b.ts - a.ts);
      setTimeline(items.slice(0, 80));
    })();
  }, [openId]);
  const [tab, setTab] = useState<"概览" | "跟进" | "决策链" | "媒介策略" | "AI建议" | "SOP话术">("概览");
  /* P1 记录布局:默认硬编码,从 settings.recordLayouts 合并(P4 再做拖拽) */
  const [customerLayout, setCustomerLayout] = useState<RecordLayout>(DEFAULT_CUSTOMER_LAYOUT);
  /* P4 布局编辑模式 */
  const [editingLayout, setEditingLayout] = useState(false);
  useEffect(() => {
    void (async () => {
      const saved = await db.getSetting<Record<string, RecordLayout>>("recordLayouts", {});
      const cust = saved["customer"];
      if (cust && Array.isArray(cust.tabs) && cust.tabs.length > 0) {
        setCustomerLayout({ ...DEFAULT_CUSTOMER_LAYOUT, ...cust, tabs: cust.tabs });
      }
    })();
  }, []);
  /* 客户级媒介策略(存于 customer.custom.mediaStrategy) */
  const [strategyEdit, setStrategyEdit] = useState(false);
  const [strategyDraft, setStrategyDraft] = useState<{ audience: string; budget: string; mix: string; resources: string; note: string; attachments: { name: string; path: string }[] }>({ audience: "", budget: "", mix: "", resources: "", note: "", attachments: [] });
  const [cpOpen, setCpOpen] = useState(false);
  const [cpForm, setCpForm] = useState<{ channel: ContactPoint["channel"]; summary: string }>({ channel: "微信", summary: "" });

  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", title: "", role: "影响者" as RelRole, wechat: "" });
  async function saveContact() {
    if (!drawerC) return;
    if (!contactForm.name.trim()) { show("联系人姓名必填"); return; }
    const contact = await repos.contacts.create({ name: contactForm.name.trim(), phone: contactForm.phone || undefined, wechat: contactForm.wechat || undefined, title: contactForm.title || undefined, orgCustomerId: drawerC.id, employmentStatus: "在职" }, "添加联系人");
    await repos.rels.create({ contactId: contact.id, customerId: drawerC.id, role: contactForm.role }, "关联联系人");
    show("联系人已添加");
    setContactOpen(false); setContactForm({ name: "", phone: "", title: "", role: "影响者", wechat: "" });
    await props.reload();
  }
  async function refreshSop() { setSopScripts(await getAllScripts()); }
  function openSopNew() { setSopForm({ id: "", scene: "", text: "" }); setSopOpen(true); }
  function openSopEdit(sc: SopScript) { setSopForm({ id: sc.id, scene: sc.scene, text: sc.text }); setSopOpen(true); }
  async function saveSop() {
    if (!sopForm.scene.trim()) { show("场景名称必填"); return; }
    if (!sopForm.text.trim()) { show("话术内容必填"); return; }
    if (sopForm.id) { await updateScript(sopForm.id, sopForm.scene.trim(), sopForm.text.trim()); show("话术已更新"); }
    else { await addScript(sopForm.scene.trim(), sopForm.text.trim()); show("话术已添加"); }
    setSopOpen(false); await refreshSop();
  }
  async function removeSop(id: string) { await deleteScript(id); show("话术已删除"); await refreshSop(); }
  function copySop(text: string) { navigator.clipboard?.writeText(text).then(() => show("已复制到剪贴板")).catch(() => show("复制失败,请手动复制")); }

  function openStrategyEdit() {
    if (!drawerC) return;
    const s = ((drawerC.custom ?? {}) as Record<string, Record<string, string>>).mediaStrategy ?? {};
    setStrategyDraft({ audience: s.audience ?? "", budget: s.budget ?? "", mix: s.mix ?? "", resources: s.resources ?? "", note: s.note ?? "", attachments: ((s.attachments as unknown) as { name: string; path: string }[]) ?? [] });
    setStrategyEdit(true);
  }
  async function saveStrategy() {
    if (!drawerC) return;
    await repos.customers.update(drawerC.id, { custom: { ...(drawerC.custom ?? {}), mediaStrategy: strategyDraft } }, "保存客户「" + drawerC.name + "」媒介策略");
    setStrategyEdit(false);
    show("客户媒介策略已保存");
    await props.reload();
  }
  /* 快速记录接触点(ContactPoint):写库后随 360° 时间线/健康度/通知同步刷新 */
  async function saveContactPoint() {
    if (!drawerC) return;
    if (!cpForm.summary.trim()) { show("跟进内容必填"); return; }
    await repos.cps.create({ customerId: drawerC.id, channel: cpForm.channel, time: Date.now(), summary: cpForm.summary.trim() }, "记录跟进「" + drawerC.name + "」");
    show("跟进已记录");
    setCpOpen(false); setCpForm({ channel: "微信", summary: "" });
    await props.reload();
  }
  const [aiBusy, setAiBusy] = useState(false);
  const [sopScripts, setSopScripts] = useState<SopScript[]>([]);
  const [sopOpen, setSopOpen] = useState(false);
  const [sopForm, setSopForm] = useState({ id: "", scene: "", text: "" });
  /* P3 本地问数:输入框 + 最近 3 条问答历史(纯本地,不调云端) */
  const [askInput, setAskInput] = useState("");
  interface AiMsg { role: "user" | "assistant"; content: string; ts: number; }
  interface AiConv { id: string; title: string; createdAt: number; messages: AiMsg[]; }
  const [aiConvs, setAiConvs] = useState<AiConv[]>([]);
  const [curConvId, setCurConvId] = useState<string | null>(null);
  const [renamingConv, setRenamingConv] = useState<string | null>(null);
  useEffect(() => { setAskInput(""); }, [openId]);
  useEffect(() => { void (async () => { setSopScripts(await getAllScripts()); })(); }, []);

  async function genAdvice() {
    if (!drawerC) return;
    setAiBusy(true);
    try {
      const { aiChat } = await import("../core/ai/client");
      const recentCps = props.cps.filter((cp) => cp.customerId === drawerC.id && !cp.deletedAt).slice(-5);
      const custDeals = props.deals.filter((d) => d.customerId === drawerC.id && !d.deletedAt);
      const ctx = "客户:" + drawerC.name + "\n行业:" + drawerC.industry + "\n等级:" + drawerC.grade +
        "\n最近接触:" + recentCps.map((cp) => new Date(cp.time).toLocaleDateString() + " " + cp.channel + " " + cp.summary).join("; ") +
        "\n在途商机:" + custDeals.map((d) => d.title + "(" + d.stage + ")").join("; ");
      const sys = "你是资深媒体广告销售教练。基于客户信息给出跟进建议,严格按以下格式输出:\n" +
        "【总结】一句话概括客户现状和跟进重点\n" +
        "【关键决策】1. ... 2. ...(需要客户方决策的事项,最多3条)\n" +
        "【待办】1. ... 2. ...(我方需要执行的动作,最多3条)\n" +
        "【风险】1. ... 2. ...(潜在风险,最多2条;无风险写\"无明显风险\")";
      const r = await aiChat([
        { role: "system", content: sys },
        { role: "user", content: ctx },
      ]);
      const text = r.ok ? (r.content ?? "") : "调用失败:" + (r.error ?? "");
      appendMsg("user", "生成跟进建议");
      appendMsg("assistant", text);
    } finally { setAiBusy(false); }
  }

  /* P3 本地问数:纯规则匹配,即时响应 */
  function runAsk() {
    if (!drawerC || !askInput.trim()) return;
    const askCtx: AskContext = {
      customer: drawerC,
      deals: drawerDeals,
      contracts: drawerContracts,
      payments: drawerPays,
      cps: drawerCps,
      tasks: drawerTasks,
      rels: drawerRels,
    };
    const ans = askCustomer(askInput, askCtx);
    appendMsg("user", askInput.trim());
    appendMsg("assistant", ans);
    setAskInput("");
  }
  function ensureConv(): AiConv {
    if (curConvId && aiConvs.find((c) => c.id === curConvId)) return aiConvs.find((c) => c.id === curConvId)!;
    const c: AiConv = { id: "conv-" + Date.now(), title: "新对话 " + new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }), createdAt: Date.now(), messages: [] };
    setAiConvs((cs) => [c, ...cs]); setCurConvId(c.id); return c;
  }
  function appendMsg(role: AiMsg["role"], content: string) {
    const c = ensureConv();
    const msg: AiMsg = { role, content, ts: Date.now() };
    setAiConvs((cs) => cs.map((x) => x.id === c.id ? { ...x, messages: [...x.messages, msg], title: x.messages.length === 0 && role === "user" ? content.slice(0, 20) : x.title } : x));
  }
  function newAiConv() { const c: AiConv = { id: "conv-" + Date.now(), title: "新对话", createdAt: Date.now(), messages: [] }; setAiConvs((cs) => [c, ...cs]); setCurConvId(c.id); }
  function renameAiConv(id: string, title: string) { setAiConvs((cs) => cs.map((x) => x.id === id ? { ...x, title } : x)); setRenamingConv(null); }
  function deleteAiConv(id: string) { setAiConvs((cs) => cs.filter((x) => x.id !== id)); if (curConvId === id) setCurConvId(null); }
  function deleteMsg(convId: string, msgIdx: number) { setAiConvs((cs) => cs.map((x) => x.id === convId ? { ...x, messages: x.messages.filter((_, i) => i !== msgIdx) } : x)); }
  function copyText(text: string) { navigator.clipboard?.writeText(text).then(() => show("已复制")).catch(() => show("复制失败")); }
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCid, setEditCid] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [density, setDensity] = useState<Density>("舒适");
  const [vc, setVc] = useState<Record<string, boolean>>(DEFAULT_COLS);
  const [colsOpen, setColsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dupOpen, setDupOpen] = useState(false);
  const [dupGroups, setDupGroups] = useState<Customer[][]>([]);
  /* 客户列表视图:表格 / 看板(按阶段分4列),持久化到 settings.crmViewMode */
  const [crmView, setCrmView] = useState<"table" | "kanban">("table");
  function switchCrmView(v: "table" | "kanban") {
    setCrmView(v);
    void db.setSetting("crmViewMode", v);
  }
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [viewName, setViewName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ name: "", industry: "", grade: "C", billingTitle: "", billingTaxNo: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});

  /* 任务4a: 列表分组折叠 */
  const [groupBy, setGroupBy] = useState<"" | "industry" | "grade">("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const custFields = (props.customFields ?? []).filter((x) => x.entity === "customers");

  useEffect(() => {
    void (async () => setSavedViews(await db.getSetting<SavedView[]>("crmViews", [])))();
  }, []);
  useEffect(() => {
    void (async () => {
      setDensity(await db.getSetting<Density>("crmDensity", "舒适"));
      setVc(await db.getSetting<Record<string, boolean>>("crmColumns", DEFAULT_COLS));
      setCrmView(await db.getSetting<"table" | "kanban">("crmViewMode", "table"));
    })();
  }, []);

  const customers = props.customers.filter((c) => !c.deletedAt);
  const deals = props.deals.filter((d) => !d.deletedAt);
  const payments = props.payments.filter((p) => !p.deletedAt);
  const nameOf = (id: string) => customers.find((c) => c.id === id)?.name ?? "未知客户";

  const industries = Array.from(new Set(customers.map((c) => c.industry)));
  const rows = useMemo(() => {
    const f = customers.filter((c) =>
      (industry === "" || c.industry === industry) &&
      (q === "" || c.name.includes(q)) &&
      (stageFilter === "" || customerStage(c.id, deals, props.contracts) === stageFilter)
    );
    return f.sort((a, b) => {
      if (sortKey === "health") return healthOf(b.id, props.cps, payments) - healthOf(a.id, props.cps, payments);
      if (sortKey === "deal") {
        const dv = (cid: string) => deals.filter((d) => d.customerId === cid && !["签约", "输单", "流失"].includes(d.stage)).reduce((s, d) => s + d.value, 0);
        return dv(b.id) - dv(a.id);
      }
      return a.name.localeCompare(b.name, "zh-CN");
    });
  }, [customers, industry, q, sortKey, stageFilter, props.cps, payments, deals, props.contracts]);

  /* 筛选条件变化时重置分页 */
  useEffect(() => { setPage(0); }, [q, industry, stageFilter, sortKey, groupBy]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const f = funnel(deals);
  const open = openId ? customers.find((c) => c.id === openId) ?? null : null;

  const nextDensity: Density = density === "舒适" ? "紧凑" : density === "紧凑" ? "精简" : "舒适";
  function cycleDensity() {
    setDensity(nextDensity);
    void db.setSetting("crmDensity", nextDensity);
  }
  async function saveCols(next: Record<string, boolean>) {
    setVc(next);
    await db.setSetting("crmColumns", next);
    show("列显示已保存");
  }

  function openEdit(c: Customer) {
    const next: Record<string, string> = { name: c.name, industry: c.industry, grade: c.grade, billingTitle: c.billingTitle ?? "", billingTaxNo: c.billingTaxNo ?? "" };
    for (const cf of custFields) next["cf_" + cf.key] = String((c.custom ?? {})[cf.key] ?? "");
    setForm(next); setErrs({});
    setEditMode(true); setEditCid(c.id); setAddOpen(true);
  }
  async function submitAdd() {
    const existingForCheck = editMode ? customers.filter((c) => c.id !== editCid).map((c) => c.name) : customers.map((c) => c.name);
    const errs = validateCustomer({ name: form.name, industry: form.industry, grade: form.grade, billingTaxNo: form.billingTaxNo || undefined }, existingForCheck);
    if (Object.keys(errs).length) { setErrs(errs); return; }
    const custom: Record<string, unknown> = {};
    for (const cf of custFields) custom[cf.key] = form["cf_" + cf.key] ?? "";
    if (editMode && editCid) {
      const orig = customers.find((c) => c.id === editCid);
      const mergedCustom = { ...(orig?.custom ?? {}), ...custom };
      await repos.customers.update(editCid, { name: form.name.trim(), industry: form.industry || "待补充", grade: form.grade as Customer["grade"], billingTitle: form.billingTitle || undefined, billingTaxNo: form.billingTaxNo || undefined, custom: mergedCustom }, "编辑客户「" + form.name + "」");
      show("客户信息已更新");
    } else {
      await repos.customers.create({ name: form.name.trim(), industry: form.industry || "待补充", grade: form.grade as Customer["grade"], billingTitle: form.billingTitle || undefined, billingTaxNo: form.billingTaxNo || undefined, custom }, "新增客户");
      show("客户已建档");
    }
    setAddOpen(false); setForm({ name: "", industry: "", grade: "C", billingTitle: "", billingTaxNo: "" }); setErrs({}); setEditMode(false); setEditCid(null);
    await props.reload();
  }

  async function tryDelete(c: Customer) {
    const linked = deals.filter((d) => d.customerId === c.id).length;
    if (linked > 0) { show(`删除被阻止:「${c.name}」存在 ${linked} 个关联商机;请先处理商机或改用归档`); return; }
    await repos.customers.destroy(c.id, `删除客户「${c.name}」(入回收站)`);
    setOpenId(null);
    show("已移入回收站(30 天内可恢复)");
    await props.reload();
  }
  function findDuplicates() {
    const active = customers.filter((c) => !c.deletedAt);
    const groups: Customer[][] = [];
    const used = new Set<string>();
    for (let i = 0; i < active.length; i++) {
      if (used.has(active[i].id)) continue;
      const group = [active[i]];
      used.add(active[i].id);
      const name1 = active[i].name.replace(/[\s（）()【】\[\]]/g, "");
      for (let j = i + 1; j < active.length; j++) {
        if (used.has(active[j].id)) continue;
        const name2 = active[j].name.replace(/[\s（）()【】\[\]]/g, "");
        if (name1 === name2 || name1.includes(name2) || name2.includes(name1) ||
            (active[i].billingTaxNo && active[i].billingTaxNo === active[j].billingTaxNo)) {
          group.push(active[j]); used.add(active[j].id);
        }
      }
      if (group.length > 1) groups.push(group);
    }
    setDupGroups(groups); setDupOpen(true);
  }
  async function mergeCustomers(keep: Customer, remove: Customer) {
    // 迁移商机/合同/回款/联系人到主客户
    for (const d of props.deals.filter((x) => x.customerId === remove.id && !x.deletedAt)) {
      await repos.deals.update(d.id, { customerId: keep.id }, "合并客户:迁移商机");
    }
    for (const ht of props.contracts.filter((x) => x.customerId === remove.id && !x.deletedAt)) {
      await db.put("contracts", { ...ht, customerId: keep.id }, "合并客户:迁移合同");
    }
    for (const pm of props.payments.filter((x) => x.customerId === remove.id && !x.deletedAt)) {
      await db.put("payments", { ...pm, customerId: keep.id }, "合并客户:迁移回款");
    }
    for (const rel of props.rels.filter((r) => r.customerId === remove.id && !r.deletedAt)) {
      await repos.rels.update(rel.id, { customerId: keep.id }, "合并客户:迁移联系人关系");
    }
    await repos.customers.destroy(remove.id, "合并客户「" + remove.name + "」到「" + keep.name + "」");
    show("已合并「" + remove.name + "」到「" + keep.name + "」");
    setDupGroups((gs) => gs.map((g) => g.filter((c) => c.id !== remove.id)).filter((g) => g.length > 1));
    await props.reload();
  }

  async function saveView() {
    const v: SavedView = { name: viewName.trim() || `视图${savedViews.length + 1}`, q, industry, sortKey };
    const next = [...savedViews, v];
    setSavedViews(next);
    await db.setSetting("crmViews", next);
    setViewName(""); setSavingView(false);
    show("视图已保存");
  }

  const drawerC = open;
  const drawerDeals = drawerC ? deals.filter((d) => d.customerId === drawerC.id) : [];
  const drawerContracts = drawerC ? props.contracts.filter((x) => x.customerId === drawerC.id && !x.deletedAt) : [];
  const drawerPays = drawerC ? payments.filter((p) => p.customerId === drawerC.id) : [];
  const drawerTasks = drawerC ? props.tasks.filter((t) => t.customerId === drawerC.id && !t.deletedAt) : [];
  const drawerRels = drawerC ? props.rels.filter((r) => r.customerId === drawerC.id && !r.deletedAt) : [];
  const drawerCps = drawerC ? props.cps.filter((p) => p.customerId === drawerC.id && !p.deletedAt).sort((a, b) => b.time - a.time) : [];
  const drawerContacts = drawerRels.map((r) => ({ rel: r, contact: props.contacts.find((x) => x.id === r.contactId) }));

  /* P0-02: 财务数据一致性守卫——回款超过商机额时警示 */
  const totalDealVal = drawerDeals.reduce((s, d) => s + d.value, 0);
  const totalReceived = drawerPays.filter((p) => p.status === "已收").reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = drawerPays.filter((p) => p.status !== "已收").reduce((s, p) => s + p.amount, 0);
  const financeWarning = totalDealVal > 0 && (totalReceived + totalUnpaid) > totalDealVal;

  function exportCustomerPack() {
    if (!drawerC) return;
    const bundle = {
      customer: drawerC,
      contacts: drawerContacts.map((x) => x.contact),
      rels: drawerRels,
      deals: drawerDeals, contracts: drawerContracts, payments: drawerPays,
      contactPoints: drawerCps, tasks: drawerTasks,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `客户包_${drawerC.name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    show("客户包已导出(交接/归档用)");
  }

  /** P1:根据 WidgetDef 渲染客户详情具体 Widget(数据由页面侧提供) */
  /* P4 拖拽重排回调:直接更新 state(退出编辑时再落库) */
  function handleLayoutChange(next: RecordLayout) {
    setCustomerLayout(next);
  }
  /* P4 base 字段可见性:写入 widget.config.visibleFields */
  function setBaseVisibleFields(visible: string[]) {
    setCustomerLayout((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => ({
        ...t,
        widgets: t.widgets.map((w) =>
          w.id === "base" ? { ...w, config: { ...(w.config ?? {}), visibleFields: visible } } : w
        ),
      })),
    }));
  }
  /* P4 退出编辑:完整覆盖保存 recordLayouts.customer */
  async function finishEditLayout() {
    const all = await db.getSetting<Record<string, RecordLayout>>("recordLayouts", {});
    await db.setSetting("recordLayouts", { ...all, customer: customerLayout });
    show("布局已保存");
    setEditingLayout(false);
  }

  function renderCustomerWidget(w: WidgetDef): ReactNode {
    if (!drawerC) return null;
    if (w.type === "fields" && w.id === "base") {
      const h = healthOf(drawerC.id, props.cps, payments);
      const arc = 2 * Math.PI * 16;
      const baseVisible = w.config?.visibleFields as string[] | undefined;
      return (
        <FieldsWidget title="客户基本信息" fields={[
          { label: "客户健康度(派生)", value: (
            <div className="score-wrap" style={{ gridColumn: "auto", padding: 0, margin: 0, border: "none" }}>
              <svg width="40" height="40" className="ring"><circle className="bg" cx="20" cy="20" r="16" /><circle className="fg" cx="20" cy="20" r="16" strokeDasharray={arc} strokeDashoffset={arc * (1 - h / 100)} /></svg>
              <span className="score-num num" style={{ fontSize: 18 }}>{h}<span style={{ fontSize: "var(--text-sm)", color: "var(--ink-4)", fontWeight: 500 }}> / 100</span></span>
            </div>
          )},
          { label: "开票抬头", value: drawerC.billingTitle ?? "未建档" },
          { label: "税号", value: drawerC.billingTaxNo ?? "未建档" },
          { label: "在途商机", value: drawerDeals.filter((d) => !["输单", "流失"].includes(d.stage)).length + " 个" },
          { label: "累计商机额", value: money(drawerDeals.reduce((s, d) => s + d.value, 0)) },
          ...custFields.map((cf) => ({ label: cf.label, value: String((drawerC.custom ?? {})[cf.key] ?? "—") })),
          ...Object.entries(drawerC.custom ?? {})
            .filter(([k, v]) => k !== "mediaStrategy" && typeof v !== "object" && v !== null && v !== undefined && !custFields.some((cf) => cf.key === k))
            .map(([k, v]) => ({ label: k, value: String(v) })),
        ]} editing={editingLayout} visibleFields={baseVisible} onVisibleFieldsChange={setBaseVisibleFields} />
      );
    }
    if (w.type === "related" && w.id === "contacts") {
      return (
        <RelatedListWidget title="决策链联系人" emptyText="暂无联系人关联,点击右上角新增" onAdd={() => setContactOpen(true)} items={drawerContacts.map(({ rel, contact }) => ({
          id: rel.id,
          title: contact?.name ?? "未命名",
          sub: (contact?.title ?? "") + (contact?.phone ? " · " + contact.phone : ""),
          meta: <Chip kind={rel.role === "决策人DM" ? "danger" : rel.role === "影响者" ? "data" : "gray"}>{rel.role}</Chip>,
        }))} />
      );
    }
    if (w.type === "related" && w.id === "deals") {
      return (
        <RelatedListWidget title="在途商机" emptyText="暂无在途商机" items={drawerDeals.filter((d) => !["输单", "流失"].includes(d.stage)).map((d) => ({
          id: d.id,
          title: d.title,
          sub: d.stage,
          meta: <Chip kind="data">{money(d.value)}</Chip>,
        }))} />
      );
    }
    if (w.type === "related" && w.id === "contracts") {
      return (
        <RelatedListWidget title="合同与回款" emptyText="暂无合同" items={drawerContracts.map((ht) => ({
          id: ht.id,
          title: ht.name,
          sub: ht.signDate + " · " + ht.status,
          meta: (
            <span>
              {drawerPays.filter((p) => p.contractId === ht.id).map((p) => (
                <Chip key={p.id} kind={p.status === "逾期" ? "danger" : p.status === "已收" ? "green" : "warn"} style={{ marginRight: 4 }}>{p.status} {money(p.amount)}</Chip>
              ))}
            </span>
          ),
        }))} />
      );
    }
    if (w.type === "timeline" && w.id === "timeline") {
      return (
        <TimelineWidget title="跟进时间线" entries={timeline.map((t, i) => ({ id: String(i), ts: t.ts, kind: t.kind, title: t.title }))} emptyText="暂无动态(接触点/任务/商机/回款事件将按时间合并展示)" />
      );
    }
    if (w.type === "related" && w.id === "tasks") {
      return (
        <RelatedListWidget title="关联任务" emptyText="暂无关联任务" items={drawerTasks.map((t) => ({
          id: t.id,
          title: t.title,
          sub: t.kanbanCol,
        }))} />
      );
    }
    return null;
  }

  const colCount = 1 + 1 + (vc.industry ? 1 : 0) + (vc.grade ? 1 : 0) + (vc.health ? 1 : 0) + (vc.stage ? 1 : 0) + (vc.deal ? 1 : 0) + (vc.touch ? 1 : 0);

  /* 任务4a: 分组渲染 */
  const groupedRows = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map<string, Customer[]>();
    for (const c of rows) {
      const key = groupBy === "grade" ? c.grade : c.industry;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [rows, groupBy]);

  return (
    <div className="page page-crm">
      <div className="page-head">
        <div><h1>客户管理</h1><div className="date">客户 {customers.length} · 在途商机 {deals.filter((d) => !["签约", "输单", "流失"].includes(d.stage)).length} 个 · 点击行查看客户详情</div></div>
        <div className="actions">
          <Btn kind="ghost" onClick={() => setImportOpen(true)}>批量导入</Btn>
          <Btn kind="ghost" onClick={findDuplicates}>查找重复</Btn>
          <Btn kind="primary" onClick={() => setAddOpen(true)}><IconPlus size={14} /> 新增客户</Btn>
        </div>
      </div>

      <div className="funnel">
        {(["线索", "MQL", "SQL", "商机", "报价", "谈判", "签约"] as const).map((s, i) => (
          <div className={"fseg" + (i === 0 ? " hot" : "")} key={s}>
            <span className="n num">{f[s]?.count ?? 0}</span>
            <span className="l">{s}{f[s] ? ` · ${money(f[s].value)}` : ""}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 6, padding: "10px 14px 0", flexWrap: "wrap" }}>
          <Btn kind="ghost" sm onClick={cycleDensity}>密度:{density}</Btn>
          <Btn kind="ghost" sm onClick={() => setColsOpen(true)}>字段管理</Btn>
          <div className="seg" style={{ marginLeft: "auto" }}>
            {([["table", "表格"], ["kanban", "看板"]] as const).map(([k, l]) => (
              <button key={k} className={crmView === k ? "active" : ""} onClick={() => switchCrmView(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="stage-filter">
          {(["", "潜在", "有效", "合作", "流失"] as const).map((s) => (
            <span key={s || "全部"} className={"stage-chip" + (stageFilter === s ? " active" : "")} onClick={() => setStageFilter(s)}>
              {s === "" ? "全部" : s}
            </span>
          ))}
        </div>
        <div className="toolbar-row" style={{ padding: "10px 14px 0", marginBottom: 4 }}>
          <div className="filter-input">
            <IconSearch size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索客户…" />
          </div>
          <select className="sel" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">全部行业</option>
            {industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select className="sel" value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}>
            <option value="name">按名称</option>
            <option value="health">按健康度</option>
            <option value="deal">按商机额</option>
          </select>
          <select className="sel" value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} title="分组方式">
            <option value="">不分组</option>
            <option value="industry">按行业分组</option>
            <option value="grade">按等级分组</option>
          </select>
          <Btn kind="draft" sm onClick={() => setSavingView(true)} style={{ marginLeft: "auto" }}>保存为视图</Btn>
        </div>
        { /* active filter inline chips */ }
        {(q || industry || stageFilter || groupBy) ? (
          <div style={{ display: "flex", gap: 6, padding: "8px 14px 0", flexWrap: "wrap", alignItems: "center" }}>
            {q ? <span className="filter-chip">搜索: {q} <button onClick={() => setQ("")} aria-label="清除搜索">×</button></span> : null}
            {industry ? <span className="filter-chip">行业: {industry} <button onClick={() => setIndustry("")} aria-label="清除行业">×</button></span> : null}
            {stageFilter ? <span className="filter-chip">阶段: {stageFilter} <button onClick={() => setStageFilter("")} aria-label="清除阶段">×</button></span> : null}
            {groupBy ? <span className="filter-chip">分组: {groupBy === "industry" ? "按行业" : "按等级"} <button onClick={() => setGroupBy("")} aria-label="清除分组">×</button></span> : null}
          </div>
        ) : null}
        {savingView ? (
          <div style={{ display: "flex", gap: 6, padding: "0 14px 8px", alignItems: "center" }}>
            <input className="inp" style={{ width: 160, minHeight: 28, padding: "2px 8px", fontSize: "var(--text-xs)" }} value={viewName}
              onChange={(e) => setViewName(e.target.value)} placeholder="视图名" />
            <Btn kind="data" sm onClick={() => { void saveView(); }}>确定</Btn>
            <Btn kind="done" sm onClick={() => setSavingView(false)}>取消</Btn>
          </div>
        ) : null}
        {savedViews.length > 0 ? (
          <div style={{ display: "flex", gap: 6, padding: "0 14px 8px", flexWrap: "wrap" }}>
            {savedViews.map((v, i) => (
              <span key={i} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <Chip kind="data">{v.name}</Chip>
                <button className="btn done sm" onClick={() => { setQ(v.q); setIndustry(v.industry); setSortKey(v.sortKey); }}>应用</button>
                <button className="btn done sm" onClick={() => { void (async () => { const next = savedViews.filter((_, idx) => idx !== i); setSavedViews(next); await db.setSetting("crmViews", next); })(); }}>×</button>
              </span>
            ))}
          </div>
        ) : null}
        {selected.size > 0 ? (
          <div style={{ padding: "8px 14px", background: "var(--brand-soft)", borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>已选 {selected.size} 个客户</span>
            <button className="btn danger sm" onClick={() => {
              void (async () => {
                const victims = customers.filter((c) => selected.has(c.id));
                for (const c of victims) await repos.customers.destroy(c.id, "批量删除客户");
                setSelected(new Set());
                show("已批量删除 " + victims.length + " 个客户", () => { void (async () => {
                  for (const c of victims) await db.put("customers", { ...c, deletedAt: undefined }, "撤销批量删除");
                  await props.reload();
                })(); });
                await props.reload();
              })();
            }}>批量删除</button>
            <button className="btn ghost sm" onClick={() => setSelected(new Set())}>取消选择</button>
          </div>
        ) : null}
        {crmView === "kanban" ? (
          <div className="kanban" style={{ gridTemplateColumns: "repeat(4,1fr)", padding: "12px 14px", margin: 0 }}>
            {(["潜在", "有效", "合作", "流失"] as const).map((stg) => {
              const col = rows.filter((c) => customerStage(c.id, deals, props.contracts) === stg);
              return (
                <div className="kcol" key={stg} style={{ minHeight: 200, maxHeight: "calc(100vh - 320px)", display: "flex", flexDirection: "column" }}>
                  <div className="kcol-head">{stg}<span className="chip gray" style={{ marginLeft: "auto" }}>{col.length}</span></div>
                  <div className="kcol-body" style={{ overflowY: "auto", flex: 1 }}>
                    {col.map((c) => {
                      const h = healthOf(c.id, props.cps, payments);
                      const lt = latestTouch(c.id, props.cps);
                      return (
                        <div className="kcard" key={c.id} onClick={() => { setOpenId(c.id); setTab("概览"); }} style={{ cursor: "pointer" }}>
                          <div className="t" style={{ fontWeight: 650, marginBottom: 4 }}>{c.name}</div>
                          <div className="m">
                            <Chip gray>{c.industry}</Chip>
                            <Chip kind={c.grade === "A" || c.grade === "S" ? "brand" : "gray"}>{c.grade}</Chip>
                          </div>
                          <div className="m" style={{ marginTop: 6 }}>
                            <span className="num" style={{ fontSize: "var(--text-xs)", color: h >= 80 ? "var(--success)" : h >= 60 ? "var(--warning)" : "var(--danger)" }}>健康度 {h}</span>
                            <span className="cell-sub" style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}>{lt ? new Date(lt).toLocaleDateString("zh-CN") : "无跟进"}</span>
                          </div>
                        </div>
                      );
                    })}
                    {col.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)", textAlign: "center", padding: "16px 0" }}>暂无客户</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        <div className={"tgrid-wrap density-" + density}>
          <table className="tgrid">
            <thead><tr><th style={{ width: 32 }}><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={(e) => { if (e.target.checked) setSelected(new Set(rows.map((r) => r.id))); else setSelected(new Set()); }} /></th><th style={{ width: "20%" }}>客户</th>{vc.industry ? <th>行业</th> : null}{vc.grade ? <th>等级</th> : null}{vc.health ? <th>健康度</th> : null}{vc.stage ? <th>客户阶段</th> : null}{vc.deal ? <th style={{ textAlign: "right" }}>在途商机</th> : null}{vc.touch ? <th>最近跟进</th> : null}</tr></thead>
            <tbody>
              {groupedRows ? (
                groupedRows.flatMap(([groupKey, groupCustomers]) => {
                  const isCollapsed = !!collapsed[groupKey];
                  const headerRow = (
                    <tr key={"g-" + groupKey} style={{ cursor: "pointer" }} onClick={() => setCollapsed((prev) => ({ ...prev, [groupKey]: !isCollapsed }))}>
                      <td colSpan={colCount} className="crm-group-head">
                        <span className={"crm-group-arrow" + (isCollapsed ? " collapsed" : "")}>&#9660;</span>
                        {groupKey} <span className="crm-group-count">· {groupCustomers.length}家</span>
                      </td>
                    </tr>
                  );
                  if (isCollapsed) return [headerRow];
                  const groupRows = groupCustomers.map((c) => {
                    const h = healthOf(c.id, props.cps, payments);
                    const activeDeals = deals.filter((d) => d.customerId === c.id && !["签约", "输单", "流失"].includes(d.stage));
                    const lt = latestTouch(c.id, props.cps);
                    const stg = customerStage(c.id, deals, props.contracts);
                    const cls = h >= 80 ? "good" : h >= 60 ? "mid" : "low";
                    return (
                      <tr key={c.id} onClick={() => { setOpenId(c.id); setTab("概览"); }}>
                        <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(c.id)} onChange={() => { const n = new Set(selected); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); setSelected(n); }} /></td>
                        <td><div className="cname"><span className="dot" style={{ background: h >= 80 ? "var(--success)" : h >= 60 ? "var(--warning)" : "var(--danger)" }} />{c.name}</div></td>
                        {vc.industry ? <td>{c.industry}</td> : null}
                        {vc.grade ? <td><Chip kind={c.grade === "A" || c.grade === "S" ? "brand" : "gray"}>{c.grade}</Chip></td> : null}
                        {vc.health ? <td><div className="mini-hp"><div className="hp-dot"><i className={cls} style={{ width: h + "%" }} /></div><span className="hp-val num" style={{ color: h >= 80 ? "var(--success)" : h >= 60 ? "var(--warning)" : "var(--danger)" }}>{h}</span></div></td> : null}
                        {vc.stage ? <td><Chip kind={stg === "潜在" ? "gray" : stg === "有效" ? "data" : stg === "合作" ? "green" : "danger"}>{stg}</Chip></td> : null}
                        {vc.deal ? <td className="num" style={{ textAlign: "right" }}>{activeDeals.length ? `${activeDeals.length} 个 · ${money(activeDeals.reduce((s, d) => s + d.value, 0))}` : "—"}</td> : null}
                        {vc.touch ? <td>{lt ? new Date(lt).toLocaleDateString("zh-CN") : "—"}</td> : null}
                      </tr>
                    );
                  });
                  return [headerRow, ...groupRows];
                })
              ) : (
                pagedRows.map((c) => {
                  const h = healthOf(c.id, props.cps, payments);
                  const activeDeals = deals.filter((d) => d.customerId === c.id && !["签约", "输单", "流失"].includes(d.stage));
                  const lt = latestTouch(c.id, props.cps);
                  const stg = customerStage(c.id, deals, props.contracts);
                  const cls = h >= 80 ? "good" : h >= 60 ? "mid" : "low";
                  return (
                    <tr key={c.id} onClick={() => { setOpenId(c.id); setTab("概览"); }}>
                      <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(c.id)} onChange={() => { const n = new Set(selected); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); setSelected(n); }} /></td>
                      <td><div className="cname"><span className="dot" style={{ background: h >= 80 ? "var(--success)" : h >= 60 ? "var(--warning)" : "var(--danger)" }} />{c.name}</div></td>
                      {vc.industry ? <td>{c.industry}</td> : null}
                      {vc.grade ? <td><Chip kind={c.grade === "A" || c.grade === "S" ? "brand" : "gray"}>{c.grade}</Chip></td> : null}
                      {vc.health ? <td><div className="mini-hp"><div className="hp-dot"><i className={cls} style={{ width: h + "%" }} /></div><span className="hp-val num" style={{ color: h >= 80 ? "var(--success)" : h >= 60 ? "var(--warning)" : "var(--danger)" }}>{h}</span></div></td> : null}
                      {vc.stage ? <td><Chip kind={stg === "潜在" ? "gray" : stg === "有效" ? "data" : stg === "合作" ? "green" : "danger"}>{stg}</Chip></td> : null}
                      {vc.deal ? <td className="num" style={{ textAlign: "right" }}>{activeDeals.length ? `${activeDeals.length} 个 · ${money(activeDeals.reduce((s, d) => s + d.value, 0))}` : "—"}</td> : null}
                      {vc.touch ? <td>{lt ? new Date(lt).toLocaleDateString("zh-CN") : "—"}</td> : null}
                    </tr>
                  );
                })
              )}
              {rows.length === 0 ? (
                <tr><td colSpan={colCount} style={{ padding: 0 }}>
                  {customers.length === 0 ? (
                    <div className="empty-state" style={{ padding: "60px 20px" }}>
                      <div className="es-icon"><IconUsers size={44} /></div>
                      <div className="es-title">暂无客户</div>
                      <div className="es-desc">点击下方按钮添加你的第一个客户，开始管理客户全生命周期</div>
                      <Btn kind="primary" onClick={() => setAddOpen(true)}><IconPlus size={14} /> 新增客户</Btn>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: "60px 20px" }}>
                      <div className="es-icon" style={{ fontSize: 32 }}>🔍</div>
                      <div className="es-title">无匹配客户</div>
                      <div className="es-desc">当前筛选条件下没有匹配的客户，试试调整筛选条件</div>
                      <Btn kind="ghost" onClick={() => { setQ(""); setIndustry(""); setStageFilter(""); setGroupBy(""); }}>清除筛选</Btn>
                    </div>
                  )}
                </td></tr>
              ) : null}
            </tbody>
          </table>
          {rows.length > PAGE_SIZE ? (
            <div className="h-row" style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: "var(--text-xs)" }}>共 {rows.length} 条 · 第 {page + 1}/{totalPages} 页</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn kind="ghost" sm disabled={page === 0} onClick={() => setPage(0)}>首页</Btn>
                <Btn kind="ghost" sm disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>上一页</Btn>
                <Btn kind="ghost" sm disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>下一页</Btn>
                <Btn kind="ghost" sm disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>末页</Btn>
              </div>
            </div>
          ) : null}
        </div>
        )}
      </div>

      <div className={"crm-detail" + (open ? " open" : "")}>
        {drawerC ? (
          <>
            <div className="drawer-head">
              <div className="detail-avatar">{drawerC.name.slice(0, 1)}</div>
              <div>
                <div className="detail-title">{drawerC.name}</div>
                <div className="detail-sub">
                  <Chip kind={drawerC.grade === "A" || drawerC.grade === "S" ? "brand" : "gray"}>{drawerC.grade} 级</Chip>
                  <Chip>{drawerC.industry}</Chip>
                  {drawerC.parentId ? <Chip>属集团 {nameOf(drawerC.parentId)}</Chip> : null}
                </div>
              </div>
              <Btn kind="ghost" sm style={{ marginLeft: "auto" }} onClick={() => openEdit(drawerC)}>编辑</Btn>
              <Btn kind={editingLayout ? "data" : "ghost"} sm onClick={() => { if (editingLayout) void finishEditLayout(); else setEditingLayout(true); }}>{editingLayout ? "完成" : "编辑布局"}</Btn>
              <button className="icon-btn" onClick={() => setOpenId(null)} aria-label="返回"><IconClose size={16} /></button>
              <Btn sm kind="ghost" onClick={() => setOpenId(null)}>← 返回</Btn>
            </div>
            <div className="drawer-body">
              <RecordPage
                layout={customerLayout}
                activeTab={tab}
                onTabChange={(t) => setTab(t as typeof tab)}
                renderWidget={renderCustomerWidget}
                editing={editingLayout}
                onLayoutChange={handleLayoutChange}
              />
              {financeWarning && (
                <div style={{ margin: "8px 18px", padding: "10px 14px", border: "1px solid var(--warning)", borderRadius: 8, background: "var(--warning-bg)", color: "var(--warning)", fontSize: 13 }}>
                  数据异常：回款 {money(totalReceived + totalUnpaid)} 超过累计商机额 {money(totalDealVal)}，请核对商机阶段与合同金额。
                </div>
              )}
              {tab === "决策链" && (
                <div style={{ paddingTop: 6 }}>
                  <div className="dsec">角色徽章制(不画图谱)</div>
                  {drawerContacts.map(({ rel, contact }) => (
                    <div className="chain-row" key={rel.id}>
                      <div className="chain-avatar">{contact?.name.slice(0, 1) ?? "?"}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{contact?.name}
                          {contact && contact.employmentStatus !== "在职" ? <Chip kind="danger">关系风险:{contact.employmentStatus}</Chip> : null}
                        </div>
                        <div className="cell-sub">{contact?.title} · {contact?.phone ?? "无手机号"}</div>
                      </div>
                      <span className="chain-role"><Chip kind={rel.role === "决策人DM" ? "danger" : rel.role === "影响者" ? "data" : "gray"}>{rel.role}</Chip></span>
                    </div>
                  ))}
                  {drawerContacts.length === 0 ? <p className="muted" style={{ padding: "12px 18px" }}>暂无联系人关联</p> : null}
                </div>
              )}
              {tab === "媒介策略" && drawerC ? (
                <MediaStrategyView customer={drawerC} onEdit={openStrategyEdit} />
              ) : null}
              {tab === "AI建议" && (
                <div style={{ display: "flex", gap: 12, height: "100%" }}>
                  <div style={{ width: 180, flexShrink: 0, borderRight: "1px solid var(--border)", paddingRight: 10, overflowY: "auto" }}>
                    <Btn kind="primary" sm style={{ width: "100%", marginBottom: 8 }} onClick={newAiConv}><IconPlus size={12} /> 新对话</Btn>
                    {aiConvs.map((c) => (
                      <div key={c.id} style={{ padding: "6px 8px", borderRadius: 6, background: curConvId === c.id ? "var(--surface-2)" : "transparent", cursor: "pointer", marginBottom: 2, fontSize: "var(--text-sm)" }} onClick={() => setCurConvId(c.id)}>
                        {renamingConv === c.id ? (
                          <input className="inp" style={{ width: "100%", fontSize: "var(--text-xs)" }} defaultValue={c.title} autoFocus onBlur={(e) => renameAiConv(c.id, e.target.value || c.title)} onKeyDown={(e) => { if (e.key === "Enter") renameAiConv(c.id, (e.target as HTMLInputElement).value || c.title); }} />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onDoubleClick={() => setRenamingConv(c.id)}>{c.title}</span>
                            <span style={{ fontSize: 10, color: "var(--ink-3)", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setRenamingConv(c.id); }}>重命名</span>
                            <span style={{ fontSize: 10, color: "var(--danger)", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); deleteAiConv(c.id); }}>删除</span>
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>{new Date(c.createdAt).toLocaleDateString("zh-CN")} · {c.messages.length}条</div>
                      </div>
                    ))}
                    {aiConvs.length === 0 ? <p className="muted" style={{ fontSize: "var(--text-xs)", textAlign: "center", padding: 10 }}>暂无对话</p> : null}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <div style={{ marginBottom: 8, display: "flex", gap: 6 }}>
                      <Btn kind="primary" sm onClick={() => { void genAdvice(); }} disabled={aiBusy}>{aiBusy ? "思考中…" : "生成跟进建议"}</Btn>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
                      {curConvId ? (() => {
                        const conv = aiConvs.find((c) => c.id === curConvId);
                        if (!conv || conv.messages.length === 0) return <p className="muted" style={{ textAlign: "center", padding: 30, fontSize: "var(--text-sm)" }}>点击上方"生成跟进建议"或在下方输入问题开始对话</p>;
                        return conv.messages.map((m, i) => (
                          <div key={i} style={{ marginBottom: 10, textAlign: m.role === "user" ? "right" : "left" }}>
                            <div style={{ display: "inline-block", maxWidth: "85%", textAlign: "left", padding: "8px 12px", borderRadius: 10, background: m.role === "user" ? "var(--brand)" : "var(--surface-2)", color: m.role === "user" ? "#fff" : "var(--ink)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
                              <div style={{ fontSize: 10, color: m.role === "user" ? "rgba(255,255,255,0.7)" : "var(--ink-3)", marginTop: 4, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <span>{new Date(m.ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                                <span style={{ cursor: "pointer" }} onClick={() => copyText(m.content)}>复制</span>
                                <span style={{ cursor: "pointer" }} onClick={() => deleteMsg(conv.id, i)}>删除</span>
                              </div>
                            </div>
                          </div>
                        ));
                      })() : <p className="muted" style={{ textAlign: "center", padding: 30, fontSize: "var(--text-sm)" }}>选择或新建一个对话</p>}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                      <div className="filter-input" style={{ flex: 1 }}>
                        <IconSearch size={13} />
                        <input value={askInput} onChange={(e) => setAskInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runAsk(); }} placeholder="问我:这个客户有多少在途商机?最近跟进是什么时候?" />
                      </div>
                      <Btn kind="data" sm onClick={runAsk}>提问</Btn>
                    </div>
                  </div>
                </div>
              )}
              {tab === "SOP话术" && (
                <div>
                  <div className="h-row" style={{ marginBottom: 10 }}>
                    <span className="h-title sm">SOP 话术库</span>
                    <Btn kind="primary" sm style={{ marginLeft: "auto" }} onClick={openSopNew}><IconPlus size={12} /> 新增话术</Btn>
                  </div>
                  {sopScripts.map((sc) => (
                    <div key={sc.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
                      <div className="h-row" style={{ marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{sc.scene}</span>
                        {sc.builtin ? <Chip gray>内置</Chip> : null}
                        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                          <Btn kind="ghost" sm onClick={() => copySop(sc.text)}>复制</Btn>
                          {!sc.builtin ? <Btn kind="ghost" sm onClick={() => openSopEdit(sc)}>编辑</Btn> : null}
                          {!sc.builtin ? <Btn kind="ghost" sm onClick={() => { void removeSop(sc.id); }}>删除</Btn> : null}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{sc.text}</p>
                    </div>
                  ))}
                  {sopScripts.length === 0 ? <p className="muted" style={{ textAlign: "center", padding: 20 }}>暂无话术</p> : null}
                </div>
              )}
            </div>
            <div className="drawer-foot">
              <Btn kind="primary" onClick={() => setCpOpen(true)}>记录跟进</Btn>
              <Btn kind="ghost" onClick={() => { void (async () => { await tryDelete(drawerC); })(); }}>删除</Btn>
              <Btn kind="ghost" onClick={exportCustomerPack}>导出客户包</Btn>
            </div>
          </>
        ) : null}
      </div>

      {addOpen ? (
        <Modal title={editMode ? "编辑客户" : "新增客户"} onClose={() => { setAddOpen(false); setEditMode(false); setEditCid(null); }} footer={
          <div className="grow">
            <Btn kind="ghost" onClick={() => { setAddOpen(false); setEditMode(false); setEditCid(null); }}>取消</Btn>
            <Btn kind="primary" onClick={() => { void submitAdd(); }}>保存</Btn>
          </div>
        }>
          <Field label="客户名称" error={errs.name}>
            <input className="inp" style={{ width: "100%" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="field-row">
            <Field label="行业"><input className="inp" style={{ width: "100%" }} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></Field>
            <Field label="等级">
              <select className="sel" style={{ width: "100%" }} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                {["S", "A", "B", "C"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <Field label="开票抬头(可选)"><input className="inp" style={{ width: "100%" }} value={form.billingTitle} onChange={(e) => setForm({ ...form, billingTitle: e.target.value })} /></Field>
          <Field label="税号(可选)" error={errs.billingTaxNo}><input className="inp" style={{ width: "100%" }} value={form.billingTaxNo} onChange={(e) => setForm({ ...form, billingTaxNo: e.target.value })} /></Field>
          {custFields.map((cf) => (
            <Field key={cf.id} label={cf.label + (cf.type === "select" && cf.options ? "(" + cf.options.join("/") + ")" : "")}>
              <input className="inp" style={{ width: "100%" }} value={form["cf_" + cf.key] ?? ""} onChange={(e) => setForm({ ...form, ["cf_" + cf.key]: e.target.value })} />
            </Field>
          ))}
        </Modal>
      ) : null}

      <ImportCustomers open={importOpen} onClose={() => setImportOpen(false)} existingNames={customers.map((c) => c.name)} reload={props.reload} />
      {dupOpen ? (
        <Modal title="重复客户合并" onClose={() => setDupOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setDupOpen(false)}>关闭</Btn></div>
        }>
          {dupGroups.length === 0 ? <p className="muted" style={{ textAlign: "center", padding: 20 }}>未发现重复客户</p> :
            dupGroups.map((g, gi) => (
              <div key={gi} style={{ marginBottom: 16, padding: 12, border: "1px solid var(--border)", borderRadius: 8 }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: 8 }}>疑似重复组 ({g.length}个)</div>
                {g.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ flex: 1, fontSize: "var(--text-sm)" }}>{c.name} <span className="muted">({c.industry} · {c.grade}级)</span></span>
                    {g.indexOf(c) === 0 ? <Chip kind="green">保留</Chip> :
                      <Btn kind="danger" sm onClick={() => { void mergeCustomers(g[0], c); }}>合并到首项</Btn>}
                  </div>
                ))}
              </div>
            ))
          }
          <p className="muted" style={{ fontSize: "var(--text-xs)", marginTop: 8 }}>合并会将从客户的商机/合同/回款/联系人迁移到主客户,然后软删除从客户。</p>
        </Modal>
      ) : null}
      {strategyEdit ? (
        <Modal title="客户媒介策略" onClose={() => setStrategyEdit(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setStrategyEdit(false)}>取消</Btn><Btn kind="primary" onClick={() => { void saveStrategy(); }}>保存</Btn></div>
        }>
          <Field label="目标受众"><input className="inp" style={{ width: "100%" }} value={strategyDraft.audience} onChange={(e) => setStrategyDraft({ ...strategyDraft, audience: e.target.value })} placeholder="如:25-35岁新一线女性,美妆护肤" /></Field>
          <Field label="预算区间"><input className="inp" style={{ width: "100%" }} value={strategyDraft.budget} onChange={(e) => setStrategyDraft({ ...strategyDraft, budget: e.target.value })} placeholder="如:月度 30-80 万" /></Field>
          <Field label="建议配比"><input className="inp" style={{ width: "100%" }} value={strategyDraft.mix} onChange={(e) => setStrategyDraft({ ...strategyDraft, mix: e.target.value })} placeholder="如:种草50% / 效果30% / 品牌20%" /></Field>
          <Field label="首选资源"><input className="inp" style={{ width: "100%" }} value={strategyDraft.resources} onChange={(e) => setStrategyDraft({ ...strategyDraft, resources: e.target.value })} placeholder="如:抖音信息流+小红书达人+分众电梯" /></Field>
          <Field label="备注"><textarea className="inp" rows={2} style={{ width: "100%" }} value={strategyDraft.note} onChange={(e) => setStrategyDraft({ ...strategyDraft, note: e.target.value })} /></Field>
          <Field label="方案附件">
            <div style={{ marginBottom: 8 }}>
              <label className="btn ghost" style={{ display: "inline-block", cursor: "pointer", fontSize: "var(--text-sm)", padding: "4px 12px" }}>
                <input type="file" multiple style={{ display: "none" }} accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.zip,.rar" onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  const newAtts = files.map((f) => ({ name: f.name, path: (f as File & { path?: string }).path ?? f.name }));
                  setStrategyDraft({ ...strategyDraft, attachments: [...strategyDraft.attachments, ...newAtts] });
                }} />
                + 添加附件
              </label>
            </div>
            {strategyDraft.attachments.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {strategyDraft.attachments.map((att, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--surface-2)", borderRadius: 6, fontSize: "var(--text-sm)" }}>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
                    <Btn kind="ghost" sm onClick={() => { void (window as unknown as { mta?: { openPath?: (p: string) => Promise<string> } }).mta?.openPath?.(att.path); }}>打开</Btn>
                    <Btn kind="ghost" sm onClick={() => setStrategyDraft({ ...strategyDraft, attachments: strategyDraft.attachments.filter((_, j) => j !== i) })}>移除</Btn>
                  </div>
                ))}
              </div>
            ) : <p className="muted" style={{ fontSize: "var(--text-xs)", margin: 0 }}>暂无附件,可添加方案文档/图片等</p>}
          </Field>
        </Modal>
      ) : null}
      {cpOpen && drawerC ? (
        <Modal title={"记录跟进 · " + drawerC.name} onClose={() => setCpOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setCpOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void saveContactPoint(); }}>保存</Btn></div>
        }>
          <Field label="渠道">
            <select className="sel" style={{ width: "100%" }} value={cpForm.channel} onChange={(e) => setCpForm({ ...cpForm, channel: e.target.value as ContactPoint["channel"] })}>
              {(["微信", "拜访", "电话", "邮件"] as const).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="内容"><textarea className="inp" rows={3} style={{ width: "100%" }} value={cpForm.summary} onChange={(e) => setCpForm({ ...cpForm, summary: e.target.value })} placeholder="本次沟通要点…" /></Field>
        </Modal>
      ) : null}
      {contactOpen && drawerC ? (
        <Modal title={"添加联系人 · " + drawerC.name} onClose={() => setContactOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setContactOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void saveContact(); }}>保存</Btn></div>
        }>
          <Field label="姓名"><input className="inp" style={{ width: "100%" }} value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="必填" /></Field>
          <div className="field-row">
            <Field label="职位"><input className="inp" style={{ width: "100%" }} value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} placeholder="如:市场总监" /></Field>
            <Field label="角色">
              <select className="sel" style={{ width: "100%" }} value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value as RelRole })}>
                {(["决策人DM", "影响者", "使用者", "把关人", "审批人"] as const).map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div className="field-row">
            <Field label="电话"><input className="inp" style={{ width: "100%" }} value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></Field>
            <Field label="微信"><input className="inp" style={{ width: "100%" }} value={contactForm.wechat} onChange={(e) => setContactForm({ ...contactForm, wechat: e.target.value })} /></Field>
          </div>
        </Modal>
      ) : null}
      {sopOpen ? (
        <Modal title={sopForm.id ? "编辑话术" : "新增话术"} onClose={() => setSopOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setSopOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { void saveSop(); }}>保存</Btn></div>
        }>
          <Field label="场景名称"><input className="inp" style={{ width: "100%" }} value={sopForm.scene} onChange={(e) => setSopForm({ ...sopForm, scene: e.target.value })} placeholder="如:节日促活跟进" /></Field>
          <Field label="话术内容"><textarea className="inp" rows={5} style={{ width: "100%" }} value={sopForm.text} onChange={(e) => setSopForm({ ...sopForm, text: e.target.value })} placeholder="话术正文,可用[客户名][金额]等占位符" /></Field>
        </Modal>
      ) : null}
      {colsOpen ? (
        <Modal title="字段管理" onClose={() => setColsOpen(false)} footer={
          <div className="grow"><Btn kind="ghost" onClick={() => setColsOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => setColsOpen(false)}>完成</Btn></div>
        }>
          <p className="muted" style={{ marginBottom: 10, fontSize: "var(--text-sm)" }}>勾选列表中显示的列(客户名称不可关闭)。</p>
          {COL_LIST.map((col) => (
            <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: "var(--text-sm)" }}>
              <input type="checkbox" checked={!!vc[col.key]} disabled={col.key === "name"}
                onChange={() => { const next = { ...vc, [col.key]: !vc[col.key] }; void saveCols(next); }} />
              {col.label}
            </label>
          ))}
        </Modal>
      ) : null}
      {node}
    </div>
  );
}

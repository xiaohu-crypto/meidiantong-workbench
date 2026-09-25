// File: src/App.tsx
// 根入口：保留全部数据接线（18 页 lazy + IndexedDB + Onboarding + 通知 + AI 助手），
// 外层布局替换为 LayoutFrame（哑光暗黑磨砂感 + 子页签总线）。
import { useCallback, useEffect, useState } from "react";
import { db } from "./db/db";
import { seedIfEmpty } from "./data/seed";
import { seedExtraIfEmpty } from "./data/seed2";
import { rebuildIndex, type SearchDoc } from "./core/search";
import type { Aar, Baseline, Contact, ContactPoint, Contract, Customer, Deal, Influencer, Milestone, MediaResource, Note, Objective, Payment, Pitch, PostBuy, RateCard, Rel, ScheduleItem, Supplier, Task } from "./types";
import { lazy, Suspense } from "react";
const Today = lazy(() => import("./pages/Today"));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const GanttPlanner = lazy(() => import("./pages/Media/GanttPlanner"));
const CRM = lazy(() => import("./pages/CRM"));
const Work = lazy(() => import("./pages/Work"));
const Dev = lazy(() => import("./pages/Dev"));
const Media = lazy(() => import("./pages/Media"));
const Kb = lazy(() => import("./pages/Kb"));
const Data = lazy(() => import("./pages/Data"));
const Help = lazy(() => import("./pages/Help"));
import { startupCatchUp, maybeNotify } from "./core/notify";
const SettingsPage = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const BuilderPage = lazy(() => import("./pages/Builder"));
const WorkflowsPage = lazy(() => import("./pages/Workflows"));
const CollectionsPage = lazy(() => import("./pages/Collections"));
const AuditPage = lazy(() => import("./pages/Audit"));
const AIStaffPage = lazy(() => import("./pages/AIStaff"));
const MyPagesPage = lazy(() => import("./pages/MyPages"));
import QuickCapture from "./components/QuickCapture";
import TopSearch from "./components/TopSearch";
import Onboarding from "./components/Onboarding";
import AIAssistant from "./components/AIAssistant";
import { Btn, Modal, useToast } from "./ui/common";
import { useTheme } from "./context/ThemeContext";
import { engine } from "./core/flow/engine";
import { APP_VERSION } from "./core/version";
import { FormBlock } from "./components/blocks/FormBlock";
import { DetailsBlock } from "./components/blocks/DetailsBlock";
import { LayoutFrame } from "./components/ui/LayoutFrame";

declare global {
  interface Window {
    mta?: {
      onQuickCapture: (cb: () => void) => void;
      setLoginItem: (open: boolean) => Promise<boolean>;
      getLoginItem: () => Promise<boolean>;
      aiSaveKey: (plain: string) => Promise<{ enc?: string; plain?: string }>;
      aiLoadKey: (rec: { enc?: string; plain?: string }) => Promise<string>;
      aiEnvKey: () => Promise<string>;
      windowMode: string;
      titlebarSet: (mode: "integrated" | "native") => Promise<{ ok: boolean; restart?: boolean }>;
      titlebarSetTheme: (theme: "dark" | "light") => Promise<boolean>;
      aiChat: (args: { baseUrl: string; apiKey: string; model: string; messages: { role: string; content: string }[] }) =>
        Promise<{ ok: boolean; content?: string; error?: string; status?: number; usage?: { total_tokens?: number } }>;
      backupPickDir: () => Promise<string | null>;
      backupWrite: (args: { dir: string; content: string; keep: number }) => Promise<{ ok: boolean; file?: string; removed?: number; error?: string }>;
      chatStream: (args: { baseUrl: string; apiKey: string; model: string; messages: { role: string; content: string }[] }) => Promise<{ ok: boolean }>;
      onStreamChunk: (cb: (chunk: string) => void) => void;
      onStreamDone: (cb: () => void) => void;
      onStreamError: (cb: (err: string) => void) => void;
      onUpdateReady: (cb: (version: string) => void) => void;
      installUpdate: () => void;
      windowMinimize: () => Promise<boolean>;
      windowMaximize: () => Promise<boolean>;
      windowClose: () => Promise<boolean>;
    };
  }
}

interface DataSet {
  customers: Customer[]; contacts: Contact[]; rels: Rel[]; deals: Deal[];
  contracts: Contract[]; payments: Payment[]; tasks: Task[];
  objectives: Objective[]; cps: ContactPoint[]; milestones: Milestone[];
  pitches: Pitch[]; suppliers: Supplier[]; resources: MediaResource[];
  ratecards: RateCard[]; items: ScheduleItem[]; postbuys: PostBuy[];
  notes: Note[]; baselines: Baseline[]; aars: Aar[]; influencers: Influencer[];
  customFields: { id: string; entity: string; key: string; label: string; type: string; options?: string[] }[];
  notificationsReadAt: number;
}

type View = "agent" | "today" | "crm" | "work" | "dev" | "media" | "gantt" | "kb" | "data" | "growth" | "settings" | "help" | "notifications" | "builder" | "workflows" | "collections" | "audit" | "aistaff" | "mypages";

const VIEW_KEYS: View[] = ["agent", "today", "crm", "work", "dev", "media", "gantt", "kb", "data", "growth", "settings", "help", "notifications", "builder", "workflows", "collections", "audit", "aistaff", "mypages"];

async function loadAll(): Promise<DataSet> {
  const alive = async <T extends { deletedAt?: number }>(store: Parameters<typeof db.getAll>[0]) =>
    ((await db.getAll(store)) as T[]).filter((r) => !r.deletedAt);
  return {
    customers: await alive<Customer>("customers"),
    contacts: await alive<Contact>("contacts"),
    rels: await alive<Rel>("customerContactRels"),
    deals: await alive<Deal>("deals"),
    contracts: await alive<Contract>("contracts"),
    payments: await alive<Payment>("payments"),
    tasks: await alive<Task>("tasks"),
    objectives: await db.getAll<Objective>("objectives"),
    cps: await alive<ContactPoint>("contactPoints"),
    milestones: await db.getSetting<Milestone[]>("milestones", []),
    pitches: await alive<Pitch>("pitches"),
    suppliers: await alive<Supplier>("suppliers"),
    resources: await alive<MediaResource>("resources"),
    ratecards: await alive<RateCard>("ratecards"),
    items: await alive<ScheduleItem>("scheduleItems"),
    postbuys: await alive<PostBuy>("postbuys"),
    notes: await alive<Note>("notes"),
    baselines: await alive<Baseline>("baselines"),
    aars: await alive<Aar>("aars"),
    influencers: await alive<Influencer>("influencers"),
    customFields: await db.getSetting("customFields", [] as { id: string; entity: string; key: string; label: string; type: string; options?: string[] }[]),
    notificationsReadAt: await db.getSetting<number>("notificationsReadAt", 0),
  };
}

export default function App() {
  const [view, setView] = useState<View>("agent");
  const [data, setData] = useState<DataSet | null>(null);
  const [showQuick, setShowQuick] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const { resolvedTheme, setThemeMode } = useTheme();
  const [focusCid, setFocusCid] = useState<string | null>(null);
  const [kbFocus, setKbFocus] = useState<string | null>(null);
  const [updateVer, setUpdateVer] = useState<string | null>(null);
  const [flowForm, setFlowForm] = useState<{ store: string; id?: string } | null>(null);
  const [flowDetail, setFlowDetail] = useState<{ store: string; id: string } | null>(null);
  const [builderPageUid, setBuilderPageUid] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("全局概览");
  const toast = useToast();

  const reload = useCallback(async () => { setData(await loadAll()); }, []);

  useEffect(() => {
    return engine.onEvent((e) => {
      const p = (e.payload ?? {}) as Record<string, unknown>;
      switch (e.type) {
        case "openForm":
          setFlowForm({ store: String(p.store ?? ""), id: p.id ? String(p.id) : undefined });
          break;
        case "openDetail":
          setFlowDetail({ store: String(p.store ?? ""), id: String(p.id ?? "") });
          break;
        case "refresh":
          void reload();
          break;
        case "notify":
          toast.show(String(p.text ?? "操作完成"), undefined);
          break;
        case "closeDrawer":
          setFlowForm(null);
          setFlowDetail(null);
          break;
        case "openBuilder":
          setBuilderPageUid(p.pageUid ? String(p.pageUid) : null);
          setView("builder");
          break;
        default:
          break;
      }
    });
  }, [reload, toast.show]);

  useEffect(() => {
    const onNav = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const v = typeof detail === "string" ? detail : (detail as { view?: string } | undefined)?.view;
      if (v && (VIEW_KEYS as readonly string[]).includes(v)) setView(v as View);
    };
    window.addEventListener("nav", onNav);
    return () => window.removeEventListener("nav", onNav);
  }, []);


  useEffect(() => {
    void (async () => {
      const onboarded = await db.getSetting<boolean>("onboarded", false);
      const cs = await db.getAll<Customer>("customers");
      if (!onboarded && cs.length === 0) { setShowOnboard(true); }
      else { await seedIfEmpty(); await seedExtraIfEmpty(); }
      await reload();
      const pays = (await db.getAll<Payment>("payments")).filter((p) => !p.deletedAt && p.status === "逾期");
      void startupCatchUp(pays.length);
      const t = await db.getSetting<"dark" | "light">("theme", "light");
      if (t) setThemeMode(t);
      const { setupBuiltinWorkflows, startTimerWorkflows } = await import("./core/workflow/triggers");
      setupBuiltinWorkflows();
      startTimerWorkflows(30 * 60 * 1000);
    })();
    const onKey = async (e: KeyboardEvent) => {
      const qk = await db.getSetting<{ key: string }>("quickKey", { key: "k" });
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === qk.key) { e.preventDefault(); setShowQuick(true); return; }
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          const navViews: View[] = ["today", "work", "crm", "dev", "media", "kb", "data", "settings"];
          const v = navViews[num - 1];
          if (v) { e.preventDefault(); setView(v); }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    if (window.mta) window.mta.onQuickCapture(() => setShowQuick(true));
    if (window.mta?.onUpdateReady) {
      window.mta.onUpdateReady((v: string) => { setUpdateVer(v); });
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [reload, setThemeMode]);

  useEffect(() => {
    if (!data) return;
    const docs: SearchDoc[] = [
      ...data.customers.map((c) => ({ id: c.id, type: "客户", title: c.name, sub: c.industry, refId: c.id })),
      ...data.contacts.map((c) => ({ id: c.id, type: "联系人", title: c.name, sub: c.title ?? "", refId: c.orgCustomerId ?? c.id })),
      ...data.deals.map((d) => ({ id: d.id, type: "商机", title: d.title, sub: d.stage, refId: d.customerId })),
      ...data.tasks.map((t) => ({ id: t.id, type: "任务", title: t.title, sub: t.kanbanCol })),
      ...data.notes.map((n) => ({ id: n.id, type: "笔记", title: n.title, sub: n.tags.map((x) => "#" + x).join(" ") })),
    ];
    rebuildIndex(docs);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const tick = async () => {
      const cfg = await db.getSetting("autoBackup", { enabled: false, intervalHours: 24, dir: "", keep: 7, lastAt: 0 });
      if (!cfg.enabled || !cfg.dir) return;
      if (Date.now() - cfg.lastAt < cfg.intervalHours * 3600000) return;
      const dump = await db.dumpAll();
      const payload = JSON.stringify({ app: "meidiantong-workbench", schemaVersion: 2, exportedAt: new Date().toISOString(), stores: dump });
      if (!window.mta?.backupWrite) return;
      const r = await window.mta.backupWrite({ dir: cfg.dir, content: payload, keep: cfg.keep });
      if (r.ok) await db.setSetting("autoBackup", { ...cfg, lastAt: Date.now() });
    };
    void tick();
    const id = window.setInterval(() => void tick(), 60000);
    return () => window.clearInterval(id);
  }, [data]);

  useEffect(() => {
    const id = window.setInterval(() => void (async () => {
      const list = await db.getSetting<{ id: string; at: number; title: string; body: string }[]>("snoozed", []);
      const due = list.filter((x) => x.at <= Date.now());
      if (due.length === 0) return;
      for (const x of due) await maybeNotify(x.title, x.body);
      await db.setSetting("snoozed", list.filter((x) => x.at > Date.now()));
    })(), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.titlebar = window.mta?.windowMode ?? "integrated";
    void window.mta?.titlebarSetTheme?.(resolvedTheme === "dark" ? "dark" : "light");
  }, [resolvedTheme]);

  function goCrm(customerId: string) { setFocusCid(customerId); setView("crm"); }

  function onSearchSelect(doc: SearchDoc) {
    if (doc.type === "客户") goCrm(doc.id);
    else if (doc.type === "商机" || doc.type === "联系人") goCrm(doc.refId ?? doc.id);
    else if (doc.type === "任务") setView("work");
    else if (doc.type === "笔记") { setKbFocus(doc.id); setView("kb"); }
  }

  // LayoutFrame 菜单切换适配：菜单 ID 直接映射 View
  const handleLayoutSelect = (menu: string, tab: string) => {
    setView(menu as View);
    setCurrentTab(tab);
    if (menu === "crm") setFocusCid(null);
    if (menu === "kb") setKbFocus(null);
  };

  return (
    <>
      <LayoutFrame
        currentMenu={view}
        currentTab={currentTab}
        onSelect={handleLayoutSelect}
      >
        <Suspense fallback={
          <div style={{ padding: 24 }}>
            <div style={{ height: 32, width: 200, background: "var(--bg-muted)", borderRadius: 8, marginBottom: 16, animation: "pulse 1.2s infinite" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
              {[0,1,2,3].map((i) => <div key={i} style={{ height: 80, background: "var(--bg-muted)", borderRadius: 12, animation: "pulse 1.2s infinite" }} />)}
            </div>
            <div style={{ height: 200, background: "var(--bg-muted)", borderRadius: 12, animation: "pulse 1.2s infinite" }} />
          </div>
        }>
          {view === "agent" ? <AgentPage /> : null}
          {view === "today" && data ? (
            <Today customers={data.customers} deals={data.deals} payments={data.payments} cps={data.cps}
              objectives={data.objectives} tasks={data.tasks} milestones={data.milestones}
              reload={reload} openQuick={() => setShowQuick(true)} goCrm={goCrm} onNavigate={(v) => setView(v as View)} />
          ) : null}
          {view === "crm" && data ? (
            <CRM customers={data.customers} contacts={data.contacts} rels={data.rels} deals={data.deals}
              contracts={data.contracts} payments={data.payments} cps={data.cps} tasks={data.tasks}
              reload={reload} focusCustomerId={focusCid} customFields={data.customFields} />
          ) : null}
          {view === "work" && data ? (
            <Work tasks={data.tasks} objectives={data.objectives} customers={data.customers} reload={reload} goCrm={goCrm} />
          ) : null}
          {view === "dev" && data ? (
            <Dev contracts={data.contracts} payments={data.payments} customers={data.customers} reload={reload} />
          ) : null}
          {view === "media" && data ? (
            <Media suppliers={data.suppliers} resources={data.resources} ratecards={data.ratecards}
              items={data.items} postbuys={data.postbuys} customers={data.customers} influencers={data.influencers} reload={reload} />
          ) : null}
          {view === "gantt" ? (
            <GanttPlanner items={data?.items ?? []} resources={data?.resources ?? []} />
          ) : null}
          {view === "kb" && data ? (
            <Kb notes={data.notes} reload={reload} focusId={kbFocus} />
          ) : null}
          {view === "data" && data ? (
            <Data contracts={data.contracts} payments={data.payments} deals={data.deals} items={data.items} baselines={data.baselines} postbuys={data.postbuys} resources={data.resources} tasks={data.tasks} reload={reload} />
          ) : null}
          {view === "notifications" && data ? (
            <Notifications customers={data.customers} payments={data.payments} cps={data.cps} goCrm={goCrm} reload={reload} notificationsReadAt={data.notificationsReadAt} />
          ) : null}
          {view === "help" ? <Help /> : null}
          {view === "builder" ? <BuilderPage initialPageUid={builderPageUid} /> : null}
          {view === "mypages" ? <MyPagesPage /> : null}
          {view === "workflows" ? <WorkflowsPage /> : null}
          {view === "collections" ? <CollectionsPage /> : null}
          {view === "audit" ? <AuditPage /> : null}
          {view === "aistaff" ? <AIStaffPage /> : null}
          {view === "settings" ? (
            <SettingsPage theme={resolvedTheme} setTheme={(t) => setThemeMode(t)} reload={reload}
              customers={data?.customers ?? []} notes={data?.notes ?? []} customFields={data?.customFields ?? []} />
          ) : null}
        </Suspense>
        {!data && view !== "help" && view !== "settings" ? (
          <p style={{ padding: 24, color: "var(--text-muted)" }}>正在加载数据…</p>
        ) : null}
      </LayoutFrame>

      {/* 浮层（在 LayoutFrame 外，不被布局裁剪） */}
      <QuickCapture open={showQuick} onClose={() => setShowQuick(false)} reload={reload} customers={data?.customers ?? []} />
      {flowForm ? (
        <Modal title={flowForm.id ? "编辑记录" : "新增记录"} onClose={() => setFlowForm(null)}
          footer={<><Btn kind="ghost" onClick={() => setFlowForm(null)}>取消</Btn></>}>
          <FormBlock store={flowForm.store} recordId={flowForm.id}
            onClose={() => setFlowForm(null)}
            notify={(m) => toast.show(m, undefined)} />
        </Modal>
      ) : null}
      {flowDetail ? (
        <Modal title="记录详情" onClose={() => setFlowDetail(null)}
          footer={<><Btn kind="ghost" onClick={() => setFlowDetail(null)}>关闭</Btn></>}>
          <DetailsBlock store={flowDetail.store} recordId={flowDetail.id} />
        </Modal>
      ) : null}
      {showOnboard ? (
        <Onboarding onDone={async () => { setShowOnboard(false); await seedIfEmpty(); await seedExtraIfEmpty(); await reload(); }} />
      ) : null}
      {updateVer !== null ? (
        <Modal title="发现新版本" onClose={() => setUpdateVer(null)}
          footer={<><Btn kind="ghost" sm onClick={() => setUpdateVer(null)}>稍后再说</Btn><Btn kind="primary" sm onClick={() => { setUpdateVer(null); window.mta?.installUpdate(); }}>立即重启更新</Btn></>}>
          <p>已发现新版本 v{updateVer}，重启后将自动完成更新。</p>
        </Modal>
      ) : null}
      <AIAssistant currentPage={view} />
      {toast.node}
    </>
  );
}

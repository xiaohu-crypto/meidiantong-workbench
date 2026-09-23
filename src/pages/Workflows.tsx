/* ===== 工作流管理页面（复刻NocoBase Workflow管理）=====
 * 列出已注册工作流：启用/停用、查看配置、手动执行、执行记录。
 */

import { useCallback, useEffect, useState } from "react";
import { useT } from "../core/i18n/useT";
import { Btn, Chip, Field, Modal } from "../ui/common";
import { engine } from "../core/flow/engine";
import type { FlowDef } from "../core/flow/flow";
import { stepRegistry } from "../core/flow/step";
import { setupBuiltinWorkflows, runTimerFlow } from "../core/workflow/triggers";

interface RunRecord {
  uid: string;
  ts: number;
  ok: boolean;
  error?: string;
  durationMs: number;
}

const RUNS_KEY = "wfRuns";

export default function WorkflowsPage() {
  const t = useT();
  const [flows, setFlows] = useState<FlowDef[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [detail, setDetail] = useState<FlowDef | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setupBuiltinWorkflows();
    setFlows(engine.listAutoFlows());
    const { db } = await import("../db/db");
    const stored = await db.getSetting<RunRecord[]>(RUNS_KEY, []);
    setRuns(stored);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  function toggle(uid: string) {
    setFlows((prev) => {
      const next = prev.map((f) => (f.uid === uid ? { ...f, enabled: f.enabled === false } : f));
      // 同步engine
      const flow = next.find((f) => f.uid === uid);
      if (flow) {
        if (flow.enabled === false) engine.unregisterAutoFlow(uid);
        else engine.registerAutoFlow(flow);
      }
      return next;
    });
  }

  async function runManual(flow: FlowDef) {
    const result = await engine.run(flow, {
      notify: (m, k) => showRun(m, k),
      params: { now: Date.now() },
    });
    await addRun({ uid: flow.uid, ts: Date.now(), ok: result.ok, error: result.error, durationMs: result.durationMs });
  }

  async function runTimer(flow: FlowDef) {
    await runTimerFlow(flow);
    await addRun({ uid: flow.uid, ts: Date.now(), ok: true, durationMs: 0 });
  }

  async function addRun(rec: RunRecord) {
    const { db } = await import("../db/db");
    const next = [rec, ...runs].slice(0, 30);
    setRuns(next);
    await db.setSetting(RUNS_KEY, next);
  }

  function showRun(msg: string, kind?: "ok" | "err" | "info") {
    // 通过全局Flow事件通知（App已桥接toast）
    engine.emitEvent({ type: "notify", payload: { text: msg, kind } });
  }

  const triggerLabel = (f: FlowDef) => {
    switch (f.event) {
      case "recordCreated": return "记录创建时";
      case "recordUpdated": return "记录更新时";
      case "recordDeleted": return "记录删除时";
      case "timer": return `定时（每${Number(f.trigger?.intervalHours ?? 6)}小时）`;
      case "manual": return "手动触发";
      default: return f.event;
    }
  };

  return (
    <div className="page page-workflows">
      <div className="h-row">
        <span className="h-title">{t("workflow.title")}</span>
        <Chip kind="data">自动化业务规则</Chip>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>{t("workflow.desc")}</p>

      <div className="wf-list">
        {flows.map((f) => (
          <div key={f.uid} className="wf-card">
            <div className="wf-card-head">
              <span className="wf-name">{f.name}</span>
              <Chip kind={f.enabled === false ? "gray" : "green"}>{f.enabled === false ? "已停用" : "已启用"}</Chip>
            </div>
            <div className="wf-meta">
              <span className="wf-trigger">{triggerLabel(f)}</span>
              {f.trigger?.store ? <span className="wf-store">监听：{String(f.trigger.store)}</span> : null}
              <span className="wf-steps">{f.steps.length} 个步骤</span>
            </div>
            <div className="wf-actions">
              <Btn sm onClick={() => setDetail(f)}>查看配置</Btn>
              {f.event === "timer" ? (
                <Btn sm kind="data" onClick={() => void runTimer(f)}>立即执行</Btn>
              ) : (
                <Btn sm kind="data" onClick={() => void runManual(f)}>手动执行</Btn>
              )}
              <Btn sm kind={f.enabled === false ? "primary" : "ghost"} onClick={() => toggle(f.uid)}>
                {f.enabled === false ? "启用" : "停用"}
              </Btn>
            </div>
          </div>
        ))}
      </div>

      <div className="h-row" style={{ marginTop: 24 }}>
        <span className="h-title">执行记录</span>
        <Btn sm onClick={() => setCreating(true)}>新建工作流</Btn>
      </div>
      <div className="wf-runs">
        {runs.length === 0 ? <p className="muted">暂无执行记录</p> : null}
        {runs.map((r, i) => (
          <div key={i} className="wf-run">
            <span className={"wf-run-dot " + (r.ok ? "ok" : "err")} />
            <span className="wf-run-name">{flows.find((f) => f.uid === r.uid)?.name ?? r.uid}</span>
            <span className="wf-run-time">{new Date(r.ts).toLocaleString("zh-CN")}</span>
            <span className="wf-run-result">{r.ok ? "成功" : "失败"}</span>
            {r.error ? <span className="wf-run-err">{r.error}</span> : null}
          </div>
        ))}
      </div>

      {detail ? (
        <Modal title={detail.name} onClose={() => setDetail(null)}
          footer={<><Btn onClick={() => setDetail(null)}>关闭</Btn></>}>
          <div className="wf-detail">
            <div className="wf-detail-row"><span>触发：</span><b>{triggerLabel(detail)}</b></div>
            {detail.trigger?.store ? <div className="wf-detail-row"><span>监听：</span><b>{String(detail.trigger.store)}</b></div> : null}
            <div className="wf-detail-title">步骤拓扑（双模自适应 SVG 连线）：</div>
            {/* P1 Finexy 工作流 SVG 连线:贝塞尔曲线 + 双模变色 + 触发时流动高亮 */}
            <div className="wf-canvas">
              <WorkflowCanvasSteps steps={detail.steps} running={false} />
            </div>
          </div>
        </Modal>
      ) : null}

      {creating ? (
        <CreateWorkflowModal onClose={() => setCreating(false)} onCreated={async () => { setCreating(false); await refresh(); }} />
      ) : null}
    </div>
  );
}

/** 新建工作流：简单JSON配置（复用现有Step） */
function CreateWorkflowModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const t = useT();
  const [name, setName] = useState("");
  const [event, setEvent] = useState<FlowDef["event"]>("manual");
  const [store, setStore] = useState("customers");
  const [stepUse, setStepUse] = useState("notify");
  const [stepText, setStepText] = useState("操作完成");
  const [busy, setBusy] = useState(false);

  const stepTypes = stepRegistry.list().filter((s) => s !== "http" && s !== "calculate");

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const flow: FlowDef = {
        uid: "wf-" + Date.now().toString(36),
        name,
        event,
        trigger: event === "recordCreated" || event === "recordUpdated" || event === "recordDeleted" ? { store } : event === "timer" ? { intervalHours: 6 } : undefined,
        enabled: true,
        steps: [
          { name: "s1", use: stepUse, params: stepUse === "notify" ? { text: stepText } : stepUse === "createRecord" ? { store, data: {} } : {} },
        ],
      };
      engine.registerAutoFlow(flow);
      await onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="新建工作流" onClose={onClose}
      footer={<><Btn onClick={onClose}>{t("common.cancel")}</Btn><Btn kind="primary" disabled={busy} onClick={() => void create()}>创建</Btn></>}>
      <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label="工作流名称">
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：新客户自动欢迎" />
        </Field>
        <Field label="触发条件">
          <select className="inp" value={event} onChange={(e) => setEvent(e.target.value as FlowDef["event"])}>
            <option value="manual">手动触发</option>
            <option value="recordCreated">记录创建时</option>
            <option value="recordUpdated">记录更新时</option>
            <option value="timer">定时触发（每6小时）</option>
          </select>
        </Field>
        {event !== "manual" && event !== "timer" ? (
          <Field label="监听模型">
            <select className="inp" value={store} onChange={(e) => setStore(e.target.value)}>
              {["customers", "deals", "contracts", "payments", "tasks", "notes"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label="执行动作">
          <select className="inp" value={stepUse} onChange={(e) => setStepUse(e.target.value)}>
            {stepTypes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        {stepUse === "notify" ? (
          <Field label="通知内容">
            <input className="inp" value={stepText} onChange={(e) => setStepText(e.target.value)} />
          </Field>
        ) : null}
      </div>
    </Modal>
  );
}

/**
 * P1 Finexy 工作流 SVG 连线渲染器(方案四)。
 * 把 FlowDef.steps 线性排成节点卡片,用 SVG 三次贝塞尔曲线连接相邻节点;
 * 连线颜色绑定 var(--border) / var(--brand),切换深浅色自动变色;
 * running=true 时连线叠加流动 dash 动画(对齐方案 @keyframes workflow-flow-dash)。
 */
function WorkflowCanvasSteps({ steps, running }: { steps: FlowDef["steps"]; running: boolean }) {
  const W = 480; // 画布逻辑宽
  const NODE_W = 200; // 节点卡片宽
  const NODE_H = 54;  // 节点卡片高
  const GAP = 60;     // 相邻节点水平间距
  const topPad = 12;

  const nodeX = (i: number) => topPad + i * (NODE_W + GAP);
  const nodeY = topPad;
  const cx = (i: number) => nodeX(i) + NODE_W; // 节点右侧锚点(水平居中连线)

  return (
    <div className="wf-canvas-inner" style={{ position: "relative" }}>
      {/* 节点卡片(绝对定位,与 SVG 对齐) */}
      {steps.map((s, i) => (
        <div key={i} className={"wf-canvas-node" + (i === steps.length - 1 ? " last" : "")}
          style={{ left: nodeX(i), top: nodeY, width: NODE_W }}>
          <span className="wf-canvas-idx">{i + 1}</span>
          <div className="wf-canvas-body">
            <b>{stepRegistry.has(s.use) ? s.use : "未注册"}</b>
            {s.params ? <small>{JSON.stringify(s.params).slice(0, 40)}</small> : null}
          </div>
        </div>
      ))}
      {/* SVG 连线层(双模自适应 + 触发流动) */}
      {steps.length >= 2 ? (
        <svg className="wf-canvas-svg" width={W} height={NODE_H + topPad * 2} viewBox={`0 0 ${W} ${NODE_H + topPad * 2}`}>
          {Array.from({ length: steps.length - 1 }).map((_, i) => {
            const x1 = cx(i);
            const y1 = nodeY + NODE_H / 2;
            const x2 = nodeX(i + 1);
            const y2 = y1;
            const cpx = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`;
            return (
              <g key={i}>
                {/* 底层连线:绑定 var(--border),切换深浅色自动变色 */}
                <path d={d} fill="none" stroke="var(--border)" strokeWidth={2}
                  style={{ transition: "stroke .3s ease" }} />
                {/* 触发流动上层:running 时亮 var(--brand) + dash 流动动画 */}
                {running ? (
                  <path d={d} fill="none" stroke="var(--brand)" strokeWidth={2.5}
                    strokeDasharray="6 4" className="wf-canvas-dash" />
                ) : null}
                {/* 节点间箭头 */}
                <circle cx={x2} cy={y2} r={3} fill={running ? "var(--brand)" : "var(--ink-3)"} />
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}

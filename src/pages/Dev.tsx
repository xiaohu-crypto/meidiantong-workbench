import { useState, useMemo, useRef } from "react";
import type { Contract, Payment, Customer } from "../types";
import { Btn, Chip, Field, Modal, money, uid, useToast } from "../ui/common";
import { PageActionBar } from "../components/ui/PageActionBar";
import { db } from "../db/db";

interface Props {
  contracts: Contract[];
  payments: Payment[];
  customers: Customer[];
  reload: () => Promise<void>;
}

export default function Dev({ contracts = [], payments = [], customers = [], reload }: Props) {
  const [tab, setTab] = useState<"contracts" | "payments" | "pending">("contracts");
  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({ customerId: "", name: "", amount: "", signDate: new Date().toISOString().slice(0, 10) });
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "未知客户";

  const stats = useMemo(() => {
    const total = contracts.reduce((s, c) => s + c.amount, 0);
    const received = payments.filter((p) => p.status === "已收").reduce((s, p) => s + p.amount, 0);
    const pending = total - received;
    const expiring = payments.filter((p) => {
      const d = new Date(p.dueDate);
      const diff = (d.getTime() - Date.now()) / 86400000;
      return diff > 0 && diff < 30 && p.status !== "已收";
    }).length;
    return { total, received, pending, expiring };
  }, [contracts, payments]);

  const pendingList = useMemo(
    () => payments.filter((p) => p.status !== "已收").sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [payments]
  );

  /* ── 新建合同 ── */
  async function createContract() {
    const amount = Number(form.amount);
    if (!form.customerId || !form.name.trim() || !amount || amount <= 0) {
      toast.show("请填写客户、合同名称和正确金额");
      return;
    }
    await db.put<Contract>("contracts", {
      id: uid("ct"),
      customerId: form.customerId,
      name: form.name.trim(),
      amount,
      signDate: form.signDate,
      status: "履行中",
    }, "新建合同");
    // 自动建一条待回款计划
    const due = new Date(); due.setDate(due.getDate() + 30);
    await db.put<Payment>("payments", {
      id: uid("pay"),
      contractId: "",
      customerId: form.customerId,
      amount,
      dueDate: due.toISOString().slice(0, 10),
      status: "未到",
    }, "新建回款计划");
    toast.show("合同与回款计划已创建");
    setShowNew(false);
    setForm({ customerId: "", name: "", amount: "", signDate: new Date().toISOString().slice(0, 10) });
    await reload();
  }

  /* ── 导出 CSV ── */
  function exportCsv() {
    const rows = [
      ["类型", "名称", "客户", "金额", "日期", "状态"],
      ...contracts.map((c) => ["合同", c.name, customerName(c.customerId), String(c.amount), c.signDate, c.status]),
      ...payments.map((p) => ["回款", customerName(p.customerId), "", String(p.amount), p.dueDate, p.status]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `合同台账_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.show("已导出 CSV");
  }

  /* ── 导入 CSV：合同名称,客户名,金额,签订日 ── */
  async function importCsv(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(1); // 跳过表头
    let ok = 0;
    for (const line of lines) {
      const cols = line.split(/[,，\t]/).map((c) => c.replace(/^"|"$/g, "").trim());
      const [name, cName, amt, signDate] = cols;
      if (!name || !amt) continue;
      const cust = customers.find((c) => c.name === cName);
      if (!cust) continue;
      await db.put<Contract>("contracts", {
        id: uid("ct"), customerId: cust.id, name, amount: Number(amt) || 0,
        signDate: signDate || new Date().toISOString().slice(0, 10), status: "履行中",
      });
      ok++;
    }
    toast.show(ok ? `已导入 ${ok} 份合同` : "未匹配到可导入行（需含客户名列）");
    await reload();
  }

  /* ── 登记回款 ── */
  async function markPaid(p: Payment) {
    await db.put<Payment>("payments", { ...p, status: "已收", paidDate: new Date().toISOString().slice(0, 10) }, "登记回款");
    toast.show(`已登记回款 ${money(p.amount)}`);
    await reload();
  }

  const detail = detailId ? contracts.find((c) => c.id === detailId) : null;
  const detailPayments = detail ? payments.filter((p) => p.customerId === detail.customerId) : [];

  return (
    <div style={{ padding: "20px 24px" }}>
      <PageActionBar
        title="合同与台账" subtitle="合同管理 · 回款台账 · 待回款监控"
        onNew={() => setShowNew(true)}
        onImport={() => fileRef.current?.click()}
        onExport={exportCsv}
        onRefresh={() => { void reload(); toast.show("已刷新"); }}
      />
      <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ""; }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "合同总额", value: money(stats.total), color: "var(--text-primary)" },
          { label: "已回款", value: money(stats.received), color: "var(--status-success)" },
          { label: "待回款", value: money(stats.pending), color: stats.pending > 0 ? "var(--status-danger)" : "var(--text-primary)" },
          { label: "30天内到期", value: `${stats.expiring} 笔`, color: "var(--status-pending)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 20, border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "ui-monospace,monospace", marginTop: 6, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)", marginBottom: 16 }}>
        {[
          { id: "contracts" as const, label: `合同列表 (${contracts.length})` },
          { id: "payments" as const, label: `回款台账 (${payments.length})` },
          { id: "pending" as const, label: `待回款 (${pendingList.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 900 : 600, borderBottom: tab === t.id ? "2px solid var(--brand-primary)" : "2px solid transparent", color: tab === t.id ? "var(--brand-primary)" : "var(--text-secondary)", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contracts" ? (
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["合同名称", "客户", "金额", "签订日", "状态", "操作"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{customerName(c.customerId)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, fontFamily: "ui-monospace,monospace", color: "var(--text-primary)" }}>{money(c.amount)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)" }}>{c.signDate}</td>
                  <td style={{ padding: "12px 16px" }}><Chip kind="green">{c.status || "履行中"}</Chip></td>
                  <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                    <Btn kind="ghost" sm onClick={() => setDetailId(c.id)}>查看</Btn>
                    <Btn kind="ghost" sm onClick={() => { void db.softDelete("contracts", c.id, "删除合同"); toast.show("已删除（回收站可恢复）"); void reload(); }}>删除</Btn>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>暂无合同，点右上角「+ 新建」开始</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "payments" ? (
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["到期日", "客户", "金额", "状态", "操作"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)" }}>{p.dueDate}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{customerName(p.customerId)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, fontFamily: "ui-monospace,monospace", color: "var(--text-primary)" }}>{money(p.amount)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Chip kind={p.status === "已收" ? "green" : p.status === "逾期" ? "danger" : "warn"}>{p.status}</Chip>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.status !== "已收" ? (
                      <Btn kind="primary" sm onClick={() => void markPaid(p)}>登记回款</Btn>
                    ) : <span style={{ fontSize: 11, color: "var(--text-muted)" }}>已收讫</span>}
                  </td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>暂无回款记录</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "pending" ? (
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
          {pendingList.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>🎉 没有待回款，全部收讫</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["到期日", "客户", "金额", "状态", "操作"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingList.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)" }}>{p.dueDate}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{customerName(p.customerId)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, fontFamily: "ui-monospace,monospace" }}>{money(p.amount)}</td>
                    <td style={{ padding: "12px 16px" }}><Chip kind={p.status === "逾期" ? "danger" : "warn"}>{p.status}</Chip></td>
                    <td style={{ padding: "12px 16px" }}><Btn kind="primary" sm onClick={() => void markPaid(p)}>登记回款</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {/* 新建合同弹窗 */}
      {showNew && (
        <Modal title="新建合同" onClose={() => setShowNew(false)}
          footer={<><Btn kind="ghost" onClick={() => setShowNew(false)}>取消</Btn><Btn kind="primary" onClick={() => void createContract()}>创建</Btn></>}>
          <Field label="客户">
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-app)" }}>
              <option value="">请选择客户</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="合同名称">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：云裳服饰 全年框架"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-app)" }} />
          </Field>
          <Field label="金额（元）">
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="如 1200000"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-app)" }} />
          </Field>
          <Field label="签订日">
            <input type="date" value={form.signDate} onChange={(e) => setForm({ ...form, signDate: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-app)" }} />
          </Field>
        </Modal>
      )}

      {/* 合同详情弹窗 */}
      {detail && (
        <Modal title="合同详情" onClose={() => setDetailId(null)}
          footer={<Btn kind="ghost" onClick={() => setDetailId(null)}>关闭</Btn>}>
          <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
            <div><b>名称：</b>{detail.name}</div>
            <div><b>客户：</b>{customerName(detail.customerId)}</div>
            <div><b>金额：</b><span style={{ fontFamily: "ui-monospace,monospace", fontWeight: 800 }}>{money(detail.amount)}</span></div>
            <div><b>签订日：</b>{detail.signDate}</div>
            <div><b>状态：</b><Chip kind="green">{detail.status || "履行中"}</Chip></div>
            <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />
            <div style={{ fontWeight: 800 }}>关联回款计划（{detailPayments.length}）</div>
            {detailPayments.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 12 }}>无回款记录</div> : detailPayments.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                <span>{p.dueDate} · {money(p.amount)}</span>
                <Chip kind={p.status === "已收" ? "green" : p.status === "逾期" ? "danger" : "warn"}>{p.status}</Chip>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {toast.node}
    </div>
  );
}

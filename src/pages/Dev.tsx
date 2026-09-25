import { useState, useMemo } from "react";
import type { Contract, Payment, Customer } from "../types";
import { Btn, Chip, money, useToast } from "../ui/common";
import { PageActionBar } from "../components/ui/PageActionBar";

interface Props {
  contracts: Contract[];
  payments: Payment[];
  customers: Customer[];
  reload: () => void;
}

export default function Dev({ contracts = [], payments = [], customers = [] }: Partial<Props>) {
  const [tab, setTab] = useState<"contracts" | "payments" | "pending">("contracts");
  const toast = useToast();

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "未知";

  const stats = useMemo(() => {
    const total = contracts.reduce((s, c) => s + c.amount, 0);
    const received = payments.reduce((s, p) => s + p.amount, 0);
    const pending = total - received;
    const expiring = contracts.filter((c) => {
      const d = new Date(c.endDate);
      const diff = (d.getTime() - Date.now()) / 86400000;
      return diff > 0 && diff < 30;
    }).length;
    return { total, received, pending, expiring };
  }, [contracts, payments]);

  return (
    <div style={{ padding: "20px 24px" }}>
      <PageActionBar title="合同与台账" subtitle="合同管理 · 回款台账 · 待回款监控" onNew={() => toast("新建合同")} onImport={() => toast("导入")} onExport={() => toast("导出")} onRefresh={() => toast("刷新")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "合同总额", value: money(stats.total), color: "var(--text-primary)" },
          { label: "已回款", value: money(stats.received), color: "var(--status-success)" },
          { label: "待回款", value: money(stats.pending), color: stats.pending > 0 ? "var(--status-danger)" : "var(--text-primary)" },
          { label: "30天内到期", value: `${stats.expiring} 份`, color: "var(--status-pending)" },
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
          { id: "pending" as const, label: "待回款" },
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
                {["合同编号", "客户", "金额", "签订日", "到期日", "状态", "操作"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{c.code ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{customerName(c.customerId)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, fontFamily: "ui-monospace,monospace", color: "var(--text-primary)" }}>{money(c.amount)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)" }}>{c.startDate}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)" }}>{c.endDate}</td>
                  <td style={{ padding: "12px 16px" }}><Chip kind="success">履行中</Chip></td>
                  <td style={{ padding: "12px 16px" }}><Btn kind="ghost" sm onClick={() => toast("查看详情")}>查看</Btn></td>
                </tr>
              ))}
              {contracts.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>暂无合同</td></tr>
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
                {["日期", "客户", "金额", "类型", "状态"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)" }}>{p.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{customerName(p.customerId)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, fontFamily: "ui-monospace,monospace", color: "var(--text-primary)" }}>{money(p.amount)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-secondary)" }}>{p.type ?? "回款"}</td>
                  <td style={{ padding: "12px 16px" }}><Chip kind="success">已到账</Chip></td>
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
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>待回款明细</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            合同总额: <b>{money(stats.total)}</b> · 已回款: <b style={{ color: "var(--status-success)" }}>{money(stats.received)}</b> · 待回款: <b style={{ color: "var(--status-danger)" }}>{money(stats.pending)}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
}
import { db } from "../db/db";
import type { ContactPoint, Customer, Payment } from "../types";
import { payNotifyAt, staleNotifyAt } from "../core/derive";
import { Btn, Chip, money, useToast } from "../ui/common";

// TODO(P1-17): 顶栏铃铛当前为路由跳转本页,后续改为下拉弹层预览(需改 App.tsx 布局,本批次不做)

interface Props {
  customers: Customer[]; payments: Payment[]; cps: ContactPoint[];
  goCrm: (id: string) => void; reload: () => Promise<void>; notificationsReadAt: number;
}

export default function Notifications(props: Props) {
  const { show, node } = useToast();

  const overduePays = props.payments.filter((p) => p.status === "逾期" && !p.deletedAt && payNotifyAt(p) > props.notificationsReadAt);
  const STALE_DAYS = 14;
  const staleCustomers = props.customers.filter((c) => {
    if (c.deletedAt) return false;
    const last = props.cps.filter((cp) => cp.customerId === c.id && !cp.deletedAt).sort((a, b) => b.time - a.time)[0];
    return !!last && Date.now() - last.time > STALE_DAYS * 86400000 && staleNotifyAt(last.time) > props.notificationsReadAt;
  });

  const custName = (id: string) => props.customers.find((c) => c.id === id)?.name ?? "未知";

  return (
    <div>
      <div className="page-head">
        <div><h1>通知中心</h1><div className="date">逾期回款 · 跟进超期 · 待办汇总</div></div>
      </div>

      {overduePays.length === 0 && staleCustomers.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: "48px 16px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
          <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>所有通知已处理</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>有新通知时会在这里提醒你</div>
        </div>
      ) : (
      <div className="grid-c" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card card-pad">
          <div className="h-row" style={{ marginBottom: 8 }}>
            <span className="h-title sm">逾期回款({overduePays.length})</span>
            {overduePays.length > 0 ? <Chip kind="danger">需处理</Chip> : null}
          </div>
          {overduePays.map((p) => (
            <div className="alert-line" key={p.id}>
              <span className="txt">{custName(p.customerId)} · {money(p.amount)}</span>
              <span style={{ display: "inline-flex", gap: 6 }}>
                <span className="cell-sub num">到期 {p.dueDate}</span>
                <Btn kind="data" sm onClick={() => props.goCrm(p.customerId)}>去查看</Btn>
              </span>
            </div>
          ))}
          {overduePays.length === 0 ? <p className="muted">无逾期回款</p> : null}
        </div>

        <div className="card card-pad">
          <div className="h-row" style={{ marginBottom: 8 }}>
            <span className="h-title sm">跟进超期({staleCustomers.length})</span>
            {staleCustomers.length > 0 ? <Chip kind="warn">14天无接触</Chip> : null}
          </div>
          {staleCustomers.map((c) => (
            <div className="alert-line" key={c.id}>
              <span className="txt">{c.name}</span>
              <Btn kind="data" sm onClick={() => props.goCrm(c.id)}>去跟进</Btn>
            </div>
          ))}
          {staleCustomers.length === 0 ? <p className="muted">暂无超期客户</p> : null}
        </div>
      </div>
      )}

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="h-row" style={{ marginBottom: 8 }}>
          <span className="h-title sm">操作</span>
        </div>
        <Btn kind="ghost" onClick={() => { void (async () => {
          const readAt = Date.now();
          await db.setSetting("notificationsReadAt", readAt);
          await props.reload();
          show("已全部标记为已读", () => { void (async () => { await db.setSetting("notificationsReadAt", 0); await props.reload(); })(); });
        })(); }}>
          标记全部已读
        </Btn>
      </div>
      {node}
    </div>
  );
}

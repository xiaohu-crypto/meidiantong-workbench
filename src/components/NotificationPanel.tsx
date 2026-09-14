import { useEffect, useRef } from "react";
import { db } from "../db/db";
import type { ContactPoint, Customer, Payment } from "../types";
import { payNotifyAt, staleNotifyAt } from "../core/derive";
import { money } from "../ui/common";

interface NoticeItem {
  kind: "overdue" | "stale";
  id: string;
  title: string;
  sub: string;
  time: number;
}

interface Props {
  customers: Customer[];
  payments: Payment[];
  cps: ContactPoint[];
  notificationsReadAt: number;
  reload: () => Promise<void>;
  onClose: () => void;
  onViewAll: () => void;
}

const STALE_DAYS = 14;

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff <= 0) return "刚刚";
  const d = Math.floor(diff / 86400000);
  if (d >= 1) return `${d}天前`;
  const h = Math.floor(diff / 3600000);
  if (h >= 1) return `${h}小时前`;
  const m = Math.floor(diff / 60000);
  if (m >= 1) return `${m}分钟前`;
  return "刚刚";
}

export default function NotificationPanel(props: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // 点击弹层外部区域关闭（铃铛触发器带 data-notification-trigger，不算外部）
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (ref.current && ref.current.contains(t)) return;
      if (t.closest("[data-notification-trigger]")) return;
      props.onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [props.onClose]);

  const custName = (id: string) => props.customers.find((c) => c.id === id)?.name ?? "未知";

  // 通知列表：与 Notifications.tsx 页面过滤逻辑保持一致
  const overduePays = props.payments.filter(
    (p) => p.status === "逾期" && !p.deletedAt && payNotifyAt(p) > props.notificationsReadAt
  );
  const staleCustomers = props.customers.filter((c) => {
    if (c.deletedAt) return false;
    const last = props.cps
      .filter((cp) => cp.customerId === c.id && !cp.deletedAt)
      .sort((a, b) => b.time - a.time)[0];
    return !!last && Date.now() - last.time > STALE_DAYS * 86400000 && staleNotifyAt(last.time) > props.notificationsReadAt;
  });

  const items: NoticeItem[] = [];
  for (const p of overduePays) {
    items.push({
      kind: "overdue",
      id: p.id,
      title: custName(p.customerId),
      sub: `${money(p.amount)} · 到期 ${p.dueDate}`,
      time: payNotifyAt(p),
    });
  }
  for (const c of staleCustomers) {
    const last = props.cps
      .filter((cp) => cp.customerId === c.id && !cp.deletedAt)
      .sort((a, b) => b.time - a.time)[0];
    if (!last) continue;
    const days = Math.floor((Date.now() - last.time) / 86400000);
    items.push({
      kind: "stale",
      id: c.id,
      title: c.name,
      sub: `已 ${days} 天未跟进`,
      time: staleNotifyAt(last.time),
    });
  }
  items.sort((a, b) => b.time - a.time);
  if (items.length > 5) items.length = 5;

  const hasAny = items.length > 0;

  const markAllRead = async () => {
    await db.setSetting("notificationsReadAt", Date.now());
    await props.reload();
  };

  return (
    <div
      ref={ref}
      data-notification-panel
      style={{
        position: "absolute",
        bottom: "100%",
        right: 0,
        marginBottom: 8,
        width: 360,
        maxHeight: 400,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>通知</span>
        {hasAny ? (
          <button
            onClick={() => void markAllRead()}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand)",
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
            }}
          >
            标记全部已读
          </button>
        ) : null}
      </div>

      {/* 内容区 */}
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {!hasAny ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            所有通知已处理
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.kind + "-" + it.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 14px",
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>
                {it.kind === "overdue" ? "⚠️" : "👤"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink)",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                  {it.sub} · {relTime(it.time)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部 */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-soft)" }}>
        <button
          onClick={() => props.onViewAll()}
          style={{
            width: "100%",
            padding: "8px 0",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--ink)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          查看全部
        </button>
      </div>
    </div>
  );
}

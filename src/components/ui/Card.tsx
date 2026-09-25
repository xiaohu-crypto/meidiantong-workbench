// File: src/components/ui/Card.tsx
// Finexy v0.2.3 · 24px 大圆角 + p-9 空气悬浮
import type { ReactNode } from "react";

interface CardProps {
  children?: ReactNode;
  title?: ReactNode;
  extra?: ReactNode;
  className?: string;
  isDangerWip?: boolean;
}

export default function Card({
  children,
  title,
  extra,
  className = "",
  isDangerWip = false,
}: CardProps) {
  const hasHeader = title != null || extra != null;
  const surfaceClass = isDangerWip
    ? "border border-[color:var(--status-danger)] shadow-[0_0_24px_rgba(248,113,113,0.08)]"
    : "border border-[color:var(--border-subtle)] shadow-[var(--shadow-card)]";

  return (
    <section
      className={[
        "bg-[var(--bg-surface)] rounded-[var(--radius-xl)] p-9 transition-all duration-300",
        surfaceClass,
        className,
      ].join(" ")}
    >
      {hasHeader && (
        <header className="mb-6 flex items-center justify-between gap-4">
          {title != null && (
            <h3 className="text-sm font-black tracking-tight text-[color:var(--text-primary)]">
              {title}
            </h3>
          )}
          {extra != null && <div className="flex items-center gap-2">{extra}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

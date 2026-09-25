// File: src/components/ui/AtomComponents.tsx
// 原子组件统一导出（Finexy v0.2.3 · 24px 大圆角 + 空气悬浮阴影）
import React from "react";

/* ============================================================
   1. Card —— 悬浮容器卡片（WIP 超载红边光晕）
   ============================================================ */
export interface CardProps {
  children: React.ReactNode;
  title?: string;
  extra?: React.ReactNode;
  className?: string;
  isDangerWip?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  extra,
  className = "",
  isDangerWip = false,
}) => (
  <div
    className={`bg-[var(--bg-surface)] rounded-[var(--radius-xl)] p-9 border transition-all duration-300 ${
      isDangerWip
        ? "border-[var(--status-danger)] shadow-[0_0_24px_rgba(248,113,113,0.08)]"
        : "border-[var(--border-subtle)] shadow-[var(--shadow-card)]"
    } ${className}`}
  >
    {(title || extra) && (
      <div className="flex justify-between items-center mb-6">
        {title && (
          <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">
            {title}
          </h3>
        )}
        {extra && (
          <div className="text-xs text-[var(--text-secondary)] font-medium">{extra}</div>
        )}
      </div>
    )}
    {children}
  </div>
);

/* ============================================================
   2. Metric —— 断层式高反差数字卡
   ============================================================ */
export interface MetricTrend {
  value: string;
  isPositive: boolean;
  text: string;
}

export interface MetricProps {
  label: string;
  value: string;
  trend?: MetricTrend;
  variant?: "default" | "danger";
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  trend,
  variant = "default",
}) => (
  <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-[var(--radius-xl)] p-9 border border-[var(--border-subtle)] flex flex-col justify-between overflow-hidden">
    <div>
      <span className="text-[10px] font-extrabold tracking-wider text-[var(--text-secondary)] uppercase">
        {label}
      </span>
      <h2
        className={`text-4xl font-black font-mono tracking-tight mt-2 ${
          variant === "danger"
            ? "text-[var(--status-danger)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </h2>
    </div>
    {trend && (
      <div className="flex items-center gap-2 mt-5 text-[11px] font-bold">
        <span
          className={`px-2 py-0.5 rounded-[var(--radius-md)] font-mono ${
            trend.isPositive
              ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
              : "bg-[var(--status-danger-bg)] text-[var(--status-danger)]"
          }`}
        >
          {trend.value}
        </span>
        <span className="text-[var(--text-muted)] font-medium">{trend.text}</span>
      </div>
    )}
  </div>
);

/* ============================================================
   3. Button —— 去污染原子按钮
   ============================================================ */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-hover)] rounded-[var(--radius-lg)] shadow-sm",
    secondary:
      "bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-subtle)] rounded-[var(--radius-lg)]",
    ghost:
      "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)]",
  };
  const sizes = {
    sm: "text-[10px] px-3 py-2",
    md: "text-xs px-5 py-3",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

/* ============================================================
   4. StatusPill —— 呼吸状态胶囊
   ============================================================ */
export interface StatusPillProps {
  type: "success" | "pending" | "danger";
  text: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ type, text }) => {
  const colorMap = {
    success: "bg-[var(--status-success-bg)] text-[var(--status-success)]",
    pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending)]",
    danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
  } as const;
  const dotMap = {
    success: "bg-[var(--status-success)]",
    pending: "bg-[var(--status-pending)]",
    danger: "bg-[var(--status-danger)]",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${colorMap[type]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotMap[type]}`} />
      {text}
    </span>
  );
};

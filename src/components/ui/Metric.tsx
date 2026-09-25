// File: src/components/ui/Metric.tsx
// Finexy v0.2.3 · 断层式大字阶 text-4xl + p-9

interface Trend {
  value: string;
  isPositive: boolean;
  text?: string;
}

interface MetricProps {
  label: string;
  value: string;
  trend?: Trend;
  variant?: "default" | "danger";
  className?: string;
}

export default function Metric({
  label,
  value,
  trend,
  variant = "default",
  className = "",
}: MetricProps) {
  const isDanger = variant === "danger";
  const trendUp = Boolean(trend && trend.isPositive);

  return (
    <div
      className={[
        "group overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)]",
        "bg-[var(--bg-surface)] p-9 shadow-[var(--shadow-card)] flex flex-col justify-between",
        className,
      ].join(" ")}
    >
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--text-secondary)]">
          {label}
        </p>
        <p
          className={[
            "mt-2 font-mono text-4xl font-black tracking-tight tabular-nums",
            isDanger
              ? "text-[color:var(--status-danger)]"
              : "text-[color:var(--text-primary)]",
          ].join(" ")}
        >
          {value}
        </p>
      </div>

      {trend && (
        <div className="mt-5 flex items-center gap-2 text-[11px] font-bold">
          <span
            className={[
              "inline-flex items-center rounded-[var(--radius-md)] px-2 py-0.5 font-mono",
              trendUp
                ? "bg-[var(--status-success-bg)] text-[color:var(--status-success)]"
                : "bg-[var(--status-danger-bg)] text-[color:var(--status-danger)]",
            ].join(" ")}
          >
            {trend.value}
          </span>
          {trend.text && (
            <span className="font-medium text-[color:var(--text-muted)]">{trend.text}</span>
          )}
        </div>
      )}
    </div>
  );
}

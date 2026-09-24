// File: src/components/ui/Metric.tsx

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

/**
 * 高密度数字指标卡。
 * @param label   指标名（如：在途商机）
 * @param value   主数值（等宽字体渲染，如：¥461,000）
 * @param trend   趋势对象 { value: '12.3%', isPositive: boolean, text: '较上周' }
 * @param variant danger 时数值强制使用状态红
 */
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
        "rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)]",
        "bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </p>

      <p
        className={[
          "mt-2 font-mono text-3xl font-bold tracking-tight tabular-nums",
          isDanger
            ? "text-[color:var(--status-danger)]"
            : "text-[color:var(--text-primary)]",
        ].join(" ")}
      >
        {value}
      </p>

      {trend && (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span
            className={[
              "text-xs font-semibold",
              trendUp
                ? "text-[color:var(--status-success)]"
                : "text-[color:var(--status-danger)]",
            ].join(" ")}
          >
            {trendUp ? "↑" : "↓"} {trend.value}
          </span>
          {trend.text && (
            <span className="text-xs text-[color:var(--text-muted)]">{trend.text}</span>
          )}
        </div>
      )}
    </div>
  );
}

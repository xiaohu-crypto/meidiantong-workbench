// File: src/components/ui/StatusPill.tsx

type StatusType = "success" | "pending" | "danger";

interface StatusPillProps {
  type?: StatusType;
  text: string;
  className?: string;
}

const TYPE_CLASSES: Record<StatusType, string> = {
  success: "bg-[var(--status-success-bg)] text-[color:var(--status-success)]",
  pending: "bg-[var(--status-pending-bg)] text-[color:var(--status-pending)]",
  danger: "bg-[var(--status-danger-bg)] text-[color:var(--status-danger)]",
};

/**
 * 微光状态标签：状态色胶囊 + 前端 neon 呼吸圆点。
 * 圆点使用 currentColor + box-shadow 呼吸动画，颜色随状态自动匹配。
 */
export default function StatusPill({
  type = "pending",
  text,
  className = "",
}: StatusPillProps) {
  const tone = TYPE_CLASSES[type];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        tone,
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="status-dot h-1.5 w-1.5 rounded-full bg-current"
      />
      {text}
    </span>
  );
}

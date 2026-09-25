// File: src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-hover)] shadow-sm active:scale-[0.97]",
  /* 次级高频按钮：常规透明无噪，悬停触发品牌色微光晕开 */
  secondary:
    "bg-transparent text-[color:var(--text-secondary)] border border-[color:var(--border-subtle)] hover:border-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary)] hover:bg-[var(--brand-subtle)] active:scale-[0.97]",
  ghost:
    "bg-transparent text-[color:var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[color:var(--text-primary)] rounded-[var(--radius-md)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "text-[10px] px-3 py-2",
  md: "text-xs px-5 py-3",
};

/**
 * 规范化交互按钮：primary（珊瑚橙主操作）/ secondary（透明+悬停光晕）/ ghost 三档，
 * sm / md 两档尺寸，自带键盘焦点环与禁用态。
 */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-1.5 select-none whitespace-nowrap font-bold tracking-tight",
    "rounded-[var(--radius-lg)] transition-all duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)]",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(" ");

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}

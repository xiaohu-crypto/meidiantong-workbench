// File: src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-hover)]",
  secondary:
    "bg-[var(--bg-muted)] text-[color:var(--text-primary)] border border-[color:var(--border-subtle)] hover:bg-[color:var(--border-subtle)]",
  ghost:
    "bg-transparent text-[color:var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[color:var(--text-primary)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

/**
 * 规范化交互按钮：primary（珊瑚橙主操作）/ secondary / ghost 三档，
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
    "inline-flex items-center justify-center gap-1.5 select-none whitespace-nowrap",
    "rounded-[var(--radius-lg)] font-medium",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)]",
    "disabled:cursor-not-allowed disabled:opacity-45",
    "active:opacity-80",
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

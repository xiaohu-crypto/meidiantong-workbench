// File: src/components/ui/Card.tsx
import type { ReactNode } from "react";

interface CardProps {
  children?: ReactNode;
  title?: ReactNode;
  extra?: ReactNode;
  className?: string;
}

/**
 * 基础容器卡片：单层 surface 面板，带可选标题栏（title / extra）。
 * 全部外观由 CSS 变量驱动，主题切换时背景、边框、阴影同步过渡。
 */
export default function Card({ children, title, extra, className = "" }: CardProps) {
  const hasHeader = title != null || extra != null;

  return (
    <section
      className={[
        "border border-[color:var(--border-subtle)] bg-[var(--bg-surface)]",
        "rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)]",
        className,
      ].join(" ")}
    >
      {hasHeader && (
        <header className="mb-4 flex items-center justify-between gap-4">
          {title != null && (
            <h3 className="text-sm font-semibold text-[color:var(--text-secondary)]">
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

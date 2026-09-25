import React from "react";
import { Btn } from "../../ui/common";

interface PageActionBarProps {
  title: string;
  subtitle?: string;
  onNew?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

/** 统一页面顶部操作栏：标题 + 导入导出新建按钮 */
export const PageActionBar: React.FC<PageActionBarProps> = ({ title, subtitle, onNew, onImport, onExport, onRefresh }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "4px 0 0 0", fontWeight: 600 }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {onRefresh && <Btn kind="ghost" sm onClick={onRefresh}>刷新</Btn>}
        {onImport && <Btn kind="ghost" sm onClick={onImport}>导入</Btn>}
        {onExport && <Btn kind="ghost" sm onClick={onExport}>导出</Btn>}
        {onNew && <Btn kind="primary" sm onClick={onNew}>+ 新建</Btn>}
      </div>
    </div>
  );
};
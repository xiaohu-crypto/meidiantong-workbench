/* ===== Builder 组件面板（复刻NocoBase Builder Palette）=====
 * 列出可拖拽到画布的Block类型。
 */

import { useT } from "../../core/i18n/useT";

export interface PaletteItem {
  use: string;
  label: string;
  icon: string;
  /** 默认props */
  defaults: Record<string, unknown>;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { use: "TableBlock", label: "表格区块", icon: "📋", defaults: { store: "customers", title: "", pageSize: 20, editable: true } },
  { use: "FormBlock", label: "表单区块", icon: "📝", defaults: { store: "customers" } },
  { use: "KanbanBlock", label: "看板区块", icon: "🗂️", defaults: { store: "deals", groupField: "stage", titleField: "title", amountField: "value" } },
  { use: "DetailsBlock", label: "详情区块", icon: "🔍", defaults: { store: "customers" } },
  { use: "ListBlock", label: "列表区块", icon: "📄", defaults: { store: "notes", titleField: "title" } },
  { use: "CalendarBlock", label: "日历区块", icon: "📅", defaults: { store: "scheduleItems", dateField: "start", titleField: "name" } },
  { use: "MarkdownBlock", label: "图文区块", icon: "📌", defaults: { content: "## 说明\n在此输入图文内容", title: "" } },
];

interface PaletteProps {
  onAdd: (item: PaletteItem) => void;
}

export function Palette({ onAdd }: PaletteProps) {
  const t = useT();
  return (
    <div className="builder-palette">
      <div className="builder-panel-title">{t("builder.palette")}</div>
      {PALETTE_ITEMS.map((item) => (
        <div key={item.use} className="palette-item"
          draggable
          onDragStart={(e) => { e.dataTransfer.setData("application/x-block", item.use); e.dataTransfer.effectAllowed = "copy"; }}
          onClick={() => onAdd(item)}>
          <span className="palette-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
      <div className="palette-hint">点击或拖拽区块到画布</div>
    </div>
  );
}

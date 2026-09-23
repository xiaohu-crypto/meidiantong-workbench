import { useState, type DragEvent, type ReactNode } from "react";

/**
 * P1 通用记录详情页骨架:Tab 栏 + Widget 网格容器。
 * 调用方通过 layout 描述结构,通过 renderWidget 回调注入具体 Widget 数据。
 * P4:支持 editing 模式下同 Tab 内拖拽重排(原生 HTML5 Drag API,无第三方依赖)。
 */

export interface WidgetDef {
  id: string;
  type: "fields" | "related" | "timeline" | "custom";
  title: string;
  /** 网格跨列,默认 1 列;2 跨整行 */
  span?: 1 | 2;
  config?: Record<string, unknown>;
}

export interface TabDef {
  id: string;
  title: string;
  widgets: WidgetDef[];
}

export interface RecordLayout {
  entity: string;
  tabs: TabDef[];
}

interface RecordPageProps {
  layout: RecordLayout;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** 由调用方根据 WidgetDef 渲染具体 Widget(数据在页面侧) */
  renderWidget: (w: WidgetDef) => ReactNode;
  className?: string;
  /** P4 编辑模式:widget 可拖拽重排 */
  editing?: boolean;
  /** P4 布局(当前 Tab widgets 顺序)变化回调 */
  onLayoutChange?: (layout: RecordLayout) => void;
  /** P1 Finexy 低代码动态扩展字段密度自适应:紧凑/宽松,默认 relaxed */
  density?: "compact" | "relaxed";
}

export function RecordPage({ layout, activeTab, onTabChange, renderWidget, className, editing, onLayoutChange, density = "relaxed" }: RecordPageProps) {
  const tab = layout.tabs.find((t) => t.id === activeTab) ?? layout.tabs[0];
  /* P4 拖拽状态:被拖拽 widget id + 放置指示位置(目标 widget 索引) */
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function handleDragStart(e: DragEvent, id: string) {
    if (!editing) return;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
    setDragOverIndex(null);
  }
  function handleDragOver(e: DragEvent, index: number) {
    if (!editing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }
  function handleDrop(e: DragEvent, dropIndex: number) {
    if (!editing || !onLayoutChange) return;
    e.preventDefault();
    const dragId = e.dataTransfer.getData("text/plain");
    const dragIndex = tab.widgets.findIndex((x) => x.id === dragId);
    setDraggingId(null);
    setDragOverIndex(null);
    if (dragIndex < 0 || dragIndex === dropIndex) return;
    /* 重排:移除被拖拽项后,按 dropIndex 校正插入位置 */
    let target = dropIndex;
    if (dragIndex < target) target -= 1;
    const moved = tab.widgets[dragIndex];
    const rest = tab.widgets.filter((_, i) => i !== dragIndex);
    rest.splice(Math.max(0, Math.min(target, rest.length)), 0, moved);
    const newTabs = layout.tabs.map((t) => (t.id === tab.id ? { ...t, widgets: rest } : t));
    onLayoutChange({ ...layout, tabs: newTabs });
  }
  function handleDragEnd() {
    setDraggingId(null);
    setDragOverIndex(null);
  }

  return (
    <div className={"record-page" + (className ? " " + className : "") + " density-" + density}>
      <div className="dtabs">
        {layout.tabs.map((t) => (
          <span
            key={t.id}
            className={"dtab" + (tab.id === t.id ? " active" : "")}
            onClick={() => onTabChange(t.id)}
          >
            {t.title}
          </span>
        ))}
      </div>
      {tab.widgets.length > 0 ? (
        <div className="widget-grid">
          {tab.widgets.map((w, i) => {
            const spanCls = w.span === 2 ? "span-2" : undefined;
            if (!editing) {
              return (
                <div key={w.id} className={spanCls}>
                  {renderWidget(w)}
                </div>
              );
            }
            const showIndicator = dragOverIndex === i;
            return [
              showIndicator ? <div key={w.id + "-ind"} className="drop-indicator" /> : null,
              <div
                key={w.id}
                className={
                  "widget-edit" +
                  (spanCls ? " " + spanCls : "") +
                  (draggingId === w.id ? " dragging" : "")
                }
                draggable
                onDragStart={(e) => handleDragStart(e, w.id)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
              >
                <span className="drag-handle" title="拖拽排序">⋮⋮</span>
                {renderWidget(w)}
              </div>,
            ];
          })}
        </div>
      ) : null}
    </div>
  );
}

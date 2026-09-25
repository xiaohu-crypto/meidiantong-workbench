import { useState, type DragEvent, type ReactNode } from "react";

export interface DashboardWidgetDef {
  id: string;
  type: "kpi" | "bar" | "line" | "table";
  title: string;
  span?: 1 | 2 | 4;
  config?: Record<string, unknown>;
}

export interface DashboardTabDef {
  id: string;
  title: string;
  widgets: DashboardWidgetDef[];
}

export interface DashboardDef {
  id: string;
  name: string;
  tabs: DashboardTabDef[];
}

interface DashboardProps {
  dashboard: DashboardDef;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  renderWidget: (w: DashboardWidgetDef) => ReactNode;
  /** P4 编辑模式:widget 可拖拽重排 */
  editing?: boolean;
  /** P4 布局(当前 Tab widgets 顺序)变化回调 */
  onLayoutChange?: (dashboard: DashboardDef) => void;
}

export function Dashboard({ dashboard, activeTab, onTabChange, renderWidget, editing, onLayoutChange }: DashboardProps) {
  const tab = dashboard.tabs.find((t) => t.id === activeTab) ?? dashboard.tabs[0];
  /* P4 拖拽状态 */
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function spanClass(w: DashboardWidgetDef): string {
    const s = w.span ?? (w.type === "kpi" ? 1 : 2);
    return `span-${s}`;
  }

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
    let target = dropIndex;
    if (dragIndex < target) target -= 1;
    const moved = tab.widgets[dragIndex];
    const rest = tab.widgets.filter((_, i) => i !== dragIndex);
    rest.splice(Math.max(0, Math.min(target, rest.length)), 0, moved);
    const newTabs = dashboard.tabs.map((t) => (t.id === tab.id ? { ...t, widgets: rest } : t));
    onLayoutChange({ ...dashboard, tabs: newTabs });
  }
  function handleDragEnd() {
    setDraggingId(null);
    setDragOverIndex(null);
  }

  return (
    <div>
      <div className="tabs">
        {dashboard.tabs.map((t) => (
          <span
            key={t.id}
            className={"tab" + (tab.id === t.id ? " active" : "")}
            onClick={() => onTabChange(t.id)}
          >
            {t.title}
          </span>
        ))}
      </div>
      {tab.widgets.length > 0 ? (
        <div className="dash-grid">
          {tab.widgets.map((w, i) => {
            if (!editing) {
              return (
                <div key={w.id} className={spanClass(w)}>
                  {renderWidget(w)}
                </div>
              );
            }
            const showIndicator = dragOverIndex === i;
            return [
              showIndicator ? <div key={w.id + "-ind"} className="drop-indicator" /> : null,
              <div
                key={w.id}
                className={"widget-edit " + spanClass(w) + (draggingId === w.id ? " dragging" : "")}
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
      ) : (
        <p className="muted" style={{ padding: 24 }}>暂无 Widget</p>
      )}
    </div>
  );
}

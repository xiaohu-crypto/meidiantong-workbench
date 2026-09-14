/* ===== 全局数据变更事件（板块间实时同步）=====
 * 用 window CustomEvent 实现轻量事件总线：
 * - emitDataChanged(source)：数据表/AI员工/构建器保存后广播
 * - onDataChanged(cb)：监听变更刷新（AI助手面板/构建器设置面板等常驻组件）
 * - emitOpenAIStaff(empId) / onOpenAIStaff(cb)：AI员工页卡片 → AI助手面板联动
 */

export type DataSource = "aiEmployees" | "collections" | "pages" | "records";

const DATA_CHANGED_EVT = "mdt:data-changed";
const OPEN_AI_STAFF_EVT = "mdt:open-aistaff";

/** 广播数据变更（source 指明变更来源，监听方可选择性刷新） */
export function emitDataChanged(source: DataSource): void {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVT, { detail: { source } }));
}

/** 订阅数据变更；返回取消订阅函数 */
export function onDataChanged(cb: (source: DataSource) => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { source?: DataSource } | undefined;
    cb(detail?.source ?? "records");
  };
  window.addEventListener(DATA_CHANGED_EVT, handler);
  return () => window.removeEventListener(DATA_CHANGED_EVT, handler);
}

/** 请求 AI 助手面板打开并切换到指定员工（AI员工页卡片点击） */
export function emitOpenAIStaff(empId: string): void {
  window.dispatchEvent(new CustomEvent(OPEN_AI_STAFF_EVT, { detail: { empId } }));
}

/** 订阅"打开指定AI员工"请求；返回取消订阅函数 */
export function onOpenAIStaff(cb: (empId: string) => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { empId?: unknown } | undefined;
    cb(String(detail?.empId ?? ""));
  };
  window.addEventListener(OPEN_AI_STAFF_EVT, handler);
  return () => window.removeEventListener(OPEN_AI_STAFF_EVT, handler);
}

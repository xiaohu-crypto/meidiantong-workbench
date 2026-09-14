/* ===== Flow 定义（复刻NocoBase Flow）=====
 * Flow 是有序Step集合，可序列化为JSON持久化。
 */

import type { StepDef } from "./step";

export interface FlowDef {
  /** 唯一标识 */
  uid: string;
  /** 名称 */
  name: string;
  /** 触发事件（click / recordCreated / recordUpdated / timer / manual） */
  event: string;
  /** 触发参数（如监听store、定时间隔） */
  trigger?: Record<string, unknown>;
  /** 有序步骤 */
  steps: StepDef[];
  /** 是否启用 */
  enabled?: boolean;
}

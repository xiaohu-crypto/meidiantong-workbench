/* ===== 字段类型系统（复刻NocoBase Field）=====
 * 字段定义/校验/序列化辅助。
 */

import type { FieldDef, FieldType } from "./collections";

export const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: "string", label: "文本" },
  { type: "text", label: "多行文本" },
  { type: "number", label: "数字" },
  { type: "date", label: "日期" },
  { type: "select", label: "下拉选择" },
  { type: "boolean", label: "开关" },
  { type: "relation", label: "关联" },
  { type: "attachment", label: "附件" },
  { type: "json", label: "JSON" },
];

/** 校验字段值是否满足定义 */
export function validateField(def: FieldDef, value: unknown): string | null {
  if (def.required && (value === undefined || value === null || value === "")) {
    return `${def.label}为必填项`;
  }
  if (value === undefined || value === null || value === "") return null;
  switch (def.type) {
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) return `${def.label}必须是数字`;
      break;
    case "date": {
      if (typeof value === "string" && Number.isNaN(Date.parse(value))) return `${def.label}日期格式不正确`;
      break;
    }
    case "select":
      if (def.options && !def.options.includes(String(value))) return `${def.label}不在可选范围内`;
      break;
    default:
      break;
  }
  return null;
}

/** 校验整个记录 */
export function validateRecord(fields: Record<string, FieldDef>, record: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, def] of Object.entries(fields)) {
    const err = validateField(def, record[key]);
    if (err) errors[key] = err;
  }
  return errors;
}

/** 序列化：将表单值转为存储值 */
export function serializeValue(def: FieldDef, value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;
  switch (def.type) {
    case "number":
      return typeof value === "string" ? Number(value) : value;
    case "boolean":
      return !!value;
    case "json":
      return typeof value === "string" ? JSON.parse(value) : value;
    default:
      return value;
  }
}

/** 反序列化：将存储值转为表单值 */
export function deserializeValue(def: FieldDef, value: unknown): unknown {
  if (value === undefined || value === null) return "";
  switch (def.type) {
    case "json":
      return typeof value === "string" ? value : JSON.stringify(value);
    default:
      return value;
  }
}

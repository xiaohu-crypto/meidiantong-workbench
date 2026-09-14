/* ===== JSON模板变量解析（复刻NocoBase JSON Template）=====
 * 支持 {{ $context.xxx }} / {{ $step.xxx }} / {{ $params.xxx }} 语法。
 */

/** 变量解析器：给定路径返回值 */
export type VarResolver = (path: string) => unknown;

const PATH_RE = /\{\{\s*(\$[\w.+]+|\w[\w.]*)\s*\}\}/g;

/** 从对象中按点路径取值 */
export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/** 解析模板字符串中的变量引用 */
export function resolveTemplate(tpl: string, resolver: VarResolver): string {
  if (!tpl.includes("{{")) return tpl;
  return tpl.replace(PATH_RE, (_m, rawPath: string) => {
    const v = resolver(rawPath.trim());
    if (v === undefined || v === null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  });
}

/** 判断字符串是否包含模板变量 */
export function hasTemplate(tpl: string): boolean {
  return tpl.includes("{{");
}

/** 带类型解析：{{num: path}} 返回数字，{{bool: path}} 返回布尔，其余返回字符串 */
export function resolveValue(tpl: string, resolver: VarResolver): unknown {
  const m = tpl.match(/^\s*\{\{\s*(num|bool|str):\s*([\w.$+]+)\s*\}\}\s*$/);
  if (m) {
    const v = resolver(m[2]);
    if (m[1] === "num") {
      if (typeof v === "number") return v;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    }
    if (m[1] === "bool") return v === true || v === "true" || v === 1;
    return v === undefined || v === null ? "" : String(v);
  }
  return resolveTemplate(tpl, resolver);
}

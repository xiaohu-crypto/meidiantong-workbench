import { useCallback } from "react";
import { t as translate } from "./locale";

/** React Hook：中文简体翻译（复刻NocoBase i18n useT设计） */
export function useT() {
  return useCallback((key: string, params?: Record<string, string | number>) => translate(key, params), []);
}

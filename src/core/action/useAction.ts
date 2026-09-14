/* ===== ActionModel UI动作模型（复刻NocoBase ActionModel）=====
 * ActionModel渲染为按钮，点击触发绑定Flow。
 * 提供Hook：useActionRunner —— 按钮onClick的标准入口。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { actionRegistry } from "./registry";
import { engine } from "../flow/engine";
import type { NotifyFn } from "../flow/context";

export interface ActionModelProps {
  /** 动作名（已注册）或flowUid */
  action?: string;
  flowUid?: string;
  /** 执行参数 */
  params?: Record<string, unknown>;
  /** 上下文（record等） */
  ctx?: Record<string, unknown>;
  notify?: NotifyFn;
}

export interface ActionRunner {
  running: boolean;
  lastError: string | null;
  run: () => Promise<boolean>;
}

/** 执行Action的标准Hook：按钮点击入口 */
export function useActionRunner(props: ActionModelProps): ActionRunner {
  const { action, flowUid, params, ctx, notify } = props;
  const [running, setRunning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const flow = useMemo(() => {
    if (flowUid) return engine.listAutoFlows().find((f) => f.uid === flowUid);
    if (action) {
      const def = actionRegistry.get(action);
      return def?.flow;
    }
    return undefined;
  }, [action, flowUid]);

  const run = useCallback(async () => {
    if (!flow) {
      const msg = `未找到动作${action ?? flowUid ?? ""}`;
      setLastError(msg);
      notify?.(msg, "err");
      return false;
    }
    setRunning(true);
    setLastError(null);
    try {
      const result = await engine.run(flow, { params: { ...params, ...ctx }, notify });
      if (!result.ok && result.error) {
        if (mounted.current) setLastError(result.error);
        notify?.(result.error, "err");
        return false;
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (mounted.current) setLastError(msg);
      notify?.(msg, "err");
      return false;
    } finally {
      if (mounted.current) setRunning(false);
    }
  }, [flow, params, ctx, notify, action, flowUid]);

  return { running, lastError, run };
}

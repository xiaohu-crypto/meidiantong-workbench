import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from "react";
import { IconClose } from "../components/icons";

export function money(n: number): string {
  return "¥" + n.toLocaleString("zh-CN");
}

export function uid(prefix: string): string {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function Btn(props: { kind?: "primary" | "ghost" | "data" | "draft" | "done" | "danger"; children: ReactNode; onClick?: () => void; disabled?: boolean; title?: string; sm?: boolean; style?: CSSProperties }) {
  const cls = "btn " + (props.kind ?? "ghost") + (props.sm ? " sm" : "");
  return <button className={cls} style={props.style} onClick={props.onClick} disabled={props.disabled} title={props.title}>{props.children}</button>;
}

export function Chip(props: { kind?: "brand" | "data" | "green" | "warn" | "danger" | "gray"; gray?: boolean; dot?: boolean; children: ReactNode; style?: CSSProperties }) {
  const dot = props.dot !== undefined ? props.dot : !!(props.kind && props.kind !== "gray");
  return (
    <span className={"chip " + (props.gray ? "gray" : props.kind ?? "gray") + (dot ? " with-dot" : "")} style={props.style}>
      {dot ? <span className="chip-dot" /> : null}
      {props.children}
    </span>
  );
}

export function Modal(props: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <b>{props.title}</b>
          <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={props.onClose} aria-label="关闭"><IconClose size={16} /></button>
        </div>
        <div className="modal-body">{props.children}</div>
        {props.footer ? <div className="modal-foot">{props.footer}</div> : null}
      </div>
    </div>
  );
}

/**
 * P1 统一右侧滑出抽屉基组件(替代散落的 Modal/多套抽屉体系,消除弹窗错乱)。
 * 支持多层级(连续滑出):level 越高 z-index 越高、宽度越窄,形成金字塔。
 *  - level1: mask z=1000 / drawer z=1001 / 宽 520
 *  - level2: mask z=2000 / drawer z=2001 / 宽 480(叠在 level1 上方,左侧露边)
 * 关闭遵循后进先出:点击本级遮罩仅关本级。滑出动画 ≤250ms(220ms)。
 * P1 §嵌套抽屉:多层同时打开时,ESC 仅关闭"最上层"(level 最高且先于更低层挂载)的那个;
 * 二级抽屉提交成功后一级抽屉表单数据不被清空,一级关闭后由上层 reload() 热重载主页 + 右栏 AI。
 */
export function Drawer(props: { open: boolean; title: string; onClose: () => void; level?: number; width?: number; children: ReactNode; footer?: ReactNode }) {
  const level = props.level ?? 1;
  const z = level * 1000 + 1;
  const maskZ = level * 1000;
  /* P1 §嵌套:ESC 仅关最上层——通过 body 上登记的最大 level 判断本抽屉是否为顶层 */
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !props.open) return;
    const top = document.body.dataset["drawerTopLevel"];
    const myLevel = String(level);
    if (top && Number(top) > Number(myLevel)) return; /* 有更高层,ESC 交给它 */
    props.onClose();
  };
  return (
    <>
      <div
        className="drawer-mask"
        style={{ zIndex: maskZ, background: level > 1 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.3)", opacity: props.open ? 1 : 0, pointerEvents: props.open ? "auto" : "none" }}
        onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
      />
      <div
        className="drawer"
        style={{ zIndex: z, width: props.width ?? (level > 1 ? 480 : 520), right: props.open ? 0 : "-560px", transition: "right .22s ease" }}
      >
        <div className="drawer-head">
          <b>{props.title}</b>
          <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={props.onClose} aria-label="关闭"><IconClose size={16} /></button>
        </div>
        <div className="drawer-body">{props.children}</div>
        {props.footer ? <div className="drawer-foot">{props.footer}</div> : null}
      </div>
      <DrawerLevelRegistry level={level} open={props.open} onKey={onKey} />
    </>
  );
}

/**
 * P1 §嵌套抽屉:当前"最上层"level 的共享登记(模块级 Set)。
 * 每个打开的抽屉按 level 登记;body[data-drawer-top-level] 始终=当前最大 level。
 * ESC 时各抽屉 handler 读取该值,只有"当前最上层"的抽屉响应,其余 return,
 * 保证「连续打开多层时 ESC 仅关最上层」,且关掉上层后下层自动重新成为最上层。
 */
const openDrawerLevels = new Set<number>();

/** P1 §嵌套抽屉:登记/移除本抽屉 level,并同步 body 上的最上层标记 */
function DrawerLevelRegistry({ level, open, onKey }: { level: number; open: boolean; onKey: (e: KeyboardEvent) => void }) {
  useEffect(() => {
    if (!open) return;
    openDrawerLevels.add(level);
    const top = Math.max(...Array.from(openDrawerLevels));
    document.body.dataset["drawerTopLevel"] = String(top);
    document.body.addEventListener("keydown", onKey);
    return () => {
      document.body.removeEventListener("keydown", onKey);
      openDrawerLevels.delete(level);
      const rest = openDrawerLevels.size ? Math.max(...Array.from(openDrawerLevels)) : 0;
      document.body.dataset["drawerTopLevel"] = String(rest);
    };
  }, [level, open, onKey]);
  return null;
}

export function Field(props: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      {props.children}
      {props.error ? <span className="err">{props.error}</span> : null}
    </div>
  );
}

export function Progress(props: { label: string; v: number; warn?: boolean }) {
  return (
    <div className="progress">
      <div className="pl"><span>{props.label}</span><b className="num">{props.v}%</b></div>
      <div className="bar-track"><div className={"bar-fill" + (props.warn ? " warn" : "")} style={{ width: props.v + "%" }} /></div>
    </div>
  );
}

export function useToast(): { show: (m: string, onUndo?: () => void) => void; node: ReactNode } {
  const [toast, setToast] = useState<string | null>(null);
  const [undoFn, setUndoFn] = useState<(() => void) | null>(null);
  const show = useCallback((m: string, onUndo?: () => void) => {
    setToast(m);
    setUndoFn(() => onUndo ?? null);
    window.setTimeout(() => { setToast(null); setUndoFn(null); }, 4000);
  }, []);
  const node = toast ? (
    <div className="toast" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span>{toast}</span>
      {undoFn ? (
        <button onClick={() => { undoFn(); setToast(null); setUndoFn(null); }} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.4)", borderRadius: 4, padding: "2px 10px", cursor: "pointer", fontSize: 12 }}>
          撤销
        </button>
      ) : null}
    </div>
  ) : null;
  return { show, node };
}

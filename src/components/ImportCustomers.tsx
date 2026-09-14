import { useState } from "react";
import { db } from "../db/db";
import { parseAnyFile, rowsFromSheet, parseRows, detectHeaderRow, type ImportRow, type ParsedFile } from "../core/importer";
import { uid, Btn, useToast } from "../ui/common";

interface Props { open: boolean; onClose: () => void; existingNames: string[]; reload: () => Promise<void> }

type Phase = "pick" | "preview" | "done";

const ACCEPT = ".xlsx,.xls,.xlsm,.ods,.csv,.txt,.tsv,.docx,.pdf,.png,.jpg,.jpeg";

export default function ImportCustomers(props: Props) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [headerRow, setHeaderRow] = useState(0);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ ok: number; fail: number; ids: string[]; fails: { row: number; name: string; errors: Record<string, string> }[] } | null>(null);
  const { show, node } = useToast();

  if (!props.open) return null;

  function recompute(p: ParsedFile, sIdx: number, hRow: number) {
    const patched = { ...p, headerRow: hRow };
    const { headers: hs, rows: rs, mapping: m } = rowsFromSheet(patched, sIdx);
    setHeaders(hs); setRows(rs); setMapping(m);
  }

  async function onFile(f: File) {
    setFileName(f.name);
    try {
      const p = await parseAnyFile(f);
      if (p.format === "unknown") { show("不支持的文件格式"); return; }
      if (p.format === "image") {
        show("图片格式请使用「快速采集」的名片 OCR 功能,或先将图片中的表格另存为 Excel 后导入");
        return;
      }
      if (p.sheets.length === 0 || p.sheets.every((s) => s.aoa.length < 2)) { show("文件为空或无法解析"); return; }
      // 默认选中第一个有数据的 sheet
      const idx = Math.max(0, p.sheets.findIndex((s) => s.aoa.length >= 2));
      setParsed(p); setSheetIdx(idx); setHeaderRow(p.headerRow);
      recompute(p, idx, p.headerRow);
      setPhase("preview");
      if (p.warning) show(p.warning);
    } catch (e) {
      show("文件解析失败:" + (e instanceof Error ? e.message : String(e)));
    }
  }

  function onSheetChange(idx: number) {
    if (!parsed) return;
    setSheetIdx(idx);
    const hr = detectForSheet(parsed, idx);
    setHeaderRow(hr);
    recompute(parsed, idx, hr);
  }

  function onHeaderRowChange(v: number) {
    if (!parsed) return;
    setHeaderRow(v);
    recompute(parsed, sheetIdx, v);
  }

  function detectForSheet(p: ParsedFile, idx: number): number {
    return detectHeaderRow(p.sheets[idx]?.aoa ?? []);
  }

  function exportFails() {
    if (!result) return;
    const lines = ["行号,客户名称,错误"].concat(
      result.fails.map((f) => `${f.row},"${f.name}","${Object.entries(f.errors).map(([k, v]) => k + ":" + v).join("; ")}"`)
    );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "导入失败明细.csv"; a.click();
    URL.revokeObjectURL(a.href);
  }

  async function undoImport() {
    if (!result) return;
    for (const id of result.ids) await db.purge("customers", id);
    await props.reload();
    show("已撤销本次导入(" + result.ids.length + " 条)");
    props.onClose();
  }

  async function confirmImport() {
    const pre = parseRows(rows, props.existingNames);
    const ids: string[] = [];
    for (let i = 0; i < pre.ok.length; i += 1000) {
      const chunk = pre.ok.slice(i, i + 1000).map((r) => ({ id: uid("c"), name: r.name, industry: r.industry || "待补充", grade: (r.grade || "C") as "S" | "A" | "B" | "C", phone: r.phone || undefined, billingTitle: r.billingTitle || undefined, billingTaxNo: r.billingTaxNo || undefined }));
      await db.putMany("customers", chunk);
      for (const c of chunk) ids.push(c.id);
    }
    if (ids.length > 0) await db.logOp({ what: "批量导入 " + ids.length + " 条客户(" + fileName + ")", entityType: "customers", entityId: ids[0], before: null });
    setResult({ ok: pre.ok.length, fail: pre.fails.length, ids, fails: pre.fails });
    setPhase("done");
    await props.reload();
  }

  const formatLabel: Record<string, string> = { excel: "Excel", csv: "CSV", text: "文本", docx: "Word", pdf: "PDF", image: "图片", unknown: "未知" };

  return (
    <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
      <div className="modal" style={{ width: 680 }}>
        <div className="modal-head"><b>批量导入客户</b><span className="chip gray">Excel / Word / PDF / CSV / 文本</span>
          <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={props.onClose} aria-label="关闭">×</button>
        </div>
        <div className="modal-body">
          {phase === "pick" && (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <p className="muted" style={{ marginBottom: 12 }}>支持 Excel(多 Sheet) / Word / PDF / CSV / 文本;表头需包含「客户名称」列,自动识别表头行与列匹配</p>
              <input type="file" accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />
              <p className="muted" style={{ marginTop: 10, fontSize: "var(--text-xs)" }}>图片格式请使用「快速采集」的名片 OCR 功能</p>
            </div>
          )}
          {phase === "preview" && parsed && (
            <>
              <div className="h-row" style={{ marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <span className="chip data">{formatLabel[parsed.format]}</span>
                <span className="muted" style={{ fontSize: "var(--text-xs)" }}>{fileName}</span>
                {parsed.sheets.length > 1 ? (
                  <label style={{ fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: 6 }}>
                    Sheet:
                    <select className="sel" value={sheetIdx} onChange={(e) => onSheetChange(Number(e.target.value))} style={{ minHeight: 28 }}>
                      {parsed.sheets.map((s, i) => <option key={s.name} value={i}>{s.name} ({s.aoa.length} 行)</option>)}
                    </select>
                  </label>
                ) : null}
                <label style={{ fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: 6 }}>
                  表头行:
                  <input type="number" min={0} max={9} value={headerRow} onChange={(e) => onHeaderRowChange(Number(e.target.value))} style={{ width: 56, minHeight: 28 }} className="inp num" />
                </label>
                <span className="muted" style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}>共识别 {rows.length} 行有效数据</span>
              </div>
              {parsed.warning ? <p className="muted" style={{ fontSize: "var(--text-xs)", color: "var(--warning)", marginBottom: 8 }}>{parsed.warning}</p> : null}
              <div className="h-row"><span className="h-title sm">列匹配预览</span></div>
              <table className="tgrid">
                <thead><tr><th>工程字段</th><th>匹配到的表头</th></tr></thead>
                <tbody>
                  {Object.entries(mapping).map(([field, idx]) => (
                    <tr key={field} style={{ cursor: "default" }}><td><b>{field}</b></td><td>{headers[idx] ?? "—"}</td></tr>
                  ))}
                  {Object.keys(mapping).length === 0 ? <tr><td colSpan={2} className="muted" style={{ textAlign: "center" }}>未匹配到任何列,请调整表头行</td></tr> : null}
                </tbody>
              </table>
              {rows.length > 0 ? (
                <div style={{ marginTop: 10, maxHeight: 160, overflowY: "auto" }}>
                  <table className="tgrid" style={{ fontSize: "var(--text-xs)" }}>
                    <thead><tr><th>#</th><th>客户名称</th><th>行业</th><th>等级</th><th>手机</th></tr></thead>
                    <tbody>
                      {rows.slice(0, 20).map((r) => (
                        <tr key={r.row}><td className="num">{r.row}</td><td>{r.name}</td><td>{r.industry || "—"}</td><td>{r.grade || "—"}</td><td>{r.phone || "—"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 20 ? <p className="muted" style={{ fontSize: "var(--text-xs)", textAlign: "center", marginTop: 4 }}>仅预览前 20 行,共 {rows.length} 行</p> : null}
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn kind="primary" disabled={rows.length === 0} onClick={() => { void confirmImport(); }}>确认导入 {rows.length} 条</Btn>
                <Btn kind="ghost" onClick={() => { setPhase("pick"); setParsed(null); }}>重选文件</Btn>
              </div>
            </>
          )}
          {phase === "done" && result && (
            <>
              <div className="h-row"><span className="h-title sm">导入完成</span>
                <span className="chip green" style={{ marginLeft: 8 }}>成功 {result.ok}</span>
                {result.fail > 0 ? <span className="chip danger">失败 {result.fail}</span> : null}
              </div>
              {result.fails.length > 0 ? (
                <table className="tgrid" style={{ marginTop: 8 }}>
                  <thead><tr><th>行号</th><th>名称</th><th>错误</th></tr></thead>
                  <tbody>{result.fails.slice(0, 20).map((f) => (
                    <tr key={f.row} style={{ cursor: "default" }}>
                      <td className="num">{f.row}</td><td>{f.name}</td>
                      <td className="cell-sub">{Object.entries(f.errors).map(([k, v]) => k + ": " + v).join("; ")}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : null}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {result.fail > 0 ? <Btn kind="ghost" onClick={exportFails}>导出失败明细 CSV</Btn> : null}
                <Btn kind="danger" onClick={() => { void undoImport(); }}>撤销本次导入</Btn>
                <Btn kind="primary" onClick={props.onClose}>完成</Btn>
              </div>
            </>
          )}
        </div>
        {node}
      </div>
    </div>
  );
}

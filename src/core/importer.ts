import { validateCustomer, type Errors, GRADES } from "./validators";

/** 等级值归一化:常见分档映射到 S/A/B/C,无法识别的统一为 C */
const GRADE_MAP: Record<string, "S" | "A" | "B" | "C"> = {
  S: "S", A: "A", B: "B", C: "C",
  VIP: "A", 重要: "A", 高: "A", 核心: "A", 重点: "A", 战略: "A", KA: "A", 关键: "A", 头部: "A", 优质: "A",
  中: "B", 一般: "B", 普通: "B", 中等: "B", 常规: "B", 活跃: "B", 腰部: "B", 标准: "B",
  低: "C", 潜在: "C", 小: "C", 新客户: "C", 待培育: "C", 边缘: "C", 尾部: "C", 普通客户: "C", 小型: "C",
};
export function normalizeGrade(v: string): "S" | "A" | "B" | "C" {
  const clean = v.trim().toUpperCase();
  if (clean === "S" || clean === "A" || clean === "B" || clean === "C") return clean;
  return GRADE_MAP[clean] ?? "C";
}

/** 列名同义词匹配(规则引擎,即需求所称"AI 匹配"的确定性实现) */
const SYNONYMS: Record<string, string[]> = {
  name: ["客户名称", "名称", "客户", "公司", "公司名称", "客户名", "单位", "企业名称", "企业", "公司全称", "单位名称", "客户公司", "企业全称", "客户全称", "机构名称", "组织名称", "客户单位", "品牌名称", "品牌方"],
  industry: ["行业", "所属行业", "品类", "行业分类", "行业类别", "所属品类", "业务领域", "赛道", "类目", "品类名称", "细分行业", "产业"],
  grade: ["等级", "客户等级", "级别", "分级", "客户级别", "客户分级", "VIP等级", "客户分层", "重要程度", "客户星级", "优先级"],
  phone: ["手机", "手机号", "电话", "联系电话", "联系方式", "联系人电话", "手机电话", "办公电话", "座机", "联系号码", "电话号码", "手机/电话", "联络方式"],
  billingTitle: ["开票抬头", "发票抬头", "抬头", "发票公司", "开票名称", "发票单位", "开票单位"],
  billingTaxNo: ["税号", "纳税号", "纳税人识别号", "统一社会信用代码", "税务登记号", "税号/统一信用代码", "社会信用代码"],
};

/** P1 Finexy 表头归一化:每个系统字段 → 匹配到的表头索引 + 置信度(精确=100/包含=60/未匹配=0) */
export interface ColumnMatchItem {
  field: string;
  /** 匹配到的表头列索引,-1 表示未匹配 */
  index: number;
  /** 匹配置信度 0-100 */
  confidence: number;
  /** 匹配到的原始表头文本(未匹配为 "") */
  matchedHeader: string;
}

export function columnMatchConfidence(headers: string[]): ColumnMatchItem[] {
  const fields = Object.keys(SYNONYMS);
  const claimed = new Set<number>();
  const items: ColumnMatchItem[] = [];
  for (const field of fields) {
    const words = SYNONYMS[field];
    let bestIdx = -1;
    let bestConf = 0;
    headers.forEach((h, i) => {
      if (claimed.has(i)) return;
      const clean = String(h).trim();
      if (clean === "") return;
      for (const w of words) {
        if (clean === w) {
          // 精确匹配:100
          if (bestConf < 100) { bestIdx = i; bestConf = 100; }
          break;
        } else if (clean.includes(w) || w.includes(clean)) {
          // 包含匹配:60
          if (bestConf < 60) { bestIdx = i; bestConf = 60; }
        }
      }
    });
    if (bestIdx >= 0) {
      claimed.add(bestIdx);
      items.push({ field, index: bestIdx, confidence: bestConf, matchedHeader: String(headers[bestIdx]).trim() });
    } else {
      items.push({ field, index: -1, confidence: 0, matchedHeader: "" });
    }
  }
  return items;
}

/** 向后兼容:仅取"有匹配"的列(系统字段→表头索引) */
export function columnMatch(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const it of columnMatchConfidence(headers)) {
    if (it.index >= 0) map[it.field] = it.index;
  }
  return map;
}

export interface ImportRow {
  row: number;
  name: string;
  industry: string;
  grade: string;
  phone: string;
  billingTitle: string;
  billingTaxNo: string;
  extra?: Record<string, unknown>;
}

/** 逐行校验:批次内重名累加进已存在集合;返回成功集与失败明细 */
export function parseRows(rows: ImportRow[], existingNames: string[]): { ok: ImportRow[]; fails: { row: number; name: string; errors: Errors }[] } {
  const names = new Set(existingNames);
  const ok: ImportRow[] = [];
  const fails: { row: number; name: string; errors: Errors }[] = [];
  for (const r of rows) {
    const errs = validateCustomer({ name: r.name, industry: r.industry, grade: r.grade || undefined, billingTitle: r.billingTitle || undefined, billingTaxNo: r.billingTaxNo || undefined }, []);
    if (r.name.trim() !== "" && names.has(r.name.trim())) errs.name = "同级客户名称已存在";
    if (r.grade && !(GRADES as readonly string[]).includes(r.grade)) errs.grade = "等级必须为 S/A/B/C";
    if (Object.keys(errs).length) { fails.push({ row: r.row, name: r.name, errors: errs }); continue; }
    names.add(r.name.trim());
    ok.push(r);
  }
  return { ok, fails };
}

/** 统一 CSV 解析:支持双引号包裹字段(字段内可含逗号/换行,双引号转义为 ""),返回去空行二维数组 */
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(cur.trim()); cur = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur.trim()); out.push(row); row = []; cur = "";
    }
    else cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur.trim()); out.push(row); }
  return out.filter((r) => r.some((c) => c !== ""));
}

/* ==================== 多 Sheet / 表头检测 / 多格式统一入口 ==================== */

export interface SheetData { name: string; aoa: unknown[][]; }

/** 解析 Excel 所有 Sheet(xlsx/xls/xlsm/ods 等 xlsx 库支持的格式) */
export async function parseExcelSheets(buf: ArrayBuffer): Promise<SheetData[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array" });
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
    return { name, aoa };
  });
}

/** 自动检测表头行:扫描前 15 行,跳过单行大标题(非空单元格<2),取匹配同义词最多的行;匹配≥3直接返回 */
export function detectHeaderRow(aoa: unknown[][], maxScan = 15): number {
  const allWords = Object.values(SYNONYMS).flat();
  const scan = Math.min(maxScan, aoa.length);
  let bestRow = 0;
  let bestScore = 0;
  for (let i = 0; i < scan; i++) {
    const cells = (aoa[i] as unknown[] || []).map((c) => String(c ?? "").trim());
    const nonEmpty = cells.filter((c) => c !== "").length;
    if (nonEmpty < 2) continue;
    let score = 0;
    for (const c of cells) {
      if (c && allWords.some((w) => c === w || c.includes(w))) score++;
    }
    if (score > bestScore) { bestScore = score; bestRow = i; if (score >= 3) break; }
  }
  return bestRow;
}

/** 从二维数组指定表头行提取表头与数据行 */
export function extractFromAoa(aoa: unknown[][], headerRowIdx: number): { headers: string[]; rows: unknown[][] } {
  const headers = ((aoa[headerRowIdx] as unknown[]) || []).map((c) => String(c ?? ""));
  const rows = aoa.slice(headerRowIdx + 1) as unknown[][];
  return { headers, rows };
}

/** 纯文本转二维数组(按行分割,行内按制表符/多空格/逗号分割) */
export function textToAoa(text: string): string[][] {
  return text.split(/\r?\n/).map((line) => {
    if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
    if (line.includes(",")) return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return line.split(/\s{2,}/).map((c) => c.trim());
  }).filter((r) => r.some((c) => c !== ""));
}

/** 从 Word(.docx) 提取纯文本 */
export async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

/** 从 PDF 提取纯文本 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite 会把 worker 作为资源打包
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    text += tc.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return text;
}

export type FileFormat = "excel" | "csv" | "text" | "docx" | "pdf" | "image" | "unknown";

export interface ParsedFile {
  format: FileFormat;
  sheets: SheetData[];
  headerRow: number;
  warning?: string;
}

/** 统一文件解析入口:根据扩展名分发,返回所有 sheet 与自动检测的表头行 */
export async function parseAnyFile(file: File): Promise<ParsedFile> {
  const lower = file.name.toLowerCase();
  // 表格类:Excel 全格式
  if (/\.(xlsx|xls|xlsm|xlsb|ods|dif|sylk)$/.test(lower)) {
    const sheets = await parseExcelSheets(await file.arrayBuffer());
    const firstNonEmpty = sheets.find((s) => s.aoa.length >= 2) ?? sheets[0];
    return { format: "excel", sheets, headerRow: detectHeaderRow(firstNonEmpty?.aoa ?? []) };
  }
  // CSV
  if (lower.endsWith(".csv")) {
    const text = await file.text();
    const aoa = parseCsv(text) as unknown[][];
    return { format: "csv", sheets: [{ name: "CSV", aoa }], headerRow: detectHeaderRow(aoa) };
  }
  // 纯文本
  if (lower.endsWith(".txt") || lower.endsWith(".tsv")) {
    const text = await file.text();
    const aoa = textToAoa(text) as unknown[][];
    return { format: "text", sheets: [{ name: "文本", aoa }], headerRow: detectHeaderRow(aoa) };
  }
  // Word
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    const text = await extractDocxText(file);
    const aoa = textToAoa(text) as unknown[][];
    return { format: "docx", sheets: [{ name: "Word", aoa }], headerRow: detectHeaderRow(aoa), warning: "Word 文档已按行/制表符转为表格,请核对列匹配" };
  }
  // PDF
  if (lower.endsWith(".pdf")) {
    const text = await extractPdfText(file);
    const aoa = textToAoa(text) as unknown[][];
    return { format: "pdf", sheets: [{ name: "PDF", aoa }], headerRow: detectHeaderRow(aoa), warning: "PDF 已提取文本并转为表格,请核对列匹配" };
  }
  // 图片(需 AI 视觉提取,调用方处理)
  if (/\.(png|jpg|jpeg|gif|bmp|webp)$/.test(lower)) {
    return { format: "image", sheets: [], headerRow: 0, warning: "图片格式需 AI 视觉识别,请在下一步确认调用 AI" };
  }
  return { format: "unknown", sheets: [], headerRow: 0, warning: "不支持的文件格式" };
}

/** 从 ParsedFile + 选中 sheet 提取 ImportRow[];未匹配的列自动存入 extra(对应 customer.custom) */
export function rowsFromSheet(parsed: ParsedFile, sheetIdx: number): { headers: string[]; rows: ImportRow[]; mapping: Record<string, number>; unmatchedCols: string[] } {
  const sheet = parsed.sheets[sheetIdx];
  const { headers, rows: rawRows } = extractFromAoa(sheet.aoa, parsed.headerRow);
  const mapping = columnMatch(headers);
  const matchedIdx = new Set(Object.values(mapping));
  const unmatchedCols = headers.map((h, i) => matchedIdx.has(i) ? null : h).filter((h): h is string => !!h && h.trim() !== "");
  const rows: ImportRow[] = rawRows.map((r, i) => {
    const extra: Record<string, unknown> = {};
    for (const h of unmatchedCols) {
      const ci = headers.indexOf(h);
      const v = r[ci];
      if (v !== undefined && v !== null && String(v).trim() !== "") extra[h] = v;
    }
    return {
      row: i + parsed.headerRow + 2,
      name: mapping.name !== undefined ? String(r[mapping.name] ?? "").trim() : "",
      industry: mapping.industry !== undefined ? String(r[mapping.industry] ?? "").trim() : "",
      grade: mapping.grade !== undefined ? normalizeGrade(String(r[mapping.grade] ?? "")) : "C",
      phone: mapping.phone !== undefined ? String(r[mapping.phone] ?? "").trim() : "",
      billingTitle: mapping.billingTitle !== undefined ? String(r[mapping.billingTitle] ?? "").trim() : "",
      billingTaxNo: mapping.billingTaxNo !== undefined ? String(r[mapping.billingTaxNo] ?? "").trim() : "",
      extra: Object.keys(extra).length > 0 ? extra : undefined,
    };
  }).filter((r) => r.name !== "");
  return { headers, rows, mapping, unmatchedCols };
}

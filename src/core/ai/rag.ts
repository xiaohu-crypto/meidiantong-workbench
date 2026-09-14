import { db } from "../../db/db";
import type { Note } from "../../types";

/* ===== AI知识库RAG增强(关键词匹配版,后续可升级向量检索) =====
 * 在AI回答前检索知识库中相关笔记,注入上下文。
 * 复刻NocoBase AI Knowledge Base设计。
 */

export interface RagResult {
  notes: { title: string; snippet: string }[];
  context: string;
}

/** 中文2-gram + 英文词 分词(与search.ts一致) */
function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const w of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) out.push(w);
  for (const run of text.match(/[\u4e00-\u9fa5]+/g) ?? []) {
    if (run.length === 1) { out.push(run); continue; }
    for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

/** 检索知识库中与问题相关的笔记 */
export async function retrieveNotes(question: string, limit = 3): Promise<RagResult> {
  const q = question.trim();
  if (!q) return { notes: [], context: "" };
  try {
    const all = await db.getAll<Note>("notes");
    const notes = all.filter((n) => !n.deletedAt);
    if (notes.length === 0) return { notes: [], context: "" };

    const qTokens = new Set(tokenize(q));
    if (qTokens.size === 0) return { notes: [], context: "" };

    // 计算每条笔记的匹配分数
    const scored = notes.map((n) => {
      const text = (n.title + " " + n.content + " " + (n.tags ?? []).join(" ")).toLowerCase();
      const nTokens = tokenize(text);
      let score = 0;
      for (const t of qTokens) {
        if (nTokens.includes(t)) score += 1;
      }
      // 标题匹配加权
      if (n.title.toLowerCase().includes(q.toLowerCase())) score += 5;
      return { note: n, score };
    }).filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (scored.length === 0) return { notes: [], context: "" };

    const results = scored.map(({ note }) => ({
      title: note.title,
      snippet: note.content.slice(0, 200) + (note.content.length > 200 ? "…" : ""),
    }));

    const context = "【知识库参考资料】\n" + results.map((r, i) =>
      `${i + 1}. 《${r.title}》\n${r.snippet}`
    ).join("\n\n");

    return { notes: results, context };
  } catch {
    return { notes: [], context: "" };
  }
}

import MiniSearch from "minisearch";

export interface SearchDoc { id: string; type: string; title: string; sub: string; refId?: string }

let mini: MiniSearch<SearchDoc> | null = null;

/** 中文按 2-gram,英文按词 */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const w of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) out.push(w);
  for (const run of text.match(/[\u4e00-\u9fa5]+/g) ?? []) {
    if (run.length === 1) { out.push(run); continue; }
    for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

export function rebuildIndex(docs: SearchDoc[]): void {
  mini = new MiniSearch<SearchDoc>({
    fields: ["title", "sub"],
    storeFields: ["type", "title", "sub", "refId"],
    tokenize,
    searchOptions: { tokenize, prefix: true, fuzzy: 0.2 },
  });
  mini.addAll(docs);
}

export function searchAll(q: string, limit = 8): (SearchDoc & { score: number })[] {
  if (!mini || !q.trim()) return [];
  return mini.search(q).slice(0, limit).map((r) => ({
    id: r.id, type: r.type, title: r.title, sub: r.sub, refId: r.refId, score: r.score,
  }));
}

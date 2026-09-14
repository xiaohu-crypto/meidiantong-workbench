/* ===== 知识库管理页（复刻NocoBase Knowledge管理）=====
 * 展示知识库（notes）索引状态、统计；支持重建RAG索引。
 */

import { useCallback, useEffect, useState } from "react";
import { db } from "../db/db";
import { useT } from "../core/i18n/useT";
import { Btn, Chip } from "../ui/common";
import { engine } from "../core/flow/engine";

interface NoteRow {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  updatedAt?: number;
  deletedAt?: number;
}

export default function AIKbPage() {
  const t = useT();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [totalChars, setTotalChars] = useState(0);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);

  const refresh = useCallback(async () => {
    const all = await db.getAll<NoteRow>("notes");
    const alive = all.filter((n) => !n.deletedAt);
    setNotes(alive.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)));
    setTotalChars(alive.reduce((s, n) => s + (n.content ?? "").length, 0));
    const tagMap = new Map<string, number>();
    for (const n of alive) {
      for (const tag of n.tags ?? []) tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
    setTags(Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function rebuildIndex() {
    // RAG按需实时检索（无持久索引），重建=清空缓存标记
    await db.setSetting("ragIndexVersion", Date.now());
    engine.emitEvent({ type: "notify", payload: { text: `知识库已重建（${notes.length} 篇笔记已纳入AI检索）`, kind: "ok" } });
  }

  return (
    <div className="page page-aikb">
      <div className="h-row">
        <span className="h-title">{t("aikb.title")}</span>
        <Btn sm kind="primary" onClick={() => void rebuildIndex()}>{t("aikb.rebuild")}</Btn>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>{t("aikb.desc")}</p>

      <div className="aikb-stats">
        <div className="stat-card"><div className="stat-num">{notes.length}</div><div className="stat-label">笔记总数</div></div>
        <div className="stat-card"><div className="stat-num">{(totalChars / 1000).toFixed(1)}K</div><div className="stat-label">知识库字数</div></div>
        <div className="stat-card"><div className="stat-num">{tags.length}</div><div className="stat-label">标签数</div></div>
      </div>

      <div className="h-row" style={{ marginTop: 20 }}>
        <span className="h-title">{t("aikb.tags")}</span>
      </div>
      <div className="aikb-tags" style={{ marginBottom: 16 }}>
        {tags.length === 0 ? <p className="muted">暂无标签</p> : null}
        {tags.map((tg) => <Chip key={tg.tag} kind="brand">{tg.tag} × {tg.count}</Chip>)}
      </div>

      <div className="h-row">
        <span className="h-title">{t("aikb.notes")}</span>
      </div>
      <div className="aikb-list">
        {notes.length === 0 ? <p className="muted">暂无笔记，请在知识库页面创建</p> : null}
        {notes.map((n) => (
          <div key={n.id} className="aikb-note">
            <div className="aikb-note-title">{n.title}</div>
            <div className="aikb-note-preview">{(n.content ?? "").slice(0, 80)}</div>
            <div className="aikb-note-meta">
              <span>{n.tags?.join(" / ") || "未打标签"}</span>
              <span>{new Date(n.updatedAt ?? Date.now()).toLocaleDateString("zh-CN")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

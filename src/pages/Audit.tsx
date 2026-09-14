/* ===== 操作日志页（复刻NocoBase Audit，复用现有operationLogs）=====
 * 展示全部数据变更记录，支持撤销（按before快照恢复）。
 */

import { useCallback, useEffect, useState } from "react";
import { db } from "../db/db";
import { useT } from "../core/i18n/useT";
import { Btn, Chip, Modal } from "../ui/common";
import { engine } from "../core/flow/engine";

interface OpLogRow {
  id: string;
  ts: number;
  who: string;
  what: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
}

export default function AuditPage() {
  const t = useT();
  const [logs, setLogs] = useState<OpLogRow[]>([]);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState<OpLogRow | null>(null);

  const refresh = useCallback(async () => {
    const rows = await db.getAll<OpLogRow>("operationLogs");
    setLogs(rows.sort((a, b) => b.ts - a.ts));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = filter ? logs.filter((l) => (l.entityType ?? "").includes(filter) || (l.what ?? "").includes(filter)) : logs;

  async function undo(logId: string) {
    try {
      await db.undoLog(logId);
      await refresh();
      engineNotify("已撤销该操作");
    } catch (e) {
      engineNotify(e instanceof Error ? e.message : "撤销失败", "err");
    }
  }

  function engineNotify(text: string, kind?: "ok" | "err") {
    engine.emitEvent({ type: "notify", payload: { text, kind } });
  }

  return (
    <div className="page page-audit">
      <div className="h-row">
        <span className="h-title">{t("audit.title")}</span>
        <Chip kind="data">{logs.length} 条记录</Chip>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>{t("audit.desc")}</p>

      <div className="audit-toolbar">
        <input className="inp inp-sm" placeholder={t("audit.filter")} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Btn sm onClick={() => void refresh()}>{t("common.refresh")}</Btn>
      </div>

      <div className="audit-list">
        {filtered.length === 0 ? <p className="muted">{t("audit.empty")}</p> : null}
        {filtered.map((log) => (
          <div key={log.id} className="audit-row">
            <div className="audit-main">
              <span className="audit-what">{log.what}</span>
              {log.entityType ? <span className="audit-entity">{log.entityType}</span> : null}
              <span className="audit-time">{new Date(log.ts).toLocaleString("zh-CN")}</span>
            </div>
            <div className="audit-actions">
              <Btn sm onClick={() => setDetail(log)}>查看</Btn>
              {log.before ? <Btn sm kind="danger" onClick={() => void undo(log.id)}>{t("audit.undo")}</Btn> : null}
            </div>
          </div>
        ))}
      </div>

      {detail ? (
        <Modal title={detail.what} onClose={() => setDetail(null)}
          footer={<><Btn onClick={() => setDetail(null)}>{t("common.close")}</Btn></>}>
          <div className="audit-detail">
            <div className="wf-detail-row"><span>操作：</span><b>{detail.what}</b></div>
            <div className="wf-detail-row"><span>对象：</span><b>{detail.entityType ?? "—"}</b></div>
            <div className="wf-detail-row"><span>时间：</span><b>{new Date(detail.ts).toLocaleString("zh-CN")}</b></div>
            <div className="wf-detail-row"><span>操作人：</span><b>{detail.who}</b></div>
            <div className="wf-detail-title">变更前快照：</div>
            <pre className="audit-json">{JSON.stringify(detail.before ?? "（无，新建操作）", null, 2)}</pre>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

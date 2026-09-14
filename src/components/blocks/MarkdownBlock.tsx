/* ===== MarkdownBlock 图文区块（复刻NocoBase MarkdownBlock）=====
 * 展示静态图文内容（Markdown渲染），复用现有Markdown组件。
 */

import { Markdown } from "../Markdown";

interface MarkdownBlockProps {
  content: string;
  title?: string;
}

export function MarkdownBlock({ content, title }: MarkdownBlockProps) {
  return (
    <div className="markdown-block block-card">
      {title ? <div className="block-head"><span className="block-title">{title}</span></div> : null}
      <div className="markdown-body">
        <Markdown text={content} />
      </div>
    </div>
  );
}

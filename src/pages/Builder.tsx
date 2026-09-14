/* ===== 页面构建器页面入口 =====
 * 在左侧菜单"构建器"下渲染Builder主界面。
 * 支持从"我的页面"跳转编辑（initialPageUid 载入指定已保存页面）。
 */
import { Builder } from "../components/builder/Builder";

export default function BuilderPage({ initialPageUid }: { initialPageUid?: string | null }) {
  return (
    <div className="page page-builder">
      <Builder initialPageUid={initialPageUid} />
    </div>
  );
}

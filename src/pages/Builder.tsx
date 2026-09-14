/* ===== 页面构建器页面入口 =====
 * 在左侧菜单"构建器"下渲染Builder主界面。
 */

import { Builder } from "../components/builder/Builder";

export default function BuilderPage() {
  return (
    <div className="page page-builder">
      <Builder />
    </div>
  );
}

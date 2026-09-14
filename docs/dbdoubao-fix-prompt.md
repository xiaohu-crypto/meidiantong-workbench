你是资深前端工程师。请修复以下 Electron + React 18 + TypeScript 项目中的若干缺陷。

【项目背景】
- 项目：媒电通工作台（MediaDesk），本地优先的媒体广告代理桌面工具
- 技术栈：Electron 33 + React 18 + TypeScript(strict) + Vite 5 + IndexedDB（封装于 src/db/db.ts，AES-256-GCM 静态加密）
- 代码位置：D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\...
- 全局 UI 组件：src/ui/common.tsx 导出 Btn / Chip / Modal / Field / Progress / useToast（useToast 返回 {show, node}）
- 设计变量：src/styles/tokens.css（--brand / --data / --danger / --warning / --success / --surface* / --border* 等），禁止硬编码颜色
- 数据访问：db.getAll / db.put / db.softDelete / db.setSetting / db.getSetting / db.clearAll（clearAll 会清空整个数据库，慎用）

【必须遵守的规范】
1. 只做最小必要改动，不重构、不新增依赖、不改动无关文件。
2. 交互反馈统一用 useToast，禁止使用 window.alert / window.confirm。
3. 颜色一律引用 tokens.css 变量，禁止新增硬编码色值。
4. 修改后必须能通过：npm run typecheck（tsc --noEmit）与 npm test（vitest）。不得引入新的 TS 错误。
5. 不执行 git 提交/推送，不运行 electron 打包。

【必须修复（第一阶段，已源码核实）】

### 缺陷 1（严重·数据安全）：通知"标记全部已读"清空了整个数据库
文件：src/pages/Notifications.tsx 约第 66 行
当前代码：
  <Btn kind="ghost" onClick={() => { void (async () => { await db.clearAll(); show("演示:清空所有通知(未实现)"); })(); }}>
    标记全部已读(演示)
  </Btn>
问题：按钮文案是"标记全部已读"，却调用 db.clearAll() 清空全部数据，且无确认、清空后不刷新。
要求：
- 改为真实的"标记全部已读"语义。通知由 App 派生：逾期回款 + 14 天无接触客户（见 App.tsx 的 unreadCount 计算）。
- 新增设置字段 settings.notificationsReadAt:number（默认 0）。"标记全部已读"时 db.setSetting("notificationsReadAt", Date.now())。
- unreadCount（App.tsx）与 Notifications 页面列表都应按"发生时间 > notificationsReadAt 才算未读"过滤：
  · 逾期回款：以该回款的应收到期日（dueDate / paidDate 缺省用记录时间）为发生时间；
  · 14 天无接触客户：以 lastTouch + 14 天为发生时间。
- 移除 show("演示...")，改为 show("已全部标记为已读") 或静默；如合适可用 useToast 的 onUndo 把 notificationsReadAt 恢复为 0。
- 删除按钮文案里的"(演示)"字样，改为"标记全部已读"。

### 缺陷 2（高）：CRM 客户抽屉"AI建议"Tab 内容掉到抽屉外
文件：src/pages/CRM.tsx
问题：抽屉结构为 <aside> ... <div className="drawer-body"> ... </div> </aside>，但 `tab === "AI建议"` 的渲染块位于 </aside> 之后（约第 465 行），导致选中该 Tab 时抽屉体空白、AI 内容显示在页面底部。
要求：将该 `tab === "AI建议"` 渲染块整体移入 <div className="drawer-body"> 内部（与其他 tab 的 `{tab === "概览" && ...}` 同级），确保它在抽屉内正确显示。

### 缺陷 3（高）：自定义商机阶段在 Pipeline 看板中不显示
文件：src/pages/Dev.tsx 约第 96 行
问题：Pipeline 列只用 STAGES.slice(0,7) 渲染，用户通过 settings.customStages 自建的阶段不会被显示，对应商机在看板中静默消失。
要求：渲染列时合并 STAGES 与数据/设置中实际存在的自定义阶段（去重、保持原顺序，自定义阶段追加在后或按自定义顺序）。确保任一 deal.stage 都能在某一列找到归属；加权金额、MEDDIC/BANT 等逻辑对自定义阶段同样适用（PROB 已有兜底）。

### 缺陷 4（中）：数据分析"毛利"月度趋势运算符优先级错误
文件：src/pages/Data.tsx 第 46 行（monthVal 函数内）
当前代码：
  return contracts.filter((c) => c.signDate.startsWith(m)).reduce((s, c) => s + (c.amount - mediaCost / Math.max(contracts.length, 1)), 0);
问题：mediaCost / Math.max(contracts.length,1) 优先计算，再被每个 c.amount 减，导致数值既非月度毛利也非正确分摊。
要求：按"月度毛利 = 本月签约额 − 本月分摊媒体成本"计算。媒体成本按月签约数占比分摊（每月合同减同一分摊值）：
  const total = contracts.length || 1;
  return contracts.filter((c) => c.signDate.startsWith(m)).reduce((s, c) => s + (c.amount - mediaCost / total), 0);
（如产品另有口径，请在实现处注释说明并保持自洽。）

【第二阶段（一致性，可选，建议完成第一阶段并验证后再做）】
- CRM.tsx 抽屉底栏"记录跟进"目前仅 show toast 无写库，需实现接触点(ContactPoint)快速记录。
- Kb.tsx 笔记编辑器无自动保存，需加草稿自动保存或离开前确认。
- 替换硬编码颜色：CRM #f59e0b、Work #fef2f2 等改为对应 token（--warning / --danger-bg）。
- 清理死代码：QuickCapture.tsx:39 的 seen、Today.tsx:19 的 void props.reload。
- 用 useToast 替换 CRM 批量删 / Onboarding / ImportCustomers 中的 window.confirm / window.alert。
- 统一 CSV 解析：ImportCustomers.tsx 与 Media.tsx 目前两套实现，统一到 core/importer。

【交付要求】
- 逐条说明你改了哪些文件、哪一行、为什么。
- 确认 typecheck 与 test 通过（如你无法运行，请明确标注"需宿主验证"）。
- 不要提交代码。

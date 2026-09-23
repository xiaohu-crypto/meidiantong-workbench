# v0.2.2 Release Notes

## 主题
P1 现代化浅色 SaaS 极简工作台：双模并行设计系统 + 低代码密度自适应 + AI 安全网关 + 表头归一化 + 工作流 SVG 连线。

## 新增 / 改动

### 双模并行设计系统（Finexy 极简）
- `src/styles/tokens.css`：浅色/深色双模各加 `--shadow-card`（双层极浅微阴影）+ `--animate-theme-switch`（0.4s 平滑过渡曲线）
- `src/styles/app.css`：`.btn` 升级药丸大圆角 + 微阴影 + `active:scale(.96)`；`.card` 换 `--shadow-card` + 主题过渡；`.chip` 加 `.chip-dot` 状态点；`.app` 加主题过渡
- 默认主题翻为 **light**（`App.tsx` useState/getSetting + `seed.ts` setSetting 三处）

### MediaStrategyFormState 权威契约真正落地
- `src/core/mediaStrategy.ts`：类型 + 纯函数（`mixTotal` / `parseBudget` / `computeEstimatedAmount` / `isStrategyValid` / `strategyError` / `syncAllocations` / `ALL_CHANNELS`），UI 单一真源
- `src/pages/CRM.tsx`：策略 Drawer 表单 UI 彻底切到 Schema——`selectedChannels` 多选芯片经 `syncAllocations` 联动增删 `channelAllocations` 行；逐行占比写回 `channelAllocations`；`isStrategyValid`/`strategyError` 驱动 `validationStatus`+`errors`，合计≠100% 边框/总计看板标红 `#FF6B6E`；`estimatedAmount` 自动算不可手填
- `src/ui/common.tsx`：补 `useEffect` import；`DrawerLevelRegistry` 改模块级 `Set<number>` 共享登记，多层抽屉 ESC 仅关最上层、关上层后下层自动重登顶

### 低代码动态扩展字段密度自适应（A）
- `src/ui/RecordPage.tsx` 加 `density: 'compact'|'relaxed'` prop
- `src/pages/CRM.tsx` 记录详情 drawer-head 加 `⊟紧凑/⊞宽松` 切换按钮，`db.setSetting("recordDensity")` 持久化
- `src/pages/Dev.tsx` 商机详情 drawer-head 同样加密度按钮（`dealRecordDensity`），传给 RecordPage
- `src/styles/app.css` `.density-compact/.density-relaxed` 控制 `.widget-grid` 行高/间距

### AI 安全网关状态卡（B）
- **新建** `src/components/AISecurityBadge.tsx`：盾牌 SVG + "AES-256 本地绝对保密/脱敏云端协作" + 呼吸指示灯 + 网关端点（接 `getActiveAi().providerName`）
- `src/components/AIAssistant.tsx` 导入 `AISecurityBadge` + `getAiConfig`，加 `isLocalOnlyRoute` state，挂到面板头部下方
- `src/styles/app.css` `.ai-sec-*` + `@keyframes ai-sec-pulse`

### 表头归一化映射面板（C）
- `src/core/importer.ts` 新增 `ColumnMatchItem` + `columnMatchConfidence()`（精确=100/包含=60/未匹配=0），`columnMatch` 改向后兼容包装
- `src/components/ImportCustomers.tsx` 列匹配预览改"FILE→SYS + 对齐度%"面板，未匹配 0% 红色高亮闪烁
- `src/styles/app.css` `.imp-map/.imp-tag/.imp-conf(.full/.part/.miss)` + `@keyframes imp-conf-blink`

### 工作流 SVG 连线高亮（D）
- `src/pages/Workflows.tsx` 详情弹窗加 `WorkflowCanvasSteps`（线性节点卡片 + 三次贝塞尔 SVG 连线），连线 `stroke:var(--border)` 双模自适应 + 触发时 `var(--brand)` dash 流动
- `src/styles/app.css` `.wf-canvas*` + `@keyframes workflow-flow-dash`

### Finexy 本地 AI 状态灯
- `src/App.tsx` Sidebar 底栏注入 `.ai-status-anchor`（`ai-ping` 脉冲 + 悬浮气泡"本地敏感数据安全盾：已锁定 (AES-256-GCM)"）
- `src/styles/app.css` `.ai-status-*` + `@keyframes ai-ping`

## 验证
- `tsc --noEmit` EXIT=0（strict + noUnusedLocals）
- `vite build` 成功（124 modules）
- 浅色/深色双模切换、三栏工作台、双抽屉 ESC 嵌套、预算 100% 强校验均已代码级覆盖

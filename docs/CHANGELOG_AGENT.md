# CHANGELOG_AGENT.md

> Agent变更日志 - NocoBase架构复刻
> 生成时间：2026-09-14

---

## 2026-09-14 Phase 0: 项目扫描与架构分析

### 日期
2026-09-14

### Phase
Phase 0 - 项目扫描

### 修改文件
- 新增：`docs/CURRENT_ARCHITECTURE.md`
- 新增：`docs/ARCHITECTURE_MAPPING.md`
- 新增：`docs/CAPABILITY_MAPPING.md`
- 新增：`docs/CONFLICT_REPORT.md`
- 新增：`docs/CHANGELOG_AGENT.md`

### 修改原因
按照NocoBase架构复刻规范，第一轮不写代码，先完成项目扫描和架构分析。

### 新增能力
- 现有架构完整分析（13个维度）
- 现有→目标架构映射（8大层）
- 50项NocoBase能力映射表
- 7项架构冲突分析与解决方案

### 兼容方式
- 纯文档，不修改任何代码
- 不影响现有功能

### 测试
- 无代码修改，无需测试
- typecheck: N/A
- test: N/A

### 风险
- 无

### 下一步
Phase 1: Collection定义（collections.ts）
- 定义25个store的Collection元数据
- 字段类型、标签、选项、校验规则
- 不修改现有代码，纯新增

---

## 2026-09-14 Phase 0 补充：深度代码分析

### 日期
2026-09-14

### Phase
Phase 0 - 项目扫描（深度补充）

### 修改文件
- 更新：`docs/CURRENT_ARCHITECTURE.md`（新增第15章深度分析）

### 修改原因
按照提示词"全量先完成分析"，在Phase 0基础上补充深度代码分析：
- db.ts 19个API方法逐一分析
- App.tsx 数据流/路由/生命周期详解
- 11个页面106次db调用统计
- AI架构（3角色+RAG+流式+持久化）详解
- RecordPage/Widget Model Tree雏形分析
- types.ts 25个数据模型清单

### 新增能力
- 数据访问模式量化统计（每页db调用/toast/alert）
- db.ts Repository层雏形识别
- AI架构可复用模式识别
- RecordPage Model Tree雏形识别

### 兼容方式
- 纯文档，不修改任何代码

### 测试
- 无代码修改，无需测试

### 风险
- 无

### 下一步
等老板确认后，按新任务安排执行。

---

## 历史变更（非NocoBase复刻，记录参考）

### 2026-09-13 AI助手与Pipeline优化
- 新增：`src/core/ai/employees.ts` - AI员工角色定义
- 新增：`src/core/ai/rag.ts` - 知识库RAG检索
- 新增：`src/components/AIAssistant.tsx` - AI助手悬浮面板
- 新增：`src/components/Markdown.tsx` - Markdown渲染
- 修改：`src/App.tsx` - 挂载AIAssistant、搜索框居中
- 修改：`src/pages/Dev.tsx` - Pipeline拖拽跨列、横向滚动
- 修改：`src/styles/app.css` - AI助手样式、Pipeline样式
- 验证：typecheck通过，36个测试通过

---

## 复刻路线图

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 0 | 项目扫描与架构分析 | ✅ 完成 |
| Phase 1 | Collection定义 | ⏳ 待执行 |
| Phase 2 | Repository层 | ⏳ 待执行 |
| Phase 3 | Resource Hook | ⏳ 待执行 |
| Phase 4 | FlowEngine | ⏳ 待执行 |
| Phase 5 | FlowModel | ⏳ 待执行 |
| Phase 6 | ActionModel | ⏳ 待执行 |
| Phase 7 | Table/Form Block | ⏳ 待执行 |
| Phase 8 | 配置持久化 | ⏳ 待执行 |
| Phase 9 | Plugin系统 | ⏳ 待执行 |
| Phase 10 | Builder | ⏳ 待执行 |

---

## 2026-09-14 全量复刻NocoBase架构 · 8批交付完成

**交付范围**：
- 批1 数据层：collections.ts（25 store→Collection定义）/ field.ts / relation.ts / repository.ts / datasource.ts / useResource.ts + i18n（locale.ts 中文简体约200 key）
- 批2 引擎层：flow/engine + step + template + context + action/registry + model/registry/renderer；11个标准Step；模板支持 `{{num:path}}`/`{{bool:path}}`/`{{$context.today+N}}` 类型保留
- 批3 区块层：TableBlock/FormBlock/KanbanBlock/DetailsBlock/ListBlock/CalendarBlock/MarkdownBlock
- 批4 构建器：Palette+Canvas+SettingsPanel三栏 + persist.ts（flowModels存settings）+ pages/Builder.tsx + Flow事件桥接（openForm/openDetail/refresh/notify/closeDrawer）
- 批5 工作流：triggers.ts（recordCreated/Updated/Deleted + timer触发器）+ actions.ts；内置3个工作流：商机签约→自动建合同+回款计划、沉睡客户提醒、合同到期提醒；Repository create/update/destroy自动触发；App启动30分钟定时
- 批6 管理页：插件系统(plugin/manager) + 角色权限(auth/permission) + 审计页(Audit,读operationLogs+撤销) + 数据建模页(Collections,自定义Collection存settings) + 角色权限页(Roles)
- 批7 AI增强：AI员工管理页(自定义员工settings.aiEmployees，AIAssistant实时同步) + 知识库管理页(统计+重建索引)
- 批8 联调：typecheck 0错误；vitest 全量 75 通过（新增39个NocoBase测试）；vite构建成功；asar更新安装版（已备份 app.asar.bak-20260914-134229）；PrintWindow截图验证AI员工页渲染正常；git提交 5d7cb14 并推送

**经验沉淀**：
- 模板引擎正则 `\$?([\w.]+)` 会吞掉 `$step` 的 `$` → 用 `(\$[\w.+]+|\w[\w.]*)`
- 模板解析永远返回字符串导致金额字段变字符串 → resolveValue 支持类型前缀 num/bool/str
- 定时任务去重：settings.wfLastRun_<uid> 控制间隔
- 异步fireAfterWrite用动态import避免repository↔triggers循环依赖

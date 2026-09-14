# CONFLICT_REPORT.md

> 现有架构与NocoBase目标架构冲突报告
> 生成时间：2026-09-14

---

## 冲突1: 数据访问方式

### 冲突位置
- 现有：`src/pages/*.tsx` 直接调用 `db.getAll()` / `db.put()` / `db.softDelete()`
- 目标：UI → Resource → API → Action → Repository → Collection → DataSource

### 冲突原因
现有架构是"页面直连数据库"，没有中间抽象层。NocoBase要求严格分层，UI不能直接访问数据库。

### 影响范围
- 11个页面文件全部直接使用db
- 约50+处db调用
- 数据加载、保存、删除逻辑分散在各页面

### 可适配方案
1. **新增Repository层**：`src/core/data/repository.ts`，内部调用db.ts
2. **新增Resource Hook**：`useMultiRecordResource()` / `useSingleRecordResource()`
3. **逐步迁移**：新页面用Resource，旧页面保持db直接访问
4. **不一次性重构**：避免大规模修改引入bug

### 推荐方案
**Adapter模式**：Resource → Repository → db.ts
- 旧代码不受影响
- 新代码走新架构
- 逐步迁移高频操作

### 迁移成本
- 低：新增代码不修改旧代码
- 中：逐步迁移页面（每个页面约30分钟）
- 风险：低，新旧并存

### 风险
- 两套数据访问方式并存可能导致不一致
- 缓解：Repository内部仍调用db.ts，保证数据一致性

---

## 冲突2: ActionHandler内联函数

### 冲突位置
- 现有：`<Btn onClick={() => { await db.put(...); show("成功"); }}>`
- 目标：ActionModel → Event → Flow → Step → Handler

### 冲突原因
现有按钮的业务逻辑硬编码在onClick中，无法被重新配置、复用或被Flow调用。

### 影响范围
- 所有新增/编辑/删除按钮
- 约30+处内联onClick

### 可适配方案
1. **定义标准Action**：create/update/destroy/refresh/export
2. **ActionModel包含**：label, icon, visible, disabled, handler
3. **现有按钮逐步包装**：不立即修改
4. **新功能用ActionModel**

### 推荐方案
**ActionRegistry + 标准Action**
- 先注册标准CRUD Action
- 新页面使用ActionModel渲染按钮
- 旧页面保持内联onClick

### 迁移成本
- 低：新增Action系统
- 中：逐步包装现有按钮

### 风险
- 低，新旧并存

---

## 冲突3: 路由系统

### 冲突位置
- 现有：App.tsx中NAV数组 + `useState<View>`
- 目标：Router → schemaUid → FlowModel → Model Tree → Renderer

### 冲突原因
现有路由是静态硬编码，不支持动态配置页面。NocoBase支持动态页面（通过schemaUid加载Model）。

### 影响范围
- App.tsx路由逻辑
- 11个页面的注册方式

### 可适配方案
1. **保留现有静态路由**：11个业务页面继续用NAV
2. **新增DynamicRoute**：支持schemaUid → FlowModel渲染
3. **不引入React Router**：保持轻量
4. **新页面可走动态路由**

### 推荐方案
**双轨制**：静态路由（现有）+ 动态路由（新增）
- 现有页面不受影响
- 新增可配置页面走动态路由

### 迁移成本
- 低：新增DynamicRoute组件
- 不修改现有路由

### 风险
- 低

---

## 冲突4: UI硬编码 vs Model驱动

### 冲突位置
- 现有：页面JSX硬编码
- 目标：Model Tree → Model Renderer → React Component

### 冲突原因
现有页面是手写JSX，无法通过配置修改布局。NocoBase的页面由Model Tree驱动，可动态配置。

### 影响范围
- 11个页面全部硬编码
- RecordPage已有部分Model化（WidgetDef）

### 可适配方案
1. **RecordPage已有基础**：TabDef + WidgetDef可扩展为Model Tree
2. **新增ModelRenderer**：根据FlowModel渲染组件
3. **新页面用Model驱动**：旧页面保持JSX
4. **不重写现有页面**

### 推荐方案
**渐进式Model化**
- 先实现ModelRenderer
- 新页面/可配置页面用Model
- 现有页面保持JSX

### 迁移成本
- 中：实现ModelRenderer
- 低：不修改现有页面

### 风险
- 中：ModelRenderer需要覆盖足够多的组件类型
- 缓解：先支持Table/Form/KPI/Chart等核心Block

---

## 冲突5: 无插件系统

### 冲突位置
- 现有：所有功能硬编码在源码中
- 目标：Plugin → register Model/Action/Step/Field/Route

### 冲突原因
现有应用是单体应用，没有插件扩展机制。NocoBase的核心是插件化架构。

### 影响范围
- 整体架构
- 功能扩展方式

### 可适配方案
1. **定义Plugin接口**：不立即重构现有代码
2. **PluginManager最小实现**：注册/加载/卸载
3. **新功能按Plugin组织**：旧功能保持原样
4. **不立即拆分现有代码**

### 推荐方案
**先定义接口，后逐步拆分**
- Phase 10才实现Plugin
- 前期不影响现有功能

### 迁移成本
- 低：定义接口
- 高：逐步拆分（后期）

### 风险
- 低（前期）
- 中（后期拆分时）

---

## 冲突6: 无FlowEngine

### 冲突位置
- 现有：业务逻辑分散在onClick中
- 目标：Event → Flow → Step[] → FlowContext → Result

### 冲突原因
现有没有工作流引擎，业务逻辑无法被配置、复用、可视化。

### 影响范围
- 所有交互逻辑
- 自动化能力缺失

### 可适配方案
1. **新增最小FlowEngine**：Event → Flow → Step → Handler
2. **StepRegistry**：注册标准Step
3. **先实现核心Step**：createRecord/updateRecord/deleteRecord/refreshResource/notification/openForm
4. **JSON配置**：不做可视化编辑器

### 推荐方案
**最小可用FlowEngine**
- 不做可视化Builder
- 用JSON配置Flow
- 先在新功能中使用

### 迁移成本
- 中：实现FlowEngine + 标准Step
- 低：不修改现有逻辑

### 风险
- 低，新增能力不影响现有功能

---

## 冲突7: 无配置持久化

### 冲突位置
- 现有：settings store只存键值对
- 目标：flowModels表存储Model Tree配置

### 冲突原因
现有没有页面配置持久化机制，RecordPage的editing模式布局不保存。

### 影响范围
- 可配置页面无法保存
- 用户自定义布局丢失

### 可适配方案
1. **settings中新增flowModels键**：不新建store
2. **Model序列化/反序列化**：JSON格式
3. **saveModel/loadModel API**
4. **RecordPage布局持久化**

### 推荐方案
**复用settings store**
- 不新建表，减少迁移
- flowModels作为settings的一个键

### 迁移成本
- 低

### 风险
- 低

---

## 冲突总结

| 冲突 | 严重度 | 处理方式 | 阶段 |
|------|--------|----------|------|
| 数据访问方式 | 高 | Adapter模式，逐步迁移 | P2-P4 |
| ActionHandler内联 | 中 | 新增ActionModel，逐步包装 | P5 |
| 路由系统 | 低 | 双轨制，新增DynamicRoute | P7 |
| UI硬编码 | 高 | 渐进式Model化 | P7-P8 |
| 无插件系统 | 中 | 先定义接口，后拆分 | P10 |
| 无FlowEngine | 高 | 新增最小FlowEngine | P6 |
| 无配置持久化 | 低 | 复用settings store | P9 |

### 核心原则

1. **不推倒重来**：所有冲突都用Adapter/Extension方式解决
2. **新旧并存**：新架构不破坏旧功能
3. **逐步迁移**：不一次性重构，按优先级逐步推进
4. **最小可用**：每个Phase都可运行、可验证
5. **回归测试**：每次修改后验证旧功能正常

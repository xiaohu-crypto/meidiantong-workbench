# CAPABILITY_MAPPING.md

> NocoBase能力 → 媒电通工作台现有能力映射
> 生成时间：2026-09-14

---

## 状态定义

| 状态 | 含义 |
|------|------|
| EXISTS | 已存在等价能力 |
| PARTIAL | 存在部分能力 |
| ADAPTABLE | 可通过适配实现 |
| MISSING | 当前不存在 |
| CONFLICT | 与目标机制存在架构冲突 |

---

## 能力映射表

| # | NocoBase能力 | 当前项目对应能力 | 状态 | 处理方式 |
|---|-------------|-----------------|------|----------|
| 1 | Plugin | 无 | MISSING | 新增最小Plugin接口，不立即重构 |
| 2 | PluginManager | 无 | MISSING | 新增PluginManager |
| 3 | Plugin Lifecycle | 无 | MISSING | 定义生命周期接口 |
| 4 | FlowEngine | 无 | MISSING | 新增最小FlowEngine |
| 5 | FlowModel | WidgetDef (RecordPage) | PARTIAL | 扩展WidgetDef为FlowModel |
| 6 | Flow | 无 | MISSING | 新增Flow定义 |
| 7 | Step | 无 | MISSING | 新增Step + StepRegistry |
| 8 | FlowContext | 无 | MISSING | 新增FlowContext |
| 9 | Event | onClick硬编码 | PARTIAL | 抽象为Event系统 |
| 10 | Resource | 无 | MISSING | 新增Resource Hook |
| 11 | MultiRecordResource | 无 | MISSING | 新增useMultiRecordResource |
| 12 | SingleRecordResource | 无 | MISSING | 新增useSingleRecordResource |
| 13 | Action | Btn + onClick | PARTIAL | 抽象为ActionModel |
| 14 | ActionModel | 无 | MISSING | 新增ActionModel |
| 15 | ActionRegistry | 无 | MISSING | 新增ActionRegistry |
| 16 | ActionHandler | onClick内联函数 | CONFLICT | 迁移为标准Handler |
| 17 | Repository | db.ts | ADAPTABLE | 新增Repository包装db.ts |
| 18 | Collection | types.ts (interface) | PARTIAL | 新增运行时Collection定义 |
| 19 | Field | TS类型定义 | PARTIAL | 新增Field元数据 |
| 20 | Relation | 无（手动关联） | MISSING | 新增Relation定义 |
| 21 | Index | 无 | MISSING | 延后（IndexedDB索引） |
| 22 | DataSource | IndexedDB | PARTIAL | 预留多DataSource接口 |
| 23 | Model Tree | TabDef + WidgetDef | PARTIAL | 扩展为通用Model Tree |
| 24 | Model Registry | 无 | MISSING | 新增ModelRegistry |
| 25 | Model Renderer | RecordPage | ADAPTABLE | 扩展RecordPage为通用Renderer |
| 26 | Model Loader | 无 | MISSING | 新增loadModel/saveModel |
| 27 | Persistence | settings store | PARTIAL | 新增flowModels配置存储 |
| 28 | Builder | 无 | MISSING | 延后（P11） |
| 29 | TableBlock | TableWidget + CRM表格 | PARTIAL | 包装为TableBlockModel |
| 30 | FormBlock | Field组件 + Modal表单 | PARTIAL | 新增FormBlockModel |
| 31 | KanbanBlock | Dev.tsx Pipeline | ADAPTABLE | 包装为KanbanBlockModel |
| 32 | ChartBlock | BarChart/LineChart Widget | EXISTS | 已有，可直接用 |
| 33 | KpiBlock | KpiWidget | EXISTS | 已有，可直接用 |
| 34 | TimelineBlock | TimelineWidget | EXISTS | 已有，可直接用 |
| 35 | FieldsBlock | FieldsWidget | EXISTS | 已有，可直接用 |
| 36 | RelatedListBlock | RelatedListWidget | EXISTS | 已有，可直接用 |
| 37 | Router | NAV数组 + useState | PARTIAL | 新增DynamicRoute |
| 38 | Authentication | 无（本地应用） | MISSING | 不需要（本地优先） |
| 39 | Authorization | 无 | MISSING | 不需要（单用户） |
| 40 | i18n | 无（硬编码中文） | MISSING | 延后 |
| 41 | Notification | useToast | EXISTS | 已有，可直接用 |
| 42 | Dialog/Modal | Modal组件 | EXISTS | 已有，可直接用 |
| 43 | Drawer | CRM/Dev抽屉 | PARTIAL | 抽象为通用Drawer |
| 44 | Loading State | 无统一管理 | MISSING | Resource提供loading |
| 45 | Error Handling | try/catch散落 | PARTIAL | FlowContext统一错误处理 |
| 46 | Refresh Mechanism | 手动重新加载 | PARTIAL | Resource.refresh()统一 |
| 47 | Reactive State | useState | EXISTS | React已有 |
| 48 | JSON Template | 无 | MISSING | Flow中新增变量解析 |
| 49 | Step Result | 无 | MISSING | FlowContext.getStepResults() |
| 50 | Config Serialization | 无 | MISSING | Model serialize/deserialize |

---

## 按优先级分组

### P0: 核心运行时（必须先实现）

| 能力 | 状态 | 说明 |
|------|------|------|
| FlowEngine | MISSING | 核心运行机制 |
| Flow | MISSING | 事件流定义 |
| Step | MISSING | 最小执行单位 |
| FlowContext | MISSING | 运行上下文 |
| StepRegistry | MISSING | 步骤注册 |

### P1: 数据模型

| 能力 | 状态 | 说明 |
|------|------|------|
| Collection | PARTIAL | 新增运行时定义 |
| Field | PARTIAL | 字段元数据 |
| Repository | ADAPTABLE | 包装db.ts |

### P2: 前端数据访问

| 能力 | 状态 | 说明 |
|------|------|------|
| Resource | MISSING | 统一数据访问 |
| MultiRecordResource | MISSING | 列表数据 |
| SingleRecordResource | MISSING | 单条数据 |

### P3: UI模型

| 能力 | 状态 | 说明 |
|------|------|------|
| FlowModel | PARTIAL | 扩展WidgetDef |
| Model Tree | PARTIAL | 扩展现有结构 |
| Model Registry | MISSING | 模型注册 |
| Model Renderer | ADAPTABLE | 扩展RecordPage |

### P4: 动作系统

| 能力 | 状态 | 说明 |
|------|------|------|
| ActionModel | MISSING | 动作模型 |
| ActionRegistry | MISSING | 动作注册 |
| ActionHandler | CONFLICT | 迁移内联函数 |

### P5: 持久化

| 能力 | 状态 | 说明 |
|------|------|------|
| flowModels存储 | PARTIAL | settings中存储 |
| Model Save/Load | MISSING | 配置保存加载 |

### P6: 插件系统（延后）

| 能力 | 状态 | 说明 |
|------|------|------|
| Plugin | MISSING | 先定义接口 |
| PluginManager | MISSING | 最小实现 |

### P7: 构建器（延后）

| 能力 | 状态 | 说明 |
|------|------|------|
| Builder | MISSING | P11阶段 |

### 已有可直接复用（EXISTS）

| 能力 | 现有实现 |
|------|---------|
| ChartBlock | BarChartWidget, LineChartWidget |
| KpiBlock | KpiWidget |
| TimelineBlock | TimelineWidget |
| FieldsBlock | FieldsWidget |
| RelatedListBlock | RelatedListWidget |
| Notification | useToast |
| Modal | Modal组件 |
| Reactive State | React useState |

---

## 关键CONFLICT分析

### CONFLICT 1: ActionHandler

**现状**：按钮onClick内联函数，直接访问db/window
```tsx
<Btn onClick={() => { await db.put("customers", data); show("成功"); }}>
```

**目标**：ActionModel → Event → Flow → Step → Resource → API

**处理方式**：
- 不立即重构现有按钮
- 新功能使用ActionModel
- 逐步迁移高频操作（新增/编辑/删除）

### CONFLICT 2: 数据访问方式

**现状**：页面直接调用db.getAll/db.put
```tsx
const customers = await db.getAll("customers");
```

**目标**：UI → Resource → API → Action → Repository → Collection

**处理方式**：
- 新增Resource Hook，新页面优先使用
- 现有页面保持db直接访问，逐步迁移
- Repository作为中间层，内部仍调用db

---

## 最小可运行架构（Phase 1-6）

```
Phase 1: Collection定义 (collections.ts)
Phase 2: Repository (repository.ts，包装db.ts)
Phase 3: Resource (useMultiRecordResource Hook)
Phase 4: FlowEngine (engine.ts + step.ts + context.ts)
Phase 5: FlowModel (扩展WidgetDef)
Phase 6: ActionModel + 标准CRUD Action
```

完成Phase 1-6后，即可实现：
```
Create按钮 → ActionModel → click Event → Flow → OpenFormStep → SingleRecordResource → save() → Repository.create() → db.put() → 成功 → RefreshResourceStep → 列表刷新
```

这就是NocoBase的核心闭环。

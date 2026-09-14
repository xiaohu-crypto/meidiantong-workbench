# ARCHITECTURE_MAPPING.md

> 现有架构 → NocoBase目标架构映射
> 生成时间：2026-09-14

---

## 映射原则

1. **优先复用**：现有等价能力直接复用
2. **适配优先**：可通过Adapter实现的不新建
3. **增量融合**：不推倒重来，渐进式添加缺失层
4. **无侵入**：新能力不破坏现有功能

---

## 1. 数据层映射

### 1.1 Collection（数据模型定义）

```
现有：src/types.ts (TS interface，无运行时schema)
    ↓
适配：CollectionAdapter
    ↓
新增：src/core/data/collections.ts (运行时Collection定义)
```

**映射方式**：
- 保留 `types.ts` 作为类型定义
- 新增 `collections.ts` 定义每个Collection的字段元数据（name/type/label/options）
- 现有25个store映射为25个Collection

**示例**：
```typescript
// 新增
export const collections = {
  customers: {
    name: "customers",
    label: "客户",
    fields: {
      id: { type: "string", primary: true },
      name: { type: "string", label: "客户名称", required: true },
      industry: { type: "string", label: "行业" },
      grade: { type: "select", label: "等级", options: ["S","A","B","C","D"] },
      // ...
    }
  }
}
```

---

### 1.2 Repository（数据访问层）

```
现有：src/db/db.ts (db.getAll/db.put/db.softDelete)
    ↓
适配：RepositoryAdapter
    ↓
新增：src/core/data/repository.ts (通用Repository)
```

**映射方式**：
- 保留 `db.ts` 作为底层IndexedDB访问
- 新增 `Repository<T>` 类，内部调用 `db.getAll/db.put`
- 每个Collection对应一个Repository实例
- 现有页面可逐步迁移，也可继续直接用db

**示例**：
```typescript
// 新增
class Repository<T extends {id:string}> {
  async find(): Promise<T[]> { return db.getAll(this.store) as Promise<T[]> }
  async findOne(id: string): Promise<T|undefined> { return db.get(this.store, id) }
  async create(data: Omit<T,"id">): Promise<T> { const rec = {...data, id: uid(this.prefix)}; await db.put(this.store, rec); return rec as T }
  async update(id: string, data: Partial<T>): Promise<T> { /* ... */ }
  async destroy(id: string): Promise<void> { await db.softDelete(this.store, id) }
}
```

---

### 1.3 DataSource（数据源）

```
现有：IndexedDB (单一数据源)
    ↓
适配：DataSourceAdapter
    ↓
新增：src/core/data/datasource.ts (DataSource抽象)
```

**映射方式**：
- 当前只有IndexedDB一个DataSource
- 预留多DataSource接口，未来可扩展REST API/外部数据库
- 不立即实现多数据源

---

## 2. 前端数据访问映射

### 2.1 Resource（前端数据访问抽象）

```
现有：页面直接调用 db.getAll/db.put
    ↓
适配：ResourceAdapter
    ↓
新增：src/core/resource/ (MultiRecordResource + SingleRecordResource)
```

**映射方式**：
- `MultiRecordResource`：用于列表/看板，内部调用Repository
- `SingleRecordResource`：用于表单/详情，内部调用Repository
- Resource提供loading/error/data状态，自动触发React重渲染
- 现有页面逐步迁移，新页面优先用Resource

**示例**：
```typescript
// 新增
function useMultiRecordResource(collection: string) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => { /* ... */ }, []);
  const create = useCallback(async (d) => { /* ... */ }, []);
  const update = useCallback(async (id, d) => { /* ... */ }, []);
  const destroy = useCallback(async (id) => { /* ... */ }, []);
  return { data, loading, error, refresh, create, update, destroy };
}
```

---

## 3. 行为层映射

### 3.1 Action（可执行操作）

```
现有：Btn onClick={() => { db.put(...); show("成功"); }}
    ↓
适配：ActionAdapter
    ↓
新增：src/core/action/ (ActionModel + ActionRegistry)
```

**映射方式**：
- 定义标准Action：create/update/destroy/refresh/export
- ActionModel包含：label, icon, visible, disabled, handler
- 现有按钮可逐步包装为ActionModel
- Action可被Flow调用，也可直接渲染为按钮

---

### 3.2 FlowEngine（工作流引擎）

```
现有：无，业务逻辑硬编码在onClick中
    ↓
新增：src/core/flow/ (FlowEngine + Flow + Step + FlowContext)
```

**映射方式**：
- 全新实现，无现有等价物
- 最小版本：Event → Flow → Step[] → Handler
- StepRegistry注册可复用步骤
- 先实现核心Step：createRecord/updateRecord/deleteRecord/refreshResource/notification/openForm
- 不做可视化编辑器，用JSON配置

---

### 3.3 FlowContext（运行上下文）

```
现有：无，Step直接访问全局变量
    ↓
新增：src/core/flow/context.ts
```

**映射方式**：
- 提供统一上下文：ctx.model, ctx.api, ctx.resource, ctx.router, ctx.notification, ctx.getStepResults()
- Step不直接访问db/window，通过ctx访问
- 现有AppContext可适配为FlowEngineContext

---

## 4. UI层映射

### 4.1 FlowModel（UI模型）

```
现有：页面JSX硬编码
    ↓
适配：ModelAdapter
    ↓
新增：src/core/model/ (FlowModel + ModelRegistry + ModelRenderer)
```

**映射方式**：
- 现有RecordPage的WidgetDef可映射为FlowModel
- WidgetDef已有：id, type, title, span, config
- 扩展为FlowModel：增加uid, use, props, parent, children, flows, state
- 现有页面继续用JSX，新页面/可配置页面用Model

---

### 4.2 Model Tree（模型树）

```
现有：RecordPage的TabDef + WidgetDef数组
    ↓
适配：现有结构可扩展为Model Tree
```

**映射方式**：
- RecordPage已有Tab → Widget的树形结构
- 扩展为通用Model Tree：PageModel → BlockModel → FieldModel/ActionModel
- 现有RecordPage保留，新增通用ModelRenderer

---

### 4.3 TableBlockModel

```
现有：CRM.tsx内硬编码表格 + TableWidget
    ↓
适配：TableWidget → TableBlockModel
```

**映射方式**：
- TableWidget已有基础表格能力
- 包装为TableBlockModel，支持collection绑定、字段配置、排序、筛选、分页
- CRM列表可逐步迁移

---

### 4.4 FormBlockModel

```
现有：Modal内硬编码表单
    ↓
适配：Field组件 → FormBlockModel
```

**映射方式**：
- 现有Field组件可复用
- 新增FormBlockModel，根据Collection字段自动生成表单
- 支持校验、提交、取消

---

## 5. 配置持久化映射

### 5.1 flowModels表

```
现有：settings store (键值对)
    ↓
适配：settings中新增 flowModels 键
```

**映射方式**：
- 不新建store，在settings中存储flowModels数组
- 每个flowModel：{uid, name, use, schema, parentId, path}
- 页面配置保存/加载通过db.setSetting/db.getSetting

---

## 6. 插件系统映射

### 6.1 Plugin

```
现有：无
    ↓
新增：src/core/plugin/ (Plugin + PluginManager)
```

**映射方式**：
- 最小版本：Plugin接口 + PluginManager
- 现有功能按领域拆分为Plugin（可选，不立即拆分）
- Plugin可注册：Model, Action, Step, Field, Route
- 先建立接口，不立即重构现有代码

---

## 7. 路由映射

### 7.1 Router

```
现有：App.tsx NAV数组 + useState
    ↓
适配：RouterAdapter
```

**映射方式**：
- 保留现有NAV+useState路由
- 新增DynamicRoute支持schemaUid → FlowModel渲染
- 不引入React Router，保持轻量

---

## 8. 映射总结表

| NocoBase层 | 现有等价物 | 映射方式 | 优先级 |
|------------|-----------|----------|--------|
| Collection | types.ts | 新增collections.ts定义元数据 | P1 |
| Repository | db.ts | 新增Repository类包装db | P2 |
| DataSource | IndexedDB | 预留接口，不实现 | P3 |
| Resource | 无 | 新增useMultiRecordResource Hook | P4 |
| Action | Btn onClick | 新增ActionModel + Registry | P5 |
| FlowEngine | 无 | 全新实现最小版本 | P6 |
| FlowContext | 无 | 全新实现 | P6 |
| FlowModel | WidgetDef | 扩展WidgetDef为FlowModel | P7 |
| Model Tree | TabDef+WidgetDef | 扩展现有结构 | P7 |
| TableBlock | TableWidget | 包装为TableBlockModel | P8 |
| FormBlock | Field组件 | 新增FormBlockModel | P8 |
| Persistence | settings | settings中存flowModels | P9 |
| Plugin | 无 | 新增接口，不立即重构 | P10 |
| Builder | 无 | 延后 | P11 |
| Permission | 无 | 本地应用不需要 | P12 |
| i18n | 无 | 延后 | P13 |

---

## 9. 兼容性层（Compatibility Layer）

```
┌─────────────────────────────────────────┐
│         NocoBase-like API               │
│  Model | Flow | Resource | Action       │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Adapter Layer     │
        │  ModelAdapter       │
        │  ResourceAdapter    │
        │  ActionAdapter      │
        │  RepositoryAdapter  │
        │  CollectionAdapter  │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Existing System                 │
│  db.ts | pages/ | ui/ | App.tsx         │
└─────────────────────────────────────────┘
```

**原则**：
- Adapter层是唯一的新旧桥梁
- 新代码通过Adapter访问旧系统
- 旧代码不受影响，可继续运行
- 逐步迁移，不一次性替换

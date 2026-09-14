# CURRENT_ARCHITECTURE.md

> 媒电通工作台（MediaDesk）现有架构分析
> 生成时间：2026-09-14
> 项目根目录：D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app

---

## 1. Technology Stack

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | 33.0.0 |
| 前端框架 | React | 18.3.1 |
| 语言 | TypeScript | 5.6.2 (strict) |
| 构建工具 | Vite | 5.4.8 |
| 数据库 | IndexedDB (idb) | 8.0.0 |
| 搜索 | MiniSearch | 7.2.0 |
| Excel | xlsx | 0.18.5 |
| 自动更新 | electron-updater | 6.8.9 |
| 测试 | Vitest + Playwright | 2.1.1 / 1.63.0 |
| 打包 | electron-builder | 25.1.8 |

**无**：Redux/Zustand、React Router、ORM、后端服务、插件系统、i18n框架

---

## 2. Project Structure

```
app/
├── electron/                    # 主进程
│   ├── main.ts                  # 窗口管理、IPC、托盘、自动更新、AI桥接
│   └── preload.ts               # contextBridge 暴露 mta API
├── src/
│   ├── App.tsx                  # 主应用：路由(NAV)、数据加载、布局、主题
│   ├── db/
│   │   └── db.ts                # IndexedDB封装（AES-256-GCM加密，25个store）
│   ├── core/
│   │   ├── ai/                  # AI能力
│   │   │   ├── ask.ts           # AI请求封装
│   │   │   ├── client.ts        # AI客户端
│   │   │   ├── employees.ts     # AI员工角色定义（3角色）
│   │   │   └── rag.ts           # 知识库RAG检索
│   │   ├── derive.ts            # 派生数据计算（健康度、逾期等）
│   │   ├── importer.ts          # CSV导入
│   │   ├── metrics.ts           # 指标计算
│   │   ├── notify.ts            # 通知
│   │   ├── search.ts            # MiniSearch封装
│   │   ├── validators.ts        # 数据校验
│   │   ├── vault.ts             # 加密密钥管理
│   │   ├── desensitize.ts       # 脱敏
│   │   └── quota.ts             # 配额
│   ├── data/
│   │   ├── seed.ts              # 种子数据
│   │   └── seed2.ts             # 扩展种子数据
│   ├── ui/
│   │   ├── common.tsx           # 基础组件：Btn/Chip/Modal/Field/Progress/useToast
│   │   ├── RecordPage.tsx       # 通用记录详情页（Tab+Widget网格+拖拽重排）
│   │   ├── Dashboard.tsx        # 仪表盘容器
│   │   └── widgets/             # Widget组件
│   │       ├── FieldsWidget.tsx
│   │       ├── RelatedListWidget.tsx
│   │       ├── TimelineWidget.tsx
│   │       ├── KpiWidget.tsx
│   │       ├── BarChartWidget.tsx
│   │       ├── LineChartWidget.tsx
│   │       └── TableWidget.tsx
│   ├── components/
│   │   ├── AIAssistant.tsx      # AI助手悬浮面板
│   │   ├── Markdown.tsx         # Markdown渲染
│   │   ├── TopSearch.tsx        # 顶部搜索
│   │   ├── QuickCapture.tsx     # 快速采集
│   │   ├── NotificationPanel.tsx
│   │   ├── Onboarding.tsx
│   │   ├── ImportCustomers.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── icons.tsx            # SVG图标库
│   ├── pages/                   # 11个业务页面
│   │   ├── Today.tsx            # 首页/今日驾驶舱
│   │   ├── CRM.tsx              # 客户管理
│   │   ├── Work.tsx             # 任务看板
│   │   ├── Dev.tsx              # 商机管理（Pipeline看板）
│   │   ├── Media.tsx            # 媒介资源
│   │   ├── Kb.tsx               # 知识库
│   │   ├── Data.tsx             # 数据报表
│   │   ├── Growth.tsx           # 成长规划
│   │   ├── Settings.tsx         # 系统设置
│   │   ├── Help.tsx             # 帮助中心
│   │   └── Notifications.tsx    # 通知中心
│   ├── styles/
│   │   ├── tokens.css           # 设计变量（--brand/--data/--danger等）
│   │   └── app.css              # 全局样式
│   └── types.ts                 # 全局类型定义
├── tests/                       # 7个测试文件，36个测试
├── docs/                        # 文档
└── package.json
```

---

## 3. Existing Architecture

### 3.1 整体架构（单体应用）

```
┌─────────────────────────────────────────────────┐
│              Electron Main Process               │
│  窗口管理 | 托盘 | IPC | 自动更新 | AI桥接 | 备份  │
└──────────────────────┬──────────────────────────┘
                       │ contextBridge (mta API)
┌──────────────────────▼──────────────────────────┐
│              Renderer Process (React)            │
│                                                  │
│  App.tsx (路由+数据加载+布局)                     │
│    ├── NAV数组 (11个页面，useState切换)           │
│    ├── 全局数据加载 (db.getAll → useState)        │
│    ├── 主题切换 (dark/light)                     │
│    └── 全局组件 (TopSearch/AIAssistant/QuickCapture) │
│                                                  │
│  Pages (业务逻辑+UI硬编码)                        │
│    ├── 直接调用 db.put/db.softDelete              │
│    ├── 直接调用 window.mta.aiChat                 │
│    └── useToast 反馈                              │
│                                                  │
│  UI Layer                                        │
│    ├── common.tsx (基础组件)                      │
│    ├── RecordPage.tsx (Widget容器)                │
│    └── widgets/ (7个Widget)                       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Data Layer (IndexedDB)              │
│  db.ts: getAll/put/softDelete/setSetting/...     │
│  AES-256-GCM 静态加密                             │
│  25个 ObjectStore (schema v2)                    │
└─────────────────────────────────────────────────┘
```

### 3.2 架构特征

- **单体应用**：无后端服务，所有逻辑在渲染进程
- **直接数据访问**：页面组件直接调用 `db.put()` / `db.softDelete()`，无Repository/Resource抽象层
- **硬编码路由**：NAV数组 + useState，无React Router
- **硬编码UI**：页面内直接写JSX，无Model/Flow配置
- **全局状态**：App.tsx加载所有数据，通过props传递给页面
- **无插件系统**：所有功能硬编码在源码中
- **无FlowEngine**：按钮onClick直接执行业务逻辑

---

## 4. Existing Data Layer

### 4.1 数据库

- **类型**：IndexedDB（浏览器内置）
- **封装**：`idb` 库 (v8.0.0)
- **加密**：AES-256-GCM，密钥由 `safeStorage` 加密存储
- **Schema版本**：v2（25个store）

### 4.2 Store清单（25个）

| 分类 | Store |
|------|-------|
| 元数据 | meta, settings, operationLogs |
| 客户 | customers, contacts, customerContactRels, contactPoints |
| 商机 | deals |
| 合同 | contracts, payments |
| 任务 | tasks, objectives |
| 媒介 | pitches, suppliers, resources, ratecards, scheduleItems, postbuys |
| 知识 | notes, baselines, aars |
| 其他 | influencers |

### 4.3 数据访问API

```typescript
db.getAll(store)          // 获取全部
db.get(store, id)         // 获取单条
db.put(store, record)     // 新增/更新
db.softDelete(store, id)  // 软删除
db.setSetting(key, val)   // 设置
db.getSetting(key)        // 读取
db.clearAll()             // 清空全部（危险）
```

### 4.4 数据模型定义

- **位置**：`src/types.ts`
- **方式**：TypeScript interface，无运行时schema
- **无**：Collection定义、Field元数据、Relation声明、Index配置

---

## 5. Existing API Layer

### 5.1 无HTTP API

- 纯本地应用，无后端HTTP服务
- AI请求通过主进程桥接：`window.mta.aiChat()` / `window.mta.chatStream()`

### 5.2 IPC桥接（preload.ts）

```typescript
window.mta = {
  // AI
  aiChat, aiSaveKey, aiLoadKey, aiEnvKey,
  chatStream, onStreamChunk, onStreamDone, onStreamError,
  // 窗口
  windowMinimize, windowMaximize, windowClose,
  titlebarSet, titlebarSetTheme, windowMode,
  // 系统
  onQuickCapture, setLoginItem, getLoginItem,
  backupPickDir, backupWrite,
  // 更新
  onUpdateReady, installUpdate,
}
```

---

## 6. Existing UI Layer

### 6.1 基础组件（common.tsx）

| 组件 | 说明 |
|------|------|
| Btn | 按钮（primary/ghost/data/draft/done/danger） |
| Chip | 标签（brand/data/green/warn/danger/gray） |
| Modal | 模态框 |
| Field | 表单字段 |
| Progress | 进度条 |
| useToast | 通知（返回 {show, node}） |

### 6.2 Widget系统（ui/widgets/）

| Widget | 说明 |
|--------|------|
| FieldsWidget | 字段展示 |
| RelatedListWidget | 关联列表 |
| TimelineWidget | 时间线 |
| KpiWidget | KPI卡片 |
| BarChartWidget | 柱状图 |
| LineChartWidget | 折线图 |
| TableWidget | 表格 |

### 6.3 页面容器

- **RecordPage.tsx**：Tab栏 + Widget网格，支持editing模式下拖拽重排
- **Dashboard.tsx**：仪表盘容器

### 6.4 设计系统

- **tokens.css**：CSS变量（--brand, --data, --danger, --warning, --success, --surface*, --border*）
- **app.css**：全局样式
- **禁止硬编码颜色**

---

## 7. Existing State Management

- **方式**：React `useState` / `useEffect` / `useCallback`
- **全局数据**：App.tsx中 `useState<DataSet>` 加载全部数据，通过props传递
- **无**：Redux、Zustand、MobX、Context API（除useToast外）

### 7.1 数据流

```
App.tsx useEffect
  → db.getAll(各store)
  → setDataSet(...)
  → props传递给当前Page
  → Page内useState管理局部状态
  → 用户操作 → db.put → 重新加载数据
```

---

## 8. Existing Router

- **方式**：硬编码NAV数组 + `useState<View>`
- **无**：React Router、URL路由、动态路由
- **导航**：`setView(key)` 切换，或 `window.dispatchEvent(new CustomEvent("nav", {detail}))`

### 8.1 NAV定义

```typescript
const NAV = [
  { key: "today", label: "首页", group: "常用" },
  { key: "crm", label: "客户管理", group: "业务" },
  { key: "work", label: "任务看板", group: "业务" },
  { key: "dev", label: "商机管理", group: "业务" },
  { key: "media", label: "媒介资源", group: "业务" },
  { key: "kb", label: "知识库", group: "业务" },
  { key: "data", label: "数据报表", group: "业务" },
  { key: "growth", label: "成长规划", group: "业务" },
  { key: "settings", label: "系统设置", group: "系统" },
  { key: "help", label: "帮助中心", group: "系统" },
  { key: "notifications", label: "通知", group: "系统" },
]
```

---

## 9. Existing Plugin / Extension System

- **状态**：MISSING
- **无**：插件接口、插件管理器、插件注册、插件生命周期
- **所有功能**：硬编码在源码中

---

## 10. Existing Persistence

### 10.1 数据持久化

- IndexedDB（AES-256-GCM加密）
- 备份功能：`window.mta.backupPickDir()` + `backupWrite()`

### 10.2 配置持久化

- `settings` store：键值对存储
- `window-mode.json`：用户数据目录下的JSON文件（标题栏模式）
- AI对话历史：`settings` store中 `aiChat_{empId}` 键

### 10.3 UI配置持久化

- **部分**：RecordPage布局可编辑但未持久化
- **无**：flowModels表、uiSchemas表、页面配置保存

---

## 11. Existing Authentication / Authorization

- **状态**：MISSING（本地应用，无需登录）
- **无**：用户系统、角色、权限、Session
- **数据安全**：依赖IndexedDB加密 + OS用户隔离

---

## 12. Existing i18n

- **状态**：MISSING
- **所有文本**：硬编码中文
- **无**：i18n框架、locale文件、翻译key

---

## 13. Existing Testing

### 13.1 单元测试（Vitest）

| 测试文件 | 覆盖 |
|----------|------|
| core.test.ts | 核心逻辑 |
| db.test.ts | 数据库 |
| ai.test.ts | AI功能 |
| ai-p3.test.ts | AI P3功能 |
| vault.test.ts | 加密 |
| bench.test.ts | 性能基准 |

### 13.2 E2E测试（Playwright）

- `app.e2e.ts`：应用端到端测试

### 13.3 测试统计

- 7个测试文件，36个测试全部通过
- typecheck：0错误

---

## 15. 深度分析：数据访问模式统计（Phase 0 补充）

### 15.1 各页面db调用统计（2026-09-14实测）

| 页面 | db调用次数 | toast次数 | alert/confirm | 直接数据访问度 |
|------|-----------|----------|---------------|---------------|
| CRM.tsx | 23 | 11 | 0 | 高 |
| Settings.tsx | 28 | 26 | 0 | 高 |
| Media.tsx | 14 | 20 | 0 | 高 |
| Dev.tsx | 11 | 9 | 0 | 高 |
| Growth.tsx | 10 | 2 | 0 | 高 |
| Kb.tsx | 7 | 2 | 0 | 中 |
| Work.tsx | 5 | 5 | 0 | 中 |
| Data.tsx | 4 | 4 | 0 | 中 |
| Notifications.tsx | 2 | 1 | 0 | 低 |
| Today.tsx | 2 | 2 | 0 | 低 |
| Help.tsx | 0 | 0 | 0 | 无 |

**合计**：106次db调用，82次toast，0次window.alert/confirm
**结论**：
- window.alert/confirm已全部替换为useToast ✅
- 所有页面直接调用db，无Repository/Resource中间层
- 页面既是UI层又是数据访问层又是业务逻辑层（违反NocoBase分层）

### 15.2 db.ts完整API清单（19个方法）

| 方法 | 说明 | 对应NocoBase层 |
|------|------|---------------|
| put(store, value, logWhat?) | 新增/更新+操作日志 | Repository.create/update |
| get(store, id) | 读取单条 | Repository.findOne |
| getAll(store) | 读取全部 | Repository.find |
| putMany(store, values) | 批量写入（事务） | Repository.bulkCreate |
| softDelete(store, id, what) | 软删除+日志 | Repository.destroy |
| restore(store, id) | 恢复软删除 | Repository.restore |
| purge(store, id) | 物理删除 | Repository.purge |
| listTrashed() | 回收站列表 | Repository.listTrashed |
| logOp(entry) | 操作日志 | AuditLog |
| undoLog(logId) | 撤销操作 | Repository.undo |
| getSetting(key, fallback) | 读取设置 | Settings |
| setSetting(key, value) | 写入设置 | Settings |
| dumpAll() | 全量备份导出 | Backup |
| restoreAll(dump) | 全量恢复 | Restore |
| clearAll() | 清空全部（危险） | — |

**架构价值**：db.ts已经具备Repository层的雏形（19个方法），可直接作为Repository的底层实现，无需重写。

### 15.3 App.tsx数据流详解

```
启动流程：
  App挂载
    → db.getSetting("onboarded")
    → 首次? Onboarding引导 : seedIfEmpty() + seedExtraIfEmpty()
    → loadAll() 加载21个数据集
    → setData(dataSet)
    → 构建搜索索引 rebuildIndex(docs)
    → 启动自动备份定时器(60s)
    → 启动snoozed提醒定时器(60s)

数据流：
  App.tsx loadAll()
    → db.getAll × 20个store + db.getSetting × 3
    → useState<DataSet> (21个字段)
    → props传递给11个页面组件
    → 页面修改 → db.put() → reload() → 全量重新加载
```

**架构缺陷**：
1. **全量加载**：每次reload()重新加载全部21个数据集，数据量大时性能差
2. **props钻透**：11个页面通过props传递20+数据字段，耦合严重
3. **无缓存**：每次操作后全量刷新，无增量更新
4. **无状态管理**：useState + props，无统一store

### 15.4 AI架构详解

```
AIAssistant.tsx (悬浮面板)
  ├── EMPLOYEES (3个角色: 分析师/管家/顾问)
  │     ├── systemPrompt (角色提示词)
  │     ├── welcome (欢迎语)
  │     ├── suggestions (快捷问题)
  │     └── shortcuts (快捷任务: 生成周报/回款预警/转化分析)
  ├── retrieveNotes() (RAG知识库检索)
  │     └── 2-gram分词 → 标题加权 → Top3笔记注入
  ├── chatStream (流式输出)
  │     └── 主进程桥接 → OpenRouter API
  └── 对话历史持久化
        └── settings store: aiChat_{empId}

调用链：
  用户输入
    → AIAssistant.handleSend()
    → buildContext(page) 注入页面上下文
    → retrieveNotes(question) 注入知识库
    → chatStream(messages) 
    → window.mta.chatStream → 主进程 → OpenRouter
    → onStreamChunk → 打字机渲染
```

**架构价值**：AI架构已接近NocoBase的AI Employee设计，3角色+上下文注入+RAG+快捷任务，可复用的设计模式。

### 15.5 RecordPage/Widget架构详解

```
RecordPage.tsx (通用记录详情容器)
  ├── RecordLayout { entity, tabs[] }
  │     └── TabDef { id, title, widgets[] }
  │           └── WidgetDef { id, type, title, span, config }
  ├── 渲染: Tab栏 + Widget网格
  └── editing模式: 拖拽重排(HTML5 Drag API)

Widgets (7个):
  FieldsWidget       → 字段展示
  RelatedListWidget  → 关联列表
  TimelineWidget     → 时间线
  KpiWidget          → KPI卡片
  BarChartWidget     → 柱状图
  LineChartWidget    → 折线图
  TableWidget        → 表格
```

**架构价值**：RecordPage已经实现了NocoBase的Model Tree雏形：
- TabDef ≈ PageModel
- WidgetDef ≈ BlockModel
- renderWidget回调 ≈ Model Renderer
- 拖拽重排 ≈ Builder的编辑模式

**缺口**：layout未持久化、未绑定Collection、无Resource数据源、widget不可动态增删。

### 15.6 数据模型定义（types.ts）

**21个interface + 4个type**：

| 业务域 | 模型 |
|--------|------|
| 客户域 | Customer, Contact, Rel, ContactPoint |
| 商机域 | Deal, DealStage, Grade |
| 合同域 | Contract, Payment |
| 任务域 | Task, Objective, Milestone |
| 媒介域 | Pitch, Supplier, PricePoint, MediaResource, RateCard, ScheduleItem, PostBuy, Influencer |
| 知识域 | Note, Baseline, Aar |
| 枚举 | DealStage, Grade, RelRole, KanbanCol |

**架构价值**：类型定义完整（25个模型），可直接映射为Collection定义。
**缺口**：无运行时schema（字段类型/标签/选项/校验），UI无法根据模型自动生成。

---

### 14.1 现有优势

1. 功能完整：11个业务页面，覆盖CRM/商机/合同/媒介/知识/数据
2. 数据安全：IndexedDB + AES-256-GCM加密
3. Widget系统：已有7个可复用Widget + RecordPage容器
4. AI能力：AI助手 + RAG + 3个员工角色
5. 测试基础：36个测试 + typecheck

### 14.2 架构缺口（对照NocoBase）

| NocoBase层 | 现有状态 | 缺口 |
|------------|----------|------|
| Plugin | MISSING | 无插件系统 |
| FlowEngine | MISSING | 无工作流引擎 |
| FlowModel | MISSING | 无UI模型 |
| Flow | MISSING | 无事件流 |
| Step | MISSING | 无步骤抽象 |
| FlowContext | MISSING | 无运行上下文 |
| Resource | MISSING | 无前端数据访问抽象 |
| Action | PARTIAL | 按钮直接调db，无ActionModel |
| Repository | MISSING | 无Repository层，页面直连db |
| Collection | MISSING | 无Collection定义，只有TS类型 |
| DataSource | PARTIAL | 只有IndexedDB，无多数据源 |
| Model Tree | PARTIAL | RecordPage有Widget树，但不可配置 |
| Persistence | PARTIAL | 数据持久化有，UI配置无 |
| Builder | MISSING | 无可视化构建器 |
| i18n | MISSING | 无国际化 |
| Permission | MISSING | 无权限系统 |

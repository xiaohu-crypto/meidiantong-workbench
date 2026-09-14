# 竞品调研报告：hcengineering / Huly Platform

> 调研对象：[github.com/hcengineering/platform](https://github.com/hcengineering/platform)（27.7k star / 2.1k fork / EPL-2.0）
> 调研日期：2026-09-13
> 调研目的：为媒电通工作台（Electron + React + TS + Vite，左导航+顶栏+内容区三栏）提供可落地 UI/UX 改进清单
> 调研方法：GitHub README / ARCHITECTURE_OVERVIEW.md / packages/ui 源码结构 / huly.io 官网首屏截图 / issues 关键词检索（UX 14 open、keyboard shortcut 5 open）

---

## 一、产品概述

**Huly Platform** 是一个开源一体化工作平台（Self-Hostable），定位 "Linear + Jira + Slack + Notion + Motion" 替代品。核心模块覆盖：

| 模块 | 说明 |
|---|---|
| Tracker | 项目/issue 管理（看板、列表、时间线、甘特图） |
| CRM | 客户/商机/联系人管理 |
| Chat | 团队即时通讯 |
| HRM / ATS | 人事与招聘 |
| Documents | Notion 风格文档 |
| Office | 虚拟办公室（音视频） |

技术特点：**30+ 微服务后端 + Svelte 4 前端 + Electron 桌面端**，monorepo 用 Microsoft Rush 管理。Hosted 版已于 2025-07-20 关停，主推自托管。

---

## 二、整体架构与技术栈

### 2.1 前端

| 层 | 选型 | 证据 |
|---|---|---|
| 框架 | **Svelte 4.2.12**（不是 React/Vue） | `.prettierrc` 提交记录 "Update to svelte 4.2.12"、`rush svelte-check` 脚本 |
| 语言 | TypeScript 5.8.3 | tsconfig、`rush validate` 生成 d.ts |
| 构建 | **webpack**（非 Vite） | `rush bundle` / `rush package` |
| Monorepo | **@microsoft/rush** | `rush.json`、README "You need Microsoft's rush" |
| 状态管理 | **自研 stores**（非 Redux/Zustand） | `packages/ui/src/stores.ts`、`foundations/core` |
| UI 库 | **自研组件库**（非 AntD/MUI） | `packages/ui/src/components/` 100+ `.svelte` 文件 |
| 主题 | 自研 token 系统 | `packages/theme` + `packages/ui/src/colors.ts` |
| 桌面端 | **Electron** | `desktop/` + `desktop-package/` |
| 富文本/协同 | **Y.js CRDT** | `foundations/collaborator` 服务（端口 3078） |

### 2.2 后端（关键微服务）

| 服务 | 端口 | 职责 | 与 UI 直接相关 |
|---|---|---|---|
| transactor | 3332 | 所有数据变更 + **WebSocket 实时推送** | 列表/详情自动刷新 |
| account | 3000 | 认证、JWT、工作区权限 | 登录/角色 |
| collaborator | 3078 | Y.js CRDT 协同编辑 | 文档/评论多人编辑 |
| hulypulse | 8099 | **WebSocket 通知推送** | Inbox 实时更新 |
| fulltext | 4702 | Elasticsearch 全文索引 | 全局搜索 |
| rekoni | 4004 | PDF/DOCX 文本提取 | 附件可搜索 |
| datalake | 4030 | MinIO 文件存储 | 附件上传 |

### 2.3 数据层
- 主库：**CockroachDB**（分布式 SQL）
- 搜索：**Elasticsearch**
- 对象存储：**MinIO（S3 API）**
- 缓存/Pub-Sub：**Redis**（经 hulypulse）
- 事件流：**Redpanda（Kafka 兼容）**

> 对媒电通的启示：Huly 的实时性不依赖前端轮询，而是 transactor（数据）+ hulypulse（通知）两条 WebSocket 长连接。媒电通当前若用 REST 轮询，可优先在客户列表/商机看板接入 WebSocket 推送。

---

## 三、UI/UX 十维度拆解

### 维度 1：整体布局模式

Huly 采用 **"四级嵌套布局"**（从左到右）：

```
┌──────┬─────────────┬──────────────────────────┬──────────┐
│ Dock │  Secondary  │      Main Workspace      │  Inbox   │
│ 56px │   Sidebar   │                          │  ~360px  │
│      │   ~240px    │                          │ (可折叠) │
│ 图标 │  导航树/视图 │  面包屑+视图+数据区       │ 通知抽屉 │
└──────┴─────────────┴──────────────────────────┴──────────┘
```

**具体尺寸与视觉（来自 huly.io 首屏截图）：**

| 区域 | 宽度 | 背景色 | 内容 |
|---|---|---|---|
| Dock（最左） | **56px** | 深色（#1a1a1a 级） | huly logo + 垂直应用图标（Dashboard/Chat/Tracker/Contacts…）+ 时间追踪圆环（56% 进度） |
| 二级侧边栏 | **~240px** | 深色半透明 | 当前模块名（"Tracker"）+ 搜索框 + "My issues / All issues" + 视图切换按钮 + 项目树分组 |
| 主工作区 | 弹性 | 深色（#2b2b2b 级） | 面包屑 + 视图 Tab（Kanban/List/Timeline）+ 看板泳道 |
| Inbox 抽屉 | **~360px** | 深色 | Tasks/Chat/All 三 Tab + 通知流 |

**与媒电通对比**：媒电通当前是"左导航+顶栏+内容区"三栏。Huly 多了两个维度：
- **Dock 应用级图标栏**（56px，放跨模块应用切换，类似 macOS Dock / VSCode 活动栏）
- **右侧 Inbox 抽屉**（360px，全局通知聚合，不占常驻空间）

### 维度 2：导航结构

Huly 导航分 **四层**，职责严格分离：

| 层级 | 组件 | 职责 | 交互细节 |
|---|---|---|---|
| L0 应用切换 | **Dock.svelte** | 跨模块（Tracker/CRM/Chat/Docs） | 56px 窄栏，纯图标，hover 出 tooltip |
| L1 模块导航 | **NavGroup.svelte / NavItem.svelte** | 模块内菜单分组（All projects / CRM / Issues / Components / Milestones / Templates） | 可折叠分组，当前项高亮（左侧 2px 强调条） |
| L2 视图切换 | **Tabs.svelte / TabList.svelte** | 同一列表的 Kanban/List/Timeline 视图 | 按钮组，选中态下划线/背景 |
| L3 工作区标签 | **WorkbenchTabs** | 多对象并发打开（类似浏览器 Tab） | 顶部可关闭标签，支持右键关闭其他 |

**面包屑**（`Breadcrumbs.svelte` + `Breadcrumb.svelte`）：
- 格式：`Your projects / CRM / Issues`
- 每级可点击返回，当前页不链接
- 位于主工作区顶部、视图 Tab 上方

**项目树分组规则**（从截图可见）：
- `All projects`（根）
- `YOUR PROJECTS`（大写分组标题，浅灰字，非交互）
- 项目项（CRM、Issues、Components、Milestones、Templates、Marketing and PM、Next Platform）
- 项目下可再嵌套子节点

### 维度 3：数据展示模式（视图切换）

**Huly 支持 6 种视图**，切换方式统一在**侧边栏顶部**（不是在主工作区右上角）：

| 视图 | 实现包 | 适用场景 |
|---|---|---|
| **Kanban 看板** | `packages/kanban` | 任务流（BACKLOG/TO DO/IN PROGRESS 泳道） |
| **List 列表** | 内置 | 紧凑行式浏览 |
| **Timeline 时间线** | `Timeline.svelte` | 按时间轴排布 |
| **Table 表格** | 内置 | 多列数据 |
| **Gantt 甘特图** | `packages/gantt`（PR #10992，2026-09 新增） | 项目排期 |
| **Calendar 日历** | `components/calendar/` | 日程/里程碑 |

**看板卡片信息架构**（从截图还原）：
```
┌─────────────────────────┐
│  Set up cluster         │  ← 标题（14px 白色）
│  monitoring             │
│                         │
│  [Low]   [team]  60%    │  ← 优先级 chip + 标签 + 进度
│  [avatar] Freelynk      │  ← 负责人头像 + 姓名
└─────────────────────────┘
```
- 优先级 chip 颜色：**Low=蓝色、Medium=橙色、High=红色**（圆角胶囊，~6px 圆角）
- 进度：百分比 + 细进度条（约 2px 高）
- story points：卡片底部小数字（"20% / 50%"）
- 卡片间距：约 8-12px，泳道间距约 16px

### 维度 4：搜索与筛选交互

Huly 搜索体系分三层：

| 层 | 组件 | 能力 |
|---|---|---|
| 模块内搜索 | `SearchInput.svelte` | 简单关键词 |
| **高级搜索** | `SearchInputAdvanced.svelte` + `.encoder.ts` + `.sync.ts` | **字段前缀搜索**（如 `assignee:john status:inprogress`）、**inline filter chips**、零高亮（PR #10992） |
| 全局搜索 | `SearchPicker.svelte` + `search.ts` | 跨模块搜索（issue/文档/联系人/聊天） |

**关键交互细节**：
- 搜索框 placeholder 带省略动画（`SearchDots` 字符串）
- 高级搜索结果可一键"保存为视图"
- 筛选条件以 **chip 形式**内联在搜索框下方，点击 × 移除单个条件
- 后端 Elasticsearch 索引 + rekoni 文档解析（PDF/DOCX 可搜）

### 维度 5：详情页设计

Huly 详情页有 **三种打开方式**，按内容权重选择：

| 方式 | 组件 | 尺寸/位置 | 适用 |
|---|---|---|---|
| **侧边抽屉** | `Panel.svelte` + `panelup.ts` | 右侧 ~600px，从右滑入，不关闭列表 | 轻量详情（issue/联系人预览） |
| **居中弹窗** | `Popup.svelte` / `PopupInstance.svelte` | 居中，最大 ~800px，带遮罩 | 表单/编辑 |
| **模态对话框** | `Dialog.svelte` | 居中小窗，强制操作 | 确认/删除 |

**Panel（抽屉）信息架构**：
- 头部：图标 + 标题 + 关闭按钮
- 主体：字段分区（状态/负责人/优先级/截止日期/描述/子任务/活动日志）
- 底部：操作按钮组（评论/状态变更）
- 支持"最大化"按钮（占满主工作区宽度）

**行内编辑**：`EditBox.svelte` 支持不离开列表直接改字段（标题、优先级、状态）。

### 维度 6：空/加载/错误状态

| 状态 | 组件 | 视觉 |
|---|---|---|
| 首屏加载 | `AppLoading.svelte` | 全屏品牌 loading |
| 列表加载 | `Spinner.svelte` | 居中转圈 |
| 空列表 | `SectionEmpty.svelte` | 插画 + 主标题 + 副文案 + CTA 按钮 |
| 全局错误 | `RootStatusComponent.svelte` | 底部红色横幅 |
| 通知成功 | `NotificationToast.svelte` | 右下角 toast，自动消失 |
| 图片加载占位 | `Blurhash.svelte` | 模糊哈希渐显 |
| 打印/导出 | `Panel` 有 print mode 适配（PR #10962） |

### 维度 7：键盘快捷键

Huly 官网首屏**明确宣传 "Keyboard shortcuts. Work efficiently with instant access to common actions."** 作为核心卖点之一。

**已知问题（来自 issues）**：
- #7102：键盘快捷键不工作（3 条评论）
- #9960：GNOME 输入法切换时光标丢失
- #9882：输入 `:-)` 应自动转 emoji（类 Slack）
- #7814：撤销/粘贴快捷键修复

**焦点管理**：`packages/ui/src/focus.ts` 专门处理焦点链，支持 Tab 键在复杂弹窗内循环。

> 对媒电通启示：快捷键是 Huly 对标 Linear/Jira 的核心竞争力，但他们自己都有 bug。媒电通若做，先保证 5-8 个核心键（⌘K 命令面板、N 新建、/ 聚焦搜索、J/K 上下移动、E 编辑、⌘Enter 保存）稳定可用，比堆砌 30 个键位更重要。

### 维度 8：通知与实时更新

**双通道实时推送**：

| 通道 | 服务 | 用途 |
|---|---|---|
| 数据变更 | transactor（WS :3332） | 列表/看板自动刷新（别人改了任务，我这里立刻变） |
| 通知推送 | hulypulse（WS :8099） | @提及、分配、评论推到 Inbox |

**Inbox 设计**（右侧抽屉）：
- 三个 Tab：**Tasks / Chat / All**
- 通知项：头像 + 消息摘要 + 来源模块标签（CRM / General / Issues）+ 时间戳（"3 hours ago"）
- 支持批量已读、按模块筛选
- PR #10789：**定时通知调度**（可设置通知静默时段）

### 维度 9：自定义与配置能力

| 能力 | 实现 |
|---|---|
| **插件系统** | `plugin()` 函数（`@hcengineering/platform`），CRM/HRM/ATS/Tracker 都是插件，`packages/plugins/` 目录 |
| **卡片类型自定义** | `Card type` 下拉可搜索（#9836），可扩展自定义字段 |
| **主题切换** | `packages/theme` + `colors.ts` 亮/暗双 palette（24 色，每色含 60% 数字色 + 20% 背景色） |
| **i18n** | 内置 13 种语言：英/俄/西/葡/中/法/意/捷/德/日/韩/土/波 |
| **头像色生成** | HSL 算法自动从用户名生成稳定颜色（`defineAvatarColor`） |
| **工作区隔离** | 多 workspace，每个 workspace 独立数据 |
| **API Client** | 类型化 API，可写外部集成 |

**颜色 token 细节**（`colors.ts`）：
- 24 色命名色板：Firework `#D15045`、Watermelon `#DB877D`、Pink `#EF86AA`、Fuchsia `#EB5181`、Lavander `#DC85F5`、Mauve `#925CB1`、Heather `#7B86C6`、Orchid `#8458E3`、Blueberry `#6260C2`、Arctic `#8BB0F9`、Sky `#4CA6EE`、Cerulean `#5195D7`、Turquoise、Houseplant、Crocodile、Grass、Sunshine、Orange、Pumpkin、Cloud、Coin、Porpoise…
- 每色自动派生：主色、60% 透明度数字色、20% 透明度背景色
- 暗色主题下背景改为 `linear-gradient(90deg, color@15%, color@0%)` 渐变

---

## 四、可落地改进清单（按优先级）

> 媒电通现状假设：Electron + React + TS + Vite，左导航 + 顶栏 + 内容区三栏。
> 复杂度估算：S = 1-2 人日 / M = 3-7 人日 / L = 2-4 周。

### P0（立即做，高价值低成本）

| # | 改进项 | 用户价值 | 实现复杂度 | 具体做法 |
|---|---|---|---|---|
| P0-1 | **右侧 Inbox 通知抽屉** | 不离开当前页面处理 @提及/分配/评论，减少上下文切换 | M | 新增 360px 右侧可折叠抽屉，三 Tab（待办/消息/全部），WebSocket 推送，未读红点。参考 Huly `panelup.ts` 模式 |
| P0-2 | **搜索框下方 inline filter chips** | 筛选条件可视化、可单独删除，比弹窗筛选直观 | S | 高级筛选后，将条件渲染为可删除 chip（圆角胶囊 × 按钮），点击 × 移除单条件 |
| P0-3 | **看板卡片信息标准化** | 客户/商机卡片一眼看懂状态、负责人、进度 | S | 卡片统一：标题 + 负责人头像 + 优先级 chip（高=红/中=橙/低=蓝）+ 进度条 + 时间。参考 Huly 卡片结构 |
| P0-4 | **空状态插画 + CTA** | 新用户首次进入不困惑，知道下一步做什么 | S | 每个列表空态配插画 + "暂无客户，点击新建"主按钮，替代纯"暂无数据" |
| P0-5 | **面包屑导航** | 深层级（客户>联系人>跟进记录）可快速回退 | S | 主工作区顶部加面包屑：`客户 / 北京科技有限公司 / 跟进记录`，每级可点 |

### P1（本迭代做，高价值）

| # | 改进项 | 用户价值 | 实现复杂度 | 具体做法 |
|---|---|---|---|---|
| P1-1 | **视图切换按钮组**（列表/看板/日历/表格） | 同一份数据多种视角，CRM 客户既要看表也要看板 | M | 侧边栏顶部或主区右上角加 Segmented Control：列表/看板/日历，URL 同步，记忆用户偏好 |
| P1-2 | **左侧 Dock 应用图标栏**（56px） | 多模块（客户/项目/合同/报表）快速切换，不用展开整棵树 | M | 最左加 56px 深色窄栏，纯图标，hover tooltip，当前项底部 2px 高亮条。二级侧边栏保留模块内导航 |
| P1-3 | **⌘K 命令面板** | 高频操作（新建客户、跳转到某联系人、切换视图）不碰鼠标 | M | 居中浮层：输入即过滤，支持 actions（新建/跳转/切换主题），上下键选择，Enter 执行 |
| P1-4 | **详情侧边抽屉（不离开列表）** | 看客户详情不用跳页，列表上下文保留 | M | 点击列表项从右侧滑出 ~600px 抽屉，字段分区展示，支持"最大化"按钮占满内容区 |
| P1-5 | **WebSocket 实时刷新** | 多人协作时客户状态/跟进记录实时同步，不用 F5 | L | 后端推送变更事件，前端列表/看板局部更新（React Query invalidate 或 SWR subscription） |
| P1-6 | **全局快捷键 8 个核心键** | 重度用户提效 | S | 绑定：⌘K 命令面板、N 新建、/ 聚焦搜索、J/K 上下移动、E 编辑、⌘Enter 保存、[ 切到上一客户。做快捷键 cheat sheet（? 键呼出） |
| P1-7 | **行内编辑（EditBox）** | 列表直接改状态/优先级，不用进详情 | S | 列表单元格 hover 出现编辑图标，点击变输入框，Enter 保存 Esc 取消 |

### P2（下一迭代，锦上添花）

| # | 改进项 | 用户价值 | 实现复杂度 | 具体做法 |
|---|---|---|---|---|
| P2-1 | **暗色主题** | 长时间使用护眼，开发者用户偏好 | M | 抽 CSS 变量，色板分 light/dark 两套，跟随系统或手动切换 |
| P2-2 | **24 色标签色板** | 客户分级/行业标签用颜色区分，比文字更直观 | S | 定义 24 色命名色板，每色自动派生主色/60%数字/20%背景，标签编辑器可选色 |
| P2-3 | **模糊哈希图片占位** | 头像/客户 logo 加载时不白屏 | S | 上传时生成 blurhash，列表先用模糊占位再渐显清晰图 |
| P2-4 | **通知 Toast**（右下角自动消失） | 保存成功/错误提示不打断当前操作 | S | 右下角浮层，成功绿/错误红，3s 自动消失，支持手动关闭 |
| P2-5 | **工作区多标签（Workbench Tabs）** | 同时打开多个客户/项目，像浏览器 Tab 切换 | L | 顶部加可关闭标签栏，右键"关闭其他/关闭右侧"，URL 同步 |
| P2-6 | **字段前缀高级搜索** | `owner:张三 status:跟进中 amount>10w` 一次写全条件 | L | 搜索框支持语法解析，字段建议下拉，结果以 chip 回显 |
| P2-7 | **定时通知/勿扰** | 非工作时间不被打扰 | M | 用户可设勿扰时段，通知延迟到次日工作时间推送 |
| P2-8 | **i18n 多语言骨架** | 未来出海/双语客户无技术债 | M | 所有文案抽 i18n key，先中/英两语言，预留语言切换器位置 |

---

## 五、关键参考链接

- 仓库：https://github.com/hcengineering/platform
- 架构文档：https://github.com/hcengineering/platform/blob/develop/ARCHITECTURE_OVERVIEW.md
- UI 组件库：https://github.com/hcengineering/platform/tree/develop/packages/ui/src/components
- 颜色 token：https://github.com/hcengineering/platform/blob/develop/packages/ui/src/colors.ts
- 官网首屏截图（已捕获）：huly.io 顶部首屏，展示 Tracker 模块 Kanban 视图 + Inbox 抽屉
- Issues 参考：
  - UX 类：https://github.com/hcengineering/platform/issues?q=is%3Aissue+UX（14 open）
  - 键盘快捷键：https://github.com/hcengineering/platform/issues?q=is%3Aissue+keyboard+shortcut（5 open）

---

## 六、调研局限

1. **在线 demo 522 超时**（front.hc.engineering 不可达），未能亲测交互细节，UI 尺寸/颜色基于官网首屏静态截图推断，实际实现可能有出入。
2. Hosted Huly 已于 2025-07-20 关停，社区活跃度可能下降，issues 反馈停留在 2026-04 最新一条。
3. Huly 是 Svelte 技术栈，媒电通是 React，**架构可借鉴但代码不可直接移植**，改进清单已按 React 技术栈重写实现方式。
4. 未深入 CRM 模块具体页面（客户详情/商机漏斗），看板视图以 Tracker issue 为主，CRM 交互需后续补充调研。

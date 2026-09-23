# 媒电通工作台 (MediaDesk Workbench)

> 本地优先的媒体广告代理桌面工具 — 客户管理、商机跟进、媒介策略、数据分析、知识沉淀一体化，并内置 NocoBase 风格的低代码管理内核（数据表 / 页面构建器 / 工作流 / AI 员工 / 角色权限）。

[![Version](https://img.shields.io/badge/version-0.2.0-blue)](https://github.com/xiaohu-crypto/meidiantong-workbench/releases)
[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C5?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 功能特性

### 📊 今日驾驶舱
- 智能行动清单（Next-Best-Action 规则引擎）
- 季度目标 KR 进度追踪
- 待回款汇总与逾期提醒
- 常用功能快捷入口

### 👥 CRM 客户管理
- 客户全生命周期管理（线索 → MQL → SQL → 商机 → 签约）
- 360° 客户详情（概览 / 跟进 / 决策链 / 媒介策略 / AI 建议）
- 客户健康度评分与阶段自动派生
- 客户去重合并、决策链联系人、SOP 话术库
- 字段可见性自定义与密度切换

### 🎯 客户开发系统
- Pipeline 看板（支持自定义阶段、三视图：看板 / 表格 / 日历）
- MEDDIC + BANT 双框架商机资格评估
- 比稿管理（投入 / 竞对 / 结果 / 复盘）+ AI 写 Pitch
- SOP 话术库

### 📈 数据分析报表
- 可定制仪表盘（KPI / 柱状图 / 折线图 / 表格 Widget）
- 签约额、回款、毛利多口径分析；商机漏斗图
- 行业基准值对标；Widget 拖拽布局编辑
- PostBuy 投后复盘 + ROI 看板（曝光 / CPM / ROI / CTR）

### 🤖 AI 能力（本地运行 + 多供应商）
- **多供应商预设管理**：OpenRouter / 自建兼容端点，密钥经 `safeStorage` 加密
- **敏感数据分级路由**：客户档案 / 合同 / 回款等敏感任务默认本地执行，非敏感任务脱敏后可上云
- 客户跟进建议、自然语言问数（多意图识别）、任务智能聚合
- **AI 员工**：可自定义合并的 AI 角色，配合 RAG 知识库检索增强
- 结构化输出解析、字段脱敏

### 📚 知识学习系统
- PARA 归档 + 双链笔记；自动保存与版本历史；标签检索
- AI 知识库问答（RAG 检索增强）

### 🔒 数据安全
- 本地优先，数据不上传（IndexedDB + AES-256-GCM 静态加密）
- 安全存储（DPAPI / `safeStorage`）保护加密密钥与 AI Key
- 全格式导入（xlsx / xls / ods / csv / txt / tsv / docx / pdf），自动表头检测 + 同义词归一化 + 等级映射

### 🧩 低代码管理内核（NocoBase 风格，v0.2.0 起内置）
- **数据表（Collections）**：可视化数据建模，扩展字段（customFields）持久化
- **页面构建器（Builder）**：Palette + Canvas + SettingsPanel 三栏，模型持久化到 settings
- **工作流（Workflows）**：流程引擎 + 标准 Step + 模板，触发器（记录创建 / 更新 / 删除 / 定时器）
- **AI 员工 / 知识库管理**：员工自定义合并、RAG 索引管理
- **操作记录（Audit）**：操作日志
- **角色权限（Roles）**：owner / admin / member / reader 权限模型（当前单用户默认 owner，骨架预留多用户 / 企业版）

---

## 🚀 快速开始

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/xiaohu-crypto/meidiantong-workbench.git
cd meidiantong-workbench

# 安装依赖
npm install

# 启动开发服务器（Vite）
npm run dev

# 启动 Electron 开发模式（编译 + 运行）
npm run electron:dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run electron:dev` | 构建并启动 Electron 开发模式 |
| `npm run build` | 类型检查 + Vite 构建 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 运行单元测试（Vitest，含 NocoBase 数据 / 流程 / 模型 / 插件 / 工作流 / AI 测试） |
| `npm run e2e` | 运行端到端测试（Playwright + Electron） |
| `npm run dist` | 打包 Windows 安装包（NSIS + portable） |

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | Electron 33 |
| 前端框架 | React 18 + TypeScript 5（strict） |
| 构建工具 | Vite 5 |
| 数据存储 | IndexedDB（`idb`）+ AES-256-GCM 加密 |
| 导入解析 | `xlsx` / `mammoth`（docx）/ `pdfjs-dist`（pdf）/ `minisearch`（检索） |
| 状态管理 | React Hooks + Context（注：部分页面仍用 props drilling，见技术债） |
| 图表渲染 | 原生 SVG（零图表库依赖） |
| 拖拽排序 | 原生 HTML5 Drag API |
| 测试 | Vitest（单元 / 集成）+ Playwright（E2E） |
| 自动更新 | electron-updater（查 GitHub Release） |
| 打包 | electron-builder（NSIS + portable） |

---

## 🏗️ 架构总览（NocoBase 风格低代码内核）

应用 = **业务页面（pages/）** + **低代码内核（core/）** + **渲染组件（ui/ + components/）**。

```
meidiantong-workbench/
├── electron/            # 主进程（main.ts 窗口/更新/快捷键/托盘/崩溃重建；preload.ts IPC 桥接）
├── src/
│   ├── pages/           # 业务与管理页面
│   │   ├── Today/CRM/Work/Dev/Media/Kb/Data/Growth/Settings/Help/Notifications  # 业务页
│   │   └── Collections/Builder/Workflows/Audit/AIStaff/MyPages/Roles           # 低代码管理页
│   ├── core/            # 低代码内核（复刻 NocoBase）
│   │   ├── db/          # IndexedDB 封装（加密 / CRUD / 软删除 / 设置）
│   │   ├── model/       # 数据建模：model/registry/persist/renderer/blocks
│   │   ├── flow/        # 流程引擎：engine/step(11标准Step)/template/context
│   │   ├── workflow/    # 工作流触发器（recordCreated/Updated/Deleted + timer）
│   │   ├── action/      # 动作注册表（registry / useAction）
│   │   ├── auth/        # 角色权限（owner/admin/member/reader）
│   │   ├── plugin/      # 插件管理器（manager）
│   │   ├── ai/          # AI 层：client/router(分级路由)/employees/RAG/quota/script/desensitize/ask
│   │   ├── resource/    # 资源 Hook（useResource）
│   │   ├── importer.ts  # 全格式多 Sheet 导入（表头检测 / 同义词 / 等级映射）
│   │   ├── i18n/        # 全量中文化
│   │   ├── derive.ts / metrics.ts / search.ts / sop.ts / notify.ts / vault.ts / validators.ts
│   ├── ui/              # 通用 UI
│   │   ├── common.tsx   # Btn/Chip/Modal/Field/Progress/useToast
│   │   ├── RecordPage.tsx / Dashboard.tsx
│   │   └── widgets/     # Widget：Table/BarChart/LineChart/Kpi/Fields/RelatedList/Timeline
│   ├── components/       # AIAssistant/ErrorBoundary/ImportCustomers/QuickCapture/TopSearch/blocks/builder/icons
│   ├── types.ts / types/ # 实体类型
│   └── App.tsx          # 入口（路由 / 主题 / 导航 / FlowEngine 事件桥接）
├── tests/               # Vitest 单测（含 nocobase-*.test.ts × 6）+ tests/e2e（Playwright）
├── scripts/             # 一键打包脚本（repack-installer.ps1）
└── docs/                # 交付打包流程、复盘、规格等
```

### 流程引擎标准 Step（11 个，`src/core/flow/step.ts`）
`createRecord` · `updateRecord` · `deleteRecord` · `notify` · `refresh` · `openForm` · `closeDrawer` · `condition` · `delay` · `calculate` · `http`

### 角色权限模型（`src/core/auth/permission.ts`）
`owner`（所有者）/ `admin`（管理员）/ `member`（成员，数据范围 own，不可删）/ `reader`（只读）。当前为单用户应用，默认 `owner` 且全权限；权限接口已完整实现，供未来多用户 / 企业版扩展。

---

## 📦 下载安装

### Windows

| 版本 | 下载 | 说明 |
|------|------|------|
| **安装包** | [Setup.exe](https://github.com/xiaohu-crypto/meidiantong-workbench/releases/download/v0.2.0/Setup.exe) | 推荐，支持自动更新 |
| **便携版** | [Portable.exe](https://github.com/xiaohu-crypto/meidiantong-workbench/releases/download/v0.2.0/Portable.exe) | 免安装，直接运行 |

> 所有版本请前往 [Releases 页面](https://github.com/xiaohu-crypto/meidiantong-workbench/releases) 下载。

### 系统要求
- Windows 10 / 11 (x64)
- 约 200MB 磁盘空间

---

## 🔄 数据兼容性与架构迁移（v0.1.0 → v0.2.0）

- **v0.2.0 引入了 NocoBase 风格低代码内核**（数据表 / 页面构建器 / 工作流 / AI 员工 / 角色权限），在原有 CRM / 商机 / 媒介 / 数据业务页之上叠加，业务数据模型（Customer / Deal / Contract / Payment / PostBuy …）保持兼容。
- **数据层仍为 IndexedDB + AES-256-GCM**，schema 通过 `customFields` 扩展字段机制向上兼容；旧版（v0.1.0）本地库在 v0.2.0 首次启动时会触发 `seedIfEmpty` / `seedExtraIfEmpty`，已有数据按 `deletedAt` 软删除约定保留。
- **建议升级路径**：升级前请备份 `%APPDATA%/meidiantong-workbench` 目录（详见下方免责声明）。若开启工作流 / 页面构建器自定义，相关配置持久化在 `settings` 存储，不与业务数据冲突。
- 完整当前状态见 [HANDOFF.md](./HANDOFF.md)；迭代决策与发布清单见 [docs/ROADMAP.md](./docs/ROADMAP.md)；待办问题见 [docs/backlog.md](./docs/backlog.md)。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建特性分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 开启 Pull Request

---

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

## ⚠️ 免责声明

本工具数据完全存储在本地，卸载应用前请务必备份 `%APPDATA%/meidiantong-workbench` 目录。AI 功能需自行配置 API Key；敏感数据默认本地处理，是否上云可在 AI 设置中调整。

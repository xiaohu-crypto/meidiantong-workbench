# 媒电通工作台 交接文档

> 版本：v0.2.0 · 更新日期：2026-09-23 · 仓库：https://github.com/xiaohu-crypto/meidiantong-workbench · 最新主线 commit：`ea4dd67`
> 本文档取代 2026-09-11 的 v0.1.0 交接文档，对齐当前（NocoBase 风格低代码内核）代码状态。

---

## 一、项目概述

**媒电通工作台**（MediaDesk）是面向媒体广告从业者的**本地优先桌面工具**。核心定位：**客户跟进 + 媒介排期 + PostBuy 复盘 + AI 辅助 + 低代码管理内核**，数据全本地（IndexedDB + AES-256-GCM 加密），不依赖云端。

**目标用户**：中小代理商媒介 / 优化师，不想上飞书 / 纷享销客这类重型 SaaS，要一个快、隐私、能离线用的工作台。

**护城河**：本地优先 + 媒体广告垂直 + AES 静态加密 + v0.2.0 起内置 NocoBase 风格低代码内核（数据表 / 页面构建器 / 工作流 / AI 员工 / 角色权限）。不与飞书比功能广度。

---

## 二、技术栈

| 层 | 技术 |
|---|---|
| 外壳 | Electron 33 |
| 前端 | React 18 + TypeScript 5（strict）+ Vite 5 |
| 状态 | React Hooks + Context（部分页面仍 props drilling，见技术债） |
| 存储 | IndexedDB（`idb` 封装 `src/core/db`）+ AES-256-GCM 静态加密 |
| 导入 | `xlsx` / `mammoth`（docx）/ `pdfjs-dist`（pdf）/ `minisearch`（检索），全格式多 Sheet |
| AI | 多供应商预设（OpenRouter / 自建端点）+ 敏感数据分级路由（local/cloud）+ RAG；密钥 `safeStorage` 加密 |
| 自动更新 | electron-updater（查 GitHub Release） |
| 打包 | electron-builder（NSIS + portable） |
| 测试 | Vitest（单测 / 集成，含 6 个 nocobase-* 测试）+ Playwright（E2E） |
| 图标 | ⚠️ 仍缺失（rcedit 报错绕过，见技术债） |

**安全配置**：`contextIsolation: true`，`nodeIntegration: false`。

---

## 三、目录结构（当前主线）

```
meidiantong-workbench/
├── electron/
│   ├── main.ts          # 主进程：窗口/AI转发/自动更新/备份/托盘/渲染进程崩溃自动重建
│   └── preload.ts       # contextBridge 暴露 window.mta
├── src/
│   ├── main.tsx / App.tsx   # 入口；App.tsx 含 17 视图路由 + FlowEngine 事件桥接
│   ├── types.ts / types/    # 实体类型定义
│   ├── db/               # IndexedDB 门面（加密/CRUD/软删除/设置/dumpAll）
│   ├── core/
│   │   ├── model/        # 数据建模（model/registry/persist/renderer/blocks）
│   │   ├── flow/         # 流程引擎（engine/step/11标准Step/template/context）
│   │   ├── workflow/     # 工作流触发器（recordCreated/Updated/Deleted + timer）
│   │   ├── action/       # 动作注册表
│   │   ├── auth/         # 角色权限（owner/admin/member/reader）
│   │   ├── plugin/       # 插件管理器
│   │   ├── ai/           # client/router(分级路由)/employees/RAG/quota/script/desensitize/ask
│   │   ├── resource/     # useResource
│   │   ├── importer.ts   # 全格式多 Sheet 导入
│   │   ├── i18n/         # 全量中文化
│   │   ├── derive.ts / metrics.ts / search.ts / sop.ts / notify.ts / vault.ts / validators.ts
│   ├── ui/              # common.tsx(Btn/Chip/Modal/Field/useToast) / RecordPage / Dashboard / widgets(7类)
│   ├── components/      # AIAssistant/ErrorBoundary/ImportCustomers/QuickCapture/TopSearch/blocks/builder/icons
│   └── pages/           # 业务页 + 低代码管理页（见第四节）
├── tests/               # Vitest 单测 + tests/e2e（Playwright）
├── scripts/             # repack-installer.ps1（一键打包）
├── docs/                # 交付打包流程 / ROADMAP / backlog / 复盘
└── package.json
```

---

## 四、页面模块清单（src/pages，17 视图）

**业务页**
| 页面 | 文件 | 说明 |
|---|---|---|
| 首页 | Today.tsx | 今日驾驶舱 / Next-Best-Action |
| 客户管理 | CRM.tsx | 客户列表 / 360° 详情 / 决策链 / SOP |
| 任务看板 | Work.tsx | 任务 / 待办 |
| 商机管理 | Dev.tsx | Pipeline / 比稿 / MEDDIC+BANT |
| 媒介资源 | Media.tsx | 资源库 / 排期 / 报价器 / PostBuy |
| 知识库 | Kb.tsx | PARA + 双链 |
| 数据报表 | Data.tsx | 漏斗 / ROI / 仪表盘 / PDF 导出 |
| 成长规划 | Growth.tsx | 目标 KR |
| 系统设置 | Settings.tsx | AI 多供应商 / 快捷键 / 主题 |
| 帮助中心 | Help.tsx | — |
| 通知中心 | Notifications.tsx | 铃铛未读 |

**低代码管理页（v0.2.0 新增）**
| 页面 | 文件 | 说明 |
|---|---|---|
| 页面构建器 | Builder.tsx | Palette+Canvas+SettingsPanel |
| 我的页面 | MyPages.tsx | 自定义页面 |
| 工作流 | Workflows.tsx | 流程引擎可视化 |
| 数据表 | Collections.tsx | 数据建模 |
| 操作记录 | Audit.tsx | 操作日志 |
| AI 员工 | AIStaff.tsx | AI 角色自定义合并 |
| AI 知识库 | AIKb.tsx | RAG 索引管理 |

---

## 五、数据模型（types.ts + customFields）

| 实体 | 说明 |
|---|---|
| Customer / Contact / Rel | 客户 / 联系人 / 关系 |
| Deal | 商机（线索→MQL→SQL→商机→报价→谈判→签约/输单/流失） |
| Contract / Payment | 合同 / 回款 |
| Task / Objective / Milestone | 任务 / 目标 / 里程碑 |
| ContactPoint | 跟进记录（时间线） |
| Pitch | 比稿 / 提案 |
| Supplier / MediaResource / RateCard / ScheduleItem | 供应商 / 媒体资源 / 价卡 / 排期 |
| PostBuy | 投后数据（曝光 / CPM / ROI / CTR） |
| Note / Baseline / Aar | 知识库 / 行业基准 / 预留 |
| Influencer | 达人库 |
| customFields | 扩展字段（entity/key/label/type/options），持久化到 settings，支持模型扩展 |

所有业务表均有 `deletedAt`（软删除走回收站）。

---

## 六、IPC 接口清单（window.mta）

**主进程监听（ipcMain.handle）**：`ai:chat` / `ai:chatStream`（SSE 流式）/ `ai:saveKey` / `ai:loadKey` / `ai:envKey` / `vault:ensure` / `backup:pickDir` / `backup:write` / `update:install` / `login-item:set/get` / `titlebar:set/setTheme` / `windowMinimize/Maximize/Close`。

**preload 暴露**：`onQuickCapture` / `setLoginItem` / `getLoginItem` / `aiSaveKey` / `aiLoadKey` / `aiEnvKey` / `aiChat` / `chatStream` / `onStreamChunk/Done/Error` / `vaultEnsure` / `windowMode` / `titlebarSet/SetTheme` / `backupPickDir/Write` / `onUpdateReady` / `installUpdate` / `windowMinimize/Maximize/Close`。

---

## 七、已完成功能（按主线提交）

### 基础业务（v0.1.0 / P1–P6）
- 今日驾驶舱、全局搜索（分组 + 键盘导航）、Pipeline 编辑、360° 时间线、跟进超期提醒
- 目标设定、资源档案深化、CSV/全格式导入、客户级媒介策略、自助报价器
- 达人库 CRUD、PostBuy 升级、三视图切换（看板/表格/日历）、AI 知识库问答、通知中心
- 商机漏斗图、CRM AI 建议、Ctrl+1~9 视图切换
- ErrorBoundary、electron-updater、CRM 批量操作 + 撤销、AI 流式输出、自动备份
- React.lazy、撤销 toast、骨架屏、响应式
- ROI 看板、AI 写 Pitch、PDF 导出、快捷键自定义

### 低代码内核 + 增强（v0.2.0 / 09-14 起）
- 🆕 **NocoBase 风格架构**：数据层 / 流程引擎（11 标准 Step）/ 区块 / 构建器 / 工作流 / 插件权限 / AI 增强
- 🆕 **全格式多 Sheet 导入**：xlsx/xls/ods/csv/txt/tsv/docx/pdf，表头自动检测、同义词归一化、等级映射
- 🆕 **全量中文化**（i18n）：英文标签 → 中文
- 🆕 **AI 多供应商预设管理** + 敏感数据分级路由（local/cloud）+ 脱敏
- 🆕 **渲染进程崩溃自动重建窗口** + 托盘 / 快捷键容错
- 🆕 **一键打包脚本**（scripts/repack-installer.ps1）+ 交付流程文档
- 🆕 **8 项 P1 问题全量修复**（性能 / 体验 / AI 分组持久化 / Pipeline 防撑爆等）
- 🆕 **客户抽屉 AI 建议 Tab 对话化** → 最近提交移除"生成跟进建议" + 头部按钮规范

**测试**：Vitest 单测含 `nocobase-data / nocobase-flow / nocobase-model / nocobase-plugin / nocobase-workflow / nocobase-ai` 等，合计达标（仓库 CI 约定 75 tests 全过、typecheck 0 错）；E2E 已搭 `tests/e2e/app.e2e.ts`（Playwright + Electron）。

---

## 八、构建与运行

```powershell
cd meidiantong-workbench

npm install            # 安装依赖（首次）
npm run typecheck     # 类型检查
npm test              # Vitest 单测
npm run e2e           # Playwright E2E（需先 build + electron:main）
npm run build         # tsc --noEmit + vite build
npm run electron:main # 编译主进程
npm run dist          # 完整打包（NSIS + portable）
```

**产出**：`release\媒电通工作台 Setup 0.2.0.exe`（NSIS）、`release\win-unpacked\媒电通工作台.exe`（便携）。
**一键重打包**：`scripts/repack-installer.ps1`（详见 docs/ROADMAP.md 发布清单）。

---

## 九、已知问题与技术债

| 项 | 现状 | 建议 |
|---|---|---|
| 文档漂移（已修） | v0.1.0 文档曾与代码不符；本文档已对齐 v0.2.0 | 每次架构变更同步更新 README/HANDOFF |
| 仓库 URL（已修） | 旧文档误写 `mediantong-releases`；正确为 `meidiantong-workbench` | — |
| 状态管理 | 部分页面 props drilling（App.tsx 传 data 给所有页） | 上 Zustand/Context（技术债，非阻塞） |
| 无组件测试 / E2E 覆盖薄 | 单测覆盖 core/db；E2E 仅 4 用例 | 扩 E2E 关键路径（登录/导入/CRM 详情） |
| 无崩溃上报 | ErrorBoundary 仅本地提示 | 接 Sentry / 本地 dump |
| 无 deep link | 不支持媒电通:// 协议 | 后续加 |
| 图标 | 未设置（rcedit 报错绕过） | 换 .ico 并修复打包配置 |
| 外部数据导入 | 已支持多格式；飞书表格粘贴 / 企微通讯录待做 | 后续 |
| CRM 客户详情 3 栏重构 | 当前仍 5 Tab；issue P1 待实现（见 docs/backlog.md） | 按 docs/crm-drawer-3col-spec.md 排期 |

---

## 十、验收清单（老板体检用）

### 启动与基础
- [ ] 安装后双击启动，无 "Cannot find module" 报错
- [ ] ErrorBoundary 触发时显示友好提示而非白屏
- [ ] 窗口缩放 < 1100px 时 drawer 变全屏
- [ ] 渲染进程崩溃后自动重建窗口（不静默失败）

### 业务
- [ ] 客户列表多选 + 批量操作栏；批量删除 toast 带撤销（4s 内可恢复）
- [ ] 客户详情有 AI 建议 Tab
- [ ] Ctrl+1~9 切换 9+ 视图（含低代码管理页）
- [ ] 全格式导入（拖入 xlsx/docx/pdf 可解析多 Sheet）

### AI
- [ ] 设置页配多供应商 Key 后，知识库问答逐字流式输出
- [ ] Dev 比稿弹窗选客户后生成复盘话术
- [ ] 敏感数据（客户档案/合同/回款）默认本地，不上云

### 低代码内核
- [ ] 数据表可建模型；页面构建器可拖拽生成页面
- [ ] 工作流：商机签约自动建合同 + 回款计划（recordCreated 触发器）
- [ ] 角色权限模型 owner/admin/member/reader 可读

### 数据
- [ ] Data 页有商机漏斗图（7 阶段）+ ROI 看板 + PDF 导出
- [ ] 自动备份到指定目录，轮转保留 N 份
- [ ] 重启后数据还在（IndexedDB 持久化）

---

## 十一、Git 历史（主线节选）

```
ea4dd67 feat: 客户抽屉AI建议Tab移除生成跟进建议+头部按钮规范重构   (2026-09-23)
…        feat: AI模型多供应商预设管理+问题录入器删除按钮          (2026-09-20)
…        fix: 渲染进程崩溃自动重建窗口+托盘菜单修复                (2026-09-15)
…        chore: 新增一键打包脚本和交付流程文档                    (2026-09-15)
…        feat: 全量复刻NocoBase架构(数据层/流程引擎/区块/…)        (2026-09-14)
60b2fe0 fix: electron-updater移到dependencies                    (v0.1.0 收尾)
```

> 完整历史：`git log`。待办问题见 [docs/backlog.md](./docs/backlog.md)；迭代决策见 [docs/ROADMAP.md](./docs/ROADMAP.md)。

_文档结束。有问题查代码或 git log。_

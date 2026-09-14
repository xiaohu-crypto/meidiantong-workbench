# 媒电通工作台 交接文档

> 版本：v0.1.0 · 日期：2026-09-11 · 仓库：https://github.com/xiaohu-crypto/mediantong-releases · 最新commit：`60b2fe0`

---

## 一、项目概述

**媒电通工作台**（MediaDesk）是面向媒体广告从业者的本地优先桌面工具。核心定位：**客户跟进 + 媒介排期 + PostBuy复盘 + AI辅助**，数据全本地（IndexedDB + AES-256-GCM加密），不依赖云端。

**目标用户**：中小代理商媒介/优化师，不想上飞书/纷享销客这类重型SaaS，要一个快、隐私、能离线用的工作台。

**护城河**：本地优先 + 媒体广告垂直 + AES静态加密。不与飞书比功能广度。

---

## 二、技术栈

| 层 | 技术 |
|---|---|
| 外壳 | Electron 33 |
| 前端 | React 18 + TypeScript strict + Vite 5 |
| 状态 | 无框架（useState + props drilling） |
| 存储 | IndexedDB（封装 `src/db/db.ts`），AES-256-GCM静态加密 |
| AI | OpenRouter API（SSE流式），默认模型 `z-ai/glm-5.3-flash` |
| 自动更新 | electron-updater（查GitHub Release） |
| 打包 | electron-builder（NSIS + portable） |
| 测试 | Vitest（23个用例） |
| 图标 | 无（rcedit报"Fatal error"，已去掉win.icon配置绕过） |

**安全配置**：`contextIsolation: true`，`nodeIntegration: false`。

---

## 三、目录结构

```
app/
├── electron/
│   ├── main.ts          # 主进程：窗口/AI转发/自动更新/备份
│   └── preload.ts       # contextBridge暴露mta对象
├── src/
│   ├── main.tsx         # 入口，包ErrorBoundary
│   ├── App.tsx          # 全局布局/路由/快捷键/自动备份
│   ├── types.ts        # 所有实体类型定义
│   ├── db/
│   │   └── db.ts        # IndexedDB门面 + softDelete + dumpAll
│   ├── core/
│   │   ├── ai/client.ts # AI配置/密钥/aiChat
│   │   ├── ai/quota.ts  # 月度token配额
│   │   ├── search.ts    # 全局搜索索引
│   │   └── notify.ts   # 桌面通知
│   ├── data/
│   │   ├── seed.ts      # 初始种子数据
│   │   └── seed2.ts
│   ├── pages/
│   │   ├── Today.tsx      # 今日看板
│   │   ├── CRM.tsx        # 客户管理
│   │   ├── Work.tsx       # 任务/待办
│   │   ├── Dev.tsx        # 商机/比稿
│   │   ├── Media.tsx      # 媒介资源/排期
│   │   ├── Kb.tsx         # 知识库
│   │   ├── Data.tsx       # 数据看板/漏斗/ROI
│   │   ├── Growth.tsx     # 增长目标
│   │   ├── Notifications.tsx  # 通知中心
│   │   ├── Settings.tsx   # 设置
│   │   └── Help.tsx       # 帮助
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── QuickCapture.tsx
│   │   ├── TopSearch.tsx
│   │   └── Onboarding.tsx
│   ├── ui/
│   │   └── common.tsx    # Btn/Chip/Modal/useToast/Field
│   └── styles/app.css
├── release/
│   ├── 媒电通工作台 Setup 0.1.0.exe   # NSIS安装包
│   └── win-unpacked/媒电通工作台.exe  # 便携版
└── package.json
```

---

## 四、数据模型（types.ts）

| 实体 | 说明 |
|---|---|
| Customer | 客户（行业/等级/健康度） |
| Contact | 联系人 |
| Rel | 联系人-客户关系 |
| Deal | 商机（阶段：线索→MQL→SQL→商机→报价→谈判→签约/输单/流失） |
| Contract | 合同 |
| Payment | 回款 |
| Task | 任务/待办 |
| Objective | 目标（周拜访/月签额） |
| ContactPoint | 跟进记录（时间线） |
| Pitch | 比稿/提案 |
| Supplier | 供应商 |
| MediaResource | 媒体资源（含intro/advantage/cases + PricePoint点位数组） |
| RateCard | 价卡 |
| ScheduleItem | 排期项 |
| PostBuy | 投后数据（曝光/CPM/ROI/CTR） |
| Note | 知识库笔记（PARA结构） |
| Baseline | 行业基准值 |
| Aar | （预留） |
| Influencer | 达人库 |

**Schema版本**：2。所有表都有 `deletedAt`（软删除走回收站）。

---

## 五、IPC接口清单

**主进程监听（ipcMain.handle）**：
- `ai:chat` — 一次性AI调用
- `ai:chatStream` — SSE流式AI（逐块推 `ai:stream-chunk` / `ai:stream-done` / `ai:stream-error`）
- `ai:saveKey` / `ai:loadKey` / `ai:envKey` — 密钥safeStorage加密
- `vault:ensure` — 初始化加密库
- `backup:pickDir` / `backup:write` — 备份
- `update:install` — 自动更新重启
- `login-item:set` / `login-item:get` — 开机启动
- `titlebar:set` — 标题栏模式

**preload暴露的 `window.mta`**：
```
onQuickCapture, setLoginItem, getLoginItem,
aiSaveKey, aiLoadKey, aiEnvKey, aiChat, chatStream,
onStreamChunk, onStreamDone, onStreamError,
vaultEnsure, windowMode, titlebarSet,
backupPickDir, backupWrite,
onUpdateReady, installUpdate
```

---

## 六、已完成功能（按批次）

### P1（commit 1e743ca）
- 全局搜索（分组+键盘导航）
- Pipeline卡片点击编辑、商机编辑、360°时间线
- 跟进超期提醒（14天）
- 目标设定（周拜访/月签额）
- 资源档案深化（intro/advantage/cases + PricePoint点位）
- CSV媒介库导入导出
- 客户级媒介策略、自助报价器
- 设置页两栏重构
- 知识库PARA过滤 + 网页剪藏

### P2（commit 13144b7）
- 达人库CRUD
- PostBuy升级（手动录入CTR/点击/第三方监测 + 导出分析报告）
- 三视图切换（看板/表格/日历）
- AI知识库问答（右侧抽屉）
- 通知中心页（顶栏铃铛未读数）
- Data页签约额环比箭头
- 设置页快捷键说明

### P3（commit d9f7a78）
- Data页商机漏斗图（7阶段横条图）
- CRM客户drawer新增"AI建议"tab（3条跟进建议）
- 全局快捷键 Ctrl+1~9 切换9个主视图

### P4（commit 1de4c59）
- **ErrorBoundary**：崩溃显示友好提示+重启按钮
- **electron-updater**：启动3s静默检查GitHub Release，下载完弹窗重启
- **CRM批量操作**：表头全选+行内checkbox，批量删除走回收站
- **AI流式输出**：主进程SSE转发，知识库问答逐字渲染
- 自动备份计划任务（每60s检查轮转，保留N份）——已有，本轮确认

### P5（commit c481d59）
- React.lazy代码分割（10个页面懒加载 + Suspense）
- 撤销机制（useToast带undo回调，Work删除任务4秒内可恢复）
- 骨架屏（Suspense fallback灰色脉冲占位）
- 响应式适配（<1100px drawer全屏+KPI两列，<800px单列）

### P6（commit 05aaa12 + 60b2fe0）
- **ROI看板**：Data页PostBuy按资源聚合，显示曝光/CPM/ROI/CTR，ROI≥1绿色
- **AI写Pitch**：Dev比稿弹窗加AI按钮，根据客户+行业+对手生成复盘话术
- **PDF导出**：Data页"导出PDF"按钮（window.print）
- **快捷键自定义**：设置页快速采集键可改（存quickKey setting）
- **修复**：electron-updater从devDependencies移到dependencies（打包排除导致运行时找不到模块）

---

## 七、构建与运行

```powershell
cd D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app

# 类型检查
npm run typecheck

# 单测
npm test

# 前端构建
npm run build

# 编译electron主进程
npm run electron:main

# 完整打包（NSIS + portable）
npm run dist
```

**产出**：
- `release\媒电通工作台 Setup 0.1.0.exe`（NSIS安装包，~85MB）
- `release\win-unpacked\媒电通工作台.exe`（便携版，~189MB）

**注意**：
- portable单文件打包慢/会卡，用win-unpacked目录代替
- rcedit图标设置报"Fatal error: Unable to commit changes"不影响产出，已去掉win.icon配置
- git push的NativeCommandError是stderr显示问题，看"main -> main"确认成功

---

## 八、已知问题与技术债

| 项 | 现状 | 建议 |
|---|---|---|
| Bundle单文件785KB | React.lazy运行时按需加载，但Rollup物理chunk未拆分 | 配manualChunks拆vendor |
| 无组件测试/E2E | 只有db层23个集成测试 | 上Playwright E2E |
| props drilling | App.tsx传data给所有页面 | 上Zustand/Context |
| 无崩溃上报 | ErrorBoundary只本地显示 | 接Sentry |
| 无deep link | 不支持媒电通://协议 | 后续加 |
| portable单文件 | electron-builder压缩慢/卡 | 用win-unpacked替代 |
| 图标 | 未设置（rcedit报错绕过） | 后续换.icns/.ico |
| 外部数据导入 | 只有CSV | 飞书表格粘贴/企微通讯录待做 |

---

## 九、验收清单（老板体检用）

### 启动与基础
- [ ] 安装后双击启动，无"Cannot find module"报错
- [ ] ErrorBoundary触发时显示友好提示而非白屏
- [ ] 窗口缩放<1100px时drawer变全屏

### CRM
- [ ] 客户列表点checkbox可多选，顶部出现批量操作栏
- [ ] 批量删除后toast带"撤销"按钮，4秒内点撤销能恢复
- [ ] 客户drawer有"AI建议"tab
- [ ] Ctrl+1~9能切换9个视图

### AI
- [ ] 设置页配OpenRouter Key后，知识库问答逐字流式输出
- [ ] Dev比稿弹窗选客户后点"✦"能生成复盘话术
- [ ] 顶栏Ctrl+K快速采集（设置页可改键）

### 数据
- [ ] Data页有商机漏斗图（7阶段）
- [ ] Data页有ROI看板（PostBuy聚合）
- [ ] Data页"导出PDF"能调打印对话框

### 其他
- [ ] 自动备份到指定目录，每24h轮转保留N份
- [ ] 顶栏铃铛有未读通知数
- [ ] 重启后数据还在（IndexedDB持久化）

---

## 十、Git历史

```
60b2fe0 fix: electron-updater移到dependencies
5fa9103 fix: preload stream回调参数补类型标注
05aaa12 feat(P6差异化): ROI看板/AI写Pitch/PDF导出/快捷键自定义
c481d59 feat(P5 UX打磨): React.lazy/撤销toast/骨架屏/响应式
1de4c59 feat(P4上市阻断): ErrorBoundary/自动更新/批量删除/AI流式
d9f7a78 feat(P3): 商机漏斗图/CRM AI建议/Ctrl+1~9快捷键
68d458a build配置
13144b7 feat(P2): 达人库/PostBuy升级/三视图/AI问答/通知中心
1e743ca feat(P1): 全局搜索/Pipeline编辑/360时间线/目标/资源深化/CSV/报价器/知识库
```

---

_文档结束。有问题查代码或git log。_

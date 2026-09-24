# 媒电通工作台 — Codex 交接文档

> 交接时间：2026-09-23 23:19
> 交接对象：Codex（继续 v0.2.2 收尾 + 实机核验）
> 项目路径：`D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench`
> 安装目录：`D:\软件安装\个人工作台\meidiantong-workbench`
> 当前版本：**v0.2.2**（HEAD = `044b99c`，tag `v0.2.2` 已推 origin/main）

---

## 0. 一句话状态

**代码已同步、安装目录 asar 已含 v0.2.2 全部改动（含版本锚点）**，剩下三件事：① 本轮版本锚点改动未 commit；② 临时脚本待清理；③ 等老板实机点亮核验（我无法替他启动 exe）。

---

## 1. 已完成（v0.2.2 全量）

### 1.1 已推送到 GitHub（HEAD `044b99c`，tag `v0.2.2`）
- **P1 三栏工作台**（左25%/中50%/右25%）+ 统一 Drawer + 预算配比 100% 强校验
- **MediaStrategyFormState 权威数据契约**（`src/core/mediaStrategy.ts`）：类型 + 纯函数 `mixTotal / parseBudget / computeEstimatedAmount / isStrategyValid / strategyError / syncAllocations / ALL_CHANNELS`，UI 仅消费
- **Finexy 双模设计系统**：`tokens.css` 新增 `--shadow-card` / `--animate-theme-switch`；`.btn` 药丸大圆角 + 微阴影；默认主题翻 light
- **A/B/C/D 四块**（老板"全做"授权）：
  - **A 低代码密度自适应**：`RecordPage` 加 `density` prop；`.density-compact/.density-relaxed`；CRM/Dev 详情抽屉头 `⊟紧凑/⊞宽松`，持久化 `db.setSetting("recordDensity")` / `"dealRecordDensity"`
  - **B AI 安全网关**：新建 `src/components/AISecurityBadge.tsx`（盾牌 SVG + 本地保密/脱敏上云 + 呼吸灯），挂 `AIAssistant` 面板头部下方
  - **C 表头归一化**：`src/core/importer.ts` 新增 `ColumnMatchItem` + `columnMatchConfidence()`（精确100/包含60/未匹配0）；`ImportCustomers` 改 `mappingItems`，列匹配预览 "FILE→SYS + 对齐度%"，未匹配红闪
  - **D 工作流 SVG 连线**：`Workflows.tsx` 新增 `WorkflowCanvasSteps`（节点卡片 + 三次贝塞尔连线，`stroke:var(--border)` 双模自适应 + dash 流动）
- **Finexy AI 状态灯**：`App.tsx` 侧边栏底栏注入 `.ai-status-anchor`（ai-ping 脉冲 + 气泡"本地敏感数据安全盾：已锁定 (AES-256-GCM)"）

### 1.2 本轮新增但**尚未 commit**（⚠️ Codex 需处理）
| 文件 | 改动 |
|---|---|
| `src/core/version.ts` | **新建**，版本号单一真源 `export const APP_VERSION = "0.2.2"` |
| `src/App.tsx` | ① 用户菜单 `v0.1.0` → `v{APP_VERSION}`（修写死 bug）② 顶栏新增 `.topbar-version-chip` 版本胶囊（首屏默认可见）③ 顶部 import `APP_VERSION` |
| `src/styles/app.css` | 新增 `.topbar-version-chip` 样式（药丸胶囊，hover 变 `--brand`） |

验证状态：`tsc --noEmit` **0 错**；`vite build` **成功**。

---

## 2. 关键事实（已硬核验，勿重复排查）

### 2.1 安装目录 asar 已含全部锚点（二进制搜索实证）
对 `D:\软件安装\个人工作台\meidiantong-workbench\resources\app.asar`（62.23MB）做二进制字符串搜索：

| 字符串 | 结果 |
|---|---|
| `topbar-version-chip` | **FOUND @61917284** ← 版本胶囊锚点已在 |
| `ai-status-anchor` | FOUND @61981665 |
| `recordDensity` | FOUND @62304748 |
| `imp-conf` | FOUND @61954448 |
| `wf-canvas` | FOUND @61954878 |
| `index-DvsYLNt9` | FOUND @478288（主 bundle 引用一致） |
| `0.2.2`（dist bundle 区） | FOUND @62219007、@65252675（APP_VERSION 内联值） |

**结论**：v0.2.2 四块功能 + 版本胶囊锚点**都已打进安装目录**，老板重启 exe 即可见。

### 2.2 `v0.1.0` 不是 App.tsx 的残留
asar 内 `v0.1.0` 出现在 `/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */` —— 是 **node_modules 第三方库注释**，与 App.tsx 无关（写死 bug 已修）。

### 2.3 git 同步状态
- `HEAD = origin/main = 044b99c`（tag `v0.2.2`），GitHub Release 已发布
- 工作区：`M src/App.tsx`、`M src/styles/app.css`、`?? src/core/version.ts`（本轮改动未提交）+ 一堆未跟踪临时脚本/构建产物

---

## 3. 未决 / 待办（Codex 接手清单）

### P0 — 必须做
1. **提交本轮版本锚点改动**（3 文件），建议 commit message：
   `feat(ui): 修复侧边栏版本号写死(v0.1.0→动态) + 顶栏新增 v0.2.2 版本胶囊 (v0.2.2-anchor)`
   提交前跑：`tsc --noEmit` + `vite build`（我跑过均 0 错，Codex 复核一遍）
2. **清理临时脚本**（均在我根目录，一次性验证脚本，已完成使命）：
   `.asar-dump.mjs` `.check-asar.mjs` `.install-patch.mjs` `.patch-v022-anchor.mjs` `.rebuild-anchor.mjs` `.rebuild-v022.mjs` `.repack-stream.mjs` `.step-extract.mjs` `.step-repack.mjs` `.verify-anchor.mjs` `.verify-asar.mjs` `.verify-hard.mjs`
   > 构建产物 `release-v022/`、`release-anchor/` 是未跟踪目录，可保留（含 97MB NSIS/便携安装包）或按需清理。
3. **等老板实机核验**（我无法替他启动 exe）——核验清单见 §4。

### P1 — 建议
4. 若老板确认四块视觉 OK → 可 bump 到 `v0.2.3`（因本轮改动在 v0.2.2 tag 之后），重出包 + 覆盖安装目录 + 建 tag/release。
   > **注意**：`src/core/version.ts` 的 `APP_VERSION` 与 `package.json` 的 `version` 必须**同步改**（两处）。
5. 老板已授权"全量自主执行"，但**对外发送/越范围改 UI/改坏 .git/不可逆破坏操作**四类边界仍需先确认。

---

## 4. 老板实机核验清单（可点击锚点）

启动 `D:\软件安装\个人工作台\meidiantong-workbench\媒电通工作台.exe`（**若已开着先关掉再开**，让新 asar 加载）：

| # | 锚点 | 在哪看 | 预期 |
|---|---|---|---|
| 1 | **v0.2.2 顶栏胶囊** | 顶栏**最右侧** | `v0.2.2` 小胶囊，hover 变青色 |
| 2 | **侧边栏版本** | 点左下角「媒」头像 → 用户菜单 | `v0.2.2`（不再是 v0.1.0） |
| 3 | **AI 状态灯** | 侧边栏底栏（头像上方） | 青色脉冲点 + 气泡"本地敏感数据安全盾：已锁定 (AES-256-GCM)" |
| 4 | **密度切换 ⊟/⊞** | 客户管理/商机管理 → 进某条记录详情抽屉 → 抽屉头 | `⊟紧凑 / ⊞宽松` 按钮 |
| 5 | **AI 安全网关卡** | 右侧 AI 助手悬浮球展开 | 面板头部下方盾牌卡"本地绝对保密 / 脱敏云端协作" |
| 6 | **表头归一化** | 客户管理 → 导入客户 | 列匹配预览 FILE→SYS + 对齐度%（未匹配红闪） |
| 7 | **工作流 SVG 连线** | 工作流页 → 点某条工作流详情弹窗 | 节点卡片 + 贝塞尔连线 |

> **强刷/cache-bust**：开发态 `Ctrl+Shift+R`；安装包态**重启 exe**（asar 已替换，重启即生效）。

---

## 5. 环境坑（⚠️ 血泪，Codex 必读，能省 1 小时）

### 5.1 Git Bash shim 缺 coreutils（**最高频坑**）
`ls / cd / head / tail / grep / cat / rm` 全部报 `command not found`，且启动即报：
```
dirname: command not found / cd: null directory
```
**规避**：
- 文件/内容操作一律用 node 绝对路径：
  `C:/Users/HaLeMa/.workbuddy/binaries/node/versions/22.22.2-3/node.exe -e "..."`
- git 一律 `git -C "<绝对路径>"`
- 删文件用 `fs.rmSync`，**不要**用 `rm`
- 内联 node 脚本易被 shell 转义破坏 → **统一 Write 成 `.mjs` 文件再执行**

### 5.2 PowerShell 工具返回空输出
`PowerShell` 工具多次返回 `Command completed with exit code 0` 但无 stdout → 改用 node `-e` 或 Bash+node。

### 5.3 `@electron/asar` API 对大包**不可靠**（本轮最大误导源）
- `listPackage()` 对 62MB asar 只返回 2039 条，**全是 node_modules**，`/dist` 顶层条目列不出来
- `extractFile(asar, "dist/assets/index-XXX.js")` 报 `was not found in this archive`，**但文件实际存在！**
- **可靠验证法 → 二进制字符串搜索**（本轮用它破案）：
  ```js
  const buf = fs.readFileSync(asarPath);
  const s = buf.toString("latin1");
  s.indexOf("topbar-version-chip"); // >=0 即存在
  ```
  同理可验证 `ai-status-anchor` / `recordDensity` / `imp-conf` / `wf-canvas` / 版本字面量。

### 5.4 electron-builder CLI 参数（坑过一次）
- ❌ `--publish.never` → 报 `Invalid values`
- ✅ `--publish never`（空格分隔）
- 沙箱 non-admin 构建卡 winCodeSign 符号链接特权 → 加 `--config.win.signAndEditExecutable=false` 绕过（unsigned，本地/内网可用）
- win-unpacked 被锁（EBUSY）时 → 换 output 目录：
  `--config.directories.output=release-anchor`（换名避锁，别硬删）

### 5.5 推送凭据
git 默认 `git-credential-manager` 在无人值守 shell 下**卡交互** → 用：
```bash
git -C "<repo>" -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main
```
`gh` 已登录账号 `xiaohu-crypto`（含 repo 权限）。

### 5.6 其它
- 中文路径被 7zip 误读 GBK（构建实际成功，可忽略）
- `release/`、`release-v022/`、`release-anchor/` 均不进版本库
- 安装目录 `resources/` 混有多个 953MB 历史备份 asar（`app.asar.bak-*`、`app.asar.pre-v021-*`），疑似历史构建把 node_modules 整包打进 asar；正常 asar 应为 **62MB**，这些可清

---

## 6. 给 Codex 的执行顺序建议

1. 先跑 `tsc --noEmit` + `vite build` 复核本轮 3 文件改动 0 错
2. 用 §5.3 的二进制搜索法，再确认一次安装目录 asar 锚点（防我这里误判）
3. commit 3 文件（`src/core/version.ts` + `src/App.tsx` + `src/styles/app.css`）
4. 清理 §3 列出的 12 个临时 `.mjs` 脚本
5. 把 §4 核验清单给老板，等他实机点亮确认（**不要替他启动 exe**）
6. 老板确认后：按需 bump v0.2.3 → 重出包 → 覆盖安装目录 → 建 tag/release → 推送
   （重出包命令见 §5.4；覆盖时若遇 EBUSY，只替换 `resources/app.asar` 即可，主 exe 与其余 dll 不必动）

---

## 7. 关键文件索引

| 用途 | 路径 |
|---|---|
| 版本单一真源 | `src/core/version.ts` |
| 全局骨架 / 版本胶囊 / AI 状态灯 | `src/App.tsx`（L326-332 AI 灯，L365 用户菜单版本，L378-381 顶栏胶囊） |
| 设计令牌（双模） | `src/styles/tokens.css` |
| 主样式（含 `.topbar-version-chip`） | `src/styles/app.css` |
| 策略数据契约 | `src/core/mediaStrategy.ts` |
| AI 安全网关组件 | `src/components/AISecurityBadge.tsx` |
| 统一 Drawer 基组件 | `src/ui/common.tsx` |
| 记录页（density prop） | `src/ui/RecordPage.tsx` |
| 导入列匹配 | `src/core/importer.ts`、`src/components/ImportCustomers.tsx` |
| 工作流画布 | `src/pages/Workflows.tsx` |
| 三栏工作台 | `src/pages/CRM.tsx` |
| 发布说明 | `docs/release-notes-v0.2.2.md` |
| CRM 三栏规格 | `docs/crm-drawer-3col-spec.md` |
| 项目日志（含本轮复盘） | `D:\HaLeMa\Documents\媒电通工作台\.workbuddy\memory\2026-09-23.md` |

---

## 8. 本轮教训（写给后续，勿重犯）

1. **版本号必须走单一真源**（`src/core/version.ts`），禁止组件里写死 `v0.1.0` —— 本轮因此被老板判定"没更新"。
2. **新功能若全是"子面板/抽屉/弹窗展开才可见"的隐藏视觉，必须补一个首屏默认可见锚点**（本轮补了顶栏 `v0.2.2` 胶囊），否则老板点开首屏永远感知不到更新。
3. **验收铁律**：每轮交付必须给"可执行实机核验证据"（磁盘文件 / cache-bust 链接 / Ctrl+Shift+R 强刷 + 逐项视觉对照）。只报"复制完成+体积"不算交付。
4. **asar 内容验证别信 `listPackage`/`extractFile`**，用二进制字符串搜索。

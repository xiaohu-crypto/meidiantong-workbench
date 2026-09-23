# 媒电通工作台 · 迭代路线图与发布清单（ROADMAP）

> 本文档用于对齐「规划 — 代码 — 发布」三线，解决复盘发现的文档漂移 / 仓库 URL 错误 / 安装包落后 / CRM 方向分歧 / 迭代方案悬置问题。
> 关联：README.md（架构）、HANDOFF.md（现状）、docs/backlog.md（问题清单）、docs/crm-drawer-3col-spec.md（CRM 3 栏规格）。

---

## 一、v2.1 / v2.2 逐板块深化方案 —— 决策：🗄️ 归档（不执行）

**背景**：`delivery/媒电通v2.1迭代方案(待确认).html` 与 `媒电通v2.2逐板块深化方案(待确认).html` 自 2026-09-10 起标注「待确认」，长期悬置。

**决策：归档为历史参考，不再作为执行清单。**

**理由**：
1. v0.2.0 已做 **NocoBase 风格低代码内核转向**（数据表 / 页面构建器 / 工作流 / AI 员工 / 角色权限），其能力范围已覆盖 v2.1/v2.2 中多数「逐板块深化」诉求（自定义字段、自定义页面、流程自动化、AI 增强）。
2. 在已具备低代码内核的前提下，再按 v2.1/v2.2 的硬编码逐板块方案推进会造成架构冲突与返工。
3. 若后续确有特定板块深化需求，应基于低代码内核以「数据表 + 页面构建器 + 工作流」方式实现，而非回到旧逐板块方案。

**动作**：两份 HTML 保留在 `delivery/` 作为历史记录；本仓库不纳入其任务项。新需求统一进 `docs/backlog.md` → GitHub Issues。

---

## 二、问题跟踪迁移：localStorage 录入器 → GitHub Issues

**现状**：`delivery/issue-tracker/index.html` 是「问题录入器」，问题存于浏览器 `localStorage`（`mdt_issues`），与代码库 / 发布完全脱节，且不在版本控制内。

**决策**：问题跟踪迁至 **GitHub Issues**（本仓库），`issue-tracker` 仅作离线录入原型，不再作为权威清单。

**动作**：
- 权威问题清单见 `docs/backlog.md`（每条对应一个待建 GitHub Issue）
- 当前唯一活跃 P1（CRM 3 栏重构）已写入 `docs/crm-drawer-3col-spec.md`
- 宿主执行：`gh issue create --repo xiaohu-crypto/meidiantong-workbench --file docs/backlog.md`（逐条），或按 backlog.md 手动创建

---

## 三、v0.2.0 发布清单（宿主执行，沙箱不构建 / 不 push）

> 沙箱已完成的改动：README.md / HANDOFF.md 对齐、package.json 版本 0.1.0→0.2.0、docs/ 新增规格与清单。这些改动已 `git commit`（见第六节），**需宿主 push 并构建发布**。

### 步骤
1. **拉取 / 同步**：确保本地 `meidiantong-workbench` 含本批提交（`git pull` 或对接沙箱产出目录 `code/meidiantong-workbench`）
2. **安装依赖**：`npm install`
3. **类型检查**：`npm run typecheck`（须 0 错误）
4. **单测**：`npm test`（须全过，当前约定 75 tests）
5. **E2E（可选但建议）**：`npm run build && npm run electron:main && npm run e2e`
6. **构建打包**：`npm run dist`（产出 `release/媒电通工作台 Setup 0.2.0.exe` + `release/win-unpacked/媒电通工作台.exe`）；或一键 `scripts/repack-installer.ps1`
7. **打标签**：`git tag v0.2.0 && git push --tags`
8. **发布 Release**：在 GitHub 创建 Release `v0.2.0`，上传 Setup.exe / Portable.exe（Release 附件名与 README 下载链接一致：Setup.exe / Portable.exe 简洁文件名）
9. **推送主线**：`git push origin main`
10. **同步安装包**：将新构建的安装包覆盖到 `D:\软件安装\个人工作台\meidiantong-workbench`，替换 09-12 的 v0.1.0 旧包

### 验证门禁（任一不过则阻断发布）
- typecheck 0 错误 ✅
- 单测全过 ✅
- 安装后双击启动无 "Cannot find module" ✅
- ErrorBoundary 触发显示友好提示 ✅
- 渲染进程崩溃自动重建窗口 ✅

---

## 四、后续技术债排期（建议优先级）

| 优先级 | 项 | 说明 |
|---|---|---|
| P1 | CRM 3 栏重构 | 按 docs/crm-drawer-3col-spec.md 实现（当前唯一活跃 P1） |
| P2 | 状态管理 | props drilling → Zustand/Context（App.tsx 已传全量 data） |
| P2 | E2E 扩展 | 现有 `tests/e2e/app.e2e.ts` 仅 4 用例，补 导入 / CRM 详情 / 工作流 关键路径 |
| P2 | 崩溃上报 | ErrorBoundary 接本地 dump / Sentry |
| P2 | 应用图标 | 修复 rcedit 报错，补 .ico |
| P3 | 外部导入 | 飞书表格粘贴 / 企微通讯录 |
| P3 | deep link | 媒电通:// 协议 |

---

## 五、架构演进小结

```
09-08 原型 v1/v2 + 需求文档 v2.0
09-10 交接文档 / 验收自查表 / v2.1 / v2.2（待确认）
09-11 交接文档锁定 v0.1.0（旧架构）
09-12 安装包 v0.1.0
09-13 CRM 竞品调研
09-14 ⚠️ NocoBase 风格架构转向（主线）
09-15 崩溃重建 / 一键打包 / 8 项 P1 修复
09-20 AI 多供应商预设
09-23 AI 建议 Tab 规范（收尾）
───────── 复盘发现三线错位，启动对齐 ─────────
09-23 本文档：README/HANDOFF 对齐、版本 0.2.0、问题迁 GitHub Issues、v2.1/v2.2 归档
```

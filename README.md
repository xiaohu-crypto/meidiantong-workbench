# 媒电通工作台 (MediaDesk Workbench)

> 本地优先的媒体广告代理桌面工具 — 客户管理、商机跟进、媒介策略、数据分析、知识沉淀一体化。

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/xiaohu-crypto/meidiantong-workbench/releases)
[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 功能特性

### 📊 今日驾驶舱
- 智能行动清单（Next-Best-Action 规则引擎）
- 季度目标 KR 进度追踪
- 待回款汇总与逾期提醒
- 常用功能快捷入口

### 👥 CRM 客户管理
- 客户全生命周期管理（线索→MQL→SQL→商机→签约）
- 360° 客户详情抽屉（概览/跟进/决策链/媒介策略/AI建议）
- 客户健康度评分与阶段自动派生
- 字段可见性自定义与密度切换

### 🎯 客户开发系统
- Pipeline 看板（支持自定义阶段）
- MEDDIC + BANT 双框架商机资格评估
- 比稿管理（投入/竞对/结果/复盘）
- SOP 话术库

### 📈 数据分析报表
- 可定制仪表盘（KPI/柱状图/折线图/表格 Widget）
- 签约额、回款、毛利多口径分析
- 行业基准值对标
- Widget 拖拽布局编辑

### 🤖 AI 能力（本地运行，零云端依赖）
- 客户跟进建议生成
- 自然语言问数（8 类意图识别）
- 任务智能聚合（近期关注/高优先级/本周截止）
- 结构化输出解析

### 📚 知识学习系统
- PARA 归档 + 双链笔记
- 自动保存与版本历史
- 标签检索

### 🔒 数据安全
- 本地优先，数据不上传
- IndexedDB + AES-256-GCM 静态加密
- 安全存储（DPAPI）保护加密密钥

---

## 📦 下载安装

### Windows

| 版本 | 下载 | 说明 |
|------|------|------|
| **安装包** | [媒电通工作台 Setup 0.1.0.exe](https://github.com/xiaohu-crypto/meidiantong-workbench/releases/download/v0.1.0/Setup.0.1.0.exe) | 推荐，支持自动更新 |
| **便携版** | [媒电通工作台 0.1.0.exe](https://github.com/xiaohu-crypto/meidiantong-workbench/releases/download/v0.1.0/0.1.0.exe) | 免安装，直接运行 |

> 所有版本请前往 [Releases 页面](https://github.com/xiaohu-crypto/meidiantong-workbench/releases) 下载。

### 系统要求
- Windows 10 / 11 (x64)
- 约 200MB 磁盘空间

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
| `npm test` | 运行单元测试 (Vitest) |
| `npm run dist` | 打包 Windows 安装包 |

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | Electron 33 |
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| 数据存储 | IndexedDB (idb) + AES-256-GCM 加密 |
| 状态管理 | React Hooks + Context |
| 图表渲染 | 原生 SVG（零图表库依赖） |
| 拖拽排序 | 原生 HTML5 Drag API |
| 测试框架 | Vitest + Playwright |
| 自动更新 | electron-updater |

---

## 📁 项目结构

```
meidiantong-workbench/
├── electron/              # Electron 主进程
│   ├── main.ts           # 主进程入口（窗口/更新/快捷键/托盘）
│   └── preload.ts        # 预加载脚本（IPC 桥接）
├── src/
│   ├── pages/            # 页面组件（Today/CRM/Dev/Data/Work/Kb...）
│   ├── ui/               # 通用 UI 组件
│   │   ├── common.tsx    # Btn/Chip/Modal/Field/Progress/useToast
│   │   ├── RecordPage.tsx # 通用记录详情页容器
│   │   ├── Dashboard.tsx # 仪表盘容器
│   │   └── widgets/      # Widget 组件（Fields/RelatedList/Timeline/Kpi/Chart...）
│   ├── core/             # 核心逻辑
│   │   ├── db.ts         # IndexedDB 封装（加密/CRUD/设置）
│   │   ├── derive.ts     # 数据派生（客户阶段/健康度/统计）
│   │   └── ai/           # AI 能力（脚本生成/问数引擎/结构化解析）
│   ├── styles/           # 样式（tokens.css 设计变量 + app.css）
│   └── App.tsx           # 应用入口（路由/主题/导航）
├── tests/                # 单元测试
├── package.json
└── vite.config.ts
```

---

## 🔧 构建打包

```bash
# 完整打包（类型检查 + 构建 + electron-builder）
npm run dist

# 产物输出到 release/ 目录
# - 媒电通工作台 Setup x.y.z.exe  (NSIS 安装包)
# - 媒电通工作台 x.y.z.exe        (便携版)
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

## ⚠️ 免责声明

本工具数据完全存储在本地，卸载应用前请务必备份 `%APPDATA%/meidiantong-workbench` 目录。

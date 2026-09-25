const MENU=[
{id:'agent',icon:'🤖',name:'AI助手'},
{id:'dashboard',icon:'📊',name:'工作台'},
{id:'crm',icon:'👥',name:'客户与商机'},
{id:'work',icon:'📋',name:'任务看板'},
{id:'media',icon:'🌐',name:'媒介排期'},
{id:'finance',icon:'📄',name:'合同与台账'},
{id:'kb',icon:'📖',name:'知识库'},
{id:'data',icon:'📈',name:'数据报表'},
{id:'growth',icon:'🤝',name:'团队协同'},
];
const PAGES={};
function ganttBar(left,width,cls,label){return `<div class="gantt-bar ${cls}" style="left:${left}%;width:${width}%" title="${label}">${label}</div>`}

/* ===== 0. AI 助手：居中对话式首页 ===== */
PAGES.agent=`<div style="min-height:calc(100vh-120px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 40px 20px">
<div style="font-size:38px;font-weight:900;color:var(--text-primary);letter-spacing:-1px;margin-bottom:6px">媒电通，我帮你</div>
<p style="font-size:12px;color:var(--text-secondary);margin-bottom:24px">本地优先 · AI 驱动 · 你的随身商务参谋</p>

<div style="display:flex;gap:8px;margin-bottom:20px">
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-primary);cursor:pointer;box-shadow:var(--shadow-card)">💼 日常办公</button>
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">👥 客户跟进</button>
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">🌐 媒介排期</button>
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">📈 数据分析</button>
</div>

<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:28px;max-width:600px">
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">📊 财报分析全流程 ›</button>
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">📄 MD转PDF文档 ›</button>
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">🔍 竞品对比分析 ›</button>
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">📝 项目周报转Word ›</button>
</div>

<!-- 输入框 -->
<div style="width:100%;max-width:640px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:20px;box-shadow:var(--shadow-card);padding:18px">
<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:8px;background:var(--success-bg);color:var(--success);font-size:10px;font-weight:800;margin-bottom:12px">
📄 文档处理 <span style="cursor:pointer">×</span>
</div>
<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
<button style="width:28px;height:28px;border-radius:8px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:12px;cursor:pointer">+</button>
<div style="flex:1;height:28px"></div>
<button style="padding:3px 8px;border-radius:6px;border:1px solid var(--border-subtle);background:transparent;font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">Hy3 ▾</button>
<button style="width:28px;height:28px;border-radius:8px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:12px;cursor:pointer">🎤</button>
<button style="width:32px;height:28px;border-radius:8px;background:var(--brand-primary);color:#fff;border:none;font-size:14px;cursor:pointer">↑</button>
</div>
<div style="display:flex;gap:16px;padding-top:10px;border-top:1px solid var(--border-subtle);font-size:9px;color:var(--text-muted)">
<span style="cursor:pointer">📁 选择工作空间 ▾</span>
<span style="cursor:pointer">✅ 默认权限 ▾</span>
</div>
</div>

<!-- 底部最佳案例推荐 -->
<div style="width:100%;max-width:640px;margin-top:32px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div style="font-size:11px;font-weight:800;color:var(--text-secondary)">📄 文档处理最佳案例</div>
<div style="display:flex;gap:12px;font-size:10px;color:var(--text-muted);cursor:pointer">🔄 换一批 <span style="margin-left:8px">✕</span></div>
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
${[
["#F0F4FF","Orders API 接口文档"],
["#F0FFF4","《思考，快与慢》精读笔记卡"],
["#FFF8F0","协作办公工具竞品调研分析"],
["#FFF0F0","合同条款风险审查雷达"]
].map(c=>`<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
<div style="height:80px;background:${c[0]};display:grid;place-items:center;font-size:24px">📑</div>
<div style="padding:10px;font-size:10px;font-weight:700;color:var(--text-primary);line-height:1.4">${c[1]}</div>
</div>`).join("")}
</div>
</div>
</div>`;

/* ===== 1. 工作台：仪表盘式 ===== */
PAGES.dashboard=`<div class="greeting"><h1>下午好，老板 👋</h1><p>今日 6 笔在途商机、2 笔逾期回款、3 项待办任务待处理</p></div>
<div class="kpi-grid">
<div class="kpi"><div class="kpi-label">在途商机总额</div><div class="kpi-value">¥1,020,000</div><div class="kpi-trend"><span class="kpi-trend-badge">↑ 16笔</span><span class="kpi-trend-text">在途流转合计</span></div></div>
<div class="kpi kpi-accent"><div class="kpi-label">本月已回款</div><div class="kpi-value">¥860,000</div><div class="kpi-trend"><span class="kpi-trend-badge">↑ 7.2%</span><span class="kpi-trend-text">较上月</span></div></div>
<div class="kpi"><div class="kpi-label">逾期应收</div><div class="kpi-value" style="color:var(--danger)">¥240,000</div><div class="kpi-trend"><span class="kpi-trend-badge down">↓ 2笔</span><span class="kpi-trend-text">已触发催款SOP</span></div></div>
<div class="kpi"><div class="kpi-label">今日新线索</div><div class="kpi-value">8</div><div class="kpi-trend"><span class="kpi-trend-badge">↑ 3</span><span class="kpi-trend-text">较昨日</span></div></div>
</div>
<div class="two-col">
<div class="card"><div class="card-header"><div class="card-title">单兵 WIP 负载限额</div><div class="card-extra">LIMIT: 5 DEAL</div></div><div class="budget-body"><div class="budget-label">当前在途商机负载 — 已超载 20%</div><div class="budget-bar"><div class="budget-fill" style="background:var(--danger);width:120%"></div></div><div class="budget-nums"><span>6 笔进行中</span><span class="total">上限 5 笔</span></div></div></div>
<div class="card"><div class="card-header"><div class="card-title">媒介成本精算</div><div class="card-extra">Q3 2026</div></div><div class="budget-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div><div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:1px">采购成本</div><div style="font-size:22px;font-weight:900;font-family:ui-monospace,monospace;margin-top:4px">¥1,095,000</div></div><div><div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:1px">客户报价</div><div style="font-size:22px;font-weight:900;font-family:ui-monospace,monospace;margin-top:4px;color:var(--success)">¥1,250,000</div></div></div><div style="margin-top:16px;padding:12px 16px;border-radius:var(--r-sm);background:var(--success-bg);display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;font-weight:700;color:var(--success)">预估净利 ¥155,000</span><span style="font-size:11px;font-weight:900;color:var(--success);font-family:ui-monospace,monospace">毛利率 12.4%</span></div></div></div>
</div>
<div class="card"><div class="card-header"><div class="card-title">规则引擎 · 建议跟进列表</div><div class="card-extra">SORTED BY VALUE DESC</div></div>
<div style="padding:14px 24px"><div style="display:flex;gap:8px;align-items:center"><span class="checkbox on">✓</span><span style="font-size:11px;color:var(--text-secondary);font-weight:700">全选</span><span style="flex:1"></span><button class="btn btn-secondary">批量催款</button><button class="btn btn-primary">批量跟进</button></div></div>
<table><thead><tr><th style="width:32px"></th><th>客户及项目</th><th>商机价值</th><th>状态</th><th>截止日期</th><th style="text-align:right">操作</th></tr></thead><tbody>
<tr><td><span class="checkbox on">✓</span></td><td><b>悦己美妆</b><br><span style="font-size:10px;color:var(--text-muted)">618 美妆投放 · 赢率50% · 沉默2天</span></td><td style="font-family:ui-monospace,monospace">¥560,000</td><td><span class="status-pill status-progress">谈判中</span></td><td style="font-family:ui-monospace,monospace;font-size:11px">2026-09-23</td><td style="text-align:right"><button class="btn btn-secondary">记录跟进</button></td></tr>
<tr><td><span class="checkbox on">✓</span></td><td><b>星海互动</b><br><span style="font-size:10px;color:var(--text-muted)">逾期回款 · 需立即处理</span></td><td style="font-family:ui-monospace,monospace;color:var(--danger)">¥180,000</td><td><span class="status-pill status-danger">已逾期</span></td><td style="font-family:ui-monospace,monospace;font-size:11px">2026-09-12</td><td style="text-align:right"><button class="btn btn-primary">催款</button></td></tr>
<tr><td><span class="checkbox"></span></td><td><b>蓝湾文旅</b><br><span style="font-size:10px;color:var(--text-muted)">国庆亲子营 · 赢率60% · 沉默4天</span></td><td style="font-family:ui-monospace,monospace">¥120,000</td><td><span class="status-pill status-success">已赢单</span></td><td style="font-family:ui-monospace,monospace;font-size:11px">2026-09-20</td><td style="text-align:right"><button class="btn btn-ghost">详情</button></td></tr>
</tbody></table>
<div class="pagination"><span>共 128 条记录 · 已选 2 条</span><div class="pager"><button>‹</button><button class="on">1</button><button>2</button><button>3</button><button>…</button><button>9</button><button>›</button></div></div></div>`;

/* ===== 2. 客户与商机：子页签切换，无重复大标题 ===== */
PAGES.crm=`<div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:end">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">128 个客户 · 16 笔在途商机 · 8 个流失风险</p></div>
<button class="btn btn-primary">+ 新增客户</button>
</div>
<div class="sub-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border-subtle);padding-bottom:0">
<button class="sub-tab on" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid var(--brand);color:var(--brand);cursor:pointer;margin-bottom:-1px">客户列表</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">商机看板</button>
</div>
<div class="filter-bar" style="background:var(--bg-surface);border-radius:var(--r-lg);margin-bottom:16px">
<span class="search-inline">🔍 搜索客户名/联系人/公司…</span>
<span class="chip on">全部 128</span><span class="chip">潜在 56</span><span class="chip">有效 42</span><span class="chip">合作 24</span><span class="chip">流失 6</span>
<span style="flex:1"></span>
<div class="view-switch"><button class="on">▦ 卡片</button><button>☰ 列表</button></div>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
${[
{n:'悦己美妆',t:'美妆日化',lv:'A',h:70,c:'¥560K',s:'success',st:'合作中',d:'张经理 · 138****2233'},
{n:'星海互动',t:'互联网',lv:'B',h:33,c:'¥180K',s:'danger',st:'逾期',d:'李总 · 139****8890'},
{n:'蓝湾文旅',t:'文旅',lv:'B',h:66,c:'¥120K',s:'pending',st:'已赢单',d:'王导 · 136****5566'},
{n:'恒诺电子',t:'消费电子',lv:'C',h:45,c:'¥80K',s:'pending',st:'潜在',d:'陈工 · 137****1234'},
{n:'启程教育',t:'教育',lv:'C',h:20,c:'¥50K',s:'danger',st:'沉默',d:'赵老师 · 135****7890'},
{n:'华宇控股',t:'综合集团',lv:'A',h:80,c:'¥200K',s:'success',st:'合作中',d:'周董 · 133****4567'},
].map(c=>`<div class="card" style="margin:0;padding:0;cursor:pointer">
<div style="padding:20px">
<div style="display:flex;justify-content:space-between;align-items:start">
<div style="width:40px;height:40px;border-radius:12px;background:var(--brand-subtle);color:var(--brand);display:grid;place-items:center;font-weight:900;font-size:14px">${c.n[0]}</div>
<span class="status-pill status-${c.s}">${c.st}</span>
</div>
<div style="margin-top:14px"><div style="font-size:15px;font-weight:900">${c.n}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">${c.t} · 等级 ${c.lv}</div></div>
<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-subtle)">
<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary)"><span>健康度</span><span style="font-family:ui-monospace,monospace;font-weight:800">${c.h}%</span></div>
<div style="height:5px;background:var(--bg-app);border-radius:99px;margin-top:6px"><div style="width:${c.h}%;height:100%;background:var(--${c.s==='success'?'success':c.s==='danger'?'danger':'warning'});border-radius:99px"></div></div>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:13px;font-weight:900;font-family:ui-monospace,monospace">${c.c}</span>
<span style="font-size:10px;color:var(--text-muted)">在途商机</span>
</div>
</div>
</div>`).join('')}
</div>
<div class="pagination"><span>共 128 个客户 · 已选 0 个</span><div class="pager"><button>‹</button><button class="on">1</button><button>2</button><button>3</button><button>…</button><button>9</button><button>›</button></div></div>`;

/* ===== 3. 任务看板：数据密集态，无重复大标题 ===== */
PAGES.work=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:16px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">今日 28 项 · 已完成 12 · 本周截止 8 · 2 项逾期</p></div>
<div style="display:flex;gap:8px;align-items:center">
<div class="view-switch"><button class="on">▥ 看板</button><button>☰ 列表</button></div>
<button class="btn btn-primary">+ 新建任务</button>
</div>
</div>
<div class="filter-bar" style="background:var(--bg-surface);border-radius:var(--r-lg);margin-bottom:16px">
<span class="search-inline">🔍 搜索任务…</span>
<span class="chip on">全部 28</span><span class="chip">今天 12</span><span class="chip">本周 8</span><span class="chip">逾期 2</span><span class="chip">已完成 12</span>
<span style="flex:1"></span>
<span style="font-size:10px;color:var(--text-muted)">WIP 限额：5/列</span>
</div>
<div class="board" style="padding:0;gap:12px;background:transparent;grid-template-columns:repeat(4,1fr)">
<div style="background:var(--bg-surface);border:1px solid var(--border-card);border-radius:var(--r-lg);padding:14px">
<div style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding:0 4px">待办 (8)<span style="font-size:9px;font-weight:800;color:var(--danger);background:var(--danger-bg);padding:1px 6px;border-radius:4px;margin-left:6px">WIP 4/5</span></div>
<div class="board-card">悦己美妆 · 发送618提案<div class="amount">¥560K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">📅 今天 14:00</div></div>
<div class="board-card">星海互动 · 电话催收<div class="amount" style="color:var(--danger)">¥180K</div><div style="font-size:9px;color:var(--danger);margin-top:6px">⚠️ 已逾期3天</div></div>
<div class="board-card">蓝湾文旅 · 合同用印<div class="amount">¥120K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">📅 明天 10:00</div></div>
<div class="board-card">恒诺电子 · 需求确认<div class="amount">¥80K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">📅 9/28</div></div>
<div class="board-card">华宇控股 · 报价审批<div class="amount">¥200K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">📅 9/30</div></div>
<div style="margin:8px 4px;padding:8px;border:1px dashed var(--border-subtle);border-radius:var(--r-sm);text-align:center;font-size:10px;color:var(--text-muted);cursor:pointer">+ 添加任务</div>
</div>
<div style="background:var(--bg-surface);border:1px solid var(--border-card);border-radius:var(--r-lg);padding:14px">
<div style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding:0 4px">进行中 (6)<span style="font-size:9px;font-weight:800;color:var(--warning);background:var(--warning-bg);padding:1px 6px;border-radius:4px;margin-left:6px">WIP 5/5</span></div>
<div class="board-card">启程教育 · 方案撰写<div class="amount" style="color:var(--warning)">¥50K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">🔄 已进行2天</div></div>
<div class="board-card">绿野咖啡 · 媒介采买<div class="amount">¥30K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">🔄 进行中</div></div>
<div class="board-card">星海互动 · 年框谈判<div class="amount" style="color:var(--danger)">¥180K</div><div style="font-size:9px;color:var(--danger);margin-top:6px">⚠️ 谈判超时</div></div>
<div style="margin:8px 4px;padding:8px;border:1px dashed var(--border-subtle);border-radius:var(--r-sm);text-align:center;font-size:10px;color:var(--text-muted);cursor:pointer">+ 添加任务</div>
</div>
<div style="background:var(--bg-surface);border:1px solid var(--border-card);border-radius:var(--r-lg);padding:14px">
<div style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding:0 4px">待审核 (4)</div>
<div class="board-card">恒诺电子 · 双11方案<div class="amount">¥80K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">⏳ 等主管审批</div></div>
<div class="board-card">蓝湾文旅 · 投放预算<div class="amount">¥120K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">⏳ 等财务审批</div></div>
<div class="board-card">华宇控股 · 品牌报价<div class="amount">¥200K</div><div style="font-size:9px;color:var(--text-muted);margin-top:6px">⏳ 等法务审核</div></div>
<div style="margin:8px 4px;padding:8px;border:1px dashed var(--border-subtle);border-radius:var(--r-sm);text-align:center;font-size:10px;color:var(--text-muted);cursor:pointer">+ 添加任务</div>
</div>
<div style="background:var(--bg-surface);border:1px solid var(--border-card);border-radius:var(--r-lg);padding:14px">
<div style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding:0 4px">已完成 (10)</div>
<div class="board-card" style="opacity:0.6">星海互动 · 首次触达<div class="amount" style="color:var(--success)">¥0</div></div>
<div class="board-card" style="opacity:0.6">悦己美妆 · 需求调研<div class="amount" style="color:var(--success)">已完成</div></div>
<div class="board-card" style="opacity:0.6">启程教育 · 首次演示<div class="amount" style="color:var(--success)">¥50K</div></div>
<div class="board-card" style="opacity:0.6">绿野咖啡 · 初步沟通<div class="amount" style="color:var(--success)">已完成</div></div>
<div style="margin:8px 4px;padding:8px;border:1px dashed var(--border-subtle);border-radius:var(--r-sm);text-align:center;font-size:10px;color:var(--text-muted);cursor:pointer">+ 添加任务</div>
</div>
</div>
<div class="pagination"><span>共 28 项任务 · 本周截止 8 项</span><div class="pager"><button>‹</button><button class="on">1</button><button>2</button><button>›</button></div></div>`;

/* ===== 4. 媒介排期：合并资源+甘特，无重复大标题 ===== */
PAGES.media=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:16px">
<div><p style="font-size:12px;color:var(--text-secondary);margin-top:4px">采购 ¥1,095,000 · 报价 ¥1,250,000 · 毛利 12.4% · 待返点 ¥86,000</p></div>
<button class="btn btn-primary">+ 新建排期</button>
</div>
<div class="sub-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border-subtle);padding-bottom:0">
<button class="sub-tab on" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid var(--brand);color:var(--brand);cursor:pointer;margin-bottom:-1px">排期甘特图</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">资源与刊例</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">达人库</button>
</div>
<div class="card" style="margin:0">
<div class="gantt-toolbar" style="border-top:0">
<div style="font-size:13px;font-weight:900">投放排期矩阵</div>
<div class="view-switch"><button>周</button><button class="on">月</button><button>季</button></div>
</div>
<div class="gantt-scroll"><div class="gantt-grid">
<div class="gantt-head"><div class="gantt-head-corner">投放渠道 / 客户</div><div class="gantt-head-months">
<div class="gantt-month">九月<div class="weeks"><div class="wk">W1</div><div class="wk">W2</div><div class="wk">W3</div><div class="wk">W4</div></div></div>
<div class="gantt-month">十月<div class="weeks"><div class="wk">W5</div><div class="wk">W6</div><div class="wk">W7</div><div class="wk">W8</div></div></div>
<div class="gantt-month">十一月<div class="weeks"><div class="wk">W9</div><div class="wk">W10</div><div class="wk">W11</div><div class="wk">W12</div></div></div>
<div class="gantt-month">十二月<div class="weeks"><div class="wk">W13</div><div class="wk">W14</div><div class="wk">W15</div><div class="wk">W16</div></div></div>
</div></div>
<div class="gantt-body"><div class="today-line" style="left:22%"></div>
<div class="gantt-group-row">▾ 悦己美妆</div>
<div class="gantt-row"><div class="gantt-row-label"><span class="dot" style="background:var(--brand)"></span><div>信息流投放 A<span class="sub">品牌广告+达人引流</span></div></div><div class="gantt-track">${ganttBar(3,18,'brand','¥220K')}</div></div>
<div class="gantt-row"><div class="gantt-row-label"><span class="dot" style="background:var(--success)"></span><div>种草投放 B<span class="sub">达人矩阵30篇</span></div></div><div class="gantt-track">${ganttBar(8,28,'success','¥380K')}</div></div>
<div class="gantt-group-row">▾ 星海互动</div>
<div class="gantt-row"><div class="gantt-row-label"><span class="dot" style="background:var(--danger)"></span><div>逾期催收<span class="sub">WIP · 5天</span></div></div><div class="gantt-track">${ganttBar(2,12,'danger','¥180K')}</div></div>
<div class="gantt-group-row">▾ 蓝湾文旅</div>
<div class="gantt-row"><div class="gantt-row-label"><span class="dot" style="background:var(--success)"></span><div>线下媒体框架<span class="sub">城市8城年框</span></div></div><div class="gantt-track">${ganttBar(15,55,'success','¥345K')}</div></div>
</div></div></div>
</div>`;



/* ===== 5. 合同与台账：融合板块，子页签切换 ===== */
PAGES.finance=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:16px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">在执行合同 24 份 · 本月流水 ¥1,240,000 · 待审批 4 笔 · 逾期 2 笔</p></div>
<button class="btn btn-primary">+ 新建合同</button>
</div>
<div class="sub-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border-subtle);padding-bottom:0">
<button class="sub-tab on" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid var(--brand);color:var(--brand);cursor:pointer;margin-bottom:-1px">合同列表</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">财务流水</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">待审批 (4)</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">返点核销</button>
</div>
<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
<div class="kpi" style="margin:0;padding:20px"><div class="kpi-label">合同总金额</div><div class="kpi-value" style="font-size:22px">¥8,620,000</div></div>
<div class="kpi" style="margin:0;padding:20px"><div class="kpi-label">本月收入</div><div class="kpi-value" style="font-size:22px;color:var(--success)">¥860,000</div></div>
<div class="kpi" style="margin:0;padding:20px"><div class="kpi-label">本月支出</div><div class="kpi-value" style="font-size:22px;color:var(--danger)">¥620,000</div></div>
<div class="kpi" style="margin:0;padding:20px"><div class="kpi-label">逾期合同</div><div class="kpi-value" style="font-size:22px;color:var(--danger)">2 份</div></div>
</div>
<div class="filter-bar" style="background:var(--bg-surface);border-radius:var(--r-lg);margin-bottom:16px">
<span class="search-inline">🔍 搜索合同编号/客户名…</span>
<span class="chip on">全部 183</span><span class="chip">执行中 24</span><span class="chip">待审批 3</span><span class="chip" style="background:var(--danger-bg);color:var(--danger);border-color:var(--danger-bg)">本月到期 5</span>
<span style="flex:1"></span>
<div class="view-switch"><button class="on">☰ 列表</button><button>▦ 卡片</button></div>
</div>
<table><thead><tr><th>合同编号</th><th>客户 / 项目</th><th>合同金额</th><th>已回款</th><th>状态</th><th>到期日</th><th style="text-align:right">操作</th></tr></thead><tbody>
<tr><td style="font-family:ui-monospace,monospace;font-size:11px;color:var(--text-muted)">HT-2026-0892</td><td><b>悦己美妆</b><br><span style="font-size:10px;color:var(--text-muted)">618 美妆投放年框</span></td><td style="font-family:ui-monospace,monospace">¥560,000</td><td style="font-family:ui-monospace,monospace;color:var(--success)">¥336,000</td><td><span class="status-pill status-success">执行中</span></td><td style="font-family:ui-monospace,monospace;font-size:11px">2026-12-31</td><td style="text-align:right"><button class="btn btn-secondary">详情</button></td></tr>
<tr style="background:var(--danger-bg)"><td style="font-family:ui-monospace,monospace;font-size:11px;color:var(--text-muted)">HT-2026-0741</td><td><b>星海互动</b><br><span style="font-size:10px;color:var(--text-muted)">逾期回款合同</span></td><td style="font-family:ui-monospace,monospace;color:var(--danger)">¥180,000</td><td style="font-family:ui-monospace,monospace;color:var(--danger)">¥0</td><td><span class="status-pill status-danger">已逾期</span></td><td style="font-family:ui-monospace,monospace;font-size:11px;color:var(--danger)">2026-09-12</td><td style="text-align:right"><button class="btn btn-primary">催款</button></td></tr>
<tr><td style="font-family:ui-monospace,monospace;font-size:11px;color:var(--text-muted)">HT-2026-0903</td><td><b>蓝湾文旅</b><br><span style="font-size:10px;color:var(--text-muted)">国庆亲子营项目</span></td><td style="font-family:ui-monospace,monospace">¥120,000</td><td style="font-family:ui-monospace,monospace;color:var(--success)">¥120,000</td><td><span class="status-pill status-success">已结清</span></td><td style="font-family:ui-monospace,monospace;font-size:11px">2026-10-15</td><td style="text-align:right"><button class="btn btn-ghost">归档</button></td></tr>
<tr><td style="font-family:ui-monospace,monospace;font-size:11px;color:var(--text-muted)">HT-2026-0911</td><td><b>恒诺电子</b><br><span style="font-size:10px;color:var(--text-muted)">双11 投放框架</span></td><td style="font-family:ui-monospace,monospace">¥80,000</td><td style="font-family:ui-monospace,monospace;color:var(--warning)">¥40,000</td><td><span class="status-pill status-pending">待审批</span></td><td style="font-family:ui-monospace,monospace;font-size:11px">2026-11-30</td><td style="text-align:right"><button class="btn btn-secondary">审批</button></td></tr>
<tr><td style="font-family:ui-monospace,monospace;font-size:11px;color:var(--text-muted)">HT-2026-0877</td><td><b>华宇控股</b><br><span style="font-size:10px;color:var(--text-muted)">品牌年度框架</span></td><td style="font-family:ui-monospace,monospace">¥200,000</td><td style="font-family:ui-monospace,monospace;color:var(--success)">¥100,000</td><td><span class="status-pill status-success">执行中</span></td><td style="font-family:ui-monospace,monospace;font-size:11px">2027-06-30</td><td style="text-align:right"><button class="btn btn-secondary">详情</button></td></tr>
</tbody></table>
<div class="pagination"><span>共 183 份合同 · 已选 0 份</span><div class="pager"><button>‹</button><button class="on">1</button><button>2</button><button>3</button><button>…</button><button>19</button><button>›</button></div></div>`;

/* ===== 6. 知识库：PARA 笔记流，无重复大标题 ===== */
PAGES.kb=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:16px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">PARA 系统 · 65 篇文档 · 最近更新 9/24</p></div>
<button class="btn btn-primary">+ 新建笔记</button>
</div>
<div class="filter-bar"><span class="search-inline">🔍 搜索笔记…</span><span class="chip on">全部</span><span class="chip">#方法论</span><span class="chip">#双11</span><span class="chip">#投放案例</span></div>
<div class="three-col" style="margin-top:16px">
<div class="card" style="margin:0"><div class="card-header"><div class="card-title">📁 Projects</div><div class="card-extra">12</div></div>
${['618 美妆投放复盘报告','国庆亲子营方案 v2','双11 媒介策略推演','Q4 预算规划表'].map(n=>`<div style="padding:12px 24px;border-bottom:1px solid var(--border-subtle);cursor:pointer;font-size:12px;font-weight:700">${n}<div style="font-size:10px;color:var(--text-muted);font-weight:500;margin-top:2px">更新于 9/23</div></div>`).join('')}
</div>
<div class="card" style="margin:0"><div class="card-header"><div class="card-title">🎯 Areas</div><div class="card-extra">8</div></div>
${['客户成功管理规范','媒介采买价格手册','财务回款流程SOP','团队协作约定'].map(n=>`<div style="padding:12px 24px;border-bottom:1px solid var(--border-subtle);cursor:pointer;font-size:12px;font-weight:700">${n}<div style="font-size:10px;color:var(--text-muted);font-weight:500;margin-top:2px">更新于 9/20</div></div>`).join('')}
</div>
<div class="card" style="margin:0"><div class="card-header"><div class="card-title">📚 Resources</div><div class="card-extra">45</div></div>
${['2026 美妆行业报告','达人资源库 v3','竞品分析：对标完美日记','投放案例合集'].map(n=>`<div style="padding:12px 24px;border-bottom:1px solid var(--border-subtle);cursor:pointer;font-size:12px;font-weight:700">${n}<div style="font-size:10px;color:var(--text-muted);font-weight:500;margin-top:2px">更新于 9/18</div></div>`).join('')}
</div>
</div>`;

/* ===== 7. 数据报表：数据大屏高密度复盘版，全板块可点击弹窗 ===== */
PAGES.data=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:14px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">2026 Q3 · 实时同步 IndexedDB · 更新于 2 分钟前 · <span style="color:var(--brand);font-weight:800">点击任意卡片查看详情 →</span></p></div>
<div style="display:flex;gap:8px;align-items:center">
<div class="view-switch"><button>今日</button><button>本周</button><button class="on">本月</button><button>本季</button><button>本年</button></div>
<button class="btn btn-secondary">导出 CSV</button>
</div>
</div>

<!-- KPI 8 宫格 -->
<div class="kpi-grid" style="grid-template-columns:repeat(8,1fr);gap:10px;margin-bottom:14px">
${[
['累计营收','¥6.82M','↑12.4% YoY','success',''],
['本月营收','¥860K','↑7.2% MoM','','kpi-accent'],
['在途商机','¥1.02M','16 笔','success',''],
['逾期应收','¥240K','2 笔 · 30+天','danger',''],
['回款率','78.3%','↓2.1pp','warning',''],
['毛利率','12.4%','↑0.8pp','success',''],
['本月新客','12','↑4 较上月','success',''],
['任务完成率','86%','28/32 项','success','']
].map(k=>`<div class="kpi ${k[4]}" style="margin:0;padding:14px;cursor:pointer" onclick="openModal('${k[0]}')">
<div class="kpi-label" style="font-size:9px">${k[0]}</div>
<div class="kpi-value" style="font-size:19px;margin-top:2px">${k[1]}</div>
<div style="font-size:9px;font-weight:800;margin-top:4px;color:${k[3]==='success'?'var(--success)':k[3]==='danger'?'var(--danger)':k[3]==='warning'?'var(--warning)':'inherit'}">${k[2]}</div>
</div>`).join('')}
</div>

<!-- 第二排：主趋势图(2/3) + 逾期账龄(1/3) -->
<div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px">
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('营收 vs 成本月度趋势')">
<div class="card-header"><div class="card-title">营收 vs 成本 月度趋势</div><div class="card-extra" style="display:flex;gap:10px;font-size:10px"><span style="color:var(--brand)">● 营收</span><span style="color:var(--success)">● 成本</span><span style="color:var(--danger)">● 毛利</span></div></div>
<div style="padding:16px 20px 0;height:200px;display:flex;align-items:flex-end;gap:6px">
${[38,42,45,52,48,58,55,68,85].map((h,i)=>`<div style="flex:1;display:flex;align-items:flex-end;justify-content:center;gap:2px;height:100%">
<div style="width:8px;height:${h*0.8}%;background:var(--border-subtle);border-radius:3px 3px 0 0"></div>
<div style="width:8px;height:${h*0.6}%;background:var(--success);opacity:.6;border-radius:3px 3px 0 0"></div>
<div style="width:8px;height:${h}%;background:${i===8?'var(--brand)':'var(--border-subtle)'};border-radius:3px 3px 0 0"></div>
</div>`).join('')}
</div>
<div style="display:flex;gap:6px;padding:6px 20px 12px">
${['1月','2月','3月','4月','5月','6月','7月','8月','9月'].map(m=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted);font-weight:700">${m}</div>`).join('')}
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('逾期账龄分布')">
<div class="card-header"><div class="card-title">逾期账龄分布</div><div class="card-extra" style="color:var(--danger)">2 笔异常</div></div>
<div style="padding:12px 20px">
${[['0-15天',45,'var(--warning)'],['15-30天',30,'var(--warning)'],['30-60天',18,'var(--danger)'],['60天+',7,'var(--danger)']].map(b=>`<div style="margin-bottom:10px">
<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span style="font-weight:800">${b[0]}</span><span style="font-family:ui-monospace,monospace;font-weight:900">${b[1]}%</span></div>
<div style="height:8px;background:var(--bg-app);border-radius:4px;overflow:hidden"><div style="width:${b[1]}%;height:100%;background:${b[2]};border-radius:4px"></div></div>
</div>`).join('')}
<div style="margin-top:14px;padding:10px;background:var(--danger-bg);border-radius:var(--r-sm);font-size:10px;font-weight:800;color:var(--danger)">⚠️ 星海互动 ¥180K 已逾期 12 天，建议今日催款</div>
</div>
</div>
</div>

<!-- 第三排：4 个复盘卡片 -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px">
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('员工绩效排行')">
<div class="card-header"><div class="card-title">员工绩效 TOP</div><div class="card-extra">本月</div></div>
<div style="padding:4 20px 12px">
${[['小张',92,'var(--brand)'],['李姐',78,'var(--success)'],['王哥',65,'var(--success)'],['赵助理',42,'var(--warning)']].map(e=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
<div style="width:24px;height:24px;border-radius:8px;background:${e[2]};color:#fff;display:grid;place-items:center;font-size:10px;font-weight:900">${e[0][0]}</div>
<span style="flex:1;font-size:11px;font-weight:800">${e[0]}</span>
<span style="font-size:12px;font-weight:900;font-family:ui-monospace,monospace">${e[1]}</span>
</div>`).join('')}
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('合同到期预警')">
<div class="card-header"><div class="card-title">合同到期预警</div><div class="card-extra" style="color:var(--warning)">5 份</div></div>
<div style="padding:4 20px 12px">
${[['悦己美妆','12/31 到期','var(--warning)'],['恒诺电子','11/30 到期','var(--warning)'],['星海互动','已逾期','var(--danger)'],['蓝湾文旅','10/15 到期','var(--success)']].map(c=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
<span style="width:6px;height:6px;border-radius:50%;background:${c[2]}"></span>
<span style="flex:1;font-size:11px;font-weight:800">${c[0]}</span>
<span style="font-size:10px;font-weight:800;color:${c[2]}">${c[1]}</span>
</div>`).join('')}
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('客户健康度分布')">
<div class="card-header"><div class="card-title">客户健康度分布</div><div class="card-extra">128 客户</div></div>
<div style="padding:16px 20px;display:flex;align-items:center;gap:12px">
<div style="width:90px;height:90px;border-radius:50%;background:conic-gradient(var(--success) 0 55%,var(--warning) 55% 82%,var(--danger) 82% 100%);flex-shrink:0;display:grid;place-items:center"><div style="width:54px;height:54px;background:var(--bg-surface);border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:12px">128</div></div>
<div style="font-size:10px;line-height:2;color:var(--text-secondary)">
<div>● 健康 70</div><div>● 关注 35</div><div>● 流失 8</div>
</div>
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('媒介投放 ROI')">
<div class="card-header"><div class="card-title">媒介投放 ROI</div><div class="card-extra">Q3</div></div>
<div style="padding:12px 20px">
<div style="font-size:9px;color:var(--text-muted);font-weight:800;text-transform:uppercase;letter-spacing:1px">综合 ROI</div>
<div style="font-size:28px;font-weight:900;font-family:ui-monospace,monospace;margin-top:2px">1.14<span style="font-size:12px;color:var(--text-muted)">x</span></div>
<div style="margin-top:10px;font-size:10px;line-height:1.8">
<div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">达人矩阵</span><b style="font-family:ui-monospace,monospace">1.32x</b></div>
<div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">信息流</span><b style="font-family:ui-monospace,monospace">0.98x</b></div>
<div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">线下框架</span><b style="font-family:ui-monospace,monospace">1.08x</b></div>
</div>
</div>
</div>
</div>

<!-- 第四排：漏斗 + 渠道环图 + 回款预测 + 本周新增线索 -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1.2fr;gap:14px;margin-bottom:14px">
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('销售回款漏斗')">
<div class="card-header"><div class="card-title">销售回款漏斗</div><div class="card-extra">Q3</div></div>
<div style="padding:12px 20px;display:flex;flex-direction:column;gap:6px">
${[['线索','128',100,'var(--text-muted)'],['初步沟通','86',67,'var(--warning)'],['方案报价','42',33,'var(--brand)'],['赢单','16',12.5,'var(--success)'],['已回款','12',9.4,'var(--success)']].map(f=>`<div>
<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px"><span style="font-weight:800">${f[0]}</span><span style="font-family:ui-monospace,monospace;font-weight:900">${f[1]} · ${f[2]}%</span></div>
<div style="height:10px;background:var(--bg-app);border-radius:3px;overflow:hidden"><div style="width:${f[2]}%;height:100%;background:${f[3]};border-radius:3px"></div></div>
</div>`).join('')}
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('渠道贡献')">
<div class="card-header"><div class="card-title">渠道贡献占比</div><div class="card-extra">Q3</div></div>
<div style="padding:12px 16px;display:flex;align-items:center;gap:10px">
<div style="width:80px;height:80px;border-radius:50%;background:conic-gradient(var(--brand) 0 40%,var(--success) 40% 65%,var(--warning) 65% 85%,var(--text-muted) 85% 100%);flex-shrink:0;display:grid;place-items:center"><div style="width:46px;height:46px;background:var(--bg-surface);border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:10px">¥860K</div></div>
<div style="font-size:10px;line-height:1.9;color:var(--text-secondary)">
<div style="display:flex;justify-content:space-between"><span>● 达人</span><b>40%</b></div>
<div style="display:flex;justify-content:space-between"><span>● 信息流</span><b>25%</b></div>
<div style="display:flex;justify-content:space-between"><span>● 线下</span><b>20%</b></div>
</div>
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('回款预测')">
<div class="card-header"><div class="card-title">30 天回款预测</div><div class="card-extra">FORECAST</div></div>
<div style="padding:12px 20px">
<div style="font-size:9px;color:var(--text-muted);font-weight:800;text-transform:uppercase;letter-spacing:1px">预计到账</div>
<div style="font-size:22px;font-weight:900;font-family:ui-monospace,monospace;color:var(--success);margin-top:2px">¥420K</div>
<div style="margin-top:8px;font-size:10px;line-height:1.8;color:var(--text-secondary)">
<div>9/28 悦己美妆 ¥168K</div>
<div>10/05 华宇控股 ¥200K</div>
</div>
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('本周新增线索')">
<div class="card-header"><div class="card-title">本周新增线索</div><div class="card-extra" style="color:var(--success)">+12</div></div>
<div style="padding:8px 20px">
${[['绿野咖啡','餐饮','王总','9/22'],['橙光科技','互联网','陈经理','9/23'],['青山教育','教育','刘老师','9/23'],['琥珀珠宝','零售','赵董','9/24']].map(l=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border-subtle)">
<div style="width:22px;height:22px;border-radius:6px;background:var(--brand-subtle);color:var(--brand);display:grid;place-items:center;font-size:10px;font-weight:900">${l[0][0]}</div>
<div style="flex:1"><div style="font-size:11px;font-weight:800">${l[0]}</div><div style="font-size:9px;color:var(--text-muted)">${l[1]} · ${l[2]}</div></div>
<span style="font-size:9px;color:var(--text-muted);font-family:ui-monospace,monospace">${l[3]}</span>
</div>`).join('')}
</div>
</div>
</div>

<!-- 第五排：客户流失预警 + 竞品动态 -->
<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:14px;margin-bottom:14px">
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('客户流失预警')">
<div class="card-header"><div class="card-title">客户流失预警</div><div class="card-extra" style="color:var(--danger)">8 个风险</div></div>
<div style="padding:8px 20px">
${[['启程教育','沉默 14 天','danger'],['星海互动','逾期 12 天','danger'],['恒诺电子','沉默 9 天','warning'],['绿野咖啡','未回消息 5 天','warning'],['橙光科技','新客未成交','pending']].map(w=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border-subtle)">
<span style="width:6px;height:6px;border-radius:50%;background:var(--${w[2]==='danger'?'danger':w[2]==='warning'?'warning':'brand'})"></span>
<span style="flex:1;font-size:11px;font-weight:800">${w[0]}</span>
<span style="font-size:10px;font-weight:800;color:var(--${w[2]==='danger'?'danger':w[2]==='warning'?'warning':'text-secondary'})">${w[1]}</span>
</div>`).join('')}
</div>
</div>
<div class="card" style="margin:0;cursor:pointer" onclick="openModal('竞品动态')">
<div class="card-header"><div class="card-title">竞品动态追踪</div><div class="card-extra">本周 3 条</div></div>
<div style="padding:8px 20px">
${[['9/24','竞对 A','发布双11达人招商政策，报价下浮 8%','warning'],['9/23','竞对 B','签约华宇控股年框，金额 ¥300K','danger'],['9/22','竞对 C','上线 AI 投放工具，主打中小客户','pending']].map(n=>`<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
<span style="font-size:10px;font-weight:900;font-family:ui-monospace,monospace;color:var(--text-muted);width:42px;flex-shrink:0">${n[0]}</span>
<span style="font-size:10px;font-weight:900;color:var(--brand);width:50px;flex-shrink:0">${n[1]}</span>
<span style="flex:1;font-size:11px;color:var(--text-secondary);font-weight:600">${n[2]}</span>
<span class="status-pill status-${n[3]}" style="flex-shrink:0">${n[3]==='danger'?'高':n[3]==='warning'?'中':'低'}</span>
</div>`).join('')}
</div>
</div>
</div>

<!-- 全局弹窗 -->
<div id="dataModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;align-items:center;justify-content:center" onclick="if(event.target===this)closeModal()">
<div style="background:var(--bg-surface);border-radius:var(--r-xl);width:720px;max-height:85vh;overflow-y:auto;padding:28px;box-shadow:var(--shadow-popover)">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
<h3 id="modalTitle" style="font-size:16px;font-weight:900;color:var(--text-primary)"></h3>
<button onclick="closeModal()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted)">✕</button>
</div>
<div id="modalBody" style="font-size:12px;color:var(--text-secondary);line-height:1.8"></div>
</div>
</div>`;

function openModal(name){
const t=document.getElementById('modalTitle');const b=document.getElementById('modalBody');
const tbl=(rows,head)=>`<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:11px"><thead><tr style="border-bottom:2px solid var(--border-subtle)">${head.map(h=>`<th style="text-align:left;padding:6px 8px;font-size:10px;color:var(--text-muted);font-weight:800">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr style="border-bottom:1px solid var(--border-subtle)"><td style="padding:8px;font-weight:700">${r[0]}</td>${r.slice(1).map(c=>`<td style="padding:8px;font-family:ui-monospace,monospace">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const data={
'累计营收':`<p>2026 年累计营收 <b style="color:var(--text-primary);font-size:16px">¥6,820,000</b>，同比 +12.4%。</p>`+tbl([['Q1','¥1,820,000','21 笔','+8.2%'],['Q2','¥2,140,000','28 笔','+15.6%'],['Q3（截至9/24）','¥2,860,000','32 笔','+12.4%']],['季度','营收','赢单数','同比']),
'本月营收':`<p>本月营收 <b style="color:var(--text-primary);font-size:16px">¥860,000</b>，环比 +7.2%。</p>`+tbl([['已回款','¥580,000','67.4%'],['在途','¥280,000','32.6%'],['合计','¥860,000','100%']],['状态','金额','占比']),
'在途商机':`<p>在途商机 <b style="color:var(--text-primary);font-size:16px">16 笔</b>，加权金额 ¥1,020,000。</p>`+tbl([['赢率 ≥50%','4 笔','¥680,000'],['赢率 30-50%','7 笔','¥260,000'],['赢率 <30%','5 笔','¥80,000']],['阶段','数量','加权金额']),
'逾期应收':`<p>逾期应收 <b style="color:var(--danger);font-size:16px">¥240,000</b>：</p>`+tbl([['星海互动','HT-2026-0741','¥180,000','12 天','紧急'],['启程教育','HT-2026-0688','¥60,000','5 天','预警']],['客户','合同号','金额','逾期天数','级别']),
'回款率':`<p>本季回款率 <b style="color:var(--text-primary);font-size:16px">78.3%</b>，环比 -2.1pp。</p><p style="margin-top:8px">已回款 ¥2,240K / 应回款 ¥2,860K</p>`,
'毛利率':`<p>本季毛利率 <b style="color:var(--text-primary);font-size:16px">12.4%</b>，环比 +0.8pp。</p><p style="margin-top:8px">营收 ¥2,860K · 成本 ¥2,503K · 毛利 ¥357K</p>`,
'本月新客':`<p>本月新增客户 <b style="color:var(--text-primary);font-size:16px">12 个</b>。</p>`+tbl([['A 类','2','悦己美妆、华宇控股'],['B 类','5','星海互动、蓝湾文旅等'],['C 类','5','恒诺电子、启程教育等']],['等级','数量','客户']),
'任务完成率':`<p>本月任务完成率 <b style="color:var(--text-primary);font-size:16px">86%</b>（28/32 项）。</p><p style="margin-top:8px">逾期 4 项：星海电话催收、恒诺需求确认、蓝湾合同用印、华宇报价审批</p>`,
'营收 vs 成本月度趋势':`<p>1-9 月营收与成本明细：</p>`+tbl([['1月','¥280K','¥252K','28K'],['5月','¥480K','¥420K','60K'],['8月','¥680K','¥600K','80K'],['9月','¥860K','¥754K','106K']],['月份','营收','成本','毛利']),
'逾期账龄分布':`<p>逾期账款账龄明细：</p>`+tbl([['0-15天','¥108K','3 笔','跟进中'],['15-30天','¥72K','2 笔','已升级'],['30-60天','¥43K','1 笔','法务介入'],['60天+','¥17K','1 笔','律师函']],['账龄','金额','笔数','处置状态']),
'员工绩效排行':`<p>本月绩效综合评分：</p>`+tbl([['小张','¥320K','92','14 笔','95%'],['李姐','¥240K','78','10 笔','88%'],['王哥','¥180K','65','8 笔','76%'],['赵助理','¥80K','42','4 笔','60%']],['员工','赢单额','评分','任务数','回款率']),
'合同到期预警':`<p>未来 90 天到期合同：</p>`+tbl([['悦己美妆','HT-2026-0892','¥560K','12/31','续约率预估 85%'],['恒诺电子','HT-2026-0911','¥80K','11/30','需重新谈判'],['星海互动','HT-2026-0741','¥180K','已逾期','催收中'],['蓝湾文旅','HT-2026-0903','¥120K','10/15','已结清归档']],['客户','合同号','金额','到期日','备注']),
'客户健康度分布':`<p>128 个客户健康度分布：</p>`+tbl([['健康（≥70分）','70','55%','正常跟进'],['关注（40-69）','35','27%','加强触达'],['流失风险（<40）','8','6%','紧急挽回']],['等级','客户数','占比','策略']),
'媒介投放 ROI':`<p>Q3 各渠道 ROI：</p>`+tbl([['达人矩阵','¥380K','¥502K','1.32x','达标'],['信息流','¥320K','¥314K','0.98x','需优化'],['线下框架','¥280K','¥302K','1.08x','达标'],['合计','¥980K','¥1,118K','1.14x']],['渠道','成本','产出','ROI','状态']),
'销售回款漏斗':`<p>Q3 销售漏斗全链路：</p>`+tbl([['线索','128','100%','-'],['初步沟通','86','67%','转化 67%'],['方案报价','42','33%','转化 49%'],['赢单','16','12.5%','转化 38%'],['已回款','12','9.4%','回款 75%']],['阶段','数量','转化率','环节转化']),
'渠道贡献':`<p>Q3 渠道营收明细：</p>`+tbl([['达人投放','¥344K','40%','↑15%'],['信息流','¥215K','25%','↓5%'],['线下框架','¥172K','20%','持平'],['其他','¥129K','15%','新渠道']],['渠道','营收','占比','环比']),
'回款预测':`<p>未来 30 天预计到账：</p>`+tbl([['9/28','悦己美妆','二期款','¥168K','合同约定'],['10/05','华宇控股','季度款','¥200K','合同约定'],['10/12','蓝湾文旅','尾款','¥52K','已开票']],['日期','客户','款项','金额','依据']),
'本周新增线索':`<p>本周新增线索 12 个：</p>`+tbl([['绿野咖啡','餐饮','王总','9/22','朋友推荐','A'],['橙光科技','互联网','陈经理','9/23','官网表单','B'],['青山教育','教育','刘老师','9/23','老客转介','B'],['琥珀珠宝','零售','赵董','9/24','活动扫码','C'],['...','...','...','...','...','...']],['客户','行业','联系人','日期','来源','评级']),
'客户流失预警':`<p>8 个流失风险客户明细：</p>`+tbl([['启程教育','沉默 14 天','C','¥50K','已发 3 次跟进未回'],['星海互动','逾期 12 天','B','¥180K','已逾期，需法务介入'],['恒诺电子','沉默 9 天','C','¥80K','双11方案未回复'],['绿野咖啡','未回消息 5 天','B','¥30K','报价后无反馈'],['橙光科技','新客未成交','新','¥120K','首次报价后沉默']],['客户','风险信号','等级','在途金额','建议动作']),
'竞品动态':`<p>本周竞品动态 3 条：</p>`+tbl([['9/24','竞对 A','双11达人招商报价下浮 8%','中','建议报价策略微调'],['9/23','竞对 B','签约华宇控股年框 ¥300K','高','华宇已被抢，转攻其他'],['9/22','竞对 C','上线 AI 投放工具主打中小客户','低','关注即可']],['日期','竞品','事件','影响','应对']),
};
t.textContent=name;b.innerHTML=data[name]||'<p>暂无详情</p>';
document.getElementById('dataModal').style.display='flex';
}
function closeModal(){document.getElementById('dataModal').style.display='none';}

/* ===== 8. 团队协同：AI建议展开 + 报告富文本Modal + 子任务拖拽 + 高密度筛选 ===== */
PAGES.growth=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:12px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">9月25日 周五 · 3 场会议 · 2 份待写纪要 · 3 条 AI 建议待处理</p></div>
<div style="display:flex;gap:8px">
<input placeholder="🔍 搜索会议/报告/任务..." style="padding:6px 12px;border:1px solid var(--border-subtle);border-radius:var(--r-lg);font-size:11px;background:var(--bg-surface);width:220px;outline:none">
<button class="btn btn-secondary">📅 完整日历</button>
<button class="btn btn-primary">+ 发起会议</button>
</div>
</div>

<!-- AI 建议条：可展开 -->
<div style="background:var(--brand-subtle);border:1px solid var(--brand-subtle);border-left:3px solid var(--brand);border-radius:var(--r-md);margin-bottom:12px">
<div style="padding:10px 14px;display:flex;gap:10px;align-items:center;cursor:pointer">
<div style="font-size:16px">🤖</div>
<div style="flex:1;font-size:11px;color:var(--text-secondary)"><b style="color:var(--brand)">AI 建议（3）：</b>星海逾期12天需优先催收 · 王哥周报2天未更 · 双11差2达人</div>
<button class="btn btn-secondary" style="padding:3px 10px;font-size:10px">采纳全部</button>
<span style="color:var(--text-muted);font-size:10px">▼ 展开</span>
</div>
<div style="border-top:1px solid var(--brand-subtle);padding:12px 14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
<div style="background:var(--bg-surface);border-radius:var(--r-md);padding:10px;border:1px solid var(--border-subtle)">
<div style="font-size:10px;font-weight:900;color:var(--danger);margin-bottom:4px">⚠️ 高优先级</div>
<div style="font-size:11px;font-weight:700;color:var(--text-primary);line-height:1.4">星海互动 ¥180K 已逾期 12 天</div>
<div style="font-size:10px;color:var(--text-secondary);margin-top:4px;line-height:1.4">建议：今日晨会专题讨论，发送律师函草稿，李姐负责。预计可回收 ¥120K。</div>
<button class="btn btn-primary" style="padding:3px 10px;font-size:9px;margin-top:6px">生成催收方案</button>
</div>
<div style="background:var(--bg-surface);border-radius:var(--r-md);padding:10px;border:1px solid var(--border-subtle)">
<div style="font-size:10px;font-weight:900;color:var(--warning);margin-bottom:4px">⏰ 待提醒</div>
<div style="font-size:11px;font-weight:700;color:var(--text-primary);line-height:1.4">王哥 第39周周报 已2天未更新</div>
<div style="font-size:10px;color:var(--text-secondary);margin-top:4px;line-height:1.4">建议：自动从任务数据生成周报草稿，王哥确认后提交。</div>
<button class="btn btn-secondary" style="padding:3px 10px;font-size:9px;margin-top:6px">🤖 自动生成草稿</button>
</div>
<div style="background:var(--bg-surface);border-radius:var(--r-md);padding:10px;border:1px solid var(--border-subtle)">
<div style="font-size:10px;font-weight:900;color:var(--brand);margin-bottom:4px">🎯 阻塞项</div>
<div style="font-size:11px;font-weight:700;color:var(--text-primary);line-height:1.4">双11达人矩阵还差 2 个头部达人未锁定</div>
<div style="font-size:10px;color:var(--text-secondary);margin-top:4px;line-height:1.4">建议：从达人库推荐 5 个匹配美妆品类的备选，王哥本周内签约。</div>
<button class="btn btn-secondary" style="padding:3px 10px;font-size:9px;margin-top:6px">查看推荐达人</button>
</div>
</div>
</div>

<!-- 今日会议：紧凑列表 -->
<div class="card" style="margin:0;margin-bottom:12px">
<div class="card-header"><div class="card-title">今日会议与纪要</div><div class="card-extra">3 场 · 2 份待补 · <a style="color:var(--brand);cursor:pointer;font-size:10px">筛选 ▾</a></div></div>
<div style="padding:0 20px 8px">
<!-- 晨会：展开态纪要 -->
<div style="border:1px solid var(--border-subtle);border-radius:var(--r-md);margin-bottom:8px;overflow:hidden">
<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-app)">
<span style="font-size:10px;font-weight:900;font-family:ui-monospace,monospace;color:var(--text-muted);width:80px">09:30-10:00</span>
<div style="flex:1;font-size:11px;font-weight:900">晨会 · 昨日复盘 <span style="font-size:9px;color:var(--text-muted);font-weight:500;margin-left:6px">小张、李姐、王哥</span></div>
<span class="status-pill status-success">已结束</span>
<button class="btn btn-secondary" style="padding:2px 8px;font-size:9px">✏️</button>
<button class="btn btn-ghost" style="padding:2px 8px;font-size:9px">🗑</button>
</div>
<div style="padding:10px 12px;border-top:1px solid var(--border-subtle)">
<div style="font-size:10px;font-weight:900;color:var(--text-muted);margin-bottom:4px">📌 决议</div>
<div style="font-size:10px;line-height:1.7;color:var(--text-secondary)">1. 星海¥180K今日电话催收（李姐）2. 双11差2达人本周锁定（王哥）3. 悦己提案v3 14:00发客户</div>
<div style="font-size:10px;font-weight:900;color:var(--text-muted);margin:8px 0 4px">✅ 待办</div>
${[["星海互动电话催收","李姐","今日18:00","danger"],["锁定2个头部达人","王哥","周五前","pending"],["发送悦己提案v3","小张","14:00","success"]].map(t=>`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px">
<input type="checkbox" style="accent-color:var(--brand);width:12px;height:12px">
<span style="flex:1;font-weight:700">${t[0]}</span>
<span style="color:var(--text-secondary);font-size:9px">${t[1]}</span>
<span style="color:var(--text-muted);font-size:9px;font-family:ui-monospace,monospace;width:70px">${t[2]}</span>
<span class="status-pill status-${t[3]}" style="font-size:8px">${t[3]==='danger'?'紧急':t[3]==='pending'?'进行中':'完成'}</span>
</div>`).join("")}
<button class="btn btn-secondary" style="padding:2px 8px;font-size:9px;margin-top:6px">🤖 AI整理纪要</button>
</div>
</div>
${[["14:00-15:00","星海互动催款专题会","小张、李姐、王姐","飞书","即将开始","pending","会后AI自动生成"],["16:30-17:00","双11媒介策略脑暴","全员+外部顾问","会议室B","待开始","pending","待参会"]].map(m=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border-subtle)">
<span style="font-size:10px;font-weight:900;font-family:ui-monospace,monospace;color:var(--text-muted);width:80px">${m[0]}</span>
<div style="flex:1;font-size:11px;font-weight:900">${m[1]} <span style="font-size:9px;color:var(--text-muted);font-weight:500;margin-left:6px">${m[2]}</span></div>
<span class="status-pill status-${m[5]}" style="font-size:9px">${m[4]}</span>
<span style="font-size:9px;color:var(--text-muted);font-weight:700;width:110px">${m[6]}</span>
<button class="btn btn-secondary" style="padding:2px 8px;font-size:9px">模板</button>
</div>`).join("")}
</div>
</div>

<!-- 项目目标 + Feed 两栏 -->
<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-bottom:12px">
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">Q3 项目目标协同</div><div class="card-extra"><button class="btn btn-secondary" style="padding:2px 8px;font-size:9px">🤖 AI拆解</button></div></div>
<div style="padding:0 16px 12px">
<div style="padding:10px 12px;background:var(--brand-subtle);border-radius:var(--r-md);margin-bottom:10px">
<div style="font-size:9px;font-weight:900;color:var(--brand)">🎯 北极星：营收¥2.8M · 回款率≥85% · 新客3个</div>
</div>
${[
["双11美妆战役",72,"var(--success)","小张",[["达人矩阵30篇","80","已发24篇"],["信息流投放","60","素材审核中"],["预算分配确认","100","已锁定"]]],
["星海互动催收专项",33,"var(--danger)","李姐 · 延期",[["电话催收","20","未打通"],["律师函","50","已起草"],["财务对账","100","已完成"]]],
["达人矩阵渠道拓展",66,"var(--brand)","王哥",[["新签头部达人","66","已签2/3"],["刊例价更新","90","待审核"],["合同归档","40","进行中"]]]
].map(p=>`<div style="border:1px solid var(--border-subtle);border-radius:var(--r-md);margin-bottom:6px;overflow:hidden">
<div style="padding:8px 10px;background:var(--bg-app);display:flex;align-items:center;gap:6px">
<span style="color:var(--text-muted);cursor:grab" title="拖拽排序">⋮⋮</span>
<span style="flex:1;font-size:11px;font-weight:900">${p[0]} <span style="font-size:9px;color:var(--text-muted);font-weight:500;margin-left:4px">${p[3]}</span></span>
<div style="width:80px;height:5px;background:var(--bg-surface);border-radius:99px;overflow:hidden"><div style="width:${p[1]}%;height:100%;background:${p[2]}"></div></div>
<span style="font-size:10px;font-weight:900;font-family:ui-monospace,monospace;width:32px;text-align:right">${p[1]}%</span>
<button class="btn btn-ghost" style="padding:1px 6px;font-size:9px">✏️</button>
</div>
<div style="padding:6px 10px 6px 28px">
${p[4].map(sub=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:10px">
<span style="color:var(--text-muted);cursor:grab">⋮⋮</span>
<span style="flex:1;color:var(--text-secondary)">${sub[0]}</span>
<div style="width:50px;height:4px;background:var(--bg-app);border-radius:99px"><div style="width:${sub[1]}%;height:100%;background:${p[2]};border-radius:99px"></div></div>
<span style="font-size:9px;color:var(--text-muted);font-family:ui-monospace,monospace;width:30px">${sub[1]}%</span>
<span style="font-size:9px;color:var(--text-muted);width:60px">${sub[2]}</span>
</div>`).join("")}
</div>
</div>`).join("")}
</div>
</div>
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">协作动态</div><div class="card-extra">筛选 ▾</div></div>
<div style="padding:0 16px;max-height:340px;overflow-y:auto">
${[
["张","#FF5A36","小张","完成提案v3","10分"],
["李","#10B981","李姐","更新催款SOP","25分"],
["王","#F59E0B","王哥","建甘特图","1时"],
["赵","#3B82F6","赵助理","上传拜访纪要","2时"],
["张","#FF5A36","小张","评论报价方案","3时"],
["李","#10B981","李姐","提交周报","昨18:30"]
].map(f=>`<div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-subtle);align-items:center">
<div style="width:24px;height:24px;border-radius:6px;background:${f[1]};color:#fff;display:grid;place-items:center;font-size:10px;font-weight:900">${f[0]}</div>
<div style="flex:1;font-size:10px"><b style="color:var(--text-primary)">${f[2]}</b> <span style="color:var(--text-secondary)">${f[3]}</span></div>
<div style="font-size:9px;color:var(--text-muted);font-family:ui-monospace,monospace">${f[4]}</div>
</div>`).join("")}
</div>
</div>
</div>

<!-- 报告中心：紧凑表格 + 点击编辑 Modal -->
<div class="card" style="margin:0">
<div class="card-header">
<div class="card-title">报告中心</div>
<div class="card-extra">
<input placeholder="搜索报告..." style="padding:3px 8px;border:1px solid var(--border-subtle);border-radius:var(--r-md);font-size:10px;background:var(--bg-surface);margin-right:6px;width:120px;outline:none">
<button class="btn btn-secondary" style="padding:3px 10px;font-size:9px">🤖 AI一键生成草稿</button>
</div>
</div>
<div style="padding:0 20px 12px">
<div style="display:flex;gap:2px;margin-bottom:10px;border-bottom:1px solid var(--border-subtle)">
<button style="padding:6px 12px;font-size:10px;font-weight:800;border:none;border-bottom:2px solid var(--brand);color:var(--brand);background:transparent;cursor:pointer;margin-bottom:-1px">日报</button>
<button style="padding:6px 12px;font-size:10px;font-weight:800;border:none;border-bottom:2px solid transparent;color:var(--text-secondary);background:transparent;cursor:pointer;margin-bottom:-1px">周报</button>
<button style="padding:6px 12px;font-size:10px;font-weight:800;border:none;border-bottom:2px solid transparent;color:var(--text-secondary);background:transparent;cursor:pointer;margin-bottom:-1px">季报</button>
<button style="padding:6px 12px;font-size:10px;font-weight:800;border:none;border-bottom:2px solid transparent;color:var(--text-secondary);background:transparent;cursor:pointer;margin-bottom:-1px">年报</button>
</div>
<table style="width:100%;border-collapse:collapse;font-size:10px">
<thead><tr style="border-bottom:1px solid var(--border-subtle)">
<th style="text-align:left;padding:6px;font-size:9px;color:var(--text-muted)">标题</th>
<th style="text-align:left;padding:6px;font-size:9px;color:var(--text-muted)">负责人</th>
<th style="text-align:left;padding:6px;font-size:9px;color:var(--text-muted)">周期</th>
<th style="text-align:left;padding:6px;font-size:9px;color:var(--text-muted)">状态</th>
<th style="text-align:right;padding:6px;font-size:9px;color:var(--text-muted)">操作</th>
</tr></thead>
<tbody>
${[
["小张 · 9/25 工作日报","小张","今天","AI草稿待编辑","pending",true],
["李姐 · 9/25 工作日报","李姐","今天","已提交","success",false],
["王哥 · 第39周周报","王哥","9/22-28","AI已生成待改","pending",true],
["Q3 季度营收复盘","小张","Q3","待撰写","pending",false],
["2026 年度战略复盘","老板","全年","归档","",false]
].map(r=>`<tr style="border-bottom:1px solid var(--border-subtle);cursor:pointer" onclick="alert('打开报告正文编辑器（富文本）')">
<td style="padding:7px;font-weight:800;color:${r[5]?'var(--brand)':'var(--text-primary)'}">${r[0]} ${r[5]?'<span style="font-size:8px;background:var(--brand-subtle);color:var(--brand);padding:1px 5px;border-radius:99px;margin-left:4px">AI草稿</span>':''}</td>
<td style="padding:7px;color:var(--text-secondary)">${r[1]}</td>
<td style="padding:7px;color:var(--text-muted);font-family:ui-monospace,monospace;font-size:9px">${r[2]}</td>
<td style="padding:7px"><span class="status-pill status-${r[4]}" style="font-size:9px">${r[3]}</span></td>
<td style="padding:7px;text-align:right;white-space:nowrap">
<button class="btn btn-secondary" style="padding:2px 8px;font-size:9px;margin-right:3px" onclick="event.stopPropagation()">🤖 AI润色</button>
<button class="btn btn-secondary" style="padding:2px 8px;font-size:9px;margin-right:3px" onclick="event.stopPropagation()">✏️ 打开编辑</button>
<button class="btn btn-ghost" style="padding:2px 8px;font-size:9px" onclick="event.stopPropagation()">🗑</button>
</td>
</tr>`).join("")}
</tbody>
</table>
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:9px;color:var(--text-muted)">
<span>共 24 份报告 · 每页 10 条</span>
<div style="display:flex;gap:4px">
<button style="padding:2px 8px;border:1px solid var(--border-subtle);border-radius:4px;background:var(--bg-surface)">‹</button>
<button style="padding:2px 8px;border:none;background:var(--text-primary);color:var(--bg-surface);border-radius:4px">1</button>
<button style="padding:2px 8px;border:1px solid var(--border-subtle);border-radius:4px;background:var(--bg-surface)">2</button>
<button style="padding:2px 8px;border:1px solid var(--border-subtle);border-radius:4px;background:var(--bg-surface)">3</button>
<button style="padding:2px 8px;border:1px solid var(--border-subtle);border-radius:4px;background:var(--bg-surface)">›</button>
</div>
</div>
</div>
</div>`;

/* ===== 9. 设置：合并外观/AI/通知/工作流/数据表，无重复大标题 ===== */
PAGES.settings=`<div style="margin-bottom:16px"><p style="font-size:12px;color:var(--text-secondary);font-weight:500">外观 · AI 模型 · 通知与备份 · 工作流自动化 · 数据表结构</p></div>
<div class="sub-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border-subtle);padding-bottom:0">
<button class="sub-tab on" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid var(--brand);color:var(--brand);cursor:pointer;margin-bottom:-1px">外观</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">AI 模型</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">通知与备份</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">工作流</button>
<button class="sub-tab" style="padding:8px 16px;font-size:12px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">数据表</button>
</div>
<div class="two-col">
<div class="card" style="margin:0"><div class="card-header"><div class="card-title">外观设置</div></div>
<div class="setting-row"><div><div class="setting-label">主题模式</div><div class="setting-desc">浅色 / 深色 / 跟随系统</div></div><button class="btn btn-secondary">☀️ 浅色</button></div>
<div class="setting-row"><div><div class="setting-label">字体大小</div><div class="setting-desc">紧凑 / 标准 / 舒适</div></div><button class="btn btn-secondary">标准</button></div>
<div class="setting-row"><div><div class="setting-label">紧凑模式</div><div class="setting-desc">减小间距提升密度</div></div><div class="switch off"></div></div>
</div>
<div class="card" style="margin:0"><div class="card-header"><div class="card-title">AI 模型</div></div>
<div class="setting-row"><div><div class="setting-label">跟进话术生成</div><div class="setting-desc">基于客户画像自动生成</div></div><div class="switch"></div></div>
<div class="setting-row"><div><div class="setting-label">商机赢率预测</div><div class="setting-desc">本地 ML 模型计算</div></div><div class="switch"></div></div>
</div>
</div>
<div class="card" style="margin:0"><div class="card-header"><div class="card-title">通知与备份</div></div>
<div class="setting-row"><div><div class="setting-label">逾期回款提醒</div><div class="setting-desc">每日 9:00 推送</div></div><div class="switch"></div></div>
<div class="setting-row"><div><div class="setting-label">自动备份</div><div class="setting-desc">每日备份到本地 IndexedDB</div></div><div class="switch"></div></div>
</div>`;

const nav=document.getElementById('nav');
MENU.forEach((m,i)=>{
const btn=document.createElement('button');
btn.className='nav-item'+(i===0?' active':'');btn.dataset.page=m.id;
btn.innerHTML='<span class="nav-icon">'+m.icon+'</span><span>'+m.name+'</span>';
btn.onclick=()=>showPage(m.id,m.name);
nav.appendChild(btn);
});
// 任务历史折叠项（类似 WorkBuddy 任务(9)）
const thBtn=document.createElement('button');
thBtn.className='nav-item';
thBtn.innerHTML='<span class="nav-icon">📋</span><span>任务历史 (8)</span><span style="margin-left:auto;font-size:10px;color:var(--text-muted)">›</span>';
thBtn.onclick=()=>{
const panel=document.getElementById('taskHistoryPanel');
panel.style.display=panel.style.display==='none'?'block':'none';
};
nav.appendChild(thBtn);
const thPanel=document.createElement('div');
thPanel.id='taskHistoryPanel';
thPanel.style.display='none';
thPanel.style.padding='4px 0';
thPanel.innerHTML=`
${[
['📝','帮我做一份「持合体检」单页','17天前'],
['💼','代码侧已无可做项，唯一的突破是...','17天前'],
['👥','了解公益专家任务完成方式','24天前'],
['🔍','查找并安装 ponytail 插件','50天前'],
['📄','编辑 Obsidian skill','55天前'],
['🎨','画布/简历优化','56天前'],
['📊','查看项目对话生成存储位置','68天前'],
['⚡','继续设计相关技能','68天前']
].map(t=>`<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;cursor:pointer;position:relative;group-hover:background:var(--bg-app)" onmouseover="this.style.background='var(--bg-app)'" onmouseout="this.style.background='transparent'">
<span style="font-size:12px">${t[0]}</span>
<span style="flex:1;font-size:11px;font-weight:600;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t[1]}</span>
<span style="font-size:9px;color:var(--text-muted);font-family:ui-monospace,monospace;flex-shrink:0">${t[2]}</span>
<span style="opacity:0;flex-shrink:0;font-size:10px;cursor:pointer" onmouseover="this.parentElement.style.background='var(--bg-app)'" title="更多">⋯</span>
</div>`).join('')}
`;
nav.appendChild(thPanel);
function showPage(id,title){
document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.page===id));
document.getElementById('tbTitle').textContent=title;
document.getElementById('content').innerHTML='<div class="page active">'+(PAGES[id]||'<div class="card" style="padding:48px;text-align:center;color:var(--text-muted)">建设中…</div>')+'</div>';
}
showPage('agent','AI助手');
import io
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\ui-design-runs\深度提炼媒电通工作台AP-20260925-105929-4c9f\console\data.js"
s = io.open(p, encoding="utf-8").read()

# 1. 更新 MENU：加 agent 首页，home 改名 dashboard
old_menu = """const MENU=[
{id:'home',icon:'🏠',name:'首页'},
{id:'crm',icon:'👥',name:'客户与商机'},"""
new_menu = """const MENU=[
{id:'agent',icon:'🤖',name:'AI助手'},
{id:'dashboard',icon:'📊',name:'工作台'},
{id:'crm',icon:'👥',name:'客户与商机'},"""
s = s.replace(old_menu, new_menu)

# 2. 新增 PAGES.agent（在 PAGES.home 之前插入）
agent_page = '''/* ===== 0. AI 助手：居中对话式首页 ===== */
PAGES.agent=`<div style="min-height:calc(100vh-120px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px">
<div style="font-size:42px;font-weight:900;color:var(--text-primary);letter-spacing:-1px;margin-bottom:8px">媒电通，我帮你</div>
<p style="font-size:13px;color:var(--text-secondary);margin-bottom:28px">本地优先 · AI 驱动 · 你的随身商务参谋</p>

<!-- 场景胶囊 -->
<div style="display:flex;gap:8px;margin-bottom:24px">
<button style="padding:8px 18px;border-radius:99px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:12px;font-weight:700;color:var(--text-primary);cursor:pointer;box-shadow:var(--shadow-card)">💼 日常办公</button>
<button style="padding:8px 18px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:12px;font-weight:700;color:var(--text-secondary);cursor:pointer">👥 客户跟进</button>
<button style="padding:8px 18px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:12px;font-weight:700;color:var(--text-secondary);cursor:pointer">🌐 媒介排期</button>
<button style="padding:8px 18px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:12px;font-weight:700;color:var(--text-secondary);cursor:pointer">📈 数据分析</button>
</div>

<!-- 快捷工具胶囊 -->
<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:32px;max-width:680px">
<button style="padding:8px 16px;border-radius:12px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px">📄 文档处理</button>
<button style="padding:8px 16px;border-radius:12px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px">💰 金融服务</button>
<button style="padding:8px 16px;border-radius:12px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px">📊 数据可视化</button>
<button style="padding:8px 16px;border-radius:12px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px">🗂️ 个人工作台</button>
<button style="padding:8px 16px;border-radius:12px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px">🎯 客户画像</button>
<button style="padding:8px 16px;border-radius:12px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px">🔍 深度研究 ›</button>
</div>

<!-- 居中输入框 -->
<div style="width:100%;max-width:680px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:24px;box-shadow:var(--shadow-card);padding:20px">
<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">今天帮你做些什么？ <span style="color:var(--text-secondary)">@引用客户</span> · <span style="color:var(--text-secondary)">/调用技能</span></div>
<div style="display:flex;align-items:center;gap:10px">
<button style="width:32px;height:32px;border-radius:10px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:14px;cursor:pointer">+</button>
<button style="width:32px;height:32px;border-radius:10px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:14px;cursor:pointer">🎨</button>
<div style="flex:1"></div>
<button style="padding:4px 10px;border-radius:8px;border:1px solid var(--border-subtle);background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">Hy3 ▾</button>
<button style="width:32px;height:32px;border-radius:10px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:14px;cursor:pointer">🎤</button>
<button style="width:36px;height:36px;border-radius:12px;background:var(--brand-primary);color:#fff;border:none;font-size:16px;cursor:pointer">↑</button>
</div>
<div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border-subtle);font-size:10px;color:var(--text-muted)">
<span style="cursor:pointer">📁 选择工作空间 ▾</span>
<span style="cursor:pointer;color:var(--warning)">⚠️ 允许完全访问 ▾</span>
</div>
</div>

<!-- 最近任务 -->
<div style="margin-top:36px;width:100%;max-width:680px">
<div style="font-size:10px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">最近任务</div>
<div style="display:flex;flex-direction:column;gap:6px">
<div style="padding:10px 14px;border-radius:12px;background:var(--bg-surface);border:1px solid var(--border-subtle);font-size:11px;color:var(--text-secondary);cursor:pointer">📝 生成悦己美妆 618 提案 v3 · 2小时前</div>
<div style="padding:10px 14px;border-radius:12px;background:var(--bg-surface);border:1px solid var(--border-subtle);font-size:11px;color:var(--text-secondary);cursor:pointer">💰 星海互动催款话术 SOP · 昨天</div>
<div style="padding:10px 14px;border-radius:12px;background:var(--bg-surface);border:1px solid var(--border-subtle);font-size:11px;color:var(--text-secondary);cursor:pointer">📊 Q3 媒介投放 ROI 分析 · 3天前</div>
</div>
</div>
</div>`;

'''
s = s.replace("/* ===== 1. 首页：仪表盘式 ===== */", agent_page + "/* ===== 1. 工作台：仪表盘式 ===== */")

# 3. PAGES.home 改名为 PAGES.dashboard
s = s.replace("PAGES.home=`", "PAGES.dashboard=`")

io.open(p, "w", encoding="utf-8").write(s)
print("ok")

import io
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\ui-design-runs\深度提炼媒电通工作台AP-20260925-105929-4c9f\console\data.js"
s = io.open(p, encoding="utf-8").read()

start = s.index("PAGES.agent=")
end = s.index("/* ===== 1. 工作台")

new_agent = '''PAGES.agent=`<div style="min-height:calc(100vh-120px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;position:relative">

<!-- 顶部工具条：任务历史折叠按钮 -->
<div style="position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:0 0 16px 0">
<button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'" style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:800;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:var(--shadow-card)">📋 任务历史 (8) ▾</button>
<div style="display:flex;gap:8px">
<button style="padding:6px 14px;border-radius:10px;border:none;background:var(--brand-primary);color:#fff;font-size:11px;font-weight:800;cursor:pointer">+ 新建任务</button>
</div>
</div>

<!-- 折叠的任务历史抽屉（默认隐藏，点击按钮展开） -->
<div style="display:none;position:absolute;top:44px;left:0;width:280px;max-height:calc(100vh-200px);overflow-y:auto;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--r-lg);box-shadow:var(--shadow-card);padding:14px;z-index:10">
<div style="font-size:10px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">今天</div>
${[
["📝 生成悦己美妆 618 提案","10:32"],
["💰 星海互动催款话术","09:15"]
].map(t=>`<div style="padding:9px 12px;border-radius:10px;background:var(--bg-app);margin-bottom:6px;cursor:pointer;font-size:11px;font-weight:700;color:var(--text-primary)">
<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t[0]}</div>
<div style="font-size:9px;color:var(--text-muted);margin-top:2px;font-family:ui-monospace,monospace">${t[1]}</div>
</div>`).join("")}
<div style="font-size:10px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:12px 0 8px">昨天</div>
${[
["📊 Q3 媒介投放 ROI 分析","昨天 18:20"],
["📄 双11达人排期甘特图","昨天 15:44"],
["👥 悦己美妆客户画像更新","昨天 11:02"]
].map(t=>`<div style="padding:9px 12px;border-radius:10px;margin-bottom:6px;cursor:pointer;font-size:11px;font-weight:700;color:var(--text-secondary)">
<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t[0]}</div>
<div style="font-size:9px;color:var(--text-muted);margin-top:2px;font-family:ui-monospace,monospace">${t[1]}</div>
</div>`).join("")}
<div style="font-size:10px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:12px 0 8px">本周</div>
${[
["📈 9月销售周报生成","周三"],
["🎯 蓝湾文旅报价方案","周二"],
["🔍 竞品 618 活动调研","周一"]
].map(t=>`<div style="padding:9px 12px;border-radius:10px;margin-bottom:6px;cursor:pointer;font-size:11px;font-weight:700;color:var(--text-secondary)">
<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t[0]}</div>
<div style="font-size:9px;color:var(--text-muted);margin-top:2px;font-family:ui-monospace,monospace">${t[1]}</div>
</div>`).join("")}
</div>

<!-- 居中对话区 -->
<div style="text-align:center;margin-top:40px">
<div style="font-size:38px;font-weight:900;color:var(--text-primary);letter-spacing:-1px;margin-bottom:6px">媒电通，我帮你</div>
<p style="font-size:12px;color:var(--text-secondary);margin-bottom:24px">本地优先 · AI 驱动 · 你的随身商务参谋</p>

<div style="display:flex;gap:8px;justify-content:center;margin-bottom:20px">
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:11px;font-weight:700;color:var(--text-primary);cursor:pointer;box-shadow:var(--shadow-card)">💼 日常办公</button>
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">👥 客户跟进</button>
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">🌐 媒介排期</button>
<button style="padding:7px 16px;border-radius:99px;border:1px solid var(--border-subtle);background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">📈 数据分析</button>
</div>

<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:28px;max-width:600px">
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">📄 文档处理</button>
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">💰 金融服务</button>
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">📊 数据可视化</button>
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">🗂️ 个人工作台</button>
<button style="padding:6px 14px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-surface);font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">🎯 客户画像</button>
</div>

<div style="width:100%;max-width:620px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:20px;box-shadow:var(--shadow-card);padding:18px;margin:0 auto;text-align:left">
<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px">今天帮你做些什么？</div>
<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
<button style="width:28px;height:28px;border-radius:8px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:12px;cursor:pointer">+</button>
<button style="width:28px;height:28px;border-radius:8px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:12px;cursor:pointer">🎨</button>
<div style="flex:1"></div>
<button style="padding:3px 8px;border-radius:6px;border:1px solid var(--border-subtle);background:transparent;font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer">Hy3 ▾</button>
<button style="width:28px;height:28px;border-radius:8px;border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:12px;cursor:pointer">🎤</button>
<button style="width:32px;height:28px;border-radius:8px;background:var(--brand-primary);color:#fff;border:none;font-size:14px;cursor:pointer">↑</button>
</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border-subtle)">
<span style="font-size:9px;color:var(--brand);font-weight:700;background:var(--brand-subtle);padding:2px 8px;border-radius:6px;cursor:pointer">@客户</span>
<span style="font-size:9px;color:var(--text-secondary);font-weight:700;background:var(--bg-app);padding:2px 8px;border-radius:6px;cursor:pointer">/商机</span>
<span style="font-size:9px;color:var(--text-secondary);font-weight:700;background:var(--bg-app);padding:2px 8px;border-radius:6px;cursor:pointer">/报告</span>
<span style="font-size:9px;color:var(--text-secondary);font-weight:700;background:var(--bg-app);padding:2px 8px;border-radius:6px;cursor:pointer">/合同</span>
<span style="font-size:9px;color:var(--text-secondary);font-weight:700;background:var(--bg-app);padding:2px 8px;border-radius:6px;cursor:pointer">/排期</span>
<span style="font-size:9px;color:var(--text-secondary);font-weight:700;background:var(--bg-app);padding:2px 8px;border-radius:6px;cursor:pointer">/催款</span>
</div>
<div style="display:flex;gap:16px;margin-top:10px;font-size:9px;color:var(--text-muted)">
<span style="cursor:pointer">📁 选择工作空间 ▾</span>
<span style="cursor:pointer;color:var(--warning)">⚠️ 允许完全访问 ▾</span>
</div>
</div>
</div>
</div>`;

'''
s = s[:start] + new_agent + s[end:]
io.open(p, "w", encoding="utf-8").write(s)
print("ok")

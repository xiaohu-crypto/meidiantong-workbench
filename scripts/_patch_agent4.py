import io
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\ui-design-runs\深度提炼媒电通工作台AP-20260925-105929-4c9f\console\data.js"
s = io.open(p, encoding="utf-8").read()

# 1. 侧边栏：在 growth 后加 taskHistory 折叠项（但它不是页面，是折叠面板）
# 改 nav 渲染逻辑：在 MENU 后面加一个特殊项
old_nav_end = """const nav=document.getElementById('nav');
MENU.forEach((m,i)=>{
const btn=document.createElement('button');
btn.className='nav-item'+(i===0?' active':'');
btn.innerHTML='<span class="nav-icon">'+m.icon+'</span><span>'+m.name+'</span>';
btn.onclick=()=>showPage(m.id,m.name);
nav.appendChild(btn);
});"""

new_nav_end = """const nav=document.getElementById('nav');
MENU.forEach((m,i)=>{
const btn=document.createElement('button');
btn.className='nav-item'+(i===0?' active':'');
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
thPanel.style.padding='4px 0 4px 20px';
thPanel.innerHTML=`
<div style="font-size:9px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;padding:6px 0 4px">今天</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-primary);border-radius:8px;cursor:pointer;background:var(--brand-subtle)">📝 悦己618提案</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-secondary);border-radius:8px;cursor:pointer">💰 星海催款话术</div>
<div style="font-size:9px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px">昨天</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-secondary);border-radius:8px;cursor:pointer">📊 Q3 ROI分析</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-secondary);border-radius:8px;cursor:pointer">📄 双11排期图</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-secondary);border-radius:8px;cursor:pointer">👥 客户画像更新</div>
<div style="font-size:9px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px">本周</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-secondary);border-radius:8px;cursor:pointer">📈 9月周报</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-secondary);border-radius:8px;cursor:pointer">🎯 蓝湾报价方案</div>
<div style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-secondary);border-radius:8px;cursor:pointer">🔍 竞品调研</div>
`;
nav.appendChild(thPanel);"""

s = s.replace(old_nav_end, new_nav_end)

# 2. AI助手页：重写，去掉左上角历史按钮，加绿色场景标签 + 底部最佳案例
start = s.index("PAGES.agent=")
end = s.index("/* ===== 1. 工作台")

new_agent = '''PAGES.agent=`<div style="min-height:calc(100vh-120px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 40px 20px">
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

'''
s = s[:start] + new_agent + s[end:]
io.open(p, "w", encoding="utf-8").write(s)
print("ok")

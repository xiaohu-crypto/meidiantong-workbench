import io
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\ui-design-runs\深度提炼媒电通工作台AP-20260925-105929-4c9f\console\data.js"
s = io.open(p, encoding="utf-8").read()

# 1. 删除 MENU 里的 settings 项
s = s.replace("{id:'settings',icon:'⚙️',name:'设置'},\n", "")

# 2. 替换 taskHistoryPanel 的内容为 WorkBuddy 风格任务列表
old_panel = """const thPanel=document.createElement('div');
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

new_panel = """const thPanel=document.createElement('div');
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
nav.appendChild(thPanel);"""

s = s.replace(old_panel, new_panel)

io.open(p, "w", encoding="utf-8").write(s)
print("ok")

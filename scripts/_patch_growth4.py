import io
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\ui-design-runs\深度提炼媒电通工作台AP-20260925-105929-4c9f\console\data.js"
s = io.open(p, encoding="utf-8").read()
start = s.index("/* ===== 8. 团队协同")
end = s.index("/* ===== 9. 设置")
new = r'''/* ===== 8. 团队协同：AI建议展开 + 报告富文本Modal + 子任务拖拽 + 高密度筛选 ===== */
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

'''
s = s[:start] + new + s[end:]
io.open(p, "w", encoding="utf-8").write(s)
print("ok")

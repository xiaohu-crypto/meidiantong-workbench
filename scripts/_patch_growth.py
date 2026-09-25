import io
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\ui-design-runs\深度提炼媒电通工作台AP-20260925-105929-4c9f\console\data.js"
s = io.open(p, encoding="utf-8").read()
start = s.index("/* ===== 8. 成长规划")
end = s.index("/* ===== 9. 设置")
new = '''/* ===== 8. 团队与协同：会议日历 + 协作动态 + 知识沉淀 ===== */
PAGES.growth=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:16px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">9月25日 周五 · 今日 3 场会议 · 团队 4 人在线 · 本周新增文档 6 篇</p></div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary">📅 完整日历</button>
<button class="btn btn-primary">+ 发起会议</button>
</div>
</div>
<div class="card" style="margin:0;margin-bottom:14px">
<div class="card-header"><div class="card-title">今日会议日程</div><div class="card-extra">3 场 · 总时长 2.5h</div></div>
<div style="padding:0 24px 16px;position:relative">
<div style="position:absolute;left:80px;top:8px;bottom:16px;width:2px;background:var(--border-subtle)"></div>
${[
["09:30","10:00","晨会 · 昨日复盘与今日计划","小张、李姐、王哥、赵助理","会议室 A","已结束","success"],
["14:00","15:00","星海互动催款专题会","小张、李姐、财务王姐","飞书会议","即将开始","pending"],
["16:30","17:00","双11媒介策略脑暴","全员 + 外部顾问","会议室 B","待开始","pending"]
].map(m=>`<div style="display:flex;gap:16px;padding:12px 0;position:relative">
<div style="width:60px;text-align:right;font-size:10px;font-weight:900;font-family:ui-monospace,monospace;color:var(--text-muted);line-height:1.6">${m[0]}<br>${m[1]}</div>
<div style="width:12px;height:12px;border-radius:50%;background:var(--${m[6]==="success"?"success":"brand"});margin-top:4px;margin-left:24px;flex-shrink:0;z-index:1;box-shadow:0 0 0 3px var(--bg-surface)"></div>
<div style="flex:1;padding:12px 16px;background:var(--bg-app);border-radius:var(--r-md)">
<div style="display:flex;justify-content:space-between;align-items:start">
<div><div style="font-size:12px;font-weight:900;color:var(--text-primary)">${m[2]}</div>
<div style="font-size:10px;color:var(--text-secondary);margin-top:4px">👥 ${m[3]} · 📍 ${m[4]}</div></div>
<span class="status-pill status-${m[6]}">${m[5]}</span>
</div>
</div>
</div>`).join("")}
</div>
</div>
<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px">
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">团队协作动态</div><div class="card-extra">实时 Feed</div></div>
<div style="padding:4 20px">
${[
["张","#FF5A36","小张","完成了","悦己美妆 618 提案 v3","并 @李姐 审核","10 分钟前"],
["李","#10B981","李姐","更新了","星海互动 催款话术 SOP","→ 已发布到知识库","25 分钟前"],
["王","#F59E0B","王哥","新建了","双11 媒介排期甘特图","邀请 3 人协作","1 小时前"],
["赵","#3B82F6","赵助理","上传了","9月 客户拜访纪要.pdf","共 12 页","2 小时前"],
["张","#FF5A36","小张","评论了","华宇控股 报价方案","第3页成本明细需复核","3 小时前"],
["李","#10B981","李姐","完成了","本周周报","已提交给老板","昨天 18:30"]
].map(f=>`<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-subtle)">
<div style="width:32px;height:32px;border-radius:10px;background:${f[1]};color:#fff;display:grid;place-items:center;font-size:12px;font-weight:900;flex-shrink:0">${f[0]}</div>
<div style="flex:1">
<div style="font-size:11px;line-height:1.6">
<b style="color:var(--text-primary)">${f[2]}</b> <span style="color:var(--text-secondary)">${f[3]}</span>
<b style="color:var(--brand)"> ${f[4]}</b>
<span style="color:var(--text-secondary)"> ${f[5]}</span>
</div>
<div style="font-size:9px;color:var(--text-muted);margin-top:4px;font-family:ui-monospace,monospace">${f[6]}</div>
</div>
</div>`).join("")}
</div>
</div>
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">专业知识沉淀</div><div class="card-extra">本周 +6</div></div>
<div style="padding:8px 20px">
<div style="font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:8px 0 6px">📚 本周新增文档</div>
${["达人采买议价 7 步法","逾期回款话术 SOP v2","双11美妆行业洞察报告","媒介投放 ROI 计算公式"].map((d,i)=>`<div style="padding:8px 0;border-bottom:1px solid var(--border-subtle);font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">
📄 ${d} <span style="float:right;font-size:9px;color:var(--text-muted);font-weight:500">${["小张","李姐","王哥","李姐"][i]}</span>
</div>`).join("")}
<div style="font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">🎓 学习进度</div>
${[["Google 数据分析课程",65,"var(--brand)"],["微信广告投放认证",30,"var(--warning)"],["PMP 项目管理",15,"var(--text-muted)"]].map(c=>`<div style="margin-bottom:10px">
<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span style="font-weight:700">${c[0]}</span><span style="font-family:ui-monospace,monospace;font-weight:900">${c[1]}%</span></div>
<div style="height:5px;background:var(--bg-app);border-radius:99px"><div style="width:${c[1]}%;height:100%;background:${c[2]};border-radius:99px"></div></div>
</div>`).join("")}
</div>
</div>
</div>
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">本周 OKR 进度</div><div class="card-extra">W39 · 9/22-9/28</div></div>
<div style="padding:4 24px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
${[["O1: 本季营收 ¥2.8M",72,"¥2.02M / ¥2.8M","var(--success)"],["O2: 回款率 ≥ 85%",78.3,"78.3% / 85%","var(--warning)"],["O3: 新增 A 类客户 3 个",66,"2 / 3","var(--brand)"]].map(o=>`<div>
<div style="font-size:11px;font-weight:900;color:var(--text-primary);margin-bottom:6px">${o[0]}</div>
<div style="height:8px;background:var(--bg-app);border-radius:99px;overflow:hidden"><div style="width:${o[1]}%;height:100%;background:${o[3]};border-radius:99px"></div></div>
<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:4px"><span style="font-family:ui-monospace,monospace;font-weight:900">${o[1]}%</span><span style="color:var(--text-muted);font-family:ui-monospace,monospace">${o[2]}</span></div>
</div>`).join("")}
</div>
</div>`;

'''
s = s[:start] + new + s[end:]
io.open(p, "w", encoding="utf-8").write(s)
print("ok")

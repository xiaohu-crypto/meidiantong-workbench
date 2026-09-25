var PAGES={};
PAGES.growth=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:14px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">9月25日 周五 · 今日 3 场会议 · 2 份待写纪要 · AI 已生成 3 份草稿</p></div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary">📅 完整日历</button>
<button class="btn btn-primary">+ 发起会议</button>
</div>
</div>

<!-- AI 建议条 -->
<div style="background:linear-gradient(90deg,var(--brand-subtle),transparent);border:1px solid var(--brand-subtle);border-left:3px solid var(--brand);border-radius:var(--r-md);padding:12px 16px;margin-bottom:14px;display:flex;gap:12px;align-items:center">
<div style="font-size:18px">🤖</div>
<div style="flex:1;font-size:11px;color:var(--text-secondary);line-height:1.5">
<b style="color:var(--brand)">AI 建议：</b>
检测到星海互动 ¥180K 已逾期 12 天，建议今日晨会优先讨论催收方案；王哥周报已 2 天未更新，建议提醒；双11媒介排期还差 2 个达人未锁定。
</div>
<button class="btn btn-secondary" style="padding:4px 10px;font-size:10px;flex-shrink:0">采纳全部</button>
</div>

<!-- 今日会议 + 纪要 -->
<div class="card" style="margin:0;margin-bottom:14px">
<div class="card-header"><div class="card-title">今日会议日程与纪要</div><div class="card-extra">3 场 · 2 份待补纪要</div></div>

<!-- 已结束的晨会：展开态纪要 -->
<div style="margin:0 24px 12px;border:1px solid var(--border-subtle);border-radius:var(--r-lg);overflow:hidden">
<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-app)">
<span style="font-size:10px;font-weight:900;font-family:ui-monospace,monospace;color:var(--text-muted);width:90px">09:30-10:00</span>
<div style="flex:1"><div style="font-size:12px;font-weight:900">晨会 · 昨日复盘与今日计划</div>
<div style="font-size:10px;color:var(--text-secondary)">👥 小张、李姐、王哥 · 会议室 A</div></div>
<span class="status-pill status-success">已结束</span>
<button class="btn btn-secondary" style="padding:4px 10px;font-size:10px">📝 编辑</button>
<button class="btn btn-ghost" style="padding:4px 10px;font-size:10px">🗑 删除</button>
</div>
<div style="padding:16px;border-top:1px solid var(--border-subtle);background:var(--bg-surface)">
<div style="font-size:10px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📌 会议决议</div>
<div style="font-size:11px;line-height:1.8;color:var(--text-secondary);margin-bottom:12px">
1. 星海互动 ¥180K 今日必须电话催收，李姐负责<br>
2. 双11达人矩阵还差2个头部达人未锁定，王哥本周内完成<br>
3. 悦己美妆618提案v3今日14:00前发客户
</div>
<div style="font-size:10px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">✅ 待办事项</div>
${[
["星海互动电话催收","李姐","今日 18:00 前","danger"],
["锁定2个头部达人","王哥","本周五前","pending"],
["发送悦己提案v3","小张","今日 14:00","success"]
].map(t=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:11px">
<input type="checkbox" style="accent-color:var(--brand)">
<span style="flex:1;color:var(--text-primary);font-weight:700">${t[0]}</span>
<span style="color:var(--text-secondary);font-size:10px">👤 ${t[1]}</span>
<span style="color:var(--text-muted);font-size:10px;font-family:ui-monospace,monospace">${t[2]}</span>
<span class="status-pill status-${t[3]}">${t[3]==='danger'?'紧急':t[3]==='pending'?'进行中':'已完成'}</span>
</div>`).join("")}
<div style="margin-top:10px;display:flex;gap:8px">
<button class="btn btn-secondary" style="padding:4px 10px;font-size:10px">🤖 AI 整理纪要</button>
<button class="btn btn-primary" style="padding:4px 10px;font-size:10px">保存纪要</button>
</div>
</div>
</div>

<!-- 即将开始的会议 -->
${[
["14:00-15:00","星海互动催款专题会","小张、李姐、王姐","飞书会议","即将开始","pending","📝 会后AI自动生成"],
["16:30-17:00","双11媒介策略脑暴","全员+外部顾问","会议室 B","待开始","pending","📝 待参会"]
].map(m=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 24px;border-bottom:1px solid var(--border-subtle)">
<span style="font-size:10px;font-weight:900;font-family:ui-monospace,monospace;color:var(--text-muted);width:90px">${m[0]}</span>
<div style="flex:1"><div style="font-size:12px;font-weight:900">${m[1]}</div>
<div style="font-size:10px;color:var(--text-secondary)">👥 ${m[2]} · 📍 ${m[3]}</div></div>
<span class="status-pill status-${m[5]}">${m[4]}</span>
<span style="font-size:10px;color:var(--text-muted);font-weight:700;width:130px">${m[6]}</span>
<button class="btn btn-secondary" style="padding:4px 10px;font-size:10px">纪要模板</button>
</div>`).join("")}
</div>

<!-- 项目目标 + 协作动态 -->
<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:14px;margin-bottom:14px">
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">项目目标协同 · Q3 总目标</div><div class="card-extra"><button class="btn btn-secondary" style="padding:3px 8px;font-size:9px">🤖 AI 拆解建议</button></div></div>
<div style="padding:0 20px 16px">
<div style="padding:12px 14px;background:var(--brand-subtle);border-radius:var(--r-md);margin:0 0 12px">
<div style="font-size:10px;font-weight:900;color:var(--brand);text-transform:uppercase;letter-spacing:1px">🎯 本季北极星目标</div>
<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-top:4px">Q3 营收 ¥2.8M · 回款率 ≥85% · 新增 A 类客户 3 个</div>
</div>
${[
["双11美妆战役",72,"var(--success)","小张负责",[["达人矩阵30篇","80%","已发布24篇"],["信息流投放","60%","素材审核中"],["预算分配确认","100%","已锁定"]]],
["星海互动催收专项",33,"var(--danger)","李姐负责 · 延期",[["电话催收","20%","未打通"],["发送律师函","50%","已起草"],["财务对账","100%","已完成"]]],
["达人矩阵渠道拓展",66,"var(--brand)","王哥负责",[["新增3个头部达人","66%","已签2个"],["刊例价更新","90%","待审核"],["合同归档","40%","进行中"]]]
].map(p=>`<div style="border:1px solid var(--border-subtle);border-radius:var(--r-md);margin-bottom:8px;overflow:hidden">
<div style="padding:10px 12px;background:var(--bg-app);display:flex;align-items:center;gap:8px;cursor:pointer">
<span style="font-size:10px;color:var(--text-muted)">▼</span>
<div style="flex:1"><div style="font-size:11px;font-weight:900;color:var(--text-primary)">${p[0]} <span style="font-size:9px;color:var(--text-muted);font-weight:600;margin-left:4px">${p[4]}</span></div></div>
<span style="font-size:11px;font-weight:900;font-family:ui-monospace,monospace">${p[1]}%</span>
<button class="btn btn-ghost" style="padding:2px 8px;font-size:9px">✏️</button>
</div>
<div style="height:4px;background:var(--bg-app)"><div style="width:${p[1]}%;height:100%;background:${p[2]}"></div></div>
<div style="padding:8px 12px">
${p[4].map(sub=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:10px">
<span style="width:10px;height:10px;border-radius:2px;border:1px solid var(--border-subtle)"></span>
<span style="flex:1;color:var(--text-secondary)">${sub[0]}</span>
<span style="color:var(--text-muted);font-family:ui-monospace,monospace;width:50px">${sub[1]}</span>
<span style="color:var(--text-muted);font-size:9px;width:80px">${sub[2]}</span>
</div>`).join("")}
</div>
</div>`).join("")}
</div>
</div>

<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">团队协作动态</div><div class="card-extra">实时 Feed</div></div>
<div style="padding:4 20px;max-height:380px;overflow-y:auto">
${[
["张","#FF5A36","小张","完成了","悦己美妆 618 提案 v3","并 @李姐 审核","10 分钟前"],
["李","#10B981","李姐","更新了","星海互动 催款话术 SOP","→ 已发布到知识库","25 分钟前"],
["王","#F59E0B","王哥","新建了","双11 媒介排期甘特图","邀请 3 人协作","1 小时前"],
["赵","#3B82F6","赵助理","上传了","9月 客户拜访纪要.pdf","共 12 页","2 小时前"],
["张","#FF5A36","小张","评论了","华宇控股 报价方案","第3页成本明细需复核","3 小时前"],
["李","#10B981","李姐","完成了","本周周报","已提交","昨天 18:30"]
].map(f=>`<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-subtle)">
<div style="width:28px;height:28px;border-radius:8px;background:${f[1]};color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900;flex-shrink:0">${f[0]}</div>
<div style="flex:1">
<div style="font-size:10px;line-height:1.5">
<b style="color:var(--text-primary)">${f[2]}</b> <span style="color:var(--text-secondary)">${f[3]}</span>
<b style="color:var(--brand)"> ${f[4]}</b>
<span style="color:var(--text-secondary)"> ${f[5]}</span>
</div>
<div style="font-size:9px;color:var(--text-muted);margin-top:3px;font-family:ui-monospace,monospace">${f[6]}</div>
</div>
</div>`).join("")}
</div>
</div>
</div>

<!-- 报告中心 -->
<div class="card" style="margin:0">
<div class="card-header">
<div class="card-title">报告中心</div>
<div class="card-extra"><button class="btn btn-secondary" style="padding:4px 10px;font-size:10px">🤖 AI 一键生成草稿</button></div>
</div>
<div style="padding:0 24px 16px">
<div style="display:flex;gap:4px;margin-bottom:14px;border-bottom:1px solid var(--border-subtle);padding-bottom:0">
<button class="sub-tab on" style="padding:8px 14px;font-size:11px;font-weight:800;border:none;background:transparent;border-bottom:2px solid var(--brand);color:var(--brand);cursor:pointer;margin-bottom:-1px">日报</button>
<button class="sub-tab" style="padding:8px 14px;font-size:11px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">周报</button>
<button class="sub-tab" style="padding:8px 14px;font-size:11px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">季报</button>
<button class="sub-tab" style="padding:8px 14px;font-size:11px;font-weight:800;border:none;background:transparent;border-bottom:2px solid transparent;color:var(--text-secondary);cursor:pointer;margin-bottom:-1px">年度报告</button>
</div>
<table style="width:100%;border-collapse:collapse">
<thead><tr style="border-bottom:1px solid var(--border-subtle)">
<th style="text-align:left;padding:8px;font-size:10px;color:var(--text-muted);font-weight:800">报告标题</th>
<th style="text-align:left;padding:8px;font-size:10px;color:var(--text-muted);font-weight:800">负责人</th>
<th style="text-align:left;padding:8px;font-size:10px;color:var(--text-muted);font-weight:800">周期</th>
<th style="text-align:left;padding:8px;font-size:10px;color:var(--text-muted);font-weight:800">状态</th>
<th style="text-align:right;padding:8px;font-size:10px;color:var(--text-muted);font-weight:800">操作</th>
</tr></thead>
<tbody>
${[
["小张 · 9月25日工作日报","小张","9/25 今天","AI草稿待编辑","pending"],
["李姐 · 9月25日工作日报","李姐","9/25 今天","已提交 ✓","success"],
["王哥 · 第39周周报","王哥","9/22-9/28","AI已生成 · 待修改","pending"],
["Q3 季度营收复盘报告","小张","2026 Q3","待撰写","pending"],
["2026 年度战略复盘","老板","2026 全年","归档 · 12/31",""]
].map(r=>`<tr style="border-bottom:1px solid var(--border-subtle)">
<td style="padding:10px;font-size:11px;font-weight:800;color:var(--text-primary)">${r[0]}</td>
<td style="padding:10px;font-size:11px;color:var(--text-secondary)">${r[1]}</td>
<td style="padding:10px;font-size:10px;font-family:ui-monospace,monospace;color:var(--text-muted)">${r[2]}</td>
<td style="padding:10px"><span class="status-pill status-${r[4]}">${r[3]}</span></td>
<td style="padding:10px;text-align:right;white-space:nowrap">
<button class="btn btn-secondary" style="padding:3px 8px;font-size:9px;margin-right:4px">🤖 AI润色</button>
<button class="btn btn-secondary" style="padding:3px 8px;font-size:9px;margin-right:4px">✏️ 编辑</button>
<button class="btn btn-ghost" style="padding:3px 8px;font-size:9px">🗑</button>
</td>
</tr>`).join("")}
</tbody>
</table>
</div>
</div>`;

/* ===== 9. 设置：合并外观/AI/通知/工作流/数据表，无重复大标题 ===== */

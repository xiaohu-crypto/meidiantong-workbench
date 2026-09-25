import io
p = r"D:\HaLeMa\Documents\媒电通工作台\code\meidiantong-workbench\ui-design-runs\深度提炼媒电通工作台AP-20260925-105929-4c9f\console\data.js"
s = io.open(p, encoding="utf-8").read()
start = s.index("/* ===== 8. 团队与协同")
end = s.index("/* ===== 9. 设置")
new = '''/* ===== 8. 团队协同：会议纪要 + 项目目标 + 报告中心 ===== */
PAGES.growth=`<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:16px">
<div><p style="font-size:12px;color:var(--text-secondary);font-weight:500">9月25日 周五 · 今日 3 场会议 · 2 份待写纪要 · 本周周报待提交</p></div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary">📅 完整日历</button>
<button class="btn btn-primary">+ 发起会议</button>
</div>
</div>

<!-- 今日会议 + 纪要状态 -->
<div class="card" style="margin:0;margin-bottom:14px">
<div class="card-header"><div class="card-title">今日会议日程与纪要</div><div class="card-extra">3 场 · 2 份待补纪要</div></div>
<div style="padding:0 24px 16px">
${[
["09:30-10:00","晨会 · 昨日复盘","小张、李姐、王哥","已结束",true,"success","会议纪要已完成 ✓"],
["14:00-15:00","星海互动催款专题会","小张、李姐、王姐","即将开始",false,"pending","📝 会后自动生成纪要"],
["16:30-17:00","双11媒介策略脑暴","全员+外部顾问","待开始",false,"pending","📝 待参会"]
].map(m=>`<div style="display:flex;gap:14px;padding:12px 0;border-bottom:1px solid var(--border-subtle);align-items:center">
<div style="width:110px;font-size:10px;font-weight:900;font-family:ui-monospace,monospace;color:var(--text-muted)">${m[0]}</div>
<div style="flex:1">
<div style="font-size:12px;font-weight:900;color:var(--text-primary)">${m[1]}</div>
<div style="font-size:10px;color:var(--text-secondary);margin-top:2px">👥 ${m[2]}</div>
</div>
<span class="status-pill status-${m[5]}">${m[3]}</span>
<span style="font-size:10px;color:${m[4]?"var(--success)":"var(--text-muted)"};font-weight:700;width:140px">${m[6]}</span>
<button class="btn btn-secondary" style="padding:4px 10px;font-size:10px">${m[4]?"查看/编辑纪要":"纪要模板"}</button>
</div>`).join("")}
</div>
</div>

<!-- 第二排：项目目标 OKR + 协作动态 -->
<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:14px;margin-bottom:14px">
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">项目目标协同 · Q3 总目标</div><div class="card-extra">对齐公司级</div></div>
<div style="padding:4 20px 16px">
<div style="padding:12px 14px;background:var(--brand-subtle);border-radius:var(--r-md);margin-bottom:12px">
<div style="font-size:10px;font-weight:900;color:var(--brand);text-transform:uppercase;letter-spacing:1px">🎯 本季北极星目标</div>
<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-top:4px">Q3 营收 ¥2.8M · 回款率 ≥85% · 新增 A 类客户 3 个</div>
</div>
${[
["双11美妆战役",72,"¥2.02M / ¥2.8M","var(--success)","小张负责"],
["星海互动催收专项",33,"¥60K / ¥180K","var(--danger)","李姐负责 · 延期"],
["达人矩阵渠道拓展",66,"2 / 3 个新达人","var(--brand)","王哥负责"],
["双11媒介排期落地",80,"8/10 渠道已锁定","var(--success)","全员协同"]
].map(p=>`<div style="padding:10px 0;border-bottom:1px solid var(--border-subtle)">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
<div style="font-size:11px;font-weight:900;color:var(--text-primary)">${p[0]} <span style="font-size:9px;color:var(--text-muted);font-weight:600;margin-left:6px">${p[4]}</span></div>
<span style="font-size:11px;font-weight:900;font-family:ui-monospace,monospace">${p[1]}%</span>
</div>
<div style="height:6px;background:var(--bg-app);border-radius:99px;overflow:hidden"><div style="width:${p[1]}%;height:100%;background:${p[3]};border-radius:99px"></div></div>
<div style="font-size:9px;color:var(--text-muted);margin-top:3px;font-family:ui-monospace,monospace">${p[2]}</div>
</div>`).join("")}
</div>
</div>
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">团队协作动态</div><div class="card-extra">实时 Feed</div></div>
<div style="padding:4 20px;max-height:340px;overflow-y:auto">
${[
["张","#FF5A36","小张","完成了","悦己美妆 618 提案 v3","并 @李姐 审核","10 分钟前"],
["李","#10B981","李姐","更新了","星海互动 催款话术 SOP","→ 已发布到知识库","25 分钟前"],
["王","#F59E0B","王哥","新建了","双11 媒介排期甘特图","邀请 3 人协作","1 小时前"],
["赵","#3B82F6","赵助理","上传了","9月 客户拜访纪要.pdf","共 12 页","2 小时前"],
["张","#FF5A36","小张","评论了","华宇控股 报价方案","第3页成本明细需复核","3 小时前"],
["李","#10B981","李姐","完成了","本周周报","已提交待写","昨天 18:30"]
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

<!-- 第三排：报告中心 日/周/季/年 -->
<div class="card" style="margin:0">
<div class="card-header"><div class="card-title">报告中心</div><div class="card-extra">全部可在线编辑 · 自动归档</div></div>
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
["小张 · 9月25日工作日报","小张","9/25 今天","草稿 · 待提交","pending"],
["李姐 · 9月25日工作日报","李姐","9/25 今天","已提交 ✓","success"],
["王哥 · 第39周周报","王哥","9/22-9/28","撰写中","pending"],
["Q3 季度营收复盘报告","小张","2026 Q3","待撰写","pending"],
["2026 年度战略复盘","老板","2026 全年","归档 · 12/31",""]
].map(r=>`<tr style="border-bottom:1px solid var(--border-subtle)">
<td style="padding:10px;font-size:11px;font-weight:800;color:var(--text-primary)">${r[0]}</td>
<td style="padding:10px;font-size:11px;color:var(--text-secondary)">${r[1]}</td>
<td style="padding:10px;font-size:10px;font-family:ui-monospace,monospace;color:var(--text-muted)">${r[2]}</td>
<td style="padding:10px"><span class="status-pill status-${r[4]}">${r[3]}</span></td>
<td style="padding:10px;text-align:right"><button class="btn btn-secondary" style="padding:4px 10px;font-size:10px">✏️ 编辑</button></td>
</tr>`).join("")}
</tbody>
</table>
</div>
</div>`;

'''
s = s[:start] + new + s[end:]
io.open(p, "w", encoding="utf-8").write(s)
print("ok")

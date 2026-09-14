"""打通原有页面数据链路：db直接写 → Repository（触发工作流），保留日志描述。"""
import io, re, sys

def read(p):
    with io.open(p, "r", encoding="utf-8-sig") as f:
        return f.read()

def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(s)

dev = read(r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\Dev.tsx")

def rep(s, old, new, tag):
    n = s.count(old)
    if n == 0:
        print(f"  {tag}: 未匹配")
        return s
    s = s.replace(old, new)
    print(f"  {tag}: 替换 {n} 处")
    return s

# Dev.tsx: 4处 deals 写点 → repos.deals
dev = rep(dev,
    'await db.put("deals", { ...d, stage, probability: probOf(stage) }, `商机「${d.title}」阶段改为 ${stage}`);',
    'await repos.deals.update(d.id, { stage, probability: probOf(stage) }, `商机「${d.title}」阶段改为 ${stage}`);',
    "Dev setStage")

dev = rep(dev,
    'void db.put("deals", { ...d, stage, probability: probOf(stage) }, `拖拽商机「${d.title}」到 ${stage}`);',
    'void repos.deals.update(d.id, { stage, probability: probOf(stage) }, `拖拽商机「${d.title}」到 ${stage}`);',
    "Dev 拖拽")

dev = rep(dev,
    'await db.put("deals", { ...sel, title: ef.title.trim(), value: Number(ef.value) || 0, closeDate: ef.closeDate || undefined }, "编辑商机「" + ef.title.trim() + "」");',
    'await repos.deals.update(sel.id, { title: ef.title.trim(), value: Number(ef.value) || 0, closeDate: ef.closeDate || undefined }, "编辑商机「" + ef.title.trim() + "」");',
    "Dev 编辑")

dev = rep(dev,
    'await db.put("deals", { ...d, [kind]: next }, `商机「${d.title}」更新${kind === "meddic" ? "MEDDIC" : "BANT"}`);',
    'await repos.deals.update(d.id, { [kind]: next }, `商机「${d.title}」更新${kind === "meddic" ? "MEDDIC" : "BANT"}`);',
    "Dev toggleTag")
write(r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\Dev.tsx", dev)

# CRM.tsx
crm = read(r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\CRM.tsx")
# import
if "repos" not in crm.split("\n")[0:20][-1] if False else crm.count("core/data/repository") == 0:
    crm = crm.replace('import { db } from "../db/db";',
                      'import { db } from "../db/db";\nimport { repos } from "../core/data/repository";', 1)
    print("  CRM import 已加")
crm = rep(crm,
    'await db.put("customers", { ...drawerC, custom: { ...(drawerC.custom ?? {}), mediaStrategy: strategyDraft } }, "保存客户「" + drawerC.name + "」媒介策略");',
    'await repos.customers.update(drawerC.id, { custom: { ...(drawerC.custom ?? {}), mediaStrategy: strategyDraft } }, "保存客户「" + drawerC.name + "」媒介策略");',
    "CRM saveStrategy")
crm = rep(crm,
    'await db.put("contactPoints", { id: uid("cp"), customerId: drawerC.id, channel: cpForm.channel, time: Date.now(), summary: cpForm.summary.trim() }, "记录跟进「" + drawerC.name + "」");',
    'await repos.cps.create({ customerId: drawerC.id, channel: cpForm.channel, time: Date.now(), summary: cpForm.summary.trim() }, "记录跟进「" + drawerC.name + "」");',
    "CRM saveContactPoint")
crm = rep(crm,
    'await db.put("customers", { id: uid("c"), name: form.name.trim(), industry: form.industry || "待补充", grade: form.grade as Customer["grade"], billingTitle: form.billingTitle || undefined, billingTaxNo: form.billingTaxNo || undefined, custom }, "新增客户");',
    'await repos.customers.create({ name: form.name.trim(), industry: form.industry || "待补充", grade: form.grade as Customer["grade"], billingTitle: form.billingTitle || undefined, billingTaxNo: form.billingTaxNo || undefined, custom }, "新增客户");',
    "CRM 新增客户")
crm = rep(crm,
    'await db.softDelete("customers", c.id, `删除客户「${c.name}」(入回收站)`);',
    'await repos.customers.destroy(c.id, `删除客户「${c.name}」(入回收站)`);',
    "CRM 删除客户")
crm = rep(crm,
    'for (const c of victims) await db.softDelete("customers", c.id, "批量删除客户");',
    'for (const c of victims) await repos.customers.destroy(c.id, "批量删除客户");',
    "CRM 批量删除")
write(r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\CRM.tsx", crm)

# Work.tsx
work = read(r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\Work.tsx")
if work.count("core/data/repository") == 0:
    work = work.replace('import { db } from "../db/db";',
                        'import { db } from "../db/db";\nimport { repos } from "../core/data/repository";', 1)
    print("  Work import 已加")
work = rep(work,
    'await db.put("tasks", { ...t, kanbanCol: col }, `任务「${t.title}」移动到 ${col}`);',
    'await repos.tasks.update(t.id, { kanbanCol: col }, `任务「${t.title}」移动到 ${col}`);',
    "Work 拖拽")
work = rep(work,
    'await db.put("tasks", { id: uid("t"), title: form.title.trim(), type: form.type, priority: form.priority, due: form.due || undefined, kanbanCol: "待办", customerId: form.customerId || undefined }, "新建任务");',
    'await repos.tasks.create({ title: form.title.trim(), type: form.type, priority: form.priority, due: form.due || undefined, kanbanCol: "待办", customerId: form.customerId || undefined }, "新建任务");',
    "Work 新建任务")
write(r"D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app\src\pages\Work.tsx", work)

print("全部完成")

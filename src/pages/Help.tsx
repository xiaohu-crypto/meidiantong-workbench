const MODULES: { name: string; desc: string }[] = [
  { name: "今日驾驶舱", desc: "默认着陆页。AI 建议(规则引擎)按 沉默天数×客户价值×阶段 排序;含节点倒计时、KR 进度、预警与待回款。" },
  { name: "CRM 客户管理", desc: "客户表格(搜索/筛选/排序/保存视图);点行开 360° 抽屉:概览(健康度/开票资料)、决策链(角色徽章)、时间线、合同与回款。删除有关联商机的客户会被阻止。" },
  { name: "工作管理系统", desc: "看板四列拖拽流转;进行中超 5 张触发 WIP 红色告警;OKR 只读进度。" },
  { name: "客户开发系统", desc: "Pipeline 七阶段看板,阶段切换自动带概率;MEDDIC/BANT 打标;比稿登记与胜率;SOP 话术库。" },
  { name: "媒介策略中心", desc: "供应商与返点、刊例价版本(报价锁版本)、排期甘特、采购/报价双口径、客户版报价单自动脱敏导出、售后数据 CSV 回填。" },
  { name: "知识学习系统", desc: "PARA 归档 + [[双链]] + 版本历史 + 标签(系统管理可合并标签)。" },
  { name: "数据分析报表", desc: "签约额/回款/毛利三口径切换、行业基准值表维护、月度成绩单一键导出。" },
  { name: "个人成长规划", desc: "AAR 周复盘(经营数据自动预填),能力四级自评本地持久化。" },
];

const KEYS: { k: string; d: string }[] = [
  { k: "Ctrl + K", d: "快速采集(全局生效,含托盘)" },
  { k: "Esc", d: "逐级关闭:快速采集 → 抽屉 → 弹窗" },
  { k: "点击行", d: "CRM 客户行打开 360° 抽屉" },
  { k: "拖拽卡片", d: "看板列间流转任务" },
];

export default function Help() {
  return (
    <div>
      <div className="page-head">
        <div><h1>使用手册</h1><div className="date">内置帮助 · 覆盖八大模块与全局交互</div></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="h-row"><span className="h-title sm">核心原则</span></div>
        <div className="alert-line"><span className="txt"><b>本地优先</b> — 数据全部存本机(IndexedDB + 文件),不上传;云模型仅在你显式点击时调用,且敏感字段先脱敏。</span></div>
        <div className="alert-line"><span className="txt"><b>唯一漏斗</b> — 商机(Deal)是唯一主数据,CRM 阶段由它派生,两处数字永远一致。</span></div>
        <div className="alert-line"><span className="txt"><b>可回滚</b> — 所有写入带操作日志与变更前快照,单条可撤销;删除走回收站(30 天)。</span></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="h-row"><span className="h-title sm">八大模块</span></div>
        {MODULES.map((m) => (
          <div className="alert-line" key={m.name}><span className="txt"><b>{m.name}</b> — {m.desc}</span></div>
        ))}
      </div>

      <div className="card card-pad">
        <div className="h-row"><span className="h-title sm">快捷键与交互</span></div>
        {KEYS.map((k) => (
          <div className="alert-line" key={k.k}><span className="txt"><code style={{ fontFamily: "var(--mono)" }}>{k.k}</code> — {k.d}</span></div>
        ))}
        <p className="muted" style={{ fontSize: "var(--text-xs)", marginTop: 8 }}>
          备份建议:系统管理 → 立即备份导出 JSON,或开启自动备份轮转(保留最近 N 份)。
        </p>
      </div>
    </div>
  );
}

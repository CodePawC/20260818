import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Building,
  User,
  Wrench,
  Activity,
  ShieldCheck,
  Calculator,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  Calendar,
  Check,
  Flame,
  Printer
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface ManualCaseStudiesProps {
  onNavigateTab?: (tab: ActiveTab) => void;
  showToast?: (message: string) => void;
}

export const ManualCaseStudies: React.FC<ManualCaseStudiesProps> = ({
  onNavigateTab,
  showToast
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case-01');

  const cases = [
    {
      id: 'case-01',
      title: 'ICU 德尔格呼吸机持续高压报警现场排障与闭环签名全案',
      category: '报修闭环',
      targetTab: 'repairs' as ActiveTab,
      targetLabel: '临床报修处置',
      device: '德尔格呼吸机 Evita V300 (ICU-04 / SN: DRG-88219)',
      dept: '重症医学科 (ICU病区)',
      personnel: '责任护士 (张晓燕) · 维修工程师 (李明)',
      problem: '患者机械通气过程中，呼吸机频繁出现「HIGH PRESSURE / 气道高压」报警，PEEP 压力无法稳定维持在 8cmH2O，机器自检波形呈现呼气端阻抗异常。',
      badPractice: '【常见违规错误】：个别科室私自关闭报警音或将报警上限盲目调高；维修工程师修复后未等临床试机，自行在系统代签护士长名字强行结案。',
      bestPractice: '【标准化合规操作】：护士长扫机身防水活码秒级报修，选择 P0 级抢救紧急；工程师 12 分钟赶到现场，拆检呼气盒确认硅胶膜老化破损，领料更换原装膜片总成（SP-DRG-V300-VALVE）；现场进行 60hPa 气密打压及 GB 9706.1 电气安全测试；临床护士长通电连接模拟肺，验证通气波形正常后，当面手写电子签名并评价 5 星。',
      keyMetrics: [
        { label: '故障响应时长', value: '12 分钟 (SLA标线20分)' },
        { label: '现场检修换件', value: '呼气阀膜片组 (¥1,450)' },
        { label: '电气安全测试', value: '接地电阻 0.07Ω 合格' },
        { label: '闭环验收评价', value: '护士长手写签名·5星满意' }
      ]
    },
    {
      id: 'case-02',
      title: '普外科凌晨急需除颤监护仪跨科室借调与共享机库流转全案',
      category: '急救调配',
      targetTab: 'emergency_reserve' as ActiveTab,
      targetLabel: '急救调配机库',
      device: '迈瑞双相波除颤监护仪 BeneHeart D6 (SN: MR-D6-9921)',
      dept: '普外科二病区 (借用) &larr; 急救医学中心共享机库 (调出)',
      personnel: '值班护士 (王桂兰) · 急救机库管员 (陈志远)',
      problem: '凌晨 02:15，普外科收治一名术后突发恶性心律失常先兆患者，科室备用除颤仪正在另一手术室使用，急需借调一台双相波除颤仪实施除颤备用。',
      badPractice: '【常见违规错误】：值班护士直接跑到邻近病区私下口头搬借，无任何借用记录；未清点除颤电极板与导电膏，抢救时发现电极板插头不匹配或导电膏干涸。',
      bestPractice: '【标准化合规操作】：在移动端「急救调配」点击一键借调，系统通过空间蓝牙信标自动定位到急救中心暂存库 1 台空闲待调机具（距离 130 米）；双方责任人当面清点 4 大必备附件（5导电缆、成人/儿童二合一除颤板、电源线及全新导电膏）；系统生成借调单号 LN-202610-0992 并启动 24 小时倒计时；次日患者转危为安，归还时消杀并复检放电能量正常，一键结单归库。',
      keyMetrics: [
        { label: '机库匹配耗时', value: '45 秒智能检索' },
        { label: '物理送达用时', value: '4 分半钟送达病区' },
        { label: '附件点检齐备', value: '4项齐备率 100%' },
        { label: '归还复核状态', value: '消杀放电测试合格归库' }
      ]
    },
    {
      id: 'case-03',
      title: '手术室高频电刀负极板局部灼伤不良事件 10 日直报全案',
      category: '不良事件',
      targetTab: 'adverse_events' as ActiveTab,
      targetLabel: '不良事件直报',
      device: '威利高频电刀 Force FX (SN: VLY-FX-10492)',
      dept: '麻醉手术科 (手术间 03)',
      personnel: '巡回护士 (刘静) · 医学工程质控专员 (李明)',
      problem: '腹腔镜胆囊切除术中，电凝止血时机器偶尔报警回路阻抗异常；手术结束揭除负极板时，发现患者右大腿外侧粘贴边缘出现浅表红肿水泡（II度灼伤约 2.5cm×1.5cm）。',
      badPractice: '【常见违规错误】：医护人员担心受罚而隐瞒不报，私下给患者涂药了事；涉事负极板和批号被随手扔进垃圾桶，导致无法溯源调查。',
      bestPractice: '【标准化合规操作】：巡回护士立即向科室主任与医工科报告；就地封存该台电刀并悬挂「暂停使用·封存取证」警示牌；封存涉事同批次负极板（LOT-20240915）；医工质控组判定为严重伤害事件，启动 10 个工作日国家直报倒计时；联合厂家工程师排查确认患者体毛较密未做局部备皮导致接触面积不足；7 个工作日内向国家不良事件监测网完成初报并录入防范改进措施。',
      keyMetrics: [
        { label: '物证封存时效', value: '术毕 15 分钟内封存' },
        { label: '涉事耗材批号', value: 'LOT-20240915 (封存45片)' },
        { label: '直报国家时效', value: '7个工作日 (法定限值10日)' },
        { label: '全院召回排查', value: '召回雷达排查全院0异常' }
      ]
    },
    {
      id: 'case-04',
      title: '超期服役 9 年半彩色多普勒超声仪特许准用备案实例',
      category: '合规备案',
      targetTab: 'maintenance' as ActiveTab,
      targetLabel: '维保强检计划',
      device: 'GE LOGIQ E9 全身应用彩超 (SN: GE-US-44912)',
      dept: '超声医学科 (门诊 2F 诊室)',
      personnel: '超声科主任 (周秀英) · 主任工程师 (崔伟)',
      problem: '设备原值 185 万元，购置于 2017 年 3 月，设计推荐使用年限为 8 年。至 2026 年底已服役 9 年 7 个月，超出了设计寿命，但机器日常图质优良且科室门诊量大，申请继续使用。',
      badPractice: '【常见违规错误】：未经任何第三方检定或安全测试，超期未备案长期“裸奔”运行；一旦被卫健局或药监飞检查出将面临巨额罚款并被责令停用。',
      bestPractice: '【标准化合规操作】：由超声科提交《超期服役医疗设备特许准用申请》；医学工程科联合省级法定计量科学研究院开展全面体模性能测试（轴向分辨力 1.0mm、盲区 2mm 全部合格）；执行 GB 9706.1 医用电气安全测试（探头对地漏电流 8μA 达标）；核查近 12 个月非计划停机率仅 0.8%；提交医学装备管理委员会审议，分管副院长张明理签字批准特许准用 1 年，挂设准用标识牌并纳入每季度重点专项巡检。',
      keyMetrics: [
        { label: '已服役时长', value: '9 年 7 个月 (超期19个月)' },
        { label: '图像分辨率', value: '体模测试全部合格' },
        { label: '电气安全漏电', value: '探头漏电 8μA (限值100μA)' },
        { label: '特许准用批复', value: '分管院长审批·准用1年' }
      ]
    },
    {
      id: 'case-05',
      title: '西门子 1.5T 磁共振射频功放故障外协议价联合谈判案',
      category: '外协议价',
      targetTab: 'vendor_collaboration' as ActiveTab,
      targetLabel: '供应商协同门户',
      device: '西门子 1.5T 超导磁共振 MAGNETOM Aera',
      dept: '医学影像科 (总院区 1号楼 1F)',
      personnel: '医学工程科长 (赵文博) · 西门子高级工程师 (刘振东)',
      problem: 'MRI 扫描床突发射频发射过载报警，图像质子共振信号无法激发，导致磁共振检查全面停摆。经初步诊断为射频功放模块 (RFPA) 大功率场效应管烧毁。',
      badPractice: '【常见违规错误】：直接按照原厂第一轮天价报价（38.5 万元）走单一来源审批，无任何价格比对与技术方案博弈；更换后的高价值旧件被原厂悄悄收走带出医院。',
      bestPractice: '【标准化合规操作】：医学工程科启动外协议价紧急处置机制；组织医工技术骨干、财务资产科、纪检监察室及影像科主任成立四方谈判小组；通过全国医工维保联盟数据库比对同类案例成交价；要求原厂提供“保税备件置换”与“原板元器件级返厂深修”两种方案；最终谈判达成协议价 ¥168,000.00（直降 21.7 万元，降幅 56.4%），并将该部件质保期由 6 个月延长至 18 个月；双方当面在《联合议价评审纪要》上签字盖章，烧毁旧件严格拍照留存并清点入旧件库。',
      keyMetrics: [
        { label: '原厂初始报价', value: '¥ 385,000.00' },
        { label: '联合谈判确认价', value: '¥ 168,000.00 (省21.7万)' },
        { label: '质保延长周期', value: '由 6 个月延长至 18 个月' },
        { label: '旧件闭环监管', value: '高价值旧件 100% 留存入库' }
      ]
    },
    {
      id: 'case-06',
      title: 'DRG 专机折旧与单机成本效益 ROI 测算实操剖析 (64排CT)',
      category: '成本核算',
      targetTab: 'drg_cost_audit' as ActiveTab,
      targetLabel: '医保专耗核算',
      device: '西门子 64 排螺旋 CT (SOMATOM go.Top / 购置原值 ¥3,850,000)',
      dept: '医学影像科 / 医保 DRG 管理办公室',
      personnel: '财务资产科长 (王淑华) · 医工科长 (赵文博)',
      problem: '国家推进医保 DRG/DIP 付费改革后，头部病组实行总额打包付费。医院需准确核算单台 CT 每月固定折旧、每次检查应分摊的设备成本及保本开机人次，防止医保病组超标亏损。',
      badPractice: '【常见违规错误】：科室盲目申请购置数百万级新机，未做任何前期经济学评估与人次测算；日常核算只看科室总收入，不计提设备折旧与球管损耗，掩盖实际亏损。',
      bestPractice: '【标准化合规操作】：在系统中录入原值 ¥3,850,000、折旧年限 8 年（96个月）、残值率 5%；系统自动计算月度固定折旧计提额为 ¥38,100；结合科室历史开机数据，测算出月度平均检查量 820 例；单次检查分摊折旧额为 ¥46.50；扣除每次高压造影针筒、电费与技术人员工时费（¥65.00），单例检查边际贡献为 ¥148.50；测算出月度盈亏平衡点（BEP）为 257 人次。当前月检查 820 例显著超越保本线，月度净结余达 ¥83,670，静态投资回收期测算为 4.8 年，处于优良良性资产状态。',
      keyMetrics: [
        { label: '月固定折旧计提', value: '¥ 38,100.00 / 月' },
        { label: '单例检查分摊成本', value: '¥ 46.50 / 例' },
        { label: '月度保本检查量', value: '257 人次 (当前820例)' },
        { label: '预计投资回收期', value: '4.8 年 (投资回报良性)' }
      ]
    },
    {
      id: 'case-07',
      title: '检验科日立 7020 全自动生化仪服役 13 年国有资产技术报废',
      category: '资产报废',
      targetTab: 'scrap_workflow' as ActiveTab,
      targetLabel: '报废处置工作流',
      device: '日立 7020 全自动生化分析仪 (原值: ¥520,000 / 启用: 2013年)',
      dept: '医学检验科 (原门诊化验室)',
      personnel: '检验科主任 (刘桂兰) · 资产科长 (王淑华) · 工程师 (崔伟)',
      problem: '设备已服役 13 年，超出国家规定折旧年限 5 年。近期该机光电比色通道严重漂移，温育盘控温误差超过 ±1.8℃，导致转氨酶及血糖检测结果失真，且主板已全线停产。',
      badPractice: '【常见违规错误】：科室主任图省事直接私自联系废品回收人员将机具当作废铁卖掉；或者未向上级国资部门报批即私自将设备拆解零件，导致国有资产流失。',
      bestPractice: '【标准化合规操作】：检验科在系统发起报废申请；医工科组成 3 人技术鉴定小组现场检测，出具《技术鉴定意见书》，确认主光栅老化及无替换芯片，维修费用超过新机现值 75%，判定为技术性报废；财务资产科核对资产账面净值为 ¥26,000（残值底账），累计折旧已提足 100%；医学装备管委会审议同意，报请院长办公会批准；呈报县卫健局与县财政局国资监管科，取得正式处置批复文号；由具备危险废弃物与环保资质单位以 ¥3,800 公开拍卖变现并上缴财政专户；财务在固定资产台账下账，医工科注销条码卡片，全流程合规闭环。',
      keyMetrics: [
        { label: '实际服役年限', value: '13 年 (国家推荐8年)' },
        { label: '累计计提折旧', value: '100% 提足折旧' },
        { label: '多方会签批文', value: '县卫健/财政局批文下账' },
        { label: '残值竞价变现', value: '¥ 3,800.00 (上缴专户)' }
      ]
    }
  ];

  const currentCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
      {/* 头部说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Lightbulb className="w-3 h-3 text-emerald-600" />
            <span>实战实操案例库 · 正误对比剖析</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>全周期 7 大真实案例实操复盘</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            以五莲县人民医院临床一线真实发生的典型工单、急救调配、不良事件及议价谈判为蓝本，提供“错误做法 vs 正确做法”生动对比教学。
          </p>
        </div>

        {/* 直达对应业务功能 */}
        {currentCase.targetTab && onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab(currentCase.targetTab!)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-center"
          >
            <span>直达「{currentCase.targetLabel}」实操</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 案例列表横向选项卡 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {cases.map(c => {
          const isSelected = c.id === currentCase.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCaseId(c.id)}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-2xs font-mono text-slate-500 mb-0.5">{c.category}</div>
              <div className="text-xs truncate">{c.title}</div>
            </button>
          );
        })}
      </div>

      {/* 案例详细呈现卡片 */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 sm:p-7 space-y-6">
        {/* 案例主头 */}
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2 text-2xs text-blue-600 font-mono font-bold uppercase mb-1">
            <span>实战复盘案例</span>
            <span aria-hidden="true">·</span>
            <span>{currentCase.category}</span>
          </div>
          <h3 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
            {currentCase.title}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">涉案设备：</span>
              <strong className="text-slate-800">{currentCase.device}</strong>
            </div>
            <div>
              <span className="text-slate-400">涉案科室：</span>
              <span>{currentCase.dept}</span>
            </div>
            <div>
              <span className="text-slate-400">核心经办人：</span>
              <span>{currentCase.personnel}</span>
            </div>
          </div>
        </div>

        {/* 案例情境描述 */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
            <span>突发情境与临床诉求</span>
          </div>
          <p className="leading-relaxed text-2xs sm:text-xs text-slate-600">
            {currentCase.problem}
          </p>
        </div>

        {/* 错误做法 VS 正确做法 对比格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 错误做法 */}
          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>常见违规与误操作风险 (BAD PRACTICE)</span>
            </div>
            <p className="text-2xs sm:text-xs text-rose-800 leading-relaxed">
              {currentCase.badPractice}
            </p>
          </div>

          {/* 正确合规做法 */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>五莲县人民医院标准 SOP (BEST PRACTICE)</span>
            </div>
            <p className="text-2xs sm:text-xs text-emerald-800 leading-relaxed">
              {currentCase.bestPractice}
            </p>
          </div>
        </div>

        {/* 核心考核指标网格 */}
        <div>
          <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            本案关键质控与绩效量化指标 (KPI)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {currentCase.keyMetrics.map((km, kIdx) => (
              <div key={kIdx} className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-2xs text-slate-500 block mb-0.5">{km.label}</span>
                <strong className="text-xs sm:text-sm font-bold text-blue-900">{km.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

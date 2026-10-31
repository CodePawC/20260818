import { 
  AccreditationClause, 
  NationalHospitalKpi, 
  QualityCapaItem, 
  AccreditationSummaryStat 
} from '../types/qualityAccreditationTypes';
import { MedicalEquipment } from '../types';

export const INITIAL_ACCREDITATION_CLAUSES: AccreditationClause[] = [
  {
    id: 'clause-4.6.1',
    clauseNumber: '4.6.1.1',
    title: '医疗装备管理组织架构、中长期规划与全生命周期制度体系',
    coreRequirement: '建立院级医疗装备管理委员会，健全全生命周期管理制度与应急预案，定期进行制度评审与运行监督。',
    category: 'organization',
    categoryLabel: '组织管理与制度体系',
    mandatoryCore: true,
    criteria: [
      {
        level: 'C',
        requirement: '成立医疗装备管理委员会，有明确工作职责与议事规程，每年召开至少2次专题会议；建立设备采购、保养、维修及报废基本制度。',
        checkMethod: '查阅院党委会/院长办公会任命文件、会议纪要、现行医疗装备管理制度汇编。',
        achieved: true
      },
      {
        level: 'B',
        requirement: '对全院医疗装备实施全生命周期信息化追踪（建档、调拨、借用、维保、报废），各科室落实设备保管责任人。',
        checkMethod: '现场抽查3个临床科室固定资产账卡物一致率，抽检系统信息化台账流转记录。',
        achieved: true
      },
      {
        level: 'A',
        requirement: '依托数字化全景台账实现设备配置效益动态测算，建立持续质量改进机制（PDCA），有详实的年度质量分析与优化报告。',
        checkMethod: '查阅年度医疗装备运行效益分析专报及质控改进闭环证据链。',
        achieved: true
      }
    ],
    currentLevel: 'A',
    selfScore: 96,
    targetLevel: 'A',
    linkedModule: '资产台账全景、MasterData组织架构',
    evidenceDocuments: ['《五莲县人民医院医疗装备管理委员会章程》', '《医疗设备全生命周期闭环管理制度汇编(2026版)》', '《2025年度设备效益与配置论证专报》'],
    openCapasCount: 0,
    lastEvaluatedAt: '2026-10-15',
    evaluatorName: '孙建国 (医学工程科主任)',
    auditRemarks: '组织架构健全，信息化覆盖率100%，已开展单台设备效益测算。'
  },
  {
    id: 'clause-4.6.2',
    clauseNumber: '4.6.2.1',
    title: '大型医用设备配置论证、进院准入与严格验收流程',
    coreRequirement: '落实大型医用设备配置许可管理，严格执行临床需求论证、技术经济性评估、场地环境评估与三方验收标准。',
    category: 'procurement',
    categoryLabel: '论证准入与验收管理',
    mandatoryCore: true,
    criteria: [
      {
        level: 'C',
        requirement: '严格执行国家《大型医用设备配置许可管理目录》，乙类及以上大型设备持证配置；新进设备有出厂合格证及医疗器械注册证。',
        checkMethod: '查验大型医用设备配置许可证原件，核验进院设备三证及海关商检文件。',
        achieved: true
      },
      {
        level: 'B',
        requirement: '实施设备科、临床使用科室、后勤保障部多方联合验收，建立电气安全、性能技术指标实测检验记录表。',
        checkMethod: '现场抽查近1年新购设备验收档案（含安装环境确认、放射卫生防护检测报告）。',
        achieved: true
      },
      {
        level: 'A',
        requirement: '实现验收单据数字化电子归档与条码/UDI初次建档，设备供应商资质与维保承诺纳入电子合同履约监管。',
        checkMethod: '系统抽检新进设备电子档案生成时效与履约评价记录。',
        achieved: true
      }
    ],
    currentLevel: 'A',
    selfScore: 98,
    targetLevel: 'A',
    linkedModule: '验收管理中心、供应商协同平台',
    evidenceDocuments: ['《乙类大型医用设备配置许可证归档》', '《新进医疗设备临床性能与电气安全联合验收SOP》', '《供应商资质准入审查白皮书》'],
    openCapasCount: 0,
    lastEvaluatedAt: '2026-10-18',
    evaluatorName: '张维良 (副主任技师)',
    auditRemarks: '新进设备100%经过电气安全及多方联检验收，技术档案完整。'
  },
  {
    id: 'clause-4.6.3',
    clauseNumber: '4.6.3.1',
    title: '医疗设备预防性维护(PM)、定期巡检与国家法定计量强检管理',
    coreRequirement: '制定并严格执行预防性维护(PM)计划；属于国家强制检定目录的计量器具受检率必须达到 100%，证书齐全在期。',
    category: 'maintenance',
    categoryLabel: '预防性维护与计量强检',
    mandatoryCore: true,
    criteria: [
      {
        level: 'C',
        requirement: '建立全院医疗设备预防性维护计划与日常巡检规程；建立法定计量器具强检目录台账，定期送检。',
        checkMethod: '查阅年度PM维护总计划、计量检定计划台账，比对现场设备绿色合格标识。',
        achieved: true
      },
      {
        level: 'B',
        requirement: '国家法定强检目录内医疗器具受检率达到 100%，检定/校准合格标志张贴于设备醒目位置，超期设备立即脱机停用。',
        checkMethod: '系统穿透检索计量台账到期日，随机抽查放射科、手术室、ICU在用强检设备电子证书。',
        achieved: true
      },
      {
        level: 'A',
        requirement: '实现计量超期红黄灯自动锁机预警；建立基于设备故障历史的智能PM预测维护模型，维护按期执行率 ≥98%。',
        checkMethod: '查验系统预警触发记录、维护工单闭环率及设备平均无故障时间(MTBF)改善趋势。',
        achieved: false
      }
    ],
    currentLevel: 'B',
    selfScore: 88,
    targetLevel: 'A',
    linkedModule: '计量强检目录、预防性维护计划、返厂维修闭环',
    evidenceDocuments: ['《2026年度国家法定计量器具强检实施总方案》', '《e-CQS强检平台备案回执与检定证书库》', '《预防性维护(PM)四级巡检规程》'],
    openCapasCount: 1,
    lastEvaluatedAt: '2026-10-24',
    evaluatorName: '李思齐 (高级工程师)',
    auditRemarks: '全院法定强检受检率保持100%，但在部分急诊高频呼吸机PM深度点检上存在2台次工单逾期整改中。'
  },
  {
    id: 'clause-4.6.4',
    clauseNumber: '4.6.4.1',
    title: '急救与生命支持类设备集中管理、应急调配与日常保障机制',
    coreRequirement: '建立急救生命支持类设备（呼吸机、除颤仪、监护仪、输液泵等）应急库，完好率达到 100%，具备全院快速响应调配能力。',
    category: 'emergency',
    categoryLabel: '急救与生命支持保障',
    mandatoryCore: true,
    criteria: [
      {
        level: 'C',
        requirement: '急救、生命支持类设备完好率达到 100%，定点放置，处于随时可用备用状态；科室实行每班日常核查交接。',
        checkMethod: '现场随机抽查急诊科、重症医学科(ICU)、手术室急救车内除颤仪与呼吸机开机自检。',
        achieved: true
      },
      {
        level: 'B',
        requirement: '建立医学工程部急救设备应急调配中心与备用库，制定突发公共卫生事件应急调配预案，每年开展不少于1次实兵演练。',
        checkMethod: '现场发起模拟急救呼吸机紧急借调，测算响应出库送达时限（要求 ≤15分钟）。',
        achieved: true
      },
      {
        level: 'A',
        requirement: '应用移动扫码或物联网电子围栏实现急救设备全院实时定位盘点，电池健康状态与附件完整性实时监控。',
        checkMethod: '系统调取室内电子围栏监控地图与借还交接电子回执。',
        achieved: true
      }
    ],
    currentLevel: 'A',
    selfScore: 97,
    targetLevel: 'A',
    linkedModule: '应急储备库、室内电子围栏、临床极速借调',
    evidenceDocuments: ['《突发公共卫生事件急救医疗设备应急调配方案》', '《急救生命支持类设备100%完好率交接制度》', '《2026年急救设备跨科室应急调运演练报告》'],
    openCapasCount: 0,
    lastEvaluatedAt: '2026-10-22',
    evaluatorName: '刘明 (急救质控组长)',
    auditRemarks: '全院45台集中应急储备设备随时可用，交接记录完备，响应送达平均用时 8.5分钟。'
  },
  {
    id: 'clause-4.6.5',
    clauseNumber: '4.6.5.1',
    title: '医疗器械临床使用不良事件监测、风险评估与应急处置闭环',
    coreRequirement: '落实国家医疗器械不良事件监测法规要求，建立可疑不良事件“发现-上报-调查-评价-控制”闭环机制，及时向国家监测系统填报。',
    category: 'adverse_event',
    categoryLabel: '不良事件监测与安全控制',
    mandatoryCore: true,
    criteria: [
      {
        level: 'C',
        requirement: '设立医疗器械不良事件监测小组，明确报告时限（一般事件30日内，严重伤害15日内，死亡事件7日内完成初报）。',
        checkMethod: '查阅院内不良事件上报制度及国家医疗器械不良事件监测信息系统注册账号。',
        achieved: true
      },
      {
        level: 'B',
        requirement: '发生严重不良事件时，立即封存同批次设备或耗材，组织医学工程、药械管理及临床专家进行现场技术原因调查分析。',
        checkMethod: '现场抽检近年不良事件调查分析报告与同批次产品锁定封存记录。',
        achieved: true
      },
      {
        level: 'A',
        requirement: '不良事件分析结论反馈至设备维保及采购遴选机制，形成风险预警台账，定期发布安全用械通报与针对性临床操作培训。',
        checkMethod: '查阅安全风险预警通报及防范措施落地回访档案。',
        achieved: true
      }
    ],
    currentLevel: 'A',
    selfScore: 95,
    targetLevel: 'A',
    linkedModule: '不良事件监测中心、厂家协同召回、法规SOP',
    evidenceDocuments: ['《医疗器械不良事件监测与紧急处置管理规定》', '《国家不良事件上报凭证归档表》', '《2026年度医疗器械临床安全分析通报》'],
    openCapasCount: 0,
    lastEvaluatedAt: '2026-10-19',
    evaluatorName: '王晓燕 (器械质控主管)',
    auditRemarks: '不良事件上报及时率100%，建立了事件与设备技术档案的穿透联动。'
  },
  {
    id: 'clause-4.6.6',
    clauseNumber: '4.6.6.1',
    title: '专机专用耗材合规配伍、国家 UDI 唯一标识全程追溯与召回管理',
    coreRequirement: '严格执行医疗器械唯一标识 (UDI) 贯通要求，落实高值耗材与主机设备配伍白名单，实现批次不良召回1秒精准穿透。',
    category: 'udi_consumable',
    categoryLabel: '专机专耗与 UDI 追溯',
    mandatoryCore: false,
    criteria: [
      {
        level: 'C',
        requirement: '建立专机专耗进院审核目录，禁止使用非原厂认证或未经生物相容性验证的替代耗材。',
        checkMethod: '现场查验内窥镜、检验分析仪专用试剂耗材进出库台账与配伍资质证明。',
        achieved: true
      },
      {
        level: 'B',
        requirement: '全面对接国家药监局 UDI 数据库，扫码解析 DI/PI/批号/有效期，严禁过期失效耗材上机使用。',
        checkMethod: '现场扫描专机耗材条码，验证系统自动校验与防差错拦截能力。',
        achieved: true
      },
      {
        level: 'A',
        requirement: '建立批次召回雷达，当发布国家召回公告时，能够秒级穿透检索在用主机、科室分布及已消耗病历，支持一键指令冻结。',
        checkMethod: '现场输入测试不良批号，实测召回雷达检索覆盖率与阻断拦截响应速度。',
        achieved: true
      }
    ],
    currentLevel: 'A',
    selfScore: 99,
    targetLevel: 'A',
    linkedModule: 'UDI解析引擎、专机专耗中心、批次召回雷达',
    evidenceDocuments: ['《专机专耗配伍白名单与上机防差错管理规范》', '《国家医疗器械唯一标识(UDI)实施推进专案》', '《召回雷达应急穿透演练实录》'],
    openCapasCount: 0,
    lastEvaluatedAt: '2026-10-25',
    evaluatorName: '陈伟 (信息化医工主管)',
    auditRemarks: '系统已部署 GS1 与国家 MA 双模 UDI 解析引擎，批次召回穿透秒级响应。'
  }
];

export const INITIAL_NATIONAL_KPIS: NationalHospitalKpi[] = [
  {
    id: 'kpi-01',
    code: 'KPI-EQUIP-01',
    name: '全院医疗设备完好率',
    category: 'quality',
    categoryLabel: '质量与完好',
    baselineRequirement: '≥ 95.0%',
    currentValue: 97.4,
    unit: '%',
    status: 'excellent',
    dataFormula: '在用完好设备总台数 / 全院在用医疗设备总台数 × 100%',
    relatedSource: '系统在用设备台账 (过滤报废及长期闲置)',
    trendDirection: 'up',
    trendRate: '+0.8% 环比',
    actionPrompt: '保持良好，重点关注重症医学科高频监护类设备预防性保养'
  },
  {
    id: 'kpi-02',
    code: 'KPI-EQUIP-02',
    name: '法定计量器具强检受检率',
    category: 'quality',
    categoryLabel: '法规合规',
    baselineRequirement: '100.0% (法定强制)',
    currentValue: 100.0,
    unit: '%',
    status: 'excellent',
    dataFormula: '有效检定周期内强检设备台数 / 国家强检目录内设备总台数 × 100%',
    relatedSource: '系统国家强检计量台账与e-CQS证书库',
    trendDirection: 'stable',
    trendRate: '持平 (持续合规)',
    actionPrompt: '下月即将到期设备共 14 台，已提前下发预警送检通知'
  },
  {
    id: 'kpi-03',
    code: 'KPI-EQUIP-03',
    name: '急救生命支持类设备完好率',
    category: 'safety',
    categoryLabel: '安全与急救',
    baselineRequirement: '100.0% (底线指标)',
    currentValue: 100.0,
    unit: '%',
    status: 'excellent',
    dataFormula: '完好待用急救设备台数 / 急救生命支持类设备配置总台数 × 100%',
    relatedSource: '全院急救调配中心与各科急救车交接点检记录',
    trendDirection: 'stable',
    trendRate: '持平 (零故障备用)',
    actionPrompt: '除颤仪与转运呼吸机状态均满格，电池循环寿命健康度良好'
  },
  {
    id: 'kpi-04',
    code: 'KPI-EQUIP-04',
    name: '大型医用设备年有效使用机时达标率',
    category: 'efficiency',
    categoryLabel: '运行效率',
    baselineRequirement: '≥ 90.0%',
    currentValue: 93.6,
    unit: '%',
    status: 'normal',
    dataFormula: '实际检查开机有效机时 / 国家额定负荷工作机时标准 × 100%',
    relatedSource: 'CT、MR、DSA、直线加速器等大型设备PACS检查流水',
    trendDirection: 'up',
    trendRate: '+1.5% 季度增幅',
    actionPrompt: '3.0T磁共振工作饱和度最高，建议优化平扫与增强检查排程'
  },
  {
    id: 'kpi-05',
    code: 'KPI-EQUIP-05',
    name: '预防性维护(PM)计划按期执行率',
    category: 'safety',
    categoryLabel: '维保质控',
    baselineRequirement: '≥ 95.0%',
    currentValue: 96.2,
    unit: '%',
    status: 'normal',
    dataFormula: '本周期按期完成PM工单数 / 计划应执行PM总工单数 × 100%',
    relatedSource: '预防性维护计划看板与工程师工单执行记录',
    trendDirection: 'up',
    trendRate: '+2.1% 环比',
    actionPrompt: '急诊科与消化内镜中心有2项PM工单临近整改期限，已挂牌督办'
  },
  {
    id: 'kpi-06',
    code: 'KPI-EQUIP-06',
    name: '医疗器械不良事件可疑报告及时率',
    category: 'safety',
    categoryLabel: '安全预警',
    baselineRequirement: '100.0% (合规法定时限)',
    currentValue: 100.0,
    unit: '%',
    status: 'excellent',
    dataFormula: '法定规定时限内完成国家网报数 / 实际发生器械不良事件总数 × 100%',
    relatedSource: '医疗器械不良事件监测与国家平台数据回执',
    trendDirection: 'stable',
    trendRate: '持平 (严格履职)',
    actionPrompt: '年度无严重伤害及以上事件，一般事件均在7个工作日内完成闭环调查'
  }
];

export const INITIAL_QUALITY_CAPAS: QualityCapaItem[] = [
  {
    id: 'CAPA-2026-001',
    clauseNumber: '4.6.3.1',
    clauseTitle: '预防性维护(PM)与计量强检合规',
    sourceType: 'metrology_overdue',
    sourceTitle: '急诊科便携式血气分析仪与2台输液泵PM巡检工单超期预警',
    problemDescription: '系统跨模块预警引擎检测到急诊科 2 台多通道微量注射泵（资产号 EQ-2024-0089、EQ-2024-0090）超过3季度规定PM校验时限5天未完成流转，影响预防性维护按期完成率。',
    rootCauseAnalysis: '急诊抢救班次连续高负荷运转，设备借调频繁，原责任工程师调班未能及时衔接进室点检。',
    correctiveActionPlan: '1. 立即指派值班工程师李思齐携带专用流速校准仪进驻急诊科完成校准与电气安全复测；2. 启用备用机替换，保障临床连续运转；3. 优化排班预警，超期前7天向科室护士长推送微信提示。',
    responsibleEngineer: '李思齐',
    department: '医学工程科 / 急诊医学科',
    deadlineDate: '2026-11-05',
    severity: 'medium',
    status: 'under_rectification',
    verificationExpert: '孙建国 (科主任)',
    createdAt: '2026-10-25 09:30'
  },
  {
    id: 'CAPA-2026-002',
    clauseNumber: '4.6.4.1',
    clauseTitle: '急救生命支持类设备保障',
    sourceType: 'emergency_missing_check',
    sourceTitle: '心胸外科备用转运呼吸机电池巡检放电测试遗漏',
    problemDescription: '周度移动巡检质控抽查发现，心胸外科备用转运呼吸机（EQ-2023-0145）未按规定执行每月一次的深充放电活化与自检测试，存在电量虚标隐患。',
    rootCauseAnalysis: '临床科室护士岗位交接未将电池充放电列入日常核对必填清单。',
    correctiveActionPlan: '医工部已收回电池组接入专业电池容量测试仪进行3次全充放标定，实测健康度94%，已恢复供电并同步更新日常点检电子表单中的强制作业项。',
    responsibleEngineer: '刘明',
    department: '心胸外科病区',
    deadlineDate: '2026-10-30',
    completionDate: '2026-10-28',
    severity: 'low',
    status: 'closed',
    verificationExpert: '张维良',
    verificationNotes: '已现场复测放电续航时间，实测达到 4.8 小时（额定要求≥4小时），测试合格准予放行销号。',
    createdAt: '2026-10-20 14:15'
  }
];

// 动态指标计算工具：结合当前真实系统数据
export function calculateDynamicAccreditationStats(
  equipmentList: MedicalEquipment[],
  capas: QualityCapaItem[]
): {
  kpis: NationalHospitalKpi[];
  summary: AccreditationSummaryStat;
} {
  const total = equipmentList.length || 1;
  const inUse = equipmentList.filter(e => e.status === '正常运行').length;
  const faulty = equipmentList.filter(e => e.status === '故障待修').length;
  const inMaintenance = equipmentList.filter(e => e.status === '维护保养中').length;
  
  // 完好率 = 在用正常 / (在用 + 故障 + 维修)
  const soundCount = inUse;
  const activeTotal = soundCount + faulty + inMaintenance || 1;
  const soundRate = Number(((soundCount / activeTotal) * 100).toFixed(1));

  const kpis: NationalHospitalKpi[] = INITIAL_NATIONAL_KPIS.map(kpi => {
    if (kpi.code === 'KPI-EQUIP-01') {
      const isOk = soundRate >= 95.0;
      return {
        ...kpi,
        currentValue: soundRate,
        status: isOk ? 'excellent' : 'warning',
        actionPrompt: isOk ? '全院设备完好率达标，保持维保响应效率' : `当前完好率为${soundRate}%，低于国考95%标准，请优先处置维修中设备`
      };
    }
    return kpi;
  });

  const openCapas = capas.filter(c => c.status !== 'closed').length;
  const closedCapas = capas.filter(c => c.status === 'closed').length;

  const summary: AccreditationSummaryStat = {
    totalClauses: INITIAL_ACCREDITATION_CLAUSES.length,
    coreClausesCount: INITIAL_ACCREDITATION_CLAUSES.filter(c => c.mandatoryCore).length,
    levelACount: INITIAL_ACCREDITATION_CLAUSES.filter(c => c.currentLevel === 'A').length,
    levelBCount: INITIAL_ACCREDITATION_CLAUSES.filter(c => c.currentLevel === 'B').length,
    levelCCount: INITIAL_ACCREDITATION_CLAUSES.filter(c => c.currentLevel === 'C').length,
    levelDCount: INITIAL_ACCREDITATION_CLAUSES.filter(c => c.currentLevel === 'D').length,
    overallComplianceRate: 98.2,
    coreClauseComplianceRate: 100.0,
    totalCapas: capas.length,
    openCapas,
    closedCapas
  };

  return { kpis, summary };
}

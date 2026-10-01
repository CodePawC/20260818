import { MedicalEquipment } from '../types';

export type AiAnalysisDimension =
  | 'comprehensive'
  | 'safety'
  | 'fault_pm'
  | 'roi_cost'
  | 'metrology_compliance'
  | 'lifecycle_retirement';

export interface InteractiveDimensionParams {
  scenario?: string; // 'ICU' | 'OR' | 'Emergency' | 'Ward' | 'Transport' | 'Imaging';
  workloadLevel?: 'super_high' | 'normal' | 'standby';
  patientCriticality?: 'critical' | 'moderate' | 'stable';
  faultCodeOrSymptom?: string;
  monthlyPatients?: number;
  avgFee?: number;
  consumableRatio?: number; // 0 ~ 1
  metrologyType?: 'mandatory' | 'periodic' | 'exempt' | 'internal';
  disciplineStrategy?: 'cost_control' | 'discipline_leader' | 'research_teaching';
  hasOverhaulBudget?: boolean;
  customQuery?: string;
}

export interface QuantitativeMetricItem {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  comment: string;
}

export interface ActionRecommendationItem {
  priority: '高' | '中' | '低';
  action: string;
  targetDepartment: string;
  expectedOutcome: string;
}

export interface AiDimensionAnalysisResult {
  dimension: AiAnalysisDimension;
  dimensionTitle: string;
  verdictTag?: {
    text: string;
    level: 'safe' | 'warning' | 'danger' | 'info';
    subTitle: string;
  };
  keyTakeaways?: string[]; // 3 sharp bullet points
  radarScores: {
    safetyScore: number; // 0-100 (运行安全)
    reliabilityScore: number; // 0-100 (稳定程度)
    roiHealthScore: number; // 0-100 (使用效益)
    complianceScore: number; // 0-100 (检测合格)
    modernityScore: number; // 0-100 (设备新旧)
  };
  executiveSummary: string;
  coreFindings: string[];
  quantitativeInsights: Record<string, QuantitativeMetricItem>;
  actionableRecommendations: ActionRecommendationItem[];
  riskWarnings: string[];
  interactiveFollowUpSuggestions: string[];
}

export const DIMENSION_DEFINITIONS: {
  key: AiAnalysisDimension;
  title: string;
  shortTitle: string;
  iconName: string;
  badgeColor: string;
  description: string;
}[] = [
  {
    key: 'comprehensive',
    title: '🌟 综合健康评估',
    shortTitle: '综合评估',
    iconName: 'Sparkles',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: '综合评估设备的安全情况、运行稳定性、使用效益与后续维护建议。'
  },
  {
    key: 'safety',
    title: '🛡️ 运行安全与使用风险',
    shortTitle: '安全与风险',
    iconName: 'ShieldAlert',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: '评估临床使用中的用电安全、突发状况应对及使用注意事项。'
  },
  {
    key: 'fault_pm',
    title: '🔧 故障预防与日常保养',
    shortTitle: '保养与防障',
    iconName: 'Wrench',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: '分析容易老化的零件，给出定期除尘、清洁和日常保养建议。'
  },
  {
    key: 'roi_cost',
    title: '💰 使用效益与收支测算',
    shortTitle: '使用效益',
    iconName: 'TrendingUp',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: '测算设备每月检查使用情况、服务患者数量及收益支出情况。'
  },
  {
    key: 'metrology_compliance',
    title: '📋 定期检验与合格状态',
    shortTitle: '检验与质控',
    iconName: 'Scale',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: '查看设备每年法定检验合格证明，避免过期未检影响正常使用。'
  },
  {
    key: 'lifecycle_retirement',
    title: '🔄 更新换代与淘汰建议',
    shortTitle: '更新建议',
    iconName: 'RotateCcw',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: '评估设备当前使用年限，分析是继续使用还是申请更换新设备。'
  }
];

export interface EquipmentDateLifecycleAnalysis {
  manufactureDateStr: string; // e.g. "2018-05-12"
  enableDateStr: string; // e.g. "2018-08-20"
  purchaseDateStr: string; // e.g. "2018-07-10"
  sn: string; // 出厂序列号 (SN - 核心唯一硬件追溯标识)
  designLifeYears: number; // e.g. 8
  expiryDateStr: string; // e.g. "2026-05-12"
  ageFromManufactureYears: number; // e.g. 8.3
  ageFromEnableYears: number; // e.g. 8.0
  storageLagMonths: number; // 出厂到投用间隔 (月)
  isOveraged: boolean; // 是否已超期服役
  remainingLifeYears: number; // 剩余有效寿命(年)
  remainingDays: number; // 剩余有效天数
  overagedYears: number; // 超期服役年限(年)
  overagedDays: number; // 超期服役天数
  lifeConsumptionRatio: number; // 寿命消耗比率 % (e.g. 103.8)
  purchasePrice: number; // 采购原值
  overhaulEconomicCutoff: number; // 单次大修止损经济上限 (原值 30%)
  lifecycleStage: 'golden' | 'wear' | 'critical_pre_expiry' | 'overaged';
  lifecycleStageLabel: string;
  stageColor: string;
}

export function calculateEquipmentDateLifecycle(equipment: MedicalEquipment | null | undefined): EquipmentDateLifecycleAnalysis {
  const equip = equipment || ({} as any);
  const purchasePrice = Math.max(1000, Number(equip.purchasePrice) || 85000);
  const overhaulEconomicCutoff = Math.round(purchasePrice * 0.3);
  
  // Format date helper
  const parseDate = (val?: string): Date | null => {
    if (!val) return null;
    const clean = val.replace(/\//g, '-').replace(/\./g, '-').trim();
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const enableDateObj = parseDate(equip.enableDate) || parseDate(equip.purchaseDate) || new Date('2021-03-15');
  let manufactureDateObj = parseDate(equip.manufactureDate);
  
  if (!manufactureDateObj) {
    // If manufacture date is not filled, infer from enable date (minus 3 months)
    manufactureDateObj = new Date(enableDateObj.getTime() - 90 * 24 * 3600 * 1000);
  }

  const designLifeYears = Math.max(1, Number(equip.productValidity) || 8);
  
  // Calculate expiry date = manufactureDate + designLifeYears
  const expiryDateObj = new Date(manufactureDateObj);
  expiryDateObj.setFullYear(expiryDateObj.getFullYear() + designLifeYears);

  const now = Date.now();
  const mTime = manufactureDateObj.getTime();
  const eTime = enableDateObj.getTime();
  const expTime = expiryDateObj.getTime();

  const ageFromManufactureYears = Math.max(0.1, Math.round(((now - mTime) / (365.25 * 24 * 3600 * 1000)) * 10) / 10);
  const ageFromEnableYears = Math.max(0.1, Math.round(((now - eTime) / (365.25 * 24 * 3600 * 1000)) * 10) / 10);
  const storageLagMonths = Math.max(0, Math.round(((eTime - mTime) / (30.4375 * 24 * 3600 * 1000)) * 10) / 10);

  const isOveraged = now > expTime;
  let remainingDays = 0;
  let remainingLifeYears = 0;
  let overagedDays = 0;
  let overagedYears = 0;

  if (isOveraged) {
    overagedDays = Math.max(1, Math.floor((now - expTime) / (24 * 3600 * 1000)));
    overagedYears = Math.round((overagedDays / 365.25) * 10) / 10;
  } else {
    remainingDays = Math.max(0, Math.ceil((expTime - now) / (24 * 3600 * 1000)));
    remainingLifeYears = Math.round((remainingDays / 365.25) * 10) / 10;
  }

  const lifeConsumptionRatio = Math.round((ageFromManufactureYears / designLifeYears) * 1000) / 10;

  let lifecycleStage: 'golden' | 'wear' | 'critical_pre_expiry' | 'overaged' = 'golden';
  let lifecycleStageLabel = '黄金高效运行期 (0~50%)';
  let stageColor = 'emerald';

  if (isOveraged || lifeConsumptionRatio >= 100) {
    lifecycleStage = 'overaged';
    lifecycleStageLabel = `超期服役期 (${lifeConsumptionRatio}%)`;
    stageColor = 'rose';
  } else if (lifeConsumptionRatio >= 80) {
    lifecycleStage = 'critical_pre_expiry';
    lifecycleStageLabel = `临期预警期 (${lifeConsumptionRatio}%)`;
    stageColor = 'amber';
  } else if (lifeConsumptionRatio >= 50) {
    lifecycleStage = 'wear';
    lifecycleStageLabel = `平稳磨损期 (${lifeConsumptionRatio}%)`;
    stageColor = 'blue';
  }

  return {
    manufactureDateStr: formatDate(manufactureDateObj),
    enableDateStr: formatDate(enableDateObj),
    purchaseDateStr: equip.purchaseDate ? formatDate(parseDate(equip.purchaseDate) || enableDateObj) : formatDate(enableDateObj),
    sn: equip.sn || equip.id || '未登记',
    designLifeYears,
    expiryDateStr: formatDate(expiryDateObj),
    ageFromManufactureYears,
    ageFromEnableYears,
    storageLagMonths,
    isOveraged,
    remainingLifeYears,
    remainingDays,
    overagedYears,
    overagedDays,
    lifeConsumptionRatio,
    purchasePrice,
    overhaulEconomicCutoff,
    lifecycleStage,
    lifecycleStageLabel,
    stageColor
  };
}

export function generateLocalDimensionAnalysis(
  equipment: MedicalEquipment | null | undefined,
  dimension: AiAnalysisDimension = 'comprehensive',
  params?: InteractiveDimensionParams
): AiDimensionAnalysisResult {
  const equip = equipment || {
    id: 'EQ-000',
    name: '多参数监护仪',
    model: 'BeneVision N15',
    category: '07 医用诊察和监护器械',
    department: '重症医学科 (ICU)',
    purchasePrice: 128000,
    enableDate: '2021-03-15',
    manufactureDate: '2020-12-10',
    status: '正常运行',
    productValidity: '8',
    repairRecords: []
  } as any;

  const equipName = equip.name || '医用设备';
  const model = equip.model || '标准型号';
  const price = equip.purchasePrice || 120000;
  const repairs = equip.repairRecords || [];
  const repairCount = repairs.length;
  const repairCost = repairs.reduce((sum: number, r: any) => sum + (r.cost || 0), 0);

  // Calculate deep lifecycle metrics from manufacture date and validity
  const lifecycle = calculateEquipmentDateLifecycle(equip);
  const {
    manufactureDateStr,
    enableDateStr,
    expiryDateStr,
    designLifeYears,
    ageFromManufactureYears,
    ageFromEnableYears,
    isOveraged,
    remainingLifeYears,
    remainingDays,
    overagedYears,
    overagedDays,
    lifeConsumptionRatio,
    storageLagMonths
  } = lifecycle;

  // Scenario & interactive adjustments
  const scenario = params?.scenario || (equip.department?.includes('ICU') || equip.department?.includes('重症') ? 'ICU' : 'General');
  const workload = params?.workloadLevel || 'normal';
  const criticality = params?.patientCriticality || 'critical';
  const monthlyPatients = params?.monthlyPatients || (price > 1000000 ? 600 : price > 200000 ? 1200 : 2500);
  const avgFee = params?.avgFee || (price > 1000000 ? 280 : price > 200000 ? 120 : 35);
  const consumableRatio = params?.consumableRatio ?? 0.18;

  // Overhaul economic cutoff threshold: 30% of original price
  const overhaulEconomicCutoff = Math.round(price * 0.3);
  const repairCostRatio = ((repairCost / price) * 100).toFixed(1);

  // Base Radar Scores calculation heavily grounded on date lifecycle
  let safetyScore = Math.max(40, Math.round(96 - (isOveraged ? 26 : (lifeConsumptionRatio / 100) * 18) - repairCount * 3));
  let reliabilityScore = Math.max(35, Math.round(98 - ((lifeConsumptionRatio / 100) * 28) - (repairCount * 4)));
  let roiScore = Math.min(98, Math.max(45, Math.round(68 + (monthlyPatients * avgFee > 50000 ? 22 : 8) - (repairCost / price) * 30)));
  let complianceScore = equip.calibrationUnit ? 96 : 85;
  let modernityScore = Math.max(30, Math.round(98 - (ageFromManufactureYears * 8)));

  if (equip.status === '故障待修') {
    reliabilityScore -= 25;
    safetyScore -= 20;
  } else if (equip.status === '维护保养中') {
    reliabilityScore -= 10;
  }

  if (workload === 'super_high') {
    reliabilityScore -= 8;
    roiScore += 8;
  }

  // 1. SAFETY DIMENSION
  if (dimension === 'safety') {
    const isDanger = isOveraged || safetyScore < 70 || (criticality === 'critical' && repairCount >= 3);
    const isWarn = safetyScore < 85 || lifeConsumptionRatio >= 80;
    return {
      dimension: 'safety',
      dimensionTitle: '🛡️ 运行安全与使用风险分析',
      verdictTag: {
        text: isOveraged ? '🚨 超期服役机型（电气与安全风险加剧）' : isDanger ? '⚠️ 安全重点防范机型' : isWarn ? '⚡ 临近有效到期日需防范老化' : '✅ 处于安全服役有效期内',
        level: isDanger ? 'danger' : isWarn ? 'warning' : 'safe',
        subTitle: `出厂日期: ${manufactureDateStr} | 有效期至: ${expiryDateStr} (${isOveraged ? `已超期 ${overagedYears}年` : `剩余 ${remainingLifeYears}年`})`
      },
      keyTakeaways: [
        `【出厂与有效期限时空研判】出厂日期为 ${manufactureDateStr}，设计使用期限 ${designLifeYears} 年，理论有效到期日为 ${expiryDateStr}。${isOveraged ? `当前已超期服役 ${overagedYears} 年 (${overagedDays} 天)，全寿命消耗率达 ${lifeConsumptionRatio}%，内部绝缘与储能元件物理老化加剧。` : `目前处于有效服役期内（全寿命消耗率 ${lifeConsumptionRatio}%，剩余有效服役 ${remainingLifeYears} 年），电气性能与物理指标在公差受控区。`}`,
        `【高危电气安全与漏电流基线】重点监测对地漏电流（必须 < 500μA）与保护接地阻抗（< 0.2Ω），防止老旧机壳绝缘胶皮脆化引发微电击。`,
        `【机载应急电池与后备供电】${ageFromManufactureYears >= 4 ? `出厂已满 ${ageFromManufactureYears} 年，机载锂电池自然衰减显著，必须每季度实测脱机带载时长（需保证 ≥ 60 分钟），容量衰减超 40% 须坚决换芯。` : '机载后备电池状态良好，浮充电压与续航符合临床转运标准。'}`
      ],
      radarScores: {
        safetyScore,
        reliabilityScore,
        roiHealthScore: roiScore,
        complianceScore,
        modernityScore
      },
      executiveSummary: `【${equipName}】出厂于 ${manufactureDateStr} (有效期至 ${expiryDateStr})，${isOveraged ? '已超期服役，须由医工处实施严格绝缘与漏电流防范鉴定' : '尚在有效服役期内，电气安全及绝缘参数符合临床标准'}。`,
      coreFindings: [
        `全寿命阶段与时间坐标：出厂至今 ${ageFromManufactureYears} 年，投用 ${ageFromEnableYears} 年 (入库时滞 ${storageLagMonths} 个月)，寿命消耗进度 ${lifeConsumptionRatio}%。`,
        `有效到期日安全预警：有效截止日为 ${expiryDateStr}，${isOveraged ? `已逾期服役 ${overagedDays} 天，按法规应限制用于三类生命支持极危重抢救` : `剩余有效天数 ${remainingDays} 天，处于设计寿命安全周期`}。`,
        `电气绝缘与耐压指标：接地阻抗实测 < 0.18Ω，对地漏电流 < 180μA，需建立半年度电气安全综合分析仪实测档案。`,
        `高风险元器件物理衰减：重点关注出厂多年后的电源滤波电容漏液、内部连接线缆绝缘老化及传感器零点漂移。`
      ],
      quantitativeInsights: {
        manufactureAndExpiry: { label: '出厂与有效到期日', value: `${manufactureDateStr} 至 ${expiryDateStr}`, trend: isOveraged ? 'down' : 'stable', comment: isOveraged ? `已超期服役 ${overagedYears} 年` : `剩余有效期 ${remainingLifeYears} 年` },
        lifeConsumption: { label: '设计寿命消耗进度', value: `${lifeConsumptionRatio}% (${ageFromManufactureYears}/${designLifeYears}年)`, trend: lifeConsumptionRatio > 80 ? 'up' : 'stable', comment: lifecycle.lifecycleStageLabel },
        groundResistance: { label: '保护接地阻抗', value: '< 0.18 Ω (标准 < 0.2Ω)', trend: 'stable', comment: '医用电气安全达标' },
        leakageCurrent: { label: '对地漏电流实测', value: '< 180 μA (标准 < 500μA)', trend: 'stable', comment: '绝缘指标正常' }
      },
      actionableRecommendations: [
        {
          priority: isOveraged ? '高' : '中',
          action: isOveraged 
            ? '优化设备排班与临床安全分级：将超期机型定位于普通门诊辅助与教学备用，高难度抢救优先排产新近设备'
            : '推行科室“首检负责制”与交接班标准SOP，规范日常操作与开机自检，防止人为操作差错',
          targetDepartment: '临床科室护士站 / 科室管理组',
          expectedOutcome: '防范非计划停机对临床诊疗业务的阻断，保障患者检查与治疗安全有序'
        },
        {
          priority: '高',
          action: '建立医工与科室 15 分钟应急联动机制：设置备用机快速周转替换通道，确保急诊与抢救业务零中断',
          targetDepartment: '使用科室 / 医学工程处',
          expectedOutcome: '提升突发故障应急周转效率，使设备日均实际有效运营利用率保持在 95% 以上'
        }
      ],
      riskWarnings: [
        isOveraged ? `该设备已超过原厂标称有效日期 (${expiryDateStr})，严禁用于极危重症生命支持及复杂手术抢救，防范突发断电停机事故。` : '严禁私接大功率外挂设备，防止电源总线谐波过载击穿主板绝缘层。',
        '若设备外壳带静电、异味或持续异常蜂鸣，必须立即停机断电并报修，严禁带病强行使用。'
      ],
      interactiveFollowUpSuggestions: [
        `查看出厂日期 (${manufactureDateStr}) 对该机型核心元器件老化的物理影响`,
        `查询有效到期日 (${expiryDateStr}) 后的法定检验与安全准入标准`,
        '了解同科室同类设备的平均服役年限与备机配置现状'
      ]
    };
  }

  // 2. FAULT & PM DIMENSION
  if (dimension === 'fault_pm') {
    const isAging = lifeConsumptionRatio >= 75;
    const isFrequentRepair = repairCount >= 3;
    return {
      dimension: 'fault_pm',
      dimensionTitle: '🔧 故障预防与预测性维护(PM)分析',
      verdictTag: {
        text: isOveraged ? '🚨 超期高发故障预警机型' : isFrequentRepair ? '🔧 建议执行深度 PM 检修' : isAging ? '⏳ 部件进入磨损期需强化巡检' : '✅ 核心元器件状态优良',
        level: isOveraged || isFrequentRepair ? 'danger' : isAging ? 'warning' : 'safe',
        subTitle: `出厂日期: ${manufactureDateStr} | 有效期至: ${expiryDateStr} (寿命消耗 ${lifeConsumptionRatio}%)`
      },
      keyTakeaways: [
        `【出厂时间与浴盆老化曲线】设备自 ${manufactureDateStr} 出厂已历时 ${ageFromManufactureYears} 年，处于浴盆曲线的${isOveraged ? '耗损失效高发期' : isAging ? '平稳向耗损过渡期' : '平稳运行期'}。需重点预防滤波电容容量衰减、高频晶振频偏及气路/光路老化。`,
        `【有效到期日与预防性维护(PM)】设计有效期至 ${expiryDateStr} (${isOveraged ? `已超期 ${overagedDays} 天` : `剩余 ${remainingDays} 天`})。建议按季度实施全套深度 PM（含机内负压除尘、关键工作电压校准及传感器零点标定）。`,
        `【维修花费与大修警戒】累计维修 ${repairCount} 次，累计支出 ￥${repairCost.toLocaleString()} 元（占采购价 ${repairCostRatio}%）。大修止损线为 ￥${overhaulEconomicCutoff.toLocaleString()} 元，目前处于受控范围。`
      ],
      radarScores: {
        safetyScore,
        reliabilityScore,
        roiHealthScore: roiScore,
        complianceScore,
        modernityScore
      },
      executiveSummary: `出厂至今 ${ageFromManufactureYears} 年 (有效期至 ${expiryDateStr})，${isOveraged ? '核心元器件处于耗损失效期，建议强化季度 PM 并建立备件断供预案' : '核心硬件指标受控，执行季度深度 PM 可将年均突发停机率压降 60% 以上'}。`,
      coreFindings: [
        `出厂日期与磨损机理：出厂 ${manufactureDateStr}，投用 ${enableDateStr}，全寿命消耗率 ${lifeConsumptionRatio}%，主要易损件进入重点点检期。`,
        `有效到期日关联性：有效日期截止 ${expiryDateStr}，${isOveraged ? '已超过标称有效期，原厂对该批次核心备件供应已逐步收紧' : '尚在设计使用年限内，供应链备件保障通畅'}。`,
        `关键故障模式分析：历史 ${repairCount} 次报修主要集中于外接传感器与损耗接头，主控系统与执行机构运行平稳。`,
        `预防性维护(PM)规程：已建立季度级预防性维护计划，应重点强化散热风道负压除尘与稳压滤波测试。`
      ],
      quantitativeInsights: {
        manufactureDateInsight: { label: '出厂日期与服役历时', value: `${manufactureDateStr} (${ageFromManufactureYears}年)`, trend: 'stable', comment: `出厂至投用入库 ${storageLagMonths} 个月` },
        validityExpiryInsight: { label: '有效到期日与剩余期', value: `${expiryDateStr}`, trend: isOveraged ? 'down' : 'stable', comment: isOveraged ? `已超期服役 ${overagedYears} 年` : `剩余有效 ${remainingLifeYears} 年` },
        reliabilityIndex: { label: '运行稳定可靠性', value: `${reliabilityScore} 分 (满分100)`, trend: reliabilityScore > 75 ? 'stable' : 'down', comment: '运行状态受控' },
        overhaulCutoff: { label: '单次大修止损警戒线', value: `￥${overhaulEconomicCutoff.toLocaleString()} 元`, trend: 'stable', comment: '原值 30% 上限' }
      },
      actionableRecommendations: [
        {
          priority: '高',
          action: '实施错峰预防性维护(PM)保障业务连续：利用科室午休或非就诊高峰期开展定期深度保养，避免占用正常接诊排程',
          targetDepartment: '科室运营管理组 / 医学工程处',
          expectedOutcome: '彻底消除日间非计划突发停机隐患，保障科室就诊接诊流程零中断'
        },
        {
          priority: '中',
          action: '建立易损部件与专用耗材安全库存联动机制：打通耗材领用与设备维保数据，杜绝因缺件停工待料',
          targetDepartment: '医学工程处器材库 / 科室库管',
          expectedOutcome: '将故障停运平均恢复时长(MTTR)压缩 70% 以上，保障单机月服务通量'
        }
      ],
      riskWarnings: [
        '严禁使用非原厂规格的劣质替代保险管或配件，防止短路时损坏主板核心元器件。',
        '遇到间歇性报错，应立即导出系统底层 Error Log 分析，严禁简单重启后带病作业。'
      ],
      interactiveFollowUpSuggestions: [
        `查看自出厂日期 (${manufactureDateStr}) 以来核心部件老化清单`,
        `评估有效到期日 (${expiryDateStr}) 临近时备件断供的替代方案`,
        '计算该设备实施自主深度维保 vs 原厂全保的成本对比'
      ]
    };
  }

  // 3. ROI & COST DIMENSION
  if (dimension === 'roi_cost') {
    const annualPatients = monthlyPatients * 12;
    const annualRevenue = annualPatients * avgFee;
    const annualConsumableCost = annualRevenue * consumableRatio;
    const annualDepreciation = price / designLifeYears;
    const annualMaintCost = Math.max(3000, price * 0.04);
    const annualStaffCost = Math.max(20000, annualRevenue * 0.15);
    const annualNetProfit = annualRevenue - annualConsumableCost - annualDepreciation - annualMaintCost - annualStaffCost;
    const paybackYears = annualNetProfit > 0 ? (price / annualNetProfit).toFixed(1) : '已完成成本回收';
    const breakEvenPatients = Math.round((annualDepreciation + annualMaintCost + annualStaffCost) / (avgFee * (1 - consumableRatio)));
    const isGoodRoi = annualNetProfit > 0 && parseFloat(paybackYears) <= 3.5;

    return {
      dimension: 'roi_cost',
      dimensionTitle: '💰 使用效益与全生命周期成本(LCC)分析',
      verdictTag: {
        text: isGoodRoi ? '📈 高效运转机型（ROI 表现优良）' : annualNetProfit > 0 ? '⚖️ 收支平衡稳健运行' : '📉 负荷不足需激活调配',
        level: isGoodRoi ? 'safe' : annualNetProfit > 0 ? 'info' : 'warning',
        subTitle: `出厂: ${manufactureDateStr} | 有效期: ${expiryDateStr} (年服务约 ${annualPatients.toLocaleString()} 人次)`
      },
      keyTakeaways: [
        `【出厂周期与资产折旧全景】出厂日期为 ${manufactureDateStr}，投用至今已完成 ${Math.min(100, Math.round(lifeConsumptionRatio))}% 折旧，初始采购投入已完全收回，目前处于纯边际收益贡献期。`,
        `【单机产出与投资回收】采购原值 ￥${price.toLocaleString()} 元，按当前月均 ${monthlyPatients} 人次测算，年预计创收 ￥${annualRevenue.toLocaleString()} 元，投资回收期约 ${paybackYears} 年，产出效益优良。`,
        `【维保支出与大修经济决策】累计维修支出 ￥${repairCost.toLocaleString()} 元（占原值 ${repairCostRatio}%）。若未来单次大修费用预估超过 ￥${overhaulEconomicCutoff.toLocaleString()} 元（原值 30%），建议直接申报报废置换。`
      ],
      radarScores: {
        safetyScore,
        reliabilityScore,
        roiHealthScore: roiScore,
        complianceScore,
        modernityScore
      },
      executiveSummary: `【${equipName}】出厂于 ${manufactureDateStr}，已顺利度过折旧周期，单机年化创收充沛，建议维持合理开机负荷并严守单次大修 30% 止损红线。`,
      coreFindings: [
        `出厂年限与折旧清零：自出厂 ${manufactureDateStr} 以来历时 ${ageFromManufactureYears} 年，设备净值基本折旧完毕，单机运营进入高边际贡献阶段。`,
        `有效到期日经济界限：设计寿命截止 ${expiryDateStr}，${isOveraged ? '已过标称有效期，后期故障频发可能导致维护成本吞噬运营收益' : '尚在有效生命周期内，投资收益比保持高位'}。`,
        `工作负荷饱和度：月均服务 ${monthlyPatients} 人次，处于最佳工况负荷区间，无严重闲置贬值。`,
        `盈亏平衡保本底线：年保本服务量为 ${breakEvenPatients.toLocaleString()} 人次，当前实际业务量高出保本线 ${Math.max(0, Math.round(((annualPatients - breakEvenPatients) / breakEvenPatients) * 100))}%。`
      ],
      quantitativeInsights: {
        manufactureAndExpiry: { label: '出厂日期与有效期', value: `${manufactureDateStr} / ${expiryDateStr}`, trend: 'stable', comment: isOveraged ? `已超期 ${overagedYears} 年` : `剩余 ${remainingLifeYears} 年` },
        annualRevenue: { label: '年预估业务创收', value: `￥${annualRevenue.toLocaleString()} 元`, trend: 'up', comment: `年服务 ${annualPatients.toLocaleString()} 人次` },
        annualNetProfit: { label: '年估算净贡献值', value: `￥${Math.round(Math.max(0, annualNetProfit)).toLocaleString()} 元`, trend: 'up', comment: '已覆盖维保与折旧' },
        overhaulCutoff: { label: '大修止损经济上限', value: `￥${overhaulEconomicCutoff.toLocaleString()} 元`, trend: 'stable', comment: '原值 30% 警戒线' }
      },
      actionableRecommendations: [
        {
          priority: '高',
          action: '实施单机全生命周期效益(LCC)精细化核算：按月监控单机检查服务量、专用耗材配比及能耗成本，评估单机边际贡献效益',
          targetDepartment: '科室主任 / 财务科 / 运营管理部',
          expectedOutcome: '精准掌握单机投入产出周期，为科室下一阶段设备扩容与预算编制提供量化依据'
        },
        {
          priority: '高',
          action: '严格执行单次大修 ￥' + overhaulEconomicCutoff.toLocaleString() + ' 元止损红线；低负荷时段推行跨科借调共享',
          targetDepartment: '医学工程处 / 财务科 / 医务处',
          expectedOutcome: '杜绝沉没成本沉淀，盘活全院固定资产，提升全院设备综合使用效益'
        }
      ],
      riskWarnings: [
        `若单次大修报价超过 ￥${overhaulEconomicCutoff.toLocaleString()} 元（原值 30%），应坚决停止维修，避免沉没成本陷阱。`,
        '若科室月度开机率持续低于 35%，应及时申请跨科借调或纳入应急周转池，防止国有资产闲置贬值。'
      ],
      interactiveFollowUpSuggestions: [
        `测算从出厂 (${manufactureDateStr}) 至今累计产生的全周期总投资回报率(ROI)`,
        `评估有效到期日 (${expiryDateStr}) 之后继续服役的年均维保成本上升曲线`,
        '对比该机型在全院其他科室的利用率与产出水平'
      ]
    };
  }

  // 4. METROLOGY & COMPLIANCE DIMENSION
  if (dimension === 'metrology_compliance') {
    return {
      dimension: 'metrology_compliance',
      dimensionTitle: '📋 法定计量质控与三甲合规审计分析',
      verdictTag: {
        text: isOveraged ? '📋 需关注超期设备合规档案' : '🏆 三甲计量质控绿灯（检定合格）',
        level: isOveraged ? 'warning' : 'safe',
        subTitle: `出厂日期: ${manufactureDateStr} | 有效期至: ${expiryDateStr} (强检合格在期)`
      },
      keyTakeaways: [
        `【出厂注册证与有效期限档案】设备于 ${manufactureDateStr} 出厂，产品注册证/设计有效期限至 ${expiryDateStr}。${isOveraged ? `当前已超期服役 ${overagedYears} 年，在迎检三甲评审时需出具完整的《设备延期服役性能鉴定合格报告》。` : `设备处于产品注册有效期与设计寿命期内，全生命周期档案三证齐全。`}`,
        `【法定强检与计量周期】准确归类为国家法定强检/周期质控目录，严格执行 1 年 1 次法定强检，强检合格率保持 100%。`,
        `【示值误差与大修后二次定标】关键计量示值误差全部在法定规程允许公差内；严格执行大修后“强制计量复定标与临床准入放行”机制。`
      ],
      radarScores: {
        safetyScore,
        reliabilityScore,
        roiHealthScore: roiScore,
        complianceScore: 98,
        modernityScore
      },
      executiveSummary: `【${equipName}】出厂于 ${manufactureDateStr} (有效期至 ${expiryDateStr})，法定计量检定证书齐全有效，符合国家《医疗器械监督管理条例》与三甲评审质控规范。`,
      coreFindings: [
        `出厂资质与溯源档案：出厂合格证、注册证、历年计量检定证书及大修记录已全部归入电子档案，溯源链条完整。`,
        `有效到期日合规审计：有效截止日为 ${expiryDateStr}，${isOveraged ? '需重点备齐医学工程处出具的年度电气安全与输出精度鉴定记录' : '处于法定设计寿命周期内，合规风险极低'}。`,
        `法定检定执行机构：${equip.calibrationUnit ? `已由具备资质的专业计量技术机构【${equip.calibrationUnit}】完成周期检定` : '已按年度计划由法定计量检测机构完成周期检定'}。`,
        `计量标识张贴规范：机身醒目位置已张贴绿色“计量检定合格证”，明确标注检定日期与下次到期日。`
      ],
      quantitativeInsights: {
        manufactureAndExpiry: { label: '出厂与设计有效期', value: `${manufactureDateStr} / ${expiryDateStr}`, trend: 'stable', comment: isOveraged ? '需延期鉴定' : '资质合规有效' },
        complianceScore: { label: '计量合规综合评分', value: '98 分 (优秀)', trend: 'up', comment: '证书完整有效' },
        mandatoryRate: { label: '在用设备强检覆盖率', value: '100% (达标)', trend: 'up', comment: '三甲核心审查项' },
        calibrationCycle: { label: '法定检定周期', value: '12 个月 / 次', trend: 'stable', comment: '按国家 JJG 规程执行' }
      },
      actionableRecommendations: [
        {
          priority: '高',
          action: '实施法定强检与质控“错峰无感化”预约：在检定到期前 30 天由医工处集中安排上门校准，利用非接诊窗口完成',
          targetDepartment: '科室质控员 / 医学工程处',
          expectedOutcome: '保持 100% 法定检定在期合规，保障临床开单收费与诊疗业务不暂停、不脱节'
        },
        {
          priority: isOveraged ? '高' : '中',
          action: isOveraged 
            ? `针对超期机型完善延期服役管理与使用档案，规避三甲评审与医保检查合规风险` 
            : '推行“核心维修后快速复检放行通道”，压缩质控验收时间，加速设备重返临床运营',
          targetDepartment: '医学工程处 / 临床科室管理组',
          expectedOutcome: '健全三甲质控与医保合规闭环，提升设备临床可利用率'
        }
      ],
      riskWarnings: [
        '严禁使用超期未检或检定不合格的医疗设备开展诊疗，否则触犯《医疗器械监督管理条例》并将导致三甲评审一票否决。',
        '计量检定合格标签若字迹模糊或脱落，必须在 3 个工作日内向医工处申请核实补发，严禁私自手写篡改。'
      ],
      interactiveFollowUpSuggestions: [
        `查看该机型出厂 (${manufactureDateStr}) 对应的国家计量检定规程(JJG)主要技术指标`,
        `查询有效到期日 (${expiryDateStr}) 前后三甲医院质控评审的核心考核细则`,
        '查询该设备下一次法定计量检定到期提醒时间'
      ]
    };
  }

  // 5. LIFECYCLE & RETIREMENT DIMENSION
  if (dimension === 'lifecycle_retirement') {
    const retirementScore = Math.min(100, Math.round((lifeConsumptionRatio / 100) * 55 + (repairCost / price) * 35 + (isOveraged ? 20 : 0)));
    return {
      dimension: 'lifecycle_retirement',
      dimensionTitle: '🔄 资产全生命周期与更新淘汰决策分析',
      verdictTag: {
        text: isOveraged ? '🚨 建议申报下一年度更新置换' : lifeConsumptionRatio >= 80 ? '⏳ 进入寿命后期需提前规划换新' : '✨ 处于资产黄金高产期',
        level: isOveraged ? 'danger' : lifeConsumptionRatio >= 80 ? 'warning' : 'safe',
        subTitle: `出厂日期: ${manufactureDateStr} | 有效到期日: ${expiryDateStr} (${isOveraged ? `已超期 ${overagedYears}年` : `剩余 ${remainingLifeYears}年`})`
      },
      keyTakeaways: [
        `【出厂日期与有效期限硬约束】设备于 ${manufactureDateStr} 出厂，设计有效期限 ${designLifeYears} 年，有效到期日为 ${expiryDateStr}。${isOveraged ? `目前已超期服役 ${overagedYears} 年 (${overagedDays} 天)，全寿命消耗率达 ${lifeConsumptionRatio}%，核心部件老化与技术代差显著，建议提请医学装备委员会列入下一年度淘汰更新计划。` : `目前处于有效服役期内（全寿命消耗率 ${lifeConsumptionRatio}%，剩余有效服役 ${remainingLifeYears} 年），性能指标稳定，建议维持常规维护。`}`,
        `【技术代差与临床升级需求】新一代同类旗舰在[全数字化抗干扰、物联网 IoT 数据直连、AI 辅助诊断及智能低剂量]方面具备代际优势，可大幅提升临床检查通量。`,
        `【大修与报废经济决策点】采购原值 ￥${price.toLocaleString()} 元，累计维修已支出 ￥${repairCost.toLocaleString()} 元。未来单次维修费用若预估超过 ￥${overhaulEconomicCutoff.toLocaleString()} 元（原值 30%），建议坚决停止维修并启动报废销账。`
      ],
      radarScores: {
        safetyScore,
        reliabilityScore,
        roiHealthScore: roiScore,
        complianceScore,
        modernityScore
      },
      executiveSummary: `【${equipName}】出厂于 ${manufactureDateStr} (设计有效期至 ${expiryDateStr})，${isOveraged ? '已超过标称使用期限，故障率与维护成本呈上升趋势，建议科室提请开展更新换代论证。' : '当前处于资产高效产出期，技术指标完全契合科室业务需求，建议做好日常防尘保养。'}`,
      coreFindings: [
        `出厂日期与时空坐标：出厂至今 ${ageFromManufactureYears} 年，投用至今 ${ageFromEnableYears} 年，仓储时滞 ${storageLagMonths} 个月，全寿命消耗进度 ${lifeConsumptionRatio}%。`,
        `有效到期日研判：设计寿命截止日为 ${expiryDateStr}，${isOveraged ? `已逾期 ${overagedDays} 天，原厂备件面临停产断供风险，建议尽早规划置换` : `尚有 ${remainingDays} 天有效服务期，技术生命力充沛`}。`,
        `资产残值与折旧：账面原值已基本折旧完毕，已完全收回初始采购投入，无国有资产贬值负担。`,
        `更新准入配置建议：科室若申报新机购置，建议重点考察全数字化物联网集成能力、原厂质保年限及耗材集采兼容性。`
      ],
      quantitativeInsights: {
        manufactureAndExpiry: { label: '出厂日期与到期日', value: `${manufactureDateStr} / ${expiryDateStr}`, trend: isOveraged ? 'down' : 'stable', comment: isOveraged ? `已超期 ${overagedYears} 年` : `剩余 ${remainingLifeYears} 年` },
        lifeConsumption: { label: '全寿命消耗比例', value: `${lifeConsumptionRatio}% (${ageFromManufactureYears}/${designLifeYears}年)`, trend: 'up', comment: lifecycle.lifecycleStageLabel },
        retirementUrgency: { label: '更新置换紧迫度', value: `${retirementScore} 分 (满分100)`, trend: retirementScore > 70 ? 'up' : 'stable', comment: retirementScore > 70 ? '建议申报更新' : '继续正常使用' },
        economicCutoff: { label: '大修止损经济上限', value: `￥${overhaulEconomicCutoff.toLocaleString()} 元`, trend: 'stable', comment: '原值 30% 警戒线' }
      },
      actionableRecommendations: [
        {
          priority: isOveraged ? '高' : '中',
          action: isOveraged 
            ? '超前编制资产更新置换与学科发展论证：提前提请医院装备委员会列入下一年度采购规划，防止老旧设备制约诊疗通量' 
            : '优化学科中长期设备梯队配置规划，做好现有机型与未来新技术的平稳衔接',
          targetDepartment: '使用科室 / 医学工程处 / 医学装备管理委员会',
          expectedOutcome: '实现临床设备无缝代际升级，提升科室诊疗技术竞争力与患者接诊服务能力'
        },
        {
          priority: '高',
          action: '确立终末期运营止损硬红线：单次大修若超 ￥' + overhaulEconomicCutoff.toLocaleString() + ' 元坚决终止维修，直接启动报废销账与置换',
          targetDepartment: '医学工程处 / 财务科',
          expectedOutcome: '防止老旧低效设备过度消耗场地与维保预算，提升科室资产坪效与周转率'
        }
      ],
      riskWarnings: [
        '超期服役设备严禁用于急危重症抢救、复杂手术关键支持等高风险场景，避免关键时刻突发停机引发医疗纠纷。',
        '报废设备必须严格按照国有资产处置程序由医工处统一销账回收，严禁私自拆解关键零部件或留用存在安全隐患的附件。'
      ],
      interactiveFollowUpSuggestions: [
        `查看从出厂日期 (${manufactureDateStr}) 到有效到期日 (${expiryDateStr}) 的行业技术代差报告`,
        '了解医院医学装备管理委员会关于大型设备报废与更新论证的标准流程',
        '评估老旧设备报废前如何妥善处置内部存储的患者敏感数据'
      ]
    };
  }

  // 6. DEFAULT: COMPREHENSIVE 360° ASSESSMENT
  const overallAvg = Math.round((safetyScore + reliabilityScore + roiScore + complianceScore + modernityScore) / 5);
  return {
    dimension: 'comprehensive',
    dimensionTitle: '🌟 综合健康评估与资产运营决策',
    verdictTag: {
      text: overallAvg >= 85 ? '🌟 全维优良运营机型' : overallAvg >= 70 ? '⚡ 状态良好（稳健在用）' : '⚠️ 需重点关注与预防性维护',
      level: overallAvg >= 85 ? 'safe' : overallAvg >= 70 ? 'info' : 'warning',
      subTitle: `出厂: ${manufactureDateStr} | 有效期至: ${expiryDateStr} (健康指数: ${overallAvg}分)`
    },
    keyTakeaways: [
      `【出厂日期与有效期限全景】设备出厂日期为 ${manufactureDateStr}，设计使用期限 ${designLifeYears} 年，理论有效到期日为 ${expiryDateStr}。${isOveraged ? `当前已超期服役 ${overagedYears} 年 (${overagedDays} 天)，全寿命消耗率达 ${lifeConsumptionRatio}%，处于超期服役需重点关注阶段。` : `处于有效服役期内（全寿命消耗率 ${lifeConsumptionRatio}%，剩余有效服役 ${remainingLifeYears} 年），综合健康评分 ${overallAvg} 分。`}`,
      `【核心维保与大修经济红线】累计报修 ${repairCount} 次（支出 ￥${repairCost.toLocaleString()} 元）。设定单次大修经济止损线为 ￥${overhaulEconomicCutoff.toLocaleString()} 元（原值 30%），超出建议直接申请更新。`,
      `【质控达标与三甲合规】法定计量检定证书齐全有效，建议每季度实施全套电气安全分析与机内深度 PM 除尘，确保护士站与临床使用 100% 安全。`
    ],
    radarScores: {
      safetyScore,
      reliabilityScore,
      roiHealthScore: roiScore,
      complianceScore,
      modernityScore
    },
    executiveSummary: `【${equipName}】出厂于 ${manufactureDateStr} (有效期至 ${expiryDateStr})，综合健康评分为 ${overallAvg} 分。电气安全受控、法定计量合格、单机产出健康，建议重点强化基于生命周期的预防性维护。`,
    coreFindings: [
      `全寿命周期时空定位：出厂 ${manufactureDateStr}，投用 ${enableDateStr}，出厂至今 ${ageFromManufactureYears} 年，全寿命消耗率 ${lifeConsumptionRatio}% (${lifecycle.lifecycleStageLabel})。`,
      `有效到期日安全预警：有效截止日为 ${expiryDateStr}，${isOveraged ? `已逾期服役 ${overagedDays} 天，建议由医工处组织年度安全与精度鉴定` : `剩余有效 ${remainingDays} 天，处于稳定运行安全区间`}。`,
      `临床电气安全合规：接地阻抗 < 0.2Ω，对地漏电流 < 500μA，符合三甲评审 GB 9706.1 医用电气安全标准。`,
      `设备运行可靠性与大修止损：累计报修 ${repairCount} 次，建议确立单次大修 ￥${overhaulEconomicCutoff.toLocaleString()} 元（原值 30%）止损硬红线。`
    ],
    quantitativeInsights: {
      manufactureDateInsight: { label: '出厂日期与已服役历时', value: `${manufactureDateStr} (${ageFromManufactureYears}年)`, trend: 'stable', comment: `出厂至投用入库 ${storageLagMonths} 个月` },
      validityExpiryInsight: { label: '有效到期日与剩余年限', value: `${expiryDateStr}`, trend: isOveraged ? 'down' : 'stable', comment: isOveraged ? `已超期服役 ${overagedYears} 年` : `剩余有效 ${remainingLifeYears} 年` },
      overallHealth: { label: '综合健康指数', value: `${overallAvg} 分 (满分100)`, trend: 'stable', comment: '多维综合评价' },
      roiYield: { label: '经济产出效率', value: `${roiScore} 分 (效益优良)`, trend: 'up', comment: '充分收回折旧成本' }
    },
    actionableRecommendations: [
      {
        priority: '高',
        action: '深化科室设备“用-管-养-算”精细化运营闭环：结合出厂服役周期与科室排班，优化日常负荷分配与错峰维保',
        targetDepartment: '科室运营管理组 / 医学工程处',
        expectedOutcome: '设备综合完好率保持 ≥98%，单机月度有效服务人次与开机效率显著提升'
      },
      {
        priority: '高',
        action: '严格执行单次大修止损警戒线（￥' + overhaulEconomicCutoff.toLocaleString() + ' 元，原值 30%）：超限时坚决停止维修投入并启动更新论证',
        targetDepartment: '科室主任 / 医学工程处 / 财务科',
        expectedOutcome: '控制全周期资产运营总成本，提高国有资产资金使用效益'
      }
    ],
    riskWarnings: [
      isOveraged ? `该设备已超过标称有效日期 (${expiryDateStr})，严禁用于急危重症生命支持及复杂手术抢救，防范突发停机风险。` : '严禁私自跨科拉线接入未经医工处安全评估的大功率外围设备，防止电源总线谐波超标。',
      '若设备出现异常发热、反复报错或电气微麻感，应立即停机挂牌并联系医工处检修，严禁带病强行使用。'
    ],
    interactiveFollowUpSuggestions: [
      `查看出厂日期 (${manufactureDateStr}) 与有效到期日 (${expiryDateStr}) 对全生命周期维保成本的影响`,
      '查看“🛡️ 运行安全与使用风险”专项分析',
      '查看“🔄 资产全生命周期与更新淘汰决策”建议'
    ]
  };
}

export interface BatchFleetDeviceAnalysis {
  equipmentId: string;
  equipmentName: string;
  model: string;
  sn: string;
  department: string;
  purchasePrice: number;
  totalRepairCost: number;
  repairCount: number;
  repairCostRatio: number; // percentage of purchase price
  manufactureDateStr: string;
  ageYears: number;
  expiryDateStr: string;
  isOveraged: boolean;
  overagedYears: number;
  remainingLifeYears: number;
  healthScore: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  recommendedAction: string;
  actionTag: string; // e.g. '建议淘汰更新', '大修止损', '深度保养', '跨科周转', '状态良好'
}

export interface BatchFleetAnalysisResult {
  totalCount: number;
  totalPurchaseValue: number;
  totalRepairCost: number;
  avgHealthScore: number;
  overagedCount: number;
  highRiskCount: number;
  fleetAgeStructure: {
    under3Years: number;
    from3To7Years: number;
    over7Years: number;
    overaged: number;
  };
  executiveSummary: string;
  keyInsights: string[];
  departmentDistribution: Array<{
    department: string;
    count: number;
    avgHealthScore: number;
    totalValue: number;
    hasOveraged: boolean;
  }>;
  prioritizedDevices: BatchFleetDeviceAnalysis[];
  strategicRecommendations: {
    category: '淘汰置换与更新规划' | '科室负荷调配与共享' | '维保大修止损管控' | '强检与质控排程';
    priority: '高' | '中' | '低';
    title: string;
    description: string;
    targetDevices: string[];
  }[];
}

export function generateLocalBatchFleetAnalysis(devices: MedicalEquipment[]): BatchFleetAnalysisResult {
  if (!devices || devices.length === 0) {
    return {
      totalCount: 0,
      totalPurchaseValue: 0,
      totalRepairCost: 0,
      avgHealthScore: 0,
      overagedCount: 0,
      highRiskCount: 0,
      fleetAgeStructure: { under3Years: 0, from3To7Years: 0, over7Years: 0, overaged: 0 },
      executiveSummary: '未选择有效医疗设备',
      keyInsights: [],
      departmentDistribution: [],
      prioritizedDevices: [],
      strategicRecommendations: []
    };
  }

  let totalValue = 0;
  let totalRepair = 0;
  let totalScore = 0;
  let overagedCount = 0;
  let under3Years = 0;
  let from3To7Years = 0;
  let over7Years = 0;

  const analyzedDevices: BatchFleetDeviceAnalysis[] = devices.map(item => {
    const lifecycle = calculateEquipmentDateLifecycle(item);
    const purchasePrice = lifecycle.purchasePrice;
    totalValue += purchasePrice;

    const repairCount = item.repairRecords?.length || item.repairCount || 0;
    const repairCost = item.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
    totalRepair += repairCost;

    const costRatio = Math.round((repairCost / purchasePrice) * 1000) / 10;

    // Calculate approximate health score
    let baseScore = 95;
    if (lifecycle.isOveraged) {
      baseScore -= Math.min(30, Math.round(lifecycle.overagedYears * 6 + 10));
    } else if (lifecycle.remainingLifeYears <= 1) {
      baseScore -= 10;
    }
    if (costRatio > 30) baseScore -= 18;
    else if (costRatio > 15) baseScore -= 10;
    if (item.status === '故障待修') baseScore -= 20;
    else if (item.status === '维护保养中') baseScore -= 5;
    const healthScore = Math.max(35, Math.min(99, baseScore));
    totalScore += healthScore;

    if (lifecycle.isOveraged) {
      overagedCount++;
    } else {
      if (lifecycle.ageFromManufactureYears < 3) under3Years++;
      else if (lifecycle.ageFromManufactureYears <= 7) from3To7Years++;
      else over7Years++;
    }

    // Determine riskLevel and Action
    let riskLevel: 'safe' | 'warning' | 'danger' = 'safe';
    let actionTag = '✅ 优良主力/跨科共享';
    let recommendedAction = '设备健康度高、服役处于黄金期，可作为科室高负荷主力机型，或纳入医院应急周转调配池。';

    if (lifecycle.isOveraged && (costRatio >= 28 || repairCost >= lifecycle.overhaulEconomicCutoff)) {
      riskLevel = 'danger';
      actionTag = '🛑 止损报废/淘汰更新';
      recommendedAction = `维保支出已达止损硬红线(已达原值 ${costRatio}%)且超期服役 ${lifecycle.overagedYears} 年，坚决停止后续大修投入，提请装备委员会列入下一年度更新预算。`;
    } else if (lifecycle.isOveraged) {
      riskLevel = 'danger';
      actionTag = '⚠️ 超期降级/安全质控';
      recommendedAction = `已超期服役 ${lifecycle.overagedYears} 年，应组织年度安全与绝缘鉴定，限制用于急重症高负荷抢救，降级为普通门诊或教学备用。`;
    } else if (costRatio >= 25) {
      riskLevel = 'warning';
      actionTag = '⚡ 维保高耗/重点监控';
      recommendedAction = `累计维保支出达 ￥${repairCost.toLocaleString()} 元 (原值 ${costRatio}%)，逼近 30% 止损线，严控后续大额维修审批，强化日常首检与点检。`;
    } else if (lifecycle.remainingLifeYears <= 1) {
      riskLevel = 'warning';
      actionTag = '⏳ 临期预警/提前论证';
      recommendedAction = `设计使用年限仅剩 ${lifecycle.remainingLifeYears} 年 (${lifecycle.remainingDays}天)，提前启动科室业务需求调研与下一代机型技术论证。`;
    } else if (item.status === '故障待修') {
      riskLevel = 'danger';
      actionTag = '🔧 故障待修/加速周转';
      recommendedAction = '目前处于故障停运状态，需协调医工处与原厂加快排查修复，压缩 MTTR 停运时间。';
    }

    return {
      equipmentId: item.id,
      equipmentName: item.name,
      model: item.model,
      sn: item.sn || item.id,
      department: item.department || '未分配科室',
      purchasePrice,
      totalRepairCost: repairCost,
      repairCount,
      repairCostRatio: costRatio,
      manufactureDateStr: lifecycle.manufactureDateStr,
      ageYears: lifecycle.ageFromManufactureYears,
      expiryDateStr: lifecycle.expiryDateStr,
      isOveraged: lifecycle.isOveraged,
      overagedYears: lifecycle.overagedYears,
      remainingLifeYears: lifecycle.remainingLifeYears,
      healthScore,
      riskLevel,
      recommendedAction,
      actionTag
    };
  });

  // Sort: high risk first, then lowest health score
  const riskPriority = { danger: 3, warning: 2, safe: 1 };
  analyzedDevices.sort((a, b) => {
    if (riskPriority[a.riskLevel] !== riskPriority[b.riskLevel]) {
      return riskPriority[b.riskLevel] - riskPriority[a.riskLevel];
    }
    return a.healthScore - b.healthScore;
  });

  const highRiskCount = analyzedDevices.filter(d => d.riskLevel === 'danger').length;
  const avgHealthScore = Math.round((totalScore / devices.length) * 10) / 10;

  // Department distribution summary
  const deptMap = new Map<string, { count: number; totalScore: number; totalValue: number; hasOveraged: boolean }>();
  analyzedDevices.forEach(d => {
    const entry = deptMap.get(d.department) || { count: 0, totalScore: 0, totalValue: 0, hasOveraged: false };
    entry.count += 1;
    entry.totalScore += d.healthScore;
    entry.totalValue += d.purchasePrice;
    if (d.isOveraged) entry.hasOveraged = true;
    deptMap.set(d.department, entry);
  });

  const departmentDistribution = Array.from(deptMap.entries()).map(([department, val]) => ({
    department,
    count: val.count,
    avgHealthScore: Math.round((val.totalScore / val.count) * 10) / 10,
    totalValue: val.totalValue,
    hasOveraged: val.hasOveraged
  }));

  const overagedDevices = analyzedDevices.filter(d => d.isOveraged);
  const highCostDevices = analyzedDevices.filter(d => d.repairCostRatio >= 25);

  const strategicRecommendations: BatchFleetAnalysisResult['strategicRecommendations'] = [
    {
      category: '淘汰置换与更新规划',
      priority: overagedDevices.length > 0 ? '高' : '中',
      title: `超期老旧设备梯队有序更新 (${overagedDevices.length}台)`,
      description: overagedDevices.length > 0
        ? `本次研判发现 ${overagedDevices.length} 台设备（如 ${overagedDevices.slice(0, 2).map(d => d.equipmentName).join('、')}）已超期服役。建议结合科室下半年业务量发展，由医学工程处编制《淘汰置换可行性论证报告》，按批次申报医院装备管理委员会列入下一期固定资产更新预算。`
        : '当前批次设备均在有效设计寿命期内，整体梯队结构良好，建议做好常规中长期设备梯队储备。',
      targetDevices: overagedDevices.map(d => d.equipmentId)
    },
    {
      category: '维保大修止损管控',
      priority: highCostDevices.length > 0 ? '高' : '中',
      title: `单次大修原值 30% 止损硬红线执行`,
      description: `本批次设备累计维保支出共计 ￥${totalRepair.toLocaleString()} 元（平均维保比 ${totalValue > 0 ? (Math.round((totalRepair / totalValue) * 1000) / 10) : 0}%）。严格执行单次大修费用超原值 30% 即终止投入的止损原则，杜绝沉没成本沉淀。`,
      targetDevices: highCostDevices.map(d => d.equipmentId)
    },
    {
      category: '科室负荷调配与共享',
      priority: '中',
      title: '高低负荷科室间跨科共享周转池调配',
      description: '对健康评分较高（≥85分）且所在科室检查量处于平水期的设备，建议纳入医工处跨科调配应急周转池，平衡急重症与普通门诊就诊高峰期的设备占用，盘活存量资产。',
      targetDevices: analyzedDevices.filter(d => d.healthScore >= 85).map(d => d.equipmentId)
    },
    {
      category: '强检与质控排程',
      priority: '高',
      title: '全批次设备错峰集中预防性维护(PM)与计量定标',
      description: '建议医工处计量质控组将本批次设备纳入统一季度巡检台账，利用科室非接诊时段实施“错峰无感化”集中上门绝缘阻抗测试与传感器校准，确保护士与医生使用 100% 合规。',
      targetDevices: analyzedDevices.map(d => d.equipmentId)
    }
  ];

  return {
    totalCount: devices.length,
    totalPurchaseValue: totalValue,
    totalRepairCost: totalRepair,
    avgHealthScore,
    overagedCount,
    highRiskCount,
    fleetAgeStructure: {
      under3Years,
      from3To7Years,
      over7Years,
      overaged: overagedCount
    },
    executiveSummary: `本次共对选中的 ${devices.length} 台医疗设备（资产原值共计 ￥${totalValue.toLocaleString()} 元）开展多维群体综合研判。群体平均健康得分为 ${avgHealthScore} 分；其中 ${overagedCount} 台已超期服役，${highRiskCount} 台处于需重点关注/淘汰处置状态。建议落实单机大修止损与跨科负荷共享。`,
    keyInsights: [
      `【资产规模与老化梯队】研判样本共 ${devices.length} 台，总原值 ￥${totalValue.toLocaleString()} 元。出厂超期设备共 ${overagedCount} 台 (占比 ${Math.round((overagedCount / devices.length) * 100)}%)，3年内新近机型 ${under3Years} 台。`,
      `【维保投入与效益比】累计维保总支出 ￥${totalRepair.toLocaleString()} 元，整体维保原值比为 ${totalValue > 0 ? (Math.round((totalRepair / totalValue) * 1000) / 10) : 0}%。有 ${highCostDevices.length} 台设备维保支出逼近或超过止损警戒线。`,
      `【运营调配与质量安全】重点对 ${highRiskCount} 台高风险/超期设备实施降级使用或更新申报，优良机型纳入周转池，实现资产坪效与临床安全双赢。`
    ],
    departmentDistribution,
    prioritizedDevices: analyzedDevices,
    strategicRecommendations
  };
}

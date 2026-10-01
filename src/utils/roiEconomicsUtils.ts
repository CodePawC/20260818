import { MedicalEquipment } from '../types';
import { 
  EquipmentFinancialProfile, 
  HospitalRoiOverviewStats, 
  EconomicQuadrantType, 
  MonthlyFinancialNode,
  RoiSimulationParams 
} from '../types/roiTypes';

/**
 * 医疗设备典型临床收费、人次与成本基准预设库
 */
interface ClinicalBenchmark {
  unitPrice: number;              // 单均收费标准 (元)
  monthlyExaminations: number;    // 标准月均工作量 (人次)
  ratedMonthlyCapacity: number;   // 额定月最大饱和工作量 (人次)
  consumableRate: number;         // 耗材试剂成本率
  annualUtilitiesRate: number;    // 能耗与场地分摊率 (按原值或固定额)
  annualLaborCost: number;        // 技师医护工时年均分摊 (元)
  depreciationYears: number;      // 推荐财务折旧年限 (年)
  insuranceRatio: number;         // 医保报销占比
}

export const CLINICAL_BENCHMARKS: Record<string, ClinicalBenchmark> = {
  'CT': {
    unitPrice: 280,
    monthlyExaminations: 850,
    ratedMonthlyCapacity: 1200,
    consumableRate: 0.18,
    annualUtilitiesRate: 0.03,
    annualLaborCost: 180000,
    depreciationYears: 8,
    insuranceRatio: 0.85
  },
  '磁共振': {
    unitPrice: 580,
    monthlyExaminations: 450,
    ratedMonthlyCapacity: 700,
    consumableRate: 0.15,
    annualUtilitiesRate: 0.04,
    annualLaborCost: 220000,
    depreciationYears: 8,
    insuranceRatio: 0.82
  },
  '超声': {
    unitPrice: 190,
    monthlyExaminations: 720,
    ratedMonthlyCapacity: 1000,
    consumableRate: 0.08,
    annualUtilitiesRate: 0.015,
    annualLaborCost: 140000,
    depreciationYears: 6,
    insuranceRatio: 0.90
  },
  'X射线': {
    unitPrice: 120,
    monthlyExaminations: 950,
    ratedMonthlyCapacity: 1500,
    consumableRate: 0.10,
    annualUtilitiesRate: 0.02,
    annualLaborCost: 120000,
    depreciationYears: 7,
    insuranceRatio: 0.88
  },
  '内窥镜': {
    unitPrice: 420,
    monthlyExaminations: 260,
    ratedMonthlyCapacity: 400,
    consumableRate: 0.22,
    annualUtilitiesRate: 0.018,
    annualLaborCost: 160000,
    depreciationYears: 6,
    insuranceRatio: 0.80
  },
  '血液透析': {
    unitPrice: 400,
    monthlyExaminations: 180,
    ratedMonthlyCapacity: 240,
    consumableRate: 0.35,
    annualUtilitiesRate: 0.025,
    annualLaborCost: 90000,
    depreciationYears: 6,
    insuranceRatio: 0.95
  },
  '呼吸机': {
    unitPrice: 350, // 每日/每时段治疗计费
    monthlyExaminations: 80,
    ratedMonthlyCapacity: 120,
    consumableRate: 0.15,
    annualUtilitiesRate: 0.01,
    annualLaborCost: 60000,
    depreciationYears: 6,
    insuranceRatio: 0.85
  },
  '监护仪': {
    unitPrice: 85,
    monthlyExaminations: 220,
    ratedMonthlyCapacity: 300,
    consumableRate: 0.06,
    annualUtilitiesRate: 0.008,
    annualLaborCost: 40000,
    depreciationYears: 5,
    insuranceRatio: 0.90
  },
  '高频电刀': {
    unitPrice: 180,
    monthlyExaminations: 95,
    ratedMonthlyCapacity: 150,
    consumableRate: 0.25,
    annualUtilitiesRate: 0.01,
    annualLaborCost: 50000,
    depreciationYears: 6,
    insuranceRatio: 0.85
  },
  '除颤': {
    unitPrice: 150,
    monthlyExaminations: 35,
    ratedMonthlyCapacity: 100,
    consumableRate: 0.05,
    annualUtilitiesRate: 0.005,
    annualLaborCost: 30000,
    depreciationYears: 6,
    insuranceRatio: 0.90
  },
  '生化': {
    unitPrice: 45,
    monthlyExaminations: 3500,
    ratedMonthlyCapacity: 5000,
    consumableRate: 0.40,
    annualUtilitiesRate: 0.02,
    annualLaborCost: 150000,
    depreciationYears: 6,
    insuranceRatio: 0.88
  },
  '默认': {
    unitPrice: 160,
    monthlyExaminations: 200,
    ratedMonthlyCapacity: 350,
    consumableRate: 0.15,
    annualUtilitiesRate: 0.015,
    annualLaborCost: 60000,
    depreciationYears: 6,
    insuranceRatio: 0.85
  }
};

/**
 * 根据设备名称与分类智能匹配基准参数
 */
function getBenchmarkForEquipment(equipment: MedicalEquipment): ClinicalBenchmark {
  const name = (equipment.name || '').toLowerCase();
  const category = (equipment.category || '').toLowerCase();
  const model = (equipment.model || '').toLowerCase();

  if (name.includes('ct') || model.includes('ct') || name.includes('计算机体层')) {
    return CLINICAL_BENCHMARKS['CT'];
  }
  if (name.includes('mr') || name.includes('磁共振') || model.includes('optima') || model.includes('mri')) {
    return CLINICAL_BENCHMARKS['磁共振'];
  }
  if (name.includes('超声') || name.includes('彩超') || category.includes('影像') && name.includes('探头')) {
    return CLINICAL_BENCHMARKS['超声'];
  }
  if (name.includes('x射线') || name.includes('dr') || name.includes('放射') || name.includes('胃肠机') || name.includes('c臂')) {
    return CLINICAL_BENCHMARKS['X射线'];
  }
  if (name.includes('内窥镜') || name.includes('腹腔镜') || name.includes('胃镜') || name.includes('肠镜') || name.includes('支气管镜')) {
    return CLINICAL_BENCHMARKS['内窥镜'];
  }
  if (name.includes('透析') || name.includes('血液净化')) {
    return CLINICAL_BENCHMARKS['血液透析'];
  }
  if (name.includes('呼吸机') || name.includes('麻醉机')) {
    return CLINICAL_BENCHMARKS['呼吸机'];
  }
  if (name.includes('监护仪') || name.includes('心电监护') || name.includes('遥测')) {
    return CLINICAL_BENCHMARKS['监护仪'];
  }
  if (name.includes('高频电刀') || name.includes('能量平台') || name.includes('超声刀')) {
    return CLINICAL_BENCHMARKS['高频电刀'];
  }
  if (name.includes('除颤') || name.includes('aed')) {
    return CLINICAL_BENCHMARKS['除颤'];
  }
  if (name.includes('生化') || name.includes('检验') || name.includes('血球') || name.includes('发光')) {
    return CLINICAL_BENCHMARKS['生化'];
  }
  
  return CLINICAL_BENCHMARKS['默认'];
}

/**
 * 获取估算合理采购原值（如果台账中未录入或为0）
 */
export function estimateRealisticPurchasePrice(equipment: MedicalEquipment): number {
  if (equipment.purchasePrice && equipment.purchasePrice > 0) {
    return equipment.purchasePrice;
  }
  const name = equipment.name || '';
  const model = equipment.model || '';

  if (name.includes('CT') || model.includes('CT')) return 4800000;
  if (name.includes('磁共振') || name.includes('MR')) return 8500000;
  if (name.includes('超声') || name.includes('彩超')) return 1200000;
  if (name.includes('DR') || name.includes('X射线') || name.includes('C臂')) return 980000;
  if (name.includes('内窥镜') || name.includes('腔镜')) return 1650000;
  if (name.includes('麻醉机')) return 420000;
  if (name.includes('呼吸机')) return 260000;
  if (name.includes('高频电刀')) return 180000;
  if (name.includes('透析机')) return 220000;
  if (name.includes('除颤仪')) return 85000;
  if (name.includes('心电图机')) return 35000;
  if (name.includes('监护仪')) return 45000;
  if (name.includes('注射泵') || name.includes('输液泵')) return 12000;
  
  return 80000;
}

/**
 * 计算单台设备全生命周期财务成本效益画像
 */
export function calculateEquipmentFinancialProfile(equipment: MedicalEquipment): EquipmentFinancialProfile {
  const benchmark = getBenchmarkForEquipment(equipment);
  const purchasePrice = estimateRealisticPurchasePrice(equipment);

  // 服役时间计算
  let serviceYears = 1.5;
  const enableDateStr = equipment.enableDate || equipment.purchaseDate || '2022-01-01';
  try {
    const enableTime = new Date(enableDateStr.replace(/\//g, '-')).getTime();
    const now = new Date('2026-08-26').getTime();
    if (!isNaN(enableTime) && enableTime > 0) {
      const diffYears = (now - enableTime) / (1000 * 60 * 60 * 24 * 365.25);
      serviceYears = Math.max(0.3, Math.min(18, parseFloat(diffYears.toFixed(1))));
    }
  } catch {
    serviceYears = 2.5;
  }

  const depreciationYears = benchmark.depreciationYears || 8;
  const salvageRate = 0.05; // 5% 残值率
  
  // 折旧计算 (直线法)
  const depreciableBase = purchasePrice * (1 - salvageRate);
  const annualDepreciation = Math.round(depreciableBase / depreciationYears);
  const cumulativeDepreciation = Math.min(
    depreciableBase,
    Math.round(annualDepreciation * serviceYears)
  );
  const netAssetValue = Math.max(
    purchasePrice * salvageRate,
    purchasePrice - cumulativeDepreciation
  );

  // 维修与保养支出 (基于真实 repairRecords)
  const repairRecords = equipment.repairRecords || [];
  const cumulativeMaintenanceCost = repairRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
  const annualMaintenanceCost = serviceYears > 0 
    ? Math.round(cumulativeMaintenanceCost / serviceYears)
    : cumulativeMaintenanceCost;

  // 运行状态与稼动率影响工作量
  let statusFactor = 1.0;
  if (equipment.status === '故障待修') statusFactor = 0.45;
  else if (equipment.status === '维护保养中') statusFactor = 0.75;
  else if (equipment.status === '停用/报废') statusFactor = 0.05;

  // 结合设备规模微调工作量
  const scaleMultiplier = purchasePrice > 3000000 ? 1.25 : (purchasePrice < 50000 ? 0.8 : 1.0);
  const monthlyExaminations = Math.round(benchmark.monthlyExaminations * statusFactor * scaleMultiplier);
  const ratedMonthlyCapacity = Math.round(benchmark.ratedMonthlyCapacity * scaleMultiplier);
  const capacityUtilization = Math.min(100, Math.round((monthlyExaminations / ratedMonthlyCapacity) * 100));

  const unitPrice = benchmark.unitPrice;
  const medicalInsuranceRatio = benchmark.insuranceRatio;

  // 业务收入计算
  const annualGrossRevenue = Math.round(monthlyExaminations * 12 * unitPrice);
  const cumulativeGrossRevenue = Math.round(annualGrossRevenue * serviceYears);

  // 耗材试剂、动力能耗、人力成本
  const consumableRate = benchmark.consumableRate;
  const annualConsumableCost = Math.round(annualGrossRevenue * consumableRate);
  const cumulativeConsumableCost = Math.round(annualConsumableCost * serviceYears);

  const annualUtilitiesAndSpace = Math.round(purchasePrice * benchmark.annualUtilitiesRate + 12000);
  const annualLaborCost = benchmark.annualLaborCost;

  // 运营全成本
  const annualTotalCost = annualDepreciation + annualMaintenanceCost + annualConsumableCost + annualUtilitiesAndSpace + annualLaborCost;
  const cumulativeTotalCost = cumulativeDepreciation + cumulativeMaintenanceCost + cumulativeConsumableCost + Math.round((annualUtilitiesAndSpace + annualLaborCost) * serviceYears);

  // 收益与 ROI
  const annualNetProfit = annualGrossRevenue - annualTotalCost;
  const cumulativeNetProfit = cumulativeGrossRevenue - cumulativeTotalCost;

  // 年化 ROI = (年净利润 / 采购原值) * 100
  const annualRoi = purchasePrice > 0 ? parseFloat(((annualNetProfit / purchasePrice) * 100).toFixed(1)) : 0;
  const cumulativeRoi = purchasePrice > 0 ? parseFloat(((cumulativeNetProfit / purchasePrice) * 100).toFixed(1)) : 0;

  // 投资回收周期 Payback Period (年) = 初始投资 / (年净利润 + 年折旧 现金流入)
  const annualCashInflow = annualNetProfit + annualDepreciation;
  let paybackYears = 99;
  if (annualCashInflow > 0) {
    paybackYears = parseFloat((purchasePrice / annualCashInflow).toFixed(1));
  }
  const isPaybackCompleted = cumulativeNetProfit >= 0 || serviceYears >= paybackYears;
  const paybackProgressPercent = Math.min(100, Math.max(5, Math.round((serviceYears / Math.max(0.5, paybackYears)) * 100)));

  // 保本工作量 Break-Even Volume (人次/月)
  // 固定月成本 = (年折旧 + 年维保 + 年场地能耗 + 年人工) / 12
  // 单次边际贡献 = 单均收费 * (1 - 耗材率)
  const fixedMonthlyCost = (annualDepreciation + annualMaintenanceCost + annualUtilitiesAndSpace + annualLaborCost) / 12;
  const unitContribution = unitPrice * (1 - consumableRate);
  const breakEvenMonthlyVolume = unitContribution > 0 ? Math.ceil(fixedMonthlyCost / unitContribution) : 0;

  // 百元固定资产创收率 = (年总收入 / 资产原值) * 100
  const revenuePer100Asset = purchasePrice > 0 ? parseFloat(((annualGrossRevenue / purchasePrice) * 100).toFixed(1)) : 0;

  // 经济学象限与结论研判
  let quadrant: EconomicQuadrantType = 'star';
  let quadrantLabel = '🌟 明星高效设备';
  let quadrantDescription = '高临床收益、高负荷利用、低维保消耗，处于投资回报黄金期。';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let managementAdvice = '建议保持标准预防性维护（PM），合理排班保障临床运行，持续发挥高收益效能。';

  if (equipment.status === '停用/报废' || (annualNetProfit < 0 && serviceYears >= depreciationYears)) {
    quadrant = 'loss_scrap';
    quadrantLabel = '🚨 亏损报废风险';
    quadrantDescription = '设备超期或年运营全成本超过业务收入，维保配件消耗过大。';
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    managementAdvice = '建议组织医学装备委员会启动残值清算与报废鉴定程序，评估新一代机型采购置换。';
  } else if (cumulativeMaintenanceCost > purchasePrice * 0.4 || (annualMaintenanceCost > annualGrossRevenue * 0.35)) {
    quadrant = 'heavy_maintenance';
    quadrantLabel = '⚠️ 高耗重载预警';
    quadrantDescription = '业务量虽然尚可，但因核心部件老化，累计维保和配件支出异常偏高。';
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    managementAdvice = '建议与原厂协商购买维保全保协议控制单次维修风险，或排查操作规范以减少故障率。';
  } else if (capacityUtilization < 35 || (monthlyExaminations < breakEvenMonthlyVolume && purchasePrice > 200000)) {
    quadrant = 'underutilized';
    quadrantLabel = '💤 闲置低效资产';
    quadrantDescription = '临床检查人次未达保本点，设备长期处于低负荷或待机闲置状态。';
    badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    managementAdvice = '建议纳入全院应急调配共享池，跨科室调配使用或开辟多学科共享诊疗，提高资产周转率。';
  } else if (isPaybackCompleted) {
    quadrant = 'cash_cow';
    quadrantLabel = '💰 稳定高产机型';
    quadrantDescription = '初始采购投资已全部收回，设备处于持续贡献纯现金流的优质运营阶段。';
    badgeClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
    managementAdvice = '加强日常巡检与核心易损件监测，延缓设备精度衰减，延长高利润服役周期。';
  }

  // 模拟生成近 12 个月收支时序数据
  const monthsList = [
    '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04',
    '2026-05', '2026-06', '2026-07', '2026-08'
  ];

  let rollingCumulativeProfit = cumulativeNetProfit - annualNetProfit;
  const monthlyHistory: MonthlyFinancialNode[] = monthsList.map((m, idx) => {
    // 季节性波动系数 (春节月稍低、秋季稍高)
    const seasonalFactor = (idx === 5) ? 0.78 : (idx >= 8 ? 1.08 : 0.98);
    const vol = Math.round(monthlyExaminations * seasonalFactor);
    const rev = Math.round(vol * unitPrice);
    const dep = Math.round(annualDepreciation / 12);
    // 随机关联部分真实月份的维修费用
    const monthMaint = (idx === 2 || idx === 8) ? Math.round(annualMaintenanceCost * 0.4) : Math.round(annualMaintenanceCost / 12 * 0.4);
    const cons = Math.round(rev * consumableRate);
    const utilLabor = Math.round((annualUtilitiesAndSpace + annualLaborCost) / 12);
    const totCost = dep + monthMaint + cons + utilLabor;
    const profit = rev - totCost;
    rollingCumulativeProfit += profit;

    return {
      month: m,
      volume: vol,
      grossRevenue: rev,
      depreciationCost: dep,
      maintenanceCost: monthMaint,
      consumableCost: cons,
      utilitiesLaborCost: utilLabor,
      totalCost: totCost,
      netProfit: profit,
      cumulativeProfit: rollingCumulativeProfit
    };
  });

  return {
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    equipmentModel: equipment.model,
    equipmentSn: equipment.sn,
    department: equipment.department,
    category: equipment.category,
    purchaseDate: equipment.purchaseDate || equipment.enableDate || '2022-01-01',
    purchasePrice,
    serviceYears,
    depreciationYears,
    salvageRate,
    monthlyExaminations,
    ratedMonthlyCapacity,
    unitPrice,
    medicalInsuranceRatio,
    annualGrossRevenue,
    cumulativeGrossRevenue,
    annualDepreciation,
    cumulativeDepreciation,
    netAssetValue,
    annualMaintenanceCost,
    cumulativeMaintenanceCost,
    consumableRate,
    annualConsumableCost,
    cumulativeConsumableCost,
    annualUtilitiesAndSpace,
    annualLaborCost,
    annualTotalCost,
    cumulativeTotalCost,
    annualNetProfit,
    cumulativeNetProfit,
    annualRoi,
    cumulativeRoi,
    paybackYears,
    isPaybackCompleted,
    paybackProgressPercent,
    breakEvenMonthlyVolume,
    revenuePer100Asset,
    capacityUtilization,
    quadrant,
    quadrantLabel,
    quadrantDescription,
    badgeClass,
    managementAdvice,
    monthlyHistory
  };
}

/**
 * 汇总计算全院设备 ROI 与运营指标大盘
 */
export function calculateHospitalRoiOverview(equipmentList: MedicalEquipment[]): HospitalRoiOverviewStats {
  const profiles = equipmentList.map(eq => calculateEquipmentFinancialProfile(eq));

  let totalAssetValue = 0;
  let totalAnnualRevenue = 0;
  let totalAnnualNetProfit = 0;
  let starCount = 0;
  let idleCount = 0;
  let lossCount = 0;
  let sumPayback = 0;
  let validPaybackCount = 0;

  const deptRevenueMap: Record<string, number> = {};
  let highestRoi = -999;
  let topRoiEquipmentName = '64排螺旋CT (GE Revolution)';

  profiles.forEach(p => {
    totalAssetValue += p.purchasePrice;
    totalAnnualRevenue += p.annualGrossRevenue;
    totalAnnualNetProfit += p.annualNetProfit;

    if (p.quadrant === 'star' || p.quadrant === 'cash_cow') starCount++;
    if (p.quadrant === 'underutilized') idleCount++;
    if (p.quadrant === 'loss_scrap') lossCount++;

    if (p.paybackYears > 0 && p.paybackYears < 30) {
      sumPayback += p.paybackYears;
      validPaybackCount++;
    }

    deptRevenueMap[p.department] = (deptRevenueMap[p.department] || 0) + p.annualGrossRevenue;

    if (p.annualRoi > highestRoi && p.purchasePrice >= 50000) {
      highestRoi = p.annualRoi;
      topRoiEquipmentName = `${p.equipmentName} (${p.department} · ROI ${p.annualRoi}%)`;
    }
  });

  const averageHospitalRoi = totalAssetValue > 0 
    ? parseFloat(((totalAnnualNetProfit / totalAssetValue) * 100).toFixed(1))
    : 0;

  const averagePaybackYears = validPaybackCount > 0 
    ? parseFloat((sumPayback / validPaybackCount).toFixed(1))
    : 3.8;

  let topRevenueDepartment = '医学影像科 / 放射科';
  let maxDeptRev = 0;
  Object.entries(deptRevenueMap).forEach(([dept, rev]) => {
    if (rev > maxDeptRev) {
      maxDeptRev = rev;
      topRevenueDepartment = dept;
    }
  });

  return {
    totalAssetValue,
    totalAnnualRevenue,
    totalAnnualNetProfit,
    averageHospitalRoi,
    averagePaybackYears,
    starEquipmentCount: starCount,
    idleWarningCount: idleCount,
    lossWarningCount: lossCount,
    topRevenueDepartment,
    topRoiEquipmentName
  };
}

/**
 * 效益沙盘推演模型 (What-If ROI Simulation)
 */
export function simulateEquipmentRoi(
  profile: EquipmentFinancialProfile, 
  params: RoiSimulationParams
) {
  const workloadMultiplier = 1 + (params.workloadDeltaPercent / 100);
  const simulatedVolume = Math.round(profile.monthlyExaminations * workloadMultiplier);
  const simulatedUnitPrice = Math.max(10, profile.unitPrice + params.unitPriceAdjust);
  const simulatedConsumableRate = Math.max(0.02, Math.min(0.6, profile.consumableRate + (params.consumableRateAdjust / 100)));

  // 新的年总收入
  const simulatedAnnualRevenue = Math.round(simulatedVolume * 12 * simulatedUnitPrice);
  const simulatedConsumableCost = Math.round(simulatedAnnualRevenue * simulatedConsumableRate);

  // 维保方案调整
  let simulatedMaintenanceCost = profile.annualMaintenanceCost;
  if (params.annualMaintenancePlan === 'preventive_extended') {
    simulatedMaintenanceCost = Math.round(profile.purchasePrice * 0.04); // 购买原厂全保，年支出固定4%
  } else if (params.annualMaintenancePlan === 'minimal') {
    simulatedMaintenanceCost = Math.round(profile.annualMaintenanceCost * 0.6); // 极简维保
  }

  const simulatedTotalCost = profile.annualDepreciation + simulatedMaintenanceCost + simulatedConsumableCost + profile.annualUtilitiesAndSpace + profile.annualLaborCost;
  const simulatedAnnualProfit = simulatedAnnualRevenue - simulatedTotalCost;
  const simulatedAnnualRoi = profile.purchasePrice > 0 
    ? parseFloat(((simulatedAnnualProfit / profile.purchasePrice) * 100).toFixed(1)) 
    : 0;

  const simulatedCashInflow = simulatedAnnualProfit + profile.annualDepreciation;
  let simulatedPaybackYears = 99;
  if (simulatedCashInflow > 0) {
    simulatedPaybackYears = parseFloat((profile.purchasePrice / simulatedCashInflow).toFixed(1));
  }

  const fixedMonthlyCost = (profile.annualDepreciation + simulatedMaintenanceCost + profile.annualUtilitiesAndSpace + profile.annualLaborCost) / 12;
  const unitContribution = simulatedUnitPrice * (1 - simulatedConsumableRate);
  const simulatedBreakEvenVolume = unitContribution > 0 ? Math.ceil(fixedMonthlyCost / unitContribution) : 0;

  const deltaProfit = simulatedAnnualProfit - profile.annualNetProfit;

  return {
    simulatedVolume,
    simulatedAnnualRevenue,
    simulatedAnnualProfit,
    simulatedPaybackYears,
    simulatedAnnualRoi,
    simulatedBreakEvenVolume,
    deltaProfit
  };
}

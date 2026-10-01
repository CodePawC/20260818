import { MedicalEquipment } from '../types';
import { estimateRealisticPurchasePrice } from './roiEconomicsUtils';

export type BudgetWarningLevel = 'exceeded' | 'approaching' | 'normal';

export interface EquipmentBudgetExecutionProfile {
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  internalNo: string;
  assetNo: string;
  department: string;
  status: string;
  purchasePrice: number;
  enableDate: string;
  
  // 寿命维度
  expectedLifespanYears: number;   // 预期使用寿命 (年)
  serviceYears: number;            // 实际已服役年限 (年)
  remainingYears: number;          // 剩余使用年限 (年, >=0)
  lifeElapsedRate: number;         // 寿命已逝比例 (0 - 100+ %)
  
  // 折旧维度
  depreciationYears: number;       // 财务折旧年限 (年)
  depreciationProgressRate: number;// 实际折旧进度 (0 - 100 %)
  cumulativeDepreciationAmount: number; // 累计已折旧金额 (元)
  netAssetValue: number;           // 账面净额 / 资产残值 (元)
  
  // 预算执行维度
  totalMaintenanceCost: number;    // 累计实际维修与维保支出 (元)
  maintenanceBudgetCeiling: number;// 全生命周期维保预算上限 (元, 原值 40%)
  stageBudgetQuota: number;        // 阶段折旧配额上限 (元)
  budgetExecutionRate: number;     // 预算执行率 (0 - 100+ %)
  remainingBudget: number;         // 剩余可用预算额度 (元)
  
  // 预警研判
  warningLevel: BudgetWarningLevel;// 'exceeded' | 'approaching' | 'normal'
  warningLabel: string;            // '触及预算上限' | '即将触及上限' | '预算受控健康'
  budgetVsDepreciationGap: number; // 预算执行率与折旧进度的差值百分比 (正数表示预算消耗快于折旧)
  riskDiagnostic: string;          // 临床管理决策研判结论
}

export interface BudgetExecutionOverviewStats {
  totalEquipmentCount: number;
  exceededCount: number;           // 已触及/超出预算上限台数
  approachingCount: number;        // 即将触及预算上限台数 (临界预警)
  normalCount: number;             // 预算受控健康台数
  totalBudgetCeiling: number;      // 全院总预算上限额 (元)
  totalMaintenanceSpent: number;   // 全院已支出维保金额 (元)
  averageExecutionRate: number;    // 全院平均预算执行率 (%)
  averageDepreciationRate: number; // 全院平均折旧进度 (%)
  highRiskDepartmentCounts: Record<string, { total: number; warning: number; cost: number }>;
}

/**
 * 获取设备标称预期使用寿命 (年)
 */
export function getExpectedLifespan(equipment: MedicalEquipment): number {
  if (equipment.overdueFiling?.originalLifespanYears && equipment.overdueFiling.originalLifespanYears > 0) {
    return equipment.overdueFiling.originalLifespanYears;
  }
  
  if (equipment.productValidity) {
    const parsed = parseFloat(equipment.productValidity.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
      return parsed;
    }
  }

  const name = (equipment.name || '').toLowerCase();
  const model = (equipment.model || '').toLowerCase();
  const category = (equipment.category || '').toLowerCase();

  // 大型高价值重型装备
  if (name.includes('ct') || model.includes('ct') || name.includes('磁共振') || name.includes('血管造影') || name.includes('dr')) {
    return 10;
  }
  // 彩超、内窥镜系统
  if (name.includes('超声') || name.includes('内窥镜') || name.includes('腹腔镜') || name.includes('生化')) {
    return 8;
  }
  // 呼吸麻醉、高频手术设备、透析
  if (name.includes('呼吸机') || name.includes('麻醉机') || name.includes('高频电刀') || name.includes('透析')) {
    return 6;
  }
  // 监护、除颤、注射泵常规仪器
  if (name.includes('监护') || name.includes('除颤') || name.includes('泵') || name.includes('心电图')) {
    return 5;
  }

  return 8;
}

/**
 * 计算单台设备的预算执行与折旧预警画像
 */
export function calculateEquipmentBudgetProfile(equipment: MedicalEquipment): EquipmentBudgetExecutionProfile {
  const purchasePrice = estimateRealisticPurchasePrice(equipment);
  const expectedLifespanYears = getExpectedLifespan(equipment);
  const depreciationYears = Math.min(expectedLifespanYears, 8); // 医院通用财务折旧年限，最长一般不超过8年

  // 计算已服役年限
  const enableDateStr = equipment.enableDate || equipment.purchaseDate || equipment.manufactureDate || '2021-01-01';
  let serviceYears = 2.5;
  try {
    const enableTime = new Date(enableDateStr.replace(/\//g, '-')).getTime();
    const refDate = new Date('2026-09-08').getTime();
    if (!isNaN(enableTime) && enableTime > 0) {
      const diff = (refDate - enableTime) / (1000 * 60 * 60 * 24 * 365.25);
      serviceYears = Math.max(0.2, parseFloat(diff.toFixed(1)));
    }
  } catch {
    serviceYears = 2.5;
  }

  // 1. 寿命进度
  const lifeElapsedRate = parseFloat(((serviceYears / expectedLifespanYears) * 100).toFixed(1));

  // 2. 财务折旧进度与累计折旧金额 (5% 残值率 直线折旧)
  const salvageRate = 0.05;
  const depreciableBase = purchasePrice * (1 - salvageRate);
  const annualDepreciation = depreciableBase / depreciationYears;
  const cumulativeDepreciationAmount = Math.min(
    depreciableBase,
    Math.round(annualDepreciation * serviceYears)
  );
  const depreciationProgressRate = parseFloat(
    (Math.min(100, (serviceYears / depreciationYears) * 100)).toFixed(1)
  );
  const netAssetValue = Math.max(
    Math.round(purchasePrice * salvageRate),
    Math.round(purchasePrice - cumulativeDepreciationAmount)
  );

  // 3. 累计实际维修与维保支出计算
  // 优先汇总真实的报修与整修记录；若台账历史工单缺失，则结合服役年限、运行状态与超期备案进行公立医院基准测算
  const repairRecords = equipment.repairRecords || [];
  let recordedCost = repairRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
  if (equipment.overdueFiling?.refurbishCost) {
    recordedCost += equipment.overdueFiling.refurbishCost;
  }

  // 维保预算上限基准 (医院公立标准：设备采购原值的 40% 为经济控制上限，50% 为报废警戒红线)
  const BUDGET_CEILING_RATIO = 0.40;
  const maintenanceBudgetCeiling = Math.max(8000, Math.round(purchasePrice * BUDGET_CEILING_RATIO));

  let totalMaintenanceCost = recordedCost;

  // 结合全生命周期实际折旧进度与运维频度进行数据拟合校验
  if (totalMaintenanceCost === 0 || (totalMaintenanceCost < purchasePrice * 0.05 && serviceYears > 3)) {
    if (equipment.overdueFiling || serviceYears >= expectedLifespanYears) {
      // 超期服役老旧设备：累计维保通常已达到原值 36%~46% (触及或濒临预算上限)
      const factor = equipment.status === '故障待修' ? 0.42 : 0.37;
      totalMaintenanceCost = Math.max(recordedCost, Math.round(purchasePrice * factor));
    } else if (equipment.status === '故障待修') {
      // 故障待修设备：因突发大修或高频损耗，预算执行迅速攀升
      totalMaintenanceCost = Math.max(recordedCost, Math.round(purchasePrice * 0.33));
    } else if (equipment.status === '维护保养中') {
      totalMaintenanceCost = Math.max(recordedCost, Math.round(purchasePrice * 0.28));
    } else if (equipment.repairCount > 1) {
      // 多次报修设备
      totalMaintenanceCost = Math.max(recordedCost, Math.round(purchasePrice * 0.07 * equipment.repairCount));
    } else {
      // 正常服役设备按年化 2.5%~3% 维护基准递增
      const annualMaintRatio = 0.026;
      totalMaintenanceCost = Math.max(
        recordedCost,
        Math.round(purchasePrice * annualMaintRatio * Math.min(serviceYears, expectedLifespanYears))
      );
    }
  }

  const stageBudgetQuota = Math.round(maintenanceBudgetCeiling * Math.min(1, depreciationProgressRate / 100));

  // 4. 预算执行率
  const budgetExecutionRate = maintenanceBudgetCeiling > 0
    ? parseFloat(((totalMaintenanceCost / maintenanceBudgetCeiling) * 100).toFixed(1))
    : 0;

  const remainingBudget = Math.max(0, maintenanceBudgetCeiling - totalMaintenanceCost);

  // 5. 预算与折旧进度的剪刀差 (Gap)
  // 若 Gap > 15%，说明预算消耗严重快于折旧节奏；若 Gap < -15%，说明运行极其稳健
  const budgetVsDepreciationGap = parseFloat((budgetExecutionRate - depreciationProgressRate).toFixed(1));

  // 6. 预警判定逻辑
  // A. 触及预算上限 (exceeded):
  //    预算执行率 >= 90% 或 累计维修超原值 36%
  // B. 即将触及预算上限 (approaching):
  //    预算执行率 70% ~ 89.9% 之间；
  //    或者折旧进度未半 (<55%) 但预算消耗已超 50% (严重早衰)；
  //    或者折旧进度 >80% 且预算执行率 >= 65% (濒临报废更新临界)
  // C. 预算受控健康 (normal):
  //    预算执行率 < 70% 且无异常早衰
  let warningLevel: BudgetWarningLevel = 'normal';
  let warningLabel = '预算受控健康';
  let riskDiagnostic = '维保预算支出处于受控安全区间，折旧节奏与运行损耗处于健康平衡状态。';

  if (budgetExecutionRate >= 90 || totalMaintenanceCost >= purchasePrice * 0.36) {
    warningLevel = 'exceeded';
    warningLabel = '触及预算上限';
    riskDiagnostic = `累计维修支出达 ￥${totalMaintenanceCost.toLocaleString()}，已触及全生命周期预算上限（执行率 ${budgetExecutionRate}%）。经济维修价值即将耗尽，建议停止继续大修换件，启动技术改造论证或更新提请。`;
  } else if (
    budgetExecutionRate >= 70 || 
    (depreciationProgressRate < 55 && budgetExecutionRate >= 50) ||
    (depreciationProgressRate >= 80 && budgetExecutionRate >= 65)
  ) {
    warningLevel = 'approaching';
    warningLabel = '即将触及上限';
    if (depreciationProgressRate < 55 && budgetExecutionRate >= 50) {
      riskDiagnostic = `异常早期损耗预警：设备折旧进度仅 ${depreciationProgressRate}%，但预算消耗已达 ${budgetExecutionRate}%（超前 +${budgetVsDepreciationGap}%），存在故障多发与费用穿透风险！`;
    } else {
      riskDiagnostic = `预算执行率已达 ${budgetExecutionRate}%，剩余可用预算仅 ￥${remainingBudget.toLocaleString()}。即将逼近原值40%控制上限，需严审单次大修与配件费用。`;
    }
  }

  const remainingYears = Math.max(0, parseFloat((expectedLifespanYears - serviceYears).toFixed(1)));

  return {
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    equipmentModel: equipment.model,
    internalNo: equipment.internalNo || equipment.id,
    assetNo: equipment.assetNo || `ZC-${equipment.id}`,
    department: equipment.department,
    status: equipment.status,
    purchasePrice,
    enableDate: enableDateStr,
    expectedLifespanYears,
    serviceYears,
    remainingYears,
    lifeElapsedRate,
    depreciationYears,
    depreciationProgressRate,
    cumulativeDepreciationAmount,
    netAssetValue,
    totalMaintenanceCost,
    maintenanceBudgetCeiling,
    stageBudgetQuota,
    budgetExecutionRate,
    remainingBudget,
    warningLevel,
    warningLabel,
    budgetVsDepreciationGap,
    riskDiagnostic
  };
}

/**
 * 资产价值衰减轨迹与折旧趋势数据点
 */
export interface DepreciationTrajectoryPoint {
  year: number;                    // 自然年份 (如 2020, 2021 ... 2026 ... 2028)
  yearLabel: string;               // X轴标签 (如 '2021年 (第2年)')
  stage: 'past' | 'current' | 'future'; // 历史服役期 / 当前节点 / 剩余使用年限期
  serviceAge: number;              // 服役年数 (0, 1, 2...)
  netAssetValue: number;           // 账面净值 (元)
  netAssetValueWan: number;        // 账面净值 (万元)
  cumulativeDepreciation: number;  // 累计折旧额 (元)
  cumulativeDepreciationWan: number;// 累计折旧额 (万元)
  maintenanceCost: number;         // 累计维保支出 (元)
  maintenanceCostWan: number;      // 累计维保支出 (万元)
  budgetCeiling: number;           // 40% 维保控制上限 (元)
  budgetCeilingWan: number;        // 40% 维保控制上限 (万元)
  salvageValue: number;            // 5% 净残值底线 (元)
  salvageValueWan: number;         // 5% 净残值底线 (万元)
  isCurrentNode: boolean;          // 是否当前2026年时点
  isInversion: boolean;            // 维保支出是否已超账面净值 (价值倒挂)
}

/**
 * 基于剩余使用年限与历史折旧，生成单台设备的资产价值衰减轨迹
 */
export function generateEquipmentDepreciationTrajectory(profile: EquipmentBudgetExecutionProfile): DepreciationTrajectoryPoint[] {
  const purchasePrice = profile.purchasePrice;
  const salvageRate = 0.05;
  const salvageValue = Math.round(purchasePrice * salvageRate);
  const depreciableBase = purchasePrice * (1 - salvageRate);
  const depYears = profile.depreciationYears || 8;
  const annualDep = depreciableBase / depYears;
  const budgetCeiling = profile.maintenanceBudgetCeiling;

  // 获取设备启用年份与当前年份
  let enableYear = 2021;
  try {
    const parsedYear = parseInt((profile.enableDate || '').slice(0, 4), 10);
    if (!isNaN(parsedYear) && parsedYear >= 2005 && parsedYear <= 2026) {
      enableYear = parsedYear;
    }
  } catch {
    enableYear = 2021;
  }

  const currentYear = 2026;
  const currentServiceAge = Math.max(0, currentYear - enableYear);
  // 衰减轨迹终点：涵盖设计寿命以及剩余使用年限加持期
  const totalLifetime = Math.max(
    profile.expectedLifespanYears,
    currentServiceAge + Math.max(1, Math.ceil(profile.remainingYears))
  );
  const endYear = enableYear + totalLifetime;

  const points: DepreciationTrajectoryPoint[] = [];

  // 计算年均维保增速（用于外推未来剩余寿命期间的维保支出）
  const historicalAnnualMaintenance = currentServiceAge > 0
    ? profile.totalMaintenanceCost / currentServiceAge
    : profile.totalMaintenanceCost * 0.3;
  // 老旧期维保递增系数 (年均递增 8%~12%)
  const futureAnnualMaintenance = Math.max(historicalAnnualMaintenance * 1.1, purchasePrice * 0.035);

  for (let y = enableYear; y <= endYear; y++) {
    const age = y - enableYear;
    const isCurrentNode = (y === currentYear);
    const stage: 'past' | 'current' | 'future' = 
      y < currentYear ? 'past' : (y === currentYear ? 'current' : 'future');

    // 资产净值计算 (直线折旧至 5% 残值，超期后锁定在 5% 残值)
    let netVal = purchasePrice;
    let cumDep = 0;
    if (age <= 0) {
      netVal = purchasePrice;
      cumDep = 0;
    } else if (age >= depYears) {
      netVal = salvageValue;
      cumDep = depreciableBase;
    } else {
      cumDep = Math.round(age * annualDep);
      netVal = Math.max(salvageValue, Math.round(purchasePrice - cumDep));
    }

    // 累计维保支出计算 (历史拟合 + 当前实际 + 未来剩余年限预测)
    let maint = 0;
    if (y < currentYear) {
      // 历史平滑曲线
      const ratio = currentServiceAge > 0 ? (age / currentServiceAge) ** 1.3 : 0;
      maint = Math.round(profile.totalMaintenanceCost * ratio);
    } else if (y === currentYear) {
      maint = profile.totalMaintenanceCost;
    } else {
      // 预测未来剩余使用年限期间维保累积
      const futureYearsElapsed = y - currentYear;
      maint = Math.round(profile.totalMaintenanceCost + futureYearsElapsed * futureAnnualMaintenance);
    }

    const isInversion = maint >= netVal;

    let yearLabel = `${y}年`;
    if (isCurrentNode) {
      yearLabel = `${y}年(当前)`;
    } else if (age === 0) {
      yearLabel = `${y}年(启用)`;
    } else if (age === profile.expectedLifespanYears) {
      yearLabel = `${y}年(标称寿命)`;
    }

    points.push({
      year: y,
      yearLabel,
      stage,
      serviceAge: age,
      netAssetValue: netVal,
      netAssetValueWan: parseFloat((netVal / 10000).toFixed(2)),
      cumulativeDepreciation: cumDep,
      cumulativeDepreciationWan: parseFloat((cumDep / 10000).toFixed(2)),
      maintenanceCost: maint,
      maintenanceCostWan: parseFloat((maint / 10000).toFixed(2)),
      budgetCeiling,
      budgetCeilingWan: parseFloat((budgetCeiling / 10000).toFixed(2)),
      salvageValue,
      salvageValueWan: parseFloat((salvageValue / 10000).toFixed(2)),
      isCurrentNode,
      isInversion
    });
  }

  return points;
}

/**
 * 生成全院预警设备群组的综合资产价值衰减轨迹 (归一化/加总)
 */
export function generateCohortDepreciationTrajectory(warningProfiles: EquipmentBudgetExecutionProfile[]): DepreciationTrajectoryPoint[] {
  if (!warningProfiles || warningProfiles.length === 0) {
    return [];
  }

  const startYear = 2018;
  const currentYear = 2026;
  const endYear = 2030;

  // 聚合各年份的数据
  const points: DepreciationTrajectoryPoint[] = [];

  for (let y = startYear; y <= endYear; y++) {
    let totalNetValue = 0;
    let totalDepreciation = 0;
    let totalMaintenance = 0;
    let totalBudgetCeiling = 0;
    let totalSalvage = 0;

    warningProfiles.forEach(p => {
      const traj = generateEquipmentDepreciationTrajectory(p);
      const matched = traj.find(pt => pt.year === y);
      if (matched) {
        totalNetValue += matched.netAssetValue;
        totalDepreciation += matched.cumulativeDepreciation;
        totalMaintenance += matched.maintenanceCost;
        totalBudgetCeiling += matched.budgetCeiling;
        totalSalvage += matched.salvageValue;
      } else {
        // 若超出其时间范围，以最后值推导
        const lastPt = traj[traj.length - 1];
        const firstPt = traj[0];
        if (y > traj[traj.length - 1].year) {
          totalNetValue += lastPt.salvageValue;
          totalDepreciation += lastPt.cumulativeDepreciation;
          totalMaintenance += lastPt.maintenanceCost;
          totalBudgetCeiling += lastPt.budgetCeiling;
          totalSalvage += lastPt.salvageValue;
        } else if (y < traj[0].year) {
          totalNetValue += firstPt.netAssetValue;
          totalDepreciation += 0;
          totalMaintenance += 0;
          totalBudgetCeiling += firstPt.budgetCeiling;
          totalSalvage += firstPt.salvageValue;
        }
      }
    });

    const isCurrentNode = (y === currentYear);
    const stage = y < currentYear ? 'past' : (y === currentYear ? 'current' : 'future');

    let yearLabel = `${y}年`;
    if (isCurrentNode) yearLabel = `${y}年(当前)`;

    points.push({
      year: y,
      yearLabel,
      stage,
      serviceAge: y - startYear,
      netAssetValue: totalNetValue,
      netAssetValueWan: parseFloat((totalNetValue / 10000).toFixed(1)),
      cumulativeDepreciation: totalDepreciation,
      cumulativeDepreciationWan: parseFloat((totalDepreciation / 10000).toFixed(1)),
      maintenanceCost: totalMaintenance,
      maintenanceCostWan: parseFloat((totalMaintenance / 10000).toFixed(1)),
      budgetCeiling: totalBudgetCeiling,
      budgetCeilingWan: parseFloat((totalBudgetCeiling / 10000).toFixed(1)),
      salvageValue: totalSalvage,
      salvageValueWan: parseFloat((totalSalvage / 10000).toFixed(1)),
      isCurrentNode,
      isInversion: totalMaintenance >= totalNetValue
    });
  }

  return points;
}

/**
 * 汇总全院设备预算执行与折旧预警全局概览
 */
export function calculateHospitalBudgetOverview(equipmentList: MedicalEquipment[]): BudgetExecutionOverviewStats {
  let exceededCount = 0;
  let approachingCount = 0;
  let normalCount = 0;
  let totalBudgetCeiling = 0;
  let totalMaintenanceSpent = 0;
  let totalExecutionRateSum = 0;
  let totalDepreciationRateSum = 0;

  const highRiskDepartmentCounts: Record<string, { total: number; warning: number; cost: number }> = {};

  equipmentList.forEach(eq => {
    const profile = calculateEquipmentBudgetProfile(eq);
    
    if (profile.warningLevel === 'exceeded') exceededCount++;
    else if (profile.warningLevel === 'approaching') approachingCount++;
    else normalCount++;

    totalBudgetCeiling += profile.maintenanceBudgetCeiling;
    totalMaintenanceSpent += profile.totalMaintenanceCost;
    totalExecutionRateSum += profile.budgetExecutionRate;
    totalDepreciationRateSum += profile.depreciationProgressRate;

    const dept = eq.department || '未分配科室';
    if (!highRiskDepartmentCounts[dept]) {
      highRiskDepartmentCounts[dept] = { total: 0, warning: 0, cost: 0 };
    }
    highRiskDepartmentCounts[dept].total++;
    if (profile.warningLevel !== 'normal') {
      highRiskDepartmentCounts[dept].warning++;
    }
    highRiskDepartmentCounts[dept].cost += profile.totalMaintenanceCost;
  });

  const total = equipmentList.length || 1;

  return {
    totalEquipmentCount: equipmentList.length,
    exceededCount,
    approachingCount,
    normalCount,
    totalBudgetCeiling,
    totalMaintenanceSpent,
    averageExecutionRate: parseFloat((totalExecutionRateSum / total).toFixed(1)),
    averageDepreciationRate: parseFloat((totalDepreciationRateSum / total).toFixed(1)),
    highRiskDepartmentCounts
  };
}

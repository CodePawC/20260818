import { MedicalEquipment } from '../types';
import { getEquipmentValidityInfo } from './validityUtils';
import { getEquipmentCalibrationInfo } from './calibrationUtils';

export interface HealthScoreDeduction {
  category: '强检校准' | '使用年限' | '运行状态' | '维保历史' | '巡检节点';
  reason: string;
  points: number; // Negative value, e.g. -45
  riskTag: 'CRITICAL' | 'WARNING' | 'INFO';
  detail?: string;
}

export interface HealthScoreInfo {
  score: number; // 0 - 100
  baseScore: number; // 100
  grade: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  label: string; // '极佳' | '良好' | '需关注' | '高风险'
  badgeBg: string; // Tailwind background
  textColor: string;
  borderClass: string;
  progressBg: string;
  reasons: string[];
  deductions: HealthScoreDeduction[];
}

export function getEquipmentHealthScore(item: MedicalEquipment): HealthScoreInfo {
  let score = 100;
  const reasons: string[] = [];
  const deductions: HealthScoreDeduction[] = [];

  // 1. 强检校准风险 (Calibration Risk) - 最高权重/一票否决级
  const calInfo = getEquipmentCalibrationInfo(item);
  if (calInfo.isMandatory && calInfo.statusType === 'overdue') {
    const overdueDays = Math.abs(calInfo.daysRemaining || 0);
    if (overdueDays > 365) {
      score -= 45;
      deductions.push({
        category: '强检校准',
        reason: `强检严重超期 (${overdueDays} 天)`,
        points: -45,
        riskTag: 'CRITICAL',
        detail: `已违反法定强制计量规定 (原到期日: ${calInfo.nextDate})，强检未定标设备按规定严禁临床使用。`,
      });
      reasons.push(`🚨 强检严重超期 ${overdueDays} 天 (-45)`);
    } else if (overdueDays > 90) {
      score -= 35;
      deductions.push({
        category: '强检校准',
        reason: `强检超期 (${overdueDays} 天)`,
        points: -35,
        riskTag: 'CRITICAL',
        detail: `计量许可有效期已过 (原到期日: ${calInfo.nextDate})，存在法定合规与临床检测精度风险。`,
      });
      reasons.push(`🚨 强检超期 ${overdueDays} 天 (-35)`);
    } else {
      score -= 25;
      deductions.push({
        category: '强检校准',
        reason: `强检超期未定标 (${overdueDays} 天)`,
        points: -25,
        riskTag: 'CRITICAL',
        detail: `请联系送检单位 (${calInfo.agency}) 安排现场强检定标。`,
      });
      reasons.push(`🚨 强检超期 ${overdueDays} 天 (-25)`);
    }
  } else if (calInfo.isMandatory && calInfo.statusType === 'due_soon') {
    score -= 10;
    deductions.push({
      category: '强检校准',
      reason: `强检临期预警 (剩 ${calInfo.daysRemaining} 天)`,
      points: -10,
      riskTag: 'WARNING',
      detail: `强检到期日为 ${calInfo.nextDate}，请及时联系检测机构安排送检。`,
    });
    reasons.push(`⚠️ 强检临期剩 ${calInfo.daysRemaining} 天 (-10)`);
  }

  // 2. 产品使用寿命与折旧风险 (Product Validity Risk) - 最高权重
  const vInfo = getEquipmentValidityInfo(item);
  if (vInfo.riskLevel === 'high' && vInfo.isExpired) {
    const yearsPastNum = parseFloat(vInfo.yearsPast || '0');
    if (yearsPastNum >= 3) {
      score -= 45;
      deductions.push({
        category: '使用年限',
        reason: `使用年限严重超期 (${vInfo.yearsPast} 年)`,
        points: -45,
        riskTag: 'CRITICAL',
        detail: `理论到期日: ${vInfo.expirationDateStr}。严重超期运行可能存在零配件严重老化与安全事故隐患。`,
      });
      reasons.push(`⚠️ 使用年限严重超期 ${vInfo.yearsPast} 年 (-45)`);
    } else if (yearsPastNum >= 1) {
      score -= 35;
      deductions.push({
        category: '使用年限',
        reason: `超出设计使用寿命 (${vInfo.yearsPast} 年)`,
        points: -35,
        riskTag: 'CRITICAL',
        detail: `理论到期日: ${vInfo.expirationDateStr}。建议组织技术评估、品质检测或提请报废。`,
      });
      reasons.push(`⚠️ 已超使用寿命 ${vInfo.yearsPast} 年 (-35)`);
    } else {
      score -= 25;
      deductions.push({
        category: '使用年限',
        reason: `已达折旧/产品到期年限`,
        points: -25,
        riskTag: 'WARNING',
        detail: `设备已达到生产厂家设定有效期 (到期日: ${vInfo.expirationDateStr})。`,
      });
      reasons.push(`⚠️ 已达报废/到期年限 (-25)`);
    }
  } else if (vInfo.riskLevel === 'medium' && vInfo.isExpiringSoon) {
    score -= 10;
    deductions.push({
      category: '使用年限',
      reason: `临近产品使用寿命 (剩 ${vInfo.daysRemaining} 天)`,
      points: -10,
      riskTag: 'WARNING',
      detail: `理论到期日为 ${vInfo.expirationDateStr}，请提前准备维保或更新替代计划。`,
    });
    reasons.push(`⚡ 临近产品寿命到期 (-10)`);
  }

  // 3. 设备运维/运行状态 (Operating Status)
  if (item.status === '停用/报废') {
    score -= 60;
    deductions.push({
      category: '运行状态',
      reason: '设备处于停用/待报废状态',
      points: -60,
      riskTag: 'CRITICAL',
      detail: '设备已封存停用或进入报废处置程序。',
    });
    reasons.push('🚫 设备处于停用/待报废状态 (-60)');
  } else if (item.status === '故障待修') {
    score -= 40;
    deductions.push({
      category: '运行状态',
      reason: '设备处于故障待修状态',
      points: -40,
      riskTag: 'CRITICAL',
      detail: '设备功能出现故障无法正常执行临床任务。',
    });
    reasons.push('🔧 设备处于故障待修状态 (-40)');
  } else if (item.status === '维护保养中') {
    score -= 15;
    deductions.push({
      category: '运行状态',
      reason: '设备正在进行维护保养',
      points: -15,
      riskTag: 'WARNING',
      detail: '常规保养、预防性巡检或校准调校进行中。',
    });
    reasons.push('🛠️ 设备正在维护保养 (-15)');
  }

  // 4. 巡检保养节点 (Maintenance Node)
  const mNode = getEquipmentMaintenanceNode(item);
  if (mNode.statusType === 'overdue') {
    const overdueDays = Math.abs(mNode.daysDiff || 0);
    if (overdueDays > 180) {
      score -= 20;
      deductions.push({
        category: '巡检节点',
        reason: `巡检保养严重逾期 (${overdueDays} 天)`,
        points: -20,
        riskTag: 'CRITICAL',
        detail: `上次保养日期: ${mNode.lastDate}，缺检时间过长。`,
      });
      reasons.push(`🛠️ 巡检保养严重逾期 ${overdueDays} 天 (-20)`);
    } else {
      score -= 10;
      deductions.push({
        category: '巡检节点',
        reason: `巡检保养已逾期 (${overdueDays} 天)`,
        points: -10,
        riskTag: 'WARNING',
        detail: `预定保养节点: ${mNode.nextDate}。`,
      });
      reasons.push(`🛠️ 巡检保养逾期 ${overdueDays} 天 (-10)`);
    }
  }

  // 5. 维保历史与支出 (Repair History & Cost)
  const repairRecords = item.repairRecords || [];
  const repairCount = repairRecords.length || item.repairCount || 0;
  const totalRepairCost = repairRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

  if (repairCount >= 5) {
    score -= 20;
    deductions.push({
      category: '维保历史',
      reason: `高频故障设备 (累计 ${repairCount} 次维修)`,
      points: -20,
      riskTag: 'CRITICAL',
      detail: `设备故障发生率偏高，运行稳定性受损。`,
    });
    reasons.push(`高频维修设备 (${repairCount}次) (-20)`);
  } else if (repairCount >= 3) {
    score -= 12;
    deductions.push({
      category: '维保历史',
      reason: `多次故障维修 (累计 ${repairCount} 次维修)`,
      points: -12,
      riskTag: 'WARNING',
      detail: `故障频次偏高。`,
    });
    reasons.push(`多次维修设备 (${repairCount}次) (-12)`);
  } else if (repairCount >= 1) {
    score -= 5;
    deductions.push({
      category: '维保历史',
      reason: `曾有故障维修历史 (${repairCount} 次)`,
      points: -5,
      riskTag: 'INFO',
      detail: `累计维修支出 ￥${totalRepairCost.toLocaleString()}。`,
    });
    reasons.push(`曾有维修记录 (${repairCount}次) (-5)`);
  }

  if (totalRepairCost > 50000) {
    score -= 15;
    deductions.push({
      category: '维保历史',
      reason: `维保支出费用极高 (￥${totalRepairCost.toLocaleString()})`,
      points: -15,
      riskTag: 'WARNING',
      detail: `维修成本偏高，建议进行效益与报废风险评估。`,
    });
    reasons.push(`高维保支出 (￥${totalRepairCost.toLocaleString()}) (-15)`);
  } else if (totalRepairCost > 10000 && repairCount < 3) {
    score -= 8;
    deductions.push({
      category: '维保历史',
      reason: `维保支出费用较高 (￥${totalRepairCost.toLocaleString()})`,
      points: -8,
      riskTag: 'INFO',
      detail: `历史配件及维保支出累计金额。`,
    });
    reasons.push(`中等维保支出 (￥${totalRepairCost.toLocaleString()}) (-8)`);
  }

  // Clamp score from 0 to 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 90) {
    return {
      score,
      baseScore: 100,
      grade: 'EXCELLENT',
      label: '极佳',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      textColor: 'text-emerald-600',
      borderClass: 'border-emerald-200',
      progressBg: 'bg-emerald-500',
      reasons: deductions.length > 0 ? reasons : ['运行指标与强检合规状态极佳'],
      deductions,
    };
  } else if (score >= 75) {
    return {
      score,
      baseScore: 100,
      grade: 'GOOD',
      label: '良好',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200/90',
      textColor: 'text-blue-600',
      borderClass: 'border-blue-200',
      progressBg: 'bg-blue-500',
      reasons,
      deductions,
    };
  } else if (score >= 60) {
    return {
      score,
      baseScore: 100,
      grade: 'WARNING',
      label: '需关注',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/90',
      textColor: 'text-amber-600',
      borderClass: 'border-amber-200',
      progressBg: 'bg-amber-500',
      reasons,
      deductions,
    };
  } else {
    return {
      score,
      baseScore: 100,
      grade: 'CRITICAL',
      label: '高风险',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200/90',
      textColor: 'text-rose-600',
      borderClass: 'border-rose-200',
      progressBg: 'bg-rose-500',
      reasons,
      deductions,
    };
  }
}

export interface MaintenanceNodeInfo {
  lastDate: string;
  nextDate: string;
  statusTag: string;
  statusType: 'normal' | 'due_soon' | 'overdue' | 'in_progress';
  badgeClass: string;
  daysDiff: number | null;
}

export function getEquipmentMaintenanceNode(item: MedicalEquipment): MaintenanceNodeInfo {
  const lastDate = item.lastMaintenanceDate || '建档未检';
  const nextDate = item.nextMaintenanceDate || '-';

  if (item.status === '维护保养中') {
    return {
      lastDate,
      nextDate,
      statusTag: '🛠️ 保养进行中',
      statusType: 'in_progress',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
      daysDiff: 0,
    };
  }

  if (!nextDate || nextDate === '-') {
    return {
      lastDate,
      nextDate: '-',
      statusTag: '排班巡检',
      statusType: 'normal',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      daysDiff: null,
    };
  }

  const cleanNext = nextDate.replace(/\//g, '-');
  const targetDate = new Date(cleanNext);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (isNaN(daysDiff)) {
    return {
      lastDate,
      nextDate,
      statusTag: '周期正常',
      statusType: 'normal',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      daysDiff: null,
    };
  }

  if (daysDiff < 0) {
    return {
      lastDate,
      nextDate,
      statusTag: `逾期 ${Math.abs(daysDiff)} 天`,
      statusType: 'overdue',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/90 font-bold',
      daysDiff,
    };
  } else if (daysDiff === 0) {
    return {
      lastDate,
      nextDate,
      statusTag: '今日保养节点',
      statusType: 'due_soon',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse',
      daysDiff,
    };
  } else if (daysDiff <= 30) {
    return {
      lastDate,
      nextDate,
      statusTag: `剩 ${daysDiff} 天保养`,
      statusType: 'due_soon',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
      daysDiff,
    };
  } else {
    return {
      lastDate,
      nextDate,
      statusTag: `剩 ${daysDiff} 天`,
      statusType: 'normal',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium',
      daysDiff,
    };
  }
}

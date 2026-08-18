import { MedicalEquipment, MetrologyManagementType, MetrologyFeePolicy, MetrologyCatalogueItem } from '../types';
import { matchEquipmentToMetrologyCatalogue, DEFAULT_METROLOGY_CATALOGUE } from './metrologyCatalogueData';

export type CalibrationStatusType = 'valid' | 'due_soon' | 'overdue' | 'exempt';

export interface CalibrationInfo {
  isMandatory: boolean; // 是否属于国家法定强制检定 (强检)
  isPeriodicCalibration: boolean; // 是否属于医院定期自费校准
  isExempt: boolean; // 是否免计量
  managementType: MetrologyManagementType; // 'mandatory' | 'periodic_calibration' | 'exempt'
  feePolicy: MetrologyFeePolicy; // 'free_national' | 'paid_hospital' | 'none'
  feePolicyLabel: string; // "国家法定免费 (免征强检费)" | "医院自费 (商业校准收费)" | "免计量"
  feePolicyBadgeClass: string;
  calibrationType: string; // '强检(国家免费)' | '定期校准(自费)' | '免计量'
  catalogueCode?: string; // 目录代码，如 QJ-01, JZ-01
  catalogueItemName?: string; // 目录器具名称
  matchedRuleReason?: string; // 规则命中依据
  agency: string; // 检定/校准机构
  certificateNo: string; // 证书编号 / 校准报告号
  certificateType: '检定证书 (法定合格)' | '校准证书 / 校准报告' | '无';
  lastDate: string; // 上次日期 YYYY-MM-DD
  nextDate: string; // 下次到期日 YYYY-MM-DD
  statusType: CalibrationStatusType;
  statusLabel: string;
  badgeClass: string;
  dotClass: string;
  daysRemaining: number | null; // 剩余天数 (负数表示超期)
  legalBasis: string; // 法律依据
  filingPlatform: string; // 申报系统 (e-CQS全国强检平台 vs 院内自费委托)
  description: string;
}

/**
 * 依据国家政策与动态强检目录计算设备的计量强检/校准合规状态与效期信息
 */
export function getEquipmentCalibrationInfo(
  equipment: Partial<MedicalEquipment>,
  customCatalogue?: MetrologyCatalogueItem[]
): CalibrationInfo {
  const activeCatalogue = customCatalogue && customCatalogue.length > 0
    ? customCatalogue
    : DEFAULT_METROLOGY_CATALOGUE;

  // 1. 动态与强检目录进行政策对齐匹配
  const matchResult = matchEquipmentToMetrologyCatalogue(
    equipment.name || '',
    equipment.model || '',
    `${equipment.category || ''} ${equipment.level1Category || ''} ${equipment.level2Category || ''}`,
    activeCatalogue
  );

  const isCal = equipment.calibration === 'Yes' || (equipment.calibration === undefined && matchResult.matchType !== 'exempt');
  
  // 综合判定管理方式：若设备有显式强检类型则优先，否则依据强检目录动态匹配结果
  let isMandatory = false;
  let isPeriodic = false;
  let isExempt = false;

  if (equipment.calibrationType === '强检(国家免费)' || equipment.calibrationType === '强检类' || (equipment.calibrationType && equipment.calibrationType.includes('强检'))) {
    isMandatory = true;
  } else if (equipment.calibrationType === '定期校准(自费)' || equipment.calibrationType === '常规校准' || (equipment.calibrationType && equipment.calibrationType.includes('校准'))) {
    isPeriodic = true;
  } else if (equipment.calibrationType === '免计量' || equipment.calibration === 'No') {
    isExempt = true;
  } else {
    // 动态目录匹配判定
    isMandatory = isCal && matchResult.matchType === 'mandatory';
    isPeriodic = isCal && matchResult.matchType === 'periodic_calibration';
    isExempt = !isCal || matchResult.matchType === 'exempt';
  }

  const matchedItem = matchResult.matchedItem;
  const catalogueCode = matchedItem?.catalogueCode || (isMandatory ? 'QJ-01' : isPeriodic ? 'JZ-01' : undefined);
  const catalogueItemName = matchedItem?.name;
  const matchedRuleReason = matchResult.matchReason;

  if (isExempt) {
    return {
      isMandatory: false,
      isPeriodicCalibration: false,
      isExempt: true,
      managementType: 'exempt',
      feePolicy: 'none',
      feePolicyLabel: '免计量 / 常规设备',
      feePolicyBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      calibrationType: '免计量',
      catalogueCode,
      catalogueItemName,
      matchedRuleReason,
      agency: '免检',
      certificateNo: '-',
      certificateType: '无',
      lastDate: '-',
      nextDate: '-',
      statusType: 'exempt',
      statusLabel: '免计量',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
      daysRemaining: null,
      legalBasis: '未列入国家法定计量强检目录及重点定期校准目录',
      filingPlatform: '院内三级预防性维护(PM)保养巡检',
      description: '该器械属于非强制计量设备，按院内三级巡检和预防性维护(PM)管理，无需申请法定检定。',
    };
  }

  // 默认检定/校准机构
  let agency = equipment.calibrationUnit || (matchedItem ? matchedItem.verificationBody : '');
  if (!agency || agency === '省级') {
    agency = isMandatory ? '省计量科学研究院 (法定强检所)' : '省医疗器械质量检测研究院 (校准中心)';
  } else if (agency === '市级') {
    agency = isMandatory ? '市计量质量检测研究院 (法定强检)' : '市质量技术监督检测所 (校准部)';
  } else if (agency === '国家级') {
    agency = '中国计量科学研究院 (国家法定计量院)';
  }

  // 证书编号
  const certPrefix = isMandatory ? (catalogueCode || 'QJ') : (catalogueCode || 'JZ');
  const certNo = equipment.calibrationCertificateNo || `${certPrefix}-2025-${equipment.id || '888'}`;

  // 检定/校准周期 (月)
  const periodMonths = matchedItem?.verificationPeriodMonths || (isMandatory ? 12 : 12);

  // 计算或补全上次与下次时间
  let lastDate = equipment.lastCalibrationDate || '';
  let nextDate = equipment.nextCalibrationDate || '';

  if (!lastDate) {
    if (equipment.lastMaintenanceDate) {
      lastDate = equipment.lastMaintenanceDate;
    } else if (equipment.enableDate) {
      lastDate = equipment.enableDate.replace(/\//g, '-');
    } else {
      lastDate = '2025-06-15';
    }
  }

  if (!nextDate && lastDate) {
    const parts = lastDate.replace(/\//g, '-').split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      const targetDate = new Date(year, month - 1 + periodMonths, day);
      const ty = targetDate.getFullYear();
      const tm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const td = String(targetDate.getDate()).padStart(2, '0');
      nextDate = `${ty}-${tm}-${td}`;
    }
  }

  // 计算天数差
  let daysRemaining: number | null = null;
  let statusType: CalibrationStatusType = 'valid';

  if (nextDate) {
    const target = new Date(nextDate.replace(/\//g, '-'));
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      statusType = 'overdue';
    } else if (daysRemaining <= 45) {
      statusType = 'due_soon';
    }
  }

  if (isMandatory) {
    // ==================== 1. 国家法定强制检定 (免费) ====================
    let statusLabel = '强检合格 (国家免费)';
    let badgeClass = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
    let dotClass = 'bg-emerald-600';
    let description = `⚖️【国家法定强检·合格有效】属于国家医疗强检目录法定计量设备【${catalogueCode || 'QJ-01'} ${catalogueItemName || ''}】，享受财税〔2017〕20号国家免费检定政策（免征检定费）。已在e-CQS全国强检系统备案。出具法定《检定证书》（编号：${certNo}），检定机构：${agency}。下次强检到期日：${nextDate}。`;

    if (statusType === 'overdue') {
      const overdueDays = Math.abs(daysRemaining || 0);
      statusLabel = `强检脱检 (超期${overdueDays}天)`;
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-300 font-bold shadow-2xs';
      dotClass = 'bg-rose-600 animate-pulse';
      description = `⚖️🚨【法定强检超期/脱检警告】该设备属于国家法定强检目录【${catalogueCode || 'QJ'} ${catalogueItemName || ''}】，国家提供免费检定！现已超期 ${overdueDays} 天（证书原有效期至 ${nextDate}）。根据《计量法》第9条，脱检设备严禁用于临床医疗！请立即登录e-CQS全国强检平台向法定检定机构（${agency}）预约免费上门周期检定。`;
    } else if (statusType === 'due_soon') {
      statusLabel = `强检临期待检 (剩${daysRemaining}天)`;
      badgeClass = 'bg-purple-50 text-purple-900 border-purple-300 font-bold shadow-2xs';
      dotClass = 'bg-purple-600';
      description = `⚖️⚡【法定强检临期预警】国家法定强检证书有效期仅剩 ${daysRemaining} 天（到期日 ${nextDate}）。请提前在e-CQS全国强检业务平台向法定检定机构（${agency}）提交免费强检预约。`;
    }

    return {
      isMandatory: true,
      isPeriodicCalibration: false,
      isExempt: false,
      managementType: 'mandatory',
      feePolicy: 'free_national',
      feePolicyLabel: '国家法定免费 (免征强检费)',
      feePolicyBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      calibrationType: '强检(国家免费)',
      catalogueCode,
      catalogueItemName,
      matchedRuleReason,
      agency,
      certificateNo: certNo,
      certificateType: '检定证书 (法定合格)',
      lastDate,
      nextDate: nextDate || '-',
      statusType,
      statusLabel,
      badgeClass,
      dotClass,
      daysRemaining,
      legalBasis: matchedItem?.legalBasis || '《中华人民共和国计量法》第9条、国家市场监管总局2020年第42号公告、财税〔2017〕20号（国家停征强检收费政策）',
      filingPlatform: 'e-CQS 全国国家网络强检业务管理平台 (法定免费报检)',
      description
    };
  } else {
    // ==================== 2. 非强检定期校准 (医院自费检验) ====================
    let statusLabel = '校准合格 (自费检验)';
    let badgeClass = 'bg-sky-50 text-sky-900 border-sky-300 font-bold';
    let dotClass = 'bg-sky-600';
    let description = `📐【院内定期校准·合格】属于非强检设备【${catalogueCode || 'JZ'} ${catalogueItemName || ''}】（如输液泵、高频电刀、监护仪、呼吸机等），由医院依法自主管理，委托具有CNAS资质的第三方计量机构进行自费定期校准。出具《校准证书/检测报告》（编号：${certNo}），校准机构：${agency}。下次校准到期日：${nextDate}。`;

    if (statusType === 'overdue') {
      const overdueDays = Math.abs(daysRemaining || 0);
      statusLabel = `校准超期 (${overdueDays}天)`;
      badgeClass = 'bg-amber-50 text-amber-900 border-amber-300 font-bold shadow-2xs';
      dotClass = 'bg-amber-600 animate-pulse';
      description = `📐⚠️【定期校准超期】该非强检设备定期校准已超期 ${overdueDays} 天（证书原有效期至 ${nextDate}）。虽不属于法定免征强检目录，但根据《医疗器械使用质量管理规范》，建议由医学工程科发起自费校准采购流程，委托计量服务商（${agency}）实施周期校准。`;
    } else if (statusType === 'due_soon') {
      statusLabel = `校准临期 (剩${daysRemaining}天)`;
      badgeClass = 'bg-indigo-50 text-indigo-900 border-indigo-300 font-bold shadow-2xs';
      dotClass = 'bg-indigo-600';
      description = `📐⚡【定期校准临期】自费校准证书有效期仅剩 ${daysRemaining} 天（到期日 ${nextDate}）。请联系委托校准服务商（${agency}）安排检测。`;
    }

    return {
      isMandatory: false,
      isPeriodicCalibration: true,
      isExempt: false,
      managementType: 'periodic_calibration',
      feePolicy: 'paid_hospital',
      feePolicyLabel: '医院自费 (商业校准收费)',
      feePolicyBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      calibrationType: '定期校准(自费)',
      catalogueCode,
      catalogueItemName,
      matchedRuleReason,
      agency,
      certificateNo: certNo,
      certificateType: '校准证书 / 校准报告',
      lastDate,
      nextDate: nextDate || '-',
      statusType,
      statusLabel,
      badgeClass,
      dotClass,
      daysRemaining,
      legalBasis: matchedItem?.legalBasis || 'JJF系列计量技术规范、医疗器械使用质量管理规范、医院等级评审质量控制要求',
      filingPlatform: '医院医学工程科合同委托 / 第三方校准机构',
      description
    };
  }
}


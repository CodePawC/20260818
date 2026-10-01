import { MedicalEquipment, OverdueFilingRecord } from '../types';

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface ValidityInfo {
  manufactureDateStr: string; // e.g. "2014/3/10"
  validityYears: number | null; // e.g. 10
  expirationDate: Date | null; // Date object
  expirationDateStr: string; // e.g. "2024-03-10"
  isExpired: boolean;
  isExpiringSoon: boolean; // e.g. within 180 days
  daysRemaining: number | null; // positive = days left, negative = days past expiration
  monthsPast: number | null; // if past, how many months
  yearsPast: string | null; // e.g. "2.3"
  riskLevel: RiskLevel;
  riskLabel: string; // "超龄服役 (已超期)" | "寿命临期 (即将届满)" | "服役正常" | "未登记寿命" | "超期准用 (备案受控)"
  riskDescription: string;
  // 超期服役整修与稳定性备案受控扩展字段
  hasOverdueFiling: boolean;
  overdueFiling?: OverdueFilingRecord;
  isFilingActive: boolean;
  filingValidUntil?: string;
  filingDaysRemaining?: number | null;
  isFilingExpiringSoon?: boolean; // 备案期不足30天
  dualBadge?: {
    overdueText: string;     // e.g. "超期服役 (+2.3年)"
    complianceText: string;  // e.g. "整修质控合格 (至2027-05)"
    filingNo: string;        // e.g. "EXT-2026-0518"
    validUntil: string;
  };
}

export function parseValidityDate(dateStr?: string): Date | null {
  if (!dateStr || dateStr.trim() === '-' || dateStr.trim() === '') return null;
  // Handle formats like 2020/6/18 or 2020-06-18 or 2020.06.18
  const cleaned = dateStr.trim().replace(/\./g, '/').replace(/-/g, '/');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

export function getEquipmentValidityInfo(equipment: Partial<MedicalEquipment>): ValidityInfo {
  // Use manufactureDate first; fall back to enableDate if manufactureDate is missing
  const mDateStr = equipment.manufactureDate || equipment.enableDate || '';
  const mDate = parseValidityDate(mDateStr);
  const years = equipment.productValidity ? parseFloat(equipment.productValidity) : null;

  if (!mDate || !years || isNaN(years)) {
    const hasFiling = !!equipment.overdueFiling;
    return {
      manufactureDateStr: mDateStr || '-',
      validityYears: years,
      expirationDate: null,
      expirationDateStr: '-',
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: null,
      monthsPast: null,
      yearsPast: null,
      riskLevel: 'unknown',
      riskLabel: '未标年限',
      riskDescription: '设备未登记出厂生产日期或标称设计使用年限。',
      hasOverdueFiling: hasFiling,
      overdueFiling: equipment.overdueFiling,
      isFilingActive: hasFiling && equipment.overdueFiling?.filingStatus === 'ACTIVE',
      filingValidUntil: equipment.overdueFiling?.validUntil,
      filingDaysRemaining: null,
      isFilingExpiringSoon: false
    };
  }

  // Calculate expiration date: manufacture date + validity years
  const expDate = new Date(mDate);
  const fullYears = Math.floor(years);
  expDate.setFullYear(expDate.getFullYear() + fullYears);
  const fractionalMonths = (years - fullYears) * 12;
  if (fractionalMonths > 0) {
    expDate.setMonth(expDate.getMonth() + Math.round(fractionalMonths));
  }

  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const expYear = expDate.getFullYear();
  const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
  const expDay = String(expDate.getDate()).padStart(2, '0');
  const expirationDateStr = `${expYear}-${expMonth}-${expDay}`;

  const isExpired = daysRemaining < 0;
  // Expiring soon if within 180 days (half a year) and not yet expired
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 180;

  let riskLevel: RiskLevel = 'low';
  let riskLabel = '服役期内 (正常)';
  let riskDescription = `设备处于出厂标称设计使用寿命内（标称${years}年），设计到期日为 ${expirationDateStr}（还剩 ${daysRemaining} 天）。`;

  let yearsPastStr: string | null = null;
  let monthsPast: number | null = null;

  if (isExpired) {
    riskLevel = 'high';
    const absDays = Math.abs(daysRemaining);
    monthsPast = Math.floor(absDays / 30);
    const yrsPast = (absDays / 365).toFixed(1);
    yearsPastStr = yrsPast;
    riskLabel = `超龄服役 (超 ${yrsPast} 年)`;
    riskDescription = `⏳【产品寿命超期】设备已超过厂家出厂设计使用寿命 ${yrsPast} 年（标称 ${years} 年，设计到期日：${expirationDateStr}）。属于超龄老旧服役设备，存在机械绝缘老化与故障率上升风险，建议组织残值评估、安全性质量检测或提请报废。`;
  } else if (isExpiringSoon) {
    riskLevel = 'medium';
    riskLabel = `寿命将届 (剩 ${daysRemaining} 天)`;
    riskDescription = `⏳【设计寿命临期】设备将于 ${daysRemaining} 天后（${expirationDateStr}）达到厂家标称的出厂使用年限，请提前准备老旧机况评估或新购替换预算计划。`;
  }

  // 计算超期备案与稳定性检测准用状态
  const overdueFiling = equipment.overdueFiling;
  const hasOverdueFiling = !!overdueFiling;
  let isFilingActive = false;
  let filingDaysRemaining: number | null = null;
  let isFilingExpiringSoon = false;
  let dualBadge: ValidityInfo['dualBadge'] = undefined;

  if (overdueFiling) {
    const filingExpDate = parseValidityDate(overdueFiling.validUntil);
    if (filingExpDate) {
      const fDiff = filingExpDate.getTime() - now.getTime();
      filingDaysRemaining = Math.ceil(fDiff / (1000 * 60 * 60 * 24));
    }
    isFilingActive = overdueFiling.filingStatus === 'ACTIVE' && (filingDaysRemaining === null || filingDaysRemaining >= 0);
    isFilingExpiringSoon = isFilingActive && filingDaysRemaining !== null && filingDaysRemaining <= 30;

    if (isExpired) {
      if (isFilingActive) {
        riskLevel = isFilingExpiringSoon ? 'medium' : 'low';
        riskLabel = isFilingExpiringSoon 
          ? `超期在用 · 备案临期 (剩${filingDaysRemaining}天)` 
          : `超期在用 · 稳定性合格 (至${overdueFiling.validUntil})`;
        
        riskDescription = `🛡️【超期准用受控设备】该设备虽已超过出厂标称设计使用寿命（超期 ${yearsPastStr} 年），但已于 ${overdueFiling.refurbishDate} 完成深度整修与关键备件换新，并通过了 ${overdueFiling.stabilityTestAgency} 的 72小时连续工况稳定性与 GB 9706.1 电气安全合格检测（质控报告：${overdueFiling.stabilityTestReportNo}）。经医学装备管理委员会论证通过特许准用备案（备案号：${overdueFiling.filingNo}，公文号：${overdueFiling.approvalDocNo}），特许延期准用至 ${overdueFiling.validUntil}。已纳入【${overdueFiling.monitoringFrequency === 'BIWEEKLY' ? '双周' : '按月'}重点巡检】受控运行。`;

        dualBadge = {
          overdueText: `超期服役 (+${yearsPastStr || '1.0'}年)`,
          complianceText: `整修稳定性合格 (至${overdueFiling.validUntil})`,
          filingNo: overdueFiling.filingNo,
          validUntil: overdueFiling.validUntil
        };
      } else {
        riskLevel = 'high';
        riskLabel = `超期在用 · 备案已到期需复核`;
        riskDescription = `⚠️【超期备案已届满】该设备的超期特许准用备案已于 ${overdueFiling.validUntil} 到期，按《医疗器械监督管理条例》要求，必须立即组织新一轮稳定性检测复审，或下线停机申报报废！`;
      }
    }
  }

  return {
    manufactureDateStr: mDateStr,
    validityYears: years,
    expirationDate: expDate,
    expirationDateStr,
    isExpired,
    isExpiringSoon,
    daysRemaining,
    monthsPast,
    yearsPast: yearsPastStr,
    riskLevel,
    riskLabel,
    riskDescription,
    hasOverdueFiling,
    overdueFiling,
    isFilingActive,
    filingValidUntil: overdueFiling?.validUntil,
    filingDaysRemaining,
    isFilingExpiringSoon,
    dualBadge
  };
}

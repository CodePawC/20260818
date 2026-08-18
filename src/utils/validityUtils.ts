import { MedicalEquipment } from '../types';

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
  riskLabel: string; // "超龄服役 (已超期)" | "寿命临期 (即将届满)" | "服役正常" | "未登记寿命"
  riskDescription: string;
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
  };
}

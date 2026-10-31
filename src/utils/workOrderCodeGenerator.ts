/**
 * 医疗设备维修与请示工单复合编码体系 (Hospital Biomedical Work Order Coding Engine)
 * 
 * 解决问题：
 * 纯数字排列（如 545, 546）存在年份冲突、无业务语义、与第三方系统易碰撞等严重隐患。
 * 本模块提供符合国家公立三甲/二甲医院标准的「全量唯一业务码 + 纸质请示简短流水号」双轨制编码体系。
 * 
 * 规范结构：
 * WO-[业务类型前缀]-[年份]-[4位年度序列号]
 * 示例：
 * - 现场故障紧急抢修: WO-REP-2026-0546 (纸质请示单显示: NO. 546)
 * - 精密器械返厂大修: WO-FAC-2026-0546 (纸质请示单显示: NO. 546)
 * - 高额配件更换审批: WO-PRT-2026-0546 (纸质请示单显示: NO. 546)
 * - 预防性维护保养PM: WO-PM-2026-0082
 * - 巡检异常转修单:   WO-INS-2026-0120
 */

export type WorkOrderPrefixType = 
  | 'REP'   // 紧急故障现场抢修 (Repair Breakdown)
  | 'FAC'   // 精密器械返厂大修 (Factory Overhaul)
  | 'PRT'   // 核心高额配件置换 (Part Replacement)
  | 'PM'    // 预防性定期维护保养 (Preventive Maintenance)
  | 'INS'   // 临床巡检异常转修 (Inspection Abnormal)
  | 'CAL'   // 计量检定校准不合格排查 (Calibration)
  | 'SCR';  // 设备技术鉴定与报废处置 (Scrap Evaluation)

export interface StandardWorkOrderInfo {
  fullCode: string;          // 规范全量工单号 e.g. "WO-FAC-2026-0546"
  paperDocNo: string;        // 纸质请示报告单对应文号 (默认采用规范全码) e.g. "NO. WO-FAC-2026-0546"
  shortDocNo: string;        // 简短序号文号 e.g. "NO. 546"
  prefix: WorkOrderPrefixType; // 业务类别前缀
  prefixLabel: string;       // 类别名称
  year: number;              // 业务年度 e.g. 2026
  sequenceNumber: number;    // 年度流水序号 e.g. 546
  sequencePadded: string;    // 补齐4位序号 e.g. "0546"
}

export const PREFIX_LABEL_MAP: Record<WorkOrderPrefixType, string> = {
  REP: '现场抢修',
  FAC: '返厂大修',
  PRT: '配件更换',
  PM: '预防维保',
  INS: '巡检报修',
  CAL: '计量复检',
  SCR: '报废鉴定'
};

export interface WorkOrderTypeOption {
  prefix: WorkOrderPrefixType;
  label: string;
  codePrefix: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const WORK_ORDER_TYPE_OPTIONS: WorkOrderTypeOption[] = [
  { 
    prefix: 'FAC', 
    label: '返厂大修申请', 
    codePrefix: 'WO-FAC', 
    description: '内窥镜、高频电刀、超声探头等精密器械返厂维保',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/30'
  },
  { 
    prefix: 'REP', 
    label: '现场故障急修', 
    codePrefix: 'WO-REP', 
    description: '急诊、ICU、手术室突发故障工程师现场紧急抢修',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30'
  },
  { 
    prefix: 'PRT', 
    label: '配件更换审批', 
    codePrefix: 'WO-PRT', 
    description: 'CT球管、呼吸机氧电池、透析机滤器等高额配件采购',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/30'
  },
  { 
    prefix: 'PM', 
    label: '预防性维护PM', 
    codePrefix: 'WO-PM', 
    description: '高风险与生命支持设备定期保养维护与性能标定',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30'
  },
  { 
    prefix: 'INS', 
    label: '巡检异常转修', 
    codePrefix: 'WO-INS', 
    description: '临床科室日常质量巡查发现的缺陷转报修审批',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/30'
  },
  { 
    prefix: 'CAL', 
    label: '计量复检排查', 
    codePrefix: 'WO-CAL', 
    description: '监护仪、除颤仪计量法定检定不合格技术排查',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/30'
  },
  { 
    prefix: 'SCR', 
    label: '技术鉴定报废', 
    codePrefix: 'WO-SCR', 
    description: '超期服役严重老化、无原厂配件或维修成本超标申请',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/30'
  }
];

/**
 * 智能解析任意输入字符串，将其标准化解析为工单编码对象
 * 默认在请示报告单文号中使用规范全码 (如 NO. WO-FAC-2026-0546)
 */
export function parseWorkOrderCode(
  input?: string,
  defaultPrefix: WorkOrderPrefixType = 'FAC',
  currentYear: number = 2026,
  useFullCodeInDoc: boolean = true
): StandardWorkOrderInfo {
  if (!input || !input.trim()) {
    return formatWorkOrderCode(defaultPrefix, currentYear, 546, useFullCodeInDoc);
  }

  const raw = input.trim();

  // 1. 尝试匹配已有的规范三段/四段格式 WO-XXX-YYYY-NNNN
  const standardMatch = raw.match(/WO-([A-Z]{2,4})-(\d{4})-(\d+)/i);
  if (standardMatch) {
    const pfx = standardMatch[1].toUpperCase() as WorkOrderPrefixType;
    const yr = parseInt(standardMatch[2], 10);
    const seq = parseInt(standardMatch[3], 10);
    const validPrefix = PREFIX_LABEL_MAP[pfx] ? pfx : defaultPrefix;
    return formatWorkOrderCode(validPrefix, yr, seq, useFullCodeInDoc);
  }

  // 2. 尝试匹配日期格式 WO-YYYYMMDD-NNN 或 REP-YYYYMMDD-NNN
  const dateMatch = raw.match(/(?:WO|REP|APP)-?(\d{4})(\d{2})(\d{2})-(\d+)/i);
  if (dateMatch) {
    const yr = parseInt(dateMatch[1], 10);
    const seq = parseInt(dateMatch[4], 10);
    const mappedSeq = seq > 100 ? seq : (545 + seq);
    return formatWorkOrderCode(defaultPrefix, yr, mappedSeq, useFullCodeInDoc);
  }

  // 3. 尝试匹配 NO. 546 或纯数字 546
  const numMatch = raw.match(/\d+/g);
  if (numMatch && numMatch.length > 0) {
    const lastNum = parseInt(numMatch[numMatch.length - 1], 10);
    return formatWorkOrderCode(defaultPrefix, currentYear, lastNum, useFullCodeInDoc);
  }

  return formatWorkOrderCode(defaultPrefix, currentYear, 546, useFullCodeInDoc);
}

/**
 * 格式化构造标准工单对象
 * @param useFullCodeInDoc 默认为 true，纸质公文上默认印制专业规范全码 (e.g. NO. WO-FAC-2026-0546)
 */
export function formatWorkOrderCode(
  prefix: WorkOrderPrefixType = 'FAC',
  year: number = 2026,
  seq: number = 546,
  useFullCodeInDoc: boolean = true
): StandardWorkOrderInfo {
  const sequenceNumber = Math.max(1, seq);
  const sequencePadded = String(sequenceNumber).padStart(4, '0');
  const fullCode = `WO-${prefix}-${year}-${sequencePadded}`;
  const shortDocNo = `NO. ${sequenceNumber}`;
  const paperDocNo = useFullCodeInDoc ? `NO. ${fullCode}` : shortDocNo;

  return {
    fullCode,
    paperDocNo,
    shortDocNo,
    prefix,
    prefixLabel: PREFIX_LABEL_MAP[prefix] || '维修工单',
    year,
    sequenceNumber,
    sequencePadded
  };
}

/**
 * 智能推断业务类别前缀
 */
export function inferWorkOrderPrefix(
  category?: string,
  approvalType?: string,
  deviceName?: string
): WorkOrderPrefixType {
  if (approvalType === 'return_factory_repair' || category === 'factory_overhaul') {
    return 'FAC';
  }
  if (approvalType === 'part_replacement' || category === 'part_replacement') {
    return 'PRT';
  }
  if (approvalType === 'scrap_disposal' || category === 'scrap') {
    return 'SCR';
  }
  if (approvalType === 'preventive_maintenance' || category === 'maintenance') {
    return 'PM';
  }
  if (approvalType === 'calibration' || category === 'calibration') {
    return 'CAL';
  }
  if (deviceName && (deviceName.includes('硬镜') || deviceName.includes('软镜') || deviceName.includes('输尿管镜') || deviceName.includes('胃镜') || deviceName.includes('肠镜') || deviceName.includes('支气管镜'))) {
    return 'FAC'; // 内窥镜高精密器械大修多为返厂
  }
  return 'REP'; // 常规急修
}

/**
 * 将临床报修、设备台账或零修中的原始单号映射为符合规范的工单全码对象
 */
export function standardizeRepairRecordCode(
  rawId?: string,
  repairType?: string,
  equipmentName?: string,
  indexFallback: number = 1
): StandardWorkOrderInfo {
  // 1. 优先推断前缀
  let pfx: WorkOrderPrefixType = 'REP';
  if (repairType) {
    if (repairType.includes('返厂') || repairType.includes('大修') || repairType.includes('外修')) pfx = 'FAC';
    else if (repairType.includes('配件') || repairType.includes('换件') || repairType.includes('备件') || repairType.includes('换新')) pfx = 'PRT';
    else if (repairType.includes('预防') || repairType.includes('保养') || repairType.includes('PM') || repairType.includes('巡检保养')) pfx = 'PM';
    else if (repairType.includes('计量') || repairType.includes('校准') || repairType.includes('检定')) pfx = 'CAL';
    else if (repairType.includes('报废') || repairType.includes('淘汰') || repairType.includes('处置')) pfx = 'SCR';
    else if (repairType.includes('巡检') || repairType.includes('排查')) pfx = 'INS';
  } else if (equipmentName && (equipmentName.includes('硬镜') || equipmentName.includes('软镜') || equipmentName.includes('输尿管镜') || equipmentName.includes('内窥镜'))) {
    pfx = 'FAC';
  }

  // 2. 如果已经包含 WO-[PREFIX]-[YEAR]-[SEQ]，直接解析并保留
  if (rawId && /^WO-[A-Z]{2,4}-\d{4}-\d+/i.test(rawId.trim())) {
    return parseWorkOrderCode(rawId, pfx, 2026, true);
  }

  // 3. 如果是 REP-20260510-01 这种旧日期编号
  if (rawId) {
    const dateMatch = rawId.match(/(\d{4})(\d{2})(\d{2})-(\d+)/);
    if (dateMatch) {
      const yr = parseInt(dateMatch[1], 10);
      const subSeq = parseInt(dateMatch[4], 10);
      const mappedSeq = subSeq < 100 ? 540 + subSeq : subSeq;
      return formatWorkOrderCode(pfx, yr, mappedSeq, true);
    }

    // 4. 如果是纯数字如 546 或 REP-546
    const numMatch = rawId.match(/\d+/g);
    if (numMatch && numMatch.length > 0) {
      const lastNum = parseInt(numMatch[numMatch.length - 1], 10);
      const seq = lastNum > 0 ? (lastNum > 9999 ? lastNum % 10000 : lastNum) : (545 + indexFallback);
      return formatWorkOrderCode(pfx, 2026, seq, true);
    }
  }

  return formatWorkOrderCode(pfx, 2026, 545 + indexFallback, true);
}

/**
 * 产生下一张标准工单唯一编码 (e.g. WO-REP-2026-0551)
 */
export function generateNextWorkOrderId(
  prefix: WorkOrderPrefixType = 'REP',
  currentYear: number = 2026,
  existingCount: number = 0
): string {
  const nextSeq = 546 + existingCount;
  return formatWorkOrderCode(prefix, currentYear, nextSeq, true).fullCode;
}


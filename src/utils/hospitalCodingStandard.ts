/**
 * 五莲县人民医院 - 医学装备与财务流转全生命周期编码规范与钩稽中枢
 * Hospital Biomedical Equipment & Financial Coding Standard Engine
 * 
 * =========================================================================
 * 【核心设计逻辑与全院编号统一规划说明】
 * 
 * 1. 为什么“设备项目台账ID”、“费用预批单编号”与“请示报告 NO. WO-REP-2026-3212”不应完全混为一个无前缀字符串？
 *    - 业务属性不同：
 *      * 《设备维修请示报告》（WO-: Work Order）：代表临床工程维修与技术审批公文；
 *      * 《设备项目台账》（PRJ-: Project / ID_项目）：代表医院全院立项预算台账条目；
 *      * 《费用预批单》（YP-: 预批 / Expense Pre-Approval）：代表财务资金支出前的院长会与分管领导联签凭证；
 *      * 《增值税发票》（FP-: 发票）：代表国税底账与金税四期税务凭据；
 *      * 《财务付款凭证》（PZ-: 记账凭证）：代表出纳最终电汇入账凭证。
 * 
 * 2. 它们如何实现严格的一一对应与逻辑钩稽？
 *    - 【统一基准序列号驱动（Master Sequence Anchor）】：
 *      以年度流水序列号（如 3212、0548、0629）为核心枢纽，在各个业务节点按规范生成一脉相承的单据编号：
 *      * 维修请示公文：NO. WO-REP-2026-3212  (简短公文印制：NO. 3212)
 *      * 项目台账主键：ID_项目: 3212           (全量台账全码：PRJ-2026-3212)
 *      * 费用预批单据：费用预批单 编号：3212   (财务规范全码：YP-2026-3212)
 *      * 财务记账凭证：PZ-2026-11-3212
 *      * 关联设备资产：WLH-EQ-2026-3212
 * 
 * 3. 【双轨制兼容】：
 *    - 专业全码轨（全院检索、审计追溯、电子验签、电子档案）：带有明确业务语义（WO-REP-, PRJ-, YP-）；
 *    - 极简单号轨（纸质红头打印、一线临床口头报修、财务原始单据）：使用纯数字 3212 或 548。
 * =========================================================================
 */

import { WorkOrderPrefixType, PREFIX_LABEL_MAP } from './workOrderCodeGenerator';

export interface HospitalCodingChain {
  sequenceNumber: number;          // 核心年度流水号 (e.g. 3212 或 548)
  sequencePadded: string;          // 补齐序号 (e.g. "3212" 或 "0548")
  year: number;                    // 业务年度 (e.g. 2026)
  
  // 1. 临床维修工单 / 请示报告单
  workOrder: {
    fullCode: string;              // e.g. "WO-REP-2026-3212"
    paperDocNo: string;            // e.g. "NO. WO-REP-2026-3212"
    shortDocNo: string;            // e.g. "NO. 3212"
    type: WorkOrderPrefixType;     // "REP" | "FAC" | "PRT" 等
    typeLabel: string;             // "现场急修" | "返厂大修" 等
  };

  // 2. 全院设备项目总台账
  projectLedger: {
    id: string;                    // 台账主键简码 e.g. "3212" 或 "548"
    fullCode: string;              // 台账规范全码 e.g. "PRJ-2026-3212"
    displayLabel: string;          // e.g. "项目ID: 3212 (PRJ-2026-3212)"
  };

  // 3. 费用预批单
  preApproval: {
    docNo: string;                 // 纸质单印制编号 (原件复刻) e.g. "3212" 或 "548"
    standardVoucherNo: string;     // 规范财务预批文号 e.g. "YP-2026-3212"
    fullDisplay: string;           // e.g. "费用预批单（编号：3212 / YP-2026-3212）"
  };

  // 4. 财务出纳记账凭证
  financeVoucher: {
    code: string;                  // e.g. "PZ-2026-11-3212"
  };

  // 5. 设备固定资产台账
  equipmentAsset: {
    code: string;                  // e.g. "WLH-EQ-2026-3212"
  };
}

/**
 * 智能解析任意输入（工单号、项目ID、预批单号等），构筑完整的六码合一钩稽链条
 */
export function resolveHospitalCodingChain(
  input?: string | number,
  overridePrefix?: WorkOrderPrefixType,
  overrideYear: number = 2026
): HospitalCodingChain {
  let seq = 548;
  let yr = overrideYear;
  let pfx: WorkOrderPrefixType = overridePrefix || 'REP';

  if (typeof input === 'number') {
    seq = Math.max(1, input);
  } else if (input && typeof input === 'string') {
    const raw = input.trim();

    // 1. 尝试匹配工单全码：WO-REP-2026-3212 或 WO-FAC-2026-0546
    const woMatch = raw.match(/WO-([A-Z]{2,4})-(\d{4})-(\d+)/i);
    if (woMatch) {
      const parsedPfx = woMatch[1].toUpperCase() as WorkOrderPrefixType;
      if (PREFIX_LABEL_MAP[parsedPfx]) {
        pfx = overridePrefix || parsedPfx;
      }
      yr = parseInt(woMatch[2], 10) || overrideYear;
      seq = parseInt(woMatch[3], 10);
    } 
    // 2. 尝试匹配项目全码：PRJ-2026-3212
    else if (/PRJ-(\d{4})-(\d+)/i.test(raw)) {
      const prjMatch = raw.match(/PRJ-(\d{4})-(\d+)/i)!;
      yr = parseInt(prjMatch[1], 10) || overrideYear;
      seq = parseInt(prjMatch[2], 10);
    }
    // 3. 尝试匹配预批单号：YP-2026-3212
    else if (/YP-(\d{4})-(\d+)/i.test(raw)) {
      const ypMatch = raw.match(/YP-(\d{4})-(\d+)/i)!;
      yr = parseInt(ypMatch[1], 10) || overrideYear;
      seq = parseInt(ypMatch[2], 10);
    }
    // 4. 尝试提取纯数字（如 "3212", "548", "ID: 548", "NO. 3212"）
    else {
      const numMatch = raw.match(/\d+/g);
      if (numMatch && numMatch.length > 0) {
        // 取最后一个数字段作为序列号
        const lastNum = parseInt(numMatch[numMatch.length - 1], 10);
        if (lastNum > 0) {
          seq = lastNum;
        }
      }
    }
  }

  // 保证序号合理
  seq = Math.max(1, seq);
  const sequencePadded = seq < 1000 ? String(seq).padStart(4, '0') : String(seq);
  const shortSeq = String(seq);

  const fullWorkOrderCode = `WO-${pfx}-${yr}-${sequencePadded}`;
  const prjFullCode = `PRJ-${yr}-${sequencePadded}`;
  const ypStandardNo = `YP-${yr}-${sequencePadded}`;
  const financeVoucherCode = `PZ-${yr}-11-${sequencePadded}`;
  const assetCode = `WLH-EQ-${yr}-${sequencePadded}`;

  return {
    sequenceNumber: seq,
    sequencePadded,
    year: yr,
    workOrder: {
      fullCode: fullWorkOrderCode,
      paperDocNo: `NO. ${fullWorkOrderCode}`,
      shortDocNo: `NO. ${shortSeq}`,
      type: pfx,
      typeLabel: PREFIX_LABEL_MAP[pfx] || '维修工单'
    },
    projectLedger: {
      id: shortSeq,
      fullCode: prjFullCode,
      displayLabel: `项目ID: ${shortSeq} (${prjFullCode})`
    },
    preApproval: {
      docNo: shortSeq,
      standardVoucherNo: ypStandardNo,
      fullDisplay: `费用预批单（编号：${shortSeq} / ${ypStandardNo}）`
    },
    financeVoucher: {
      code: financeVoucherCode
    },
    equipmentAsset: {
      code: assetCode
    }
  };
}

/**
 * 检验两个编号是否在逻辑上完全指向同一个申报项目与流水实体
 */
export function isCodingMatched(codeA?: string, codeB?: string): boolean {
  if (!codeA || !codeB) return false;
  const chainA = resolveHospitalCodingChain(codeA);
  const chainB = resolveHospitalCodingChain(codeB);
  return chainA.sequenceNumber === chainB.sequenceNumber;
}

/**
 * 获取编码体系官方说明文字（供弹窗、使用手册、提示信息复用）
 */
export const HOSPITAL_CODING_RULES_SPEC = [
  {
    step: '1. 临床报修 / 请示报告',
    codeFormat: 'WO-[业务]-[年份]-[4位流水]',
    example: 'WO-REP-2026-3212',
    paperFormat: 'NO. WO-REP-2026-3212 或 NO. 3212',
    description: '公文/工单发起源头，确定全生命周期年度基准流水号 3212。'
  },
  {
    step: '2. 全院设备项目总台账',
    codeFormat: 'PRJ-[年份]-[4位流水]',
    example: 'PRJ-2026-3212 (简码: 3212)',
    paperFormat: 'ID_项目: 3212',
    description: '全院443项立项批复与议价台账主键，与工单流水号 1 对 1 绑定。'
  },
  {
    step: '3. 费用预批单 (发票收到后开具)',
    codeFormat: 'YP-[年份]-[4位流水]',
    example: 'YP-2026-3212 (简码: 3212)',
    paperFormat: '费用预批单（编号：3212）',
    description: '正本联与存根联红头单据，编号与项目ID严格同频，并标明关联工单号与发票号。'
  },
  {
    step: '4. 增值税发票与三单勾稽',
    codeFormat: 'FP-[发票代码]-[发票号码]',
    example: 'FP-037002300111-2637481920',
    paperFormat: '发票号码: 2637481920',
    description: '税务局底账查验无误后挂入项目台账与预批单，形成资金报销凭据。'
  },
  {
    step: '5. 财务支付与出纳记账凭证',
    codeFormat: 'PZ-[年份]-[月份]-[4位流水]',
    example: 'PZ-2026-11-3212',
    paperFormat: '记账凭证号: PZ-2026-11-3212',
    description: '财务科网银电汇支付后完成出纳销账，最终档案归档结案。'
  }
];

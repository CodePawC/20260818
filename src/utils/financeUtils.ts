import { MedicalEquipment, RepairRecord, PartnerOrganization } from '../types';
import { DEFAULT_PARTNERS, findOrCreatePartnerProfile } from './partnerData';
import { getMonthlyFrameworkBatches } from './monthlyFrameworkData';

/**
 * 将阿拉伯数字金额转换为中文大写人民币金额
 * 例如: 72080 -> 人民币柒万贰仟零捌拾元整
 */
export function digitToChineseRmb(n: number): string {
  if (isNaN(n) || n === 0) return '人民币零元整';

  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [
    ['元', '万', '亿'],
    ['', '拾', '佰', '仟']
  ];

  const head = n < 0 ? '欠人民币' : '人民币';
  n = Math.abs(n);

  let s = '';
  const decimalPart = Math.floor((n % 1) * 100);
  const jiao = Math.floor(decimalPart / 10);
  const fen = Math.floor(decimalPart % 10);

  if (jiao > 0 || fen > 0) {
    s += (digit[jiao] + (jiao > 0 ? fraction[0] : '')) + (fen > 0 ? digit[fen] + fraction[1] : '');
  }

  let integerPart = Math.floor(n);
  let p = '';
  for (let i = 0; i < unit[0].length && integerPart > 0; i++) {
    let pBlock = '';
    for (let j = 0; j < unit[1].length && integerPart > 0; j++) {
      pBlock = digit[integerPart % 10] + unit[1][j] + pBlock;
      integerPart = Math.floor(integerPart / 10);
    }
    p = pBlock.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + p;
  }

  const result = head + (p.replace(/(零.)*零元/, '元')
    .replace(/(零.)+/g, '零')
    .replace(/^整$/, '零元整') || '零元') + (s ? s : '整');

  return result;
}

export type ScopeFilterMode = 'cumulative_month_end' | 'single_month' | 'all';
export type PaymentStatus = 'pending' | 'paid' | 'approving';

export interface RepairFinanceRecordItem {
  record: RepairRecord;
  equipment: MedicalEquipment;
  paymentStatus: PaymentStatus;
  invoiceNo?: string;
  vendorName: string;
  partnerInfo?: PartnerOrganization;
}

export interface VendorPayableSummary {
  vendorName: string;
  partnerId?: string;
  orderCount: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  bankName: string;
  accountNo: string;
  taxNo: string;
  contactPerson: string;
  contactPhone: string;
  settlementTerms: string;
}

export interface DepartmentExpenseSummary {
  deptName: string;
  orderCount: number;
  totalAmount: number;
  percentage: number;
}

export interface RepairTypeExpenseSummary {
  typeName: string;
  orderCount: number;
  totalAmount: number;
  percentage: number;
}

export interface MonthlyFinanceReportData {
  reportTitle: string;
  reportDocNo: string;
  targetYear: string;
  targetMonth: string;
  scopeMode: ScopeFilterMode;
  scopeLabel: string;
  cutoffDate: string;
  generatedDate: string;
  preparer: string;
  reviewer: string;
  targetDepartment: string;
  
  // 核心财务统计数据
  totalExpense: number;
  totalRmbWords: string;
  pendingPaymentAmount: number;
  pendingRmbWords: string;
  paidAmount: number;
  paidRmbWords: string;
  approvingAmount: number;
  
  // 业务覆盖度
  totalOrderCount: number;
  equipmentCount: number;
  departmentCount: number;
  vendorCount: number;
  
  // 大额审批款项 (单笔 >= 5000)
  overThresholdCount: number;
  overThresholdAmount: number;
  overThresholdRecords: RepairFinanceRecordItem[];
  
  // 分维度汇总
  vendorSummaries: VendorPayableSummary[];
  deptSummaries: DepartmentExpenseSummary[];
  typeSummaries: RepairTypeExpenseSummary[];
  
  // 逐笔明细
  records: RepairFinanceRecordItem[];
}

/**
 * 提取记录中的供应商名称
 */
export function extractVendorNameFromRecord(
  record: RepairRecord, 
  equipment: MedicalEquipment
): string {
  const tech = (record.technician || '').trim();
  if (tech) {
    if (tech.includes('西门子')) return '西门子医疗系统有限公司';
    if (tech.includes('迈瑞')) return '深圳迈瑞生物医疗电子股份有限公司';
    if (tech.includes('东软')) return '沈阳东软医疗系统有限公司';
    if (tech.includes('飞利浦')) return '飞利浦医疗科技(中国)有限公司';
    if (tech.includes('通用') || tech.includes('GE')) return '通用电气医疗系统(中国)有限公司';
    if (tech.includes('国药')) return '国药控股医学工程技术有限公司';
    if (tech.includes('柯渡')) return '上海柯渡医学科技股份有限公司';
    if (tech.includes('计量')) return '广东省计量科学研究院';
    if (tech.includes('迈柯唯') || tech.includes('洁定')) return '迈柯唯(上海)医疗设备有限公司';
    if (tech.includes('院内') || tech.includes('医工处') || tech.includes('自修')) {
      return '院内医学工程科 (配件自购直支)';
    }
    return tech;
  }

  const mfg = (equipment.manufacturer || '').trim();
  if (mfg) {
    return mfg;
  }

  return '特约外协维保服务商';
}

/**
 * 从本地存储读取或保存工单的付款状态
 */
export function getStoredPaymentStatusMap(): Record<string, PaymentStatus> {
  try {
    const raw = localStorage.getItem('hospital_repair_payment_status_map');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load payment status map', err);
  }
  return {};
}

export function saveStoredPaymentStatusMap(map: Record<string, PaymentStatus>) {
  try {
    localStorage.setItem('hospital_repair_payment_status_map', JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save payment status map', err);
  }
}

/**
 * 生成按月维修费用与财务付款资金筹备报表
 */
export function generateMonthlyFinanceReport(
  equipmentList: MedicalEquipment[],
  targetYear: string = '2026',
  targetMonth: string = '08',
  scopeMode: ScopeFilterMode = 'cumulative_month_end',
  partnersList: PartnerOrganization[] = DEFAULT_PARTNERS,
  customPaymentStatusMap: Record<string, PaymentStatus> = {}
): MonthlyFinanceReportData {
  const targetYearMonth = `${targetYear}-${targetMonth.padStart(2, '0')}`;
  // 当月最后一天日期
  const yearNum = parseInt(targetYear, 10);
  const monthNum = parseInt(targetMonth, 10);
  const lastDay = new Date(yearNum, monthNum, 0).getDate();
  const cutoffDate = `${targetYear}-${targetMonth.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // 1. 收集所有工单及关联设备
  const rawList: Array<{ record: RepairRecord; equipment: MedicalEquipment }> = [];
  equipmentList.forEach((eq) => {
    (eq.repairRecords || []).forEach((rec) => {
      rawList.push({ record: rec, equipment: eq });
    });
  });

  // 2. 根据范围筛选
  const matchedList = rawList.filter(({ record }) => {
    const dStr = (record.faultDate || record.completionDate || '').replace(/\//g, '-').slice(0, 10);
    if (!dStr) return false;

    if (scopeMode === 'cumulative_month_end') {
      // 截至目标月底 (<= YYYY-MM-DD)
      return dStr <= cutoffDate;
    } else if (scopeMode === 'single_month') {
      // 仅当月 (=== YYYY-MM)
      return dStr.startsWith(targetYearMonth);
    } else {
      // 全期
      return true;
    }
  });

  // 3. 构建逐笔财务包装数据
  const standardRecords: RepairFinanceRecordItem[] = matchedList.map(({ record, equipment }) => {
    const vendorName = extractVendorNameFromRecord(record, equipment);
    const partnerInfo = findOrCreatePartnerProfile(vendorName, partnersList, equipmentList);

    // 确定付款状态：若本地有标记则以本地为准；否则根据日期预设：
    // 2026年8月或7月后期的部分款项设为待付款，其余历史设为已付款
    let paymentStatus: PaymentStatus = customPaymentStatusMap[record.id] || 'pending';
    if (!customPaymentStatusMap[record.id]) {
      const recDate = (record.faultDate || '').replace(/\//g, '-');
      if (recDate >= '2026-07-01') {
        // 近期工单如果金额大或是8月，多为待付款
        paymentStatus = (record.cost || 0) > 0 ? 'pending' : 'paid';
      } else {
        paymentStatus = 'paid';
      }
    }

    return {
      record,
      equipment,
      paymentStatus,
      invoiceNo: (record.cost || 0) > 0 ? `FP-WL-${record.id.replace('REP-', '')}` : undefined,
      vendorName,
      partnerInfo
    };
  });

  // 3.1 提取并合并来自供应商月度框架协同补录的零星维保批次数据
  const frameworkBatches = getMonthlyFrameworkBatches();
  const frameworkRecords: RepairFinanceRecordItem[] = [];

  frameworkBatches.forEach((batch) => {
    batch.items.forEach((item) => {
      // 格式化服务施工日期为 YYYY-MM-DD
      const rawDate = (item.serviceDate || '').replace(/\//g, '-');
      const parts = rawDate.split('-');
      const dStr = parts.length === 3 
        ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
        : rawDate;
      if (!dStr) return;

      let matches = false;
      if (scopeMode === 'cumulative_month_end') {
        matches = dStr <= cutoffDate;
      } else if (scopeMode === 'single_month') {
        matches = dStr.startsWith(targetYearMonth);
      } else {
        matches = true;
      }

      if (!matches) return;

      const vendorName = batch.vendorName || '国药器械医工技术服务 (中国) 有限公司';
      const partnerInfo = findOrCreatePartnerProfile(vendorName, partnersList, equipmentList);

      let paymentStatus: PaymentStatus = customPaymentStatusMap[item.id] || customPaymentStatusMap[item.workOrderNo] || 'pending';
      if (!customPaymentStatusMap[item.id] && !customPaymentStatusMap[item.workOrderNo]) {
        if (batch.status === 'FINANCE_APPROVED') {
          paymentStatus = 'paid';
        } else if (batch.status === 'SUBMITTED_TO_HOSPITAL' || batch.status === 'AUDITED_BY_BIOMEDICAL') {
          paymentStatus = 'approving';
        } else {
          paymentStatus = 'pending';
        }
      }

      const simEquipment: MedicalEquipment = {
        id: `FRAMEWORK-${item.id}`,
        name: item.itemName,
        model: `${item.quantity}${item.unit}`,
        sn: item.workOrderNo || item.id,
        enableDate: dStr,
        department: item.department,
        status: '正常运行',
        manufacturer: '国药控股医疗供应链服务',
        category: '通用诊疗类',
        location: item.department,
        repairCount: 1,
        repairRecords: [],
        statusLogs: []
      };

      const simRecord: RepairRecord = {
        id: item.workOrderNo || item.id,
        equipmentId: simEquipment.id,
        equipmentName: item.itemName,
        equipmentSn: item.workOrderNo || item.id,
        faultDate: dStr,
        completionDate: dStr,
        faultDescription: `${item.itemName} (${item.quantity}${item.unit}，${item.notes || '月度框架维保目录更换'})`,
        repairType: '全院零星维保框架批次',
        cost: item.totalPrice,
        technician: item.technician || item.engineerName || '国药器械驻场服务工程师',
        resolution: '严格执行中标框架协议限价，科室验收签字且旧件原样退库',
        status: '已完成',
        department: item.department
      };

      frameworkRecords.push({
        record: simRecord,
        equipment: simEquipment,
        paymentStatus,
        invoiceNo: batch.invoiceRecord?.invoiceNo || `FP-BATCH-${batch.yearMonth.replace('-', '')}`,
        vendorName,
        partnerInfo
      });
    });
  });

  const records: RepairFinanceRecordItem[] = [...standardRecords, ...frameworkRecords];

  // 4. 计算指标
  let totalExpense = 0;
  let pendingPaymentAmount = 0;
  let paidAmount = 0;
  let approvingAmount = 0;
  const eqIdSet = new Set<string>();
  const deptSet = new Set<string>();
  const vendorMap: Record<string, VendorPayableSummary> = {};
  const deptMap: Record<string, { count: number; cost: number }> = {};
  const typeMap: Record<string, { count: number; cost: number }> = {};
  const overThresholdRecords: RepairFinanceRecordItem[] = [];

  records.forEach((item) => {
    const cost = item.record.cost || 0;
    totalExpense += cost;

    if (item.paymentStatus === 'pending') {
      pendingPaymentAmount += cost;
    } else if (item.paymentStatus === 'paid') {
      paidAmount += cost;
    } else if (item.paymentStatus === 'approving') {
      approvingAmount += cost;
    }

    eqIdSet.add(item.equipment.id);
    const dept = item.equipment.department || '未分配科室';
    deptSet.add(dept);

    // 大额维修
    if (cost >= 5000) {
      overThresholdRecords.push(item);
    }

    // 供应商统计
    const vName = item.vendorName;
    if (!vendorMap[vName]) {
      const p = item.partnerInfo;
      vendorMap[vName] = {
        vendorName: vName,
        partnerId: p?.id,
        orderCount: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        bankName: p?.bankAccount?.bankName || '中国工商银行日照五莲支行',
        accountNo: p?.bankAccount?.accountNo || ('3602000109000' + Math.abs(vName.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0) % 900000 + 100000)),
        taxNo: p?.bankAccount?.taxNo || ('91371121' + Math.abs(vName.split('').reduce((acc, c) => ((acc << 3) - acc + c.charCodeAt(0)) | 0, 0) % 90000000 + 10000000) + 'X'),
        contactPerson: p?.contactPerson || '业务经理/授权代表',
        contactPhone: p?.contactPhone || '0633-7991000 / 400-800-6688',
        settlementTerms: p?.settlementTerms || '凭维修验收单及增值税专用发票对账转账支付'
      };
    }
    vendorMap[vName].orderCount += 1;
    vendorMap[vName].totalAmount += cost;
    if (item.paymentStatus === 'pending') {
      vendorMap[vName].pendingAmount += cost;
    } else if (item.paymentStatus === 'paid') {
      vendorMap[vName].paidAmount += cost;
    }

    // 科室统计
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, cost: 0 };
    }
    deptMap[dept].count += 1;
    deptMap[dept].cost += cost;

    // 类型统计
    const t = item.record.repairType || '常规故障维修';
    if (!typeMap[t]) {
      typeMap[t] = { count: 0, cost: 0 };
    }
    typeMap[t].count += 1;
    typeMap[t].cost += cost;
  });

  // 供应商汇总数组（按总金额降序）
  const vendorSummaries = Object.values(vendorMap).sort((a, b) => b.totalAmount - a.totalAmount);

  // 科室汇总数组
  const deptSummaries = Object.entries(deptMap)
    .map(([deptName, val]) => ({
      deptName,
      orderCount: val.count,
      totalAmount: val.cost,
      percentage: totalExpense > 0 ? Number(((val.cost / totalExpense) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 类型汇总数组
  const typeSummaries = Object.entries(typeMap)
    .map(([typeName, val]) => ({
      typeName,
      orderCount: val.count,
      totalAmount: val.cost,
      percentage: totalExpense > 0 ? Number(((val.cost / totalExpense) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 范围描述
  let scopeLabel = '';
  if (scopeMode === 'cumulative_month_end') {
    scopeLabel = `截至 ${targetYear}年${targetMonth}月底 (截至${cutoffDate}累计)`;
  } else if (scopeMode === 'single_month') {
    scopeLabel = `${targetYear}年${targetMonth}月份 (${targetYearMonth}-01 至 ${cutoffDate})`;
  } else {
    scopeLabel = '全期累计发生';
  }

  const reportDocNo = `CW-MED-PAY-${targetYear}${targetMonth.padStart(2, '0')}-${String(Math.abs(Math.round(totalExpense % 900) + 100))}`;

  return {
    reportTitle: `五莲县人民医院医疗设备维修费用结算与财务付款请款报表 (${scopeLabel})`,
    reportDocNo,
    targetYear,
    targetMonth,
    scopeMode,
    scopeLabel,
    cutoffDate,
    generatedDate: new Date().toISOString().slice(0, 10),
    preparer: '崔伟 (医学装备科主管工程师)',
    reviewer: '医学装备科科长 / 医工处主任',
    targetDepartment: '财务科 / 预算与资金结算中心',

    totalExpense,
    totalRmbWords: digitToChineseRmb(totalExpense),
    pendingPaymentAmount,
    pendingRmbWords: digitToChineseRmb(pendingPaymentAmount),
    paidAmount,
    paidRmbWords: digitToChineseRmb(paidAmount),
    approvingAmount,

    totalOrderCount: records.length,
    equipmentCount: eqIdSet.size,
    departmentCount: deptSet.size,
    vendorCount: vendorSummaries.length,

    overThresholdCount: overThresholdRecords.length,
    overThresholdAmount: overThresholdRecords.reduce((s, r) => s + (r.record.cost || 0), 0),
    overThresholdRecords,

    vendorSummaries,
    deptSummaries,
    typeSummaries,

    records
  };
}

/**
 * 导出 CSV 报表，带 UTF-8 BOM 避免 Excel 打开中文乱码
 */
export function exportMonthlyFinanceReportCsv(report: MonthlyFinanceReportData) {
  const lines: string[] = [];

  // 表头公文信息
  lines.push(`"五莲县人民医院 医疗设备维修维保费用月度结算与财务付款资金请款单"`);
  lines.push(`"报表编号:","${report.reportDocNo}","统计范围:","${report.scopeLabel}","制表日期:","${report.generatedDate}"`);
  lines.push(`"呈报科室:","医学装备科","接收科室:","${report.targetDepartment}","制表人:","${report.preparer}"`);
  lines.push(`""`);

  // 资金总括
  lines.push(`"【一、财务资金拨付筹备总揽】"`);
  lines.push(`"统计期内维修总费用(元)","${report.totalExpense}","大写金额","${report.totalRmbWords}"`);
  lines.push(`"建议财务科准备付款资金(待付款)","${report.pendingPaymentAmount}","大写金额","${report.pendingRmbWords}"`);
  lines.push(`"已付已核销金额(元)","${report.paidAmount}","大写金额","${report.paidRmbWords}"`);
  lines.push(`"工单总笔数","${report.totalOrderCount}","涉及设备台数","${report.equipmentCount}","涉及科室数","${report.departmentCount}","涉及供应商数","${report.vendorCount}"`);
  lines.push(`""`);

  // 供应商应付款清单
  lines.push(`"【二、合作服务商/供应商应付款明细 (财务直接电汇打款指南)】"`);
  lines.push(`"序号","服务商单位全称","工单数","应付总额(元)","待付金额(元)","已付金额(元)","开户银行","对公银行账号","纳税人识别号","联系人及电话","结算条款"`);
  report.vendorSummaries.forEach((v, idx) => {
    lines.push(
      `"${idx + 1}","${v.vendorName}","${v.orderCount}","${v.totalAmount}","${v.pendingAmount}","${v.paidAmount}","${v.bankName}","\t${v.accountNo}","\t${v.taxNo}","${v.contactPerson} ${v.contactPhone}","${v.settlementTerms}"`
    );
  });
  lines.push(`""`);

  // 科室费用归集分摊
  lines.push(`"【三、各临床科室维修成本归集分摊表 (全成本核算)】"`);
  lines.push(`"序号","科室名称","维修工单数","归集维修总额(元)","全院费用占比(%)"`);
  report.deptSummaries.forEach((d, idx) => {
    lines.push(`"${idx + 1}","${d.deptName}","${d.orderCount}","${d.totalAmount}","${d.percentage}%"`);
  });
  lines.push(`""`);

  // 逐笔明细对账单
  lines.push(`"【四、维修工单逐笔明细对账台账】"`);
  lines.push(`"序号","工单编号","完工/故障日期","设备名称","规格型号","出厂SN / 资产号","使用科室","主修服务商/工程师","维修类别","更换配件及故障描述","费用(元)","付款状态","关联发票编号"`);
  report.records.forEach((r, idx) => {
    const statusText = r.paymentStatus === 'paid' ? '已付款/已核销' : r.paymentStatus === 'pending' ? '待付款请款' : '审批流转中';
    const desc = (r.record.partsReplaced ? `【配件】${r.record.partsReplaced}; ` : '') + (r.record.faultDescription || '');
    lines.push(
      `"${idx + 1}","${r.record.id}","${r.record.faultDate}","${r.equipment.name}","${r.equipment.model}","${r.equipment.sn || r.equipment.id}","${r.equipment.department}","${r.vendorName}","${r.record.repairType}","${desc.replace(/"/g, '""')}","${r.record.cost || 0}","${statusText}","${r.invoiceNo || '待开具'}"`
    );
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `五莲县人民医院_医疗设备维修费用结算与财务请款表_${report.targetYear}年${report.targetMonth}月.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

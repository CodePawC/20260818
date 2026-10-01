import { VendorCollaborationOrder } from '../types/vendorCollaborationTypes';
import { digitToChineseRmb } from './financeUtils';
import { getDepartmentMasterInfo } from './masterData';

export type ReportScopeMode = 'single_month' | 'cumulative_month_end' | 'all';

export interface VendorQuoteReportFilter {
  year: string;               // e.g. '2026'
  month: string;              // e.g. '09', '08', '07', 'ALL'
  scopeMode: ReportScopeMode; // 'single_month' (单月) | 'cumulative_month_end' (截至月末累计) | 'all' (全年度)
  selectedVendor: string;     // 'ALL' or vendor name
  selectedDept: string;       // 'ALL' or department name
  selectedStatus: string;     // 'ALL' or specific status
  searchKeyword: string;      // search order id, device, part
}

export interface VendorQuoteStats {
  totalCount: number;
  initialQuoteGrandTotal: number;
  quotePartsTotal: number;
  quoteLaborCost: number;
  quoteTravelCost: number;
  finalNegotiatedTotal: number;
  savingsAmountTotal: number;
  overallSavingsRate: number;
  invoicedTotal: number;
  invoicedCount: number;
  pendingInvoiceAmount: number;
  archivedCount: number;
}

export interface VendorSummaryItem {
  vendorId: string;
  vendorName: string;
  contactPerson: string;
  phone: string;
  orderCount: number;
  initialQuote: number; // 议价前申报总报价
  partsTotal: number;   // 议价前配件费小计
  laborAndTravel: number; // 议价前工时与差旅费小计
  partsCount: number;   // 拟换配件数
  pctOfTotal: number;   // 占全院申报总额比重 (%)
  finalPrice: number;
  savings: number;
  savingsRate: number;
  invoicedAmount: number;
}

export interface DeptProjectItem {
  orderId: string;
  workOrderId: string;
  equipmentName: string;
  equipmentModel: string;
  cleanEquipmentName: string;
  projectName: string;
  partsSummary: string;
  initialQuote: number;
}

export interface DeptSummaryItem {
  deptName: string;
  orderCount: number;
  partsCount: number;
  partsTotal: number;     // 议价前配件费小计
  laborAndTravel: number; // 议价前工时与差旅费小计
  initialQuote: number;   // 议价前申报总报价
  finalPrice: number;
  savings: number;
  pctOfHospital: number;  // 占全院申报总额比重 (%)
  projects: DeptProjectItem[]; // 具体维修项目及涉及设备清单
}

/**
 * 格式化提取标准化 YYYY-MM-DD
 */
export function extractOrderDate(order: VendorCollaborationOrder): string {
  if (!order.createdAt) return '2026-09-01';
  return order.createdAt.replace(/\//g, '-').slice(0, 10);
}

/**
 * 筛选外协维修协同工单
 */
export function filterVendorOrders(
  orders: VendorCollaborationOrder[],
  filter: VendorQuoteReportFilter
): VendorCollaborationOrder[] {
  const { year, month, scopeMode, selectedVendor, selectedDept, selectedStatus, searchKeyword } = filter;

  return orders.filter(order => {
    const dStr = extractOrderDate(order); // '2026-09-08'
    const orderYear = dStr.slice(0, 4);
    const orderMonth = dStr.slice(5, 7);
    const orderYearMonth = dStr.slice(0, 7);
    const targetYearMonth = `${year}-${month.padStart(2, '0')}`;

    // 1. 时间筛选
    if (scopeMode === 'all') {
      if (year !== 'ALL' && orderYear !== year) return false;
    } else if (scopeMode === 'single_month') {
      if (orderYearMonth !== targetYearMonth) return false;
    } else if (scopeMode === 'cumulative_month_end') {
      // 截至 targetYearMonth 底累计
      if (orderYearMonth > targetYearMonth) return false;
      if (year !== 'ALL' && orderYear < year) return false; // 同一年度内截至某月底
    }

    // 2. 供应商筛选
    if (selectedVendor !== 'ALL') {
      if (order.vendorName !== selectedVendor && order.vendorId !== selectedVendor) {
        return false;
      }
    }

    // 3. 科室筛选
    if (selectedDept !== 'ALL') {
      const stdDept = getDepartmentMasterInfo(order.equipmentDept).department;
      if (stdDept !== selectedDept && order.equipmentDept !== selectedDept && !order.equipmentDept.includes(selectedDept)) {
        return false;
      }
    }

    // 4. 状态筛选
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'NEGOTIATED') {
        if (!order.finalNegotiatedPrice || order.finalNegotiatedPrice <= 0) return false;
      } else if (selectedStatus === 'INVOICED') {
        if (!order.invoiceRecord || order.invoiceRecord.invoiceAmount <= 0) return false;
      } else if (selectedStatus === 'ARCHIVED') {
        if (!order.isDossierArchived) return false;
      } else if (order.status !== selectedStatus) {
        return false;
      }
    }

    // 5. 关键字搜索
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      const matchId = order.id.toLowerCase().includes(kw);
      const matchWo = order.workOrderId.toLowerCase().includes(kw);
      const matchDev = order.equipmentName.toLowerCase().includes(kw);
      const matchModel = order.equipmentModel.toLowerCase().includes(kw);
      const matchVendor = order.vendorName.toLowerCase().includes(kw);
      const matchDept = order.equipmentDept.toLowerCase().includes(kw);
      const matchParts = order.quoteParts?.some(p => p.name.toLowerCase().includes(kw) || p.spec?.toLowerCase().includes(kw));

      if (!matchId && !matchWo && !matchDev && !matchModel && !matchVendor && !matchDept && !matchParts) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 汇总计算关键财务与业务指标
 */
export function calculateVendorQuoteStats(orders: VendorCollaborationOrder[]): VendorQuoteStats {
  let initialQuoteGrandTotal = 0;
  let quotePartsTotal = 0;
  let quoteLaborCost = 0;
  let quoteTravelCost = 0;
  let finalNegotiatedTotal = 0;
  let savingsAmountTotal = 0;
  let invoicedTotal = 0;
  let invoicedCount = 0;
  let archivedCount = 0;

  orders.forEach(order => {
    const initPrice = order.quoteGrandTotal || 0;
    initialQuoteGrandTotal += initPrice;
    quotePartsTotal += order.quotePartsTotal || 0;
    quoteLaborCost += order.quoteLaborCost || 0;
    quoteTravelCost += order.quoteTravelCost || 0;

    // 若有最终审定价则采用，否则若在议价中可按原报价计
    const finalPrice = order.finalNegotiatedPrice > 0 ? order.finalNegotiatedPrice : initPrice;
    finalNegotiatedTotal += finalPrice;

    const sav = order.savingsAmount || Math.max(0, initPrice - finalPrice);
    savingsAmountTotal += sav;

    if (order.invoiceRecord && order.invoiceRecord.invoiceAmount > 0) {
      invoicedTotal += order.invoiceRecord.invoiceAmount;
      invoicedCount++;
    }

    if (order.isDossierArchived) {
      archivedCount++;
    }
  });

  const overallSavingsRate = initialQuoteGrandTotal > 0
    ? Number(((savingsAmountTotal / initialQuoteGrandTotal) * 100).toFixed(1))
    : 0;

  const pendingInvoiceAmount = Math.max(0, finalNegotiatedTotal - invoicedTotal);

  return {
    totalCount: orders.length,
    initialQuoteGrandTotal,
    quotePartsTotal,
    quoteLaborCost,
    quoteTravelCost,
    finalNegotiatedTotal,
    savingsAmountTotal,
    overallSavingsRate,
    invoicedTotal,
    invoicedCount,
    pendingInvoiceAmount,
    archivedCount,
  };
}

/**
 * 按外协供应商聚合统计 (采用议价前原始申报报价口径)
 */
export function aggregateByVendor(orders: VendorCollaborationOrder[], totalInitialQuote?: number): VendorSummaryItem[] {
  const map = new Map<string, VendorSummaryItem>();
  const hospitalInitTotal = totalInitialQuote ?? orders.reduce((sum, o) => sum + (o.quoteGrandTotal || 0), 0);

  orders.forEach(order => {
    const key = order.vendorName || '其他外协供应商';
    const existing = map.get(key);

    const initQuote = order.quoteGrandTotal || 0;
    const partsSum = order.quotePartsTotal || 0;
    const laborTravelSum = (order.quoteLaborCost || 0) + (order.quoteTravelCost || 0);
    const finalPrice = order.finalNegotiatedPrice > 0 ? order.finalNegotiatedPrice : initQuote;
    const savings = order.savingsAmount || Math.max(0, initQuote - finalPrice);
    const invoiceAmt = order.invoiceRecord?.invoiceAmount || 0;
    const partsNum = order.quoteParts?.length || 0;

    if (!existing) {
      map.set(key, {
        vendorId: order.vendorId,
        vendorName: key,
        contactPerson: order.vendorContact || '未登记',
        phone: order.vendorPhone || '-',
        orderCount: 1,
        initialQuote: initQuote,
        partsTotal: partsSum,
        laborAndTravel: laborTravelSum,
        partsCount: partsNum,
        pctOfTotal: 0,
        finalPrice: finalPrice,
        savings: savings,
        savingsRate: 0,
        invoicedAmount: invoiceAmt,
      });
    } else {
      existing.orderCount += 1;
      existing.initialQuote += initQuote;
      existing.partsTotal += partsSum;
      existing.laborAndTravel += laborTravelSum;
      existing.partsCount += partsNum;
      existing.finalPrice += finalPrice;
      existing.savings += savings;
      existing.invoicedAmount += invoiceAmt;
    }
  });

  const list = Array.from(map.values());
  list.forEach(item => {
    item.pctOfTotal = hospitalInitTotal > 0
      ? Number(((item.initialQuote / hospitalInitTotal) * 100).toFixed(1))
      : 0;
    item.savingsRate = item.initialQuote > 0
      ? Number(((item.savings / item.initialQuote) * 100).toFixed(1))
      : 0;
  });

  // 全部按议价前原始总报价降序排列
  return list.sort((a, b) => b.initialQuote - a.initialQuote);
}

/**
 * 按临床科室聚合统计外协维修费用与报价 (采用议价前原始申报报价口径)
 */
export function aggregateByDept(orders: VendorCollaborationOrder[], totalInitialQuote?: number): DeptSummaryItem[] {
  const map = new Map<string, DeptSummaryItem>();
  const hospitalInitTotal = totalInitialQuote ?? orders.reduce((sum, o) => sum + (o.quoteGrandTotal || 0), 0);

  orders.forEach(order => {
    // 严格与医院科室主数据字典对齐
    const resolved = getDepartmentMasterInfo(order.equipmentDept);
    const dept = resolved.department || order.equipmentDept || '未指定科室';
    const existing = map.get(dept);

    const initQuote = order.quoteGrandTotal || 0;
    const partsSum = order.quotePartsTotal || 0;
    const laborTravelSum = (order.quoteLaborCost || 0) + (order.quoteTravelCost || 0);
    const finalPrice = order.finalNegotiatedPrice > 0 ? order.finalNegotiatedPrice : initQuote;
    const savings = order.savingsAmount || Math.max(0, initQuote - finalPrice);
    const partsNum = order.quoteParts?.length || 0;

    // 提炼具体维修项目名称与配件描述
    const partsSummary = order.quoteParts && order.quoteParts.length > 0
      ? order.quoteParts.map(p => `${p.name}${p.quantity > 1 ? `x${p.quantity}` : ''}`).join('、')
      : '常规维修与校准服务';

    // 提取精简设备名称
    const devName = order.equipmentName || '医疗设备';
    const cleanDevName = devName.replace(/[\(（].*?[\)）]/g, '').trim() || devName;
    const projectName = `${cleanDevName} (更换${partsSummary})`;

    const projectItem: DeptProjectItem = {
      orderId: order.id,
      workOrderId: order.workOrderId,
      equipmentName: order.equipmentName,
      equipmentModel: order.equipmentModel,
      cleanEquipmentName: cleanDevName,
      projectName,
      partsSummary,
      initialQuote: initQuote,
    };

    if (!existing) {
      map.set(dept, {
        deptName: dept,
        orderCount: 1,
        partsCount: partsNum,
        partsTotal: partsSum,
        laborAndTravel: laborTravelSum,
        initialQuote: initQuote,
        finalPrice: finalPrice,
        savings: savings,
        pctOfHospital: 0,
        projects: [projectItem],
      });
    } else {
      existing.orderCount += 1;
      existing.partsCount += partsNum;
      existing.partsTotal += partsSum;
      existing.laborAndTravel += laborTravelSum;
      existing.initialQuote += initQuote;
      existing.finalPrice += finalPrice;
      existing.savings += savings;
      existing.projects.push(projectItem);
    }
  });

  const list = Array.from(map.values());
  list.forEach(item => {
    item.pctOfHospital = hospitalInitTotal > 0
      ? Number(((item.initialQuote / hospitalInitTotal) * 100).toFixed(1))
      : 0;
  });

  // 全部按议价前原始申报总报价降序排列
  return list.sort((a, b) => b.initialQuote - a.initialQuote);
}

/**
 * 导出外协维修月度报价完整 CSV 报表 (带 UTF-8 BOM，Excel 打开绝不乱码)
 */
export function exportVendorQuoteReportCsv(
  orders: VendorCollaborationOrder[],
  stats: VendorQuoteStats,
  meta: {
    hospitalName?: string;
    periodLabel: string;
    exportDate?: string;
    preparedBy?: string;
  }
): void {
  const hospital = meta.hospitalName || '五莲县人民医院';
  const exportDate = meta.exportDate || new Date().toISOString().slice(0, 10);
  const preparedBy = meta.preparedBy || '医学装备科';

  const rows: string[] = [];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  // 1. 报表表头
  rows.push(`${escapeCsv(`${hospital} - 外协维修报价月度分析与审价报表`)}`);
  rows.push(`${escapeCsv(`统计周期: ${meta.periodLabel}`) },${escapeCsv(`生成时间: ${exportDate}`) },${escapeCsv(`制表部门: ${preparedBy}`)}`);
  rows.push('');

  // 2. KPI 宏观指标摘要
  rows.push(`${escapeCsv('【外协维修报价与多科室联合审价宏观汇总】')}`);
  rows.push(`"外协工单总数","${stats.totalCount} 笔"`);
  rows.push(`"供应商原始报价总额","￥${stats.initialQuoteGrandTotal.toLocaleString()}"`);
  rows.push(`"最终审定成交总金额","￥${stats.finalNegotiatedTotal.toLocaleString()}"`);
  rows.push(`"中文大写人民币金额","${digitToChineseRmb(stats.finalNegotiatedTotal)}"`);
  rows.push(`"联合议价审减节资总额","￥${stats.savingsAmountTotal.toLocaleString()}"`);
  rows.push(`"综合平均节资率","${stats.overallSavingsRate}%"`);
  rows.push(`"配件拟换总金额","￥${stats.quotePartsTotal.toLocaleString()}"`);
  rows.push(`"人工工时及差旅费","￥${(stats.quoteLaborCost + stats.quoteTravelCost).toLocaleString()}"`);
  rows.push(`"已开具发票金额","￥${stats.invoicedTotal.toLocaleString()}"`);
  rows.push(`"待开票与未结转金额","￥${stats.pendingInvoiceAmount.toLocaleString()}"`);
  rows.push('');

  // 3. 供应商统计表 (议价前申报价格口径)
  const vendorSummary = aggregateByVendor(orders, stats.initialQuoteGrandTotal);
  rows.push(`${escapeCsv('【一、各外协供应商申报报价汇总表 (议价前)】')}`);
  rows.push('"序号","供应商名称","业务对接人","联系电话","申报工单数","拟换配件数","配件报价小计(元)","工时差旅小计(元)","议价前申报总报价(元)","占全院申报总额比重(%)"');
  vendorSummary.forEach((v, idx) => {
    rows.push([
      idx + 1,
      escapeCsv(v.vendorName),
      escapeCsv(v.contactPerson),
      escapeCsv(v.phone),
      v.orderCount,
      v.partsCount,
      v.partsTotal,
      v.laborAndTravel,
      v.initialQuote,
      `${v.pctOfTotal}%`,
    ].join(','));
  });
  rows.push('');

  // 4. 科室统计表 (议价前申报价格口径)
  const deptSummary = aggregateByDept(orders, stats.initialQuoteGrandTotal);
  rows.push(`${escapeCsv('【二、各临床科室维修申报分摊汇总 (议价前)】')}`);
  rows.push('"序号","临床科室","具体维修项目","申报工单数","拟换配件数","议价前申报总报价(元)","占全院申报总额比重(%)"');
  deptSummary.forEach((d, idx) => {
    rows.push([
      idx + 1,
      escapeCsv(d.deptName),
      escapeCsv(d.projects.map(p => p.projectName).join('; ')),
      d.orderCount,
      d.partsCount,
      d.initialQuote,
      `${d.pctOfHospital}%`,
    ].join(','));
  });
  rows.push('');

  // 5. 逐笔工单明细清单 (议价前申报价格口径)
  rows.push(`${escapeCsv('【三、外协维修工单逐笔申报报价台账 (议价前)】')}`);
  rows.push('"协同编号","院内工单号","申报日期","设备名称","规格型号","安装科室","外协供应商","紧急程度","拟换配件明细","配件申报小计(元)","工时费(元)","差旅费(元)","议价前申报总额(元)","当前状态"');
  
  orders.forEach(order => {
    const partsDesc = order.quoteParts?.map(p => `${p.name}(${p.spec || '标配'})*${p.quantity} [单价:￥${p.unitPrice}]`).join('; ') || '无配件(纯工时)';
    const statusMap: Record<string, string> = {
      'PENDING_DISPATCH': '待派工',
      'VENDOR_QUOTED': '已出报价待审',
      'MULTI_DEPT_NEGOTIATING': '多科室联合议价中',
      'REPAIRING': '外协工程师施工中',
      'COMPLETED_PENDING_INVOICE': '已完工待开发票',
      'INVOICE_UPLOADED': '发票已上传待核验',
      'ARCHIVED': '已全流程归档',
    };
    const statusText = statusMap[order.status] || order.status;

    rows.push([
      escapeCsv(order.id),
      escapeCsv(order.workOrderId),
      escapeCsv(extractOrderDate(order)),
      escapeCsv(order.equipmentName),
      escapeCsv(order.equipmentModel),
      escapeCsv(order.equipmentDept),
      escapeCsv(order.vendorName),
      escapeCsv(order.urgencyLevel === 'EMERGENCY' ? '特急' : order.urgencyLevel === 'HIGH' ? '高' : '普通'),
      escapeCsv(partsDesc),
      order.quotePartsTotal || 0,
      order.quoteLaborCost || 0,
      order.quoteTravelCost || 0,
      order.quoteGrandTotal || 0,
      escapeCsv(statusText),
    ].join(','));
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `外协维修报价月度分析报表_${meta.periodLabel.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_导出.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

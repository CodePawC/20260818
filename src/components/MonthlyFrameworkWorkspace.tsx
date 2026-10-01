import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, X, Receipt, Landmark, CheckCircle2, ShieldCheck, 
  Download, Calendar, Layers, Clock, ArrowRight, FileSpreadsheet, 
  RefreshCw, Check, Printer, Wallet, Building2 
} from 'lucide-react';
import { 
  MonthlyFrameworkBatch, 
  MonthlyFrameworkItem, 
  VendorUserAccount,
  FrameworkBatchInvoice 
} from '../types/vendorCollaborationTypes';
import { 
  getMonthlyFrameworkBatches, 
  saveMonthlyFrameworkBatches, 
  recalculateBatchTotals,
  enrichBatchFinancials 
} from '../utils/monthlyFrameworkData';
import { MonthlyFrameworkBatchModal } from './MonthlyFrameworkBatchModal';
import { MonthlyFrameworkAuditReportModal } from './MonthlyFrameworkAuditReportModal';
import { VENDOR_ACCOUNTS } from '../utils/vendorCollaborationData';

import { MonthlySidebar, WorkspaceViewMode } from './monthly/MonthlySidebar';
import { MonthlyMetricsCards } from './monthly/MonthlyMetricsCards';
import { MonthlyReconciliationSummary } from './monthly/MonthlyReconciliationSummary';
import { MonthlyPaymentLedger } from './monthly/MonthlyPaymentLedger';
import { MonthlyDetailTable, FlattenedFrameworkItem } from './monthly/MonthlyDetailTable';
import { ClinicalItemSignModal } from './monthly/ClinicalItemSignModal';
import { DepartmentMaster, AuthUser } from '../types';
import { loadMasterData, DEFAULT_DEPARTMENTS, resolveMasterDepartment, matchesDepartment } from '../utils/masterData';
import { getUserDepartment, isHeadNurse, isClinicalStaff, isDepartmentRestricted } from '../utils/authUtils';

interface MonthlyFrameworkWorkspaceProps {
  currentVendor?: VendorUserAccount;
  currentUser?: AuthUser | null;
  departments?: DepartmentMaster[];
  onSwitchToSpecialOrders?: () => void;
  isHospitalView?: boolean;
  hideHeader?: boolean;
  onLogout?: () => void;
  onSwitchVendor?: (vendor: VendorUserAccount) => void;
}

const COMMON_DEPARTMENTS = [
  '麻醉手术科', '动力设备层', '影像科', '消毒供应室', '急救站', 
  '急诊监护室', '彩超科', '彩超室', '财务科', '康复科', 
  '口腔科', '高压氧舱', '骨一科', '内分泌科', '普外一科', 
  '医用气站', '创伤外科', '妇产科', '作风办'
];

export const MonthlyFrameworkWorkspace: React.FC<MonthlyFrameworkWorkspaceProps> = ({
  currentVendor: propVendor,
  currentUser,
  departments: propDepartments,
  onSwitchToSpecialOrders,
  isHospitalView = false,
  hideHeader = false,
  onLogout,
  onSwitchVendor,
}) => {
  const currentVendor = propVendor || VENDOR_ACCOUNTS[0];

  // 医院科室全量主数据
  const hospitalDepts = useMemo(() => {
    if (propDepartments && propDepartments.length > 0) return propDepartments;
    const loaded = loadMasterData();
    return loaded.departments && loaded.departments.length > 0 ? loaded.departments : DEFAULT_DEPARTMENTS;
  }, [propDepartments]);

  // 解析并规范化当前登录用户所属科室（如“手术室”->“麻醉手术科”）
  const userDept = getUserDepartment(currentUser);
  const effectiveUserDept = useMemo(() => {
    if (!userDept) return '';
    if (userDept.includes('手术') || userDept.includes('麻醉')) return '麻醉手术科';
    const matched = resolveMasterDepartment(userDept, hospitalDepts);
    return matched ? matched.name : userDept;
  }, [userDept, hospitalDepts]);

  // 判断当前用户是否属于临床科室人员（护士长、临床医护或科室限制人员）
  const isClinicalOrDeptUser = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.isAdmin) return false;
    if (effectiveUserDept.includes('医学工程') || effectiveUserDept.includes('信息科')) return false;
    return isHeadNurse(currentUser) || isClinicalStaff(currentUser) || isDepartmentRestricted(currentUser) || (!!effectiveUserDept && effectiveUserDept !== '全院');
  }, [currentUser, effectiveUserDept]);

  const [batches, setBatches] = useState<MonthlyFrameworkBatch[]>(() => getMonthlyFrameworkBatches());
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL_BATCHES');
  const [activeView, setActiveView] = useState<WorkspaceViewMode>('ALL');

  // 科室协同视角状态：临床科室人员（如麻醉手术科）默认直接锁定本科室；全院管理员或医工默认全院
  const [deptFilter, setDeptFilter] = useState<string>(() => {
    if (isClinicalOrDeptUser && effectiveUserDept) return effectiveUserDept;
    return '';
  });
  const [deptScopeMode, setDeptScopeMode] = useState<'DEPT' | 'ALL'>(() => {
    return (isClinicalOrDeptUser && effectiveUserDept) ? 'DEPT' : 'ALL';
  });

  // 当外部用户发生切换时同步科室视角
  useEffect(() => {
    if (isClinicalOrDeptUser && effectiveUserDept) {
      setDeptFilter(effectiveUserDept);
      setDeptScopeMode('DEPT');
    }
  }, [effectiveUserDept, isClinicalOrDeptUser]);

  // 科室接收与电子签字弹窗状态
  const [signingItem, setSigningItem] = useState<FlattenedFrameworkItem | null>(null);
  const [showClinicalSignModal, setShowClinicalSignModal] = useState<boolean>(false);
  const [clinicalSignFilter, setClinicalSignFilter] = useState<string>('');

  // 模态框状态
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchModalMode, setBatchModalMode] = useState<'TSV_IMPORT' | 'SINGLE_ITEM' | 'INVOICE_BINDING'>('TSV_IMPORT');
  const [showAuditReportModal, setShowAuditReportModal] = useState<boolean>(false);
  
  // 单笔手工补录弹窗
  const [showSingleEntryModal, setShowSingleEntryModal] = useState<boolean>(false);
  const [singleTargetBatchId, setSingleTargetBatchId] = useState<string>('BATCH-2026-09');
  const [singleItemName, setSingleItemName] = useState('');
  const [singleDept, setSingleDept] = useState(() => effectiveUserDept || '麻醉手术科');
  const [singleDate, setSingleDate] = useState('2026/09/16');
  const [singleUnit, setSingleUnit] = useState('台');
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [singleUnitPrice, setSingleUnitPrice] = useState<number>(200);
  const [singleEngineer, setSingleEngineer] = useState('陈工');
  const [singleSignee, setSingleSignee] = useState('科室护士长');
  const [singleOldPartsReturned, setSingleOldPartsReturned] = useState(true);
  const [singleNotes, setSingleNotes] = useState('');
  const [singleEntrySuccessTip, setSingleEntrySuccessTip] = useState<string | null>(null);

  // 快捷开票与登记回款弹窗
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentBatchTarget, setPaymentBatchTarget] = useState<MonthlyFrameworkBatch | null>(null);
  const [paymentVoucherInput, setPaymentVoucherInput] = useState<string>('');
  const [paymentBankInput, setPaymentBankInput] = useState<string>('中国银行国库集中支付对公电汇');
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);

  const [showQuickInvoiceModal, setShowQuickInvoiceModal] = useState<boolean>(false);
  const [quickInvoiceNo, setQuickInvoiceNo] = useState<string>('68294109');
  const [quickInvoiceCode, setQuickInvoiceCode] = useState<string>('044002200111');
  const [quickTaxRate, setQuickTaxRate] = useState<number>(13);

  // 搜索与过滤状态
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [invoiceFilter, setInvoiceFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBatchId, searchKeyword, deptFilter, invoiceFilter, paymentFilter, pageSize, activeView]);

  // 保存单个批次更新
  const handleSaveBatch = (updatedBatch: MonthlyFrameworkBatch) => {
    const enriched = enrichBatchFinancials(updatedBatch);
    const nextBatches = batches.map(b => b.id === enriched.id ? enriched : b);
    setBatches(nextBatches);
    saveMonthlyFrameworkBatches(nextBatches);
  };

  // 全量维修明细拉平汇总
  const allItems: FlattenedFrameworkItem[] = useMemo(() => {
    return batches.flatMap(b => b.items.map(it => ({
      ...it,
      batchId: b.id,
      batchYearMonth: b.yearMonth,
      batchPaymentStatus: b.paymentStatus,
      batchPaymentVoucherNo: b.paymentVoucherNo,
      invoiced: it.invoiced ?? (b.invoiceStatus === 'INVOICED'),
      invoiceNo: it.invoiceNo || b.invoiceRecord?.invoiceNo,
      oldPartsReturned: it.oldPartsReturned ?? true,
    })));
  }, [batches]);

  // 按当前科室筛选范围过滤出的项目
  const scopedAllItems = useMemo(() => {
    if (!deptFilter) return allItems;
    return allItems.filter(it => matchesDepartment(it.department, deptFilter, hospitalDepts));
  }, [allItems, deptFilter, hospitalDepts]);

  // 当前用户所属科室关联项目数
  const userDeptItemCount = useMemo(() => {
    if (!effectiveUserDept) return 0;
    return allItems.filter(it => matchesDepartment(it.department, effectiveUserDept, hospitalDepts)).length;
  }, [allItems, effectiveUserDept, hospitalDepts]);

  const selectedDeptItemCount = scopedAllItems.length;

  // 核心财务与对账指标（依据当前科室范围智能联动统计）
  const financialStats = useMemo(() => {
    const sourceItems = scopedAllItems;
    const totalAmount = sourceItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
    const totalItems = sourceItems.length;

    const paidItems = sourceItems.filter(it => it.batchPaymentStatus === 'PAID');
    const paidAmount = paidItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

    const inTransitItems = sourceItems.filter(it => it.batchPaymentStatus === 'IN_TRANSIT');
    const inTransitAmount = inTransitItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

    const unbilledItems = sourceItems.filter(it => it.batchPaymentStatus === 'UNBILLED');
    const unbilledPaymentAmount = unbilledItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

    const paidRate = totalAmount > 0 ? parseFloat(((paidAmount / totalAmount) * 100).toFixed(1)) : 0;
    const inTransitRate = totalAmount > 0 ? parseFloat(((inTransitAmount / totalAmount) * 100).toFixed(1)) : 0;
    const unbilledRate = totalAmount > 0 ? parseFloat(((unbilledPaymentAmount / totalAmount) * 100).toFixed(1)) : 0;

    const uninvoicedItems = sourceItems.filter(it => !it.invoiced);
    const uninvoicedAmount = uninvoicedItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
    const uninvoicedCount = uninvoicedItems.length;

    const invoicedItems = sourceItems.filter(it => !!it.invoiced);
    const invoicedAmount = invoicedItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
    const invoicedCount = invoicedItems.length;

    const totalHospitalApproved = sourceItems.reduce((sum, it) => sum + (Number(it.hospitalApprovedPrice ?? it.totalPrice) || 0), 0);
    const discrepancyAmount = parseFloat(Math.abs(totalAmount - totalHospitalApproved).toFixed(2));

    return {
      totalAmount,
      totalItems,
      paidAmount,
      inTransitAmount,
      unbilledPaymentAmount,
      paidRate,
      inTransitRate,
      unbilledRate,
      uninvoicedAmount,
      uninvoicedCount,
      invoicedAmount,
      invoicedCount,
      totalHospitalApproved,
      discrepancyAmount
    };
  }, [scopedAllItems]);

  const currentBatch = useMemo(() => {
    if (selectedBatchId === 'ALL_BATCHES') {
      return batches.find(b => b.id === 'BATCH-2026-09') || batches[0];
    }
    return batches.find(b => b.id === selectedBatchId) || batches[0];
  }, [batches, selectedBatchId]);

  // 单笔手工录入
  const handleSaveSingleItem = (andContinue: boolean = false) => {
    if (!singleItemName.trim()) {
      alert('请输入维修及配件更换项目名称');
      return;
    }

    const targetBatch = batches.find(b => b.id === singleTargetBatchId) || batches[0];
    if (!targetBatch) return;

    const qty = Math.max(1, Number(singleQuantity) || 1);
    const price = Math.max(0, Number(singleUnitPrice) || 0);
    const total = parseFloat((qty * price).toFixed(2));
    
    let auditTag: MonthlyFrameworkItem['auditTag'] = '常规零星维修';
    if (total < 1000) auditTag = '小额直接报销';
    else if (qty > 1) auditTag = '多台合并维保';
    else if (total >= 5000) auditTag = '大额审签特批';

    const cleanDept = singleDept.trim() || '麻醉手术科';
    const cleanEngineer = singleEngineer.trim() || '驻场工程师';
    const cleanSigner = singleSignee.trim() || '科室护士长';

    // 智能联动医院主数据科室
    const masterDept = resolveMasterDepartment(cleanDept, hospitalDepts);
    const resolvedDeptName = masterDept ? masterDept.name : cleanDept;
    const finalSigner = cleanSigner || (masterDept?.defaultManager ? `${masterDept.defaultManager} (护士长)` : `${resolvedDeptName} 护士长`);

    const newItem: MonthlyFrameworkItem = {
      id: `ITEM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      itemName: singleItemName.trim(),
      unit: singleUnit || '台',
      quantity: qty,
      unitPrice: price,
      totalPrice: total,
      hospitalApprovedPrice: total,
      reconciliationDifference: 0,
      department: resolvedDeptName,
      departmentId: masterDept?.id,
      departmentCode: masterDept?.code,
      departmentCampus: masterDept?.campusName || '五莲县人民医院',
      departmentBuilding: masterDept?.buildingName,
      departmentFloor: masterDept?.defaultFloor,
      departmentPhone: masterDept?.nursePhone,
      departmentHead: masterDept?.defaultManager,
      serviceDate: singleDate.trim() || '2026/09/16',
      status: 'COMPLETED',
      technician: cleanEngineer,
      engineerName: cleanEngineer,
      clinicalReceiveStatus: 'SIGNED',
      clinicalSigner: finalSigner,
      clinicalSignee: finalSigner,
      clinicalSignerRole: '科室护士长 / 设备安全员',
      clinicalSignatureCertId: `CASIG-NEW-${Date.now().toString().slice(-4)}`,
      clinicalSignatureTime: `${singleDate.trim() || '2026/09/16'} 16:30`,
      clinicalFeedback: '现场核对配件装配到位，通电试机运行平稳，电气安全自检合格，准予恢复临床使用。',
      clinicalRating: 5,
      workOrderNo: `WO-${targetBatch.yearMonth.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      oldPartsReturned: singleOldPartsReturned,
      auditTag,
      notes: singleNotes.trim() || '协同门户在线单笔补录（已核验主数据科室）'
    };

    const nextItems = [...targetBatch.items, newItem];
    const updated = recalculateBatchTotals({
      ...targetBatch,
      items: nextItems,
    });
    handleSaveBatch(updated);

    const msg = `已成功新增 1 笔明细并归档至【${targetBatch.yearMonth} 批次】（科室：${resolvedDeptName} · 金额：¥${total.toFixed(2)}）`;
    setSingleEntrySuccessTip(msg);
    setTimeout(() => setSingleEntrySuccessTip(null), 4000);

    if (andContinue) {
      setSingleItemName('');
      setSingleNotes('');
      setSingleQuantity(1);
    } else {
      setShowSingleEntryModal(false);
      setSingleItemName('');
      setSingleNotes('');
    }
  };

  // 科室维修接收与电子签字持久化保存
  const handleSaveClinicalSignature = (
    itemId: string,
    payload: {
      clinicalReceiveStatus: 'SIGNED' | 'RECEIVED';
      clinicalSignee: string;
      clinicalSignerRole: string;
      clinicalSignatureTime: string;
      clinicalSignatureCertId: string;
      clinicalSignatureData?: string;
      clinicalFeedback: string;
      clinicalRating: number;
      department: string;
      departmentId?: string;
      departmentCode?: string;
      departmentCampus?: string;
      departmentBuilding?: string;
      departmentFloor?: string;
      departmentPhone?: string;
      departmentHead?: string;
    }
  ) => {
    let targetBatchFound: MonthlyFrameworkBatch | null = null;
    for (const b of batches) {
      if (b.items.some(it => it.id === itemId)) {
        targetBatchFound = b;
        break;
      }
    }

    if (!targetBatchFound) return;

    const nextItems = targetBatchFound.items.map(it => {
      if (it.id !== itemId) return it;
      return {
        ...it,
        ...payload,
        clinicalSigner: payload.clinicalSignee,
      };
    });

    const updatedBatch = enrichBatchFinancials({
      ...targetBatchFound,
      items: nextItems,
    });

    handleSaveBatch(updatedBatch);
    setSingleEntrySuccessTip(`✓ 科室电子签名验收存证成功！【${payload.department} · ${payload.clinicalSignee}】已完成签收。`);
    setTimeout(() => setSingleEntrySuccessTip(null), 4000);
  };

  // 快捷一键开票
  const handleExecuteQuickInvoice = () => {
    const uninvoicedBatch = batches.find(b => !b.invoiceRecord) || batches[0];
    if (!uninvoicedBatch) return;

    const invoiceRecord: FrameworkBatchInvoice = {
      invoiceType: 'SPECIAL_VAT',
      invoiceCode: quickInvoiceCode.trim(),
      invoiceNo: quickInvoiceNo.trim(),
      invoiceAmount: uninvoicedBatch.totalAmount,
      untaxedAmount: parseFloat((uninvoicedBatch.totalAmount / 1.13).toFixed(2)),
      taxRate: quickTaxRate,
      taxAmount: parseFloat((uninvoicedBatch.totalAmount - (uninvoicedBatch.totalAmount / 1.13)).toFixed(2)),
      invoiceDate: new Date().toISOString().slice(0, 10),
      hasTaxSalesList: true,
      taxSalesListFileName: `金税税控销货清单_${uninvoicedBatch.yearMonth.replace('-', '')}批次_${uninvoicedBatch.itemCount}项明细.pdf`,
      invoiceFileName: `增值税专用发票_${quickInvoiceNo}.pdf`,
      verificationStatus: 'VERIFIED',
      buyerName: '五莲县人民医院',
      buyerTaxNo: '12371121493820198X',
      sellerName: currentVendor.vendorName,
      sellerTaxNo: currentVendor.creditCode || '91440101718166542G',
    };

    const updatedItems = uninvoicedBatch.items.map(it => ({
      ...it,
      invoiced: true,
      invoiceNo: quickInvoiceNo.trim()
    }));

    const updatedBatch: MonthlyFrameworkBatch = {
      ...uninvoicedBatch,
      items: updatedItems,
      invoiceRecord,
      invoiceStatus: 'INVOICED',
      paymentStatus: 'IN_TRANSIT',
      status: 'SUBMITTED_TO_HOSPITAL'
    };

    handleSaveBatch(updatedBatch);
    setShowQuickInvoiceModal(false);
    alert(`恭喜！已成功为【${uninvoicedBatch.yearMonth} 批次】开具增值税专用发票（发票号：${quickInvoiceNo}），并自动匹配金税税控防伪清单！`);
  };

  // 登记到账流水
  const handleConfirmPaymentReceived = () => {
    if (!paymentBatchTarget) return;

    const updatedItems = paymentBatchTarget.items.map(it => ({
      ...it,
      paymentStatus: 'PAID' as const
    }));

    const updatedBatch: MonthlyFrameworkBatch = {
      ...paymentBatchTarget,
      items: updatedItems,
      paymentStatus: 'PAID',
      paidAmount: paymentAmountInput || paymentBatchTarget.totalAmount,
      paidAt: new Date().toISOString().slice(0, 10),
      paymentVoucherNo: paymentVoucherInput || `BOC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-8899`,
      paymentBank: paymentBankInput,
      status: 'FINANCE_APPROVED'
    };

    handleSaveBatch(updatedBatch);
    setShowPaymentModal(false);
    alert(`【${paymentBatchTarget.yearMonth} 批次】回款到账确认成功！银行电汇流水：${updatedBatch.paymentVoucherNo}。`);
  };

  // 导出 TSV 对账单
  const handleExportReconciliationTsv = () => {
    const headers = [
      '序号', '月度批次', '工单编号', '报修科室', '维修及配件项目', 
      '规格说明', '单位', '数量', '协议单价(元)', '申报金额(元)', 
      '医工审定金额(元)', '对账差额(元)', '开票状态', '增值税发票号', 
      '回款状态', '银行流水号', '施工工程师', '临床验收签字人', '施工日期'
    ];

    const rows = allItems.map((it, idx) => [
      idx + 1,
      it.batchYearMonth,
      it.workOrderNo || '-',
      it.department,
      `"${it.itemName.replace(/"/g, '""')}"`,
      `"${(it.notes || '').replace(/"/g, '""')}"`,
      it.unit,
      it.quantity,
      it.unitPrice.toFixed(2),
      it.totalPrice.toFixed(2),
      (it.hospitalApprovedPrice ?? it.totalPrice).toFixed(2),
      (it.reconciliationDifference ?? 0).toFixed(2),
      it.invoiced ? '已开票' : '未开票',
      it.invoiceNo || '-',
      it.batchPaymentStatus === 'PAID' ? '已到账付清' : (it.batchPaymentStatus === 'IN_TRANSIT' ? '审批在途' : '待开票请款'),
      it.batchPaymentVoucherNo || '-',
      it.engineerName || it.technician || '驻场工程师',
      it.clinicalSignee || it.clinicalSigner || '科室护士长',
      it.serviceDate
    ]);

    const tsvContent = '\uFEFF' + [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `全院零星维保双向财务对账单_${currentVendor.vendorName}_48项全景明细.tsv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const availableDepts = useMemo(() => {
    const itemDepts = allItems.map(it => {
      const d = it.department;
      return (d === '手术室' || d === '手术科' || d === '麻醉科') ? '麻醉手术科' : d;
    });
    const masterDeptNames = hospitalDepts.map(d => d.name);
    return Array.from(new Set([...itemDepts, ...masterDeptNames])).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [allItems, hospitalDepts]);

  // 统计全院各科室外协项目数量
  const deptItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach(it => {
      const d = (it.department === '手术室' || it.department === '手术科' || it.department === '麻醉科') ? '麻醉手术科' : it.department;
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [allItems]);

  // 高频重点科室便捷药丸
  const quickDepts = useMemo(() => {
    const list = ['麻醉手术科', '重症医学科 (ICU)', '心血管内科', '医学影像科', '急诊医学科', '消毒供应中心'];
    return list.filter(d => (deptItemCounts[d] || 0) > 0);
  }, [deptItemCounts]);

  // 当前激活的数据项（按月份与视角筛选）
  const activeItems = useMemo(() => {
    let source = allItems;
    if (selectedBatchId !== 'ALL_BATCHES') {
      source = allItems.filter(it => it.batchId === selectedBatchId);
    }
    if (activeView === 'UNINVOICED') {
      source = source.filter(it => !it.invoiced);
    } else if (activeView === 'INVOICED') {
      source = source.filter(it => !!it.invoiced);
    }
    return source;
  }, [allItems, selectedBatchId, activeView]);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  return (
    <div 
      id="monthly-framework-workspace-root"
      className="w-full h-full flex-1 min-h-0 flex flex-col bg-slate-50 text-left font-sans text-slate-800 rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-2.5 sm:p-3 gap-2"
    >
      {/* 供应商视角顶栏提示 (仅当非医院视角且未指定hideHeader时显示) */}
      {!isHospitalView && !hideHeader && (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:px-3 sm:py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0">
              {currentVendor.vendorName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{currentVendor.vendorName}</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {currentVendor.category}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5 shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                  协议签约
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                对账周期：按月归集 · 逐笔核销 | 协议：SINOPHARM-2026-TOTAL | 驻场：{currentVendor.contactPerson} ({currentVendor.phone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onSwitchToSpecialOrders && (
              <button
                type="button"
                onClick={onSwitchToSpecialOrders}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                单台专项大修
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                返回医院端
              </button>
            )}
          </div>
        </div>
      )}

      {/* 操作成功提示 */}
      {singleEntrySuccessTip && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{singleEntrySuccessTip}</span>
          </div>
          <button
            type="button"
            onClick={() => setSingleEntrySuccessTip(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            关闭
          </button>
        </div>
      )}

      {/* 科室协同视角专属提示条与视角切换栏 */}
      <div className="w-full bg-white border border-slate-200 rounded-xl p-2.5 sm:px-3 sm:py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-900">
              <span>外协零修协同 · 科室视角:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                {deptFilter ? `【${deptFilter}】界面` : '全院协同共享'}
              </span>
              {effectiveUserDept && (
                <span className="text-[11px] text-slate-500 font-normal">
                  (当前登录科室：{effectiveUserDept})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {deptFilter
                ? `已自动聚焦展示【${deptFilter}】名下外协零修工单与换件明细（共 ${selectedDeptItemCount} 项），支持科室查验验收与电子核签。`
                : `当前展示全院所有科室的外协零修维保工单与月度结算明细（共 ${allItems.length} 项）。点击下方科室按钮可一键穿透切换至该科室界面。`}
            </p>
          </div>
        </div>

        {/* 快速视角切换药丸与科室选择器 */}
        <div className="flex items-center flex-wrap gap-1.5 shrink-0 self-end md:self-auto">
          {/* 全院明细切换按钮 */}
          <button
            type="button"
            id="btn-switch-all-depts"
            onClick={() => {
              setDeptScopeMode('ALL');
              setDeptFilter('');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              !deptFilter
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>全院所有科室</span>
            <span className={`text-[10px] px-1 rounded ${!deptFilter ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {allItems.length}
            </span>
          </button>

          {/* 麻醉手术科专属快捷按钮（核心业务要求） */}
          <button
            type="button"
            id="btn-switch-surgery-dept"
            onClick={() => {
              setDeptScopeMode('DEPT');
              setDeptFilter('麻醉手术科');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap border ${
              deptFilter === '麻醉手术科'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-blue-50/80 hover:bg-blue-100 text-blue-800 border-blue-200'
            }`}
            title="点击直接进入麻醉手术科专属外协零修界面"
          >
            <Building2 className={`w-3 h-3 ${deptFilter === '麻醉手术科' ? 'text-white' : 'text-blue-600'}`} />
            <span>麻醉手术科界面</span>
            <span className={`text-[10px] px-1 rounded font-mono ${deptFilter === '麻醉手术科' ? 'bg-blue-700 text-white' : 'bg-blue-200/80 text-blue-900 font-bold'}`}>
              {deptItemCounts['麻醉手术科'] || 12}
            </span>
          </button>

          {/* 其他重点科室药丸 */}
          {quickDepts.filter(d => d !== '麻醉手术科').slice(0, 3).map(deptName => (
            <button
              key={deptName}
              type="button"
              onClick={() => {
                setDeptScopeMode('DEPT');
                setDeptFilter(deptName);
              }}
              className={`hidden lg:flex px-2 py-1 rounded-lg text-xs font-medium transition items-center gap-1 cursor-pointer whitespace-nowrap ${
                deptFilter === deptName
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{deptName.replace(/ \(ICU\)/, '')}</span>
              <span className={`text-[10px] px-1 rounded ${deptFilter === deptName ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {deptItemCounts[deptName] || 0}
              </span>
            </button>
          ))}

          {/* 切换其他科室下拉框 */}
          <select
            id="select-framework-dept-scope"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setDeptScopeMode(e.target.value === effectiveUserDept ? 'DEPT' : 'ALL');
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="">更多科室选择 ({availableDepts.length})</option>
            {availableDepts.map(d => (
              <option key={d} value={d}>
                {d} {deptItemCounts[d] ? `(${deptItemCounts[d]}项)` : ''} {d === effectiveUserDept ? '★当前登录' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 科室专属视角高亮工作区横幅（无论当前选择麻醉手术科或其他科室均可呈现专属界面） */}
      {deptFilter && (
        <div id="dept-focus-workspace-banner" className="w-full bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-white border border-blue-200 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>【{deptFilter}】外协零星维保与配件更换协同专属界面</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  本科室归集 {selectedDeptItemCount} 项
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  已电子验签 {scopedAllItems.filter(it => it.clinicalReceiveStatus === 'SIGNED' || it.clinicalSignee).length} 项
                </span>
                {scopedAllItems.some(it => it.clinicalReceiveStatus !== 'SIGNED' && !it.clinicalSignee) && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    待科室核签 {scopedAllItems.filter(it => it.clinicalReceiveStatus !== 'SIGNED' && !it.clinicalSignee).length} 项
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                当前视图已严格穿透锁定【{deptFilter}】名下外协施工、零修工单与配件更换记录，自动排除其他科室数据。支持科室护士长/技师在线核查四流合规凭单并完成现场电子签名。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setDeptScopeMode('ALL');
                setDeptFilter('');
              }}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition shadow-2xs cursor-pointer"
            >
              返回全院所有科室
            </button>
          </div>
        </div>
      )}

      {/* 顶部综合操作条：月份批次筛选与快速录入工具 */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white p-2 sm:px-3 sm:py-2 border border-slate-200 rounded-xl shadow-2xs shrink-0">
        {/* 左侧：月份批次药丸切换 */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 md:pb-0 flex-1 min-w-0">
          <span className="text-xs font-bold text-slate-700 shrink-0 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            结算月份:
          </span>

          <button
            type="button"
            id="batch-pill-all"
            onClick={() => setSelectedBatchId('ALL_BATCHES')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              selectedBatchId === 'ALL_BATCHES'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            全部月份 ({selectedDeptItemCount}项)
          </button>

          {batches.map(b => {
            const batchDeptCount = deptFilter 
              ? b.items.filter(it => matchesDepartment(it.department, deptFilter, hospitalDepts)).length
              : b.itemCount;
            return (
              <button
                key={b.id}
                id={`batch-pill-${b.yearMonth}`}
                type="button"
                onClick={() => setSelectedBatchId(b.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                  selectedBatchId === b.id
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{b.yearMonth}</span>
                <span className={`text-[10px] px-1 rounded ${
                  selectedBatchId === b.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {batchDeptCount}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            id="btn-create-new-batch"
            onClick={() => {
              setBatchModalMode('SINGLE_ITEM');
              setShowBatchModal(true);
            }}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-0.5 transition cursor-pointer whitespace-nowrap shrink-0"
            title="新建下一个月度框架维保批次"
          >
            <Plus className="w-3 h-3 text-slate-500" />
            <span>新建月份</span>
          </button>
        </div>

        {/* 右侧：工单录入、导入与导出公文工具 */}
        <div className="flex items-center flex-wrap gap-1.5 shrink-0 self-end md:self-auto">
          <button
            type="button"
            id="btn-top-single-entry"
            onClick={() => {
              setSingleTargetBatchId(batches[0]?.id || 'BATCH-2026-09');
              setShowSingleEntryModal(true);
            }}
            className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
            title="手工补录单笔零星维修工单"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 单笔录入</span>
          </button>

          <button
            type="button"
            id="btn-top-batch-import"
            onClick={() => {
              setBatchModalMode('TSV_IMPORT');
              setShowBatchModal(true);
            }}
            className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
            title="从 Excel / TSV 批量导入明细"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>批量导入</span>
          </button>

          <button
            type="button"
            id="btn-top-audit-report"
            onClick={() => setShowAuditReportModal(true)}
            className="py-1 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-2xs whitespace-nowrap"
            title="预览并打印四方联合审签单 (PDF)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>审签单 (PDF)</span>
          </button>

          <button
            type="button"
            id="btn-top-export-tsv"
            onClick={handleExportReconciliationTsv}
            className="py-1 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-2xs whitespace-nowrap"
            title="导出双方财务对账单 (TSV)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>导出 TSV</span>
          </button>
        </div>
      </div>

      {/* 4 个核心财务与对账指标卡片 (紧凑精致) */}
      <div className="w-full shrink-0">
        <MonthlyMetricsCards
          activeView={activeView}
          setActiveView={setActiveView}
          financialStats={financialStats}
          onQuickInvoice={() => setShowQuickInvoiceModal(true)}
        />
      </div>

      {/* 核心协同视角切换药丸 (Segmented Tabs) */}
      <div className="w-full flex items-center justify-between bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto max-w-full flex-1 min-w-0 pb-0.5 sm:pb-0">
          {/* 1. 全部对账明细 */}
          <button
            type="button"
            id="tab-view-all"
            onClick={() => setActiveView('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'ALL'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>全部明细 ({selectedDeptItemCount}项)</span>
          </button>

          {/* 2. 未开票待办 */}
          <button
            type="button"
            id="tab-view-uninvoiced"
            onClick={() => setActiveView('UNINVOICED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'UNINVOICED'
                ? 'bg-amber-50 text-amber-950 border border-amber-300 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>未开票待办 ({financialStats.uninvoicedCount}项)</span>
          </button>

          {/* 3. 已开票核销 */}
          <button
            type="button"
            id="tab-view-invoiced"
            onClick={() => setActiveView('INVOICED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'INVOICED'
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>已开票核销 ({financialStats.invoicedCount}项)</span>
          </button>

          {/* 4. 回款进度流水 */}
          <button
            type="button"
            id="tab-view-payment"
            onClick={() => setActiveView('PAYMENT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'PAYMENT'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
            <span>回款流水台 ({financialStats.paidRate}%)</span>
          </button>

          {/* 5. 双方智能对账 */}
          <button
            type="button"
            id="tab-view-reconciliation"
            onClick={() => setActiveView('RECONCILIATION')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'RECONCILIATION'
                ? 'bg-indigo-50 text-indigo-950 border border-indigo-300 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>双方智能对账 (零误差)</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono pr-2 shrink-0">
          <span>对账总额:</span>
          <strong className="text-slate-900 font-bold">¥{financialStats.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong>
        </div>
      </div>

      {/* 当切换为双方智能对账视角时，展示对账对比审定面板 */}
      {activeView === 'RECONCILIATION' && (
        <MonthlyReconciliationSummary
          totalItems={financialStats.totalItems}
          totalAmount={financialStats.totalAmount}
          totalHospitalApproved={financialStats.totalHospitalApproved}
          discrepancyAmount={financialStats.discrepancyAmount}
          onExportTsv={handleExportReconciliationTsv}
          onOpenAuditReport={() => setShowAuditReportModal(true)}
        />
      )}

      {/* 当切换为回款进度看板时，展示四阶段回款台账 */}
      {activeView === 'PAYMENT' ? (
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
          <MonthlyPaymentLedger
            batches={batches}
            onOpenPaymentModal={(b) => {
              setPaymentBatchTarget(b);
              setPaymentAmountInput(b.totalAmount);
              setPaymentVoucherInput(`BOC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-8821`);
              setShowPaymentModal(true);
            }}
          />
        </div>
      ) : (
        /* 核心对账明细工作台 */
        <MonthlyDetailTable
          items={activeItems}
          totalCount={selectedDeptItemCount}
          availableDepts={availableDepts}
          departments={hospitalDepts}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          invoiceFilter={invoiceFilter}
          setInvoiceFilter={setInvoiceFilter}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          clinicalSignFilter={clinicalSignFilter}
          setClinicalSignFilter={setClinicalSignFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          jumpPageInput={jumpPageInput}
          setJumpPageInput={setJumpPageInput}
          handleJumpPage={handleJumpPage}
          onDeleteItem={(itemId, batchId) => {
            if (confirm('确定要从该月度批次中移除这笔零星维保记录吗？')) {
              const target = batches.find(b => b.id === batchId);
              if (target) {
                const nextItems = target.items.filter(it => it.id !== itemId);
                const updated = recalculateBatchTotals({ ...target, items: nextItems });
                handleSaveBatch(updated);
              }
            }
          }}
          onQuickInvoice={() => setShowQuickInvoiceModal(true)}
          onOpenClinicalSignModal={(item) => {
            setSigningItem(item);
            setShowClinicalSignModal(true);
          }}
        />
      )}

      {/* 单笔手工录入弹窗 */}
      {showSingleEntryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  手工单笔补录零星维修明细
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSingleEntryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">归集月度批次</label>
                <select
                  value={singleTargetBatchId}
                  onChange={(e) => setSingleTargetBatchId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.yearMonth} 批次 ({b.itemCount}项明细 · ¥{b.totalAmount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  维修及配件更换项目名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={singleItemName}
                  onChange={(e) => setSingleItemName(e.target.value)}
                  placeholder="例如：手术室无影灯调光驱动器检修 / 监护仪心电导联线排障更换"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    发生科室 <span className="text-slate-400 font-normal">（自动联动主数据）</span>
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={hospitalDepts.some(d => d.name === singleDept) ? singleDept : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSingleDept(e.target.value);
                          const matched = hospitalDepts.find(d => d.name === e.target.value);
                          if (matched?.defaultManager) {
                            setSingleSignee(`${matched.defaultManager} (护士长)`);
                          }
                        }
                      }}
                      className="w-1/2 bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">选择主数据科室...</option>
                      {hospitalDepts.map(d => (
                        <option key={d.id} value={d.name}>
                          {d.name} [{d.code}] {d.campusName ? `· ${d.campusName}` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={singleDept}
                      onChange={(e) => setSingleDept(e.target.value)}
                      placeholder="或输入科室名称/别名"
                      className="w-1/2 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">完工日期</label>
                  <input
                    type="text"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    placeholder="2026/09/16"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">单位</label>
                  <select
                    value={singleUnit}
                    onChange={(e) => setSingleUnit(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-mono"
                  >
                    <option value="台">台</option>
                    <option value="项">项</option>
                    <option value="套">套</option>
                    <option value="批">批</option>
                    <option value="次">次</option>
                    <option value="个">个</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={singleQuantity}
                    onChange={(e) => setSingleQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">协议单价 (元)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={singleUnitPrice}
                    onChange={(e) => setSingleUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 font-mono text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-mono text-blue-900">
                <span>合计申报金额：<strong className="text-sm font-black">¥{(singleQuantity * singleUnitPrice).toFixed(2)}</strong> 元</span>
                <span className="text-[11px] font-sans font-medium text-blue-700">
                  {(singleQuantity * singleUnitPrice) < 1000 ? '小额直接报销' : (singleQuantity * singleUnitPrice) >= 5000 ? '大额审签特批' : '常规零星维修'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">施工工程师</label>
                  <input
                    type="text"
                    value={singleEngineer}
                    onChange={(e) => setSingleEngineer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">临床验收签字人</label>
                  <input
                    type="text"
                    value={singleSignee}
                    onChange={(e) => setSingleSignee(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="modalSingleOldParts"
                  checked={singleOldPartsReturned}
                  onChange={(e) => setSingleOldPartsReturned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="modalSingleOldParts" className="text-xs text-slate-700 cursor-pointer font-medium select-none">
                  旧配件原样退库（旧元器件已归还医工科库房，符合“以旧换新”内控核验）
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">故障及技术处置备注 (选填)</label>
                <textarea
                  rows={2}
                  value={singleNotes}
                  onChange={(e) => setSingleNotes(e.target.value)}
                  placeholder="简述故障排查方法与更换原配件情况，例如：清洗探头声透镜并重新完成全套增益校准..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSingleEntryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleSaveSingleItem(true)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                保存并继续录入
              </button>
              <button
                type="button"
                onClick={() => handleSaveSingleItem(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                确认录入并归档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 快捷开票弹窗 */}
      {showQuickInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  一键生成增值税专用发票与金税清单
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowQuickInvoiceModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-900 leading-relaxed">
                将为未开票项目（当前待办 ¥{financialStats.uninvoicedAmount.toFixed(2)} 元）自动生成增值税专用发票记录，并自动导出金税防伪销货清单逐笔核验。
              </div>

              <div>
                <label className="block font-semibold mb-1">发票代码</label>
                <input
                  type="text"
                  value={quickInvoiceCode}
                  onChange={(e) => setQuickInvoiceCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">增值税专用发票号码</label>
                <input
                  type="text"
                  value={quickInvoiceNo}
                  onChange={(e) => setQuickInvoiceNo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">增值税率 (%)</label>
                  <input
                    type="number"
                    value={quickTaxRate}
                    onChange={(e) => setQuickTaxRate(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">价税合计 (元)</label>
                  <input
                    type="text"
                    disabled
                    value={`¥${financialStats.uninvoicedAmount.toFixed(2)}`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-500">
                <div>购买方：五莲县人民医院 (纳税人识别号: 12371121493820198X)</div>
                <div>销售方：{currentVendor.vendorName} (纳税人识别号: {currentVendor.creditCode || '91440101718166542G'})</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowQuickInvoiceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickInvoice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                确认开票并自动绑定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 登记回款流水弹窗 */}
      {showPaymentModal && paymentBatchTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  登记银行到账流水 ({paymentBatchTarget.yearMonth} 批次)
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-semibold mb-1">打款银行 / 国库账户</label>
                <input
                  type="text"
                  value={paymentBankInput}
                  onChange={(e) => setPaymentBankInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">银行电汇流水凭证号</label>
                <input
                  type="text"
                  value={paymentVoucherInput}
                  onChange={(e) => setPaymentVoucherInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">实际到账金额 (元)</label>
                <input
                  type="number"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold text-emerald-700"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                收款账户：{currentVendor.bankName} ({currentVendor.bankAccount})
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentReceived}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                确认已到账入账
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TSV批量导入/发票绑定模态框 */}
      {showBatchModal && currentBatch && (
        <MonthlyFrameworkBatchModal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          batch={currentBatch}
          currentBatch={currentBatch}
          onSaveBatch={handleSaveBatch}
          mode={batchModalMode}
          initialMode={batchModalMode}
        />
      )}

      {/* 四方联合审签单 (PDF打印预览) */}
      {showAuditReportModal && currentBatch && (
        <MonthlyFrameworkAuditReportModal
          isOpen={showAuditReportModal}
          onClose={() => setShowAuditReportModal(false)}
          batch={currentBatch}
          allBatches={batches}
        />
      )}

      {/* 临床科室维修接收与电子签名存证弹窗 */}
      {showClinicalSignModal && signingItem && (
        <ClinicalItemSignModal
          isOpen={showClinicalSignModal}
          onClose={() => {
            setShowClinicalSignModal(false);
            setSigningItem(null);
          }}
          item={signingItem}
          departments={hospitalDepts}
          onSave={handleSaveClinicalSignature}
        />
      )}
    </div>
  );
};

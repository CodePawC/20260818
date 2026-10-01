import React, { useState, useMemo, useRef } from 'react';
import { MedicalEquipment, PartnerOrganization, AuthUser } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Building2, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Filter, 
  Search, 
  Copy, 
  Check, 
  AlertTriangle, 
  ChevronRight, 
  Landmark, 
  Layers, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  generateMonthlyFinanceReport, 
  exportMonthlyFinanceReportCsv, 
  getStoredPaymentStatusMap, 
  saveStoredPaymentStatusMap,
  ScopeFilterMode,
  PaymentStatus,
  MonthlyFinanceReportData
} from '../utils/financeUtils';
import { DEFAULT_PARTNERS } from '../utils/partnerData';

interface MonthlyFinanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: MedicalEquipment[];
  partnersList?: PartnerOrganization[];
  currentUser?: AuthUser | null;
  initialYear?: string;
  initialMonth?: string;
  initialScopeMode?: ScopeFilterMode;
}

export const MonthlyFinanceReportModal: React.FC<MonthlyFinanceReportModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  partnersList = DEFAULT_PARTNERS,
  currentUser,
  initialYear = '2026',
  initialMonth = '08',
  initialScopeMode = 'cumulative_month_end'
}) => {
  // 选中的年份与月份
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [scopeMode, setScopeMode] = useState<ScopeFilterMode>(initialScopeMode);

  // 选项卡：'voucher' (请款呈批公文) | 'vendors' (供应商应付清单) | 'departments' (科室成本分摊) | 'records' (逐笔工单对账)
  const [activeTab, setActiveTab] = useState<'voucher' | 'vendors' | 'departments' | 'records'>('voucher');

  // 本地工单付款状态微调映射 (允许用户手动将工单标记为 待付/已付/审批中)
  const [paymentStatusMap, setPaymentStatusMap] = useState<Record<string, PaymentStatus>>(() => {
    return getStoredPaymentStatusMap();
  });

  // 状态变更提示
  const [copiedAccountKey, setCopiedAccountKey] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  // 明细对账表格内部搜索与筛选
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [recordDeptFilter, setRecordDeptFilter] = useState<string>('ALL');
  const [recordStatusFilter, setRecordStatusFilter] = useState<string>('ALL');

  // 打印与PDF导出的A4容器引用
  const voucherPrintRef = useRef<HTMLDivElement>(null);

  // 生成当前条件下的报表数据
  const reportData: MonthlyFinanceReportData = useMemo(() => {
    return generateMonthlyFinanceReport(
      equipmentList,
      selectedYear,
      selectedMonth,
      scopeMode,
      partnersList,
      paymentStatusMap
    );
  }, [equipmentList, selectedYear, selectedMonth, scopeMode, partnersList, paymentStatusMap]);

  // 按待付款优先级排序服务商（优先展示有待付款的服务商）
  const priorityVendors = useMemo(() => {
    return [...reportData.vendorSummaries].sort((a, b) => {
      if (b.pendingAmount !== a.pendingAmount) return b.pendingAmount - a.pendingAmount;
      return b.totalAmount - a.totalAmount;
    });
  }, [reportData.vendorSummaries]);

  // 修改单笔工单的付款状态
  const handleTogglePaymentStatus = (recordId: string, nextStatus: PaymentStatus) => {
    const updated = {
      ...paymentStatusMap,
      [recordId]: nextStatus
    };
    setPaymentStatusMap(updated);
    saveStoredPaymentStatusMap(updated);
  };

  // 复制对公银行账号
  const handleCopyAccount = (accountNo: string, key: string) => {
    navigator.clipboard.writeText(accountNo.replace(/\s+/g, ''));
    setCopiedAccountKey(key);
    setTimeout(() => {
      setCopiedAccountKey(null);
    }, 2000);
  };

  // 导出 CSV
  const handleExportCsv = () => {
    exportMonthlyFinanceReportCsv(reportData);
  };

  // 打印报表
  const handlePrint = () => {
    window.print();
  };

  // 导出高保真 PDF
  const handleExportPdf = async () => {
    if (isExportingPdf || !voucherPrintRef.current) return;
    setIsExportingPdf(true);
    setPdfMessage('正在渲染并导出 A4 规范 PDF 请款单...');
    try {
      const dataUrl = await toPng(voucherPrintRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      
      const imgHeight = img.width > 0 ? (img.height * imgWidth) / img.width : 297;
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      pdf.save(`五莲县人民医院_医疗设备维修费用结算请款单_${reportData.targetYear}年${reportData.targetMonth}月.pdf`);
      setPdfMessage('PDF 请款单导出成功，已保存至下载目录');
      setTimeout(() => setPdfMessage(null), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setPdfMessage('PDF 直接生成受限，建议点击【打印呈报单】并选择“另存为 PDF”获得最高印刷级画质。');
      setTimeout(() => setPdfMessage(null), 5000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 筛选逐笔明细数据
  const filteredRecords = useMemo(() => {
    return reportData.records.filter((item) => {
      if (recordDeptFilter !== 'ALL' && item.equipment.department !== recordDeptFilter) {
        return false;
      }
      if (recordStatusFilter !== 'ALL' && item.paymentStatus !== recordStatusFilter) {
        return false;
      }
      if (recordSearch.trim()) {
        const q = recordSearch.toLowerCase();
        const match = 
          item.record.id.toLowerCase().includes(q) ||
          item.equipment.name.toLowerCase().includes(q) ||
          (item.equipment.sn || '').toLowerCase().includes(q) ||
          item.vendorName.toLowerCase().includes(q) ||
          (item.record.faultDescription || '').toLowerCase().includes(q) ||
          (item.record.partsReplaced || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [reportData.records, recordDeptFilter, recordStatusFilter, recordSearch]);

  // 可选科室清单
  const availableDepts = useMemo(() => {
    const s = new Set<string>();
    reportData.records.forEach(r => {
      if (r.equipment.department) s.add(r.equipment.department);
    });
    return Array.from(s).sort();
  }, [reportData.records]);

  if (!isOpen) return null;

  return (
    <div 
      id="monthly-finance-report-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:z-auto print:block"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in print:max-h-none print:h-auto print:overflow-visible print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none print:p-0 print:m-0 print:block">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  医疗设备维修费用月度结算与财务付款请款单
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {reportData.scopeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                医学装备科向财务科申请拨付准备设备维保与配件款项专属公文及明细台账
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="导出包含全维度数据的Excel/CSV表格"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>导出Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="调用系统打印机打印标准A4请款单"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>打印呈报单</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="导出高清PDF公文请款凭据"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>导出PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Export Feedback Alert */}
        {pdfMessage && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-medium print:hidden">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfMessage}</span>
            </span>
            <button
              onClick={() => setPdfMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Month & Scope Preset Ribbon */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-bold flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              快捷核算口径:
            </span>

            {/* Specifically Highlighted for August End */}
            <button
              type="button"
              onClick={() => {
                setSelectedYear('2026');
                setSelectedMonth('08');
                setScopeMode('cumulative_month_end');
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                selectedYear === '2026' && selectedMonth === '08' && scopeMode === 'cumulative_month_end'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>⚡ 截至8月底 (2026-08累计)</span>
              {selectedYear === '2026' && selectedMonth === '08' && scopeMode === 'cumulative_month_end' && (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedYear('2026');
                setSelectedMonth('08');
                setScopeMode('single_month');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer border ${
                selectedYear === '2026' && selectedMonth === '08' && scopeMode === 'single_month'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              8月份当月 (2026-08)
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedYear('2026');
                setSelectedMonth('07');
                setScopeMode('cumulative_month_end');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer border ${
                selectedYear === '2026' && selectedMonth === '07' && scopeMode === 'cumulative_month_end'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              截至7月底 (2026-07)
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedYear('2026');
                setSelectedMonth('07');
                setScopeMode('single_month');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer border ${
                selectedYear === '2026' && selectedMonth === '07' && scopeMode === 'single_month'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              7月份当月 (2026-07)
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedYear('2026');
                setSelectedMonth('12');
                setScopeMode('all');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer border ${
                scopeMode === 'all'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              全期建档累计
            </button>
          </div>

          {/* Custom Selectors */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">年份:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-mono font-medium focus:ring-1 focus:ring-slate-500 focus:outline-hidden"
              >
                <option value="2026">2026年</option>
                <option value="2025">2025年</option>
                <option value="2024">2024年</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">目标月份:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-mono font-medium focus:ring-1 focus:ring-slate-500 focus:outline-hidden"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>
                    {parseInt(m, 10)}月
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">计算口径:</span>
              <select
                value={scopeMode}
                onChange={(e) => setScopeMode(e.target.value as ScopeFilterMode)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-slate-500 focus:outline-hidden"
              >
                <option value="cumulative_month_end">截至该月底累计发生 (含待付总额)</option>
                <option value="single_month">仅当月单月结算 (自然月发生)</option>
                <option value="all">全期所有历史工单</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top KPI Cards Ribbon */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 print:hidden">
          {/* Card 1: 统计期内维修总费用 */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>期内维修总费用 ({reportData.scopeMode === 'cumulative_month_end' ? '截至月底累计' : '当期发生'})</span>
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono flex items-baseline gap-1">
              <span className="text-sm font-semibold text-slate-500">¥</span>
              <span>{reportData.totalExpense.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-1 truncate" title={reportData.totalRmbWords}>
              {reportData.totalRmbWords}
            </p>
          </div>

          {/* Card 2: 建议财务科备款资金 (待付款) */}
          <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                建议财务科准备付款资金 (待付)
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                请款核心
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-900 font-mono flex items-baseline gap-1">
              <span className="text-sm font-semibold text-amber-700">¥</span>
              <span>{reportData.pendingPaymentAmount.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium mt-1 truncate" title={reportData.pendingRmbWords}>
              {reportData.pendingRmbWords}
            </p>
          </div>

          {/* Card 3: 已核销/已付款金额 */}
          <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                已付款 / 已核销对账
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">
                {reportData.totalExpense > 0 
                  ? Math.round((reportData.paidAmount / reportData.totalExpense) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-900 font-mono flex items-baseline gap-1">
              <span className="text-sm font-semibold text-emerald-700">¥</span>
              <span>{reportData.paidAmount.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 truncate">
              共已结算支付 {reportData.records.filter(r => r.paymentStatus === 'paid').length} 笔工单
            </p>
          </div>

          {/* Card 4: 覆盖维度概况 */}
          <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between text-xs text-blue-800 font-semibold mb-1">
              <span>涉及工单与服务商</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-200 text-blue-900">
                {reportData.totalOrderCount} 笔工单
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1 text-center font-mono">
              <div>
                <div className="text-base font-bold text-blue-950">{reportData.equipmentCount}</div>
                <div className="text-[10px] text-blue-700">台设备</div>
              </div>
              <div>
                <div className="text-base font-bold text-blue-950">{reportData.departmentCount}</div>
                <div className="text-[10px] text-blue-700">个科室</div>
              </div>
              <div>
                <div className="text-base font-bold text-blue-950">{reportData.vendorCount}</div>
                <div className="text-[10px] text-blue-700">家供应商</div>
              </div>
            </div>
            <div className="mt-1 text-[10px] text-blue-800 flex items-center justify-between font-medium">
              <span>含重大维修(&gt;¥5k): {reportData.overThresholdCount} 笔</span>
              <span>¥{reportData.overThresholdAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Main Subtabs Navigation */}
        <div className="px-5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setActiveTab('voucher')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-md transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'voucher'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>呈批公文：财务付款资金请款单</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-md transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vendors'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>供应商应付与打款账户清单 ({reportData.vendorSummaries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('departments')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-md transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'departments'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>临床科室成本归集分摊表 ({reportData.deptSummaries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-md transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'records'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-sky-600" />
              <span>维修工单逐笔明细对账台账 ({reportData.records.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1">
            <span>单据编号:</span>
            <span className="font-mono font-bold text-slate-700">{reportData.reportDocNo}</span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="modal-printable-body flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 print:p-0 print:m-0 print:bg-white print:overflow-visible print:max-h-none">

          {/* TAB 1: 官方请款单 (可直接打印 / 导出PDF的 A4 版式) */}
          {activeTab === 'voucher' && (
            <div className="max-w-4xl mx-auto space-y-4 print:max-w-none print:w-full print:m-0 print:space-y-0">
              {/* Actions Alert */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-2xs print:hidden">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    已自动生成规范化<strong>《医疗设备维修费用结算与财务付款资金请款单》</strong>，可直接点击右上角【打印呈报单】或【导出PDF】递交财务科审核。
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handlePrint}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" />
                    <span>即刻打印</span>
                  </button>
                </div>
              </div>

              {/* Printable Voucher Paper Container */}
              <div 
                id="finance-voucher-print-sheet"
                ref={voucherPrintRef}
                className="bg-white border border-slate-300 shadow-xl max-w-[210mm] w-full min-h-[297mm] mx-auto p-8 sm:p-11 text-slate-900 font-sans flex flex-col justify-between relative print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0 print:overflow-visible"
              >
                <div className="space-y-4">
                  {/* A4 页眉 Running Header */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-500 font-sans">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">五莲县人民医院</span>
                      <span>·</span>
                      <span>医疗设备维修费用结算与财务付款资金请款单</span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono">
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200">
                        内部公文 · 财务与审计备案
                      </span>
                      <span>编号: {reportData.reportDocNo}</span>
                    </div>
                  </div>

                  {/* Official Header */}
                  <div className="text-center pt-2 pb-3 border-b-2 border-slate-900 space-y-1.5">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold uppercase">
                      WULIAN COUNTY PEOPLE'S HOSPITAL · MEDICAL EQUIPMENT ENGINEERING
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide font-sans">
                      五莲县人民医院 医疗设备维修费用结算与财务付款资金请款单
                    </h1>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-2 px-2 border-t border-slate-200 text-left sm:text-center">
                      <div>呈报科室：<strong className="text-slate-900">医学装备科 (医疗设备科)</strong></div>
                      <div>审核主送：<strong className="text-slate-900">财务科 / 预算与资金结算中心</strong></div>
                      <div>统计结算周期：<strong className="text-emerald-700 font-mono">{reportData.scopeLabel}</strong></div>
                      <div>制表日期：<strong className="text-slate-900 font-mono">{reportData.generatedDate}</strong></div>
                    </div>
                  </div>

                  {/* Purpose Paragraph */}
                  <div className="text-xs sm:text-[13px] text-slate-800 leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-justify">
                    <p className="indent-8">
                      为加强全院医学装备全生命周期外协维保成本控制与规范化审计，医学装备科对全院在
                      <strong className="text-slate-900 font-bold px-1">【{reportData.scopeLabel}】</strong>
                      期间发生的全部临床设备抢修、定期PM保养及关键零配件采购支出进行了汇总核验与台账归集。本期共发生维保工单
                      <strong className="text-emerald-700 font-bold px-1 font-mono">{reportData.totalOrderCount} 笔</strong>，
                      涉及临床医技科室 <strong className="text-slate-900 font-bold px-1">{reportData.departmentCount} 个</strong>，
                      在册医疗设备 <strong className="text-slate-900 font-bold px-1 font-mono">{reportData.equipmentCount} 台</strong>，
                      涉及签约合作服务商 <strong className="text-slate-900 font-bold px-1">{reportData.vendorCount} 家</strong>。
                      发生维修总费用合计为 <strong className="text-slate-900 font-bold px-1 font-mono">￥{reportData.totalExpense.toLocaleString()}</strong> 元
                      （大写：<strong className="text-slate-900 font-bold">{reportData.totalRmbWords}</strong>）。
                      其中前期已对账付款核销 <strong className="text-slate-900 font-bold px-1 font-mono">￥{reportData.paidAmount.toLocaleString()}</strong> 元；
                      本次建议财务科安排调度与准备支付款项合计为 <strong className="text-amber-800 font-bold px-1 font-mono">￥{reportData.pendingPaymentAmount.toLocaleString()}</strong> 元
                      （大写：<strong className="text-amber-800 font-bold">{reportData.pendingRmbWords}</strong>）。
                      所有请款项目已严格核查设备完工报告及使用科室签字凭据，现随文呈报，请予审签并办理转账电汇。
                    </p>
                  </div>

                  {/* Core Payment Matrix Table */}
                  <div className="border border-slate-900 rounded overflow-hidden">
                    <div className="bg-slate-900 text-white px-3 py-1.5 font-bold text-xs flex justify-between">
                      <span>【资金付款请款核心明细表】</span>
                      <span className="font-mono font-normal text-slate-300">币种：人民币 (RMB)</span>
                    </div>
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-300 bg-slate-100/70">
                          <td className="p-2.5 font-bold text-slate-700 w-1/4 border-r border-slate-300">
                            统计期内维修总费用
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900 text-sm border-r border-slate-300 w-1/4">
                            ¥{reportData.totalExpense.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-bold text-slate-700 w-1/4 border-r border-slate-300">
                            总金额中文大写
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 w-1/4">
                            {reportData.totalRmbWords}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-300 bg-amber-50/70">
                          <td className="p-2.5 font-bold text-amber-900 border-r border-slate-300">
                            本次建议财务科备款 (待付款)
                          </td>
                          <td className="p-2.5 font-mono font-bold text-amber-800 text-base border-r border-slate-300">
                            ¥{reportData.pendingPaymentAmount.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-bold text-amber-900 border-r border-slate-300">
                            备款金额中文大写
                          </td>
                          <td className="p-2.5 font-bold text-amber-900">
                            {reportData.pendingRmbWords}
                          </td>
                        </tr>

                        <tr className="border-b border-slate-300">
                          <td className="p-2.5 font-bold text-slate-700 border-r border-slate-300">
                            前期已核销已付款金额
                          </td>
                          <td className="p-2.5 font-mono font-semibold text-slate-800 border-r border-slate-300">
                            ¥{reportData.paidAmount.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-bold text-slate-700 border-r border-slate-300">
                            已付款对应工单数
                          </td>
                          <td className="p-2.5 text-slate-700 font-mono">
                            {reportData.records.filter(r => r.paymentStatus === 'paid').length} 笔 (占全部工单 {reportData.totalOrderCount > 0 ? Math.round((reportData.records.filter(r => r.paymentStatus === 'paid').length / reportData.totalOrderCount) * 100) : 0}%)
                          </td>
                        </tr>

                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 border-r border-slate-300">
                            业务覆盖统计规模
                          </td>
                          <td colSpan={3} className="p-2.5 text-slate-700 font-mono">
                            共计 <strong>{reportData.totalOrderCount}</strong> 笔工单 / 涉及 <strong>{reportData.equipmentCount}</strong> 台在册设备 / 涵盖 <strong>{reportData.departmentCount}</strong> 个临床医技科室 / 涉及 <strong>{reportData.vendorCount}</strong> 家签约服务商
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Top Major Payables Table */}
                  <div className="space-y-1.5 pt-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
                      <span>【重点服务商应付结算与备款汇总】</span>
                      <span className="text-[11px] text-slate-500 font-normal">财务科可直接核准并办理电汇转账</span>
                    </div>
                    <table className="w-full text-xs border border-slate-300 text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5 border-r border-slate-300">服务商名称</th>
                          <th className="p-1.5 text-center border-r border-slate-300 w-16">工单数</th>
                          <th className="p-1.5 text-right border-r border-slate-300 w-24">应付总额(元)</th>
                          <th className="p-1.5 text-right border-r border-slate-300 w-24">本次待付款</th>
                          <th className="p-1.5 border-r border-slate-300">开户银行</th>
                          <th className="p-1.5 font-mono">银行对公账号</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {priorityVendors.slice(0, 5).map((v) => (
                          <tr key={v.vendorName} className="hover:bg-slate-50">
                            <td className="p-1.5 font-sans font-medium text-slate-900 border-r border-slate-300 truncate max-w-[140px]" title={v.vendorName}>
                              {v.vendorName}
                            </td>
                            <td className="p-1.5 text-center text-slate-600 border-r border-slate-300">
                              {v.orderCount}
                            </td>
                            <td className="p-1.5 text-right font-bold text-slate-900 border-r border-slate-300">
                              ¥{v.totalAmount.toLocaleString()}
                            </td>
                            <td className="p-1.5 text-right font-bold text-amber-700 border-r border-slate-300">
                              ¥{v.pendingAmount.toLocaleString()}
                            </td>
                            <td className="p-1.5 font-sans text-slate-700 border-r border-slate-300 truncate max-w-[120px]" title={v.bankName}>
                              {v.bankName}
                            </td>
                            <td className="p-1.5 text-slate-800 text-[11px]">
                              {v.accountNo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-300 text-slate-800 font-mono">
                        <tr>
                          <td className="p-1.5 font-sans border-r border-slate-300">
                            重点服务商小计 ({Math.min(priorityVendors.length, 5)}/{priorityVendors.length}家)
                          </td>
                          <td className="p-1.5 text-center border-r border-slate-300">
                            {priorityVendors.slice(0, 5).reduce((s, v) => s + v.orderCount, 0)}
                          </td>
                          <td className="p-1.5 text-right border-r border-slate-300">
                            ¥{priorityVendors.slice(0, 5).reduce((s, v) => s + v.totalAmount, 0).toLocaleString()}
                          </td>
                          <td className="p-1.5 text-right text-amber-700 border-r border-slate-300">
                            ¥{priorityVendors.slice(0, 5).reduce((s, v) => s + v.pendingAmount, 0).toLocaleString()}
                          </td>
                          <td colSpan={2} className="p-1.5 text-slate-500 font-sans font-normal text-[11px]">
                            全部合作服务商汇款详情见附表《供应商应付与打款账户清单》
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Major Items Note */}
                  {reportData.overThresholdCount > 0 && (
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>大额单项维修款项特别报备 (&gt;= ¥5,000元，共 {reportData.overThresholdCount} 笔，累计 ¥{reportData.overThresholdAmount.toLocaleString()}):</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">需附技术论证与院领导签批单</span>
                      </div>
                      <div className="space-y-0.5 text-slate-700">
                        {reportData.overThresholdRecords.slice(0, 4).map(item => (
                          <div key={item.record.id} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-200/60 last:border-none">
                            <span className="truncate pr-2">
                              <strong className="font-mono text-slate-900">{item.record.id}</strong> - {item.equipment.name} ({item.equipment.department})：
                              更换配件/方案【{item.record.partsReplaced || item.record.faultDescription}】（服务商：{item.vendorName}）
                            </span>
                            <span className="font-mono font-bold text-rose-700 shrink-0">
                              ¥{(item.record.cost || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {reportData.overThresholdCount > 4 && (
                          <div className="text-[10px] text-slate-400 text-right pt-0.5">
                            注：另有 {reportData.overThresholdCount - 4} 笔大额款项详见附表《逐笔工单对账明细》
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signatures & Seal Section */}
                  <div className="pt-4 mt-4 border-t-2 border-slate-900">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50 flex flex-col justify-between min-h-[96px]">
                        <div className="text-[11px] text-slate-500 font-semibold">制表人 (医学装备科)</div>
                        <div className="text-xs font-bold text-slate-900 font-mono my-2">
                          {reportData.preparer.split(' ')[0]} (签章)
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{reportData.generatedDate}</div>
                      </div>

                      <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50 flex flex-col justify-between min-h-[96px]">
                        <div className="text-[11px] text-slate-500 font-semibold">医学装备科负责人审核</div>
                        <div className="text-xs font-bold text-slate-800 my-2">
                          同意请款呈批
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{reportData.generatedDate}</div>
                      </div>

                      <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50 flex flex-col justify-between min-h-[96px]">
                        <div className="text-[11px] text-slate-500 font-semibold">财务科成本核算/资金结算复核</div>
                        <div className="text-xs text-slate-400 italic my-2">
                          (财务复核签章)
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">年 &nbsp; 月 &nbsp; 日</div>
                      </div>

                      <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50 flex flex-col justify-between min-h-[96px]">
                        <div className="text-[11px] text-slate-500 font-semibold">分管副院长 / 总会计师批示</div>
                        <div className="text-xs text-slate-400 italic my-2">
                          (准予拨款签章)
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">年 &nbsp; 月 &nbsp; 日</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-3 text-center">
                      注：本请款单由医院医学装备管理信息系统自动核算生成，已核验各工单技术验收合格签署凭据，附明细对账单，涂改无效。
                    </div>
                  </div>
                </div>

                {/* A4 页脚 Running Footer */}
                <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
                  <div>呈报科室：医学装备科 (医疗设备科)</div>
                  <div className="font-mono font-bold text-slate-800">— 内部公文呈批单 · 附逐笔明细对账表 —</div>
                  <div>制表日期：{reportData.generatedDate} | 内部核算</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 供应商应付款明细 (财务打款账号清单) */}
          {activeTab === 'vendors' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    合作供应商与服务商应付结算表 (打款电汇指南)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    汇集各签约原厂及第三方维保单位对公银行账户信息，财务科可直接一键复制账号办理银行划转
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold">
                    共 {reportData.vendorSummaries.length} 家单位
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold">
                    待付款合计: ¥{reportData.pendingPaymentAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.vendorSummaries.map((v, idx) => (
                  <div 
                    key={v.vendorName}
                    className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Title Bar */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h5 className="font-bold text-sm text-slate-900 truncate" title={v.vendorName}>
                              {v.vendorName}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 pl-6 truncate">
                            联系人：{v.contactPerson} ({v.contactPhone})
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 font-mono">
                          {v.orderCount} 笔工单
                        </span>
                      </div>

                      {/* Payment Stats */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 text-center font-mono">
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="text-[10px] text-slate-500 font-sans">应付总额</div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">¥{v.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-amber-50 p-2 rounded">
                          <div className="text-[10px] text-amber-700 font-sans font-bold">本次待付款</div>
                          <div className="text-sm font-bold text-amber-800 mt-0.5">¥{v.pendingAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded">
                          <div className="text-[10px] text-emerald-700 font-sans">已付/已结</div>
                          <div className="text-sm font-bold text-emerald-800 mt-0.5">¥{v.paidAmount.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Bank & Transfer Info */}
                      <div className="pt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">开户银行:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[240px]" title={v.bankName}>
                            {v.bankName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">对公银行账号:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                              {v.accountNo}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyAccount(v.accountNo, v.vendorName)}
                              className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded transition cursor-pointer"
                              title="一键复制对公账号"
                            >
                              {copiedAccountKey === v.vendorName ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">纳税人识别号:</span>
                          <span className="font-mono text-slate-700 text-[11px]">{v.taxNo}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">结算条款:</span>
                          <span className="text-slate-600 truncate max-w-[240px]" title={v.settlementTerms}>
                            {v.settlementTerms}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 临床科室成本归集分摊表 */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    各临床医技科室维修费用归集与成本分摊表
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    支持医院财务科全成本核算 (HRP/ERP) 将维修维保资金精准分摊至各科室医疗业务成本
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-slate-700">
                  全院发生总计：¥{reportData.totalExpense.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">序号</th>
                      <th className="py-2.5 px-4">科室名称</th>
                      <th className="py-2.5 px-4 text-center">报修工单数</th>
                      <th className="py-2.5 px-4 text-right">发生维修费用小计</th>
                      <th className="py-2.5 px-4 text-right">全院费用占比</th>
                      <th className="py-2.5 px-4 w-48">成本占比分布进度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {reportData.deptSummaries.map((d, idx) => (
                      <tr key={d.deptName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 text-center text-slate-400 font-sans">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{d.deptName}</td>
                        <td className="py-2.5 px-4 text-center text-slate-700">{d.orderCount} 笔</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-sm">
                          ¥{d.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-amber-700">
                          {d.percentage}%
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(Math.max(d.percentage, 2), 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: 维修工单逐笔明细对账台账 */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recordSearch}
                      onChange={(e) => setRecordSearch(e.target.value)}
                      placeholder="搜索设备名称、SN编号、工单号、服务商或配件..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">使用科室:</span>
                    <select
                      value={recordDeptFilter}
                      onChange={(e) => setRecordDeptFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                    >
                      <option value="ALL">全部科室 ({reportData.departmentCount})</option>
                      {availableDepts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">付款状态:</span>
                    <select
                      value={recordStatusFilter}
                      onChange={(e) => setRecordStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                    >
                      <option value="ALL">全部状态</option>
                      <option value="pending">待付款 (请款中)</option>
                      <option value="paid">已付款 (已结清)</option>
                      <option value="approving">大额审批流转中</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">工单/日期</th>
                      <th className="py-2.5 px-3">设备名称与型号</th>
                      <th className="py-2.5 px-3">使用科室</th>
                      <th className="py-2.5 px-3">主修服务商</th>
                      <th className="py-2.5 px-3">更换配件及故障</th>
                      <th className="py-2.5 px-3 text-right">费用 (元)</th>
                      <th className="py-2.5 px-3 text-center">财务付款状态 (可点击切换)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          没有符合条件的维修工单记录
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((item) => (
                        <tr key={item.record.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono">
                            <div className="font-bold text-slate-800">{item.record.faultDate}</div>
                            <div className="text-[10px] text-slate-400">{item.record.id}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.equipment.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              型号: {item.equipment.model} | SN: {item.equipment.sn || item.equipment.id}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {item.equipment.department}
                          </td>

                          <td className="py-2.5 px-3 text-slate-700 font-medium">
                            <div className="truncate max-w-[150px]" title={item.vendorName}>
                              {item.vendorName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.record.repairType}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 max-w-[220px]">
                            {item.record.partsReplaced ? (
                              <div className="text-slate-800 font-semibold truncate" title={item.record.partsReplaced}>
                                【配件】{item.record.partsReplaced}
                              </div>
                            ) : null}
                            <div className="text-slate-500 truncate text-[11px]" title={item.record.faultDescription}>
                              {item.record.faultDescription}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                            ¥{(item.record.cost || 0).toLocaleString()}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center bg-slate-100 rounded p-0.5 text-[11px] font-medium">
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentStatus(item.record.id, 'pending')}
                                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                                  item.paymentStatus === 'pending'
                                    ? 'bg-amber-500 text-white font-bold shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="点击标记为待付款（纳入准备付款资金清单）"
                              >
                                待付款
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentStatus(item.record.id, 'paid')}
                                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                                  item.paymentStatus === 'paid'
                                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="点击标记为已付款已核销"
                              >
                                已付款
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>💡 提示：该报表专供医学装备科向财务科请款备款使用，包含人民币大写核算、供应商对公账户及四级公文签字栏。</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印请款单</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  X, Printer, Download, FileSpreadsheet, Building2, TrendingDown, 
  Coins, FileText, CheckCircle2, AlertCircle, Filter, Search, 
  Calendar, Layers, ShieldCheck, ChevronRight, ChevronLeft, PieChart, Users, 
  ExternalLink, Sparkles, Clock, ArrowUpDown, Layout, ChevronsLeft, ChevronsRight,
  FileDown, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { VendorCollaborationOrder } from '../types/vendorCollaborationTypes';
import { 
  VendorQuoteReportFilter, 
  ReportScopeMode, 
  filterVendorOrders, 
  calculateVendorQuoteStats, 
  aggregateByVendor, 
  aggregateByDept, 
  extractOrderDate, 
  exportVendorQuoteReportCsv 
} from '../utils/vendorQuoteReportUtils';
import { digitToChineseRmb } from '../utils/financeUtils';
import { getDepartmentMasterInfo } from '../utils/masterData';
import { VendorReportPrintDialog, PrintScope } from './VendorReportPrintDialog';
import { VendorReportPrintTemplate } from './VendorReportPrintTemplate';

interface VendorMonthlyQuoteReportModalProps {
  orders: VendorCollaborationOrder[];
  onClose: () => void;
  onSelectOrder?: (order: VendorCollaborationOrder) => void;
  initialMonth?: string;
  initialYear?: string;
  initialScopeMode?: ReportScopeMode;
  departments?: string[];
  isOpen?: boolean;
}

export const VendorMonthlyQuoteReportModal: React.FC<VendorMonthlyQuoteReportModalProps> = ({
  orders,
  onClose,
  onSelectOrder,
  initialMonth,
  initialYear,
  initialScopeMode,
  departments: passedDepartments,
  isOpen = true,
}) => {
  if (!isOpen) return null;

  // 当前年份与月份状态
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    if (initialYear) return initialYear;
    if (initialMonth && initialMonth.includes('-')) return initialMonth.split('-')[0];
    return '2026';
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (initialMonth) {
      return initialMonth.includes('-') ? initialMonth.split('-')[1] : initialMonth;
    }
    return '09';
  });
  const [scopeMode, setScopeMode] = useState<ReportScopeMode>(initialScopeMode || 'single_month');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  // 报表主视图 Tab: 公文报告 / 供应商比价 / 科室分摊 / 逐笔明细清单
  const [reportTab, setReportTab] = useState<'OFFICIAL_REPORT' | 'VENDOR_ANALYSIS' | 'DEPT_BREAKDOWN' | 'LEDGER_DETAIL'>('OFFICIAL_REPORT');

  // A4 幅面分页与排版状态
  const [a4ViewMode, setA4ViewMode] = useState<'single_page' | 'continuous'>('single_page');
  const [currentA4Page, setCurrentA4Page] = useState<number>(1);
  const [vendorPageSize, setVendorPageSize] = useState<number>(6);

  // 临床科室分摊表 A4 打印与分页状态
  const [deptViewMode, setDeptViewMode] = useState<'a4_print' | 'standard'>('a4_print');
  const [deptA4ViewMode, setDeptA4ViewMode] = useState<'single_page' | 'continuous'>('single_page');
  const [currentDeptA4Page, setCurrentDeptA4Page] = useState<number>(1);
  const [deptPageSize, setDeptPageSize] = useState<number>(10);

  // 逐笔明细台账的分页状态
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [ledgerPageSize, setLedgerPageSize] = useState<number>(8);

  // 动态公文编号
  const reportDocNo = useMemo(() => {
    const y = selectedYear || '2026';
    const m = (selectedMonth || '01').padStart(2, '0');
    return `WL-WXBG-${y}${m}-001`;
  }, [selectedYear, selectedMonth]);

  // 所有涉及的供应商与科室列表（去重用于下拉筛选）
  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.vendorName) set.add(o.vendorName);
    });
    return Array.from(set);
  }, [orders]);

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.equipmentDept) {
        const std = getDepartmentMasterInfo(o.equipmentDept).department;
        set.add(std || o.equipmentDept);
      }
    });
    return Array.from(set);
  }, [orders]);

  // 构造过滤参数
  const filter: VendorQuoteReportFilter = useMemo(() => ({
    year: selectedYear,
    month: selectedMonth,
    scopeMode,
    selectedVendor,
    selectedDept,
    selectedStatus,
    searchKeyword,
  }), [selectedYear, selectedMonth, scopeMode, selectedVendor, selectedDept, selectedStatus, searchKeyword]);

  // 过滤工单
  const filteredOrders = useMemo(() => {
    return filterVendorOrders(orders, filter);
  }, [orders, filter]);

  // 计算报表财务指标
  const stats = useMemo(() => {
    return calculateVendorQuoteStats(filteredOrders);
  }, [filteredOrders]);

  // 供应商汇总 (采用议价前原始申报报价口径)
  const vendorSummary = useMemo(() => {
    return aggregateByVendor(filteredOrders, stats.initialQuoteGrandTotal);
  }, [filteredOrders, stats.initialQuoteGrandTotal]);

  // 科室汇总 (采用议价前原始申报报价口径)
  const deptSummary = useMemo(() => {
    return aggregateByDept(filteredOrders, stats.initialQuoteGrandTotal);
  }, [filteredOrders, stats.initialQuoteGrandTotal]);

  // 拟换配件总件数
  const totalPartsCount = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.quoteParts?.length || 0), 0);
  }, [filteredOrders]);

  // 计算比例与指标
  const partsRatio = useMemo(() => {
    if (!stats.initialQuoteGrandTotal) return 0;
    return Number(((stats.quotePartsTotal / stats.initialQuoteGrandTotal) * 100).toFixed(1));
  }, [stats.quotePartsTotal, stats.initialQuoteGrandTotal]);

  const laborTravelCost = useMemo(() => {
    return stats.quoteLaborCost + stats.quoteTravelCost;
  }, [stats.quoteLaborCost, stats.quoteTravelCost]);

  const laborTravelRatio = useMemo(() => {
    if (!stats.initialQuoteGrandTotal) return 0;
    return Number(((laborTravelCost / stats.initialQuoteGrandTotal) * 100).toFixed(1));
  }, [laborTravelCost, stats.initialQuoteGrandTotal]);

  const invoicedRatio = useMemo(() => {
    if (!stats.finalNegotiatedTotal) return 0;
    return Number(((stats.invoicedTotal / stats.finalNegotiatedTotal) * 100).toFixed(1));
  }, [stats.invoicedTotal, stats.finalNegotiatedTotal]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // A4 公文报表分页计算: 第1页为公文呈报与四大经济指标；第2页起承载优化后的供应商表格与联签盖章
  const vendorPageCount = Math.max(1, Math.ceil(vendorSummary.length / vendorPageSize));
  const totalA4Pages = 1 + vendorPageCount;
  const safeA4Page = Math.min(Math.max(1, currentA4Page), totalA4Pages);

  // 科室分摊表 A4 幅面分页计算
  const effectiveDeptPageSize = deptPageSize >= 999 ? Math.max(1, deptSummary.length) : deptPageSize;
  const deptA4PageCount = Math.max(1, Math.ceil(deptSummary.length / effectiveDeptPageSize));
  const safeDeptA4Page = Math.min(Math.max(1, currentDeptA4Page), deptA4PageCount);

  // 逐笔明细台账的分页计算
  const totalLedgerPages = Math.max(1, Math.ceil(filteredOrders.length / ledgerPageSize));
  const safeLedgerPage = Math.min(Math.max(1, ledgerPage), totalLedgerPages);
  const paginatedOrders = useMemo(() => {
    if (ledgerPageSize >= 999) return filteredOrders;
    const start = (safeLedgerPage - 1) * ledgerPageSize;
    return filteredOrders.slice(start, start + ledgerPageSize);
  }, [filteredOrders, safeLedgerPage, ledgerPageSize]);

  // 报表周期文字
  const periodLabel = useMemo(() => {
    if (scopeMode === 'all') {
      return `${selectedYear}全年度`;
    }
    if (scopeMode === 'cumulative_month_end') {
      return `${selectedYear}年截至${Number(selectedMonth)}月底累计`;
    }
    return `${selectedYear}年${Number(selectedMonth)}月份`;
  }, [selectedYear, selectedMonth, scopeMode]);

  // 导出 CSV
  const handleExportCsv = () => {
    exportVendorQuoteReportCsv(filteredOrders, stats, {
      hospitalName: '五莲县人民医院',
      periodLabel,
      exportDate: new Date().toISOString().slice(0, 10),
      preparedBy: '医学装备科（外协维修协同中心）',
    });
  };

  // 打印与导出中心状态
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printScope, setPrintScope] = useState<PrintScope>('DEPT_BREAKDOWN');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState('');

  // 唤起系统打印机
  const handleExecuteSystemPrint = (scope: PrintScope, orientation: 'portrait' | 'landscape' = 'portrait') => {
    setPrintScope(scope);
    setPrintOrientation(orientation);
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // 纯前端直接合成并下载标准 A4 PDF
  const handleExportPdfDirect = async (scope: PrintScope, orientation: 'portrait' | 'landscape' = 'portrait') => {
    try {
      setIsExportingPdf(true);
      setPrintScope(scope);
      setPrintOrientation(orientation);
      setPdfExportProgress('正在准备报表版式...');

      // 等待 DOM 渲染打印与导出视图
      await new Promise((r) => setTimeout(r, 250));

      const container = document.getElementById('vendor-report-print-container');
      if (!container) {
        throw new Error('未找到打印容器元素');
      }

      const pageElements = container.querySelectorAll('.a4-print-page, .a4-print-page-landscape');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('未检测到可导出的报表页面');
      }

      setPdfExportProgress(`共检测到 ${pageElements.length} 页，正在逐页合成高清 A4 PDF...`);

      const isLandscape = orientation === 'landscape' || scope === 'LEDGER_DETAIL';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = isLandscape ? 297 : 210;
      const pdfHeight = isLandscape ? 210 : 297;

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        setPdfExportProgress(`正在渲染第 ${i + 1} / ${pageElements.length} 页...`);

        // 使用 html-to-image 的 toJpeg，基于浏览器原生 SVG foreignObject 渲染，完全兼容 Tailwind v4 的 oklch 颜色体系
        const imgData = await toJpeg(pageEl, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true,
          fontEmbedCSS: '',
        });

        // 确保图片加载以按比例精确定位
        const img = new Image();
        img.src = imgData;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`第 ${i + 1} 页图片渲染失败`));
        });

        if (i > 0) {
          pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
        }

        const imgRatio = img.naturalHeight / img.naturalWidth;
        const renderedHeight = pdfWidth * imgRatio;

        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          pdfWidth,
          Math.min(pdfHeight, renderedHeight),
          undefined,
          'FAST'
        );
      }

      setPdfExportProgress('正在保存下载文件...');
      const scopeNameMap: Record<PrintScope, string> = {
        CURRENT: '当前报表',
        DEPT_BREAKDOWN: '各临床科室维修申报分摊表(议价前)',
        OFFICIAL_REPORT: '医学装备维修月度申报汇总呈报表',
        VENDOR_ANALYSIS: '外协服务商月度申报报价汇总表',
        LEDGER_DETAIL: '外协维修报价逐笔明细对账台账',
        FULL_BUNDLE: '全套维修呈报汇编包',
      };
      const fileName = `五莲县人民医院_${scopeNameMap[scope] || '维修月报'}_${periodLabel}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      setPdfExportProgress('导出完成！');
      setTimeout(() => {
        setIsExportingPdf(false);
        setShowPrintModal(false);
      }, 500);
    } catch (err: any) {
      console.error('PDF 导出失败:', err);
      setIsExportingPdf(false);
      const errMsg = err?.message ? ` (${err.message})` : '';
      alert(`直接生成 PDF 失败${errMsg}，建议使用「打印 / 导出 PDF」中的「调用系统打印机」选择「另存为 PDF」！`);
    }
  };

  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  return (
    <div id="vendor-monthly-quote-report-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* ================= 1. 顶部控制栏（打印时隐藏） ================= */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  外协维修报价月度报表与审价分析
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {periodLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                支持按月统计供应商原始报价、多科室审定成交价、审减资金率及一案一档发票凭证
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition cursor-pointer"
              title="导出包含所有指标与逐笔报价的 Excel 报表"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 Excel/CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs transition cursor-pointer"
              title="打开打印与导出中心，支持按需打印、设置纸张与直接下载标准 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印 / 导出 PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= 2. 月份选择与多维筛选条（打印时隐藏） ================= */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white space-y-2.5 print:hidden">
          {/* 月份切换行 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0 mr-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                报表月份:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="2026">2026年</option>
                <option value="2025">2025年</option>
              </select>

              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                {months.map(m => {
                  const isSelected = scopeMode === 'single_month' && selectedMonth === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m);
                        setScopeMode('single_month');
                      }}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-2xs font-bold' 
                          : 'text-slate-600 hover:bg-white/80'
                      }`}
                    >
                      {Number(m)}月
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 统计口径切换 */}
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setScopeMode('single_month')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  scopeMode === 'single_month' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                单月报表
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('cumulative_month_end')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  scopeMode === 'cumulative_month_end' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                截至当月底累计
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('all')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  scopeMode === 'all' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全年度汇总
              </button>
            </div>
          </div>

          {/* 筛选下拉行 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
            {/* 供应商 */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              <span className="text-slate-400 shrink-0">供应商:</span>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full bg-transparent border-none text-slate-700 focus:outline-hidden text-xs truncate"
              >
                <option value="ALL">全部外协厂商 ({vendorOptions.length})</option>
                {vendorOptions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* 科室 */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              <span className="text-slate-400 shrink-0">科室:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-transparent border-none text-slate-700 focus:outline-hidden text-xs truncate"
              >
                <option value="ALL">全部科室 ({deptOptions.length})</option>
                {deptOptions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* 业务状态 */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              <span className="text-slate-400 shrink-0">状态:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-transparent border-none text-slate-700 focus:outline-hidden text-xs truncate"
              >
                <option value="ALL">全部状态</option>
                <option value="MULTI_DEPT_NEGOTIATING">联合议价中</option>
                <option value="NEGOTIATED">已审定成交</option>
                <option value="COMPLETED_PENDING_INVOICE">已完工待开票</option>
                <option value="INVOICED">已开具发票</option>
                <option value="ARCHIVED">已全套资料归档</option>
              </select>
            </div>

            {/* 关键字搜索 */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索单号、设备、配件..."
                className="w-full bg-transparent border-none text-slate-700 focus:outline-hidden text-xs"
              />
              {searchKeyword && (
                <button type="button" onClick={() => setSearchKeyword('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= 3. 报表视图 Tab 切换（打印时隐藏） ================= */}
        <div className="px-5 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-4 text-xs font-semibold print:hidden">
          <button
            type="button"
            onClick={() => setReportTab('OFFICIAL_REPORT')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === 'OFFICIAL_REPORT'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>月度报价公文呈报单</span>
          </button>

          <button
            type="button"
            onClick={() => setReportTab('VENDOR_ANALYSIS')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === 'VENDOR_ANALYSIS'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>外协供应商报价汇总表 ({vendorSummary.length}家)</span>
          </button>

          <button
            type="button"
            onClick={() => setReportTab('DEPT_BREAKDOWN')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === 'DEPT_BREAKDOWN'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>临床科室维修申报分摊表 ({deptSummary.length}科室)</span>
          </button>

          <button
            type="button"
            onClick={() => setReportTab('LEDGER_DETAIL')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === 'LEDGER_DETAIL'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>外协报价逐笔明细台账 ({filteredOrders.length}单)</span>
          </button>
        </div>

        {/* ================= 4. 报表主体渲染区 ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50/40 print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          {/* TAB 1: 官方月度公文呈报单 (优化表格，采用 A4 幅面进行分页) */}
          {reportTab === 'OFFICIAL_REPORT' && (
            <div className="space-y-6 max-w-5xl mx-auto w-full">
              {/* A4 视图控制与分页导航条 (仅屏幕显示，打印时自动隐藏) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>A4 规范幅面 (210mm × 297mm)</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-slate-600 font-medium">
                    <button
                      type="button"
                      onClick={() => setA4ViewMode('single_page')}
                      className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                        a4ViewMode === 'single_page'
                          ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="逐页查看标准 A4 单页版面"
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>单页翻阅</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setA4ViewMode('continuous')}
                      className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                        a4ViewMode === 'continuous'
                          ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="连续展示所有 A4 页面排版"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>连续多页展开</span>
                    </button>
                  </div>
                </div>

                {/* 翻页与打印工具栏 */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {a4ViewMode === 'single_page' && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={safeA4Page <= 1}
                        onClick={() => setCurrentA4Page(p => Math.max(1, p - 1))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer"
                        title="上一页 A4"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>上一页</span>
                      </button>

                      <div className="flex items-center space-x-1 mx-1">
                        {Array.from({ length: totalA4Pages }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentA4Page(pageNum)}
                            className={`min-w-6 h-6 px-1.5 rounded flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                              safeA4Page === pageNum
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={pageNum === 1 ? '第 1 页: 呈报公文与核心经济指标' : `第 ${pageNum} 页: 供应商报价汇总与多方联签`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={safeA4Page >= totalA4Pages}
                        onClick={() => setCurrentA4Page(p => Math.min(totalA4Pages, p + 1))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer"
                        title="下一页 A4"
                      >
                        <span>下一页</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="text-slate-300">|</span>

                  {/* 每页供应商容纳数量 */}
                  <div className="flex items-center space-x-1 text-slate-500 text-xs">
                    <span>表容:</span>
                    <select
                      value={vendorPageSize}
                      onChange={(e) => {
                        setVendorPageSize(Number(e.target.value));
                        setCurrentA4Page(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-hidden"
                    >
                      <option value={5}>每页5家</option>
                      <option value={6}>每页6家(标准A4)</option>
                      <option value={8}>每页8家</option>
                      <option value={12}>每页12家</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteSystemPrint('OFFICIAL_REPORT')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-2xs transition cursor-pointer"
                    title="调用浏览器打印功能，打印呈报公文"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>打印 A4 呈报公文 (共{totalA4Pages}页)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPdfDirect('OFFICIAL_REPORT')}
                    disabled={isExportingPdf}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="直接生成并下载 A4 PDF 公文"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>导出 PDF</span>
                  </button>
                </div>
              </div>

              {/* ==================== A4 SHEET 1: 呈报公文正文与核心经济指标 ==================== */}
              <div 
                className={`a4-report-sheet bg-white border border-slate-300 shadow-xl max-w-[210mm] w-full min-h-[297mm] mx-auto p-8 sm:p-11 text-slate-900 flex-col justify-between relative print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-[277mm] ${
                  a4ViewMode === 'single_page' && safeA4Page !== 1 ? 'hidden print:flex' : 'flex'
                }`}
              >
                <div className="space-y-5">
                  {/* A4 页眉 Running Header */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-500 font-sans">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">五莲县人民医院</span>
                      <span>·</span>
                      <span>医学装备外协维修月度审价呈报单</span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono">
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200">
                        内部公文 · 财务与审计备案
                      </span>
                      <span>编号: {reportDocNo}</span>
                    </div>
                  </div>

                  {/* 医院公文红头/大标题 */}
                  <div className="text-center pt-2 pb-3 border-b-2 border-slate-900 space-y-1.5">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold uppercase">
                      WU LIAN COUNTY PEOPLE'S HOSPITAL · MEDICAL EQUIPMENT ENGINEERING
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide font-sans">
                      五莲县人民医院 医学装备外协维修月度报价与审价结算报告
                    </h1>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-2 px-2 border-t border-slate-200 text-left sm:text-center">
                      <div>呈报科室：<strong className="text-slate-900">医学装备科（外协协同）</strong></div>
                      <div>审核主送：<strong className="text-slate-900">分管副院长室、财务科、审计处</strong></div>
                      <div>统计结算周期：<strong className="text-indigo-700 font-mono">{periodLabel}</strong></div>
                      <div>制表日期：<strong className="text-slate-900 font-mono">{today}</strong></div>
                    </div>
                  </div>

                  {/* 呈报公文说明段落 (规范公文正文) */}
                  <div className="text-xs sm:text-[13px] text-slate-800 leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-justify">
                    <p className="indent-8">
                      为加强全院医学装备全生命周期外协维保成本控制与规范化审计，医学装备科对外协维修协同平台在
                      <strong className="text-slate-900 font-bold px-1">【{periodLabel}】</strong>
                      期间收到的全部外协大修与零星维保报价进行了系统汇总与多科室联合审核。本期共归集外协维修申报工单
                      <strong className="text-indigo-700 font-bold px-1 font-mono">{stats.totalCount} 笔</strong>，
                      涉及外协合作单位 <strong className="text-slate-900 font-bold px-1">{vendorSummary.length} 家</strong>，
                      拟换关键零配件 <strong className="text-slate-900 font-bold px-1 font-mono">{totalPartsCount} 件</strong>。
                      厂商原始申报报价合计为 <strong className="text-rose-600 font-bold px-1 font-mono">￥{stats.initialQuoteGrandTotal.toLocaleString()}</strong> 元。
                      经医学装备科专业工程师对配件公允性及工时标准实测核查，并联合临床使用科室、财务科及审计处多轮商洽审价，
                      最终审定成交总金额为 <strong className="text-emerald-700 font-bold px-1 font-mono">￥{stats.finalNegotiatedTotal.toLocaleString()}</strong> 元
                      （大写：<strong className="text-emerald-700 font-bold">{digitToChineseRmb(stats.finalNegotiatedTotal)}</strong>），
                      累计核减节约医院资金 <strong className="text-indigo-700 font-bold px-1 font-mono">￥{stats.savingsAmountTotal.toLocaleString()}</strong> 元，
                      本期综合审减节资率达 <strong className="text-indigo-700 font-bold px-1 font-mono">{stats.overallSavingsRate}%</strong>。
                      目前已开具正规增值税专用发票并通过防伪验真 <strong className="text-slate-900 font-bold px-1 font-mono">￥{stats.invoicedTotal.toLocaleString()}</strong> 元。
                      现将具体报价构成、审定结果及科室分摊明细呈报，请予审签备案并指导财务资金备付。
                    </p>
                  </div>

                  {/* 核心 KPI 宏观经济指标卡 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">外协申报工单</div>
                      <div className="text-lg font-black text-slate-800 mt-0.5">{stats.totalCount} <span className="text-xs font-normal text-slate-500">笔</span></div>
                      <div className="text-[10px] text-slate-400 mt-0.5">涉及 {vendorSummary.length} 家合作服务商</div>
                    </div>

                    <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
                      <div className="text-[11px] text-rose-700 font-medium">厂商原始报价总计</div>
                      <div className="text-lg font-black text-rose-700 mt-0.5 font-mono">￥{stats.initialQuoteGrandTotal.toLocaleString()}</div>
                      <div className="text-[10px] text-rose-600/80 mt-0.5">含工时差旅 ¥{laborTravelCost.toLocaleString()}</div>
                    </div>

                    <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-300">
                      <div className="text-[11px] text-emerald-800 font-semibold">审定成交总额</div>
                      <div className="text-lg font-black text-emerald-800 mt-0.5 font-mono">￥{stats.finalNegotiatedTotal.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">真实发生与决算金额</div>
                    </div>

                    <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200">
                      <div className="text-[11px] text-indigo-700 font-semibold flex items-center justify-between">
                        <span>议价审减节资额</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-200/70 text-indigo-800 font-bold">{stats.overallSavingsRate}%</span>
                      </div>
                      <div className="text-lg font-black text-indigo-700 mt-0.5 font-mono">￥{stats.savingsAmountTotal.toLocaleString()}</div>
                      <div className="text-[10px] text-indigo-600 mt-0.5">多科室联合议价挽回资金</div>
                    </div>
                  </div>

                  {/* 报价结构与发票财务概况 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 左侧：外协维修报价构成核算 (原始申报拆解) */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5 bg-white shadow-2xs">
                      <div className="text-xs font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-600" />
                          <span>外协维修报价构成核算 (原始申报拆解)</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">总计 ¥{stats.initialQuoteGrandTotal.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                          <span className="text-slate-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>拟换医疗设备配件费总计:</span>
                          </span>
                          <span className="font-bold text-slate-800 font-mono">￥{stats.quotePartsTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                          <span className="text-slate-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>工程师技术服务工时费:</span>
                          </span>
                          <span className="font-bold text-slate-800 font-mono">￥{stats.quoteLaborCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                          <span className="text-slate-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span>远途差旅及仪器检测费:</span>
                          </span>
                          <span className="font-bold text-slate-800 font-mono">￥{stats.quoteTravelCost.toLocaleString()}</span>
                        </div>
                        {/* 双色配比进度条 */}
                        <div className="pt-1">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-amber-500 h-full transition-all" 
                              style={{ width: `${partsRatio}%` }} 
                              title={`配件费占比: ${partsRatio}%`}
                            />
                            <div 
                              className="bg-blue-500 h-full transition-all" 
                              style={{ width: `${laborTravelRatio}%` }} 
                              title={`工时与差旅占比: ${laborTravelRatio}%`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1 bg-amber-50/70 px-2 rounded font-semibold text-amber-900 text-[11px] border border-amber-100">
                          <span>拟换配件 {totalPartsCount} 件 · 配件费用占比:</span>
                          <span className="font-mono font-bold">{partsRatio}% (工时差旅 {laborTravelRatio}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧：发票验真与入账资金准备进度 (财审闭环进度) */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5 bg-white shadow-2xs">
                      <div className="text-xs font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>发票验真与入账资金准备进度 (财审闭环)</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                          验真达成率 {invoicedRatio}%
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                          <span className="text-slate-600">已上传并验真增值税专票额:</span>
                          <span className="font-bold text-emerald-700 font-mono">￥{stats.invoicedTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                          <span className="text-slate-600">已开票工单单数 / 归档数:</span>
                          <span className="font-bold text-slate-800">{stats.invoicedCount} 笔 / {stats.archivedCount} 笔</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                          <span className="text-slate-600">待开票或正在施工挂账总额:</span>
                          <span className="font-bold text-rose-600 font-mono">￥{stats.pendingInvoiceAmount.toLocaleString()}</span>
                        </div>
                        {/* 开票进度条 */}
                        <div className="pt-1">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all" 
                              style={{ width: `${invoicedRatio}%` }} 
                              title={`已开票结算金额占比: ${invoicedRatio}%`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1 bg-emerald-50/70 px-2 rounded font-semibold text-emerald-900 text-[11px] border border-emerald-100">
                          <span>已开票结算金额占比:</span>
                          <span className="font-mono font-bold">{invoicedRatio}% (已核验专票并具备转账条件)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 接下页提示栏 */}
                  <div className="py-2.5 px-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      （接下页：一、外协服务商报价、审定成交与审减明细汇总表 及 二、多科室联签与审批备案栏）
                    </span>
                    {totalA4Pages > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentA4Page(2)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 print:hidden cursor-pointer"
                      >
                        <span>翻至第2页</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* A4 页脚 Running Footer */}
                <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
                  <div>呈报科室：医学装备科（外协维修协同中心）</div>
                  <div className="font-mono font-bold text-slate-800">— 第 1 页 / 共 {totalA4Pages} 页 —</div>
                  <div>制表日期：{today} | 内部呈报</div>
                </div>
              </div>

              {/* ==================== A4 SHEETS 2+: 供应商报价审定汇总表与五方联签 ==================== */}
              {Array.from({ length: vendorPageCount }, (_, vPageIndex) => {
                const pageNumber = vPageIndex + 2;
                const pageVendors = vendorSummary.slice(vPageIndex * vendorPageSize, (vPageIndex + 1) * vendorPageSize);
                const isLastVendorPage = vPageIndex === vendorPageCount - 1;

                return (
                  <div
                    key={`a4-page-${pageNumber}`}
                    className={`a4-report-sheet bg-white border border-slate-300 shadow-xl max-w-[210mm] w-full min-h-[297mm] mx-auto p-8 sm:p-11 text-slate-900 flex-col justify-between relative print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-[277mm] ${
                      a4ViewMode === 'single_page' && safeA4Page !== pageNumber ? 'hidden print:flex' : 'flex'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* A4 页眉 Running Header */}
                      <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-500 font-sans">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">五莲县人民医院</span>
                          <span>·</span>
                          <span>医学装备外协维修月度报价与审价结算报告</span>
                        </div>
                        <div className="flex items-center space-x-3 font-mono">
                          <span className="text-slate-600">结算期: {periodLabel}</span>
                          <span>编号: {reportDocNo}</span>
                        </div>
                      </div>

                      {/* 章节一：外协供应商报价、审定成交与审减明细汇总表 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            <span>
                              一、外协服务商报价、审定成交与审减明细汇总表
                              {vendorPageCount > 1 ? `（第 ${vPageIndex + 1}/${vendorPageCount} 部分）` : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            单位: 人民币(元) | 口径: 厂商原始申报报价 vs 多科室会签审定成交价
                          </div>
                        </div>

                        {/* 规范清晰的多列公文核算表格 */}
                        <div className="border border-slate-300 rounded-sm overflow-hidden">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                              <tr>
                                <th className="py-2.5 px-1.5 text-center w-8 border-r border-slate-300">序号</th>
                                <th className="py-2.5 px-2.5 border-r border-slate-300">外协服务商名称</th>
                                <th className="py-2.5 px-2 border-r border-slate-300">业务对接人 / 电话</th>
                                <th className="py-2.5 px-1.5 text-center w-12 border-r border-slate-300">工单</th>
                                <th className="py-2.5 px-1.5 text-center w-12 border-r border-slate-300">配件</th>
                                <th className="py-2.5 px-2 text-right border-r border-slate-300">原始申报报价</th>
                                <th className="py-2.5 px-2 text-right border-r border-slate-300 text-emerald-800 font-bold">审定成交金额</th>
                                <th className="py-2.5 px-2 text-right border-r border-slate-300 text-indigo-700">审减节资额</th>
                                <th className="py-2.5 px-1.5 text-center w-12 border-r border-slate-300 text-indigo-700">审减率</th>
                                <th className="py-2.5 px-2 text-right border-r border-slate-300">已验真专票</th>
                                <th className="py-2.5 px-1.5 text-center w-12">占比</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {pageVendors.map((v, idx) => {
                                const rowNumber = vPageIndex * vendorPageSize + idx + 1;
                                return (
                                  <tr key={v.vendorName} className="hover:bg-slate-50/70 even:bg-slate-50/30">
                                    <td className="py-2 px-1.5 text-center text-slate-500 font-mono border-r border-slate-200">
                                      {rowNumber}
                                    </td>
                                    <td className="py-2 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                                      {v.vendorName}
                                    </td>
                                    <td className="py-2 px-2 text-slate-700 border-r border-slate-200">
                                      <div className="font-medium text-slate-800">{v.contactPerson}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{v.phone}</div>
                                    </td>
                                    <td className="py-2 px-1.5 text-center font-bold text-slate-800 border-r border-slate-200 font-mono">
                                      {v.orderCount} 笔
                                    </td>
                                    <td className="py-2 px-1.5 text-center text-slate-600 border-r border-slate-200 font-mono">
                                      {v.partsCount} 件
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                                      ￥{v.initialQuote.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800 border-r border-slate-200 bg-emerald-50/20">
                                      ￥{v.finalPrice.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono font-semibold text-indigo-700 border-r border-slate-200">
                                      ￥{v.savings.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-1.5 text-center font-mono font-bold text-indigo-700 border-r border-slate-200">
                                      {v.savingsRate}%
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                                      ￥{v.invoicedAmount.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-1.5 text-center font-mono font-medium text-slate-700">
                                      {v.pctOfTotal}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>

                            {/* 仅在最后一页底部渲染全院申报总计 */}
                            {isLastVendorPage && (
                              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                                <tr>
                                  <td colSpan={3} className="py-2 px-2.5 text-center border-r border-slate-300">
                                    全院外协服务商汇总合计 ({vendorSummary.length} 家)
                                  </td>
                                  <td className="py-2 px-1.5 text-center font-mono border-r border-slate-300">{stats.totalCount} 笔</td>
                                  <td className="py-2 px-1.5 text-center font-mono border-r border-slate-300">{totalPartsCount} 件</td>
                                  <td className="py-2 px-2 text-right font-mono text-slate-700 border-r border-slate-300">
                                    ￥{stats.initialQuoteGrandTotal.toLocaleString()}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-black text-emerald-800 border-r border-slate-300 bg-emerald-50/50">
                                    ￥{stats.finalNegotiatedTotal.toLocaleString()}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-black text-indigo-700 border-r border-slate-300">
                                    ￥{stats.savingsAmountTotal.toLocaleString()}
                                  </td>
                                  <td className="py-2 px-1.5 text-center font-mono font-black text-indigo-700 border-r border-slate-300">
                                    {stats.overallSavingsRate}%
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 border-r border-slate-300">
                                    ￥{stats.invoicedTotal.toLocaleString()}
                                  </td>
                                  <td className="py-2 px-1.5 text-center font-mono">
                                    100.0%
                                  </td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>

                      {/* 二、多科室联合审价会签与审批备案栏 (仅在 A4 最后一页完整展示) */}
                      {isLastVendorPage && (
                        <div className="space-y-2.5 pt-1">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-900" />
                            <span>二、多科室联合审价会签与审批备案栏</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {/* 1. 医学装备科初审 */}
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1.5">
                              <div className="font-bold text-slate-800 flex justify-between">
                                <span>医学装备科（技术核验与初审）</span>
                                <span className="text-emerald-700 font-semibold">初审合格</span>
                              </div>
                              <p className="text-slate-600 text-[10px] leading-tight">
                                故障现象与换件公允性复核无误，工时差旅费符合标准，建议报请审核。
                              </p>
                              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500 font-mono text-[10px]">
                                <span>经办: 刘志强 (2024098)</span>
                                <span>主管: 张建国</span>
                              </div>
                            </div>

                            {/* 2. 临床使用科室验收 */}
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1.5">
                              <div className="font-bold text-slate-800 flex justify-between">
                                <span>临床使用科室（完工验收确认）</span>
                                <span className="text-emerald-700 font-semibold">验收合格</span>
                              </div>
                              <p className="text-slate-600 text-[10px] leading-tight">
                                修复设备临床跟台运转正常，精度符合临床需求，同意报账结款。
                              </p>
                              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500 font-mono text-[10px]">
                                <span>安全员: 已确认</span>
                                <span>科主任/护士长: 会签</span>
                              </div>
                            </div>

                            {/* 3. 财务科预算复核 */}
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1.5">
                              <div className="font-bold text-slate-800 flex justify-between">
                                <span>财务科（预算复核与发票校验）</span>
                                <span className="text-emerald-700 font-semibold">复核通过</span>
                              </div>
                              <p className="text-slate-600 text-[10px] leading-tight">
                                专票真伪及抵扣税率核验完毕，已核减金额 ￥{stats.savingsAmountTotal.toLocaleString()}，安排资金备付。
                              </p>
                              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500 font-mono text-[10px]">
                                <span>审核: 李晓华</span>
                                <span>科长: 王明轩</span>
                              </div>
                            </div>

                            {/* 4. 审计处监督 */}
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1.5">
                              <div className="font-bold text-slate-800 flex justify-between">
                                <span>审计处（审价监督与合规留痕）</span>
                                <span className="text-emerald-700 font-semibold">程序合规</span>
                              </div>
                              <p className="text-slate-600 text-[10px] leading-tight">
                                联合议价程序合法透明，节资档案证据齐全，符合内部审计规定。
                              </p>
                              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500 font-mono text-[10px]">
                                <span>审计员: 陈刚</span>
                                <span>处长: 周文斌</span>
                              </div>
                            </div>

                            {/* 5. 分管院领导批复 */}
                            <div className="sm:col-span-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1.5">
                              <div className="font-bold text-slate-800 flex justify-between">
                                <span>分管院领导（审批批复与付款签发）</span>
                                <span className="text-emerald-700 font-semibold">同意结付</span>
                              </div>
                              <p className="text-slate-600 text-[10px] leading-tight">
                                同意按审定成交总金额 ￥{stats.finalNegotiatedTotal.toLocaleString()} 元结付，由财务科依法合规组织转账支付。
                              </p>
                              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500 font-mono text-[10px]">
                                <span>签发: 孙宏伟 (副院长)</span>
                                <span>批复日期: {today}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* A4 页脚 Running Footer */}
                    <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
                      <div>呈报科室：医学装备科（外协维修协同中心）</div>
                      <div className="font-mono font-bold text-slate-800">— 第 {pageNumber} 页 / 共 {totalA4Pages} 页 —</div>
                      <div>归档备查件 · 印发日期：{today}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: 外协供应商报价汇总表 (全部采用议价前价格) */}
          {reportTab === 'VENDOR_ANALYSIS' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    外协服务商月度申报报价汇总表 (议价前)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    展示各厂商在【{periodLabel}】申报工单量、拟换配件数、配件报价小计、工时差旅小计、议价前申报总额及全院占比
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-medium">
                    共计 {vendorSummary.length} 家合作服务商
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExecuteSystemPrint('VENDOR_ANALYSIS')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
                    title="打印外协服务商汇总表"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>打印 A4 表</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPdfDirect('VENDOR_ANALYSIS')}
                    disabled={isExportingPdf}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="直接生成并下载 A4 PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>导出 PDF</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-2.5 text-center w-12 border-r border-slate-300">序号</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">供应商名称</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">业务对接人 / 电话</th>
                      <th className="py-2.5 px-2.5 text-center w-20 border-r border-slate-300">申报工单</th>
                      <th className="py-2.5 px-2.5 text-center w-20 border-r border-slate-300">拟换配件数</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-300">配件报价小计</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-300">工时差旅小计</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-300 font-bold">议价前申报总额</th>
                      <th className="py-2.5 px-2.5 text-center w-20">全院占比</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {vendorSummary.map((v, idx) => (
                      <tr key={v.vendorName} className="hover:bg-slate-50/70 even:bg-slate-50/30">
                        <td className="py-2.5 px-2.5 text-center text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          {v.vendorName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                          <span className="font-medium text-slate-800">{v.contactPerson}</span>{' '}
                          <span className="text-slate-400 font-mono text-[11px]">({v.phone})</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-bold font-mono text-slate-700 border-r border-slate-200">{v.orderCount} 笔</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-600 border-r border-slate-200">{v.partsCount} 件</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-slate-200">￥{v.partsTotal.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 border-r border-slate-200">￥{v.laborAndTravel.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">￥{v.initialQuote.toLocaleString()}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-medium text-slate-700">
                          {v.pctOfTotal}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-300">全院外协服务商申报总计 ({vendorSummary.length} 家)</td>
                      <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-slate-300">{stats.totalCount} 笔</td>
                      <td className="py-2.5 px-2.5 text-center border-r border-slate-300">-</td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">￥{stats.quotePartsTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">￥{(stats.quoteLaborCost + stats.quoteTravelCost).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 border-r border-slate-300">￥{stats.initialQuoteGrandTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-2.5 text-center font-mono font-black">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: 临床科室外协分摊表 (A4 幅面分页与打印支撑，全部采用议价前价格) */}
          {reportTab === 'DEPT_BREAKDOWN' && (
            <div className="space-y-6 max-w-5xl mx-auto w-full">
              {/* A4 视图控制与分页导航条 (仅屏幕显示，打印时自动隐藏) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>A4 规范幅面 (210mm × 297mm)</span>
                  </div>

                  {/* 视图模式切换 */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDeptViewMode('a4_print')}
                      className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                        deptViewMode === 'a4_print'
                          ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="标准 A4 公文呈报件版面"
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>A4 呈报打印件</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptViewMode('standard')}
                      className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                        deptViewMode === 'standard'
                          ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="密集数据网格，支持全屏横向展开"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>数据明细网格</span>
                    </button>
                  </div>

                  {deptViewMode === 'a4_print' && (
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDeptA4ViewMode('single_page')}
                        className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                          deptA4ViewMode === 'single_page'
                            ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        单页翻阅
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeptA4ViewMode('continuous')}
                        className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                          deptA4ViewMode === 'continuous'
                            ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        连续展开
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* A4 翻页控制 (单页视图下) */}
                  {deptViewMode === 'a4_print' && deptA4ViewMode === 'single_page' && deptA4PageCount > 1 && (
                    <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
                      <button
                        type="button"
                        disabled={safeDeptA4Page <= 1}
                        onClick={() => setCurrentDeptA4Page(p => Math.max(1, p - 1))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer"
                        title="上一页 A4"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>上一页</span>
                      </button>

                      <div className="flex items-center space-x-1 mx-1">
                        {Array.from({ length: deptA4PageCount }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentDeptA4Page(pageNum)}
                            className={`min-w-6 h-6 px-1.5 rounded flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                              safeDeptA4Page === pageNum
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={`第 ${pageNum} 页`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={safeDeptA4Page >= deptA4PageCount}
                        onClick={() => setCurrentDeptA4Page(p => Math.min(deptA4PageCount, p + 1))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer"
                        title="下一页 A4"
                      >
                        <span>下一页</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="text-slate-300">|</span>

                  {/* 每页科室容纳数量 */}
                  <div className="flex items-center space-x-1 text-slate-500 text-xs">
                    <span>表容:</span>
                    <select
                      value={deptPageSize}
                      onChange={(e) => {
                        setDeptPageSize(Number(e.target.value));
                        setCurrentDeptA4Page(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-hidden"
                    >
                      <option value={8}>每页8科室</option>
                      <option value={10}>每页10科室(标准A4)</option>
                      <option value={12}>每页12科室</option>
                      <option value={15}>每页15科室</option>
                      <option value={999}>全部科室</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteSystemPrint('DEPT_BREAKDOWN')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-2xs transition cursor-pointer"
                    title="调用系统打印机打印标准 A4 PDF 科室分摊呈报件"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>打印 A4 分摊表 (共{deptA4PageCount}页)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPdfDirect('DEPT_BREAKDOWN')}
                    disabled={isExportingPdf}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="直接生成并下载标准 A4 PDF 文件"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>导出 A4 PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-2xs transition cursor-pointer"
                    title="导出 Excel / CSV 格式"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出 CSV</span>
                  </button>
                </div>
              </div>

              {/* 模式 A: 标准数据网格视图 (屏幕快速查阅，打印时隐藏) */}
              {deptViewMode === 'standard' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 print:hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-600" />
                        各临床科室维修申报分摊表 (议价前)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        汇总【{periodLabel}】各临床科室报修工单数、拟换配件需求及议价前申报总额分摊（含外协与自主配件维修）
                      </p>
                    </div>
                    <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-medium">
                      涵盖 {deptSummary.length} 个临床科室
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-lg overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="py-2.5 px-2.5 text-center w-12 border-r border-slate-300">序号</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-28">临床业务科室</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">具体维修项目 (涉及设备与拟换配件)</th>
                          <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-300">申报工单数</th>
                          <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-300">拟换配件数</th>
                          <th className="py-2.5 px-4 text-right border-r border-slate-300 font-bold w-32">议价前申报总额</th>
                          <th className="py-2.5 px-3 text-center w-32">占全院申报总额比重</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {deptSummary.map((d, idx) => (
                          <tr key={d.deptName} className="hover:bg-slate-50/70 even:bg-slate-50/30">
                            <td className="py-2.5 px-2.5 text-center text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">{d.deptName}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200">
                              <div className="space-y-1.5">
                                {d.projects && d.projects.length > 0 ? (
                                  d.projects.map((proj, pIdx) => (
                                    <div key={proj.orderId || pIdx} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs gap-1">
                                      <div className="flex items-start gap-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                        <div className="leading-snug">
                                          <span className="font-semibold text-slate-800">{proj.cleanEquipmentName}</span>
                                          <span className="text-slate-600 ml-1">【{proj.partsSummary}】</span>
                                        </div>
                                      </div>
                                      {d.projects.length > 1 && (
                                        <span className="font-mono text-slate-500 text-[11px] shrink-0 sm:ml-2">
                                          ￥{proj.initialQuote.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-slate-400">常规维修项目</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-semibold font-mono text-slate-700 border-r border-slate-200">{d.orderCount} 笔</td>
                            <td className="py-2.5 px-2.5 text-center font-mono text-slate-600 border-r border-slate-200">{d.partsCount} 件</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 border-r border-slate-200">￥{d.initialQuote.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-indigo-600 h-full rounded-full" 
                                    style={{ width: `${Math.min(100, d.pctOfHospital)}%` }}
                                  />
                                </div>
                                <span className="font-bold font-mono text-slate-700 text-[11px]">{d.pctOfHospital}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-300">全院临床科室申报总计</td>
                          <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-slate-300">{stats.totalCount} 笔</td>
                          <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-slate-300">{totalPartsCount} 件</td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-slate-950 border-r border-slate-300">￥{stats.initialQuoteGrandTotal.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black">100.0%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* 模式 B: 标准 A4 沟通呈报件（极简、无冗余页眉页脚与说明，纯粹沟通核对） */}
              {Array.from({ length: deptA4PageCount }, (_, pIndex) => {
                const isLastPage = pIndex === deptA4PageCount - 1;
                const pageDepts = deptSummary.slice(pIndex * effectiveDeptPageSize, (pIndex + 1) * effectiveDeptPageSize);
                const pageNumber = pIndex + 1;

                return (
                  <div
                    key={`dept-a4-sheet-${pIndex}`}
                    className={`a4-report-sheet bg-white border border-slate-300 shadow-xl max-w-[210mm] w-full min-h-[297mm] mx-auto p-8 sm:p-10 text-slate-900 flex-col justify-between relative print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-[277mm] ${
                      deptViewMode === 'standard' 
                        ? 'hidden print:flex' 
                        : (deptA4ViewMode === 'single_page' && safeDeptA4Page !== pageNumber ? 'hidden print:flex' : 'flex')
                    }`}
                  >
                    {/* A4 顶部区域 */}
                    <div className="space-y-4">
                      {/* 简洁标题与基本信息 (已删除无关页眉，直接展现主标题) */}
                      {pIndex === 0 ? (
                        <div className="text-center pt-1 pb-3 border-b-2 border-slate-800 space-y-2">
                          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-normal">
                            五莲县人民医院 各临床科室维修申报分摊表 (议价前)
                          </h1>
                          <div className="flex items-center justify-center space-x-6 text-xs text-slate-600">
                            <div>呈报部门：<strong className="text-slate-800">设备科</strong></div>
                            <div>统计周期：<strong className="text-indigo-700 font-mono">{periodLabel}</strong></div>
                            <div>印发日期：<strong className="text-slate-800 font-mono">{new Date().toISOString().slice(0, 10)}</strong></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800">
                          <div className="text-sm font-bold text-slate-900">
                            五莲县人民医院 · 各临床科室维修申报分摊表 (议价前 · 续表)
                          </div>
                          <div className="text-xs text-slate-600 font-mono">
                            周期: {periodLabel}
                          </div>
                        </div>
                      )}

                      {/* 科室分摊简洁表格主体：仅保留序号、科室、工单数、拟换配件数、申报总额、占比 */}
                      <div className="border border-slate-300 rounded-sm overflow-hidden">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                            <tr>
                              <th className="py-2 px-2 text-center w-10 border-r border-slate-300">序号</th>
                              <th className="py-2 px-3 border-r border-slate-300 w-24">临床科室</th>
                              <th className="py-2 px-3 border-r border-slate-300">具体维修项目 (涉及设备与拟换配件)</th>
                              <th className="py-2 px-2 text-center w-20 border-r border-slate-300">申报工单</th>
                              <th className="py-2 px-2 text-center w-20 border-r border-slate-300">拟换配件</th>
                              <th className="py-2 px-3 text-right border-r border-slate-300 font-bold w-28">申报总额</th>
                              <th className="py-2 px-2.5 text-center w-20">全院占比</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {pageDepts.map((d, idx) => {
                              const globalIdx = pIndex * effectiveDeptPageSize + idx + 1;
                              return (
                                <tr key={d.deptName} className="hover:bg-slate-50/70 even:bg-slate-50/30">
                                  <td className="py-2 px-2 text-center text-slate-500 font-mono border-r border-slate-200">{globalIdx}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">{d.deptName}</td>
                                  <td className="py-2 px-3 border-r border-slate-200">
                                    <div className="space-y-1">
                                      {d.projects && d.projects.length > 0 ? (
                                        d.projects.map((proj, pIdx) => (
                                          <div key={proj.orderId || pIdx} className="text-xs text-slate-800 leading-snug flex items-start justify-between gap-1">
                                            <div>
                                              <span className="font-semibold text-slate-900">{proj.cleanEquipmentName}</span>
                                              <span className="text-slate-600 ml-1">【{proj.partsSummary}】</span>
                                            </div>
                                            {d.projects.length > 1 && (
                                              <span className="font-mono text-slate-500 text-[10px] shrink-0">
                                                ￥{proj.initialQuote.toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-slate-400">常规维修项目</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2.5 text-center font-semibold font-mono text-slate-700 border-r border-slate-200">{d.orderCount} 笔</td>
                                  <td className="py-2 px-2.5 text-center font-mono text-slate-600 border-r border-slate-200">{d.partsCount} 件</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">￥{d.initialQuote.toLocaleString()}</td>
                                  <td className="py-2 px-2.5 text-center font-mono font-medium text-slate-800">
                                    {d.pctOfHospital}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {isLastPage && (
                            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                              <tr>
                                <td colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-300">
                                  全院临床科室申报汇总合计 ({deptSummary.length} 个科室)
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-slate-300">{stats.totalCount} 笔</td>
                                <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-slate-300">{totalPartsCount} 件</td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 border-r border-slate-300">￥{stats.initialQuoteGrandTotal.toLocaleString()}</td>
                                <td className="py-2.5 px-2.5 text-center font-mono font-black">100.0%</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>

                    {/* A4 仅保留极简页码，删除冗余部门与备案件信息 */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-center text-[11px] text-slate-400 font-sans mt-auto">
                      <div className="font-mono font-medium text-slate-500">— 第 {pageNumber} 页 / 共 {deptA4PageCount} 页 —</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: 逐笔工单明细台账清单 */}
          {reportTab === 'LEDGER_DETAIL' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    外协维修报价逐笔明细对账台账
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    每笔外协申报对应真实设备、故障现象、拟换配件清单、原始报价构成、审定价及发票验真凭证
                  </p>
                </div>
                
                {/* 逐笔台账 A4 规格分页控制器 */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center space-x-1 text-slate-500">
                    <span>分页规格:</span>
                    <select
                      value={ledgerPageSize}
                      onChange={(e) => {
                        setLedgerPageSize(Number(e.target.value));
                        setLedgerPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-hidden"
                    >
                      <option value={8}>每页8笔 (A4标准)</option>
                      <option value={15}>每页15笔</option>
                      <option value={30}>每页30笔</option>
                      <option value={9999}>全部展示</option>
                    </select>
                  </div>

                  {totalLedgerPages > 1 && (
                    <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        disabled={safeLedgerPage <= 1}
                        onClick={() => setLedgerPage(1)}
                        className="px-2 py-1 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer shadow-2xs"
                        title="第一页"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={safeLedgerPage <= 1}
                        onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                        className="px-2 py-1 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer shadow-2xs"
                        title="上一页"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>上一页</span>
                      </button>

                      <span className="px-2 font-mono font-bold text-slate-700">
                        {safeLedgerPage} / {totalLedgerPages}
                      </span>

                      <button
                        type="button"
                        disabled={safeLedgerPage >= totalLedgerPages}
                        onClick={() => setLedgerPage(p => Math.min(totalLedgerPages, p + 1))}
                        className="px-2 py-1 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer shadow-2xs"
                        title="下一页"
                      >
                        <span>下一页</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={safeLedgerPage >= totalLedgerPages}
                        onClick={() => setLedgerPage(totalLedgerPages)}
                        className="px-2 py-1 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded transition font-medium flex items-center gap-0.5 cursor-pointer shadow-2xs"
                        title="最后一页"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="text-slate-500 font-medium ml-1">
                    共 <strong className="text-indigo-700">{filteredOrders.length}</strong> 笔
                  </span>

                  <button
                    type="button"
                    onClick={() => handleExecuteSystemPrint('LEDGER_DETAIL', 'landscape')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
                    title="打印外协报价逐笔明细对账台账 (建议横向打印)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>打印 A4 台账</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPdfDirect('LEDGER_DETAIL', 'landscape')}
                    disabled={isExportingPdf}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="直接生成并下载横向 A4 PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>导出 PDF</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-2.5 border-r border-slate-300">协同单号 / 院内单</th>
                      <th className="py-2.5 px-2 border-r border-slate-300 text-center">申报日期</th>
                      <th className="py-2.5 px-2.5 border-r border-slate-300">设备名称 / 规格型号</th>
                      <th className="py-2.5 px-2 border-r border-slate-300 text-center">科室</th>
                      <th className="py-2.5 px-2.5 border-r border-slate-300">外协服务商</th>
                      <th className="py-2.5 px-2.5 border-r border-slate-300">拟换配件明细 (议价前)</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-slate-300">配件申报小计</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-slate-300">工时差旅费</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-slate-300 font-bold">议价前总报价</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-300">业务状态</th>
                      <th className="py-2.5 px-2 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedOrders.map(order => {
                      const laborTravel = (order.quoteLaborCost || 0) + (order.quoteTravelCost || 0);

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 even:bg-slate-50/30">
                          <td className="py-2.5 px-2.5 border-r border-slate-200">
                            <div className="font-bold text-slate-800 font-mono">{order.id}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{order.workOrderId}</div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 border-r border-slate-200 text-center font-mono">
                            {extractOrderDate(order)}
                          </td>
                          <td className="py-2.5 px-2.5 max-w-[180px] border-r border-slate-200">
                            <div className="font-semibold text-slate-800 truncate" title={order.equipmentName}>
                              {order.equipmentName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {order.equipmentModel}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap border-r border-slate-200 text-center font-medium">
                            {getDepartmentMasterInfo(order.equipmentDept).department || order.equipmentDept}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-800 font-medium whitespace-nowrap border-r border-slate-200">
                            {order.vendorName}
                          </td>
                          <td className="py-2.5 px-2.5 max-w-[200px] border-r border-slate-200">
                            {order.quoteParts && order.quoteParts.length > 0 ? (
                              <div className="space-y-0.5">
                                {order.quoteParts.map((p, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-700 truncate" title={`${p.name} (${p.spec || '标准件'}) x${p.quantity} [单价:￥${p.unitPrice}]`}>
                                    • {p.name} <span className="text-slate-400 font-mono">x{p.quantity}</span> <span className="text-slate-500 font-mono text-[10px]">(￥{p.unitPrice})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">纯工时服务 (无配件)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-slate-700 font-mono font-medium whitespace-nowrap border-r border-slate-200">
                            ￥{(order.quotePartsTotal || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-slate-600 font-mono font-medium whitespace-nowrap border-r border-slate-200">
                            ￥{laborTravel.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-950 whitespace-nowrap border-r border-slate-200">
                            ￥{order.quoteGrandTotal.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap border-r border-slate-200">
                            {order.status === 'MULTI_DEPT_NEGOTIATING' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                                联合审价中
                              </span>
                            ) : order.status === 'COMPLETED_PENDING_INVOICE' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                                待开具发票
                              </span>
                            ) : order.status === 'INVOICE_UPLOADED' || order.status === 'ARCHIVED' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                已审定结案
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                                {order.status}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            {onSelectOrder && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectOrder(order);
                                  onClose();
                                }}
                                className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition font-medium cursor-pointer"
                              >
                                查看协同单
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                    <tr>
                      <td colSpan={6} className="py-2.5 px-3 text-center border-r border-slate-300">
                        当前筛选全量申报工单合计 ({filteredOrders.length} 笔)
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-300">
                        ￥{stats.quotePartsTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-300">
                        ￥{(stats.quoteLaborCost + stats.quoteTravelCost).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-950 border-r border-slate-300 font-black">
                        ￥{stats.initialQuoteGrandTotal.toLocaleString()}
                      </td>
                      <td colSpan={2} className="py-2.5 px-2 text-center font-mono text-slate-500">
                        厂商原始总申报口径
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* ================= 5. 底部栏 ================= */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>外协维修报价月报已与医院往来合作单位及财务发票数据库实时贯通，保证真实发生与一案一档审计合规</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>当前筛选统计笔数: <strong className="text-slate-800">{filteredOrders.length}</strong> 笔</span>
            <span>审定成交总计: <strong className="text-emerald-700 font-bold">￥{stats.finalNegotiatedTotal.toLocaleString()}</strong></span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>

      </div>

      {/* 专用打印与 PDF 生成模板（默认 hidden，打印时由 @media print 渲染，或导出时由 html2canvas 读取） */}
      <VendorReportPrintTemplate
        orders={orders}
        filteredOrders={filteredOrders}
        stats={stats}
        vendorSummary={vendorSummary}
        deptSummary={deptSummary}
        periodLabel={periodLabel}
        scope={printScope}
        orientation={printOrientation}
        isExporting={isExportingPdf}
      />

      {/* 打印与导出中心配置弹窗 */}
      <VendorReportPrintDialog
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        currentTab={reportTab}
        periodLabel={periodLabel}
        deptCount={deptSummary.length}
        vendorCount={vendorSummary.length}
        orderCount={filteredOrders.length}
        onExecutePrint={handleExecuteSystemPrint}
        onExportPdf={handleExportPdfDirect}
        isExportingPdf={isExportingPdf}
        pdfExportProgress={pdfExportProgress}
      />

      {/* PDF 导出全屏进度指示 */}
      {isExportingPdf && !showPrintModal && (
        <div className="fixed inset-0 z-80 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full flex flex-col items-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">正在生成并导出 A4 PDF</h4>
              <p className="text-xs text-slate-500 mt-1 font-mono">{pdfExportProgress || '正在逐页高保真渲染，请稍候...'}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full w-2/3 animate-pulse" />
            </div>
            <span className="text-[11px] text-slate-400">生成完成后将自动触发下载</span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, Printer, FileDown, CheckCircle2, Layout, FileText, 
  Building2, PieChart, Layers, ShieldCheck, Sparkles, Loader2
} from 'lucide-react';

export type PrintScope = 
  | 'CURRENT'            // 当前激活视图
  | 'DEPT_BREAKDOWN'     // 各临床科室维修申报分摊表 (议价前)
  | 'OFFICIAL_REPORT'    // 医学装备维修月度申报汇总呈报表
  | 'VENDOR_ANALYSIS'    // 外协服务商月度申报报价汇总表
  | 'LEDGER_DETAIL'      // 外协报价逐笔明细对账台账
  | 'FULL_BUNDLE';       // 全套完整呈报沟通包 (公文+科室分摊+供应商表+逐笔明细)

interface VendorReportPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: 'OFFICIAL_REPORT' | 'VENDOR_ANALYSIS' | 'DEPT_BREAKDOWN' | 'LEDGER_DETAIL';
  periodLabel: string;
  deptCount: number;
  vendorCount: number;
  orderCount: number;
  onExecutePrint: (scope: PrintScope, orientation: 'portrait' | 'landscape') => void;
  onExportPdf: (scope: PrintScope, orientation: 'portrait' | 'landscape') => void;
  isExportingPdf: boolean;
  pdfExportProgress: string;
}

export const VendorReportPrintDialog: React.FC<VendorReportPrintDialogProps> = ({
  isOpen,
  onClose,
  currentTab,
  periodLabel,
  deptCount,
  vendorCount,
  orderCount,
  onExecutePrint,
  onExportPdf,
  isExportingPdf,
  pdfExportProgress,
}) => {
  if (!isOpen) return null;

  const getInitialScope = (): PrintScope => {
    switch (currentTab) {
      case 'DEPT_BREAKDOWN': return 'DEPT_BREAKDOWN';
      case 'OFFICIAL_REPORT': return 'OFFICIAL_REPORT';
      case 'VENDOR_ANALYSIS': return 'VENDOR_ANALYSIS';
      case 'LEDGER_DETAIL': return 'LEDGER_DETAIL';
      default: return 'DEPT_BREAKDOWN';
    }
  };

  const [scope, setScope] = useState<PrintScope>(getInitialScope());
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    currentTab === 'LEDGER_DETAIL' ? 'landscape' : 'portrait'
  );

  const handleScopeChange = (newScope: PrintScope) => {
    setScope(newScope);
    if (newScope === 'LEDGER_DETAIL') {
      setOrientation('landscape');
    } else {
      setOrientation('portrait');
    }
  };

  const scopeOptions: {
    key: PrintScope;
    title: string;
    description: string;
    badge?: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'DEPT_BREAKDOWN',
      title: '各临床科室维修申报分摊表 (议价前)',
      description: `涵盖 ${deptCount} 个科室具体维修项目、涉及设备、拟换配件明细与申报总额 (标准A4幅面)`,
      badge: '临床沟通专用',
      icon: <PieChart className="w-4 h-4 text-indigo-600" />
    },
    {
      key: 'OFFICIAL_REPORT',
      title: '医学装备维修月度申报汇总呈报表',
      description: '呈报公文正文、四大核心指标及外协服务商报价汇总附表',
      badge: '设备科公文',
      icon: <FileText className="w-4 h-4 text-blue-600" />
    },
    {
      key: 'VENDOR_ANALYSIS',
      title: '外协服务商月度申报报价汇总表 (议价前)',
      description: `统计 ${vendorCount} 家合作厂商申报工单量、拟换配件总件数及申报总额`,
      icon: <Building2 className="w-4 h-4 text-slate-700" />
    },
    {
      key: 'LEDGER_DETAIL',
      title: '外协维修报价逐笔明细对账台账',
      description: `全院 ${orderCount} 笔报修故障、拟换配件清单、原始报价与审定价核验 (推荐横向排版)`,
      badge: '宽幅明细',
      icon: <Layers className="w-4 h-4 text-emerald-600" />
    },
    {
      key: 'FULL_BUNDLE',
      title: '全套呈报材料合并打印包 (完整汇编)',
      description: '顺序合并「公文正文 + 临床科室分摊表 + 供应商汇总表 + 逐笔明细台账」，一键全套归档',
      badge: '完整归档汇编',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />
    }
  ];

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-800">
                  报表打印与文件导出中心
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 font-mono">
                  {periodLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                五莲县人民医院 · 医学装备维修月度申报沟通与审价对账材料
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExportingPdf}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[72vh]">
          {/* 选择打印范围 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              1. 选择打印或导出的报表范围
            </label>
            <div className="space-y-2">
              {scopeOptions.map((opt) => {
                const isSelected = scope === opt.key;
                return (
                  <label
                    key={opt.key}
                    onClick={() => handleScopeChange(opt.key)}
                    className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 pr-2">
                      <div className="mt-0.5">{opt.icon}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="printScope"
                      checked={isSelected}
                      onChange={() => handleScopeChange(opt.key)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* 纸张与版式设置 */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">2. 纸张规格与排版方向</span>
              <span className="text-slate-500 font-mono">标准 A4 (210mm × 297mm)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  orientation === 'portrait'
                    ? 'border-indigo-600 bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'border-slate-200 text-slate-600 bg-slate-100 hover:bg-white'
                }`}
              >
                <Layout className="w-3.5 h-3.5 rotate-90" />
                <span>纵向排版 (公文/科室分摊推荐)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  orientation === 'landscape'
                    ? 'border-indigo-600 bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'border-slate-200 text-slate-600 bg-slate-100 hover:bg-white'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>横向排版 (多列台账推荐)</span>
              </button>
            </div>
          </div>

          {/* 打印效果保障提示 */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <div className="font-semibold text-emerald-900">打印高保真与纯净隔离保障</div>
              <p className="text-emerald-700 text-[11px]">
                已配置精准色彩还原（精确保留表格底纹与加粗线）及跨页防截断保护；打印时将完全屏蔽主界面背景元素，纸面效果规范整洁。
              </p>
            </div>
          </div>

          {/* PDF 导出进度提示 */}
          {isExportingPdf && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center space-x-3 text-xs text-indigo-900">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <div className="flex-1">
                <div className="font-bold">正在极速生成标准 A4 PDF 文件...</div>
                <div className="text-[11px] text-indigo-700 font-mono mt-0.5">{pdfExportProgress}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-400">
            提示：亦可在系统打印预览中直接选择「另存为 PDF」
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExportingPdf}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => onExportPdf(scope, orientation)}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="纯前端直接下载标准高清 PDF，无需调用打印机"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>直接下载 PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onExecutePrint(scope, orientation)}
              disabled={isExportingPdf}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="唤起浏览器系统打印窗口 (可选择纸质打印机或系统PDF)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>调用系统打印机</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

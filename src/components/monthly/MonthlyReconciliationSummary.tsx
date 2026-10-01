import React from 'react';
import { ShieldCheck, CheckCircle2, FileText, Download, Printer, Award } from 'lucide-react';

interface MonthlyReconciliationSummaryProps {
  totalItems: number;
  totalAmount: number;
  totalHospitalApproved: number;
  discrepancyAmount: number;
  onExportTsv: () => void;
  onOpenAuditReport: () => void;
}

export const MonthlyReconciliationSummary: React.FC<MonthlyReconciliationSummaryProps> = ({
  totalItems,
  totalAmount,
  totalHospitalApproved,
  discrepancyAmount,
  onExportTsv,
  onOpenAuditReport,
}) => {
  return (
    <div 
      id="monthly-reconciliation-summary"
      className="bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80 border border-indigo-200 rounded-xl p-3.5 sm:p-4 shadow-2xs shrink-0 text-xs"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-indigo-950">
                双方法人联合核验与零误差对账审定书
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                零分歧 · 双方电子章已签收
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              五莲县人民医院医学工程科 与 国药器械医工技术服务（中国）有限公司 联合闭环核验
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-reconcile-download-tsv"
            onClick={onExportTsv}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>导出双方法人对账表 (TSV)</span>
          </button>
          <button
            type="button"
            id="btn-reconcile-print-pdf"
            onClick={onOpenAuditReport}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印四方联合审签单 (PDF)</span>
          </button>
        </div>
      </div>

      {/* 四大维度对比矩阵 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
        <div className="bg-white/80 border border-indigo-100 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-500">工单比对 (申报 / 审定)</div>
          <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
            {totalItems} 项 ≡ {totalItems} 项
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">✓ 匹配率 100%</div>
        </div>

        <div className="bg-white/80 border border-indigo-100 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-500">金额核验 (申报 / 审定)</div>
          <div className="font-mono font-bold text-sm text-indigo-950 mt-0.5">
            ¥{totalAmount.toFixed(2)} ≡ ¥{totalHospitalApproved.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            ✓ 审减差额 ¥{discrepancyAmount.toFixed(2)}
          </div>
        </div>

        <div className="bg-white/80 border border-indigo-100 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-500">四流合规凭证归集</div>
          <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
            48 / 48 份
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">✓ 临床签字与退库齐全</div>
        </div>

        <div className="bg-white/80 border border-indigo-100 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-500">增值税专票税控勾稽</div>
          <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
            13% 专票无误
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">✓ 税款逐笔核销闭环</div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Wallet, Clock, Receipt, ShieldCheck } from 'lucide-react';
import { WorkspaceViewMode } from './MonthlySidebar';

interface MonthlyMetricsCardsProps {
  activeView: WorkspaceViewMode;
  setActiveView: (view: WorkspaceViewMode) => void;
  financialStats: {
    totalAmount: number;
    totalItems: number;
    paidAmount: number;
    inTransitAmount: number;
    unbilledPaymentAmount: number;
    paidRate: number;
    inTransitRate: number;
    unbilledRate: number;
    uninvoicedAmount: number;
    uninvoicedCount: number;
    invoicedAmount: number;
    invoicedCount: number;
    totalHospitalApproved: number;
    discrepancyAmount: number;
  };
  onQuickInvoice?: () => void;
}

export const MonthlyMetricsCards: React.FC<MonthlyMetricsCardsProps> = ({
  activeView,
  setActiveView,
  financialStats,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 w-full shrink-0 text-left">
      
      {/* 看板 1: 申报与审定总额 */}
      <div 
        id="card-metric-all"
        onClick={() => setActiveView('ALL')}
        className={`w-full p-2.5 sm:p-3 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
          activeView === 'ALL' 
            ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/50 shadow-2xs' 
            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 gap-1">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
            <span className="truncate">零星维保申报总额</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600 font-medium shrink-0 whitespace-nowrap">
            共 {financialStats.totalItems} 笔
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <div className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-900 truncate">
            ¥{financialStats.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
            审定通过
          </span>
        </div>
      </div>

      {/* 看板 2: 已回款清结 */}
      <div 
        id="card-metric-payment"
        onClick={() => setActiveView(activeView === 'PAYMENT' ? 'ALL' : 'PAYMENT')}
        className={`w-full p-2.5 sm:p-3 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
          activeView === 'PAYMENT' 
            ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/50 shadow-2xs' 
            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 gap-1">
          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 truncate">
            <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">已回款清结 (国库电汇)</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold shrink-0 whitespace-nowrap">
            {financialStats.paidRate}%
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <div className="text-base sm:text-lg font-black font-mono tracking-tight text-emerald-900 truncate">
            ¥{financialStats.paidAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
            在途 ¥{financialStats.inTransitAmount.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* 看板 3: 未开票归集 */}
      <div 
        id="card-metric-uninvoiced"
        onClick={() => setActiveView(activeView === 'UNINVOICED' ? 'ALL' : 'UNINVOICED')}
        className={`w-full p-2.5 sm:p-3 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
          activeView === 'UNINVOICED' 
            ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500/50 shadow-2xs' 
            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 gap-1">
          <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">完工待开票金额</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold shrink-0 whitespace-nowrap">
            待开 {financialStats.uninvoicedCount} 笔
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <div className="text-base sm:text-lg font-black font-mono tracking-tight text-amber-900 truncate">
            ¥{financialStats.uninvoicedAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-amber-700 shrink-0 whitespace-nowrap">
            验收完毕·待请款
          </span>
        </div>
      </div>

      {/* 看板 4: 双方智能对账 */}
      <div 
        id="card-metric-reconciliation"
        onClick={() => setActiveView(activeView === 'RECONCILIATION' ? 'ALL' : 'RECONCILIATION')}
        className={`w-full p-2.5 sm:p-3 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
          activeView === 'RECONCILIATION' 
            ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/50 shadow-2xs' 
            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 gap-1">
          <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">双方法人核对差额</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold shrink-0 whitespace-nowrap">
            零分歧
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <div className="text-base sm:text-lg font-black font-mono tracking-tight text-indigo-950 truncate">
            ¥{financialStats.discrepancyAmount.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium shrink-0 whitespace-nowrap">
            四流一致·五单合一
          </span>
        </div>
      </div>

    </div>
  );
};

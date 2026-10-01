import React from 'react';
import { 
  Building2, Layers, Wallet, Clock, Receipt, ShieldCheck, 
  Printer, Download, Plus, FileSpreadsheet, LogOut, CheckCircle2 
} from 'lucide-react';
import { VendorUserAccount } from '../../types/vendorCollaborationTypes';
import { VENDOR_ACCOUNTS } from '../../utils/vendorCollaborationData';

export type WorkspaceViewMode = 'ALL' | 'UNINVOICED' | 'INVOICED' | 'PAYMENT' | 'RECONCILIATION';

interface MonthlySidebarProps {
  currentVendor: VendorUserAccount;
  activeView: WorkspaceViewMode;
  setActiveView: (view: WorkspaceViewMode) => void;
  financialStats: {
    paidRate: number;
    uninvoicedCount: number;
    invoicedCount: number;
  };
  isHospitalView?: boolean;
  onOpenSingleEntry: () => void;
  onOpenBatchImport: () => void;
  onOpenAuditReport: () => void;
  onExportTsv: () => void;
  onSwitchToSpecialOrders?: () => void;
  onLogout?: () => void;
  onSwitchVendor?: (vendor: VendorUserAccount) => void;
}

export const MonthlySidebar: React.FC<MonthlySidebarProps> = ({
  currentVendor,
  activeView,
  setActiveView,
  financialStats,
  isHospitalView = false,
  onOpenSingleEntry,
  onOpenBatchImport,
  onOpenAuditReport,
  onExportTsv,
  onSwitchToSpecialOrders,
  onLogout,
  onSwitchVendor,
}) => {
  return (
    <aside 
      id="monthly-framework-sidebar" 
      className="w-full xl:w-64 2xl:w-72 shrink-0 bg-white border-b xl:border-b-0 xl:border-r border-slate-200 flex flex-col justify-between h-full z-20 shadow-2xs select-none"
    >
      {/* 顶部企业/科室标识 */}
      <div className="p-3.5 2xl:p-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0 border border-blue-800">
            {isHospitalView ? '医工' : currentVendor.vendorName.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs font-bold text-slate-900 tracking-tight truncate" title={currentVendor.vendorName}>
              {isHospitalView ? '五莲县人民医院 · 医学工程科' : currentVendor.vendorName}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {isHospitalView ? '零星维保审签席' : currentVendor.category}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                入库签约
              </span>
            </div>
          </div>
        </div>

        {/* 协议与对账信息小条 */}
        <div className="bg-slate-50 rounded-lg p-2 text-[11px] text-slate-600 space-y-1 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">合作协议:</span>
            <span className="font-mono font-bold text-slate-800">SINOPHARM-2026</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">对账周期:</span>
            <span className="text-slate-700 font-medium">按月归集 · 逐笔核销</span>
          </div>
        </div>

        {/* 快捷录入按钮 */}
        <div className="mt-2.5 space-y-1.5">
          <button
            type="button"
            id="btn-sidebar-single-entry"
            onClick={onOpenSingleEntry}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="手工单笔录入零星维修工单"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 单笔录入工单</span>
          </button>

          <button
            type="button"
            id="btn-sidebar-batch-import"
            onClick={onOpenBatchImport}
            className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="从Excel或TSV批量导入工单明细"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>TSV / Excel 批量导入</span>
          </button>
        </div>
      </div>

      {/* 中部核心协同导航菜单 */}
      <nav className="p-2.5 2xl:p-3 flex-1 overflow-y-auto space-y-1 text-xs">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
          核心协同视角
        </div>

        {/* 1. 智能对账总览 */}
        <button
          type="button"
          id="nav-view-all"
          onClick={() => setActiveView('ALL')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer text-left ${
            activeView === 'ALL'
              ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className={`w-3.5 h-3.5 ${activeView === 'ALL' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>全部对账明细</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
            48项
          </span>
        </button>

        {/* 2. 回款进度看板 */}
        <button
          type="button"
          id="nav-view-payment"
          onClick={() => setActiveView('PAYMENT')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer text-left ${
            activeView === 'PAYMENT'
              ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wallet className={`w-3.5 h-3.5 ${activeView === 'PAYMENT' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>回款进度流水</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
            {financialStats.paidRate}%
          </span>
        </button>

        {/* 3. 未开票项目归集 */}
        <button
          type="button"
          id="nav-view-uninvoiced"
          onClick={() => setActiveView('UNINVOICED')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer text-left ${
            activeView === 'UNINVOICED'
              ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-3.5 h-3.5 ${activeView === 'UNINVOICED' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>未开票待办</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
            {financialStats.uninvoicedCount}项
          </span>
        </button>

        {/* 4. 已开票核销管理 */}
        <button
          type="button"
          id="nav-view-invoiced"
          onClick={() => setActiveView('INVOICED')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer text-left ${
            activeView === 'INVOICED'
              ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Receipt className={`w-3.5 h-3.5 ${activeView === 'INVOICED' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>已开票核销</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold">
            {financialStats.invoicedCount}项
          </span>
        </button>

        {/* 5. 双方智能对账 */}
        <button
          type="button"
          id="nav-view-reconciliation"
          onClick={() => setActiveView('RECONCILIATION')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer text-left ${
            activeView === 'RECONCILIATION'
              ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-300 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-3.5 h-3.5 ${activeView === 'RECONCILIATION' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>双方智能对账</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
            0误差
          </span>
        </button>

        <div className="pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
          凭证与公文工具
        </div>

        {/* 6. 四方联合审签单 (PDF) */}
        <button
          type="button"
          id="btn-sidebar-audit-report"
          onClick={onOpenAuditReport}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>四方审签单 (PDF)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
            公文盖章
          </span>
        </button>

        {/* 7. 导出双方确认对账单 */}
        <button
          type="button"
          id="btn-sidebar-export-tsv"
          onClick={onExportTsv}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
          title="导出48项零星维保双方财务对账单 (TSV/Excel)"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>导出对账单 (TSV)</span>
        </button>

        {/* 8. 专项大修会审 */}
        {onSwitchToSpecialOrders && (
          <button
            type="button"
            id="btn-sidebar-switch-special"
            onClick={onSwitchToSpecialOrders}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left mt-1"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>专项大修会审</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
              5台
            </span>
          </button>
        )}
      </nav>

      {/* 底部经办人与系统席位 */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">{isHospitalView ? '经办科室:' : '驻场经理:'}</span>
          <span className="font-semibold text-slate-800">
            {isHospitalView ? '医工科审核席' : `${currentVendor.contactPerson} (${currentVendor.phone})`}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">收款账户:</span>
          <span className="font-mono text-slate-700">
            {currentVendor.bankName ? currentVendor.bankName.slice(0, 4) : '中国银行'}·尾号{currentVendor.bankAccount ? currentVendor.bankAccount.slice(-4) : '3811'}
          </span>
        </div>

        {onSwitchVendor && (
          <div className="pt-1">
            <select
              value={currentVendor.vendorId}
              onChange={(e) => {
                const v = VENDOR_ACCOUNTS.find(acc => acc.vendorId === e.target.value);
                if (v) onSwitchVendor(v);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-none cursor-pointer"
            >
              {VENDOR_ACCOUNTS.map(v => (
                <option key={v.vendorId} value={v.vendorId}>
                  切换: {v.vendorName}
                </option>
              ))}
            </select>
          </div>
        )}

        {onLogout && (
          <button
            type="button"
            id="btn-sidebar-logout"
            onClick={onLogout}
            className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3 h-3 text-slate-500" />
            <span>返回医院端</span>
          </button>
        )}
      </div>
    </aside>
  );
};

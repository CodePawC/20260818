import React, { useMemo } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Receipt,
  Scale,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { ImmediateReconciliationPanel } from '../ImmediateReconciliationPanel';
import { getVendorCollaborationOrders } from '../../utils/vendorCollaborationData';

export const VendorHomeView: React.FC<RoleHomepageCommonProps> = ({
  currentUser,
  userDept,
  frameworkBatches,
  urgentReconcileCount,
  totalDiffAmount,
  onNavigateToTab,
  onNavigateToLedger,
  onItemReconciled
}) => {
  const vendorOrders = useMemo(() => {
    try {
      return getVendorCollaborationOrders();
    } catch {
      return [];
    }
  }, []);

  const uninvoicedTotal = useMemo(() => {
    const items = frameworkBatches.flatMap(b => b.items).filter(it => !it.invoiced);
    return items.reduce((s, it) => s + (it.totalPrice || 0), 0);
  }, [frameworkBatches]);

  const activeVendorOrders = useMemo(
    () => vendorOrders.filter(o => o.status !== 'ARCHIVED'),
    [vendorOrders]
  );

  const awaitingSignoffCount = useMemo(
    () => vendorOrders.filter(o => o.status === 'COMPLETED_PENDING_INVOICE' || o.status === 'INVOICE_UPLOADED').length,
    [vendorOrders]
  );

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_QUOTE':
        return '待我方报价';
      case 'MULTI_DEPT_NEGOTIATING':
        return '院方多科议价中';
      case 'QUOTE_REJECTED':
        return '报价已驳回/需重报';
      case 'APPROVED_REPAIRING':
        return '已定标维修中';
      case 'COMPLETED_PENDING_INVOICE':
        return '已完工待传发票';
      case 'INVOICE_UPLOADED':
        return '已传发票待核验';
      case 'ARCHIVED':
        return '已归档结算';
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 签约服务商专属 4 格核心 KPI (隔离院内无关台账与内部行政模块) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => onNavigateToTab?.('vendor_collaboration')}
          className="bg-white rounded-xl border border-indigo-200 p-3.5 hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">我方在办外协工单</span>
            <Wrench className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-indigo-700">
            {activeVendorOrders.length} <span className="text-xs font-medium text-slate-500">/ {vendorOrders.length}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            含驻场框架维修与原厂专保工单
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('vendor_collaboration')}
          className="bg-white rounded-xl border border-emerald-200 p-3.5 hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">待临床签字与验收结算</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-emerald-700">
            {awaitingSignoffCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            完工后需取得使用科室及医工双签
          </div>
        </div>

        <div
          onClick={() => {
            const el = document.getElementById('immediate-reconciliation-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="bg-white rounded-xl border border-rose-200 p-3.5 hover:border-rose-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">待认领核减与旧件交回</span>
            <Scale className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-rose-700">
            {urgentReconcileCount} <span className="text-xs font-medium text-slate-500">项</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-mono tabular-nums">
            协议审定核减差额 ¥{totalDiffAmount.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('vendor_collaboration')}
          className="bg-white rounded-xl border border-amber-200 p-3.5 hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">待开票框架结算批次</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-amber-700">
            ¥{uninvoicedTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            核对确认后请按月度批次提交正规发票
          </div>
        </div>
      </div>

      {/* 2. 院方工程指令与维保标准通知接收区 (签约服务商仅收不发) */}
      <RoleNoticeCenter
        currentUser={currentUser}
        compact
        onNavigateToTab={onNavigateToTab}
        onNavigateToLedger={onNavigateToLedger}
        titleOverride="院方医工指令、入场规范与结算通知接收区"
      />

      {/* 3. 双栏主作业区：我方外协履约工单队列 (5/12) + 院企双方核减即时对账舱 (7/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">院方外协维保履约单据</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab?.('vendor_collaboration')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>外协协同门户</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2.5 min-h-[320px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1 flex-1">
            {vendorOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">暂无在办外协履约订单</div>
            ) : (
              vendorOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => onNavigateToTab?.('vendor_collaboration')}
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{order.equipmentName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono">{order.id}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Building2 className="w-3 h-3" />
                          {order.equipmentDept}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 shrink-0 whitespace-nowrap">
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2">{order.faultDescription}</p>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.createdAt}
                    </span>
                    <span className="font-bold text-slate-800">
                      报价 ¥{(order.quoteGrandTotal || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <ImmediateReconciliationPanel
            batches={frameworkBatches}
            isDeptView={false}
            userDept={userDept}
            onNavigateToTab={onNavigateToTab}
            onItemReconciled={onItemReconciled}
          />
        </div>
      </div>
    </div>
  );
};

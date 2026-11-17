import React, { useMemo } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  FileCheck2,
  Plus,
  Receipt,
  Scale,
  TrendingUp,
  Wallet,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { PinnedFinancialKpiGrid } from '../PinnedFinancialKpiGrid';
import { ImmediateReconciliationPanel } from '../ImmediateReconciliationPanel';
import { MeaningfulExecutiveCharts } from '../MeaningfulExecutiveCharts';

export const FinancialHomeView: React.FC<RoleHomepageCommonProps> = ({
  currentUser,
  userDept,
  stats,
  equipmentList,
  allEquipmentList,
  departmentOptions,
  liveWorkOrders,
  approvalApplications,
  borrowedEmergencyDevices,
  upcomingPmAndCalibrations,
  lifeSupportDevices,
  frameworkBatches,
  urgentReconcileCount,
  totalDiffAmount,
  onNavigateToTab,
  onNavigateToLedger,
  onNavigateToApprovals,
  onOpenAddModal,
  onSelectDeviceDetail,
  onOpenRepairDetail,
  onItemReconciled
}) => {
  const uninvoicedSummary = useMemo(() => {
    const items = frameworkBatches.flatMap(b => b.items).filter(it => !it.invoiced);
    const amount = items.reduce((s, it) => s + (it.totalPrice || 0), 0);
    return { count: items.length, amount };
  }, [frameworkBatches]);

  const pendingFinanceApprovals = useMemo(() => {
    return approvalApplications.filter(
      a => a.status === 'pending_finance' || a.status === 'pending_engineering' || a.status === 'pending_dean'
    );
  }, [approvalApplications]);

  const healthRate = useMemo(() => {
    const total = stats.totalCount || equipmentList.length || 1;
    const normal = stats.normalCount || equipmentList.filter(e => e.status === '正常运行').length;
    return Math.round((normal / total) * 100);
  }, [stats, equipmentList]);

  const scrollToReconciliation = () => {
    const el = document.getElementById('immediate-reconciliation-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 财务资产管理员专属 4 格核心 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => onNavigateToLedger('')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">全院医疗固定资产原值</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            ¥{((stats.totalValue || 0) / 10000).toFixed(1)} <span className="text-xs font-medium text-slate-500">万</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            建卡资产 {stats.totalCount} 台 · 本月维修支出 ¥{(stats.monthlyRepairCost || 0).toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('vendor_collaboration')}
          className="bg-white rounded-xl border border-amber-200 p-3.5 hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">待开票零星维保归集</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-amber-700">
            ¥{uninvoicedSummary.amount.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-mono tabular-nums">
            未开票明细 {uninvoicedSummary.count} 笔 · 点击进入批量开票
          </div>
        </div>

        <div
          onClick={scrollToReconciliation}
          className="bg-white rounded-xl border border-rose-200 p-3.5 hover:border-rose-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">核减差额待即时对账</span>
            <Scale className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-rose-700">
            ¥{totalDiffAmount.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-mono tabular-nums">
            待确认对账 {urgentReconcileCount} 笔 · 依据框架协议审定
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('approvals')}
          className="bg-white rounded-xl border border-indigo-200 p-3.5 hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">采购预算与资金审批流</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-indigo-700">
            {pendingFinanceApprovals.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            含预算会签、固定资产入账与效益评估
          </div>
        </div>
      </div>

      {/* 2. 财务结算与盘点通告下发中心 */}
      <RoleNoticeCenter
        currentUser={currentUser}
        departmentOptions={departmentOptions}
        onNavigateToTab={onNavigateToTab}
        onNavigateToLedger={onNavigateToLedger}
        titleOverride="财务结算、资产盘点与票据归集通知下发中心"
      />

      {/* 3. 全院账务财务核心指标条 (复用置顶 5 格账务组件) */}
      <PinnedFinancialKpiGrid
        batches={frameworkBatches}
        monthlyRepairCost={stats.monthlyRepairCost || 0}
        healthRate={healthRate}
        normalCount={stats.normalCount}
        faultCount={stats.faultCount}
        borrowedCount={borrowedEmergencyDevices.length}
        urgentReconcileCount={urgentReconcileCount}
        totalDiffAmount={totalDiffAmount}
        isDeptView={false}
        userDept={userDept}
        pendingDeptSignoffsCount={pendingFinanceApprovals.length}
        upcomingPmCount={upcomingPmAndCalibrations.length}
        lifeSupportCount={lifeSupportDevices.length}
        onNavigateToTab={onNavigateToTab}
        onScrollToReconciliation={scrollToReconciliation}
        onNavigateToApprovals={() => onNavigateToTab?.('approvals')}
      />

      {/* 4. 双方核减即时对账舱 + 财务审批/资产分析双栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <ImmediateReconciliationPanel
            batches={frameworkBatches}
            isDeptView={false}
            userDept={userDept}
            onNavigateToTab={onNavigateToTab}
            onItemReconciled={onItemReconciled}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3.5">
          {/* 待审立项与资产建卡 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">设备采购立项预算会签队列</h3>
              </div>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>固定资产建卡</span>
              </button>
            </div>

            <div className="mt-2.5 space-y-2 min-h-[240px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1 flex-1">
              {pendingFinanceApprovals.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  暂无待财务会签单据
                </div>
              ) : (
                pendingFinanceApprovals.map(app => (
                  <div
                    key={app.id}
                    onClick={() => (onNavigateToApprovals ? onNavigateToApprovals(app) : onNavigateToTab?.('approvals'))}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white cursor-pointer transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{app.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                        {app.applicantDepartment} · 预算 ¥{((app.estimatedBudget || 0) / 10000).toFixed(1)} 万
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 shrink-0">审核 →</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab?.('roi')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50/60 text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>单机 ROI 效益审计</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">核查大型设备创收与折旧</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab?.('drg_cost_audit')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/60 text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>全院 DRG 耗材审计</span>
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">病种单台维保耗占比穿透</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 全院最新报修与维保发生实时监测 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">全院最新报修与维保发生实时监测</h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              ({liveWorkOrders.length} 笔)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('repairs')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>查看全院报修日志</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2.5 space-y-2 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin pr-1">
          {liveWorkOrders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">暂无实时报修发生记录</div>
          ) : (
            liveWorkOrders.slice(0, 12).map(order => {
              const statusLabel =
                order.status === 'pending_dispatch'
                  ? '待派工'
                  : order.status === 'pre_dispatched'
                  ? '预派工'
                  : order.status === 'repaired_pending_acceptance'
                  ? '待验收'
                  : order.status === 'closed'
                  ? '已闭环'
                  : '维修中';
              const statusTone =
                order.status === 'pending_dispatch'
                  ? 'text-rose-700'
                  : order.status === 'repaired_pending_acceptance'
                  ? 'text-amber-700'
                  : order.status === 'closed'
                  ? 'text-emerald-700'
                  : 'text-indigo-700';

              return (
                <div
                  key={order.id}
                  onClick={() =>
                    onOpenRepairDetail({
                      id: order.id,
                      workOrderId: order.id,
                      recordNo: order.caoliaoRecordNo,
                      timestamp: order.reportTime,
                      equipmentId: order.equipmentId,
                      equipmentName: order.equipmentName,
                      equipmentSn: order.equipmentSn,
                      department: order.department,
                      reporterName: order.reporterName,
                      reporterPhone: order.reporterPhone,
                      faultDescription: order.faultDescription,
                      photoUrl: order.photoUrl,
                      urgency: order.priority === 'P1_CRITICAL' ? 'P1' : 'P2',
                      source: order.source === 'caoliao' ? '草料二维码' : '系统报修'
                    })
                  }
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {order.department} · {order.equipmentName}
                      <span className="ml-2 font-mono tabular-nums text-[11px] font-medium text-slate-500">
                        {order.caoliaoRecordNo ? `草料 ${order.caoliaoRecordNo}` : order.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {order.faultDescription || '故障维保发生'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-right">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {order.totalRepairCost > 0 ? `¥${order.totalRepairCost.toLocaleString()}` : '待核算'}
                      </div>
                      <div className={`text-[11px] font-semibold ${statusTone}`}>{statusLabel}</div>
                    </div>
                    <div className="text-[11px] text-slate-500">{order.reportTime}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. 资产运行与维修费率趋势图 */}
      <MeaningfulExecutiveCharts
        equipmentList={allEquipmentList || equipmentList}
        userDept={userDept}
        isDeptView={false}
        onNavigateToLedger={onNavigateToLedger}
        onNavigateToTab={onNavigateToTab}
        onSelectDeviceDetail={onSelectDeviceDetail}
      />
    </div>
  );
};

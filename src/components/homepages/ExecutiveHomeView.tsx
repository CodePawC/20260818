import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  FileCheck2,
  HeartPulse,
  RotateCcw,
  TrendingUp,
  Wallet,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { PinnedFinancialKpiGrid } from '../PinnedFinancialKpiGrid';
import { MeaningfulExecutiveCharts } from '../MeaningfulExecutiveCharts';
import { calculateDynamicAccreditationStats, INITIAL_QUALITY_CAPAS } from '../../utils/qualityAccreditationData';

export const ExecutiveHomeView: React.FC<RoleHomepageCommonProps> = ({
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
  onSelectDeviceDetail,
  onOpenRepairModal,
  onOpenRepairDetail
}) => {
  const fullList = allEquipmentList || equipmentList;

  const healthRate = useMemo(() => {
    const total = stats.totalCount || fullList.length || 1;
    const normal = stats.normalCount || fullList.filter(e => e.status === '正常运行').length;
    return Math.round((normal / total) * 100);
  }, [stats, fullList]);

  const executivePendingApprovals = useMemo(
    () => approvalApplications.filter(a => a.status === 'pending_dean' || a.status === 'pending_finance'),
    [approvalApplications]
  );

  const accreditationStats = useMemo(() => {
    try {
      return calculateDynamicAccreditationStats(fullList, INITIAL_QUALITY_CAPAS);
    } catch {
      return null;
    }
  }, [fullList]);

  // 核心临床重点科室健康度对比
  const keyDeptMatrix = useMemo(() => {
    const targets = ['重症医学科(ICU)', '急诊科', '麻醉手术科', '医学影像科', '心血管内科'];
    return targets.map(dept => {
      const prefix = dept.split('(')[0];
      const list = fullList.filter(
        e =>
          e.department === dept ||
          e.department?.includes(prefix) ||
          (dept === '麻醉手术科' && (e.department === '手术室' || e.department?.includes('手术')))
      );
      const total = list.length;
      const normal = list.filter(e => e.status === '正常运行').length;
      const fault = list.filter(e => e.status === '故障待修').length;
      const value = list.reduce((s, e) => s + (e.purchasePrice || 0), 0);
      return {
        dept,
        total,
        normal,
        fault,
        value,
        rate: total ? Math.round((normal / total) * 100) : 100
      };
    });
  }, [fullList]);

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 分管副院长专属 4 格宏观治理 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => onNavigateToLedger('')}
          className="bg-white rounded-xl border border-emerald-200 p-3.5 hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">全院装备综合完好率</span>
            <HeartPulse className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-emerald-700">
            {healthRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            在册 {stats.totalCount} 台 · 故障 {stats.faultCount} 台
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('roi')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">资产规模与月度运维投入</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            ¥{((stats.totalValue || 0) / 10000).toFixed(0)} <span className="text-xs font-medium text-slate-500">万</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            月度维保支出 ¥{(stats.monthlyRepairCost || 0).toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('approvals')}
          className="bg-white rounded-xl border border-indigo-200 p-3.5 hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">院级重点采购/报废待批</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-indigo-700">
            {executivePendingApprovals.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            大额设备论证与跨科统筹审批
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('accreditation_quality')}
          className="bg-white rounded-xl border border-amber-200 p-3.5 hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">三甲质控与国考达标率</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-amber-700">
            {accreditationStats?.summary?.overallComplianceRate != null
              ? `${accreditationStats.summary.overallComplianceRate.toFixed(1)}%`
              : '98.2%'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            强检与应急生命支持 100% 临床溯源
          </div>
        </div>
      </div>

      {/* 2. 院级督办通告下发与各科签收追踪台 */}
      <RoleNoticeCenter
        currentUser={currentUser}
        departmentOptions={departmentOptions}
        onNavigateToTab={onNavigateToTab}
        onNavigateToLedger={onNavigateToLedger}
        titleOverride="院级专项督办指令下发与全院各科签收追踪台"
      />

      {/* 3. 核心宏观态势图表首屏前置展示 */}
      <MeaningfulExecutiveCharts
        equipmentList={fullList}
        userDept={userDept}
        isDeptView={false}
        onNavigateToLedger={onNavigateToLedger}
        onNavigateToTab={onNavigateToTab}
        onSelectDeviceDetail={onSelectDeviceDetail}
        onOpenRepairModal={onOpenRepairModal}
      />

      {/* 4. 重点科室装备对比矩阵 (7/12) + 院领导决策待批/跨科统筹 (5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">临床重点科室设备健康度与资产分布对比</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab?.('digital_twin_sandbox')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>数字孪生沙箱</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
            {keyDeptMatrix.map(row => (
              <div
                key={row.dept}
                onClick={() => onNavigateToLedger('', row.dept)}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-white cursor-pointer transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{row.dept}</span>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      共 {row.total} 台 · ¥{(row.value / 10000).toFixed(0)}万
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    {row.fault > 0 && (
                      <span className="text-[11px] font-bold text-rose-700 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        故障 {row.fault}
                      </span>
                    )}
                    <span className={`text-xs font-bold ${row.rate >= 95 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {row.rate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.rate >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${row.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3.5">
          {/* 院领导待批请示 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">院级审批与立项论证摘要</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('approvals')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer whitespace-nowrap shrink-0"
              >
                审批中心 →
              </button>
            </div>

            <div className="mt-2.5 space-y-2 min-h-[220px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {executivePendingApprovals.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">暂无待院领导终审单据</div>
              ) : (
                executivePendingApprovals.map(app => (
                  <div
                    key={app.id}
                    onClick={() => (onNavigateToApprovals ? onNavigateToApprovals(app) : onNavigateToTab?.('approvals'))}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{app.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {app.applicantDepartment} · ¥{((app.estimatedBudget || 0) / 10000).toFixed(1)} 万
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 shrink-0">审阅 →</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 跨科应急借调监管 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">全院跨科急救设备调配监管</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('emergency_reserve')}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 cursor-pointer whitespace-nowrap shrink-0"
              >
                全部 {borrowedEmergencyDevices.length} 台 →
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-600 flex items-center justify-between font-mono tabular-nums">
              <span>当前在借急救设备：{borrowedEmergencyDevices.length} 台</span>
              <span className="text-rose-700 font-bold">
                超期预警：{borrowedEmergencyDevices.filter(b => b.isOverdue).length} 台
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 全院最新临床报修与停机处置实时流 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">全院最新临床报修与停机处置实时流</h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              ({liveWorkOrders.length} 笔)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('repairs')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>临床报修全览</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2.5 space-y-2 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin pr-1">
          {liveWorkOrders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">暂无实时报修记录</div>
          ) : (
            liveWorkOrders.slice(0, 12).map(order => {
              const statusLabel =
                order.status === 'pending_dispatch'
                  ? '待派工'
                  : order.status === 'pre_dispatched'
                  ? '预派工讨论'
                  : order.status === 'repaired_pending_acceptance'
                  ? '待临床验收'
                  : order.status === 'closed'
                  ? '已闭环'
                  : '维修处置中';
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
                      {order.equipmentName}
                      <span className="ml-2 font-mono tabular-nums text-[11px] font-medium text-slate-500">
                        {order.caoliaoRecordNo ? `草料 ${order.caoliaoRecordNo}` : order.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {order.department} · {order.reporterName} · {order.faultDescription || '临床故障报修'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[11px] font-bold ${statusTone}`}>{statusLabel}</div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                      {order.reportTime}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. 财务效益置顶监控条 */}
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
        pendingDeptSignoffsCount={executivePendingApprovals.length}
        upcomingPmCount={upcomingPmAndCalibrations.length}
        lifeSupportCount={lifeSupportDevices.length}
        onNavigateToTab={onNavigateToTab}
        onNavigateToApprovals={() => onNavigateToTab?.('approvals')}
      />
    </div>
  );
};

import React, { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Coins,
  FileCheck2,
  HeartPulse,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { calculateEquipmentFinancialProfile } from '../../utils/roiEconomicsUtils';
import { matchesDepartment } from '../../utils/masterData';

export const ClinicalDirectorHomeView: React.FC<RoleHomepageCommonProps> = ({
  currentUser,
  userDept,
  scopedEquipmentList,
  departmentOptions,
  liveWorkOrders,
  approvalApplications,
  borrowedEmergencyDevices,
  upcomingPmAndCalibrations,
  onNavigateToTab,
  onNavigateToLedger,
  onNavigateToApprovals,
  onOpenRepairModal,
  onSelectDeviceDetail,
  onOpenClinicalAcceptance,
  onOpenRepairDetail
}) => {
  const deptTotalValue = useMemo(
    () => scopedEquipmentList.reduce((s, e) => s + (e.purchasePrice || 0), 0),
    [scopedEquipmentList]
  );

  const normalCount = useMemo(
    () => scopedEquipmentList.filter(e => e.status === '正常运行').length,
    [scopedEquipmentList]
  );

  const healthRate = scopedEquipmentList.length
    ? Math.round((normalCount / scopedEquipmentList.length) * 1000) / 10
    : 100;

  const faultyDevices = useMemo(
    () => scopedEquipmentList.filter(e => e.status === '故障待修'),
    [scopedEquipmentList]
  );

  const deptApprovals = useMemo(
    () =>
      approvalApplications.filter(
        a =>
          !userDept ||
          a.applicantDepartment === userDept ||
          matchesDepartment(a.applicantDepartment || '', userDept) ||
          a.applicantName === currentUser?.name
      ),
    [approvalApplications, userDept, currentUser]
  );

  const pendingDeptApprovals = useMemo(
    () => deptApprovals.filter(a => a.status === 'pending_dept'),
    [deptApprovals]
  );

  // 计算本科室高值设备 ROI 排行
  const deptRoiRankings = useMemo(() => {
    const profiles = scopedEquipmentList
      .filter(e => (e.purchasePrice || 0) >= 30000)
      .slice(0, 12)
      .map(eq => ({ eq, fin: calculateEquipmentFinancialProfile(eq) }))
      .sort((a, b) => b.fin.annualNetProfit - a.fin.annualNetProfit);

    const avgRoi =
      profiles.length > 0
        ? Math.round((profiles.reduce((s, p) => s + p.fin.annualRoi, 0) / profiles.length) * 10) / 10
        : 0;

    return { profiles, avgRoi };
  }, [scopedEquipmentList]);

  // 待验收或推进中的本科室工单
  const deptWorkOrders = useMemo(
    () =>
      liveWorkOrders.filter(
        w =>
          w.status !== 'closed' &&
          (!userDept ||
            w.department === userDept ||
            matchesDepartment(w.department, userDept) ||
            w.department.includes(userDept))
      ),
    [liveWorkOrders, userDept]
  );

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 科主任专属 4 格核心 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => onNavigateToLedger('', userDept)}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">本科室设备资产原值</span>
            <Coins className="w-4 h-4 text-slate-700" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            ¥{(deptTotalValue / 10000).toFixed(1)}万
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            在册 {scopedEquipmentList.length} 台 · 完好率 {healthRate}%
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('roi')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">高值设备平均年化 ROI</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-emerald-700">
            {deptRoiRankings.avgRoi}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            覆盖单价 ≥3万主力装备 · 点击进入ROI分析
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('approvals')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">待科主任初审论证</span>
            <FileCheck2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {pendingDeptApprovals.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            本科室累计流转 {deptApprovals.length} 项立项/增配单
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('maintenance')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">安全合规与故障风险</span>
            <HeartPulse className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {faultyDevices.length + upcomingPmAndCalibrations.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            故障停机 {faultyDevices.length} 台 · 60天强检预警 {upcomingPmAndCalibrations.length} 台
          </div>
        </div>
      </div>

      {/* 2. 科室督办消息与通知接收区 */}
      <RoleNoticeCenter
        currentUser={currentUser}
        departmentOptions={departmentOptions}
        onNavigateToTab={onNavigateToTab}
        titleOverride={`【${userDept || '临床科室'}】院科督办与质控强检消息接收台`}
        compact
      />

      {/* 3. 科主任专属双栏：左 7（高值设备单机 ROI 榜单 + 立项论证） / 右 5（维修闭环 + 强检合规与应急借调） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* 左侧 (7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-3.5 min-h-0">
          {/* 3A: 本科室重点设备单机 ROI 经济效益评估表 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  【{userDept}】主力设备单机 ROI 产出与成本效益评估
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('analytics')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer whitespace-nowrap"
                >
                  绩效分析
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('roi')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>完整 ROI 看板</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-2 overflow-x-auto min-h-[240px] max-h-[60vh] overflow-y-auto overscroll-contain">
              {deptRoiRankings.profiles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  本科室暂无单价 ≥ ¥30,000 的大中型核算设备
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="py-2 font-semibold">设备名称</th>
                      <th className="py-2 font-semibold text-right">资产原值</th>
                      <th className="py-2 font-semibold text-right">年预估创收</th>
                      <th className="py-2 font-semibold text-right">年净收益</th>
                      <th className="py-2 font-semibold text-right">年化 ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {deptRoiRankings.profiles.slice(0, 20).map(({ eq, fin }) => (
                      <tr key={eq.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 pr-2 font-sans">
                          <button
                            type="button"
                            onClick={() => onSelectDeviceDetail(eq)}
                            className="font-semibold text-slate-900 hover:text-blue-700 cursor-pointer text-left truncate max-w-[200px] block"
                          >
                            {eq.name}
                          </button>
                          <span className="text-[10.5px] font-mono text-slate-400">{eq.sn}</span>
                        </td>
                        <td className="py-2 text-right text-slate-700">
                          ¥{(eq.purchasePrice / 10000).toFixed(1)}万
                        </td>
                        <td className="py-2 text-right text-slate-700">
                          ¥{(fin.annualGrossRevenue / 10000).toFixed(1)}万
                        </td>
                        <td className={`py-2 text-right font-semibold ${fin.annualNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ¥{(fin.annualNetProfit / 10000).toFixed(1)}万
                        </td>
                        <td className="py-2 text-right font-bold text-slate-900">
                          {fin.annualRoi.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 3B: 待科主任审批立项论证中心 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  科室设备立项、增配与报废论证审批
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToApprovals
                      ? onNavigateToApprovals({
                          type: 'procurement_increase',
                          applicantDepartment: userDept,
                          title: `【${userDept}】新设备购置/学科建设论证申请`
                        })
                      : onNavigateToTab?.('approvals')
                  }
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  发起新申购论证
                </button>
              </div>
            </div>

            <div className="mt-2 divide-y divide-slate-100 min-h-[200px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {deptApprovals.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">当前无待科室审批论证单据</div>
              ) : (
                deptApprovals.map(app => (
                  <div key={app.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{app.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {app.id} · 申请人: {app.applicantName} · 节点: {app.currentApprovalNode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('approvals')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                        app.status === 'pending_dept'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {app.status === 'pending_dept' ? '科主任签批' : '查看'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧 (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 min-h-0">
          {/* 3C: 本科室报修与待验收态势 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  【{userDept}】停机故障与工单进度
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onOpenRepairModal()}
                className="text-xs text-rose-700 hover:underline font-semibold cursor-pointer whitespace-nowrap"
              >
                + 登记报修
              </button>
            </div>
            <div className="mt-2 divide-y divide-slate-100 min-h-[220px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {deptWorkOrders.length === 0 && faultyDevices.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  科室在用设备全量正常运转
                </div>
              ) : (
                deptWorkOrders.map(order => (
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
                        source: order.source || 'caoliao'
                      })
                    }
                    className="py-2 flex items-center justify-between gap-2 hover:bg-slate-50/80 px-1 rounded transition cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 truncate">{order.equipmentName}</span>
                        {order.caoliaoRecordNo && (
                          <span className="text-[11px] font-mono text-emerald-700">草料 {order.caoliaoRecordNo}</span>
                        )}
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">{order.reportTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {order.id} · {order.faultDescription}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {order.status === 'repaired_pending_acceptance' ? (
                        <button
                          type="button"
                          onClick={() => onOpenClinicalAcceptance(order)}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          验收签字
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 whitespace-nowrap">
                          {order.assignedEngineerName
                            ? `维修中(${order.assignedEngineerName})`
                            : order.status === 'pre_dispatched' && order.proposedEngineerName
                            ? `拟派(${order.proposedEngineerName})`
                            : '待医工调度'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3D: 在借应急机具概况 + 近60天强检质控 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">近60天强检质控与在借概览</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('accreditation_quality')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
              >
                <span>等级评审质控</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2.5 space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
                  科室当前在借应急机具
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {borrowedEmergencyDevices.length} 台
                  {borrowedEmergencyDevices.some(b => b.isOverdue) && (
                    <span className="text-rose-600 ml-1.5">
                      (超期 {borrowedEmergencyDevices.filter(b => b.isOverdue).length} 台)
                    </span>
                  )}
                </span>
              </div>

              <div className="divide-y divide-slate-100 min-h-[200px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
                {upcomingPmAndCalibrations.length === 0 ? (
                  <div className="py-5 text-center text-xs text-slate-500">近60天无待检强检器具</div>
                ) : (
                  upcomingPmAndCalibrations.slice(0, 20).map(eq => (
                    <div key={eq.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectDeviceDetail(eq)}
                          className="font-semibold text-slate-900 hover:text-blue-700 truncate block text-left cursor-pointer"
                        >
                          {eq.name}
                        </button>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          定标到期: {eq.nextCalibrationDate || eq.nextMaintenanceDate}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectDeviceDetail(eq)}
                        className="px-2 py-0.5 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                        详情
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

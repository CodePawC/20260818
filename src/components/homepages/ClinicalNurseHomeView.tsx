import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  FileCheck2,
  FileText,
  HeartPulse,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { matchesDepartment } from '../../utils/masterData';

export const ClinicalNurseHomeView: React.FC<RoleHomepageCommonProps> = ({
  currentUser,
  userDept,
  scopedEquipmentList,
  departmentOptions,
  liveWorkOrders,
  approvalApplications,
  borrowedEmergencyDevices,
  upcomingPmAndCalibrations,
  lifeSupportDevices,
  frameworkBatches,
  handoverCompletedToday,
  onNavigateToTab,
  onNavigateToLedger,
  onNavigateToApprovals,
  onOpenRepairModal,
  onOpenAiModal,
  onSelectDeviceDetail,
  onReturnEquipment,
  onOpenOfficialReport,
  onOpenClinicalAcceptance,
  onCompleteHandoverCheck,
  onOpenRepairDetail
}) => {
  const [repairTab, setRepairTab] = useState<'in_progress' | 'acceptance' | 'faulty' | 'vendor'>('in_progress');

  const faultyDevices = useMemo(
    () => scopedEquipmentList.filter(e => e.status === '故障待修'),
    [scopedEquipmentList]
  );

  const normalCount = useMemo(
    () => scopedEquipmentList.filter(e => e.status === '正常运行').length,
    [scopedEquipmentList]
  );

  const healthRate = scopedEquipmentList.length
    ? Math.round((normalCount / scopedEquipmentList.length) * 1000) / 10
    : 100;

  // 本科室所有未闭环实时报修工单 (包含草料扫码与临床手动报修)
  const deptActiveOrders = useMemo(
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

  // 本科室待临床验收工单
  const pendingAcceptanceOrders = useMemo(
    () => deptActiveOrders.filter(w => w.status === 'repaired_pending_acceptance'),
    [deptActiveOrders]
  );

  // 本科室审批流转
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

  const pendingDeptCount = deptApprovals.filter(a => a.status === 'pending_dept').length;

  // 本科室名下外协零星换件明细
  const deptFrameworkItems = useMemo(() => {
    if (!userDept) return [];
    return frameworkBatches
      .flatMap(b => (b.items || []).map(it => ({ ...it, batchYearMonth: b.yearMonth })))
      .filter(it => matchesDepartment(it.department, userDept));
  }, [frameworkBatches, userDept]);

  const overdueLoanCount = borrowedEmergencyDevices.filter(b => b.isOverdue).length;

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 护士长专属 4 格核心 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => onNavigateToLedger('', userDept)}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">本科室设备完好率</span>
            <HeartPulse className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {healthRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            在册 {scopedEquipmentList.length} 台 · 正常 {normalCount} 台
          </div>
        </div>

        <div
          onClick={() => setRepairTab(pendingAcceptanceOrders.length > 0 ? 'acceptance' : 'in_progress')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">科室报修与待验收</span>
            <Wrench className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {deptActiveOrders.length}
          </div>
          <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
            <span className={pendingAcceptanceOrders.length > 0 ? 'text-blue-700 font-semibold' : ''}>
              待验收 {pendingAcceptanceOrders.length}
            </span>{' '}
            ·{' '}
            <span className={faultyDevices.length > 0 ? 'text-rose-700 font-semibold' : ''}>
              故障停机 {faultyDevices.length}
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('emergency_reserve')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">在借应急储备设备</span>
            <RotateCcw className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {borrowedEmergencyDevices.length}
          </div>
          <div className="mt-1 text-[11px] font-mono tabular-nums">
            {overdueLoanCount > 0 ? (
              <span className="text-rose-700 font-semibold">超期未还 {overdueLoanCount} 台 · 请办理归还</span>
            ) : (
              <span className="text-slate-500">生命支持周转正常</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">急救生命支持晨检</span>
            <CheckSquare className={`w-4 h-4 ${handoverCompletedToday ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className={`text-lg font-black ${handoverCompletedToday ? 'text-emerald-700' : 'text-amber-700'}`}>
              {handoverCompletedToday ? '今日已核验' : '待交接打卡'}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {lifeSupportDevices.length} 台在位
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">呼吸机/除颤仪/监护仪</span>
            {!handoverCompletedToday && (
              <button
                type="button"
                onClick={onCompleteHandoverCheck}
                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer whitespace-nowrap"
              >
                立即打卡 →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. 临床科室消息通知接收区 */}
      <RoleNoticeCenter
        currentUser={currentUser}
        departmentOptions={departmentOptions}
        onNavigateToTab={onNavigateToTab}
        titleOverride={`【${userDept || '临床科室'}】管理通知接收与回执确认台`}
        compact
      />

      {/* 3. 护士长核心双栏：左 7（在借应急归还 + 报修/待临床验收） / 右 5（晨检台 + 科室初审 + 强检预警） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* 左侧主操作区 (7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-3.5 min-h-0">
          {/* 3A: 在借应急生命支持设备池 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <RotateCcw className="w-4 h-4 text-cyan-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  【{userDept}】在借应急设备追踪与归还池
                </h3>
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  在用 {borrowedEmergencyDevices.length} 台
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('emergency_reserve')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>应急调配库</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-100 min-h-[220px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {borrowedEmergencyDevices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-700">当前未借用应急储备设备</p>
                  <p className="text-[11px] text-slate-400">临床急需生命支持机具时可一键向应急库申领</p>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab?.('emergency_reserve')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>申领应急备用机</span>
                  </button>
                </div>
              ) : (
                borrowedEmergencyDevices.map(({ device, loan, daysElapsed, isOverdue, isHalfwayPassed, daysRemaining, daysOverdue }) => (
                  <div key={device.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectDeviceDetail(device)}
                          className="text-xs font-bold text-slate-900 hover:text-blue-700 cursor-pointer truncate"
                        >
                          {device.name}
                        </button>
                        <span className="text-[11px] font-mono text-slate-500">{device.sn}</span>
                        {isOverdue ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-bold">
                            已超期 {daysOverdue} 天
                          </span>
                        ) : isHalfwayPassed ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] font-bold">
                            借期过半 · 余 {daysRemaining} 天
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10.5px] font-semibold">
                            余 {daysRemaining} 天
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        借用人: <span className="font-sans text-slate-700">{loan.borrowerName || currentUser?.name}</span> · 已借 {daysElapsed} 天 · 应还{' '}
                        {loan.expectedReturnTime?.split(' ')[0] || '待定'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onReturnEquipment?.(device)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>办理归还</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToApprovals
                            ? onNavigateToApprovals({
                                type: 'procurement_increase',
                                title: `【${userDept}】申购增配 ${device.name} 论证申请`,
                                targetEquipmentName: device.name,
                                targetModel: device.model,
                                applicantDepartment: userDept,
                                borrowingHistorySummary: `本科室借用 ${device.name} (${device.sn}) 已累计 ${daysElapsed} 天，建议常态化增配。`
                              })
                            : onNavigateToTab?.('approvals')
                        }
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>增配申请</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3B: 本科室维修协同与待临床验收 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  【{userDept}】维修进度与完工验收
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRepairTab('in_progress')}
                    className={`px-2 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                      repairTab === 'in_progress' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    实时报修 ({deptActiveOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairTab('acceptance')}
                    className={`px-2 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                      repairTab === 'acceptance' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    待验收 ({pendingAcceptanceOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairTab('faulty')}
                    className={`px-2 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                      repairTab === 'faulty' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    故障待修 ({faultyDevices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairTab('vendor')}
                    className={`px-2 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                      repairTab === 'vendor' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    外协零修 ({deptFrameworkItems.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenRepairModal()}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增报修</span>
                </button>
              </div>
            </div>

            <div className="mt-2 divide-y divide-slate-100 min-h-[260px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {repairTab === 'in_progress' ? (
                deptActiveOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700">当前科室无在办报修工单</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">草料扫码或系统手动发起报修后将实时同步至此</p>
                  </div>
                ) : (
                  deptActiveOrders.map(order => {
                    const statusText =
                      order.status === 'pending_dispatch'
                        ? '待调度派工'
                        : order.status === 'pre_dispatched'
                        ? `预派(${order.proposedEngineerName || '讨论中'})`
                        : order.status === 'repaired_pending_acceptance'
                        ? '已修复待验收'
                        : order.assignedEngineerName
                        ? `处置中(${order.assignedEngineerName})`
                        : '医工处置中';

                    return (
                      <div key={order.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">{order.equipmentName}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {order.caoliaoRecordNo ? `草料 ${order.caoliaoRecordNo}` : order.id}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-slate-400">{order.reportTime}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">
                            {order.faultDescription} · 报修人: {order.reporterName || '临床医护'} · {statusText}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
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
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            详情
                          </button>
                          {order.status === 'repaired_pending_acceptance' && (
                            <button
                              type="button"
                              onClick={() => onOpenClinicalAcceptance(order)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold cursor-pointer whitespace-nowrap"
                            >
                              签字验收
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              ) : repairTab === 'acceptance' ? (
                pendingAcceptanceOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700">当前暂无待临床验收签字的完工工单</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">工程师修复完毕提交后，将第一时间推送至此由护士长试机验收</p>
                  </div>
                ) : (
                  pendingAcceptanceOrders.map(order => (
                    <div key={order.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10.5px] font-bold">
                            修复待验收
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">{order.equipmentName}</span>
                          <span className="text-[11px] font-mono text-slate-500">{order.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">
                          维修工程师: {order.assignedEngineerName || '医工工程师'} · 处置措施: {order.solutionDescription || '故障已排查修复，自检正常'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenClinicalAcceptance(order)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>试机并签字验收</span>
                      </button>
                    </div>
                  ))
                )
              ) : repairTab === 'faulty' ? (
                faultyDevices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700">本科室在册设备运行良好，无停机待修器械</p>
                  </div>
                ) : (
                  faultyDevices.map(device => (
                    <div key={device.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onSelectDeviceDetail(device)}
                            className="text-xs font-bold text-slate-900 hover:text-blue-700 cursor-pointer truncate"
                          >
                            {device.name}
                          </button>
                          <span className="text-[11px] font-mono text-slate-500">{device.sn}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">
                          故障现象: {device.lastFaultReason || '运行告警，已上报医工等待调度'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenAiModal(device)}
                          className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Bot className="w-3.5 h-3.5 text-cyan-600" />
                          <span>应急排查</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenOfficialReport?.(device, device.lastFaultReason)}
                          className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>请示单</span>
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : deptFrameworkItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  暂无归集到【{userDept}】的外协零修项目
                </div>
              ) : (
                deptFrameworkItems.map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.itemName}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {item.workOrderNo || 'WO-外协'} · {item.serviceDate} · ¥{item.totalPrice} ·{' '}
                        <span className={item.clinicalReceiveStatus === 'SIGNED' ? 'text-emerald-700' : 'text-amber-700 font-semibold'}>
                          {item.clinicalReceiveStatus === 'SIGNED' ? '已电子签收' : '待科室验签'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectDeviceDetail(scopedEquipmentList[0])}
                      className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer whitespace-nowrap"
                    >
                      查看明细
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧辅助作业区 (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 min-h-0">
          {/* 3C: 晨间急救生命支持点检打卡台 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  晨间急救生命支持交接点检台
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                在位生命支持装备 <strong className="font-mono text-slate-900">{lifeSupportDevices.length}</strong> 台（呼吸机/除颤仪/监护仪）
              </p>
            </div>
            <button
              type="button"
              onClick={onCompleteHandoverCheck}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                handoverCompletedToday
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{handoverCompletedToday ? '已完成今日点检 ✓' : '完成晨间点检打卡'}</span>
            </button>
          </div>

          {/* 3D: 本科室审批流转 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  【{userDept}】审批流转待办
                </h3>
                {pendingDeptCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] font-bold">
                    待初审 {pendingDeptCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('approvals')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
              >
                <span>审批中心</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-100 min-h-[180px] max-h-[48vh] overflow-y-auto overscroll-contain pr-1">
              {deptApprovals.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">暂无流转中审批单据</div>
              ) : (
                deptApprovals.slice(0, 20).map(app => (
                  <div key={app.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{app.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {app.id} · {app.currentApprovalNode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('approvals')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                        app.status === 'pending_dept'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {app.status === 'pending_dept' ? '签批' : '进度'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3E: 本科室近60天强检定标与维保到期预警 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">近60天强检与维保预警</h3>
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  {upcomingPmAndCalibrations.length} 台
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('maintenance')}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
              >
                <span>计量计划</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-100 min-h-[200px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {upcomingPmAndCalibrations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  全部计量证书与预防性维护均在有效期内
                </div>
              ) : (
                upcomingPmAndCalibrations.slice(0, 25).map(eq => (
                  <div key={eq.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectDeviceDetail(eq)}
                        className="text-xs font-semibold text-slate-900 hover:text-blue-700 truncate cursor-pointer block text-left"
                      >
                        {eq.name}
                      </button>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        到期: {eq.nextCalibrationDate || eq.nextMaintenanceDate} · {eq.sn}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectDeviceDetail(eq)}
                      className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      档案
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

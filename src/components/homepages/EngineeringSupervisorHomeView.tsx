import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckSquare,
  Clock,
  FileCheck2,
  MessageSquare,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  Square,
  Users,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { WorkOrderStepBar } from '../WorkOrderStepBar';
import { MeaningfulExecutiveCharts } from '../MeaningfulExecutiveCharts';
import { DEFAULT_BIOMEDICAL_ENGINEERS } from '../../utils/dispatchData';

export const EngineeringSupervisorHomeView: React.FC<RoleHomepageCommonProps> = ({
  currentUser,
  userDept,
  allEquipmentList,
  equipmentList,
  departmentOptions,
  liveWorkOrders,
  borrowedEmergencyDevices,
  scheduleItems,
  onNavigateToTab,
  onNavigateToLedger,
  onOpenRepairModal,
  onSelectDeviceDetail,
  onOpenOfficialReport,
  onDirectDispatch,
  onOpenScheduleAdd,
  onToggleScheduleStatus,
  onOpenRepairDetail
}) => {
  const [searchKw, setSearchKw] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pre' | 'active'>('all');

  const pendingDispatchCount = useMemo(
    () => liveWorkOrders.filter(o => o.status === 'pending_dispatch').length,
    [liveWorkOrders]
  );
  const preDispatchCount = useMemo(
    () => liveWorkOrders.filter(o => o.status === 'pre_dispatched').length,
    [liveWorkOrders]
  );
  const activeRepairCount = useMemo(
    () =>
      liveWorkOrders.filter(o =>
        ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts', 'repaired_pending_acceptance'].includes(o.status)
      ).length,
    [liveWorkOrders]
  );

  const filteredOrders = useMemo(() => {
    let list = liveWorkOrders;
    if (statusFilter === 'pending') list = list.filter(o => o.status === 'pending_dispatch');
    else if (statusFilter === 'pre') list = list.filter(o => o.status === 'pre_dispatched');
    else if (statusFilter === 'active')
      list = list.filter(o => ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(o.status));

    if (searchKw.trim()) {
      const kw = searchKw.trim().toLowerCase();
      list = list.filter(
        o =>
          o.id?.toLowerCase().includes(kw) ||
          o.caoliaoRecordNo?.toLowerCase().includes(kw) ||
          o.equipmentName?.toLowerCase().includes(kw) ||
          o.department?.toLowerCase().includes(kw) ||
          o.reporterName?.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [liveWorkOrders, statusFilter, searchKw]);

  const pinnedOrder = useMemo(
    () =>
      liveWorkOrders.find(o => o.status !== 'closed' && (o.source === 'caoliao' || Boolean(o.caoliaoRecordNo))) ||
      liveWorkOrders.find(o => o.status !== 'closed') ||
      liveWorkOrders[0],
    [liveWorkOrders]
  );

  // 动态计算每位工程师在手派工负载
  const engineerWorkload = useMemo(() => {
    return DEFAULT_BIOMEDICAL_ENGINEERS.slice(0, 6).map(eng => {
      const activeCount = liveWorkOrders.filter(
        o => o.status !== 'closed' && (o.assignedEngineerName === eng.name || o.proposedEngineerName === eng.name)
      ).length;
      return {
        ...eng,
        activeCount
      };
    });
  }, [liveWorkOrders]);

  const upcomingSchedule = useMemo(() => {
    const today = '2026-08-17';
    return scheduleItems.filter(s => s.date >= today).slice(0, 20);
  }, [scheduleItems]);

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 医工主管/调度员专属 4 格核心 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => setStatusFilter('pending')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">待指派急修工单</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-rose-700">
            {pendingDispatchCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            点击聚焦待分配单据 · 15分钟SLA考核
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('pre')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">预派工内部讨论中</span>
            <MessageSquare className="w-4 h-4 text-violet-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-violet-700">
            {preDispatchCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            拟定人选核对工具备件 · 待签发正式派工
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('active')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">全院在途 / 现场抢修</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {activeRepairCount}
          </div>
          <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
            应急库在借 {borrowedEmergencyDevices.length} 台
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('dispatch')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">15 分钟响应 SLA 达成</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-emerald-700">
            96.4%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            前往完整调度大厅与工单打印 →
          </div>
        </div>
      </div>

      {/* 2. 管理科室统一消息下发与追踪中心 */}
      <RoleNoticeCenter
        currentUser={currentUser}
        departmentOptions={departmentOptions}
        onNavigateToTab={onNavigateToTab}
        titleOverride="医工管理通知统一下发与各科室签收追踪"
      />

      {/* 3. 核心调度枢纽：左 7（实时派工流水 + L12238置顶） / 右 5（工程师负载看板 + 医工值守排班） */}
      <div id="urgent-dispatch-section" className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-[560px]">
        {/* 左栏 (7/12)：全院现场派工调度流水 */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                全院现场派工调度与预派讨论流水
              </h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigateToTab?.('dispatch')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                调度大厅
              </button>
              <button
                type="button"
                onClick={() => onOpenOfficialReport?.()}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>请示单</span>
              </button>
            </div>
          </div>

          {/* 最新实时直报单追踪 */}
          {pinnedOrder && (
            <div className="mx-3 mt-3 p-3 rounded-lg bg-slate-900 text-white space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-300">
                      <QrCode className="w-3.5 h-3.5" />
                      {pinnedOrder.caoliaoRecordNo ? `最新直报单 ${pinnedOrder.caoliaoRecordNo}` : '最新临床报修工单'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-300">{pinnedOrder.id}</span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">{pinnedOrder.reportTime}</span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {pinnedOrder.equipmentName} · {pinnedOrder.department} · 报修人: {pinnedOrder.reporterName || '临床医护'}
                  </div>
                  <div className="text-[11px] text-amber-200">{pinnedOrder.faultDescription}</div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenRepairDetail({
                        id: pinnedOrder.id,
                        workOrderId: pinnedOrder.id,
                        recordNo: pinnedOrder.caoliaoRecordNo,
                        timestamp: pinnedOrder.reportTime,
                        equipmentId: pinnedOrder.equipmentId,
                        equipmentName: pinnedOrder.equipmentName,
                        equipmentSn: pinnedOrder.equipmentSn,
                        department: pinnedOrder.department,
                        reporterName: pinnedOrder.reporterName,
                        reporterPhone: pinnedOrder.reporterPhone,
                        faultDescription: pinnedOrder.faultDescription,
                        photoUrl: pinnedOrder.photoUrl,
                        urgency: pinnedOrder.priority === 'P1_CRITICAL' ? 'P1' : 'P2',
                        source: pinnedOrder.source || 'caoliao'
                      })
                    }
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    单据详情
                  </button>
                  <button
                    type="button"
                    onClick={() => onDirectDispatch?.(pinnedOrder)}
                    className="px-3 py-1 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    {pinnedOrder.status === 'pre_dispatched' ? '讨论 / 正式派工' : '预派 / 派工'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-md px-2.5 py-1.5 text-slate-800">
                <WorkOrderStepBar
                  status={pinnedOrder.status}
                  size="sm"
                  showSubStatus
                  proposedEngineerName={pinnedOrder.proposedEngineerName}
                  assignedEngineerName={pinnedOrder.assignedEngineerName}
                  discussionCount={pinnedOrder.internalDiscussions?.length || 0}
                />
              </div>
            </div>
          )}

          {/* 过滤条 */}
          <div className="px-3 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
              {[
                { id: 'all', label: `全部 (${liveWorkOrders.length})` },
                { id: 'pending', label: `待指派 (${pendingDispatchCount})` },
                { id: 'pre', label: `预派讨论 (${preDispatchCount})` },
                { id: 'active', label: `维修中 (${activeRepairCount})` }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id as any)}
                  className={`px-2 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                    statusFilter === t.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKw}
                onChange={e => setSearchKw(e.target.value)}
                placeholder="检索单号 / 设备 / 科室..."
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 流水清单 */}
          <div className="p-3 space-y-2.5 flex-1 min-h-[420px] max-h-[60vh] overflow-y-auto overscroll-contain">
            {filteredOrders.map(order => (
              <div key={order.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 space-y-2 transition">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">{order.id}</span>
                      <span className="text-xs font-bold text-slate-900">{order.equipmentName}</span>
                      <span className="text-[11px] text-slate-500">· {order.department}</span>
                      {order.caoliaoRecordNo && (
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          草料 {order.caoliaoRecordNo}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">{order.faultDescription}</div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      报修: {order.reporterName} · {order.reportTime} · {order.biomedicalGroup}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDirectDispatch?.(order)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {order.status === 'pending_dispatch'
                      ? '预派 / 派工'
                      : order.status === 'pre_dispatched'
                      ? '讨论 / 正式派工'
                      : '查看流转'}
                  </button>
                </div>

                <div className="bg-slate-50 rounded px-2 py-1 border border-slate-100">
                  <WorkOrderStepBar
                    status={order.status}
                    size="sm"
                    showSubStatus
                    proposedEngineerName={order.proposedEngineerName}
                    assignedEngineerName={order.assignedEngineerName}
                    discussionCount={order.internalDiscussions?.length || 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右栏 (5/12)：工程师负荷监控 + 医工值守排班 */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 min-h-0">
          {/* 3B: 医工工程师负荷实时看板 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">工程技术小组实时派工负荷</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('dispatch')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer whitespace-nowrap"
              >
                小组调配
              </button>
            </div>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {engineerWorkload.map(eng => (
                <div key={eng.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{eng.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{eng.group}</div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className={`font-bold ${eng.activeCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      在修 {eng.activeCount + eng.currentWOCount} 单
                    </div>
                    <div className="text-[10.5px] text-slate-400">MTTR {eng.avgMttrHours}h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3C: 医工值守与强检巡检日程 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">医工值守与巡检计划日程</h3>
              </div>
              <button
                type="button"
                onClick={onOpenScheduleAdd}
                className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>新建排班</span>
              </button>
            </div>
            <div className="mt-2 divide-y divide-slate-100 min-h-[260px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {upcomingSchedule.map(task => {
                const done = task.status === 'completed';
                return (
                  <div key={task.id} className="py-2 flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleScheduleStatus(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                    >
                      {done ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-semibold ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {task.date} {task.timeRange} · <span className="font-sans">{task.assignedStaff}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 全院质控红线态势图表 */}
      <MeaningfulExecutiveCharts
        equipmentList={allEquipmentList || equipmentList}
        userDept={userDept}
        isDeptView={false}
        onNavigateToLedger={onNavigateToLedger}
        onNavigateToTab={onNavigateToTab}
        onSelectDeviceDetail={onSelectDeviceDetail}
        onOpenRepairModal={onOpenRepairModal}
      />
    </div>
  );
};

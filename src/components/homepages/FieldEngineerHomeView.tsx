import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  QrCode,
  Search,
  Square,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { WorkOrderStepBar } from '../WorkOrderStepBar';
import { loadStoredSpareParts } from '../../utils/sparePartsData';
import { DEFAULT_BIOMEDICAL_ENGINEERS } from '../../utils/dispatchData';

export const FieldEngineerHomeView: React.FC<RoleHomepageCommonProps> = ({
  currentUser,
  departmentOptions,
  liveWorkOrders,
  scheduleItems,
  onNavigateToTab,
  onSelectDeviceDetail,
  equipmentList,
  onDirectDispatch,
  onOpenFieldOperation,
  onOpenScheduleAdd,
  onToggleScheduleStatus,
  onOpenRepairDetail
}) => {
  const [orderTab, setOrderTab] = useState<'my_tasks' | 'pre_discuss' | 'all_open'>('my_tasks');
  const [hasPickedTab, setHasPickedTab] = useState(false);
  const [searchKw, setSearchKw] = useState('');

  const engineerName = (currentUser?.name || '').trim();
  const myProfile = useMemo(
    () =>
      DEFAULT_BIOMEDICAL_ENGINEERS.find(
        e => e.name === engineerName || e.employeeNo === currentUser?.employeeNo
      ),
    [engineerName, currentUser?.employeeNo]
  );

  // 指派给我的或处于接单/施工中的工单
  const myAssignedOrders = useMemo(() => {
    return liveWorkOrders.filter(o => {
      if (o.status === 'closed') return false;
      const isMine =
        (o.assignedEngineerName && engineerName && o.assignedEngineerName.includes(engineerName)) ||
        (o.proposedEngineerName && engineerName && o.proposedEngineerName.includes(engineerName));
      const isFieldActive = ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts', 'repaired_pending_acceptance'].includes(o.status);
      return isMine || (orderTab === 'my_tasks' && isFieldActive);
    });
  }, [liveWorkOrders, engineerName, orderTab]);

  // 预派工 & 待派讨论单
  const preDiscussOrders = useMemo(
    () => liveWorkOrders.filter(o => o.status === 'pre_dispatched' || o.status === 'pending_dispatch'),
    [liveWorkOrders]
  );

  const openHospitalOrders = useMemo(
    () => liveWorkOrders.filter(o => o.status !== 'closed'),
    [liveWorkOrders]
  );

  // 若本人名下暂无在手单但全院存在待抢修工单，未手动切换前自动展示全院待修池，防止新报修（如 L12252）被隐藏
  const effectiveTab: 'my_tasks' | 'pre_discuss' | 'all_open' =
    !hasPickedTab && orderTab === 'my_tasks' && myAssignedOrders.length === 0 && openHospitalOrders.length > 0
      ? 'all_open'
      : orderTab;

  const displayedOrders = useMemo(() => {
    let base =
      effectiveTab === 'my_tasks'
        ? myAssignedOrders
        : effectiveTab === 'pre_discuss'
        ? preDiscussOrders
        : openHospitalOrders;

    if (searchKw.trim()) {
      const kw = searchKw.trim().toLowerCase();
      base = base.filter(
        o =>
          o.id?.toLowerCase().includes(kw) ||
          o.caoliaoRecordNo?.toLowerCase().includes(kw) ||
          o.equipmentName?.toLowerCase().includes(kw) ||
          o.department?.toLowerCase().includes(kw) ||
          o.faultDescription?.toLowerCase().includes(kw)
      );
    }
    return base;
  }, [effectiveTab, myAssignedOrders, preDiscussOrders, openHospitalOrders, searchKw]);

  // 备件安全库存警戒
  const spareParts = useMemo(() => {
    const list = loadStoredSpareParts();
    return {
      total: list.length,
      lowStock: list.filter(p => p.currentStock <= p.minSafeStock),
      topList: list.slice(0, 6)
    };
  }, []);

  // 我的日程
  const mySchedule = useMemo(() => {
    const today = '2026-08-17';
    return scheduleItems.filter(s => s.date >= today).slice(0, 8);
  }, [scheduleItems]);

  const waitingAcceptCount = liveWorkOrders.filter(o => o.status === 'dispatched').length;
  const repairingCount = liveWorkOrders.filter(o => ['accepted', 'arrived_inspecting', 'waiting_parts'].includes(o.status)).length;
  const preCount = liveWorkOrders.filter(o => o.status === 'pre_dispatched').length;

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 维修工程师专属 4 格作业 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => {
            setHasPickedTab(true);
            setOrderTab(myAssignedOrders.length > 0 ? 'my_tasks' : 'all_open');
          }}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">待我接单 / 全院待修</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {waitingAcceptCount + repairingCount > 0 ? waitingAcceptCount + repairingCount : openHospitalOrders.length}
          </div>
          <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
            待接单 {waitingAcceptCount} · 全院待修 {openHospitalOrders.length}
          </div>
        </div>

        <div
          onClick={() => {
            setHasPickedTab(true);
            setOrderTab('pre_discuss');
          }}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">拟定预派与技术讨论</span>
            <MessageSquare className="w-4 h-4 text-violet-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {preCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            拟定方案核对 · 备件提前预判
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('parts_inventory')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">备件安全库存警戒</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {spareParts.lowStock.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            低库存预警 / 共 {spareParts.total} 类备件
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">个人本月完修与 MTTR</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-emerald-700">
            {myProfile ? `${myProfile.monthClosedCount} 单` : '24 单'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            平均修复 {myProfile?.avgMttrHours || 1.5}h · 一次修复率 {myProfile?.firstTimeFixRate || 92}%
          </div>
        </div>
      </div>

      {/* 2. 工程指令与技术交底接收区 */}
      <RoleNoticeCenter
        currentUser={currentUser}
        departmentOptions={departmentOptions}
        onNavigateToTab={onNavigateToTab}
        titleOverride="工程技术交底与调度指令接收区"
        compact
      />

      {/* 3. 工程师个人接单作业台 (左 8 / 右 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* 左栏 (8/12)：我的接单与现场作业队列 */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                我的现场接单与技术协同作业台
              </h3>
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setHasPickedTab(true);
                    setOrderTab('my_tasks');
                  }}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                    effectiveTab === 'my_tasks' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  我的在修/待接 ({myAssignedOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasPickedTab(true);
                    setOrderTab('pre_discuss');
                  }}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                    effectiveTab === 'pre_discuss' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  预派讨论区 ({preDiscussOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasPickedTab(true);
                    setOrderTab('all_open');
                  }}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                    effectiveTab === 'all_open' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  全院待修池 ({openHospitalOrders.length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKw}
                onChange={e => setSearchKw(e.target.value)}
                placeholder="搜工单号 / 草料单号 / 设备"
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-3 space-y-2.5 min-h-[380px] max-h-[60vh] overflow-y-auto overscroll-contain">
            {displayedOrders.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-700">当前队列下暂无待处置维修工单</p>
                <p className="text-[11px] text-slate-400">可切换至「预派讨论区」协助调度主管确认工具与备件准备</p>
              </div>
            ) : (
              displayedOrders.map(order => {
                const isPreOrPending = order.status === 'pre_dispatched' || order.status === 'pending_dispatch';
                const isWaitingParts = order.status === 'waiting_parts';
                const isPendingAccept = order.status === 'repaired_pending_acceptance';

                return (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white space-y-2 transition"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold border ${
                              order.priority === 'P1_CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {order.priority === 'P1_CRITICAL' ? 'P1 急修' : 'P2 优先'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900">{order.id}</span>
                          {order.caoliaoRecordNo && (
                            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              {order.caoliaoRecordNo}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900">{order.equipmentName}</span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          <span className="font-sans text-slate-700 font-medium">{order.department}</span> · 报修人:{' '}
                          <span className="font-sans">{order.reporterName}</span> · {order.reportTime}
                          {order.assignedEngineerName && (
                            <>
                              {' '}
                              · <span className="font-sans text-blue-700 font-semibold">责任工: {order.assignedEngineerName}</span>
                            </>
                          )}
                          {!order.assignedEngineerName && order.proposedEngineerName && (
                            <>
                              {' '}
                              · <span className="font-sans text-violet-700 font-semibold">拟定: {order.proposedEngineerName}</span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                          {order.faultDescription}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const matched = equipmentList.find(e => e.id === order.equipmentId || e.sn === order.equipmentSn);
                            if (matched) {
                              onSelectDeviceDetail(matched);
                            } else {
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
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          详情档案
                        </button>

                        {isPreOrPending ? (
                          <button
                            type="button"
                            onClick={() => onDirectDispatch?.(order)}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>参与派前讨论</span>
                          </button>
                        ) : isPendingAccept ? (
                          <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold whitespace-nowrap">
                            已完工 · 待临床验收
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenFieldOperation(order)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{order.status === 'dispatched' ? '立即接单并开工' : isWaitingParts ? '备件到库复工' : '现场处置 / 完工'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/70 rounded-lg px-2 py-1.5 border border-slate-100">
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
                );
              })
            )}
          </div>
        </div>

        {/* 右栏 (4/12)：我的日程 + 备件快查 */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 min-h-0">
          {/* 3B: 今日工程巡检与维保日程 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">个人巡检与强检协助日程</h3>
              </div>
              <button
                type="button"
                onClick={onOpenScheduleAdd}
                className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>新建</span>
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-100 min-h-[220px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {mySchedule.map(task => {
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
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums flex items-center gap-1.5">
                        <span>{task.timeRange}</span>
                        <span>·</span>
                        <span className="font-sans truncate inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {task.location}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3C: 常用应急备件库快查与领用 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">备品备件库存速查</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('parts_inventory')}
                className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
              >
                <span>备件库领用</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-100 min-h-[220px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {spareParts.topList.map(part => {
                const isLow = part.currentStock <= part.minSafeStock;
                return (
                  <div key={part.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{part.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {part.partNo} · {part.warehouseLocation}
                      </div>
                    </div>
                    <span
                      className={`font-mono tabular-nums text-xs font-bold shrink-0 ${
                        isLow ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {part.currentStock} {part.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

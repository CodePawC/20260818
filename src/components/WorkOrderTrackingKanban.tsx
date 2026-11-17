import React, { useState } from 'react';
import {
  EngineeringWorkOrder,
  BiomedicalEngineerProfile
} from '../types/dispatchTypes';
import {
  WorkOrderStepBar,
  WORK_ORDER_FLOW_STEPS,
  getWorkOrderFlowStage,
  FlowStage
} from './WorkOrderStepBar';
import {
  Wrench,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  FileText,
  Printer,
  Search,
  Eye,
  Layers,
  Sparkles,
  Check,
  HelpCircle,
  MessageSquare,
  QrCode,
  Building2
} from 'lucide-react';

interface WorkOrderTrackingKanbanProps {
  workOrders: EngineeringWorkOrder[];
  onAssignEngineer: (order: EngineeringWorkOrder) => void;
  onFieldOperation: (order: EngineeringWorkOrder) => void;
  onClinicalAcceptance: (order: EngineeringWorkOrder) => void;
  onViewTracking: (order: EngineeringWorkOrder) => void;
  onPrint: (order: EngineeringWorkOrder) => void;
  canDispatch?: boolean;
  canDiscuss?: boolean;
  canFieldOp?: boolean;
  canAccept?: boolean;
}

export const WorkOrderTrackingKanban: React.FC<WorkOrderTrackingKanbanProps> = ({
  workOrders,
  onAssignEngineer,
  onFieldOperation,
  onClinicalAcceptance,
  onViewTracking,
  onPrint,
  canDispatch = true,
  canDiscuss = true,
  canFieldOp = true,
  canAccept = true
}) => {
  // Active stage filter (optional, default 'all')
  const [activeStageFilter, setActiveStageFilter] = useState<FlowStage | 'all'>('all');

  // Group work orders into the 5 stages
  const pendingDispatchOrders = workOrders.filter(o => o.status === 'pending_dispatch');
  const preDispatchedOrders = workOrders.filter(o => o.status === 'pre_dispatched');
  const inRepairOrders = workOrders.filter(o =>
    ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(o.status)
  );
  const pendingAcceptanceOrders = workOrders.filter(
    o => o.status === 'repaired_pending_acceptance'
  );
  const completedOrders = workOrders.filter(o => o.status === 'closed');

  const columns: {
    id: FlowStage;
    stepNumber: number;
    title: string;
    subTitle: string;
    orders: EngineeringWorkOrder[];
    badgeBg: string;
    headerColor: string;
    borderTopColor: string;
    hint: string;
  }[] = [
    {
      id: 'pending_dispatch',
      stepNumber: 1,
      title: '待分配',
      subTitle: '调度室待拟定',
      orders: pendingDispatchOrders,
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      headerColor: 'text-rose-900 bg-rose-50/70 border-rose-200',
      borderTopColor: 'border-t-rose-500',
      hint: '临床报修已提交，等待拟定工程师'
    },
    {
      id: 'pre_dispatched',
      stepNumber: 2,
      title: '预派工/拟定',
      subTitle: '内部讨论确认中',
      orders: preDispatchedOrders,
      badgeBg: 'bg-violet-100 text-violet-800 border-violet-200',
      headerColor: 'text-violet-900 bg-violet-50/70 border-violet-200',
      borderTopColor: 'border-t-violet-500',
      hint: '已拟定人选，内部讨论无误后正式派发'
    },
    {
      id: 'in_repair',
      stepNumber: 3,
      title: '维修中',
      subTitle: '正式派工/现场排查',
      orders: inRepairOrders,
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      headerColor: 'text-blue-900 bg-blue-50/70 border-blue-200',
      borderTopColor: 'border-t-blue-500',
      hint: '包含正式派工在途、现场排查与待配件'
    },
    {
      id: 'pending_acceptance',
      stepNumber: 4,
      title: '待验收',
      subTitle: '完工自检/临床试机',
      orders: pendingAcceptanceOrders,
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      headerColor: 'text-cyan-900 bg-cyan-50/70 border-cyan-200',
      borderTopColor: 'border-t-cyan-500',
      hint: '设备已修好，等待临床试机签字'
    },
    {
      id: 'completed',
      stepNumber: 5,
      title: '已完成',
      subTitle: '验收合格/评价闭环',
      orders: completedOrders,
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      headerColor: 'text-emerald-900 bg-emerald-50/70 border-emerald-200',
      borderTopColor: 'border-t-emerald-500',
      hint: '临床评价通过，设备恢复正常运行'
    }
  ];

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden space-y-2.5">
      {/* Slim Horizontal Pipeline Header */}
      <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-2xs shrink-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-900">工单5阶段流转横向闭环看板</h2>
            <span className="text-2xs text-slate-400 font-mono">
              (共 {workOrders.length} 单)
            </span>
          </div>
        </div>

        {/* Quick stage toggle pills */}
        <div className="flex items-center gap-1 text-2xs flex-wrap">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeStageFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部 5 列
          </button>
          {columns.map(col => {
            const isSelected = activeStageFilter === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setActiveStageFilter(isSelected ? 'all' : col.id)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? col.id === 'pre_dispatched'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : col.id === 'pre_dispatched' && col.orders.length > 0
                    ? 'bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{col.stepNumber}. {col.title}</span>
                <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                }`}>
                  {col.orders.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5-Column Real-Time Kanban Board - CSS Grid with Independent Scrollbars */}
      <div className={`flex-1 min-h-0 grid gap-2.5 items-stretch overflow-x-auto overflow-y-hidden ${
        activeStageFilter === 'all'
          ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
          : 'grid-cols-1'
      }`}>
        {columns
          .filter(col => activeStageFilter === 'all' || activeStageFilter === col.id)
          .map(column => (
            <div
              key={column.id}
              className={`bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col h-full min-h-0 shadow-2xs border-t-4 overflow-hidden ${column.borderTopColor}`}
            >
              {/* Column Header */}
              <div className={`p-2.5 border-b flex items-center justify-between shrink-0 ${column.headerColor}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-white text-slate-800 text-2xs font-mono font-bold flex items-center justify-center shadow-2xs border border-slate-200 shrink-0">
                    {column.stepNumber}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold flex items-center gap-1 truncate">
                      <span className="truncate">{column.title}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-2xs font-mono font-bold border ${column.badgeBg}`}>
                        {column.orders.length}
                      </span>
                    </h3>
                  </div>
                </div>

                <span className="text-[10.5px] text-slate-500 font-medium shrink-0">
                  {column.id === 'pending_dispatch' && '待拟定'}
                  {column.id === 'pre_dispatched' && '讨论确认'}
                  {column.id === 'in_repair' && '执行中'}
                  {column.id === 'pending_acceptance' && '待试机'}
                  {column.id === 'completed' && '已闭环'}
                </span>
              </div>

              {/* Column Hint / Guidance Banner */}
              <div className="px-2.5 py-1 bg-white/70 border-b border-slate-200/60 text-2xs text-slate-500 flex items-center gap-1 shrink-0">
                <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{column.hint}</span>
              </div>

              {/* Column Cards Container - Independent Internal Scrollbar */}
              <div className="p-2 flex-1 min-h-0 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {column.orders.length === 0 ? (
                  <div className="p-6 text-center bg-white/80 rounded-xl border border-dashed border-slate-200 text-slate-400 my-3">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs">暂无【{column.title}】工单</p>
                  </div>
                ) : (
                  column.orders.map(order => {
                    const isP1 = order.priority === 'P1_CRITICAL';
                    const isP2 = order.priority === 'P2_URGENT';
                    const discussionCount = order.internalDiscussions?.length || 0;

                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-lg border p-2.5 transition-all duration-150 shadow-2xs hover:shadow-md space-y-1.5 ${
                          order.status === 'pre_dispatched'
                            ? 'border-violet-300 ring-1 ring-violet-300/60 bg-violet-50/10'
                            : isP1
                            ? 'border-rose-300 ring-1 ring-rose-300/60'
                            : isP2
                            ? 'border-amber-300 ring-1 ring-amber-300/40'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Row 1: Priority + ID + Dept + Action icons */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 truncate">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono shrink-0 ${
                                isP1
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : isP2
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {order.priority.slice(0, 2)}
                            </span>
                            <span className="font-mono text-2xs font-bold text-slate-700 shrink-0">
                              {order.id}
                            </span>
                            {(order.source === 'caoliao' || order.id.startsWith('WO-CL-')) && (
                              <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-0.5" title="草料微信扫码报修">
                                <QrCode className="w-2.5 h-2.5" />
                                <span>草料</span>
                              </span>
                            )}
                            {(order.dispatchChannel === 'outsourced' || order.externalPartner) && (
                              <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-0.5" title={`外协: ${order.externalPartner}`}>
                                <Building2 className="w-2.5 h-2.5" />
                                <span>外协</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onViewTracking(order)}
                              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="时间轴追踪"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onPrint(order)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="打印工单"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Equipment Name (bold) + Dept */}
                        <div className="space-y-0.5">
                          <h4
                            onClick={() => onViewTracking(order)}
                            className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition cursor-pointer"
                            title={order.equipmentName}
                          >
                            {order.equipmentName}
                          </h4>
                          <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                            <span className="truncate">{order.department}</span>
                            <span className="font-mono text-slate-400 shrink-0">{order.internalNo || order.equipmentSn}</span>
                          </div>
                        </div>

                        {/* Row 3: Fault summary */}
                        <p className="text-2xs text-slate-600 line-clamp-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100/80">
                          {order.faultDescription}
                        </p>

                        {/* Row 4: Status / Engineer + Discussion + Action button */}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1 text-2xs">
                          <div className="flex items-center gap-1 text-slate-500 truncate">
                            {order.dispatchChannel === 'outsourced' && order.externalPartner ? (
                              <span className="text-amber-800 font-semibold truncate flex items-center gap-0.5" title={order.externalPartner}>
                                <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                                {order.externalVendorShortName || order.externalPartner}
                              </span>
                            ) : order.assignedEngineerName ? (
                              <span className="text-indigo-700 font-semibold truncate flex items-center gap-0.5">
                                <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                                {order.assignedEngineerName}
                              </span>
                            ) : order.status === 'pre_dispatched' && order.proposedEngineerName ? (
                              <span className="text-violet-700 font-bold truncate flex items-center gap-0.5">
                                <UserCheck className="w-3 h-3 text-violet-500 shrink-0" />
                                拟定: {order.proposedEngineerName}
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                                待拟定
                              </span>
                            )}
                            {discussionCount > 0 && (
                              <span className="px-1 py-0.2 rounded bg-violet-50 text-violet-700 border border-violet-200 font-mono text-[10px] flex items-center gap-0.5 shrink-0" title="内部讨论记录">
                                <MessageSquare className="w-2.5 h-2.5" />
                                {discussionCount}
                              </span>
                            )}
                          </div>

                          {/* Stage action button */}
                          {order.status === 'pending_dispatch' && (canDispatch || canDiscuss) && (
                            <button
                              onClick={() => onAssignEngineer(order)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-2xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                            >
                              {canDispatch ? <UserCheck className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                              <span>{canDispatch ? '预派/指派' : '讨论'}</span>
                            </button>
                          )}
                          {order.status === 'pre_dispatched' && (canDispatch || canDiscuss) && (
                            <button
                              onClick={() => onAssignEngineer(order)}
                              className="px-2 py-0.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-2xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{canDispatch ? '讨论/确认' : '技术讨论'}</span>
                            </button>
                          )}
                          {['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(order.status) && canFieldOp && (
                            <button
                              onClick={() => onFieldOperation(order)}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>现场</span>
                            </button>
                          )}
                          {order.status === 'repaired_pending_acceptance' && canAccept && (
                            <button
                              onClick={() => onClinicalAcceptance(order)}
                              className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-2xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>验收</span>
                            </button>
                          )}
                          {order.status === 'closed' && (
                            <button
                              onClick={() => onViewTracking(order)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-2xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <FileText className="w-3 h-3" />
                              <span>归档</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

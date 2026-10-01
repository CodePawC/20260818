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
  HelpCircle
} from 'lucide-react';

interface WorkOrderTrackingKanbanProps {
  workOrders: EngineeringWorkOrder[];
  onAssignEngineer: (order: EngineeringWorkOrder) => void;
  onFieldOperation: (order: EngineeringWorkOrder) => void;
  onClinicalAcceptance: (order: EngineeringWorkOrder) => void;
  onViewTracking: (order: EngineeringWorkOrder) => void;
  onPrint: (order: EngineeringWorkOrder) => void;
}

export const WorkOrderTrackingKanban: React.FC<WorkOrderTrackingKanbanProps> = ({
  workOrders,
  onAssignEngineer,
  onFieldOperation,
  onClinicalAcceptance,
  onViewTracking,
  onPrint
}) => {
  // Active stage filter (optional, default 'all')
  const [activeStageFilter, setActiveStageFilter] = useState<FlowStage | 'all'>('all');

  // Group work orders into the 4 stages
  const pendingDispatchOrders = workOrders.filter(o => o.status === 'pending_dispatch');
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
      subTitle: '调度室指派工程师',
      orders: pendingDispatchOrders,
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      headerColor: 'text-rose-900 bg-rose-50/70 border-rose-200',
      borderTopColor: 'border-t-rose-500',
      hint: '临床报修已提交，等待调度分配'
    },
    {
      id: 'in_repair',
      stepNumber: 2,
      title: '维修中',
      subTitle: '接单/现场排查/配件领用',
      orders: inRepairOrders,
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      headerColor: 'text-blue-900 bg-blue-50/70 border-blue-200',
      borderTopColor: 'border-t-blue-500',
      hint: '包含派单在途、现场排查与待配件'
    },
    {
      id: 'pending_acceptance',
      stepNumber: 3,
      title: '待验收',
      subTitle: '完工自检/临床科室试机',
      orders: pendingAcceptanceOrders,
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      headerColor: 'text-cyan-900 bg-cyan-50/70 border-cyan-200',
      borderTopColor: 'border-t-cyan-500',
      hint: '设备已修好，等待临床试机签字'
    },
    {
      id: 'completed',
      stepNumber: 4,
      title: '已完成',
      subTitle: '验收合格/五星评价闭环',
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
            <h2 className="text-xs font-bold text-slate-900">工单状态流转横向闭环看板</h2>
            <span className="text-2xs text-slate-400 font-mono">
              (共 {workOrders.length} 单)
            </span>
          </div>
        </div>

        {/* Quick stage toggle pills */}
        <div className="flex items-center gap-1 text-2xs">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeStageFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部 4 列
          </button>
          {columns.map(col => {
            const isSelected = activeStageFilter === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setActiveStageFilter(isSelected ? 'all' : col.id)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
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

      {/* 4-Column Real-Time Kanban Board - CSS Grid with Independent Scrollbars */}
      <div className={`flex-1 min-h-0 grid gap-3 items-stretch overflow-hidden ${
        activeStageFilter === 'all'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
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
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-slate-800 text-2xs font-mono font-bold flex items-center justify-center shadow-2xs border border-slate-200">
                    {column.stepNumber}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold flex items-center gap-1.5">
                      <span>{column.title}</span>
                      <span className={`px-2 py-0.2 rounded-full text-2xs font-mono font-bold border ${column.badgeBg}`}>
                        {column.orders.length}
                      </span>
                    </h3>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  {column.id === 'pending_dispatch' && '待调度指派'}
                  {column.id === 'in_repair' && '工程师执行中'}
                  {column.id === 'pending_acceptance' && '等待临床试机'}
                  {column.id === 'completed' && '已闭环已评价'}
                </span>
              </div>

              {/* Column Hint / Guidance Banner */}
              <div className="px-3 py-1 bg-white/70 border-b border-slate-200/60 text-2xs text-slate-500 flex items-center gap-1 shrink-0">
                <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{column.hint}</span>
              </div>

              {/* Column Cards Container - Independent Internal Scrollbar */}
              <div className="p-2.5 flex-1 min-h-0 space-y-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {column.orders.length === 0 ? (
                  <div className="p-8 text-center bg-white/80 rounded-xl border border-dashed border-slate-200 text-slate-400 my-4">
                    <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs">暂无【{column.title}】工单</p>
                  </div>
                ) : (
                  column.orders.map(order => {
                    const isP1 = order.priority === 'P1_CRITICAL';
                    const isP2 = order.priority === 'P2_URGENT';

                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-lg border p-2.5 transition-all duration-150 shadow-2xs hover:shadow-md space-y-1.5 ${
                          isP1
                            ? 'border-rose-300 ring-1 ring-rose-300/60'
                            : isP2
                            ? 'border-amber-300 ring-1 ring-amber-300/40'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Row 1: Priority + ID + Dept + Action icons */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
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
                            <span className="text-slate-300 text-2xs">·</span>
                            <span className="text-2xs font-medium text-slate-600 truncate">
                              {order.department}
                            </span>
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

                        {/* Row 2: Equipment Name (bold) + Internal/SN */}
                        <div className="flex items-baseline justify-between gap-1">
                          <h4
                            onClick={() => onViewTracking(order)}
                            className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition cursor-pointer"
                            title={order.equipmentName}
                          >
                            {order.equipmentName}
                          </h4>
                          <span className="text-2xs font-mono text-slate-400 shrink-0">
                            {order.internalNo || order.equipmentSn}
                          </span>
                        </div>

                        {/* Row 3: Fault summary */}
                        <p className="text-2xs text-slate-600 line-clamp-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100/80">
                          {order.faultDescription}
                        </p>

                        {/* Row 4: Status / SLA / Engineer + Action button */}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1 text-2xs">
                          <div className="flex items-center gap-1.5 text-slate-500 truncate">
                            {order.assignedEngineerName ? (
                              <span className="text-indigo-700 font-semibold truncate flex items-center gap-0.5">
                                <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                                {order.assignedEngineerName}
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                                待指派
                              </span>
                            )}
                            <span className="text-slate-300">|</span>
                            <span className="font-mono text-slate-600 shrink-0">{order.totalDowntimeHours}h</span>
                          </div>

                          {/* Stage action button */}
                          {order.status === 'pending_dispatch' && (
                            <button
                              onClick={() => onAssignEngineer(order)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-2xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>指派</span>
                            </button>
                          )}
                          {['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(order.status) && (
                            <button
                              onClick={() => onFieldOperation(order)}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>现场</span>
                            </button>
                          )}
                          {order.status === 'repaired_pending_acceptance' && (
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

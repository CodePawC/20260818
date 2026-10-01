import React, { useState, useMemo, useEffect } from 'react';
import { MedicalEquipment, AuthUser } from '../types';
import {
  EngineeringWorkOrder,
  BiomedicalEngineerProfile,
  PriorityLevel,
  WorkOrderStatus,
  BiomedicalGroup,
  MttrKpiStats
} from '../types/dispatchTypes';
import {
  DEFAULT_BIOMEDICAL_ENGINEERS,
  loadStoredWorkOrders,
  saveStoredWorkOrders,
  calculateMttrKpiStats,
  INITIAL_WORK_ORDERS
} from '../utils/dispatchData';
import { DispatchAssignModal } from './DispatchAssignModal';
import { FieldOperationModal } from './FieldOperationModal';
import { ClinicalAcceptanceModal } from './ClinicalAcceptanceModal';
import { WorkOrderPrintModal } from './WorkOrderPrintModal';
import { CreateWorkOrderModal } from './CreateWorkOrderModal';
import { WorkOrderStepBar } from './WorkOrderStepBar';
import { WorkOrderTrackingKanban } from './WorkOrderTrackingKanban';
import { WorkOrderTrackingModal } from './WorkOrderTrackingModal';
import {
  Wrench,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Search,
  Filter,
  UserCheck,
  Printer,
  Sparkles,
  Phone,
  BarChart3,
  Users,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  RefreshCw,
  FileText,
  Building,
  TrendingDown,
  TrendingUp,
  MapPin,
  ChevronRight,
  Package,
  Eye,
  X,
  Flame,
  Tag,
  SlidersHorizontal
} from 'lucide-react';
import { SparePartsWarehouseView } from './SparePartsWarehouseView';
import { Pagination } from './Pagination';

interface DispatchWorkOrderViewProps {
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser;
  onEquipmentUpdated?: (updatedEquipment: MedicalEquipment) => void;
}

export const DispatchWorkOrderView: React.FC<DispatchWorkOrderViewProps> = ({
  equipmentList,
  currentUser,
  onEquipmentUpdated
}) => {
  // Master state
  const [workOrders, setWorkOrders] = useState<EngineeringWorkOrder[]>(() => {
    return loadStoredWorkOrders();
  });
  const [engineers, setEngineers] = useState<BiomedicalEngineerProfile[]>(
    DEFAULT_BIOMEDICAL_ENGINEERS
  );

  // Sync state to local storage
  useEffect(() => {
    saveStoredWorkOrders(workOrders);
  }, [workOrders]);

  // Recalculate engineers workload dynamically based on current workOrders
  const liveEngineers = useMemo(() => {
    return engineers.map(eng => {
      const activeOrders = workOrders.filter(
        o => o.assignedEngineerId === eng.id && !['closed', 'cancelled'].includes(o.status)
      );
      const closedOrders = workOrders.filter(
        o => o.assignedEngineerId === eng.id && o.status === 'closed'
      );
      const mttrTotal = closedOrders.reduce((sum, o) => sum + (o.totalDowntimeHours || 0), 0);
      const avgMttr = closedOrders.length > 0 ? Number((mttrTotal / closedOrders.length).toFixed(2)) : eng.avgMttrHours;

      return {
        ...eng,
        currentWOCount: activeOrders.length,
        status: (activeOrders.length > 0 ? 'busy' : 'idle') as 'busy' | 'idle',
        monthClosedCount: eng.monthClosedCount + closedOrders.length,
        avgMttrHours: avgMttr
      };
    });
  }, [engineers, workOrders]);

  // Sub-navigation tab: 'pool' | 'analytics' | 'team' | 'warehouse'
  const [viewSubTab, setViewSubTab] = useState<'pool' | 'analytics' | 'team' | 'warehouse'>('pool');

  // Filters (Zero Dropdown Design: Direct visual toggles & segmented chips)
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [quickPreset, setQuickPreset] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'cards' | 'table'>('kanban');

  // Sorting
  const [sortField, setSortField] = useState<'reportTime' | 'priority' | 'downtime' | 'slaUrgency'>('reportTime');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<EngineeringWorkOrder | null>(null);
  const [operatingOrder, setOperatingOrder] = useState<EngineeringWorkOrder | null>(null);
  const [acceptingOrder, setAcceptingOrder] = useState<EngineeringWorkOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<EngineeringWorkOrder | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<EngineeringWorkOrder | null>(null);

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const kpiStats = useMemo(() => {
    return calculateMttrKpiStats(workOrders);
  }, [workOrders]);

  // Live Count Calculations for visual badges (No hidden dropdowns!)
  const priorityCounts = useMemo(() => {
    return {
      all: workOrders.length,
      P1_CRITICAL: workOrders.filter(o => o.priority === 'P1_CRITICAL').length,
      P2_URGENT: workOrders.filter(o => o.priority === 'P2_URGENT').length,
      P3_STANDARD: workOrders.filter(o => o.priority === 'P3_STANDARD').length,
      P4_PLANNED: workOrders.filter(o => o.priority === 'P4_PLANNED').length,
    };
  }, [workOrders]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: workOrders.length,
      '急救生命支持技术组': 0,
      '大型放射影像技术组': 0,
      '临床检验与生化组': 0,
      '腔镜微创手术组': 0,
      '超声与综合诊疗组': 0,
    };
    workOrders.forEach(o => {
      if (counts[o.biomedicalGroup] !== undefined) {
        counts[o.biomedicalGroup]++;
      }
    });
    return counts;
  }, [workOrders]);

  const statusCounts = useMemo(() => {
    return {
      all: workOrders.length,
      pending_dispatch: workOrders.filter(o => o.status === 'pending_dispatch').length,
      in_progress: workOrders.filter(o => ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(o.status)).length,
      pending_acceptance: workOrders.filter(o => o.status === 'repaired_pending_acceptance').length,
      closed: workOrders.filter(o => o.status === 'closed').length,
    };
  }, [workOrders]);

  const presetCounts = useMemo(() => {
    return {
      p1_emergency: workOrders.filter(o => o.priority === 'P1_CRITICAL' && o.status !== 'closed').length,
      sla_warning: workOrders.filter(o => o.status !== 'closed' && ((o.totalDowntimeHours || 0) >= (o.slaRepairLimitHours * 0.75) || !o.isSlaResponseMet)).length,
      unassigned: workOrders.filter(o => o.status === 'pending_dispatch' || !o.assignedEngineerId).length,
      waiting_parts: workOrders.filter(o => o.status === 'waiting_parts').length,
    };
  }, [workOrders]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, groupFilter, quickPreset, searchQuery, sortField, sortOrder, viewMode]);

  // Reset all active filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setGroupFilter('all');
    setQuickPreset('all');
    setSearchQuery('');
    setSortField('reportTime');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || groupFilter !== 'all' || quickPreset !== 'all' || searchQuery.trim() !== '';

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return workOrders.filter(order => {
      // Status filter
      if (statusFilter === 'pending_dispatch' && order.status !== 'pending_dispatch') return false;
      if (statusFilter === 'in_progress' && !['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(order.status)) return false;
      if (statusFilter === 'pending_acceptance' && order.status !== 'repaired_pending_acceptance') return false;
      if (statusFilter === 'closed' && order.status !== 'closed') return false;

      // Priority filter
      if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;

      // Group filter
      if (groupFilter !== 'all' && order.biomedicalGroup !== groupFilter) return false;

      // Quick Scenario Presets
      if (quickPreset === 'p1_emergency' && (order.priority !== 'P1_CRITICAL' || order.status === 'closed')) return false;
      if (quickPreset === 'sla_warning') {
        const isWarning = (order.status !== 'closed' && (order.totalDowntimeHours || 0) >= (order.slaRepairLimitHours * 0.75)) || !order.isSlaResponseMet;
        if (!isWarning) return false;
      }
      if (quickPreset === 'unassigned' && (order.status !== 'pending_dispatch' && order.assignedEngineerId)) return false;
      if (quickPreset === 'waiting_parts' && order.status !== 'waiting_parts') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          order.id.toLowerCase().includes(q) ||
          order.equipmentName.toLowerCase().includes(q) ||
          order.equipmentSn.toLowerCase().includes(q) ||
          (order.internalNo && order.internalNo.toLowerCase().includes(q)) ||
          order.department.toLowerCase().includes(q) ||
          (order.assignedEngineerName && order.assignedEngineerName.toLowerCase().includes(q)) ||
          order.faultDescription.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [workOrders, statusFilter, priorityFilter, groupFilter, quickPreset, searchQuery]);

  // Sorted orders
  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    list.sort((a, b) => {
      if (sortField === 'priority') {
        const pWeights: Record<string, number> = {
          P1_CRITICAL: 4,
          P2_URGENT: 3,
          P3_STANDARD: 2,
          P4_PLANNED: 1
        };
        const diff = (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
        return sortOrder === 'desc' ? diff : -diff;
      }
      if (sortField === 'downtime') {
        const diff = (b.totalDowntimeHours || 0) - (a.totalDowntimeHours || 0);
        return sortOrder === 'desc' ? diff : -diff;
      }
      if (sortField === 'slaUrgency') {
        const ratioA = (a.totalDowntimeHours || 0) / (a.slaRepairLimitHours || 1);
        const ratioB = (b.totalDowntimeHours || 0) / (b.slaRepairLimitHours || 1);
        return sortOrder === 'desc' ? ratioB - ratioA : ratioA - ratioB;
      }
      // default: reportTime
      const diff = new Date(b.reportTime).getTime() - new Date(a.reportTime).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    });
    return list;
  }, [filteredOrders, sortField, sortOrder]);

  // Paginated orders for cards and table view
  const paginatedOrders = useMemo(() => {
    if (viewMode === 'kanban') return sortedOrders;
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, currentPage, pageSize, viewMode]);

  // Order Handlers
  const handleConfirmDispatch = (orderId: string, engineer: BiomedicalEngineerProfile, notes: string) => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const nowStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setWorkOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'dispatched',
            dispatcherName: currentUser?.name || '医工调度中心',
            dispatchTime: nowStr,
            dispatchNotes: notes,
            assignedEngineerId: engineer.id,
            assignedEngineerName: engineer.name,
            assignedEngineerPhone: engineer.phone
          };
        }
        return o;
      })
    );
    setAssigningOrder(null);
    showToast(`派工成功！已指派工程师【${engineer.name}】，系统已启动 ${engineer.name} 的到场响应计时`);
  };

  const handleUpdateWorkOrder = (updated: EngineeringWorkOrder) => {
    setWorkOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
    setOperatingOrder(updated);
    showToast(`工单【${updated.id}】现场作业状态已更新`);
  };

  const handleConfirmAcceptance = (
    orderId: string,
    ratingData: {
      ratingScore: number;
      ratingTimeliness: number;
      ratingQuality: number;
      ratingAttitude: number;
      clinicalFeedback: string;
      acceptanceStaffName: string;
      acceptanceStaffRole: string;
      acceptanceSignature: string;
    }
  ) => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const nowStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

    let targetOrder: EngineeringWorkOrder | undefined;

    setWorkOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const closedOrder: EngineeringWorkOrder = {
            ...o,
            status: 'closed',
            acceptanceTime: nowStr,
            ...ratingData
          };
          targetOrder = closedOrder;
          return closedOrder;
        }
        return o;
      })
    );

    // Sync back to equipment's status & repair records
    if (targetOrder && onEquipmentUpdated) {
      const eq = equipmentList.find(e => e.id === targetOrder?.equipmentId || e.sn === targetOrder?.equipmentSn);
      if (eq) {
        const newRepairRecord = {
          id: `REP-${Date.now().toString().slice(-6)}`,
          date: nowStr.split(' ')[0],
          fault: targetOrder.faultDescription,
          action: targetOrder.repairAction || '更换配件与参数定标合格',
          cost: targetOrder.totalRepairCost,
          engineer: targetOrder.assignedEngineerName || '院内工程师',
          status: '已完成' as const
        };

        const updatedEq: MedicalEquipment = {
          ...eq,
          status: '正常运行',
          repairRecords: [newRepairRecord, ...(eq.repairRecords || [])]
        };
        onEquipmentUpdated(updatedEq);
      }
    }

    setAcceptingOrder(null);
    setOperatingOrder(null);
    showToast(`临床验收合格！工单【${orderId}】已完成闭环归档，对应设备状态已恢复【正常运行】！`);
  };

  const handleCreateWorkOrder = (newOrder: EngineeringWorkOrder) => {
    setWorkOrders(prev => [newOrder, ...prev]);

    // Update equipment status to '故障待修'
    if (onEquipmentUpdated) {
      const eq = equipmentList.find(e => e.id === newOrder.equipmentId);
      if (eq && eq.status !== '故障待修') {
        onEquipmentUpdated({
          ...eq,
          status: '故障待修'
        });
      }
    }

    setIsCreateModalOpen(false);
    showToast(`报修成功！工单【${newOrder.id}】已录入派工调度池，请调度室及时派单。`);
  };

  const handleResetDemoData = () => {
    if (window.confirm('确认重置演示工单数据至三甲标准测试用例集？')) {
      setWorkOrders(INITIAL_WORK_ORDERS);
      showToast('已成功重置为全套12条闭环演示数据！');
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden gap-2.5">
      {/* Toast message alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 text-xs animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header - Ultra-Compact Horizontal Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-2xs shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: App Title & Sub-tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <h1 className="text-xs font-bold text-slate-900 shrink-0">医工智能派工调度中心</h1>
          </div>

          {/* Inline Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => setViewSubTab('pool')}
              className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewSubTab === 'pool'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>工单流转池</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-indigo-100 text-indigo-800 font-mono">
                {workOrders.length}
              </span>
            </button>

            <button
              onClick={() => setViewSubTab('analytics')}
              className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewSubTab === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>MTTR效能</span>
            </button>

            <button
              onClick={() => setViewSubTab('team')}
              className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewSubTab === 'team'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>驻场团队</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-200 text-slate-700 font-mono">
                {liveEngineers.length}人
              </span>
            </button>

            <button
              onClick={() => setViewSubTab('warehouse')}
              className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewSubTab === 'warehouse'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>备件库</span>
            </button>
          </div>
        </div>

        {/* Center: High-Impact KPI Badges (Horizontal Row) */}
        <div className="hidden xl:flex items-center gap-2 text-2xs">
          <button
            onClick={() => setViewSubTab('analytics')}
            className="px-2.5 py-1 rounded-lg bg-indigo-50/80 border border-indigo-200/80 flex items-center gap-1.5 hover:bg-indigo-100 transition cursor-pointer"
            title="查看全院平均MTTR分析"
          >
            <Clock className="w-3 h-3 text-indigo-600" />
            <span className="text-slate-600 font-medium">MTTR:</span>
            <span className="font-bold font-mono text-indigo-700">{kpiStats.avgMttrHours}h</span>
          </button>

          <div className="px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-slate-600 font-medium">SLA达标:</span>
            <span className="font-bold font-mono text-emerald-700">{kpiStats.slaResponseMetRate}%</span>
          </div>

          <button
            onClick={() => {
              setStatusFilter(prev => prev === 'pending_dispatch' ? 'all' : 'pending_dispatch');
              setViewSubTab('pool');
            }}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
              kpiStats.pendingDispatchCount > 0
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="筛选待指派工单"
          >
            <AlertTriangle className={`w-3 h-3 ${kpiStats.pendingDispatchCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-medium">待派工:</span>
            <span className="font-bold font-mono">{kpiStats.pendingDispatchCount}单</span>
          </button>

          <button
            onClick={() => setViewSubTab('team')}
            className="px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-center gap-1.5 hover:bg-amber-100 transition cursor-pointer"
            title="科室满意度考核"
          >
            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span className="text-slate-600 font-medium">满意度:</span>
            <span className="font-bold font-mono text-amber-700">{kpiStats.avgSatisfactionScore}分</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ 应急报修派工</span>
          </button>
        </div>
      </div>

      {/* View Sub-Tab 1: Work Order Pool (Horizontal Command Layout) */}
      {viewSubTab === 'pool' && (
        <div className="flex-1 min-h-0 flex flex-row overflow-hidden gap-2.5">
          {/* Horizontal Left: Triage & Personnel Availability Command Rail */}
          <div className="w-64 xl:w-72 shrink-0 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col min-h-0 overflow-hidden">
            {/* Header of rail */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>分诊与人员台</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-2xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  重置条件
                </button>
              )}
            </div>

            {/* Scrollable Rail Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="搜单号/设备/SN/科室/人员..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 text-2xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Quick Scenario Presets */}
              <div className="space-y-1">
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider px-0.5">
                  场景速筛
                </div>
                <div className="grid grid-cols-2 gap-1 text-2xs">
                  {[
                    { id: 'p1_emergency', label: '🚨 P1特急', count: presetCounts.p1_emergency },
                    { id: 'sla_warning', label: '⏱️ SLA预警', count: presetCounts.sla_warning },
                    { id: 'unassigned', label: '👤 待指派', count: presetCounts.unassigned },
                    { id: 'waiting_parts', label: '📦 待配件', count: presetCounts.waiting_parts },
                  ].map((sc) => {
                    const isActive = quickPreset === sc.id;
                    return (
                      <button
                        key={sc.id}
                        onClick={() => setQuickPreset(isActive ? 'all' : sc.id)}
                        className={`px-2 py-1 rounded text-2xs font-semibold border text-left flex items-center justify-between transition cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sc.label}</span>
                        <span className={`px-1 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                          {sc.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1">
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider px-0.5">
                  紧缓等级
                </div>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: '全部级别', count: priorityCounts.all },
                    { id: 'P1_CRITICAL', label: 'P1 特急·生命支持', count: priorityCounts.P1_CRITICAL, badge: 'bg-rose-100 text-rose-800 font-bold' },
                    { id: 'P2_URGENT', label: 'P2 紧急·关键医技', count: priorityCounts.P2_URGENT, badge: 'bg-amber-100 text-amber-800 font-bold' },
                    { id: 'P3_STANDARD', label: 'P3 常规·病房诊疗', count: priorityCounts.P3_STANDARD, badge: 'bg-blue-100 text-blue-800' },
                    { id: 'P4_PLANNED', label: 'P4 计划·PM维保', count: priorityCounts.P4_PLANNED, badge: 'bg-slate-100 text-slate-700' },
                  ].map((pr) => {
                    const isActive = priorityFilter === pr.id;
                    return (
                      <button
                        key={pr.id}
                        onClick={() => setPriorityFilter(isActive && pr.id !== 'all' ? 'all' : pr.id)}
                        className={`w-full px-2 py-1 rounded text-2xs font-medium border flex items-center justify-between transition cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{pr.label}</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${isActive ? 'bg-white/20 text-white' : pr.badge || 'bg-slate-200 text-slate-600'}`}>
                          {pr.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technical Specialty Groups */}
              <div className="space-y-1">
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider px-0.5">
                  保障专组
                </div>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: '全部专组', count: groupCounts.all },
                    { id: '急救生命支持技术组', label: '急救生命支持', count: groupCounts['急救生命支持技术组'] || 0 },
                    { id: '大型放射影像技术组', label: '大型放射影像', count: groupCounts['大型放射影像技术组'] || 0 },
                    { id: '临床检验与生化组', label: '临床检验生化', count: groupCounts['临床检验与生化组'] || 0 },
                    { id: '腔镜微创手术组', label: '腔镜微创手术', count: groupCounts['腔镜微创手术组'] || 0 },
                    { id: '超声与综合诊疗组', label: '超声与综合组', count: groupCounts['超声与综合诊疗组'] || 0 },
                  ].map((grp) => {
                    const isActive = groupFilter === grp.id;
                    return (
                      <button
                        key={grp.id}
                        onClick={() => setGroupFilter(isActive && grp.id !== 'all' ? 'all' : grp.id)}
                        className={`w-full px-2 py-1 rounded text-2xs font-medium border flex items-center justify-between transition cursor-pointer ${
                          isActive
                            ? 'bg-slate-800 text-white border-slate-800 font-bold shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{grp.label}</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {grp.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Engineers Duty Availability Window */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between px-0.5 text-2xs font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-500" />
                    <span>驻场医工在线负荷</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-600 font-bold">
                    {liveEngineers.filter(e => e.status === 'idle').length} 空闲待命
                  </span>
                </div>
                <div className="space-y-1">
                  {liveEngineers.map((eng) => (
                    <div
                      key={eng.id}
                      className="p-1.5 bg-slate-50 rounded border border-slate-200/80 text-2xs flex items-center justify-between hover:bg-slate-100/80 transition"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${eng.avatarColor}`}>
                          {eng.name[0]}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-800">{eng.name}</span>
                          <span className="text-slate-400 text-[10px] ml-1 truncate">({eng.group.slice(0, 4)})</span>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        eng.status === 'idle' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {eng.status === 'idle' ? '空闲' : `${eng.currentWOCount}单`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Right: Work Order Flow Pipeline Area */}
          <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
            {/* Sub-toolbar: Status Stages on Left, View Mode & Sorting on Right */}
            <div className="px-3 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 shrink-0">
              {/* Left: Status Stage Pills */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: '全部工单', count: workOrders.length },
                  { id: 'pending_dispatch', label: '1. 待派工', count: statusCounts.pending_dispatch, isPending: true },
                  { id: 'in_progress', label: '2. 维修中', count: statusCounts.in_progress },
                  { id: 'pending_acceptance', label: '3. 待验收', count: statusCounts.pending_acceptance },
                  { id: 'closed', label: '4. 已闭环', count: statusCounts.closed },
                ].map((st) => {
                  const isActive = statusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : st.isPending && st.count > 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span className={`px-1 py-0.2 rounded text-2xs font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : st.isPending && st.count > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {st.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: View Switcher & Sorting */}
              <div className="flex items-center gap-2">
                {/* View switcher */}
                <div className="flex items-center gap-0.5 bg-slate-200/70 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-2 py-0.8 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                      viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>流转看板</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2 py-0.8 rounded font-semibold transition cursor-pointer ${
                      viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    卡片
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-0.8 rounded font-semibold transition cursor-pointer ${
                      viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    表格
                  </button>
                </div>

                {/* Sort buttons */}
                <div className="hidden sm:flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 text-2xs">
                  <span className="text-slate-400 font-semibold">排序:</span>
                  {[
                    { id: 'reportTime' as const, label: '最新' },
                    { id: 'priority' as const, label: 'P1优先' },
                    { id: 'downtime' as const, label: '停机时长' },
                  ].map((s) => {
                    const isCurrent = sortField === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (isCurrent) setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSortField(s.id); setSortOrder('desc'); }
                        }}
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                          isCurrent ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {s.label}{isCurrent && (sortOrder === 'desc' ? '↓' : '↑')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Filter Notification Pill (if any) */}
            {hasActiveFilters && (
              <div className="px-3 py-1 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-2xs text-slate-500 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">筛选中:</span>
                  <span className="text-indigo-600 font-bold">{sortedOrders.length}条匹配</span>
                  <span className="text-slate-300">/</span>
                  <span>全院共{workOrders.length}条</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  清空筛选
                </button>
              </div>
            )}

          {/* Kanban View: Real-Time Work Order Status Flow Tracking Kanban */}
          {viewMode === 'kanban' && (
            <div className="flex-1 min-h-0 p-2 bg-slate-50/60 overflow-hidden flex flex-col">
              <WorkOrderTrackingKanban
                workOrders={sortedOrders}
                onAssignEngineer={(order) => setAssigningOrder(order)}
                onFieldOperation={(order) => setOperatingOrder(order)}
                onClinicalAcceptance={(order) => setAcceptingOrder(order)}
                onViewTracking={(order) => setTrackingOrder(order)}
                onPrint={(order) => setPrintingOrder(order)}
              />
            </div>
          )}

          {/* Cards View: Responsive CSS Grid with Independent Internal Scroll */}
          {viewMode === 'cards' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                  {sortedOrders.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                      <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p>没有匹配的派工工单记录</p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                        >
                          清空当前筛选条件
                        </button>
                      )}
                    </div>
                  ) : (
                    paginatedOrders.map((order) => {
                  const isP1 = order.priority === 'P1_CRITICAL';
                  const isP2 = order.priority === 'P2_URGENT';
                  const isPendingDispatch = order.status === 'pending_dispatch';
                  const isPendingAccept = order.status === 'repaired_pending_acceptance';
                  const isClosed = order.status === 'closed';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                        isPendingDispatch
                          ? 'border-rose-300 ring-1 ring-rose-300/50'
                          : isPendingAccept
                          ? 'border-cyan-300 ring-1 ring-cyan-300/50'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Card Top Banner */}
                      <div className={`p-3 border-b flex items-center justify-between ${
                        isP1 ? 'bg-rose-50/70 border-rose-100' :
                        isP2 ? 'bg-amber-50/70 border-amber-100' :
                        'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                            isP1 ? 'bg-rose-600 text-white font-mono animate-pulse' :
                            isP2 ? 'bg-amber-600 text-white font-mono' :
                            'bg-blue-600 text-white font-mono'
                          }`}>
                            {order.priority === 'P1_CRITICAL' ? 'P1 特急' :
                             order.priority === 'P2_URGENT' ? 'P2 紧急' :
                             order.priority === 'P3_STANDARD' ? 'P3 常规' : 'P4 计划'}
                          </span>
                          <span className="font-mono text-2xs font-bold text-slate-700">
                            {order.id}
                          </span>
                        </div>

                        {/* Status badge */}
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${
                          order.status === 'pending_dispatch' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                          order.status === 'dispatched' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          order.status === 'accepted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          order.status === 'arrived_inspecting' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          order.status === 'waiting_parts' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          order.status === 'repaired_pending_acceptance' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                          'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {order.status === 'pending_dispatch' && '● 待派工'}
                          {order.status === 'dispatched' && '● 已派待响应'}
                          {order.status === 'accepted' && '● 已接单在途'}
                          {order.status === 'arrived_inspecting' && '● 现场排查中'}
                          {order.status === 'waiting_parts' && '● 挂起待配件'}
                          {order.status === 'repaired_pending_acceptance' && '● 完工待验收'}
                          {order.status === 'closed' && '✓ 验收已闭环'}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 space-y-2.5 flex-1 text-xs">
                        {/* Equipment Name & SN */}
                        <div>
                          <div className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition flex items-center justify-between">
                            <span className="line-clamp-1">{order.equipmentName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-2xs text-slate-500 font-mono mt-0.5">
                            <span>SN: {order.equipmentSn}</span>
                            {order.internalNo && (
                              <span className="text-blue-700 font-bold">[{order.internalNo}]</span>
                            )}
                          </div>
                        </div>

                        {/* Location & Dept */}
                        <div className="text-2xs text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{order.department}</span>
                          <span className="text-slate-400">|</span>
                          <span className="truncate">{order.location}</span>
                        </div>

                        {/* Fault description */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 text-2xs leading-relaxed">
                          <p className="line-clamp-2">{order.faultDescription}</p>
                        </div>

                        {/* Engineer & SLA Tracker */}
                        <div className="bg-indigo-50/50 rounded-lg p-2 border border-indigo-100/70 space-y-1 text-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">负责工程师：</span>
                            <span className="font-bold text-indigo-900">
                              {order.assignedEngineerName ? (
                                <span className="flex items-center gap-1">
                                  <span>{order.assignedEngineerName}</span>
                                  <span className="text-slate-400 font-normal">({order.biomedicalGroup.slice(0, 4)})</span>
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold">调度室尚未指派</span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">停机修复耗时：</span>
                            <span className="font-mono font-bold text-slate-800">
                              {order.totalDowntimeHours}小时
                              <span className="text-slate-400 font-normal ml-1">(限{order.slaRepairLimitHours}h)</span>
                            </span>
                          </div>

                          {order.ratingScore && (
                            <div className="flex items-center justify-between pt-1 border-t border-indigo-100 text-amber-600 font-semibold">
                              <span>临床验收评分：</span>
                              <span>★ {order.ratingScore}分 ({order.acceptanceStaffName})</span>
                            </div>
                          )}
                        </div>

                        {/* 4-Step Stepper Bar: 待分配 -> 维修中 -> 待验收 -> 已完成 */}
                        <div className="pt-2 border-t border-slate-100">
                          <WorkOrderStepBar
                            status={order.status}
                            size="sm"
                            showSubStatus={true}
                            onStepClick={() => setTrackingOrder(order)}
                          />
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPrintingOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded transition cursor-pointer"
                            title="打印A4工程单"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="px-2 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition cursor-pointer flex items-center gap-1 text-2xs font-semibold"
                            title="查看工单实时流转追踪与时间轴"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>流转追踪</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isPendingDispatch && (
                            <button
                              onClick={() => setAssigningOrder(order)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-2xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>指派工程师</span>
                            </button>
                          )}

                          {['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(order.status) && (
                            <button
                              onClick={() => setOperatingOrder(order)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-2xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>现场作业打卡</span>
                            </button>
                          )}

                          {isPendingAccept && (
                            <button
                              onClick={() => setAcceptingOrder(order)}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-2xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>临床试实验收</span>
                            </button>
                          )}

                          {isClosed && (
                            <button
                              onClick={() => setOperatingOrder(order)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-2xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>查看闭环详情</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
                </div>
              </div>

              {/* Fixed Docked Footer Pagination for Cards View */}
              <div className="shrink-0 bg-white border-t border-slate-200">
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalCount={sortedOrders.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {/* Table View: Fixed Header with Scrollable Body and Docked Pagination */}
          {viewMode === 'table' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0 z-10 select-none">
                    <tr>
                      <th
                        onClick={() => {
                          if (sortField === 'reportTime') {
                            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortField('reportTime');
                            setSortOrder('desc');
                          }
                        }}
                        className="p-3 cursor-pointer hover:text-slate-900 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>工单编号</span>
                          {sortField === 'reportTime' ? (
                            sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-600 font-bold" /> : <ArrowUp className="w-3 h-3 text-indigo-600 font-bold" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (sortField === 'priority') {
                            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortField('priority');
                            setSortOrder('desc');
                          }
                        }}
                        className="p-3 cursor-pointer hover:text-slate-900 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>级别</span>
                          {sortField === 'priority' ? (
                            sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-600 font-bold" /> : <ArrowUp className="w-3 h-3 text-indigo-600 font-bold" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      </th>
                      <th className="p-3">设备信息</th>
                      <th className="p-3">报修科室 / 位置</th>
                      <th
                        onClick={() => {
                          if (sortField === 'reportTime') {
                            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortField('reportTime');
                            setSortOrder('desc');
                          }
                        }}
                        className="p-3 cursor-pointer hover:text-slate-900 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>报修时间</span>
                          {sortField === 'reportTime' ? (
                            sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-600 font-bold" /> : <ArrowUp className="w-3 h-3 text-indigo-600 font-bold" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      </th>
                      <th className="p-3">责任工程师</th>
                      <th
                        onClick={() => {
                          if (sortField === 'slaUrgency') {
                            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortField('slaUrgency');
                            setSortOrder('desc');
                          }
                        }}
                        className="p-3 cursor-pointer hover:text-slate-900 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>响应时效</span>
                          {sortField === 'slaUrgency' ? (
                            sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-600 font-bold" /> : <ArrowUp className="w-3 h-3 text-indigo-600 font-bold" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (sortField === 'downtime') {
                            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortField('downtime');
                            setSortOrder('desc');
                          }
                        }}
                        className="p-3 cursor-pointer hover:text-slate-900 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>停机修复耗时</span>
                          {sortField === 'downtime' ? (
                            sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-600 font-bold" /> : <ArrowUp className="w-3 h-3 text-indigo-600 font-bold" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 min-w-[210px]">状态流转流程 (4步追踪)</th>
                      <th className="p-3 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-slate-400">
                          <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p>没有匹配的工单记录</p>
                          {hasActiveFilters && (
                            <button
                              onClick={handleResetFilters}
                              className="mt-2.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                            >
                              清空筛选条件
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-bold text-slate-800">{order.id}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                            order.priority === 'P1_CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            order.priority === 'P2_URGENT' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.priority.slice(0, 2)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{order.equipmentName}</div>
                          <div className="text-2xs text-slate-400 font-mono">SN: {order.equipmentSn}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{order.department}</div>
                          <div className="text-2xs text-slate-500">{order.location}</div>
                        </td>
                        <td className="p-3 font-mono text-2xs text-slate-600">{order.reportTime}</td>
                        <td className="p-3 font-medium text-slate-800">
                          {order.assignedEngineerName ? (
                            <span className="text-indigo-700 font-bold">{order.assignedEngineerName}</span>
                          ) : (
                            <span className="text-rose-600 font-bold">待指派</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-2xs">
                          {order.responseTimeMinutes ? `${order.responseTimeMinutes}分` : '—'}
                        </td>
                        <td className="p-3 font-mono text-slate-800 font-bold">
                          {order.totalDowntimeHours}h
                        </td>
                        <td className="p-3 min-w-[210px]">
                          <WorkOrderStepBar
                            status={order.status}
                            size="sm"
                            showSubStatus={true}
                            onStepClick={() => setTrackingOrder(order)}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setTrackingOrder(order)}
                              className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition cursor-pointer"
                              title="查看实时流转追踪与时间轴"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {order.status === 'pending_dispatch' && (
                              <button
                                onClick={() => setAssigningOrder(order)}
                                className="px-2 py-1 bg-indigo-600 text-white rounded text-2xs font-bold hover:bg-indigo-700 cursor-pointer"
                              >
                                派工
                              </button>
                            )}
                            {['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(order.status) && (
                              <button
                                onClick={() => setOperatingOrder(order)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-2xs font-bold hover:bg-blue-700 cursor-pointer"
                              >
                                作业
                              </button>
                            )}
                            {order.status === 'repaired_pending_acceptance' && (
                              <button
                                onClick={() => setAcceptingOrder(order)}
                                className="px-2 py-1 bg-cyan-600 text-white rounded text-2xs font-bold hover:bg-cyan-700 cursor-pointer"
                              >
                                验收
                              </button>
                            )}
                            <button
                              onClick={() => setPrintingOrder(order)}
                              className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                              title="打印"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              {/* Docked Footer Pagination for Table View */}
              <div className="shrink-0 bg-white border-t border-slate-200">
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalCount={sortedOrders.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* View Sub-Tab 2: MTTR Analytics & SLA Leaderboard */}
      {viewSubTab === 'analytics' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Top 3 KPI comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Box 1: MTTR by Group */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">各专业技术组平均修复耗时 (MTTR)</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="space-y-2.5">
                {[
                  { name: '急救生命支持技术组', mttr: 1.35, target: 2.0, color: 'bg-rose-500' },
                  { name: '超声与综合诊疗组', mttr: 1.25, target: 4.0, color: 'bg-sky-500' },
                  { name: '腔镜微创手术组', mttr: 1.65, target: 3.0, color: 'bg-purple-500' },
                  { name: '临床检验与生化组', mttr: 1.68, target: 3.5, color: 'bg-cyan-500' },
                  { name: '大型放射影像技术组', mttr: 2.55, target: 4.0, color: 'bg-amber-500' }
                ].map((grp) => (
                  <div key={grp.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="font-medium text-slate-700">{grp.name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {grp.mttr}h <span className="text-slate-400 font-normal">/ 限{grp.target}h</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${grp.color}`}
                        style={{ width: `${Math.min(100, (grp.mttr / grp.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 2: Fault Root Cause Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">三甲评审设备故障根因归类分布</span>
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: '光路与光学探测传感器漂移', pct: 28, count: '7起', color: 'bg-emerald-500' },
                  { label: '机械齿轮磨损与丝杠阻滞', pct: 24, count: '6起', color: 'bg-blue-500' },
                  { label: '导联线缆与耗材探头破损', pct: 20, count: '5起', color: 'bg-amber-500' },
                  { label: '电源供电与滑环碳刷接触阻抗', pct: 16, count: '4起', color: 'bg-rose-500' },
                  { label: '临床误操作与设置偏差', pct: 12, count: '3起', color: 'bg-purple-500' }
                ].map((c) => (
                  <div key={c.label} className="space-y-1">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-slate-700">{c.label}</span>
                      <span className="font-mono font-bold text-slate-900">{c.count} ({c.pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3: SLA Response Compliance by Priority */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">分级响应时效 SLA 履约达标矩阵</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
                  <div className="flex items-center justify-between text-rose-900 font-bold">
                    <span>P1 特急生命支持 (≤15分钟)</span>
                    <span className="font-mono">100% 达标</span>
                  </div>
                  <p className="text-2xs text-rose-700">累计处置4起急救抢救，平均到场耗时 8.2分钟</p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between text-amber-900 font-bold">
                    <span>P2 紧急医技检查 (≤30分钟)</span>
                    <span className="font-mono">95.5% 达标</span>
                  </div>
                  <p className="text-2xs text-amber-700">累计处置6起大型检查机架故障，平均到场 14.5分钟</p>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span>P3 常规病房设备 (≤2小时)</span>
                    <span className="font-mono">98.0% 达标</span>
                  </div>
                  <p className="text-2xs text-blue-700">病房输液泵、心电图机平均到场 25分钟</p>
                </div>
              </div>
            </div>
          </div>

          {/* Engineers MTTR Performance Ranking Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">
                  医工工程师绩效排位榜 (月度完工量 / MTTR修复效率 / 首次修复率 / 临床满意度)
                </h3>
                <p className="text-2xs text-slate-500 mt-0.5">三甲医工保障考核与奖惩激励核心凭据</p>
              </div>
              <span className="text-2xs text-slate-400 font-mono">统计周期：本自然月</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5 text-center w-12">排名</th>
                    <th className="p-2.5">工程师</th>
                    <th className="p-2.5">专业组</th>
                    <th className="p-2.5 text-center">当前在手工单</th>
                    <th className="p-2.5 text-center">本月完工单量</th>
                    <th className="p-2.5 text-right">平均 MTTR 耗时</th>
                    <th className="p-2.5 text-right">首次修复率 (FTFR)</th>
                    <th className="p-2.5 text-right">临床满意度评价</th>
                    <th className="p-2.5 text-center">综合评定</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveEngineers
                    .slice()
                    .sort((a, b) => b.avgSatisfactionScore - a.avgSatisfactionScore || a.avgMttrHours - b.avgMttrHours)
                    .map((eng, idx) => (
                      <tr key={eng.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 text-center font-bold font-mono">
                          {idx === 0 && <span className="text-amber-500 text-sm">🥇</span>}
                          {idx === 1 && <span className="text-slate-400 text-sm">🥈</span>}
                          {idx === 2 && <span className="text-amber-700 text-sm">🥉</span>}
                          {idx > 2 && <span className="text-slate-500">{idx + 1}</span>}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs ${eng.avatarColor}`}>
                              {eng.name[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{eng.name}</div>
                              <div className="text-2xs text-slate-400 font-mono">{eng.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-700">{eng.group}</td>
                        <td className="p-2.5 text-center font-mono font-bold">
                          {eng.currentWOCount > 0 ? (
                            <span className="text-amber-600">{eng.currentWOCount}</span>
                          ) : (
                            <span className="text-emerald-600">0 (空闲)</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                          {eng.monthClosedCount} 单
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                          {eng.avgMttrHours} 小时
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          {eng.firstTimeFixRate}%
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-600">
                          ★ {eng.avgSatisfactionScore}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            优秀保障标兵
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Sub-Tab 3: Biomedical Engineers Team Live Status */}
      {viewSubTab === 'team' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">五莲县人民医院 · 医学装备保障工程团队 (实时在岗与调度负荷)</h3>
                <p className="text-2xs text-slate-500 mt-0.5">
                  全院分5大专业技术保障组，涵盖呼吸急救、大型影像、检验生化、手术腔镜及常规诊疗
                </p>
              </div>
              <div className="flex items-center gap-2 text-2xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 空闲待命: {liveEngineers.filter(e => e.status === 'idle').length}人
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> 抢修中: {liveEngineers.filter(e => e.status === 'busy').length}人
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {liveEngineers.map((eng) => (
              <div
                key={eng.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-xs ${eng.avatarColor}`}>
                      {eng.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{eng.name}</span>
                        <span className="text-2xs text-slate-400 font-mono">({eng.employeeNo})</span>
                      </div>
                      <p className="text-2xs text-indigo-700 font-medium">{eng.title}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${
                    eng.status === 'idle'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {eng.status === 'idle' ? '● 空闲待命' : `● 在手任务 ${eng.currentWOCount}单`}
                  </span>
                </div>

                <div className="space-y-1 text-2xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>专业保障组：<strong className="text-slate-800">{eng.group}</strong></div>
                  <div>联系专线：<span className="font-mono text-slate-800 font-semibold">{eng.phone}</span></div>
                  <div>擅长设备领域：</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {eng.specialties.map((spec, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded bg-white text-slate-700 text-2xs border border-slate-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center text-2xs">
                  <div>
                    <span className="text-slate-400 block">本月已完工</span>
                    <strong className="font-mono text-slate-900 text-xs">{eng.monthClosedCount} 单</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">平均 MTTR</span>
                    <strong className="font-mono text-indigo-600 text-xs">{eng.avgMttrHours}h</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">临床评分</span>
                    <strong className="font-mono text-amber-600 text-xs">★ {eng.avgSatisfactionScore}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Sub-Tab 4: Spare Parts Warehouse Linkage */}
      {viewSubTab === 'warehouse' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden p-3">
          <SparePartsWarehouseView
            currentUserName={currentUser?.name}
            onNavigateToWorkOrder={(orderId) => {
              setViewSubTab('pool');
              setSearchQuery(orderId);
            }}
          />
        </div>
      )}

      {/* Modals Integration */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        equipmentList={equipmentList}
        currentUser={currentUser}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateWorkOrder={handleCreateWorkOrder}
      />

      <DispatchAssignModal
        isOpen={Boolean(assigningOrder)}
        workOrder={assigningOrder}
        engineers={liveEngineers}
        onClose={() => setAssigningOrder(null)}
        onConfirmDispatch={handleConfirmDispatch}
      />

      <FieldOperationModal
        isOpen={Boolean(operatingOrder)}
        workOrder={operatingOrder}
        currentUserName={currentUser?.name}
        onClose={() => setOperatingOrder(null)}
        onUpdateWorkOrder={handleUpdateWorkOrder}
        onNavigateToAcceptance={(order) => {
          setOperatingOrder(null);
          setAcceptingOrder(order);
        }}
      />

      <ClinicalAcceptanceModal
        isOpen={Boolean(acceptingOrder)}
        workOrder={acceptingOrder}
        currentUser={currentUser}
        onClose={() => setAcceptingOrder(null)}
        onConfirmAcceptance={handleConfirmAcceptance}
      />

      <WorkOrderPrintModal
        isOpen={Boolean(printingOrder)}
        workOrder={printingOrder}
        onClose={() => setPrintingOrder(null)}
      />

      <WorkOrderTrackingModal
        isOpen={Boolean(trackingOrder)}
        workOrder={trackingOrder}
        onClose={() => setTrackingOrder(null)}
        onAssignEngineer={(order) => {
          setTrackingOrder(null);
          setAssigningOrder(order);
        }}
        onFieldOperation={(order) => {
          setTrackingOrder(null);
          setOperatingOrder(order);
        }}
        onClinicalAcceptance={(order) => {
          setTrackingOrder(null);
          setAcceptingOrder(order);
        }}
      />
    </div>
  );
};

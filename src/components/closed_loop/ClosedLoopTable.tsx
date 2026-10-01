import React, { useState } from 'react';
import { 
  Table2, 
  LayoutGrid, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Check, 
  Eye, 
  UserCheck, 
  Send, 
  FileText, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  FileCheck,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { 
  ClosedLoopRepairTask 
} from '../../types/closedLoopRepairTypes';
import { 
  ClosedLoopSortField, 
  ClosedLoopSortOrder, 
  ClosedLoopTableDensity, 
  ClosedLoopColumnVisibility,
  ClosedLoopViewMode
} from './closedLoopTableTypes';
import { Pagination } from '../Pagination';

interface ClosedLoopTableProps {
  tasks: ClosedLoopRepairTask[];
  paginatedTasks: ClosedLoopRepairTask[];
  totalFilteredCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  // Sort
  sortField: ClosedLoopSortField;
  sortOrder: ClosedLoopSortOrder;
  onSortChange: (field: ClosedLoopSortField) => void;
  // View mode & density
  viewMode: ClosedLoopViewMode;
  onChangeViewMode: (mode: ClosedLoopViewMode) => void;
  density: ClosedLoopTableDensity;
  columnVisibility: ClosedLoopColumnVisibility;
  // Selection
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  // Actions
  onViewTaskDetail: (task: ClosedLoopRepairTask) => void;
  onOpenVerification: (task: ClosedLoopRepairTask) => void;
  onOpenDraft: (task: ClosedLoopRepairTask) => void;
  onOpenApproval: (task: ClosedLoopRepairTask) => void;
  onOpenPrint: (task: ClosedLoopRepairTask) => void;
  onNavigateToWorkflowWorkspace: () => void;
  onOpenNewReportModal: () => void;
}

export const ClosedLoopTable: React.FC<ClosedLoopTableProps> = ({
  tasks,
  paginatedTasks,
  totalFilteredCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortField,
  sortOrder,
  onSortChange,
  viewMode,
  onChangeViewMode,
  density,
  columnVisibility: cols,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onViewTaskDetail,
  onOpenVerification,
  onOpenDraft,
  onOpenApproval,
  onOpenPrint,
  onNavigateToWorkflowWorkspace,
  onOpenNewReportModal,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 1500);
  };

  const isAllSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selectedIds.includes(t.id));

  const renderSortIndicator = (field: ClosedLoopSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500 inline ml-1 transition" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline ml-1 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline ml-1 font-bold" />
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            特急 (术中紧急)
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            高急
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            常规
          </span>
        );
    }
  };

  const getStageBadge = (task: ClosedLoopRepairTask) => {
    const hasVerification = Boolean(task.onsiteVerification);
    const app = task.factoryRepairApplication;
    const isApproved = app?.finalApprovalStatus === 'approved';
    const isPendingDept = app?.finalApprovalStatus === 'pending_dept';
    const isPendingVp = app?.finalApprovalStatus === 'pending_vp';
    const isClosed = task.stage === 'closed' || task.status.includes('自修') || task.status.includes('办结');

    if (isClosed) {
      return (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-slate-500" />
          <span>闭环办结</span>
        </span>
      );
    }
    if (isApproved) {
      return (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-bold inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>阶段 5/5 · 终审通过准予实施</span>
        </span>
      );
    }
    if (isPendingVp) {
      return (
        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-300 rounded text-xs font-bold inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span>阶段 4/5 · 呈批分管院长终审</span>
        </span>
      );
    }
    if (isPendingDept) {
      return (
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-300 rounded text-xs font-bold inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>阶段 3/5 · 呈批主管审核中</span>
        </span>
      );
    }
    if (hasVerification) {
      return (
        <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-300 rounded text-xs font-bold inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span>阶段 2/5 · 核验完成 (待起草返厂)</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded text-xs font-bold inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>阶段 1/5 · 待现场技术核验</span>
      </span>
    );
  };

  const cellPadding = density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3.5';

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-white overflow-hidden">
      {/* 1. Table Top Sub-bar (View Mode Switch & Summary Count) */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 select-none text-xs">
        {/* Left: Mode Indicator & Record Counts */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            {viewMode === 'cards' ? (
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Table2 className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{viewMode === 'cards' ? '卡片看板视图' : '紧凑表格视图'}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-2xs">
            当前页 <strong className="text-slate-800 font-bold">{paginatedTasks.length}</strong> 条
            {selectedIds.length > 0 && (
              <span className="ml-1 text-blue-600 font-bold">(已选 {selectedIds.length} 条)</span>
            )}
            <span className="ml-1 text-slate-400">/ 共匹配 {totalFilteredCount} 条工单</span>
          </span>
        </div>

        {/* Right: View Mode Toggle Segmented Button */}
        <div className="flex items-center bg-slate-200/70 p-0.5 rounded-md border border-slate-300/60">
          <button
            type="button"
            onClick={() => onChangeViewMode('table')}
            className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 transition ${
              viewMode === 'table'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="以紧凑数据表格排版呈现"
          >
            <Table2 className="w-3 h-3" />
            <span>表格</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('cards')}
            className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 transition ${
              viewMode === 'cards'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="以看板大卡片排版呈现"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>卡片</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Area: Table vs Cards */}
      {paginatedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Table2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">暂无匹配的闭环维修工单记录</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            当前筛选条件下未检索到工单数据。您可以尝试清空筛选关键词，或点击下方按钮发起全新报修工单。
          </p>
          <button
            type="button"
            onClick={onOpenNewReportModal}
            className="mt-4 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold shadow-xs transition"
          >
            立即发起麻醉手术科报修
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="flex-1 overflow-x-auto min-h-0 relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/95 sticky top-0 z-10 border-b border-slate-200 text-xs font-bold text-slate-700 select-none shadow-2xs">
              <tr>
                {/* 序号与全选复选框 */}
                <th className={`w-14 min-w-[56px] text-center border-r border-slate-200/80 ${cellPadding}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={onToggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      title="全选/取消全选本页"
                    />
                    {cols.indexNumber && <span>序号</span>}
                  </div>
                </th>

                {/* 工单编号 / 来源 */}
                {cols.taskNo && (
                  <th
                    onClick={() => onSortChange('taskNo')}
                    className={`min-w-[130px] border-r border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition group ${cellPadding}`}
                    title="按工单编号排序"
                  >
                    <div className="flex items-center gap-1">
                      <span className="group-hover:text-blue-700">工单编号 / 来源</span>
                      {renderSortIndicator('taskNo')}
                    </div>
                  </th>
                )}

                {/* 标的设备 / 规格型号 / 资产号 */}
                {cols.equipment && (
                  <th
                    onClick={() => onSortChange('equipmentName')}
                    className={`min-w-[200px] border-r border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition group ${cellPadding}`}
                    title="按设备名称排序"
                  >
                    <div className="flex items-center gap-1">
                      <span className="group-hover:text-blue-700">标的设备 / 规格型号 / 资产号</span>
                      {renderSortIndicator('equipmentName')}
                    </div>
                  </th>
                )}

                {/* 报修科室 & 申报人 */}
                {cols.department && (
                  <th
                    onClick={() => onSortChange('department')}
                    className={`min-w-[150px] border-r border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition group ${cellPadding}`}
                    title="按科室排序"
                  >
                    <div className="flex items-center gap-1">
                      <span className="group-hover:text-blue-700">报修科室 & 申报人</span>
                      {renderSortIndicator('department')}
                    </div>
                  </th>
                )}

                {/* 故障现象与类型 */}
                {cols.fault && (
                  <th className={`min-w-[180px] max-w-[260px] border-r border-slate-200/80 ${cellPadding}`}>
                    <span>故障现象与类型</span>
                  </th>
                )}

                {/* 紧急程度 */}
                {cols.urgency && (
                  <th
                    onClick={() => onSortChange('urgency')}
                    className={`w-28 min-w-[100px] border-r border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition group ${cellPadding}`}
                    title="按紧急程度排序"
                  >
                    <div className="flex items-center gap-1">
                      <span className="group-hover:text-blue-700">紧急程度</span>
                      {renderSortIndicator('urgency')}
                    </div>
                  </th>
                )}

                {/* 闭环流转进度追踪 */}
                {cols.stageProgress && (
                  <th
                    onClick={() => onSortChange('stage')}
                    className={`min-w-[210px] border-r border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition group ${cellPadding}`}
                    title="按流转阶段排序"
                  >
                    <div className="flex items-center gap-1">
                      <span className="group-hover:text-blue-700">闭环流转进度追踪</span>
                      {renderSortIndicator('stage')}
                    </div>
                  </th>
                )}

                {/* 现场勘查 / 审核预算 */}
                {cols.verificationBudget && (
                  <th
                    onClick={() => onSortChange('budget')}
                    className={`min-w-[140px] border-r border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition group ${cellPadding}`}
                    title="按预算金额排序"
                  >
                    <div className="flex items-center gap-1">
                      <span className="group-hover:text-blue-700">现场勘查 / 预算</span>
                      {renderSortIndicator('budget')}
                    </div>
                  </th>
                )}

                {/* 报修时间 */}
                {cols.faultTime && (
                  <th
                    onClick={() => onSortChange('faultTime')}
                    className={`min-w-[125px] border-r border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition group ${cellPadding}`}
                    title="按报修时间排序"
                  >
                    <div className="flex items-center gap-1">
                      <span className="group-hover:text-blue-700">报修申报时间</span>
                      {renderSortIndicator('faultTime')}
                    </div>
                  </th>
                )}

                {/* 业务操作 */}
                {cols.actions && (
                  <th className={`w-48 min-w-[190px] text-center sticky right-0 bg-slate-100 shadow-xs z-10 ${cellPadding}`}>
                    <span>业务操作</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedTasks.map((task, index) => {
                const isSelected = selectedIds.includes(task.id);
                const hasVerification = Boolean(task.onsiteVerification);
                const app = task.factoryRepairApplication;
                const ver = task.onsiteVerification;
                const isApproved = app?.finalApprovalStatus === 'approved';
                const isPendingDept = app?.finalApprovalStatus === 'pending_dept';
                const isPendingVp = app?.finalApprovalStatus === 'pending_vp';
                const stepNum = isApproved ? 5 : isPendingVp ? 4 : isPendingDept ? 3 : hasVerification ? 2 : 1;
                const isWolf = task.equipmentName.includes('输尿管') || task.equipmentSn.includes('RW-');

                return (
                  <tr
                    key={task.id}
                    onClick={() => onViewTaskDetail(task)}
                    className={`group transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/70 hover:bg-blue-100/70' 
                        : 'hover:bg-blue-50/40 bg-white'
                    }`}
                  >
                    {/* Checkbox & 序号 */}
                    <td 
                      className={`text-center border-r border-slate-200/70 whitespace-nowrap ${cellPadding}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectRow(task.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        {cols.indexNumber && (
                          <span className="font-mono text-slate-500 font-medium text-2xs">
                            {(currentPage - 1) * pageSize + index + 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 工单编号 / 任务类型 */}
                    {cols.taskNo && (
                      <td className={`border-r border-slate-200/70 whitespace-nowrap ${cellPadding}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-2xs">
                            {task.taskNo}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(task.taskNo, `taskNo-${task.id}`, e)}
                            className="text-slate-400 hover:text-blue-600 p-0.5 transition"
                            title="复制工单编号"
                          >
                            {copiedKey === `taskNo-${task.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            task.targetVendor || task.stage === 'vp_approved'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {task.targetVendor || task.stage === 'vp_approved' ? '外协返厂' : '院内闭环'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* 标的设备 / 规格型号 / 资产号 */}
                    {cols.equipment && (
                      <td className={`border-r border-slate-200/70 ${cellPadding}`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {task.equipmentName}
                          </span>
                          {isWolf && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              原厂精密光学
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-xs" title={task.equipmentModel}>
                          {task.equipmentModel}
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-slate-400 mt-0.5 font-mono">
                          <span>卡号: {task.assetNo}</span>
                          <span>·</span>
                          <span>SN: {task.equipmentSn}</span>
                        </div>
                      </td>
                    )}

                    {/* 报修科室 & 申报人 */}
                    {cols.department && (
                      <td className={`border-r border-slate-200/70 whitespace-nowrap ${cellPadding}`}>
                        <div className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-2xs border border-blue-200">
                          {task.department}
                        </div>
                        <div className="text-slate-700 font-medium mt-0.5">
                          {task.reporterName}
                          <span className="text-slate-400 text-2xs ml-1">({task.reporterRole})</span>
                        </div>
                        <div className="text-slate-400 text-2xs font-mono flex items-center gap-0.5 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{task.reporterPhone}</span>
                        </div>
                      </td>
                    )}

                    {/* 故障现象与类型 */}
                    {cols.fault && (
                      <td className={`border-r border-slate-200/70 max-w-[260px] ${cellPadding}`}>
                        <span className="inline-block px-1.5 py-0.2 rounded text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-1">
                          {task.faultType}
                        </span>
                        <p className="text-slate-600 text-2xs line-clamp-2 leading-relaxed" title={task.faultDescription}>
                          {task.faultDescription}
                        </p>
                      </td>
                    )}

                    {/* 紧急程度 */}
                    {cols.urgency && (
                      <td className={`border-r border-slate-200/70 whitespace-nowrap ${cellPadding}`}>
                        {getUrgencyBadge(task.urgency)}
                      </td>
                    )}

                    {/* 闭环流转进度追踪 */}
                    {cols.stageProgress && (
                      <td className={`border-r border-slate-200/70 ${cellPadding}`}>
                        <div className="space-y-1">
                          {/* Badge with status */}
                          <div className="flex items-center justify-between gap-1">
                            {getStageBadge(task)}
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {stepNum * 20}%
                            </span>
                          </div>

                          {/* 5-step progress bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex shadow-2xs">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isApproved ? 'bg-emerald-500 w-full' :
                                isPendingVp ? 'bg-purple-500 w-4/5' :
                                isPendingDept ? 'bg-indigo-500 w-3/5' :
                                hasVerification ? 'bg-teal-500 w-2/5' : 'bg-amber-500 w-1/5'
                              }`}
                            />
                          </div>

                          {/* Steps miniature labels */}
                          <div className="text-[9px] text-slate-400 flex items-center justify-between select-none">
                            <span className={stepNum >= 1 ? 'text-teal-700 font-bold' : ''}>1.报修</span>
                            <span className={stepNum >= 2 ? 'text-teal-700 font-bold' : ''}>2.核验</span>
                            <span className={stepNum >= 3 ? 'text-indigo-700 font-bold' : ''}>3.起草</span>
                            <span className={stepNum >= 4 ? 'text-purple-700 font-bold' : ''}>4.主管</span>
                            <span className={stepNum >= 5 ? 'text-emerald-700 font-bold' : ''}>5.院长</span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 现场核验 / 审核预算 */}
                    {cols.verificationBudget && (
                      <td className={`border-r border-slate-200/70 whitespace-nowrap ${cellPadding}`}>
                        {app ? (
                          <div>
                            <div className="font-bold text-emerald-700 font-mono text-xs">
                              ¥{app.estimatedBudget.toLocaleString()}
                            </div>
                            <div className="text-2xs text-slate-400">
                              占原值 {app.budgetRatioPercent}%
                            </div>
                          </div>
                        ) : ver ? (
                          <div className="space-y-0.5">
                            <div className="text-2xs text-slate-700 truncate max-w-[120px]" title={ver.opticalTransmittance}>
                              透光: {ver.opticalTransmittance.slice(0, 10)}...
                            </div>
                            <div className="text-2xs text-rose-600">
                              测漏: 蓝宝石封胶微漏
                            </div>
                          </div>
                        ) : (
                          <span className="text-2xs text-slate-400">待工程师勘查</span>
                        )}
                      </td>
                    )}

                    {/* 报修时间 */}
                    {cols.faultTime && (
                      <td className={`border-r border-slate-200/70 whitespace-nowrap text-2xs text-slate-500 font-mono ${cellPadding}`}>
                        {task.faultTime}
                      </td>
                    )}

                    {/* 业务操作 */}
                    {cols.actions && (
                      <td 
                        className={`whitespace-nowrap text-center sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-xs z-5 ${cellPadding}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 详情与全生命周期追踪 */}
                          <button
                            type="button"
                            onClick={() => onViewTaskDetail(task)}
                            className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition"
                            title="查看闭环详情与全生命周期进度追踪"
                          >
                            <Eye className="w-3 h-3 text-indigo-600" />
                            <span>追踪</span>
                          </button>

                          {/* 快捷业务动作 */}
                          {task.stage === 'reported' && (
                            <button
                              type="button"
                              onClick={() => onOpenVerification(task)}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1 transition"
                              title="设备科工程师入室进行技术实测与核验"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>现场核验</span>
                            </button>
                          )}

                          {task.stage === 'verified' && (
                            <button
                              type="button"
                              onClick={() => onOpenDraft(task)}
                              className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1 transition"
                              title="一键起草返厂维修公文呈批报告"
                            >
                              <Send className="w-3 h-3" />
                              <span>起草呈批</span>
                            </button>
                          )}

                          {(task.stage === 'return_drafted' || task.stage === 'dept_reviewed') && (
                            <button
                              type="button"
                              onClick={() => onOpenApproval(task)}
                              className={`px-2 py-1 rounded text-white text-xs font-bold shadow-2xs flex items-center gap-1 transition ${
                                isPendingDept 
                                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                                  : 'bg-purple-600 hover:bg-purple-700'
                              }`}
                              title="进入审批流转与电子签批"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{isPendingDept ? '主管审核' : '院长终审'}</span>
                            </button>
                          )}

                          {task.stage === 'vp_approved' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenPrint(task)}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                                title="打印正式红头呈批公文"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                              <button
                                type="button"
                                onClick={onNavigateToWorkflowWorkspace}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1 transition"
                                title="进入十阶协同履约工作台"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>协同履约</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View (看板卡片视图 - 参照 EquipmentCardGrid 风格) */
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTasks.map((task) => {
              const isSelected = selectedIds.includes(task.id);
              const hasVerification = Boolean(task.onsiteVerification);
              const app = task.factoryRepairApplication;
              const ver = task.onsiteVerification;
              const isApproved = app?.finalApprovalStatus === 'approved';
              const isPendingDept = app?.finalApprovalStatus === 'pending_dept';
              const isPendingVp = app?.finalApprovalStatus === 'pending_vp';
              const stepNum = isApproved ? 5 : isPendingVp ? 4 : isPendingDept ? 3 : hasVerification ? 2 : 1;

              return (
                <div
                  key={task.id}
                  onClick={() => onViewTaskDetail(task)}
                  className={`bg-white rounded-lg border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isSelected 
                      ? 'border-blue-500 shadow-md ring-1 ring-blue-500' 
                      : 'border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-mono font-bold text-xs text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {task.taskNo}
                      </span>
                    </div>
                    <div>
                      {getUrgencyBadge(task.urgency)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 space-y-2.5 flex-1">
                    {/* Device info */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {task.equipmentName}
                      </h4>
                      <p className="text-2xs font-mono text-slate-500 mt-0.5 truncate">
                        {task.equipmentModel}
                      </p>
                      <div className="flex items-center gap-2 text-2xs text-slate-400 font-mono mt-1">
                        <span>卡号: {task.assetNo}</span>
                        <span>·</span>
                        <span>SN: {task.equipmentSn}</span>
                      </div>
                    </div>

                    {/* Department & reporter */}
                    <div className="flex items-center justify-between text-2xs bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                      <span className="font-semibold text-blue-900">{task.department}</span>
                      <span className="text-slate-600">{task.reporterName}（{task.reporterRole}）</span>
                    </div>

                    {/* Fault summary */}
                    <div className="text-2xs bg-rose-50/50 p-2 rounded border border-rose-100 space-y-1">
                      <span className="font-bold text-rose-800 block">{task.faultType}</span>
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">
                        {task.faultDescription}
                      </p>
                    </div>

                    {/* Progress Bar & Stepper */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-2xs">
                        {getStageBadge(task)}
                        <span className="font-mono font-bold text-slate-500">{stepNum * 20}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${
                            isApproved ? 'bg-emerald-500 w-full' :
                            isPendingVp ? 'bg-purple-500 w-4/5' :
                            isPendingDept ? 'bg-indigo-500 w-3/5' :
                            hasVerification ? 'bg-teal-500 w-2/5' : 'bg-amber-500 w-1/5'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div 
                    className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-2xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{task.faultTime.slice(5)}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewTaskDetail(task)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium"
                      >
                        详情
                      </button>

                      {task.stage === 'reported' && (
                        <button
                          type="button"
                          onClick={() => onOpenVerification(task)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                          核验
                        </button>
                      )}

                      {task.stage === 'verified' && (
                        <button
                          type="button"
                          onClick={() => onOpenDraft(task)}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                        >
                          起草呈批
                        </button>
                      )}

                      {(task.stage === 'return_drafted' || task.stage === 'dept_reviewed') && (
                        <button
                          type="button"
                          onClick={() => onOpenApproval(task)}
                          className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                        >
                          {isPendingDept ? '主管审核' : '院长终审'}
                        </button>
                      )}

                      {task.stage === 'vp_approved' && (
                        <button
                          type="button"
                          onClick={onNavigateToWorkflowWorkspace}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          协同履约
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Standard Pagination Bar (Referencing Equipment Ledger Pagination) */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalFilteredCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

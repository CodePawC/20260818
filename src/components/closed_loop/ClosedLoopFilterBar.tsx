import React, { useState, useMemo } from 'react';
import { 
  Search, 
  RotateCcw, 
  Columns, 
  SlidersHorizontal, 
  Plus, 
  Download, 
  Building2, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  CheckSquare, 
  Activity,
  Layers,
  Check
} from 'lucide-react';
import { 
  ClosedLoopQuickFilterKey, 
  ClosedLoopTableDensity, 
  ClosedLoopColumnVisibility,
  ClosedLoopViewMode
} from './closedLoopTableTypes';
import { ClosedLoopRepairTask } from '../../types/closedLoopRepairTypes';
import { AuthUser } from '../../types';

interface ClosedLoopFilterBarProps {
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  activeQuickFilter: ClosedLoopQuickFilterKey;
  onQuickFilterChange: (key: ClosedLoopQuickFilterKey) => void;
  selectedDept: string;
  onDeptChange: (dept: string) => void;
  departmentOptions: string[];
  selectedUrgency: string;
  onUrgencyChange: (urgency: string) => void;
  selectedStage: string;
  onStageChange: (stage: string) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  totalAllCount: number;
  tasks: ClosedLoopRepairTask[];
  // Density & columns
  density: ClosedLoopTableDensity;
  onToggleDensity: () => void;
  columnVisibility: ClosedLoopColumnVisibility;
  onToggleColumn: (key: keyof ClosedLoopColumnVisibility) => void;
  onResetColumnVisibility: () => void;
  // Flowchart
  showFlowchart: boolean;
  onToggleFlowchart: () => void;
  // Actions
  onOpenNewReportModal: () => void;
  onExportCsv: () => void;
  // Multi-select batch actions
  selectedCount: number;
  onClearSelection: () => void;
  onBatchExport: () => void;
  currentUser?: AuthUser | null;
}

const COLUMN_LABELS: { key: keyof ClosedLoopColumnVisibility; label: string }[] = [
  { key: 'indexNumber', label: '序号' },
  { key: 'taskNo', label: '工单编号 / 来源' },
  { key: 'equipment', label: '标的设备 / 规格型号 / 资产号' },
  { key: 'department', label: '报修科室 & 申报人' },
  { key: 'fault', label: '故障现象与类型' },
  { key: 'urgency', label: '紧急程度' },
  { key: 'stageProgress', label: '闭环流转进度追踪' },
  { key: 'verificationBudget', label: '现场勘查 / 审核预算' },
  { key: 'faultTime', label: '报修申报时间' },
  { key: 'actions', label: '业务操作' },
];

export const ClosedLoopFilterBar: React.FC<ClosedLoopFilterBarProps> = ({
  searchKeyword,
  onSearchChange,
  activeQuickFilter,
  onQuickFilterChange,
  selectedDept,
  onDeptChange,
  departmentOptions,
  selectedUrgency,
  onUrgencyChange,
  selectedStage,
  onStageChange,
  onResetFilters,
  totalFilteredCount,
  totalAllCount,
  tasks,
  density,
  onToggleDensity,
  columnVisibility,
  onToggleColumn,
  onResetColumnVisibility,
  showFlowchart,
  onToggleFlowchart,
  onOpenNewReportModal,
  onExportCsv,
  selectedCount,
  onClearSelection,
  onBatchExport,
}) => {
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  // Calculate counts for each quick filter tab
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      pending_verify: tasks.filter(t => t.stage === 'reported').length,
      verified_pending_draft: tasks.filter(t => t.stage === 'verified').length,
      approving: tasks.filter(t => t.stage === 'return_drafted' || t.stage === 'dept_reviewed').length,
      approved: tasks.filter(t => t.stage === 'vp_approved').length,
      closed: tasks.filter(t => t.stage === 'closed' || t.status.includes('自修') || t.status.includes('办结')).length,
    };
  }, [tasks]);

  const quickFilterTabs: { key: ClosedLoopQuickFilterKey; label: string; count: number; activeClass: string }[] = [
    { key: 'all', label: '全部闭环工单', count: counts.all, activeClass: 'bg-slate-900 text-white shadow-xs' },
    { key: 'pending_verify', label: '待现场核验', count: counts.pending_verify, activeClass: 'bg-amber-600 text-white shadow-xs' },
    { key: 'verified_pending_draft', label: '待起草呈批', count: counts.verified_pending_draft, activeClass: 'bg-teal-600 text-white shadow-xs' },
    { key: 'approving', label: '呈批审批中', count: counts.approving, activeClass: 'bg-indigo-600 text-white shadow-xs' },
    { key: 'approved', label: '终审通过 · 准予实施', count: counts.approved, activeClass: 'bg-emerald-600 text-white shadow-xs' },
    { key: 'closed', label: '闭环办结 / 院内自修', count: counts.closed, activeClass: 'bg-slate-700 text-white shadow-xs' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 shrink-0">
      {/* 1. Main Search & Filter Row */}
      <div className="p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          {/* Keyword Search with clear button */}
          <div className="relative w-64 sm:w-72 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索工单号/设备/资产号/SN/申报人/科室..."
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="清空搜索"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => onDeptChange(e.target.value)}
              className="text-xs pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
            >
              <option value="all">全部使用科室</option>
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Urgency Filter */}
          <div className="relative">
            <select
              value={selectedUrgency}
              onChange={(e) => onUrgencyChange(e.target.value)}
              className="text-xs pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
            >
              <option value="all">全部紧急程度</option>
              <option value="critical">🔴 特急 (术中紧急)</option>
              <option value="high">🟠 高急</option>
              <option value="normal">🔵 常规</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stage Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedStage}
              onChange={(e) => onStageChange(e.target.value)}
              className="text-xs pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
            >
              <option value="all">全部闭环流转阶段</option>
              <option value="reported">阶段 1: 科室报修 · 待设备科现场核验</option>
              <option value="verified">阶段 2: 现场核验完成 · 待起草呈批</option>
              <option value="return_drafted">阶段 3: 已起草呈批 · 待设备科主管审核</option>
              <option value="dept_reviewed">阶段 4: 设备科主管已审 · 待分管院长终审</option>
              <option value="vp_approved">阶段 5: 分管副院长终审通过 · 准予实施</option>
              <option value="closed">阶段 6: 流程闭环 / 院内自修办结</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {(searchKeyword || selectedDept !== 'all' || selectedUrgency !== 'all' || selectedStage !== 'all' || activeQuickFilter !== 'all') && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md flex items-center gap-1 transition"
              title="重置所有筛选条件"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          )}
        </div>

        {/* Right: Table Controls & Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle Flowchart Button */}
          <button
            type="button"
            onClick={onToggleFlowchart}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition ${
              showFlowchart 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="展开或收起闭环内控流程机制图"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showFlowchart ? '收起流程图' : '展开流程图'}</span>
          </button>

          {/* Density Toggle (紧凑/默认) */}
          <button
            type="button"
            onClick={onToggleDensity}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
            title={density === 'compact' ? '切换为默认行高' : '切换为紧凑行高'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{density === 'compact' ? '紧凑' : '默认'}</span>
          </button>

          {/* Column Visibility Customizer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnConfigOpen(!isColumnConfigOpen)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
              title="自定义显示/隐藏列"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">自定义列</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isColumnConfigOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsColumnConfigOpen(false)} 
                />
                <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-2.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 font-bold text-slate-800">
                    <span>表格列显示配置</span>
                    <button
                      type="button"
                      onClick={onResetColumnVisibility}
                      className="text-2xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      恢复默认
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {COLUMN_LABELS.map(col => (
                      <label 
                        key={col.key} 
                        className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 rounded cursor-pointer select-none text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={columnVisibility[col.key]}
                          onChange={() => onToggleColumn(col.key)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
            title="导出当前筛选结果为 CSV 表格"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">导出CSV</span>
          </button>

          {/* Primary Action Button: 麻醉手术科发起报修申请 */}
          <button
            type="button"
            onClick={onOpenNewReportModal}
            className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>【麻醉手术科】发起报修申请</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Filter Segmented Buttons (Styled like Equipment Ledger View Mode / Quick Filters) */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-slate-400 font-semibold text-2xs mr-1 uppercase tracking-wider">快捷状态分类:</span>
          {quickFilterTabs.map(tab => {
            const isActive = activeQuickFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onQuickFilterChange(tab.key)}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? tab.activeClass
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Batch Action Bar (Appears when items are selected) */}
      {selectedCount > 0 && (
        <div className="bg-blue-50/90 border-t border-b border-blue-200 px-4 py-2 flex items-center justify-between text-xs text-blue-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>
              已选中 <strong className="font-bold text-blue-800">{selectedCount}</strong> 条闭环工单记录
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBatchExport}
              className="px-2.5 py-1 bg-white border border-blue-300 rounded text-blue-700 font-medium hover:bg-blue-100 transition flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-blue-600" />
              <span>导出选中项 (CSV)</span>
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:underline"
            >
              取消选择
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

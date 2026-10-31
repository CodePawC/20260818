import React from 'react';
import { DrgAuditFilterState } from '../../types/drgTypes';
import { Search, Filter, RefreshCw, Calculator, FileSpreadsheet, Layers, Cpu } from 'lucide-react';

interface DrgAuditFilterBarProps {
  filter: DrgAuditFilterState;
  onFilterChange: (newFilter: DrgAuditFilterState) => void;
  departmentOptions: string[];
  onOpenSimulation: () => void;
  onExportAuditReport: () => void;
  onResetCases: () => void;
  isRestrictedDept?: boolean;
}

export const DrgAuditFilterBar: React.FC<DrgAuditFilterBarProps> = ({
  filter,
  onFilterChange,
  departmentOptions,
  onOpenSimulation,
  onExportAuditReport,
  onResetCases,
  isRestrictedDept = false
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* 左侧：主视点切换与条件筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 视点切换 Segmented Button */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => onFilterChange({ ...filter, viewMode: 'drg_case_view' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              filter.viewMode === 'drg_case_view'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>DRG病组成本视点</span>
          </button>
          <button
            onClick={() => onFilterChange({ ...filter, viewMode: 'equipment_view' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              filter.viewMode === 'equipment_view'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>专机设备钩稽视点</span>
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative min-w-[180px] max-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.drgCodeOrKeyword}
            onChange={(e) => onFilterChange({ ...filter, drgCodeOrKeyword: e.target.value })}
            placeholder="搜索DRG编码/病案号/耗材..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        {/* 科室筛选 (若受限于本科室则锁定) */}
        {!isRestrictedDept && (
          <select
            value={filter.department}
            onChange={(e) => onFilterChange({ ...filter, department: e.target.value })}
            className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">全院所有临床科室</option>
            {departmentOptions.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}

        {/* 钩稽状态 */}
        <select
          value={filter.auditStatus}
          onChange={(e) => onFilterChange({ ...filter, auditStatus: e.target.value })}
          className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">全部钩稽状态</option>
          <option value="normal">正常合规</option>
          <option value="missing_consumable">疑似漏记耗材 (有开机无计费)</option>
          <option value="missing_equipment_log">计费脱钩 (有耗材无工时)</option>
          <option value="over_consumed">耗材超标使用</option>
        </select>

        {/* 核算周期 */}
        <select
          value={filter.timePeriod}
          onChange={(e) => onFilterChange({ ...filter, timePeriod: e.target.value as any })}
          className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
        >
          <option value="current_month">2026年10月 (当月)</option>
          <option value="last_month">2026年09月 (上月回溯)</option>
          <option value="current_quarter">2026年第四季度</option>
          <option value="year_to_date">2026全年度累计</option>
        </select>
      </div>

      {/* 右侧：专业动作操作区 */}
      <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors whitespace-nowrap"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>新设备DRG测算模拟</span>
        </button>

        <button
          onClick={onExportAuditReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>导出三甲质控审计单</span>
        </button>

        <button
          onClick={onResetCases}
          title="重置测试数据"
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

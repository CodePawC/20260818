import React from 'react';
import { DrgAuditKpiMetrics } from '../../types/drgTypes';
import { ShieldAlert, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Activity, FileCheck } from 'lucide-react';

interface DrgAuditKpiStripProps {
  metrics: DrgAuditKpiMetrics;
  onFilterAnomaly?: () => void;
}

export const DrgAuditKpiStrip: React.FC<DrgAuditKpiStripProps> = ({
  metrics,
  onFilterAnomaly
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {/* 纳管病案规模 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
          <span>DRG核算病案</span>
          <Activity className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {metrics.totalAnalyzedCases}
          </span>
          <span className="text-xs text-slate-500">例 · {metrics.totalDrgGroupsCount}病组</span>
        </div>
        <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
          <TrendingUp className="w-3 h-3 inline" />
          <span>覆盖率 100% (高权重组)</span>
        </div>
      </div>

      {/* 百元收入消耗专机耗材 (国考三级核心指标) */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
          <span>百元收入专耗 (国考)</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xs text-slate-400 font-mono">¥</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {metrics.consumablePerHundredIncome}
          </span>
          <span className="text-xs text-slate-500">元</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>优于三甲基准 (≤22.5元)</span>
        </div>
      </div>

      {/* 专机设备折旧机时成本占比 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
          <span>设备折旧成本占比</span>
          <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {metrics.deviceCostToTotalCostPercent}%
          </span>
          <span className="text-xs text-slate-500 font-mono">¥{(metrics.totalEquipmentAllocatedCost / 10000).toFixed(1)}万</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>病组设备开机均摊正常</span>
        </div>
      </div>

      {/* 医保统筹测算综合结余 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
          <span>DRG统筹测算结余</span>
          <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`text-xl font-bold font-mono tabular-nums ${metrics.insuranceNetBalanceTotal >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {metrics.insuranceNetBalanceTotal >= 0 ? '+' : ''}¥{(metrics.insuranceNetBalanceTotal / 10000).toFixed(1)}万
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>含专机耗材与设备折旧</span>
        </div>
      </div>

      {/* 专机专耗钩稽异常预警 (高危风险指标) */}
      <button 
        onClick={onFilterAnomaly}
        className="bg-rose-50/60 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-xs flex flex-col justify-between text-left hover:border-rose-400 transition-colors group cursor-pointer"
        title="点击仅查看存在钩稽异常的病案"
      >
        <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-medium">
          <span>专耗钩稽异常</span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {metrics.anomalyAuditCount}
          </span>
          <span className="text-xs text-rose-600/80 dark:text-rose-400/80">例待核查</span>
        </div>
        <div className="mt-1 text-[11px] text-rose-600/90 dark:text-rose-400/90 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="truncate">漏记{metrics.missingConsumableCount}·脱钩{metrics.missingEquipmentLogCount}·超标{metrics.overConsumedCount}</span>
        </div>
      </button>

      {/* 三甲质控整改闭环率 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
          <span>质控整改闭环率</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {metrics.auditResolutionRate}%
          </span>
        </div>
        <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
          <span>达到国家三甲评审A级</span>
        </div>
      </div>
    </div>
  );
};

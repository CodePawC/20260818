import React, { useState, useMemo } from 'react';
import { SystemStats, MedicalEquipment } from '../types';
import { ShieldCheck, Wrench, AlertTriangle, Coins, Layers, ExternalLink, ArrowUpRight, CheckCircle2, Landmark } from 'lucide-react';
import { RepairExpenseDetailModal } from './RepairExpenseDetailModal';
import { MonthlyFinanceReportModal } from './MonthlyFinanceReportModal';

interface StatsOverviewProps {
  stats: SystemStats;
  equipmentList?: MedicalEquipment[];
  onFilterByStatus?: (status: string) => void;
  activeStatusFilter?: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  equipmentList = [],
  onFilterByStatus,
  activeStatusFilter,
}) => {
  const [timeScope, setTimeScope] = useState<'all' | 'year' | 'month' | 'day'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-07');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFinanceReportOpen, setIsFinanceReportOpen] = useState<boolean>(false);

  // Extract available years, months, and dates from equipment list
  const { years, months } = useMemo(() => {
    const yearSet = new Set<string>();
    const monthSet = new Set<string>();

    equipmentList.forEach((eq) => {
      eq.repairRecords?.forEach((rec) => {
        const dStr = (rec.faultDate || rec.completionDate || '').replace(/\//g, '-');
        if (dStr) {
          if (dStr.length >= 7) monthSet.add(dStr.slice(0, 7));
          if (dStr.length >= 4) yearSet.add(dStr.slice(0, 4));
        }
      });
    });

    const sortedYears = Array.from(yearSet).sort().reverse();
    const sortedMonths = Array.from(monthSet).sort().reverse();

    return {
      years: sortedYears.length > 0 ? sortedYears : ['2026', '2025'],
      months: sortedMonths.length > 0 ? sortedMonths : ['2026-08', '2026-05', '2026-03']
    };
  }, [equipmentList]);

  // Compute expense for selected scope
  const { currentExpense, recordCount } = useMemo(() => {
    let cost = 0;
    let count = 0;

    equipmentList.forEach((eq) => {
      eq.repairRecords?.forEach((rec) => {
        const rDate = (rec.faultDate || rec.completionDate || '').replace(/\//g, '-');

        let matched = false;
        if (timeScope === 'all') {
          matched = true;
        } else if (timeScope === 'year' && rDate.startsWith(selectedYear)) {
          matched = true;
        } else if (timeScope === 'month' && rDate.startsWith(selectedMonth)) {
          matched = true;
        } else if (timeScope === 'day' && rDate === selectedDate) {
          matched = true;
        }

        if (matched) {
          cost += rec.cost || 0;
          count += 1;
        }
      });
    });

    return { currentExpense: cost, recordCount: count };
  }, [timeScope, selectedYear, selectedMonth, selectedDate, equipmentList]);

  const normalRate = stats.totalCount ? Math.round((stats.normalCount / stats.totalCount) * 100) : 100;
  const maintRate = stats.totalCount ? Math.round((stats.maintenanceCount / stats.totalCount) * 100) : 0;
  const faultRate = stats.totalCount ? Math.round((stats.faultCount / stats.totalCount) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5 shrink-0">
        
        {/* 1. 全院在册资产总数 */}
        <div 
          onClick={() => onFilterByStatus?.('')}
          className={`relative bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px] ${
            activeStatusFilter === '' 
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm bg-blue-50/10' 
              : 'border-slate-200/90 hover:border-blue-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">在册设备资产总数</span>
              {activeStatusFilter === '' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200/50">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{stats.totalCount}</span>
              <span className="text-xs text-slate-500 font-medium">台</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shrink-0 font-mono">
              原值 ￥{(stats.totalValue / 10000).toFixed(1)}万
            </span>
          </div>

          {/* 底部微型全院占比条 */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-slate-400">点击切换全院台账</span>
            <span className="font-mono text-blue-600 font-semibold">100% 覆盖</span>
          </div>
        </div>

        {/* 2. 正常在位运行中 */}
        <div 
          onClick={() => onFilterByStatus?.('正常运行')}
          className={`relative bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px] ${
            activeStatusFilter === '正常运行' 
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/10' 
              : 'border-slate-200/90 hover:border-emerald-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">正常服役运行中</span>
              {activeStatusFilter === '正常运行' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">{stats.normalCount}</span>
              <span className="text-xs text-emerald-600 font-medium">台</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0 font-mono">
              完好率 {normalRate}%
            </span>
          </div>

          {/* 进度条指示器 */}
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${normalRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. 预防维护/例行定标中 */}
        <div 
          onClick={() => onFilterByStatus?.('维护保养中')}
          className={`relative bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px] ${
            activeStatusFilter === '维护保养中' 
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm bg-amber-50/10' 
              : 'border-slate-200/90 hover:border-amber-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">预防维护与定标</span>
              {activeStatusFilter === '维护保养中' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/50">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-amber-700 tracking-tight">{stats.maintenanceCount}</span>
              <span className="text-xs text-slate-500 font-medium">台</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0 font-mono">
              质控占比 {maintRate}%
            </span>
          </div>

          {/* 进度条指示器 */}
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(maintRate * 3, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. 故障待修（急需派工） */}
        <div 
          onClick={() => onFilterByStatus?.('故障待修')}
          className={`relative bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px] ${
            activeStatusFilter === '故障待修' 
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm bg-rose-50/10' 
              : 'border-slate-200/90 hover:border-rose-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">故障报修待闭环</span>
              {activeStatusFilter === '故障待修' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
              )}
            </div>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              stats.faultCount > 0 
                ? 'bg-rose-100 text-rose-600 border-rose-300 animate-pulse' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${stats.faultCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {stats.faultCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">台</span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 font-mono ${
              stats.faultCount > 0 
                ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {stats.faultCount > 0 ? '急需维修派工' : '无未决故障'}
            </span>
          </div>

          {/* 状态提醒 */}
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{stats.faultCount > 0 ? '已挂牌暂停使用' : '全部处于可用状态'}</span>
            <span className={`font-mono font-semibold ${stats.faultCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              故障率 {faultRate}%
            </span>
          </div>
        </div>

        {/* 5. 维保费用与工单支出综合看板 */}
        <div className="relative bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-xs transition-all duration-200 flex flex-col justify-between overflow-hidden min-h-[96px] sm:min-h-[102px]">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700">维保费用总核算</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 border border-indigo-200/60"
                title="查看明细账单"
              >
                <span>明细</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsFinanceReportOpen(true)}
                className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 border border-emerald-200/60"
                title="生成提交财务科的付款资金准备月度请款单（如截至8月底结算）"
              >
                <span>财务请款</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* 时间维度切换小胶囊 */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10.5px] font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setTimeScope('all')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${timeScope === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                全期
              </button>
              <button
                type="button"
                onClick={() => setTimeScope('year')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${timeScope === 'year' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                年
              </button>
              <button
                type="button"
                onClick={() => setTimeScope('month')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${timeScope === 'month' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                月
              </button>
            </div>
          </div>

          {/* 子级下拉筛选（年/月） */}
          {timeScope !== 'all' && (
            <div className="mt-1 flex items-center gap-1">
              {timeScope === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full text-[11px] font-semibold py-0.5 px-1.5 bg-indigo-50/80 border border-indigo-200 text-indigo-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}年度维保支出</option>
                  ))}
                </select>
              )}
              {timeScope === 'month' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full text-[11px] font-semibold py-0.5 px-1.5 bg-indigo-50/80 border border-indigo-200 text-indigo-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}月度维保支出</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 金额数值展示与账单跳转 */}
          <div 
            className="mt-2 flex items-baseline justify-between gap-2 cursor-pointer group/exp"
            onClick={() => setIsModalOpen(true)}
            title="点击展开全院维保发票明细核算单"
          >
            <div className="flex items-baseline gap-0.5 font-mono">
              <span className="text-xs font-bold text-slate-500 notranslate" translate="no">￥</span>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight group-hover/exp:text-indigo-600 transition notranslate" translate="no">
                {currentExpense.toLocaleString()}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80 shrink-0 font-mono">
              共 {recordCount} 笔工单
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>实际发生与已报价结算金额</span>
            </span>
            <span className="text-indigo-600 font-medium">支出报表 ↗</span>
          </div>
        </div>

      </div>

      {/* 维保费用审计与明细弹窗 */}
      <RepairExpenseDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        equipmentList={equipmentList}
        timeScope={timeScope}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDate={selectedDate}
      />

      {/* 财务请款单月度报表模态框 */}
      <MonthlyFinanceReportModal
        isOpen={isFinanceReportOpen}
        onClose={() => setIsFinanceReportOpen(false)}
        equipmentList={equipmentList}
        initialYear={selectedYear || '2026'}
        initialMonth={selectedMonth ? selectedMonth.split('-')[1] : '08'}
        initialScopeMode={timeScope === 'month' ? 'single_month' : 'cumulative_month_end'}
      />
    </>
  );
};

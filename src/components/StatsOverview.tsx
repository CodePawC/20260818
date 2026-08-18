import React, { useState, useMemo } from 'react';
import { SystemStats, MedicalEquipment } from '../types';
import { ShieldCheck, Wrench, AlertTriangle, Coins, Layers, ExternalLink } from 'lucide-react';
import { RepairExpenseDetailModal } from './RepairExpenseDetailModal';

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
  activeStatusFilter
}) => {
  const [timeScope, setTimeScope] = useState<'all' | 'year' | 'month' | 'day'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-07');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Extract available years, months, and dates from equipment list
  const { years, months, dates } = useMemo(() => {
    const yearSet = new Set<string>();
    const monthSet = new Set<string>();
    const dateSet = new Set<string>();

    equipmentList.forEach((eq) => {
      eq.repairRecords?.forEach((rec) => {
        const dStr = (rec.faultDate || rec.completionDate || '').replace(/\//g, '-');
        if (dStr) {
          dateSet.add(dStr);
          if (dStr.length >= 7) {
            monthSet.add(dStr.slice(0, 7));
          }
          if (dStr.length >= 4) {
            yearSet.add(dStr.slice(0, 4));
          }
        }
      });
    });

    const sortedYears = Array.from(yearSet).sort().reverse();
    const sortedMonths = Array.from(monthSet).sort().reverse();
    const sortedDates = Array.from(dateSet).sort().reverse();

    return {
      years: sortedYears.length > 0 ? sortedYears : ['2026', '2025'],
      months: sortedMonths.length > 0 ? sortedMonths : ['2026-08', '2026-05', '2026-03'],
      dates: sortedDates.length > 0 ? sortedDates : ['2026-08-07', '2026-08-06', '2026-08-02', '2026-05-10']
    };
  }, [equipmentList]);

  // Compute expense for selected scope directly from equipmentList
  const { currentExpense, recordCount, scopeDesc } = useMemo(() => {
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

    let desc = '建档全期累计总计';
    if (timeScope === 'all') desc = '当前范围全期支出总额';
    else if (timeScope === 'year') desc = `${selectedYear}年度维保支出`;
    else if (timeScope === 'month') desc = `${selectedMonth}月度维保支出`;
    else if (timeScope === 'day') desc = `${selectedDate} 当日支出`;

    return { currentExpense: cost, recordCount: count, scopeDesc: desc };
  }, [timeScope, selectedYear, selectedMonth, selectedDate, equipmentList]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 shrink-0">
        {/* Total Equipment */}
        <div 
          onClick={() => onFilterByStatus?.('')}
          className={`relative bg-white p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[110px] ${
            activeStatusFilter === '' 
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
              : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">设备资产总数</span>
              <span className="text-xs text-slate-500 font-mono">Total Units</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalCount}</span>
              <span className="text-xs text-slate-600 font-bold">台</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0 font-mono">
              ￥{(stats.totalValue / 10000).toFixed(1)}万
            </span>
          </div>
        </div>

        {/* Operational */}
        <div 
          onClick={() => onFilterByStatus?.('正常运行')}
          className={`relative bg-white p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[110px] ${
            activeStatusFilter === '正常运行' 
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
              : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">正常运行中</span>
              <span className="text-xs text-emerald-700 font-mono">Operational</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-emerald-700 tracking-tight">{stats.normalCount}</span>
              <span className="text-xs text-emerald-700 font-bold">台</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1 font-mono">
              ● 完好 {stats.totalCount ? Math.round((stats.normalCount / stats.totalCount) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Under Maintenance */}
        <div 
          onClick={() => onFilterByStatus?.('维护保养中')}
          className={`relative bg-white p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[110px] ${
            activeStatusFilter === '维护保养中' 
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' 
              : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">维护保养中</span>
              <span className="text-xs text-amber-700 font-mono">Under PM/Cal</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-amber-700 tracking-tight">{stats.maintenanceCount}</span>
              <span className="text-xs text-slate-600 font-bold">台</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 font-mono">
              例行定标/巡检
            </span>
          </div>
        </div>

        {/* Faulty */}
        <div 
          onClick={() => onFilterByStatus?.('故障待修')}
          className={`relative bg-white p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[110px] ${
            activeStatusFilter === '故障待修' 
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md' 
              : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">急需故障抢修</span>
              <span className="text-xs text-rose-700 font-mono">Critical Fault</span>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs transition-transform ${
              stats.faultCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className={`text-2xl font-bold tracking-tight ${stats.faultCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {stats.faultCount}
              </span>
              <span className="text-xs text-slate-600 font-bold">台</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 font-mono ${
              stats.faultCount > 0 
                ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {stats.faultCount > 0 ? '挂牌停用' : '运行良好'}
            </span>
          </div>
        </div>

        {/* Interactive Repair Expenses Card */}
        <div className="relative bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between overflow-hidden min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">维保累计支出</span>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded text-xs flex items-center gap-1 font-bold transition cursor-pointer"
                  title="查看费用账单明细"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>明细</span>
                </button>
              </div>

              {/* Time Dimension Switcher Pills */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold shrink-0">
                <button
                  onClick={() => setTimeScope('all')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeScope === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  全期
                </button>
                <button
                  onClick={() => setTimeScope('year')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeScope === 'year' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  年
                </button>
                <button
                  onClick={() => setTimeScope('month')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeScope === 'month' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  月
                </button>
                <button
                  onClick={() => setTimeScope('day')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeScope === 'day' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  日
                </button>
              </div>
            </div>

            {/* Sub-selector for Year / Month / Day */}
            {timeScope !== 'all' && (
              <div className="mb-1.5 flex items-center gap-1">
                {timeScope === 'year' && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full text-xs font-semibold py-1 px-1.5 bg-indigo-50/70 border border-indigo-200 text-indigo-900 rounded-md focus:outline-hidden cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}年度</option>
                    ))}
                  </select>
                )}
                {timeScope === 'month' && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full text-xs font-semibold py-1 px-1.5 bg-indigo-50/70 border border-indigo-200 text-indigo-900 rounded-md focus:outline-hidden cursor-pointer"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{m}月份</option>
                    ))}
                  </select>
                )}
                {timeScope === 'day' && (
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs font-semibold py-1 px-1.5 bg-indigo-50/70 border border-indigo-200 text-indigo-900 rounded-md focus:outline-hidden cursor-pointer"
                  >
                    {dates.map((d) => (
                      <option key={d} value={d}>{d} 当日</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Display Amount */}
            <div className="flex items-baseline justify-between gap-1 cursor-pointer mt-1" onClick={() => setIsModalOpen(true)}>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xs font-bold text-slate-700 notranslate" translate="no">￥</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight notranslate" translate="no">
                  {currentExpense.toLocaleString()}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0 font-mono">
                {recordCount}笔工单
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mt-2 border-t border-slate-100 pt-1.5 font-medium">
            <span className="truncate max-w-[150px]" title={scopeDesc}>
              {scopeDesc}
            </span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Expense Detail Modal */}
      <RepairExpenseDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        equipmentList={equipmentList}
        timeScope={timeScope}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDate={selectedDate}
      />
    </>
  );
};


import React, { useState, useMemo } from 'react';
import { MedicalEquipment } from '../types';
import { PieChart, BarChart3, TrendingUp, ShieldAlert, Coins, AlertTriangle, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { getEquipmentValidityInfo } from '../utils/validityUtils';

interface AnalyticsViewProps {
  equipmentList: MedicalEquipment[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ equipmentList }) => {
  const [timeScope, setTimeScope] = useState<'all' | 'year' | 'month' | 'day'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-07');

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
          if (dStr.length >= 7) monthSet.add(dStr.slice(0, 7));
          if (dStr.length >= 4) yearSet.add(dStr.slice(0, 4));
        }
      });
    });

    return {
      years: Array.from(yearSet).sort().reverse(),
      months: Array.from(monthSet).sort().reverse(),
      dates: Array.from(dateSet).sort().reverse(),
    };
  }, [equipmentList]);

  // Compute repair expenses dynamically based on selected time dimension
  const filteredRepairExpenses = useMemo(() => {
    let cost = 0;
    let count = 0;
    const deptCostMap: Record<string, number> = {};

    equipmentList.forEach((eq) => {
      eq.repairRecords?.forEach((rec) => {
        const dStr = (rec.faultDate || rec.completionDate || '').replace(/\//g, '-');
        if (!dStr) return;

        let matched = false;
        if (timeScope === 'all') matched = true;
        else if (timeScope === 'year' && dStr.startsWith(selectedYear)) matched = true;
        else if (timeScope === 'month' && dStr.startsWith(selectedMonth)) matched = true;
        else if (timeScope === 'day' && dStr === selectedDate) matched = true;

        if (matched) {
          const recCost = rec.cost || 0;
          cost += recCost;
          count += 1;
          const dept = eq.department || '未知科室';
          deptCostMap[dept] = (deptCostMap[dept] || 0) + recCost;
        }
      });
    });

    return { totalCost: cost, recordCount: count, deptCostMap };
  }, [timeScope, selectedYear, selectedMonth, selectedDate, equipmentList]);

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};
  let totalCostAll = 0;

  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let unknownValidityCount = 0;

  equipmentList.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
    e.repairRecords?.forEach(r => {
      totalCostAll += r.cost || 0;
    });

    const vInfo = getEquipmentValidityInfo(e);
    if (vInfo.riskLevel === 'high') highRiskCount++;
    else if (vInfo.riskLevel === 'medium') mediumRiskCount++;
    else if (vInfo.riskLevel === 'low') lowRiskCount++;
    else unknownValidityCount++;
  });

  const totalDevices = equipmentList.length || 1;

  return (
    <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">全院医疗设备效能、效期与成本统计看板 Analytics</h2>
            <p className="text-xs text-slate-500 font-medium">
              资产结构分布、科室设备密度、设备生产效期风险与维保支出分析
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50/50">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">在册台账设备总数</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{equipmentList.length} <span className="text-xs text-slate-400 font-normal">台</span></p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">设备综合完好率</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {Math.round((equipmentList.filter(e => e.status === '正常运行').length / totalDevices) * 100)}%
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">超期高风险设备</p>
            <p className={`text-xl font-bold mt-1 ${highRiskCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {highRiskCount} <span className="text-xs text-slate-400 font-normal">台</span>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">临期预警设备</p>
            <p className={`text-xl font-bold mt-1 ${mediumRiskCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {mediumRiskCount} <span className="text-xs text-slate-400 font-normal">台</span>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">建档全期维保总支出</p>
            <p className="text-xl font-bold text-slate-800 mt-1 notranslate" translate="no">￥{totalCostAll.toLocaleString()}</p>
          </div>
        </div>

        {/* Validity Risk Summary Banner */}
        {highRiskCount > 0 && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">效期安全预警：全院检测到 {highRiskCount} 台设备已超出生产有效期（高风险）</span>
                <p className="text-rose-800 text-[11px] mt-0.5">建议工程部组织各科室评估设备使用风险，必要时安排质量鉴定或启动提请报废程序。</p>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Repair Expense Time-Dimension Analysis Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">维保与配件支出分时段多维统计</h3>
                <p className="text-xs text-slate-500">快速按全期、按年、按月、按日切换计算成本开支</p>
              </div>
            </div>

            {/* Switchers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium">
                <button
                  onClick={() => setTimeScope('all')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'all' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  全期
                </button>
                <button
                  onClick={() => setTimeScope('year')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'year' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  按年
                </button>
                <button
                  onClick={() => setTimeScope('month')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'month' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  按月
                </button>
                <button
                  onClick={() => setTimeScope('day')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'day' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  按日
                </button>
              </div>

              {timeScope === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y} 年度</option>
                  ))}
                </select>
              )}

              {timeScope === 'month' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m} 月份</option>
                  ))}
                </select>
              )}

              {timeScope === 'day' && (
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {dates.map((d) => (
                    <option key={d} value={d}>{d} 当日</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50/50 p-3.5 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800 font-medium">所选时间范围支出总额</p>
              <p className="text-2xl font-bold text-amber-900 mt-1 notranslate" translate="no">
                ￥{filteredRepairExpenses.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">维修工单笔数</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {filteredRepairExpenses.recordCount} <span className="text-xs font-normal text-slate-500">笔</span>
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">单笔平均支出</p>
              <p className="text-2xl font-bold text-slate-800 mt-1 notranslate" translate="no">
                ￥{filteredRepairExpenses.recordCount > 0 ? Math.round(filteredRepairExpenses.totalCost / filteredRepairExpenses.recordCount).toLocaleString() : 0}
              </p>
            </div>
          </div>

          {/* Department breakdown for selected time scope */}
          {Object.keys(filteredRepairExpenses.deptCostMap).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-700 mb-2">该时段内各科室维修成本占比：</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(filteredRepairExpenses.deptCostMap).map(([dept, c]) => (
                  <div key={dept} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs flex justify-between items-center">
                    <span className="text-slate-600 font-medium truncate">{dept}</span>
                    <span className="font-bold text-slate-800 notranslate" translate="no">￥{c.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visual Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Validity Risk Distribution */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> 设备效期风险分布 Risk Profile
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-rose-700">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-500" /> 高风险 (已超期)</span>
                  <span>{highRiskCount} 台 ({Math.round((highRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${Math.round((highRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-amber-700">
                  <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 中风险 (临期预警)</span>
                  <span>{mediumRiskCount} 台 ({Math.round((mediumRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.round((mediumRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 低风险 (效期正常)</span>
                  <span>{lowRiskCount} 台 ({Math.round((lowRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.round((lowRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              {unknownValidityCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>未设定效期</span>
                    <span>{unknownValidityCount} 台 ({Math.round((unknownValidityCount / totalDevices) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${Math.round((unknownValidityCount / totalDevices) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <BarChart3 className="w-4 h-4 text-blue-600" /> 设备资产类别分布 Category
            </h3>
            <div className="space-y-3">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / totalDevices) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat}</span>
                      <span>{count} 台 ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Density */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> 使用科室分布密度 Department
            </h3>
            <div className="space-y-3">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const percent = Math.round((count / totalDevices) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{dept}</span>
                      <span>{count} 台 ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
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

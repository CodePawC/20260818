import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Wrench,
  SlidersHorizontal,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
  FileText
} from 'lucide-react';
import { MedicalEquipment } from '../types';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { 
  generateMaintenanceExpenseForecast, 
  MaintenanceForecastResult,
  TimelineChartPoint 
} from '../utils/maintenanceForecastUtils';

export interface MaintenanceForecastTrendChartProps {
  equipment: MedicalEquipment;
  deviceWorkOrders?: EngineeringWorkOrder[];
  onNavigateToApprovals?: (data: any) => void;
  onNavigateToRoi?: (equipmentId: string) => void;
}

export const MaintenanceForecastTrendChart: React.FC<MaintenanceForecastTrendChartProps> = ({
  equipment,
  deviceWorkOrders = [],
  onNavigateToApprovals,
  onNavigateToRoi
}) => {
  // 呈现模式：单月支出趋势预测 vs 累计爬升预测
  const [chartViewMode, setChartViewMode] = useState<'monthly' | 'cumulative'>('monthly');
  // 选中的预测月份
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // 运行线性回归模型预测
  const forecast: MaintenanceForecastResult = useMemo(() => {
    return generateMaintenanceExpenseForecast(equipment, deviceWorkOrders);
  }, [equipment, deviceWorkOrders]);

  // 自定义 Recharts Tooltip
  const CustomForecastTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimelineChartPoint;
      const isFuture = data.isFuture;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs z-50 pointer-events-none min-w-[260px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span className="font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{data.month} ({data.displayMonth})</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isFuture 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}>
              {isFuture ? '🔮 线性回归预测期' : '📊 历史实际发生期'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {!isFuture ? (
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>历史实际维保:</span>
                </span>
                <strong className="text-white font-bold text-xs">
                  ¥{(data.actualCost || 0).toLocaleString()}
                </strong>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>预计维保开支:</span>
                  </span>
                  <strong className="text-amber-300 font-bold text-xs">
                    ¥{(data.predictedCost || 0).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
                  <span>95% 置信区间:</span>
                  <span className="text-slate-300">
                    [¥{(data.lowerBound || 0).toLocaleString()} ~ ¥{(data.upperBound || 0).toLocaleString()}]
                  </span>
                </div>

                {chartViewMode === 'cumulative' && (
                  <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                      <span>预计累计支出:</span>
                    </span>
                    <strong className="text-purple-300 font-bold">
                      ¥{(data.cumulativeCost || 0).toLocaleString()}
                    </strong>
                  </div>
                )}
              </>
            )}

            {data.trendLine != null && (
              <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
                <span>回归拟合趋势基线:</span>
                <span className="text-indigo-300">¥{data.trendLine.toLocaleString()}</span>
              </div>
            )}
          </div>

          {data.notes && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10.5px] text-slate-300 space-y-0.5">
              <span className="text-slate-400">{isFuture ? '推荐预防性维保节点:' : '历史维修记录:'}</span>
              <div className="font-semibold text-amber-200 truncate">
                • {data.notes}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const isAlarm = forecast.contractTypeRecommendation === 'scrap_evaluation';
  const isWarning = forecast.contractTypeRecommendation === 'full_warranty';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-5">
      
      {/* ===================== 顶部标题与回归模型公式标签 ===================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>未来12个月维保费用预测与预算建议</span>
            </h3>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>OLS线性回归模型</span>
            </span>

            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
              forecast.trendDirection === 'increasing'
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                : forecast.trendDirection === 'decreasing'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
            }`}>
              {forecast.trendDirection === 'increasing' ? '📈 费用加速爬升' : forecast.trendDirection === 'decreasing' ? '📉 费用趋向平稳' : '📊 费用平稳受控'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            回归方程: <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded text-[11px]">ŷ = {forecast.slope}x + {forecast.intercept}</code> · 判定系数 R² = <strong className="font-mono text-slate-700 dark:text-slate-200">{forecast.rSquared}</strong> · {forecast.monthlyDriftDescription}
          </p>
        </div>

        {/* 视图模式切换 */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setChartViewMode('monthly')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              chartViewMode === 'monthly'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            月度支出趋势
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode('cumulative')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              chartViewMode === 'cumulative'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            累计爬升预测
          </button>
        </div>
      </div>

      {/* ===================== 4 大核心预测指标胶囊卡片 ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: 未来12个月预测支出总额 */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/80 to-blue-50/40 dark:from-indigo-950/30 dark:to-slate-800 border border-indigo-100 dark:border-indigo-900/60">
          <div className="flex items-center justify-between text-xs text-indigo-900/70 dark:text-indigo-300">
            <span>未来12个月预计支出</span>
            <Coins className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-indigo-950 dark:text-white mt-1">
            ¥{forecast.totalForecastNext12Months.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            预测月均: <strong className="font-mono text-indigo-700 dark:text-indigo-300">¥{forecast.monthlyAverageForecast.toLocaleString()}</strong>/月
          </div>
        </div>

        {/* KPI 2: 建议申报预算储备金 (含安全冗余) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-800 border border-emerald-100 dark:border-emerald-900/60">
          <div className="flex items-center justify-between text-xs text-emerald-900/70 dark:text-emerald-300">
            <span>建议申报预算储备金</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-950 dark:text-white mt-1">
            ¥{forecast.recommendedBudgetReserve.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
            含12%应急备用金: <strong className="font-mono">¥{forecast.safetyBufferAmount.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 3: 支出最高风险季度 */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-slate-800 border border-amber-100 dark:border-amber-900/60">
          <div className="flex items-center justify-between text-xs text-amber-900/70 dark:text-amber-300">
            <span>支出峰值预警季度</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-sm sm:text-base font-black text-amber-950 dark:text-white truncate mt-1">
            {forecast.highestQuarterName}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
            预计单季开支: <strong className="font-mono">¥{forecast.highestQuarterAmount.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 4: 推荐维保合作策略 */}
        <div className={`p-3.5 rounded-xl border ${
          isAlarm
            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
            : isWarning
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>推荐运维合作策略</span>
            <Wrench className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className={`text-xs sm:text-sm font-black truncate mt-1 ${
            isAlarm ? 'text-rose-700 dark:text-rose-300' : isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-white'
          }`}>
            {forecast.contractTypeLabel}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            预计可为医院降本: <strong className="font-mono text-emerald-600">¥{forecast.contractSavingsEstimate.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* ===================== 核心 Recharts 趋势与置信区间图表 ===================== */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850/80 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
              <span>历史实绩(近12月)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
              <span>线性回归预测(未来12月)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-500/60 dark:text-amber-400/60">
              <span className="w-3 h-2 rounded-xs bg-amber-400/30 inline-block border border-dashed border-amber-400" />
              <span>95% 置信区间带</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-indigo-500">
              <span className="w-3 h-0.5 bg-indigo-500 inline-block" />
              <span>线性回归趋势线</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            分割虚线处为当前基准时间 (2026年10月)
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast.timelineData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
              <defs>
                <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />

              <XAxis 
                dataKey="displayMonth" 
                tick={{ fontSize: 10.5, fill: '#64748b' }} 
                interval={1}
                angle={-25}
                textAnchor="end"
                height={40}
              />

              <YAxis 
                tick={{ fontSize: 10.5, fill: '#64748b' }}
                tickFormatter={(val) => `¥${(val / 1000).toFixed(0)}k`}
                width={50}
              />

              <Tooltip content={<CustomForecastTooltip />} />

              {/* 分割线：区分历史期与预测期 */}
              <ReferenceLine 
                x="25年10月" 
                stroke="#6366f1" 
                strokeDasharray="4 4" 
                label={{ value: '当前点(26年10月)', position: 'insideTopLeft', fill: '#6366f1', fontSize: 10 }}
              />

              {chartViewMode === 'monthly' ? (
                <>
                  {/* 历史单月实际维修费用 */}
                  <Bar 
                    dataKey="actualCost" 
                    fill="#3b82f6" 
                    name="历史实际维保支出" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={28}
                  />

                  {/* 95% 置信区间上下限区域 */}
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="url(#forecastAreaGrad)"
                    name="95%置信上限"
                  />

                  {/* 线性回归预测折线 */}
                  <Line
                    type="monotone"
                    dataKey="predictedCost"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    name="未来12月预测开支"
                  />

                  {/* 回归拟合趋势线 */}
                  <Line
                    type="linear"
                    dataKey="trendLine"
                    stroke="#818cf8"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    name="回归拟合线"
                  />
                </>
              ) : (
                <>
                  {/* 累计爬升预测图 */}
                  <Line
                    type="monotone"
                    dataKey="cumulativeCost"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#8b5cf6' }}
                    name="累计维保支出爬升"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===================== 未来12个月季度资金分布与预防性排程 ===================== */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>未来12个月维保排期与月度预测开支分解表</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            基于回归算法与设备全生命周期维护周期智能推荐
          </span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {forecast.forecastPoints.map((m, idx) => (
            <div 
              key={m.month}
              className={`p-2.5 rounded-xl border transition-all ${
                idx % 3 === 2
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">{m.displayMonth}</span>
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-slate-100 dark:bg-slate-700">
                  {m.quarter}
                </span>
              </div>
              <div className="text-sm font-black font-mono text-indigo-700 dark:text-indigo-400 mt-1">
                ¥{m.predictedCost.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1" title={m.maintenanceSchedule}>
                {m.maintenanceSchedule}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ===================== 专家预计开支与决策建议面板 ===================== */}
      <div className={`p-4 rounded-xl border space-y-3 ${
        isAlarm 
          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900' 
          : isWarning
          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
          : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isAlarm ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {forecast.adviceTitle}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToApprovals && isAlarm && (
              <button
                type="button"
                onClick={() => onNavigateToApprovals({
                  equipmentId: equipment.id,
                  equipmentName: equipment.name,
                  department: equipment.department,
                  type: '报废' as any,
                  reason: `线性回归测算下年度维保费用达 ¥${forecast.totalForecastNext12Months.toLocaleString()}，已严重超出经济使用寿命。`
                })}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>提请报废技术鉴定</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {onNavigateToRoi && (
              <button
                type="button"
                onClick={() => onNavigateToRoi(equipment.id)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <span>复核单机ROI</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {forecast.adviceSummary}
        </p>

        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">具体开支与行动指导建议:</span>
          {forecast.keyRecommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-850/70 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="font-bold text-indigo-600 shrink-0">{i + 1}.</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

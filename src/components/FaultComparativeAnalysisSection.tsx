import React from 'react';
import {
  Scale,
  SlidersHorizontal,
  ArrowLeftRight,
  BarChart2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { AnalysisDimension } from './FaultFrequencyAnalysisCard';

interface TargetStats {
  name: string;
  total: number;
  repairCount: number;
  repairRate: number;
  faulty: number;
  healthRate: number;
  loadIndex: number;
  topReason: string;
}

interface EfficiencyEvaluation {
  leader: string;
  laggard: string;
  rateDiff: number;
  statusTone: 'positive' | 'alert' | 'neutral';
  summary: string;
  recommendation: string;
}

interface FaultComparativeAnalysisSectionProps {
  activeTargetA: string;
  activeTargetB: string;
  setTargetA: (val: string) => void;
  setTargetB: (val: string) => void;
  compareDimension: AnalysisDimension;
  setCompareDimension: (dim: AnalysisDimension) => void;
  departmentOptions: string[];
  categoryOptions: string[];
  statsA: TargetStats;
  statsB: TargetStats;
  compareChartType: 'bar' | 'trend';
  setCompareChartType: (type: 'bar' | 'trend') => void;
  compareBarData: Array<{
    metric: string;
    targetA: number;
    targetB: number;
    unit: string;
  }>;
  compareTrendData: Array<{
    period: string;
    targetA: number;
    targetB: number;
  }>;
  efficiencyEvaluation: EfficiencyEvaluation;
  onExitCompare: () => void;
}

// 专属横向对比 Tooltip
const CustomCompareTooltip = (props: any) => {
  const { active, payload, label } = props || {};
  if (active && Array.isArray(payload) && payload.length > 0) {
    const itemA = payload.find((p: any) => p?.dataKey === 'targetA') || payload[0];
    const itemB = payload.find((p: any) => p?.dataKey === 'targetB') || payload[1];
    const unit = itemA?.payload?.unit || '%';

    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white text-xs p-2.5 rounded-lg shadow-xl border border-slate-700 min-w-[200px]">
        <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-mono">横向对比</span>
        </div>
        <div className="space-y-1.5 font-mono">
          {itemA && (
            <div className="flex items-center justify-between gap-3 text-blue-300">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="truncate">{itemA.name}</span>
              </span>
              <span className="font-bold text-white">{itemA.value}{unit}</span>
            </div>
          )}
          {itemB && (
            <div className="flex items-center justify-between gap-3 text-rose-300">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">{itemB.name}</span>
              </span>
              <span className="font-bold text-white">{itemB.value}{unit}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const FaultComparativeAnalysisSection: React.FC<FaultComparativeAnalysisSectionProps> = ({
  activeTargetA = '',
  activeTargetB = '',
  setTargetA,
  setTargetB,
  compareDimension = 'department',
  setCompareDimension,
  departmentOptions = [],
  categoryOptions = [],
  statsA,
  statsB,
  compareChartType = 'bar',
  setCompareChartType,
  compareBarData = [],
  compareTrendData = [],
  efficiencyEvaluation,
  onExitCompare
}) => {
  const safeStatsA = statsA || {
    name: activeTargetA || '标的A',
    total: 0,
    repairCount: 0,
    repairRate: 0,
    faulty: 0,
    healthRate: 100,
    loadIndex: 0,
    topReason: '暂无异常'
  };

  const safeStatsB = statsB || {
    name: activeTargetB || '标的B',
    total: 0,
    repairCount: 0,
    repairRate: 0,
    faulty: 0,
    healthRate: 100,
    loadIndex: 0,
    topReason: '暂无异常'
  };

  const safeEval = efficiencyEvaluation || {
    leader: safeStatsA.name,
    laggard: safeStatsB.name,
    rateDiff: 0,
    statusTone: 'positive' as const,
    summary: '两标的综合运行指标平稳。',
    recommendation: '保持现有维保频次与操作规范。'
  };

  const currentOptions = compareDimension === 'department' ? (departmentOptions || []) : (categoryOptions || []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pr-0.5">
      {/* 1. 对比标的选择工具条 (标的 A vs 标的 B 下拉选择器) */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2 mt-2 shrink-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* 维度切换 */}
          <div className="flex items-center bg-white border border-indigo-200 rounded-md px-2 py-1 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-medium mr-1.5 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
              <span>对比维度:</span>
            </span>
            <select
              value={compareDimension}
              onChange={(e) => {
                setCompareDimension(e.target.value as AnalysisDimension);
                setTargetA('');
                setTargetB('');
              }}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="department">各科室横向对比</option>
              <option value="category">设备品类对比</option>
            </select>
          </div>

          {/* 标的 A 下拉选择器 (Blue Theme) */}
          <div className="flex items-center gap-1.5 bg-white border border-blue-300 rounded-md px-2 py-1 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-[11px] font-bold text-blue-800">标的 A:</span>
            <select
              id="fault-compare-target-a-select"
              value={activeTargetA}
              onChange={(e) => setTargetA(e.target.value)}
              className="text-xs font-bold text-blue-900 bg-transparent outline-none cursor-pointer max-w-[120px]"
            >
              {currentOptions.map((opt) => (
                <option key={`target-a-${opt}`} value={opt} disabled={opt === activeTargetB}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-bold border border-blue-100">
              故障率 {safeStatsA.repairRate}%
            </span>
          </div>

          {/* 标的调换按钮 (Swap) */}
          <button
            type="button"
            onClick={() => {
              const currentA = activeTargetA;
              const currentB = activeTargetB;
              setTargetA(currentB);
              setTargetB(currentA);
            }}
            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition cursor-pointer border border-indigo-200 shadow-2xs"
            title="互换标的 A 与 标的 B"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>

          {/* 标的 B 下拉选择器 (Rose Theme) */}
          <div className="flex items-center gap-1.5 bg-white border border-rose-300 rounded-md px-2 py-1 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-[11px] font-bold text-rose-800">标的 B:</span>
            <select
              id="fault-compare-target-b-select"
              value={activeTargetB}
              onChange={(e) => setTargetB(e.target.value)}
              className="text-xs font-bold text-rose-900 bg-transparent outline-none cursor-pointer max-w-[120px]"
            >
              {currentOptions.map((opt) => (
                <option key={`target-b-${opt}`} value={opt} disabled={opt === activeTargetA}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1 py-0.2 rounded font-bold border border-rose-100">
              故障率 {safeStatsB.repairRate}%
            </span>
          </div>
        </div>

        {/* 对比图表展现模式切换 */}
        <div className="flex items-center bg-white border border-indigo-200 p-0.5 rounded-md text-[10px] font-medium shadow-2xs">
          <button
            type="button"
            onClick={() => setCompareChartType('bar')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${
              compareChartType === 'bar' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="横向指标柱状对比"
          >
            <BarChart2 className="w-3 h-3" />
            <span>核心指标柱图</span>
          </button>
          <button
            type="button"
            onClick={() => setCompareChartType('trend')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${
              compareChartType === 'trend' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="多周期发生率走势对比"
          >
            <TrendingUp className="w-3 h-3" />
            <span>周期走势折线</span>
          </button>
        </div>
      </div>

      {/* 2. 核心横向对比指标卡条 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2 shrink-0 text-xs">
        {/* 故障发生率对比 */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 flex items-center justify-between font-medium">
            <span>故障发生率对比</span>
            <span className={`font-mono font-bold text-[9px] px-1 py-0.2 rounded ${
              safeEval.rateDiff === 0 
                ? 'bg-slate-200 text-slate-700' 
                : safeEval.rateDiff > 0 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              差值 {safeEval.rateDiff > 0 ? `+${safeEval.rateDiff}%` : `${safeEval.rateDiff}%`}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 font-mono">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-blue-700 font-bold text-xs">{safeStatsA.repairRate}%</span>
            </div>
            <span className="text-slate-300 text-[10px] font-sans">vs</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-rose-700 font-bold text-xs">{safeStatsB.repairRate}%</span>
            </div>
          </div>
        </div>

        {/* 设备综合完好率 */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-medium">设备综合完好率</div>
          <div className="flex items-center justify-between mt-1 font-mono">
            <span className="text-blue-700 font-bold text-xs">{safeStatsA.healthRate}%</span>
            <span className="text-slate-300 text-[10px] font-sans">vs</span>
            <span className="text-rose-700 font-bold text-xs">{safeStatsB.healthRate}%</span>
          </div>
        </div>

        {/* 待修停机设备 */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-medium">当前待修停机设备</div>
          <div className="flex items-center justify-between mt-1 font-mono">
            <span className="text-blue-700 font-bold text-xs">{safeStatsA.faulty} 台</span>
            <span className="text-slate-300 text-[10px] font-sans">vs</span>
            <span className="text-rose-700 font-bold text-xs">{safeStatsB.faulty} 台</span>
          </div>
        </div>

        {/* 报修负荷指数 */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-medium">报修负荷 (次/10台)</div>
          <div className="flex items-center justify-between mt-1 font-mono">
            <span className="text-blue-700 font-bold text-xs">{safeStatsA.loadIndex}</span>
            <span className="text-slate-300 text-[10px] font-sans">vs</span>
            <span className="text-rose-700 font-bold text-xs">{safeStatsB.loadIndex}</span>
          </div>
        </div>
      </div>

      {/* 3. 同一图表中横向对比可视化区 */}
      <div className="h-[180px] w-full pt-2 pb-1 relative shrink-0">
        {compareChartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareBarData || []} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomCompareTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: 11, paddingTop: 2 }} 
                iconSize={8}
              />
              <Bar dataKey="targetA" name={`【${safeStatsA.name}】`} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="targetB" name={`【${safeStatsB.name}】`} fill="#e11d48" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={compareTrendData || []} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip content={<CustomCompareTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: 11, paddingTop: 2 }} 
                iconSize={8}
              />
              <Line type="monotone" dataKey="targetA" name={`【${safeStatsA.name}】发生率`} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="targetB" name={`【${safeStatsB.name}】发生率`} stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4, fill: '#e11d48' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 4. 横向管理效率评估结论与建议 */}
      <div className="mt-1 pt-2 border-t border-slate-100 shrink-0">
        <div className="flex items-center justify-between pb-1.5">
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900">
              横向管理效率与质控评估结论
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              safeEval.statusTone === 'positive' 
                ? 'bg-emerald-100 text-emerald-800' 
                : safeEval.statusTone === 'alert' 
                ? 'bg-rose-100 text-rose-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              【{safeEval.leader}】运行效能更优
            </span>
          </div>
          <button
            type="button"
            onClick={onExitCompare}
            className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
          >
            返回常规分布
          </button>
        </div>

        {/* 标的画像对比小卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-1.5">
          <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {safeStatsA.name}
              </span>
              <span className="text-[10px] text-blue-700 font-mono">在册 {safeStatsA.total} 台 · 报修 {safeStatsA.repairCount} 次</span>
            </div>
            <div className="text-[10px] text-slate-600 mt-1 truncate">
              <span>主要诱因: </span>
              <strong className="text-blue-900">{safeStatsA.topReason}</strong>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {safeStatsB.name}
              </span>
              <span className="text-[10px] text-rose-700 font-mono">在册 {safeStatsB.total} 台 · 报修 {safeStatsB.repairCount} 次</span>
            </div>
            <div className="text-[10px] text-slate-600 mt-1 truncate">
              <span>主要诱因: </span>
              <strong className="text-rose-900">{safeStatsB.topReason}</strong>
            </div>
          </div>
        </div>

        {/* 质控管理建议框 */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/90 text-[11px] text-slate-700 space-y-1">
          <div className="flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-snug">{safeEval.summary}</p>
          </div>
          <div className="text-[10px] text-slate-500 pl-5 leading-normal">
            <span className="font-semibold text-slate-700">管理建议：</span>
            {safeEval.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};

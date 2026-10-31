import React, { useState } from 'react';
import { Layers, ShieldCheck, Sparkles, TrendingUp, Info } from 'lucide-react';

export interface RadarIndicatorMetric {
  id: number;
  name: string;
  shortName: string;
  baseline: number; // 传统手工模式基准值 %
  target: number;   // 管理导向目标值 %
  actual: number;   // MED-TECH OS 系统仿真评测值 %
  improvement: string;
  dimension: string;
  note: string;
}

export const RADAR_INDICATOR_METRICS: RadarIndicatorMetric[] = [
  { id: 1, name: '设备主数据规范率', shortName: '主数据规范', baseline: 71.4, target: 98.0, actual: 98.6, improvement: '+27.2%', dimension: '数据治理', note: '主数据字典统一与四码映射杜绝歧义' },
  { id: 2, name: '供应商主数据规范率', shortName: '供应商规范', baseline: 68.2, target: 95.0, actual: 96.4, improvement: '+28.2%', dimension: '数据治理', note: '统一社会信用代码前置校验' },
  { id: 3, name: '档案资料完整率', shortName: '档案完整率', baseline: 52.1, target: 95.0, actual: 96.8, improvement: '+44.7%', dimension: '数据治理', note: '“一机一档”全息电子卷宗强制归集' },
  { id: 4, name: '报修工单资料完整率', shortName: '工单资料完整', baseline: 79.3, target: 98.0, actual: 98.2, improvement: '+18.9%', dimension: '流程闭环', note: '工单SOP必填字段系统硬性卡点' },
  { id: 5, name: '维修任务闭环率', shortName: '维修任务闭环', baseline: 82.5, target: 95.0, actual: 97.1, improvement: '+14.6%', dimension: '流程闭环', note: '临床现场双人验签放行刚性闭环' },
  { id: 6, name: '预防性维护（PM）完成率', shortName: 'PM预防维保', baseline: 64.0, target: 90.0, actual: 92.5, improvement: '+28.5%', dimension: '预防维护', note: '周期智能到期提醒与绩效扣分约束' },
  { id: 7, name: '计量检测综合有效关联率', shortName: '计量强检关联', baseline: 81.2, target: 100.0, actual: 100.0, improvement: '+18.8%', dimension: '法定红线', note: '超期自动锁死派工与全院大盘告警' },
  { id: 8, name: '任务按时完成率', shortName: '任务按时完成', baseline: 67.8, target: 90.0, actual: 94.3, improvement: '+26.5%', dimension: '服务效能', note: '透明化SLA倒计时看板与督办' },
  { id: 9, name: '“一事一单”任务闭环率', shortName: '一事一单闭环', baseline: 61.5, target: 95.0, actual: 97.8, improvement: '+36.3%', dimension: '服务效能', note: '巡检随手记与会议督办全量立项' },
  { id: 10, name: 'AI辅助生成工单准确率', shortName: 'AI辅助生成', baseline: 0.0, target: 85.0, actual: 89.2, improvement: '+89.2%', dimension: '智能协同', note: '口语化报修分诊降低TAM认知门槛' },
  { id: 11, name: '后勤工作量可视化覆盖率', shortName: '工作量可视化', baseline: 34.2, target: 90.0, actual: 93.5, improvement: '+59.3%', dimension: '量化赋能', note: '碎片化后勤与数据治理工时显性化' },
];

interface Props {
  onSelectIndicator?: (id: number) => void;
  className?: string;
}

export const EvaluationMetricsRadarChart: React.FC<Props> = ({ onSelectIndicator, className = '' }) => {
  const [showBaseline, setShowBaseline] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // SVG Radar geometry
  const width = 640;
  const height = 540;
  const cx = 320;
  const cy = 260;
  const maxRadius = 185;
  const total = RADAR_INDICATOR_METRICS.length;

  const getCoordinates = (index: number, valuePercent: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, valuePercent)) / 100) * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle,
    };
  };

  const getPolygonPoints = (key: 'baseline' | 'target' | 'actual') => {
    return RADAR_INDICATOR_METRICS.map((item, idx) => {
      const { x, y } = getCoordinates(idx, item[key]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Concentric rings (20%, 40%, 60%, 80%, 100%)
  const rings = [20, 40, 60, 80, 100];

  const hoveredItem = hoveredIdx !== null ? RADAR_INDICATOR_METRICS[hoveredIdx] : null;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 ${className}`}>
      {/* 顶部控制栏与说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 font-mono">
              图 6-1 交互式雷达
            </span>
            <h3 className="font-doc-heading-3 text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>11项核心评价指标多维对比雷达图</span>
              <span className="text-xs font-normal text-slate-500 font-sans hidden sm:inline">
                （传统手工基线 vs 目标值 vs MED-TECH OS实测）
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-doc-fangsong-3">
            点击雷达图顶点或指标标签，可直接穿透下钻查看单项指标的原子样本与证据链。
          </p>
        </div>

        {/* 序列显隐切换按钮 */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setShowBaseline(!showBaseline)}
            className={`px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition cursor-pointer ${
              showBaseline
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-amber-600" />
            <span>传统手工基线 (均分60.2%)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTarget(!showTarget)}
            className={`px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition cursor-pointer ${
              showTarget
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-emerald-600" />
            <span>管理导向目标 (均值94.1%)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowActual(!showActual)}
            className={`px-2.5 py-1 rounded-md border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showActual
                ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-xs'
                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block border border-blue-700 shadow-xs" />
            <span>MED-TECH OS 实测 (均分96.1%)</span>
          </button>
        </div>
      </div>

      {/* 雷达图 SVG 画布主体 */}
      <div className="relative flex justify-center py-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[620px] select-none overflow-visible"
        >
          <defs>
            {/* 系统评测多边形径向发光渐变 */}
            <radialGradient id="actualGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.15" />
            </radialGradient>
            <radialGradient id="baselineGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.08" />
            </radialGradient>
            <radialGradient id="targetGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. 同心正多边形网格 */}
          {rings.map((ringPercent) => {
            const points = RADAR_INDICATOR_METRICS.map((_, idx) => {
              const { x, y } = getCoordinates(idx, ringPercent);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');

            return (
              <g key={ringPercent}>
                <polygon
                  points={points}
                  fill={ringPercent === 100 ? '#f8fafc' : 'none'}
                  stroke="#cbd5e1"
                  strokeWidth={ringPercent === 100 ? '1.5' : '1'}
                  strokeDasharray={ringPercent === 100 ? 'none' : '3,3'}
                />
                <text
                  x={cx + 4}
                  y={cy - (ringPercent / 100) * maxRadius - 2}
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#94a3b8"
                  textAnchor="start"
                >
                  {ringPercent}%
                </text>
              </g>
            );
          })}

          {/* 2. 径向轮辐骨架线 */}
          {RADAR_INDICATOR_METRICS.map((item, idx) => {
            const { x, y } = getCoordinates(idx, 100);
            const isHovered = hoveredIdx === idx;
            return (
              <line
                key={idx}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke={isHovered ? '#3b82f6' : '#e2e8f0'}
                strokeWidth={isHovered ? '2' : '1'}
                strokeDasharray={isHovered ? 'none' : '2,2'}
              />
            );
          })}

          {/* 3. 序列 1：传统手工模式基准 (内凹严重) */}
          {showBaseline && (
            <g className="transition-all duration-300">
              <polygon
                points={getPolygonPoints('baseline')}
                fill="url(#baselineGradient)"
                stroke="#d97706"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              {RADAR_INDICATOR_METRICS.map((item, idx) => {
                const { x, y } = getCoordinates(idx, item.baseline);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={hoveredIdx === idx ? 4.5 : 2.5}
                    fill="#d97706"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {/* 4. 序列 2：管理导向目标值 */}
          {showTarget && (
            <g className="transition-all duration-300">
              <polygon
                points={getPolygonPoints('target')}
                fill="url(#targetGradient)"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="2,3"
              />
              {RADAR_INDICATOR_METRICS.map((item, idx) => {
                const { x, y } = getCoordinates(idx, item.target);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={hoveredIdx === idx ? 4.5 : 2.5}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {/* 5. 序列 3：MED-TECH OS 仿真评测 (外层饱满闭环) */}
          {showActual && (
            <g className="transition-all duration-300">
              <polygon
                points={getPolygonPoints('actual')}
                fill="url(#actualGradient)"
                stroke="#2563eb"
                strokeWidth="2.5"
                filter="url(#glow)"
              />
              {RADAR_INDICATOR_METRICS.map((item, idx) => {
                const { x, y } = getCoordinates(idx, item.actual);
                const isHovered = hoveredIdx === idx;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectIndicator?.(item.id)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 7 : 4.5}
                      fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all"
                    />
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r={11}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                        className="animate-spin"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 6. 外圈文字标签（11个指标 shortName 与 序号） */}
          {RADAR_INDICATOR_METRICS.map((item, idx) => {
            const angle = (Math.PI * 2 * idx) / total - Math.PI / 2;
            const labelRadius = maxRadius + 30;
            const lx = cx + labelRadius * Math.cos(angle);
            const ly = cy + labelRadius * Math.sin(angle);
            const isHovered = hoveredIdx === idx;

            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (Math.cos(angle) > 0.3) textAnchor = 'start';
            else if (Math.cos(angle) < -0.3) textAnchor = 'end';

            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectIndicator?.(item.id)}
              >
                {/* 悬停高亮背景 */}
                {isHovered && (
                  <rect
                    x={textAnchor === 'start' ? lx - 4 : textAnchor === 'end' ? lx - 96 : lx - 48}
                    y={ly - 16}
                    width={96}
                    height={30}
                    rx={4}
                    fill="#eff6ff"
                    stroke="#93c5fd"
                    strokeWidth="1"
                  />
                )}
                {/* 序号与名称 */}
                <text
                  x={lx}
                  y={ly - 2}
                  fontSize={isHovered ? '12' : '11'}
                  fontWeight={isHovered ? 'bold' : '600'}
                  fill={isHovered ? '#1d4ed8' : '#1e293b'}
                  textAnchor={textAnchor}
                  className="transition-colors"
                >
                  {item.id}. {item.shortName}
                </text>
                {/* 评测实测值与改善 */}
                <text
                  x={lx}
                  y={ly + 11}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={isHovered ? '#2563eb' : '#059669'}
                  textAnchor={textAnchor}
                >
                  {item.actual}% ({item.improvement})
                </text>
              </g>
            );
          })}
        </svg>

        {/* 浮动悬停详细卡片 (当悬停在某个指标时出现) */}
        {hoveredItem && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs border border-blue-300 rounded-xl p-3 shadow-lg max-w-[260px] text-xs space-y-1.5 pointer-events-none transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-bold text-slate-900">
                {hoveredItem.id}. {hoveredItem.name}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                {hoveredItem.dimension}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
              <div className="text-slate-500">传统手工基线:</div>
              <div className="font-mono text-amber-700 font-bold">{hoveredItem.baseline}%</div>

              <div className="text-slate-500">管理导向目标:</div>
              <div className="font-mono text-emerald-700 font-bold">{hoveredItem.target}%</div>

              <div className="text-slate-500">MED-TECH OS:</div>
              <div className="font-mono text-blue-700 font-bold text-xs">{hoveredItem.actual}%</div>

              <div className="text-slate-500">治理改善幅度:</div>
              <div className="font-mono text-emerald-800 font-bold text-xs">{hoveredItem.improvement}</div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 leading-tight">
              {hoveredItem.note}
            </div>
            <div className="text-[10px] text-blue-600 font-semibold text-center pt-0.5">
              点击图上顶点可直接穿透下钻原子级证据链
            </div>
          </div>
        )}
      </div>

      {/* 底部3大核心发现与结论条 */}
      <div className="mt-2 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
          <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>传统手工基线治理塌缩区</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed font-doc-fangsong-3">
            传统模式在【档案完整率 52.1%】、【PM预防维保 64.0%】与【工作量可视化 34.2%】三个象限呈现显著内凹缺陷，存在大量脱管悬空。
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>法定红线与目标跨越</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed font-doc-fangsong-3">
            MED-TECH OS 在【强检有效关联率 100%】、【主数据规范率 98.6%】等指标上全面跨越管理目标线，形成刚性闭环防御。
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>质效跃升与TAM认知减负</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed font-doc-fangsong-3">
            AI辅助工单生成实现【从0到89.2%】的质态跃升，后勤隐性工时显性化提升【+59.3%】，实现了微观业务流转与宏观指标核算的有机统一。
          </p>
        </div>
      </div>
    </div>
  );
};

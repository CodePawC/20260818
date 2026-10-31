import React from 'react';

export interface EquipmentRadarScores {
  safetyScore: number;       // 运行安全 (0-100)
  reliabilityScore: number;  // 稳定程度 (0-100)
  roiHealthScore: number;    // 使用效益 (0-100)
  complianceScore: number;   // 检验合规 (0-100)
  modernityScore: number;    // 设备新旧 (0-100)
}

interface Props {
  scores: EquipmentRadarScores;
  overallScore?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export const EquipmentRadarChart: React.FC<Props> = ({
  scores,
  overallScore,
  className = '',
  size = 'md',
}) => {
  const dimensions = [
    { key: 'safetyScore', label: '运行安全', score: scores.safetyScore || 85, color: '#3b82f6' },
    { key: 'reliabilityScore', label: '稳定程度', score: scores.reliabilityScore || 80, color: '#6366f1' },
    { key: 'roiHealthScore', label: '使用效益', score: scores.roiHealthScore || 75, color: '#10b981' },
    { key: 'complianceScore', label: '检验合规', score: scores.complianceScore || 90, color: '#8b5cf6' },
    { key: 'modernityScore', label: '设备新旧', score: scores.modernityScore || 70, color: '#f59e0b' },
  ];

  const total = dimensions.length;
  const isSm = size === 'sm';
  const width = isSm ? 280 : 340;
  const height = isSm ? 240 : 280;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = isSm ? 75 : 95;

  const getCoordinates = (index: number, valuePercent: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, valuePercent)) / 100) * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle,
    };
  };

  const rings = [20, 40, 60, 80, 100];

  const polygonPoints = dimensions
    .map((d, idx) => {
      const { x, y } = getCoordinates(idx, d.score);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[340px] overflow-visible">
        <defs>
          <radialGradient id="equipRadarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* 1. 同心正五边形网格 */}
        {rings.map((ringPercent) => {
          const points = dimensions
            .map((_, idx) => {
              const { x, y } = getCoordinates(idx, ringPercent);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <polygon
              key={ringPercent}
              points={points}
              fill={ringPercent === 100 ? '#f8fafc' : 'none'}
              stroke="#cbd5e1"
              strokeWidth={ringPercent === 100 ? '1.5' : '1'}
              strokeDasharray={ringPercent === 100 ? 'none' : '2,2'}
            />
          );
        })}

        {/* 2. 径向放射骨架线 */}
        {dimensions.map((_, idx) => {
          const { x, y } = getCoordinates(idx, 100);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* 3. 设备得分多边形 */}
        <polygon
          points={polygonPoints}
          fill="url(#equipRadarGrad)"
          stroke="#2563eb"
          strokeWidth="2.5"
        />

        {/* 4. 顶点圆球标记 */}
        {dimensions.map((d, idx) => {
          const { x, y } = getCoordinates(idx, d.score);
          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={y}
                r={4}
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* 5. 5个维度的文字标签与分值 */}
        {dimensions.map((d, idx) => {
          const angle = (Math.PI * 2 * idx) / total - Math.PI / 2;
          const labelDist = maxRadius + (isSm ? 22 : 28);
          const lx = cx + labelDist * Math.cos(angle);
          const ly = cy + labelDist * Math.sin(angle);

          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (Math.cos(angle) > 0.3) textAnchor = 'start';
          else if (Math.cos(angle) < -0.3) textAnchor = 'end';

          return (
            <g key={idx}>
              <text
                x={lx}
                y={ly - 2}
                fontSize={isSm ? '10' : '11'}
                fontWeight="bold"
                fill="#1e293b"
                textAnchor={textAnchor}
              >
                {d.label}
              </text>
              <text
                x={lx}
                y={ly + 10}
                fontSize={isSm ? '9' : '10'}
                fontFamily="monospace"
                fontWeight="bold"
                fill="#2563eb"
                textAnchor={textAnchor}
              >
                {d.score}分
              </text>
            </g>
          );
        })}

        {/* 中心微标 */}
        {overallScore !== undefined && (
          <text
            x={cx}
            y={cy + 4}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#64748b"
            textAnchor="middle"
          >
            {overallScore}
          </text>
        )}
      </svg>
    </div>
  );
};

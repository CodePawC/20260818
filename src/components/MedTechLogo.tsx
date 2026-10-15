import React from 'react';

interface MedTechLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'horizontal' | 'compact';
  showSubtitle?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

/**
 * MED-TECH OS 专属医学工程全生命周期闭环管理系统矢量级专业LOGO
 * 
 * 视觉隐喻结构：
 * 1. 外层：双轨闭环运行轨道（象征全生命周期TLCM与“一事一单”闭环流转）
 * 2. 中层：高精度医疗工学十字与防护盾构（象征三甲医疗安全规范与质控红线底座）
 * 3. 核心：主数据智能互联枢纽点（象征四码映射标准与AI人机协同参谋内核）
 */
export const MedTechLogo: React.FC<MedTechLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  className = '',
  theme = 'dark'
}) => {
  // 尺寸映射
  const iconDimensions = {
    sm: { w: 28, h: 28, textMain: 'text-xs', textSub: 'text-[9.5px]' },
    md: { w: 36, h: 36, textMain: 'text-[13.5px]', textSub: 'text-[11px]' },
    lg: { w: 44, h: 44, textMain: 'text-base', textSub: 'text-xs' },
    xl: { w: 56, h: 56, textMain: 'text-xl', textSub: 'text-xs' }
  }[size];

  const iconSvg = (
    <div 
      className={`relative shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-200 select-none ${className}`}
      style={{ width: iconDimensions.w, height: iconDimensions.h }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* 品牌核心渐变色谱：医工科技蓝 -> 蔚蓝 -> 生机翡翠绿 */}
          <linearGradient id="medtech-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient id="medtech-gradient-accent" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="medtech-shield-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <radialGradient id="medtech-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </radialGradient>

          {/* 投影滤镜 */}
          <filter id="medtech-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. 外轮廓科技圆环发光晕 */}
        <circle cx="50" cy="50" r="46" fill="url(#medtech-core-glow)" />

        {/* 2. 闭环管理主轨道环（双向流转循环拓扑，对应全生命周期闭环） */}
        <ellipse 
          cx="50" 
          cy="50" 
          rx="44" 
          ry="26" 
          transform="rotate(-28 50 50)" 
          stroke="url(#medtech-gradient-primary)" 
          strokeWidth="3.2" 
          strokeDasharray="6 2" 
          strokeLinecap="round" 
          opacity="0.85" 
        />
        
        <ellipse 
          cx="50" 
          cy="50" 
          rx="44" 
          ry="26" 
          transform="rotate(32 50 50)" 
          stroke="url(#medtech-gradient-accent)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          opacity="0.9" 
        />

        {/* 3. 护盾底座（公立医疗资产防护与质控底线） */}
        <path
          d="M50 14L22 26V48C22 66 34 82 50 88C66 82 78 66 78 48V26L50 14Z"
          fill="url(#medtech-shield-bg)"
          stroke="url(#medtech-gradient-primary)"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* 4. 盾面精细内雕层 */}
        <path
          d="M50 19L27 29.5V47.5C27 62.5 37 76 50 81.5C63 76 73 62.5 73 47.5V29.5L50 19Z"
          fill="#0f172a"
          opacity="0.75"
        />

        {/* 5. 核心医学科技十字（立柱与横梁，融合现代数字倒角） */}
        {/* 竖柱 */}
        <rect 
          x="44" 
          y="31" 
          width="12" 
          height="38" 
          rx="3" 
          fill="url(#medtech-gradient-primary)" 
          filter="url(#medtech-glow)"
        />
        {/* 横梁 */}
        <rect 
          x="31" 
          y="44" 
          width="38" 
          height="12" 
          rx="3" 
          fill="url(#medtech-gradient-accent)" 
        />

        {/* 6. 中心智能核与心电脉冲波纹（AI辅助与生命支持象征） */}
        <circle cx="50" cy="50" r="5" fill="#ffffff" />
        <circle cx="50" cy="50" r="2.5" fill="#0284c7" />

        {/* 闭环运转卫星微节点（准入、使用、维修、质控四节点） */}
        <circle cx="16" cy="34" r="3.2" fill="#38bdf8" />
        <circle cx="84" cy="66" r="3.2" fill="#38bdf8" />
        <circle cx="24" cy="74" r="2.8" fill="#10b981" />
        <circle cx="76" cy="26" r="2.8" fill="#10b981" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return iconSvg;
  }

  const isLight = theme === 'light';

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {iconSvg}

      <div className="min-w-0 flex-1 select-none">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className={`font-black font-sans tracking-tight leading-none ${iconDimensions.textMain} ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            MED-TECH OS
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-400/30 leading-none">
            v2.4
          </span>
        </div>

        {showSubtitle && (
          <div 
            className={`font-medium tracking-tight mt-1 whitespace-nowrap leading-tight ${iconDimensions.textSub} ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}
            title="医学装备全生命周期闭环管理系统"
          >
            医学装备全生命周期闭环管理系统
          </div>
        )}
      </div>
    </div>
  );
};

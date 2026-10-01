import React from 'react';
import { Table2, LayoutGrid, Images } from 'lucide-react';
import { EquipmentViewMode } from '../types';

interface EquipmentViewModeSwitcherProps {
  viewMode: EquipmentViewMode;
  onChangeViewMode: (mode: EquipmentViewMode) => void;
  className?: string;
  showTitlePrefix?: boolean;
}

export const EquipmentViewModeSwitcher: React.FC<EquipmentViewModeSwitcherProps> = ({
  viewMode,
  onChangeViewMode,
  className = '',
  showTitlePrefix = true,
}) => {
  const options: Array<{
    id: EquipmentViewMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tooltip: string;
    badge?: string;
  }> = [
    {
      id: 'compact_table',
      label: '紧凑表格',
      icon: Table2,
      tooltip: '紧凑表格模式：高密度行列网格，适合全量字段排查与批量高通量数据审核',
    },
    {
      id: 'card_grid',
      label: '大卡片平铺',
      icon: LayoutGrid,
      tooltip: '大卡片平铺模式：多维结构化卡片，展示资产全貌、健康指标、计量周期与预算画像',
    },
    {
      id: 'photo_stream',
      label: '设备照片流',
      icon: Images,
      tooltip: '设备照片流模式：可视化照片画廊流，聚焦实物存证、铭牌外观与现场巡检核验',
      badge: '图库',
    },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/90 shadow-2xs ${className}`}
      role="group"
      aria-label="台账视图模式切换"
    >
      {showTitlePrefix && (
        <span className="text-[11px] text-slate-500 font-semibold px-1.5 hidden xl:inline-flex items-center select-none">
          视图模式:
        </span>
      )}
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = viewMode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChangeViewMode(opt.id)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
              isActive
                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-blue-300/70 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={opt.tooltip}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>{opt.label}</span>
            {opt.badge && !isActive && (
              <span className="hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-mono bg-blue-50 text-blue-600 border border-blue-200">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

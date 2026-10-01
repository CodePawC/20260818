import React from 'react';
import { 
  Sparkles, 
  Wrench, 
  Coins, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Image as ImageIcon,
  ShieldCheck,
  Building,
  RotateCcw
} from 'lucide-react';
import { EquipmentViewMode, EquipmentQuickFilterKey } from '../types';

export interface ViewModeQuickFilterOption {
  id: EquipmentQuickFilterKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badgeColor: string; // Tailwind color token
  activeColor: string;
}

// 针对不同视图模式的专属快速筛选配置
export const VIEW_MODE_QUICK_FILTERS: Record<EquipmentViewMode, ViewModeQuickFilterOption[]> = {
  // 设备照片流视图：侧重视物巡检、待维修、高价值、超期服役等大图核验
  photo_stream: [
    {
      id: 'pending_repair',
      label: '待维修设备',
      icon: Wrench,
      description: '故障待修或维护保养中的设备 (优先照片排查现场实况)',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      activeColor: 'bg-amber-600 text-white ring-amber-400',
    },
    {
      id: 'high_value',
      label: '高价值设备',
      icon: Coins,
      description: '原值 ≥ 50 万元的重点贵重医疗设备',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeColor: 'bg-emerald-600 text-white ring-emerald-400',
    },
    {
      id: 'with_real_photo',
      label: '有实物照片',
      icon: ImageIcon,
      description: '仅看已上传现场高清真机实物照片的设备',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      activeColor: 'bg-indigo-600 text-white ring-indigo-400',
    },
    {
      id: 'overdue_service',
      label: '超期/近失效',
      icon: AlertTriangle,
      description: '超期服役或处于准用特许期内的重点关注设备',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      activeColor: 'bg-rose-600 text-white ring-rose-400',
    },
  ],

  // 大卡片平铺模式：侧重健康度、需要计量核验、临床借调等全面综合指标
  card_grid: [
    {
      id: 'pending_repair',
      label: '待维修设备',
      icon: Wrench,
      description: '故障待修或维护中的设备',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      activeColor: 'bg-amber-600 text-white ring-amber-400',
    },
    {
      id: 'high_value',
      label: '高价值设备',
      icon: Coins,
      description: '单价 ≥ 50 万元重点医学装备',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeColor: 'bg-emerald-600 text-white ring-emerald-400',
    },
    {
      id: 'low_health',
      label: '健康预警 (<80分)',
      icon: Activity,
      description: '健康指数较低、处于亚健康或故障高风险状态的设备',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      activeColor: 'bg-rose-600 text-white ring-rose-400',
    },
    {
      id: 'calibration_due',
      label: '计量待校准',
      icon: ShieldCheck,
      description: '强检到期或30天内临期急需计量鉴定的设备',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
      activeColor: 'bg-purple-600 text-white ring-purple-400',
    },
  ],

  // 紧凑表格视图：侧重通用高通量统计、异常指标
  compact_table: [
    {
      id: 'pending_repair',
      label: '待维修',
      icon: Wrench,
      description: '故障待修或维护保养状态设备',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      activeColor: 'bg-amber-600 text-white ring-amber-400',
    },
    {
      id: 'high_value',
      label: '高价值',
      icon: Coins,
      description: '原值 ≥ 50 万元设备',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeColor: 'bg-emerald-600 text-white ring-emerald-400',
    },
    {
      id: 'overdue_service',
      label: '超期服役',
      icon: AlertTriangle,
      description: '超期准用或已逾产品有效期的设备',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      activeColor: 'bg-rose-600 text-white ring-rose-400',
    },
    {
      id: 'in_loan',
      label: '借调流转中',
      icon: Building,
      description: '当前处于跨科室借出或借用状态的周转设备',
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200',
      activeColor: 'bg-sky-600 text-white ring-sky-400',
    },
  ],
};

interface EquipmentQuickFilterProps {
  viewMode: EquipmentViewMode;
  activeQuickFilter: EquipmentQuickFilterKey;
  onSelectQuickFilter: (key: EquipmentQuickFilterKey) => void;
  className?: string;
}

export const EquipmentQuickFilter: React.FC<EquipmentQuickFilterProps> = ({
  viewMode,
  activeQuickFilter = 'all',
  onSelectQuickFilter,
  className = '',
}) => {
  const currentOptions = VIEW_MODE_QUICK_FILTERS[viewMode] || VIEW_MODE_QUICK_FILTERS.compact_table;

  return (
    <div
      className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}
      role="region"
      aria-label="视图模式专属快速筛选"
    >
      <div className="flex items-center gap-1 text-slate-500 font-medium text-xs select-none">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="hidden xl:inline text-[11px] font-semibold text-slate-600">快速筛选:</span>
      </div>

      <div className="inline-flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
        {/* 全部按钮 */}
        <button
          type="button"
          onClick={() => onSelectQuickFilter('all')}
          className={`px-2 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer select-none whitespace-nowrap ${
            activeQuickFilter === 'all'
              ? 'bg-white text-slate-800 shadow-2xs font-bold ring-1 ring-slate-300'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
          }`}
          title="显示当前视图下的全部设备"
        >
          全部
        </button>

        {/* 当前视图专属快速筛选项 */}
        {currentOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeQuickFilter === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectQuickFilter(isActive ? 'all' : opt.id)}
              className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1 cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? `${opt.activeColor} shadow-2xs ring-1 font-bold`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={opt.description}
            >
              <Icon className={`w-3 h-3 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{opt.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}

        {activeQuickFilter !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectQuickFilter('all')}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded text-xs ml-0.5"
            title="清除当前快速筛选"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

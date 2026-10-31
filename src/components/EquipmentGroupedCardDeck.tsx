import React, { useState, useMemo } from 'react';
import { MedicalEquipment, EquipmentStatus } from '../types';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { getEquipmentHealthScore, getEquipmentMaintenanceNode } from '../utils/equipmentUtils';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { resolveMainCategory } from '../utils/categoryFormatter';
import { LoanCountdownBadge } from './LoanTimeProgressBar';
import { ImagePreviewModal } from './ImagePreviewModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import {
  Activity,
  Building2,
  Table2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Wrench,
  RefreshCw,
  QrCode,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Search,
  CheckSquare,
  Square,
  ChevronsUpDown,
  Check,
  Camera,
  Maximize2,
  MapPin,
  Calendar,
  Layers,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Smartphone,
  Scale,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface EquipmentGroupedCardDeckProps {
  equipmentList: MedicalEquipment[];
  filteredEquipment?: MedicalEquipment[];
  groupBy: 'status' | 'department';
  onChangeGroupBy: (groupBy: 'status' | 'department') => void;
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectMultiple?: (ids: string[], select: boolean) => void;
  onBackToTable: () => void;
  onViewDetails: (item: MedicalEquipment, initialTab?: 'basic' | 'timeline' | 'roi' | 'repairs' | 'cost_analysis' | 'logs' | 'loans' | 'acceptance') => void;
  onAddRepairForDevice: (item: MedicalEquipment) => void;
  onChangeStatusForDevice: (item: MedicalEquipment) => void;
  onEditDevice: (item: MedicalEquipment) => void;
  onDeleteDevice: (id: string) => void;
  onAiDiagnoseDevice: (item: MedicalEquipment) => void;
  onOpenAiDimensionModal?: (item: MedicalEquipment, initialDimension?: string) => void;
  onViewDepartmentDetails?: (departmentName: string) => void;
  onViewAgencyTransactions?: (agencyName: string, item: MedicalEquipment) => void;
  onBorrowEquipment?: (item: MedicalEquipment) => void;
  onReturnEquipment?: (item: MedicalEquipment) => void;
  onNavigateToInspection?: (item: MedicalEquipment) => void;
  onOpenOverdueFiling?: (item: MedicalEquipment) => void;
  onPrintQrLabel?: (item: MedicalEquipment) => void;
  onHealthScoreClick?: (item: MedicalEquipment) => void;
}

interface GroupSummary {
  key: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: {
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
    headerBg: string;
    lightBg: string;
  };
  items: MedicalEquipment[];
  normalCount: number;
  repairCount: number;
  maintenanceCount: number;
  scrapCount: number;
  avgHealthScore: number;
  totalValuation: number;
}

export const EquipmentGroupedCardDeck: React.FC<EquipmentGroupedCardDeckProps> = ({
  equipmentList,
  filteredEquipment,
  groupBy,
  onChangeGroupBy,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectMultiple,
  onBackToTable,
  onViewDetails,
  onAddRepairForDevice,
  onChangeStatusForDevice,
  onEditDevice,
  onDeleteDevice,
  onAiDiagnoseDevice,
  onOpenAiDimensionModal,
  onViewDepartmentDetails,
  onViewAgencyTransactions,
  onBorrowEquipment,
  onReturnEquipment,
  onNavigateToInspection,
  onOpenOverdueFiling,
  onPrintQrLabel,
  onHealthScoreClick,
}) => {
  // 聚合数据源优先采用全部符合筛选条件的设备
  const targetEquipment = (filteredEquipment && filteredEquipment.length > 0)
    ? filteredEquipment
    : equipmentList;

  // 折叠状态（默认全部展开）
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  // 本地分组内检索
  const [localSearch, setLocalSearch] = useState('');
  // 复制提示
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // 操作菜单展开的设备ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  // 大图预览与拍照更换
  const [previewDevice, setPreviewDevice] = useState<MedicalEquipment | null>(null);
  const [uploadDevice, setUploadDevice] = useState<MedicalEquipment | null>(null);

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleExpandAll = () => {
    setCollapsedGroups({});
  };

  const handleCollapseAll = (allKeys: string[]) => {
    const next: Record<string, boolean> = {};
    allKeys.forEach(k => { next[k] = true; });
    setCollapsedGroups(next);
  };

  // 动态聚合计算分组
  const groups: GroupSummary[] = useMemo(() => {
    // 过滤本地检索
    const filtered = localSearch.trim()
      ? targetEquipment.filter(item => {
          const q = localSearch.trim().toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            (item.internalNo && item.internalNo.toLowerCase().includes(q)) ||
            (item.model && item.model.toLowerCase().includes(q)) ||
            (item.department && item.department.toLowerCase().includes(q)) ||
            (item.manufacturer && item.manufacturer.toLowerCase().includes(q))
          );
        })
      : targetEquipment;

    if (groupBy === 'status') {
      // 预定义状态序列
      const STATUS_CONFIGS: Array<{
        status: EquipmentStatus;
        icon: React.ComponentType<{ className?: string }>;
        theme: GroupSummary['theme'];
      }> = [
        {
          status: '正常运行',
          icon: CheckCircle2,
          theme: {
            badgeBg: 'bg-emerald-100 text-emerald-800',
            badgeText: 'text-emerald-700',
            border: 'border-emerald-300/80',
            accent: 'bg-emerald-600',
            headerBg: 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white',
            lightBg: 'bg-emerald-50/30'
          }
        },
        {
          status: '维护保养中',
          icon: Wrench,
          theme: {
            badgeBg: 'bg-amber-100 text-amber-800',
            badgeText: 'text-amber-700',
            border: 'border-amber-300/80',
            accent: 'bg-amber-600',
            headerBg: 'bg-gradient-to-r from-amber-50 via-orange-50/40 to-white',
            lightBg: 'bg-amber-50/30'
          }
        },
        {
          status: '故障待修',
          icon: AlertTriangle,
          theme: {
            badgeBg: 'bg-rose-100 text-rose-800',
            badgeText: 'text-rose-700',
            border: 'border-rose-300/80',
            accent: 'bg-rose-600',
            headerBg: 'bg-gradient-to-r from-rose-50 via-pink-50/40 to-white',
            lightBg: 'bg-rose-50/30'
          }
        },
        {
          status: '停用/报废',
          icon: Archive,
          theme: {
            badgeBg: 'bg-slate-200 text-slate-800',
            badgeText: 'text-slate-600',
            border: 'border-slate-300',
            accent: 'bg-slate-600',
            headerBg: 'bg-gradient-to-r from-slate-100 via-slate-50 to-white',
            lightBg: 'bg-slate-50/40'
          }
        }
      ];

      return STATUS_CONFIGS.map(cfg => {
        const items = filtered.filter(item => item.status === cfg.status);
        const totalValuation = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
        const totalHealth = items.reduce((sum, item) => sum + getEquipmentHealthScore(item).score, 0);
        const avgHealthScore = items.length > 0 ? Math.round(totalHealth / items.length) : 0;

        return {
          key: cfg.status,
          title: cfg.status,
          icon: cfg.icon,
          theme: cfg.theme,
          items,
          normalCount: cfg.status === '正常运行' ? items.length : 0,
          repairCount: cfg.status === '故障待修' ? items.length : 0,
          maintenanceCount: cfg.status === '维护保养中' ? items.length : 0,
          scrapCount: cfg.status === '停用/报废' ? items.length : 0,
          avgHealthScore,
          totalValuation
        };
      }).filter(g => g.items.length > 0 || !localSearch.trim()); // 搜索无结果时隐藏空组
    } else {
      // 按所属科室聚合
      const deptMap = new Map<string, MedicalEquipment[]>();
      filtered.forEach(item => {
        const dept = item.department || '未分配科室';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, []);
        }
        deptMap.get(dept)!.push(item);
      });

      // 提取科室并按设备数量降序排列
      const sortedDepts = Array.from(deptMap.entries()).sort((a, b) => b[1].length - a[1].length);

      // 色彩主题池循环赋予科室
      const DEPT_THEMES: GroupSummary['theme'][] = [
        {
          badgeBg: 'bg-blue-100 text-blue-800',
          badgeText: 'text-blue-700',
          border: 'border-blue-300/80',
          accent: 'bg-blue-600',
          headerBg: 'bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white',
          lightBg: 'bg-blue-50/20'
        },
        {
          badgeBg: 'bg-indigo-100 text-indigo-800',
          badgeText: 'text-indigo-700',
          border: 'border-indigo-300/80',
          accent: 'bg-indigo-600',
          headerBg: 'bg-gradient-to-r from-indigo-50 via-purple-50/40 to-white',
          lightBg: 'bg-indigo-50/20'
        },
        {
          badgeBg: 'bg-teal-100 text-teal-800',
          badgeText: 'text-teal-700',
          border: 'border-teal-300/80',
          accent: 'bg-teal-600',
          headerBg: 'bg-gradient-to-r from-teal-50 via-emerald-50/40 to-white',
          lightBg: 'bg-teal-50/20'
        },
        {
          badgeBg: 'bg-cyan-100 text-cyan-800',
          badgeText: 'text-cyan-700',
          border: 'border-cyan-300/80',
          accent: 'bg-cyan-600',
          headerBg: 'bg-gradient-to-r from-cyan-50 via-sky-50/40 to-white',
          lightBg: 'bg-cyan-50/20'
        },
        {
          badgeBg: 'bg-violet-100 text-violet-800',
          badgeText: 'text-violet-700',
          border: 'border-violet-300/80',
          accent: 'bg-violet-600',
          headerBg: 'bg-gradient-to-r from-violet-50 via-purple-50/40 to-white',
          lightBg: 'bg-violet-50/20'
        }
      ];

      return sortedDepts.map(([deptName, items], index) => {
        const theme = DEPT_THEMES[index % DEPT_THEMES.length];
        const normalCount = items.filter(i => i.status === '正常运行').length;
        const repairCount = items.filter(i => i.status === '故障待修').length;
        const maintenanceCount = items.filter(i => i.status === '维护保养中').length;
        const scrapCount = items.filter(i => i.status === '停用/报废').length;
        const totalValuation = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
        const totalHealth = items.reduce((sum, item) => sum + getEquipmentHealthScore(item).score, 0);
        const avgHealthScore = items.length > 0 ? Math.round(totalHealth / items.length) : 0;

        return {
          key: deptName,
          title: deptName,
          icon: Building2,
          theme,
          items,
          normalCount,
          repairCount,
          maintenanceCount,
          scrapCount,
          avgHealthScore,
          totalValuation
        };
      });
    }
  }, [groupBy, targetEquipment, localSearch]);

  // 全选/取消全选特定分组
  const handleToggleGroupSelection = (groupItems: MedicalEquipment[]) => {
    const itemIds = groupItems.map(i => i.id);
    const allSelected = itemIds.every(id => selectedIds.includes(id));
    if (onToggleSelectMultiple) {
      onToggleSelectMultiple(itemIds, !allSelected);
    } else {
      // 逐个切换
      itemIds.forEach(id => {
        const isSelected = selectedIds.includes(id);
        if (allSelected && isSelected) {
          onToggleSelectRow(id);
        } else if (!allSelected && !isSelected) {
          onToggleSelectRow(id);
        }
      });
    }
  };

  const renderStatusBadge = (status: EquipmentStatus, item: MedicalEquipment) => {
    switch (status) {
      case '正常运行':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs"></span>
            正常运行
          </span>
        );
      case '维护保养中':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-md text-xs font-bold inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs"></span>
            维护保养中
          </span>
        );
      case '故障待修':
        return (
          <div className="inline-flex items-center gap-1 shrink-0">
            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 rounded-md text-xs font-bold inline-flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-xs"></span>
              故障待修
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatusForDevice(item);
              }}
              className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold inline-flex items-center gap-0.5 shadow-2xs transition cursor-pointer"
              title="快速标记故障已排除并恢复正常运行"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>修复</span>
            </button>
          </div>
        );
      case '停用/报废':
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-bold inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            停用/报废
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold shrink-0">
            {status}
          </span>
        );
    }
  };

  const allGroupKeys = useMemo(() => groups.map(g => g.key), [groups]);
  const isAllCollapsed = allGroupKeys.length > 0 && allGroupKeys.every(k => collapsedGroups[k]);
  const totalCount = targetEquipment.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 overflow-hidden">
      {/* 1. 顶部控制栏：分类模式切换、快速统计、折叠控制与组内检索 */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs z-10">
        
        {/* 左侧：聚合维度切换（按设备状态 / 按所属科室） */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 select-none">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>卡片聚合维度:</span>
          </div>

          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeGroupBy('status')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                groupBy === 'status'
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="按设备状态（正常运行、故障待修、维护中、停用）自动归类聚合卡片"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>按「设备状态」分类</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
                groupBy === 'status' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                4态
              </span>
            </button>

            <button
              type="button"
              onClick={() => onChangeGroupBy('department')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                groupBy === 'department'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="按所属临床科室自动归类聚合设备卡片组"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>按「所属科室」分类</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
                groupBy === 'department' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {groups.length}科
              </span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1"></div>

          {/* 返回紧凑表格 */}
          <button
            type="button"
            onClick={onBackToTable}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="返回紧凑表格排版模式"
          >
            <Table2 className="w-3.5 h-3.5 text-slate-500" />
            <span>返回表格</span>
          </button>
        </div>

        {/* 右侧：折叠全部、局部检索与总数 */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 组内快速检索 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="在聚合卡片组中检索..."
              className="h-8 pl-8 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors w-44 sm:w-56"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* 全部展开/折叠 */}
          <button
            type="button"
            onClick={isAllCollapsed ? handleExpandAll : () => handleCollapseAll(allGroupKeys)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
            title={isAllCollapsed ? '展开所有聚合卡片组' : '折叠所有卡片组为摘要栏'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAllCollapsed ? '全部展开' : '全部折叠'}</span>
          </button>

          {/* 统计指标 */}
          <div className="text-xs text-slate-500 font-mono hidden md:flex items-center gap-1.5 pl-1">
            <span>已聚合</span>
            <strong className="text-blue-700 font-bold">{groups.length}</strong>
            <span>组 · 共</span>
            <strong className="text-slate-900 font-bold">{totalCount}</strong>
            <span>台设备</span>
          </div>
        </div>
      </div>

      {/* 2. 快速组锚点导航条（可横向滑动点击锚定） */}
      <div className="px-4 py-1.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 text-xs">
        <span className="text-xs font-bold text-slate-400 shrink-0 select-none">快速导航:</span>
        {groups.map(group => {
          const isCollapsed = collapsedGroups[group.key];
          const GroupIcon = group.icon;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => {
                // 点击如折叠则先展开
                if (isCollapsed) {
                  setCollapsedGroups(prev => ({ ...prev, [group.key]: false }));
                }
                const el = document.getElementById(`group-deck-${group.key}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 text-slate-700 font-medium flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-2xs"
            >
              <GroupIcon className="w-3 h-3 text-slate-500" />
              <span>{group.title}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${group.theme.badgeBg}`}>
                {group.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. 动态聚合卡片组内容列表 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {groups.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-2xs my-auto">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">未找到符合条件的设备卡片</p>
            <p className="text-xs text-slate-400 mt-1">请尝试修改关键字、科室或运行状态筛选条件</p>
          </div>
        ) : (
          groups.map(group => {
            const isCollapsed = collapsedGroups[group.key];
            const GroupIcon = group.icon;
            const groupItemIds = group.items.map(i => i.id);
            const isAllGroupSelected = group.items.length > 0 && groupItemIds.every(id => selectedIds.includes(id));
            const someGroupSelected = group.items.length > 0 && groupItemIds.some(id => selectedIds.includes(id)) && !isAllGroupSelected;
            const percentage = totalCount > 0 ? Math.round((group.items.length / totalCount) * 100) : 0;

            return (
              <div
                key={group.key}
                id={`group-deck-${group.key}`}
                className={`rounded-xl border ${group.theme.border} bg-white shadow-xs overflow-hidden transition-all duration-200`}
              >
                {/* 组头部栏 (Group Header) */}
                <div
                  onClick={() => toggleGroupCollapse(group.key)}
                  className={`px-4 py-3 ${group.theme.headerBg} border-b ${group.theme.border} flex items-center justify-between gap-3 cursor-pointer select-none transition-colors hover:brightness-98`}
                >
                  {/* 左侧：折叠箭头、全选复选框、组名、计数与占比 */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-black/5 transition text-slate-500 shrink-0"
                      title={isCollapsed ? '展开卡片组' : '折叠卡片组'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* 本组全选复选框 */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGroupSelection(group.items);
                      }}
                      className="flex items-center gap-1.5 p-1 rounded hover:bg-black/5 cursor-pointer shrink-0"
                      title={isAllGroupSelected ? '取消全选本组' : '全选本组所有设备'}
                    >
                      {isAllGroupSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : someGroupSelected ? (
                        <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-100 flex items-center justify-center">
                          <span className="w-2 h-0.5 bg-blue-600 rounded"></span>
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      )}
                    </div>

                    {/* 组图标与名称 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${group.theme.accent} shadow-2xs`}>
                        <GroupIcon className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                        {group.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${group.theme.badgeBg}`}>
                        {group.items.length} 台设备
                      </span>
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                        占比 {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* 中间/右侧：多维指标与折叠状态指示 */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* 指标胶囊群 */}
                    <div className="hidden lg:flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                      {/* 科室视图下显示正常与待修分解 */}
                      {groupBy === 'department' && (
                        <div className="flex items-center gap-2 bg-white/80 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
                          <span className="text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            正常: {group.normalCount}
                          </span>
                          {group.repairCount > 0 && (
                            <span className="text-rose-700 flex items-center gap-1 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              故障: {group.repairCount}
                            </span>
                          )}
                          {group.maintenanceCount > 0 && (
                            <span className="text-amber-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              维保: {group.maintenanceCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 平均健康分 */}
                      <span className="bg-white/80 px-2 py-1 rounded-md border border-slate-200/80 shadow-2xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-600" />
                        <span>平均健康:</span>
                        <strong className="text-cyan-700 font-bold">{group.avgHealthScore}分</strong>
                      </span>

                      {/* 资产净值/原值 */}
                      {group.totalValuation > 0 && (
                        <span className="bg-white/80 px-2 py-1 rounded-md border border-slate-200/80 shadow-2xs text-slate-700 font-mono">
                          资产净值: ¥{(group.totalValuation / 10000).toFixed(1)}万
                        </span>
                      )}
                    </div>

                    {/* 折叠/展开快捷按钮 */}
                    <span className="text-xs text-blue-600 font-semibold hidden sm:inline-block">
                      {isCollapsed ? '点击展开卡片' : '收起分组'}
                    </span>
                  </div>
                </div>

                {/* 折叠时显示预览条 (Mini summary strip) */}
                {isCollapsed && group.items.length > 0 && (
                  <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-150 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xs font-medium text-slate-400 shrink-0">本组设备预览:</span>
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {group.items.slice(0, 8).map(item => (
                          <img
                            key={item.id}
                            src={getEquipmentPhoto(item)}
                            alt={item.name}
                            className="w-7 h-7 rounded-md border-2 border-white object-cover bg-slate-200 shadow-2xs shrink-0"
                            title={`${item.name} (${item.model})`}
                          />
                        ))}
                      </div>
                      {group.items.length > 8 && (
                        <span className="text-xs font-mono font-bold text-slate-400 pl-1 shrink-0">
                          +{group.items.length - 8} 台
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-blue-600 font-medium hover:underline cursor-pointer" onClick={() => toggleGroupCollapse(group.key)}>
                      展开全部卡片 ({group.items.length})
                    </span>
                  </div>
                )}

                {/* 展开时渲染完整的卡片组网格 */}
                {!isCollapsed && (
                  <div className={`p-3.5 sm:p-4 ${group.theme.lightBg}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                      {group.items.map((item, itemIdx) => {
                        const isSelected = selectedIds.includes(item.id);
                        const photoUrl = getEquipmentPhoto(item);
                        const health = getEquipmentHealthScore(item);
                        const validity = getEquipmentValidityInfo(item);
                        const calInfo = getEquipmentCalibrationInfo(item);
                        const mNode = getEquipmentMaintenanceNode(item);
                        const isLoaned = Boolean(item.currentLoan && (item.currentLoan.loanStatus === 'borrowed' || item.currentLoan.loanStatus === 'overdue'));

                        return (
                          <div
                            key={item.id}
                            onClick={() => onViewDetails(item)}
                            className={`bg-white rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden cursor-pointer relative group ${
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/20'
                                : 'border-slate-200/90 hover:border-slate-300'
                            }`}
                          >
                            {/* 卡片顶栏：复选框、设备编号、状态徽章与健康分 */}
                            <div
                              className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-150 flex items-center justify-between gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => onToggleSelectRow(item.id)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 w-3.5 h-3.5"
                                  title={isSelected ? '取消选中' : '选中本设备'}
                                />
                                <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                                  #{itemIdx + 1}
                                </span>
                                {item.internalNo ? (
                                  <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 truncate" title={`临床自编号: ${item.internalNo}`}>
                                    {item.internalNo}
                                  </span>
                                ) : (
                                  <span className="text-xs font-mono text-slate-500 truncate" title={item.id}>
                                    {item.id}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {renderStatusBadge(item.status, item)}

                                {/* AI健康得分 */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onHealthScoreClick) onHealthScoreClick(item);
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-xs font-bold border inline-flex items-center gap-0.5 transition cursor-pointer hover:scale-105 ${health.badgeBg}`}
                                  title={`AI健康评估: ${health.score}分 (${health.label})，点击查看扣分归因`}
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-cyan-600 shrink-0" />
                                  <span>{health.score}分</span>
                                </button>
                              </div>
                            </div>

                            {/* 卡片主体：图片 + 规格 + 科室位置 */}
                            <div className="p-3.5 space-y-3 flex-1">
                              {/* 缩略图 + 标题型号 */}
                              <div className="flex items-start gap-3">
                                {/* 缩略图 */}
                                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group/img">
                                  <img
                                    src={photoUrl}
                                    alt={item.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewDevice(item);
                                      }}
                                      className="p-1 rounded bg-white/90 text-slate-800 hover:bg-white transition cursor-pointer shadow-xs"
                                      title="查看实物高清大图"
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUploadDevice(item);
                                      }}
                                      className="p-1 rounded bg-white/90 text-slate-800 hover:bg-white transition cursor-pointer shadow-xs"
                                      title="更换/上传现场实物照片"
                                    >
                                      <Camera className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* 设备名称、型号、厂商 */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 text-sm hover:text-blue-600 transition truncate" title={item.name}>
                                      {item.name}
                                    </span>
                                  </div>
                                  <p className="text-xs font-mono font-medium text-slate-600 mt-0.5 truncate" title={item.model}>
                                    型号: {item.model || '标准型'}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5 truncate" title={item.manufacturer}>
                                    厂商: {item.manufacturer || '国药/通用'}
                                  </p>
                                </div>
                              </div>

                              {/* 借调流转中徽标提示 */}
                              {isLoaned && item.currentLoan && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between text-xs">
                                  <LoanCountdownBadge loan={item.currentLoan} />
                                  <span className="text-amber-800 font-bold truncate max-w-[120px]">
                                    借至: {item.currentLoan.borrowingDepartment}
                                  </span>
                                </div>
                              )}

                              {/* 结构化元数据 2x2 网格 */}
                              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-150">
                                <div>
                                  <span className="text-slate-400 block text-xs">科室与位置</span>
                                  <span className="text-slate-700 font-medium truncate block mt-0.5" title={`${item.department} · ${item.location}`}>
                                    {item.department} · {item.location || '本室'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-xs">维保/强检节点</span>
                                  <span className="text-slate-700 font-medium truncate block mt-0.5" title={mNode.statusTag}>
                                    {mNode.statusTag}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-xs">原值/估值</span>
                                  <span className="text-slate-700 font-mono font-medium truncate block mt-0.5">
                                    {item.purchasePrice ? `¥${item.purchasePrice.toLocaleString()}` : '¥28,000'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-xs">药监22分类</span>
                                  <span className="text-slate-700 font-medium truncate block mt-0.5" title={resolveMainCategory(item.category)}>
                                    {resolveMainCategory(item.category)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 卡片底部操作栏 */}
                            <div
                              className="px-3.5 py-2 bg-slate-50/90 border-t border-slate-150 flex items-center justify-between gap-1 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onViewDetails(item)}
                                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="查看设备全息档案"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>详情</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onAddRepairForDevice(item)}
                                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="发起设备故障报修工单"
                                >
                                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                                  <span>报修</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onChangeStatusForDevice(item)}
                                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="变更当前运行状态"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>状态</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1 relative">
                                {onPrintQrLabel && (
                                  <button
                                    type="button"
                                    onClick={() => onPrintQrLabel(item)}
                                    className="p-1 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition shadow-2xs cursor-pointer"
                                    title="查看与打印草料合规标贴二维码"
                                  >
                                    <QrCode className="w-3.5 h-3.5 text-slate-700" />
                                  </button>
                                )}

                                {onAiDiagnoseDevice && (
                                  <button
                                    type="button"
                                    onClick={() => onAiDiagnoseDevice(item)}
                                    className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition shadow-2xs cursor-pointer"
                                    title="启动AI临床智维助手"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  </button>
                                )}

                                {/* 更多操作菜单 */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                    className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 transition shadow-2xs cursor-pointer"
                                    title="更多操作"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {activeMenuId === item.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setActiveMenuId(null)}
                                      />
                                      <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 text-xs">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onEditDevice(item);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                                        >
                                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                                          <span>编辑设备参数</span>
                                        </button>

                                        {onNavigateToInspection && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              onNavigateToInspection(item);
                                              setActiveMenuId(null);
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                                          >
                                            <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
                                            <span>PDA巡检打卡</span>
                                          </button>
                                        )}

                                        {onBorrowEquipment && !isLoaned && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              onBorrowEquipment(item);
                                              setActiveMenuId(null);
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                                          >
                                            <Building2 className="w-3.5 h-3.5 text-amber-600" />
                                            <span>跨科应急调配</span>
                                          </button>
                                        )}

                                        <div className="border-t border-slate-100 my-1" />

                                        <button
                                          type="button"
                                          onClick={() => {
                                            onDeleteDevice(item.id);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                          <span>删除设备条目</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 图片全屏大图预览弹窗 */}
      <ImagePreviewModal
        isOpen={!!previewDevice}
        equipment={previewDevice}
        photoUrl={previewDevice ? getEquipmentPhoto(previewDevice) : ''}
        onClose={() => setPreviewDevice(null)}
        onOpenEditPhoto={() => {
          const dev = previewDevice;
          setPreviewDevice(null);
          setUploadDevice(dev);
        }}
      />

      {/* 图片上传/更换弹窗 */}
      <PhotoUploadModal
        isOpen={!!uploadDevice}
        equipment={uploadDevice}
        currentPhotoUrl={uploadDevice ? getEquipmentPhoto(uploadDevice) : ''}
        onClose={() => setUploadDevice(null)}
        onPhotoUpdated={() => {
          setUploadDevice(null);
        }}
      />
    </div>
  );
};

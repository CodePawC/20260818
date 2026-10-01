import React, { useState, useMemo } from 'react';
import { EquipmentFilterState, SortField, SortOrder, ColumnVisibility, NmpaCategoryMasterItem, AuthUser, EquipmentViewMode, EquipmentQuickFilterKey } from '../types';
import { DEPARTMENTS, CATEGORIES } from '../mockData';
import { NMPA_22_MAIN_CATEGORIES } from '../utils/nmpaCategoryData';
import { 
  Search, 
  RotateCcw, 
  ArrowUpDown, 
  X, 
  Layers, 
  Columns, 
  SlidersHorizontal,
  Plus,
  Upload,
  QrCode,
  FileSpreadsheet,
  Building2,
  ChevronDown,
  Sparkles,
  Table2,
  LayoutGrid,
  Images
} from 'lucide-react';
import { 
  canAddEquipment, 
  canImportData, 
  canExportData, 
  isHeadNurse, 
  isClinicalStaff, 
  isHospitalWidePerspective,
  canViewAllEquipment,
  isDepartmentRestricted,
  getUserDepartment 
} from '../utils/authUtils';

interface EquipmentFilterBarProps {
  filterState: EquipmentFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<EquipmentFilterState>>;
  onReset: () => void;
  totalFilteredCount: number;
  departmentOptions?: string[];
  categoryMaster?: NmpaCategoryMasterItem[];
  density?: 'default' | 'compact';
  onToggleDensity?: () => void;
  splitCategories?: boolean;
  onToggleSplitCategories?: () => void;
  columnVisibility?: ColumnVisibility;
  onToggleColumn?: (key: keyof ColumnVisibility) => void;
  onResetColumnVisibility?: () => void;
  onSelectAllColumns?: (selectAll: boolean) => void;
  // 视图模式切换 (紧凑表格 | 大卡片平铺 | 设备照片流)
  viewMode?: EquipmentViewMode;
  onChangeViewMode?: (mode: EquipmentViewMode) => void;
  // 台账专属操作动作
  currentUser?: AuthUser | null;
  onOpenAddModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenQrModal?: () => void;
  onExportCsv?: () => void;
  onOpenAiDimensionModal?: () => void;
}

export const EquipmentFilterBar: React.FC<EquipmentFilterBarProps> = ({
  filterState,
  setFilterState,
  onReset,
  totalFilteredCount,
  departmentOptions,
  categoryMaster,
  density = 'default',
  onToggleDensity,
  splitCategories = false,
  onToggleSplitCategories,
  columnVisibility,
  onToggleColumn,
  onResetColumnVisibility,
  onSelectAllColumns,
  viewMode = 'compact_table',
  onChangeViewMode,
  currentUser,
  onOpenAddModal,
  onOpenImportModal,
  onOpenQrModal,
  onExportCsv,
  onOpenAiDimensionModal,
}) => {
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const allowAdd = currentUser ? canAddEquipment(currentUser) : true;
  const allowImport = currentUser ? canImportData(currentUser) : true;
  const allowExport = currentUser ? canExportData(currentUser) : true;

  const handleChange = (field: keyof EquipmentFilterState, value: string) => {
    setFilterState(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (val: string) => {
    setFilterState(prev => ({
      ...prev,
      category: val,
      level1Category: '' // reset subcategory on main category change
    }));
  };

  const currentSortKey = `${filterState.sortField || 'categoryNo'}-${filterState.sortOrder || 'asc'}`;

  const handleSortSelect = (value: string) => {
    const [field, order] = value.split('-') as [SortField, SortOrder];
    setFilterState(prev => ({
      ...prev,
      sortField: field,
      sortOrder: order
    }));
  };

  // Populate dynamic Department options (fallback to DEPARTMENTS mock)
  const departmentsList = departmentOptions && departmentOptions.length > 0 
    ? ['全部科室', ...departmentOptions]
    : DEPARTMENTS;

  // Extract NMPA 22 Main Categories
  const mainCategoriesList = useMemo(() => {
    if (categoryMaster && categoryMaster.length > 0) {
      const map = new Map<string, { code: string; name: string }>();
      
      // 1. First ensure all 22 official NMPA categories are seeded
      NMPA_22_MAIN_CATEGORIES.forEach(c => {
        map.set(c.code, { code: c.code, name: c.name });
      });

      // 2. Also incorporate any additional categories from master list
      categoryMaster.forEach(item => {
        if (item.categoryCode && item.categoryName && !map.has(item.categoryCode)) {
          map.set(item.categoryCode, { code: item.categoryCode, name: item.categoryName });
        }
      });

      return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code, 'zh-CN', { numeric: true }));
    }
    
    // Fallback to default mock categories
    return CATEGORIES.filter(c => c !== '全部分类').map(cat => {
      const match = cat.match(/^(\d{2})/);
      return {
        code: match ? match[1] : '',
        name: cat
      };
    });
  }, [categoryMaster]);

  // Extract selected category 2-digit code
  const selectedCategoryCode = useMemo(() => {
    if (!filterState.category) return '';
    const match = filterState.category.match(/^(\d{2})/);
    return match ? match[1] : '';
  }, [filterState.category]);

  // Extract Level 1 subcategories (1级分类) available under selected category from master data
  const availableLevel1Categories = useMemo(() => {
    if (!selectedCategoryCode || !categoryMaster || categoryMaster.length === 0) return [];
    const level1Map = new Map<string, { code: string; name: string }>();
    categoryMaster
      .filter(item => item.categoryCode === selectedCategoryCode)
      .forEach(item => {
        if (item.level1Code && item.level1Name && !level1Map.has(item.level1Code)) {
          level1Map.set(item.level1Code, { code: item.level1Code, name: `${item.level1Code} ${item.level1Name}` });
        }
      });
    return Array.from(level1Map.values()).sort((a, b) => a.code.localeCompare(b.code, 'zh-CN', { numeric: true }));
  }, [selectedCategoryCode, categoryMaster]);

  const hasActiveFilters =
    Boolean(filterState.keyword) ||
    Boolean(filterState.department) ||
    Boolean(filterState.category) ||
    Boolean(filterState.level1Category) ||
    Boolean(filterState.status) ||
    Boolean(filterState.loanStatus) ||
    Boolean(filterState.validityRisk) ||
    Boolean(filterState.overdueStatus) ||
    Boolean(filterState.calibrationStatus) ||
    Boolean(filterState.quickFilter && filterState.quickFilter !== 'all');

  return (
    <div className="px-4 py-2.5 border-b border-slate-200/80 bg-white flex-none flex flex-col gap-2.5 shadow-2xs">
      
      {/* 行 1: 台账核心业务工具栏 (大气、开阔、高频操作聚合) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* 左侧：搜索框与台账数量 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <input
              type="text"
              value={filterState.keyword}
              onChange={(e) => handleChange('keyword', e.target.value)}
              placeholder="按设备名称、内部编号、出厂SN搜索..."
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs sm:text-sm w-64 lg:w-80 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder-slate-400 font-medium transition shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {filterState.keyword && (
              <button
                type="button"
                onClick={() => handleChange('keyword', '')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs sm:text-sm text-slate-600 font-medium whitespace-nowrap">
            共 <strong className="text-blue-600 font-bold font-mono text-sm sm:text-base">{totalFilteredCount}</strong> 台
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
              title="重置所有筛选条件"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>清空筛选</span>
            </button>
          )}
        </div>

        {/* 右侧：台账操作功能菜单（集成业务操作、视图模式切换、分类排版与列配置） */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* AI 交互式多维研判中心快捷入口 */}
          {onOpenAiDimensionModal && (
            <button
              type="button"
              onClick={() => onOpenAiDimensionModal()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer select-none bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white"
              title="AI 医疗设备多维度智能研判"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>AI 多维研判</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* 整合台账操作菜单：新增设备、批量导入、二维码、导出、视图模式、排版与列配置 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsActionsMenuOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer select-none ${
                isActionsMenuOpen
                  ? 'bg-blue-700 text-white ring-2 ring-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
              }`}
              title="台账操作菜单"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>台账操作</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isActionsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isActionsMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setIsActionsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                  <div className="flex flex-col gap-0.5">
                    {/* 0. AI 多维智能研判 */}
                    {onOpenAiDimensionModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          onOpenAiDimensionModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">AI 多维研判</span>
                      </button>
                    )}

                    {/* 1. 新增设备 */}
                    {allowAdd && onOpenAddModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          onOpenAddModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-800 transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">新增设备建档</span>
                      </button>
                    )}

                    {/* 2. 批量导入 */}
                    {allowImport && onOpenImportModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          onOpenImportModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-800 transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">批量导入台账</span>
                      </button>
                    )}

                    {/* 3. 二维码标签 */}
                    {onOpenQrModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          onOpenQrModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-800 transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <QrCode className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-slate-800 group-hover:text-emerald-600 transition-colors">二维码 / 标签</span>
                      </button>
                    )}

                    {/* 4. 导出台账 */}
                    {allowExport && onExportCsv && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          onExportCsv();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-800 transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-slate-800 group-hover:text-slate-900 transition-colors">导出台账报表</span>
                      </button>
                    )}

                    {/* 5. 视图模式切换（隐藏到台账操作中） */}
                    {onChangeViewMode && (
                      <div className="pt-2 mt-1.5 border-t border-slate-100">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>视图模式</span>
                          <span className="text-[10px] text-blue-600 font-semibold">
                            {viewMode === 'card_grid' ? '卡片矩阵' : viewMode === 'photo_stream' ? '照片流' : '紧凑表格'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100 mt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              onChangeViewMode('compact_table');
                              setIsActionsMenuOpen(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                              viewMode === 'compact_table'
                                ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                            title="紧凑表格视图"
                          >
                            <Table2 className="w-3.5 h-3.5" />
                            <span>表格</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onChangeViewMode('card_grid');
                              setIsActionsMenuOpen(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                              viewMode === 'card_grid'
                                ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                            title="卡片矩阵视图"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>卡片</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onChangeViewMode('photo_stream');
                              setIsActionsMenuOpen(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                              viewMode === 'photo_stream'
                                ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                            title="实物照片流视图"
                          >
                            <Images className="w-3.5 h-3.5" />
                            <span>照片流</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 6. 表格排版与显示设置（分类合并、紧凑、列配置） */}
                    <div className="pt-2 mt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                      <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        表格排版与显示
                      </div>

                      {/* 分类分列 / 分类合并 */}
                      {onToggleSplitCategories && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleSplitCategories();
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors text-left cursor-pointer"
                          title={splitCategories ? '当前: 3列独立分列显示 (点击切换为1列合并)' : '当前: 1列合并显示 (点击切换为3列独立分列)'}
                        >
                          <div className="flex items-center gap-2">
                            <Columns className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium">分类显示</span>
                          </div>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            splitCategories ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {splitCategories ? '分类分列' : '分类合并'}
                          </span>
                        </button>
                      )}

                      {/* 紧凑 / 标准行距 */}
                      {onToggleDensity && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleDensity();
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors text-left cursor-pointer"
                          title={density === 'compact' ? '当前: 紧凑行距 (点击切换标准)' : '当前: 标准行距 (点击切换紧凑)'}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium">行距密度</span>
                          </div>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            density === 'compact' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {density === 'compact' ? '紧凑' : '标准'}
                          </span>
                        </button>
                      )}

                      {/* 自定义表头列配置 */}
                      {columnVisibility && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsActionsMenuOpen(false);
                            setIsColumnConfigOpen(true);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors text-left cursor-pointer"
                          title="自定义显隐列"
                        >
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium">自定义列配置</span>
                          </div>
                          <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5">
                            设置 ➔
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 行 2: 细化多维度过滤选择器 (科室、分类、状态、计量、排序) */}
      <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-none py-0.5">
        {/* 科室专属视角过滤 */}
        {(() => {
          const userDept = getUserDepartment(currentUser);
          const isRestricted = isDepartmentRestricted(currentUser);

          if (isRestricted && userDept) {
            return (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50/90 border border-blue-200/80 rounded-md text-xs font-semibold text-blue-800 shrink-0 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>科室: {userDept}</span>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={filterState.department}
                onChange={(e) => handleChange('department', e.target.value === '全部科室' ? '' : e.target.value)}
                className={`px-2 py-1 border rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-100 cursor-pointer ${
                  filterState.department
                    ? 'bg-blue-50/90 border-blue-300 text-blue-800 font-bold'
                    : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept === '全部科室' ? '' : dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {filterState.department && (
                <button
                  type="button"
                  onClick={() => handleChange('department', '')}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-2xs"
                  title="恢复全院视角"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>全院</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* NMPA 22 Main Category */}
        <select
          value={filterState.category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="px-2 py-1 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer max-w-[150px] truncate"
          title="国家药监局 (NMPA) 22类医疗器械分类"
        >
          <option value="">全部分类 (22类)</option>
          {mainCategoriesList.map((cat) => {
            const displayName = cat.name.startsWith(cat.code) ? cat.name : `${cat.code} ${cat.name}`;
            return (
              <option key={cat.code} value={cat.name}>
                {displayName}
              </option>
            );
          })}
        </select>

        {/* Level 1 Subcategory */}
        {selectedCategoryCode && availableLevel1Categories.length > 0 && (
          <select
            value={filterState.level1Category || ''}
            onChange={(e) => handleChange('level1Category', e.target.value)}
            className="px-2 py-1 bg-blue-50/80 border border-blue-200 text-blue-800 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-100 cursor-pointer max-w-[150px] truncate animate-in fade-in duration-150"
            title="选择一级子分类"
          >
            <option value="">全部一级分类</option>
            {availableLevel1Categories.map((sub) => (
              <option key={sub.code} value={sub.name}>
                {sub.name}
              </option>
            ))}
          </select>
        )}

        {/* Operational Status */}
        <select
          value={filterState.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="px-2 py-1 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="正常运行">🟢 正常运行</option>
          <option value="维护保养中">🟡 维护保养中</option>
          <option value="故障待修">🔴 故障待修</option>
          <option value="已报废">⚫ 已报废</option>
        </select>

        {/* Loan & Circulation Status */}
        <select
          value={filterState.loanStatus || ''}
          onChange={(e) => handleChange('loanStatus', e.target.value)}
          className={`px-2 py-1 border rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-100 cursor-pointer ${
            filterState.loanStatus
              ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
              : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
          title="按科室流转状态过滤"
        >
          <option value="">全部流转</option>
          <option value="self_use">🏠 本科室在库</option>
          <option value="lent_out">🔄 跨科借出</option>
          <option value="borrowed_in">📥 跨科借入</option>
          <option value="overdue">🚨 借用超期</option>
        </select>

        {/* Metrology & Calibration Status */}
        <select
          value={filterState.calibrationStatus || ''}
          onChange={(e) => handleChange('calibrationStatus', e.target.value)}
          className="px-2 py-1 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          title="按计量定标状态过滤"
        >
          <option value="">全部计量</option>
          <option value="valid">⚖️ 强检合格</option>
          <option value="due_soon">⚖️ 临期待检</option>
          <option value="overdue">🚨 强检脱检</option>
          <option value="warning">⚡ 计量异常</option>
          <option value="exempt">⚪ 非强检</option>
        </select>

        {/* Overdue / Lifespan Status */}
        <select
          value={filterState.overdueStatus || ''}
          onChange={(e) => handleChange('overdueStatus', e.target.value)}
          className={`px-2 py-1 border rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-100 cursor-pointer ${
            filterState.overdueStatus
              ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
              : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
          title="按服役寿命及备案状态过滤"
        >
          <option value="">全部寿命状态</option>
          <option value="filed_permitted">🛡️ 超期特许准用</option>
          <option value="unfiled_pending">⚠️ 超期待备案</option>
          <option value="near_expiry">⏳ 寿命临期</option>
          <option value="all_overdue">📜 全部超期设备</option>
        </select>

        {/* 快速筛选下拉框 (与排序位于同一行) */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-400">快速筛选:</span>
          <select
            value={filterState.quickFilter || 'all'}
            onChange={(e) => handleChange('quickFilter', e.target.value)}
            className={`px-2 py-1 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-100 cursor-pointer ${
              filterState.quickFilter && filterState.quickFilter !== 'all'
                ? 'bg-amber-50 border border-amber-300 text-amber-900 font-bold'
                : 'bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
            title="常用状态与特殊设备快速筛选"
          >
            <option value="all">⚡ 全部设备</option>
            <option value="pending_repair">🔧 待维修 (故障/保养)</option>
            <option value="high_value">💰 高价值设备 (≥50万)</option>
            <option value="low_health">📉 健康预警 (&lt;80分)</option>
            <option value="calibration_due">⚖️ 计量待校准/脱检</option>
            <option value="overdue_service">⏳ 超期/近失效设备</option>
            <option value="in_loan">🔄 跨科借调流转中</option>
            <option value="with_real_photo">📷 有实物照片</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[11px] font-bold text-slate-400">排序:</span>
          <select
            value={currentSortKey}
            onChange={(e) => handleSortSelect(e.target.value)}
            className="px-2 py-1 bg-blue-50/80 border border-blue-200 rounded-md text-xs font-medium text-blue-800 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="categoryNo-asc">分类编号 (升序)</option>
            <option value="categoryNo-desc">分类编号 (降序)</option>
            <option value="level1No-asc">1级分类 (升序)</option>
            <option value="level1No-desc">1级分类 (降序)</option>
            <option value="department-asc">使用科室 (A→Z)</option>
            <option value="department-desc">使用科室 (Z→A)</option>
            <option value="id-asc">设备编号 (小→大)</option>
            <option value="id-desc">设备编号 (大→小)</option>
            <option value="name-asc">设备名称 (A→Z)</option>
            <option value="sn-asc">SN 序列号 (A→Z)</option>
            <option value="purchasePrice-desc">购置金额 (高→低)</option>
            <option value="purchasePrice-asc">购置金额 (低→高)</option>
            <option value="repairCount-desc">维修次数 (高→低)</option>
            <option value="enableDate-desc">投用时间 (最新)</option>
          </select>
        </div>
      </div>

      {/* 单一整合的高效生效筛选气泡栏 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">生效筛选:</span>
          {filterState.keyword && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
              <span>关键词: {filterState.keyword}</span>
              <button type="button" onClick={() => handleChange('keyword', '')} className="hover:text-blue-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.department && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
              <span>科室: {filterState.department}</span>
              <button type="button" onClick={() => handleChange('department', '')} className="hover:text-slate-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
              <span>分类: {filterState.category}</span>
              <button type="button" onClick={() => handleCategoryChange('')} className="hover:text-indigo-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.level1Category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
              <span>一级分类: {filterState.level1Category}</span>
              <button type="button" onClick={() => handleChange('level1Category', '')} className="hover:text-indigo-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
              <span>状态: {filterState.status}</span>
              <button type="button" onClick={() => handleChange('status', '')} className="hover:text-emerald-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.loanStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
              <span>流转: {filterState.loanStatus}</span>
              <button type="button" onClick={() => handleChange('loanStatus', '')} className="hover:text-amber-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.calibrationStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px]">
              <span>计量: {filterState.calibrationStatus}</span>
              <button type="button" onClick={() => handleChange('calibrationStatus', '')} className="hover:text-purple-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.overdueStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
              <span>寿命: {filterState.overdueStatus}</span>
              <button type="button" onClick={() => handleChange('overdueStatus', '')} className="hover:text-amber-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.quickFilter && filterState.quickFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
              <span>
                快速筛选:{' '}
                {filterState.quickFilter === 'pending_repair'
                  ? '待维修'
                  : filterState.quickFilter === 'high_value'
                  ? '高价值(≥50万)'
                  : filterState.quickFilter === 'low_health'
                  ? '健康评分预警'
                  : filterState.quickFilter === 'calibration_due'
                  ? '计量待校准'
                  : filterState.quickFilter === 'overdue_service'
                  ? '超期/近失效'
                  : filterState.quickFilter === 'in_loan'
                  ? '跨科借调'
                  : filterState.quickFilter === 'with_real_photo'
                  ? '有实物照片'
                  : filterState.quickFilter}
              </span>
              <button type="button" onClick={() => handleChange('quickFilter', 'all')} className="hover:text-amber-900 cursor-pointer p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium ml-1 cursor-pointer underline underline-offset-2"
          >
            清空所有
          </button>
        </div>
      )}

      {/* 自定义表头列配置模态弹窗 (由台账操作菜单调起) */}
      {isColumnConfigOpen && columnVisibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0 cursor-default"
            onClick={() => setIsColumnConfigOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-10 text-xs w-full max-w-xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5 shrink-0">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>台账表头列自定义配置</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                {onSelectAllColumns && (
                  <button
                    type="button"
                    onClick={() => onSelectAllColumns(true)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer font-semibold"
                  >
                    全选
                  </button>
                )}
                <span className="text-slate-300">|</span>
                {onResetColumnVisibility && (
                  <button
                    type="button"
                    onClick={onResetColumnVisibility}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                  >
                    恢复默认
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsColumnConfigOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 -mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {/* 分组 1: 核心基础与临床标识 */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-blue-600 rounded-xs"></span>
                  <span>核心基础与临床标识</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.indexNumber}
                      onChange={() => onToggleColumn?.('indexNumber')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">序号 (行号)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.id}
                      onChange={() => onToggleColumn?.('id')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">设备ID</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.nameModel}
                      onChange={() => onToggleColumn?.('nameModel')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-bold">设备名称 & 型号 (含内部编号)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.status}
                      onChange={() => onToggleColumn?.('status')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-bold">运行状态</span>
                  </label>
                </div>
              </div>

              {/* 分组 2: 分类层级 */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-indigo-600 rounded-xs"></span>
                  <span>国家药监 (NMPA) 分类</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.category}
                      onChange={() => onToggleColumn?.('category')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">大类</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.level1Category}
                      onChange={() => onToggleColumn?.('level1Category')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">一级分类</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.level2Category}
                      onChange={() => onToggleColumn?.('level2Category')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">二级分类</span>
                  </label>
                </div>
              </div>

              {/* 分组 3: 制造与出厂信息 */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-amber-600 rounded-xs"></span>
                  <span>出厂与服役生命周期</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.sn}
                      onChange={() => onToggleColumn?.('sn')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">出厂编号 (SN)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.manufacturer}
                      onChange={() => onToggleColumn?.('manufacturer')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">生产厂家</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.manufactureDate}
                      onChange={() => onToggleColumn?.('manufactureDate')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">生产日期 / 设计寿命</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.enableDate}
                      onChange={() => onToggleColumn?.('enableDate')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">投用时间</span>
                  </label>
                </div>
              </div>

              {/* 分组 4: 科室与使用场所 */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  <span>使用科室与存放场所</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.department}
                      onChange={() => onToggleColumn?.('department')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">使用科室</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.usageLocation}
                      onChange={() => onToggleColumn?.('usageLocation')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">具体使用场所</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.location}
                      onChange={() => onToggleColumn?.('location')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">存放位置 (楼宇/楼层)</span>
                  </label>
                </div>
              </div>

              {/* 分组 5: 计量、维保与AI评估 */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-cyan-600 rounded-xs"></span>
                  <span>计量检定与智能运维</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.calibration}
                      onChange={() => onToggleColumn?.('calibration')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">法定计量 / 周期检定</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.repairStats}
                      onChange={() => onToggleColumn?.('repairStats')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">累计维保 / 支出费用</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.healthScore}
                      onChange={() => onToggleColumn?.('healthScore')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">AI健康评分</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.maintenanceNode}
                      onChange={() => onToggleColumn?.('maintenanceNode')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">保养节点 / 状态</span>
                  </label>
                </div>
              </div>

              {/* 分组 6: 资产台账与追溯 (最右侧区) */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-purple-600 rounded-xs"></span>
                  <span>资产台账与溯源 (列表最右侧)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.purchasePrice}
                      onChange={() => onToggleColumn?.('purchasePrice')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">购置金额 (元)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.assetNo}
                      onChange={() => onToggleColumn?.('assetNo')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">资产编号</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.assetOwnership}
                      onChange={() => onToggleColumn?.('assetOwnership')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">资产归属</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition select-none">
                    <input
                      type="checkbox"
                      checked={columnVisibility.codeId}
                      onChange={() => onToggleColumn?.('codeId')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">code_id (溯源码)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>自定义设置已自动即时保存</span>
              <button
                type="button"
                onClick={() => setIsColumnConfigOpen(false)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-95 cursor-pointer transition shadow-2xs"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

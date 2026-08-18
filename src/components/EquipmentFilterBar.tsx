import React, { useState, useMemo } from 'react';
import { EquipmentFilterState, SortField, SortOrder, ColumnVisibility, NmpaCategoryMasterItem, AuthUser } from '../types';
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
  Building2
} from 'lucide-react';
import { 
  canAddEquipment, 
  canImportData, 
  canExportData, 
  isHeadNurse, 
  isClinicalStaff, 
  isHospitalWidePerspective,
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
  // 台账专属操作动作
  currentUser?: AuthUser | null;
  onOpenAddModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenQrModal?: () => void;
  onExportCsv?: () => void;
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
  splitCategories = true,
  onToggleSplitCategories,
  columnVisibility,
  onToggleColumn,
  onResetColumnVisibility,
  onSelectAllColumns,
  currentUser,
  onOpenAddModal,
  onOpenImportModal,
  onOpenQrModal,
  onExportCsv,
}) => {
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

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
    Boolean(filterState.validityRisk) ||
    Boolean(filterState.calibrationStatus);

  return (
    <div className="px-3.5 py-2 border-b border-slate-100 bg-white flex-none flex flex-col gap-2">
      
      {/* 行 1: 台账核心业务工具栏 (台账专属按钮沉淀在此) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* 左侧：搜索框与台账数量 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <input
              type="text"
              value={filterState.keyword}
              onChange={(e) => handleChange('keyword', e.target.value)}
              placeholder="查找设备名称、SN、出厂编号、负责人..."
              className="pl-8 pr-2.5 py-1.5 bg-slate-100 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs w-60 lg:w-72 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder-slate-400 font-medium transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {filterState.keyword && (
              <button
                type="button"
                onClick={() => handleChange('keyword', '')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            共筛选出 <strong className="text-blue-600 font-bold">{totalFilteredCount}</strong> 台设备
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-semibold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="重置所有筛选条件"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              重置筛选
            </button>
          )}
        </div>

        {/* 右侧：台账专属业务操作按钮组 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 视图排版切换 */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 text-xs">
            {onToggleSplitCategories && (
              <button
                type="button"
                onClick={onToggleSplitCategories}
                className={`px-2 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                  splitCategories
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={splitCategories ? '当前: 3列独立分列显示 (点击切换为1列合并)' : '当前: 1列合并显示 (点击切换为3列独立分列)'}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{splitCategories ? '分类分列' : '分类合并'}</span>
              </button>
            )}

            {onToggleDensity && (
              <button
                type="button"
                onClick={onToggleDensity}
                className={`px-2 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                  density === 'compact'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={density === 'compact' ? '当前: 紧凑行距 (点击切换标准)' : '当前: 标准行距 (点击切换紧凑)'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{density === 'compact' ? '紧凑' : '标准'}</span>
              </button>
            )}

            {/* 列配置弹窗 */}
            {columnVisibility && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColumnConfigOpen(!isColumnConfigOpen)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                    isColumnConfigOpen
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="自定义显隐列"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">列配置</span>
                </button>

                {isColumnConfigOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setIsColumnConfigOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                          <span>表头列显示配置</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          {onSelectAllColumns && (
                            <button
                              type="button"
                              onClick={() => onSelectAllColumns(true)}
                              className="text-blue-600 hover:underline cursor-pointer font-medium"
                            >
                              全选
                            </button>
                          )}
                          {onResetColumnVisibility && (
                            <button
                              type="button"
                              onClick={onResetColumnVisibility}
                              className="text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                            >
                              重置
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            标识与编号
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.indexNumber}
                                onChange={() => onToggleColumn?.('indexNumber')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">序号 (数字)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.id}
                                onChange={() => onToggleColumn?.('id')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">设备ID</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.sn}
                                onChange={() => onToggleColumn?.('sn')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">出厂编号 (SN)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.manufacturer}
                                onChange={() => onToggleColumn?.('manufacturer')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">生产厂家</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            分类结构
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.category}
                                onChange={() => onToggleColumn?.('category')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">大类分类</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.level1Category}
                                onChange={() => onToggleColumn?.('level1Category')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">一级分类</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.level2Category}
                                onChange={() => onToggleColumn?.('level2Category')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">二级分类</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            位置与资产
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.department}
                                onChange={() => onToggleColumn?.('department')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">使用科室</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.location}
                                onChange={() => onToggleColumn?.('location')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">楼号/楼层</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.manager}
                                onChange={() => onToggleColumn?.('manager')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">责任人</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition select-none">
                              <input
                                type="checkbox"
                                checked={columnVisibility.purchasePrice}
                                onChange={() => onToggleColumn?.('purchasePrice')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-slate-700 font-medium">购置金额</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>偏好已自动同步至缓存</span>
                        <button
                          type="button"
                          onClick={() => setIsColumnConfigOpen(false)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 cursor-pointer transition"
                        >
                          确定
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* 专属操作：批量导入 */}
          {allowImport && onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="上传或粘贴 Excel / CSV 批量导入设备台账"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>批量导入</span>
            </button>
          )}

          {/* 专属操作：二维码标签 */}
          {onOpenQrModal && (
            <button
              type="button"
              onClick={onOpenQrModal}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="批量打印/生成设备条码与二维码标签"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>二维码标签</span>
            </button>
          )}

          {/* 专属操作：导出 */}
          {allowExport && onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="导出当前台账为 CSV / Excel 报表"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>导出台账</span>
            </button>
          )}

          {/* 专属操作：新增设备 */}
          {allowAdd && onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="建档登记新医疗设备"
            >
              <Plus className="w-4 h-4" />
              <span>新增设备</span>
            </button>
          )}
        </div>
      </div>

      {/* 行 2: 细化多维度过滤选择器 (科室、分类、状态、计量、排序) */}
      <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-none py-0.5">
        {/* Department select: 护士长仅展示所属科室（严格限定权限），其他角色可自由选择 */}
        {(() => {
          const userDept = getUserDepartment(currentUser);
          const isWide = isHospitalWidePerspective(currentUser);

          if (isHeadNurse(currentUser) && userDept) {
            return (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50/90 border border-rose-300 rounded-md text-xs font-bold text-rose-800 shrink-0">
                <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>所属科室: {userDept} (专属台账)</span>
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
                    {dept === '全部科室' ? '全部科室 (全院视角)' : dept}
                  </option>
                ))}
              </select>

              {/* 如果是全院医工/管理角色，在筛选了具体科室时提供一键恢复全院视角按钮 */}
              {isWide && filterState.department && (
                <button
                  type="button"
                  onClick={() => handleChange('department', '')}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-2xs"
                  title="点击立即恢复为全院所有设备台账视角"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>恢复全院视角</span>
                </button>
              )}

              {/* 如果是临床科室专属人员（非医疗设备科/医工），展示一键锁定自己科室/全院按钮 */}
              {!isWide && userDept && (
                <button
                  type="button"
                  onClick={() => handleChange('department', filterState.department === userDept ? '' : userDept)}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    filterState.department === userDept
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                  title={filterState.department === userDept ? '点击查看全院所有科室设备' : `点击快速锁定查看【${userDept}】台账`}
                >
                  <span>{filterState.department === userDept ? `已锁定${userDept}` : `仅看${userDept}`}</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* NMPA 22 Main Category */}
        <select
          value={filterState.category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="px-2 py-1 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer max-w-[160px] truncate"
          title="国家药监局 (NMPA) 22类医疗器械大类分类"
        >
          <option value="">全部分类 (22大类)</option>
          {mainCategoriesList.map((cat) => (
            <option key={cat.code} value={cat.name}>
              {cat.code} {cat.name}
            </option>
          ))}
        </select>

        {/* Level 1 Subcategory */}
        {selectedCategoryCode && availableLevel1Categories.length > 0 && (
          <select
            value={filterState.level1Category || ''}
            onChange={(e) => handleChange('level1Category', e.target.value)}
            className="px-2 py-1 bg-blue-50/80 border border-blue-200 text-blue-800 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-100 cursor-pointer max-w-[160px] truncate animate-in fade-in duration-150"
            title="选择当前大类下的一级子分类"
          >
            <option value="">全部一级分类 ({availableLevel1Categories.length}项)</option>
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
          <option value="">全部运行状态</option>
          <option value="正常运行">🟢 正常运行</option>
          <option value="维护保养中">🟡 维护保养中</option>
          <option value="故障待修">🔴 故障待修</option>
          <option value="已报废">⚫ 已报废</option>
        </select>

        {/* Metrology & Calibration Status */}
        <select
          value={filterState.calibrationStatus || ''}
          onChange={(e) => handleChange('calibrationStatus', e.target.value)}
          className="px-2 py-1 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          title="按法定计量强检证书与周期定标合规状态过滤"
        >
          <option value="">全部计量状态</option>
          <option value="valid">⚖️ 强检合格 (有效)</option>
          <option value="due_soon">⚖️ 临期待检 (需送检)</option>
          <option value="overdue">🚨 强检脱检 (超期告警)</option>
          <option value="warning">⚡ 计量异常 (脱检/临期)</option>
          <option value="exempt">⚪ 免计量/非强检</option>
        </select>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">排序:</span>
          <select
            value={currentSortKey}
            onChange={(e) => handleSortSelect(e.target.value)}
            className="px-2 py-1 bg-blue-50/80 border border-blue-200 rounded-md text-xs font-medium text-blue-800 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="categoryNo-asc">大类编号 升序 (03, 06...)</option>
            <option value="categoryNo-desc">大类编号 降序</option>
            <option value="level1No-asc">1级分类编号 升序</option>
            <option value="level1No-desc">1级分类编号 降序</option>
            <option value="department-asc">使用科室 (A→Z)</option>
            <option value="department-desc">使用科室 (Z→A)</option>
            <option value="id-asc">设备ID (小→大)</option>
            <option value="id-desc">设备ID (大→小)</option>
            <option value="name-asc">设备名称 (A→Z)</option>
            <option value="sn-asc">SN 序列号 (A→Z)</option>
            <option value="purchasePrice-desc">购置金额 (高→低)</option>
            <option value="purchasePrice-asc">购置金额 (低→高)</option>
            <option value="repairCount-desc">累计维修次数 (高→低)</option>
            <option value="enableDate-desc">投用时间 (最新在前)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">已设筛选:</span>
          {filterState.keyword && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md text-[11px]">
              搜索: <strong>{filterState.keyword}</strong>
              <button type="button" onClick={() => handleChange('keyword', '')} className="hover:text-blue-900 cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.department && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md text-[11px]">
              科室: <strong>{filterState.department}</strong>
              <button type="button" onClick={() => handleChange('department', '')} className="hover:text-slate-900 cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.category && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md text-[11px]">
              类别: <strong>{filterState.category}</strong>
              <button type="button" onClick={() => handleChange('category', '')} className="hover:text-slate-900 cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterState.status && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
              状态: <strong>{filterState.status}</strong>
              <button type="button" onClick={() => handleChange('status', '')} className="hover:text-amber-950 cursor-pointer ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

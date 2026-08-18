import React, { useState, useMemo } from 'react';
import { 
  NmpaCategoryMasterItem, 
  MedicalEquipment 
} from '../types';
import { 
  Tag, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldAlert, 
  ShieldCheck, 
  Check, 
  X, 
  Layers, 
  BookOpen, 
  Sparkles, 
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Filter
} from 'lucide-react';
import { NMPA_22_MAIN_CATEGORIES, DEFAULT_NMPA_CATEGORY_MASTER } from '../utils/nmpaCategoryData';

interface NmpaCategoryTabProps {
  categoryMaster: NmpaCategoryMasterItem[];
  equipmentList: MedicalEquipment[];
  onUpdateCategoryMaster: (categories: NmpaCategoryMasterItem[]) => void;
  onResetDefaults?: () => void;
}

export const NmpaCategoryTab: React.FC<NmpaCategoryTabProps> = ({
  categoryMaster,
  equipmentList,
  onUpdateCategoryMaster,
  onResetDefaults
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState<string>('ALL');
  const [selectedRiskClass, setSelectedRiskClass] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<NmpaCategoryMasterItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // 统计各分类下关联的医院现有设备台数
  const equipmentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    equipmentList.forEach(eq => {
      if (eq.category) {
        map.set(eq.category, (map.get(eq.category) || 0) + 1);
      }
      if (eq.level2Category) {
        map.set(eq.level2Category, (map.get(eq.level2Category) || 0) + 1);
      }
    });
    return map;
  }, [equipmentList]);

  // 过滤分类列表
  const filteredList = useMemo(() => {
    return categoryMaster.filter(item => {
      const matchSearch = 
        !searchQuery ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.level1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.level2Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productExamples.some(ex => ex.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.matchKeywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMainCat = 
        selectedMainCat === 'ALL' || 
        item.categoryCode === selectedMainCat ||
        item.categoryName.startsWith(selectedMainCat);

      const matchRisk = 
        selectedRiskClass === 'ALL' || 
        item.riskClass.includes(selectedRiskClass);

      return matchSearch && matchMainCat && matchRisk;
    });
  }, [categoryMaster, searchQuery, selectedMainCat, selectedRiskClass]);

  // 总页数与当前页切片
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (currentPage !== validCurrentPage && filteredList.length > 0) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedList = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, validCurrentPage, pageSize]);

  const handlePageChange = (page: number) => {
    const target = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(target);
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpPageInput('');
    }
  };

  // 表单状态
  const [formData, setFormData] = useState<Partial<NmpaCategoryMasterItem>>({
    categoryCode: '01',
    categoryName: '01 有源手术器械',
    level1Code: '01-01',
    level1Name: '',
    level2Code: '01',
    level2Name: '',
    productExamples: [],
    riskClass: 'II类',
    matchKeywords: [],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  });

  const [keywordsText, setKeywordsText] = useState('');
  const [examplesText, setExamplesText] = useState('');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `CAT-MANUAL-${Date.now()}`,
      categoryCode: '01',
      categoryName: '01 有源手术器械',
      level1Code: '01-01',
      level1Name: '',
      level2Code: '01',
      level2Name: '',
      productExamples: [],
      riskClass: 'II类',
      matchKeywords: [],
      defaultDepreciationYears: 8,
      defaultMaintenanceCycleMonths: 6,
      defaultMetrologyType: 'periodic_calibration',
      status: 'active'
    });
    setKeywordsText('');
    setExamplesText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: NmpaCategoryMasterItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setKeywordsText(item.matchKeywords.join('，'));
    setExamplesText(item.productExamples.join('，'));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要从主数据中删除该品类定义吗？')) {
      onUpdateCategoryMaster(categoryMaster.filter(c => c.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryName || !formData.level1Name || !formData.level2Name) {
      alert('请填写完整的大类、一级分类与二级分类名称');
      return;
    }

    const keywords = keywordsText
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    const examples = examplesText
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    const newItem: NmpaCategoryMasterItem = {
      id: formData.id || `CAT-${formData.categoryCode}-${Date.now()}`,
      categoryCode: formData.categoryCode || '01',
      categoryName: formData.categoryName || '',
      level1Code: formData.level1Code || '',
      level1Name: formData.level1Name || '',
      level2Code: formData.level2Code || '',
      level2Name: formData.level2Name || '',
      productExamples: examples,
      riskClass: (formData.riskClass as any) || 'II类',
      description: formData.description || '',
      intendedUse: formData.intendedUse || '',
      matchKeywords: keywords.length > 0 ? keywords : [formData.level2Name || ''],
      defaultDepreciationYears: Number(formData.defaultDepreciationYears) || 8,
      defaultMaintenanceCycleMonths: Number(formData.defaultMaintenanceCycleMonths) || 6,
      defaultMetrologyType: (formData.defaultMetrologyType as any) || 'periodic_calibration',
      status: formData.status || 'active'
    };

    if (editingItem) {
      onUpdateCategoryMaster(categoryMaster.map(c => c.id === editingItem.id ? newItem : c));
    } else {
      onUpdateCategoryMaster([...categoryMaster, newItem]);
    }

    setIsModalOpen(false);
  };

  // 导出 JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(categoryMaster, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NMPA_Medical_Equipment_Categories_Master_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
      {/* 顶部政策横幅与主数据规范说明 */}
      <div className="p-4 bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
            <BookOpen className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">医疗器械分类目录主数据中心 (NMPA 2017版 22大类)</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                国家药监局标准编码体系
              </span>
            </div>
            <p className="text-xs text-blue-200/90 mt-1 max-w-2xl">
              规范「大类 01-22」、「一级类别 (子类目)」与「二级类别 (品名举例)」三级联动。设备录入与导入时支持全自动关键词匹配，杜绝手动输入错乱。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出主数据</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增品类字典</span>
          </button>
        </div>
      </div>

      {/* 22大类快捷筛选 Tabs */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>22 大类快速直达筛选</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            共收录 {categoryMaster.length} 个标准二级品类条目
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedMainCat('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              selectedMainCat === 'ALL'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部大类
          </button>
          {NMPA_22_MAIN_CATEGORIES.map(cat => {
            const isSelected = selectedMainCat === cat.code;
            const countInCat = categoryMaster.filter(c => c.categoryCode === cat.code).length;
            return (
              <button
                key={cat.code}
                onClick={() => setSelectedMainCat(cat.code)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span>{cat.code} {cat.shortName}</span>
                {countInCat > 0 && (
                  <span className={`text-[10px] px-1 rounded font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {countInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 搜索与风险等级筛选栏 */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索品类名称、品名举例、匹配关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">管理类别:</span>
            {['ALL', 'I类', 'II类', 'III类'].map(risk => (
              <button
                key={risk}
                onClick={() => setSelectedRiskClass(risk)}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                  selectedRiskClass === risk
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {risk === 'ALL' ? '全部级别' : risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 品类数据表格 */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
        {/* 表格顶部快捷分页栏 */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>分类目录标准条目</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px]">
              共 {filteredList.length} 条
            </span>
            {filteredList.length > 0 && (
              <span className="text-slate-500 hidden sm:inline text-[11px]">
                (显示第 <span className="font-semibold text-slate-700">{(validCurrentPage - 1) * pageSize + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(validCurrentPage * pageSize, filteredList.length)}</span> 条)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">每页:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value={5}>5 条/页</option>
                <option value={10}>10 条/页</option>
                <option value={15}>15 条/页</option>
                <option value={20}>20 条/页</option>
                <option value={50}>50 条/页</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handlePageChange(validCurrentPage - 1)}
                disabled={validCurrentPage === 1}
                className="px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold text-xs flex items-center gap-0.5 transition"
                title="上一页"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">上一页</span>
              </button>
              <span className="px-2 py-0.5 text-xs font-mono font-bold text-indigo-700 bg-indigo-50 rounded">
                {validCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(validCurrentPage + 1)}
                disabled={validCurrentPage === totalPages}
                className="px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold text-xs flex items-center gap-0.5 transition"
                title="下一页"
              >
                <span className="hidden md:inline">下一页</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">编码 / 大类</th>
                <th className="py-3 px-3.5">一级分类 (子类目)</th>
                <th className="py-3 px-3.5">二级分类 (标准品名)</th>
                <th className="py-3 px-3.5">管理类别</th>
                <th className="py-3 px-3.5">典型品名举例</th>
                <th className="py-3 px-3.5">推荐折旧/维保</th>
                <th className="py-3 px-3.5">关联台数</th>
                <th className="py-3 px-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    未找到匹配的分类目录条目
                  </td>
                </tr>
              ) : (
                paginatedList.map(item => {
                  const eqCount = (equipmentCountMap.get(item.categoryName) || 0) + (equipmentCountMap.get(item.level2Name) || 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-semibold text-slate-900">
                        <span className="font-mono text-indigo-700 font-bold mr-1">[{item.categoryCode}]</span>
                        {item.categoryName.replace(/^\d+\s*/, '')}
                      </td>
                      <td className="py-3 px-3.5 text-slate-800">
                        <span className="font-mono text-slate-500 text-[11px] mr-1">[{item.level1Code}]</span>
                        {item.level1Name}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {item.level2Name}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.riskClass === 'III类'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.riskClass === 'II类'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.riskClass}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.productExamples.slice(0, 3).map((ex, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px]">
                              {ex}
                            </span>
                          ))}
                          {item.productExamples.length > 3 && (
                            <span className="text-[10px] text-slate-400">+{item.productExamples.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-mono text-[11px]">
                        <div>{item.defaultDepreciationYears || 8} 年折旧</div>
                        <div className="text-[10px] text-slate-400">{item.defaultMaintenanceCycleMonths || 6} 月/检</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                          eqCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-400'
                        }`}>
                          {eqCount} 台
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="编辑"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 表格底部完整分页栏 */}
        <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              共 <span className="font-bold text-slate-900">{filteredList.length}</span> 条分类
              {filteredList.length > 0 && (
                <span className="text-slate-500 ml-1">
                  (当前显示第 <span className="font-semibold text-slate-800">{(validCurrentPage - 1) * pageSize + 1}</span> - <span className="font-semibold text-slate-800">{Math.min(validCurrentPage * pageSize, filteredList.length)}</span> 条)
                </span>
              )}
            </span>

            <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
              <span className="text-slate-500">每页:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={5}>5 条/页</option>
                <option value={10}>10 条/页</option>
                <option value={15}>15 条/页</option>
                <option value={20}>20 条/页</option>
                <option value={50}>50 条/页</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={validCurrentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="首页"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(validCurrentPage - 1)}
                disabled={validCurrentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="上一页"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    return Math.abs(page - validCurrentPage) <= 1;
                  })
                  .reduce<(number | string)[]>((acc, page, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push(`dots-${page}`);
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item) => {
                    if (typeof item === 'string') {
                      return (
                        <span key={item} className="px-1 text-slate-400 font-mono">...</span>
                      );
                    }
                    const isCurrent = item === validCurrentPage;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        className={`min-w-[28px] h-7 px-1.5 rounded text-xs font-bold font-mono transition cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(validCurrentPage + 1)}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="下一页"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="末页"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJumpPage} className="flex items-center gap-1 ml-2 border-l border-slate-300 pl-2">
              <span className="text-slate-500">前往:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={`${validCurrentPage}`}
                className="w-12 h-7 bg-white border border-slate-300 rounded px-1.5 text-center text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-500">页</span>
              <button
                type="submit"
                className="h-7 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded text-xs transition cursor-pointer"
              >
                跳转
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 新增 / 编辑 弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingItem ? '编辑分类目录条目' : '新增国家医疗器械标准分类'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {/* 大类选择 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    大类名称 (NMPA 22大类) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.categoryName}
                    onChange={(e) => {
                      const sel = NMPA_22_MAIN_CATEGORIES.find(c => c.name === e.target.value);
                      setFormData({
                        ...formData,
                        categoryCode: sel?.code || '01',
                        categoryName: e.target.value
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {NMPA_22_MAIN_CATEGORIES.map(c => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    管理类别 (风险等级) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.riskClass}
                    onChange={(e) => setFormData({ ...formData, riskClass: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="I类">I类 (低风险)</option>
                    <option value="II类">II类 (中度风险)</option>
                    <option value="III类">III类 (高风险/生命支持)</option>
                  </select>
                </div>
              </div>

              {/* 一级分类 & 二级分类 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    一级类别 (子类目名称) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.level1Name || ''}
                    onChange={(e) => setFormData({ ...formData, level1Name: e.target.value })}
                    placeholder="例：诊断 X 射线机"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    二级类别 (标准品名) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.level2Name || ''}
                    onChange={(e) => setFormData({ ...formData, level2Name: e.target.value })}
                    placeholder="例：摄影 X 射线机 (DR)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* 品名举例 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  品名举例 (逗号隔开)
                </label>
                <input
                  type="text"
                  value={examplesText}
                  onChange={(e) => setExamplesText(e.target.value)}
                  placeholder="例：悬吊DR，双板DR，移动DR"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 智能匹配关键词 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  AI 智能匹配关键词 (设备录入时自动识别)
                </label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="例：DR，X光机，拍片机，数字摄影"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 折旧与维保周期 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">推荐折旧年限 (年)</label>
                  <input
                    type="number"
                    value={formData.defaultDepreciationYears || 8}
                    onChange={(e) => setFormData({ ...formData, defaultDepreciationYears: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">推荐维保周期 (月)</label>
                  <input
                    type="number"
                    value={formData.defaultMaintenanceCycleMonths || 6}
                    onChange={(e) => setFormData({ ...formData, defaultMaintenanceCycleMonths: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition cursor-pointer"
                >
                  保存主数据
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

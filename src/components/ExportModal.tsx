import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Filter,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Table,
  CheckCircle2,
  Sparkles,
  FileText
} from 'lucide-react';
import { MedicalEquipment, EquipmentStatus } from '../types';
import { DEPARTMENTS, CATEGORIES } from '../mockData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEquipment: MedicalEquipment[];
  filteredEquipment: MedicalEquipment[];
  selectedEquipment: MedicalEquipment[];
}

export interface ExportFieldOption {
  key: keyof MedicalEquipment | 'categoryCombined' | 'locationCombined';
  label: string;
  category: 'base' | 'specs' | 'location' | 'financial';
  defaultChecked: boolean;
  getValue: (item: MedicalEquipment) => string | number;
}

const ALL_EXPORT_FIELDS: ExportFieldOption[] = [
  { key: 'id', label: '设备ID/编号', category: 'base', defaultChecked: true, getValue: (i) => i.id },
  { key: 'assetNo', label: '资产编号', category: 'base', defaultChecked: true, getValue: (i) => i.assetNo || `ZC-2023-${i.id}` },
  { key: 'assetOwnership', label: '资产归属形式', category: 'base', defaultChecked: true, getValue: (i) => i.assetOwnership || '医院自有' },
  { key: 'codeId', label: 'code_id (统一物资溯源码)', category: 'base', defaultChecked: true, getValue: (i) => i.codeId || `COD-${i.id}` },
  { key: 'internalNo', label: '科室内部编号 (临床自编号/报修号)', category: 'base', defaultChecked: true, getValue: (i) => i.internalNo || '' },
  { key: 'name', label: '设备名称', category: 'base', defaultChecked: true, getValue: (i) => i.name },
  { key: 'categoryNo', label: '类别序号', category: 'base', defaultChecked: true, getValue: (i) => i.categoryNo || '' },
  { key: 'category', label: '所属类别', category: 'base', defaultChecked: true, getValue: (i) => i.category || '' },
  { key: 'level1No', label: '一级类别序号', category: 'base', defaultChecked: false, getValue: (i) => i.level1No || '' },
  { key: 'level1Category', label: '一级类别', category: 'base', defaultChecked: false, getValue: (i) => i.level1Category || '' },
  { key: 'level2No', label: '二级类别序号', category: 'base', defaultChecked: false, getValue: (i) => i.level2No || '' },
  { key: 'level2Category', label: '二级类别', category: 'base', defaultChecked: false, getValue: (i) => i.level2Category || '' },
  
  { key: 'model', label: '规格型号', category: 'specs', defaultChecked: true, getValue: (i) => i.model || '' },
  { key: 'sn', label: '出厂编号(SN)', category: 'specs', defaultChecked: true, getValue: (i) => i.sn || '' },
  { key: 'manufactureDate', label: '生产日期', category: 'specs', defaultChecked: true, getValue: (i) => i.manufactureDate || '' },
  { key: 'manufacturer', label: '生产厂商', category: 'specs', defaultChecked: true, getValue: (i) => i.manufacturer || '' },
  { key: 'status', label: '运行状态', category: 'specs', defaultChecked: true, getValue: (i) => i.status || '' },
  
  { key: 'department', label: '使用科室', category: 'location', defaultChecked: true, getValue: (i) => i.department || '' },
  { key: 'usageLocation', label: '具体使用场所/房间', category: 'location', defaultChecked: true, getValue: (i) => i.usageLocation || i.location || '' },
  { key: 'building', label: '存放楼栋', category: 'location', defaultChecked: true, getValue: (i) => i.building || '' },
  { key: 'floor', label: '楼层(F)', category: 'location', defaultChecked: true, getValue: (i) => i.floor || '' },
  { key: 'nursePhone', label: '科室分机', category: 'location', defaultChecked: false, getValue: (i) => i.nursePhone || '' },
  { key: 'location', label: '具体安装位置', category: 'location', defaultChecked: false, getValue: (i) => i.location || '' },
  { key: 'manager', label: '管理责任人', category: 'location', defaultChecked: true, getValue: (i) => i.manager || '' },

  { key: 'enableDate', label: '投用时间', category: 'financial', defaultChecked: true, getValue: (i) => i.enableDate || '' },
  { key: 'productValidity', label: '产品有效期(年)', category: 'financial', defaultChecked: false, getValue: (i) => i.productValidity ?? '' },
  { key: 'purchasePrice', label: '购置金额(元)', category: 'financial', defaultChecked: true, getValue: (i) => i.purchasePrice ?? '' },
  { key: 'calibration', label: '计量校准(Yes/No)', category: 'financial', defaultChecked: true, getValue: (i) => i.calibration || 'No' },
  { key: 'calibrationUnit', label: '校准检测单位', category: 'financial', defaultChecked: false, getValue: (i) => i.calibrationUnit || '' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  allEquipment,
  filteredEquipment,
  selectedEquipment
}) => {
  // Export Scope State
  const [scope, setScope] = useState<'filtered' | 'selected' | 'all'>(
    selectedEquipment.length > 0 ? 'selected' : 'filtered'
  );

  // Additional Condition Filters inside modal
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [calibrationOnly, setCalibrationOnly] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Fields Selected
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    ALL_EXPORT_FIELDS.filter(f => f.defaultChecked).map(f => f.key)
  );

  // Export File format
  const [format, setFormat] = useState<'csv' | 'tsv'>('csv');
  const [includeBOM, setIncludeBOM] = useState<boolean>(true);
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [fileNamePrefix, setFileNamePrefix] = useState<string>('医疗设备台账数据导出');

  // Determine base dataset based on scope
  const baseData = useMemo(() => {
    if (scope === 'selected' && selectedEquipment.length > 0) {
      return selectedEquipment;
    }
    if (scope === 'all') {
      return allEquipment;
    }
    return filteredEquipment;
  }, [scope, selectedEquipment, allEquipment, filteredEquipment]);

  // Apply sub-filters
  const finalExportData = useMemo(() => {
    return baseData.filter((item) => {
      if (deptFilter && item.department !== deptFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (calibrationOnly && item.calibration !== 'Yes') return false;

      const price = item.purchasePrice ?? 0;
      if (minPrice && price < parseFloat(minPrice)) return false;
      if (maxPrice && price > parseFloat(maxPrice)) return false;

      return true;
    });
  }, [baseData, deptFilter, statusFilter, categoryFilter, calibrationOnly, minPrice, maxPrice]);

  // Total Estimated Price
  const totalPrice = useMemo(() => {
    return finalExportData.reduce((acc, curr) => acc + (curr.purchasePrice || 0), 0);
  }, [finalExportData]);

  if (!isOpen) return null;

  // Toggle field
  const toggleKey = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Preset field selectors
  const handleSelectAllFields = () => {
    setSelectedKeys(ALL_EXPORT_FIELDS.map(f => f.key));
  };

  const handleSelectEssentialFields = () => {
    setSelectedKeys(['id', 'name', 'model', 'sn', 'department', 'status', 'enableDate', 'purchasePrice']);
  };

  const handleSelectLocationFields = () => {
    setSelectedKeys(['id', 'name', 'department', 'building', 'floor', 'nursePhone', 'manager']);
  };

  const handleSelectFinancialFields = () => {
    setSelectedKeys(['id', 'name', 'purchasePrice', 'enableDate', 'productValidity', 'calibration', 'manufacturer']);
  };

  // Execute Export
  const handleDoExport = () => {
    if (finalExportData.length === 0) {
      alert('当前条件下的导出数据为空，请重新调整筛选参数！');
      return;
    }

    const activeFields = ALL_EXPORT_FIELDS.filter(f => selectedKeys.includes(f.key));
    if (activeFields.length === 0) {
      alert('请至少勾选一个需要导出的字段！');
      return;
    }

    const separator = format === 'tsv' ? '\t' : ',';
    const lines: string[] = [];

    // Header row
    if (includeHeader) {
      const headerRow = activeFields.map(f => `"${f.label}"`).join(separator);
      lines.push(headerRow);
    }

    // Data rows
    finalExportData.forEach(item => {
      const rowValues = activeFields.map(f => {
        const val = f.getValue(item);
        const strVal = String(val ?? '').replace(/"/g, '""'); // Escape quotes
        return `"${strVal}"`;
      });
      lines.push(rowValues.join(separator));
    });

    const fileContent = (includeBOM ? '\uFEFF' : '') + lines.join('\n');
    const mimeType = format === 'tsv' ? 'text/tab-separated-values;charset=utf-8;' : 'text/csv;charset=utf-8;';
    const blob = new Blob([fileContent], { type: mimeType });

    const nowStr = new Date().toISOString().split('T')[0];
    const fileName = `${fileNamePrefix}_${finalExportData.length}台_${nowStr}.${format}`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                高级条件导出与列字段定制
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  可定制字段 / 按条件精准导出
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                支持自由勾选字段维度、设置价格/科室/状态组合条件，并生成 UTF-8 Excel 兼容电子表格
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs text-slate-700">
          {/* Section 1: Export Scope */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>第一步：选择导出数据基础范围</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-lg border flex flex-col gap-1 cursor-pointer transition ${
                  scope === 'filtered'
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={scope === 'filtered'}
                      onChange={() => setScope('filtered')}
                      className="text-blue-600"
                    />
                    <span>当前检索过滤结果</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {filteredEquipment.length} 台
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 ml-5">导出主界面当前搜索、筛选与排序后的结果列表</p>
              </label>

              <label
                className={`p-3 rounded-lg border flex flex-col gap-1 transition ${
                  selectedEquipment.length === 0
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                    : scope === 'selected'
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs cursor-pointer'
                    : 'bg-white border-slate-200 hover:bg-slate-100/60 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <input
                      type="radio"
                      name="exportScope"
                      disabled={selectedEquipment.length === 0}
                      checked={scope === 'selected'}
                      onChange={() => setScope('selected')}
                      className="text-blue-600"
                    />
                    <span>仅导出的已勾选设备</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    {selectedEquipment.length} 台
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 ml-5">只导出表格中前面复选框手动勾选选中的设备</p>
              </label>

              <label
                className={`p-3 rounded-lg border flex flex-col gap-1 cursor-pointer transition ${
                  scope === 'all'
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="text-blue-600"
                    />
                    <span>全院所有设备台账</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                    {allEquipment.length} 台
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 ml-5">忽略当前检索条件，导出数据库中全量台账记录</p>
              </label>
            </div>
          </div>

          {/* Section 2: Conditional Sub-filters */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>第二步：附加条件精准过滤 (可选)</span>
              </label>
              {(deptFilter || statusFilter || categoryFilter || calibrationOnly || minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={() => {
                    setDeptFilter('');
                    setStatusFilter('');
                    setCategoryFilter('');
                    setCalibrationOnly(false);
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  清空附加条件
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">使用科室条件</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-200 outline-hidden"
                >
                  <option value="">全部科室</option>
                  {DEPARTMENTS.filter(d => d !== '全院科室').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">运行状态条件</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-200 outline-hidden"
                >
                  <option value="">全部状态</option>
                  <option value="正常运行">正常运行</option>
                  <option value="故障待修">故障待修</option>
                  <option value="维护保养中">维护保养中</option>
                  <option value="停用/报废">停用/报废</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">设备类别分类</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-200 outline-hidden"
                >
                  <option value="">全部分类</option>
                  {CATEGORIES.filter(c => c !== '全部分类').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">购置价格区间(元)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="最低"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-hidden"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder="最高"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={calibrationOnly}
                  onChange={(e) => setCalibrationOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>仅导出需强制计量校准的设备 (Calibration = Yes)</span>
              </label>

              <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                筛选后预计导出设备: <strong className="font-mono text-sm">{finalExportData.length}</strong> 台
                （总价值: ¥{(totalPrice / 10000).toFixed(2)} 万）
              </div>
            </div>
          </div>

          {/* Section 3: Select Export Columns/Fields */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Table className="w-4 h-4 text-purple-600" />
                <span>第三步：选择导出的列数据字段 ({selectedKeys.length} / {ALL_EXPORT_FIELDS.length})</span>
              </label>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllFields}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition font-semibold cursor-pointer"
                >
                  全选所有字段
                </button>
                <button
                  type="button"
                  onClick={handleSelectEssentialFields}
                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition font-semibold cursor-pointer"
                >
                  核心基础模版
                </button>
                <button
                  type="button"
                  onClick={handleSelectLocationFields}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition font-semibold cursor-pointer"
                >
                  科室与分布模版
                </button>
                <button
                  type="button"
                  onClick={handleSelectFinancialFields}
                  className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded transition font-semibold cursor-pointer"
                >
                  财务与校准模版
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {ALL_EXPORT_FIELDS.map((field) => {
                const isChecked = selectedKeys.includes(field.key);
                return (
                  <label
                    key={field.key}
                    onClick={() => toggleKey(field.key)}
                    className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{field.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Export Format Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <label className="block font-bold text-slate-800 mb-2 text-xs">导出文件格式与兼容性</label>
              <div className="flex items-center gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="text-emerald-600"
                  />
                  <span>标准 CSV 通用格式 (.csv)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={format === 'tsv'}
                    onChange={() => setFormat('tsv')}
                    className="text-emerald-600"
                  />
                  <span>TSV 制表符分隔 (.tsv)</span>
                </label>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBOM}
                    onChange={(e) => setIncludeBOM(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>包含 UTF-8 BOM 标识 (推荐，防止 Excel 打开中文乱码)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>包含首行列标题名 (Header row)</span>
                </label>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex flex-col justify-between">
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-xs">导出文件名设置</label>
                <input
                  type="text"
                  value={fileNamePrefix}
                  onChange={(e) => setFileNamePrefix(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-200 mt-2 truncate">
                预测导出文件名: <strong className="text-slate-800">{fileNamePrefix}_{finalExportData.length}台_{new Date().toISOString().split('T')[0]}.{format}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>就绪: 共 <strong className="text-slate-900 font-mono font-bold">{finalExportData.length}</strong> 条符合条件的设备台账记录</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleDoExport}
              disabled={finalExportData.length === 0 || selectedKeys.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>立即导出文件 ({finalExportData.length} 台)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

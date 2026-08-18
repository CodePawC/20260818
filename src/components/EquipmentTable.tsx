import React, { useState } from 'react';
import { MedicalEquipment, EquipmentStatus, SortField, SortOrder, ColumnVisibility, DEFAULT_COLUMN_VISIBILITY, DepartmentMaster } from '../types';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentHealthScore, getEquipmentMaintenanceNode } from '../utils/equipmentUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { getDepartmentMasterInfo } from '../utils/masterData';
import { HealthScoreDetailModal } from './HealthScoreDetailModal';
import {
  Eye,
  Wrench,
  RefreshCw,
  Edit,
  Trash2,
  Bot,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Download,
  CheckSquare,
  XSquare,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  ChevronDown,
  Columns,
  Scale,
  Hourglass,
  QrCode,
  Building2,
  Sparkles,
  Calendar
} from 'lucide-react';

interface EquipmentTableProps {
  equipmentList: MedicalEquipment[];
  selectedIds: string[];
  currentPage?: number;
  pageSize?: number;
  sortField?: SortField;
  sortOrder?: SortOrder;
  density?: 'default' | 'compact';
  splitCategories?: boolean;
  columnVisibility?: ColumnVisibility;
  onSortFieldChange?: (field: SortField) => void;
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  onViewDetails: (item: MedicalEquipment) => void;
  onAddRepairForDevice: (item: MedicalEquipment) => void;
  onChangeStatusForDevice: (item: MedicalEquipment) => void;
  onEditDevice: (item: MedicalEquipment) => void;
  onDeleteDevice: (id: string) => void;
  onAiDiagnoseDevice: (item: MedicalEquipment) => void;
  onViewAgencyTransactions?: (agencyName: string, item: MedicalEquipment) => void;
  onBatchDelete?: () => void;
  onBatchStatusChange?: (status: EquipmentStatus) => void;
  onBatchExport?: () => void;
  onBatchTransfer?: () => void;
  onBatchQrPrint?: (items?: MedicalEquipment[]) => void;
  onClearSelection?: () => void;
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipmentList,
  selectedIds,
  currentPage = 1,
  pageSize = 20,
  sortField = 'categoryNo',
  sortOrder = 'asc',
  density = 'default',
  splitCategories = true,
  columnVisibility,
  onSortFieldChange,
  onToggleSelectAll,
  onToggleSelectRow,
  onViewDetails,
  onAddRepairForDevice,
  onChangeStatusForDevice,
  onEditDevice,
  onDeleteDevice,
  onAiDiagnoseDevice,
  onViewAgencyTransactions,
  onBatchDelete,
  onBatchStatusChange,
  onBatchExport,
  onBatchTransfer,
  onBatchQrPrint,
  onClearSelection,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: MedicalEquipment } | null>(null);
  const [healthModalDevice, setHealthModalDevice] = useState<MedicalEquipment | null>(null);

  const cols = columnVisibility || DEFAULT_COLUMN_VISIBILITY;

  const handleRowDoubleClick = (e: React.MouseEvent, item: MedicalEquipment) => {
    e.preventDefault();
    const x = Math.min(e.clientX, Math.max(10, window.innerWidth - 220));
    const y = Math.min(e.clientY, Math.max(10, window.innerHeight - 280));
    setContextMenu({ x, y, item });
  };

  const handleRowContextMenu = (e: React.MouseEvent, item: MedicalEquipment) => {
    e.preventDefault();
    const x = Math.min(e.clientX, Math.max(10, window.innerWidth - 220));
    const y = Math.min(e.clientY, Math.max(10, window.innerHeight - 280));
    setContextMenu({ x, y, item });
  };

  const isAllSelected = equipmentList.length > 0 && selectedIds.length === equipmentList.length;

  const handleCopyText = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(typeKey);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const handleSortClick = (field: SortField) => {
    if (onSortFieldChange) {
      onSortFieldChange(field);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline ml-1 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline ml-1 font-bold" />
    );
  };

  const renderStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case '正常运行':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/90 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            正常运行
          </span>
        );
      case '维护保养中':
        return (
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/90 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            维护保养中
          </span>
        );
      case '故障待修':
        return (
          <span className="px-2.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200/90 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce"></span>
            故障待修
          </span>
        );
      case '停用/报废':
        return (
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            停用/报废
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium">
            {status}
          </span>
        );
    }
  };

  const cellPyClass = density === 'compact' ? 'py-2 px-3' : 'py-3 px-3.5';

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-white overflow-hidden">
      {/* Scrollable Container for Table */}
      <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-slate-200 pb-20">
        {equipmentList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 my-auto">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">未找到符合条件的设备记录</p>
            <p className="text-xs text-slate-400 mt-1">请尝试修改关键字、科室或运行状态筛选条件</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
          {/* Table Sticky Header */}
          <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 shadow-2xs select-none">
            <tr className="text-slate-700 text-xs font-bold tracking-wider border-b border-slate-200">
              <th className={`text-center font-bold text-slate-800 whitespace-nowrap ${density === 'compact' ? 'py-2.5 px-2' : 'py-3 px-2.5'}`} style={{ width: '64px', minWidth: '56px' }}>
                <div className="flex items-center justify-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    title={isAllSelected ? "取消全选" : "全选当前页"}
                  />
                  {cols.indexNumber && <span className="text-xs font-bold text-slate-800">序号</span>}
                </div>
              </th>
              {cols.id && (
                <th
                  onClick={() => handleSortClick('id')}
                  className={`w-14 min-w-[52px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2.5 px-2' : 'py-3 px-2.5'}`}
                  title="按设备ID排序"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    {renderSortIndicator('id')}
                  </div>
                </th>
              )}
              {/* Category Columns: Split 3 Columns OR Single Merged Column */}
              {splitCategories ? (
                <>
                  {cols.category && (
                    <th
                      onClick={() => handleSortClick('categoryNo')}
                      className={`min-w-[95px] font-bold text-slate-600 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                      title="按大类编号排序"
                    >
                      <div className="flex items-center gap-1">
                        <span>大类</span>
                        {renderSortIndicator('categoryNo')}
                      </div>
                    </th>
                  )}
                  {cols.level1Category && (
                    <th
                      onClick={() => handleSortClick('level1No')}
                      className={`min-w-[105px] font-bold text-slate-600 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                      title="按一级分类编号排序"
                    >
                      <div className="flex items-center gap-1">
                        <span>一级分类</span>
                        {renderSortIndicator('level1No')}
                      </div>
                    </th>
                  )}
                  {cols.level2Category && (
                    <th
                      onClick={() => handleSortClick('level2No')}
                      className={`min-w-[115px] font-bold text-slate-600 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                      title="按二级分类编号排序"
                    >
                      <div className="flex items-center gap-1">
                        <span>二级分类</span>
                        {renderSortIndicator('level2No')}
                      </div>
                    </th>
                  )}
                </>
              ) : (
                (cols.category || cols.level1Category || cols.level2Category) && (
                  <th
                    onClick={() => handleSortClick('categoryNo')}
                    className={`font-bold text-slate-800 min-w-[140px] cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                    title="按大类编号排序"
                  >
                    <div className="flex items-center gap-1">
                      <span>分类层级 (三级)</span>
                      {renderSortIndicator('categoryNo')}
                    </div>
                  </th>
                )
              )}
              {cols.nameModel && (
                <th
                  onClick={() => handleSortClick('name')}
                  className={`min-w-[150px] font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                >
                  <div className="flex items-center gap-1">
                    <span>设备名称 / 规格型号</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
              )}
              {(cols.sn || cols.manufacturer) && (
                <th
                  onClick={() => handleSortClick('sn')}
                  className={`min-w-[130px] font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                >
                  <div className="flex items-center gap-1">
                    <span>
                      {cols.sn && cols.manufacturer
                        ? '出厂编号 / 厂商名称'
                        : cols.sn
                        ? '出厂编号 (SN)'
                        : '生产厂家'}
                    </span>
                    {renderSortIndicator('sn')}
                  </div>
                </th>
              )}
              {cols.status && (
                <th
                  onClick={() => handleSortClick('status')}
                  className={`min-w-[95px] text-center font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>运行状态</span>
                    {renderSortIndicator('status')}
                  </div>
                </th>
              )}
              {cols.manufactureDate && (
                <th
                  onClick={() => handleSortClick('manufactureDate')}
                  className={`min-w-[125px] font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                  title="出厂生产日期与产品设计使用寿命（老龄化服役期）"
                >
                  <div className="flex items-center gap-1">
                    <Hourglass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>生产日期 / 设计寿命</span>
                    {renderSortIndicator('manufactureDate')}
                  </div>
                </th>
              )}
              {cols.enableDate && (
                <th
                  onClick={() => handleSortClick('enableDate')}
                  className={`min-w-[90px] font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                >
                  <div className="flex items-center gap-1">
                    <span>投用时间</span>
                    {renderSortIndicator('enableDate')}
                  </div>
                </th>
              )}
              {cols.calibration && (
                <th 
                  className={`min-w-[165px] font-bold text-slate-800 ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                  title="法定计量部门周期性强制检定与量值溯源证书效期"
                >
                  <div className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>法定计量 / 周期检定</span>
                  </div>
                </th>
              )}
              {(cols.department || cols.location) && (
                <th
                  onClick={() => handleSortClick('department')}
                  className={`min-w-[125px] font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                  title="按使用科室排序"
                >
                  <div className="flex items-center gap-1">
                    <span>
                      {cols.department && cols.location
                        ? '使用科室 / 存放位置'
                        : cols.department
                        ? '使用科室'
                        : '存放位置'}
                    </span>
                    {renderSortIndicator('department')}
                  </div>
                </th>
              )}
              {cols.manager && (
                <th className={`min-w-[80px] font-bold text-slate-800 ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}>管理责任人</th>
              )}
              {cols.purchasePrice && (
                <th
                  onClick={() => handleSortClick('purchasePrice')}
                  className={`min-w-[95px] text-right font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>购置金额 (元)</span>
                    {renderSortIndicator('purchasePrice')}
                  </div>
                </th>
              )}
              {cols.repairStats && (
                <th
                  onClick={() => handleSortClick('repairCost')}
                  className={`min-w-[105px] font-bold text-slate-800 cursor-pointer hover:bg-slate-200/60 transition rounded ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                  title="点击按合计支出/维保费用排序"
                >
                  <div className="flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-amber-700" />
                    <span>累计维保/费用</span>
                    {renderSortIndicator('repairCost')}
                  </div>
                </th>
              )}
              {cols.healthScore && (
                <th className={`min-w-[110px] text-center font-bold text-slate-800 ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}>
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-700" />
                    <span>AI健康得分</span>
                  </div>
                </th>
              )}
              {cols.maintenanceNode && (
                <th className={`min-w-[130px] font-bold text-slate-800 ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-700" />
                    <span>保养节点/状态</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 leading-relaxed">
            {equipmentList.map((item, index) => {
              const isSelected = selectedIds.includes(item.id);
              const rowNum = (currentPage - 1) * pageSize + index + 1;
              const vInfo = getEquipmentValidityInfo(item);

              return (
                <tr
                  key={item.id}
                  onDoubleClick={(e) => handleRowDoubleClick(e, item)}
                  onContextMenu={(e) => handleRowContextMenu(e, item)}
                  title="💡 双击或右键点击，可唤出设备操作菜单"
                  className={`group transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                      : vInfo.riskLevel === 'high'
                      ? 'bg-rose-50/20 hover:bg-rose-50/60 border-l-2 border-l-rose-500/80'
                      : vInfo.riskLevel === 'medium'
                      ? 'bg-amber-50/15 hover:bg-amber-50/50 border-l-2 border-l-amber-400/80'
                      : 'hover:bg-slate-50/90 border-l-2 border-l-transparent'
                  }`}
                >
                  <td className={`text-center ${density === 'compact' ? 'py-2 px-1.5' : 'py-3 px-2'}`} style={{ width: '60px', minWidth: '52px' }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(item.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      {cols.indexNumber && (
                        <span className="font-mono font-semibold text-slate-500 text-xs shrink-0 select-none">
                          {rowNum}
                        </span>
                      )}
                    </div>
                  </td>
                  {cols.id && (
                    <td className={`${density === 'compact' ? 'py-2 px-1.5' : 'py-3 px-2'} font-mono font-bold text-slate-800 text-xs w-14`}>
                      <div className="flex items-center gap-1 group/copy">
                        <span className="text-slate-800 font-semibold">{item.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.id, `id-${item.id}`)}
                          className="opacity-0 group-hover/copy:opacity-100 text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5 rounded"
                          title="复制设备ID"
                        >
                          {copiedId === `id-${item.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  )}

                  {/* Category Cells: Split 3 Columns OR Merged 1 Column */}
                  {splitCategories ? (
                    <>
                      {/* Column 1: 大类 */}
                      {cols.category && (
                        <td className={cellPyClass}>
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-mono text-xs shrink-0 font-medium">
                              {item.categoryNo || '-'}
                            </span>
                            <span className="truncate max-w-[140px] font-semibold text-slate-800 text-sm" title={item.category}>{item.category}</span>
                          </div>
                        </td>
                      )}
                      {/* Column 2: 一级分类 */}
                      {cols.level1Category && (
                        <td className={cellPyClass}>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-mono text-xs shrink-0 font-medium">
                              {item.level1No || '-'}
                            </span>
                            <span className="truncate max-w-[140px] text-slate-700 font-medium text-sm" title={item.level1Category}>{item.level1Category || '-'}</span>
                          </div>
                        </td>
                      )}
                      {/* Column 3: 二级分类 */}
                      {cols.level2Category && (
                        <td className={cellPyClass}>
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-mono text-xs shrink-0 font-medium">
                              {item.level2No || '-'}
                            </span>
                            <span className="truncate max-w-[150px] font-semibold text-slate-800 text-sm" title={item.level2Category}>{item.level2Category || '-'}</span>
                          </div>
                        </td>
                      )}
                    </>
                  ) : (
                    (cols.category || cols.level1Category || cols.level2Category) && (
                      <td className={cellPyClass}>
                        <div className="flex flex-col gap-1 text-sm max-w-[280px]">
                          {/* Level 1: 大类 */}
                          {cols.category && (
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-mono text-xs shrink-0 font-medium">
                                {item.categoryNo || '-'}
                              </span>
                              <span className="truncate font-semibold text-sm" title={item.category}>{item.category}</span>
                            </div>
                          )}
                          
                          {/* Level 2: 一级分类 */}
                          {cols.level1Category && (
                            <div className="flex items-center gap-1.5 text-slate-600 pl-2 border-l-2 border-slate-200">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-mono text-xs shrink-0 font-medium">
                                {item.level1No || '-'}
                              </span>
                              <span className="truncate font-medium text-slate-700 text-sm" title={item.level1Category}>{item.level1Category || '-'}</span>
                            </div>
                          )}

                          {/* Level 3: 二级分类 */}
                          {cols.level2Category && (
                            <div className="flex items-center gap-1.5 text-slate-800 pl-2 border-l-2 border-slate-300">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-mono text-xs shrink-0 font-medium">
                                {item.level2No || '-'}
                              </span>
                              <span className="truncate font-semibold text-slate-900 text-sm" title={item.level2Category}>{item.level2Category || '-'}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  )}

                  {cols.nameModel && (
                    <td className={cellPyClass}>
                      <div className="flex flex-col gap-1">
                        <span
                          onClick={() => onViewDetails(item)}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 transition cursor-pointer leading-snug"
                          title="点击查看详情"
                        >
                          {item.name}
                        </span>
                        <span className="text-xs text-slate-600 font-mono tracking-tight font-semibold">{item.model || '-'}</span>
                      </div>
                    </td>
                  )}
                  {(cols.sn || cols.manufacturer) && (
                    <td className={cellPyClass}>
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {cols.sn && (
                          <div className="flex items-center gap-1 group">
                            <span className="font-mono font-bold text-slate-800 text-xs truncate" title={item.sn}>{item.sn || '-'}</span>
                            {item.sn && (
                              <button
                                type="button"
                                onClick={() => handleCopyText(item.sn, `sn-${item.id}`)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5 rounded"
                                title="复制出厂SN编号"
                              >
                                {copiedId === `sn-${item.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                        {cols.manufacturer && (
                          item.manufacturer && item.manufacturer !== '-' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onViewAgencyTransactions) {
                                  onViewAgencyTransactions(item.manufacturer, item);
                                }
                              }}
                              className="text-xs text-blue-700 hover:text-blue-900 font-semibold truncate text-left hover:underline flex items-center gap-1 cursor-pointer group/mfr"
                              title={`点击查看生产厂家【${item.manufacturer}】的往来档案与资质`}
                            >
                              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover/mfr:scale-110 transition-transform" />
                              <span className="truncate">{item.manufacturer}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600 font-medium truncate" title={item.manufacturer}>{item.manufacturer || '-'}</span>
                          )
                        )}
                      </div>
                    </td>
                  )}
                  {cols.status && (
                    <td className={`${cellPyClass} text-center`}>{renderStatusBadge(item.status)}</td>
                  )}
                  {cols.manufactureDate && (
                    <td className={cellPyClass}>
                      <div className="flex flex-col gap-1" title={vInfo.riskDescription}>
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className="text-slate-900 font-bold">{item.manufactureDate || '-'}</span>
                          {item.productValidity ? (
                            <span className="text-amber-800 text-xs font-semibold" title={`厂家设计寿命: ${item.productValidity}年`}>
                              (标称{item.productValidity}年)
                            </span>
                          ) : null}
                        </div>

                        {vInfo.riskLevel === 'high' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold w-fit shadow-2xs">
                            <Hourglass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            超龄服役: +{vInfo.yearsPast}年
                          </span>
                        )}
                        {vInfo.riskLevel === 'medium' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50/80 text-amber-800 border border-amber-200 text-xs font-bold w-fit shadow-2xs">
                            <Hourglass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            寿命临期: 剩{vInfo.daysRemaining}天
                          </span>
                        )}
                        {vInfo.riskLevel === 'low' && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            服役期内 (正常)
                          </span>
                        )}
                        {vInfo.riskLevel === 'unknown' && (
                          <span className="text-xs text-slate-500 font-medium">
                            未登记年限
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {cols.enableDate && (
                    <td className={cellPyClass}>
                      <span className="font-mono text-xs text-slate-900 font-bold">
                        {item.enableDate || '-'}
                      </span>
                    </td>
                  )}
                  {cols.calibration && (
                    <td className={cellPyClass}>
                      {(() => {
                        const calInfo = getEquipmentCalibrationInfo(item);
                        return (
                          <div className="flex flex-col gap-1 max-w-[210px]" title={calInfo.description}>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold shrink-0 ${calInfo.badgeClass}`}>
                                <Scale className="w-3.5 h-3.5 shrink-0" />
                                <span>{calInfo.statusLabel}</span>
                              </span>
                              {calInfo.isMandatory && calInfo.nextDate !== '-' && (
                                <span className="text-xs font-mono font-bold text-slate-900 shrink-0" title={`下次强检定标到期日: ${calInfo.nextDate}`}>
                                  {calInfo.nextDate}
                                </span>
                              )}
                            </div>
                            {calInfo.agency && calInfo.agency !== '-' && calInfo.agency !== '免检' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewAgencyTransactions?.(calInfo.agency, item);
                                }}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline hover:bg-blue-50/80 -mx-1 px-1 py-0.5 rounded transition truncate flex items-center gap-1 text-left cursor-pointer group/agency w-fit max-w-full"
                                title={`点击查看与【${calInfo.agency}】的往来业务档案与设备明细`}
                              >
                                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover/agency:scale-110 transition-transform" />
                                <span className="truncate">{calInfo.agency}</span>
                              </button>
                            ) : calInfo.agency && calInfo.agency !== '-' ? (
                              <div className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1">
                                <span className="truncate">{calInfo.agency}</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                  )}
                  {(cols.department || cols.location) && (
                    <td className={cellPyClass}>
                      {(() => {
                        const deptMaster = getDepartmentMasterInfo(item.department);
                        const phone = (item.nursePhone && item.nursePhone.trim() !== '') ? item.nursePhone : deptMaster.nursePhone;
                        const building = (item.building && item.building.trim() !== '') ? item.building : deptMaster.building;
                        const floor = (item.floor && item.floor.trim() !== '') ? item.floor : deptMaster.floor;

                        return (
                          <div className="flex flex-col gap-1">
                            {cols.department && (
                              <div className="font-bold text-slate-900 text-sm">{item.department}</div>
                            )}
                            {cols.location && (
                              <div className="text-xs text-slate-700 flex items-center gap-1.5 flex-wrap font-medium">
                                <span>{building || '1号楼 综合楼'}</span>
                                {floor && <span className="bg-slate-100 border border-slate-300 text-slate-800 rounded px-1.5 text-xs font-mono font-bold">{floor}F</span>}
                                {phone && (
                                  <a
                                    href={`tel:${phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-700 hover:text-blue-900 hover:underline font-mono font-bold inline-flex items-center gap-0.5 cursor-pointer"
                                    title={`点击拨打科室电话 ${phone}`}
                                  >
                                    ☎ {phone}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  )}
                  {cols.manager && (
                    <td className={cellPyClass}>
                      <span className="text-slate-800 font-semibold text-sm">
                        {item.manager || '张工'}
                      </span>
                    </td>
                  )}
                  {cols.purchasePrice && (
                    <td className={`${cellPyClass} text-right`}>
                      <span className="text-slate-900 font-mono font-bold text-sm notranslate" translate="no">
                        ￥{((item.purchasePrice || 85000)).toLocaleString()}
                      </span>
                    </td>
                  )}

                  {/* 累计维修与费用 */}
                  {cols.repairStats && (() => {
                    const count = item.repairRecords?.length || item.repairCount || 0;
                    const cost = item.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
                    return (
                      <td className={cellPyClass}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                            <span>{count} 次维修</span>
                          </span>
                          <span className="font-mono text-xs text-amber-800 font-bold notranslate" translate="no">
                            支出: ￥{cost.toLocaleString()}
                          </span>
                        </div>
                      </td>
                    );
                  })()}

                  {/* AI健康评估得分 */}
                  {cols.healthScore && (() => {
                    const hInfo = getEquipmentHealthScore(item);
                    return (
                      <td className={`${cellPyClass} text-center`}>
                        <div
                          className="inline-flex flex-col items-center gap-1 cursor-pointer group/score"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHealthModalDevice(item);
                          }}
                          title={`点击穿透查看“${item.name}”的AI健康得分 (${hInfo.score}分) 扣分归因明细`}
                        >
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 shadow-2xs group-hover/score:scale-105 active:scale-95 transition-all ${hInfo.badgeBg}`}>
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600 shrink-0 animate-pulse" />
                            <span>{hInfo.score}分</span>
                            <span className="opacity-90 font-medium text-xs">({hInfo.label})</span>
                          </span>
                          <span className="text-xs text-blue-700 font-semibold opacity-0 group-hover/score:opacity-100 transition-opacity whitespace-nowrap">
                            🔍 扣分明细
                          </span>
                        </div>
                      </td>
                    );
                  })()}

                  {/* 保养节点与状态 */}
                  {cols.maintenanceNode && (() => {
                    const mNode = getEquipmentMaintenanceNode(item);
                    return (
                      <td className={cellPyClass}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-slate-900 font-bold">{mNode.nextDate}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${mNode.badgeClass}`}>
                              {mNode.statusTag}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600 font-mono font-medium">
                            上次: {mNode.lastDate}
                          </span>
                        </div>
                      </td>
                    );
                  })()}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-3 mx-auto my-2 z-20 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-4 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>已选中 <strong className="text-blue-400 text-sm font-bold">{selectedIds.length}</strong> 台设备</span>
          </div>

          <div className="flex items-center gap-2">
            {onBatchStatusChange && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400">设置状态:</span>
                <button
                  type="button"
                  onClick={() => onBatchStatusChange('正常运行')}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded font-medium cursor-pointer transition"
                >
                  正常运行
                </button>
                <button
                  type="button"
                  onClick={() => onBatchStatusChange('维护保养中')}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded font-medium cursor-pointer transition"
                >
                  维保中
                </button>
                <button
                  type="button"
                  onClick={() => onBatchStatusChange('停用/报废')}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium cursor-pointer transition"
                >
                  停用/报废
                </button>
              </div>
            )}

            {onBatchTransfer && (
              <button
                type="button"
                onClick={onBatchTransfer}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                科室调拨
              </button>
            )}

            {onBatchQrPrint && (
              <button
                type="button"
                onClick={() => onBatchQrPrint()}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                打印标签贴
              </button>
            )}

            {onBatchExport && (
              <button
                type="button"
                onClick={onBatchExport}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                导出选中项
              </button>
            )}

            {onBatchDelete && (
              <button
                type="button"
                onClick={onBatchDelete}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除
              </button>
            )}
          </div>

          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="ml-auto text-slate-400 hover:text-white transition p-1 cursor-pointer"
              title="取消选择"
            >
              <XSquare className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Floating Context Menu triggered by Double Click or Right Click */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            className="fixed z-50 w-52 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 py-1.5 text-xs flex flex-col text-left animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/90 rounded-t-xl flex flex-col gap-0.5">
              <span className="font-semibold text-slate-800 text-xs truncate">{contextMenu.item.name}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <span>ID: {contextMenu.item.id}</span>
                <span>•</span>
                <span className="text-blue-600 font-sans">{contextMenu.item.department}</span>
              </div>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  onViewDetails(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>查看台账详情</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddRepairForDevice(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-amber-50 hover:text-amber-800 font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>登记维保工单</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAiDiagnoseDevice(contextMenu.item);
                  setContextMenu(null);
                }}
                className={`w-full text-left px-3 py-1.5 font-medium flex items-center gap-2 transition cursor-pointer ${
                  contextMenu.item.status === '故障待修'
                    ? 'bg-cyan-50 text-cyan-800 font-semibold hover:bg-cyan-100'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-800'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>AI智能排查</span>
                {contextMenu.item.status === '故障待修' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onBatchQrPrint) onBatchQrPrint([contextMenu.item]);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>打印资产二维码贴</span>
              </button>

              {contextMenu.item.calibrationUnit && (
                <button
                  type="button"
                  onClick={() => {
                    const calInfo = getEquipmentCalibrationInfo(contextMenu.item);
                    if (onViewAgencyTransactions && calInfo.agency) {
                      onViewAgencyTransactions(calInfo.agency, contextMenu.item);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>计量单位往来档案</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onChangeStatusForDevice(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>变更设备状态</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onEditDevice(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>编辑设备资料</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  onDeleteDevice(contextMenu.item.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>删除设备条目</span>
              </button>
            </div>
          </div>
        </>
      )}
      {/* AI Health Score Detail Breakdown Modal */}
      <HealthScoreDetailModal
        isOpen={!!healthModalDevice}
        equipment={healthModalDevice}
        onClose={() => setHealthModalDevice(null)}
        onAddRepairForDevice={onAddRepairForDevice}
        onChangeStatusForDevice={onChangeStatusForDevice}
        onViewDetails={onViewDetails}
      />
    </div>
  );
};


import React, { useState } from 'react';
import { MedicalEquipment, EquipmentStatus, SortField, SortOrder, ColumnVisibility, DEFAULT_COLUMN_VISIBILITY, DepartmentMaster, EquipmentViewMode, EquipmentQuickFilterKey } from '../types';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentHealthScore, getEquipmentMaintenanceNode } from '../utils/equipmentUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { getDepartmentMasterInfo } from '../utils/masterData';
import { resolveMainCategory, resolveLevel1Category, resolveLevel2Category } from '../utils/categoryFormatter';
import { calculateEquipmentBudgetProfile } from '../utils/budgetExecutionUtils';
import { HealthScoreDetailModal } from './HealthScoreDetailModal';
import { EquipmentCardGrid } from './EquipmentCardGrid';
import { EquipmentPhotoStream } from './EquipmentPhotoStream';
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
  AlertOctagon,
  CheckCircle2,
  MoreHorizontal,
  ChevronDown,
  Columns,
  Scale,
  Hourglass,
  QrCode,
  Building2,
  Sparkles,
  Calendar,
  ArrowRightLeft,
  RotateCcw,
  Smartphone,
  ShieldCheck,
  FileCheck,
  Printer,
  Table2,
  LayoutGrid,
  Images
} from 'lucide-react';
import { computeLoanTimeProgress, LoanCountdownBadge } from './LoanTimeProgressBar';

interface EquipmentTableProps {
  equipmentList: MedicalEquipment[];
  filteredEquipment?: MedicalEquipment[];
  selectedIds: string[];
  currentPage?: number;
  pageSize?: number;
  sortField?: SortField;
  sortOrder?: SortOrder;
  density?: 'default' | 'compact';
  splitCategories?: boolean;
  columnVisibility?: ColumnVisibility;
  // 视图模式 (紧凑表格 | 大卡片平铺 | 设备照片流)
  viewMode?: EquipmentViewMode;
  onChangeViewMode?: (mode: EquipmentViewMode) => void;
  // 视图模式专属快速筛选
  activeQuickFilter?: EquipmentQuickFilterKey;
  onSelectQuickFilter?: (key: EquipmentQuickFilterKey) => void;
  onSortFieldChange?: (field: SortField) => void;
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
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
  onBatchDelete?: () => void;
  onBatchStatusChange?: (status: EquipmentStatus) => void;
  onBatchExport?: () => void;
  onBatchTransfer?: () => void;
  onBatchQrPrint?: (items?: MedicalEquipment[]) => void;
  onClearSelection?: () => void;
  onNavigateToInspection?: (item: MedicalEquipment) => void;
  onOpenOverdueFiling?: (item: MedicalEquipment) => void;
  onPrintQrLabel?: (item: MedicalEquipment) => void;
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipmentList,
  filteredEquipment,
  selectedIds,
  currentPage = 1,
  pageSize = 20,
  sortField = 'categoryNo',
  sortOrder = 'asc',
  density = 'default',
  splitCategories = false,
  columnVisibility,
  viewMode = 'compact_table',
  onChangeViewMode,
  activeQuickFilter = 'all',
  onSelectQuickFilter,
  onSortFieldChange,
  onToggleSelectAll,
  onToggleSelectRow,
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
  onBatchDelete,
  onBatchStatusChange,
  onBatchExport,
  onBatchTransfer,
  onBatchQrPrint,
  onClearSelection,
  onNavigateToInspection,
  onOpenOverdueFiling,
  onPrintQrLabel,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: MedicalEquipment } | null>(null);
  const [healthModalDevice, setHealthModalDevice] = useState<MedicalEquipment | null>(null);

  const cols = columnVisibility || DEFAULT_COLUMN_VISIBILITY;

  const handleRowClick = (e: React.MouseEvent, item: MedicalEquipment) => {
    const target = e.target as HTMLElement;
    // 过滤选择框、按钮、链接或标记阻止穿透的元素
    if (target.closest('input, button, a, [data-prevent-row-click="true"]')) {
      return;
    }
    // 报修跟踪逻辑：当设备处于故障待修/维保状态，或存在报修记录时，行点击直接穿透科室报修跟踪与外协协同视图
    const hasRepairContext = item.status === '故障待修' || item.status === '维护保养中' || (item.repairRecords && item.repairRecords.length > 0);
    onViewDetails(item, hasRepairContext ? 'repairs' : undefined);
  };

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

  const renderStatusBadge = (status: EquipmentStatus, item?: MedicalEquipment) => {
    switch (status) {
      case '正常运行':
        return (
          <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-50 via-emerald-100/50 to-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs rounded-md text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
            正常运行
          </span>
        );
      case '维护保养中':
        return (
          <span className="px-2.5 py-1 bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 text-amber-800 border border-amber-300 shadow-2xs rounded-md text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs"></span>
            维护保养中
          </span>
        );
      case '故障待修':
        return (
          <div className="inline-flex items-center gap-1.5 justify-center flex-wrap">
            <span className="px-2.5 py-1 bg-gradient-to-r from-rose-50 via-rose-100/50 to-rose-50 text-rose-800 border border-rose-300 shadow-2xs rounded-md text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-xs"></span>
              故障待修
            </span>
            {item && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatusForDevice(item);
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white rounded text-xs font-bold inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                title="现场已完成排查或检修，点击修复故障并恢复正常运行"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>修复故障</span>
              </button>
            )}
          </div>
        );
      case '停用/报废':
        return (
          <span className="px-2.5 py-1 bg-gradient-to-r from-slate-100 via-slate-200/50 to-slate-100 text-slate-700 border border-slate-300 shadow-2xs rounded-md text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            停用/报废
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold shrink-0 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const cellPyClass = density === 'compact' ? 'py-2.5 px-3 border-r border-slate-200/80' : 'py-3 px-3.5 border-r border-slate-200/80';

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-white overflow-hidden">
      {/* 台账表格头功能栏：视图模式切换与状态摘要 */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 select-none text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            {viewMode === 'card_grid' ? (
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
            ) : viewMode === 'photo_stream' ? (
              <Images className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Table2 className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>
              {viewMode === 'card_grid'
                ? '大卡片平铺视图'
                : viewMode === 'photo_stream'
                ? '设备照片流视图'
                : '紧凑表格视图'}
            </span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-2xs">
            当前页 <strong className="text-slate-800 font-bold">{equipmentList.length}</strong> 台
            {selectedIds.length > 0 && (
              <span className="ml-1 text-blue-600 font-bold">(已选 {selectedIds.length} 台)</span>
            )}
          </span>
        </div>
      </div>

      {/* 视图内容区按模式动态渲染 */}
      {viewMode === 'card_grid' ? (
        <EquipmentCardGrid
          equipmentList={equipmentList}
          selectedIds={selectedIds}
          currentPage={currentPage}
          pageSize={pageSize}
          onToggleSelectRow={onToggleSelectRow}
          onViewDetails={onViewDetails}
          onAddRepairForDevice={onAddRepairForDevice}
          onChangeStatusForDevice={onChangeStatusForDevice}
          onEditDevice={onEditDevice}
          onDeleteDevice={onDeleteDevice}
          onAiDiagnoseDevice={onAiDiagnoseDevice}
          onOpenAiDimensionModal={onOpenAiDimensionModal}
          onViewDepartmentDetails={onViewDepartmentDetails}
          onViewAgencyTransactions={onViewAgencyTransactions}
          onBorrowEquipment={onBorrowEquipment}
          onReturnEquipment={onReturnEquipment}
          onNavigateToInspection={onNavigateToInspection}
          onOpenOverdueFiling={onOpenOverdueFiling}
          onPrintQrLabel={onPrintQrLabel}
          onHealthScoreClick={(device) => setHealthModalDevice(device)}
        />
      ) : viewMode === 'photo_stream' ? (
        <EquipmentPhotoStream
          equipmentList={equipmentList}
          selectedIds={selectedIds}
          currentPage={currentPage}
          pageSize={pageSize}
          onToggleSelectRow={onToggleSelectRow}
          onViewDetails={onViewDetails}
          onAddRepairForDevice={onAddRepairForDevice}
          onChangeStatusForDevice={onChangeStatusForDevice}
          onAiDiagnoseDevice={onAiDiagnoseDevice}
          onPrintQrLabel={onPrintQrLabel}
          onHealthScoreClick={(device) => setHealthModalDevice(device)}
        />
      ) : (
        /* Scrollable Container for Table */
        <div className="flex-1 overflow-auto relative panoramic-scrollbar pb-1">
          {equipmentList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 my-auto">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">未找到符合条件的设备记录</p>
            <p className="text-xs text-slate-400 mt-1">请尝试修改关键字、科室或运行状态筛选条件</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-max">
          {/* Table Sticky Header */}
          <thead className="sticky top-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 backdrop-blur-xs z-10 shadow-xs select-none">
            <tr className="text-slate-800 text-xs sm:text-[13px] font-bold border-b-2 border-slate-300">
              {/* Checkbox & 序号 */}
              <th className={`text-center font-bold text-slate-800 whitespace-nowrap border-r border-slate-200/70 ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`} style={{ width: '64px', minWidth: '64px' }}>
                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    title={isAllSelected ? "取消全选" : "全选当前页"}
                  />
                  {cols.indexNumber && <span className="text-xs font-bold text-slate-700">序号</span>}
                </div>
              </th>

              {/* 设备ID */}
              {cols.id && (
                <th
                  onClick={() => handleSortClick('id')}
                  className={`w-20 min-w-[76px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按设备ID排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">设备ID</span>
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
                      className={`min-w-[110px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                      title="按大类编号排序"
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="group-hover/th:text-blue-700">大类</span>
                        {renderSortIndicator('categoryNo')}
                      </div>
                    </th>
                  )}
                  {cols.level1Category && (
                    <th
                      onClick={() => handleSortClick('level1No')}
                      className={`min-w-[120px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                      title="按一级分类编号排序"
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="group-hover/th:text-blue-700">一级分类</span>
                        {renderSortIndicator('level1No')}
                      </div>
                    </th>
                  )}
                  {cols.level2Category && (
                    <th
                      onClick={() => handleSortClick('level2No')}
                      className={`min-w-[130px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                      title="按二级分类编号排序"
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="group-hover/th:text-blue-700">二级分类</span>
                        {renderSortIndicator('level2No')}
                      </div>
                    </th>
                  )}
                </>
              ) : (
                (cols.category || cols.level1Category || cols.level2Category) && (
                  <th
                    onClick={() => handleSortClick('categoryNo')}
                    className={`font-bold text-slate-700 min-w-[160px] cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                    title="按大类编号排序"
                  >
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="group-hover/th:text-blue-700">分类层级 (三级)</span>
                      {renderSortIndicator('categoryNo')}
                    </div>
                  </th>
                )
              )}

              {/* 设备名称 / 型号 */}
              {cols.nameModel && (
                <th
                  onClick={() => handleSortClick('name')}
                  className={`min-w-[170px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按设备名称排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">设备名称 / 规格型号</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
              )}

              {/* 出厂编号 / 生产厂家 */}
              {(cols.sn || cols.manufacturer) && (
                <th
                  onClick={() => handleSortClick('sn')}
                  className={`min-w-[150px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按出厂编号SN排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">
                      {cols.sn && cols.manufacturer
                        ? '出厂编号 / 生产厂家'
                        : cols.sn
                        ? '出厂编号 (SN)'
                        : '生产厂家'}
                    </span>
                    {renderSortIndicator('sn')}
                  </div>
                </th>
              )}

              {/* 使用科室 / 存放位置 (移动到运行状态左边) */}
              {(cols.department || cols.location) && (
                <th
                  onClick={() => handleSortClick('department')}
                  className={`min-w-[140px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按使用科室排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">
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

              {/* 使用场所 */}
              {cols.usageLocation && (
                <th
                  onClick={() => handleSortClick('usageLocation')}
                  className={`min-w-[130px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按具体使用场所排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">使用场所</span>
                    {renderSortIndicator('usageLocation')}
                  </div>
                </th>
              )}

              {/* 运行状态 */}
              {cols.status && (
                <th
                  onClick={() => handleSortClick('status')}
                  className={`w-28 min-w-[100px] text-center font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}
                  title="按运行状态排序"
                >
                  <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">运行状态</span>
                    {renderSortIndicator('status')}
                  </div>
                </th>
              )}

              {/* 生产日期 / 设计寿命 */}
              {cols.manufactureDate && (
                <th
                  onClick={() => handleSortClick('manufactureDate')}
                  className={`min-w-[140px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="出厂生产日期与产品设计使用寿命（老龄化服役期）"
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Hourglass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="group-hover/th:text-blue-700">生产日期 / 设计寿命</span>
                    {renderSortIndicator('manufactureDate')}
                  </div>
                </th>
              )}

              {/* 投用时间 */}
              {cols.enableDate && (
                <th
                  onClick={() => handleSortClick('enableDate')}
                  className={`w-28 min-w-[100px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按投用时间排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">投用时间</span>
                    {renderSortIndicator('enableDate')}
                  </div>
                </th>
              )}

              {/* 法定计量 / 周期检定 */}
              {cols.calibration && (
                <th 
                  className={`min-w-[160px] font-bold text-slate-700 border-r border-slate-200/70 whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="法定计量部门周期性强制检定与量值溯源证书效期"
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Scale className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>法定计量 / 周期检定</span>
                  </div>
                </th>
              )}

              {/* 购置金额 */}
              {cols.purchasePrice && (
                <th
                  onClick={() => handleSortClick('purchasePrice')}
                  className={`w-28 min-w-[100px] text-right font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按购置金额排序"
                >
                  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">购置金额 (元)</span>
                    {renderSortIndicator('purchasePrice')}
                  </div>
                </th>
              )}

              {/* 累计维保 / 支出费用 */}
              {cols.repairStats && (
                <th
                  onClick={() => handleSortClick('repairCost')}
                  className={`w-40 min-w-[150px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="点击按合计支出/维保费用排序"
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="group-hover/th:text-blue-700">累计维保 / 费用</span>
                    {renderSortIndicator('repairCost')}
                  </div>
                </th>
              )}

              {/* AI健康得分 */}
              {cols.healthScore && (
                <th className={`w-28 min-w-[105px] text-center font-bold text-slate-700 border-r border-slate-200/70 whitespace-nowrap ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`}>
                  <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>AI健康得分</span>
                  </div>
                </th>
              )}

              {/* 保养节点 / 状态 */}
              {cols.maintenanceNode && (
                <th className={`min-w-[130px] font-bold text-slate-700 border-r border-slate-200/70 whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>保养节点 / 状态</span>
                  </div>
                </th>
              )}

              {/* 资产编号 (右侧资产追溯区) */}
              {cols.assetNo && (
                <th
                  onClick={() => handleSortClick('assetNo')}
                  className={`min-w-[120px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按资产编号排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">资产编号</span>
                    {renderSortIndicator('assetNo')}
                  </div>
                </th>
              )}

              {/* 资产归属 (右侧资产追溯区) */}
              {cols.assetOwnership && (
                <th
                  onClick={() => handleSortClick('assetOwnership')}
                  className={`min-w-[95px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按资产归属排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">资产归属</span>
                    {renderSortIndicator('assetOwnership')}
                  </div>
                </th>
              )}

              {/* code_id (右侧资产追溯区) */}
              {cols.codeId && (
                <th
                  onClick={() => handleSortClick('codeId')}
                  className={`min-w-[110px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200/70 transition border-r border-slate-200/70 group/th whitespace-nowrap ${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'}`}
                  title="按code_id追溯码排序"
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="group-hover/th:text-blue-700">code_id</span>
                    {renderSortIndicator('codeId')}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
            {equipmentList.map((item, index) => {
              const isSelected = selectedIds.includes(item.id);
              const rowNum = (currentPage - 1) * pageSize + index + 1;
              const vInfo = getEquipmentValidityInfo(item);

              return (
                <tr
                  key={item.id}
                  onClick={(e) => handleRowClick(e, item)}
                  onDoubleClick={(e) => handleRowDoubleClick(e, item)}
                  onContextMenu={(e) => handleRowContextMenu(e, item)}
                  title="💡 单击行查看设备详情与科室报修跟踪（右键或双击展开快捷菜单）"
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
                  <td className={`text-center border-r border-slate-200/80 ${density === 'compact' ? 'py-2 px-2' : 'py-2.5 px-2.5'}`} style={{ width: '64px', minWidth: '64px' }}>
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(item.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      {cols.indexNumber && (
                        <span className="font-mono font-bold text-slate-600 text-xs sm:text-[13px] shrink-0 select-none">
                          {rowNum}
                        </span>
                      )}
                    </div>
                  </td>
                  {cols.id && (
                    <td className={`${density === 'compact' ? 'py-2 px-2.5' : 'py-2.5 px-3'} font-mono font-bold text-slate-900 text-xs sm:text-[13px] w-20 min-w-[76px] border-r border-slate-200/80 whitespace-nowrap`}>
                      <div className="flex items-center gap-1 group/copy">
                        <span className="text-slate-900 font-bold">{item.id}</span>
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
                      {cols.category && (() => {
                        const catInfo = resolveMainCategory(item.categoryNo, item.category, `${item.name || ''} ${item.level2Category || ''} ${item.level1Category || ''}`);
                        return (
                          <td className={cellPyClass}>
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[11px] font-semibold shrink-0">
                                {catInfo.code}
                              </span>
                              <span className="truncate max-w-[140px] font-medium text-slate-800 text-xs sm:text-sm" title={catInfo.name}>
                                {catInfo.name}
                              </span>
                            </div>
                          </td>
                        );
                      })()}
                      {/* Column 2: 一级分类 */}
                      {cols.level1Category && (() => {
                        const l1Info = resolveLevel1Category(item.level1No, item.level1Category, item.categoryNo);
                        return (
                          <td className={cellPyClass}>
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[11px] font-semibold shrink-0">
                                {l1Info.code}
                              </span>
                              <span className="truncate max-w-[140px] font-medium text-slate-800 text-xs sm:text-sm" title={l1Info.name}>
                                {l1Info.name}
                              </span>
                            </div>
                          </td>
                        );
                      })()}
                      {/* Column 3: 二级分类 */}
                      {cols.level2Category && (() => {
                        const l2Info = resolveLevel2Category(item.level2No, item.level2Category, item.level1No);
                        return (
                          <td className={cellPyClass}>
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[11px] font-semibold shrink-0">
                                {l2Info.code}
                              </span>
                              <span className="truncate max-w-[150px] font-medium text-slate-800 text-xs sm:text-sm" title={l2Info.name}>
                                {l2Info.name}
                              </span>
                            </div>
                          </td>
                        );
                      })()}
                    </>
                  ) : (
                    (cols.category || cols.level1Category || cols.level2Category) && (
                      <td className={cellPyClass}>
                        <div className="flex flex-col gap-1 text-xs sm:text-sm max-w-[280px]">
                          {/* Level 1: 大类 */}
                          {cols.category && (() => {
                            const catInfo = resolveMainCategory(item.categoryNo, item.category, `${item.name || ''} ${item.level2Category || ''} ${item.level1Category || ''}`);
                            return (
                              <div className="flex items-center gap-1.5 text-slate-800">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[11px] font-semibold shrink-0">
                                  {catInfo.code}
                                </span>
                                <span className="truncate font-medium text-slate-800 text-xs sm:text-sm" title={catInfo.name}>
                                  {catInfo.name}
                                </span>
                              </div>
                            );
                          })()}
                          
                          {/* Level 2: 一级分类 */}
                          {cols.level1Category && (() => {
                            const l1Info = resolveLevel1Category(item.level1No, item.level1Category, item.categoryNo);
                            return (
                              <div className="flex items-center gap-1.5 text-slate-800 pl-2 border-l-2 border-slate-200">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[11px] font-semibold shrink-0">
                                  {l1Info.code}
                                </span>
                                <span className="truncate font-medium text-slate-800 text-xs sm:text-sm" title={item.level1Category}>
                                  {l1Info.name}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Level 3: 二级分类 */}
                          {cols.level2Category && (() => {
                            const l2Info = resolveLevel2Category(item.level2No, item.level2Category, item.level1No);
                            return (
                              <div className="flex items-center gap-1.5 text-slate-800 pl-2 border-l-2 border-slate-200">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[11px] font-semibold shrink-0">
                                  {l2Info.code}
                                </span>
                                <span className="truncate font-medium text-slate-800 text-xs sm:text-sm" title={item.level2Category}>
                                  {l2Info.name}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                    )
                  )}

                  {cols.nameModel && (
                    <td className={cellPyClass}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            onClick={() => onViewDetails(item)}
                            className="font-bold text-slate-900 text-sm hover:text-blue-600 transition cursor-pointer leading-snug"
                            title="点击查看详情"
                          >
                            {item.name}
                          </span>
                          {onOpenAiDimensionModal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAiDimensionModal(item);
                              }}
                              className="px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10.5px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs group/ai"
                              title="点击启动该设备的 AI 多维交互式深度研判"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-purple-600 group-hover/ai:scale-110 transition-transform" />
                              <span>AI研判</span>
                            </button>
                          )}
                          {item.internalNo && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[11px] font-mono font-bold shrink-0 shadow-2xs"
                              title={`科室内部编号: ${item.internalNo} (临床科室日常区分及报修呼叫)`}
                            >
                              #{item.internalNo}
                            </span>
                          )}
                        </div>
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
                  {(cols.department || cols.location) && (
                    <td className={cellPyClass}>
                      {(() => {
                        const ownerDept = item.ownerDepartment || item.department;
                        const deptMaster = getDepartmentMasterInfo(ownerDept);
                        const building = (item.building && item.building.trim() !== '') ? item.building : deptMaster.building;
                        const floor = (item.floor && item.floor.trim() !== '') ? item.floor : deptMaster.floor;
                        const activeLoan = item.currentLoan && item.currentLoan.loanStatus !== 'returned' ? item.currentLoan : null;
                        const loanProgress = activeLoan ? computeLoanTimeProgress(activeLoan.borrowTime, activeLoan.expectedReturnTime) : null;
                        const isOverdue = activeLoan?.loanStatus === 'overdue' || (loanProgress?.isOverdue ?? false);

                        return (
                          <div className="flex flex-col gap-1">
                            {cols.department && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDepartmentDetails?.(ownerDept);
                                  }}
                                  className="font-bold text-blue-700 hover:text-blue-900 hover:underline text-sm text-left flex items-center gap-1 cursor-pointer group/dept w-fit max-w-full"
                                  title={`点击查看产权科室【${ownerDept}】全景档案与在账设备`}
                                >
                                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover/dept:scale-110 transition-transform" />
                                  <span className="truncate">{ownerDept}</span>
                                </button>

                                {!activeLoan && onBorrowEquipment && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onBorrowEquipment(item);
                                    }}
                                    className="opacity-80 hover:opacity-100 px-1.5 py-0.2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded text-[10.5px] font-medium transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                    title="登记跨科室借出/调配"
                                  >
                                    <ArrowRightLeft className="w-2.5 h-2.5 text-amber-600" />
                                    <span>借出</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* 处于借用/借出状态时的醒目标识与‘剩余使用天数’倒计时标签 */}
                            {activeLoan && loanProgress ? (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewDetails(item);
                                }}
                                className={`p-2 rounded-md border text-xs flex flex-col gap-1.5 transition cursor-pointer ${
                                  loanProgress.isOverdue
                                    ? 'bg-rose-50/95 border-rose-300 text-rose-950 hover:bg-rose-100/90 shadow-2xs'
                                    : loanProgress.colorTheme === 'approaching'
                                    ? 'bg-amber-50/95 border-amber-300 text-amber-950 hover:bg-amber-100/90 shadow-2xs'
                                    : 'bg-blue-50/70 border-blue-200 text-slate-800 hover:bg-blue-50'
                                }`}
                                title={`【跨科借用中】\n借入科室: ${activeLoan.borrowingDepartment}\n经手人: ${activeLoan.borrowerName}\n借出时间: ${activeLoan.borrowTime}\n预计归还: ${activeLoan.expectedReturnTime}\n时效分析: ${loanProgress.countdownLabel}\n事由: ${activeLoan.borrowReason || '临床应急抢救支撑'}`}
                              >
                                <div className="flex items-center justify-between gap-1 flex-wrap font-semibold">
                                  <div className="flex items-center gap-1 truncate text-xs">
                                    <ArrowRightLeft className={`w-3.5 h-3.5 shrink-0 ${loanProgress.isOverdue ? 'text-rose-600' : loanProgress.colorTheme === 'approaching' ? 'text-amber-700' : 'text-blue-600'}`} />
                                    <span className="truncate">借至: <strong className={loanProgress.isOverdue ? 'text-rose-900 underline' : 'text-slate-900 underline'}>{activeLoan.borrowingDepartment}</strong></span>
                                  </div>
                                  
                                  {/* ‘剩余使用天数’倒计时标签：过半黄色提醒、到期红色提醒 */}
                                  <LoanCountdownBadge loan={activeLoan} variant="badge" className="font-bold shadow-2xs" />
                                </div>

                                <div className="flex items-center justify-between gap-1 text-[10.5px] text-slate-600 font-medium pt-1 border-t border-slate-200/80">
                                  <span className="font-mono truncate text-slate-700">
                                    预还: {activeLoan.expectedReturnTime ? activeLoan.expectedReturnTime.slice(5, 10) : '-'} (已用{loanProgress.rawPercent}%)
                                  </span>
                                  {onReturnEquipment && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onReturnEquipment(item);
                                      }}
                                      className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10.5px] font-bold transition flex items-center gap-0.5 shadow-2xs cursor-pointer shrink-0"
                                      title="办理设备归还验收"
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" />
                                      <span>归还</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              cols.location && (
                                <div className="text-xs text-slate-700 flex items-center gap-1.5 flex-wrap font-medium">
                                  <span>{building || '1号楼 综合楼'}</span>
                                  {floor && <span className="bg-slate-100 border border-slate-300 text-slate-800 rounded px-1.5 text-xs font-mono font-bold">{floor}F</span>}
                                </div>
                              )
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  )}
                  {cols.usageLocation && (
                    <td className={cellPyClass}>
                      <span className="text-xs text-slate-700 max-w-[170px] truncate block font-medium" title={item.usageLocation || item.location}>
                        {item.usageLocation || item.location || '-'}
                      </span>
                    </td>
                  )}
                  {cols.status && (
                    <td className={`${cellPyClass} text-center`}>{renderStatusBadge(item.status, item)}</td>
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

                        {vInfo.dualBadge ? (
                          <div className="flex flex-col gap-1 w-fit">
                            {/* 双重合规身份：明确展示“已超期”但“经整修与72h稳定性合格检测准用” */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-l bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold shadow-2xs">
                                <Hourglass className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>{vInfo.dualBadge.overdueText}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-r bg-emerald-700 text-white text-[11px] font-bold shadow-2xs">
                                <ShieldCheck className="w-3 h-3 text-emerald-200 shrink-0" />
                                <span>{vInfo.dualBadge.complianceText}</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-emerald-800 font-mono flex items-center gap-0.5">
                                <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>备案: {vInfo.dualBadge.filingNo}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                {onPrintQrLabel && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPrintQrLabel(item);
                                    }}
                                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                    title="打印该超期设备的专属绿色特许准用合格标签贴"
                                  >
                                    <Printer className="w-2.5 h-2.5" />
                                    <span>准用贴</span>
                                  </button>
                                )}
                                {onOpenOverdueFiling && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenOverdueFiling(item);
                                    }}
                                    className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline cursor-pointer"
                                    title="查看/更新超期设备特许准用备案凭证与稳定性测试报告"
                                  >
                                    查看备案
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : vInfo.riskLevel === 'high' ? (
                          <div className="flex flex-col gap-1 w-fit">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold w-fit shadow-2xs">
                              <Hourglass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              超龄服役: +{vInfo.yearsPast}年
                            </span>
                            {onOpenOverdueFiling && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenOverdueFiling(item);
                                }}
                                className="text-[10.5px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1 cursor-pointer w-fit"
                                title="该设备已达到或超出设计使用寿命，点击发起整修与稳定性合格备案准用"
                              >
                                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>办理超期准用备案</span>
                              </button>
                            )}
                          </div>
                        ) : vInfo.riskLevel === 'medium' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50/80 text-amber-800 border border-amber-200 text-xs font-bold w-fit shadow-2xs">
                            <Hourglass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            寿命临期: 剩{vInfo.daysRemaining}天
                          </span>
                        ) : vInfo.riskLevel === 'low' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            服役期内 (正常)
                          </span>
                        ) : (
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
                  {cols.purchasePrice && (
                    <td className={`${cellPyClass} text-right`}>
                      <span className="text-slate-900 font-mono font-bold text-sm notranslate" translate="no">
                        ￥{((item.purchasePrice || 85000)).toLocaleString()}
                      </span>
                    </td>
                  )}

                  {/* 累计维修与费用及预算预警标记 */}
                  {cols.repairStats && (() => {
                    const count = item.repairRecords?.length || item.repairCount || 0;
                    const cost = item.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
                    const budgetProfile = calculateEquipmentBudgetProfile(item);
                    return (
                      <td className={`${cellPyClass} min-w-[160px]`}>
                        <div className="flex flex-col gap-1 whitespace-nowrap">
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(item, 'repairs');
                              }}
                              className="font-bold text-slate-900 text-sm flex items-center gap-1 hover:text-blue-600 transition cursor-pointer text-left"
                              title="点击穿透查看科室报修跟踪、外协协同进度及验收复核"
                            >
                              <span>{count} 次维修</span>
                            </button>
                            <span className="font-mono text-xs text-amber-800 font-bold notranslate" translate="no">
                              支出: ￥{cost.toLocaleString()}
                            </span>
                          </div>

                          {/* 外协协同进度与临床复核快捷通道 */}
                          {(item.status === '故障待修' || count > 0) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(item, 'repairs');
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10.5px] font-bold shadow-2xs w-fit transition cursor-pointer"
                              title="点击即刻查询外协单位维保协同进度、阶段反馈与临床验收选项"
                            >
                              <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>外协协同进度 · 验收复核</span>
                              {item.status === '故障待修' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              )}
                            </button>
                          )}

                          {/* 预算上限预警可视化标记 (触及上限 / 即将触及) */}
                          {budgetProfile.warningLevel === 'exceeded' && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[10.5px] font-bold shadow-2xs w-fit"
                              title={`预算执行率 ${budgetProfile.budgetExecutionRate}%: 已触及原值40%维保预算上限(￥${budgetProfile.maintenanceBudgetCeiling.toLocaleString()})，累计维保￥${budgetProfile.totalMaintenanceCost.toLocaleString()}，折旧进度 ${budgetProfile.depreciationProgressRate}%`}
                            >
                              <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>触及预算上限 ({budgetProfile.budgetExecutionRate}%)</span>
                            </span>
                          )}
                          {budgetProfile.warningLevel === 'approaching' && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] font-bold shadow-2xs w-fit"
                              title={`预算执行率 ${budgetProfile.budgetExecutionRate}%: 即将触及维保预算上限(已消耗￥${budgetProfile.totalMaintenanceCost.toLocaleString()}/上限￥${budgetProfile.maintenanceBudgetCeiling.toLocaleString()})，折旧进度 ${budgetProfile.depreciationProgressRate}%`}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>即将触及上限 ({budgetProfile.budgetExecutionRate}%)</span>
                            </span>
                          )}
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
                          className="inline-flex flex-col items-center gap-0.5 cursor-pointer group/score"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHealthModalDevice(item);
                          }}
                          title={`点击穿透查看“${item.name}”的AI健康得分 (${hInfo.score}分) 扣分归因明细`}
                        >
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1 shadow-2xs group-hover/score:scale-105 active:scale-95 transition-all ${hInfo.badgeBg}`}>
                            <Sparkles className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span>{hInfo.score}分</span>
                            <span className="opacity-85 font-normal text-[10.5px]">({hInfo.label})</span>
                          </span>
                          <span className="text-[10px] text-blue-700 font-medium opacity-0 group-hover/score:opacity-100 transition-opacity whitespace-nowrap">
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

                  {/* 资产编号 (右侧资产追溯区) */}
                  {cols.assetNo && (
                    <td className={cellPyClass}>
                      <div className="flex items-center gap-1 group/asset">
                        <span className="font-mono font-bold text-slate-800 text-xs whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.assetNo || `ZC-2023-${item.id}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.assetNo || `ZC-2023-${item.id}`, `asset-${item.id}`)}
                          className="opacity-0 group-hover/asset:opacity-100 text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5 rounded"
                          title="复制资产编号"
                        >
                          {copiedId === `asset-${item.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  )}

                  {/* 资产归属 (右侧资产追溯区) */}
                  {cols.assetOwnership && (
                    <td className={cellPyClass}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                        {item.assetOwnership || '医院自有'}
                      </span>
                    </td>
                  )}

                  {/* code_id (右侧资产追溯区) */}
                  {cols.codeId && (
                    <td className={cellPyClass}>
                      <div className="flex items-center gap-1 group/code">
                        <span className="font-mono text-slate-700 font-medium text-xs whitespace-nowrap bg-slate-100/80 px-1 py-0.5 rounded border border-slate-200">
                          {item.codeId || `COD-${item.id}`}
                        </span>
                        {item.caoliaoUrl && (
                          <a
                            href={item.caoliaoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded transition"
                            title="打开草料在线活码页面"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.codeId || `COD-${item.id}`, `code-${item.id}`)}
                          className="opacity-0 group-hover/code:opacity-100 text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5 rounded"
                          title="复制code_id"
                        >
                          {copiedId === `code-${item.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-3 mx-auto my-2 z-20 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-4 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>已选中 <strong className="text-blue-400 text-sm font-bold">{selectedIds.length}</strong> 台设备</span>
          </div>

          <div className="flex items-center gap-2">
            {onBatchStatusChange && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedIds.some(id => equipmentList.find(e => e.id === id)?.status === '故障待修') && (
                  <button
                    type="button"
                    onClick={() => onBatchStatusChange('正常运行')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                    title="将所选故障设备批量排除故障并恢复正常运行"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>一键修复所选故障设备</span>
                  </button>
                )}
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

            {onOpenAiDimensionModal && (
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.length > 1) {
                    onOpenAiDimensionModal(undefined);
                  } else {
                    const firstSelected = equipmentList.find(e => selectedIds.includes(e.id));
                    onOpenAiDimensionModal(firstSelected || equipmentList[0]);
                  }
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                <span>{selectedIds.length > 1 ? `多台群体 AI 研判 (${selectedIds.length}台)` : 'AI 辅助研判'}</span>
              </button>
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
              {contextMenu.item.status === '故障待修' && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeStatusForDevice(contextMenu.item);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-2 transition cursor-pointer border-b border-emerald-100"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>修复故障 · 恢复正常运行</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onViewDetails(contextMenu.item, 'repairs');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 bg-gradient-to-r from-indigo-50/80 to-sky-50/80 hover:from-indigo-100 hover:to-sky-100 text-indigo-900 font-bold flex items-center gap-2 transition cursor-pointer border-b border-indigo-100/60"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>科室报修跟踪 · 外协协同与验收</span>
                {contextMenu.item.status === '故障待修' && (
                  <span className="ml-auto px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    待复核
                  </span>
                )}
              </button>

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

              {onNavigateToInspection && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToInspection(contextMenu.item);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-indigo-700 hover:bg-indigo-50 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>移动巡检 · 现场核验</span>
                </button>
              )}

              {onOpenAiDimensionModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAiDimensionModal(contextMenu.item);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-900 font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>AI 交互多维研判</span>
                </button>
              )}

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

              {onOpenOverdueFiling && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenOverdueFiling(contextMenu.item);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-emerald-800 hover:bg-emerald-50 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>超期整修与准用备案</span>
                  {contextMenu.item.overdueFiling?.filingStatus === 'ACTIVE' && (
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">已备案</span>
                  )}
                </button>
              )}

              {contextMenu.item.overdueFiling?.filingStatus === 'ACTIVE' && onPrintQrLabel && (
                <button
                  type="button"
                  onClick={() => {
                    onPrintQrLabel(contextMenu.item);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>打印特许准用专属标签</span>
                </button>
              )}

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


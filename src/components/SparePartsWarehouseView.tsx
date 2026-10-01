import React, { useState, useMemo, useEffect } from 'react';
import {
  SparePartItem,
  StockTransactionRecord,
  SparePartCategory,
  StockAlertStatus,
  StockTransactionType
} from '../types/sparePartsTypes';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import {
  calculateSparePartsKpiStats,
  restockSparePart,
  saveStoredSpareParts,
  saveStoredStockTransactions,
  loadStoredSpareParts,
  loadStoredStockTransactions
} from '../utils/sparePartsData';
import {
  Package,
  Boxes,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  FileText,
  Printer,
  X,
  MapPin,
  Tag,
  DollarSign,
  Calendar,
  Building2,
  Wrench,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Pagination } from './Pagination';

export interface SparePartsWarehouseViewProps {
  partsList?: SparePartItem[];
  transactionsList?: StockTransactionRecord[];
  workOrders?: EngineeringWorkOrder[];
  onUpdatePartsList?: (newParts: SparePartItem[]) => void;
  onUpdateTransactionsList?: (newTxs: StockTransactionRecord[]) => void;
  onNavigateToWorkOrder?: (workOrderId: string) => void;
  currentUserName?: string;
}

export const SparePartsWarehouseView: React.FC<SparePartsWarehouseViewProps> = ({
  partsList: propPartsList,
  transactionsList: propTransactionsList,
  workOrders,
  onUpdatePartsList,
  onUpdateTransactionsList,
  onNavigateToWorkOrder,
  currentUserName = '医学工程处备件库管'
}) => {
  // Self-reliant state initialized from props or durable localStorage
  const [internalParts, setInternalParts] = useState<SparePartItem[]>(() => {
    if (propPartsList && Array.isArray(propPartsList) && propPartsList.length > 0) {
      return propPartsList;
    }
    return loadStoredSpareParts();
  });

  const [internalTransactions, setInternalTransactions] = useState<StockTransactionRecord[]>(() => {
    if (propTransactionsList && Array.isArray(propTransactionsList) && propTransactionsList.length > 0) {
      return propTransactionsList;
    }
    return loadStoredStockTransactions();
  });

  // Sync when parent updates props
  useEffect(() => {
    if (propPartsList && Array.isArray(propPartsList)) {
      setInternalParts(propPartsList);
    }
  }, [propPartsList]);

  useEffect(() => {
    if (propTransactionsList && Array.isArray(propTransactionsList)) {
      setInternalTransactions(propTransactionsList);
    }
  }, [propTransactionsList]);

  // Safe active references
  const currentParts = useMemo(() => {
    const list = propPartsList && Array.isArray(propPartsList) && propPartsList.length > 0 ? propPartsList : internalParts;
    return Array.isArray(list) ? list : [];
  }, [propPartsList, internalParts]);

  const currentTransactions = useMemo(() => {
    const list = propTransactionsList && Array.isArray(propTransactionsList) && propTransactionsList.length > 0 ? propTransactionsList : internalTransactions;
    return Array.isArray(list) ? list : [];
  }, [propTransactionsList, internalTransactions]);

  // Sync update helper
  const updateParts = (newParts: SparePartItem[]) => {
    setInternalParts(newParts);
    saveStoredSpareParts(newParts);
    onUpdatePartsList?.(newParts);
  };

  const updateTransactions = (newTxs: StockTransactionRecord[]) => {
    setInternalTransactions(newTxs);
    saveStoredStockTransactions(newTxs);
    onUpdateTransactionsList?.(newTxs);
  };

  // Manual refresh helper
  const handleRefreshData = () => {
    const freshParts = loadStoredSpareParts();
    const freshTxs = loadStoredStockTransactions();
    setInternalParts(freshParts);
    setInternalTransactions(freshTxs);
    onUpdatePartsList?.(freshParts);
    onUpdateTransactionsList?.(freshTxs);
  };

  // Navigation tabs within warehouse
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'transactions' | 'alerts'>('catalog');

  // Filters for catalog
  const [searchKey, setSearchKey] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');

  // Filters for transactions
  const [txSearchKey, setTxSearchKey] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');

  // Modals state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedPartForRestock, setSelectedPartForRestock] = useState<SparePartItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);
  const [restockPrice, setRestockPrice] = useState<number>(0);
  const [restockBatchNo, setRestockBatchNo] = useState<string>('');
  const [restockRemarks, setRestockRemarks] = useState<string>('');

  // Add new part modal
  const [showNewPartModal, setShowNewPartModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartNo, setNewPartNo] = useState('');
  const [newPartCategory, setNewPartCategory] = useState<SparePartCategory>('life_support');
  const [newPartSpec, setNewPartSpec] = useState('');
  const [newPartBrand, setNewPartBrand] = useState('');
  const [newPartLocation, setNewPartLocation] = useState('');
  const [newPartStock, setNewPartStock] = useState(5);
  const [newPartUnit, setNewPartUnit] = useState('件');
  const [newPartMinSafe, setNewPartMinSafe] = useState(3);
  const [newPartUnitCost, setNewPartUnitCost] = useState(500);
  const [newPartSupplier, setNewPartSupplier] = useState('');
  const [newPartApplicable, setNewPartApplicable] = useState('');

  // Print plan modal
  const [showPrintPlanModal, setShowPrintPlanModal] = useState(false);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    return calculateSparePartsKpiStats(currentParts, currentTransactions);
  }, [currentParts, currentTransactions]);

  // Alert parts (low stock or out of stock)
  const alertParts = useMemo(() => {
    return currentParts.filter(p => (p.currentStock ?? 0) <= (p.minSafeStock ?? 0));
  }, [currentParts]);

  // Catalog filtering
  const filteredParts = useMemo(() => {
    return currentParts.filter(p => {
      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }

      const stock = p.currentStock ?? 0;
      const minSafe = p.minSafeStock ?? 0;

      // Stock status filter
      if (stockStatusFilter === 'out_of_stock' && stock > 0) return false;
      if (stockStatusFilter === 'low_stock' && (stock === 0 || stock > minSafe)) return false;
      if (stockStatusFilter === 'normal' && stock <= minSafe) return false;

      // Keyword search
      if (searchKey.trim()) {
        const q = searchKey.toLowerCase();
        const appTypes = Array.isArray(p.applicableEquipmentTypes) ? p.applicableEquipmentTypes : [];
        const match =
          (p.name || '').toLowerCase().includes(q) ||
          (p.partNo || '').toLowerCase().includes(q) ||
          (p.spec || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.warehouseLocation || '').toLowerCase().includes(q) ||
          appTypes.some(t => (t || '').toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [currentParts, categoryFilter, stockStatusFilter, searchKey]);

  // Transaction filtering
  const filteredTransactions = useMemo(() => {
    return currentTransactions.filter(t => {
      if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
      if (txSearchKey.trim()) {
        const q = txSearchKey.toLowerCase();
        const match =
          (t.partName || '').toLowerCase().includes(q) ||
          (t.partNo || '').toLowerCase().includes(q) ||
          (t.id || '').toLowerCase().includes(q) ||
          (t.workOrderId && t.workOrderId.toLowerCase().includes(q)) ||
          (t.equipmentName && t.equipmentName.toLowerCase().includes(q)) ||
          (t.department && t.department.toLowerCase().includes(q)) ||
          (t.operatorName || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [currentTransactions, txTypeFilter, txSearchKey]);

  // Pagination states
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [catalogPageSize, setCatalogPageSize] = useState<number>(10);

  const [txPage, setTxPage] = useState<number>(1);
  const [txPageSize, setTxPageSize] = useState<number>(10);

  const [alertPage, setAlertPage] = useState<number>(1);
  const [alertPageSize, setAlertPageSize] = useState<number>(10);

  // Reset catalog pagination when search or filters change
  useEffect(() => {
    setCatalogPage(1);
  }, [searchKey, categoryFilter, stockStatusFilter]);

  // Ensure catalogPage is within valid range
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredParts.length / catalogPageSize));
    if (catalogPage > maxPage) {
      setCatalogPage(maxPage);
    }
  }, [filteredParts.length, catalogPage, catalogPageSize]);

  // Reset transactions pagination when search or filters change
  useEffect(() => {
    setTxPage(1);
  }, [txSearchKey, txTypeFilter]);

  // Ensure txPage is within valid range
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredTransactions.length / txPageSize));
    if (txPage > maxPage) {
      setTxPage(maxPage);
    }
  }, [filteredTransactions.length, txPage, txPageSize]);

  // Ensure alertPage is within valid range
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(alertParts.length / alertPageSize));
    if (alertPage > maxPage) {
      setAlertPage(maxPage);
    }
  }, [alertParts.length, alertPage, alertPageSize]);

  // Sliced data lists for pagination
  const paginatedParts = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredParts.slice(start, start + catalogPageSize);
  }, [filteredParts, catalogPage, catalogPageSize]);

  const paginatedTransactions = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return filteredTransactions.slice(start, start + txPageSize);
  }, [filteredTransactions, txPage, txPageSize]);

  const paginatedAlertParts = useMemo(() => {
    const start = (alertPage - 1) * alertPageSize;
    return alertParts.slice(start, start + alertPageSize);
  }, [alertParts, alertPage, alertPageSize]);

  // Handle Restock action
  const handleOpenRestock = (part: SparePartItem) => {
    setSelectedPartForRestock(part);
    setRestockQty((part.minSafeStock || 2) * 2);
    setRestockPrice(part.unitCost || 0);
    setRestockBatchNo(`LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`);
    setRestockRemarks('');
    setShowRestockModal(true);
  };

  const handleConfirmRestock = () => {
    if (!selectedPartForRestock) return;
    if (restockQty <= 0) {
      alert('入库数量必须大于 0');
      return;
    }

    const res = restockSparePart(
      currentParts,
      currentTransactions,
      selectedPartForRestock.id,
      Number(restockQty),
      Number(restockPrice) || selectedPartForRestock.unitCost,
      currentUserName,
      restockBatchNo,
      restockRemarks || `常规补库验收入库：入库 ${restockQty} ${selectedPartForRestock.unit}`
    );

    if (res.success) {
      updateParts(res.updatedParts);
      updateTransactions(res.updatedTransactions);
      setShowRestockModal(false);
      setSelectedPartForRestock(null);
    } else {
      alert(res.message);
    }
  };

  // Handle Create New Part
  const handleCreateNewPart = () => {
    if (!newPartName.trim() || !newPartNo.trim()) {
      alert('请填写备件名称与原厂/院内编码');
      return;
    }

    const catLabels: Record<SparePartCategory, string> = {
      life_support: '急救生命支持',
      imaging_radiology: '放射影像与探头',
      lab_biochemical: '临床检验与生化',
      endoscopy_surgery: '腔镜微创与手术',
      ultrasound_diagnostics: '超声及电生理',
      general_consumables: '通用机电耗材'
    };

    const newPart: SparePartItem = {
      id: `SP-2026-${(currentParts.length + 1).toString().padStart(3, '0')}`,
      partNo: newPartNo.trim(),
      name: newPartName.trim(),
      category: newPartCategory,
      categoryLabel: catLabels[newPartCategory] || '备件耗材',
      spec: newPartSpec.trim() || '通用标准规格',
      brand: newPartBrand.trim() || '通用原厂',
      warehouseLocation: newPartLocation.trim() || '医工楼101备件主库 待分配',
      currentStock: Number(newPartStock) || 0,
      unit: newPartUnit.trim() || '件',
      minSafeStock: Number(newPartMinSafe) || 2,
      maxStockLimit: (Number(newPartMinSafe) || 2) * 5,
      unitCost: Number(newPartUnitCost) || 100,
      supplierName: newPartSupplier.trim() || '合格医疗器械服务商',
      applicableEquipmentTypes: newPartApplicable.trim()
        ? newPartApplicable.split(/[,，、]/).map(s => s.trim())
        : ['全院通用设备'],
      batchNo: `LOT-${Date.now().toString().slice(-6)}`,
      totalOutCount: 0,
      totalInCount: Number(newPartStock) || 0,
      lastRestockDate: new Date().toISOString().slice(0, 10),
      status: 'active'
    };

    // If initial stock > 0, generate purchase_in transaction
    let nextTxs = [...currentTransactions];
    if (newPart.currentStock > 0) {
      const initTx: StockTransactionRecord = {
        id: `TR-${Date.now().toString().slice(-8)}`,
        partId: newPart.id,
        partNo: newPart.partNo,
        partName: newPart.name,
        spec: newPart.spec,
        type: 'purchase_in',
        typeLabel: '采购验收入库',
        quantity: newPart.currentStock,
        unitCost: newPart.unitCost,
        totalAmount: newPart.currentStock * newPart.unitCost,
        stockBefore: 0,
        stockAfter: newPart.currentStock,
        operatorId: 'INIT',
        operatorName: currentUserName,
        approverName: '库管主管',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        remarks: '首次建档初始化建账入库'
      };
      nextTxs = [initTx, ...nextTxs];
    }

    const nextParts = [newPart, ...currentParts];
    updateParts(nextParts);
    updateTransactions(nextTxs);

    // Reset
    setShowNewPartModal(false);
    setNewPartName('');
    setNewPartNo('');
    setNewPartSpec('');
    setNewPartBrand('');
    setNewPartLocation('');
    setNewPartStock(5);
    setNewPartUnitCost(500);
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-2.5 animate-in fade-in duration-200 overflow-hidden">
      {/* Top Banner & Control Bar (Compact Single-screen Header) */}
      <div className="bg-white rounded-lg border border-slate-200 px-3.5 py-2 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Package className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm md:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                维修备品备件库与耗材领料中心
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>工单现场出库实时联动</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                三甲医院装备规范
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden md:block mt-0.5">
              高频损耗备件目录 · 实物库存流水追溯 · 工程师工单领料实时扣减与退料还库 · 安全库存警戒采购
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRefreshData}
            title="重新从本地持久化存储加载最新库存与流水台账"
            className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">刷新</span>
          </button>

          <button
            onClick={() => setShowPrintPlanModal(true)}
            className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>生成补库单</span>
          </button>

          <button
            onClick={() => setShowNewPartModal(true)}
            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建备件SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip (Compact single-screen metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 shrink-0">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500">在库备件品种</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black font-mono text-slate-900 leading-none">{kpiStats.totalSkuCount}</span>
              <span className="text-[10px] text-slate-400">SKU</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Boxes className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500">储备总资产货值</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black font-mono text-emerald-700 leading-none">
                ￥{kpiStats.totalStockValue.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => {
            setActiveSubTab('catalog');
            setStockStatusFilter('low_stock');
          }}
          className={`rounded-lg border px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2 cursor-pointer transition ${
            kpiStats.lowStockWarningCount > 0
              ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/60'
              : 'bg-white border-slate-200'
          }`}
          title="点击快速筛选库存偏低与缺货备件"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
              <span>安全库存预警</span>
              {kpiStats.outOfStockCount > 0 && (
                <span className="text-[10px] font-bold text-rose-600">(缺{kpiStats.outOfStockCount})</span>
              )}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black font-mono text-amber-700 leading-none">
                {kpiStats.lowStockWarningCount}
              </span>
              <span className="text-[10px] text-amber-800">品类触发</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500">本月工单领料</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black font-mono text-indigo-700 leading-none">
                ￥{kpiStats.monthRequisitionCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">({kpiStats.monthRequisitionCount}笔)</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Wrench className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2 col-span-2 sm:col-span-1">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500">出入库记录台账</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black font-mono text-slate-800 leading-none">{currentTransactions.length}</span>
              <span className="text-[10px] text-slate-400">条有效流水</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Single-Screen Workspace Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* SubTab Header (Fixed) */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-1.5 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'catalog'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>备件目录与实物库存 ({currentParts.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'transactions'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>工单领用与出入库流水 ({currentTransactions.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('alerts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'alerts'
                  ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>智能安全库存警戒与补库计划 ({alertParts.length})</span>
              {alertParts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              )}
            </button>
          </div>

          <div className="text-2xs text-slate-500 font-mono flex items-center gap-1">
            <span>当前库管：{currentUserName}</span>
          </div>
        </div>

        {/* SUB-VIEW 1: Catalog & Real-time Stock */}
        {activeSubTab === 'catalog' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Filter and Search Bar (Fixed at top of catalog) */}
            <div className="p-2.5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-2 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="快速检索备件名称、原厂编码、规格型号、品牌、存放货位、适用机型..."
                  value={searchKey}
                  onChange={e => setSearchKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Status and Category dropdowns */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">全部分类专科</option>
                  <option value="life_support">急救生命支持</option>
                  <option value="imaging_radiology">放射影像与探头</option>
                  <option value="lab_biochemical">临床检验与生化</option>
                  <option value="endoscopy_surgery">腔镜微创与手术</option>
                  <option value="ultrasound_diagnostics">超声及电生理</option>
                  <option value="general_consumables">通用机电耗材</option>
                </select>

                <select
                  value={stockStatusFilter}
                  onChange={e => setStockStatusFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">全部库存状态</option>
                  <option value="normal">库存正常充足</option>
                  <option value="low_stock">低于安全库存预警</option>
                  <option value="out_of_stock">缺货告急 (在库=0)</option>
                </select>

                {(searchKey || categoryFilter !== 'all' || stockStatusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchKey('');
                      setCategoryFilter('all');
                      setStockStatusFilter('all');
                    }}
                    className="text-2xs text-slate-500 hover:text-indigo-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    重置筛选
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Table Area (Scrollable within single-screen) */}
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="p-3">备件编码 / 类别</th>
                    <th className="p-3">备件名称与规格型号</th>
                    <th className="p-3">品牌 / 厂家</th>
                    <th className="p-3">存放库房与货位</th>
                    <th className="p-3 text-center">当前在库 / 单位</th>
                    <th className="p-3 text-center">安全库存线</th>
                    <th className="p-3 text-right">参考单价</th>
                    <th className="p-3 text-right">在库总货值</th>
                    <th className="p-3 text-center">操作与补货</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>暂无符合条件的备件数据</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedParts.map(part => {
                      const isOutOfStock = part.currentStock <= 0;
                      const isLowStock = part.currentStock > 0 && part.currentStock <= part.minSafeStock;
                      const totalVal = part.currentStock * part.unitCost;

                      return (
                        <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 align-top">
                            <div className="font-mono font-bold text-slate-800 text-xs">
                              {part.partNo}
                            </div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700">
                              {part.categoryLabel}
                            </span>
                          </td>

                          <td className="p-3 align-top max-w-xs">
                            <div className="font-bold text-slate-900 leading-snug">
                              {part.name}
                            </div>
                            <div className="text-2xs text-slate-500 mt-0.5">
                              规格：{part.spec}
                            </div>
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              {(part.applicableEquipmentTypes || []).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 rounded text-2xs bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="p-3 align-top text-slate-700 font-medium">
                            <div>{part.brand}</div>
                            <div className="text-2xs text-slate-400 mt-0.5">{part.supplierName}</div>
                          </td>

                          <td className="p-3 align-top">
                            <div className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium">{part.warehouseLocation}</span>
                            </div>
                            <div className="text-2xs text-slate-400 font-mono mt-0.5">
                              批次: {part.batchNo}
                            </div>
                          </td>

                          <td className="p-3 align-top text-center">
                            <div className="font-mono text-base font-black">
                              {part.currentStock}{' '}
                              <span className="text-xs font-normal text-slate-500">{part.unit}</span>
                            </div>
                            <div className="mt-1">
                              {isOutOfStock ? (
                                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  缺货 (0)
                                </span>
                              ) : isLowStock ? (
                                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  库存偏低
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  充足正常
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 align-top text-center text-xs text-slate-500">
                            <div>
                              下限: <strong className="text-slate-800 font-mono">{part.minSafeStock}</strong>
                            </div>
                            <div>
                              上限: <span className="font-mono">{part.maxStockLimit}</span>
                            </div>
                          </td>

                          <td className="p-3 align-top text-right font-mono text-slate-900 font-bold">
                            ￥{part.unitCost.toLocaleString()}
                          </td>

                          <td className="p-3 align-top text-right font-mono font-bold text-slate-800">
                            ￥{totalVal.toLocaleString()}
                          </td>

                          <td className="p-3 align-top text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenRestock(part)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-2xs font-bold border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                              >
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>入库补仓</span>
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

            {/* Catalog Pagination (Fixed at bottom of screen) */}
            <Pagination
              currentPage={catalogPage}
              pageSize={catalogPageSize}
              totalCount={filteredParts.length}
              onPageChange={setCatalogPage}
              onPageSizeChange={(sz) => {
                setCatalogPageSize(sz);
                setCatalogPage(1);
              }}
            />
          </div>
        )}

        {/* SUB-VIEW 2: Transactions / Work Order Requisitions Audit Trail */}
        {activeSubTab === 'transactions' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Filter Bar (Fixed at top of transactions) */}
            <div className="p-2.5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-2 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索流水单号、关联工单号(WO-xxx)、备件名称、领用设备、科室、经办工程师..."
                  value={txSearchKey}
                  onChange={e => setTxSearchKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <select
                  value={txTypeFilter}
                  onChange={e => setTxTypeFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">全部出入库类型</option>
                  <option value="wo_requisition">维修工单领料出库</option>
                  <option value="wo_return">维修工单退料还库</option>
                  <option value="purchase_in">采购验收入库</option>
                  <option value="inventory_adjustment">盘点平账调整</option>
                </select>

                {(txSearchKey || txTypeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setTxSearchKey('');
                      setTxTypeFilter('all');
                    }}
                    className="text-2xs text-slate-500 hover:text-indigo-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    重置
                  </button>
                )}
              </div>
            </div>

            {/* Transactions Table (Scrollable within single-screen) */}
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="p-3">流水号 / 时间</th>
                    <th className="p-3">业务出入库类型</th>
                    <th className="p-3">备件品名与编码</th>
                    <th className="p-3 text-center">出入库数量</th>
                    <th className="p-3 text-right">单价 / 金额</th>
                    <th className="p-3 text-center">库存变动</th>
                    <th className="p-3">关联维修工单 / 领用设备</th>
                    <th className="p-3">领料工程师 / 经办人</th>
                    <th className="p-3">摘要与说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>暂无符合条件的出入库流水记录</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map(tx => {
                      const isRequisition = tx.type === 'wo_requisition';
                      const isReturn = tx.type === 'wo_return';
                      const isPurchase = tx.type === 'purchase_in';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 align-top">
                            <div className="font-mono font-bold text-slate-900">{tx.id}</div>
                            <div className="text-2xs text-slate-400 font-mono mt-0.5">
                              {tx.timestamp}
                            </div>
                          </td>

                          <td className="p-3 align-top">
                            {isRequisition && (
                              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                                <ArrowUpRight className="w-3 h-3 text-amber-600" />
                                <span>工单领料出库</span>
                              </span>
                            )}
                            {isReturn && (
                              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit">
                                <ArrowDownLeft className="w-3 h-3 text-purple-600" />
                                <span>工单退料还库</span>
                              </span>
                            )}
                            {isPurchase && (
                              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>采购验收入库</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3 align-top max-w-xs">
                            <div className="font-bold text-slate-900 leading-snug">
                              {tx.partName}
                            </div>
                            <div className="font-mono text-2xs text-slate-500 mt-0.5">
                              {tx.partNo} · {tx.spec}
                            </div>
                          </td>

                          <td className="p-3 align-top text-center font-mono font-bold">
                            {isRequisition ? (
                              <span className="text-amber-700">-{tx.quantity}</span>
                            ) : isReturn ? (
                              <span className="text-purple-700">+{tx.quantity}</span>
                            ) : (
                              <span className="text-emerald-700">+{tx.quantity}</span>
                            )}
                          </td>

                          <td className="p-3 align-top text-right font-mono">
                            <div className="text-slate-500 text-2xs">￥{tx.unitCost}</div>
                            <div className="font-bold text-slate-900">￥{Math.abs(tx.totalAmount).toLocaleString()}</div>
                          </td>

                          <td className="p-3 align-top text-center font-mono text-2xs text-slate-500">
                            <span>{tx.stockBefore}</span>
                            <span className="mx-1 text-slate-300">→</span>
                            <strong className="text-slate-800">{tx.stockAfter}</strong>
                          </td>

                          <td className="p-3 align-top">
                            {tx.workOrderId ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-indigo-600">
                                    {tx.workOrderId}
                                  </span>
                                  {onNavigateToWorkOrder && (
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToWorkOrder(tx.workOrderId!)}
                                      className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                      title="定位工单"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {tx.equipmentName && (
                                  <div className="text-2xs text-slate-700 mt-0.5">
                                    {tx.equipmentName} ({tx.department || '临床科室'})
                                  </div>
                                )}
                                {tx.equipmentSn && (
                                  <div className="font-mono text-2xs text-slate-400">
                                    SN: {tx.equipmentSn}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-2xs">非工单直属 (常规建账)</span>
                            )}
                          </td>

                          <td className="p-3 align-top">
                            <div className="font-medium text-slate-800">{tx.operatorName}</div>
                            <div className="text-2xs text-slate-400 mt-0.5">审核: {tx.approverName || '医工库管'}</div>
                          </td>

                          <td className="p-3 align-top text-slate-600 text-2xs max-w-xs">
                            <p className="line-clamp-2">{tx.remarks}</p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Transactions Pagination (Fixed at bottom of screen) */}
            <Pagination
              currentPage={txPage}
              pageSize={txPageSize}
              totalCount={filteredTransactions.length}
              onPageChange={setTxPage}
              onPageSizeChange={(sz) => {
                setTxPageSize(sz);
                setTxPage(1);
              }}
            />
          </div>
        )}

        {/* SUB-VIEW 3: Safety Stock Alerts & Auto-Reorder Plan */}
        {activeSubTab === 'alerts' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Alert Notice Strip (Fixed at top of alerts) */}
            <div className="px-3.5 py-2 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span>当前共有 <strong className="font-bold underline text-amber-950">{alertParts.length}</strong> 项备件低于安全库存警戒线。</span>
                  <span className="text-amber-800 hidden sm:inline ml-1">根据生命支持与重点设备完好率要求，建议启动采购补库。</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPrintPlanModal(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>生成并打印《补库采购申报表》</span>
              </button>
            </div>

            {/* Alerts Table (Scrollable within single-screen) */}
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="p-3">备件品名与编码</th>
                    <th className="p-3">专科品类</th>
                    <th className="p-3">适用设备</th>
                    <th className="p-3 text-center">当前在库</th>
                    <th className="p-3 text-center">安全库存下限</th>
                    <th className="p-3 text-center">建议补货量</th>
                    <th className="p-3 text-right">参考单价</th>
                    <th className="p-3 text-right">预估采购金额</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {alertParts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                        <p className="text-emerald-700 font-bold">所有备件库存均在安全水位之上，运行良好！</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedAlertParts.map(part => {
                      const shortage = Math.max(1, part.maxStockLimit - part.currentStock);
                      const estimatedCost = shortage * part.unitCost;
                      const isOutOfStock = part.currentStock <= 0;

                      return (
                        <tr key={part.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3 align-top">
                            <div className="font-bold text-slate-900">{part.name}</div>
                            <div className="font-mono text-2xs text-slate-500 mt-0.5">
                              {part.partNo} · {part.spec}
                            </div>
                          </td>

                          <td className="p-3 align-top text-slate-700">
                            <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100">
                              {part.categoryLabel}
                            </span>
                          </td>

                          <td className="p-3 align-top text-slate-600">
                            {(part.applicableEquipmentTypes || []).join('、')}
                          </td>

                          <td className="p-3 align-top text-center">
                            <span
                              className={`font-mono text-sm font-black px-2 py-0.5 rounded ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {part.currentStock} {part.unit}
                            </span>
                            {isOutOfStock && (
                              <div className="text-2xs text-rose-600 font-bold mt-1">断货急缺</div>
                            )}
                          </td>

                          <td className="p-3 align-top text-center font-mono font-bold text-slate-700">
                            {part.minSafeStock} {part.unit}
                          </td>

                          <td className="p-3 align-top text-center font-mono font-bold text-indigo-700">
                            +{shortage} {part.unit}
                          </td>

                          <td className="p-3 align-top text-right font-mono text-slate-900">
                            ￥{part.unitCost.toLocaleString()}
                          </td>

                          <td className="p-3 align-top text-right font-mono font-black text-rose-600">
                            ￥{estimatedCost.toLocaleString()}
                          </td>

                          <td className="p-3 align-top text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenRestock(part)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-2xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>立即验收入库</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {alertParts.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold sticky bottom-0 z-10 shadow-2xs">
                    <tr>
                      <td colSpan={5} className="p-3 text-right text-slate-600">
                        缺额备件补库总预算预估：
                      </td>
                      <td className="p-3 text-center font-mono text-indigo-700">
                        {alertParts.reduce((s, p) => s + Math.max(1, p.maxStockLimit - p.currentStock), 0)} 件
                      </td>
                      <td />
                      <td className="p-3 text-right font-mono text-base text-rose-600">
                        ￥
                        {alertParts
                          .reduce((s, p) => s + Math.max(1, p.maxStockLimit - p.currentStock) * p.unitCost, 0)
                          .toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Alerts Pagination (Fixed at bottom of screen) */}
            {alertParts.length > 0 && (
              <Pagination
                currentPage={alertPage}
                pageSize={alertPageSize}
                totalCount={alertParts.length}
                onPageChange={setAlertPage}
                onPageSizeChange={(sz) => {
                  setAlertPageSize(sz);
                  setAlertPage(1);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Restock / Purchase Inflow Modal */}
      {showRestockModal && selectedPartForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">备品备件常规验收入库</h3>
                  <p className="text-2xs text-slate-500">采购验收入库登记 · 更新在库实物结存</p>
                </div>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{selectedPartForRestock.name}</div>
                <div className="text-slate-500 text-2xs">
                  原厂编码：{selectedPartForRestock.partNo} | 货位：{selectedPartForRestock.warehouseLocation}
                </div>
                <div className="text-slate-700 flex justify-between pt-1 border-t border-slate-200 text-2xs">
                  <span>当前在库库存：</span>
                  <span className="font-bold font-mono text-indigo-700">
                    {selectedPartForRestock.currentStock} {selectedPartForRestock.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  本次验收入库数量 ({selectedPartForRestock.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={e => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  单价成本 (元)
                </label>
                <input
                  type="number"
                  min={0}
                  value={restockPrice}
                  onChange={e => setRestockPrice(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">生产批次号 / 验收合格单号</label>
                <input
                  type="text"
                  value={restockBatchNo}
                  onChange={e => setRestockBatchNo(e.target.value)}
                  placeholder="LOT-20260906-01"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">入库备注说明</label>
                <textarea
                  rows={2}
                  value={restockRemarks}
                  onChange={e => setRestockRemarks(e.target.value)}
                  placeholder="如：原厂紧急供货到库验收合格、年度批量采购到货..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between text-2xs text-emerald-800 font-bold">
                <span>入库后结存总计：</span>
                <span className="font-mono text-sm">
                  {selectedPartForRestock.currentStock + Number(restockQty)} {selectedPartForRestock.unit}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowRestockModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
              >
                确认验收入库
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Part Catalog Modal */}
      {showNewPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">新建医学装备备件耗材档案</h3>
                  <p className="text-2xs text-slate-500">录入新备件SKU · 设定安全库存与适用机型</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewPartModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    备件/耗材名称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPartName}
                    onChange={e => setNewPartName(e.target.value)}
                    placeholder="如：迈瑞监护仪血氧探头线缆"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    原厂/院内备件编码 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPartNo}
                    onChange={e => setNewPartNo(e.target.value)}
                    placeholder="如：MR-SPO2-CBL-09"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">专科品类</label>
                  <select
                    value={newPartCategory}
                    onChange={e => setNewPartCategory(e.target.value as SparePartCategory)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="life_support">急救生命支持</option>
                    <option value="imaging_radiology">放射影像与探头</option>
                    <option value="lab_biochemical">临床检验与生化</option>
                    <option value="endoscopy_surgery">腔镜微创与手术</option>
                    <option value="ultrasound_diagnostics">超声及电生理</option>
                    <option value="general_consumables">通用机电耗材</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">品牌 / 生产厂家</label>
                  <input
                    type="text"
                    value={newPartBrand}
                    onChange={e => setNewPartBrand(e.target.value)}
                    placeholder="如：迈瑞、德尔格、飞利浦、通用电气"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">规格型号</label>
                  <input
                    type="text"
                    value={newPartSpec}
                    onChange={e => setNewPartSpec(e.target.value)}
                    placeholder="如：512F-30-28263 7-pin 3.0m"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">存放库房与货位</label>
                  <input
                    type="text"
                    value={newPartLocation}
                    onChange={e => setNewPartLocation(e.target.value)}
                    placeholder="如：医工楼101主库 A-02-04"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">初始建账库存</label>
                  <input
                    type="number"
                    min={0}
                    value={newPartStock}
                    onChange={e => setNewPartStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">计量单位</label>
                  <input
                    type="text"
                    value={newPartUnit}
                    onChange={e => setNewPartUnit(e.target.value)}
                    placeholder="件 / 条 / 套 / 块"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">安全库存警戒线</label>
                  <input
                    type="number"
                    min={1}
                    value={newPartMinSafe}
                    onChange={e => setNewPartMinSafe(parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">参考采购单价 (元)</label>
                  <input
                    type="number"
                    min={0}
                    value={newPartUnitCost}
                    onChange={e => setNewPartUnitCost(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">主供货商/维保服务商</label>
                  <input
                    type="text"
                    value={newPartSupplier}
                    onChange={e => setNewPartSupplier(e.target.value)}
                    placeholder="如：华东技术服务中心"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  适用设备品类 (用逗号分隔，用于工单智能匹配)
                </label>
                <input
                  type="text"
                  value={newPartApplicable}
                  onChange={e => setNewPartApplicable(e.target.value)}
                  placeholder="如：病人监护仪, 心电监护仪, 急救除颤仪"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowNewPartModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateNewPart}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
              >
                完成建档入库
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Print Reorder Plan Document */}
      {showPrintPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  三甲医院医学装备处 · 备品备件应急补库采购计划申报单
                </h3>
              </div>
              <button
                onClick={() => setShowPrintPlanModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Document Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-serif flex-1 bg-white print:p-0">
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-lg font-black text-slate-900">
                  三级甲等综合医院 · 医学工程处
                </h2>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  临床维修备品备件与耗材应急补库计划申请表
                </h3>
                <div className="flex justify-between text-2xs text-slate-600 font-sans mt-2">
                  <span>申报科室：医学装备处备件库管中心</span>
                  <span>申报单号：PR-20260906-SP01</span>
                  <span>打印日期：{new Date().toISOString().slice(0, 10)}</span>
                </div>
              </div>

              <p className="text-2xs text-slate-700 font-sans leading-relaxed">
                为严格保证全院急救生命支持、放射影像及腔镜微创等关键在用医疗设备的正常运转与 MTTR 抢修时效，经库房实物清盘，特申报以下低于安全库存下限的缺额备品备件采购计划：
              </p>

              <table className="w-full text-left text-2xs border-collapse border border-slate-300 font-sans">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-2 border-r border-slate-300">序号</th>
                    <th className="p-2 border-r border-slate-300">备件原厂编码</th>
                    <th className="p-2 border-r border-slate-300">备件耗材名称与规格</th>
                    <th className="p-2 border-r border-slate-300 text-center">当前在库</th>
                    <th className="p-2 border-r border-slate-300 text-center">安全下限</th>
                    <th className="p-2 border-r border-slate-300 text-center">建议补库量</th>
                    <th className="p-2 border-r border-slate-300 text-right">参考单价</th>
                    <th className="p-2 text-right">预估采购总价</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {alertParts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400">
                        当前库房备件充足，无缺额采购品类
                      </td>
                    </tr>
                  ) : (
                    alertParts.map((p, idx) => {
                      const qty = Math.max(1, p.maxStockLimit - p.currentStock);
                      return (
                        <tr key={p.id}>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold">{p.partNo}</td>
                          <td className="p-2 border-r border-slate-300">
                            <strong>{p.name}</strong> ({p.spec})
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono text-rose-600 font-bold">
                            {p.currentStock} {p.unit}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">{p.minSafeStock}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono font-bold text-indigo-700">
                            {qty} {p.unit}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">￥{p.unitCost}</td>
                          <td className="p-2 text-right font-mono font-bold">￥{(qty * p.unitCost).toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-400 font-bold">
                  <tr>
                    <td colSpan={7} className="p-2 text-right">采购预算合计金额 (人民币大写)：</td>
                    <td className="p-2 text-right font-mono text-sm text-rose-700">
                      ￥{alertParts.reduce((s, p) => s + Math.max(1, p.maxStockLimit - p.currentStock) * p.unitCost, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="grid grid-cols-3 gap-4 pt-8 text-2xs font-sans">
                <div>库房盘点人：<strong>{currentUserName}</strong></div>
                <div>医工处主任审核：__________________</div>
                <div>分管院长审批：__________________</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowPrintPlanModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && typeof window.print === 'function') {
                    try {
                      window.print();
                    } catch (err) {
                      console.warn('Printing not available in current window/iframe context', err);
                    }
                  }
                }}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>立即打印申报单</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

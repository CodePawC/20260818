import React, { useState, useMemo, useEffect } from 'react';
import { 
  PartnerOrganization, 
  PartnerType, 
  MedicalEquipment 
} from '../types';
import { getPartnersWithStats, PartnerAggregatedStats } from '../utils/partnerData';
import { Pagination } from './Pagination';
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  ShieldCheck, 
  FileText, 
  Wrench, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  LayoutGrid, 
  Table as TableIcon,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Edit2,
  Trash2,
  Landmark
} from 'lucide-react';
import { MonthlyFinanceReportModal } from './MonthlyFinanceReportModal';

interface PartnerManagementViewProps {
  partners: PartnerOrganization[];
  equipmentList: MedicalEquipment[];
  onOpenPartnerDetail: (partner: PartnerOrganization) => void;
  onOpenAddPartnerModal: () => void;
  onEditPartner: (partner: PartnerOrganization) => void;
  onDeletePartner: (partnerId: string) => void;
  onNavigateToEquipmentLedger: (partnerName: string) => void;
  onOpenRepairModalForPartner?: (partner: PartnerOrganization) => void;
}

export const PartnerManagementView: React.FC<PartnerManagementViewProps> = ({
  partners,
  equipmentList,
  onOpenPartnerDetail,
  onOpenAddPartnerModal,
  onEditPartner,
  onDeletePartner,
  onNavigateToEquipmentLedger,
  onOpenRepairModalForPartner
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchKeyword, statusFilter, viewMode]);

  // Calculate aggregated stats for each partner
  const partnersWithStats: PartnerAggregatedStats[] = useMemo(() => {
    return getPartnersWithStats(partners, equipmentList);
  }, [partners, equipmentList]);

  // Overall KPI statistics
  const summaryKpis = useMemo(() => {
    let calibrationCount = 0;
    let manufacturerCount = 0;
    let thirdPartyCount = 0;
    let supplierCount = 0;
    let totalManagedAssets = 0;
    let totalAnnualSpend = 0;

    partnersWithStats.forEach(p => {
      if (p.partner.type === 'calibration_agency') calibrationCount++;
      else if (p.partner.type === 'manufacturer') manufacturerCount++;
      else if (p.partner.type === 'third_party_repair') thirdPartyCount++;
      else if (p.partner.type === 'supplier') supplierCount++;

      totalManagedAssets += p.managedEquipmentCount;
      totalAnnualSpend += p.totalRepairCost;
    });

    return {
      totalPartners: partners.length,
      calibrationCount,
      manufacturerCount,
      thirdPartyCount,
      supplierCount,
      totalManagedAssets,
      totalAnnualSpend
    };
  }, [partners, partnersWithStats]);

  // Filtered partners list
  const filteredPartnersWithStats = useMemo(() => {
    return partnersWithStats.filter(({ partner }) => {
      // Type filter
      if (selectedType !== 'all' && partner.type !== selectedType) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && partner.contractStatus !== statusFilter) {
        return false;
      }

      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matches = 
          partner.name.toLowerCase().includes(kw) ||
          partner.shortName.toLowerCase().includes(kw) ||
          partner.contactPerson.toLowerCase().includes(kw) ||
          partner.contactPhone.toLowerCase().includes(kw) ||
          partner.hotline.toLowerCase().includes(kw) ||
          partner.address.toLowerCase().includes(kw) ||
          partner.contractNo.toLowerCase().includes(kw) ||
          partner.qualifications.some(q => q.toLowerCase().includes(kw));
        if (!matches) return false;
      }

      return true;
    });
  }, [partnersWithStats, selectedType, statusFilter, searchKeyword]);

  // 当前分页切片数据
  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPartnersWithStats.slice(start, start + pageSize);
  }, [filteredPartnersWithStats, currentPage, pageSize]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = [
      '单位ID',
      '单位全称',
      '显示简称',
      '单位分类',
      '资质级别',
      '对接联系人',
      '联系电话',
      '24h应急热线',
      '官方邮箱',
      '服务基地地址',
      '资质认证',
      '协议编号',
      '协议全称',
      '履约有效期',
      '履约状态',
      '关联在管设备数',
      '往来费用总支出'
    ];

    const rows = filteredPartnersWithStats.map(({ partner, managedEquipmentCount, totalRepairCost }) => {
      const typeLabel = 
        partner.type === 'calibration_agency' ? '法定计量检测机构' :
        partner.type === 'manufacturer' ? '生产厂家/原厂' :
        partner.type === 'third_party_repair' ? '第三方专业维保' : '备件耗材供应商';

      return [
        partner.id,
        `"${partner.name}"`,
        `"${partner.shortName}"`,
        `"${typeLabel}"`,
        `"${partner.level || '-'}"`,
        `"${partner.contactPerson}"`,
        `"${partner.contactPhone}"`,
        `"${partner.hotline}"`,
        `"${partner.email}"`,
        `"${partner.address}"`,
        `"${partner.qualifications.join('; ')}"`,
        `"${partner.contractNo}"`,
        `"${partner.contractName}"`,
        `"${partner.contractPeriod}"`,
        `"${partner.contractStatus}"`,
        managedEquipmentCount,
        totalRepairCost
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `全院医学装备往来单位名录_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTypeMeta = (type: PartnerType) => {
    switch (type) {
      case 'calibration_agency':
        return { label: '法定计量检测机构', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'manufacturer':
        return { label: '生产厂家 / 原厂', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'third_party_repair':
        return { label: '第三方专业维保', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'supplier':
        return { label: '备件耗材供货商', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      default:
        return { label: '协同单位', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-3">
      
      {/* 1. Top KPI Summary Dashboard Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">合作单位总数</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {summaryKpis.totalPartners} <span className="text-xs font-normal text-slate-400">家</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-600">法定计量机构</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-900 mt-1">
            {summaryKpis.calibrationCount} <span className="text-xs font-normal text-indigo-400">家 (强检)</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-600">原厂设备制造厂商</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1">
            {summaryKpis.manufacturerCount} <span className="text-xs font-normal text-blue-400">家 (OEM)</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600">第三方专业维保</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">
            {summaryKpis.thirdPartyCount} <span className="text-xs font-normal text-amber-400">家 (ISO)</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600">备件耗材供应商</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1">
            {summaryKpis.supplierCount} <span className="text-xs font-normal text-emerald-400">家 (SPD)</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">年度往来结算总额</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 font-mono mt-1 notranslate" translate="no">
            ￥{summaryKpis.totalAnnualSpend.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. Main Control & Filtering Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: Category Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              selectedType === 'all'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            全部单位 ({partners.length})
          </button>

          <button
            onClick={() => setSelectedType('calibration_agency')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'calibration_agency'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>法定计量检测机构 ({summaryKpis.calibrationCount})</span>
          </button>

          <button
            onClick={() => setSelectedType('manufacturer')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'manufacturer'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>生产厂家/原厂 ({summaryKpis.manufacturerCount})</span>
          </button>

          <button
            onClick={() => setSelectedType('third_party_repair')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'third_party_repair'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>第三方维保公司 ({summaryKpis.thirdPartyCount})</span>
          </button>

          <button
            onClick={() => setSelectedType('supplier')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'supplier'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>备件与供货商 ({summaryKpis.supplierCount})</span>
          </button>
        </div>

        {/* Right: Search, Status Filter, View Mode & Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索单位名称、联系人、电话、协议号..."
              className="pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-md text-xs font-medium w-56 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 border-none rounded-md text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">全部履约状态</option>
            <option value="履约中">履约中</option>
            <option value="长期合作">长期合作</option>
            <option value="临期需续签">临期需续签</option>
            <option value="已到期">已到期</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="卡片网格视图"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="列表表格视图"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Monthly Finance Report Button */}
          <button
            onClick={() => setIsFinanceModalOpen(true)}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="按月统计各维保合作单位维修费用与财务科付款资金请款单"
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">财务资金请款月报</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            title="导出为 CSV 表格"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">导出名录</span>
          </button>

          {/* Add Partner Button */}
          <button
            onClick={onOpenAddPartnerModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>登记往来单位</span>
          </button>
        </div>

      </div>

      {/* 3. Partners Content Area: Grid or Table with Single-Screen Layout & Pagination */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50/50 rounded-xl border border-slate-200">
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {filteredPartnersWithStats.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-600">未找到符合筛选条件的往来单位</div>
              <p className="text-xs text-slate-400">可尝试调整检索关键词，或点击右上角登记新往来单位。</p>
            </div>
          ) : viewMode === 'grid' ? (
            
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2">
              {paginatedPartners.map(({ partner, managedEquipmentCount, activeFaultEquipmentCount, maintenanceEquipmentCount, totalRepairsCount, totalRepairCost, lastServiceDate }) => {
                const meta = getTypeMeta(partner.type);
                return (
                  <div
                    key={partner.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group/card hover:border-blue-300"
                  >
                  {/* Card Header */}
                  <div className="p-4 pb-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                        {partner.level && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {partner.level}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {partner.contractStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEditPartner(partner)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                          title="编辑此单位"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 
                      onClick={() => onOpenPartnerDetail(partner)}
                      className="text-sm font-bold text-slate-900 mt-2 hover:text-blue-600 transition cursor-pointer flex items-center justify-between gap-2"
                      title="点击查看全景档案"
                    >
                      <span className="truncate">{partner.name}</span>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                        评分: <strong className="text-amber-500 font-bold">{partner.cooperationRating}</strong>
                      </span>
                    </h3>

                    <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-2">
                      <span>简称: <strong className="text-slate-700">{partner.shortName}</strong></span>
                      <span>•</span>
                      <span className="truncate">协议: {partner.contractNo}</span>
                    </div>
                  </div>

                  {/* Card Middle: Contact & Qualifications */}
                  <div className="p-4 py-3 space-y-2.5 text-xs text-slate-600 flex-1">
                    {/* Contacts */}
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{partner.contactPerson}</span>
                          <span className="text-slate-500 text-[10px]">({partner.contactTitle})</span>
                        </div>
                        <button
                          onClick={() => handleCopy(partner.contactPhone, `${partner.id}-phone`)}
                          className="text-blue-600 hover:underline font-mono text-[10px] cursor-pointer"
                        >
                          {copiedId === `${partner.id}-phone` ? '已复制' : partner.contactPhone.split('/')[0].trim()}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1 text-rose-600 font-semibold text-[10px]">
                          <Phone className="w-3 h-3" />
                          24h应急热线:
                        </span>
                        <strong className="font-mono text-slate-800 text-[11px]">{partner.hotline.split('(')[0].trim()}</strong>
                      </div>
                    </div>

                    {/* Qualifications Tags */}
                    <div className="flex flex-wrap gap-1">
                      {partner.qualifications.map((q, idx) => (
                        <span key={idx} className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {q}
                        </span>
                      ))}
                    </div>

                    {/* In-service equipment and financial summary */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-blue-50/50 p-1.5 rounded">
                        <div className="text-[10px] text-slate-500">在管设备</div>
                        <div className="text-xs font-bold text-blue-700 mt-0.5">{managedEquipmentCount} 台</div>
                      </div>

                      <div className={`p-1.5 rounded ${activeFaultEquipmentCount > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                        <div className="text-[10px] text-slate-500">运行故障</div>
                        <div className={`text-xs font-bold mt-0.5 ${activeFaultEquipmentCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {activeFaultEquipmentCount} 台
                        </div>
                      </div>

                      <div className="bg-amber-50/50 p-1.5 rounded">
                        <div className="text-[10px] text-slate-500">往来支出</div>
                        <div className="text-xs font-bold text-amber-700 font-mono mt-0.5 notranslate" translate="no">
                          ￥{totalRepairCost > 0 ? (totalRepairCost > 10000 ? `${(totalRepairCost / 10000).toFixed(1)}万` : totalRepairCost) : '0'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 px-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigateToEquipmentLedger(partner.shortName || partner.name)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>查看台账 ({managedEquipmentCount}台)</span>
                    </button>

                    <button
                      onClick={() => onOpenPartnerDetail(partner)}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>往来全景档案</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        ) : (

          /* TABLE VIEW */
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs">
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">单位名称 / 简称</th>
                  <th className="py-2.5 px-3">单位类别</th>
                  <th className="py-2.5 px-3">对接团队与热线</th>
                  <th className="py-2.5 px-3">履约合同 / 状态</th>
                  <th className="py-2.5 px-3 text-center">在管设备数</th>
                  <th className="py-2.5 px-3 text-right">年度往来结算</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedPartners.map(({ partner, managedEquipmentCount, activeFaultEquipmentCount, totalRepairCost }) => {
                  const meta = getTypeMeta(partner.type);
                  return (
                    <tr key={partner.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => onOpenPartnerDetail(partner)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{partner.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({partner.shortName})</span>
                        </button>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>评级: <strong className="text-amber-500">{partner.cooperationRating}</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-xs">{partner.qualifications.slice(0, 2).join(' / ')}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-[11px]">
                        <div className="font-semibold text-slate-800">
                          {partner.contactPerson} ({partner.contactTitle})
                        </div>
                        <div className="text-slate-500 font-mono">{partner.contactPhone.split('/')[0]}</div>
                        <div className="text-rose-600 font-mono text-[10px]">热线: {partner.hotline.split('(')[0]}</div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px]">
                        <div className="font-mono font-semibold text-slate-800">{partner.contractNo}</div>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block mt-0.5">
                          {partner.contractStatus}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold">
                        <button
                          onClick={() => onNavigateToEquipmentLedger(partner.shortName || partner.name)}
                          className="text-blue-600 hover:underline font-mono"
                        >
                          {managedEquipmentCount} 台
                        </button>
                        {activeFaultEquipmentCount > 0 && (
                          <span className="block text-[10px] text-rose-500 font-normal">
                            ({activeFaultEquipmentCount}台待修)
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 notranslate" translate="no">
                        ￥{totalRepairCost.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPartnerDetail(partner)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold transition cursor-pointer"
                          >
                            全景档案
                          </button>
                          <button
                            onClick={() => onEditPartner(partner)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            title="编辑"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePartner(partner.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>

        {/* 固定底部单屏分页栏 */}
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredPartnersWithStats.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Monthly Finance Report Modal */}
      {isFinanceModalOpen && (
        <MonthlyFinanceReportModal
          isOpen={isFinanceModalOpen}
          onClose={() => setIsFinanceModalOpen(false)}
          equipmentList={equipmentList}
          partnersList={partners}
        />
      )}

    </div>
  );
};

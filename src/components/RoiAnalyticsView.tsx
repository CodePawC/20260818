import React, { useState, useMemo, useEffect } from 'react';
import { MedicalEquipment } from '../types';
import { 
  EquipmentFinancialProfile, 
  EconomicQuadrantType, 
  RoiSimulationParams 
} from '../types/roiTypes';
import { 
  calculateEquipmentFinancialProfile, 
  calculateHospitalRoiOverview, 
  simulateEquipmentRoi 
} from '../utils/roiEconomicsUtils';
import { Pagination } from './Pagination';
import { 
  Coins, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  SlidersHorizontal, 
  Building2, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Printer, 
  Download, 
  RefreshCw, 
  Layers, 
  Zap, 
  Clock, 
  Percent, 
  Sparkles,
  ArrowRight,
  Scale,
  FlaskConical
} from 'lucide-react';
import { ActiveTab } from '../types';

interface RoiAnalyticsViewProps {
  equipmentList: MedicalEquipment[];
  initialSelectedEquipmentId?: string;
  onViewDeviceDetails?: (device: MedicalEquipment) => void;
  onOpenAiDimensionModal?: (device: MedicalEquipment, initialDimension?: string) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

type RoiTabMode = 'overview' | 'deepdive' | 'simulation' | 'department';

export const RoiAnalyticsView: React.FC<RoiAnalyticsViewProps> = ({
  equipmentList,
  initialSelectedEquipmentId,
  onViewDeviceDetails,
  onOpenAiDimensionModal,
  onNavigateToTab
}) => {
  const [tabMode, setTabMode] = useState<RoiTabMode>(initialSelectedEquipmentId ? 'deepdive' : 'overview');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');
  const [selectedPriceScale, setSelectedPriceScale] = useState<string>('all');
  const [sortField, setSortField] = useState<'purchasePrice' | 'annualGrossRevenue' | 'annualNetProfit' | 'annualRoi' | 'paybackYears'>('purchasePrice');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Overview 列表分页状态
  const [overviewPage, setOverviewPage] = useState<number>(1);
  const [overviewPageSize, setOverviewPageSize] = useState<number>(10);

  useEffect(() => {
    setOverviewPage(1);
  }, [searchKeyword, selectedDept, selectedQuadrant, selectedPriceScale, sortField, sortOrder]);

  // 计算全院所有设备的财务画像
  const allProfiles = useMemo(() => {
    return equipmentList.map(eq => calculateEquipmentFinancialProfile(eq));
  }, [equipmentList]);

  // 全院大盘概览统计
  const hospitalOverview = useMemo(() => {
    return calculateHospitalRoiOverview(equipmentList);
  }, [equipmentList]);

  // 当前在深入剖析或推演沙盘中选中的设备 ID
  const [selectedProfileId, setSelectedProfileId] = useState<string>(() => {
    if (initialSelectedEquipmentId) return initialSelectedEquipmentId;
    // 默认优选一台高价值大型影像设备 (如 CT 或 磁共振 或 彩超)
    const ctDevice = allProfiles.find(p => p.equipmentName.includes('CT') || p.equipmentName.includes('磁共振') || p.purchasePrice >= 1000000);
    return ctDevice ? ctDevice.equipmentId : (allProfiles[0]?.equipmentId || '');
  });

  const currentProfile = useMemo(() => {
    return allProfiles.find(p => p.equipmentId === selectedProfileId) || allProfiles[0];
  }, [allProfiles, selectedProfileId]);

  const currentEquipment = useMemo(() => {
    if (!currentProfile) return null;
    return equipmentList.find(e => e.id === currentProfile.equipmentId) || null;
  }, [equipmentList, currentProfile]);

  // 沙盘推演动态参数
  const [simulationParams, setSimulationParams] = useState<RoiSimulationParams>({
    workloadDeltaPercent: 15,
    unitPriceAdjust: 0,
    consumableRateAdjust: -2,
    annualMaintenancePlan: 'current'
  });

  // 计算沙盘推演结果
  const simulationResult = useMemo(() => {
    if (!currentProfile) return null;
    return simulateEquipmentRoi(currentProfile, simulationParams);
  }, [currentProfile, simulationParams]);

  // 提取可用科室
  const departments = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [equipmentList]);

  // 筛选与排序设备财务画像列表
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(p => {
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match = p.equipmentName.toLowerCase().includes(kw) ||
                      p.equipmentModel.toLowerCase().includes(kw) ||
                      p.equipmentSn.toLowerCase().includes(kw) ||
                      p.department.toLowerCase().includes(kw);
        if (!match) return false;
      }
      if (selectedDept !== 'all' && p.department !== selectedDept) {
        return false;
      }
      if (selectedQuadrant !== 'all' && p.quadrant !== selectedQuadrant) {
        return false;
      }
      if (selectedPriceScale === 'mega' && p.purchasePrice < 3000000) return false;
      if (selectedPriceScale === 'large' && (p.purchasePrice < 500000 || p.purchasePrice >= 3000000)) return false;
      if (selectedPriceScale === 'medium' && (p.purchasePrice < 100000 || p.purchasePrice >= 500000)) return false;
      if (selectedPriceScale === 'small' && p.purchasePrice >= 100000) return false;

      return true;
    }).sort((a, b) => {
      const valA = a[sortField] || 0;
      const valB = b[sortField] || 0;
      return sortOrder === 'desc' ? (valB - valA) : (valA - valB);
    });
  }, [allProfiles, searchKeyword, selectedDept, selectedQuadrant, selectedPriceScale, sortField, sortOrder]);

  // 分页数据
  const paginatedProfiles = useMemo(() => {
    const start = (overviewPage - 1) * overviewPageSize;
    return filteredProfiles.slice(start, start + overviewPageSize);
  }, [filteredProfiles, overviewPage, overviewPageSize]);

  // 科室维度效益汇总统计
  const departmentStats = useMemo(() => {
    const map: Record<string, {
      dept: string;
      deviceCount: number;
      totalValue: number;
      totalRevenue: number;
      totalProfit: number;
      avgRoi: number;
      revenuePer100: number;
    }> = {};

    allProfiles.forEach(p => {
      const d = p.department || '未分配科室';
      if (!map[d]) {
        map[d] = {
          dept: d,
          deviceCount: 0,
          totalValue: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgRoi: 0,
          revenuePer100: 0
        };
      }
      map[d].deviceCount++;
      map[d].totalValue += p.purchasePrice;
      map[d].totalRevenue += p.annualGrossRevenue;
      map[d].totalProfit += p.annualNetProfit;
    });

    return Object.values(map).map(item => ({
      ...item,
      avgRoi: item.totalValue > 0 ? parseFloat(((item.totalProfit / item.totalValue) * 100).toFixed(1)) : 0,
      revenuePer100: item.totalValue > 0 ? parseFloat(((item.totalRevenue / item.totalValue) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [allProfiles]);

  // 打印或导出报告弹层模拟
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs">
      {/* 顶部主标题栏 */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 flex-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200/60">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">大型医疗装备单机成本效益与投资回报 (ROI) 决策中心</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                三甲评审 · 精细化运营
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              全生命周期全成本测算（折旧/维保/耗材/能耗/人工）、业务收入归集、保本点盈亏平衡分析与采购论证沙盘
            </p>
          </div>
        </div>

        {/* 顶部视图模式切换器 */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setTabMode('overview')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              tabMode === 'overview'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>全院效益大盘与象限</span>
          </button>
          <button
            onClick={() => setTabMode('deepdive')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              tabMode === 'deepdive'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>单机损益与全成本透视</span>
          </button>
          <button
            onClick={() => setTabMode('simulation')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              tabMode === 'simulation'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>配置论证与ROI沙盘</span>
          </button>
          <button
            onClick={() => setTabMode('department')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              tabMode === 'department'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>科室贡献矩阵</span>
          </button>
        </div>
      </div>

      {/* 主体滚动内容区 */}
      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50/60">
        
        {/* 大型医用设备单机保本点 (BEP) 与多维效益核算体系 */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-700/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                核算模型
              </span>
              <span className="text-xs font-bold text-white">
                大型医用设备多维综合效益评价与单机盈亏平衡点 (BEP) 测算
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              单机年度盈亏保本工时测算公式 <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">Q_BEP = FC / (P_avg - VC_unit)</code>，综合权衡社会公益服务权重 (30%)、临床急救保障效能 (30%) 与财务投资回报率 ROI (40%)。
            </p>
          </div>
        </div>

        {/* 全院宏观财务与投资 KPI 统计横栏 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>在役设备总原值</span>
              <Layers className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 notranslate" translate="no">
              ￥{(hospitalOverview.totalAssetValue / 10000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">万元</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">全院纳入核算固定资产</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>年度业务创收总额</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 notranslate" translate="no">
              ￥{(hospitalOverview.totalAnnualRevenue / 10000).toFixed(1)} <span className="text-xs text-emerald-700 font-normal">万元</span>
            </p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">年总检查与治疗收费收入</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>年度设备净利润</span>
              <Coins className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1 notranslate" translate="no">
              ￥{(hospitalOverview.totalAnnualNetProfit / 10000).toFixed(1)} <span className="text-xs text-amber-700 font-normal">万元</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">扣除折旧/维保/耗材/人力</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>全院综合年化 ROI</span>
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-indigo-600 mt-1">
              {hospitalOverview.averageHospitalRoi}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">平均投资回报率</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>平均投资回收周期</span>
              <Clock className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-purple-600 mt-1">
              {hospitalOverview.averagePaybackYears} <span className="text-xs text-purple-700 font-normal">年</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">动态现金流平衡点</p>
          </div>
        </div>

        {/* ===================== 视图模式 1: 全院效益大盘与象限分布 ===================== */}
        {tabMode === 'overview' && (
          <div className="space-y-4">
            {/* 经济效益四象限画像卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'star' ? 'all' : 'star')}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedQuadrant === 'star'
                    ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span>🌟 明星高效设备</span>
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                    {allProfiles.filter(p => p.quadrant === 'star').length} 台
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  高收入、高负荷率（&gt;60%）、低故障维修，处于高回报黄金服役期。
                </p>
              </div>

              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'cash_cow' ? 'all' : 'cash_cow')}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedQuadrant === 'cash_cow'
                    ? 'bg-cyan-50/90 border-cyan-300 ring-2 ring-cyan-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-cyan-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-800 flex items-center gap-1.5">
                    <span>💰 稳定高产机型</span>
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-100 text-cyan-800">
                    {allProfiles.filter(p => p.quadrant === 'cash_cow').length} 台
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  初始采购投资已全部收回（已回本），持续贡献高纯净现金流。
                </p>
              </div>

              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'heavy_maintenance' ? 'all' : 'heavy_maintenance')}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedQuadrant === 'heavy_maintenance'
                    ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <span>⚠️ 高耗重载预警</span>
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                    {allProfiles.filter(p => p.quadrant === 'heavy_maintenance').length} 台
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  业务量大但核心零配件磨损严重，累计维保和配件支出异常偏高。
                </p>
              </div>

              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'underutilized' ? 'all' : 'underutilized')}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedQuadrant === 'underutilized'
                    ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <span>💤 闲置低效资产</span>
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
                    {allProfiles.filter(p => p.quadrant === 'underutilized').length} 台
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  负荷率低于35%，工作量未达盈亏保本点，建议纳入应急库跨科共享。
                </p>
              </div>
            </div>

            {/* 筛选与检索控制条 */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  {/* 关键字搜索 */}
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="搜索设备名称、型号、出厂编号或科室..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* 科室筛选 */}
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">所有科室 (全部)</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {/* 投资体量筛选 */}
                  <select
                    value={selectedPriceScale}
                    onChange={(e) => setSelectedPriceScale(e.target.value)}
                    className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">全价值区间 (全部)</option>
                    <option value="mega">大型甲乙类 (&gt;300万元)</option>
                    <option value="large">中大型设备 (50万~300万)</option>
                    <option value="medium">中型常规设备 (10万~50万)</option>
                    <option value="small">小型监护器械 (&lt;10万元)</option>
                  </select>

                  {/* 象限重置按钮 */}
                  {selectedQuadrant !== 'all' && (
                    <button
                      onClick={() => setSelectedQuadrant('all')}
                      className="px-2 py-1 text-xs rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>清除象限: {selectedQuadrant}</span>
                      <span>×</span>
                    </button>
                  )}
                </div>

                {/* 排序方式选择 */}
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <span>排序：</span>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as any)}
                    className="py-1 px-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="purchasePrice">采购原值 (投资规模)</option>
                    <option value="annualGrossRevenue">年度业务创收</option>
                    <option value="annualNetProfit">年度净利润</option>
                    <option value="annualRoi">年化 ROI 回报率</option>
                    <option value="paybackYears">投资回收周期</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="p-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                    title={sortOrder === 'desc' ? '降序排列' : '升序排列'}
                  >
                    {sortOrder === 'desc' ? '↓ 降序' : '↑ 升序'}
                  </button>
                </div>
              </div>
            </div>

            {/* 设备单机成本效益总榜表格 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-slate-700">
                  全院单机成本效益核算明细榜 (共匹配 {filteredProfiles.length} 台设备)
                </span>
                <span className="text-[11px] text-slate-400">
                  点击任意设备行可直接开启【单机损益透视】或【沙盘推演】
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3">设备名称 / 型号 / 编号</th>
                      <th className="py-2.5 px-3">使用科室</th>
                      <th className="py-2.5 px-3 text-right">采购原值</th>
                      <th className="py-2.5 px-3 text-right">月均人次</th>
                      <th className="py-2.5 px-3 text-right">年度总创收</th>
                      <th className="py-2.5 px-3 text-right">年度全成本</th>
                      <th className="py-2.5 px-3 text-right">年度净收益</th>
                      <th className="py-2.5 px-3 text-center">年化 ROI</th>
                      <th className="py-2.5 px-3">投资回收进度</th>
                      <th className="py-2.5 px-3 text-center">经济象限</th>
                      <th className="py-2.5 px-3 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400">
                          没有找到符合条件的设备财务核算记录
                        </td>
                      </tr>
                    ) : (
                      paginatedProfiles.map((p) => {
                        const originalEq = equipmentList.find(e => e.id === p.equipmentId);
                        return (
                          <tr 
                            key={p.equipmentId}
                            className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedProfileId(p.equipmentId);
                              setTabMode('deepdive');
                            }}
                          >
                            <td className="py-2.5 px-3 max-w-[220px]">
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                {p.equipmentName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono truncate">
                                {p.equipmentModel || '-'} · SN:{p.equipmentSn}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-medium text-slate-700">{p.department}</span>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap notranslate" translate="no">
                              ￥{p.purchasePrice.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                              {p.monthlyExaminations} <span className="text-[10px] text-slate-400">次/月</span>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap notranslate" translate="no">
                              ￥{p.annualGrossRevenue.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap notranslate" translate="no">
                              ￥{p.annualTotalCost.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap notranslate" translate="no">
                              <span className={p.annualNetProfit >= 0 ? 'text-amber-600' : 'text-rose-600'}>
                                {p.annualNetProfit >= 0 ? '+' : ''}￥{p.annualNetProfit.toLocaleString()}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-bold whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                p.annualRoi >= 25 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : p.annualRoi >= 10 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : p.annualRoi >= 0 
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {p.annualRoi}%
                              </span>
                            </td>

                            <td className="py-2.5 px-3 min-w-[130px]">
                              <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                                <span className={p.isPaybackCompleted ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                                  {p.isPaybackCompleted ? '已收回成本' : `回收期 ${p.paybackYears} 年`}
                                </span>
                                <span className="font-bold text-slate-700">{p.paybackProgressPercent}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    p.isPaybackCompleted 
                                      ? 'bg-emerald-500' 
                                      : p.paybackProgressPercent > 50 
                                      ? 'bg-blue-500' 
                                      : 'bg-amber-500'
                                  }`} 
                                  style={{ width: `${p.paybackProgressPercent}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${p.badgeClass}`}>
                                {p.quadrantLabel.split(' ')[1] || p.quadrantLabel}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedProfileId(p.equipmentId);
                                    setTabMode('deepdive');
                                  }}
                                  className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] transition cursor-pointer"
                                  title="查看单机成本瀑布与损益透视"
                                >
                                  透视
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProfileId(p.equipmentId);
                                    setTabMode('simulation');
                                  }}
                                  className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium text-[11px] transition cursor-pointer"
                                  title="进入ROI配置论证沙盘推演"
                                >
                                  沙盘
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

              {/* 表格底部固定分页栏 */}
              <Pagination
                currentPage={overviewPage}
                pageSize={overviewPageSize}
                totalCount={filteredProfiles.length}
                onPageChange={setOverviewPage}
                onPageSizeChange={(sz) => {
                  setOverviewPageSize(sz);
                  setOverviewPage(1);
                }}
              />
            </div>
          </div>
        )}

        {/* ===================== 视图模式 2: 单机损益与全成本透视 ===================== */}
        {tabMode === 'deepdive' && currentProfile && (
          <div className="space-y-4">
            {/* 设备快速切换栏 */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">当前剖析设备：</span>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="text-xs py-1.5 px-3 bg-blue-50/60 border border-blue-200 text-blue-900 font-bold rounded-md focus:outline-hidden cursor-pointer min-w-[280px]"
                >
                  {allProfiles.map(p => (
                    <option key={p.equipmentId} value={p.equipmentId}>
                      {p.equipmentName} ({p.department} · ￥{p.purchasePrice.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {onOpenAiDimensionModal && currentEquipment && (
                  <button
                    onClick={() => onOpenAiDimensionModal(currentEquipment, 'roi_cost')}
                    className="px-3 py-1.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="开启此单机的AI多维深度智能交互研判"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                    <span>AI 多维深度研判</span>
                  </button>
                )}
                <button
                  onClick={() => setTabMode('simulation')}
                  className="px-3 py-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  <span>载入此设备进行沙盘推演</span>
                </button>
                <button
                  onClick={handlePrintReport}
                  className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>打印单机效益报告</span>
                </button>
              </div>
            </div>

            {/* 单机宏观效益档案卡片 */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{currentProfile.equipmentName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentProfile.badgeClass}`}>
                      {currentProfile.quadrantLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-mono">
                      {currentProfile.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    规格型号: <span className="font-mono text-slate-700">{currentProfile.equipmentModel}</span> | 
                    出厂序列号: <span className="font-mono text-slate-700">{currentProfile.equipmentSn}</span> | 
                    投用日期: <span className="font-mono text-slate-700">{currentProfile.purchaseDate}</span> (在役 <span className="font-bold text-slate-800">{currentProfile.serviceYears}</span> 年)
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">采购资产原值</span>
                  <p className="text-xl font-bold text-slate-900 font-mono notranslate" translate="no">
                    ￥{currentProfile.purchasePrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 核心财务指标网格 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">年度业务总创收</span>
                  <p className="text-base font-bold text-emerald-600 mt-0.5 font-mono notranslate" translate="no">
                    ￥{currentProfile.annualGrossRevenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">月均 {currentProfile.monthlyExaminations} 人次 × ￥{currentProfile.unitPrice}/次</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">年度运营全成本</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5 font-mono notranslate" translate="no">
                    ￥{currentProfile.annualTotalCost.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">折旧+维保+耗材+动力+人工</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">年度净现金流收益</span>
                  <p className={`text-base font-bold mt-0.5 font-mono notranslate ${currentProfile.annualNetProfit >= 0 ? 'text-amber-600' : 'text-rose-600'}`} translate="no">
                    {currentProfile.annualNetProfit >= 0 ? '+' : ''}￥{currentProfile.annualNetProfit.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">年化 ROI: <span className="font-bold text-slate-700">{currentProfile.annualRoi}%</span></p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">保本月均工作量 (盈亏平衡)</span>
                  <p className="text-base font-bold text-indigo-600 mt-0.5 font-mono">
                    {currentProfile.breakEvenMonthlyVolume} <span className="text-xs text-indigo-400 font-normal">人次/月</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">实际达标率: <span className="font-bold text-emerald-600">{Math.round((currentProfile.monthlyExaminations / Math.max(1, currentProfile.breakEvenMonthlyVolume)) * 100)}%</span></p>
                </div>
              </div>
            </div>

            {/* 全成本构成瀑布分解卡片 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 成本要素拆解 */}
              <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span>单机全成本构成要素瀑布分解 (Annual Cost Structure)</span>
                  </h4>
                  <span className="text-xs font-mono text-slate-500 notranslate" translate="no">
                    年总成本: ￥{currentProfile.annualTotalCost.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* 1. 折旧费 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <span>固定资产折旧分摊 (Straight-line Depreciation)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 notranslate" translate="no">
                        ￥{currentProfile.annualDepreciation.toLocaleString()} ({Math.round((currentProfile.annualDepreciation / currentProfile.annualTotalCost) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((currentProfile.annualDepreciation / currentProfile.annualTotalCost) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      按 {currentProfile.depreciationYears} 年折旧期直线计提，5% 残值率。已累计计提折旧 ￥{currentProfile.cumulativeDepreciation.toLocaleString()}。
                    </p>
                  </div>

                  {/* 2. 维保与维修费 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>维修保养与零配件支出 (Maintenance & Parts)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 notranslate" translate="no">
                        ￥{currentProfile.annualMaintenanceCost.toLocaleString()} ({Math.round((currentProfile.annualMaintenanceCost / currentProfile.annualTotalCost) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((currentProfile.annualMaintenanceCost / currentProfile.annualTotalCost) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      基于设备历史工单累计支出 ￥{currentProfile.cumulativeMaintenanceCost.toLocaleString()} 平均折算。
                    </p>
                  </div>

                  {/* 3. 专用耗材与试剂 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        <span>专用耗材与临床试剂 (Consumables & Reagents)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 notranslate" translate="no">
                        ￥{currentProfile.annualConsumableCost.toLocaleString()} ({Math.round((currentProfile.annualConsumableCost / currentProfile.annualTotalCost) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.round((currentProfile.annualConsumableCost / currentProfile.annualTotalCost) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      专用耗材成本率约 {Math.round(currentProfile.consumableRate * 100)}%（如造影剂、消毒液、高压连接管等）。
                    </p>
                  </div>

                  {/* 4. 动力能耗与场地 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>场地公摊与动力能耗 (Space & Power Utilities)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 notranslate" translate="no">
                        ￥{currentProfile.annualUtilitiesAndSpace.toLocaleString()} ({Math.round((currentProfile.annualUtilitiesAndSpace / currentProfile.annualTotalCost) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((currentProfile.annualUtilitiesAndSpace / currentProfile.annualTotalCost) * 100)}%` }} />
                    </div>
                  </div>

                  {/* 5. 医护技师人工工时 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                        <span>医技操作与护理工时 (Clinical Labor Allocation)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 notranslate" translate="no">
                        ￥{currentProfile.annualLaborCost.toLocaleString()} ({Math.round((currentProfile.annualLaborCost / currentProfile.annualTotalCost) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-500 rounded-full" style={{ width: `${Math.round((currentProfile.annualLaborCost / currentProfile.annualTotalCost) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 投资回收与决策建议卡片 */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>投资回收期与运营决策结论</span>
                  </h4>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">累计回本进度：</span>
                      <span className="font-bold text-emerald-700">{currentProfile.paybackProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${currentProfile.paybackProgressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>已在役 {currentProfile.serviceYears} 年</span>
                      <span>回收期 {currentProfile.paybackYears} 年</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">百元固定资产产出率：</span>
                      <span className="font-bold font-mono text-slate-800">￥{currentProfile.revenuePer100Asset} 元/年</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">设备负荷率 (稼动率)：</span>
                      <span className="font-bold font-mono text-slate-800">{currentProfile.capacityUtilization}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">累计产生净收益：</span>
                      <span className={`font-bold font-mono notranslate ${currentProfile.cumulativeNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} translate="no">
                        ￥{currentProfile.cumulativeNetProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>医学装备委员会管理建议：</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    {currentProfile.managementAdvice}
                  </p>
                </div>
              </div>
            </div>

            {/* 近 12 个月收支走势表 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">近 12 个月月度业务量、收支与净收益时序流水</span>
                <span className="text-[11px] text-slate-400">单位：元 / 人次</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="py-2 px-3">月份</th>
                      <th className="py-2 px-3 text-right">检查人次</th>
                      <th className="py-2 px-3 text-right">业务总收入</th>
                      <th className="py-2 px-3 text-right">折旧分摊</th>
                      <th className="py-2 px-3 text-right">维保配件</th>
                      <th className="py-2 px-3 text-right">耗材试剂</th>
                      <th className="py-2 px-3 text-right">动力与人工</th>
                      <th className="py-2 px-3 text-right">当月全成本</th>
                      <th className="py-2 px-3 text-right">当月净收益</th>
                      <th className="py-2 px-3 text-right">累计现金流</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentProfile.monthlyHistory.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-bold text-slate-900">{m.month}</td>
                        <td className="py-2 px-3 text-right">{m.volume}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 notranslate" translate="no">￥{m.grossRevenue.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-500 notranslate" translate="no">￥{m.depreciationCost.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-amber-600 notranslate" translate="no">￥{m.maintenanceCost.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-500 notranslate" translate="no">￥{m.consumableCost.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-500 notranslate" translate="no">￥{m.utilitiesLaborCost.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-800 notranslate" translate="no">￥{m.totalCost.toLocaleString()}</td>
                        <td className={`py-2 px-3 text-right font-bold notranslate ${m.netProfit >= 0 ? 'text-amber-600' : 'text-rose-600'}`} translate="no">
                          {m.netProfit >= 0 ? '+' : ''}￥{m.netProfit.toLocaleString()}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold notranslate ${m.cumulativeProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} translate="no">
                          ￥{m.cumulativeProfit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== 视图模式 3: 配置论证与ROI沙盘推演 ===================== */}
        {tabMode === 'simulation' && currentProfile && simulationResult && (
          <div className="space-y-4">
            {/* 沙盘推演控制板 */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      大型医用设备配置论证与经济效益沙盘推演 (What-If ROI Sandbox)
                    </h3>
                    <p className="text-xs text-slate-500">
                      调节门诊/住院检查量、收费单价与耗材费率，动态模拟投资回收期与净利润浮动
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">推演标的机型：</span>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-amber-50/60 border border-amber-200 text-amber-900 font-bold rounded-md focus:outline-hidden cursor-pointer"
                  >
                    {allProfiles.map(p => (
                      <option key={p.equipmentId} value={p.equipmentId}>
                        {p.equipmentName} ({p.department} · 原值 ￥{p.purchasePrice.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4 个可交互控制滑块 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                {/* 1. 临床工作量调节 */}
                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">月检查人次浮动</span>
                    <span className={`font-mono font-bold ${simulationParams.workloadDeltaPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {simulationParams.workloadDeltaPercent >= 0 ? '+' : ''}{simulationParams.workloadDeltaPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    step="5"
                    value={simulationParams.workloadDeltaPercent}
                    onChange={(e) => setSimulationParams({ ...simulationParams, workloadDeltaPercent: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>基准: {currentProfile.monthlyExaminations}人次</span>
                    <span className="font-bold text-slate-700">推演: {simulationResult.simulatedVolume}人次/月</span>
                  </div>
                </div>

                {/* 2. 收费单价微调 */}
                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">单次收费单价调整</span>
                    <span className="font-mono font-bold text-slate-800">
                      ￥{currentProfile.unitPrice + simulationParams.unitPriceAdjust} 元/次
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="150"
                    step="10"
                    value={simulationParams.unitPriceAdjust}
                    onChange={(e) => setSimulationParams({ ...simulationParams, unitPriceAdjust: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>基准: ￥{currentProfile.unitPrice}</span>
                    <span className="font-bold text-slate-700">
                      {simulationParams.unitPriceAdjust >= 0 ? '+' : ''}{simulationParams.unitPriceAdjust} 元
                    </span>
                  </div>
                </div>

                {/* 3. 耗材成本率 */}
                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">专用耗材费率优化</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round((currentProfile.consumableRate + simulationParams.consumableRateAdjust / 100) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="15"
                    step="1"
                    value={simulationParams.consumableRateAdjust}
                    onChange={(e) => setSimulationParams({ ...simulationParams, consumableRateAdjust: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>集采前: {Math.round(currentProfile.consumableRate * 100)}%</span>
                    <span className="font-bold text-purple-700">
                      {simulationParams.consumableRateAdjust <= 0 ? '降本 ' : '涨幅 '}
                      {Math.abs(simulationParams.consumableRateAdjust)}%
                    </span>
                  </div>
                </div>

                {/* 4. 维保方案设定 */}
                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
                  <span className="font-bold text-slate-700 text-xs block">设备售后维保方案</span>
                  <select
                    value={simulationParams.annualMaintenancePlan}
                    onChange={(e) => setSimulationParams({ ...simulationParams, annualMaintenancePlan: e.target.value as any })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="current">当前常规维护支出</option>
                    <option value="preventive_extended">原厂全保协议 (锁定4%年费)</option>
                    <option value="minimal">第三方极简保养 (降本40%)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">模拟不同维保合同对年故障成本的影响</p>
                </div>
              </div>

              {/* 推演前后对比仪表盘 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-medium">推演后年度总创收</span>
                  <p className="text-xl font-bold text-emerald-700 font-mono mt-1 notranslate" translate="no">
                    ￥{simulationResult.simulatedAnnualRevenue.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium mt-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>相对基准 {simulationResult.simulatedAnnualRevenue >= currentProfile.annualGrossRevenue ? '+' : ''}
                    ￥{(simulationResult.simulatedAnnualRevenue - currentProfile.annualGrossRevenue).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200">
                  <span className="text-xs text-amber-800 font-medium">推演后年度净利润</span>
                  <p className="text-xl font-bold text-amber-700 font-mono mt-1 notranslate" translate="no">
                    ￥{simulationResult.simulatedAnnualProfit.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-amber-800 font-medium mt-0.5">
                    <span>净增效益: </span>
                    <span className="font-bold">
                      {simulationResult.deltaProfit >= 0 ? '+' : ''}￥{simulationResult.deltaProfit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200">
                  <span className="text-xs text-purple-800 font-medium">推演投资回收期</span>
                  <p className="text-xl font-bold text-purple-700 font-mono mt-1">
                    {simulationResult.simulatedPaybackYears} <span className="text-xs text-purple-900 font-normal">年</span>
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-purple-800 font-medium mt-0.5">
                    <span>回本周期变动: </span>
                    <span className="font-bold">
                      {parseFloat((simulationResult.simulatedPaybackYears - currentProfile.paybackYears).toFixed(1))} 年
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
                  <span className="text-xs text-blue-800 font-medium">推演年化 ROI</span>
                  <p className="text-xl font-bold text-blue-700 font-mono mt-1">
                    {simulationResult.simulatedAnnualRoi}%
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-blue-800 font-medium mt-0.5">
                    <span>保本月工作量: </span>
                    <span className="font-bold font-mono">{simulationResult.simulatedBreakEvenVolume} 人次</span>
                  </div>
                </div>
              </div>

              {/* 论证报告生成与决策依据 */}
              <div className="p-4 rounded-lg bg-slate-900 text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-100">大型医用设备购置/增配可行性论证结论 (论证沙盘模拟输出)</span>
                  </div>
                  <button
                    onClick={handlePrintReport}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出可行性论证报告</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  经沙盘推演模型测算：若科室月均检查量达到 <span className="text-emerald-400 font-bold font-mono">{simulationResult.simulatedVolume}</span> 人次，
                  预计该设备年度创收将达 <span className="text-amber-300 font-bold font-mono notranslate" translate="no">￥{(simulationResult.simulatedAnnualRevenue / 10000).toFixed(1)} 万元</span>，
                  年净利润可达 <span className="text-emerald-300 font-bold font-mono notranslate" translate="no">￥{(simulationResult.simulatedAnnualProfit / 10000).toFixed(1)} 万元</span>。
                  投资回收期由基准的 <span className="font-bold">{currentProfile.paybackYears} 年</span> 调整至 <span className="text-purple-300 font-bold">{simulationResult.simulatedPaybackYears} 年</span>。
                  年化 ROI 达到 <span className="text-blue-300 font-bold">{simulationResult.simulatedAnnualRoi}%</span>。
                  测算指标完全符合大型医疗设备购置经济性立项标准。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================== 视图模式 4: 科室效益贡献矩阵 ===================== */}
        {tabMode === 'department' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">各临床科室医疗装备资产总值、创收与净收益排行榜</span>
                <span className="text-[11px] text-slate-400">已按年度总创收降序排列</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3">科室名称</th>
                      <th className="py-2.5 px-3 text-center">在册设备数</th>
                      <th className="py-2.5 px-3 text-right">设备总资产原值</th>
                      <th className="py-2.5 px-3 text-right">年度业务总创收</th>
                      <th className="py-2.5 px-3 text-right">年度净利润</th>
                      <th className="py-2.5 px-3 text-center">综合年化 ROI</th>
                      <th className="py-2.5 px-3 text-right">百元资产产出率</th>
                      <th className="py-2.5 px-3 text-center">效益层级</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentStats.map((d, index) => (
                      <tr key={d.dept} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-slate-200 text-slate-800' :
                            index === 2 ? 'bg-amber-700/20 text-amber-900' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span>{d.dept}</span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {d.deviceCount} 台
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 notranslate" translate="no">
                          ￥{d.totalValue.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 notranslate" translate="no">
                          ￥{d.totalRevenue.toLocaleString()}
                        </td>

                        <td className={`py-2.5 px-3 text-right font-mono font-bold notranslate ${d.totalProfit >= 0 ? 'text-amber-600' : 'text-rose-600'}`} translate="no">
                          ￥{d.totalProfit.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            d.avgRoi >= 25 ? 'bg-emerald-100 text-emerald-800' :
                            d.avgRoi >= 10 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {d.avgRoi}%
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                          ￥{d.revenuePer100} 元
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {d.revenuePer100 >= 60 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              高产标杆
                            </span>
                          ) : d.revenuePer100 >= 30 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              效益稳健
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              待挖潜提升
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

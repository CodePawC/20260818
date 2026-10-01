import React, { useState, useMemo } from 'react';
import { MedicalEquipment } from '../types';
import {
  calculateEquipmentBudgetProfile,
  calculateHospitalBudgetOverview,
  EquipmentBudgetExecutionProfile,
  BudgetWarningLevel
} from '../utils/budgetExecutionUtils';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Coins,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  Search,
  ChevronRight,
  Sparkles,
  Info,
  ShieldAlert,
  Building2,
  FileCheck,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { DepreciationTrajectoryChart } from './DepreciationTrajectoryChart';

interface BudgetExecutionWarningSectionProps {
  equipmentList: MedicalEquipment[];
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
  onNavigateToApprovals?: () => void;
}

export const BudgetExecutionWarningSection: React.FC<BudgetExecutionWarningSectionProps> = ({
  equipmentList,
  onViewDeviceDetail,
  onNavigateToApprovals
}) => {
  // 过滤与检索状态
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | BudgetWarningLevel>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'budgetRate' | 'gap' | 'depreciation' | 'price'>('budgetRate');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 折旧趋势折线图显示与选定设备状态
  const [showTrajectoryChart, setShowTrajectoryChart] = useState<boolean>(true);
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<string | undefined>(undefined);

  // 全局概览统计
  const overviewStats = useMemo(() => {
    return calculateHospitalBudgetOverview(equipmentList);
  }, [equipmentList]);

  // 所有设备的预算执行画像
  const allProfiles = useMemo(() => {
    return equipmentList.map(eq => {
      const profile = calculateEquipmentBudgetProfile(eq);
      return {
        profile,
        rawEquipment: eq
      };
    });
  }, [equipmentList]);

  // 获取科室列表
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [equipmentList]);

  // 过滤与排序
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(({ profile }) => {
      // 状态筛选
      if (selectedStatusFilter !== 'all' && profile.warningLevel !== selectedStatusFilter) {
        return false;
      }
      // 科室筛选
      if (selectedDepartment !== 'all' && profile.department !== selectedDepartment) {
        return false;
      }
      // 关键字搜索
      if (searchKeyword.trim()) {
        const q = searchKeyword.trim().toLowerCase();
        const matchName = profile.equipmentName.toLowerCase().includes(q);
        const matchModel = profile.equipmentModel.toLowerCase().includes(q);
        const matchDept = profile.department.toLowerCase().includes(q);
        const matchNo = profile.internalNo.toLowerCase().includes(q) || profile.assetNo.toLowerCase().includes(q);
        if (!matchName && !matchModel && !matchDept && !matchNo) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'budgetRate') {
        return b.profile.budgetExecutionRate - a.profile.budgetExecutionRate;
      }
      if (sortBy === 'gap') {
        return b.profile.budgetVsDepreciationGap - a.profile.budgetVsDepreciationGap;
      }
      if (sortBy === 'depreciation') {
        return b.profile.depreciationProgressRate - a.profile.depreciationProgressRate;
      }
      if (sortBy === 'price') {
        return b.profile.purchasePrice - a.profile.purchasePrice;
      }
      return 0;
    });
  }, [allProfiles, selectedStatusFilter, selectedDepartment, searchKeyword, sortBy]);

  // 预警等级渲染样式辅助
  const getBadgeStyle = (level: BudgetWarningLevel) => {
    switch (level) {
      case 'exceeded':
        return {
          container: 'bg-rose-50 border-rose-200 text-rose-800',
          badge: 'bg-rose-600 text-white font-bold',
          bar: 'bg-rose-500',
          label: '触及预算上限',
          icon: AlertOctagon,
          glow: 'border-l-4 border-l-rose-600 bg-rose-50/20'
        };
      case 'approaching':
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-800',
          badge: 'bg-amber-500 text-slate-950 font-bold',
          bar: 'bg-amber-500',
          label: '即将触及上限',
          icon: AlertTriangle,
          glow: 'border-l-4 border-l-amber-500 bg-amber-50/20'
        };
      case 'normal':
      default:
        return {
          container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badge: 'bg-emerald-600 text-white font-medium',
          bar: 'bg-emerald-500',
          label: '预算受控健康',
          icon: CheckCircle2,
          glow: 'border-l-4 border-l-emerald-500'
        };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs space-y-4 p-4.5">
      {/* 头部标题与定位 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                医疗设备全生命周期预算执行与折旧预警看板
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                双轨对齐研判
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                原值40%维保预算控制线
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              根据设备标称预期寿命、直线折旧进度与累计运维费用，精准锁定并可视化标记即将穿透预算上限的高风险设备
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTrajectoryChart(prev => !prev)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
            <span>{showTrajectoryChart ? '收起价值衰减折线' : '查看剩余年限折旧折线图'}</span>
          </button>

          {onNavigateToApprovals && (
            <button
              type="button"
              onClick={onNavigateToApprovals}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>发起大修/更新论证审批</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 大核心 KPI 概览指标卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. 已触及上限 */}
        <div 
          onClick={() => setSelectedStatusFilter('exceeded')}
          className={`p-3.5 rounded-lg border transition cursor-pointer ${
            selectedStatusFilter === 'exceeded' 
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-300' 
              : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>已触及预算上限 (红灯)</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
              ≥90% 耗尽
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {overviewStats.exceededCount}
              <span className="text-xs font-normal text-rose-600 ml-1">台</span>
            </span>
            <span className="text-[11px] text-rose-700">
              占在册 {Math.round((overviewStats.exceededCount / overviewStats.totalEquipmentCount) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-rose-600 mt-1 truncate">
            建议停止继续大修投入，申请更新或报废
          </p>
        </div>

        {/* 2. 即将触及上限 (临界预警) */}
        <div 
          onClick={() => setSelectedStatusFilter('approaching')}
          className={`p-3.5 rounded-lg border transition cursor-pointer ${
            selectedStatusFilter === 'approaching' 
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300' 
              : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>即将触及上限 (黄灯)</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
              70%~90% 临界
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-800 font-mono">
              {overviewStats.approachingCount}
              <span className="text-xs font-normal text-amber-700 ml-1">台</span>
            </span>
            <span className="text-[11px] text-amber-800 font-medium">
              重点风控监察
            </span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1 truncate">
            预算消耗过快或早期折旧严重滞后
          </p>
        </div>

        {/* 3. 预算安全受控 */}
        <div 
          onClick={() => setSelectedStatusFilter('normal')}
          className={`p-3.5 rounded-lg border transition cursor-pointer ${
            selectedStatusFilter === 'normal' 
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300' 
              : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>预算执行正常 (绿灯)</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
              &lt;70% 健康
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {overviewStats.normalCount}
              <span className="text-xs font-normal text-emerald-600 ml-1">台</span>
            </span>
            <span className="text-[11px] text-emerald-700">
              受控率 {Math.round((overviewStats.normalCount / overviewStats.totalEquipmentCount) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 truncate">
            维保开支与折旧衰减进度相匹配
          </p>
        </div>

        {/* 4. 全院宏观预算与折旧大盘 */}
        <div 
          onClick={() => setSelectedStatusFilter('all')}
          className={`p-3.5 rounded-lg border transition cursor-pointer ${
            selectedStatusFilter === 'all' 
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>全院总体执行率</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-indigo-700">
              均值 {overviewStats.averageExecutionRate}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-800 font-mono">
              ￥{(overviewStats.totalMaintenanceSpent / 10000).toFixed(1)}
              <span className="text-xs font-normal text-slate-500 ml-0.5">万元</span>
            </span>
            <span className="text-[11px] text-slate-500">
              / 上限 ￥{(overviewStats.totalBudgetCeiling / 10000).toFixed(1)}万
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            平均折旧进度: {overviewStats.averageDepreciationRate}%
          </p>
        </div>
      </div>

      {/* 预警设备资产价值衰减轨迹折线图 (基于剩余使用年限与历史折旧对齐) */}
      {showTrajectoryChart && (
        <div className="pt-0.5">
          <DepreciationTrajectoryChart
            equipmentList={equipmentList}
            initialSelectedId={selectedTrajectoryId}
            onViewDeviceDetail={onViewDeviceDetail}
          />
        </div>
      )}

      {/* 搜索与多维过滤条 */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* 状态过滤器 */}
          <div className="flex items-center bg-white p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedStatusFilter === 'all' ? 'bg-slate-800 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({allProfiles.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('exceeded')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedStatusFilter === 'exceeded' ? 'bg-rose-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              触及上限 ({overviewStats.exceededCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('approaching')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedStatusFilter === 'approaching' ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              即将触及 ({overviewStats.approachingCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('normal')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedStatusFilter === 'normal' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              正常受控 ({overviewStats.normalCount})
            </button>
          </div>

          {/* 科室筛选 */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs font-medium py-1.5 px-2 bg-white border border-slate-200 rounded-md focus:outline-hidden cursor-pointer"
          >
            <option value="all">全院所有科室</option>
            {departmentOptions.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* 排序规则 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-medium py-1.5 px-2 bg-white border border-slate-200 rounded-md focus:outline-hidden cursor-pointer"
          >
            <option value="budgetRate">按预算执行率由高到低</option>
            <option value="gap">按预算与折旧偏离度(超前消耗)排序</option>
            <option value="depreciation">按实际折旧进度排序</option>
            <option value="price">按采购原值排序</option>
          </select>
        </div>

        {/* 关键字搜索 */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="搜索设备名称/型号/编号..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* 设备预算执行与折旧预警卡片流 */}
      <div className="space-y-3">
        {filteredProfiles.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            未检索到符合筛选条件的设备预算记录
          </div>
        ) : (
          filteredProfiles.map(({ profile, rawEquipment }) => {
            const style = getBadgeStyle(profile.warningLevel);
            const BadgeIcon = style.icon;
            const isExpanded = expandedId === profile.equipmentId;

            return (
              <div
                key={profile.equipmentId}
                className={`p-3.5 rounded-lg border transition hover:shadow-xs bg-white ${style.glow} ${
                  profile.warningLevel === 'exceeded'
                    ? 'border-rose-200'
                    : profile.warningLevel === 'approaching'
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* 顶部标题行 */}
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {profile.equipmentName}
                      </span>

                      {/* 可视化预警标记徽章 */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${style.badge}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{profile.warningLabel} ({profile.budgetExecutionRate}%)</span>
                      </span>

                      {/* 严重早衰标记 */}
                      {profile.budgetVsDepreciationGap > 20 && profile.depreciationProgressRate < 60 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          ⚠️ 严重早衰超支 (+{profile.budgetVsDepreciationGap}%)
                        </span>
                      )}

                      <span className="text-[11px] text-slate-500">
                        状态: <span className="font-semibold text-slate-700">{profile.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>型号: <strong className="text-slate-700 font-medium">{profile.equipmentModel}</strong></span>
                      <span>·</span>
                      <span>科室: <strong className="text-slate-700 font-medium">{profile.department}</strong></span>
                      <span>·</span>
                      <span>统一编码: <strong className="text-slate-700 font-mono font-medium">{profile.internalNo}</strong></span>
                      <span>·</span>
                      <span>原值: <strong className="text-slate-800 font-mono">￥{profile.purchasePrice.toLocaleString()}</strong></span>
                      <span>·</span>
                      <span>启用: <strong className="text-slate-600 font-medium">{profile.enableDate}</strong></span>
                    </div>
                  </div>

                  {/* 动作操作区 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrajectoryId(profile.equipmentId);
                        setShowTrajectoryChart(true);
                        // 滚动至折线图区域
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                      title="在折线图中查看该设备的剩余使用年限与资产净值衰减轨迹"
                    >
                      <TrendingDown className="w-3 h-3 text-blue-600" />
                      <span>衰减折线</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : profile.equipmentId)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition cursor-pointer"
                    >
                      {isExpanded ? '收起测算' : '测算明细'}
                    </button>
                    {onViewDeviceDetail && (
                      <button
                        type="button"
                        onClick={() => onViewDeviceDetail(rawEquipment)}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>全生命周期档案</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 核心对比：双轨进度条 (寿命折旧进度 vs 预算执行进度) */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
                  {/* 轨 1：实际折旧与寿命进度 */}
                  <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>实际折旧与寿命进度</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {profile.depreciationProgressRate}% (已服役 {profile.serviceYears}年 / 标称{profile.expectedLifespanYears}年)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          profile.depreciationProgressRate >= 100 ? 'bg-purple-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, profile.depreciationProgressRate)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>已计提折旧: ￥{profile.cumulativeDepreciationAmount.toLocaleString()}</span>
                      <span>账面净值: ￥{profile.netAssetValue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 轨 2：全生命周期维保预算执行率 */}
                  <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>维保预算上限执行率</span>
                      </span>
                      <span className={`font-mono font-bold ${
                        profile.warningLevel === 'exceeded' 
                          ? 'text-rose-600' 
                          : profile.warningLevel === 'approaching' 
                          ? 'text-amber-600' 
                          : 'text-emerald-700'
                      }`}>
                        {profile.budgetExecutionRate}% (已支出 ￥{profile.totalMaintenanceCost.toLocaleString()} / 上限 ￥{profile.maintenanceBudgetCeiling.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                        style={{ width: `${Math.min(100, profile.budgetExecutionRate)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>剩余可用预算额: <strong className="font-mono text-slate-800">￥{profile.remainingBudget.toLocaleString()}</strong></span>
                      <span className={`font-semibold ${profile.budgetVsDepreciationGap > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {profile.budgetVsDepreciationGap > 0 
                          ? `预算超前折旧 +${profile.budgetVsDepreciationGap}%` 
                          : `预算滞后折旧 ${profile.budgetVsDepreciationGap}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 智能诊断与研判结论提示 */}
                <div className={`mt-2.5 p-2 rounded text-xs flex items-start gap-2 ${
                  profile.warningLevel === 'exceeded'
                    ? 'bg-rose-50/60 text-rose-900 border border-rose-100'
                    : profile.warningLevel === 'approaching'
                    ? 'bg-amber-50/60 text-amber-900 border border-amber-100'
                    : 'bg-slate-50 text-slate-600 border border-slate-100'
                }`}>
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" />
                  <div className="flex-1">
                    <strong className="font-semibold mr-1">管理决策研判:</strong>
                    {profile.riskDiagnostic}
                  </div>
                </div>

                {/* 展开的测算详情抽屉 */}
                {isExpanded && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 text-slate-700">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>医学装备经济管理精细化核算模型 (五莲县人民医院规范)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block">核算基准原值</span>
                        <span className="font-bold text-slate-800">￥{profile.purchasePrice.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block">全期维保预算上限(40%)</span>
                        <span className="font-bold text-slate-800">￥{profile.maintenanceBudgetCeiling.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block">当前账面净值</span>
                        <span className="font-bold text-indigo-700 font-mono">￥{profile.netAssetValue.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-blue-50/70 rounded border border-blue-200">
                        <span className="text-blue-600 block font-medium">剩余使用年限</span>
                        <span className="font-bold text-blue-900 font-mono">
                          {profile.remainingYears > 0 ? `${profile.remainingYears} 年` : '已超期服役'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block">阶段预算配额</span>
                        <span className="font-bold text-slate-800">￥{profile.stageBudgetQuota.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block">支出折旧偏离度</span>
                        <span className={`font-bold ${profile.budgetVsDepreciationGap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {profile.budgetVsDepreciationGap > 0 ? `+${profile.budgetVsDepreciationGap}%` : `${profile.budgetVsDepreciationGap}%`}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      注：根据《大型医用设备配置与使用监督管理办法》与公立医院成本核算规范，当设备累计维修支出逼近采购原值 40% 时触碰预算上限黄线预警；达到 50% 时进入无维修价值红线，优先组织院级技术鉴定与设备更新。
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

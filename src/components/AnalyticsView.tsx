import React, { useState, useMemo } from 'react';
import { MedicalEquipment } from '../types';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  Coins, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  ShieldCheck,
  FileCheck,
  Wrench,
  Sparkles,
  Activity,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Wallet,
  AlertOctagon,
  Percent
} from 'lucide-react';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { calculateHospitalBudgetOverview } from '../utils/budgetExecutionUtils';
import { BudgetExecutionWarningSection } from './BudgetExecutionWarningSection';

interface AnalyticsViewProps {
  equipmentList: MedicalEquipment[];
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
  onNavigateToApprovals?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  equipmentList,
  onViewDeviceDetail,
  onNavigateToApprovals,
}) => {
  const [timeScope, setTimeScope] = useState<'all' | 'year' | 'month' | 'day'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-07');
  const [overdueSectionTab, setOverdueSectionTab] = useState<'permitted' | 'pending'>('permitted');

  // Extract available years, months, and dates from equipment list
  const { years, months, dates } = useMemo(() => {
    const yearSet = new Set<string>();
    const monthSet = new Set<string>();
    const dateSet = new Set<string>();

    equipmentList.forEach((eq) => {
      eq.repairRecords?.forEach((rec) => {
        const dStr = (rec.faultDate || rec.completionDate || '').replace(/\//g, '-');
        if (dStr) {
          dateSet.add(dStr);
          if (dStr.length >= 7) monthSet.add(dStr.slice(0, 7));
          if (dStr.length >= 4) yearSet.add(dStr.slice(0, 4));
        }
      });
    });

    return {
      years: Array.from(yearSet).sort().reverse(),
      months: Array.from(monthSet).sort().reverse(),
      dates: Array.from(dateSet).sort().reverse(),
    };
  }, [equipmentList]);

  // Compute repair expenses dynamically based on selected time dimension
  const filteredRepairExpenses = useMemo(() => {
    let cost = 0;
    let count = 0;
    const deptCostMap: Record<string, number> = {};

    equipmentList.forEach((eq) => {
      eq.repairRecords?.forEach((rec) => {
        const dStr = (rec.faultDate || rec.completionDate || '').replace(/\//g, '-');
        if (!dStr) return;

        let matched = false;
        if (timeScope === 'all') matched = true;
        else if (timeScope === 'year' && dStr.startsWith(selectedYear)) matched = true;
        else if (timeScope === 'month' && dStr.startsWith(selectedMonth)) matched = true;
        else if (timeScope === 'day' && dStr === selectedDate) matched = true;

        if (matched) {
          const recCost = rec.cost || 0;
          cost += recCost;
          count += 1;
          const dept = eq.department || '未知科室';
          deptCostMap[dept] = (deptCostMap[dept] || 0) + recCost;
        }
      });
    });

    return { totalCost: cost, recordCount: count, deptCostMap };
  }, [timeScope, selectedYear, selectedMonth, selectedDate, equipmentList]);

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};
  let totalCostAll = 0;

  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let unknownValidityCount = 0;

  equipmentList.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
    e.repairRecords?.forEach(r => {
      totalCostAll += r.cost || 0;
    });

    const vInfo = getEquipmentValidityInfo(e);
    if (vInfo.riskLevel === 'high') highRiskCount++;
    else if (vInfo.riskLevel === 'medium') mediumRiskCount++;
    else if (vInfo.riskLevel === 'low') lowRiskCount++;
    else unknownValidityCount++;
  });

  // 超期服役与准用备案专项指标统计
  const overdueAnalytics = useMemo(() => {
    let totalExpired = 0;
    let permittedActive = 0;
    let pendingFiling = 0;
    let expiringSoon = 0;
    let totalRefurbishInvestment = 0;
    const permittedDevices: Array<{
      equipment: MedicalEquipment;
      vInfo: ReturnType<typeof getEquipmentValidityInfo>;
    }> = [];
    const pendingDevices: Array<{
      equipment: MedicalEquipment;
      vInfo: ReturnType<typeof getEquipmentValidityInfo>;
    }> = [];

    equipmentList.forEach((eq) => {
      const vInfo = getEquipmentValidityInfo(eq);
      if (vInfo.isExpired) {
        totalExpired++;
        if (vInfo.isFilingActive) {
          permittedActive++;
          permittedDevices.push({ equipment: eq, vInfo });
          if (eq.overdueFiling?.refurbishCost) {
            totalRefurbishInvestment += eq.overdueFiling.refurbishCost;
          }
        } else {
          pendingFiling++;
          pendingDevices.push({ equipment: eq, vInfo });
        }
      } else if (vInfo.isExpiringSoon) {
        expiringSoon++;
      }
    });

    return {
      totalExpired,
      permittedActive,
      pendingFiling,
      expiringSoon,
      totalRefurbishInvestment,
      permittedDevices,
      pendingDevices,
      complianceRate: totalExpired > 0 ? Math.round((permittedActive / totalExpired) * 100) : 100
    };
  }, [equipmentList]);

  // 预算执行与折旧进度宏观统计
  const budgetOverview = useMemo(() => {
    return calculateHospitalBudgetOverview(equipmentList);
  }, [equipmentList]);

  const totalDevices = equipmentList.length || 1;

  return (
    <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">全院医疗设备效能、效期与成本统计看板 Analytics</h2>
            <p className="text-xs text-slate-500 font-medium">
              资产结构分布、科室设备密度、设备生产效期风险与维保支出分析
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50/50">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">在册台账设备总数</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{equipmentList.length} <span className="text-xs text-slate-400 font-normal">台</span></p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">设备综合完好率</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {Math.round((equipmentList.filter(e => e.status === '正常运行').length / totalDevices) * 100)}%
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">超期高风险设备</p>
            <p className={`text-xl font-bold mt-1 ${highRiskCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {highRiskCount} <span className="text-xs text-slate-400 font-normal">台</span>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">临期预警设备</p>
            <p className={`text-xl font-bold mt-1 ${mediumRiskCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {mediumRiskCount} <span className="text-xs text-slate-400 font-normal">台</span>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">预算上限预警</p>
              <span className="text-[10.5px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">40%红线</span>
            </div>
            <p className={`text-xl font-bold mt-1 ${(budgetOverview.exceededCount + budgetOverview.approachingCount) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {budgetOverview.exceededCount + budgetOverview.approachingCount} <span className="text-xs text-slate-400 font-normal">台</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              触及: <strong className="text-rose-600">{budgetOverview.exceededCount}</strong> · 临界: <strong className="text-amber-600">{budgetOverview.approachingCount}</strong>
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">建档全期维保总支出</p>
            <p className="text-xl font-bold text-slate-800 mt-1 notranslate" translate="no">￥{totalCostAll.toLocaleString()}</p>
          </div>
        </div>

        {/* Budget Warning Banner */}
        {(budgetOverview.exceededCount > 0 || budgetOverview.approachingCount > 0) && (
          <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-300 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertOctagon className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold">
                  预算执行红线预警：全院共检出 {budgetOverview.exceededCount} 台设备累计维保已触及原值40%预算上限、{budgetOverview.approachingCount} 台设备即将触及上限
                </span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  全院平均折旧进度达 {budgetOverview.overallDepreciationProgressRate}%，维保预算整体执行率 {budgetOverview.overallBudgetExecutionRate}%。对即将触及预算上限的设备，建议实施严格大修限额审批或纳入更新论证储备。
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded bg-white/90 text-amber-900 border border-amber-300 font-mono font-bold text-[11px] shadow-2xs">
                预算受控达标率: {budgetOverview.totalEquipmentCount > 0 ? Math.round((budgetOverview.normalCount / budgetOverview.totalEquipmentCount) * 100) : 100}%
              </span>
            </div>
          </div>
        )}

        {/* Validity Risk Summary Banner */}
        {highRiskCount > 0 && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">效期安全预警：全院检测到 {highRiskCount} 台设备已超出生产有效期（高风险）</span>
                <p className="text-rose-800 text-[11px] mt-0.5">建议工程部组织各科室评估设备使用风险，对临床必需设备办理稳定性检测与特许准用备案，或启动提请报废程序。</p>
              </div>
            </div>
            {onNavigateToApprovals && (
              <button
                type="button"
                onClick={onNavigateToApprovals}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>前往审批中心查办备案</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 医疗装备超期服役稳定性检测与特许准用备案监管专栏 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">超期服役稳定性检测与特许准用备案安全监管专栏</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    合规备案率 {overdueAnalytics.complianceRate}%
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  72小时满负荷连续运行检验 · 核心元器件预防性整修 · 装备委员会特许准用批文 · 月度重点质控巡检
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            {onNavigateToApprovals && (
              <button
                type="button"
                onClick={onNavigateToApprovals}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>查看准用备案档案</span>
              </button>
            )}
          </div>

          {/* 4 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">超役服役设备总数</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-slate-800">{overdueAnalytics.totalExpired}</span>
                <span className="text-xs text-slate-400">台 (已过设计寿命)</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
              <span className="text-[11px] font-medium text-emerald-700">稳定性达标·特许准用</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-emerald-700">{overdueAnalytics.permittedActive}</span>
                <span className="text-xs text-emerald-600">台 (具备专属备案标牌)</span>
              </div>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-100">
              <span className="text-[11px] font-medium text-amber-700">待申报备案 / 评估停用</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-amber-700">{overdueAnalytics.pendingFiling}</span>
                <span className="text-xs text-amber-600">台 (待组织技术鉴定)</span>
              </div>
            </div>

            <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
              <span className="text-[11px] font-medium text-indigo-700">预防性整修与重构投资</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-indigo-700 notranslate" translate="no">￥{overdueAnalytics.totalRefurbishInvestment.toLocaleString()}</span>
                <span className="text-xs text-indigo-600">元 (备件与翻新工程)</span>
              </div>
            </div>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOverdueSectionTab('permitted')}
                className={`pb-2 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  overdueSectionTab === 'permitted'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>特许准用受控设备列表 ({overdueAnalytics.permittedDevices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOverdueSectionTab('pending')}
                className={`pb-2 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  overdueSectionTab === 'pending'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>待备案/停用评估设备 ({overdueAnalytics.pendingDevices.length})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              {overdueSectionTab === 'permitted' ? '均已完成72h连续运行稳定性测试' : '需尽快完成技术鉴定与报批'}
            </span>
          </div>

          {/* Tab 1: Permitted Devices Grid */}
          {overdueSectionTab === 'permitted' && (
            <div className="space-y-2">
              {overdueAnalytics.permittedDevices.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  当前暂无已备案特许准用的超役设备
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {overdueAnalytics.permittedDevices.map(({ equipment: eq, vInfo }) => {
                    const filing = eq.overdueFiling;
                    return (
                      <div
                        key={eq.id}
                        className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60 transition flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800">{eq.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                特许准用
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                超期 +{vInfo.yearsPast}年
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span>型号: {eq.model}</span>
                              <span>·</span>
                              <span>科室: {eq.department}</span>
                              <span>·</span>
                              <span>编号: {eq.internalNo || eq.id}</span>
                            </div>
                          </div>

                          {onViewDeviceDetail && (
                            <button
                              type="button"
                              onClick={() => onViewDeviceDetail(eq)}
                              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium transition cursor-pointer shrink-0"
                            >
                              档案详情
                            </button>
                          )}
                        </div>

                        {/* Stability test and filing specs */}
                        {filing && (
                          <div className="bg-white/80 p-2 rounded border border-emerald-100 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">准用凭证备案号:</span>
                              <span className="font-mono font-bold text-emerald-800">{filing.filingNo}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">准用有效截止:</span>
                              <span className="font-bold text-slate-800">
                                {filing.validUntil} (剩余约 {vInfo.filingDaysRemaining} 天)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">72h稳定性鉴定:</span>
                              <span className="text-slate-700">
                                {filing.stabilityTestAgency || '第三方CMA计量院'} (连续 {filing.continuousRunHours || 72}h 满负荷)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">质控与电气安全:</span>
                              <span className="text-emerald-700 font-semibold">
                                {filing.electricalSafetyPassed ? '✅ GB 9706.1 电气安全合格' : '电气安全受控'} · 漂移率 {filing.stabilityParameterDrift || '0.24%'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Pending Devices List */}
          {overdueSectionTab === 'pending' && (
            <div className="space-y-2">
              {overdueAnalytics.pendingDevices.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  全院超役设备均已完成特许准用备案，暂无待评估设备
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {overdueAnalytics.pendingDevices.map(({ equipment: eq, vInfo }) => (
                    <div
                      key={eq.id}
                      className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{eq.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                              待备案评估
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              超期 +{vInfo.yearsPast}年
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>型号: {eq.model}</span>
                            <span>·</span>
                            <span>科室: {eq.department}</span>
                            <span>·</span>
                            <span>标称寿命: {vInfo.validityYears}年</span>
                          </div>
                        </div>

                        {onViewDeviceDetail && (
                          <button
                            type="button"
                            onClick={() => onViewDeviceDetail(eq)}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold transition cursor-pointer shrink-0"
                          >
                            办备案
                          </button>
                        )}
                      </div>

                      <div className="bg-white/80 p-2 rounded border border-amber-200 text-[11px] text-slate-600">
                        <p>
                          <strong>处置提示：</strong>该设备已超出原厂出厂标称年限。如为临床日常重保抢救必需，请尽快联系具有资质的工程团队进行核心备件整修及 72 小时稳定性检测后，报请医学装备委员会审批。
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dedicated Repair Expense Time-Dimension Analysis Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">维保与配件支出分时段多维统计</h3>
                <p className="text-xs text-slate-500">快速按全期、按年、按月、按日切换计算成本开支</p>
              </div>
            </div>

            {/* Switchers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium">
                <button
                  onClick={() => setTimeScope('all')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'all' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  全期
                </button>
                <button
                  onClick={() => setTimeScope('year')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'year' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  按年
                </button>
                <button
                  onClick={() => setTimeScope('month')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'month' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  按月
                </button>
                <button
                  onClick={() => setTimeScope('day')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${timeScope === 'day' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  按日
                </button>
              </div>

              {timeScope === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y} 年度</option>
                  ))}
                </select>
              )}

              {timeScope === 'month' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m} 月份</option>
                  ))}
                </select>
              )}

              {timeScope === 'day' && (
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md focus:outline-hidden cursor-pointer"
                >
                  {dates.map((d) => (
                    <option key={d} value={d}>{d} 当日</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50/50 p-3.5 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800 font-medium">所选时间范围支出总额</p>
              <p className="text-2xl font-bold text-amber-900 mt-1 notranslate" translate="no">
                ￥{filteredRepairExpenses.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">维修工单笔数</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {filteredRepairExpenses.recordCount} <span className="text-xs font-normal text-slate-500">笔</span>
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">单笔平均支出</p>
              <p className="text-2xl font-bold text-slate-800 mt-1 notranslate" translate="no">
                ￥{filteredRepairExpenses.recordCount > 0 ? Math.round(filteredRepairExpenses.totalCost / filteredRepairExpenses.recordCount).toLocaleString() : 0}
              </p>
            </div>
          </div>

          {/* Department breakdown for selected time scope */}
          {Object.keys(filteredRepairExpenses.deptCostMap).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-700 mb-2">该时段内各科室维修成本占比：</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(filteredRepairExpenses.deptCostMap).map(([dept, c]) => (
                  <div key={dept} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs flex justify-between items-center">
                    <span className="text-slate-600 font-medium truncate">{dept}</span>
                    <span className="font-bold text-slate-800 notranslate" translate="no">￥{c.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 关键功能集成：台账预算执行预警与折旧进度管控看板 */}
        <BudgetExecutionWarningSection
          equipmentList={equipmentList}
          onViewDeviceDetail={onViewDeviceDetail}
          onNavigateToApprovals={onNavigateToApprovals}
        />

        {/* Visual Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Validity Risk Distribution */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> 设备效期风险分布 Risk Profile
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-rose-700">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-500" /> 高风险 (已超期)</span>
                  <span>{highRiskCount} 台 ({Math.round((highRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${Math.round((highRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-amber-700">
                  <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 中风险 (临期预警)</span>
                  <span>{mediumRiskCount} 台 ({Math.round((mediumRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.round((mediumRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 低风险 (效期正常)</span>
                  <span>{lowRiskCount} 台 ({Math.round((lowRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.round((lowRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              {unknownValidityCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>未设定效期</span>
                    <span>{unknownValidityCount} 台 ({Math.round((unknownValidityCount / totalDevices) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${Math.round((unknownValidityCount / totalDevices) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budget Execution Risk Distribution */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-600" /> 维保预算执行分布 Budget Risk
              </span>
              <span className="text-[10.5px] font-mono font-bold text-slate-500">上限: 原值40%</span>
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-rose-700">
                  <span className="flex items-center gap-1"><AlertOctagon className="w-3 h-3 text-rose-500" /> 触及预算上限 (≥90%)</span>
                  <span>{budgetOverview.exceededCount} 台 ({Math.round((budgetOverview.exceededCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full transition-all" style={{ width: `${Math.round((budgetOverview.exceededCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-amber-700">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> 即将触及上限 (70~89%)</span>
                  <span>{budgetOverview.approachingCount} 台 ({Math.round((budgetOverview.approachingCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.round((budgetOverview.approachingCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 预算受控健康 (&lt;70%)</span>
                  <span>{budgetOverview.normalCount} 台 ({Math.round((budgetOverview.normalCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.round((budgetOverview.normalCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>全院平均折旧进度: <strong className="text-slate-800 font-mono">{budgetOverview.overallDepreciationProgressRate}%</strong></span>
                <span>预算整体执行: <strong className="text-slate-800 font-mono">{budgetOverview.overallBudgetExecutionRate}%</strong></span>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <BarChart3 className="w-4 h-4 text-blue-600" /> 设备资产类别分布 Category
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-rose-700">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-500" /> 高风险 (已超期)</span>
                  <span>{highRiskCount} 台 ({Math.round((highRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${Math.round((highRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-amber-700">
                  <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 中风险 (临期预警)</span>
                  <span>{mediumRiskCount} 台 ({Math.round((mediumRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.round((mediumRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 低风险 (效期正常)</span>
                  <span>{lowRiskCount} 台 ({Math.round((lowRiskCount / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.round((lowRiskCount / totalDevices) * 100)}%` }}></div>
                </div>
              </div>

              {unknownValidityCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>未设定效期</span>
                    <span>{unknownValidityCount} 台 ({Math.round((unknownValidityCount / totalDevices) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${Math.round((unknownValidityCount / totalDevices) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <BarChart3 className="w-4 h-4 text-blue-600" /> 设备资产类别分布 Category
            </h3>
            <div className="space-y-3">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / totalDevices) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat}</span>
                      <span>{count} 台 ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Density */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> 使用科室分布密度 Department
            </h3>
            <div className="space-y-3">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const percent = Math.round((count / totalDevices) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{dept}</span>
                      <span>{count} 台 ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Calendar,
  Wrench,
  Trash2,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Clock,
  HelpCircle,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { MedicalEquipment } from '../types';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { ApprovalApplication } from '../types/approvalTypes';
import { estimateRealisticPurchasePrice, calculateEquipmentFinancialProfile } from '../utils/roiEconomicsUtils';
import { PeerEquipmentCostComparison } from './PeerEquipmentCostComparison';

export interface EquipmentCostAnalysisTabProps {
  equipment: MedicalEquipment;
  deviceWorkOrders: EngineeringWorkOrder[];
  allEquipment?: MedicalEquipment[];
  onNavigateToApprovals?: (data: Partial<ApprovalApplication>) => void;
  onNavigateToRoi?: (equipmentId: string) => void;
  onCloseModal?: () => void;
}

interface MonthlyCostPoint {
  month: string;              // YYYY-MM
  displayMonth: string;       // e.g. 25年10月
  cost: number;               // 当月实际维修支出 (元)
  faultCount: number;         // 当月报修故障次数
  cumulativeCost: number;     // 截至当月累计维修支出 (元)
  scrapThreshold: number;     // 报废/更新阈值基准 (原值50%)
  singleMonthAlert: number;   // 单月大修预警线
  dynamicRedline: number;     // 全生命周期动态预警红线 (元)
  monthlyBaseline: number;    // 月度正常维保均值
  details: {
    source: string;
    description: string;
    cost: number;
    date: string;
    technician?: string;
  }[];
}

export const EquipmentCostAnalysisTab: React.FC<EquipmentCostAnalysisTabProps> = ({
  equipment,
  deviceWorkOrders,
  allEquipment,
  onNavigateToApprovals,
  onNavigateToRoi,
  onCloseModal
}) => {
  // 图表呈现模式：月度单月波动 vs 累计爬升逼近阈值
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative'>('monthly');
  // 选中的月份用于高亮及显示当月明细
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  // 提供便捷预览开关（支持在任何设备上快速演示超30%触发效果）
  const [simulateExceed30, setSimulateExceed30] = useState(false);

  // 1. 基础财务与生命周期参数测算
  const financialProfile = useMemo(() => {
    return calculateEquipmentFinancialProfile(equipment);
  }, [equipment]);

  const purchasePrice = useMemo(() => {
    return estimateRealisticPurchasePrice(equipment);
  }, [equipment]);

  // 设备全生命周期价值 (净现值/折旧后资产账面价值)
  const lifecycleValue = financialProfile.netAssetValue;

  // 2. 报废/更新阈值标准设定 (中国医学装备行业与公立医院通用规范)
  // 核心阈值：累计维修成本达到采购原值的 50%，即进入经济寿命终止期
  const SCRAP_THRESHOLD_RATIO = 0.5; // 50%
  const WARN_THRESHOLD_RATIO = 0.35;  // 35% 预警观察线
  const scrapThresholdAmount = Math.round(purchasePrice * SCRAP_THRESHOLD_RATIO);
  const warnThresholdAmount = Math.round(purchasePrice * WARN_THRESHOLD_RATIO);

  // 单月重大故障支出警戒线
  const singleMonthAlertAmount = Math.min(
    100000,
    Math.max(8000, Math.round(purchasePrice * 0.08))
  );

  // 3. 生成最近12个月的月度时间轴 (从 2025-10 至 2026-09)
  const past12Months = useMemo(() => {
    const list: string[] = [];
    const refDate = new Date('2026-09-08');
    for (let i = 11; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      list.push(`${y}-${m}`);
    }
    return list;
  }, []);

  // 4. 汇总所有维修与工单记录并匹配到月份
  const { monthlyDataRaw, total12MonthsCost, total12MonthsRepairs, allTimeRepairCost } = useMemo(() => {
    const repairRecords = equipment.repairRecords || [];
    
    // 计算 12 个月之前的历史累计维保支出底数
    const firstMonthStr = past12Months[0]; // 最早月份，如 '2025-10'
    let priorHistoryCost = 0;

    repairRecords.forEach(r => {
      const date = r.faultDate || r.completionDate || '';
      if (date && date < firstMonthStr) {
        priorHistoryCost += (r.cost || 0);
      }
    });

    deviceWorkOrders.forEach(o => {
      const date = o.reportTime ? o.reportTime.split(' ')[0] : '';
      if (date && date < firstMonthStr) {
        const isDupe = repairRecords.some(r => r.id === o.id);
        if (!isDupe) {
          priorHistoryCost += (o.totalRepairCost || 0);
        }
      }
    });

    let rollingCumulative = priorHistoryCost;
    let sum12MonthsCost = 0;
    let sum12MonthsRepairs = 0;

    const data = past12Months.map((m) => {
      const details: MonthlyCostPoint['details'] = [];
      let currentMonthCost = 0;

      // 匹配 repairRecords
      repairRecords.forEach(r => {
        const dateStr = r.faultDate || r.completionDate || '';
        if (dateStr.startsWith(m)) {
          const c = r.cost || 0;
          currentMonthCost += c;
          details.push({
            source: '常规维保记录',
            description: r.faultDescription || '设备故障排查与修复',
            cost: c,
            date: dateStr,
            technician: r.technician
          });
        }
      });

      // 匹配 deviceWorkOrders
      deviceWorkOrders.forEach(o => {
        const dateStr = o.reportTime || o.repairFinishedTime || '';
        if (dateStr.startsWith(m)) {
          const isDupe = details.some(d => d.date.startsWith(m) && d.cost === o.totalRepairCost && d.description === o.faultDescription);
          if (!isDupe) {
            const c = o.totalRepairCost || 0;
            currentMonthCost += c;
            details.push({
              source: `工程派工单 (${o.id})`,
              description: `${o.faultDescription} ${o.partsReplaced && o.partsReplaced.length > 0 ? `[换件:${o.partsReplaced.map(p => p.partName).join(',')}]` : ''}`,
              cost: c,
              date: dateStr.split(' ')[0] || m,
              technician: o.assignedEngineerName
            });
          }
        }
      });

      rollingCumulative += currentMonthCost;
      sum12MonthsCost += currentMonthCost;
      sum12MonthsRepairs += details.length;

      const [year, monthNum] = m.split('-');
      const displayMonth = `${year.slice(2)}年${monthNum}月`;

      return {
        month: m,
        displayMonth,
        cost: currentMonthCost,
        faultCount: details.length,
        cumulativeCost: rollingCumulative,
        scrapThreshold: scrapThresholdAmount,
        singleMonthAlert: singleMonthAlertAmount,
        monthlyBaseline: Math.round(financialProfile.annualMaintenanceCost / 12),
        details
      };
    });

    const allTimeTotal = rollingCumulative;

    return {
      monthlyDataRaw: data,
      total12MonthsCost: sum12MonthsCost,
      total12MonthsRepairs: sum12MonthsRepairs,
      allTimeRepairCost: allTimeTotal
    };
  }, [equipment, deviceWorkOrders, past12Months, scrapThresholdAmount, singleMonthAlertAmount, financialProfile.annualMaintenanceCost]);

  // 5. 【核心需求 1】根据设备全生命周期价值及累计维修费用，添加一个动态预警红线
  // 测算逻辑：随着役龄增长、净残值折损以及历史累计维修开销累积，设备单月允许的最大大修容忍限额动态收紧
  const { dynamicMonthlyRedline, dynamicCumulativeRedline, dynamicAlertExplanation, dynamicTolerancePercent } = useMemo(() => {
    const scrapCeiling = purchasePrice * 0.5;
    // 累计维修对 50% 法定报废红线的消耗比率 (0 ~ 1)
    const costConsumptionRatio = scrapCeiling > 0 ? Math.min(1, allTimeRepairCost / scrapCeiling) : 0;
    // 全生命周期价值占采购原值的比例 (0.05 ~ 1)
    const assetValueRatio = purchasePrice > 0 ? Math.max(0.05, lifecycleValue / purchasePrice) : 0.5;

    // 动态健康容忍度系数 (0.15 ~ 1.0)
    const tolerance = Math.max(0.15, (1 - costConsumptionRatio * 0.85) * (0.35 + 0.65 * assetValueRatio));

    // 月度动态预警红线 (元)：动态标定该设备现役状态下允许的最大单月维修支出
    const monthlyBase = purchasePrice * 0.10;
    const monthlyRedline = Math.round(Math.max(2800, monthlyBase * tolerance));

    // 累计动态预警红线 (元)：在累计视图下，结合当前役龄阶段的动态上限
    const cumulativeRedline = Math.round(Math.min(
      scrapCeiling,
      Math.max(purchasePrice * 0.28, scrapCeiling - (financialProfile.serviceYears >= financialProfile.depreciationYears ? purchasePrice * 0.12 : 0))
    ));

    const explanation = `基于全生命周期价值(￥${lifecycleValue.toLocaleString()})与累计维保支出(￥${allTimeRepairCost.toLocaleString()})动态标定，当前维保容忍系数 ${(tolerance * 100).toFixed(0)}%`;

    return {
      dynamicMonthlyRedline: monthlyRedline,
      dynamicCumulativeRedline: cumulativeRedline,
      dynamicAlertExplanation: explanation,
      dynamicTolerancePercent: Math.round(tolerance * 100)
    };
  }, [purchasePrice, allTimeRepairCost, lifecycleValue, financialProfile.serviceYears, financialProfile.depreciationYears]);

  // 填充月度数据中的 dynamicRedline 字段
  const monthlyData = useMemo(() => {
    return monthlyDataRaw.map(d => ({
      ...d,
      dynamicRedline: dynamicMonthlyRedline
    }));
  }, [monthlyDataRaw, dynamicMonthlyRedline]);

  // 6. 【核心需求 2】近12个月的维修费用超过设备购买价格的30%，触发‘建议更新/报废’智能提示框
  const recent12MonthsRatio = useMemo(() => {
    if (!purchasePrice || purchasePrice <= 0) return 0;
    return parseFloat(((total12MonthsCost / purchasePrice) * 100).toFixed(1));
  }, [total12MonthsCost, purchasePrice]);

  // 判定是否超过 30% 警戒线 (或开启了演示模式)
  const isExceeding30Percent = recent12MonthsRatio >= 30.0;
  const showScrapReplacementAdviceBox = isExceeding30Percent || simulateExceed30;

  // 30% 对应的具体金额警戒额度
  const thirtyPercentThresholdAmount = Math.round(purchasePrice * 0.3);

  // 7. 报废/更新多维评估模型 (综合研判)
  const assessment = useMemo(() => {
    const repairToPriceRatio = purchasePrice > 0 
      ? parseFloat(((allTimeRepairCost / purchasePrice) * 100).toFixed(1)) 
      : 0;
    
    const serviceYears = financialProfile.serviceYears;
    const depreciationYears = financialProfile.depreciationYears;
    const isOverAge = serviceYears >= depreciationYears;
    const overAgeYears = Math.max(0, parseFloat((serviceYears - depreciationYears).toFixed(1)));

    const netAssetValue = financialProfile.netAssetValue;
    const isRepairExceedingNetValue = total12MonthsCost > netAssetValue;

    const hasSingleMonthSpike = monthlyData.some(d => d.cost >= dynamicMonthlyRedline && d.cost > 0);
    const isHighFrequency = total12MonthsRepairs >= 3;

    const isScrappedStatus = equipment.status === '停用/报废';
    const reachedThreshold = repairToPriceRatio >= (SCRAP_THRESHOLD_RATIO * 100) || isScrappedStatus || isExceeding30Percent || (isOverAge && isRepairExceedingNetValue);
    const isNearThreshold = !reachedThreshold && (repairToPriceRatio >= (WARN_THRESHOLD_RATIO * 100) || hasSingleMonthSpike || recent12MonthsRatio >= 20.0);

    let statusType: 'exceeded' | 'warning' | 'normal' = 'normal';
    let title = '🟢 经济在役正常 · 尚未达报废阈值';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    let summary = '设备维保累计费用处于合理资产折旧控制区间内，性能与经济性优良，建议继续在役服役。';
    let actionAdvice = '保持常规季度预防性维护（PM）与电气安全年检，严控非必要大修换件。';

    if (reachedThreshold) {
      statusType = 'exceeded';
      title = '🔴 达到报废/更新经济阈值 · 建议启动技术鉴定';
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse';
      summary = isExceeding30Percent
        ? `设备近12个月维修总支出（￥${total12MonthsCost.toLocaleString()}）已超购买价格的 30%（实际达 ${recent12MonthsRatio}%），核心器件耗损严重，置换新机经济性显著优于继续大修。`
        : `设备累计维保费用支出（￥${allTimeRepairCost.toLocaleString()}）已占设备原值的 ${repairToPriceRatio}%（达到或超 50% 报废更新警戒线）${isOverAge ? `，且已超役服役 ${overAgeYears} 年` : ''}。继续投入大修经济收益显著为负。`;
      actionAdvice = '建议医学装备处联合使用科室停止高额配件采购，提请医学装备委员会启动技术鉴定与资产报废处置程序。';
    } else if (isNearThreshold) {
      statusType = 'warning';
      title = '🟡 临界高耗预警 · 接近报废更新评估阈值';
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
      summary = `累计维保费用已达到原值的 ${repairToPriceRatio}%（近12个月年化维修比达 ${recent12MonthsRatio}%）${hasSingleMonthSpike ? '，且近期已突破动态预警红线' : ''}，需严密防范持续大修无底洞。`;
      actionAdvice = '建议严格限额后续单次维修审批，评估改签原厂保修或列入下年度医院大型设备更新替换储备名录。';
    }

    return {
      statusType,
      title,
      badgeClass,
      summary,
      actionAdvice,
      repairToPriceRatio,
      serviceYears,
      depreciationYears,
      isOverAge,
      overAgeYears,
      netAssetValue,
      isRepairExceedingNetValue,
      hasSingleMonthSpike,
      isHighFrequency,
      reachedThreshold
    };
  }, [
    allTimeRepairCost,
    purchasePrice,
    financialProfile,
    total12MonthsCost,
    total12MonthsRepairs,
    monthlyData,
    dynamicMonthlyRedline,
    equipment.status,
    isExceeding30Percent,
    recent12MonthsRatio,
    SCRAP_THRESHOLD_RATIO,
    WARN_THRESHOLD_RATIO
  ]);

  // 自定义 Recharts 悬停 Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as MonthlyCostPoint;
      const isOverRedline = point.cost > point.dynamicRedline;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs z-50 pointer-events-none min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{point.month} ({point.displayMonth})</span>
            </span>
            <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {point.faultCount} 次维修/工单
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                <span>当月维修支出:</span>
              </span>
              <strong className={point.cost > 0 ? 'text-amber-400 font-bold text-xs' : 'text-slate-400'}>
                ￥{point.cost.toLocaleString()}
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>动态预警红线:</span>
              </span>
              <strong className={isOverRedline ? 'text-rose-400 font-bold text-xs' : 'text-slate-300'}>
                ￥{point.dynamicRedline.toLocaleString()}
                {isOverRedline && <span className="ml-1 text-2xs text-rose-300 bg-rose-950 px-1 py-0.2 rounded border border-rose-800">超标</span>}
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                <span>累计维保支出:</span>
              </span>
              <strong className="text-purple-300 font-bold">
                ￥{point.cumulativeCost.toLocaleString()}
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
              <span>50% 报废阈值:</span>
              <span className="text-rose-400 font-bold">
                ￥{point.scrapThreshold.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>当前累计占原值:</span>
              <span className={point.cumulativeCost >= point.scrapThreshold ? 'text-rose-400 font-bold' : 'text-emerald-400 font-medium'}>
                {purchasePrice > 0 ? ((point.cumulativeCost / purchasePrice) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          {point.details.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] space-y-1">
              <div className="text-slate-400 font-medium">当月主要维修事项:</div>
              {point.details.slice(0, 2).map((d, idx) => (
                <div key={idx} className="text-slate-300 truncate">
                  • {d.description} (<span className="text-amber-300">￥{d.cost.toLocaleString()}</span>)
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 当前查看的月度明细列表
  const activeMonthPoint = useMemo(() => {
    if (!selectedMonth) {
      const reversed = [...monthlyData].reverse();
      const withCost = reversed.find(d => d.cost > 0);
      return withCost || monthlyData[monthlyData.length - 1];
    }
    return monthlyData.find(d => d.month === selectedMonth) || monthlyData[monthlyData.length - 1];
  }, [selectedMonth, monthlyData]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* ===================== ⭐ 核心需求 2：近12个月维修费超原值30% ‘建议更新/报废’ 智能提示框 ⭐ ===================== */}
      {showScrapReplacementAdviceBox && (
        <div
          id="smart-scrap-replacement-alert-box"
          className="bg-gradient-to-r from-rose-50 via-red-50/90 to-rose-100/70 p-5 rounded-2xl border-2 border-rose-400 shadow-sm space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3.5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 animate-pulse">
                <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>建议更新 / 报废</span>
                  </span>
                  <span className="text-2xs font-mono font-bold text-rose-800 bg-white/95 px-2.5 py-0.5 rounded border border-rose-200">
                    近12个月维修费用达原值 {recent12MonthsRatio}% &gt; 30% 预警红线
                  </span>
                </div>
                <h3 className="text-base font-bold text-rose-950">
                  【智能提示】设备近 12 个月维修总费用已突破购买价格的 30%，达到医学装备法定更新/报废建议标准
                </h3>
                <p className="text-xs text-rose-900/90 leading-relaxed max-w-3xl">
                  系统结合《医疗装备全生命周期管理与更新淘汰技术标准》进行智能研判：该设备在最近 12 个月内累计发生维修支出 <strong className="font-mono text-rose-950 font-bold">￥{total12MonthsCost.toLocaleString()}</strong>，占设备购买原值（￥{purchasePrice.toLocaleString()}）的 <strong className="font-mono text-rose-950 font-bold">{recent12MonthsRatio}%</strong>，已显著超越行业规定的 <strong className="underline decoration-rose-500 underline-offset-2 font-bold">30.0% 年化大修更新红线</strong>。设备核心关键模组已进入高频耗损故障期，且当前全生命周期净残值仅剩 <strong className="font-mono text-rose-950 font-bold">￥{lifecycleValue.toLocaleString()}</strong>，继续大修经济收益显著为负，系统强烈建议提请医学装备委员会启动技术鉴定，执行固定资产报废下线或以旧换新置换程序。
                </p>
              </div>
            </div>

            {/* 一键报废审批操作 */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              {onNavigateToApprovals && (
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseModal) onCloseModal();
                    onNavigateToApprovals({
                      type: 'scrap_disposal',
                      equipmentId: equipment.id,
                      equipmentName: equipment.name,
                      equipmentModel: equipment.model,
                      equipmentLocation: equipment.location,
                      equipmentPurchasePrice: purchasePrice,
                      equipmentPurchaseDate: equipment.purchaseDate || equipment.enableDate,
                      equipmentCumulativeMaintenanceCost: allTimeRepairCost,
                      applicantDepartment: equipment.department,
                      title: `【${equipment.department}】${equipment.name} 建议更新/报废技术鉴定申请 (近12月维保超原值30%)`,
                      technicalEvaluation: `【智能预警：近12个月维修费用达购买价格 ${recent12MonthsRatio}%，突破 30% 更新红线】经全生命周期成本核算，该设备近12个月维修总额 ￥${total12MonthsCost.toLocaleString()}，占购买价格（￥${purchasePrice.toLocaleString()}）的 ${recent12MonthsRatio}%。设备核心器件耗损老化，全生命周期净残值仅 ￥${lifecycleValue.toLocaleString()}，继续大修经济收益显著为负，强烈建议提请医学装备委员会组织专家技术鉴定，启动【设备报废淘汰】或【配置更新置换】程序。`
                    });
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>立即发起报废/更新技术鉴定</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 维量化指标对比条 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/90 p-3 rounded-xl border border-rose-200 text-xs">
            <div>
              <span className="text-2xs text-slate-500 block">设备购买价格</span>
              <span className="font-bold font-mono text-slate-900 text-sm">￥{purchasePrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">近12个月维修总支出</span>
              <span className="font-bold font-mono text-rose-700 text-sm">￥{total12MonthsCost.toLocaleString()}</span>
              <span className="text-[10px] text-rose-600 block">占比购买原值: {recent12MonthsRatio}%</span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">30% 更新预警基准线</span>
              <span className="font-bold font-mono text-amber-800 text-sm">￥{thirtyPercentThresholdAmount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block">法定年化大修上限</span>
            </div>
            <div>
              <span className="text-2xs text-slate-500 block">超出警戒额度</span>
              <span className="font-bold font-mono text-rose-700 text-sm">
                +￥{Math.max(0, total12MonthsCost - thirtyPercentThresholdAmount).toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-600 block">
                超额 {(recent12MonthsRatio - 30).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-2xs text-rose-900 pt-1 border-t border-rose-200/80 gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span><strong>处置建议：</strong>停止大额换件与昂贵原厂维保续签，向医学装备管理委员会提报固定资产报废销卡，并将该设备列入医院次年装备更新替换优先配置名录。</span>
            </span>
            {simulateExceed30 && (
              <button
                type="button"
                onClick={() => setSimulateExceed30(false)}
                className="text-2xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                关闭演示
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================== 1. 顶部 4 格核心成本与报废阈值 KPI 看板 ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1.1 累计维保总支出与原值比 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>累计维保总支出</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border font-mono ${
                assessment.repairToPriceRatio >= 50
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : assessment.repairToPriceRatio >= 35
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                占原值 {assessment.repairToPriceRatio}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-2">
              ￥{allTimeRepairCost.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-1.5">
            <span>采购原值: <strong className="font-mono text-slate-700">￥{purchasePrice.toLocaleString()}</strong></span>
            <span className="text-slate-400">已服役 {assessment.serviceYears}年</span>
          </div>
        </div>

        {/* 1.2 最近12个月维保支出 (包含超30%红线状态指示) */}
        <div className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between transition ${
          isExceeding30Percent
            ? 'bg-rose-50/70 border-rose-300'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>近12个月维修总额</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border font-mono ${
                isExceeding30Percent
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {recent12MonthsRatio}% 原值 {isExceeding30Percent ? '⚠️超30%' : ''}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-blue-700 mt-2">
              ￥{total12MonthsCost.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-1.5">
            <span>发生 {total12MonthsRepairs} 次工单:</span>
            <span className="font-mono font-bold text-slate-700">￥{Math.round(total12MonthsCost / 12).toLocaleString()}/月</span>
          </div>
        </div>

        {/* 1.3 报废/更新经济阈值线 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>报废/更新阈值 (50%)</span>
              </span>
              <span className="text-2xs text-slate-400">行业通用</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-700 mt-2">
              ￥{scrapThresholdAmount.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-1.5">
            <span>与阈值差额:</span>
            <span className={`font-mono font-bold ${
              allTimeRepairCost >= scrapThresholdAmount ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {allTimeRepairCost >= scrapThresholdAmount
                ? `已超 ￥${(allTimeRepairCost - scrapThresholdAmount).toLocaleString()}`
                : `剩余 ￥${(scrapThresholdAmount - allTimeRepairCost).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* 1.4 全生命周期价值与综合报废研判 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>全生命周期价值</span>
              </span>
              {assessment.isOverAge && (
                <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  超役
                </span>
              )}
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-2">
              ￥{lifecycleValue.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-1.5">
            <span>动态红线容忍度:</span>
            <span className="font-mono font-bold text-indigo-600">{dynamicTolerancePercent}%</span>
          </div>
        </div>

      </div>

      {/* ===================== 2. Recharts 核心折线图表区 (包含全生命周期动态预警红线) ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4.5 space-y-3.5">
        
        {/* 图表标题与视图切换按钮 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>设备最近 12 个月月度维修费用折线图</span>
              </h4>
              {/* 动态预警红线专属高亮徽章 */}
              <span
                className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5"
                title={dynamicAlertExplanation}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-ping" />
                <span>全生命周期动态预警红线: ￥{dynamicMonthlyRedline.toLocaleString()}/月</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              区间: <strong className="font-mono text-slate-700">{past12Months[0]}</strong> 至 <strong className="font-mono text-slate-700">{past12Months[past12Months.length - 1]}</strong> · 红虚线为根据设备全生命周期价值(￥{lifecycleValue.toLocaleString()})与累计维修(￥{allTimeRepairCost.toLocaleString()})动态生成的预警红线
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMode('monthly')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  chartMode === 'monthly'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                月度支出波动 (折线)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  chartMode === 'cumulative'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                累计爬升 vs 报废红线
              </button>
            </div>
          </div>
        </div>

        {/* 折线图呈现容器 */}
        <div className="w-full h-72 pt-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyData}
              margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activeLabel) {
                  setSelectedMonth(state.activeLabel);
                }
              }}
            >
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis
                dataKey="month"
                tickFormatter={(val: string) => {
                  const parts = val.split('-');
                  return `${parts[0].slice(2)}/${parts[1]}`;
                }}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => {
                  if (val >= 10000) return `￥${(val / 10000).toFixed(1)}万`;
                  if (val >= 1000) return `￥${(val / 1000).toFixed(0)}k`;
                  return `￥${val}`;
                }}
              />

              <Tooltip content={<CustomChartTooltip />} />

              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconSize={9}
              />

              {chartMode === 'monthly' ? (
                <>
                  {/* ⭐ 核心需求 1：根据设备全生命周期价值及累计维修费用添加的动态预警红线 */}
                  <ReferenceLine
                    y={dynamicMonthlyRedline}
                    stroke="#e11d48"
                    strokeDasharray="5 3"
                    strokeWidth={2.5}
                    label={{
                      value: `动态预警红线: ￥${dynamicMonthlyRedline.toLocaleString()}`,
                      position: 'top',
                      fill: '#be123c',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  />

                  {/* 面积底色 */}
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="月度维修支出 (元)"
                    fill="url(#costGradient)"
                    stroke="none"
                  />

                  {/* 核心月度费用折线 */}
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="当月维修费用 (元)"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#4f46e5', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </>
              ) : (
                <>
                  {/* 全生命周期动态报废预警红线 */}
                  <ReferenceLine
                    y={dynamicCumulativeRedline}
                    stroke="#e11d48"
                    strokeDasharray="5 4"
                    strokeWidth={2.5}
                    label={{
                      value: `动态报废红线 (￥${dynamicCumulativeRedline.toLocaleString()})`,
                      position: 'insideTopRight',
                      fill: '#be123c',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  />

                  {/* 35% 临界高耗关注线 */}
                  <ReferenceLine
                    y={warnThresholdAmount}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={1.2}
                    label={{
                      value: `35% 临界预警线 (￥${warnThresholdAmount.toLocaleString()})`,
                      position: 'insideBottomRight',
                      fill: '#b45309',
                      fontSize: 10
                    }}
                  />

                  {/* 累计费用面积 */}
                  <Area
                    type="monotone"
                    dataKey="cumulativeCost"
                    name="累计维保支出 (元)"
                    fill="url(#cumulativeGradient)"
                    stroke="none"
                  />

                  {/* 累计支出折线 */}
                  <Line
                    type="monotone"
                    dataKey="cumulativeCost"
                    name="累计维修总支出"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#e11d48' }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 交互提示与图表注释 */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-indigo-600 inline-block" />
              <span>实际维修发生金额</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-rose-600 border-b-2 border-dashed inline-block" />
              <strong className="text-rose-700">全生命周期动态预警红线 (随价值贬值与累计支出自动收紧)</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-amber-500 border-b border-dotted inline-block" />
              <span>30% 年化大修警戒 / 35% 临界线</span>
            </span>
          </div>
          <span className="text-indigo-600 font-medium">💡 点击图表任意月份可快速查看当月具体工单明细</span>
        </div>

      </div>

      {/* ===================== 3. 全院同类设备对比与高维护成本异常个体研判 (Peer Comparison) ===================== */}
      <PeerEquipmentCostComparison
        currentEquipment={equipment}
        currentEquipmentTotalCost={allTimeRepairCost}
        currentEquipmentRecent12MonthsCost={total12MonthsCost}
        currentEquipmentPurchasePrice={purchasePrice}
        allEquipment={allEquipment}
        deviceWorkOrders={deviceWorkOrders}
      />

      {/* ===================== 4. 报废/更新技术鉴定与经济学决策评估卡 ===================== */}
      <div className={`p-4.5 rounded-xl border transition shadow-2xs ${
        assessment.statusType === 'exceeded'
          ? 'bg-rose-50/70 border-rose-200'
          : assessment.statusType === 'warning'
          ? 'bg-amber-50/70 border-amber-200'
          : 'bg-emerald-50/70 border-emerald-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 border-slate-200/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                {assessment.statusType === 'exceeded' ? (
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                ) : assessment.statusType === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <span>医学工程处专家评估报告：{assessment.title}</span>
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {assessment.summary}
            </p>
          </div>

          {/* 快捷审批与联动操作 */}
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToRoi && (
              <button
                type="button"
                onClick={() => onNavigateToRoi(equipment.id)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer shadow-2xs"
                title="查看该设备完整临床收益与投资回收周期画像"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>单机ROI效益</span>
              </button>
            )}

            {onNavigateToApprovals && (
              <button
                type="button"
                onClick={() => {
                  if (onCloseModal) onCloseModal();
                  onNavigateToApprovals({
                    type: 'scrap_disposal',
                    equipmentId: equipment.id,
                    equipmentName: equipment.name,
                    equipmentModel: equipment.model,
                    equipmentLocation: equipment.location,
                    equipmentPurchasePrice: purchasePrice,
                    equipmentPurchaseDate: equipment.purchaseDate || equipment.enableDate,
                    equipmentCumulativeMaintenanceCost: allTimeRepairCost,
                    applicantDepartment: equipment.department,
                    title: `【${equipment.department}】${equipment.name} 报废技术鉴定与更新处置申请`,
                    technicalEvaluation: `经最近12个月成本曲线及累计维保支出测算，该设备累计维修费用已达 ￥${allTimeRepairCost.toLocaleString()} (占原值 ${assessment.repairToPriceRatio}%)，近12个月年化维修支出达 ￥${total12MonthsCost.toLocaleString()} (${recent12MonthsRatio}%)，${isExceeding30Percent ? '已突破 30% 更新报废红线' : '维保成本激增'}。现时全生命周期净残值仅 ￥${lifecycleValue.toLocaleString()}，已无继续大修价值，提请医学装备委员会同意报废销卡并启动配置更新。`
                  });
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${
                  assessment.statusType === 'exceeded'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-white hover:bg-slate-50 text-rose-700 border border-rose-300'
                }`}
                title="拉起报废技术鉴定与资产下线呈批申请表"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>发起报废鉴定审批</span>
              </button>
            )}
          </div>
        </div>

        {/* 四维评估量化诊断矩阵 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          
          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-xs">
            <span className="text-2xs text-slate-500 block">1. 近12月维修费占比 (阈值30%)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-bold font-mono text-sm text-slate-800">{recent12MonthsRatio}%</span>
              <span className={`text-2xs font-bold ${recent12MonthsRatio >= 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {recent12MonthsRatio >= 30 ? '超更新线' : '安全受控'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full ${recent12MonthsRatio >= 30 ? 'bg-rose-500' : recent12MonthsRatio >= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (recent12MonthsRatio / 30) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-xs">
            <span className="text-2xs text-slate-500 block">2. 服役年限 vs 折旧年限</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-bold font-mono text-sm text-slate-800">{assessment.serviceYears} / {assessment.depreciationYears}年</span>
              <span className={`text-2xs font-bold ${assessment.isOverAge ? 'text-rose-600' : 'text-emerald-600'}`}>
                {assessment.isOverAge ? `超期${assessment.overAgeYears}年` : '在役期内'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full ${assessment.isOverAge ? 'bg-rose-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (assessment.serviceYears / assessment.depreciationYears) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-xs">
            <span className="text-2xs text-slate-500 block">3. 近一年支出 vs 净残值</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-bold font-mono text-xs text-slate-800">￥{total12MonthsCost.toLocaleString()}</span>
              <span className={`text-2xs font-bold ${assessment.isRepairExceedingNetValue ? 'text-rose-600' : 'text-emerald-600'}`}>
                {assessment.isRepairExceedingNetValue ? '修劣于换' : '仍具价值'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">净残值: ￥{lifecycleValue.toLocaleString()}</span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-xs">
            <span className="text-2xs text-slate-500 block">4. 动态红线基准限额</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-bold font-mono text-xs text-rose-700">￥{dynamicMonthlyRedline.toLocaleString()}</span>
              <span className="text-2xs font-bold text-slate-600">
                /月
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">容忍系数: {dynamicTolerancePercent}%</span>
          </div>

        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-2xs text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span><strong>决策建议：</strong>{assessment.actionAdvice}</span>
        </div>
      </div>

      {/* ===================== 4. 选定月份具体工单与故障支出明细 ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-700" />
            <h5 className="font-bold text-xs text-slate-800">
              【{activeMonthPoint.month}】月份维修支出明细清单
            </h5>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              当月共计: ￥{activeMonthPoint.cost.toLocaleString()}
            </span>
          </div>
          <span className="text-2xs text-slate-400">
            共 {activeMonthPoint.details.length} 笔支出项目
          </span>
        </div>

        {activeMonthPoint.details.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p>该月份设备运行平稳，无故障突发停机或大修支出记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-2xs font-semibold bg-slate-50/60">
                  <th className="py-2 px-3">发生日期</th>
                  <th className="py-2 px-3">记录来源</th>
                  <th className="py-2 px-3">故障描述 / 修复换件</th>
                  <th className="py-2 px-3">经手工程师</th>
                  <th className="py-2 px-3 text-right">支出金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {activeMonthPoint.details.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 text-slate-600 font-medium">{item.date}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-2xs font-sans">
                        {item.source}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-800 max-w-md truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600">
                      {item.technician || '临床工程师'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-amber-700">
                      ￥{item.cost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

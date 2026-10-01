import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';
import {
  Users,
  BarChart3,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Award,
  TrendingUp,
  DollarSign,
  Filter,
  Layers,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Scale,
  Info,
  ChevronRight,
  FileSpreadsheet,
  Check,
  Building2
} from 'lucide-react';
import { MedicalEquipment } from '../types';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { INITIAL_EQUIPMENT } from '../mockData';
import { loadStoredWorkOrders } from '../utils/dispatchData';

export interface PeerEquipmentCostComparisonProps {
  currentEquipment: MedicalEquipment;
  currentEquipmentTotalCost: number;
  currentEquipmentRecent12MonthsCost: number;
  currentEquipmentPurchasePrice: number;
  allEquipment?: MedicalEquipment[];
  deviceWorkOrders?: EngineeringWorkOrder[];
}

export interface PeerDeviceItem {
  id: string;
  name: string;
  model: string;
  department: string;
  category: string;
  level1Category?: string;
  level2Category?: string;
  purchasePrice: number;
  enableYear: string;
  serviceYears: number;
  totalRepairCost: number;
  repairCount: number;
  costToPriceRatio: number;
  status: string;
  isCurrent: boolean;
  deviationFromAvg: number;        // 元
  deviationPercentFromAvg: number; // %
}

export const PeerEquipmentCostComparison: React.FC<PeerEquipmentCostComparisonProps> = ({
  currentEquipment,
  currentEquipmentTotalCost,
  currentEquipmentRecent12MonthsCost,
  currentEquipmentPurchasePrice,
  allEquipment,
  deviceWorkOrders = []
}) => {
  // 对标口径选择：'level1' (细分品类，如监护设备/诊断X射线机) vs 'category' (专业大类，如医用成像器械/医用诊察和监护器械)
  const [scopeType, setScopeType] = useState<'level1' | 'category'>('level1');
  // 展示模式：'ranking' (同类单机对标排行柱状图) | 'brackets' (全院成本阶梯分布直方图) | 'table' (全量设备明细对照表)
  const [viewMode, setViewMode] = useState<'ranking' | 'brackets' | 'table'>('ranking');
  // 指标口径：'amount' (维修总支出金额) | 'ratio' (维修原值比 %)
  const [metricType, setMetricType] = useState<'amount' | 'ratio'>('amount');
  // 选中的同类设备（用于在表格或图表中临时查看详细指标）
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(currentEquipment.id);

  // 1. 获取全院在册设备池
  const hospitalEquipments = useMemo(() => {
    if (allEquipment && allEquipment.length > 0) return allEquipment;
    try {
      const raw = localStorage.getItem('medical_equipments');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EQUIPMENT;
  }, [allEquipment]);

  // 2. 加载全院工程工单池 (用于跨设备关联真实维修支出)
  const allStoredOrders = useMemo(() => {
    try {
      return loadStoredWorkOrders();
    } catch {
      return [];
    }
  }, []);

  // 3. 筛选当前设备在全院的同类设备群 (Cohort)
  const { peerCohort, activeCategoryLabel, isAutoFallbackToCategory } = useMemo(() => {
    const l1 = currentEquipment.level1Category;
    const cat = currentEquipment.category;

    // 先检测细分品类设备数
    let filteredByL1: MedicalEquipment[] = [];
    if (l1) {
      filteredByL1 = hospitalEquipments.filter(e => e.level1Category === l1);
    }

    // 若细分品类少于 2 台，则自动降级扩充为同专业大类，保证对标样本具有统计学意义
    let effectiveScope = scopeType;
    let autoFallback = false;
    if (scopeType === 'level1' && filteredByL1.length < 2) {
      effectiveScope = 'category';
      autoFallback = true;
    }

    let list: MedicalEquipment[] = [];
    let label = '';

    if (effectiveScope === 'level1' && l1) {
      list = filteredByL1;
      label = `细分品类：${l1}`;
    } else {
      list = hospitalEquipments.filter(e => e.category === cat);
      label = `专业大类：${cat}`;
    }

    // 确保当前设备一定包含在 Cohort 中
    const hasCurrent = list.some(e => e.id === currentEquipment.id);
    if (!hasCurrent) {
      list = [currentEquipment, ...list];
    }

    return {
      peerCohort: list,
      activeCategoryLabel: label,
      isAutoFallbackToCategory: autoFallback
    };
  }, [hospitalEquipments, currentEquipment, scopeType]);

  // 4. 解析并统计 Cohort 中每台同类设备的维保指标
  const peerDeviceItems: PeerDeviceItem[] = useMemo(() => {
    const nowYear = 2026;

    // 第一步：计算所有设备的基础费用
    const rawItems = peerCohort.map(eq => {
      const isCurrent = eq.id === currentEquipment.id;
      
      let totalRepairCost = 0;
      let repairCount = 0;
      let purchasePrice = eq.purchasePrice || 100000;

      if (isCurrent) {
        totalRepairCost = currentEquipmentTotalCost;
        repairCount = (eq.repairRecords?.length || 0) + (deviceWorkOrders?.length || 0);
        purchasePrice = currentEquipmentPurchasePrice;
      } else {
        // 其他设备：聚合其 repairRecords
        const records = eq.repairRecords || [];
        const recordSum = records.reduce((s, r) => s + (r.cost || 0), 0);
        
        // 聚合工单匹配
        const orders = allStoredOrders.filter(o =>
          (o.equipmentId && o.equipmentId === eq.id) ||
          (eq.sn && o.equipmentSn === eq.sn) ||
          (eq.internalNo && o.internalNo && o.internalNo === eq.internalNo)
        );
        const orderSum = orders.reduce((s, o) => {
          const isDupe = records.some(r => r.id === o.id);
          return isDupe ? s : s + (o.totalRepairCost || 0);
        }, 0);

        totalRepairCost = recordSum + orderSum;
        repairCount = records.length + orders.length;
      }

      // 计算役龄
      const dateStr = eq.enableDate || eq.purchaseDate || eq.manufactureDate || '2021/01/01';
      const year = parseInt(dateStr.split('/')[0] || dateStr.split('-')[0] || '2021');
      const serviceYears = Math.max(0.5, nowYear - year);

      const costToPriceRatio = purchasePrice > 0 
        ? parseFloat(((totalRepairCost / purchasePrice) * 100).toFixed(1))
        : 0;

      return {
        id: eq.id,
        name: eq.name,
        model: eq.model || '标准型',
        department: eq.department || '未分配科室',
        category: eq.category,
        level1Category: eq.level1Category,
        level2Category: eq.level2Category,
        purchasePrice,
        enableYear: `${year}年`,
        serviceYears,
        totalRepairCost,
        repairCount,
        costToPriceRatio,
        status: eq.status || '正常运行',
        isCurrent,
        deviationFromAvg: 0,
        deviationPercentFromAvg: 0
      };
    });

    // 第二步：测算全院同类均值
    const avgCost = rawItems.length > 0 
      ? Math.round(rawItems.reduce((s, item) => s + item.totalRepairCost, 0) / rawItems.length) 
      : 0;

    // 第三步：计算每台设备较均值的偏离绝对值与百分比
    return rawItems.map(item => {
      const diff = item.totalRepairCost - avgCost;
      const diffPercent = avgCost > 0 
        ? parseFloat(((diff / avgCost) * 100).toFixed(1))
        : (item.totalRepairCost > 0 ? 100 : 0);
      return {
        ...item,
        deviationFromAvg: diff,
        deviationPercentFromAvg: diffPercent
      };
    });
  }, [peerCohort, currentEquipment, currentEquipmentTotalCost, currentEquipmentPurchasePrice, deviceWorkOrders, allStoredOrders]);

  // 5. 聚合统计指标（均值、中位数、极值、排名）
  const stats = useMemo(() => {
    const count = peerDeviceItems.length;
    if (count === 0) {
      return {
        count: 0,
        avgCost: 0,
        avgRatio: 0,
        medianCost: 0,
        minCost: 0,
        maxCost: 0,
        currentRank: 1,
        currentCost: currentEquipmentTotalCost,
        currentRatio: 0,
        deviationPercent: 0,
        deviationAmount: 0,
        costThresholdHigh: 0,
        currentDeviceItem: null as PeerDeviceItem | null
      };
    }

    const costs = peerDeviceItems.map(d => d.totalRepairCost).sort((a, b) => a - b);
    const ratios = peerDeviceItems.map(d => d.costToPriceRatio).sort((a, b) => a - b);

    const totalCostSum = costs.reduce((a, b) => a + b, 0);
    const avgCost = Math.round(totalCostSum / count);
    const avgRatio = parseFloat((ratios.reduce((a, b) => a + b, 0) / count).toFixed(1));

    const midIdx = Math.floor(count / 2);
    const medianCost = count % 2 !== 0 ? costs[midIdx] : Math.round((costs[midIdx - 1] + costs[midIdx]) / 2);

    const minCost = costs[0];
    const maxCost = costs[costs.length - 1];

    // 当前设备在同类中按维修成本从高到低的降序排名
    const sortedDesc = [...peerDeviceItems].sort((a, b) => b.totalRepairCost - a.totalRepairCost);
    const currentIdx = sortedDesc.findIndex(d => d.isCurrent);
    const currentRank = currentIdx !== -1 ? currentIdx + 1 : 1;

    const currentDeviceItem = peerDeviceItems.find(d => d.isCurrent) || null;
    const currentRatio = currentDeviceItem ? currentDeviceItem.costToPriceRatio : 0;

    const deviationAmount = currentEquipmentTotalCost - avgCost;
    const deviationPercent = avgCost > 0 
      ? parseFloat(((deviationAmount / avgCost) * 100).toFixed(1))
      : (currentEquipmentTotalCost > 0 ? 100 : 0);

    // 异常个体阈值：高出同类均值 40% 或 1.4 倍
    const costThresholdHigh = Math.round(avgCost * 1.4);

    return {
      count,
      avgCost,
      avgRatio,
      medianCost,
      minCost,
      maxCost,
      currentRank,
      currentCost: currentEquipmentTotalCost,
      currentRatio,
      deviationPercent,
      deviationAmount,
      costThresholdHigh,
      currentDeviceItem
    };
  }, [peerDeviceItems, currentEquipmentTotalCost]);

  // 6. 【核心智能研判】判断该设备是否属于‘高维护成本异常个体’
  const anomalyDiagnosis = useMemo(() => {
    const { deviationPercent, currentRank, count, currentCost, avgCost, currentRatio, avgRatio } = stats;

    // 研判规则：
    // 1. 显著高耗异常 (Extreme Anomaly): 成本较均值超 40% 且累计维修达到一定规模，或在同类排第1且严重高出第2名
    // 2. 中度偏高关注 (Moderately Elevated): 成本较均值超 15% ~ 40%
    // 3. 常模受控正常 (Normal): 偏差在 -25% ~ +15%
    // 4. 优良低耗标杆 (Benchmark Low): 成本比均值低 25% 以上

    const isExtremeAnomaly = deviationPercent >= 40.0 || (currentCost >= 20000 && deviationPercent >= 25.0) || (currentRank === 1 && count >= 3 && deviationPercent >= 30.0);
    const isModerateElevated = !isExtremeAnomaly && deviationPercent >= 15.0;
    const isNormal = !isExtremeAnomaly && !isModerateElevated && deviationPercent >= -25.0;
    const isBenchmark = !isExtremeAnomaly && !isModerateElevated && !isNormal;

    if (isExtremeAnomaly) {
      return {
        level: 'anomaly' as const,
        badgeText: '🔴 显著高维护成本异常个体',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
        cardBorder: 'border-rose-300 bg-gradient-to-r from-rose-50/90 via-red-50/50 to-white',
        icon: AlertOctagon,
        iconClass: 'text-rose-600 bg-rose-100',
        headline: `【异常诊断】该设备累计维修费用达到全院同类均值的 ${(100 + deviationPercent).toFixed(0)}%，属于典型高维护成本异常个体`,
        description: `经全院同类 ${count} 台装备大数据对标：本设备累计维修总支出达 ￥${currentCost.toLocaleString()}（占原值 ${currentRatio}%），高出同类平均线（￥${avgCost.toLocaleString()}）+${deviationPercent}%，超出金额达 ￥${Math.max(0, currentCost - avgCost).toLocaleString()}，在全院同类设备中支出高居第 ${currentRank} 位（排名前 ${(currentRank / count * 100).toFixed(0)}%）。该设备已明显偏离同型设备的常规维护成本曲线，表明其存在元器件批次性隐性故障、科室超负荷运转、操作环境欠佳或过度维修换件的可能。`,
        actionPlan: '建议医学装备工程处组织院内技术委员会与设备厂商专家联合开展单机维保质量审计，复核高价配件更换必要性，并对该设备设立“异常高耗单独台账”进行重点监控。'
      };
    }

    if (isModerateElevated) {
      return {
        level: 'elevated' as const,
        badgeText: '🟡 维修成本偏高关注个体',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
        cardBorder: 'border-amber-300 bg-gradient-to-r from-amber-50/70 via-yellow-50/30 to-white',
        icon: AlertTriangle,
        iconClass: 'text-amber-600 bg-amber-100',
        headline: `【偏高关注】该设备维修支出高于全院同类均值 +${deviationPercent}%，处于中度关注区间`,
        description: `在全院同类 ${count} 台设备中，本机维修支出排名第 ${currentRank} 位，较同类平均支出高出 ￥${Math.max(0, currentCost - avgCost).toLocaleString()}（+${deviationPercent}%）。虽然尚未达到极端异常红线，但已呈现成本加速上升趋势，建议加强季度预防性维护 (PM) 的频次与深度。`,
        actionPlan: '建议设备责任工程师对该设备的电气稳定性与管路磨损进行专项体检，排查操作规范度，防止单机成本进一步滑向异常报废区。'
      };
    }

    if (isNormal) {
      return {
        level: 'normal' as const,
        badgeText: '🟢 全院同类常模合理个体',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        cardBorder: 'border-emerald-200 bg-gradient-to-r from-emerald-50/60 via-slate-50/30 to-white',
        icon: CheckCircle2,
        iconClass: 'text-emerald-600 bg-emerald-100',
        headline: `【正常受控】该设备维保成本与全院同类常模基准高度吻合，处于合理受控区间`,
        description: `在全院同类 ${count} 台设备中，本设备维修支出排名第 ${currentRank} 位，与全院同类平均值（￥${avgCost.toLocaleString()}）偏差在合理常模控制限内（偏差仅 ${deviationPercent >= 0 ? `+${deviationPercent}` : `${deviationPercent}`}%）。设备故障率与零部件消耗处于健康生命周期轨道，无异常高耗特征。`,
        actionPlan: '继续保持常规周期性计量检定与预防性维护，按既定临床保障规程正常使用。'
      };
    }

    return {
      level: 'benchmark' as const,
      badgeText: '💎 优良低耗标杆个体',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
      cardBorder: 'border-blue-200 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white',
      icon: Award,
      iconClass: 'text-blue-600 bg-blue-100',
      headline: `【优良标杆】该设备维保支出显著优于全院同类均值 (-${Math.abs(deviationPercent)}%)，保养状态卓越`,
      description: `本设备累计维修支出仅 ￥${currentCost.toLocaleString()}，显著低于全院同类均值（节省 ￥${Math.abs(currentCost - avgCost).toLocaleString()}），在全院同类 ${count} 台设备中维修开支位列最优第 ${currentRank} 名。表明该科室操作规范严谨，日常维护得当，是全院低耗高效装备典范。`,
      actionPlan: '建议总结该科室的使用与日常维护规范经验，在全院同类设备管理科室中推广学习。'
    };
  }, [stats]);

  // 7. 测算成本阶梯区间分布 (4 个分布分箱)
  const distributionBrackets = useMemo(() => {
    const { avgCost, currentCost } = stats;
    const base = Math.max(2000, avgCost);

    const b1Ceil = Math.round(base * 0.6);   // 低耗区
    const b2Ceil = Math.round(base * 1.2);   // 常模均值区
    const b3Ceil = Math.round(base * 1.8);   // 偏高关注区

    const brackets = [
      {
        id: 'low',
        name: '低耗标杆区',
        rangeText: `< ￥${b1Ceil.toLocaleString()}`,
        description: '优良保养 / 低故障',
        min: 0,
        max: b1Ceil,
        color: '#10b981',
        devices: [] as PeerDeviceItem[]
      },
      {
        id: 'normal',
        name: '常模受控区',
        rangeText: `￥${b1Ceil.toLocaleString()} ~ ￥${b2Ceil.toLocaleString()}`,
        description: '均值标准受控范围',
        min: b1Ceil,
        max: b2Ceil,
        color: '#6366f1',
        devices: [] as PeerDeviceItem[]
      },
      {
        id: 'elevated',
        name: '偏高关注区',
        rangeText: `￥${b2Ceil.toLocaleString()} ~ ￥${b3Ceil.toLocaleString()}`,
        description: '成本偏离均值 +20%~80%',
        min: b2Ceil,
        max: b3Ceil,
        color: '#f59e0b',
        devices: [] as PeerDeviceItem[]
      },
      {
        id: 'anomaly',
        name: '高耗异常区',
        rangeText: `> ￥${b3Ceil.toLocaleString()}`,
        description: '高耗异常个体 · 需重点审计',
        min: b3Ceil,
        max: Infinity,
        color: '#ef4444',
        devices: [] as PeerDeviceItem[]
      }
    ];

    peerDeviceItems.forEach(item => {
      const c = item.totalRepairCost;
      if (c <= b1Ceil) {
        brackets[0].devices.push(item);
      } else if (c <= b2Ceil) {
        brackets[1].devices.push(item);
      } else if (c <= b3Ceil) {
        brackets[2].devices.push(item);
      } else {
        brackets[3].devices.push(item);
      }
    });

    return brackets.map(b => {
      const hasCurrent = b.devices.some(d => d.isCurrent);
      return {
        ...b,
        count: b.devices.length,
        hasCurrent
      };
    });
  }, [peerDeviceItems, stats]);

  // 8. 图表数据转换 (横向对标排行，按成本降序排序，当前设备给予专属标记)
  const rankingChartData = useMemo(() => {
    const sorted = [...peerDeviceItems].sort((a, b) => {
      if (metricType === 'amount') {
        return b.totalRepairCost - a.totalRepairCost;
      }
      return b.costToPriceRatio - a.costToPriceRatio;
    });

    return sorted.map((d, index) => {
      const shortName = d.name.length > 8 ? `${d.name.slice(0, 8)}..` : d.name;
      const displayName = d.isCurrent 
        ? `★本设备 #${d.id} (${d.department})` 
        : `#${d.id} (${d.department})`;

      return {
        id: d.id,
        rawName: d.name,
        displayName,
        shortDisplayName: d.isCurrent ? `★本设备(#${d.id})` : `#${d.id}`,
        rank: index + 1,
        totalRepairCost: d.totalRepairCost,
        costToPriceRatio: d.costToPriceRatio,
        purchasePrice: d.purchasePrice,
        department: d.department,
        model: d.model,
        isCurrent: d.isCurrent,
        deviationPercent: d.deviationPercentFromAvg
      };
    });
  }, [peerDeviceItems, metricType]);

  // 自定义图表 Tooltip
  const CustomRankingTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOverAvg = data.totalRepairCost > stats.avgCost;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs z-50 pointer-events-none min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span className="font-bold flex items-center gap-1">
              {data.isCurrent && <span className="text-amber-400">★[当前设备]</span>}
              <span>{data.rawName} (#{data.id})</span>
            </span>
            <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              第 {data.rank} 位 / 共 {stats.count} 台
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span>所在科室:</span>
              <span className="text-white font-sans">{data.department}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>采购价格:</span>
              <span className="text-slate-200">￥{data.purchasePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>累计维修总额:</span>
              <strong className={data.isCurrent ? 'text-amber-400 font-bold text-xs' : 'text-indigo-300 font-bold'}>
                ￥{data.totalRepairCost.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>维修原值比:</span>
              <span className="text-purple-300 font-bold">{data.costToPriceRatio}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800 text-[10px]">
              <span>较全院同类均值:</span>
              <span className={isOverAvg ? 'text-rose-400 font-bold' : 'text-emerald-400 font-medium'}>
                {data.deviationPercent >= 0 ? `+${data.deviationPercent}%` : `${data.deviationPercent}%`}
                {data.isCurrent && isOverAvg && ' (异常偏高)'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const IconComponent = anomalyDiagnosis.icon;

  return (
    <div
      id="peer-equipment-cost-comparison-module"
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4.5 transition"
    >
      
      {/* ===================== 1. 顶部标头与对标口径切换器 ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              全院同类设备维保成本对比与异常个体研判
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>全院同类在册 {stats.count} 台</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>对比基准：</span>
            <strong className="text-slate-700 font-medium">{activeCategoryLabel}</strong>
            {isAutoFallbackToCategory && (
              <span className="text-2xs text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                (细分同型样本不足2台，已自动拓展至同大类)
              </span>
            )}
          </p>
        </div>

        {/* 控制开关：细分品类 vs 专业大类，以及呈现模式 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 对标范围切换 */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-2xs">
            <button
              type="button"
              onClick={() => setScopeType('level1')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                scopeType === 'level1'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="优先按二级/细分设备类型在全院匹配"
            >
              细分品类
            </button>
            <button
              type="button"
              onClick={() => setScopeType('category')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                scopeType === 'category'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="按一级器械大类（如医用成像器械）全量对标"
            >
              一级大类
            </button>
          </div>

          {/* 视图模式切换 */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-2xs">
            <button
              type="button"
              onClick={() => setViewMode('ranking')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'ranking'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>单机排行柱状图</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('brackets')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'brackets'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>成本阶梯分布</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>同类明细表</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 2. ⭐ 核心诉求：直观判断是否属于高维护成本异常个体 (智能研判卡) ⭐ ===================== */}
      <div className={`p-4 rounded-xl border-2 shadow-2xs space-y-2.5 transition ${anomalyDiagnosis.cardBorder}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-2xs ${anomalyDiagnosis.iconClass}`}>
              <IconComponent className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${anomalyDiagnosis.badgeClass}`}>
                  {anomalyDiagnosis.badgeText}
                </span>
                <span className="text-2xs font-mono font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                  全院同类排名：第 {stats.currentRank} 位 / 共 {stats.count} 台
                </span>
                <span className="text-2xs font-mono font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                  较同类均值偏离：
                  <strong className={stats.deviationPercent >= 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {stats.deviationPercent >= 0 ? `+${stats.deviationPercent}%` : `${stats.deviationPercent}%`}
                  </strong>
                </span>
              </div>
              <h5 className="text-sm font-bold text-slate-900 mt-1">
                {anomalyDiagnosis.headline}
              </h5>
            </div>
          </div>

          {/* 偏离倍数与量化指示 */}
          <div className="bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/80 shrink-0 text-right self-start md:self-auto">
            <span className="text-2xs text-slate-500 block">偏离同类均值绝对额</span>
            <div className={`text-base font-bold font-mono ${stats.deviationAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.deviationAmount >= 0 ? `+￥${stats.deviationAmount.toLocaleString()}` : `-￥${Math.abs(stats.deviationAmount).toLocaleString()}`}
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              全院同类均值: ￥{stats.avgCost.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed bg-white/60 p-3 rounded-lg border border-slate-200/60">
          {anomalyDiagnosis.description}
        </p>

        <div className="flex items-center gap-1.5 text-2xs text-slate-600 pt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span><strong>质控行动建议：</strong>{anomalyDiagnosis.actionPlan}</span>
        </div>
      </div>

      {/* ===================== 3. 四维同类统计指标对标卡 ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* 指标 1：全院同类平均维修支出 */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-2xs text-slate-500 block">全院同类平均维修支出</span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1">
              ￥{stats.avgCost.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
            <span>当前设备:</span>
            <strong className={`font-mono ${stats.currentCost > stats.avgCost ? 'text-rose-600' : 'text-emerald-600'}`}>
              ￥{stats.currentCost.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* 指标 2：全院同类平均维修原值比 */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-2xs text-slate-500 block">全院同类平均维修原值比</span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1">
              {stats.avgRatio}%
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
            <span>当前设备:</span>
            <strong className={`font-mono ${stats.currentRatio > stats.avgRatio ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.currentRatio}%
            </strong>
          </div>
        </div>

        {/* 指标 3：同类支出中位数与极差 */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-2xs text-slate-500 block">同类中位数 / 极值范围</span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1">
              ￥{stats.medianCost.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between font-mono">
            <span>低: ￥{stats.minCost.toLocaleString()}</span>
            <span>高: ￥{stats.maxCost.toLocaleString()}</span>
          </div>
        </div>

        {/* 指标 4：高耗异常警戒线 (1.4x 均值) */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-2xs text-slate-500 block">高耗异常统计线 (1.4x 均值)</span>
            <div className="text-base font-bold font-mono text-rose-700 mt-1">
              ￥{stats.costThresholdHigh.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-2xs text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
            <span>判定状态:</span>
            <span className={`font-bold ${stats.currentCost >= stats.costThresholdHigh ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.currentCost >= stats.costThresholdHigh ? '⚠️ 突破异常线' : '✓ 处于安全线内'}
            </span>
          </div>
        </div>

      </div>

      {/* ===================== 4. 可视化图表区 (单机排行 vs 阶梯分布直方图) ===================== */}
      {viewMode === 'ranking' && (
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>全院同类设备单机维保支出横向对标排行</span>
              </h5>
              <p className="text-2xs text-slate-500 mt-0.5">
                红虚线为全院同类设备平均值线 (￥{stats.avgCost.toLocaleString()}) · 橙虚线为高耗异常警戒线 (￥{stats.costThresholdHigh.toLocaleString()})
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* 指标切换 */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-2xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMetricType('amount')}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    metricType === 'amount'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  维修支出金额 (元)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricType('ratio')}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    metricType === 'ratio'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  维修原值比 (%)
                </button>
              </div>
            </div>
          </div>

          {/* 柱状图容器 */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rankingChartData}
                margin={{ top: 18, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortDisplayName"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => {
                    if (metricType === 'ratio') return `${val}%`;
                    if (val >= 10000) return `￥${(val / 10000).toFixed(1)}w`;
                    if (val >= 1000) return `￥${(val / 1000).toFixed(0)}k`;
                    return `￥${val}`;
                  }}
                />
                <Tooltip content={<CustomRankingTooltip />} />

                {/* 全院同类平均值线 */}
                <ReferenceLine
                  y={metricType === 'amount' ? stats.avgCost : stats.avgRatio}
                  stroke="#e11d48"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  label={{
                    value: `同类均值 (${metricType === 'amount' ? `￥${stats.avgCost.toLocaleString()}` : `${stats.avgRatio}%`})`,
                    position: 'top',
                    fill: '#be123c',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />

                {/* 异常警戒线 */}
                {metricType === 'amount' && stats.costThresholdHigh > 0 && (
                  <ReferenceLine
                    y={stats.costThresholdHigh}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: `1.4x 异常预警线`,
                      position: 'insideTopRight',
                      fill: '#b45309',
                      fontSize: 10
                    }}
                  />
                )}

                <Bar
                  dataKey={metricType === 'amount' ? 'totalRepairCost' : 'costToPriceRatio'}
                  name={metricType === 'amount' ? '累计维修支出' : '维修原值比'}
                  radius={[4, 4, 0, 0]}
                  barSize={Math.max(14, Math.min(36, 450 / rankingChartData.length))}
                >
                  {rankingChartData.map((entry, idx) => {
                    // 当前设备专属高亮底色：若异常则大红，否则高对比靛蓝
                    if (entry.isCurrent) {
                      const color = entry.totalRepairCost >= stats.costThresholdHigh ? '#e11d48' : '#4f46e5';
                      return <Cell key={`cell-${idx}`} fill={color} stroke="#ffffff" strokeWidth={2} />;
                    }
                    // 其他设备：若超异常线淡红，否则中性灰蓝
                    const normalColor = entry.totalRepairCost >= stats.costThresholdHigh ? '#fda4af' : '#94a3b8';
                    return <Cell key={`cell-${idx}`} fill={normalColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-500 pt-1 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                <span className="font-bold text-slate-700">★ 本设备</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                <span>全院同类其他设备</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-rose-600 border-b border-dashed inline-block" />
                <span className="text-rose-700 font-medium">同类平均线</span>
              </span>
            </div>
            <span className="text-slate-400">
              提示：点击柱体可查看详细设备指标，支持切换金额与原值比口径
            </span>
          </div>
        </div>
      )}

      {/* ===================== 5. 模式 B：全院同类设备成本分布直方图 (4 个梯度区间) ===================== */}
      {viewMode === 'brackets' && (
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div>
            <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>全院同类设备维保成本阶梯区间分布 (直方图)</span>
            </h5>
            <p className="text-2xs text-slate-500 mt-0.5">
              展示全院同类 {stats.count} 台设备在 4 个标准化成本区间的台数分布，高亮定位当前设备所在分箱
            </p>
          </div>

          {/* 4 个区间的卡片呈现 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {distributionBrackets.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border-2 transition relative flex flex-col justify-between ${
                  b.hasCurrent
                    ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white/80 border-slate-200'
                }`}
              >
                {b.hasCurrent && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-2xs font-bold bg-indigo-600 text-white shadow-xs flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>本设备所在区间</span>
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{b.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                  </div>
                  <div className="text-2xs font-mono text-slate-500 mt-0.5">
                    {b.rangeText}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {b.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-2xs text-slate-500">设备数量:</span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-lg font-mono font-bold text-slate-900">{b.count}</strong>
                    <span className="text-2xs text-slate-400">台 ({((b.count / stats.count) * 100).toFixed(0)}%)</span>
                  </div>
                </div>

                {/* 该分箱中的设备清单预览 */}
                {b.devices.length > 0 && (
                  <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                    {b.devices.slice(0, 3).map(dev => (
                      <div key={dev.id} className="truncate flex items-center justify-between">
                        <span className={dev.isCurrent ? 'font-bold text-indigo-600' : ''}>
                          {dev.isCurrent ? '★' : '•'} #{dev.id} ({dev.department})
                        </span>
                        <span className="font-mono text-slate-400">￥{dev.totalRepairCost.toLocaleString()}</span>
                      </div>
                    ))}
                    {b.devices.length > 3 && (
                      <div className="text-slate-400 text-2xs">...等共 {b.devices.length} 台</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 6. 模式 C：同类在册设备全量明细对照表 ===================== */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-2">
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              全院同类设备清单明细表（共 {stats.count} 台）
            </span>
            <span className="text-2xs text-slate-500">
              按累计维修费用降序排列
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-2xs font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">排名</th>
                  <th className="py-2 px-3">设备编号 / 名称</th>
                  <th className="py-2 px-3">使用科室</th>
                  <th className="py-2 px-3">型号 / 役龄</th>
                  <th className="py-2 px-3 text-right">采购价格</th>
                  <th className="py-2 px-3 text-right">累计维修支出</th>
                  <th className="py-2 px-3 text-right">原值比</th>
                  <th className="py-2 px-3 text-right">较同类均值偏离</th>
                  <th className="py-2 px-3 text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                {rankingChartData.map((item, idx) => {
                  const isOver = item.totalRepairCost > stats.avgCost;
                  const isSevere = item.totalRepairCost >= stats.costThresholdHigh;
                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        item.isCurrent
                          ? 'bg-indigo-50/70 font-semibold'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-500">
                        {item.rank === 1 ? '🥇 1' : item.rank === 2 ? '🥈 2' : item.rank === 3 ? '🥉 3' : item.rank}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <div className="flex items-center gap-1">
                          {item.isCurrent && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white">
                              当前设备
                            </span>
                          )}
                          <span className={item.isCurrent ? 'text-indigo-900 font-bold' : 'text-slate-900'}>
                            {item.rawName}
                          </span>
                          <span className="text-slate-400 font-mono text-2xs">
                            (#{item.id})
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-700">
                        {item.department}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-500">
                        {item.model}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        ￥{item.purchasePrice.toLocaleString()}
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${
                        item.isCurrent 
                          ? 'text-indigo-700 text-xs' 
                          : isSevere 
                          ? 'text-rose-600' 
                          : 'text-slate-800'
                      }`}>
                        ￥{item.totalRepairCost.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-purple-700">
                        {item.costToPriceRatio}%
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${
                        isOver ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {item.deviationPercent >= 0 ? `+${item.deviationPercent}%` : `${item.deviationPercent}%`}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isSevere ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                            异常高耗
                          </span>
                        ) : isOver ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                            偏高
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

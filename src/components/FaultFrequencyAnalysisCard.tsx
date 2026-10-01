import React, { useState, useMemo } from 'react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  AlertTriangle, 
  PieChart as PieIcon, 
  TrendingUp, 
  ArrowRight, 
  Wrench, 
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Building2,
  SlidersHorizontal,
  GitCompare,
  ArrowLeftRight,
  Scale,
  CheckCircle2,
  BarChart2,
  Activity,
  Sparkles
} from 'lucide-react';
import { MedicalEquipment, ActiveTab } from '../types';
import { FaultComparativeAnalysisSection } from './FaultComparativeAnalysisSection';

export interface FaultFrequencyAnalysisCardProps {
  equipmentList: MedicalEquipment[];
  userDept?: string;
  isDeptView?: boolean;
  onNavigateToLedger?: (statusFilter?: string, departmentFilter?: string) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onSelectDeviceDetail?: (device: MedicalEquipment) => void;
  className?: string;
}

// 现代医疗仪表板配色方案（符合无纯色暴力对比、高区分度标准）
const CATEGORY_COLORS = [
  '#ef4444', // 呼吸/急救 (Rose Red)
  '#f59e0b', // 诊察/监护 (Amber Gold)
  '#3b82f6', // 影像/诊断 (Royal Blue)
  '#8b5cf6', // 手术/麻醉 (Purple Violet)
  '#10b981', // 检验/分析 (Emerald Green)
  '#06b6d4', // 物理/康复 (Cyan)
  '#64748b', // 消毒/通用 (Slate Grey)
  '#ec4899', // 妇产/专科 (Pink)
  '#14b8a6', // 青绿 (Teal)
  '#f97316', // 橙色 (Orange)
];

// 分析维度：设备品类分布 vs 科室故障率排行
export type AnalysisDimension = 'category' | 'department';
// 时间周期类型
type TimeRangeOption = '30d' | '90d' | '180d' | 'all';
// 图表展现模式
type ChartViewMode = 'pie' | 'line';

export const FaultFrequencyAnalysisCard: React.FC<FaultFrequencyAnalysisCardProps> = ({
  equipmentList = [],
  userDept,
  isDeptView = false,
  onNavigateToLedger,
  onNavigateToTab,
  onSelectDeviceDetail,
  className = ''
}) => {
  const safeEquipmentList = useMemo(() => Array.isArray(equipmentList) ? equipmentList : [], [equipmentList]);

  // 分析维度切换：品类分布 或 科室排行
  const [dimension, setDimension] = useState<AnalysisDimension>('category');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('90d');
  const [chartMode, setChartMode] = useState<ChartViewMode>('pie');
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  // 🌟 对比分析模式开关及参数
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareDimension, setCompareDimension] = useState<AnalysisDimension>('department');
  const [targetA, setTargetA] = useState<string>('');
  const [targetB, setTargetB] = useState<string>('');
  const [compareChartType, setCompareChartType] = useState<'bar' | 'trend'>('bar');

  // 基准计算时间 (2026-08-17)
  const referenceTime = useMemo(() => new Date('2026-08-17T00:00:00').getTime(), []);

  // 时间范围毫秒差
  const timeThresholdMs = useMemo(() => {
    switch (timeRange) {
      case '30d': return 30 * 24 * 3600 * 1000;
      case '90d': return 90 * 24 * 3600 * 1000;
      case '180d': return 180 * 24 * 3600 * 1000;
      case 'all': return Infinity;
    }
  }, [timeRange]);

  // 根据选定维度（品类 或 科室）归一化统计报修频次与故障率
  const analysisData = useMemo(() => {
    if (dimension === 'category') {
      // ========== 维度 1：各设备品类故障率分布 ==========
      const categoryMap: Record<string, {
        rawCategory: string;
        displayName: string;
        totalDevices: number;
        devices: MedicalEquipment[];
        repairCount: number;
        faultyCount: number;
        repairCosts: number;
        faultReasons: Record<string, number>;
      }> = {};

      safeEquipmentList.forEach((eq) => {
        let catName = eq.category || '通用诊疗器械';
        let shortName = catName;
        if (catName.includes('呼吸') || catName.includes('急救')) shortName = '急救呼吸类';
        else if (catName.includes('监护') || catName.includes('诊察')) shortName = '诊察监护类';
        else if (catName.includes('成像') || catName.includes('放射') || catName.includes('超声')) shortName = '医学影像类';
        else if (catName.includes('检验') || catName.includes('分析')) shortName = '临床检验类';
        else if (catName.includes('手术') || catName.includes('麻醉')) shortName = '手术麻醉类';
        else if (catName.includes('康复') || catName.includes('理疗')) shortName = '康复理疗类';
        else if (catName.includes('消毒') || catName.includes('灭菌')) shortName = '消毒灭菌类';

        if (!categoryMap[shortName]) {
          categoryMap[shortName] = {
            rawCategory: catName,
            displayName: shortName,
            totalDevices: 0,
            devices: [],
            repairCount: 0,
            faultyCount: 0,
            repairCosts: 0,
            faultReasons: {}
          };
        }

        const item = categoryMap[shortName];
        item.totalDevices += 1;
        item.devices.push(eq);
        if (eq.status === '故障待修') {
          item.faultyCount += 1;
        }

        const records = eq.repairRecords || [];
        if (records.length > 0) {
          records.forEach((r) => {
            let withinTime = true;
            if (timeThresholdMs !== Infinity && r.faultDate) {
              const faultTime = new Date(r.faultDate).getTime();
              if (!isNaN(faultTime) && (referenceTime - faultTime > timeThresholdMs)) {
                withinTime = false;
              }
            }
            if (withinTime) {
              item.repairCount += 1;
              item.repairCosts += (r.cost || 0);
              const desc = String(r.faultDescription || eq.lastFaultReason || '常规报修');
              const keyword = desc.slice(0, 10);
              item.faultReasons[keyword] = (item.faultReasons[keyword] || 0) + 1;
            }
          });
        } else {
          const cnt = eq.repairCount || 0;
          if (cnt > 0) {
            item.repairCount += cnt;
          }
        }
      });

      const list = Object.values(categoryMap);
      const totalRepairsAll = list.reduce((sum, c) => sum + c.repairCount, 0);

      const formattedList = list.map((cat, idx) => {
        const repairRate = cat.totalDevices > 0 
          ? Math.round((cat.repairCount / cat.totalDevices) * 100) 
          : 0;

        const sharePercentage = totalRepairsAll > 0 
          ? Number(((cat.repairCount / totalRepairsAll) * 100).toFixed(1)) 
          : 0;

        const sortedDevices = [...cat.devices].sort((a, b) => {
          const aCount = (a.repairRecords || []).length || a.repairCount || (a.status === '故障待修' ? 1 : 0);
          const bCount = (b.repairRecords || []).length || b.repairCount || (b.status === '故障待修' ? 1 : 0);
          return bCount - aCount;
        });

        return {
          id: cat.displayName,
          name: cat.displayName,
          rawCategory: cat.rawCategory,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          totalDevices: cat.totalDevices,
          repairCount: cat.repairCount,
          faultyCount: cat.faultyCount,
          repairRate,
          sharePercentage,
          topDevices: sortedDevices.slice(0, 3),
          primaryFaultReason: Object.keys(cat.faultReasons)[0] || '系统告警或传感器老化'
        };
      });

      formattedList.sort((a, b) => b.repairCount - a.repairCount);

      return {
        dimension: 'category' as const,
        dimensionLabel: '各设备品类故障率分布',
        groupData: formattedList,
        totalRepairsAll,
        totalDevicesAll: safeEquipmentList.length,
        averageRepairRate: safeEquipmentList.length > 0 
          ? Math.round((totalRepairsAll / safeEquipmentList.length) * 100) 
          : 0,
        topItemName: formattedList[0]?.name || '暂无数据'
      };
    } else {
      // ========== 维度 2：各科室故障率排行 ==========
      const deptMap: Record<string, {
        displayName: string;
        totalDevices: number;
        devices: MedicalEquipment[];
        repairCount: number;
        faultyCount: number;
        repairCosts: number;
        faultReasons: Record<string, number>;
      }> = {};

      safeEquipmentList.forEach((eq) => {
        const deptName = eq.department || '未分配科室';
        // 简短化科室名称以便图表显示清晰
        let shortDept = deptName;
        if (deptName.includes('重症医学科')) shortDept = 'ICU';
        else if (deptName.includes('医学影像科')) shortDept = '影像科';
        else if (deptName.includes('急诊科')) shortDept = '急诊科';
        else if (deptName.includes('心血管内科')) shortDept = '心内科';
        else if (deptName.includes('检验科')) shortDept = '检验科';
        else if (deptName.includes('麻醉手术科') || deptName.includes('手术室')) shortDept = '麻醉手术科';
        else if (deptName.includes('超声诊断科')) shortDept = '超声科';
        else if (deptName.includes('呼吸与危重症')) shortDept = '呼吸内科';

        if (!deptMap[shortDept]) {
          deptMap[shortDept] = {
            displayName: shortDept,
            totalDevices: 0,
            devices: [],
            repairCount: 0,
            faultyCount: 0,
            repairCosts: 0,
            faultReasons: {}
          };
        }

        const item = deptMap[shortDept];
        item.totalDevices += 1;
        item.devices.push(eq);
        if (eq.status === '故障待修') {
          item.faultyCount += 1;
        }

        const records = eq.repairRecords || [];
        if (records.length > 0) {
          records.forEach((r) => {
            let withinTime = true;
            if (timeThresholdMs !== Infinity && r.faultDate) {
              const faultTime = new Date(r.faultDate).getTime();
              if (!isNaN(faultTime) && (referenceTime - faultTime > timeThresholdMs)) {
                withinTime = false;
              }
            }
            if (withinTime) {
              item.repairCount += 1;
              item.repairCosts += (r.cost || 0);
              const desc = String(r.faultDescription || eq.lastFaultReason || '日常报修');
              const keyword = desc.slice(0, 10);
              item.faultReasons[keyword] = (item.faultReasons[keyword] || 0) + 1;
            }
          });
        } else {
          const cnt = eq.repairCount || 0;
          if (cnt > 0) {
            item.repairCount += cnt;
          }
        }
      });

      const list = Object.values(deptMap);
      const totalRepairsAll = list.reduce((sum, c) => sum + c.repairCount, 0);

      const formattedList = list.map((dept, idx) => {
        const repairRate = dept.totalDevices > 0 
          ? Math.round((dept.repairCount / dept.totalDevices) * 100) 
          : 0;

        const sharePercentage = totalRepairsAll > 0 
          ? Number(((dept.repairCount / totalRepairsAll) * 100).toFixed(1)) 
          : 0;

        const sortedDevices = [...dept.devices].sort((a, b) => {
          const aCount = (a.repairRecords || []).length || a.repairCount || (a.status === '故障待修' ? 1 : 0);
          const bCount = (b.repairRecords || []).length || b.repairCount || (b.status === '故障待修' ? 1 : 0);
          return bCount - aCount;
        });

        return {
          id: dept.displayName,
          name: dept.displayName,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          totalDevices: dept.totalDevices,
          repairCount: dept.repairCount,
          faultyCount: dept.faultyCount,
          repairRate,
          sharePercentage,
          topDevices: sortedDevices.slice(0, 3),
          primaryFaultReason: Object.keys(dept.faultReasons)[0] || '科室高负荷使用'
        };
      });

      // 排行：按故障报修率从高到低排序，次序结合报修次数
      formattedList.sort((a, b) => {
        if (b.repairRate !== a.repairRate) return b.repairRate - a.repairRate;
        return b.repairCount - a.repairCount;
      });

      return {
        dimension: 'department' as const,
        dimensionLabel: '各科室故障率排行',
        groupData: formattedList,
        totalRepairsAll,
        totalDevicesAll: safeEquipmentList.length,
        averageRepairRate: safeEquipmentList.length > 0 
          ? Math.round((totalRepairsAll / safeEquipmentList.length) * 100) 
          : 0,
        topItemName: formattedList[0]?.name || '暂无数据'
      };
    }
  }, [dimension, safeEquipmentList, timeThresholdMs, referenceTime]);

  // 全院/科室易故障前置高发设备清单 (Top 4 overall，若选中某品类或科室则优先展示该范围内)
  const topFaultyEquipment = useMemo(() => {
    let baseList = [...safeEquipmentList];
    if (selectedItemName) {
      const searchStr = String(selectedItemName || '');
      if (dimension === 'category') {
        baseList = baseList.filter((eq) => {
          const cat = String(eq.category || '');
          return cat.includes(searchStr) || searchStr.includes(cat);
        });
      } else {
        baseList = baseList.filter((eq) => {
          const dept = String(eq.department || '');
          return dept.includes(searchStr) || searchStr.includes(dept);
        });
      }
    }

    const list = baseList.map((eq) => {
      const recs = eq.repairRecords || [];
      const recentRecs = recs.filter((r) => {
        if (timeThresholdMs === Infinity || !r.faultDate) return true;
        const ft = new Date(r.faultDate).getTime();
        return !isNaN(ft) && (referenceTime - ft <= timeThresholdMs);
      });
      const repairsInPeriod = recentRecs.length || eq.repairCount || (eq.status === '故障待修' ? 1 : 0);
      return {
        device: eq,
        repairsInPeriod,
        lastFault: recentRecs[0]?.faultDescription || eq.lastFaultReason || '开机自检异常'
      };
    });

    return list
      .filter(item => item.repairsInPeriod > 0 || item.device.status === '故障待修')
      .sort((a, b) => b.repairsInPeriod - a.repairsInPeriod)
      .slice(0, 4);
  }, [safeEquipmentList, selectedItemName, dimension, timeThresholdMs, referenceTime]);

  // 获取所有可选科室名称列表（按在册设备数量降序）
  const departmentOptions = useMemo(() => {
    const map: Record<string, number> = {};
    safeEquipmentList.forEach((eq) => {
      const deptName = eq.department || '未分配科室';
      let shortDept = deptName;
      if (deptName.includes('重症医学科')) shortDept = 'ICU';
      else if (deptName.includes('医学影像科')) shortDept = '影像科';
      else if (deptName.includes('急诊科')) shortDept = '急诊科';
      else if (deptName.includes('心血管内科')) shortDept = '心内科';
      else if (deptName.includes('检验科')) shortDept = '检验科';
      else if (deptName.includes('麻醉手术科') || deptName.includes('手术室')) shortDept = '麻醉手术科';
      else if (deptName.includes('超声诊断科')) shortDept = '超声科';
      else if (deptName.includes('呼吸与危重症')) shortDept = '呼吸内科';
      map[shortDept] = (map[shortDept] || 0) + 1;
    });
    return Object.keys(map).sort((a, b) => map[b] - map[a]);
  }, [safeEquipmentList]);

  // 获取所有可选设备品类列表
  const categoryOptions = useMemo(() => [
    '急救呼吸类',
    '诊察监护类',
    '医学影像类',
    '临床检验类',
    '手术麻醉类',
    '康复理疗类',
    '消毒灭菌类'
  ], []);

  // 标的 A 当前生效值
  const activeTargetA = useMemo(() => {
    if (compareDimension === 'department') {
      if (targetA && departmentOptions.includes(targetA)) return targetA;
      return departmentOptions[0] || 'ICU';
    } else {
      if (targetA && categoryOptions.includes(targetA)) return targetA;
      return categoryOptions[0] || '急救呼吸类';
    }
  }, [compareDimension, targetA, departmentOptions, categoryOptions]);

  // 标的 B 当前生效值（确保与 A 互不相同）
  const activeTargetB = useMemo(() => {
    if (compareDimension === 'department') {
      if (targetB && departmentOptions.includes(targetB) && targetB !== activeTargetA) return targetB;
      const other = departmentOptions.find(d => d !== activeTargetA);
      return other || departmentOptions[1] || '急诊科';
    } else {
      if (targetB && categoryOptions.includes(targetB) && targetB !== activeTargetA) return targetB;
      const other = categoryOptions.find(c => c !== activeTargetA);
      return other || categoryOptions[1] || '诊察监护类';
    }
  }, [compareDimension, targetB, activeTargetA, departmentOptions, categoryOptions]);

  // 标的计算器：抽取任意科室或品类的故障发生率与维保画像
  const computeTargetStats = useMemo(() => {
    return (name: string, dim: AnalysisDimension) => {
      const matched = safeEquipmentList.filter((eq) => {
        if (dim === 'department') {
          const dept = eq.department || '';
          let shortDept = dept;
          if (dept.includes('重症医学科')) shortDept = 'ICU';
          else if (dept.includes('医学影像科')) shortDept = '影像科';
          else if (dept.includes('急诊科')) shortDept = '急诊科';
          else if (dept.includes('心血管内科')) shortDept = '心内科';
          else if (dept.includes('检验科')) shortDept = '检验科';
          else if (dept.includes('麻醉手术科') || dept.includes('手术室')) shortDept = '麻醉手术科';
          else if (dept.includes('超声诊断科')) shortDept = '超声科';
          else if (dept.includes('呼吸与危重症')) shortDept = '呼吸内科';
          return shortDept === name || dept.includes(name) || name.includes(dept);
        } else {
          let cat = eq.category || '';
          if (name === '急救呼吸类') return cat.includes('呼吸') || cat.includes('急救');
          if (name === '诊察监护类') return cat.includes('监护') || cat.includes('诊察');
          if (name === '医学影像类') return cat.includes('成像') || cat.includes('放射') || cat.includes('超声');
          if (name === '临床检验类') return cat.includes('检验') || cat.includes('分析');
          if (name === '手术麻醉类') return cat.includes('手术') || cat.includes('麻醉');
          if (name === '康复理疗类') return cat.includes('康复') || cat.includes('理疗');
          if (name === '消毒灭菌类') return cat.includes('消毒') || cat.includes('灭菌');
          return cat.includes(name);
        }
      });

      const total = matched.length;
      const faulty = matched.filter(e => e.status === '故障待修').length;
      let repairCount = 0;
      let totalCost = 0;
      let p30 = 0, p60 = 0, p90 = 0, pAll = 0;
      const faultReasonMap: Record<string, number> = {};

      matched.forEach((eq) => {
        const records = eq.repairRecords || [];
        if (records.length > 0) {
          records.forEach((r) => {
            let withinPeriod = true;
            let diff = 0;
            if (r.faultDate) {
              const ft = new Date(r.faultDate).getTime();
              if (!isNaN(ft)) {
                diff = referenceTime - ft;
                if (timeThresholdMs !== Infinity && diff > timeThresholdMs) {
                  withinPeriod = false;
                }
              }
            }
            if (withinPeriod) {
              repairCount += 1;
              totalCost += (r.cost || 0);
              const desc = String(r.faultDescription || eq.lastFaultReason || '常规告警');
              const k = desc.slice(0, 8);
              faultReasonMap[k] = (faultReasonMap[k] || 0) + 1;
            }

            if (diff <= 30 * 86400000) p30++;
            if (diff <= 60 * 86400000) p60++;
            if (diff <= 90 * 86400000) p90++;
            pAll++;
          });
        } else {
          const c = eq.repairCount || (eq.status === '故障待修' ? 1 : 0);
          if (c > 0) {
            repairCount += c;
            pAll += c;
          }
        }
      });

      const repairRate = total > 0 ? Math.round((repairCount / total) * 100) : 0;
      const healthRate = total > 0 ? Math.round(((total - faulty) / total) * 100) : 100;
      const faultyRate = total > 0 ? Number(((faulty / total) * 100).toFixed(1)) : 0;
      const loadIndex = total > 0 ? Number(((repairCount / total) * 10).toFixed(1)) : 0;
      const avgCost = total > 0 ? Math.round(totalCost / total) : 0;
      const topReason = Object.keys(faultReasonMap).sort((a,b) => faultReasonMap[b] - faultReasonMap[a])[0] || '偶发性传感器漂移';

      return {
        name,
        total,
        faulty,
        repairCount,
        totalCost,
        repairRate,
        healthRate,
        faultyRate,
        loadIndex,
        avgCost,
        topReason,
        trend: {
          p30Rate: total > 0 ? Math.round((p30 / total) * 100) : 0,
          p60Rate: total > 0 ? Math.round((p60 / total) * 100) : 0,
          p90Rate: total > 0 ? Math.round((p90 / total) * 100) : 0,
          pAllRate: total > 0 ? Math.round((pAll / total) * 100) : 0,
        }
      };
    };
  }, [safeEquipmentList, referenceTime, timeThresholdMs]);

  const statsA = useMemo(() => computeTargetStats(activeTargetA, compareDimension), [computeTargetStats, activeTargetA, compareDimension]);
  const statsB = useMemo(() => computeTargetStats(activeTargetB, compareDimension), [computeTargetStats, activeTargetB, compareDimension]);

  // 对比柱状图数据集（在同一个图表中对比标的A与标的B的各项管理效能指标）
  const compareBarData = useMemo(() => {
    return [
      {
        metric: '故障发生率',
        targetA: statsA?.repairRate ?? 0,
        targetB: statsB?.repairRate ?? 0,
        unit: '%'
      },
      {
        metric: '设备完好率',
        targetA: statsA?.healthRate ?? 100,
        targetB: statsB?.healthRate ?? 100,
        unit: '%'
      },
      {
        metric: '待修停机率',
        targetA: statsA?.faultyRate ?? 0,
        targetB: statsB?.faultyRate ?? 0,
        unit: '%'
      },
      {
        metric: '报修负荷指数',
        targetA: statsA?.loadIndex ?? 0,
        targetB: statsB?.loadIndex ?? 0,
        unit: '次/10台'
      }
    ];
  }, [statsA, statsB]);

  // 对比折线走势图数据集（在同一个图表中对比周期性发生率走势）
  const compareTrendData = useMemo(() => {
    return [
      { period: '近30天', targetA: statsA?.trend?.p30Rate ?? 0, targetB: statsB?.trend?.p30Rate ?? 0 },
      { period: '近60天', targetA: statsA?.trend?.p60Rate ?? 0, targetB: statsB?.trend?.p60Rate ?? 0 },
      { period: '近90天', targetA: statsA?.trend?.p90Rate ?? 0, targetB: statsB?.trend?.p90Rate ?? 0 },
      { period: '历史累计', targetA: statsA?.trend?.pAllRate ?? 0, targetB: statsB?.trend?.pAllRate ?? 0 }
    ];
  }, [statsA, statsB]);

  // 横向管理效率评估诊断结论
  const efficiencyEvaluation = useMemo(() => {
    const rateA = statsA?.repairRate ?? 0;
    const rateB = statsB?.repairRate ?? 0;
    const nameA = statsA?.name || '标的A';
    const nameB = statsB?.name || '标的B';
    const rateDiff = rateA - rateB;
    const absDiff = Math.abs(rateDiff);
    let leader = rateDiff < 0 ? nameA : nameB;
    let follower = rateDiff < 0 ? nameB : nameA;
    let statusTone: 'positive' | 'neutral' | 'alert' = 'neutral';
    let summary = '';
    let recommendation = '';

    if (absDiff <= 2) {
      statusTone = 'positive';
      summary = `【${nameA}】与【${nameB}】综合故障发生率基本持平（${rateA}% vs ${rateB}%），二者设备完好率均稳定在较高水平，管理效能相当。`;
      recommendation = `两部门/类别设备运行稳定，可继续保持现有巡检维保频次与操作规程，重点关注易损传感器定期校准。`;
    } else if (absDiff <= 8) {
      statusTone = 'neutral';
      summary = `【${follower}】故障发生率较【${leader}】高出 ${absDiff}%（${rateDiff > 0 ? `${nameA} ${rateA}% vs ${nameB} ${rateB}%` : `${nameB} ${rateB}% vs ${nameA} ${rateA}%`}），处于中度负荷运行状态。`;
      recommendation = `【${follower}】近期高发故障诱因集中在“${rateDiff > 0 ? (statsA?.topReason || '偶发性故障') : (statsB?.topReason || '偶发性故障')}”，建议适当增加预防性保养与巡视频次，避免设备带病运转。`;
    } else {
      statusTone = 'alert';
      summary = `【${follower}】故障发生率显著高出【${leader}】达 ${absDiff}%，存在明显的设备健康度分化与管理效能差距。`;
      recommendation = `【${follower}】单台维保成本与故障率明显偏高，建议设备科组织专项工程技术巡检，评估是否存在超负荷周转、操作规范短板或关键备件老化。`;
    }

    return {
      rateDiff,
      absDiff,
      leader,
      follower,
      statusTone,
      summary,
      recommendation
    };
  }, [statsA, statsB]);

  // 自定义对比图 Tooltip
  const CustomCompareTooltip = (props: any) => {
    const { active, payload, label } = props || {};
    if (active && Array.isArray(payload) && payload.length > 0) {
      return (
        <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-lg border border-slate-700 text-xs z-50 pointer-events-none min-w-[170px]">
          <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-indigo-300 font-normal">对比分析</span>
          </div>
          {payload.map((item: any, idx: number) => (
            <div key={item?.name || `compare-tip-${idx}`} className="flex items-center justify-between gap-3 text-[11px] font-mono py-0.5">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item?.color || '#3b82f6' }} />
                <span className="text-slate-300 truncate">{item?.name}:</span>
              </div>
              <span className="font-bold text-white shrink-0">
                {item?.value} {item?.unit || '%'}
              </span>
            </div>
          ))}
          {payload.length >= 2 && payload[0] && payload[1] && (
            <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between font-mono">
              <span>差值 (A-B):</span>
              <span className={Number(payload[0].value) - Number(payload[1].value) > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {(Number(payload[0].value) - Number(payload[1].value)).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 自定义饼图 Tooltip
  const CustomPieTooltip = (props: any) => {
    const { active, payload } = props || {};
    if (active && Array.isArray(payload) && payload.length > 0 && payload[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-lg border border-slate-700 text-xs z-50 pointer-events-none min-w-[150px]">
          <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-slate-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color || '#3b82f6' }} />
            <span>{data.name}</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>故障报修:</span>
              <strong className="text-rose-400">{data.repairCount ?? 0} 次</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>报修占比:</span>
              <strong className="text-white">{data.sharePercentage ?? 0}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{dimension === 'category' ? '品类故障率:' : '科室故障率:'}</span>
              <strong className="text-amber-300">{data.repairRate ?? 0}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>在册设备:</span>
              <span className="text-slate-400">{data.totalDevices ?? 0} 台</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // 自定义折线图 Tooltip
  const CustomLineTooltip = (props: any) => {
    const { active, payload, label } = props || {};
    if (active && Array.isArray(payload) && payload.length > 0) {
      return (
        <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-lg border border-slate-700 text-xs z-50 pointer-events-none">
          <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200">
            {label}
          </div>
          {payload.map((item: any, idx: number) => (
            <div key={item?.name || `line-tip-${idx}`} className="flex items-center justify-between gap-3 text-[11px] font-mono py-0.5">
              <span style={{ color: item?.color || '#ef4444' }}>{item?.name}:</span>
              <span className="font-bold text-white">
                {item?.value} {item?.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="fault-frequency-analysis-card" className={`bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 flex flex-col overflow-hidden ${className}`}>
      {/* 顶部标题行与控制按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 shadow-2xs border ${
            isCompareMode 
              ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
              : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            {isCompareMode ? <Scale className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                {isCompareMode 
                  ? '设备故障率横向对比分析' 
                  : (isDeptView && userDept ? `【${userDept}】故障频率与易损分布` : '设备故障频率统计')}
              </h3>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                isCompareMode 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isCompareMode ? '对比分析模式' : (dimension === 'category' ? '品类分析' : '科室排行')}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
              {isCompareMode 
                ? `横向对比不同${compareDimension === 'department' ? '临床科室' : '设备品类'}的故障发生率与维保质控效能`
                : (dimension === 'category' 
                    ? '根据设备品类分析近期报修率与易故障分布' 
                    : '按临床科室对比故障发生率与报修负荷排行')}
            </p>
          </div>
        </div>

        {/* 维度切换下拉选择器 + 时间周期 + 图表切换 + 对比分析入口 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isCompareMode && (
            <>
              {/* 🌟 核心需求：维度切换下拉选择器 */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-lg px-2 py-1 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-medium shrink-0 flex items-center gap-0.5">
                  {dimension === 'category' ? <Layers className="w-3 h-3 text-indigo-500" /> : <Building2 className="w-3 h-3 text-emerald-600" />}
                  <span className="hidden sm:inline">统计维度:</span>
                </span>
                <select
                  id="fault-stats-dimension-select"
                  value={dimension}
                  onChange={(e) => {
                    setDimension(e.target.value as AnalysisDimension);
                    setSelectedItemName(null);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 border-none outline-none cursor-pointer pr-1 focus:ring-0"
                  title="切换统计分析维度"
                >
                  <option value="category">各设备品类故障率分布</option>
                  <option value="department">各科室故障率排行</option>
                </select>
              </div>

              {/* 时间周期筛选器 */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setTimeRange('30d')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeRange === '30d' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'hover:text-slate-900'}`}
                  title="近30天"
                >
                  30天
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('90d')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeRange === '90d' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'hover:text-slate-900'}`}
                  title="近90天"
                >
                  90天
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('180d')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeRange === '180d' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'hover:text-slate-900'}`}
                  title="近半年"
                >
                  半年
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('all')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${timeRange === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'hover:text-slate-900'}`}
                  title="历史累计"
                >
                  全部
                </button>
              </div>

              {/* 饼图 / 折线图 模式切换开关 */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setChartMode('pie')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${chartMode === 'pie' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:text-slate-900'}`}
                  title="饼状占比图"
                >
                  <PieIcon className="w-3 h-3" />
                  <span>分布</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('line')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${chartMode === 'line' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:text-slate-900'}`}
                  title="趋势折线图"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>故障率</span>
                </button>
              </div>
            </>
          )}

          {/* 🌟 核心需求：『对比分析』按钮 */}
          <button
            type="button"
            id="toggle-fault-stats-compare-btn"
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              if (!isCompareMode) {
                setCompareDimension(dimension);
              }
            }}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer text-xs font-bold border ${
              isCompareMode 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-2xs' 
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
            }`}
            title="选取两个不同的科室或设备类别，在同一图表中横向对比故障发生率"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{isCompareMode ? '退出对比' : '对比分析'}</span>
          </button>
        </div>
      </div>

      {isCompareMode ? (
        <FaultComparativeAnalysisSection
          activeTargetA={activeTargetA}
          activeTargetB={activeTargetB}
          setTargetA={setTargetA}
          setTargetB={setTargetB}
          compareDimension={compareDimension}
          setCompareDimension={setCompareDimension}
          departmentOptions={departmentOptions}
          categoryOptions={categoryOptions}
          statsA={statsA}
          statsB={statsB}
          compareChartType={compareChartType}
          setCompareChartType={setCompareChartType}
          compareBarData={compareBarData}
          compareTrendData={compareTrendData}
          efficiencyEvaluation={efficiencyEvaluation}
          onExitCompare={() => setIsCompareMode(false)}
        />
      ) : (
        <>
          {/* 核心统计指标条 */}
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 bg-slate-50/50 rounded-lg px-2 mt-1.5 shrink-0">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium">统计报修总量</div>
          <div className="text-sm font-bold font-mono text-rose-600 mt-0.5">
            {analysisData.totalRepairsAll} <span className="text-[10px] text-slate-400 font-normal">次</span>
          </div>
        </div>
        <div className="text-center border-x border-slate-200/80">
          <div className="text-[10px] text-slate-500 font-medium">综合故障率</div>
          <div className="text-sm font-bold font-mono text-amber-600 mt-0.5">
            {analysisData.averageRepairRate}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium">
            {dimension === 'category' ? '高发故障品类' : '故障率居首科室'}
          </div>
          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={analysisData.topItemName}>
            {analysisData.topItemName}
          </div>
        </div>
      </div>

      {/* 图表展示区：饼图或折线图 */}
      <div className="flex-1 min-h-[170px] max-h-[220px] flex items-center justify-center pt-2 relative">
        {analysisData.groupData.length === 0 || analysisData.totalRepairsAll === 0 ? (
          <div className="text-center text-slate-400 text-xs py-6">
            <AlertTriangle className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p>选定时间段内暂无故障报修记录</p>
          </div>
        ) : chartMode === 'pie' ? (
          /* ================= 饼图/环形图 (Pie/Donut Chart) ================= */
          <div className="w-full h-full flex items-center">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={analysisData.groupData}
                    dataKey="repairCount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={65}
                    paddingAngle={3}
                    cursor="pointer"
                    onClick={(entry) => setSelectedItemName(selectedItemName === entry.name ? null : entry.name)}
                  >
                    {analysisData.groupData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke={selectedItemName === entry.name ? '#0f172a' : '#ffffff'}
                        strokeWidth={selectedItemName === entry.name ? 2 : 1}
                      />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
              {/* 环心微标 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-slate-400 font-medium">总报修</span>
                <span className="text-xs font-bold font-mono text-slate-800">{analysisData.totalRepairsAll}</span>
              </div>
            </div>

            {/* 右半侧：分组占比图例列表 */}
            <div className="w-1/2 h-full pl-2 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
              {analysisData.groupData.map((item, idx) => {
                const isSelected = selectedItemName === item.name;
                return (
                  <div
                    key={item.id || item.name}
                    onClick={() => setSelectedItemName(isSelected ? null : item.name)}
                    className={`py-1 flex items-center justify-between cursor-pointer rounded px-1 transition ${
                      isSelected ? 'bg-indigo-50 font-bold text-indigo-950' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {dimension === 'department' && (
                        <span className="text-[9px] font-mono font-bold text-slate-400 w-3 shrink-0">
                          {idx + 1}.
                        </span>
                      )}
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-[11px]" title={item.name}>{item.name}</span>
                    </div>
                    <div className="text-right font-mono shrink-0 ml-1">
                      <span className="text-[11px] font-bold text-slate-800">{item.repairRate}%</span>
                      <span className="text-[10px] text-slate-400 ml-1">({item.repairCount}次)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= 折线图 (Line Chart for Trends & Rates) ================= */
          <div className="w-full h-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={analysisData.groupData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                  iconSize={8}
                />
                <Line
                  type="monotone"
                  dataKey="repairRate"
                  name={dimension === 'category' ? '品类故障率' : '科室故障率'}
                  unit="%"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ef4444' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="repairCount"
                  name="报修次数"
                  unit="次"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2.5, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 下方：易故障设备分布预警清单 (Top Faulty Equipment Distribution) */}
      <div className="mt-2 pt-2 border-t border-slate-100 shrink-0">
        <div className="flex items-center justify-between pb-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs font-bold text-slate-800">
              {selectedItemName ? `【${selectedItemName}】易损设备分布` : '易故障高发设备清单'}
            </span>
            {selectedItemName && (
              <button
                type="button"
                onClick={() => setSelectedItemName(null)}
                className="text-[9px] text-slate-400 hover:text-slate-600 underline cursor-pointer ml-1"
              >
                (清除过滤)
              </button>
            )}
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('repairs')}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>查看全部报修</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {topFaultyEquipment.length === 0 ? (
            <div className="col-span-2 text-center text-[11px] text-slate-400 py-1.5">
              暂无多发故障设备，设备运行平稳
            </div>
          ) : (
            topFaultyEquipment.map(({ device, repairsInPeriod, lastFault }) => (
              <div 
                key={device.id}
                onClick={() => onSelectDeviceDetail?.(device)}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-200 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                title={`点击查看【${device.name}】技术档案`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 text-[11px] truncate group-hover:text-rose-600">
                      {device.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                      {device.model}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    <span className="text-slate-700 font-medium">{device.department}</span>
                    <span className="mx-1">·</span>
                    <span className="text-rose-600 font-mono font-semibold">报修 {repairsInPeriod}次</span>
                    <span className="text-slate-400 ml-1 truncate">({String(lastFault || '常规报修').slice(0, 8)})</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    device.status === '故障待修' 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {device.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

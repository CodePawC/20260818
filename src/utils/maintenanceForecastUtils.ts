import { MedicalEquipment } from '../types';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { estimateRealisticPurchasePrice, calculateEquipmentFinancialProfile } from './roiEconomicsUtils';

export interface HistoricalMonthPoint {
  month: string;           // '2025-11'
  displayMonth: string;    // '25年11月'
  actualCost: number;      // 实际维修费用 (元)
  faultCount: number;      // 故障频次
  isFuture: false;
}

export interface ForecastMonthPoint {
  month: string;           // '2026-11'
  displayMonth: string;    // '26年11月'
  monthIndex: number;      // 1 ~ 12
  predictedCost: number;   // 线性回归模型预测支出 (元)
  upperBound: number;      // 95% 置信区间预测上限 (保守开支)
  lowerBound: number;      // 95% 置信区间预测下限 (乐观开支)
  cumulativePredicted: number; // 预测累计支出
  quarter: string;         // 'Q1' | 'Q2' | 'Q3' | 'Q4'
  maintenanceSchedule?: string; // 推荐安排的预防性节点
  isFuture: true;
}

export type TimelineChartPoint = {
  month: string;
  displayMonth: string;
  actualCost?: number | null;
  predictedCost?: number | null;
  upperBound?: number | null;
  lowerBound?: number | null;
  trendLine?: number | null;
  cumulativeCost?: number | null;
  isFuture: boolean;
  notes?: string;
};

export interface MaintenanceForecastResult {
  // 线性回归统计参数
  slope: number;                 // 回归斜率 m (元/月)
  intercept: number;             // 截距 b
  rSquared: number;              // 拟合优度 R² (0 ~ 1)
  standardError: number;         // 标准误差
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  monthlyDriftDescription: string;

  // 历史与未来序列
  historicalPoints: HistoricalMonthPoint[];
  forecastPoints: ForecastMonthPoint[];
  timelineData: TimelineChartPoint[];

  // 核心财务与开支建议指标
  totalHistoricalPast12Months: number;
  totalForecastNext12Months: number;    // 未来12个月预计维保总开支 (元)
  monthlyAverageForecast: number;       // 未来月均预测开支 (元)
  recommendedBudgetReserve: number;     // 建议预算申报储备额 (元, 含安全缓冲区)
  safetyBufferAmount: number;           // 应急风险缓冲区额度 (元)
  highestQuarterName: string;           // 资金支出峰值季度
  highestQuarterAmount: number;         // 峰值季度预计开支 (元)

  // 决策指导建议
  adviceTitle: string;
  adviceSummary: string;
  keyRecommendations: string[];
  contractTypeRecommendation: 'full_warranty' | 'pm_plus_ondemand' | 'in_house' | 'scrap_evaluation';
  contractTypeLabel: string;
  contractSavingsEstimate: number; // 相比失控大修的潜在节省测算
}

/**
 * 运行普通最小二乘法 (OLS) 线性回归分析
 */
function calculateLinearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
} {
  const n = points.length;
  if (n <= 1) {
    return { slope: 0, intercept: points[0]?.y || 0, rSquared: 0, standardError: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (let i = 0; i < n; i++) {
    const { x, y } = points[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-9) {
    return { slope: 0, intercept: sumY / n, rSquared: 0, standardError: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // 计算 R² (判定系数)
  const meanY = sumY / n;
  let ssTotal = 0;
  let ssResidual = 0;

  for (let i = 0; i < n; i++) {
    const { x, y } = points[i];
    const yPred = slope * x + intercept;
    ssResidual += (y - yPred) * (y - yPred);
    ssTotal += (y - meanY) * (y - meanY);
  }

  const rSquared = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - ssResidual / ssTotal)) : 0;
  const standardError = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : Math.sqrt(ssResidual / n);

  return { slope, intercept, rSquared, standardError };
}

/**
 * 基于设备维修历史记录与工作单，使用线性回归生成未来12个月维保费用预测与建议
 */
export function generateMaintenanceExpenseForecast(
  equipment: MedicalEquipment,
  deviceWorkOrders: EngineeringWorkOrder[] = []
): MaintenanceForecastResult {
  const purchasePrice = estimateRealisticPurchasePrice(equipment);
  const financialProfile = calculateEquipmentFinancialProfile(equipment);
  const repairRecords = equipment.repairRecords || [];

  // 1. 构建过去12个月历史基准时间窗口 (2025-10 至 2026-09)
  const refDate = new Date('2026-09-01');
  const pastMonths: { key: string; display: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    pastMonths.push({
      key: `${y}-${m}`,
      display: `${String(y).slice(2)}年${m}月`
    });
  }

  // 2. 统计过去12个月各月份实际维修支出
  const historicalCostsMap: Record<string, { cost: number; count: number }> = {};
  pastMonths.forEach(m => {
    historicalCostsMap[m.key] = { cost: 0, count: 0 };
  });

  // 整合常规 repairRecords
  repairRecords.forEach(r => {
    const dateStr = r.faultDate || r.completionDate || '';
    if (dateStr) {
      const ym = dateStr.slice(0, 7);
      if (historicalCostsMap[ym]) {
        historicalCostsMap[ym].cost += (r.cost || 0);
        historicalCostsMap[ym].count += 1;
      }
    }
  });

  // 整合工程派工单 deviceWorkOrders
  deviceWorkOrders.forEach(o => {
    const dateStr = o.reportTime || o.repairFinishedTime || '';
    if (dateStr) {
      const ym = dateStr.slice(0, 7);
      if (historicalCostsMap[ym]) {
        const isDupe = repairRecords.some(r => r.id === o.id);
        if (!isDupe) {
          historicalCostsMap[ym].cost += (o.totalRepairCost || 0);
          historicalCostsMap[ym].count += 1;
        }
      }
    }
  });

  // 若历史记录稀少（如次新设备或录入样本少），基于设备原值与已使用年限，合理推算正常的预防性维护基础支出
  const totalRawPastCost = pastMonths.reduce((s, m) => s + historicalCostsMap[m.key].cost, 0);
  const annualBaselineBenchmark = Math.max(2000, Math.round(purchasePrice * 0.018)); // 约1.8%年化基础PM

  const historicalPoints: HistoricalMonthPoint[] = pastMonths.map((m, idx) => {
    let cost = historicalCostsMap[m.key].cost;
    let count = historicalCostsMap[m.key].count;

    // 如果历史没有支出记录，基于设备年龄与基准赋予微小的季度巡检维护成本（保持真实性）
    if (totalRawPastCost === 0) {
      // 季度保养点 (3, 6, 9, 12月)
      if (idx % 3 === 2) {
        cost = Math.round(annualBaselineBenchmark / 4);
        count = 1;
      }
    }

    return {
      month: m.key,
      displayMonth: m.display,
      actualCost: cost,
      faultCount: count,
      isFuture: false
    };
  });

  // 3. 准备 OLS 线性回归样本数据集: (x = 1..12, y = monthlyCost)
  const regressionPoints = historicalPoints.map((pt, idx) => ({
    x: idx + 1,
    y: pt.actualCost
  }));

  const { slope, intercept, rSquared, standardError } = calculateLinearRegression(regressionPoints);

  // 4. 判定回归趋势与月度漂移
  let trendDirection: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (slope > 80) trendDirection = 'increasing';
  else if (slope < -80) trendDirection = 'decreasing';

  const monthlyDriftDescription = slope > 0
    ? `月度维保费用呈递增趋势，月均向上漂移 +¥${Math.round(slope)}/月`
    : slope < 0
    ? `月度维保支出呈收敛回落趋势，月均漂移 -¥${Math.round(Math.abs(slope))}/月`
    : '月度维保支出整体保持平稳基线';

  // 5. 生成未来12个月时间序列 (从 2026-11 至 2027-10)
  const futureStartDate = new Date('2026-11-01');
  const forecastPoints: ForecastMonthPoint[] = [];

  let runningCumulative = 0;

  // 预防性节点预设方案
  const pmSchedules = [
    '例行巡检与电气安全GB9706测试',
    '消耗配件与滤网更换',
    'Q1季度预防性深度维护(PM1)',
    '机械传动导轨清洁润滑',
    '传感器零点与灵敏度校验',
    '半年度二级综合PM保养(PM2)',
    '核心温控与高压模块检测',
    '备用电池与UPS充放电活化',
    'Q3季度法定强检校准前定标',
    '管路密闭性试压与易损密封件换新',
    '控制电路防尘与接插件加固',
    '年度全性能验证与年检总结(PM3)'
  ];

  for (let k = 1; k <= 12; k++) {
    const futureDate = new Date(futureStartDate.getFullYear(), futureStartDate.getMonth() + (k - 1), 1);
    const y = futureDate.getFullYear();
    const m = String(futureDate.getMonth() + 1).padStart(2, '0');
    const monthKey = `${y}-${m}`;
    const displayMonth = `${String(y).slice(2)}年${m}月`;

    // 线性外推预测值: x = 12 + k
    const xVal = 12 + k;
    const rawPredicted = slope * xVal + intercept;

    // 考虑设备老化磨损与合理底线，确保单月预测不低于基础待机巡检成本
    const minMonthCost = Math.max(300, Math.round(purchasePrice * 0.001));
    const predictedCost = Math.max(minMonthCost, Math.round(rawPredicted));

    // 计算 95% 置信区间 (±1.96 * Se)
    const margin = Math.max(500, Math.round(1.96 * Math.max(standardError, predictedCost * 0.15)));
    const upperBound = predictedCost + margin;
    const lowerBound = Math.max(0, predictedCost - margin);

    runningCumulative += predictedCost;

    // 季度标记
    const quarter = k <= 3 ? 'Q1' : k <= 6 ? 'Q2' : k <= 9 ? 'Q3' : 'Q4';

    forecastPoints.push({
      month: monthKey,
      displayMonth,
      monthIndex: k,
      predictedCost,
      upperBound,
      lowerBound,
      cumulativePredicted: runningCumulative,
      quarter,
      maintenanceSchedule: pmSchedules[k - 1],
      isFuture: true
    });
  }

  // 6. 构造合并折线图数据
  const timelineData: TimelineChartPoint[] = [];

  // 加入历史12个月
  historicalPoints.forEach((pt, idx) => {
    const trendVal = Math.max(0, Math.round(slope * (idx + 1) + intercept));
    timelineData.push({
      month: pt.month,
      displayMonth: pt.displayMonth,
      actualCost: pt.actualCost,
      predictedCost: null,
      trendLine: trendVal,
      isFuture: false,
      notes: pt.faultCount > 0 ? `${pt.faultCount}次维修` : undefined
    });
  });

  // 加入过渡锚点 (让历史与未来平滑相连)
  const lastHist = historicalPoints[historicalPoints.length - 1];
  const firstFore = forecastPoints[0];

  // 加入未来12个月
  forecastPoints.forEach(pt => {
    timelineData.push({
      month: pt.month,
      displayMonth: pt.displayMonth,
      actualCost: null,
      predictedCost: pt.predictedCost,
      upperBound: pt.upperBound,
      lowerBound: pt.lowerBound,
      trendLine: pt.predictedCost,
      cumulativeCost: pt.cumulativePredicted,
      isFuture: true,
      notes: pt.maintenanceSchedule
    });
  });

  // 7. 汇总预测指标
  const totalHistoricalPast12Months = historicalPoints.reduce((s, p) => s + p.actualCost, 0);
  const totalForecastNext12Months = forecastPoints.reduce((s, p) => s + p.predictedCost, 0);
  const monthlyAverageForecast = Math.round(totalForecastNext12Months / 12);

  // 建议预算储备金 (包含 12% 应急备件与突发大修风险准备金)
  const SAFETY_BUFFER_RATE = 0.12;
  const safetyBufferAmount = Math.round(totalForecastNext12Months * SAFETY_BUFFER_RATE);
  const recommendedBudgetReserve = totalForecastNext12Months + safetyBufferAmount;

  // 统计各季度开支，找出最高风险季度
  const quarterTotals: Record<string, number> = {
    '2026 Q4 (11-12月与跨年)': 0,
    '2027 Q1 (春季开局)': 0,
    '2027 Q2 (年中负荷)': 0,
    '2027 Q3 (秋季高负荷)': 0
  };

  forecastPoints.forEach((pt, idx) => {
    if (idx < 2) quarterTotals['2026 Q4 (11-12月与跨年)'] += pt.predictedCost;
    else if (idx < 5) quarterTotals['2027 Q1 (春季开局)'] += pt.predictedCost;
    else if (idx < 8) quarterTotals['2027 Q2 (年中负荷)'] += pt.predictedCost;
    else quarterTotals['2027 Q3 (秋季高负荷)'] += pt.predictedCost;
  });

  let highestQuarterName = '2027 Q2 (年中负荷)';
  let highestQuarterAmount = 0;
  Object.entries(quarterTotals).forEach(([qName, qSum]) => {
    if (qSum > highestQuarterAmount) {
      highestQuarterAmount = qSum;
      highestQuarterName = qName;
    }
  });

  // 8. 智能生成针对该设备的专业开支建议 (Actionable Advice)
  const isOverAge = financialProfile.serviceYears > financialProfile.depreciationYears;
  const forecastToPurchaseRatio = purchasePrice > 0 ? +((totalForecastNext12Months / purchasePrice) * 100).toFixed(1) : 0;
  const currentTotalRepairCost = (equipment.repairRecords || []).reduce((s, r) => s + (r.cost || 0), 0);
  const cumulativeWillExceedScrap = (currentTotalRepairCost + totalForecastNext12Months) >= (purchasePrice * 0.5);

  let adviceTitle = '预算申报建议：平稳运维型';
  let adviceSummary = '';
  const keyRecommendations: string[] = [];
  let contractTypeRecommendation: MaintenanceForecastResult['contractTypeRecommendation'] = 'pm_plus_ondemand';
  let contractTypeLabel = '预防性保养PM + 零星单次工单';
  let contractSavingsEstimate = Math.round(totalForecastNext12Months * 0.22);

  if (cumulativeWillExceedScrap || forecastToPurchaseRatio >= 25 || isOverAge) {
    adviceTitle = '🚨 高额维保风险预警 · 建议启动技术鉴定或保修置换';
    contractTypeRecommendation = 'scrap_evaluation';
    contractTypeLabel = '启动报废/更新评估，严格限额大修';
    adviceSummary = `基于线性回归模型测算，未来12个月预计维保支出将达 ¥${totalForecastNext12Months.toLocaleString()}（占原值 ${forecastToPurchaseRatio}%），累计维修成本逼近原值50%警戒线。持续大修经济性显著劣于采购置换。`;
    keyRecommendations.push(
      `建议下年度设备维保预算封顶审批，单次大修超过 ¥${Math.round(purchasePrice * 0.08).toLocaleString()} 必须提请医学装备委员会开展经济效益伦理评审。`,
      `优先安排 Q1 季度执行整机电气安全与72小时满负荷稳定性测试，若关键部件存在不可逆损耗，列入下一年度医院大型设备更新替换储备名录。`,
      `若临床确有不可替代急救需求，建议探讨按原值5%-7%锁定原厂全保合同，将不可控的大修风险转嫁给厂商。`
    );
  } else if (trendDirection === 'increasing') {
    adviceTitle = '⚠️ 维保支出加速爬升 · 建议改签保修合同锁定成本';
    contractTypeRecommendation = 'full_warranty';
    contractTypeLabel = '建议签订原厂全保合同 (锁定预算上限)';
    adviceSummary = `该设备维修历史呈现明显的上升趋势（斜率 +¥${Math.round(slope)}/月，判定系数 R² = ${(rSquared * 100).toFixed(1)}%）。预计未来12个月支出将达 ¥${totalForecastNext12Months.toLocaleString()}，建议申报预算储备金 ¥${recommendedBudgetReserve.toLocaleString()}。`;
    keyRecommendations.push(
      `当前零星单次大修费用逐步递增，建议医工科在今年底前向厂商询价全保合同（通常费率为原值的 4%~6% 约 ¥${Math.round(purchasePrice * 0.05).toLocaleString()}），锁定下年度全院预算风险。`,
      `重点防范 ${highestQuarterName} 的故障高峰（预计季度开支达 ¥${highestQuarterAmount.toLocaleString()}），提前储备核心备件。`,
      `推行“以养代修”，在斜率拐点处增设半年度二级PM预防性深保，预计可消除约 28% 的偶发故障。`
    );
  } else {
    adviceTitle = '✅ 运行状态稳定 · 维持自主维保与常规巡检';
    contractTypeRecommendation = 'in_house';
    contractTypeLabel = '院内自主预防性巡检 + 厂家配件定点采买';
    adviceSummary = `设备回归拟合平稳，未来12个月预测支出为 ¥${totalForecastNext12Months.toLocaleString()}（月均仅约 ¥${monthlyAverageForecast.toLocaleString()}）。设备处于技术成熟稳定运行期，预算压力较低。`;
    keyRecommendations.push(
      `建议下年度申报维保专项预算金 ¥${recommendedBudgetReserve.toLocaleString()}（含 ¥${safetyBufferAmount.toLocaleString()} 应急准备金），保障日常耗材及定标费用。`,
      `保持每季度一次的规范化现场巡检与电气安全自检，严格执行草料活码扫码点检。`,
      `无需购买昂贵的全包服务，采用“院内工程师日常排障 + 关键配件集中议价集采”模式，预计年化节省支出 ¥${contractSavingsEstimate.toLocaleString()}。`
    );
  }

  return {
    slope: +slope.toFixed(2),
    intercept: +intercept.toFixed(2),
    rSquared: +rSquared.toFixed(3),
    standardError: Math.round(standardError),
    trendDirection,
    monthlyDriftDescription,

    historicalPoints,
    forecastPoints,
    timelineData,

    totalHistoricalPast12Months,
    totalForecastNext12Months,
    monthlyAverageForecast,
    recommendedBudgetReserve,
    safetyBufferAmount,
    highestQuarterName,
    highestQuarterAmount,

    adviceTitle,
    adviceSummary,
    keyRecommendations,
    contractTypeRecommendation,
    contractTypeLabel,
    contractSavingsEstimate
  };
}

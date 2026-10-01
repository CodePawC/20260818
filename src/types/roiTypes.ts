export type EconomicQuadrantType = 
  | 'star'               // 🌟 明星金牛资产 (高收益、高负荷、低维保风险)
  | 'cash_cow'           // 💰 稳定高产资产 (回收已完成、稳定净流入)
  | 'heavy_maintenance'  // ⚠️ 高耗重载资产 (收入虽高但维保配件支出剧增)
  | 'underutilized'      // 💤 闲置低效资产 (负荷不足、工作量过低、建议调拨)
  | 'loss_scrap';        // 🚨 亏损淘汰资产 (入不敷出、严重超期、建议下线)

export interface MonthlyFinancialNode {
  month: string;         // YYYY-MM
  volume: number;        // 当月检查/治疗人次
  grossRevenue: number;  // 当月业务总收入 (元)
  depreciationCost: number; // 当月折旧 (元)
  maintenanceCost: number;  // 当月维保支出 (元)
  consumableCost: number;   // 当月耗材试剂 (元)
  utilitiesLaborCost: number;// 当月能耗与人力 (元)
  totalCost: number;     // 当月全成本 (元)
  netProfit: number;     // 当月净利润 (元)
  cumulativeProfit: number; // 累计净收益 (元)
}

export interface EquipmentFinancialProfile {
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSn: string;
  department: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;        // 设备采购原值 (元)
  serviceYears: number;         // 实际投用年限 (年)
  depreciationYears: number;    // 财务折旧年限 (通常5~10年)
  salvageRate: number;          // 预计残值率 (默认 5%)
  
  // 业务量与临床收费
  monthlyExaminations: number;  // 月均诊疗/检查人次
  ratedMonthlyCapacity: number; // 额定月均最大负荷人次
  unitPrice: number;            // 临床单次平均收费标准 (元/次)
  medicalInsuranceRatio: number;// 医保报销支付占比 (如 75%)
  
  // 收入核算
  annualGrossRevenue: number;   // 年均业务总收入 (元)
  cumulativeGrossRevenue: number;// 投用至今累计业务收入 (元)
  
  // 全成本要素核算
  annualDepreciation: number;   // 年折旧费 (元)
  cumulativeDepreciation: number;// 累计已提折旧 (元)
  netAssetValue: number;        // 当前资产净值 (元)
  
  annualMaintenanceCost: number;// 年均维保与配件支出 (元)
  cumulativeMaintenanceCost: number; // 历史累计实际维保支出 (元)
  
  consumableRate: number;       // 耗材试剂成本率 (占收入百分比 如 20%)
  annualConsumableCost: number; // 年均耗材支出 (元)
  cumulativeConsumableCost: number; // 累计耗材支出 (元)
  
  annualUtilitiesAndSpace: number; // 年场地分摊与动力能耗 (元)
  annualLaborCost: number;      // 年医护技师操作工时分摊 (元)
  
  annualTotalCost: number;      // 年均运营全成本 (元)
  cumulativeTotalCost: number;  // 累计运营全成本 (元)
  
  // 效益与收益结果
  annualNetProfit: number;      // 年均净利润 (元)
  cumulativeNetProfit: number;  // 累计净现金流收益 (元)
  
  annualRoi: number;            // 年化投资回报率 ROI (%)
  cumulativeRoi: number;        // 累计总投资回报率 ROI (%)
  paybackYears: number;         // 动态投资回收周期 (年)
  isPaybackCompleted: boolean;  // 是否已收回初始投资成本
  paybackProgressPercent: number;// 投资回本进度 (0 ~ 100%)
  
  breakEvenMonthlyVolume: number;// 月均保本盈亏平衡工作量 (人次/月)
  revenuePer100Asset: number;   // 百元固定资产创收率 (元)
  capacityUtilization: number;  // 实际设备负荷率 / 稼动率 (%)
  
  // 经济学评级与象限分类
  quadrant: EconomicQuadrantType;
  quadrantLabel: string;
  quadrantDescription: string;
  badgeClass: string;
  managementAdvice: string;     // 运营决策与采购建议
  
  monthlyHistory: MonthlyFinancialNode[]; // 历史12个月收支数据流
}

export interface RoiSimulationParams {
  workloadDeltaPercent: number;    // 临床工作量调节 (-50% ~ +100%)
  unitPriceAdjust: number;         // 收费单价微调 (元)
  consumableRateAdjust: number;    // 耗材比率浮动 (-10% ~ +10%)
  annualMaintenancePlan: 'current' | 'preventive_extended' | 'minimal'; // 维保方案
}

export interface HospitalRoiOverviewStats {
  totalAssetValue: number;         // 全院纳入核算设备总原值 (元)
  totalAnnualRevenue: number;       // 全院年度设备业务总收入 (元)
  totalAnnualNetProfit: number;     // 全院年度设备净利润 (元)
  averageHospitalRoi: number;       // 全院平均设备年化 ROI (%)
  averagePaybackYears: number;      // 平均投资回收期 (年)
  starEquipmentCount: number;       // 明星高产设备台数
  idleWarningCount: number;         // 闲置低效预警台数
  lossWarningCount: number;         // 亏损淘汰风险台数
  topRevenueDepartment: string;     // 创收最高科室
  topRoiEquipmentName: string;      // ROI最高机型
}

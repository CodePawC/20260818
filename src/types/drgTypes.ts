// ==================== 医保DRG病组成本与专机专耗钩稽核算数据模型 ====================

/**
 * 专机专耗钩稽状态枚举
 */
export type DrgAuditStatus = 
  | 'normal'                // 钩稽正常：工时与耗材匹配
  | 'missing_consumable'    // 疑似漏记耗材：有设备开机记录，但无对应专机耗材收费
  | 'missing_equipment_log' // 计费脱钩：有耗材收费/出库，但缺少专机开机工时
  | 'over_consumed'         // 耗材超标：耗材用量超出临床路径标准定额
  | 'under_utilized';       // 设备低效空转：开机时长过长但诊疗病例数偏低

/**
 * DRG病组严重程度级别
 */
export type DrgSeverityLevel = 'with_mcc' | 'with_cc' | 'without_cc'; // 伴严重并发症 | 伴一般并发症 | 无并发症

/**
 * 专用医用耗材对照定义（国家医保耗材代码体系）
 */
export interface DedicatedConsumableMapping {
  consumableCode: string;       // 国家医保耗材27位编码 (e.g. "C03010100100000000000000001")
  consumableName: string;       // 耗材通用名称 (e.g. "超声刀高频剪刀头")
  brand: string;                // 耗材品牌 (e.g. "强生 / 爱惜康", "美敦力")
  spec: string;                 // 规格型号 (e.g. "HAR36 36cm弯形")
  unitPrice: number;            // 采购单价 (元)
  medicalInsuranceCategory: 'A' | 'B' | 'Self'; // 甲类(全报) | 乙类(部分自付) | 自费
  reimbursementRatio: number;   // 医保报销比例 (0 - 1.0)
  standardRatioPerCase: number; // 临床路径单病组标准耗用量 (如 1.0 套/例)
  allowableVariance: number;    // 允许浮动偏差 (如 0.15 即 ±15%)
  unit: string;                 // 计量单位 (套、支、把、个)
  isHighValue: boolean;         // 是否为高值耗材
}

/**
 * 专机关联设备基准定义
 */
export interface DedicatedEquipmentMapping {
  equipmentType: string;        // 设备品类 (e.g. "4K超高清腹腔镜系统", "有创呼吸机")
  matchedEquipmentNos: string[];// 院内在册设备资产/机身编号列表
  machineHourlyCost: number;    // 单位机时基准成本(元/小时): 含物理折旧、维保分摊、强检摊销与电力
  standardHoursPerCase: number; // 临床路径单病组标准开机工时 (小时)
  allowableHourVariance: number;// 允许工时浮动偏差 (如 0.20)
}

/**
 * DRG病组基准主数据模型
 */
export interface DrgGroupMaster {
  id: string;                   // 内部唯一ID
  drgCode: string;              // 国家医保DRG编码 (e.g. "FM19", "ET19", "LU19")
  drgName: string;              // DRG病组名称
  mdcCode: string;              // 主要诊断大类代码 (e.g. "MDCE 呼吸系统")
  mdcName: string;              // 主要诊断大类名称
  departmentName: string;       // 主管临床科室
  weightPoints: number;         // 标化DRG相对权重/点数 (RW)
  benchmarkPayment: number;     // 医保定额支付标准(元/例)
  targetAlosDays: number;       // 临床路径标准平均住院日 (天)
  dedicatedEquipment: DedicatedEquipmentMapping[]; // 绑定的关键专机设备
  dedicatedConsumables: DedicatedConsumableMapping[]; // 绑定的关键专机专耗
  status: 'active' | 'warning' | 'deficit'; // 当前运行状态: 结余良好 | 警戒状态 | 成本倒挂亏损
  notes?: string;               // 临床路径与病组要点说明
}

/**
 * 单份住院病案的DRG专机专耗交叉核查记录
 */
export interface DrgCaseAuditRecord {
  id: string;                   // 稽核记录ID (e.g. "AUD-202610-001")
  caseId: string;               // 住院病案号
  patientName: string;          // 患者姓名(脱敏展示)
  drgCode: string;              // DRG病组代码
  drgName: string;              // DRG病组名称
  departmentName: string;       // 收治科室
  attendingDoctor: string;      // 主治医师
  admissionDate: string;        // 入院日期
  dischargeDate: string;        // 出院日期
  losDays: number;              // 实际住院天数
  // 费用构成
  totalHospitalCost: number;    // 住院总医疗费用 (元)
  insurancePayment: number;     // 医保定额统筹结算额 (元)
  actualEquipmentHours: number; // 本案专机累计开机工时 (小时)
  equipmentHourlyRate: number;  // 对应设备单位机时成本 (元/小时)
  allocatedEquipmentCost: number;// 分摊设备折旧机时成本 (元)
  actualConsumablesCost: number;// 专机专耗扫码计费总额 (元)
  otherMedicalCost: number;     // 药品、诊疗、床位等其他费用 (元)
  netBalance: number;           // 医保结余差额 (元) = insurancePayment - totalHospitalCost
  // 专耗钩稽明细
  equipmentInternalNo: string;  // 实际调用的专机资产编号
  equipmentModel: string;       // 设备型号规格
  consumableBarcode: string;    // 耗材唯一UDI扫码批号
  consumableQuantity: number;   // 实际记账消耗数量
  standardExpectedQuantity: number; // 理论应耗数量
  auditStatus: DrgAuditStatus;  // 钩稽结论状态
  anomalyReason?: string;       // 异常根因排查说明
  reconciliationAction?: string;// 三甲质控整改处置建议
  auditorName?: string;         // 医工/医保质控稽核人
  auditDate?: string;           // 稽核时间
}

/**
 * 专机视角的运营与钩稽汇总实体
 */
export interface DedicatedEquipmentAuditSummary {
  equipmentId: string;
  internalNo: string;
  equipmentName: string;
  model: string;
  departmentName: string;
  originalValue: number;        // 设备原值 (元)
  monthlyDepreciation: number;  // 月度折旧 (元)
  hourlyCostBenchmark: number;  // 测算机时基准价 (元/小时)
  totalRunningHours: number;    // 当月累计有效开机工时 (小时)
  servedCaseCount: number;      // 累计服务病案数 (例)
  allocatedCostTotal: number;   // 累计分摊至各病组设备成本 (元)
  associatedConsumableExpected: number; // 理论应耗专用耗材套数
  associatedConsumableActual: number;   // 实际扫码记账套数
  consumableDiscrepancyRate: number;    // 专耗偏差率 (%) = (实际 - 理论) / 理论 * 100
  potentialRevenueLoss: number; // 疑似漏记费或跑冒滴漏风险金额 (元)
  auditRiskLevel: 'low' | 'medium' | 'high'; // 质控风险评级
  primaryDrgCodes: string[];    // 主要服务的DRG病组
}

/**
 * 工作台全局KPI指标条统计数据
 */
export interface DrgAuditKpiMetrics {
  totalAnalyzedCases: number;       // 纳管DRG核算病案总数
  totalDrgGroupsCount: number;      // 覆盖DRG病组总数
  totalEquipmentAllocatedCost: number; // 累计分摊专机折旧与机时总成本 (元)
  totalDedicatedConsumablesCost: number; // 专机专耗累计支出总额 (元)
  consumablePerHundredIncome: number;// 百元医疗收入消耗专机卫生材料 (元, 国考关键指标)
  deviceCostToTotalCostPercent: number;// 设备机时成本占住院总费用比重 (%)
  insuranceNetBalanceTotal: number;  // 纳入病组医保综合结余总额 (元)
  anomalyAuditCount: number;        // 专机专耗钩稽异常预警病案数
  missingConsumableCount: number;   // 疑似漏记耗材病案数 (有开机无计费)
  missingEquipmentLogCount: number; // 计费脱钩病案数 (有计费无开机)
  overConsumedCount: number;        // 超标消耗病案数
  auditResolutionRate: number;      // 质控整改闭环率 (%)
}

/**
 * 筛选条件接口
 */
export interface DrgAuditFilterState {
  department: string;           // 科室筛选
  drgCodeOrKeyword: string;     // DRG病组编码或关键词
  auditStatus: string;          // 钩稽状态过滤: 'all' | DrgAuditStatus
  viewMode: 'drg_case_view' | 'equipment_view'; // 视图主线: 按病组 vs 按专机
  timePeriod: 'current_month' | 'last_month' | 'current_quarter' | 'year_to_date'; // 核算周期
  riskLevel: 'all' | 'high' | 'medium' | 'low';
}

/**
 * 专机专耗异常红黄预警通知模型
 */
export type DrgAlertLevel = 'red' | 'amber'; // 红色高危预警 | 黄色预警偏离

export interface DrgWarningAlert {
  id: string;                      // 预警通知ID (e.g. "ALT-202610-01")
  equipmentId: string;             // 设备ID
  internalNo: string;              // 设备院内资产/机身编号
  equipmentName: string;           // 设备名称
  departmentName: string;          // 所属科室
  drgCode: string;                 // 关联DRG病组代码
  drgName: string;                 // 关联DRG病组名称
  alertLevel: DrgAlertLevel;       // 预警等级 (红/黄)
  alertType: 'over_group_average' | 'missing_consumable_leak' | 'decoupled_log'; // 预警类型: 超出病组平均 | 漏记耗材漏费 | 计费脱钩
  actualAvgConsumablePerCase: number; // 该单机例均专耗金额 (元)
  groupAvgConsumableBenchmark: number;// 对应DRG病组平均专耗基准 (元)
  exceedRatePercent: number;       // 超出病组平均百分比 (%)
  detectedAt: string;              // 触发预警时间
  handled: boolean;                // 是否已确认处置
  handleRemark?: string;           // 处置说明/排查记录
  suggestedAction: string;         // 三甲质控处置整改建议
}

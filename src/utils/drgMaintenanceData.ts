import { MedicalEquipment, RepairRecord } from '../types';
import { 
  DrgGroupMaster, 
  DrgCaseAuditRecord, 
  DedicatedEquipmentAuditSummary,
  DedicatedConsumableMapping,
  DrgWarningAlert
} from '../types/drgTypes';

export interface AssociatedMaintenanceRecord extends RepairRecord {
  drgCorrelationNote?: string;       // 与当前DRG专机专耗异常的物理与临床因果关联说明
  isKeyRootCause?: boolean;          // 是否为当前预警的关键诱因
  allocatedCostToDrgCase?: number;   // 分摊至单病案的维保成本(元)
  vendorCompany?: string;            // 维保供应商公司全称
  verificationStatus?: 'verified' | 'pending'; // 临床与医工双签验收状态
}

export interface DrgConsumableCostItem {
  consumableCode: string;
  consumableName: string;
  brand: string;
  spec: string;
  unitPrice: number;
  medicalInsuranceCategory: 'A' | 'B' | 'Self';
  reimbursementRatio: number;
  standardExpectedRatio: number;
  actualAvgUsedRatio: number;
  unit: string;
  isHighValue: boolean;
  actualAvgCost: number;
  standardBenchmarkCost: number;
  varianceRatePercent: number;
  costImpactAmount: number;
}

export interface DetailedEquipmentDrgCostAnalysis {
  equipmentInternalNo: string;
  equipmentName: string;
  model: string;
  departmentName: string;
  originalValue: number;
  hourlyCostBenchmark: number;
  currentStatus: string;
  totalRunningHoursMonthly: number;

  // 病组维度
  drgCode: string;
  drgName: string;
  mdcName: string;
  weightPoints: number;
  benchmarkPayment: number;
  targetAlosDays: number;
  standardHoursPerCase: number;

  // 本机在当前病组下的实际核算
  servedCaseCount: number;
  actualAvgHoursPerCase: number;
  allocatedEquipmentCostPerCase: number;
  actualAvgConsumableCostPerCase: number;
  groupAvgConsumableBenchmark: number;
  consumableExceedRatePercent: number;
  allocatedMaintenanceCostPerCase: number;
  otherMedicalCostPerCase: number;
  actualTotalHospitalCostPerCase: number;
  netBalancePerCase: number;
  isProfit: boolean;

  // 费用结构占比 (百分比)
  consumablePercentage: number;
  equipmentDepreciationPercentage: number;
  maintenanceAllocationPercentage: number;
  otherMedicalPercentage: number;

  // 专耗明细列表
  consumableItems: DrgConsumableCostItem[];

  // 关联维保档案
  maintenanceRecords: AssociatedMaintenanceRecord[];
  totalAnnualMaintenanceCost: number;
  annualRunningHoursEstimated: number;
  hourlyMaintenanceRate: number; // 元/小时

  // 归因排查结论与整改建议
  rootCauseDiagnoses: string[];
  suggestedAction: string;

  // 关联病案列表
  associatedCases: DrgCaseAuditRecord[];
}

// 预设丰富的三甲医院专机全生命周期维保记录底库
const PRESET_EQUIPMENT_MAINTENANCE_RECORDS: Record<string, AssociatedMaintenanceRecord[]> = {
  'EQ-DSA-001': [
    {
      id: 'REP-DSA-202609-01',
      equipmentId: 'EQ-DSA-001',
      equipmentName: '大C臂数字减影血管造影机',
      equipmentSn: 'Siemens-Artis-Q-99120',
      faultDate: '2026-09-12',
      completionDate: '2026-09-14',
      repairType: '紧急故障维修',
      faultDescription: '介入手术中曝光管电压波形异常抖动，球管高压打火报错ERR-H82，平板探测器低对比度图像产生条状伪影。',
      resolution: '原厂驻场工程师紧急到场，更换高压发生器绝缘插头与高压电缆衬套，清洁探测器光纤接口，重新校准空气比释动能率与水模增益定标。',
      technician: '西门子医疗原厂高级技术支持专家 (王工程师)',
      vendorCompany: '西门子医疗系统有限公司',
      cost: 24800,
      partsReplaced: '高压电缆绝缘衬套组件、限束器卤素定标光源、机架滤尘风扇组',
      status: '已完成',
      department: '介入科',
      isKeyRootCause: true,
      drgCorrelationNote: '【核心根因】因高压打火导致术中曝光参数微波动，术者为确保颅内微血管清晰度，额外增加试造影微导管与造影耗材耗用，直接推高了BR19病组单机例均专耗！',
      verificationStatus: 'verified'
    },
    {
      id: 'PM-DSA-202606-02',
      equipmentId: 'EQ-DSA-001',
      equipmentName: '大C臂数字减影血管造影机',
      equipmentSn: 'Siemens-Artis-Q-99120',
      faultDate: '2026-06-18',
      completionDate: '2026-06-19',
      repairType: '定期预防性保养',
      faultDescription: 'Q2季度二级预防性维护(PM2)，检查C臂机械导轨传动精度、防碰撞传感器与急停回路安全测试。',
      resolution: '对C臂滑环及机械齿条实施深度清洗润滑，校正防碰撞激光测距探头，完成急停保护与双联脚踏开关测试。',
      technician: '院医学工程处影像组 (李工)',
      cost: 6500,
      partsReplaced: '滑环导电碳刷组、防碰撞柔性接触条',
      status: '已完成',
      department: '介入科',
      isKeyRootCause: false,
      verificationStatus: 'verified'
    },
    {
      id: 'CAL-DSA-202603-01',
      equipmentId: 'EQ-DSA-001',
      equipmentName: '大C臂数字减影血管造影机',
      equipmentSn: 'Siemens-Artis-Q-99120',
      faultDate: '2026-03-20',
      completionDate: '2026-03-21',
      repairType: '计量校准',
      faultDescription: '国家法定计量强制检定(e-CQS强检备案平台委托)，依据JJG 1022-2007开展辐射输出剂量、空间分辨力及透视受检者入射表面空气比释动能率检测。',
      resolution: '经现场多点实测，各项剂量与成像指标符合国家标准，出具合格强检证书(证书编号: SD-JL-20260320-088)。',
      technician: '省计量科学研究院放射医学计量所 (张检定员)',
      vendorCompany: '山东省计量科学研究院 (省级法定机构)',
      cost: 0,
      partsReplaced: '无',
      status: '已完成',
      department: '介入科',
      isKeyRootCause: false,
      verificationStatus: 'verified'
    }
  ],

  'EQ-WC-001': [
    {
      id: 'REP-WC-202610-01',
      equipmentId: 'EQ-WC-001',
      equipmentName: '4K荧光超高清腹腔镜系统1号',
      equipmentSn: 'Storz-IMAGE1-S-4K-2023',
      faultDate: '2026-10-08',
      completionDate: '2026-10-09',
      repairType: '紧急故障维修',
      faultDescription: '术中发现4K摄像主机荧光模式切换延迟，冷光源光纤插孔接口温度偏高报警，光学传导光斑亮度较平时下降约35%。',
      resolution: '工程师拆机检修，发现冷光源聚焦透镜附着油雾粉尘且聚光罩微变形。更换聚焦透镜、光纤接口座，并对全套光学镜体做激光测焦。',
      technician: '卡尔史托斯原厂认证工程师 (陈工)',
      vendorCompany: '卡尔史托斯内窥镜(上海)有限公司',
      cost: 11800,
      partsReplaced: '氙灯冷光源聚焦透镜、前端传导光纤插座、密封圈组',
      status: '已完成',
      department: '胃肠外科',
      isKeyRootCause: true,
      drgCorrelationNote: '【核心根因】冷光源透镜老化导致术野照明衰减，术中超声刀头凝固止血视野不清，引发术者频繁更换刀头以寻找更锋利触点，导致单病案超声刀头领用量高出标准定额。',
      verificationStatus: 'verified'
    },
    {
      id: 'PM-WC-202607-01',
      equipmentId: 'EQ-WC-001',
      equipmentName: '4K荧光超高清腹腔镜系统1号',
      equipmentSn: 'Storz-IMAGE1-S-4K-2023',
      faultDate: '2026-07-25',
      completionDate: '2026-07-26',
      repairType: '定期预防性保养',
      faultDescription: '高频二氧化碳气腹机气路密闭性检测试压，加热管路温度传感器标定及主机电气绝缘安全巡检。',
      resolution: '更换气腹机进气微孔滤芯，清洗减压阀气路结晶，实测漏气率<0.02L/min，符合YY 0777行业标准。',
      technician: '院医学工程处微创器械精修组 (崔工)',
      cost: 3200,
      partsReplaced: '进气高精度无菌微孔滤芯、气路减压阀硅胶垫圈',
      status: '已完成',
      department: '胃肠外科',
      isKeyRootCause: false,
      verificationStatus: 'verified'
    }
  ],

  'EQ-GK-001': [
    {
      id: 'REP-GK-202609-01',
      equipmentId: 'EQ-GK-001',
      equipmentName: '进口超声骨动力系统',
      equipmentSn: 'Stryker-TPS5-GK-081',
      faultDate: '2026-09-28',
      completionDate: '2026-09-30',
      repairType: '紧急故障维修',
      faultDescription: '关节置换术中动力手柄电机转速抖动，截骨时扭矩输出不稳，手柄温度升高触发主机限温保护。',
      resolution: '返厂精修更换无刷电机转子总成、微型传动轴承及手柄柔性动力电缆，重新校准扭矩闭环输出特性曲线。',
      technician: '史赛克原厂技术中心 (赵工)',
      vendorCompany: '史赛克(北京)医疗器械有限公司',
      cost: 14600,
      partsReplaced: '手柄微型无刷电机转子总成、高耐久柔性动力线缆、高温密封圈',
      status: '已完成',
      department: '骨科',
      isKeyRootCause: true,
      drgCorrelationNote: '【核心根因】手柄微动力衰减导致截骨阻力骤增，加剧了微创磨头刨刀刀具套包的机械磨损与钝化，致使单台关节置换手术消耗刀头由正常的2支激增至3~4支！',
      verificationStatus: 'verified'
    },
    {
      id: 'PM-GK-202605-01',
      equipmentId: 'EQ-GK-001',
      equipmentName: '进口超声骨动力系统',
      equipmentSn: 'Stryker-TPS5-GK-081',
      faultDate: '2026-05-18',
      completionDate: '2026-05-19',
      repairType: '定期预防性保养',
      faultDescription: '动力主机注水冲洗蠕动泵管路检修、注水泵流量标定与脚踏开关电气绝缘测试。',
      resolution: '更换蠕动泵弹性泵管，清洁电路板粉尘，校准各档位注水量，确保术中降温冲洗充分。',
      technician: '院医学工程处 (孙工)',
      cost: 2600,
      partsReplaced: '耐磨蠕动泵管、脚踏密封护罩',
      status: '已完成',
      department: '骨科',
      isKeyRootCause: false,
      verificationStatus: 'verified'
    }
  ],

  'EQ-ICU-003': [
    {
      id: 'REP-ICU-202610-01',
      equipmentId: 'EQ-ICU-003',
      equipmentName: '高端有创呼吸机A台',
      equipmentSn: 'Hamilton-G5-ICU-03',
      faultDate: '2026-10-15',
      completionDate: '2026-10-16',
      repairType: '紧急故障维修',
      faultDescription: 'ICU床旁呼吸机自检时呼气阀校准失败，提示呼气阻力偏大且氧浓度传感器漂移>10%。',
      resolution: '现场更换顺磁氧浓度传感器，拆解清洁呼气阀总成并换新硅胶膜片，重新执行密闭性与顺应性回路自检。',
      technician: '哈密顿驻场售后工程师 (周工)',
      vendorCompany: '哈密顿医疗技术服务部',
      cost: 5800,
      partsReplaced: '顺磁氧浓度电池、呼气阀高弹性硅胶膜片、流量传感器连接线',
      status: '已完成',
      department: '重症医学科(ICU)',
      isKeyRootCause: true,
      drgCorrelationNote: '【核心根因】呼气阀微渗漏导致通气压力波动，护理人员频繁更换双加热丝呼吸环路与湿化罐，诱发专机耗材费用上浮。',
      verificationStatus: 'verified'
    },
    {
      id: 'PM-ICU-202607-02',
      equipmentId: 'EQ-ICU-003',
      equipmentName: '高端有创呼吸机A台',
      equipmentSn: 'Hamilton-G5-ICU-03',
      faultDate: '2026-07-10',
      completionDate: '2026-07-11',
      repairType: '定期预防性保养',
      faultDescription: '半年度呼吸机深度PM保养：内部风机除尘、吸气安全阀试压、空氧混合器比例阀校准。',
      resolution: '完成进气粗滤网与HEPA微尘过滤器更换，测试内部锂电池备用供电时长(实测达145分钟，达标)。',
      technician: '医学工程处急救支持组 (崔工)',
      cost: 1800,
      partsReplaced: '进气HEPA高等级过滤网、氧气进气微孔过滤器',
      status: '已完成',
      department: '重症医学科(ICU)',
      isKeyRootCause: false,
      verificationStatus: 'verified'
    }
  ],

  'EQ-SN-001': [
    {
      id: 'REP-SN-202609-01',
      equipmentId: 'EQ-SN-001',
      equipmentName: '血液透析滤过机01号',
      equipmentSn: 'Fresenius-5008S-001',
      faultDate: '2026-09-05',
      completionDate: '2026-09-06',
      repairType: '紧急故障维修',
      faultDescription: '透析中超滤泵压差报警，电导度波动异常，置换液管路自检超时。',
      resolution: '清洗置换液电导池电极，更换超滤泵平衡腔硅胶活塞膜片，重新标定酸性浓缩液配比比例。',
      technician: '费森尤斯原厂售后工程师 (刘工)',
      vendorCompany: '费森尤斯医药用品(上海)有限公司',
      cost: 4800,
      partsReplaced: '平衡腔计量隔膜、电导度监测电极组、除气泵密封圈',
      status: '已完成',
      department: '肾内科',
      isKeyRootCause: false,
      verificationStatus: 'verified'
    }
  ],

  'EQ-ECMO-001': [
    {
      id: 'REP-ECMO-202608-01',
      equipmentId: 'EQ-ECMO-001',
      equipmentName: '体外膜肺氧合机系统',
      equipmentSn: 'Getinge-Cardiohelp-EICU-01',
      faultDate: '2026-08-30',
      completionDate: '2026-08-31',
      repairType: '定期预防性保养',
      faultDescription: 'ECMO系统年度强制安全性能检测与全功能自检：驱动马达电磁耦合力测试、气泡传感器灵敏度校验、双热备锂电池组深度充放电活化。',
      resolution: '更换原厂内置备用锂电池组，校准流量传感器与静脉压力探头零点，完成48小时模拟循环试机，各项安全指标优异。',
      technician: '迈柯唯(Getinge)医疗原厂资深工程专家 (徐工)',
      vendorCompany: '迈柯唯(上海)医疗设备有限公司',
      cost: 16500,
      partsReplaced: '主机备用锂电池组(2组)、超声流量传感器耦合探头',
      status: '已完成',
      department: '急诊重症科(EICU)',
      isKeyRootCause: true,
      drgCorrelationNote: '【核心根因】ECMO属于高危极高成本生命支持设备，年度原厂深保与备用电池更换确保了开机120小时零中断。高额分摊维保费(例均约¥850)需合理纳入AE19危重症病组成本测算中。',
      verificationStatus: 'verified'
    }
  ]
};

/**
 * 依据设备内部编号检索关联维保记录
 * 支持从全局在册设备技术台账(equipmentList)优先匹配真实记录，若不足则注入专业预设维保档案
 */
export function getEquipmentAssociatedMaintenanceRecords(
  internalNo: string,
  equipmentList?: MedicalEquipment[]
): AssociatedMaintenanceRecord[] {
  const records: AssociatedMaintenanceRecord[] = [];

  // 1. 尝试从真实的 equipmentList 提取设备维保
  if (equipmentList && equipmentList.length > 0) {
    const matched = equipmentList.find(e => 
      e.internalNo === internalNo || 
      e.id === internalNo ||
      (e.assetNo && e.assetNo === internalNo)
    );

    if (matched && matched.repairRecords && matched.repairRecords.length > 0) {
      matched.repairRecords.forEach(r => {
        records.push({
          ...r,
          vendorCompany: r.technician || '合作维保服务商',
          verificationStatus: r.status === '已完成' ? 'verified' : 'pending'
        });
      });
    }
  }

  // 2. 补充专业配置的预设维保底库
  const preset = PRESET_EQUIPMENT_MAINTENANCE_RECORDS[internalNo];
  if (preset) {
    preset.forEach(p => {
      if (!records.some(r => r.id === p.id)) {
        records.push(p);
      }
    });
  }

  // 3. 如果还是为空，生成一份结构完备的常规维保记录以确保穿透分析始终有维保依据
  if (records.length === 0) {
    records.push({
      id: `REP-${internalNo}-2026`,
      equipmentId: internalNo,
      equipmentName: '专机在册设备',
      equipmentSn: `SN-${internalNo}-2026`,
      faultDate: '2026-08-15',
      completionDate: '2026-08-16',
      repairType: '定期预防性保养',
      faultDescription: '例行季度预防性维护与电气安全绝缘测试，清洁内部风扇与机械导轨。',
      resolution: '整机除尘与关键部件定标，测试保护接地阻抗<0.05Ω，符合GB 9706.1要求。',
      technician: '院医学工程处维保工程师',
      cost: 3500,
      partsReplaced: '防尘滤网与密封密封垫圈',
      status: '已完成',
      department: '设备所属临床科室',
      verificationStatus: 'verified'
    });
  }

  // 排序：按时间倒序
  return records.sort((a, b) => new Date(b.faultDate).getTime() - new Date(a.faultDate).getTime());
}

/**
 * 核心穿透计算：计算指定设备在指定DRG病组下的详细费用构成与对比基准
 */
export function calculateEquipmentDrgDetailedCostAnalysis(
  equipmentInternalNo: string,
  drgCode: string,
  cases: DrgCaseAuditRecord[],
  groups: DrgGroupMaster[],
  equipmentSummaries: DedicatedEquipmentAuditSummary[],
  alert?: DrgWarningAlert | null,
  equipmentList?: MedicalEquipment[]
): DetailedEquipmentDrgCostAnalysis {
  // 1. 查找对应的DRG病组主数据
  const group = groups.find(g => g.drgCode === drgCode) || groups[0];

  // 2. 查找设备汇总信息
  const eqSummary = equipmentSummaries.find(e => e.internalNo === equipmentInternalNo) || {
    equipmentId: equipmentInternalNo,
    internalNo: equipmentInternalNo,
    equipmentName: alert?.equipmentName || '专机设备',
    model: '标准医用型',
    departmentName: group.departmentName,
    originalValue: 1200000,
    monthlyDepreciation: 10000,
    hourlyCostBenchmark: 280,
    totalRunningHours: 45,
    servedCaseCount: 10,
    allocatedCostTotal: 12600,
    associatedConsumableExpected: 10,
    associatedConsumableActual: 12,
    consumableDiscrepancyRate: 20,
    potentialRevenueLoss: 0,
    auditRiskLevel: 'high' as const,
    primaryDrgCodes: [drgCode]
  };

  // 3. 筛选本机在该病组下的全部病案
  const matchedCases = cases.filter(
    c => c.equipmentInternalNo === equipmentInternalNo && c.drgCode === drgCode
  );

  const servedCaseCount = matchedCases.length > 0 ? matchedCases.length : 1;

  // 4. 计算病组平均专耗基线
  const allCasesInGroup = cases.filter(c => c.drgCode === drgCode);
  const groupTotalConsumable = allCasesInGroup.reduce((s, c) => s + c.actualConsumablesCost, 0);
  const groupAvgConsumableBenchmark = allCasesInGroup.length > 0
    ? Math.round(groupTotalConsumable / allCasesInGroup.length)
    : (alert?.groupAvgConsumableBenchmark || 8000);

  // 5. 计算本机例均费用构成
  const actualAvgHours = matchedCases.length > 0
    ? +(matchedCases.reduce((s, c) => s + c.actualEquipmentHours, 0) / matchedCases.length).toFixed(1)
    : (group.dedicatedEquipment[0]?.standardHoursPerCase || 2.5);

  const allocatedEquipmentCostPerCase = Math.round(actualAvgHours * eqSummary.hourlyCostBenchmark);

  const actualAvgConsumableCostPerCase = alert?.actualAvgConsumablePerCase
    ? alert.actualAvgConsumablePerCase
    : matchedCases.length > 0
      ? Math.round(matchedCases.reduce((s, c) => s + c.actualConsumablesCost, 0) / matchedCases.length)
      : Math.round(groupAvgConsumableBenchmark * 1.25);

  const consumableExceedRate = groupAvgConsumableBenchmark > 0
    ? +(((actualAvgConsumableCostPerCase - groupAvgConsumableBenchmark) / groupAvgConsumableBenchmark) * 100).toFixed(1)
    : 0;

  // 6. 关联维保历史与分摊测算
  const maintenanceRecords = getEquipmentAssociatedMaintenanceRecords(equipmentInternalNo, equipmentList);
  const totalAnnualMaintenanceCost = maintenanceRecords.reduce((s, r) => s + (r.cost || 0), 0);
  // 年化测算开机总工时 (月度工时 * 12)
  const annualRunningHoursEstimated = Math.max(120, eqSummary.totalRunningHours * 12);
  const hourlyMaintenanceRate = +(totalAnnualMaintenanceCost / annualRunningHoursEstimated).toFixed(1);
  const allocatedMaintenanceCostPerCase = Math.round(hourlyMaintenanceRate * actualAvgHours);

  // 其他医疗总费 (药品、基础诊疗、麻醉、护理、床位等)
  const otherMedicalCostPerCase = matchedCases.length > 0
    ? Math.round(matchedCases.reduce((s, c) => s + c.otherMedicalCost, 0) / matchedCases.length)
    : Math.round(group.benchmarkPayment * 0.48);

  const actualTotalHospitalCostPerCase = 
    allocatedEquipmentCostPerCase + 
    actualAvgConsumableCostPerCase + 
    allocatedMaintenanceCostPerCase + 
    otherMedicalCostPerCase;

  const netBalancePerCase = group.benchmarkPayment - actualTotalHospitalCostPerCase;
  const isProfit = netBalancePerCase >= 0;

  // 7. 计算各项费用占总费用比重
  const total = Math.max(1, actualTotalHospitalCostPerCase);
  const consumablePercentage = +((actualAvgConsumableCostPerCase / total) * 100).toFixed(1);
  const equipmentDepreciationPercentage = +((allocatedEquipmentCostPerCase / total) * 100).toFixed(1);
  const maintenanceAllocationPercentage = +((allocatedMaintenanceCostPerCase / total) * 100).toFixed(1);
  const otherMedicalPercentage = +(100 - consumablePercentage - equipmentDepreciationPercentage - maintenanceAllocationPercentage).toFixed(1);

  // 8. 组装各专用耗材条目对比
  const consumableItems: DrgConsumableCostItem[] = (group.dedicatedConsumables || []).map((con, idx) => {
    // 依据超标偏差率动态估算本机在单病案的实际耗用量
    const varianceRatioMultiplier = 1 + (consumableExceedRate / 100);
    const actualAvgUsedRatio = +(con.standardRatioPerCase * (idx === 0 ? varianceRatioMultiplier : 1)).toFixed(2);
    const standardCost = Math.round(con.standardRatioPerCase * con.unitPrice);
    const actualCost = Math.round(actualAvgUsedRatio * con.unitPrice);
    const varianceRate = standardCost > 0 ? +(((actualCost - standardCost) / standardCost) * 100).toFixed(1) : 0;
    const impactAmount = actualCost - standardCost;

    return {
      consumableCode: con.consumableCode,
      consumableName: con.consumableName,
      brand: con.brand,
      spec: con.spec,
      unitPrice: con.unitPrice,
      medicalInsuranceCategory: con.medicalInsuranceCategory,
      reimbursementRatio: con.reimbursementRatio,
      standardExpectedRatio: con.standardRatioPerCase,
      actualAvgUsedRatio,
      unit: con.unit,
      isHighValue: con.isHighValue,
      actualAvgCost: actualCost,
      standardBenchmarkCost: standardCost,
      varianceRatePercent: varianceRate,
      costImpactAmount: impactAmount
    };
  });

  // 9. 智能归因排查结论与整改处置建议
  const rootCauseDiagnoses: string[] = [];
  const keyMaintenance = maintenanceRecords.find(r => r.isKeyRootCause);
  if (keyMaintenance && keyMaintenance.drgCorrelationNote) {
    rootCauseDiagnoses.push(keyMaintenance.drgCorrelationNote);
  }

  if (consumableExceedRate >= 30) {
    rootCauseDiagnoses.push(`【高危超标】该设备单机专耗支出高出病组均值 +${consumableExceedRate}%。病案抽查显示高值耗材开立数量超出临床路径标准限额，存在耗材破损换新或重复扫码风险。`);
  } else if (consumableExceedRate >= 15) {
    rootCauseDiagnoses.push(`【预警偏离】该设备例均专耗偏离基线 +${consumableExceedRate}%，建议比对同科室同类机型的耗用定额。`);
  }

  if (actualAvgHours > (group.dedicatedEquipment[0]?.standardHoursPerCase || 2.5) * 1.2) {
    rootCauseDiagnoses.push(`【机时延长】单病例平均开机时长(${actualAvgHours}h)超过标准路径(${(group.dedicatedEquipment[0]?.standardHoursPerCase || 2.5)}h)，导致分摊折旧上升并加剧附件磨损。`);
  }

  const suggestedAction = alert?.suggestedAction || 
    `组织医工科、手术室护士长与临床科主任联合现场核查，核验【${equipmentInternalNo}】近期维保修复部件运行工况，规范高值专耗领用双人复核制度。`;

  return {
    equipmentInternalNo,
    equipmentName: eqSummary.equipmentName,
    model: eqSummary.model,
    departmentName: eqSummary.departmentName,
    originalValue: eqSummary.originalValue,
    hourlyCostBenchmark: eqSummary.hourlyCostBenchmark,
    currentStatus: '正常运行',
    totalRunningHoursMonthly: eqSummary.totalRunningHours,

    drgCode,
    drgName: group.drgName,
    mdcName: `${group.mdcCode} · ${group.mdcName}`,
    weightPoints: group.weightPoints,
    benchmarkPayment: group.benchmarkPayment,
    targetAlosDays: group.targetAlosDays,
    standardHoursPerCase: group.dedicatedEquipment[0]?.standardHoursPerCase || 2.5,

    servedCaseCount,
    actualAvgHoursPerCase: actualAvgHours,
    allocatedEquipmentCostPerCase,
    actualAvgConsumableCostPerCase,
    groupAvgConsumableBenchmark,
    consumableExceedRatePercent: consumableExceedRate,
    allocatedMaintenanceCostPerCase,
    otherMedicalCostPerCase,
    actualTotalHospitalCostPerCase,
    netBalancePerCase,
    isProfit,

    consumablePercentage,
    equipmentDepreciationPercentage,
    maintenanceAllocationPercentage,
    otherMedicalPercentage,

    consumableItems,
    maintenanceRecords,
    totalAnnualMaintenanceCost,
    annualRunningHoursEstimated,
    hourlyMaintenanceRate,

    rootCauseDiagnoses,
    suggestedAction,
    associatedCases: matchedCases
  };
}

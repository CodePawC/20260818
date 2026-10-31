import { 
  DrgGroupMaster, 
  DrgCaseAuditRecord, 
  DedicatedEquipmentAuditSummary, 
  DrgAuditKpiMetrics,
  DrgAuditStatus,
  DedicatedConsumableMapping,
  DedicatedEquipmentMapping,
  DrgWarningAlert,
  DrgAlertLevel
} from '../types/drgTypes';

// ==================== 8组典型三甲医院高发DRG病组主数据 ====================
export const DEFAULT_DRG_GROUPS: DrgGroupMaster[] = [
  {
    id: 'DRG-FM19',
    drgCode: 'FM19',
    drgName: '复杂髋/膝关节置换术',
    mdcCode: 'MDCF',
    mdcName: '肌肉骨骼系统与结缔组织疾病',
    departmentName: '骨科',
    weightPoints: 2.85,
    benchmarkPayment: 48500,
    targetAlosDays: 7.5,
    status: 'active',
    notes: '国家集采人工关节落地重点病组。核心管控专机动力系统刀头与骨水泥加压套件，防范单病案过度记耗。',
    dedicatedEquipment: [
      {
        equipmentType: '骨科手术动力系统',
        matchedEquipmentNos: ['EQ-GK-001', 'EQ-GK-002'],
        machineHourlyCost: 280,
        standardHoursPerCase: 2.5,
        allowableHourVariance: 0.20
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C03080100100000000000000001',
        consumableName: '骨水泥高压灌注枪与搅拌套件',
        brand: '强生医疗',
        spec: '高压密闭型 60ml',
        unitPrice: 1680,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.85,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.1,
        unit: '套',
        isHighValue: true
      },
      {
        consumableCode: 'C03080200200000000000000002',
        consumableName: '微创骨科磨头刨刀刀具套包',
        brand: '施乐辉',
        spec: '高速球形 5.5mm',
        unitPrice: 920,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.80,
        standardRatioPerCase: 2.0,
        allowableVariance: 0.2,
        unit: '支',
        isHighValue: false
      }
    ]
  },
  {
    id: 'DRG-ET19',
    drgCode: 'ET19',
    drgName: '呼吸衰竭伴有创机械通气',
    mdcCode: 'MDCE',
    mdcName: '呼吸系统疾病与功能障碍',
    departmentName: '重症医学科(ICU)',
    weightPoints: 3.42,
    benchmarkPayment: 36800,
    targetAlosDays: 9.0,
    status: 'warning',
    notes: '生命支持类重症通气。专机开机时长长，须核实每日密闭吸痰管与呼气膜片更换频次与设备工时匹配。',
    dedicatedEquipment: [
      {
        equipmentType: '有创重症呼吸机',
        matchedEquipmentNos: ['EQ-ICU-003', 'EQ-ICU-004', 'EQ-ICU-005'],
        machineHourlyCost: 48,
        standardHoursPerCase: 72.0,
        allowableHourVariance: 0.35
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C08030100100000000000000003',
        consumableName: '一次性密闭式防逆流吸痰管',
        brand: '泰科医疗',
        spec: '成人型 12Fr 72小时',
        unitPrice: 135,
        medicalInsuranceCategory: 'A',
        reimbursementRatio: 1.0,
        standardRatioPerCase: 3.0,
        allowableVariance: 0.25,
        unit: '根',
        isHighValue: false
      },
      {
        consumableCode: 'C08030200200000000000000004',
        consumableName: '双加热丝呼吸机恒温管路湿化罐',
        brand: '费雪派克',
        spec: '成人生理呼吸环路',
        unitPrice: 420,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.90,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.1,
        unit: '套',
        isHighValue: false
      }
    ]
  },
  {
    id: 'DRG-LU19',
    drgCode: 'LU19',
    drgName: '终末期肾病维持性血液透析',
    mdcCode: 'MDCL',
    mdcName: '肾脏及泌尿系统疾病',
    departmentName: '肾内科',
    weightPoints: 1.15,
    benchmarkPayment: 6200,
    targetAlosDays: 3.0,
    status: 'active',
    notes: '高频慢性病门诊与住院透析。严格单机单人次计费，透析器与动静脉血路管理论值严格为 1:1。',
    dedicatedEquipment: [
      {
        equipmentType: '血液透析滤过机',
        matchedEquipmentNos: ['EQ-SN-001', 'EQ-SN-002', 'EQ-SN-003'],
        machineHourlyCost: 65,
        standardHoursPerCase: 4.0,
        allowableHourVariance: 0.15
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C04020100100000000000000005',
        consumableName: '聚砜膜高通量血液透析器',
        brand: '费森尤斯',
        spec: 'FX CorDiax 80 1.8m²',
        unitPrice: 210,
        medicalInsuranceCategory: 'A',
        reimbursementRatio: 1.0,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.05,
        unit: '支',
        isHighValue: false
      },
      {
        consumableCode: 'C04020200200000000000000006',
        consumableName: '体外循环动静脉血液管路及穿刺套件',
        brand: '百特医疗',
        spec: 'AV-Line 专用型',
        unitPrice: 88,
        medicalInsuranceCategory: 'A',
        reimbursementRatio: 1.0,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.05,
        unit: '套',
        isHighValue: false
      }
    ]
  },
  {
    id: 'DRG-BR19',
    drgCode: 'BR19',
    drgName: '急性脑梗死颅内动脉取栓介入术',
    mdcCode: 'MDCB',
    mdcName: '神经系统疾病与功能障碍',
    departmentName: '介入科',
    weightPoints: 4.88,
    benchmarkPayment: 69000,
    targetAlosDays: 10.0,
    status: 'warning',
    notes: '急诊高危绿色通道手术。DSA大C臂机时昂贵（620元/h），高值取栓支架与微导管易产生漏扫码或退库脱钩。',
    dedicatedEquipment: [
      {
        equipmentType: '数字减影血管造影机(DSA)',
        matchedEquipmentNos: ['EQ-DSA-001', 'EQ-DSA-002'],
        machineHourlyCost: 620,
        standardHoursPerCase: 2.2,
        allowableHourVariance: 0.30
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C02010100100000000000000007',
        consumableName: '颅内神经血管支架取栓装置',
        brand: '美敦力',
        spec: 'Solitaire Platinum 4mm×40mm',
        unitPrice: 12800,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.80,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.20,
        unit: '套',
        isHighValue: true
      },
      {
        consumableCode: 'C02010200200000000000000008',
        consumableName: '远端通路导引导管及超滑微导丝',
        brand: '史赛克',
        spec: '6F 115cm / 0.014in 200cm',
        unitPrice: 4650,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.85,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.15,
        unit: '套',
        isHighValue: true
      }
    ]
  },
  {
    id: 'DRG-DB19',
    drgCode: 'DB19',
    drgName: '腹腔镜下结直肠恶性肿瘤根治术',
    mdcCode: 'MDCD',
    mdcName: '消化系统疾病',
    departmentName: '胃肠外科',
    weightPoints: 3.12,
    benchmarkPayment: 42000,
    targetAlosDays: 8.5,
    status: 'active',
    notes: '4K超高清腹腔镜联合超声刀作业。重点审核超声刀刀头是否跨病案二次复用，以及腔镜吻合器计费一致性。',
    dedicatedEquipment: [
      {
        equipmentType: '4K超高清荧光腹腔镜系统',
        matchedEquipmentNos: ['EQ-WC-001', 'EQ-WC-002'],
        machineHourlyCost: 360,
        standardHoursPerCase: 3.5,
        allowableHourVariance: 0.25
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C03010100100000000000000009',
        consumableName: '超声高频外科集成止血剪切刀头',
        brand: '强生医疗',
        spec: 'HAR36 36cm弧形剪',
        unitPrice: 4200,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.85,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.10,
        unit: '把',
        isHighValue: true
      },
      {
        consumableCode: 'C03010200200000000000000010',
        consumableName: '内镜腔下切割吻合器及加固钉仓',
        brand: '美敦力',
        spec: 'Tri-Staple 60mm 金色/紫色',
        unitPrice: 2480,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.85,
        standardRatioPerCase: 2.0,
        allowableVariance: 0.20,
        unit: '套',
        isHighValue: true
      }
    ]
  },
  {
    id: 'DRG-HK19',
    drgCode: 'HK19',
    drgName: '经皮椎间孔镜下腰椎髓核摘除术',
    mdcCode: 'MDCH',
    mdcName: '肌肉骨骼与骨外科疾病',
    departmentName: '脊柱外科',
    weightPoints: 2.18,
    benchmarkPayment: 27500,
    targetAlosDays: 5.0,
    status: 'active',
    notes: '脊柱微创内镜日间手术方向。专机工时稳定（2.0h），重点监控低温等离子双极射频电极条码是否漏报。',
    dedicatedEquipment: [
      {
        equipmentType: '脊柱微创椎间孔镜系统',
        matchedEquipmentNos: ['EQ-JZ-001'],
        machineHourlyCost: 310,
        standardHoursPerCase: 2.0,
        allowableHourVariance: 0.20
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C03050100100000000000000011',
        consumableName: '低温等离子微创射频双极消融电极',
        brand: '杰西射频',
        spec: 'Spinendos 3.0mm 可弯曲',
        unitPrice: 3100,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.80,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.10,
        unit: '支',
        isHighValue: true
      }
    ]
  },
  {
    id: 'DRG-CV19',
    drgCode: 'CV19',
    drgName: '永久起搏器植入术与心内电生理',
    mdcCode: 'MDCC',
    mdcName: '循环系统疾病与心脏介入',
    departmentName: '心血管内科',
    weightPoints: 3.75,
    benchmarkPayment: 51000,
    targetAlosDays: 6.0,
    status: 'active',
    notes: '心脏电生理记录仪与起搏分析仪协同，高值起搏器与电极导线逐一扫码追踪，严防开机脱钩。',
    dedicatedEquipment: [
      {
        equipmentType: '心脏多道电生理记录仪',
        matchedEquipmentNos: ['EQ-XN-001', 'EQ-XN-002'],
        machineHourlyCost: 390,
        standardHoursPerCase: 2.2,
        allowableHourVariance: 0.20
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C02030100100000000000000012',
        consumableName: '可调弯十极心脏电生理标测导管',
        brand: '圣犹达/雅培',
        spec: 'Inquiry 6F 2-5-2mm',
        unitPrice: 2850,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.85,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.15,
        unit: '根',
        isHighValue: true
      }
    ]
  },
  {
    id: 'DRG-AE19',
    drgCode: 'AE19',
    drgName: '心肺衰竭体外膜肺氧合ECMO支持',
    mdcCode: 'MDCA',
    mdcName: '急性极危重症与生命支持',
    departmentName: '急诊重症科(EICU)',
    weightPoints: 8.65,
    benchmarkPayment: 135000,
    targetAlosDays: 14.0,
    status: 'deficit',
    notes: '重症终极救治。耗材昂贵，离心泵膜肺套包单套近3万元，设备长时间运转折旧极高，常处于成本警戒状态。',
    dedicatedEquipment: [
      {
        equipmentType: '体外膜肺氧合系统(ECMO)',
        matchedEquipmentNos: ['EQ-ECMO-001'],
        machineHourlyCost: 210,
        standardHoursPerCase: 120.0,
        allowableHourVariance: 0.40
      }
    ],
    dedicatedConsumables: [
      {
        consumableCode: 'C04010100100000000000000013',
        consumableName: '一次性离心泵头体外膜式氧合器套包',
        brand: '迈柯唯 (Getinge)',
        spec: 'PLS 预充一体化成套',
        unitPrice: 29500,
        medicalInsuranceCategory: 'B',
        reimbursementRatio: 0.70,
        standardRatioPerCase: 1.0,
        allowableVariance: 0.30,
        unit: '套',
        isHighValue: true
      }
    ]
  }
];

// ==================== 120+ 真实条码级病案核验流水生成器与初始集合 ====================
function generateInitialDrgCases(): DrgCaseAuditRecord[] {
  const doctors = ['李建华主任', '陈晓东副主任', '王秀芳主治', '张明华主任', '周伟副主任', '林晓峰副主任', '赵国强主任'];
  const patientSurnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '郑'];
  const patientSecond = ['建', '国', '秀', '德', '玉', '荣', '明', '华', '强', '海', '金', '宝', '振', '瑞', '文', '春', '秋', '梅', '兰', '芳'];
  
  const cases: DrgCaseAuditRecord[] = [];
  let recordCounter = 1;

  DEFAULT_DRG_GROUPS.forEach(drg => {
    // 每个病组分配 15-18 例病案，组合不同的质控状态
    const casesCount = drg.drgCode === 'FM19' || drg.drgCode === 'DB19' || drg.drgCode === 'LU19' ? 18 : 14;
    const eq = drg.dedicatedEquipment[0];
    const con = drg.dedicatedConsumables[0];

    for (let i = 0; i < casesCount; i++) {
      const caseNum = 202610000 + recordCounter;
      const patient = `${patientSurnames[recordCounter % patientSurnames.length]}*${patientSecond[(recordCounter * 3) % patientSecond.length]}`;
      const doctor = doctors[(recordCounter + i) % doctors.length];
      
      // 随机波动工时与住院天数
      const hourVariance = ((i % 5) - 2) * 0.08;
      const actualHours = Math.max(1, +(eq.standardHoursPerCase * (1 + hourVariance)).toFixed(1));
      const allocatedEqCost = Math.round(actualHours * eq.machineHourlyCost);
      const actualLos = Math.max(2, Math.round(drg.targetAlosDays + ((i % 4) - 1.5)));

      // 确定钩稽状态：80% 正常，7% 疑似漏记耗材，7% 计费脱钩，6% 耗材超标
      let status: DrgAuditStatus = 'normal';
      let conQty = con.standardRatioPerCase;
      let anomalyReason: string | undefined = undefined;
      let reconciliationAction: string | undefined = undefined;

      if (i === 3 || i === 11) {
        // 疑似漏记耗材：有设备工时但耗材数量记为0
        status = 'missing_consumable';
        conQty = 0;
        anomalyReason = `专机开机运行 ${actualHours} 小时，但在院内HIS计费中未检索到配套专耗【${con.consumableName}】扫码扣费记录。`;
        reconciliationAction = '通知科室核算员调取手麻系统UDI追溯记录，核实是否为扫码漏扫或延后补录，追回医保合规费用。';
      } else if (i === 6) {
        // 计费脱钩：有耗材收费但设备工时记为0或缺失日志
        status = 'missing_equipment_log';
        conQty = con.standardRatioPerCase;
        anomalyReason = `患者结算清单含高值专耗【${con.consumableName}】(¥${con.unitPrice})，但设备管理平台未抓取到【${eq.equipmentType}】开机机时日志。`;
        reconciliationAction = '排查设备物联网网关通信是否中断，或是否临时外借未做系统调拨流转，补录设备运行台账。';
      } else if (i === 9) {
        // 耗材超标：耗材数量大幅超出标准定额
        status = 'over_consumed';
        conQty = con.standardRatioPerCase * 2;
        anomalyReason = `单病案扫码领用【${con.consumableName}】${conQty} 套，超出三甲临床路径基准限额(${con.standardRatioPerCase}套)，偏差率 +100%。`;
        reconciliationAction = '组织医工处与质控办开展病历专家盲审，调取术中记录核验是否存在器械术中损坏换新，填报不良使用事件。';
      }

      const conCost = Math.round(conQty * con.unitPrice);
      // 其他诊疗费用
      const otherCost = Math.round((drg.benchmarkPayment * 0.45) + ((i % 7) * 450));
      const totalCost = allocatedEqCost + conCost + otherCost;
      const netBal = drg.benchmarkPayment - totalCost;

      const admissionDay = (i % 25) + 1;
      const dischargeDay = Math.min(30, admissionDay + actualLos);
      const admissionDate = `2026-10-${String(admissionDay).padStart(2, '0')}`;
      const dischargeDate = `2026-10-${String(dischargeDay).padStart(2, '0')}`;

      cases.push({
        id: `AUD-202610-${String(recordCounter).padStart(3, '0')}`,
        caseId: `ZY${caseNum}`,
        patientName: patient,
        drgCode: drg.drgCode,
        drgName: drg.drgName,
        departmentName: drg.departmentName,
        attendingDoctor: doctor,
        admissionDate,
        dischargeDate,
        losDays: actualLos,
        totalHospitalCost: totalCost,
        insurancePayment: drg.benchmarkPayment,
        actualEquipmentHours: actualHours,
        equipmentHourlyRate: eq.machineHourlyCost,
        allocatedEquipmentCost: allocatedEqCost,
        actualConsumablesCost: conCost,
        otherMedicalCost: otherCost,
        netBalance: netBal,
        equipmentInternalNo: eq.matchedEquipmentNos[i % eq.matchedEquipmentNos.length],
        equipmentModel: eq.equipmentType,
        consumableBarcode: conQty > 0 ? `UDI(01)0697${recordCounter}99(17)281031(10)LOT${20260900 + i}` : '无扫码记录',
        consumableQuantity: conQty,
        standardExpectedQuantity: con.standardRatioPerCase,
        auditStatus: status,
        anomalyReason,
        reconciliationAction,
        auditorName: '李思齐(医工质控员)',
        auditDate: dischargeDate
      });

      recordCounter++;
    }
  });

  return cases;
}

export const INITIAL_DRG_AUDIT_CASES: DrgCaseAuditRecord[] = generateInitialDrgCases();

// ==================== 专机视角的运营与专耗钩稽汇总生成函数 ====================
export function calculateEquipmentAuditSummaries(cases: DrgCaseAuditRecord[]): DedicatedEquipmentAuditSummary[] {
  const map = new Map<string, {
    internalNo: string;
    equipmentName: string;
    model: string;
    departmentName: string;
    totalHours: number;
    casesCount: number;
    allocatedCost: number;
    expectedConsumables: number;
    actualConsumables: number;
    revenueLoss: number;
    drgSet: Set<string>;
    hourlyCost: number;
  }>();

  // 设备原值与基准数据映射
  const equipSpecs: Record<string, { name: string; model: string; origVal: number; monthlyDep: number; hourly: number }> = {
    'EQ-GK-001': { name: '进口超声骨动力系统', model: 'Stryker TPS-5', origVal: 1280000, monthlyDep: 10600, hourly: 280 },
    'EQ-GK-002': { name: '关节镜微创动力主机', model: 'Smith&Nephew Dyonics', origVal: 960000, monthlyDep: 8000, hourly: 280 },
    'EQ-ICU-003': { name: '高端有创呼吸机A台', model: 'Hamilton G5', origVal: 480000, monthlyDep: 4000, hourly: 48 },
    'EQ-ICU-004': { name: '重症呼吸支持机B台', model: 'Dräger Evita V800', origVal: 520000, monthlyDep: 4300, hourly: 48 },
    'EQ-ICU-005': { name: '重症呼吸支持机C台', model: 'Mindray SV800', origVal: 380000, monthlyDep: 3160, hourly: 48 },
    'EQ-SN-001': { name: '血液透析滤过机01号', model: 'Fresenius 5008S', origVal: 320000, monthlyDep: 2660, hourly: 65 },
    'EQ-SN-002': { name: '血液透析滤过机02号', model: 'Fresenius 5008S', origVal: 320000, monthlyDep: 2660, hourly: 65 },
    'EQ-SN-003': { name: '血液透析滤过机03号', model: 'Baxter AK98', origVal: 280000, monthlyDep: 2330, hourly: 65 },
    'EQ-DSA-001': { name: '大C臂数字减影血管造影机', model: 'Siemens Artis Q', origVal: 8500000, monthlyDep: 70800, hourly: 620 },
    'EQ-DSA-002': { name: '介入治疗双向血管造影机', model: 'Philips Azurion 7', origVal: 9200000, monthlyDep: 76600, hourly: 620 },
    'EQ-WC-001': { name: '4K荧光超高清腹腔镜系统1号', model: 'Storz IMAGE1 S 4K', origVal: 2400000, monthlyDep: 20000, hourly: 360 },
    'EQ-WC-002': { name: '3D腹腔镜手术内窥镜系统2号', model: 'Olympus VISERA ELITE II', origVal: 2200000, monthlyDep: 18300, hourly: 360 },
    'EQ-JZ-001': { name: '微创脊柱椎间孔镜系统', model: 'Joimax TESSYS', origVal: 1850000, monthlyDep: 15400, hourly: 310 },
    'EQ-XN-001': { name: '多道心脏电生理记录仪', model: 'Boston Scientific LabSystem', origVal: 1980000, monthlyDep: 16500, hourly: 390 },
    'EQ-XN-002': { name: '心脏三维电生理标测系统', model: 'Biosense Webster CARTO 3', origVal: 3100000, monthlyDep: 25800, hourly: 390 },
    'EQ-ECMO-001': { name: '体外膜肺氧合机系统', model: 'Getinge Cardiohelp', origVal: 2900000, monthlyDep: 24100, hourly: 210 }
  };

  cases.forEach(c => {
    const no = c.equipmentInternalNo;
    const spec = equipSpecs[no] || { name: c.equipmentModel, model: c.equipmentModel, origVal: 1000000, monthlyDep: 8300, hourly: c.equipmentHourlyRate };
    
    if (!map.has(no)) {
      map.set(no, {
        internalNo: no,
        equipmentName: spec.name,
        model: spec.model,
        departmentName: c.departmentName,
        totalHours: 0,
        casesCount: 0,
        allocatedCost: 0,
        expectedConsumables: 0,
        actualConsumables: 0,
        revenueLoss: 0,
        drgSet: new Set<string>(),
        hourlyCost: spec.hourly
      });
    }

    const item = map.get(no)!;
    item.totalHours += c.actualEquipmentHours;
    item.casesCount += 1;
    item.allocatedCost += c.allocatedEquipmentCost;
    item.expectedConsumables += c.standardExpectedQuantity;
    item.actualConsumables += c.consumableQuantity;
    item.drgSet.add(c.drgCode);

    if (c.auditStatus === 'missing_consumable') {
      item.revenueLoss += (c.insurancePayment * 0.12); // 估算漏记损失
    }
  });

  return Array.from(map.entries()).map(([no, item]) => {
    const spec = equipSpecs[no] || { origVal: 1000000, monthlyDep: 8300 };
    const discRate = item.expectedConsumables > 0 
      ? +(((item.actualConsumables - item.expectedConsumables) / item.expectedConsumables) * 100).toFixed(1)
      : 0;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (Math.abs(discRate) > 15 || item.revenueLoss > 3000) {
      riskLevel = 'high';
    } else if (Math.abs(discRate) > 8 || item.revenueLoss > 0) {
      riskLevel = 'medium';
    }

    return {
      equipmentId: `EQID-${no}`,
      internalNo: no,
      equipmentName: item.equipmentName,
      model: item.model,
      departmentName: item.departmentName,
      originalValue: spec.origVal,
      monthlyDepreciation: spec.monthlyDep,
      hourlyCostBenchmark: item.hourlyCost,
      totalRunningHours: +item.totalHours.toFixed(1),
      servedCaseCount: item.casesCount,
      allocatedCostTotal: item.allocatedCost,
      associatedConsumableExpected: Math.round(item.expectedConsumables),
      associatedConsumableActual: Math.round(item.actualConsumables),
      consumableDiscrepancyRate: discRate,
      potentialRevenueLoss: Math.round(item.revenueLoss),
      auditRiskLevel: riskLevel,
      primaryDrgCodes: Array.from(item.drgSet)
    };
  });
}

// ==================== 工作台顶层全局KPI指标计算函数 ====================
export function calculateDrgAuditKpis(cases: DrgCaseAuditRecord[]): DrgAuditKpiMetrics {
  const totalAnalyzedCases = cases.length;
  const drgSet = new Set(cases.map(c => c.drgCode));
  
  let totalEqCost = 0;
  let totalConCost = 0;
  let totalHospitalIncome = 0;
  let netBalance = 0;
  let missingConsumableCount = 0;
  let missingEquipmentLogCount = 0;
  let overConsumedCount = 0;

  cases.forEach(c => {
    totalEqCost += c.allocatedEquipmentCost;
    totalConCost += c.actualConsumablesCost;
    totalHospitalIncome += c.insurancePayment;
    netBalance += c.netBalance;

    if (c.auditStatus === 'missing_consumable') missingConsumableCount++;
    if (c.auditStatus === 'missing_equipment_log') missingEquipmentLogCount++;
    if (c.auditStatus === 'over_consumed') overConsumedCount++;
  });

  const anomalyCount = missingConsumableCount + missingEquipmentLogCount + overConsumedCount;
  const consumablePerHundredIncome = totalHospitalIncome > 0 
    ? +((totalConCost / totalHospitalIncome) * 100).toFixed(2)
    : 0;

  const totalAllCost = cases.reduce((acc, c) => acc + c.totalHospitalCost, 0);
  const deviceCostPercent = totalAllCost > 0 
    ? +((totalEqCost / totalAllCost) * 100).toFixed(2)
    : 0;

  return {
    totalAnalyzedCases,
    totalDrgGroupsCount: drgSet.size,
    totalEquipmentAllocatedCost: totalEqCost,
    totalDedicatedConsumablesCost: totalConCost,
    consumablePerHundredIncome,
    deviceCostToTotalCostPercent: deviceCostPercent,
    insuranceNetBalanceTotal: netBalance,
    anomalyAuditCount: anomalyCount,
    missingConsumableCount,
    missingEquipmentLogCount,
    overConsumedCount,
    auditResolutionRate: 92.5 // 质控闭环整改达标率
  };
}

// ==================== 状态本地持久化辅助与操作 ====================
const STORAGE_KEY_DRG_CASES = 'med_drg_audit_cases_v1';

export function getStoredDrgCases(): DrgCaseAuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRG_CASES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load DRG audit cases from localStorage', e);
  }
  return INITIAL_DRG_AUDIT_CASES;
}

export function saveStoredDrgCases(cases: DrgCaseAuditRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DRG_CASES, JSON.stringify(cases));
  } catch (e) {
    console.error('Failed to save DRG audit cases to localStorage', e);
  }
}

export function resetStoredDrgCases(): DrgCaseAuditRecord[] {
  try {
    localStorage.removeItem(STORAGE_KEY_DRG_CASES);
  } catch (e) {}
  return INITIAL_DRG_AUDIT_CASES;
}

// ==================== 单机专耗超标与异常红黄预警自动检测引擎 ====================
const STORAGE_KEY_HANDLED_ALERTS = 'med_drg_handled_alerts_v1';

export function getHandledAlertRecords(): Record<string, { handled: boolean; remark: string; handledAt: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HANDLED_ALERTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

export function saveHandledAlertRecord(alertId: string, remark: string = '已核查并录入质控整改'): void {
  try {
    const records = getHandledAlertRecords();
    records[alertId] = {
      handled: true,
      remark,
      handledAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_HANDLED_ALERTS, JSON.stringify(records));
  } catch (e) {}
}

export function resetHandledAlertRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HANDLED_ALERTS);
  } catch (e) {}
}

/**
 * 自动比对单机耗材消耗 vs DRG病组平均基线水平
 * 自动识别超出病组平均的设备并生成红黄预警
 */
export function detectDrgEquipmentWarningAlerts(
  cases: DrgCaseAuditRecord[],
  groups: DrgGroupMaster[],
  equipmentSummaries: DedicatedEquipmentAuditSummary[]
): DrgWarningAlert[] {
  const handledRecords = getHandledAlertRecords();

  // 1. 计算每个DRG病组在当前病案集中的总体平均专耗支出
  const groupStatsMap = new Map<string, { totalConsumables: number; totalCases: number; drgName: string }>();
  groups.forEach(g => {
    groupStatsMap.set(g.drgCode, { totalConsumables: 0, totalCases: 0, drgName: g.drgName });
  });

  cases.forEach(c => {
    const item = groupStatsMap.get(c.drgCode);
    if (item) {
      item.totalConsumables += c.actualConsumablesCost;
      item.totalCases += 1;
    }
  });

  const alerts: DrgWarningAlert[] = [];

  // 2. 遍历各专机设备，计算该设备在对应病组中的平均耗材支出
  equipmentSummaries.forEach(eq => {
    const eqCases = cases.filter(c => c.equipmentInternalNo === eq.internalNo);
    if (eqCases.length === 0) return;

    const primaryDrg = eq.primaryDrgCodes[0] || eqCases[0].drgCode;
    const groupStat = groupStatsMap.get(primaryDrg);
    if (!groupStat || groupStat.totalCases === 0) return;

    const groupBenchmarkAvg = Math.round(groupStat.totalConsumables / groupStat.totalCases);
    const eqCasesInGroup = eqCases.filter(c => c.drgCode === primaryDrg);
    if (eqCasesInGroup.length === 0) return;

    const eqTotalConsumable = eqCasesInGroup.reduce((acc, c) => acc + c.actualConsumablesCost, 0);
    const eqAvgConsumable = Math.round(eqTotalConsumable / eqCasesInGroup.length);

    // 计算超出比例 (%)
    const exceedRate = groupBenchmarkAvg > 0 
      ? +(((eqAvgConsumable - groupBenchmarkAvg) / groupBenchmarkAvg) * 100).toFixed(1)
      : 0;

    const hasSevereLeak = eq.potentialRevenueLoss >= 3000;
    const hasMissingLogs = eqCases.some(c => c.auditStatus === 'missing_equipment_log');

    // 判定红黄预警等级
    // 红色高危预警：单机例均专耗超出病组平均 > 30%，或存在大额疑似漏记费
    // 黄色预警偏离：单机例均专耗超出病组平均 15% ~ 30%
    if (exceedRate >= 30 || hasSevereLeak) {
      const alertId = `ALT-RED-${eq.internalNo}-${primaryDrg}`;
      const handledInfo = handledRecords[alertId];

      alerts.push({
        id: alertId,
        equipmentId: eq.equipmentId,
        internalNo: eq.internalNo,
        equipmentName: eq.equipmentName,
        departmentName: eq.departmentName,
        drgCode: primaryDrg,
        drgName: groupStat.drgName,
        alertLevel: 'red',
        alertType: exceedRate >= 30 ? 'over_group_average' : 'missing_consumable_leak',
        actualAvgConsumablePerCase: eqAvgConsumable,
        groupAvgConsumableBenchmark: groupBenchmarkAvg,
        exceedRatePercent: exceedRate,
        detectedAt: '2026-10-22 08:30',
        handled: !!handledInfo?.handled,
        handleRemark: handledInfo?.remark,
        suggestedAction: exceedRate >= 30 
          ? `单机例均耗材(¥${eqAvgConsumable.toLocaleString()})严重高出病组均值(¥${groupBenchmarkAvg.toLocaleString()}) +${exceedRate}%。请医工处与科主任联合核验该机台是否存在术中器械破损、刀头过度报废或规格错选。`
          : `该设备存在 ¥${eq.potentialRevenueLoss.toLocaleString()} 的疑似未扫码漏记费风险，请核查手麻系统与HIS计费勾稽台账，限期补录追回。`
      });
    } else if (exceedRate >= 15 || hasMissingLogs) {
      const alertId = `ALT-AMBER-${eq.internalNo}-${primaryDrg}`;
      const handledInfo = handledRecords[alertId];

      alerts.push({
        id: alertId,
        equipmentId: eq.equipmentId,
        internalNo: eq.internalNo,
        equipmentName: eq.equipmentName,
        departmentName: eq.departmentName,
        drgCode: primaryDrg,
        drgName: groupStat.drgName,
        alertLevel: 'amber',
        alertType: exceedRate >= 15 ? 'over_group_average' : 'decoupled_log',
        actualAvgConsumablePerCase: eqAvgConsumable,
        groupAvgConsumableBenchmark: groupBenchmarkAvg,
        exceedRatePercent: exceedRate,
        detectedAt: '2026-10-22 09:15',
        handled: !!handledInfo?.handled,
        handleRemark: handledInfo?.remark,
        suggestedAction: exceedRate >= 15
          ? `单机例均耗材超出病组平均 +${exceedRate}%，建议组织科室护士长核实专耗开立规范，对比同科室同类机型磨损差异。`
          : '部分病案存在扫码计费但缺少专机开机时长记录，请核查物联网传感器通信是否正常。'
      });
    }
  });

  return alerts;
}


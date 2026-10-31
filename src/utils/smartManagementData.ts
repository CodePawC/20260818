import { SmartManagementRatingMetric, HisPacsLinkageRecord, FloorSpaceTopology, EmergencySimulationScenario } from '../types';

// ==================== 国家卫健委《医院智慧管理分级评估标准体系》1-5级指标基准 ====================
export const DEFAULT_SMART_MANAGEMENT_METRICS: SmartManagementRatingMetric[] = [
  // 1 级：建立资产设备基础信息数据库
  {
    id: 'SM-L1-01',
    level: 1,
    category: '资产账目电子化',
    name: '医疗设备一机一档电子化台账',
    standardRequirement: '建立全院医疗设备资产卡片，包含设备名称、规格型号、出厂编号、采购原值、在用状态及科室归属等基础信息。',
    maxScore: 10,
    actualScore: 10,
    status: 'fully_compliant',
    evidenceProof: '设备技术台账全面实现一机一档，全院1,602台在册设备档案完备，支持草料二维码与出厂SN多维索引。'
  },
  {
    id: 'SM-L1-02',
    level: 1,
    category: '资产账目电子化',
    name: '基础入库验收与报废初审记录',
    standardRequirement: '具备设备采购到货验收入库登记与报废申请信息化记录。',
    maxScore: 10,
    actualScore: 10,
    status: 'fully_compliant',
    evidenceProof: '具备《全生命周期设备验收单》与《国有资产报废技术鉴定多方联签》，支持五方线上电子签署。'
  },

  // 2 级：部门内部初步业务协同
  {
    id: 'SM-L2-01',
    level: 2,
    category: '部门内部协同',
    name: '设备报修与工单维修在线化流转',
    standardRequirement: '临床科室可线上发起设备故障报修，工程部门可在线派工、接单、填写维修过程及配件消耗。',
    maxScore: 15,
    actualScore: 15,
    status: 'fully_compliant',
    evidenceProof: '医工智能派工调度中心直通草料扫码报修与院内工单，支持工单阶段看板、配件出库与结单验收闭环。'
  },
  {
    id: 'SM-L2-02',
    level: 2,
    category: '部门内部协同',
    name: '预防性维护(PM)与强检排程提醒',
    standardRequirement: '系统可根据检定周期与保养规程自动生成PM排程，并提前发送超期预警。',
    maxScore: 15,
    actualScore: 15,
    status: 'fully_compliant',
    evidenceProof: '维保强检计划模块严格对标22类计量目录，具有动态红黄牌超期报警，直通法定检定机构流转。'
  },

  // 3 级：跨部门业务联动与移动物联网应用
  {
    id: 'SM-L3-01',
    level: 3,
    category: '移动物联网协同',
    name: '移动终端扫码巡检与动态在位纠偏',
    standardRequirement: '支持使用移动端（PDA/企业微信）扫码巡查设备状态、校核实际物理存放科室位置并即时纠偏。',
    maxScore: 20,
    actualScore: 20,
    status: 'fully_compliant',
    evidenceProof: '移动巡检盘点模块深度集成手机扫码识别，实时比对系统登记科室与实际在位科室，一键发起在位纠偏。'
  },
  {
    id: 'SM-L3-02',
    level: 3,
    category: '移动物联网协同',
    name: '急救生命支持机具全院跨科室应急借调共享',
    standardRequirement: '全院急救与生命支持设备（呼吸机、除颤仪、监护仪）建立共享资源池，支持跨科室即时借调与借还归还追踪。',
    maxScore: 20,
    actualScore: 18,
    status: 'fully_compliant',
    evidenceProof: '应急调配中心已纳管48台急救机具，支持电子借用凭单与归还验收，已满足三级医院急救互援要求。'
  },

  // 4 级：全院级数据集成与质控经济学闭环 (当前攻坚核心)
  {
    id: 'SM-L4-01',
    level: 4,
    category: 'HIS/PACS集成闭环',
    name: 'HIS收费与大型设备检查数据自动钩稽比对',
    standardRequirement: '将HIS计费流水与PACS/RIS/LIS设备实际运行曝光次数或检测样本数自动对齐，发现漏记费或异常计费。',
    maxScore: 25,
    actualScore: 22,
    status: 'partially_compliant',
    evidenceProof: '已建成HIS/PACS接口联调中枢，支持检查序列与收费代码实时对齐，自动标识无扫描计费及漏费风险。',
    gapDescription: '夜间部分急诊床旁彩超与急诊检验条码的自动对齐率需进一步压实至99.5%以上。',
    rectificationPlan: '升级专机专耗与急诊绿色通道自动对齐校验逻辑，缩短接口同步窗口至5分钟。'
  },
  {
    id: 'SM-L4-02',
    level: 4,
    category: 'HIS/PACS集成闭环',
    name: '单机成本效益(ROI)与折旧精细化核算',
    standardRequirement: '结合HIS收入、维修折旧支出、耗材专用成本，实现百万元以上大型设备单机保本点与ROI月度动态测算。',
    maxScore: 25,
    actualScore: 24,
    status: 'fully_compliant',
    evidenceProof: '单机效益核算与DRG专耗核算模块运行稳健，已对西门子64排CT、GE 1.5T磁共振实现精准收支保本测算。'
  },
  {
    id: 'SM-L4-03',
    level: 4,
    category: 'HIS/PACS集成闭环',
    name: '外协维保第三方三方审价与费用直通核销',
    standardRequirement: '外协维修与供应商报价、科室多方联审、发票核销及财务支付实现全流程可追溯。',
    maxScore: 20,
    actualScore: 20,
    status: 'fully_compliant',
    evidenceProof: '外协维修协同模块具备供应商门户、多科室联合议价、发票查验及一案一档归档机制。'
  },

  // 5 级：集团化大数据孪生与AI辅助预测维保
  {
    id: 'SM-L5-01',
    level: 5,
    category: '大数据AI运营',
    name: '全院设备空间数字孪生与应急动员推演沙盘',
    standardRequirement: '实现全院建筑空间多楼层设备状态数字孪生映射，支持重大公共突发事件生命支持机具最优调度演练。',
    maxScore: 30,
    actualScore: 26,
    status: 'partially_compliant',
    evidenceProof: '已部署全院楼层拓扑沙盘，支持急诊大楼、住院一部、住院二部及医技楼高密度状态呈现与应急推演模拟。',
    gapDescription: '物联网蓝牙/LoRa传感器离线状态下的信号补偿算法正在进一步训练优化。',
    rectificationPlan: '结合医工巡检动线自动插值，完善数字孪生设备坐标漂移自动校准。'
  },
  {
    id: 'SM-L5-02',
    level: 5,
    category: '大数据AI运营',
    name: '基于大模型的故障失效机理推理与预测性维保',
    standardRequirement: '运用人工智能/大语言模型结合设备年限、故障波形与历史工单，输出失效机理解析与预防性维护处方。',
    maxScore: 30,
    actualScore: 28,
    status: 'fully_compliant',
    evidenceProof: '集成 Gemini 3.8 Flash 临床工程大模型，实现深度故障树推演、备件寿命预警与三甲质控返厂报告自动生成。'
  }
];

// ==================== HIS/PACS 接口钩稽流水模拟数据集 ====================
export const INITIAL_HIS_PACS_RECORDS: HisPacsLinkageRecord[] = [
  {
    id: 'LINK-20261029-001',
    timestamp: '2026-10-29 08:14:22',
    equipmentId: 'EQ-002',
    equipmentName: '西门子 64排螺旋CT (SOMATOM Definition AS)',
    department: '医学影像科',
    modality: 'CT',
    patientStudyUid: 'ST-20261029-8831',
    examItemName: '头颅平扫 + 颅脑CTA血管成像',
    hisChargeCode: '310201015-CTA',
    hisBilledFee: 860.00,
    pacsExposureCount: 4,
    actualWorkMinutes: 12,
    reconciliationStatus: 'matched',
    discrepancyAmount: 0,
    remark: 'HIS收费与PACS扫描序列严格一致，造影剂专机专耗已同步扣减'
  },
  {
    id: 'LINK-20261029-002',
    timestamp: '2026-10-29 08:35:10',
    equipmentId: 'EQ-002',
    equipmentName: '西门子 64排螺旋CT (SOMATOM Definition AS)',
    department: '医学影像科',
    modality: 'CT',
    patientStudyUid: 'ST-20261029-8846',
    examItemName: '胸部高分辨低剂量平扫CT (急诊加急)',
    hisChargeCode: '310201011-EMERG',
    hisBilledFee: 0.00,
    pacsExposureCount: 2,
    actualWorkMinutes: 6,
    reconciliationStatus: 'unbilled_exposure',
    discrepancyAmount: -280.00,
    remark: '【潜在漏记费预警】PACS 已产生曝光图像2组，但HIS门诊急诊挂账计费未生成，已自动抄送护士长核实'
  },
  {
    id: 'LINK-20261029-003',
    timestamp: '2026-10-29 08:52:45',
    equipmentId: 'EQ-004',
    equipmentName: 'GE 1.5T 超导磁共振 (SIGNA Explorer)',
    department: '医学影像科',
    modality: 'MR',
    patientStudyUid: 'ST-20261029-8859',
    examItemName: '腰椎间盘平扫 + 矢状位压脂序列',
    hisChargeCode: '310202012',
    hisBilledFee: 580.00,
    pacsExposureCount: 6,
    actualWorkMinutes: 22,
    reconciliationStatus: 'matched',
    discrepancyAmount: 0,
    remark: '射频功放与梯度线圈温度正常，检查报告已由主检医师签发'
  },
  {
    id: 'LINK-20261029-004',
    timestamp: '2026-10-29 09:12:00',
    equipmentId: 'EQ-004',
    equipmentName: 'GE 1.5T 超导磁共振 (SIGNA Explorer)',
    department: '医学影像科',
    modality: 'MR',
    patientStudyUid: 'ST-20261029-8872',
    examItemName: '膝关节MRI增强 (未做扫描但发生计费)',
    hisChargeCode: '310202015-ENH',
    hisBilledFee: 720.00,
    pacsExposureCount: 0,
    actualWorkMinutes: 0,
    reconciliationStatus: 'billed_without_pacs',
    discrepancyAmount: 720.00,
    remark: '【异常收费风险】患者因幽闭恐惧中途放弃检查，HIS计费退费单未及时撤销，需退费冲销'
  },
  {
    id: 'LINK-20261029-005',
    timestamp: '2026-10-29 09:28:19',
    equipmentId: 'EQ-001',
    equipmentName: '迈瑞病人监护仪 (BeneView T8)',
    department: '重症医学科',
    modality: 'MONITOR',
    patientStudyUid: 'MON-ICU-BED03-29',
    examItemName: '重症床旁多参数生命体征连续监护 (24h)',
    hisChargeCode: '120100010',
    hisBilledFee: 240.00,
    pacsExposureCount: 1,
    actualWorkMinutes: 1440,
    reconciliationStatus: 'matched',
    discrepancyAmount: 0,
    remark: '心电、有创动脉压、SpO2及呼末CO2模块连续运转正常'
  },
  {
    id: 'LINK-20261029-006',
    timestamp: '2026-10-29 09:44:30',
    equipmentId: 'EQ-003',
    equipmentName: '德尔格有创呼吸机 (Evita Infinity V500)',
    department: '重症医学科',
    modality: 'VENTILATOR',
    patientStudyUid: 'VENT-ICU-BED07-11',
    examItemName: '机械通气治疗 (急危重症有创通气)',
    hisChargeCode: '310502001',
    hisBilledFee: 360.00,
    pacsExposureCount: 1,
    actualWorkMinutes: 720,
    reconciliationStatus: 'matched',
    discrepancyAmount: 0,
    remark: '氧电池与呼气阀回路阻抗符合质控标准'
  },
  {
    id: 'LINK-20261029-007',
    timestamp: '2026-10-29 10:05:14',
    equipmentId: 'EQ-005',
    equipmentName: '飞利浦大平板血管造影机 (Allura Xper FD20)',
    department: '心血管介入导管室',
    modality: 'DSA',
    patientStudyUid: 'DSA-CATH-20261029-03',
    examItemName: '急诊冠状动脉造影 + 支架植入术(PCI)',
    hisChargeCode: '330300001',
    hisBilledFee: 2800.00,
    pacsExposureCount: 18,
    actualWorkMinutes: 58,
    reconciliationStatus: 'matched',
    discrepancyAmount: 0,
    remark: '球管累积热容量达标，术中造影剂与球囊耗材条码已核销'
  },
  {
    id: 'LINK-20261029-008',
    timestamp: '2026-10-29 10:18:40',
    equipmentId: 'EQ-002',
    equipmentName: '西门子 64排螺旋CT (SOMATOM Definition AS)',
    department: '医学影像科',
    modality: 'CT',
    patientStudyUid: 'ST-20261029-8898',
    examItemName: '全腹部平扫 + 骨盆三维重建',
    hisChargeCode: '310201012',
    hisBilledFee: 420.00,
    pacsExposureCount: 3,
    actualWorkMinutes: 9,
    reconciliationStatus: 'matched',
    discrepancyAmount: 0,
    remark: '正常计费归档，三维重建工作站渲染完成'
  }
];

// ==================== 全院建筑空间楼层数字孪生拓扑 ====================
export const DEFAULT_FLOOR_TOPOLOGY: FloorSpaceTopology[] = [
  {
    buildingCode: 'HQ-EMERGENCY',
    buildingName: '急诊急救综合楼',
    floor: 1,
    floorLabel: '1F 急诊大厅 & 急诊抢救室',
    departments: ['急诊科', '急诊抢救室', '急诊ICU(EICU)'],
    totalEquipmentCount: 68,
    runningCount: 58,
    faultyCount: 2,
    idleCount: 8,
    devices: [
      { id: 'EQ-001', name: '迈瑞病人监护仪 (BeneView T8)', model: 'BeneView T8', category: '医用诊察和监护器械', department: '急诊抢救室', buildingCode: 'HQ-EMERGENCY', buildingName: '急诊急救综合楼', floor: 1, roomName: '抢救床01', status: 'running', loadRatio: 92, isLifeSupport: true, batteryLevel: 100, sn: 'MR-BENEVIEW-T8-001' },
      { id: 'EQ-EM-01', name: '卓尔双相波除颤监护仪 (ZOLL R Series)', model: 'R Series ALS', category: '呼吸、麻醉和急救器械', department: '急诊抢救室', buildingCode: 'HQ-EMERGENCY', buildingName: '急诊急救综合楼', floor: 1, roomName: '移动抢救车01', status: 'idle', loadRatio: 25, isLifeSupport: true, batteryLevel: 98, sn: 'ZOLL-R-2022-09' },
      { id: 'EQ-EM-02', name: '迈瑞转运呼吸机 (SynoVent E3)', model: 'SynoVent E3', category: '呼吸、麻醉和急救器械', department: '急诊抢救室', buildingCode: 'HQ-EMERGENCY', buildingName: '急诊急救综合楼', floor: 1, roomName: '急救转运舱', status: 'idle', loadRatio: 18, isLifeSupport: true, batteryLevel: 95, sn: 'MR-SYN-E3-2021-12' },
      { id: 'EQ-EM-03', name: '贝克曼急诊干式生化分析仪', model: 'StatFax 4500', category: '临床检验器械', department: '急诊科', buildingCode: 'HQ-EMERGENCY', buildingName: '急诊急救综合楼', floor: 1, roomName: '急诊床旁POCT室', status: 'running', loadRatio: 84, isLifeSupport: false, sn: 'BECK-SF-4500-01' }
    ]
  },
  {
    buildingCode: 'HQ-EMERGENCY',
    buildingName: '急诊急救综合楼',
    floor: 3,
    floorLabel: '3F 重症医学科 (ICU)',
    departments: ['重症医学科', '重症监护病房'],
    totalEquipmentCount: 94,
    runningCount: 86,
    faultyCount: 1,
    idleCount: 7,
    devices: [
      { id: 'EQ-003', name: '德尔格有创呼吸机 (Evita Infinity V500)', model: 'Evita Infinity V500', category: '呼吸、麻醉和急救器械', department: '重症医学科', buildingCode: 'HQ-EMERGENCY', buildingName: '急诊急救综合楼', floor: 3, roomName: 'ICU病房03床', status: 'running', loadRatio: 96, isLifeSupport: true, batteryLevel: 100, sn: 'DRAGER-V500-2021-08' },
      { id: 'EQ-ICU-02', name: '百特连续性血液净化床旁血滤机 (Prismaflex)', model: 'Prismaflex v8.0', category: '输血、透析和体外循环器械', department: '重症医学科', buildingCode: 'HQ-EMERGENCY', buildingName: '急诊急救综合楼', floor: 3, roomName: 'CRRT专用监护单元', status: 'running', loadRatio: 88, isLifeSupport: true, sn: 'BAX-PRISMA-882' },
      { id: 'EQ-ICU-03', name: '迈瑞输液泵工作站 (BeneFusion CS)', model: 'BeneFusion CS', category: '注输、护理和防护器械', department: '重症医学科', buildingCode: 'HQ-EMERGENCY', buildingName: '急诊急救综合楼', floor: 3, roomName: 'ICU病房05床', status: 'running', loadRatio: 78, isLifeSupport: true, sn: 'MR-BF-CS-2022-04' }
    ]
  },
  {
    buildingCode: 'HQ-MEDTECH',
    buildingName: '门诊医技大楼',
    floor: 1,
    floorLabel: '1F 医学影像科 & 放射科机房',
    departments: ['医学影像科', '放射科', 'CT/MRI室'],
    totalEquipmentCount: 42,
    runningCount: 38,
    faultyCount: 1,
    idleCount: 3,
    devices: [
      { id: 'EQ-002', name: '西门子 64排螺旋CT (SOMATOM Definition AS)', model: 'SOMATOM Definition AS', category: '医用成像器械', department: '医学影像科', buildingCode: 'HQ-MEDTECH', buildingName: '门诊医技大楼', floor: 1, roomName: 'CT 1号扫描间', status: 'running', loadRatio: 89, isLifeSupport: false, sn: 'SOMATOM-DEF-AS-2019-09' },
      { id: 'EQ-004', name: 'GE 1.5T 超导磁共振 (SIGNA Explorer)', model: 'SIGNA Explorer 1.5T', category: '医用成像器械', department: '医学影像科', buildingCode: 'HQ-MEDTECH', buildingName: '门诊医技大楼', floor: 1, roomName: 'MRI 1号屏蔽室', status: 'running', loadRatio: 82, isLifeSupport: false, sn: 'GE-SIGNA-15T-2020-05' },
      { id: 'EQ-RAD-03', name: '联影悬吊双立柱数码摄影DR (uDR 770i)', model: 'uDR 770i', category: '医用成像器械', department: '医学影像科', buildingCode: 'HQ-MEDTECH', buildingName: '门诊医技大楼', floor: 1, roomName: 'DR 2号拍片室', status: 'idle', loadRatio: 35, isLifeSupport: false, sn: 'UI-UDR-770-2023' }
    ]
  },
  {
    buildingCode: 'HQ-INPATIENT-1',
    buildingName: '住院一部',
    floor: 4,
    floorLabel: '4F 麻醉手术中心 (OR)',
    departments: ['麻醉手术科', '日间手术中心'],
    totalEquipmentCount: 76,
    runningCount: 68,
    faultyCount: 2,
    idleCount: 6,
    devices: [
      { id: 'EQ-006', name: '强生超声高频外科集成手术系统 (GEN11)', model: 'Ethicon GEN11', category: '有源手术器械', department: '麻醉手术科', buildingCode: 'HQ-INPATIENT-1', buildingName: '住院一部', floor: 4, roomName: '百级手术间01', status: 'running', loadRatio: 85, isLifeSupport: true, sn: 'JNJ-GEN11-2021-03' },
      { id: 'EQ-OR-02', name: '德尔格高端麻醉工作站 (Perseus A500)', model: 'Perseus A500', category: '呼吸、麻醉和急救器械', department: '麻醉手术科', buildingCode: 'HQ-INPATIENT-1', buildingName: '住院一部', floor: 4, roomName: '百级手术间02', status: 'running', loadRatio: 90, isLifeSupport: true, sn: 'DRAGER-PER-A500-11' },
      { id: 'EQ-OR-03', name: '奥林巴斯高清电子腹腔镜系统 (VISERA ELITE II)', model: 'OTV-S300', category: '医用内窥镜器械', department: '麻醉手术科', buildingCode: 'HQ-INPATIENT-1', buildingName: '住院一部', floor: 4, roomName: '腔镜手术间05', status: 'idle', loadRatio: 40, isLifeSupport: false, sn: 'OLY-VIS-S300-88' }
    ]
  }
];

// ==================== 应急调配推演预设场景 ====================
export const PRESET_EMERGENCY_SCENARIOS: EmergencySimulationScenario[] = [
  {
    id: 'SIM-RESP-01',
    title: '突发重症呼吸窘迫群体救治·全院生命支持呼吸机紧急征集演练',
    triggerCause: '模拟周边发生突发公共卫生事件或重度化学气体泄漏，预计20分钟内送达重度呼吸衰竭患者8-12名。',
    targetNeedCount: 6,
    deviceCategory: '急救转运呼吸机 / 高端有创呼吸机',
    targetDepartment: '急诊抢救室 / 重症医学科',
    estimatedMobilizeMinutes: 14,
    sourceDepartments: [
      { department: '应急调配中心 (设备科库房)', availableCount: 3, proposedBorrowCount: 3, safetyReserveRemaining: 0 },
      { department: '呼吸与危重症医学科 (普通病区)', availableCount: 4, proposedBorrowCount: 2, safetyReserveRemaining: 2 },
      { department: '日间手术中心 (备用间)', availableCount: 2, proposedBorrowCount: 1, safetyReserveRemaining: 1 }
    ],
    steps: [
      { phase: '阶段一：警报触发与余量核验', description: '系统自动锁定量取各科室闲置呼吸机，验证氧电池电量>80%、回路已消毒完备。', actionType: 'check', durationMin: 2 },
      { phase: '阶段二：跨楼宇智能派工调度', description: '通过企业微信协同工单下达至值班医工工程师，自动规划急诊大楼至住院部最短物流动线。', actionType: 'dispatch', durationMin: 4 },
      { phase: '阶段三：实物交接与在位纠偏', description: '医工携机具到位，接收科室责任护士扫码验视并在位流转，系统自动生成临时借调凭单。', actionType: 'transfer', durationMin: 5 },
      { phase: '阶段四：自检通气与联签确认', description: '现场连接中心供气终端完成气密性自检，两科室主任完成电子联合签章。', actionType: 'signoff', durationMin: 3 }
    ]
  },
  {
    id: 'SIM-CT-02',
    title: '医学影像科主力64排CT突发高压打火·门急诊影像分流保畅沙盘推演',
    triggerCause: '模拟西门子64排CT突发球管逆变故障停机，门急诊每日180人次胸腹部CT面临挤压风险。',
    targetNeedCount: 1,
    deviceCategory: '大型影像诊断设备',
    targetDepartment: '医学影像科 (分流至DR与急诊CT专用通道)',
    estimatedMobilizeMinutes: 8,
    sourceDepartments: [
      { department: '门诊医技大楼 (备用DR及超声机房)', availableCount: 2, proposedBorrowCount: 1, safetyReserveRemaining: 1 },
      { department: '五莲县人民医院东院区联动机房', availableCount: 1, proposedBorrowCount: 1, safetyReserveRemaining: 0 }
    ],
    steps: [
      { phase: '阶段一：故障熔断与患者队列分流', description: 'HIS/PACS 自动暂停该设备挂号通道，将平诊患者预约自动平移至院内另一组CT并短信知会。', actionType: 'check', durationMin: 2 },
      { phase: '阶段二：急危重症绿色通道切换', description: '急诊危重胸腹创伤患者启动床旁彩超与快速DR先行排查，优先保障卒中/胸痛中心时效。', actionType: 'dispatch', durationMin: 3 },
      { phase: '阶段三：原厂工程师远程介入与备件调拨', description: '西门子原厂服务中心远程调取球管电弧日志，从济南备件仓急调逆变电源模块。', actionType: 'transfer', durationMin: 3 }
    ]
  }
];

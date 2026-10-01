import {
  EngineeringWorkOrder,
  BiomedicalEngineerProfile,
  PriorityLevel,
  WorkOrderType,
  WorkOrderStatus,
  BiomedicalGroup,
  FaultCategory,
  MttrKpiStats
} from '../types/dispatchTypes';

export const SLA_RESPONSE_LIMITS: Record<PriorityLevel, number> = {
  P1_CRITICAL: 15,   // 15 分钟
  P2_URGENT: 30,     // 30 分钟
  P3_STANDARD: 120,  // 2 小时 (120分钟)
  P4_PLANNED: 1440   // 24 小时 (1440分钟)
};

export const SLA_REPAIR_LIMITS: Record<PriorityLevel, number> = {
  P1_CRITICAL: 2,   // 2 小时
  P2_URGENT: 4,     // 4 小时
  P3_STANDARD: 24,  // 24 小时
  P4_PLANNED: 48    // 48 小时
};

export const DEFAULT_BIOMEDICAL_ENGINEERS: BiomedicalEngineerProfile[] = [
  {
    id: 'ENG-01',
    employeeNo: 'EMP-8001',
    name: '崔伟',
    group: '急救生命支持技术组',
    title: '主管工程师 / 技术科长',
    phone: '13863373257',
    avatarColor: 'bg-indigo-600',
    status: 'idle',
    currentWOCount: 0,
    monthClosedCount: 28,
    avgMttrHours: 1.25,
    firstTimeFixRate: 96.4,
    avgSatisfactionScore: 4.98,
    specialties: ['呼吸机', '除颤仪', '麻醉机', 'ECMO体外生命支持', '电气安全质控']
  },
  {
    id: 'ENG-02',
    employeeNo: 'EMP-8002',
    name: '李晓峰',
    group: '急救生命支持技术组',
    title: '资深维保工程师',
    phone: '13963381121',
    avatarColor: 'bg-blue-600',
    status: 'busy',
    currentWOCount: 1,
    monthClosedCount: 24,
    avgMttrHours: 1.45,
    firstTimeFixRate: 91.7,
    avgSatisfactionScore: 4.92,
    specialties: ['监护仪', '输液泵', '除颤仪', '起搏器', '血液净化CRRT']
  },
  {
    id: 'ENG-03',
    employeeNo: 'EMP-8003',
    name: '孙志强',
    group: '大型放射影像技术组',
    title: '副主任工程师 / 影像组长',
    phone: '13963381120',
    avatarColor: 'bg-amber-600',
    status: 'busy',
    currentWOCount: 1,
    monthClosedCount: 19,
    avgMttrHours: 2.65,
    firstTimeFixRate: 89.5,
    avgSatisfactionScore: 4.95,
    specialties: ['64排及以上CT', '数字减影DSA', '移动DR', 'X射线球管与高压发生器']
  },
  {
    id: 'ENG-04',
    employeeNo: 'EMP-8004',
    name: '张建国',
    group: '大型放射影像技术组',
    title: '医学影像工程师',
    phone: '13863375522',
    avatarColor: 'bg-emerald-600',
    status: 'idle',
    currentWOCount: 0,
    monthClosedCount: 22,
    avgMttrHours: 2.40,
    firstTimeFixRate: 90.9,
    avgSatisfactionScore: 4.88,
    specialties: ['超导核磁MRI', '骨密度仪', '口腔CT', '乳腺钼靶', 'PACS通讯']
  },
  {
    id: 'ENG-05',
    employeeNo: 'EMP-8005',
    name: '刘海波',
    group: '临床检验与生化组',
    title: '生化检验工程师',
    phone: '13706334411',
    avatarColor: 'bg-cyan-600',
    status: 'busy',
    currentWOCount: 1,
    monthClosedCount: 31,
    avgMttrHours: 1.60,
    firstTimeFixRate: 93.5,
    avgSatisfactionScore: 4.90,
    specialties: ['全自动生化分析仪', '化学发光免疫仪', '血凝流水线', '酶标洗板机']
  },
  {
    id: 'ENG-06',
    employeeNo: 'EMP-8006',
    name: '王慧',
    group: '临床检验与生化组',
    title: '检验分析仪器技师',
    phone: '13963398877',
    avatarColor: 'bg-teal-600',
    status: 'idle',
    currentWOCount: 0,
    monthClosedCount: 26,
    avgMttrHours: 1.75,
    firstTimeFixRate: 92.3,
    avgSatisfactionScore: 4.93,
    specialties: ['血细胞五分类', '尿沉渣流水线', '质谱仪', '血气分析仪']
  },
  {
    id: 'ENG-07',
    employeeNo: 'EMP-8007',
    name: '陈晓东',
    group: '腔镜微创手术组',
    title: '微创器械主管工程师',
    phone: '13563332211',
    avatarColor: 'bg-rose-600',
    status: 'busy',
    currentWOCount: 1,
    monthClosedCount: 23,
    avgMttrHours: 1.80,
    firstTimeFixRate: 95.6,
    avgSatisfactionScore: 4.96,
    specialties: ['高清4K腹腔镜系统', '超声软组织手术刀', '高频电刀', '关节镜', '低温等离子']
  },
  {
    id: 'ENG-08',
    employeeNo: 'EMP-8008',
    name: '郭晓',
    group: '腔镜微创手术组',
    title: '手术室设备保障专员',
    phone: '13863379966',
    avatarColor: 'bg-purple-600',
    status: 'idle',
    currentWOCount: 0,
    monthClosedCount: 27,
    avgMttrHours: 1.50,
    firstTimeFixRate: 92.6,
    avgSatisfactionScore: 4.89,
    specialties: ['麻醉蒸发罐', '手术无影灯', '电动液压手术台', '医用吊塔吊桥']
  },
  {
    id: 'ENG-09',
    employeeNo: 'EMP-8009',
    name: '周宏宇',
    group: '超声与综合诊疗组',
    title: '医用超声工程师',
    phone: '15963390022',
    avatarColor: 'bg-sky-600',
    status: 'idle',
    currentWOCount: 1,
    monthClosedCount: 25,
    avgMttrHours: 1.35,
    firstTimeFixRate: 96.0,
    avgSatisfactionScore: 4.94,
    specialties: ['彩色多普勒超声', '经颅多普勒TCD', '心脏矩阵探头修复', '超声声功率自检']
  },
  {
    id: 'ENG-10',
    employeeNo: 'EMP-8010',
    name: '吴丽娜',
    group: '超声与综合诊疗组',
    title: '常规诊疗设备工程师',
    phone: '15863381144',
    avatarColor: 'bg-emerald-700',
    status: 'busy',
    currentWOCount: 1,
    monthClosedCount: 33,
    avgMttrHours: 1.10,
    firstTimeFixRate: 97.0,
    avgSatisfactionScore: 4.91,
    specialties: ['12导联心电图机', '微量输液泵', '电子胃肠镜洗消机', '病房理疗设备']
  }
];

export const INITIAL_WORK_ORDERS: EngineeringWorkOrder[] = [
  {
    id: 'WO-20260906-001',
    equipmentId: 'EQ-001',
    equipmentName: 'Mindray SV300 有创呼吸机',
    equipmentModel: 'SV300',
    equipmentSn: 'MR-SV-2023-8891',
    internalNo: 'ICU-VENT-03',
    category: '急救监护类',
    department: '重症医学科 (ICU)',
    location: '1号楼 综合楼 4F ICU病房 03床旁',
    building: '1号楼 综合楼',
    floor: '4F',
    reporterName: '林瑞芳 (护士长)',
    reporterPhone: '13863371002',
    reportTime: '2026-09-06 08:30',
    priority: 'P1_CRITICAL',
    workOrderType: 'emergency_breakdown',
    faultDescription: '呼吸机开机自检报“呼气阀阻抗超标”且伴有气道低压持续声光报警，无法进入常规SIMV通气模式，重症患者急需备用机更换。',
    status: 'closed',
    biomedicalGroup: '急救生命支持技术组',
    dispatcherName: '崔伟 (调度主任)',
    dispatchTime: '2026-09-06 08:34',
    dispatchNotes: '急救P1级红色工单！立即调度崔伟科长携带应急呼气阀总成与校准箱，15分钟内务必到场处置！',
    assignedEngineerId: 'ENG-01',
    assignedEngineerName: '崔伟',
    assignedEngineerPhone: '13863373257',
    acceptedTime: '2026-09-06 08:37',
    responseTimeMinutes: 7,
    arrivedTime: '2026-09-06 08:45',
    transitTimeMinutes: 8,
    faultCategory: 'optical_sensor',
    faultAnalysis: '现场拆机检测呼气阀组件，发现呼气流量传感器光学光敏受潮污染，微压差采样管路轻微堵塞，致使定标压力偏离基准40%。',
    repairAction: '更换原厂一体化集成呼气阀总成与医用专用超细硅胶采样管路，重新执行系统全回路气密性检测（漏气量0.02 L/min）及气阻定标，通气顺应性校准全部PASS。',
    partsReplaced: [
      {
        partNo: 'MR-PART-V300-VALVE',
        partName: 'SV300专用一体化呼气阀总成',
        spec: '含耐高温高温灭菌膜片与流阻传感器',
        quantity: 1,
        unitPrice: 2800,
        totalPrice: 2800,
        source: '院内备件库'
      }
    ],
    electricalSafetyPassed: true,
    performanceCalibrationPassed: true,
    repairFinishedTime: '2026-09-06 09:42',
    laborHours: 1.2,
    totalRepairCost: 2800,
    acceptanceTime: '2026-09-06 09:50',
    acceptanceStaffName: '林瑞芳 (ICU护士长)',
    acceptanceStaffRole: '护士长',
    acceptanceSignature: '【电子签名】林瑞芳 · ICU护士长 (通过工号验证)',
    ratingScore: 5,
    ratingTimeliness: 5,
    ratingQuality: 5,
    ratingAttitude: 5,
    clinicalFeedback: '崔工响应极速，15分钟内携备件赶到床旁，更换呼气阀并重新定标，电气安全自检一次性通过，保障了患者抢救用机，非常感谢！',
    totalDowntimeHours: 1.33,
    slaResponseLimitMinutes: 15,
    slaRepairLimitHours: 2,
    isSlaResponseMet: true,
    isSlaRepairMet: true,
    isFirstTimeFix: true
  },
  {
    id: 'WO-20260906-002',
    equipmentId: 'EQ-002',
    equipmentName: 'GE Revolution 64排螺旋CT机',
    equipmentModel: 'Revolution CT 64',
    equipmentSn: 'GE-CT-2021-9988',
    internalNo: 'RAD-CT-01',
    category: '影像诊断类',
    department: '放射科',
    location: '1号楼 综合楼 -1F CT室1间',
    building: '1号楼 综合楼',
    floor: '-1F',
    reporterName: '王建平 (放射技师长)',
    reporterPhone: '13863378811',
    reportTime: '2026-09-05 14:10',
    priority: 'P2_URGENT',
    workOrderType: 'emergency_breakdown',
    faultDescription: '扫描急诊胸部CT过程中突然报错“Gantry Slip-ring Communication Comm-Loss 4022”，机架旋转暂停，门诊排队患者超30人。',
    status: 'closed',
    biomedicalGroup: '大型放射影像技术组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-05 14:15',
    dispatchNotes: '请孙志强工程师协同原厂GE驻场工程师快速排查滑环光纤通道与碳刷磨损。',
    assignedEngineerId: 'ENG-03',
    assignedEngineerName: '孙志强',
    assignedEngineerPhone: '13963381120',
    acceptedTime: '2026-09-05 14:22',
    responseTimeMinutes: 12,
    arrivedTime: '2026-09-05 14:35',
    transitTimeMinutes: 13,
    faultCategory: 'electrical_power',
    faultAnalysis: '开壳检查机架高低速数据滑环通道，发现第3组低压信号滑环表面积聚碳粉碎屑，接触阻抗突增至25Ω产生脉冲干扰，造成总线数据帧丢包。',
    repairAction: '使用精密电器清洗剂配合工业无尘布彻底清洁滑环微米级轨道铜环，更换磨损超限的备用石墨滑环导电碳刷2组，做空载高速旋转与曝光通讯验证连续100圈无报错。',
    partsReplaced: [
      {
        partNo: 'GE-PART-SLIPRING-BRUSH',
        partName: '低阻抗复合微晶滑环碳刷组件',
        spec: 'GE Revolution专用 64排配套 (2支/组)',
        quantity: 2,
        unitPrice: 1650,
        totalPrice: 3300,
        source: '原厂紧急调配'
      }
    ],
    externalPartner: 'GE医疗售后技术服务部',
    electricalSafetyPassed: true,
    performanceCalibrationPassed: true,
    repairFinishedTime: '2026-09-05 16:50',
    laborHours: 2.6,
    totalRepairCost: 3300,
    acceptanceTime: '2026-09-05 17:05',
    acceptanceStaffName: '王建平 (技师长)',
    acceptanceStaffRole: '科室责任人',
    acceptanceSignature: '【电子签名】王建平 · 放射科技师长 (生物识别)',
    ratingScore: 5,
    ratingTimeliness: 5,
    ratingQuality: 5,
    ratingAttitude: 5,
    clinicalFeedback: '停机时间控制在3小时以内，抢在下班高峰前彻底恢复扫描，避免了大量患者转院积压。',
    totalDowntimeHours: 2.92,
    slaResponseLimitMinutes: 30,
    slaRepairLimitHours: 4,
    isSlaResponseMet: true,
    isSlaRepairMet: true,
    isFirstTimeFix: true
  },
  {
    id: 'WO-20260906-003',
    equipmentId: 'EQ-007',
    equipmentName: '德国卡尔史托斯 KARL STORZ 4K超高清腹腔镜系统',
    equipmentModel: 'IMAGE1 S 4K',
    equipmentSn: 'KS-4K-2022-7721',
    internalNo: 'OR-LAP-02',
    category: '手术器械类',
    department: '麻醉手术科',
    location: '1号楼 综合楼 8F 手术室 05间',
    building: '1号楼 综合楼',
    floor: '8F',
    reporterName: '张秀丽 (手术室总护士长)',
    reporterPhone: '13863376677',
    reportTime: '2026-09-06 09:15',
    priority: 'P1_CRITICAL',
    workOrderType: 'emergency_breakdown',
    faultDescription: '腹腔镜摄像头插入主机提示“Camera Head Signal Error E-08”，画面偶发蓝屏闪烁，下午有2台普外科腹腔镜胆囊微创手术。',
    status: 'repaired_pending_acceptance',
    biomedicalGroup: '腔镜微创手术组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-06 09:18',
    dispatchNotes: '微创手术核心设备，优先指派陈晓东工程师现场处理并备用替换备用摄像系统。',
    assignedEngineerId: 'ENG-07',
    assignedEngineerName: '陈晓东',
    assignedEngineerPhone: '13563332211',
    acceptedTime: '2026-09-06 09:23',
    responseTimeMinutes: 8,
    arrivedTime: '2026-09-06 09:32',
    transitTimeMinutes: 9,
    faultCategory: 'accessory_cable',
    faultAnalysis: '检查发现摄像机头引出线在近接头弯折处内部屏蔽层断裂虚接，手柄旋转时产生瞬态差分信号丢失。',
    repairAction: '现场启用应急库周转摄像手柄替换，同时拆修原手柄加固尾部缓冲耐折弯护套，重新熔接光纤差分信道与气密测试合格。',
    partsReplaced: [
      {
        partNo: 'KS-CAB-4K-REPAIR',
        partName: 'Image1 S 摄像机尾部柔性耐折线缆护套组',
        spec: '医用高频耐弯折硅胶强化型',
        quantity: 1,
        unitPrice: 1200,
        totalPrice: 1200,
        source: '院内备件库'
      }
    ],
    electricalSafetyPassed: true,
    performanceCalibrationPassed: true,
    repairFinishedTime: '2026-09-06 10:45',
    laborHours: 1.5,
    totalRepairCost: 1200,
    totalDowntimeHours: 1.5,
    slaResponseLimitMinutes: 15,
    slaRepairLimitHours: 2,
    isSlaResponseMet: true,
    isSlaRepairMet: true,
    isFirstTimeFix: true
  },
  {
    id: 'WO-20260906-004',
    equipmentId: 'EQ-015',
    equipmentName: '贝克曼库尔特 AU5800 全自动生化分析仪',
    equipmentModel: 'AU5800',
    equipmentSn: 'BK-AU-2020-5512',
    internalNo: 'LAB-CHEM-01',
    category: '检验分析类',
    department: '医学检验科',
    location: '1号楼 综合楼 2F 检验大厅生化急查区',
    building: '1号楼 综合楼',
    floor: '2F',
    reporterName: '高伟 (生化室主管检验师)',
    reporterPhone: '13863379900',
    reportTime: '2026-09-06 10:00',
    priority: 'P2_URGENT',
    workOrderType: 'emergency_breakdown',
    faultDescription: '1号轨道试剂探针R1在加样自检时报“Probe Jam Liquid Clot”，冲洗压力过高，导致该模块生化项目全线挂起。',
    status: 'arrived_inspecting',
    biomedicalGroup: '临床检验与生化组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-06 10:05',
    dispatchNotes: '请刘海波工程师带通针工具与备用探针前往检验科抢修。',
    assignedEngineerId: 'ENG-05',
    assignedEngineerName: '刘海波',
    assignedEngineerPhone: '13706334411',
    acceptedTime: '2026-09-06 10:10',
    responseTimeMinutes: 10,
    arrivedTime: '2026-09-06 10:20',
    transitTimeMinutes: 10,
    faultCategory: 'mechanical_wear',
    faultAnalysis: '现场拆卸加样针超声清洗检测，发现针内壁附着蛋白凝块，且Z轴传动丝杠干磨有轻微微步丢步。',
    repairAction: '正在进行高浓度酶清洗液反冲脱水浸泡，同步清理丝杠油脂重新涂覆医用级特氟龙润滑脂。',
    partsReplaced: [],
    totalRepairCost: 0,
    totalDowntimeHours: 0.8,
    slaResponseLimitMinutes: 30,
    slaRepairLimitHours: 4,
    isSlaResponseMet: true,
    isSlaRepairMet: true,
    isFirstTimeFix: false
  },
  {
    id: 'WO-20260906-005',
    equipmentId: 'EQ-005',
    equipmentName: '迈瑞 BeneHeart D6 双相波除颤起搏监护仪',
    equipmentModel: 'BeneHeart D6',
    equipmentSn: 'MR-D6-2022-3344',
    internalNo: 'EMERG-DEFIB-01',
    category: '急救监护类',
    department: '急诊科',
    location: '1号楼 综合楼 1F 急诊抢救大厅 01抢救单元',
    building: '1号楼 综合楼',
    floor: '1F',
    reporterName: '陈晨 (急诊科护士)',
    reporterPhone: '13863371199',
    reportTime: '2026-09-06 10:25',
    priority: 'P1_CRITICAL',
    workOrderType: 'emergency_breakdown',
    faultDescription: '每日例行除颤晨检打印自检条时，提示“200J放电能量衰减率>15%，高压电容充电时间超时(9.5秒)”，自检灯转红。急诊抢救关键设备！',
    status: 'pending_dispatch',
    biomedicalGroup: '急救生命支持技术组',
    partsReplaced: [],
    totalRepairCost: 0,
    totalDowntimeHours: 0.4,
    slaResponseLimitMinutes: 15,
    slaRepairLimitHours: 2,
    isSlaResponseMet: false,
    isSlaRepairMet: false
  },
  {
    id: 'WO-20260906-006',
    equipmentId: 'EQ-018',
    equipmentName: 'GE Voluson E8 妇产四维高端彩色多普勒超声诊断仪',
    equipmentModel: 'Voluson E8',
    equipmentSn: 'GE-US-2021-6655',
    internalNo: 'OB-US-02',
    category: '影像诊断类',
    department: '妇产科',
    location: '1号楼 综合楼 3F 产前筛查超声诊断2室',
    building: '1号楼 综合楼',
    floor: '3F',
    reporterName: '李秀琴 (妇产科主任医师)',
    reporterPhone: '13863372233',
    reportTime: '2026-09-06 09:55',
    priority: 'P3_STANDARD',
    workOrderType: 'emergency_breakdown',
    faultDescription: '经腹凸阵容积探头RAB6-D扫查时屏幕出现三道固定垂直暗道盲区，疑似探头阵元晶片部分脱焊或电缆接触不良。',
    status: 'dispatched',
    biomedicalGroup: '超声与综合诊疗组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-06 10:12',
    dispatchNotes: '已派发周宏宇工程师，请携带便携探头测试仪与备用备件前往检测。',
    assignedEngineerId: 'ENG-09',
    assignedEngineerName: '周宏宇',
    assignedEngineerPhone: '15963390022',
    partsReplaced: [],
    totalRepairCost: 0,
    totalDowntimeHours: 0.8,
    slaResponseLimitMinutes: 120,
    slaRepairLimitHours: 24,
    isSlaResponseMet: true,
    isSlaRepairMet: true
  },
  {
    id: 'WO-20260906-007',
    equipmentId: 'EQ-022',
    equipmentName: '理邦 EDAN SE-1200 Pro 十二导联心电图机',
    equipmentModel: 'SE-1200 Pro',
    equipmentSn: 'ED-ECG-2023-1102',
    internalNo: 'CARD-ECG-04',
    category: '通用诊疗类',
    department: '心血管内科',
    location: '1号楼 综合楼 11F 心内科病房医生办公室',
    building: '1号楼 综合楼',
    floor: '11F',
    reporterName: '刘军 (住院医师)',
    reporterPhone: '13863377744',
    reportTime: '2026-09-06 10:05',
    priority: 'P3_STANDARD',
    workOrderType: 'accessory_cable',
    faultDescription: 'V1-V3胸导联信号漂移基线严重跳动，打印出来的波形充斥50Hz交流干扰杂波，更换电极片后故障依旧。',
    status: 'accepted',
    biomedicalGroup: '超声与综合诊疗组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-06 10:15',
    dispatchNotes: '已指派吴丽娜工程师，携带备用10芯除颤保护导联线前往更换。',
    assignedEngineerId: 'ENG-10',
    assignedEngineerName: '吴丽娜',
    assignedEngineerPhone: '15863381144',
    acceptedTime: '2026-09-06 10:20',
    responseTimeMinutes: 15,
    partsReplaced: [],
    totalRepairCost: 0,
    totalDowntimeHours: 0.6,
    slaResponseLimitMinutes: 120,
    slaRepairLimitHours: 24,
    isSlaResponseMet: true,
    isSlaRepairMet: true
  },
  {
    id: 'WO-20260906-008',
    equipmentId: 'EQ-012',
    equipmentName: '奥林巴斯 OLYMPUS ESG-400 高频手术电刀系统',
    equipmentModel: 'ESG-400',
    equipmentSn: 'OLY-ESG-2022-8811',
    internalNo: 'ENDO-ESG-01',
    category: '手术器械类',
    department: '消化内镜中心',
    location: '1号楼 综合楼 5F 内镜治疗室 02间',
    building: '1号楼 综合楼',
    floor: '5F',
    reporterName: '王莉 (内镜中心护士长)',
    reporterPhone: '13863375500',
    reportTime: '2026-09-05 16:30',
    priority: 'P2_URGENT',
    workOrderType: 'emergency_breakdown',
    faultDescription: '内镜ESD息肉切除术中，电刀自检反复报“CQM中性电极回路接触阻抗超出安全阈值”，双极电凝模式正常但单极模式锁死。',
    status: 'waiting_parts',
    biomedicalGroup: '腔镜微创手术组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-05 16:35',
    assignedEngineerId: 'ENG-07',
    assignedEngineerName: '陈晓东',
    assignedEngineerPhone: '13563332211',
    acceptedTime: '2026-09-05 16:42',
    responseTimeMinutes: 12,
    arrivedTime: '2026-09-05 16:55',
    transitTimeMinutes: 13,
    faultCategory: 'optical_sensor',
    faultAnalysis: '主板CQM回路阻抗检测继电器内部触点烧蚀粘连，导致无论外接何种负极板皆测得>150Ω阻抗并触发安全联锁报警。',
    repairAction: '已拆机取下高频主板，申请从原厂申领奥林巴斯原厂CQM阻抗监控子板更换，预计今天下午货到即装。',
    partsReplaced: [
      {
        partNo: 'OLY-ESG400-CQM-BOARD',
        partName: 'ESG-400高频电刀中性电极回路控制子板',
        spec: 'CQM专用高压保护隔离级',
        quantity: 1,
        unitPrice: 4800,
        totalPrice: 4800,
        source: '原厂紧急调配'
      }
    ],
    externalPartner: '奥林巴斯医疗技术服务中心',
    totalRepairCost: 4800,
    totalDowntimeHours: 18.2,
    slaResponseLimitMinutes: 30,
    slaRepairLimitHours: 4,
    isSlaResponseMet: true,
    isSlaRepairMet: false
  },
  {
    id: 'WO-20260906-009',
    equipmentId: 'EQ-030',
    equipmentName: '史密斯医疗 双通道微量注射泵',
    equipmentModel: 'Graseby 2100',
    equipmentSn: 'SM-GRA-2023-4412',
    internalNo: 'PED-PUMP-08',
    category: '急救监护类',
    department: '儿科病区',
    location: '1号楼 综合楼 14F 儿科病区抢救室',
    building: '1号楼 综合楼',
    floor: '14F',
    reporterName: '杨敏 (儿科责任护士)',
    reporterPhone: '13863378822',
    reportTime: '2026-09-04 11:20',
    priority: 'P3_STANDARD',
    workOrderType: 'emergency_breakdown',
    faultDescription: '注射泵滑杆卡槽推进时发出“咔咔”齿轮空转异响，流速输注累计量与实际注射器推进刻度存在0.5ml偏差。',
    status: 'closed',
    biomedicalGroup: '急救生命支持技术组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-04 11:30',
    assignedEngineerId: 'ENG-02',
    assignedEngineerName: '李晓峰',
    assignedEngineerPhone: '13963381121',
    acceptedTime: '2026-09-04 11:38',
    responseTimeMinutes: 18,
    arrivedTime: '2026-09-04 11:50',
    transitTimeMinutes: 12,
    faultCategory: 'mechanical_wear',
    faultAnalysis: '推进丝母传动螺纹出现局部塑胶牙磨损脱扣，压敏弹簧疲劳。',
    repairAction: '更换高精度金属加强型传动推进块套件，做20ml及50ml注射器高低流速精度测定（误差<1.2%，国标要求<2%合格）。',
    partsReplaced: [
      {
        partNo: 'SM-GR-NUT-BLOCK',
        partName: 'Graseby 2100传动推块与弹簧压片组件',
        spec: '高精密金属强化型',
        quantity: 1,
        unitPrice: 260,
        totalPrice: 260,
        source: '院内备件库'
      }
    ],
    electricalSafetyPassed: true,
    performanceCalibrationPassed: true,
    repairFinishedTime: '2026-09-04 12:40',
    laborHours: 0.8,
    totalRepairCost: 260,
    acceptanceTime: '2026-09-04 12:55',
    acceptanceStaffName: '杨敏 (责任护士)',
    acceptanceStaffRole: '护士',
    acceptanceSignature: '【电子签名】杨敏 · 儿科责任护士',
    ratingScore: 5,
    ratingTimeliness: 5,
    ratingQuality: 5,
    ratingAttitude: 5,
    clinicalFeedback: '维修非常仔细，现场带量筒测试流速精度，消除了给新生儿用药的顾虑！',
    totalDowntimeHours: 1.58,
    slaResponseLimitMinutes: 120,
    slaRepairLimitHours: 24,
    isSlaResponseMet: true,
    isSlaRepairMet: true,
    isFirstTimeFix: true
  },
  {
    id: 'WO-20260906-010',
    equipmentId: 'EQ-025',
    equipmentName: '西门子 SIEMENS Cios Select 移动式中型C形臂X射线机',
    equipmentModel: 'Cios Select',
    equipmentSn: 'SIEM-CIOS-2022-1188',
    internalNo: 'OR-CARM-01',
    category: '影像诊断类',
    department: '骨科手术室',
    location: '1号楼 综合楼 8F 手术室 08间 (骨科数字化手术室)',
    building: '1号楼 综合楼',
    floor: '8F',
    reporterName: '赵志刚 (骨科副主任医师)',
    reporterPhone: '13863373300',
    reportTime: '2026-09-03 15:40',
    priority: 'P2_URGENT',
    workOrderType: 'emergency_breakdown',
    faultDescription: '术中踩踏脚闸曝光时，透视画面间歇性断帧黑屏，脚闸电缆弯折处手捏有接触不良现象。',
    status: 'closed',
    biomedicalGroup: '大型放射影像技术组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-03 15:45',
    assignedEngineerId: 'ENG-03',
    assignedEngineerName: '孙志强',
    assignedEngineerPhone: '13963381120',
    acceptedTime: '2026-09-03 15:52',
    responseTimeMinutes: 12,
    arrivedTime: '2026-09-03 16:05',
    transitTimeMinutes: 13,
    faultCategory: 'accessory_cable',
    faultAnalysis: '曝光脚闸内部多芯屏蔽电缆长期遭手术台滚轮碾压，内部微动开关信号回路断裂6股铜丝。',
    repairAction: '更换西门子原装重型IPX8防水抗碾压防爆脚踏开关总成及高韧性软电缆，重新校准透视与摄影曝光计时器。',
    partsReplaced: [
      {
        partNo: 'SIEM-FOOTSW-HEAVY',
        partName: 'Cios Select专用双联防水脚踏开关总成',
        spec: 'IPX8带耐酸碱抗碾压防护套管',
        quantity: 1,
        unitPrice: 3600,
        totalPrice: 3600,
        source: '院内备件库'
      }
    ],
    electricalSafetyPassed: true,
    performanceCalibrationPassed: true,
    repairFinishedTime: '2026-09-03 17:15',
    laborHours: 1.5,
    totalRepairCost: 3600,
    acceptanceTime: '2026-09-03 17:30',
    acceptanceStaffName: '赵志刚 (骨科副主任)',
    acceptanceStaffRole: '医生',
    acceptanceSignature: '【电子签名】赵志刚 · 骨科副主任医师',
    ratingScore: 5,
    ratingTimeliness: 5,
    ratingQuality: 5,
    ratingAttitude: 5,
    clinicalFeedback: '骨科急诊复位手术前及时解决，新脚踏脚感扎实，反应灵敏！',
    totalDowntimeHours: 1.83,
    slaResponseLimitMinutes: 30,
    slaRepairLimitHours: 4,
    isSlaResponseMet: true,
    isSlaRepairMet: true,
    isFirstTimeFix: true
  },
  {
    id: 'WO-20260906-011',
    equipmentId: 'EQ-040',
    equipmentName: '日机装 NIKKISO DBB-06 透析机',
    equipmentModel: 'DBB-06',
    equipmentSn: 'NIK-DBB-2022-9011',
    internalNo: 'HEMO-DIAL-12',
    category: '急救监护类',
    department: '血液透析科',
    location: '1号楼 综合楼 6F 透析大厅 12号床',
    building: '1号楼 综合楼',
    floor: '6F',
    reporterName: '许海燕 (血透室护士长)',
    reporterPhone: '13863374466',
    reportTime: '2026-09-02 07:45',
    priority: 'P2_URGENT',
    workOrderType: 'emergency_breakdown',
    faultDescription: '开机消毒冲洗流程报“透析液电导率超标(A/B液混合比异常) 05-A”，超滤率监测误差偏高。',
    status: 'closed',
    biomedicalGroup: '急救生命支持技术组',
    dispatcherName: '调度调度室 (医工总台)',
    dispatchTime: '2026-09-02 07:50',
    assignedEngineerId: 'ENG-01',
    assignedEngineerName: '崔伟',
    assignedEngineerPhone: '13863373257',
    acceptedTime: '2026-09-02 07:55',
    responseTimeMinutes: 10,
    arrivedTime: '2026-09-02 08:05',
    transitTimeMinutes: 10,
    faultCategory: 'optical_sensor',
    faultAnalysis: '温度补偿型电导度计电极附着碳酸盐结晶垢，导致温补探针读数漂移+1.2 mS/cm。',
    repairAction: '拆下电导池使用专用柠檬酸脱钙去结晶，复位校准零点和斜率，连续监测3次自检电导值波动<0.05 mS/cm。',
    partsReplaced: [],
    electricalSafetyPassed: true,
    performanceCalibrationPassed: true,
    repairFinishedTime: '2026-09-02 09:20',
    laborHours: 1.5,
    totalRepairCost: 0,
    acceptanceTime: '2026-09-02 09:35',
    acceptanceStaffName: '许海燕 (护士长)',
    acceptanceStaffRole: '护士长',
    acceptanceSignature: '【电子签名】许海燕 · 血透室护士长',
    ratingScore: 5,
    ratingTimeliness: 5,
    ratingQuality: 5,
    ratingAttitude: 5,
    clinicalFeedback: '清晨早班第一时间赶到排除故障，没有耽误患者8点半透析上机！',
    totalDowntimeHours: 1.83,
    slaResponseLimitMinutes: 30,
    slaRepairLimitHours: 4,
    isSlaResponseMet: true,
    isSlaRepairMet: true,
    isFirstTimeFix: true
  },
  {
    id: 'WO-20260906-012',
    equipmentId: 'EQ-048',
    equipmentName: '金宝 Prismaflex 连续性血液净化系统(CRRT)',
    equipmentModel: 'Prismaflex',
    equipmentSn: 'GAM-CRRT-2021-3321',
    internalNo: 'ICU-CRRT-01',
    category: '急救监护类',
    department: '重症医学科 (ICU)',
    location: '1号楼 综合楼 4F ICU病房 负压隔离抢救室',
    building: '1号楼 综合楼',
    floor: '4F',
    reporterName: '林瑞芳 (ICU护士长)',
    reporterPhone: '13863371002',
    reportTime: '2026-09-06 10:35',
    priority: 'P1_CRITICAL',
    workOrderType: 'emergency_breakdown',
    faultDescription: 'CRRT运行自检时，滤器进液端气泡超声探测器持续报“Air in blood leak detector”，但管路无气泡，无法通过预充。ICU感染性休克合并急性肾衰竭危重患者待机急救！',
    status: 'pending_dispatch',
    biomedicalGroup: '急救生命支持技术组',
    partsReplaced: [],
    totalRepairCost: 0,
    totalDowntimeHours: 0.2,
    slaResponseLimitMinutes: 15,
    slaRepairLimitHours: 2,
    isSlaResponseMet: false,
    isSlaRepairMet: false
  }
];

export const WORK_ORDER_STORAGE_KEY = 'hospital-medtech-workorders';

export function loadStoredWorkOrders(): EngineeringWorkOrder[] {
  try {
    const raw = localStorage.getItem(WORK_ORDER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Storage] Error loading stored work orders:', err);
  }
  return INITIAL_WORK_ORDERS;
}

export function saveStoredWorkOrders(data: EngineeringWorkOrder[]) {
  try {
    localStorage.setItem(WORK_ORDER_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[Storage] Error saving stored work orders:', err);
  }
}

/**
 * 汇总计算当前工单集的 MTTR 及核心运维 SLA 指标
 */
export function calculateMttrKpiStats(orders: EngineeringWorkOrder[]): MttrKpiStats {
  const totalCount = orders.length;
  const pendingDispatchCount = orders.filter(o => o.status === 'pending_dispatch').length;
  const inProgressCount = orders.filter(o => ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(o.status)).length;
  const pendingAcceptanceCount = orders.filter(o => o.status === 'repaired_pending_acceptance').length;
  const closedCount = orders.filter(o => o.status === 'closed').length;

  // 1. 平均响应耗时与 SLA 响应达标率
  const respondedOrders = orders.filter(o => typeof o.responseTimeMinutes === 'number');
  const avgResponseTimeMinutes = respondedOrders.length > 0
    ? Number((respondedOrders.reduce((acc, cur) => acc + (cur.responseTimeMinutes || 0), 0) / respondedOrders.length).toFixed(1))
    : 12.5;

  const slaResponseMetCount = respondedOrders.filter(o => o.isSlaResponseMet).length;
  const slaResponseMetRate = respondedOrders.length > 0
    ? Number(((slaResponseMetCount / respondedOrders.length) * 100).toFixed(1))
    : 96.2;

  // 2. 平均停机修复时间 MTTR (小时)
  const completedOrders = orders.filter(o => ['closed', 'repaired_pending_acceptance'].includes(o.status) && o.totalDowntimeHours > 0);
  const avgMttrHours = completedOrders.length > 0
    ? Number((completedOrders.reduce((acc, cur) => acc + cur.totalDowntimeHours, 0) / completedOrders.length).toFixed(2))
    : 1.85;

  const slaRepairMetCount = completedOrders.filter(o => o.isSlaRepairMet).length;
  const slaRepairMetRate = completedOrders.length > 0
    ? Number(((slaRepairMetCount / completedOrders.length) * 100).toFixed(1))
    : 94.6;

  // 3. 首次修复率 (First Time Fix Rate)
  const closedWithFTF = orders.filter(o => o.status === 'closed' && typeof o.isFirstTimeFix === 'boolean');
  const ftfCount = closedWithFTF.filter(o => o.isFirstTimeFix).length;
  const firstTimeFixRate = closedWithFTF.length > 0
    ? Number(((ftfCount / closedWithFTF.length) * 100).toFixed(1))
    : 92.8;

  // 4. 临床满意度评分
  const ratedOrders = orders.filter(o => typeof o.ratingScore === 'number' && o.ratingScore > 0);
  const avgSatisfactionScore = ratedOrders.length > 0
    ? Number((ratedOrders.reduce((acc, cur) => acc + (cur.ratingScore || 5), 0) / ratedOrders.length).toFixed(2))
    : 4.96;

  // 5. 维保费用与节约资金统计
  const totalRepairExpenses = orders.reduce((acc, cur) => acc + (cur.totalRepairCost || 0), 0);
  const savedOutsourceCostEst = Math.round(totalRepairExpenses * 1.8 + completedOrders.length * 2200);

  return {
    totalCount,
    pendingDispatchCount,
    inProgressCount,
    pendingAcceptanceCount,
    closedCount,
    avgResponseTimeMinutes,
    slaResponseMetRate,
    avgMttrHours,
    slaRepairMetRate,
    firstTimeFixRate,
    avgSatisfactionScore,
    totalRepairExpenses,
    savedOutsourceCostEst
  };
}

/**
 * 智能推荐匹配最适合派工的医工工程师
 * 依据：专业组对齐 > 当前负荷 (空闲优先) > 历史满意度
 */
export function recommendEngineerForOrder(
  order: EngineeringWorkOrder,
  engineers: BiomedicalEngineerProfile[]
): BiomedicalEngineerProfile | undefined {
  // 1. 按专业技术组筛选
  const matchedGroupEngineers = engineers.filter(e => e.group === order.biomedicalGroup && e.status !== 'off_duty');
  const candidates = matchedGroupEngineers.length > 0 ? matchedGroupEngineers : engineers.filter(e => e.status !== 'off_duty');

  // 2. 排序规则：空闲优先 (currentWOCount 最少)，满意度最高
  return candidates.sort((a, b) => {
    if (a.currentWOCount !== b.currentWOCount) {
      return a.currentWOCount - b.currentWOCount;
    }
    return b.avgSatisfactionScore - a.avgSatisfactionScore;
  })[0];
}

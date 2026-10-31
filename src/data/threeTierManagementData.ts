export type ManagementTierNode = 'executive_leadership' | 'equipment_dept' | 'clinical_dept';

// 医疗设备科负责工程师列表
export interface ResponsibleEngineer {
  id: string;
  employeeNo: string;
  name: string;
  role: string;
  title: string;
  phone: string;
  shortPhone?: string;
  workplace: string;
  specialtyDomain: string;
  pairedDepartments: string[];
  emergencyTier: 'L1' | 'L2' | 'L3';
  dutyScope: string;
  onCallStatus: '常态在岗' | '24H应急值守' | '驻点巡检';
  activeProjectsCount: number;
}

// 使用科室专兼职设备管理员与对口包科工程师
export interface ClinicalPairingRecord {
  departmentId: string;
  departmentName: string;
  location: string;
  safetyOfficerName: string;
  safetyOfficerTitle: string;
  safetyOfficerPhone: string;
  pairedEngineerName: string;
  pairedEngineerPhone: string;
  pairedEngineerSpecialty: string;
  totalEquipmentCount: number;
  lifeSupportCount: number;
  lastQcInspectionDate: string;
  status: '达标在册' | '巡检就绪';
}

// 重点质控项目定义
export interface QualityProjectItem {
  id: string;
  code: string;
  title: string;
  tier: ManagementTierNode;
  tierLabel: string;
  cycle: string;
  leadPerson: string;
  targetMetric: string;
  currentProgress: number; // 0-100
  status: 'in_progress' | 'completed' | 'on_track';
  standardClause: string;
  description: string;
  keyActionPoints: string[];
}

export interface ManagementDutyItem {
  num: string;
  title: string;
  desc: string;
  form?: string;
  point?: string;
  clause?: string;
}

// 1. 医疗设备科 专职负责工程师队伍
export const EQUIPMENT_ENGINEERS: ResponsibleEngineer[] = [
  {
    id: 'ENG-01',
    employeeNo: 'EMP-8001',
    name: '崔伟',
    role: '医疗设备科科长 / 主管工程师',
    title: '副主任技师 / 医院医学装备总协调人',
    phone: '13863373257',
    shortPhone: '63257',
    workplace: '6号楼 办公楼 1F 医疗设备科主任室',
    specialtyDomain: '急救生命支持系统、放射影像、电气安全与预防性维护(PM)',
    pairedDepartments: ['急诊科 / EICU', '麻醉手术科', '重症医学科 (ICU)', '心血管内科病区'],
    emergencyTier: 'L1',
    dutyScope: '主持医疗设备科全面工作；牵头全院装备预算、配置论证准入、重大故障抢修与三甲质控复审',
    onCallStatus: '常态在岗',
    activeProjectsCount: 3
  },
  {
    id: 'ENG-02',
    employeeNo: 'EMP-8002',
    name: '孙志强',
    role: '维修工程师 / 计量主管',
    title: '主管工程师 / 放射卫生防护专员',
    phone: '13963381120',
    shortPhone: '61120',
    workplace: '6号楼 办公楼 1F 医疗设备科计量技术室',
    specialtyDomain: '国家法定计量强检、放射防护与检验医学仪器',
    pairedDepartments: ['医学检验科 / 输血科', '重症医学科', '普外科病区', '骨科临床病区'],
    emergencyTier: 'L1',
    dutyScope: '负责国家法定计量强检申报、周期定标校准、停机红色封存及放射诊疗许可证全流程维护',
    onCallStatus: '24H应急值守',
    activeProjectsCount: 2
  },
  {
    id: 'ENG-03',
    employeeNo: 'EMP-8003',
    name: '王建国',
    role: '医学影像大型设备主管工程师',
    title: '主管工程师 / 辐射防护骨干',
    phone: '13706332190',
    shortPhone: '62190',
    workplace: '1号楼 综合楼 -1F 影像中心医工巡检室',
    specialtyDomain: '超高端CT、3.0T MRI、数字减影血管造影机(DSA)、数字化X线(DR)',
    pairedDepartments: ['医学影像科', '介入放射科', '放疗科', '神经外科病区'],
    emergencyTier: 'L2',
    dutyScope: '负责全院大型影像设备原厂维保履约监督、球管水冷机时状态巡检与单机成本效益分析',
    onCallStatus: '常态在岗',
    activeProjectsCount: 2
  },
  {
    id: 'ENG-04',
    employeeNo: 'EMP-8004',
    name: '刘海波',
    role: '微创外科与腔镜系统技术工程师',
    title: '工程师 / 腔镜维保专员',
    phone: '13863391823',
    shortPhone: '61823',
    workplace: '1号楼 综合楼 8F 麻醉手术科器械保驾室',
    specialtyDomain: '软硬内窥镜系统、高频电刀、超声手术刀、手术显微镜',
    pairedDepartments: ['麻醉手术科', '内镜室 / 消化内科', '妇科病区', '泌尿外科病区'],
    emergencyTier: 'L2',
    dutyScope: '驻点保障中心手术室高精尖微创器械术前点检、术中跟台排障、高频漏电流与清洗消毒质控',
    onCallStatus: '驻点巡检',
    activeProjectsCount: 2
  },
  {
    id: 'ENG-05',
    employeeNo: 'EMP-8005',
    name: '李强',
    role: '应急储备库管员 / 调配调度工程师',
    title: '工程师 / 急救生命支持保障组长',
    phone: '0633-7991237',
    shortPhone: '71237',
    workplace: '1号楼 综合楼 1F 医疗设备应急周转储备库',
    specialtyDomain: '急救生命支持机具周转、蓄电池满电维护、床旁借还验收',
    pairedDepartments: ['医疗设备应急库', '全院各临床病区', '门急诊抢救室', '儿科病区'],
    emergencyTier: 'L1',
    dutyScope: '全院应急生命支持设备24H绿色通道外借出库、归还终末消杀检验、超期催还及热备待命',
    onCallStatus: '24H应急值守',
    activeProjectsCount: 2
  },
  {
    id: 'ENG-06',
    employeeNo: 'EMP-8006',
    name: '陈亮',
    role: '血液透析与特种生命维持工程师',
    title: '工程师 / 水处理系统维保专员',
    phone: '13963301988',
    shortPhone: '61988',
    workplace: '1号楼 综合楼 6F 血液透析室设备控制室',
    specialtyDomain: '血液透析机、CRRT床旁滤过机、二级反渗透医用水处理系统',
    pairedDepartments: ['血液透析室', '肾内科病区', '新生儿监护室(NICU)', '呼吸与危重症医学科'],
    emergencyTier: 'L2',
    dutyScope: '血透室水质内毒素在线监测、电导率校准、透析机化学消毒与紧急突发停水停电应急切换',
    onCallStatus: '常态在岗',
    activeProjectsCount: 1
  },
  {
    id: 'ENG-07',
    employeeNo: 'EMP-8007',
    name: '赵敏',
    role: '医用耗材与阳光采购商务工程师',
    title: '采购工程师 / 招投标商务主管',
    phone: '0633-7991195',
    shortPhone: '71195',
    workplace: '6号楼 办公楼 1F 医疗耗材采购办公室',
    specialtyDomain: '政府采购招投标、备品备件比价议价、原厂合同质保核销',
    pairedDepartments: ['招标采购办公室', '财务科', '审计科', '全院各医技耗材申领科室'],
    emergencyTier: 'L3',
    dutyScope: '规范医疗器械与耗材配件采购论证、政府采购网挂网招标、供应商资质初审及三方议价',
    onCallStatus: '常态在岗',
    activeProjectsCount: 1
  },
  {
    id: 'ENG-08',
    employeeNo: 'EMP-8008',
    name: '钱丽',
    role: '一机一档档案与系统数据质控员',
    title: '助理工程师 / 档案质量管理员',
    phone: '0633-7991196',
    shortPhone: '71196',
    workplace: '6号楼 办公楼 1F 医工保障综合档案室',
    specialtyDomain: '设备电子台账、纸质装订公文卷宗、不良事件报告归集',
    pairedDepartments: ['全院所有科室档案室', '医务处', '院办公室', '信息科'],
    emergencyTier: 'L3',
    dutyScope: '全生命周期技术档案建档、WO-UID唯一工单复合编码维护、三单勾稽公文归卷与三甲查核对接',
    onCallStatus: '常态在岗',
    activeProjectsCount: 1
  }
];

// 2. 第三级 · 临床使用部门对口包科工程师与各科室专兼职设备安全员配对表
export const CLINICAL_PAIRING_LIST: ClinicalPairingRecord[] = [
  {
    departmentId: '261',
    departmentName: '重症医学科 (ICU)',
    location: '1号楼 综合楼 3F',
    safetyOfficerName: '孙晓燕',
    safetyOfficerTitle: '副主任护师 / ICU护士长兼设备安全员',
    safetyOfficerPhone: '7991081',
    pairedEngineerName: '陈亮 (对口工程师)',
    pairedEngineerPhone: '13963301988',
    pairedEngineerSpecialty: '呼吸机、除颤监护仪、血气分析仪、CRRT',
    totalEquipmentCount: 68,
    lifeSupportCount: 52,
    lastQcInspectionDate: '2026-10-25',
    status: '达标在册'
  },
  {
    departmentId: '262',
    departmentName: '手术麻醉中心 (手术室)',
    location: '1号楼 综合楼 4F-5F',
    safetyOfficerName: '郑春梅',
    safetyOfficerTitle: '主管护师 / 麻醉手术科护士长兼设备安全员',
    safetyOfficerPhone: '7991082',
    pairedEngineerName: '刘海波 (驻点工程师)',
    pairedEngineerPhone: '13863391823',
    pairedEngineerSpecialty: '高频电刀、麻醉机、腹腔镜主机、超声刀',
    totalEquipmentCount: 112,
    lifeSupportCount: 46,
    lastQcInspectionDate: '2026-10-26',
    status: '达标在册'
  },
  {
    departmentId: '263',
    departmentName: '急诊医学科 (含急诊抢救室 / EICU)',
    location: '1号楼 综合楼 1F 门急诊大厅北翼',
    safetyOfficerName: '焦晓丽',
    safetyOfficerTitle: '副主任护师 / 急诊科护士长兼设备安全员',
    safetyOfficerPhone: '7991083',
    pairedEngineerName: '李强 (急救应急专责)',
    pairedEngineerPhone: '0633-7991237',
    pairedEngineerSpecialty: '双相波除颤仪、心肺复苏机、转运呼吸机',
    totalEquipmentCount: 48,
    lifeSupportCount: 38,
    lastQcInspectionDate: '2026-10-27',
    status: '达标在册'
  },
  {
    departmentId: '264',
    departmentName: '血液透析中心',
    location: '1号楼 综合楼 6F',
    safetyOfficerName: '吴艳华',
    safetyOfficerTitle: '主管护师 / 血透室护士长兼设备安全员',
    safetyOfficerPhone: '7991084',
    pairedEngineerName: '陈亮 (水处理专修)',
    pairedEngineerPhone: '13963301988',
    pairedEngineerSpecialty: '血液透析机、热消毒水处理系统、电导度计',
    totalEquipmentCount: 42,
    lifeSupportCount: 40,
    lastQcInspectionDate: '2026-10-24',
    status: '达标在册'
  },
  {
    departmentId: '265',
    departmentName: '医学影像科 (CT/MRI/DR机房)',
    location: '1号楼 综合楼 -1F',
    safetyOfficerName: '许光',
    safetyOfficerTitle: '副主任技师 / 影像科副主任兼设备主管',
    safetyOfficerPhone: '7991085',
    pairedEngineerName: '王建国 (对口工程师)',
    pairedEngineerPhone: '13706332190',
    pairedEngineerSpecialty: '超高端CT、3.0T MRI、DR高压机架',
    totalEquipmentCount: 18,
    lifeSupportCount: 4,
    lastQcInspectionDate: '2026-10-20',
    status: '达标在册'
  },
  {
    departmentId: '266',
    departmentName: '心血管内科病区 (含CCU监护病房)',
    location: '1号楼 综合楼 9F',
    safetyOfficerName: '董海霞',
    safetyOfficerTitle: '主管护师 / 心内科护士长兼设备安全员',
    safetyOfficerPhone: '7991086',
    pairedEngineerName: '孙志强 (对口工程师)',
    pairedEngineerPhone: '13963381120',
    pairedEngineerSpecialty: '遥测监护系统、主动脉内球囊反搏(IABP)、临时起搏器',
    totalEquipmentCount: 36,
    lifeSupportCount: 22,
    lastQcInspectionDate: '2026-10-26',
    status: '达标在册'
  }
];

// 3. 当前正在执行的年度重点质控项目
export const QUALITY_PROJECTS_LIST: QualityProjectItem[] = [
  {
    id: 'QC-PROJ-01',
    code: 'QC-2026-PM01',
    title: '2026年度全院急救与生命支持类设备预防性维护(PM) 100%覆盖工程',
    tier: 'equipment_dept',
    tierLabel: '第二级 · 医疗设备科归口管理',
    cycle: '2026年度 (每季度常态化质控闭环)',
    leadPerson: '崔伟 (科长) / 孙志强 (质控组长)',
    targetMetric: '急救生命支持类设备 PM 漏保率严格为 0%，电气绝缘阻抗与泄漏电流100%合格',
    currentProgress: 88,
    status: 'in_progress',
    standardClause: '三级综合医院评审标准 6.5.2.1 条款 (核心必备)',
    description: '对全院所有呼吸机、除颤仪、麻醉机、多参数监护仪、微量注射泵实行全生命周期预防性维护(PM)，使用专用高精度分析仪进行接地电阻(≤0.2Ω)、对地漏电流(≤500μA)、核心输出参数精确度校准与现场签章。',
    keyActionPoints: [
      '每季度初系统智能排期自动生成派工单并直达专责工程师',
      '实行床旁实测双人核签，护士长现场验收并签署评价确认',
      '质控数据自动汇入设备“一机一档”电子技术档案终身留存'
    ]
  },
  {
    id: 'QC-PROJ-02',
    code: 'QC-2026-JL02',
    title: '国家法定强制检定医用计量器具周期定标与合格准用闭环工程',
    tier: 'equipment_dept',
    tierLabel: '第二级 · 医疗设备科归口管理',
    cycle: '2026年度 (动态到期前30天自动预警申报)',
    leadPerson: '孙志强 (计量工程师) / 崔伟',
    targetMetric: '在役法定强检类设备检定覆盖率 100%，红牌停用整改率 100%',
    currentProgress: 94,
    status: 'on_track',
    standardClause: '《中华人民共和国计量法》 / 三级医院评审细则 6.5.3.1',
    description: '依托全国法制计量管理平台(e-CQS)，对心电图机、多参数监护仪、婴儿培养箱、医用超声源、注射泵等10大类国家免征强检目录机具开展全量台账纳管与周期委托检定。',
    keyActionPoints: [
      '建立“绿标合格在用 / 黄标准用限期 / 红标停用封存”三色分类警示标识制度',
      '强检不合格设备现场张贴红色停用标志并就地拉网封存，坚决淘汰报废',
      '检定证书电子版100%上传系统云端并在扫码活码端实时向临床公示'
    ]
  },
  {
    id: 'QC-PROJ-03',
    code: 'QC-2026-ROI03',
    title: '大型医用设备 (超高端CT/3.0T MRI/DSA) 机时负荷与单机成本效益(ROI)穿透式分析',
    tier: 'equipment_dept',
    tierLabel: '第二级 · 医疗设备科归口管理',
    cycle: '2026年半年度与年度专卷评估',
    leadPerson: '王建国 (影像工程师) / 赵敏',
    targetMetric: '年开机有效服务时长≥2500小时，维保配件支出比控制在设备原值3%以内',
    currentProgress: 76,
    status: 'in_progress',
    standardClause: '大型医用设备配置与使用管理办法 / 三级医院评审标准 6.5.1.3',
    description: '对接医院 HIS/PACS 系统采集设备开机时长、检查人次及阳性率，测算保本机时、折旧回本周期与耗材配比，出具大型设备合理使用与保抗建议报告。',
    keyActionPoints: [
      '建立设备全生命周期业财融合模型（收入、维保、折旧、耗材）',
      '单笔超万元维保配件严格实行三方询比价与审计核价机制',
      '每季度向分管院领导与医学装备管理委员会提报运行综合分析'
    ]
  },
  {
    id: 'QC-PROJ-04',
    code: 'QC-2026-UDI04',
    title: '医疗器械唯一标识(UDI)全生命周期公文追溯与返厂大修“三单勾稽”管理专项',
    tier: 'equipment_dept',
    tierLabel: '第二级 · 医疗设备科归口管理',
    cycle: '2026年度 (院医工发〔2026〕19号制度配套落地)',
    leadPerson: '崔伟 / 钱丽 (档案管理员)',
    targetMetric: '高风险设备与外协返厂工单 UDI-WO 复合唯一编码赋码率 100%',
    currentProgress: 82,
    status: 'in_progress',
    standardClause: '国务院令第739号《医疗器械监督管理条例》第38条',
    description: '严格执行全院工单规范复合编码（WO-[类型]-[年份]-[4位流水]），硬化临床报修单、医工维修单、院请示报告单“三单勾稽”验证，杜绝账外暗箱与违规高额送修。',
    keyActionPoints: [
      '首发报修即时生成唯一复合全码，与纸质存根序号强力绑定',
      '高价值故障备件与外协返厂旧件 100% 拍照回收建档销毁',
      '实现与财务结算系统自动校验勾稽，无合规单号一律不予入账付账'
    ]
  },
  {
    id: 'QC-PROJ-CL-01',
    code: 'QC-2026-CL01',
    title: '临床全科室晨间交接点检与急救生命支持器械随时开机待命打卡工程',
    tier: 'clinical_dept',
    tierLabel: '第三级 · 使用部门日常管理',
    cycle: '常态化日执行 (每日8:30前闭环)',
    leadPerson: '各临床医技科室护士长兼设备安全员',
    targetMetric: '每日交接班晨检执行率 100%，急救设备处于随时开机可用完好状态',
    currentProgress: 97,
    status: 'on_track',
    standardClause: '三级甲等综合医院评审现场核查标准 / 《使用部门日常管理职责》第一条',
    description: '全院各病区护士站、ICU及急诊抢救室每日交接班时，对除颤仪、呼吸机、吸引器、监护仪及输液泵进行通电自检、外观清洁、附件齐备性清点及蓄电池饱充电核验。',
    keyActionPoints: [
      '各科室指定专人负责，逐级建立使用管理责任制与责任登记簿',
      '仪器保证“随时开机可用、账卡物相符”，杜绝带故障超负荷使用',
      '一旦发现异常立即在系统提交紧急报修并通知设备科，15分钟内现场响应'
    ]
  },
  {
    id: 'QC-PROJ-CL-02',
    code: 'QC-2026-CL02',
    title: '“未经培训不得上机”硬性规定落实与新进转岗医护操作授权准入专项',
    tier: 'clinical_dept',
    tierLabel: '第三级 · 使用部门日常管理',
    cycle: '新设备装机7日内 / 年度技能复训',
    leadPerson: '科室主任 / 护士长 / 医工带教工程师',
    targetMetric: '特殊/大型精密仪器操作人员培训合格持证率 100%',
    currentProgress: 92,
    status: 'in_progress',
    standardClause: '《医疗器械使用质量监督管理办法》第13条 / 《使用部门职责》第二条',
    description: '新进仪器设备必须由设备科、使用科室共同负责验收调试与训练，操作人员掌握结构、性能、工作原理和维护方法后方可独立操作；初次操作必须在熟练人员指导下开展。',
    keyActionPoints: [
      '严格执行未熟悉该仪器操作前严禁连接电源开机的安全红线',
      '严格按照技术标准、说明书和标准SOP操作规程操作',
      '操作完毕所有开关、手柄必须放置在规定复位位置'
    ]
  },
  {
    id: 'QC-PROJ-CL-03',
    code: 'QC-2026-CL03',
    title: '临床科室医疗仪器“账卡物相符”与科室间调剂使用借还手续闭环工程',
    tier: 'clinical_dept',
    tierLabel: '第三级 · 使用部门日常管理',
    cycle: '月度科室自查 / 季度医工现场抽盘',
    leadPerson: '各科室设备管理员 / 医工巡检组',
    targetMetric: '全院账卡物相符率≥99.5%，跨科调剂审批交接手续执行率 100%',
    currentProgress: 99,
    status: 'on_track',
    standardClause: '《医疗卫生机构医学装备管理办法》第28条 / 《使用部门职责》第六条',
    description: '科室内所有设备严格登记在册，一机一码标牌完好；凡属临床科研仪器科室间调剂使用时，必须经科室主任批准并办理交接手续，用毕及时归还放回原处。',
    keyActionPoints: [
      '破损、失灵部件未经设备科检查严禁任意丢弃',
      '严防违章操作致损，发生损坏或意外事故立即报告设备科追究责任',
      '对长期占用应急备用机具建立定期通报，倡导合理周转与增配论证'
    ]
  },
  {
    id: 'QC-PROJ-LD-01',
    code: 'QC-2026-LD01',
    title: '医院重大医学装备中长期规划、预算统筹与高质量学科发展论证专项',
    tier: 'executive_leadership',
    tierLabel: '第一级 · 主管领导决策层',
    cycle: '2026年度预算与学科规划期',
    leadPerson: '分管副院长 / 院党委会',
    targetMetric: '重大装备立项论证委员会评审率 100%，无预算盲目申购率为 0',
    currentProgress: 85,
    status: 'on_track',
    standardClause: '公立医院“三重一大”集体决策制度 / 《主管领导管理职责》第四条',
    description: '由分管院领导直接负责全院资金预算管理与统筹安排，依据学科建设发展与三甲标准配备适宜医工专业人员，严审大型乙类设备配置许可，防范重大经济与医疗安全风险。',
    keyActionPoints: [
      '凡单价超50万元医用设备必须经医学装备管理委员会与党委会集体审定',
      '统筹规划突发公共卫生事件与急危重症救治绿色通道保障预算',
      '定期听取全院医学装备三级管理运行考核与不良事件防范报告'
    ]
  }
];

// 4. 管理职责清单
export const EQUIPMENT_DEPT_DUTIES: ManagementDutyItem[] = [
  { num: '01', title: '医疗设备质量管理的策划与监督考核', desc: '负责医疗设备、设备质量管理的策划，并组织具体实施，对医用仪器质量进行监督、检查和考核。', form: '《设备质量管理策划方案》', clause: '制度第三章 第一条' },
  { num: '02', title: '质控程序文件归档与“一机一档”管理', desc: '负责医院医疗仪器质量控制程序文件的归档管理，健全“一机一档”全生命周期技术履历与追溯卷宗。', form: '《设备技术档案归档目录》', clause: '制度第三章 第二条' },
  { num: '03', title: '使用质量问题纠正、预防与跟踪验证', desc: '负责对医院所购医疗设备在使用中存在的质量问题，提出纠正和预防措施，并协助进行跟踪验证。', form: '《不良事件RCA与纠正验证表》', clause: '制度第三章 第三条' },
  { num: '04', title: '全院设备周期性维修、保养与预防性维护(PM)', desc: '负责全院医疗设备的维修、保养，建立季度PM预防性维护制度，对生命支持类机具实行全覆盖检测。', form: '《PM预防性维护质控检测联单》', clause: '制度第三章 第四条' },
  { num: '05', title: '医用监护与计量器具国家法定强制检定', desc: '遵照国家法律规定严格执行落实医用监护、计量仪器的强制检定与周期校准工作，严禁超期使用。', form: '《e-CQS法定强检申报明细》', clause: '制度第三章 第五条' },
  { num: '06', title: '全院医用材料与维保配件供应保障', desc: '负责全院医用材料、维修原厂配件的规范供应保障，实施阳光采购与多方询比价管理。', form: '《医用配件采购验收登记卡》', clause: '制度第三章 第六条' },
  { num: '07', title: '健全保养、维修与更新制度保持完好', desc: '建立健全医疗设备保养、维修与更新制度，使全院设备处于随时可用完好状态。', form: '《设备保养维修管理规程》', clause: '制度第三章 第七条' },
  { num: '08', title: '大中型医疗设备合理应用与成本效益分析', desc: '加强大中型医疗设备合理应用情况、有效机时、检查阳性率及成本效益(ROI)综合分析。', form: '《大型设备季度ROI效益分析报告》', clause: '制度第三章 第八条' },
  { num: '09', title: '科学购置论证、甲乙类配置许可与急救完好', desc: '对设备实行科学管理，购置大型设备必须经过严格的可行性论证。属于《大型医用设备配置与使用管理办法》规定的甲、乙类品目的大型医用设备，按照规定申请配置许可。急救设备齐全完好，满足急救工作需要。医护人员能够熟练、正确使用。', form: '《大型医用设备配置论证报告》', clause: '制度第三章 第九条' },
  { num: '10', title: '检测系统校准与不合格设备坚决淘汰', desc: '遵守检验项目和检测仪器操作规程，定期校准检测系统，并及时淘汰经检定不合格的设备。', form: '《仪器报废技术鉴定论证意见书》', clause: '制度第三章 第十条' }
];

export const CLINICAL_DEPT_DUTIES: ManagementDutyItem[] = [
  { num: '01', title: '逐级建立使用管理责任制，保证账卡物相符', desc: '凡有医疗设备的科室，要逐级建立使用管理责任制，指定专人管理，严格使用登记。认真检查保养，保持仪器设备处于良好状态，随时开机可用，并保证账、卡、物相符。', point: '重点排查账外无卡机具与未登机使用', clause: '制度第四章 第一条' },
  { num: '02', title: '共同验收安装，未熟悉操作前严禁接电', desc: '临床医技科室新进仪器设备在使用前要由设备科、使用科室共同负责验收、调试、安装。组织有关科室专业人员进行操作管理、使用和训练，使用科室人员了解仪器的构造、性能、工作原理和使用维护方法后，方可独立使用。凡初次操作者，必须在熟悉该仪器的同志指导下进行。在未熟悉该仪器的操作前，不得连接电源，以免接错电路，造成损坏。', point: '未经培训不得独立上机操作', clause: '制度第四章 第二条' },
  { num: '03', title: '严格遵循操作规程，使用完毕所有手柄复位', desc: '仪器使用人员要严格按照仪器的技术标准、说明书和操作规程进行操作。使用仪器前，应判明其技术状态确实良好，使用完毕，应将所有开关、手柄放在规定位置。', point: '开机自检与用毕复位必查', clause: '制度第四章 第三条' },
  { num: '04', title: '定点安置不得擅移，严禁带故障与超负荷运转', desc: '不准搬动的仪器，不得随意挪动。操作过程中操作人员不得擅自离开，发现仪器运转异常时，应立即通知设备科及医院维修技术人员，查找原因，及时排除故障，严禁带故障和超负荷使用和运转。仪器损坏需修理者，可按规定填写《大型设备维修维护申请报告》。', point: '杜绝带病上岗与带故障运转', clause: '制度第四章 第四条' },
  { num: '05', title: '保持配件与说明书完整，失灵部件严禁擅自丢弃', desc: '仪器设备（包括主机、附件、说明书）一定保持完整无缺，即使破损失灵部件，未经设备科检查亦不得任意丢弃。', point: '高价值旧配件 100% 留存回收销毁', clause: '制度第四章 第五条' },
  { num: '06', title: '临床科研仪器跨科调剂使用必须经主任批准交接', desc: '凡属临床科研的仪器，科室间调剂使用时，一定要经科室主任批准，仪器管理人员要办理交接手续，用毕及时归还，验收后放回原处。', point: '跨科调用双向签署交接借还单', clause: '制度第四章 第六条' },
  { num: '07', title: '用毕专人检查关机，违章操作严肃追责赔偿', desc: '仪器用完后，应由科室管理人员检查，关机放好。若发现仪器损坏或发生意外故障，应立即查明原因和责任，如系违章操作所致，要立即报告设备科，视情节轻重进行赔偿或进一步追究责任。', point: '违章误操作致损追究责任', clause: '制度第四章 第七条' }
];

export const EXECUTIVE_DUTIES: ManagementDutyItem[] = [
  { num: '01', title: '分管院领导直接负责与统筹安排', desc: '由分管院领导直接负责全院医学装备安全与有效利用，负责全院资金的预算管理与统筹安排。', clause: '制度第二章 第一条' },
  { num: '02', title: '专业技术队伍适宜配备与考核', desc: '依据医院机构规模、管理任务与临床服务需求，配备数量适宜的专业工程技术人员并实施专业技术考核。', clause: '制度第二章 第二条' },
  { num: '03', title: '重大设备配置许可审查与可行性决议', desc: '严格审定全院甲、乙类大型医用设备配置申请，主持医学装备管理委员会进行可行性充分论证。', clause: '制度第二章 第三条' },
  { num: '04', title: '突发公共卫生安全与急救绿色通道保障', desc: '统筹全院急危重症救治设备调配蓄水池与平战结合保障机制，对全院装备重大不良事件行使一票否决权。', clause: '制度第二章 第四条' }
];

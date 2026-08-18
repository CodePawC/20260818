import { StaffRoleDefinition, StaffPersonMaster, StakeholderCluster } from '../types';

export interface StakeholderClusterDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  badgeClass: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  borderColor: string;
  iconName: string;
  isSystemDefault?: boolean;
}

export const STAKEHOLDER_CLUSTERS: StakeholderClusterDefinition[] = [
  {
    id: 'hospital_engineering',
    name: '院内医学工程与保障集群',
    shortName: '院内医工',
    description: '负责全院医疗设备抢修维护、强检计量、质控巡检、应急调配与生命周期管理。',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgColor: 'bg-indigo-50/60',
    textColor: 'text-indigo-800',
    dotColor: 'bg-indigo-600',
    borderColor: 'border-indigo-200',
    iconName: 'Wrench',
    isSystemDefault: true
  },
  {
    id: 'hospital_clinical',
    name: '院内临床与医护应用集群',
    shortName: '临床医护',
    description: '负责临床科室/病区医疗设备的日常保管使用、交接班盘点、故障即时报修与操作安全。',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-50/60',
    textColor: 'text-emerald-800',
    dotColor: 'bg-emerald-600',
    borderColor: 'border-emerald-200',
    iconName: 'Activity',
    isSystemDefault: true
  },
  {
    id: 'hospital_administration',
    name: '院内行政与职能监管集群',
    shortName: '行政职能',
    description: '涵盖医务科、护理部、院感科、财务资产科、招标采购办、保卫消防、信息安全、医保物价、审计监察及院办等管理联络人。',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    bgColor: 'bg-teal-50/60',
    textColor: 'text-teal-800',
    dotColor: 'bg-teal-600',
    borderColor: 'border-teal-200',
    iconName: 'Building2',
    isSystemDefault: true
  },
  {
    id: 'oem_vendor',
    name: '生产厂家售后与销售集群',
    shortName: '原厂售后/销售',
    description: '设备制造原厂驻场工程师(FSE)、销售专员(Sales Rep)、临床应用培训专家(FAS)及24H TAC技术支持。',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    bgColor: 'bg-amber-50/60',
    textColor: 'text-amber-800',
    dotColor: 'bg-amber-600',
    borderColor: 'border-amber-200',
    iconName: 'ShieldCheck',
    isSystemDefault: true
  },
  {
    id: 'third_party_service',
    name: '第三方维保托管服务商集群',
    shortName: '三方维保托管',
    description: '第三方ISO/维保服务商驻场工程师与项目经理，承担合同范围内的定期PM保养、大修与备件供应。',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    bgColor: 'bg-sky-50/60',
    textColor: 'text-sky-800',
    dotColor: 'bg-sky-600',
    borderColor: 'border-sky-200',
    iconName: 'Layers',
    isSystemDefault: true
  },
  {
    id: 'metrology_regulatory',
    name: '法定计量与特检监管机构集群',
    shortName: '计量与特检机构',
    description: '省/市法定计量检定所、特检院压力容器检验员、疾控放射卫生评价机构专家，依法开展强检与定级。',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    bgColor: 'bg-purple-50/60',
    textColor: 'text-purple-800',
    dotColor: 'bg-purple-600',
    borderColor: 'border-purple-200',
    iconName: 'Award',
    isSystemDefault: true
  }
];

export const DEFAULT_STAFF_ROLES: StaffRoleDefinition[] = [
  {
    id: 'ROLE_EQUIP_ADMIN',
    name: '设备管理员',
    category: 'clinical',
    categoryLabel: '临床科室管理',
    description: '负责科室设备资产建档、台账日常核对、故障报修发起、日常巡检登记与盘点。',
    badgeColor: 'indigo',
    permissions: ['台账管理', '故障报修', '日常巡检', '科室盘点', '借用申请'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_MAINT_ENGINEER',
    name: '维修工程师',
    category: 'engineering',
    categoryLabel: '医学工程保障',
    description: '负责医院医疗设备故障现场抢修、工单闭环、核心备件更换、预防性维护(PM)及技术支持。',
    badgeColor: 'emerald',
    permissions: ['工单维修', '抢修响应', '预防性维护', '配件申领', '停机诊断', '技术档案'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_METROLOGY_ADMIN',
    name: '计量管理员',
    category: 'engineering',
    categoryLabel: '医学工程保障',
    description: '负责全院强检目录政策对标、法定计量器具定级、检定周期管理、送检联络与证书归档。',
    badgeColor: 'sky',
    permissions: ['强检申报', '计量计划', '法定检定', '证书录入', '定级复核', '溯源档案'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_QC_MANAGER',
    name: '质控主管',
    category: 'engineering',
    categoryLabel: '医学工程保障',
    description: '负责在用设备安全质控抽查、不良事件监测预警、高风险设备巡查与不良事件报告。',
    badgeColor: 'purple',
    permissions: ['质控抽检', '不良事件', '风险预警', '报废鉴定', '巡检监督', '质量月报'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_DEPT_LEADER',
    name: '科室主任',
    category: 'management',
    categoryLabel: '科室与院级管理',
    description: '负责临床/医技科室设备年度预算规划、新设备立项论证审核、报废报损会签与科室资产终审。',
    badgeColor: 'amber',
    permissions: ['预算审批', '立项论证', '报废签署', '资产处置', '绩效考核'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_HEAD_NURSE',
    name: '护士长',
    category: 'clinical',
    categoryLabel: '临床科室管理',
    description: '负责临床病区急救抢救类设备日常保管、交接班清点、报修协同、应急调配协同。',
    badgeColor: 'rose',
    permissions: ['交接班盘点', '急救设备保管', '报修协同', '应急借用', '不良事件初报'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_DEPT_CONTACT',
    name: '科室责任人',
    category: 'clinical',
    categoryLabel: '临床科室管理',
    description: '作为科室对接医学工程部的首要业务对接人，负责设备安装验收、培训组织、使用日常反馈。',
    badgeColor: 'teal',
    permissions: ['验收确认', '培训签到', '使用反馈', '借还确认'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_INVENTORY_KEEPER',
    name: '库管员',
    category: 'engineering',
    categoryLabel: '医学工程保障',
    description: '负责医疗设备应急周转库、备用机出入库管理、维修备件库房进销存及待报废设备暂存。',
    badgeColor: 'slate',
    permissions: ['应急库管理', '备用机借调', '备件进销存', '报废入库', '出库出库'],
    isSystemDefault: true
  },
  // --- 行政与职能部门角色 ---
  {
    id: 'ROLE_ADMIN_MEDICAL_AFFAIRS',
    name: '医务质控专员',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责医疗技术准入评估、设备临床使用安全监控、医疗纠纷/不良事件调查及医疗质量核查。',
    badgeColor: 'teal',
    permissions: ['技术准入', '临床安全', '不良事件调查', '应急调配协同', '质量考核'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_INFECTION_CTRL',
    name: '院感监测专员',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责清洗消毒与灭菌设备效能监测、内镜洗消质控、一次性耗材与感控合规督查。',
    badgeColor: 'emerald',
    permissions: ['灭菌质控', '感控监测', '内镜洗消', '感染风险预警', '院感督导'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_FIN_ASSET',
    name: '财务资产管理员',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责全院医疗设备固定资产建卡、月度折旧计提、资产清查盘点、残值评估及报废核销。',
    badgeColor: 'amber',
    permissions: ['资产建卡', '折旧计提', '固定资产盘点', '报废核销', '成本效益核算'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_PROCUREMENT',
    name: '招标采购主管',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责医疗设备政府采购与招投标组织、供应商准入审核、设备采购商务合同履约与付款审批。',
    badgeColor: 'indigo',
    permissions: ['招投标管理', '商务合同', '供应商资质审核', '到货验收协同', '付款审核'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_IT_SECURITY',
    name: '信息网络安全员',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责医疗物联网(IoMT)设备网络准入、DICOM/PACS/HIS数据接口对接与医疗数据安全防护。',
    badgeColor: 'sky',
    permissions: ['网络准入', 'PACS/DICOM接口', '系统集成', '网络安全审计', '数据备份'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_SECURITY_FIRE',
    name: '消防安保负责人',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责高压氧舱、医用气体机房、放射源库区等重点设备安防与消防联动监控及应急演练。',
    badgeColor: 'rose',
    permissions: ['消防安全', '放射源保卫', '特种机房安防', '应急演练', '安全隐患排查'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_INSURANCE',
    name: '医保物价专员',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责医疗设备检查治疗项目物价收费编码对标、医保耗材目录维护及收费合规审核。',
    badgeColor: 'purple',
    permissions: ['物价编码', '医保对标', '收费合规审核', '医保耗材目录', '医保稽核'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_AUDIT',
    name: '审计监察专员',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责大型设备采购前置审计、维保合同执行审计、大型设备运营效益审计及廉洁风险防控。',
    badgeColor: 'slate',
    permissions: ['采购审计', '合同合规审查', '效益审计', '廉洁监察', '审计整改跟踪'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_ADMIN_NURSE_DEPT',
    name: '护理部专管员',
    category: 'administration',
    categoryLabel: '行政与职能监管',
    description: '负责全院护理单元急救生命支持设备配置标准监督、护理人员操作考核及跨科室应急调配。',
    badgeColor: 'rose',
    permissions: ['急救设备督导', '操作规范考核', '全院应急调配', '护理质控', '交接班规范'],
    isSystemDefault: true
  },
  // --- 外部合作与监管机构角色 ---
  {
    id: 'ROLE_VENDOR_ENGINEER',
    name: '驻场原厂工程师',
    category: 'partner',
    categoryLabel: '厂商与合作保障',
    description: '医疗设备生产制造原厂驻点工程师(FSE)，负责原厂专机深度维保、大修调试与核心固件升级。',
    badgeColor: 'indigo',
    permissions: ['原厂大修', '专机保修', '升级调试', '原厂备件'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_VENDOR_SALES',
    name: '原厂售后/销售专员',
    category: 'partner',
    categoryLabel: '厂商与合作保障',
    description: '设备制造原厂或总代区域客户经理，负责维保合同续签、配件订购、新装机验收协同。',
    badgeColor: 'amber',
    permissions: ['商务沟通', '配件报价', '合同续签', '培训协调'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_VENDOR_FAS',
    name: '临床应用培训专家(FAS)',
    category: 'partner',
    categoryLabel: '厂商与合作保障',
    description: '厂家临床应用专家(Field Application Specialist)，负责临床操作培训与高级功能开发。',
    badgeColor: 'purple',
    permissions: ['临床培训', '操作规范', '序列调优', '考核发证'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_THIRD_PARTY_ENG',
    name: '三方维保工程师',
    category: 'partner',
    categoryLabel: '厂商与合作保障',
    description: '第三方维保托管服务商技术工程师，负责合同范围内设备定期巡检、驻场抢修与保养记录。',
    badgeColor: 'sky',
    permissions: ['托管巡检', '日常保养', '维修响应', '巡检报告'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_METROLOGY_INSPECTOR',
    name: '法定计量检定专员',
    category: 'partner',
    categoryLabel: '计量与特检机构',
    description: '省/市法定计量技术机构检定员，依法依规实施医疗计量器具强制检定，出具检定证书/校准报告。',
    badgeColor: 'teal',
    permissions: ['强检检定', '出具证书', '定级评定', '现场核验'],
    isSystemDefault: true
  },
  {
    id: 'ROLE_SPECIAL_EQUIP_INSPECTOR',
    name: '特种设备检验员',
    category: 'partner',
    categoryLabel: '计量与特检机构',
    description: '特检院压力容器/锅炉特种设备检验员，负责高压灭菌器、医用氧舱、储气罐法定年检。',
    badgeColor: 'rose',
    permissions: ['特检年检', '容器探伤', '安全附件校验', '特检报告'],
    isSystemDefault: true
  }
];

export const SPECIALTY_DOMAIN_OPTIONS = [
  '放射影像 (CT/MRI/DR/DSA)',
  '急救生命支持 (呼吸机/除颤仪/监护仪)',
  '手术麻醉 (麻醉机/腔镜/高频电刀)',
  '检验IVD与生化 (生化/免疫/血球/POCT)',
  '超声诊断 (彩超/超声刀/探头)',
  '血液净化 (血透机/CRRT/水处理系统)',
  '消毒供应与感控 (高压灭菌器/清洗机)',
  '内窥镜系统 (胃肠镜/支气管镜/洗消)',
  '放疗与核医学 (直线加速器/SPECT)',
  '病房基础护理 (输液泵/微量泵/防压疮床)',
  '眼科与五官专科 (裂隙灯/超乳机/听力计)',
  '康复与物理治疗 (理疗仪/牵引床/水疗)',
  // 行政职能专业方向
  '医务质控与临床新技术准入',
  '院感洗消与灭菌过程监测',
  '固定资产账务、折旧与清查',
  '医疗设备招投标与采购商务',
  '医疗物联网安全与PACS/DICOM接口',
  '消防安保与放射源安全管理',
  '医保收费编码与物价核定',
  '设备采购审计与投资效益评价',
  '护理急救设备全院督导与调配'
];

export const CERTIFICATION_OPTIONS = [
  '大型医用设备上岗证 (CT/MRI/DSA)',
  '国家特种设备作业人员证 (压力容器)',
  '注册计量检定员证 (医疗计量)',
  '低压/高压电工特种作业操作证',
  '原厂维修认证工程师证书 (Level 3/4)',
  '生物安全实验室设备维保资格',
  '辐射安全与防护培训合格证',
  '临床工程技师/主管技师职称',
  '医院感染管理专职人员培训合格证',
  '注册会计师/高级会计师资格证',
  '招标师/招投标采购职业能力等级证书',
  '注册信息安全专业人员(CISP/CISAW)',
  '消防设施操作员/注册消防工程师'
];

/**
 * 智能推导干系人所属集群
 */
export function inferStakeholderCluster(
  roleName?: string, 
  deptName?: string, 
  orgName?: string
): string {
  if (orgName) {
    const org = orgName.toLowerCase();
    if (org.includes('计量') || org.includes('特检') || org.includes('疾控') || org.includes('测试院') || org.includes('市场监督')) {
      return 'metrology_regulatory';
    }
    if (org.includes('通用') || org.includes('ge') || org.includes('飞利浦') || org.includes('西门子') || org.includes('迈瑞') || org.includes('联影') || org.includes('东芝') || org.includes('佳能') || org.includes('厂商') || org.includes('厂家') || org.includes('供应商')) {
      return 'oem_vendor';
    }
    if (org.includes('托管') || org.includes('三方') || org.includes('服务公司') || org.includes('外包') || org.includes('维保科技')) {
      return 'third_party_service';
    }
  }

  if (roleName) {
    if (roleName.includes('原厂') || roleName.includes('厂家') || roleName.includes('销售') || roleName.includes('FAS')) {
      return 'oem_vendor';
    }
    if (roleName.includes('三方') || roleName.includes('第三方') || roleName.includes('托管')) {
      return 'third_party_service';
    }
    if (roleName.includes('计量检定') || roleName.includes('特种设备') || roleName.includes('特检') || roleName.includes('检定专员')) {
      return 'metrology_regulatory';
    }
    if (roleName.includes('医务') || roleName.includes('院感') || roleName.includes('财务') || roleName.includes('资产') || roleName.includes('招标') || roleName.includes('采购') || roleName.includes('信息安全') || roleName.includes('消防') || roleName.includes('保卫') || roleName.includes('医保') || roleName.includes('审计') || roleName.includes('行政主管') || roleName.includes('护理部专管')) {
      return 'hospital_administration';
    }
    if (roleName.includes('护士长') || roleName.includes('主任') || roleName.includes('技师') || roleName.includes('医生') || roleName.includes('科室责任人')) {
      return 'hospital_clinical';
    }
  }

  if (deptName) {
    if (deptName.includes('设备') || deptName.includes('医学工程') || deptName.includes('应急库') || deptName.includes('器械')) {
      return 'hospital_engineering';
    }
    if (deptName.includes('医务') || deptName.includes('护理部') || deptName.includes('院感') || deptName.includes('感染管理') || deptName.includes('财务') || deptName.includes('资产') || deptName.includes('采购') || deptName.includes('招标') || deptName.includes('保卫') || deptName.includes('消防') || deptName.includes('信息') || deptName.includes('网络') || deptName.includes('医保') || deptName.includes('物价') || deptName.includes('审计') || deptName.includes('监察') || deptName.includes('院办') || deptName.includes('办公室') || deptName.includes('人事') || deptName.includes('后勤') || deptName.includes('绩效') || deptName.includes('作风') || deptName.includes('宣教') || deptName.includes('科教')) {
      return 'hospital_administration';
    }
    return 'hospital_clinical';
  }

  return 'hospital_engineering';
}

/**
 * 获取角色徽章样式类名
 */
export function getRoleBadgeStyle(roleName: string, customRoles?: StaffRoleDefinition[]): string {
  switch (roleName) {
    case '设备管理员':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case '维修工程师':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case '计量管理员':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case '质控主管':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case '科室主任':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case '护士长':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case '科室责任人':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case '库管员':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    // 行政职能角色样式
    case '医务质控专员':
      return 'bg-teal-50 text-teal-800 border-teal-300';
    case '院感监测专员':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case '财务资产管理员':
      return 'bg-amber-50 text-amber-900 border-amber-300';
    case '招标采购主管':
      return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    case '信息网络安全员':
      return 'bg-sky-50 text-sky-800 border-sky-300';
    case '消防安保负责人':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    case '医保物价专员':
      return 'bg-purple-50 text-purple-800 border-purple-300';
    case '审计监察专员':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    case '护理部专管员':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    // 外部合作机构
    case '驻场原厂工程师':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case '原厂售后/销售专员':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case '临床应用培训专家(FAS)':
      return 'bg-purple-50 text-purple-800 border-purple-300';
    case '三方维保工程师':
      return 'bg-cyan-50 text-cyan-800 border-cyan-300';
    case '法定计量检定专员':
      return 'bg-teal-50 text-teal-800 border-teal-300';
    case '特种设备检验员':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

/**
 * 获取应急响应梯队徽章样式类名
 */
export function getEmergencyTierBadgeStyle(tier?: 'L1' | 'L2' | 'L3' | 'none'): string {
  switch (tier) {
    case 'L1':
      return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    case 'L2':
      return 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
    case 'L3':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium';
    case 'none':
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}


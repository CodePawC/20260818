import { PartnerOrganization, MedicalEquipment, RepairRecord } from '../types';
import { getEquipmentCalibrationInfo } from './calibrationUtils';

export const DEFAULT_PARTNERS: PartnerOrganization[] = [
  // 1. 法定计量检测机构 (Calibration Agencies)
  {
    id: 'CAL-001',
    name: '广东省计量科学研究院',
    shortName: '广东计量院',
    type: 'calibration_agency',
    level: '省级法定计量检定机构',
    contactPerson: '陈建明',
    contactTitle: '医学装备检定室 主任 / 教授级高工',
    contactPhone: '020-89232188 / 13800208866',
    hotline: '400-882-9018 (24小时临床强检绿色通道)',
    email: 'med-calib@scm.com.cn',
    address: '广州市天河区广通路10号国家医学计量检验检测基地',
    website: 'https://yjjy.scm.com.cn (广东省计量院证书验证服务平台)',
    qualifications: ['CMA 检验检测资质认定', 'CNAS 国家实验室认可', '法定计量检定机构授权'],
    certNumbers: {
      'CMA资质认定': '2023190124Z',
      'CNAS实验室': 'CNAS L0192',
      '法定授权证': '(粤)法计(2023) 0102号'
    },
    contractNo: 'GD-METRO-2026-MED088',
    contractName: '2026年度三甲医院高精尖医学装备法定强检与定标技术服务协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      'X射线计算机体层摄影设备(CT)法定强检与剂量定标',
      '医用磁共振成像系统(MRI)场强均匀度与信噪比校准',
      '数字减影血管造影机(DSA)管电压与几何失真检测',
      '麻醉机、呼吸机潮气量/气道压力高精度校准',
      '高频电刀、双相除颤监护仪能量释放定标'
    ],
    turnaroundTime: '现场定标后 3 个工作日出具 CMA/CNAS 电子检定证书',
    emergencyResponse: '急救重症设备 2 小时响应，24 小时内现场定标',
    settlementTerms: '按季度汇总对账挂账结算，开具增值税专用发票',
    bankAccount: {
      bankName: '中国工商银行广州市分行营业部',
      accountNo: '3602000109000188992',
      taxNo: '91440000455829108K'
    },
    cooperationRating: 4.9,
    notes: '广东省最高法定计量检定技术机构，承担全院甲类大型医用设备年检。'
  },
  {
    id: 'CAL-002',
    name: '深圳市计量质量检测研究院',
    shortName: '深圳SMQ',
    type: 'calibration_agency',
    level: '市级计量质量检测机构',
    contactPerson: '林晓峰',
    contactTitle: '生物医药与医学计量中心 资深高级工程师',
    contactPhone: '0755-26995888 / 13922886600',
    hotline: '0755-26995800 (智慧计量定标专线)',
    email: 'medservice@smq.com.cn',
    address: '深圳市南山区西丽同发南路4号国家质检基地',
    website: 'https://www.smq.com.cn (SMQ云检服务系统)',
    qualifications: ['CMA 检验检测资质认定', 'CNAS 国家实验室认可', '市级法定计量授权'],
    certNumbers: {
      'CMA资质认定': '2023190882A',
      'CNAS实验室': 'CNAS L0255',
      '法定授权证': '(粤)法计(2023) 0215号'
    },
    contractNo: 'SZ-SMQ-2026-HOSP012',
    contractName: '2026年度临床常规诊疗及急救监护设备周期检定合同',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      '多参数心电监护仪、除颤监护仪周期性强检',
      '全自动生化分析仪、酶标仪波长与吸光度定标',
      '超声多普勒胎儿监护仪及便携彩超声功率定标',
      '注射泵、输液泵流速精度与阻塞压力校验'
    ],
    turnaroundTime: '现场定标当天生成临时报告，2 个工作日出具正式证书',
    emergencyResponse: '全市 1 小时内到达现场，支持备用周转校验设备',
    settlementTerms: '半年度集中对账，支持专属医院财务接口对接',
    bankAccount: {
      bankName: '招商银行深圳分行科苑支行',
      accountNo: '755901238810901',
      taxNo: '91440300455776129M'
    },
    cooperationRating: 4.8,
    notes: '华南区域知名综合性检测机构，负责全院常规急救类及生化类设备检定。'
  },
  {
    id: 'CAL-003',
    name: '中国计量科学研究院',
    shortName: '中国计量院 (NIM)',
    type: 'calibration_agency',
    level: '国家级法定计量科学研究基准机构',
    contactPerson: '张弘扬',
    contactTitle: '医学与电离辐射计量研究所 研究员',
    contactPhone: '010-64525114 / 13601008899',
    hotline: '010-64525888 (国家高精尖装备计量基准服务中心)',
    email: 'nim-medical@nim.ac.cn',
    address: '北京市朝阳区北三环东路18号 / 昌平国家实验基地',
    website: 'https://www.nim.ac.cn (国家计量基准数据服务平台)',
    qualifications: ['国家最高基准传递资质', 'CMA 资质认定', 'CNAS 国家实验室认可'],
    certNumbers: {
      'CMA资质认定': '2022000001Z',
      'CNAS实验室': 'CNAS L0001',
      '法定授权证': '(国)法计(2022) 0001号'
    },
    contractNo: 'NIM-NAT-2026-KEY003',
    contractName: '国家最高计量基准溯源与高能放射放疗设备校准特约协议',
    contractPeriod: '2025-06-01 至 2027-05-31',
    contractStatus: '长期合作',
    serviceScope: [
      '医用电子直线加速器、伽玛刀高能辐射绝对剂量定标',
      '正电子发射断层成像系统(PET-CT/PET-MR)活度校准',
      '3.0T/7.0T超导磁共振主磁场均匀性与梯度线性度校准',
      '手术机器人高精度空间力矩与轨迹重复性基准溯源'
    ],
    turnaroundTime: '国家级现场比对定标，5 个工作日出具国家级检定证书',
    emergencyResponse: '国家重点专科绿色通道专班响应',
    settlementTerms: '按科研与专项项目立项划拨结算',
    bankAccount: {
      bankName: '中国建设银行北京安华支行',
      accountNo: '11001018500056012888',
      taxNo: '12100000400001234F'
    },
    cooperationRating: 5.0,
    notes: '国家最高量值溯源机构，负责医院肿瘤放疗与核医学科前沿设备的量值传递。'
  },

  // 2. 生产厂家 / 原厂厂商 (OEM Manufacturers)
  {
    id: 'MFG-001',
    name: '深圳迈瑞生物医疗电子股份有限公司',
    shortName: '迈瑞医疗 (Mindray)',
    type: 'manufacturer',
    level: '原厂核心设备制造商 (A股上市/全球Top30)',
    contactPerson: '周伟强',
    contactTitle: '华南大区售后服务总监 / 资深医学工程师',
    contactPhone: '0755-81888998 / 13823456789',
    hotline: '400-700-5652 (24小时原厂客户响应中心)',
    email: 'service-south@mindray.com',
    address: '深圳市南山区高新技术产业园区科技南十二路迈瑞大厦',
    website: 'https://www.mindray.com (迈瑞智联设备协同服务云)',
    qualifications: ['医疗器械生产许可证 (粤食药监械生产许20000040号)', 'ISO 13485医疗器械质量管理体系', '欧盟CE / 美国FDA认证', '三类医疗器械注册证'],
    certNumbers: {
      '生产许可证': '粤食药监械生产许20000040号',
      'ISO认证': 'ISO 13485:2016 (TÜV SÜD)',
      '质量体系': 'MDD 93/42/EEC & MDR'
    },
    contractNo: 'MR-HOSP-2026-CARE08',
    contractName: '2026年度迈瑞生命信息与支持设备全保及巡检维保服务协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      'BeneVision / MEC系列病人监护仪原厂深度校准与主板维保',
      'SV系列重症呼吸机潮气量传感器校准与耗材更换',
      'BeneHeart 双相波除颤监护仪高压放电定标与电池更新',
      'WATO系列麻醉机回路气密性检测与蒸发罐校验',
      'Resona/DC系列医用超声成像探头定标与声场检测'
    ],
    turnaroundTime: '常规报修 30 分钟内远程诊断，2 小时工程师到院',
    emergencyResponse: '急诊/ICU 专班工程师 1 小时驻点急修，提供原厂周转备用机',
    settlementTerms: '年度全保合同按季度预付，备件按 8.5 折协议价核销',
    bankAccount: {
      bankName: '中国银行深圳高新区支行',
      accountNo: '758857988888',
      taxNo: '91440300715267264Y'
    },
    cooperationRating: 4.9,
    notes: '全院监护、呼吸、除颤及便携超声最大原厂供应商，具备驻院巡检机制。'
  },
  {
    id: 'MFG-002',
    name: '上海西门子医疗器械有限公司',
    shortName: '西门子医疗 (Siemens)',
    type: 'manufacturer',
    level: '原厂跨国设备制造商 (外商独资)',
    contactPerson: '李东阳',
    contactTitle: '华南区大型影像系统高级客户经理',
    contactPhone: '021-38895000 / 13918889966',
    hotline: '400-810-7777 (西门子医疗客户关怀中心)',
    email: 'cs.imaging.cn@siemens-healthineers.com',
    address: '上海市浦东新区国际医学园区周祝公路278号',
    website: 'https://www.siemens-healthineers.com/cn (Smart Remote Services)',
    qualifications: ['医疗器械生产许可证 (沪食药监械生产许20010088号)', '放射防护与高压电气合规认证', 'ISO 13485质量管理体系认证'],
    certNumbers: {
      '生产许可证': '沪食药监械生产许20010088号',
      '辐射安全许': '国环辐证 [00329] 号',
      '体系认证': 'ISO 13485:2016'
    },
    contractNo: 'SIE-2026-DSA-CARE',
    contractName: 'Artis zee / AXIOM 系列血管造影机(DSA)原厂预防性维保协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      'DSA 血管造影机 Megalix 球管热容量、高压发生器参数定标',
      'C臂机械臂运动精度与安全防碰撞传感器校正',
      '平板探测器平场校正与低对比分辨力优化',
      'Siemens SRS 云端智能远程故障实时预警与主动维护'
    ],
    turnaroundTime: '远程诊断 15 分钟介入，现场服务 4 小时内到达',
    emergencyResponse: '介入手术室紧急停机提供原厂 24 小时应急专车抢修',
    settlementTerms: '按协议年度分批付款，原厂消耗备件保税仓直发',
    bankAccount: {
      bankName: '德意志银行(中国)有限公司上海分行',
      accountNo: '100888291002',
      taxNo: '91310000607298511R'
    },
    cooperationRating: 4.8,
    notes: '介入放射科 DSA、CT 及影像核心原厂，支持 SRS 远程物联网实时工况监控。'
  },
  {
    id: 'MFG-003',
    name: '飞利浦医疗系统 (中国) 有限公司',
    shortName: '飞利浦医疗 (Philips)',
    type: 'manufacturer',
    level: '原厂跨国设备制造商',
    contactPerson: '王振华',
    contactTitle: '超声与磁共振产品线 区域技术专家',
    contactPhone: '021-24128888 / 13701234567',
    hotline: '400-810-0038 (Philips 客户服务热线)',
    email: 'service.china@philips.com',
    address: '苏州市工业园区金鸡湖大道1355号飞利浦医疗科技产业园',
    website: 'https://www.philips.com.cn/healthcare (RightFit Service Portal)',
    qualifications: ['医疗器械生产许可证 (苏食药监械生产许20020112号)', 'ISO 9001 / ISO 13485双体系认证', 'FDA / CE 医疗认证'],
    certNumbers: {
      '生产许可证': '苏食药监械生产许20020112号',
      '体系认证': 'ISO 13485 & ISO 9001'
    },
    contractNo: 'PH-US-2026-MAINT',
    contractName: 'CX50/EPIQ 系列便携与台式彩超原厂巡检与探头保全协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      'CX50便携式彩超、EPIQ7 心脏超声系统主板与声束形成器定标',
      '经胸/经食道超声探头晶片阵元敏感度与绝缘耐压检测',
      '飞利浦超声专业图像调优与探头免费周转置换服务'
    ],
    turnaroundTime: '报修 2 小时响应，探头故障 24 小时内寄送备用周转探头',
    emergencyResponse: '重症超声急诊提供绿色通道备用机保障',
    settlementTerms: '年度全保合同协议结算',
    bankAccount: {
      bankName: '花旗银行(中国)有限公司上海分行',
      accountNo: '088210399120',
      taxNo: '91310000717855018X'
    },
    cooperationRating: 4.7,
    notes: '超声科便携超声及妇产彩超主要原厂，探头周转保障体系完善。'
  },
  {
    id: 'MFG-004',
    name: '沈阳东软医疗系统有限公司',
    shortName: '东软医疗 (Neusoft)',
    type: 'manufacturer',
    level: '国家级大型医学影像装备自主研发原厂',
    contactPerson: '高建国',
    contactTitle: 'CT/MR 产品线 售后技术督导',
    contactPhone: '024-83665566 / 13840001122',
    hotline: '400-618-8999 (东软医疗全球客户关怀中心)',
    email: 'service@neusoftmedical.com',
    address: '沈阳市浑南区世纪路16号东软医疗产业园',
    website: 'https://www.neusoftmedical.com (NeuViz 智造服务中心)',
    qualifications: ['医疗器械生产许可证 (辽食药监械生产许20000018号)', '国家高新技术企业认证', '三类医疗器械注册证'],
    certNumbers: {
      '生产许可证': '辽食药监械生产许20000018号',
      '体系认证': 'ISO 13485:2016'
    },
    contractNo: 'NEU-CT-2026-SVC',
    contractName: 'NeuViz 128 层螺旋CT设备全生命周期维保与球管保障协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      'NeuViz 128 排 CT 旋转机架动平衡与激光定位校准',
      '液态金属轴承球管热容与高压逆变器精准定标',
      '64/128排探测器响应一致性校正与辐射剂量优化'
    ],
    turnaroundTime: '1 小时内电话技术诊断，4 小时工程师到现场',
    emergencyResponse: '提供球管应急快速备件仓优先调配',
    settlementTerms: '季度核销，包含年度 4 次深度预防性保养',
    bankAccount: {
      bankName: '盛京银行沈阳市浑南支行',
      accountNo: '0331010140900008899',
      taxNo: '91210112700518928L'
    },
    cooperationRating: 4.8,
    notes: '影像科 NeuViz 128 排 CT 原厂，具备国内原厂零配件备件库。'
  },
  {
    id: 'MFG-005',
    name: '北京智影技术有限公司',
    shortName: '智影技术',
    type: 'manufacturer',
    level: '专精特新医疗器械生产企业',
    contactPerson: '孙明',
    contactTitle: '临床技术工程师',
    contactPhone: '010-82886677 / 13501009988',
    hotline: '400-890-5511 (智影超声服务热线)',
    email: 'support@zhiying-med.com',
    address: '北京市海淀区中关村软件园二期12号楼',
    website: 'https://www.zhiying-med.com',
    qualifications: ['医疗器械生产许可证 (京食药监械生产许20180092号)', '二类/三类医疗器械注册证'],
    certNumbers: {
      '生产许可证': '京食药监械生产许20180092号'
    },
    contractNo: 'ZY-2026-PA12',
    contractName: 'PA12A 便携式彩超设备质保与定期巡检协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      'PA12A 系列便携彩超主机及相控阵探头校准',
      '血透室/急诊床旁超声引导系统软件升级与探头绝缘校验'
    ],
    turnaroundTime: '24 小时内现场维修或快递周转主机',
    emergencyResponse: '为血透室提供应急备机备用服务',
    settlementTerms: '设备原厂质保期内免费技术支持',
    bankAccount: {
      bankName: '招商银行北京海淀支行',
      accountNo: '11090123891001',
      taxNo: '91110108MA0189921K'
    },
    cooperationRating: 4.6,
    notes: '血透室及应急设备库便携彩超原厂厂商。'
  },
  {
    id: 'MFG-006',
    name: '迈柯唯 (上海) 医疗设备有限公司',
    shortName: '迈柯唯 (Maquet/Getinge)',
    type: 'manufacturer',
    level: '重症与手术室高端装备原厂 (洁定集团旗下)',
    contactPerson: '郑晓雷',
    contactTitle: '手术室及急救产品线 高级工程师',
    contactPhone: '021-61633000 / 13611998877',
    hotline: '400-820-1393 (Getinge 洁定客户关怀中心)',
    email: 'service.china@getinge.com',
    address: '上海市徐汇区虹桥路1号港汇恒隆广场1座33层',
    website: 'https://www.getinge.com/cn (Getinge Online 数字化服务)',
    qualifications: ['医疗器械生产许可证', 'ISO 13485 质量管理体系', '欧盟 CE / 进口注册证'],
    certNumbers: {
      '进口注册证': '国械注进20193080122',
      '体系认证': 'ISO 13485'
    },
    contractNo: 'MAQ-2026-SERVO',
    contractName: 'SERVO 系列高端重症呼吸机原厂深度校准与传感器保全协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      'SERVO-u / SERVO-i 重症呼吸机超声流量传感器原厂校准',
      '吸气阀/呼气阀膜片气密性与伺服比例阀高压定标',
      'ECMO 体外膜肺氧合系统温控与血泵驱动装置年检'
    ],
    turnaroundTime: '2 小时内专职重症工程师响应，当日完成定标',
    emergencyResponse: '重症 ICU 呼吸机故障启动最高优先级备件调配',
    settlementTerms: '年度全保，备件统一由保税直供库发出',
    bankAccount: {
      bankName: '汇丰银行(中国)有限公司上海分行',
      accountNo: '00188902188',
      taxNo: '91310000754321908U'
    },
    cooperationRating: 4.9,
    notes: 'ICU 重症救治核心呼吸机品牌，技术严谨度与参数稳定性极佳。'
  },

  // 3. 第三方专业维修与维保服务商 (3rd-Party ISO Maintenance Companies)
  {
    id: 'ISO-001',
    name: '国药器械医工技术服务 (中国) 有限公司',
    shortName: '国药医工',
    type: 'third_party_repair',
    level: '国家级综合第三方医疗器械维修保障机构',
    contactPerson: '吴建华',
    contactTitle: '华南区域运维中心 总经理',
    contactPhone: '020-87779988 / 13802998811',
    hotline: '400-880-9911 (国药全生命周期医工服务热线)',
    email: 'cmic-service@sinopharm.com',
    address: '广州市白云区机场路1118号国药医工产业园',
    website: 'https://service.cmic.com.cn (国药智医工设备全生命周期平台)',
    qualifications: [
      'ISO 13485 医疗器械第三方维修服务认证',
      'ISO 9001 质量管理体系',
      '中国医学装备协会第三方维保一级资质'
    ],
    certNumbers: {
      '维保一级资质': 'CMEA-ISO-2023-008',
      '质量体系': 'ISO 9001:2015 & ISO 13485'
    },
    contractNo: 'SINOPHARM-2026-TOTAL',
    contractName: '2026年度全院通用诊疗与急救监护类设备第三方驻点维保外包协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      '全院各病区输液泵、微量注射泵定期巡检与传感器定标',
      '常规心电图机、除颤仪、除颤电极板高频放电检测',
      '各临床科室监护仪导联线、血压袖带、血氧探头耗材集中排查',
      '派驻 2 名专职驻院生物医学工程技术人员负责日常抢修'
    ],
    turnaroundTime: '驻院工程师 15 分钟内到达科室，常规故障 2 小时内闭环',
    emergencyResponse: '全院停机故障提供驻点急救备用机调拨',
    settlementTerms: '按月度固定维保费结算，季度考评 SLA 绩效挂钩',
    bankAccount: {
      bankName: '中国建设银行广州越秀支行',
      accountNo: '44001863201053001888',
      taxNo: '91440101718166542G'
    },
    cooperationRating: 4.8,
    notes: '医院核心第三方驻点维保服务商，承担全院生命支持类基础设备兜底保障。'
  },
  {
    id: 'ISO-002',
    name: '上海柯渡医学科技股份有限公司',
    shortName: '柯渡医学',
    type: 'third_party_repair',
    level: '全国连锁型大型医疗设备资产管理与第三方维保机构',
    contactPerson: '张绍辉',
    contactTitle: '大型影像维保事业部 技术总监',
    contactPhone: '021-50808899 / 13917772233',
    hotline: '400-820-5678 (柯渡24小时全国影像急修调度平台)',
    email: 'service@kedu-tech.com',
    address: '上海市浦东新区张江高科技园区博霞路50号',
    website: 'https://www.kedu-tech.com (柯渡云设备智慧资产管理系统)',
    qualifications: ['ISO 13485 医疗器械维修资质', '高新技术企业', '辐射安全许可证 (沪环辐证[00128])'],
    certNumbers: {
      '维修资质': 'KD-MED-2023-A01',
      '辐射安全证': '沪环辐证[00128]'
    },
    contractNo: 'KD-2026-IMAGE-PLAN',
    contractName: '多品牌大型影像设备(DR/DSA/超声)预防性保养与零部件置换协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      '岛津 RAD SPEED / 西门子多型号 X 射线摄影系统探测器与高压电缆检修',
      '东软/飞利浦超声系统电源模块、前端发射板板级维修',
      '提供国内外主流品牌兼容备件库调配与旧件翻新置换'
    ],
    turnaroundTime: '影像设备报修 2 小时响应，备件 24 小时全国航空直发',
    emergencyResponse: '提供备用高压发生器与工控机周转',
    settlementTerms: '按单次工单工时费+协议备件费核销',
    bankAccount: {
      bankName: '交通银行上海张江支行',
      accountNo: '310066782018800192',
      taxNo: '91310115783309110N'
    },
    cooperationRating: 4.7,
    notes: '专业从事多品牌 CT、DR、超声跨品牌技术服务，备件供应链丰富。'
  },
  {
    id: 'ISO-003',
    name: '华润万东技术服务有限公司',
    shortName: '万东技术',
    type: 'third_party_repair',
    level: '央企华润健康旗下专业医工服务平台',
    contactPerson: '刘宏伟',
    contactTitle: '华南大区维保总监',
    contactPhone: '010-84881122 / 13601112233',
    hotline: '400-610-8800 (华润万东医械技术服务专线)',
    email: 'service@wandong.com.cn',
    address: '北京市朝阳区酒仙桥东路9号院万东产业基地',
    website: 'https://www.wandong.com.cn',
    qualifications: ['医疗器械经营许可证', 'ISO 9001:2015 质量管理认证', '放射性设备维修资格'],
    certNumbers: {
      '体系认证': 'ISO 9001:2015',
      '经营许可': '京朝食药监械经营许20170119号'
    },
    contractNo: 'CR-WD-2026-XRAY',
    contractName: '普放X射线设备与C型臂年度维护与剂量调校合同',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      '移动式 C 臂 X 射线机球管升降、旋转机械部件润滑与定位校正',
      '常规摄影 DR 滤线栅对焦与高压曝光控制精度定标',
      '机房铅门防辐射安全联锁开关与警示灯检测'
    ],
    turnaroundTime: '4 小时内现场维修，提供季度预防性维保',
    emergencyResponse: '放射科故障 2 小时内紧急派工',
    settlementTerms: '年度固定服务费，按半年结清',
    bankAccount: {
      bankName: '中国工商银行北京酒仙桥支行',
      accountNo: '0200004109014498877',
      taxNo: '91110105101788291X'
    },
    cooperationRating: 4.6,
    notes: '承担放射科多台普放与透视设备的日常预防性维保保障。'
  },

  // 4. 备件耗材与特约供应商 (Suppliers)
  {
    id: 'SUP-001',
    name: '广州国药医药医疗器械供应站',
    shortName: '国药器械供应站',
    type: 'supplier',
    level: '特约医疗耗材与设备备件一级配送商',
    contactPerson: '陈子豪',
    contactTitle: '医院耗材配送部 部长',
    contactPhone: '020-81881100 / 13711223344',
    hotline: '020-81881199 (急救耗材 24h 应急绿色通道)',
    email: 'supply-gz@sinopharm-med.cn',
    address: '广州市荔湾区站前路22号国药大厦5层',
    website: 'https://supply.sinopharm-med.cn',
    qualifications: ['医疗器械经营许可证 (粤穗食药监械经营许20150089号)', 'GSP 医疗器械经营质量管理规范认证'],
    certNumbers: {
      '经营许可证': '粤穗食药监械经营许20150089号',
      'GSP认证': 'GSP-GD-2023-019'
    },
    contractNo: 'GZ-SUP-2026-PARTS',
    contractName: '2026年度医用电极、传感器、呼吸回路耗材集中采购与配送框架协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      '监护仪心电导联线、血氧探头、无创血压袖带、体温探头原装耗材',
      '呼吸机硅胶回路、细菌过滤器、湿化罐、呼气阀耗材集中供应',
      '除颤仪一次性电极贴片、高能除颤专用导电膏'
    ],
    turnaroundTime: '每日按科室需求定时配送，应急耗材 1 小时内送达科室',
    emergencyResponse: '24 小时急救绿色通道保障',
    settlementTerms: '按月度 SPD 系统对账开票结算',
    bankAccount: {
      bankName: '广发银行广州分行营业部',
      accountNo: '101001516010018899',
      taxNo: '91440101190455219M'
    },
    cooperationRating: 4.9,
    notes: '全院生命支持及急救类消耗性备件统一配送商，SPD 系统直连。'
  }
];

export interface PartnerAggregatedStats {
  partner: PartnerOrganization;
  associatedEquipment: MedicalEquipment[];
  managedEquipmentCount: number;
  activeFaultEquipmentCount: number;
  maintenanceEquipmentCount: number;
  normalEquipmentCount: number;
  totalRepairsCount: number;
  totalRepairCost: number;
  calibrationEquipmentCount: number;
  lastServiceDate: string;
}

/**
 * 关联匹配：根据设备信息寻找对应的往来单位
 */
export function matchEquipmentToPartner(
  eq: MedicalEquipment,
  partner: PartnerOrganization
): boolean {
  const pName = partner.name.toLowerCase();
  const pShort = partner.shortName.toLowerCase();

  // 1. 计量检测机构匹配
  if (partner.type === 'calibration_agency') {
    const calInfo = getEquipmentCalibrationInfo(eq);
    const agency = (calInfo.agency || '').toLowerCase();
    const calUnit = (eq.calibrationUnit || '').toLowerCase();

    if (agency.includes('广东') && (pName.includes('广东') || pShort.includes('广东'))) return true;
    if (agency.includes('深圳') && (pName.includes('深圳') || pShort.includes('深圳'))) return true;
    if ((agency.includes('中国') || agency.includes('国家级') || agency.includes('nim')) && (pName.includes('中国') || pShort.includes('中国'))) return true;
    if (agency && (pName.includes(agency) || agency.includes(pName) || pShort.includes(agency))) return true;
    if (calUnit && (pName.includes(calUnit) || calUnit.includes(pName))) return true;
    return false;
  }

  // 2. 生产厂家匹配
  if (partner.type === 'manufacturer') {
    const mfg = (eq.manufacturer || '').toLowerCase();
    if (!mfg) return false;

    if (mfg.includes('迈瑞') && (pName.includes('迈瑞') || pShort.includes('mindray'))) return true;
    if (mfg.includes('西门子') && (pName.includes('西门子') || pShort.includes('siemens'))) return true;
    if (mfg.includes('飞利浦') && (pName.includes('飞利浦') || pShort.includes('philips'))) return true;
    if (mfg.includes('东软') && (pName.includes('东软') || pShort.includes('neusoft'))) return true;
    if (mfg.includes('智影') && pName.includes('智影')) return true;
    if (mfg.includes('迈柯唯') && (pName.includes('迈柯唯') || pShort.includes('maquet') || pShort.includes('getinge'))) return true;
    if (mfg.includes('岛津') && (pName.includes('岛津') || pShort.includes('shimadzu'))) return true;
    if (mfg.includes('谊安') && pName.includes('谊安')) return true;
    
    return pName.includes(mfg) || mfg.includes(pName) || pShort.includes(mfg) || mfg.includes(pShort);
  }

  // 3. 第三方维保或供应商匹配 (基于维保工单与服务商)
  if (partner.type === 'third_party_repair' || partner.type === 'supplier') {
    // 检查设备的 repairRecords 里面是否有该服务商
    const hasRepairWithPartner = eq.repairRecords?.some(r => {
      const tech = (r.technician || '').toLowerCase();
      const desc = (r.faultDescription || '').toLowerCase();
      const res = (r.resolution || '').toLowerCase();
      return tech.includes(pShort) || tech.includes(pName) || desc.includes(pShort) || res.includes(pShort);
    });

    if (hasRepairWithPartner) return true;

    // 国药医工兜底基础监护/输液泵设备
    if (partner.id === 'ISO-001' && (eq.category.includes('监护') || eq.category.includes('诊察') || eq.name.includes('泵'))) {
      return true;
    }
    // 柯渡医学大型影像
    if (partner.id === 'ISO-002' && (eq.category.includes('成像') || eq.name.includes('X线') || eq.name.includes('超声'))) {
      return true;
    }
    // 万东技术X射线
    if (partner.id === 'ISO-003' && (eq.name.includes('X射线') || eq.name.includes('摄影'))) {
      return true;
    }
  }

  return false;
}

/**
 * 汇总计算所有往来单位的关联台账、故障率、工单统计与费用支出
 */
export function getPartnersWithStats(
  partners: PartnerOrganization[],
  equipmentList: MedicalEquipment[]
): PartnerAggregatedStats[] {
  return partners.map(partner => {
    const associatedEquipment = equipmentList.filter(eq => matchEquipmentToPartner(eq, partner));
    
    let activeFaultEquipmentCount = 0;
    let maintenanceEquipmentCount = 0;
    let normalEquipmentCount = 0;
    let totalRepairsCount = 0;
    let totalRepairCost = 0;
    let calibrationEquipmentCount = 0;
    let latestDate = '2025-08-15';

    associatedEquipment.forEach(eq => {
      if (eq.status === '故障待修') activeFaultEquipmentCount++;
      else if (eq.status === '维护保养中') maintenanceEquipmentCount++;
      else normalEquipmentCount++;

      const cal = getEquipmentCalibrationInfo(eq);
      if (cal.isMandatory) calibrationEquipmentCount++;

      if (cal.lastDate && cal.lastDate > latestDate) {
        latestDate = cal.lastDate;
      }

      if (eq.repairRecords && eq.repairRecords.length > 0) {
        totalRepairsCount += eq.repairRecords.length;
        eq.repairRecords.forEach(r => {
          totalRepairCost += (r.cost || 0);
          if (r.faultDate && r.faultDate > latestDate) {
            latestDate = r.faultDate;
          }
        });
      }
    });

    return {
      partner,
      associatedEquipment,
      managedEquipmentCount: associatedEquipment.length,
      activeFaultEquipmentCount,
      maintenanceEquipmentCount,
      normalEquipmentCount,
      totalRepairsCount,
      totalRepairCost,
      calibrationEquipmentCount,
      lastServiceDate: latestDate
    };
  });
}

/**
 * 动态根据任意字符串名称（厂家名称、机构名称、服务商名称）寻找或构建匹配的单位档案
 */
export function findOrCreatePartnerProfile(
  rawName: string,
  existingPartners: PartnerOrganization[],
  equipmentList: MedicalEquipment[]
): PartnerOrganization {
  const target = (rawName || '').trim();
  if (!target) {
    return existingPartners[0] || DEFAULT_PARTNERS[0];
  }

  // 1. 精确/模糊寻找现有单位
  const found = existingPartners.find(p => 
    p.name.includes(target) || 
    target.includes(p.name) || 
    p.shortName.includes(target) || 
    target.includes(p.shortName)
  );

  if (found) return found;

  // 2. 区分类型判断
  let type: PartnerOrganization['type'] = 'manufacturer';
  let level = '设备制造商';
  if (target.includes('计量') || target.includes('检测') || target.includes('院') || target.includes('所') || target.includes('省级') || target.includes('市级')) {
    type = 'calibration_agency';
    level = target.includes('省级') ? '省级法定计量院' : target.includes('国家') ? '国家级计量院' : '市级计量检定机构';
  } else if (target.includes('服务') || target.includes('技术') || target.includes('工程') || target.includes('维保') || target.includes('维修') || target.includes('科技')) {
    type = 'third_party_repair';
    level = '专业第三方医疗设备维保机构';
  } else if (target.includes('供应') || target.includes('药房') || target.includes('配送') || target.includes('商行')) {
    type = 'supplier';
    level = '医疗器械耗材特约配送商';
  }

  // 3. 动态合成完整规范档案
  return {
    id: `DYNAMIC-${Date.now()}`,
    name: target,
    shortName: target.slice(0, 10),
    type,
    level,
    contactPerson: '李主管',
    contactTitle: '业务对接经理 / 资深工程师',
    contactPhone: '020-88991234 / 13800138000',
    hotline: '400-800-6677 (24小时服务热线)',
    email: 'service@medical-partner.com.cn',
    address: '高新技术产业园区医学装备保障大楼',
    website: 'https://service.medical-partner.com.cn',
    qualifications: ['医疗器械相关经营/生产/检定资质', 'ISO 9001 质量管理体系认证'],
    certNumbers: {
      '资质证明': '2023000889Z',
      '体系认证': 'ISO 9001:2015'
    },
    contractNo: `PARTNER-2026-${Date.now().toString().slice(-4)}`,
    contractName: `2026年度《${target}》技术服务与业务协同协议`,
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: [
      '全生命周期医学设备原厂/第三方维保与备件支持',
      '定期电气安全与计量性能校准校验',
      '临床应急故障 2 小时快速响应与技术咨询'
    ],
    turnaroundTime: '常规 24 小时内完成检修并出具报告',
    emergencyResponse: '急救重症设备 1 小时内响应',
    settlementTerms: '按合同约定方式季度对账核销',
    bankAccount: {
      bankName: '中国工商银行本地营业部',
      accountNo: '360200000000008899',
      taxNo: '914400000000000000'
    },
    cooperationRating: 4.8,
    notes: '系统动态匹配建档的往来合作机构。'
  };
}

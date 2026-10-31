import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Wrench, 
  Users, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  ChevronRight, 
  X, 
  FileText, 
  Phone, 
  Sparkles, 
  BadgeCheck, 
  Target, 
  AlertTriangle, 
  ExternalLink, 
  Printer, 
  Download, 
  Search, 
  UserCheck, 
  Layers, 
  Check, 
  FolderCheck,
  Stethoscope,
  HeartPulse,
  Radio,
  Sliders,
  Maximize2
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';
import { DepartmentDetailModal } from './DepartmentDetailModal';

export type ManagementTierNode = 'executive_leadership' | 'equipment_dept' | 'clinical_dept';

export interface ThreeTierDiagramProps {
  onNavigateToTab?: (tab: ActiveTab) => void;
  showToast?: (message: string) => void;
  currentUser?: AuthUser;
  className?: string;
  defaultExpandedNode?: ManagementTierNode | null;
}

// 医疗设备科负责工程师列表
interface ResponsibleEngineer {
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
interface ClinicalPairingRecord {
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
interface QualityProjectItem {
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

export const ThreeTierManagementArchitectureDiagram: React.FC<ThreeTierDiagramProps> = ({
  onNavigateToTab,
  showToast,
  currentUser,
  className = '',
  defaultExpandedNode = null
}) => {
  // 部门详情弹窗状态 (用于展示职责清单、负责工程师及年度质控项目)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeptType, setSelectedDeptType] = useState<ManagementTierNode>('equipment_dept');
  const [selectedDeptName, setSelectedDeptName] = useState('医疗设备科');
  const [modalInitialTab, setModalInitialTab] = useState<'duties' | 'engineers' | 'projects'>('duties');

  // 打开部门详情模态弹窗
  const handleOpenDepartmentDetailModal = (deptName: string, deptType: ManagementTierNode, tab: 'duties' | 'engineers' | 'projects' = 'duties') => {
    setSelectedDeptName(deptName);
    setSelectedDeptType(deptType);
    setModalInitialTab(tab);
    setModalOpen(true);
  };

  // 当前弹窗/抽屉选中的层级节点 (向下兼容)
  const [activeDrawerNode, setActiveDrawerNode] = useState<ManagementTierNode | null>(defaultExpandedNode);
  
  // 抽屉内部活动的选项卡: 'duties' (管理职责清单) | 'engineers' (负责工程师/安全员列表) | 'projects' (年度重点质控项目)
  const [drawerActiveTab, setDrawerActiveTab] = useState<'duties' | 'engineers' | 'projects'>('duties');

  // 搜索关键字 (用于过滤职责/工程师/科室)
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 医疗设备科 专职负责工程师队伍
  const equipmentEngineers: ResponsibleEngineer[] = useMemo(() => [
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
  ], []);

  // 2. 第三级 · 临床使用部门对口包科工程师与各科室专兼职设备安全员配对表
  const clinicalPairingList: ClinicalPairingRecord[] = useMemo(() => [
    {
      departmentId: '261',
      departmentName: '重症医学科 (ICU)',
      location: '1号楼 综合楼 7F',
      safetyOfficerName: '张雪梅',
      safetyOfficerTitle: '副主任护师 / ICU科护士长兼设备安全员',
      safetyOfficerPhone: '7991278',
      pairedEngineerName: '孙志强 (对口工程师) / 崔伟 (主管)',
      pairedEngineerPhone: '13963381120',
      pairedEngineerSpecialty: '重症监护、有创呼吸机、血气分析仪、CRRT',
      totalEquipmentCount: 68,
      lifeSupportCount: 42,
      lastQcInspectionDate: '2026-10-24',
      status: '达标在册'
    },
    {
      departmentId: '286',
      departmentName: '麻醉手术科',
      location: '1号楼 综合楼 8F',
      safetyOfficerName: '黄晓彤',
      safetyOfficerTitle: '副主任护师 / 手术室护士长兼设备安全员',
      safetyOfficerPhone: '7991086',
      pairedEngineerName: '刘海波 (驻点专员) / 崔伟 (主管)',
      pairedEngineerPhone: '13863391823',
      pairedEngineerSpecialty: '麻醉工作站、腔镜系统、高频电刀、除颤仪',
      totalEquipmentCount: 142,
      lifeSupportCount: 56,
      lastQcInspectionDate: '2026-10-25',
      status: '达标在册'
    },
    {
      departmentId: '280',
      departmentName: '急诊科 / 创伤急救中心',
      location: '1号楼 综合楼 1F',
      safetyOfficerName: '王海燕',
      safetyOfficerTitle: '主管护师 / 急诊科护士长兼设备安全员',
      safetyOfficerPhone: '7991065',
      pairedEngineerName: '崔伟 (对口工程师) / 李强 (急救库管)',
      pairedEngineerPhone: '13863373257',
      pairedEngineerSpecialty: '自动心肺复苏机、除颤起搏仪、转运监护仪',
      totalEquipmentCount: 54,
      lifeSupportCount: 38,
      lastQcInspectionDate: '2026-10-27',
      status: '达标在册'
    },
    {
      departmentId: '284',
      departmentName: '血液透析室',
      location: '1号楼 综合楼 6F',
      safetyOfficerName: '丁翠萍',
      safetyOfficerTitle: '主管护师 / 血透室护士长兼设备安全员',
      safetyOfficerPhone: '7991068',
      pairedEngineerName: '陈亮 (专职工程师)',
      pairedEngineerPhone: '13963301988',
      pairedEngineerSpecialty: '透析机、反渗透水处理主机、消毒系统',
      totalEquipmentCount: 45,
      lifeSupportCount: 40,
      lastQcInspectionDate: '2026-10-26',
      status: '达标在册'
    },
    {
      departmentId: '293',
      departmentName: '医学影像科 (CT/MRI/DR)',
      location: '1号楼 综合楼 -1F / 1F',
      safetyOfficerName: '赵主任',
      safetyOfficerTitle: '副主任技师 / 影像科技师长兼设备安全员',
      safetyOfficerPhone: '7991060',
      pairedEngineerName: '王建国 (对口工程师)',
      pairedEngineerPhone: '13706332190',
      pairedEngineerSpecialty: '联影超高端CT、飞利浦MRI、安健DR',
      totalEquipmentCount: 19,
      lifeSupportCount: 4,
      lastQcInspectionDate: '2026-10-20',
      status: '达标在册'
    },
    {
      departmentId: '292',
      departmentName: '医学检验科 / 输血科',
      location: '1号楼 综合楼 3F',
      safetyOfficerName: '尹科长',
      safetyOfficerTitle: '主管检验师 / 检验科质量秘书',
      safetyOfficerPhone: '7991115',
      pairedEngineerName: '孙志强 (对口工程师)',
      pairedEngineerPhone: '13963381120',
      pairedEngineerSpecialty: '生化分析流水线、化学发光仪、血球分析仪',
      totalEquipmentCount: 52,
      lifeSupportCount: 2,
      lastQcInspectionDate: '2026-10-22',
      status: '达标在册'
    },
    {
      departmentId: '272',
      departmentName: '心血管内科病区 / CCU',
      location: '1号楼 综合楼 13F',
      safetyOfficerName: '李春霞',
      safetyOfficerTitle: '主管护师 / 心内科护士长兼设备安全员',
      safetyOfficerPhone: '7991091',
      pairedEngineerName: '崔伟 (对口工程师)',
      pairedEngineerPhone: '13863373257',
      pairedEngineerSpecialty: '遥测心电监护系统、除颤仪、注射泵',
      totalEquipmentCount: 38,
      lifeSupportCount: 22,
      lastQcInspectionDate: '2026-10-26',
      status: '达标在册'
    },
    {
      departmentId: '271',
      departmentName: '神经内科病区 / 卒中中心',
      location: '1号楼 综合楼 14F',
      safetyOfficerName: '许桂花',
      safetyOfficerTitle: '主管护师 / 神经内科护士长兼设备安全员',
      safetyOfficerPhone: '7991090',
      pairedEngineerName: '陈亮 (对口工程师)',
      pairedEngineerPhone: '13963301988',
      pairedEngineerSpecialty: '亚低温控温仪、脑电地形图仪、微量泵',
      totalEquipmentCount: 34,
      lifeSupportCount: 16,
      lastQcInspectionDate: '2026-10-23',
      status: '达标在册'
    }
  ], []);

  // 3. 当前正在执行的年度重点质控项目
  const qualityProjectsList: QualityProjectItem[] = useMemo(() => [
    // 医疗设备科牵头的质控项目
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

    // 使用部门日常质控项目
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

    // 院领导决策层项目
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
  ], []);

  // 4. 根据当前搜索词与选中节点过滤数据
  const filteredEngineers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return equipmentEngineers.filter(eng => {
      if (!q) return true;
      return (
        eng.name.toLowerCase().includes(q) ||
        eng.role.toLowerCase().includes(q) ||
        eng.specialtyDomain.toLowerCase().includes(q) ||
        eng.phone.includes(q) ||
        eng.pairedDepartments.some(d => d.toLowerCase().includes(q))
      );
    });
  }, [equipmentEngineers, searchQuery]);

  const filteredClinicalPairings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clinicalPairingList.filter(item => {
      if (!q) return true;
      return (
        item.departmentName.toLowerCase().includes(q) ||
        item.safetyOfficerName.toLowerCase().includes(q) ||
        item.pairedEngineerName.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [clinicalPairingList, searchQuery]);

  const currentTierProjects = useMemo(() => {
    if (!activeDrawerNode) return [];
    return qualityProjectsList.filter(p => p.tier === activeDrawerNode);
  }, [qualityProjectsList, activeDrawerNode]);

  // 打开抽屉函数
  const handleOpenDrawer = (node: ManagementTierNode, initialTab: 'duties' | 'engineers' | 'projects' = 'duties') => {
    setActiveDrawerNode(node);
    setDrawerActiveTab(initialTab);
    setSearchQuery('');
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setActiveDrawerNode(null);
  };

  // 打印职责清单与项目表
  const handlePrintDrawerContent = () => {
    window.print();
    if (showToast) {
      showToast('已调起打印预览，可另存为规范公文 PDF 文件');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* ==================== 1. 医学装备三级管理架构图核心交互全景 ==================== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden p-5 sm:p-7 text-white relative">
        {/* 背景微光与网格修饰 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* 顶部标题栏与规范徽章 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>三级管理体系 · 核心架构</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">
                三级综合医院评审标准 6.5.1
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                院医工发〔2026〕18号配套标准
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2 font-serif">
              <span>五莲县人民医院医学装备三级管理架构图</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              遵循“统一领导、归口管理、分级负责、权责一致”法定原则，点击各级节点即可自动展开详细管理职责清单、负责工程师列表及年度质控项目
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>支持节点点击穿透交互</span>
            </span>
          </div>
        </div>

        {/* 架构节点拓扑卡片群 (上中下 三级联动流转) */}
        <div className="mt-6 space-y-4 relative z-10">
          
          {/* ================= 第一级 · 主管领导决策层 ================= */}
          <div className="flex flex-col items-center">
            <div 
              onClick={() => handleOpenDepartmentDetailModal('主管领导 (决策管理层)', 'executive_leadership', 'duties')}
              className={`w-full max-w-2xl bg-gradient-to-r from-slate-800/90 via-indigo-900/60 to-slate-800/90 hover:from-slate-800 hover:via-indigo-800/70 hover:to-slate-800 border rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-lg relative ${
                activeDrawerNode === 'executive_leadership' 
                  ? 'border-indigo-400 ring-2 ring-indigo-400/30 shadow-indigo-500/20' 
                  : 'border-slate-700/80 hover:border-indigo-400/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30 font-mono">
                        第一级 · 决策层
                      </span>
                      <h3 className="text-base font-bold text-white tracking-wide group-hover:text-indigo-200 transition-colors">
                        主管领导 (分管院领导 / 院党委会)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      直接负责全院医学装备管理，全院资金预算统筹、重大设备配置论证决策及专业技术梯队建设
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDepartmentDetailModal('主管领导 (决策管理层)', 'executive_leadership', 'duties');
                    }}
                    className="text-[11px] font-bold text-indigo-300 group-hover:text-white flex items-center gap-1 transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer"
                  >
                    <span>查验领导决策权责</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* 纵向协同联络线 1 -> 2 */}
            <div className="flex flex-col items-center my-1 select-none pointer-events-none">
              <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-400 to-blue-500" />
              <div className="px-3 py-0.5 rounded-full bg-slate-800/90 text-slate-400 text-[10px] font-mono border border-slate-700/80 flex items-center gap-1 shadow-2xs">
                <span>资金统筹预算审批 ↓ ↑ 重大技术风险呈报</span>
              </div>
              <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-blue-400" />
            </div>
          </div>

          {/* ================= 第二级 · 医疗设备科归口管理层 (重点交互节点) ================= */}
          <div className="flex flex-col items-center">
            <div 
              onClick={() => handleOpenDepartmentDetailModal('医疗设备科 (医学工程保障中心)', 'equipment_dept', 'duties')}
              className={`w-full max-w-3xl bg-gradient-to-r from-blue-950/80 via-slate-800 to-blue-950/80 hover:from-blue-900/90 hover:via-slate-800 hover:to-blue-900/90 border rounded-2xl p-4.5 sm:p-5 transition-all duration-200 cursor-pointer group shadow-xl relative ${
                activeDrawerNode === 'equipment_dept'
                  ? 'border-blue-400 ring-4 ring-blue-400/30 shadow-blue-500/20'
                  : 'border-blue-500/60 hover:border-blue-400'
              }`}
            >
              {/* 醒目交互提示角标 */}
              <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-extrabold rounded-full shadow-md flex items-center gap-1 animate-bounce">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>核心归口节点 · 点击触发详情弹窗</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shrink-0 group-hover:scale-105 transition-transform ring-2 ring-blue-400/30">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30 font-mono">
                        第二级 · 归口管理层
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide group-hover:text-cyan-200 transition-colors flex items-center gap-1.5">
                        <span>医疗设备科 (医学工程保障中心)</span>
                        <BadgeCheck className="w-4 h-4 text-cyan-400" />
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      全院医学装备归口职能部门，参加医疗设备规划调研、立项论证、招标采购、合同验收、维保强检、质控程序归档及报废鉴定全过程
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 bg-blue-900/60 px-2.5 py-1 rounded-lg border border-blue-700/50">
                    <span>职责 10项</span>
                    <span>·</span>
                    <span>工程师 8人</span>
                    <span>·</span>
                    <span>重点质控 4项</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDepartmentDetailModal('医疗设备科 (医学工程保障中心)', 'equipment_dept', 'duties');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer group-hover:ring-2 group-hover:ring-blue-300"
                  >
                    <span>展开科室管理清单</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 核心职责要点快速指示药丸 */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ① 立项论证与招采
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ② 安装调试与验收
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ③ 周期维保与PM
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ④ 强检与法制计量
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ⑤ 耗材配件供应
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ⑥ 大型设备ROI分析
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ⑦ 急救机具热备完好
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ⑧ 技术鉴定与淘汰报废
                </span>
              </div>
            </div>

            {/* 纵向双向互动联络线 2 -> 3 */}
            <div className="flex flex-col items-center my-1 select-none pointer-events-none">
              <div className="w-0.5 h-4 bg-gradient-to-b from-blue-400 to-emerald-500" />
              <div className="px-3 py-0.5 rounded-full bg-slate-800/90 text-slate-400 text-[10px] font-mono border border-slate-700/80 flex items-center gap-1 shadow-2xs">
                <span>业务指导·PM维保·强检定标 ↓ ↑ 每日交接点检·规范操作·故障首报</span>
              </div>
              <div className="w-0.5 h-4 bg-gradient-to-b from-emerald-500 to-emerald-400" />
            </div>
          </div>

          {/* ================= 第三级 · 使用部门临床执行层 (重点交互节点) ================= */}
          <div className="flex flex-col items-center">
            <div 
              onClick={() => handleOpenDepartmentDetailModal('医学装备使用部门 (全院各临床医技科室)', 'clinical_dept', 'duties')}
              className={`w-full max-w-3xl bg-gradient-to-r from-emerald-950/80 via-slate-800 to-emerald-950/80 hover:from-emerald-900/90 hover:via-slate-800 hover:to-emerald-900/90 border rounded-2xl p-4.5 sm:p-5 transition-all duration-200 cursor-pointer group shadow-xl relative ${
                activeDrawerNode === 'clinical_dept'
                  ? 'border-emerald-400 ring-4 ring-emerald-400/30 shadow-emerald-500/20'
                  : 'border-emerald-500/60 hover:border-emerald-400'
              }`}
            >
              {/* 醒目交互提示角标 */}
              <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-extrabold rounded-full shadow-md flex items-center gap-1 animate-bounce">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>临床执行节点 · 点击触发详情弹窗</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-center font-bold shadow-lg shrink-0 group-hover:scale-105 transition-transform ring-2 ring-emerald-400/30">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30 font-mono">
                        第三级 · 临床执行层
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide group-hover:text-emerald-200 transition-colors flex items-center gap-1.5">
                        <span>医学装备使用部门 (全院各临床医技科室)</span>
                        <Users className="w-4 h-4 text-emerald-400" />
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      设立专职/兼职管理人员（科室设备安全员/护士长），在设备科指导下逐级建立使用责任制，严守操作规程，随时开机可用、账卡物相符
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/50">
                    <span>守则 7条</span>
                    <span>·</span>
                    <span>安全员 42名</span>
                    <span>·</span>
                    <span>对口包科 8组</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDepartmentDetailModal('医学装备使用部门 (全院各临床医技科室)', 'clinical_dept', 'duties');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer group-hover:ring-2 group-hover:ring-emerald-300"
                  >
                    <span>展开使用科室清单</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 核心职责要点快速指示药丸 */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ① 逐级责任制与账卡物相符
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ② 共同验收与持证独立操作
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ③ 严格操作规程与用毕复位
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ④ 定点安置严禁带故障运转
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ⑤ 严禁私自丢弃破损零配件
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ⑥ 跨科调剂批准交接手续
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ⑦ 用毕检查与违规操作追责
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 底部四维协同与闭环监督条 */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-300">监督考核闭环：</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">月度开机巡检</span>
            <span>➔</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">季度质控考评</span>
            <span>➔</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">三甲持续改进追踪</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenDepartmentDetailModal('医疗设备科 (医学工程保障中心)', 'equipment_dept', 'projects')}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer font-medium"
            >
              查看 2026 年度 4 项重点质控项目进展 →
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 2. 交互抽屉 / 模态框 (管理职责清单 / 工程师列表 / 年度质控项目) ==================== */}
      {activeDrawerNode && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={handleCloseDrawer}
        >
          <div 
            className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 抽屉头部 Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                      {activeDrawerNode === 'equipment_dept' && '第二级 · 归口管理层'}
                      {activeDrawerNode === 'clinical_dept' && '第三级 · 临床执行层'}
                      {activeDrawerNode === 'executive_leadership' && '第一级 · 决策管理层'}
                    </span>
                    <span className="text-[11px] text-slate-300 font-sans">
                      依据《医学装备三级管理制度》(院医工发〔2026〕18号)
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {activeDrawerNode === 'equipment_dept' && (
                      <>
                        <Wrench className="w-5 h-5 text-cyan-400" />
                        <span>医疗设备科 (医学工程保障中心) 详细管理档案</span>
                      </>
                    )}
                    {activeDrawerNode === 'clinical_dept' && (
                      <>
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <span>医学装备使用部门 (全院各临床科室) 日常管理与对口人员</span>
                      </>
                    )}
                    {activeDrawerNode === 'executive_leadership' && (
                      <>
                        <Building2 className="w-5 h-5 text-indigo-400" />
                        <span>主管领导 (分管院领导 / 院党委会) 决策与统筹权责</span>
                      </>
                    )}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                    {activeDrawerNode === 'equipment_dept' && '行使全院医疗设备规划、论证、采购、安装验收、预防性维护(PM)、强制检定及报废全生命周期法定管理职能。'}
                    {activeDrawerNode === 'clinical_dept' && '落实“责任到人、随时可用、账卡物相符”，由科室主任与专兼职安全员负责日常使用登记、规范点检与安全操作。'}
                    {activeDrawerNode === 'executive_leadership' && '分管副院长直接负责全院医学装备配置规划、年度资金预算统筹、专业梯队配置及重大安全应急处置决策。'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrintDrawerContent}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                    title="打印或另存为公文 PDF"
                  >
                    <Printer className="w-4.5 h-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                    title="关闭抽屉"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 三大选项卡 Tab 切换栏 */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('duties')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    drawerActiveTab === 'duties'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {activeDrawerNode === 'equipment_dept' ? '管理职责清单 (10项)' : activeDrawerNode === 'clinical_dept' ? '日常使用守则 (7条)' : '领导管理职责 (4条)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('engineers')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    drawerActiveTab === 'engineers'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {activeDrawerNode === 'equipment_dept' ? '专职工程师团队 (8人)' : activeDrawerNode === 'clinical_dept' ? '对口包科工程师与安全员' : '院级分管领导'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('projects')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    drawerActiveTab === 'projects'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>年度重点质控项目 ({currentTierProjects.length}项)</span>
                </button>
              </div>
            </div>

            {/* 搜索过滤栏 */}
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    drawerActiveTab === 'duties'
                      ? '检索管理职责关键词（如强检、PM、验收、调剂）...'
                      : drawerActiveTab === 'engineers'
                      ? '按工程师姓名、专业方向、包科科室检索...'
                      : '按质控项目名称或条款检索...'
                  }
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="hidden sm:inline">三甲评审互查凭据库</span>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToTab('ledger');
                      handleCloseDrawer();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>查验设备台账</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 抽屉内容主体区 (可滚动) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
              
              {/* ===================== TAB 1: 管理职责清单 ===================== */}
              {drawerActiveTab === 'duties' && (
                <div className="space-y-4">
                  {/* 医疗设备科 10 项职责 */}
                  {activeDrawerNode === 'equipment_dept' && (
                    <div className="space-y-3">
                      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>【第三章 医疗设备科归口管理职责（法定标准10大项）】</strong>
                          <p className="text-blue-800 mt-0.5">
                            在分管院长的领导下，参加医院医疗设备管理全过程。负责立项论证、招采、安装验收、维保强检、培训使用、报废鉴定全链条闭环。
                          </p>
                        </div>
                      </div>

                      {[
                        { num: '01', title: '医疗设备质量管理的策划与监督考核', desc: '负责医疗设备、设备质量管理的策划，并组织具体实施，对医用仪器质量进行监督、检查和考核。', form: '《设备质量管理策划方案》' },
                        { num: '02', title: '质控程序文件归档与“一机一档”管理', desc: '负责医院医疗仪器质量控制程序文件的归档管理，健全“一机一档”全生命周期技术履历与追溯卷宗。', form: '《设备技术档案归档目录》' },
                        { num: '03', title: '使用质量问题纠正、预防与跟踪验证', desc: '负责对医院所购医疗设备在使用中存在的质量问题，提出纠正和预防措施，并协助进行跟踪验证。', form: '《不良事件RCA与纠正验证表》' },
                        { num: '04', title: '全院设备周期性维修、保养与预防性维护(PM)', desc: '负责全院医疗设备的维修、保养，建立季度PM预防性维护制度，对生命支持类机具实行全覆盖检测。', form: '《PM预防性维护质控检测联单》' },
                        { num: '05', title: '医用监护与计量器具国家法定强制检定', desc: '遵照国家法律规定严格执行落实医用监护、计量仪器的强制检定与周期校准工作，严禁超期使用。', form: '《e-CQS法定强检申报明细》' },
                        { num: '06', title: '全院医用材料与维保配件供应保障', desc: '负责全院医用材料、维修原厂配件的规范供应保障，实施阳光采购与多方询比价管理。', form: '《医用配件采购验收登记卡》' },
                        { num: '07', title: '健全保养、维修与更新制度保持完好', desc: '建立健全医疗设备保养、维修与更新制度，使全院设备处于随时可用完好状态。', form: '《设备保养维修管理规程》' },
                        { num: '08', title: '大中型医疗设备合理应用与成本效益分析', desc: '加强大中型医疗设备合理应用情况、有效机时、检查阳性率及成本效益(ROI)综合分析。', form: '《大型设备季度ROI效益分析报告》' },
                        { num: '09', title: '科学购置论证、甲乙类配置许可与急救完好', desc: '对设备实行科学管理，购置大型设备必须经过严格的可行性论证。按规定申请配置许可。急救设备齐全完好，满足急救工作需要，医护熟练正确使用。', form: '《大型医用设备配置论证报告》' },
                        { num: '10', title: '检测系统校准与不合格设备坚决淘汰', desc: '遵守检验项目和检测仪器操作规程，定期校准检测系统，并及时淘汰经检定不合格的设备。', form: '《仪器报废技术鉴定论证意见书》' },
                      ]
                        .filter(item => !searchQuery || item.title.includes(searchQuery) || item.desc.includes(searchQuery))
                        .map((duty) => (
                          <div 
                            key={duty.num}
                            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 hover:shadow-xs transition space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                                  {duty.num}
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm">
                                  {duty.title}
                                </h4>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                第六条 第{duty.num.replace(/^0/, '')}款
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed pl-9">
                              {duty.desc}
                            </p>
                            <div className="pl-9 pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-semibold text-blue-700">配套留痕表单：</span>
                              <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200">
                                {duty.form}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* 临床使用部门 7 条守则 */}
                  {activeDrawerNode === 'clinical_dept' && (
                    <div className="space-y-3">
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 leading-relaxed flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>【第四章 使用部门日常管理职责（临床落地7大守则）】</strong>
                          <p className="text-emerald-800 mt-0.5">
                            使用部门应当设专职或兼职管理人员（科室设备安全员），在设备科指导下，具体负责本科室医学装备日常管理工作。
                          </p>
                        </div>
                      </div>

                      {[
                        { num: '01', title: '逐级建立使用管理责任制，保证账卡物相符', desc: '凡有医疗设备的科室，要逐级建立使用管理责任制，指定专人管理，严格使用登记。认真检查保养，保持仪器设备处于良好状态，随时开机可用，并保证账、卡、物相符。', point: '重点排查账外无卡机具与未登机使用' },
                        { num: '02', title: '共同验收安装，未熟悉操作前严禁接电', desc: '临床医技科室新进仪器设备在使用前要由设备科、使用科室共同负责验收、调试、安装。组织有关科室专业人员进行操作管理、使用和训练，了解构造性能工作原理后方可独立使用。凡初次操作者必须在熟悉同志指导下进行，在未熟悉操作前不得连接电源，以免接错电路造成损坏。', point: '未经培训不得独立上机操作' },
                        { num: '03', title: '严格遵循操作规程，使用完毕所有手柄复位', desc: '仪器使用人员要严格按照仪器的技术标准、说明书和操作规程进行操作。使用仪器前应判明其技术状态确实良好，使用完毕应将所有开关、手柄放在规定复位位置。', point: '开机自检与用毕复位必查' },
                        { num: '04', title: '定点安置不得擅移，严禁带故障与超负荷运转', desc: '不准搬动的仪器不得随意挪动。操作过程中操作人员不得擅自离开，发现仪器运转异常时应立即通知设备科及医院维修技术人员查找原因排除故障，严禁带故障和超负荷运转。填写《维修申请报告》。', point: '杜绝带病上岗与带故障运转' },
                        { num: '05', title: '保持配件与说明书完整，失灵部件严禁擅自丢弃', desc: '仪器设备（包括主机、附件、说明书）一定保持完整无缺，即使破损失灵部件，未经设备科检查亦不得任意丢弃。', point: '高价值旧配件 100% 留存回收销毁' },
                        { num: '06', title: '临床科研仪器跨科调剂使用必须经主任批准交接', desc: '凡属临床科研的仪器，科室间调剂使用时，一定要经科室主任批准，仪器管理人员要办理交接手续，用毕及时归还，验收后放回原处。', point: '跨科调用双向签署交接借还单' },
                        { num: '07', title: '用毕专人检查关机，违章操作严肃追责赔偿', desc: '仪器用完后应由科室管理人员检查关机放好。若发现仪器损坏或发生意外故障应立即查明原因和责任，如系违章操作所致要立即报告设备科，视情节轻重进行赔偿或进一步追究责任。', point: '违章误操作致损追究责任' },
                      ]
                        .filter(item => !searchQuery || item.title.includes(searchQuery) || item.desc.includes(searchQuery))
                        .map((duty) => (
                          <div 
                            key={duty.num}
                            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                                  {duty.num}
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm">
                                  {duty.title}
                                </h4>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                第八条 第{duty.num.replace(/^0/, '')}条
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed pl-9">
                              {duty.desc}
                            </p>
                            <div className="pl-9 pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-semibold text-emerald-700">现场质控防范点：</span>
                              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                {duty.point}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* 院领导决策层职责 */}
                  {activeDrawerNode === 'executive_leadership' && (
                    <div className="space-y-3">
                      <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-950 leading-relaxed flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>【第二章 主管领导管理职责】</strong>
                          <p className="text-indigo-800 mt-0.5">
                            由分管院领导直接负责全院资金的预算管理、统筹安排，并依据机构规模、管理任务配备数量适宜的专业技术人员。
                          </p>
                        </div>
                      </div>

                      {[
                        { num: '01', title: '分管院领导直接挂帅负责体系建设', desc: '由分管院领导直接领导全院医学装备管理工作，定期主持召开医学装备管理委员会会议，研究审定重大设备议题。' },
                        { num: '02', title: '配备数量适宜的专业工程技术梯队', desc: '依据医院三级甲等综合规模、技术装备量级及质控任务，配齐配强医学工程专业技术人员与持证工程师队伍。' },
                        { num: '03', title: '全院资金预算管理与统筹安排', desc: '负责全院医学装备年度资金预算规划编制、集中统筹安排与“三重一大”集体审定，保障急救生命支持资源充足。' },
                        { num: '04', title: '大型医用设备配置论证与重大风险决策', desc: '主持甲类、乙类大型医用设备配置许可申报审定，主导突发公共卫生事件与重大医疗器械风险的应急指挥。' },
                      ].map((item) => (
                        <div key={item.num} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                              {item.num}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed pl-9">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===================== TAB 2: 负责工程师团队 / 对口包科人员列表 ===================== */}
              {drawerActiveTab === 'engineers' && (
                <div className="space-y-4">
                  {/* 医疗设备科 专职工程师卡片流 */}
                  {activeDrawerNode === 'equipment_dept' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                        <span>全院医学装备专业负责工程师名录 (共 {filteredEngineers.length} 名)</span>
                        <span className="text-slate-400">24H 应急联动响应</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredEngineers.map((eng) => (
                          <div 
                            key={eng.id}
                            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-400 hover:shadow-xs transition space-y-2.5 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                    {eng.name.slice(0, 1)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="font-bold text-slate-900 text-sm">
                                        {eng.name}
                                      </h4>
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        {eng.employeeNo}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block truncate">
                                      {eng.role}
                                    </span>
                                  </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                  eng.onCallStatus === '24H应急值守' 
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {eng.onCallStatus}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div>
                                  <span className="text-slate-400 font-medium">负责领域：</span>
                                  <span className="font-semibold text-slate-800">{eng.specialtyDomain}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">包科对口：</span>
                                  <span className="text-blue-700 font-medium">{eng.pairedDepartments.join('、')}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <a 
                                href={`tel:${eng.phone}`}
                                className="font-mono text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition"
                              >
                                <Phone className="w-3 h-3 text-blue-600" />
                                <span>{eng.phone}</span>
                                {eng.shortPhone && <span className="text-slate-400 font-normal">({eng.shortPhone})</span>}
                              </a>

                              <span className="text-[10px] text-slate-400">
                                牵头质控项目: <strong>{eng.activeProjectsCount}项</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 临床使用科室 对口包科与设备安全员 */}
                  {activeDrawerNode === 'clinical_dept' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                        <span>临床重点科室专兼职设备安全员与对口保驾工程师 (共 {filteredClinicalPairings.length} 个重点科室)</span>
                        <span className="text-emerald-700 font-medium">实行包科责任制</span>
                      </div>

                      <div className="space-y-2.5">
                        {filteredClinicalPairings.map((item) => (
                          <div 
                            key={item.departmentId}
                            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {item.departmentName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {item.location}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {item.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                <span>在册机具: <strong className="text-slate-800">{item.totalEquipmentCount}台</strong></span>
                                <span>·</span>
                                <span>生命支持: <strong className="text-rose-600">{item.lifeSupportCount}台</strong></span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {/* 科室安全员 */}
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                  <span className="font-semibold text-slate-700">科室专兼职设备安全员</span>
                                  <span className="font-mono text-slate-500">{item.safetyOfficerPhone}</span>
                                </div>
                                <div className="font-bold text-slate-800 text-xs">
                                  {item.safetyOfficerName}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {item.safetyOfficerTitle}
                                </div>
                              </div>

                              {/* 对口工程师 */}
                              <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1">
                                <div className="text-[11px] text-blue-700 flex items-center justify-between">
                                  <span className="font-semibold">医工科对口保驾工程师</span>
                                  <span className="font-mono text-blue-600 font-bold">{item.pairedEngineerPhone}</span>
                                </div>
                                <div className="font-bold text-blue-950 text-xs">
                                  {item.pairedEngineerName}
                                </div>
                                <div className="text-[11px] text-blue-700 truncate">
                                  专业对口: {item.pairedEngineerSpecialty}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 院领导 */}
                  {activeDrawerNode === 'executive_leadership' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-bold text-lg flex items-center justify-center">
                          郑
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">郑海清</h4>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              分管副院长 / 党委委员
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            分管业务与医学工程保障中心 · 五莲县人民医院医学装备管理委员会常务副主任
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                        <p><strong>办公室地点：</strong>6号楼 办公楼 2F 院领导办公室</p>
                        <p><strong>分管范围：</strong>主管全院医疗设备发展规划、年度资金预算统筹、大型医用设备配置准入论证、医学工程专业技术梯队建设与重大医疗安全督查。</p>
                        <p><strong>签批权限：</strong>单笔单台设备采购申购预算审批、大型设备技术报废终审会签、50万元以上重大装备呈报党委会决策。</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===================== TAB 3: 年度重点质控项目 ===================== */}
              {drawerActiveTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                    <span>当前正在执行的年度重点质控项目清单 (共 {currentTierProjects.length} 项)</span>
                    <span className="text-blue-700 font-bold">三甲评审核心必备</span>
                  </div>

                  {currentTierProjects.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      暂无匹配的年度重点质控项目
                    </div>
                  ) : (
                    currentTierProjects.map((project) => (
                      <div 
                        key={project.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {project.code}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm">
                                {project.title}
                              </h4>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                              <span>牵头人: <strong className="text-slate-800">{project.leadPerson}</strong></span>
                              <span>·</span>
                              <span>质控周期: <strong className="text-slate-700 font-mono">{project.cycle}</strong></span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-end gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              执行中
                            </span>
                            <div className="flex items-baseline gap-1 text-xs font-mono font-bold text-blue-700">
                              <span>达标进度:</span>
                              <span className="text-sm font-black">{project.currentProgress}%</span>
                            </div>
                          </div>
                        </div>

                        {/* 进度条 */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${project.currentProgress}%` }}
                          />
                        </div>

                        {/* 核心指标与条款 */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
                          <div>
                            <span className="font-semibold text-slate-700">达标目标：</span>
                            <span className="text-slate-800">{project.targetMetric}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">标准条款：</span>
                            <span className="font-mono text-indigo-700 font-semibold">{project.standardClause}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[11px] pt-1 border-t border-slate-200">
                            {project.description}
                          </p>
                        </div>

                        {/* 质控关键实施步骤 */}
                        <div className="space-y-1 text-xs">
                          <span className="font-bold text-slate-800 block text-[11px]">关键质控措施与执行动作：</span>
                          {project.keyActionPoints.map((point, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* 抽屉底部工具栏 Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>三级管理数据经院医学装备管理委员会2026年度审定有效</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDrawerContent}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印职责与质控表</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <span>确认并关闭</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 弹窗：通过 DepartmentDetailModal 展现对应部门的职责清单、负责工程师及年度质控项目 */}
      <DepartmentDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        departmentName={selectedDeptName}
        departmentType={selectedDeptType}
        initialTab={modalInitialTab}
        onNavigateToTab={onNavigateToTab}
        showToast={showToast}
        currentUser={currentUser}
      />
    </div>
  );
};

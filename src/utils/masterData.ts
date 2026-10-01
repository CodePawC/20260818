import { CampusMaster, BuildingMaster, LocationRoomMaster, DepartmentMaster, StaffPersonMaster, MedicalEquipment } from '../types';
import { DEFAULT_WORKPLACES } from './workplacesData';

// ==================== 1. 默认院区/医院主数据 (Campuses) ====================
export const DEFAULT_CAMPUSES: CampusMaster[] = [
  {
    id: 'CAMPUS-01',
    code: 'WL-HOSP',
    name: '五莲县人民医院',
    shortName: '县人医 (总院)',
    address: '山东省日照市五莲县幸福路中段',
    contactPhone: '0633-7991000',
    description: '集医疗、急救、教学、科研、康复于一体的二级甲等综合性公立医院，设综合楼、原内科楼、原妇幼楼、急救站等',
    status: 'active'
  },
  {
    id: 'CAMPUS-02',
    code: 'WL-DERM',
    name: '五莲县皮肤病医院',
    shortName: '皮肤病医院',
    address: '山东省日照市五莲县城关路',
    contactPhone: '0633-7961100',
    description: '专科医疗机构，设皮肤病门诊、病房、中医科病房、国医堂、医学美容科等',
    status: 'active'
  }
];

// ==================== 2. 默认实体楼宇主数据 (Buildings) ====================
export const DEFAULT_BUILDINGS: BuildingMaster[] = [
  {
    id: 'BLD-01',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '1号楼',
    name: '1号楼 综合楼',
    floors: ['-1F', '1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F', '9F', '10F', '11F', '12F', '13F', '14F', '15F', '16F'],
    description: '核心综合医疗大楼：含内外科临床病区(10-16F)、产房与妇科(9F)、麻醉手术科(8F)、ICU与神经外科(7F)、创伤与血透(6F)、儿科与药剂(5F)、五官眼口腔(4F)、医技检验超声(3F)、门诊(2F)、急诊与医保收费(1F)、介入放射与影像中心(-1F)',
    status: 'active'
  },
  {
    id: 'BLD-02',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '2号楼',
    name: '2号楼 原内科楼',
    floors: ['2F', '3F'],
    description: '老年康复科 (2F)、康复医学科 (3F)',
    status: 'active'
  },
  {
    id: 'BLD-03',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '3号楼',
    name: '3号楼 原妇幼楼',
    floors: ['-1F', '1F', '2F', '3F', '4F'],
    description: '消毒供应室(-1F)、放疗科与母婴保健(1F)、健康服务与司法鉴定(2F)、中医科/理疗科/临床营养(3F)、综合保健科(4F)',
    status: 'active'
  },
  {
    id: 'BLD-04',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '4号楼',
    name: '4号楼 急救站',
    floors: ['1F'],
    description: '120 急救指挥与院前急救站 (1F)',
    status: 'active'
  },
  {
    id: 'BLD-05',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '5号楼',
    name: '5号楼 感染性疾病科',
    floors: ['2F'],
    description: '感染性疾病病区与发热门诊 (2F)',
    status: 'active'
  },
  {
    id: 'BLD-06',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '6号楼',
    name: '6号楼 办公楼',
    floors: ['0F', '1F', '2F', '3F'],
    description: '科教科与老干部活动(0F)、医疗设备科/财务/医务/护理/院感/后勤/安保(1F)、院办/人事/审计/绩效(2F)、宣教/作风办(3F)',
    status: 'active'
  },
  {
    id: 'BLD-07',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '0光明路',
    name: '0光明路',
    floors: ['1F'],
    description: '光明路外设门诊 (1F)',
    status: 'active'
  },
  {
    id: 'BLD-08',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    code: '0公用',
    name: '0公用设施',
    floors: ['0F'],
    description: '全院公用工程、能源动力与特殊预设设施',
    status: 'active'
  },
  {
    id: 'BLD-DERM-01',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    code: '门诊楼',
    name: '0皮肤病医院门诊楼',
    floors: ['1F', '2F'],
    description: '皮肤病门诊/美容/国医堂/检验/药房/收款(1F)、皮肤病病房/中医病房/专家门诊/院长室/财务/办公室(2F)',
    status: 'active'
  }
];

// ==================== 3. 完整科室主数据 (98个标准化科室) ====================
export const DEFAULT_DEPARTMENTS: DepartmentMaster[] = [
  // 1号楼 16F
  {
    id: '254',
    code: 'DEP-254',
    name: '内分泌风湿肾病科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '16F',
    nursePhone: '7991438',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },
  {
    id: '253',
    code: 'DEP-253',
    name: '消化保健科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '16F',
    nursePhone: '7991038',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },

  // 1号楼 15F
  {
    id: '256',
    code: 'DEP-256',
    name: '神经内二科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '15F',
    nursePhone: '7991407',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },
  {
    id: '255',
    code: 'DEP-255',
    name: '神经内一科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '15F',
    nursePhone: '7991057',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },

  // 1号楼 14F
  {
    id: '258',
    code: 'DEP-258',
    name: '心血管内二科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '14F',
    nursePhone: '7991298',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },
  {
    id: '257',
    code: 'DEP-257',
    name: '心血管内一科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '14F',
    nursePhone: '7991427',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },

  // 1号楼 13F
  {
    id: '268',
    code: 'DEP-268',
    name: '普外一科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '13F',
    nursePhone: '7991688',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '260',
    code: 'DEP-260',
    name: '五官科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '13F',
    nursePhone: '7991232',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },

  // 1号楼 12F
  {
    id: '261',
    code: 'DEP-261',
    name: '呼吸与危重症医学科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '12F',
    nursePhone: '7991225',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },

  // 1号楼 11F
  {
    id: '263',
    code: 'DEP-263',
    name: '骨二科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '11F',
    nursePhone: '7991277',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },
  {
    id: '262',
    code: 'DEP-262',
    name: '骨一科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '11F',
    nursePhone: '7991097',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },

  // 1号楼 10F
  {
    id: '265',
    code: 'DEP-265',
    name: '泌尿胸普外科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '10F',
    nursePhone: '7991280',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },
  {
    id: '264',
    code: 'DEP-264',
    name: '普外二科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '10F',
    nursePhone: '7991093',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },

  // 1号楼 9F
  {
    id: '291',
    code: 'DEP-291',
    name: '产房',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '妇产科',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '9F',
    nursePhone: '7991318',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '290',
    code: 'DEP-290',
    name: '产房手术室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '妇产科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '9F',
    nursePhone: '7991326',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '266',
    code: 'DEP-266',
    name: '妇科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '妇产科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '9F',
    nursePhone: '7991089',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },
  {
    id: '364',
    code: 'DEP-364',
    name: '医疗设备应急库',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学工程',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '9F',
    nursePhone: '7991237',
    adverseEventReporting: false,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 8F
  {
    id: '267',
    code: 'DEP-267',
    name: '麻醉手术科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '8F',
    nursePhone: '7991103',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 7F
  {
    id: '272',
    code: 'DEP-272',
    name: '神经外科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '7F',
    nursePhone: '7991081',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '269',
    code: 'DEP-269',
    name: '重症医学科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '7F',
    nursePhone: '7991278',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 6F
  {
    id: '302',
    code: 'DEP-302',
    name: '创伤外科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '6F',
    nursePhone: '7991148',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '271',
    code: 'DEP-271',
    name: '血液透析室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '6F',
    nursePhone: '7991162',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 5F
  {
    id: '259',
    code: 'DEP-259',
    name: '小儿科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '5F',
    nursePhone: '7991142',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '崔伟',
    status: 'active'
  },
  {
    id: '289',
    code: 'DEP-289',
    name: '新生儿科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '5F',
    nursePhone: '7991358',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '336',
    code: 'DEP-336',
    name: '信息科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '5F',
    nursePhone: '7991207',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '307',
    code: 'DEP-307',
    name: '药剂科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '药剂学',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '5F',
    nursePhone: '7991030',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 4F
  {
    id: '292',
    code: 'DEP-292',
    name: '产科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '妇产科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '4F',
    nursePhone: '7991318',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '274',
    code: 'DEP-274',
    name: '耳鼻喉科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '耳鼻喉科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '4F',
    nursePhone: '7991170',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '275',
    code: 'DEP-275',
    name: '口腔科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '口腔医学科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '4F',
    nursePhone: '7991169',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '273',
    code: 'DEP-273',
    name: '眼科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '眼科科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '4F',
    nursePhone: '7991030',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '345',
    code: 'DEP-345',
    name: '医共体',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '4F',
    nursePhone: '7991100',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '333',
    code: 'DEP-333',
    name: '医共体办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '4F',
    nursePhone: '7991100',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 3F
  {
    id: '279',
    code: 'DEP-279',
    name: '超声科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学影像科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '3F',
    nursePhone: '7991195',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '280',
    code: 'DEP-280',
    name: '功能检查科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学影像科',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '3F',
    nursePhone: '7991195',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '281',
    code: 'DEP-281',
    name: '检验科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学检验科',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '3F',
    nursePhone: '7991397',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '278',
    code: 'DEP-278',
    name: '内镜室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '3F',
    nursePhone: '7991106',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '358',
    code: 'DEP-358',
    name: '输血科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学检验科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '3F',
    nursePhone: '7991168',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 2F
  {
    id: '366',
    code: 'DEP-366',
    name: '产科门诊',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '妇产科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991318',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '284',
    code: 'DEP-284',
    name: '门诊部',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '门诊部',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991397',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '357',
    code: 'DEP-357',
    name: '门诊手术室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '外科科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991120',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '337',
    code: 'DEP-337',
    name: '门诊输液室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '门诊部',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991195',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '283',
    code: 'DEP-283',
    name: '皮肤科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '皮肤医学科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991168',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '305',
    code: 'DEP-305',
    name: '疼痛门诊',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '麻醉科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991389',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '342',
    code: 'DEP-342',
    name: '心理咨询门诊',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '临床心理',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991262',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '341',
    code: 'DEP-341',
    name: '中医不孕不育门诊',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '中医科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '2F',
    nursePhone: '7991496',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 1F
  {
    id: '286',
    code: 'DEP-286',
    name: '急诊科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '急危重症',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '1F',
    nursePhone: '7991065',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '338',
    code: 'DEP-338',
    name: '收费结算科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '财务科',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '1F',
    nursePhone: '7991108',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '334',
    code: 'DEP-334',
    name: '医保科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '1F',
    nursePhone: '7991186',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 1号楼 -1F
  {
    id: '287',
    code: 'DEP-287',
    name: '介入放射科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学影像科',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '-1F',
    nursePhone: '7991498',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '288',
    code: 'DEP-288',
    name: '影像科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学影像科',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-01',
    buildingName: '1号楼 综合楼',
    defaultFloor: '-1F',
    nursePhone: '7991020',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 2号楼 原内科楼
  {
    id: '298',
    code: 'DEP-298',
    name: '康复医学科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '康复医学',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-02',
    buildingName: '2号楼 原内科楼',
    defaultFloor: '3F',
    nursePhone: '7991721',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '369',
    code: 'DEP-369',
    name: '老年康复科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '康复医学',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-02',
    buildingName: '2号楼 原内科楼',
    defaultFloor: '2F',
    nursePhone: '7991359',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 3号楼 原妇幼楼
  {
    id: '297',
    code: 'DEP-297',
    name: '综合保健科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '预防保健',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '4F',
    nursePhone: '7991061',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '326',
    code: 'DEP-326',
    name: '理疗科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '康复医学',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '3F',
    nursePhone: '7991152',
    adverseEventReporting: true,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '327',
    code: 'DEP-327',
    name: '临床营养科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医技科室',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '3F',
    nursePhone: '7991481',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '270',
    code: 'DEP-270',
    name: '中医科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '内科科',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '3F',
    nursePhone: '7991073',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '300',
    code: 'DEP-300',
    name: '健康服务科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '预防保健',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '2F',
    nursePhone: '7991272',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '359',
    code: 'DEP-359',
    name: '司法鉴定办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '2F',
    nursePhone: '7991158',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '295',
    code: 'DEP-295',
    name: '放疗科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '肿瘤放疗',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '1F',
    nursePhone: '7991063',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '293',
    code: 'DEP-293',
    name: '母婴保健科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '妇幼保健',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '1F',
    nursePhone: '7991300',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '294',
    code: 'DEP-294',
    name: '消毒供应室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '护理部',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-03',
    buildingName: '3号楼 原妇幼楼',
    defaultFloor: '-1F',
    nursePhone: '7991496',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 4号楼 急救站
  {
    id: '299',
    code: 'DEP-299',
    name: '急救站',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '急危重症',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-04',
    buildingName: '4号楼 急救站',
    defaultFloor: '1F',
    nursePhone: '7991359',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 5号楼 感染性疾病科
  {
    id: '296',
    code: 'DEP-296',
    name: '感染性疾病科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '感染性疾病',
    category: '临床病区',
    functionType: '临床病区',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-05',
    buildingName: '5号楼 感染性疾病科',
    defaultFloor: '2F',
    nursePhone: '7991247',
    adverseEventReporting: true,
    emergencyDeployment: true,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 6号楼 办公楼
  {
    id: '335',
    code: 'DEP-335',
    name: '宣教科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '3F',
    nursePhone: '7991088',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '368',
    code: 'DEP-368',
    name: '作风办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '3F',
    nursePhone: '7991000',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '324',
    code: 'DEP-324',
    name: '绩效考核科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '2F',
    nursePhone: '7991366',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '346',
    code: 'DEP-346',
    name: '领导办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '2F',
    nursePhone: '7991000',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '328',
    code: 'DEP-328',
    name: '人事科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '2F',
    nursePhone: '7991218',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '339',
    code: 'DEP-339',
    name: '审计科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '2F',
    nursePhone: '7991027',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '329',
    code: 'DEP-329',
    name: '院办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '2F',
    nursePhone: '7991204',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '320',
    code: 'DEP-320',
    name: '院长办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '2F',
    nursePhone: '7991000',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '319',
    code: 'DEP-319',
    name: '财务科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '财务科',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991025',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '344',
    code: 'DEP-344',
    name: '扶贫办',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991396',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '321',
    code: 'DEP-321',
    name: '感染管理科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '院感管理',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991215',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '322',
    code: 'DEP-322',
    name: '后勤保障部',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '后勤总务',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991191',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '323',
    code: 'DEP-323',
    name: '护理部',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '护理部',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991406',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '360',
    code: 'DEP-360',
    name: '医疗安全办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医疗安全',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991039',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '332',
    code: 'DEP-332',
    name: '医疗安全科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医疗安全',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991039',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '303',
    code: 'DEP-303',
    name: '医疗设备科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医学工程',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991237',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '331',
    code: 'DEP-331',
    name: '医务科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '医务管理',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991112',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '330',
    code: 'DEP-330',
    name: '预防保健科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '预防保健',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '1F',
    nursePhone: '7991032',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '325',
    code: 'DEP-325',
    name: '科教科',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '教学科研',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '0F',
    nursePhone: '7991723',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '361',
    code: 'DEP-361',
    name: '老干部活动办公室',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '离退休工作',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-06',
    buildingName: '6号楼 办公楼',
    defaultFloor: '0F',
    nursePhone: '2252331',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 0光明路
  {
    id: '340',
    code: 'DEP-340',
    name: '光明路门诊',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '门诊部',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-07',
    buildingName: '0光明路',
    defaultFloor: '1F',
    nursePhone: '18969332587',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // 0公用设施 / 特殊设定
  {
    id: '367',
    code: 'DEP-367',
    name: '公用设施',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '公用设施',
    category: '特殊',
    functionType: '特殊',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-08',
    buildingName: '0公用设施',
    defaultFloor: '0F',
    nursePhone: '7991100',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '365',
    code: 'DEP-365',
    name: '特殊设定',
    hospitalName: '五莲县人民医院',
    disciplineCategory: '特殊设定',
    category: '特殊',
    functionType: '特殊',
    campusId: 'CAMPUS-01',
    campusName: '五莲县人民医院',
    buildingId: 'BLD-08',
    buildingName: '0公用设施',
    defaultFloor: '0F',
    nursePhone: '7991100',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },

  // ==================== 五莲县皮肤病医院 ====================
  {
    id: '349',
    code: 'DEP-349',
    name: '皮肤病医院办公室',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '2F',
    nursePhone: '7961100',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '348',
    code: 'DEP-348',
    name: '皮肤病医院财务科',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '财务科',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '2F',
    nursePhone: '7961100',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '354',
    code: 'DEP-354',
    name: '皮肤病医院皮肤病病房',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '皮肤科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '2F',
    nursePhone: '7961102',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '347',
    code: 'DEP-347',
    name: '皮肤病医院院长室',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '行政办公室',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '2F',
    nursePhone: '7961102',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '356',
    code: 'DEP-356',
    name: '皮肤病医院中医科病房',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '中医科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '2F',
    nursePhone: '7961101',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '362',
    code: 'DEP-362',
    name: '皮肤病医院专家门诊',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '专家门诊',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '2F',
    nursePhone: '7961101',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '363',
    code: 'DEP-363',
    name: '皮肤病医院国医堂',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '中医科',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '1F',
    nursePhone: '7961100',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '352',
    code: 'DEP-352',
    name: '皮肤病医院检验科',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '医学检验科',
    category: '医技',
    functionType: '医技',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '1F',
    nursePhone: '7961115',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '351',
    code: 'DEP-351',
    name: '皮肤病医院美容科',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '医疗美容',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '1F',
    nursePhone: '7991705',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '350',
    code: 'DEP-350',
    name: '皮肤病医院门诊',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '门诊部',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '1F',
    nursePhone: '7961112',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '353',
    code: 'DEP-353',
    name: '皮肤病医院收款室',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '财务科',
    category: '行管后勤',
    functionType: '行管后勤',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '1F',
    nursePhone: '7961115',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  },
  {
    id: '355',
    code: 'DEP-355',
    name: '皮肤病医院药房',
    hospitalName: '五莲县皮肤病医院',
    disciplineCategory: '药剂学',
    category: '临床',
    functionType: '临床',
    campusId: 'CAMPUS-02',
    campusName: '五莲县皮肤病医院',
    buildingId: 'BLD-DERM-01',
    buildingName: '0皮肤病医院门诊楼',
    defaultFloor: '1F',
    nursePhone: '7961112',
    adverseEventReporting: false,
    emergencyDeployment: false,
    defaultManager: '孙志强',
    status: 'active'
  }
];

// ==================== 4. 默认全域设备干系人与工程师主数据 (5大干系人集群) ====================
import { DEFAULT_STAFF } from './defaultStaffData';
export { DEFAULT_STAFF };

// ==================== 5. 默认空间与具体工作场所主数据 (Workplaces & Rooms) ====================
export const DEFAULT_ROOMS: LocationRoomMaster[] = DEFAULT_WORKPLACES;

// ==================== 6. 辅助查询与持久化工具函数 ====================
export const MASTER_DATA_STORAGE_KEYS = {
  CAMPUSES: 'hospital-master-campuses-v2',
  BUILDINGS: 'hospital-master-buildings-v2',
  ROOMS: 'hospital-master-rooms-v2',
  DEPARTMENTS: 'hospital-master-departments-v2',
  STAFF: 'hospital-master-staff-v2'
};

export function loadMasterData() {
  const loadItem = <T>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
      }
    } catch (e) {
      console.warn(`Failed to parse master data from ${key}`, e);
    }
    return fallback;
  };

  return {
    campuses: loadItem<CampusMaster[]>(MASTER_DATA_STORAGE_KEYS.CAMPUSES, DEFAULT_CAMPUSES),
    buildings: loadItem<BuildingMaster[]>(MASTER_DATA_STORAGE_KEYS.BUILDINGS, DEFAULT_BUILDINGS),
    rooms: loadItem<LocationRoomMaster[]>(MASTER_DATA_STORAGE_KEYS.ROOMS, DEFAULT_ROOMS),
    departments: loadItem<DepartmentMaster[]>(MASTER_DATA_STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS),
    staff: loadItem<StaffPersonMaster[]>(MASTER_DATA_STORAGE_KEYS.STAFF, DEFAULT_STAFF)
  };
}

export function saveMasterData(
  campuses?: CampusMaster[],
  buildings?: BuildingMaster[],
  rooms?: LocationRoomMaster[],
  departments?: DepartmentMaster[],
  staff?: StaffPersonMaster[]
) {
  try {
    if (campuses) localStorage.setItem(MASTER_DATA_STORAGE_KEYS.CAMPUSES, JSON.stringify(campuses));
    if (buildings) localStorage.setItem(MASTER_DATA_STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
    if (rooms) localStorage.setItem(MASTER_DATA_STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    if (departments) localStorage.setItem(MASTER_DATA_STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    if (staff) localStorage.setItem(MASTER_DATA_STORAGE_KEYS.STAFF, JSON.stringify(staff));
  } catch (e) {
    console.warn('Failed to save master data to localStorage', e);
  }
}

/**
 * 常见科室口语化别名与主数据标准科室名称映射字典
 */
export const DEPARTMENT_ALIAS_MAP: Record<string, string> = {
  '手术室': '麻醉手术科',
  '彩超室': '超声科',
  '彩超科': '超声科',
  '超声室': '超声科',
  '急诊监护室': '重症医学科',
  '动力设备层': '公用设施',
  '动力科': '公用设施',
  '后勤动力科': '公用设施',
  '动力设备班': '公用设施',
  '气体动力科': '公用设施',
  '医用气站': '公用设施',
  '气站': '公用设施',
  '高压氧舱': '理疗科',
  '高压氧科': '理疗科',
  '作风办': '作风办公室',
  '内分泌科': '内分泌风湿肾病科',
  '妇产科': '妇科',
  '康复科': '康复医学科',
  '腔镜中心': '内镜室',
  '神外专科': '神经外科',
};

/**
 * 智能解析并精准匹配主数据科室（优先全字匹配、代码匹配、别名映射与规范化模糊匹配）
 */
export function resolveMasterDepartment(deptName: string, deptList: DepartmentMaster[]): DepartmentMaster | undefined {
  if (!deptName || !deptList || deptList.length === 0) return undefined;
  const clean = deptName.trim();
  
  // 1. 精确名称、代码或ID匹配
  const exact = deptList.find(d => d.name === clean || d.code === clean || d.id === clean);
  if (exact) return exact;

  // 2. 别名字典映射匹配
  const aliasTarget = DEPARTMENT_ALIAS_MAP[clean];
  if (aliasTarget) {
    const aliasMatched = deptList.find(d => d.name === aliasTarget);
    if (aliasMatched) return aliasMatched;
  }

  // 3. 剥离“室/科/中心/病区/部”等后缀后的核心词匹配
  const stripped = clean.replace(/(科室|中心|病区|病房|门诊|科|室|部)$/g, '');
  if (stripped.length >= 2) {
    const coreMatched = deptList.find(d => d.name.includes(stripped) || stripped.includes(d.name.replace(/(科室|中心|病区|病房|门诊|科|室|部)$/g, '')));
    if (coreMatched) return coreMatched;
  }

  // 4. 包含式宽松匹配
  return deptList.find(d => d.name.includes(clean) || clean.includes(d.name));
}

/**
 * 统一科室匹配函数，支持别名与主数据归一化（如“手术室”自动匹配“麻醉手术科”）
 */
export function matchesDepartment(recordDept?: string, targetDept?: string, deptList: DepartmentMaster[] = DEFAULT_DEPARTMENTS): boolean {
  if (!targetDept || targetDept === 'ALL' || targetDept === '') return true;
  if (!recordDept) return false;
  const d1 = recordDept.trim();
  const d2 = targetDept.trim();
  if (d1 === d2) return true;
  if (d1.includes(d2) || d2.includes(d1)) return true;

  const normalized1 = (d1 === '手术室' || d1 === '手术科' || d1 === '麻醉科' || d1 === '手术麻醉科') ? '麻醉手术科' : d1;
  const normalized2 = (d2 === '手术室' || d2 === '手术科' || d2 === '麻醉科' || d2 === '手术麻醉科') ? '麻醉手术科' : d2;
  if (normalized1 === normalized2) return true;

  const m1 = resolveMasterDepartment(normalized1, deptList);
  const m2 = resolveMasterDepartment(normalized2, deptList);
  if (m1 && m2 && (m1.id === m2.id || m1.name === m2.name || m1.code === m2.code)) return true;

  return false;
}

/**
 * 根据科室名称获取匹配的标准科室配置（带电话、默认楼宇、责任人）
 */
export function getDepartmentProfile(deptName: string, deptList: DepartmentMaster[]): DepartmentMaster | undefined {
  return resolveMasterDepartment(deptName, deptList);
}

/**
 * 计算每个科室在设备台账中的实际分布台数
 */
export function computeDepartmentEquipmentCounts(departments: DepartmentMaster[], equipmentList: MedicalEquipment[]): DepartmentMaster[] {
  const counts: Record<string, number> = {};
  for (const eq of equipmentList) {
    const d = eq.department || '未分配';
    counts[d] = (counts[d] || 0) + 1;
  }

  return departments.map(dept => ({
    ...dept,
    equipmentCount: counts[dept.name] || 0
  }));
}

export interface ResolvedDepartmentInfo {
  department: string;
  building: string;
  floor: string;
  nursePhone: string;
  manager: string;
  category?: string;
  disciplineCategory?: string;
  matchedDept?: DepartmentMaster;
}

/**
 * 智能解析科室主数据：提供高精度的名称匹配、别名推导与标准护士站电话/楼宇/楼层联动
 */
export function getDepartmentMasterInfo(
  deptName?: string,
  customDepartments?: DepartmentMaster[]
): ResolvedDepartmentInfo {
  const depts = (customDepartments && customDepartments.length > 0) ? customDepartments : DEFAULT_DEPARTMENTS;
  if (!deptName || !deptName.trim()) {
    return {
      department: '全院科室',
      building: '1号楼 综合楼',
      floor: '1',
      nursePhone: '7991100',
      manager: '崔伟'
    };
  }

  const raw = deptName.trim();
  const clean = raw.replace(/^(五莲县人民医院|五莲县皮肤病医院|总院|分院)/, '').trim();
  const baseName = clean.replace(/[\(（\[【].*?[\)）\]】]/g, '').trim();

  // 1. Exact match by name
  let found = depts.find(d => d.name === raw || d.name === clean || (baseName && d.name === baseName));

  // 2. Exact match by code or ID
  if (!found) {
    found = depts.find(d => d.code === raw || d.id === raw || (baseName && (d.code === baseName || d.id === baseName)));
  }

  // 3. Known Aliases / Common Clinical Names
  if (!found) {
    const aliasMap: Record<string, string> = {
      'CT室': '影像科',
      '放射科': '影像科',
      '磁共振室': '影像科',
      'MR室': '影像科',
      'DR室': '影像科',
      '放射影像科': '影像科',
      '医学影像科': '影像科',
      '超声': '超声科',
      '超声医学科': '超声科',
      '彩超室': '超声科',
      'B超室': '超声科',
      'B超': '超声科',
      '心功能室': '功能检查科',
      'ICU': '重症医学科',
      '重症监护室': '重症医学科',
      '重症监护': '重症医学科',
      '手术室': '麻醉手术科',
      '麻醉科': '麻醉手术科',
      '手术麻醉科': '麻醉手术科',
      '血透室': '血液透析室',
      '血液透析': '血液透析室',
      '血透': '血液透析室',
      '急诊': '急诊科',
      '急诊抢救室': '急诊科',
      '急诊抢救': '急诊科',
      '120': '急救站',
      '院前急救': '急救站',
      '急救中心': '急救站',
      '神经内科': '神经内一科',
      '神内': '神经内一科',
      '神内一科': '神经内一科',
      '神内二科': '神经内二科',
      '心内科': '心血管内一科',
      '心内一科': '心血管内一科',
      '心内二科': '心血管内二科',
      '心血管内科': '心血管内一科',
      '呼吸内科': '呼吸与危重症医学科',
      '呼吸科': '呼吸与危重症医学科',
      '消化内科': '消化保健科',
      '消化科': '消化保健科',
      '消化内镜中心': '内镜室',
      '内镜中心': '内镜室',
      '胃镜室': '内镜室',
      '肠镜室': '内镜室',
      '消化内镜室': '内镜室',
      '内分泌科': '内分泌风湿肾病科',
      '肾内科': '内分泌风湿肾病科',
      '风湿免疫科': '内分泌风湿肾病科',
      '普外科': '普外一科',
      '骨科': '骨一科',
      '骨外科': '骨一科',
      '神外科': '神经外科',
      '创伤科': '创伤外科',
      '肿瘤科': '肿瘤血液科',
      '血液科': '肿瘤血液科',
      '泌尿科': '泌尿外科',
      '五官科': '眼耳鼻喉科',
      '耳鼻喉科': '眼耳鼻喉科',
      '检验': '检验科',
      '化验室': '检验科',
      '医学检验科': '检验科',
      '检验医学科': '检验科',
      '导管室': '介入放射科',
      '介入导管室': '介入放射科',
      '妇产科': '产科',
      '产房': '产科',
      '儿科病区': '儿科',
      '设备科': '医疗设备应急库',
      '器械科': '医疗设备应急库',
      '医学工程科': '医疗设备应急库',
      '设备管理科': '医疗设备应急库',
      '应急库': '医疗设备应急库',
      '皮防站': '皮肤病医院办公室',
      '皮肤科': '皮肤病门诊'
    };

    const targetName = aliasMap[raw] || aliasMap[clean] || (baseName ? aliasMap[baseName] : undefined);
    if (targetName) {
      found = depts.find(d => d.name === targetName);
    }
  }

  // 4. Substring / Includes matching
  if (!found) {
    found = depts.find(d => 
      raw.includes(d.name) || 
      d.name.includes(raw) || 
      clean.includes(d.name) || 
      d.name.includes(clean) ||
      (baseName && (baseName.includes(d.name) || d.name.includes(baseName)))
    );
  }

  if (found) {
    return {
      department: found.name,
      building: found.buildingName || '1号楼 综合楼',
      floor: found.defaultFloor?.replace(/F$/i, '') || '1',
      nursePhone: found.nursePhone || '7991100',
      manager: found.defaultManager || '崔伟',
      category: found.category,
      disciplineCategory: found.disciplineCategory,
      matchedDept: found
    };
  }

  return {
    department: raw,
    building: '1号楼 综合楼',
    floor: '1',
    nursePhone: '7991100',
    manager: '崔伟'
  };
}

/**
 * 将设备台账记录与科室主数据深度关联、补全并同步电话、楼宇及楼层
 */
export function enrichEquipmentWithMasterData(
  equipment: MedicalEquipment,
  customDepartments?: DepartmentMaster[],
  forceSyncAll = false
): MedicalEquipment {
  const info = getDepartmentMasterInfo(equipment.department, customDepartments);
  
  const shouldUpdatePhone = forceSyncAll || !equipment.nursePhone || equipment.nursePhone.trim() === '' || equipment.nursePhone === '-';
  const shouldUpdateBuilding = forceSyncAll || !equipment.building || equipment.building.trim() === '' || equipment.building === '-';
  const shouldUpdateFloor = forceSyncAll || !equipment.floor || equipment.floor.trim() === '' || equipment.floor === '-';

  const defaultAssetNo = equipment.assetNo || `ZC-2023-${(equipment.id || '').replace(/\D/g, '').padStart(5, '0') || '10001'}`;
  const defaultOwnership = equipment.assetOwnership || '医院自有';
  const defaultCodeId = equipment.codeId || `COD-${equipment.id || '10001'}`;
  
  // 纯数字科室内部编号生成（若未指定或为空）
  let defaultInternalNo = (equipment.internalNo || '').trim();
  if (!defaultInternalNo) {
    // 纯数字默认：提取ID后几位数字或从1开始的纯数字
    const rawDigits = (equipment.id || '').replace(/\D/g, '');
    const numVal = parseInt(rawDigits.slice(-2), 10);
    defaultInternalNo = String(numVal && !isNaN(numVal) && numVal > 0 ? numVal : '1');
  }
  
  const buildingText = equipment.building || info.building || '1号楼 综合楼';
  const floorText = equipment.floor || info.floor ? `${equipment.floor || info.floor}F ` : '';
  const defaultUsageLocation = equipment.usageLocation || equipment.location || `${buildingText} ${floorText}${equipment.department}在用区`;

  return {
    ...equipment,
    assetNo: defaultAssetNo,
    assetOwnership: defaultOwnership,
    codeId: defaultCodeId,
    internalNo: defaultInternalNo,
    usageLocation: defaultUsageLocation,
    nursePhone: shouldUpdatePhone ? info.nursePhone : equipment.nursePhone,
    building: shouldUpdateBuilding ? info.building : equipment.building,
    floor: shouldUpdateFloor ? info.floor : equipment.floor,
    manager: (!equipment.manager || equipment.manager === '管理员' || equipment.manager === '张工') && info.manager ? info.manager : equipment.manager
  };
}

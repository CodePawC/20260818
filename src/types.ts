// ==================== 计量管理与国家强检目录主数据 (Metrology Catalogue) ====================
export type MetrologyManagementType = 'mandatory' | 'periodic_calibration' | 'exempt'; // 法定强检 | 周期校准 | 免计量
export type MetrologyFeePolicy = 'free_national' | 'paid_hospital' | 'none'; // 国家免费(免征强检费) | 医院自费(收费检验) | 无费用

export interface MetrologyCatalogueItem {
  id: string; // e.g. "CAT-QJ-01", "CAT-JZ-01"
  catalogueCode: string; // 目录代码 e.g. "QJ-01", "JZ-01"
  name: string; // 目录器具名称 e.g. "心电图机", "医用超声诊断仪", "医用输液泵和注射泵"
  managementType: MetrologyManagementType; // 管理方式: 法定强检 vs 周期校准 vs 免计量
  feePolicy: MetrologyFeePolicy; // 费用政策: 国家免费(免征强检费) vs 医院自费
  legalBasis: string; // 法规依据
  verificationPeriodMonths: number; // 检定/校准周期 (月)
  verificationBody: string; // 推荐法定/资质机构 (e.g. "法定计量检定机构 (e-CQS强检平台)")
  matchKeywords: string[]; // 智能匹配关键词 (用于自动分类全院设备)
  applicableScope: string; // 适用范围与参数说明
  standardVerificationFeeEst?: number; // 参考原政府定价或校准单价 (元/台次)
  status: 'active' | 'inactive'; // 是否启用
  updatedAt?: string;
  notes?: string;
}

export type ActiveTab = 'ledger' | 'dashboard' | 'maintenance' | 'repairs' | 'emergency_reserve' | 'tracking' | 'analytics' | 'ai' | 'partners' | 'master_data';

// ==================== 组织与空间主数据模型 (Master Data) ====================
export interface CampusMaster {
  id: string;
  code: string; // e.g. "HQ", "EAST", "NORTH"
  name: string; // e.g. "滨江总院区"
  shortName: string; // e.g. "总院"
  address: string;
  contactPhone: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface BuildingMaster {
  id: string;
  campusId: string; // 关联院区
  campusName: string;
  code: string; // e.g. "B1", "B2", "B3"
  name: string; // e.g. "1号楼 综合楼", "2号楼 外科大楼"
  floors: string[]; // e.g. ["-1F", "1F", "2F", "3F", "4F", "5F", "6F", "7F", "8F"]
  description?: string;
  status: 'active' | 'inactive';
}

export interface LocationRoomMaster {
  id: string; // e.g. "300", "312", "ROOM-01"
  workplaceId?: string; // ID_场所信息 e.g. "300", "696"
  campusId: string;
  campusName: string;
  buildingId: string;
  buildingName: string;
  floor: string; // e.g. "1F", "3F", "8F", "-1F"
  roomCode: string; // e.g. "LOC-300", "OR-01", etc.
  roomName: string; // e.g. "麻醉手术科手术1间", "皮防站办公室", "CT扫描1室"
  officePhone?: string; // 办公电话 e.g. "7961100", "7991000"
  shortPhone?: string; // 短号 e.g. "53100", "56000"
  roomType: '诊室' | '手术室' | '病房' | '抢救室' | '检验中心' | '医技检查室' | '设备库房' | '办公区' | '机房动力' | '治疗室' | '门诊';
  departmentId?: string;
  departmentName?: string; // ID_科室信息 e.g. "皮肤病医院办公室", "麻醉手术科"
  fullLocationPath: string; // e.g. "五莲县人民医院 > 1号楼 综合楼 > 8F > 麻醉手术科 > 麻醉手术科手术1间"
  equipmentCount?: number;
}

export interface DepartmentMaster {
  id: string; // e.g. "254"
  code: string; // e.g. "DEP-254"
  name: string; // 科室名称 e.g. "内分泌风湿肾病科"
  hospitalName?: string; // ID_医院信息: "五莲县人民医院" | "五莲县皮肤病医院"
  disciplineCategory?: string; // ID_学科分类: "内科科", "外科科", "妇产科", etc.
  category: string; // 功能/分类 e.g. "临床病区", "临床", "医技", "行管后勤", "特殊"
  functionType?: string; // 功能: 临床病区 / 临床 / 医技 / 行管后勤 / 特殊
  campusId: string;
  campusName: string;
  buildingId: string;
  buildingName: string; // 楼号 e.g. "1号楼 综合楼"
  defaultFloor: string; // 楼层 e.g. "16", "15", "1F"
  nursePhone: string; // 护士站电话
  doctorOfficePhone?: string; // 医生办公室电话
  dutyPhone?: string; // 值班电话
  adverseEventReporting?: boolean; // 不良事件报告科室 (Yes/No)
  emergencyDeployment?: boolean; // 应急调配科室 (Yes/No)
  leader?: string; // 科室主任/负责人
  defaultManager: string; // 责任工程师 e.g. "崔伟", "孙志强"
  equipmentCount?: number; // 关联设备数
  description?: string;
  status: 'active' | 'inactive';
}

export type StaffRole = 
  | '设备管理员' 
  | '维修工程师' 
  | '计量管理员' 
  | '质控主管' 
  | '科室责任人' 
  | '护士长' 
  | '科室主任' 
  | '库管员' 
  | '驻场原厂工程师' 
  | '三方维保工程师'
  | string;

export interface StaffRoleDefinition {
  id: string;
  name: string;
  category: 'clinical' | 'engineering' | 'administration' | 'management' | 'partner' | (string & {});
  categoryLabel: string;
  description: string;
  badgeColor: string; // 'indigo' | 'emerald' | 'amber' | 'purple' | 'sky' | 'rose' | 'slate' | 'teal'
  permissions: string[]; // e.g. ['台账管理', '设备报修', '强检申报', '巡检维护', '应急调配', '报废审核', '配件耗材']
  isSystemDefault?: boolean;
}

export type StakeholderCluster = 
  | 'hospital_engineering'      // 院内医学工程与保障集群
  | 'hospital_clinical'         // 院内临床与医护应用集群
  | 'hospital_administration'   // 院内行政与职能监管集群 (医务/护理/院感/财务/招标/保卫/信息/医保/审计/院办等)
  | 'oem_vendor'                // 生产厂家与原厂售后/销售集群
  | 'third_party_service'       // 第三方维保托管服务商集群
  | 'metrology_regulatory'      // 法定计量与特种监管评价机构集群
  | (string & {});              // 支持用户自定义干系人集群分类扩展

export interface StakeholderCredential {
  certName: string;         // 证书名称 e.g. "大型医用设备上岗证 (CT)"
  certNo?: string;          // 证书编号 e.g. "SD-RAD-202409"
  issuer?: string;          // 颁发机构 e.g. "国家卫生健康委能力建设和继续教育中心"
  expireDate?: string;      // 到期日期 e.g. "2027-12-31"
  isExpired?: boolean;
}

export interface StaffPersonMaster {
  id: string;
  employeeNo: string; // 工号/外部专家编号 e.g. "EMP-8001", "OEM-GE-01"
  name: string; // 姓名 e.g. "崔工", "王经理"
  stakeholderCategory?: StakeholderCluster; // 干系人类型分类
  organization?: string; // 所属单位/机构/企业名称 e.g. "五莲县人民医院", "通用电气医疗 (GE Healthcare)", "山东省计量科学研究院"
  departmentId: string;
  departmentName: string;
  role: StaffRole;
  roles?: string[]; // 兼任角色/多角色设定
  phone: string; // 联系电话 / 短号 / 24H热线
  email?: string;
  title?: string; // 职称/业务头衔 e.g. "主管工程师", "高级售后支持专家(FSE)", "大区销售经理", "法定计量检定员"
  isPrimaryContact: boolean; // 是否本科室/本业务首要对接人
  specialties?: string[]; // 专长领域/分管方向 e.g. ["放射影像", "急救生命支持", "手术室", "检验生化"]
  serviceScope?: string; // 负责服务的产品线/品牌范围 e.g. "GE CT/MR全系维保", "迈瑞监护除颤", "全院强检压力表与心电图机"
  emergencyTier?: 'L1' | 'L2' | 'L3' | 'none'; // 应急响应梯队：L1 现场快速响应 | L2 院内医工支持 | L3 原厂技术专家/24H热线
  certifications?: string[]; // 资质认证 (简要标签)
  credentials?: StakeholderCredential[]; // 结构化资质证书 (含到期预警)
  serviceContractNo?: string; // 关联维保合同号 / 检定委托协议编号 e.g. "HT-2025-GE-001"
  status: 'active' | 'inactive' | 'on_leave';
  managedCampuses?: string[]; // 分管院区
  notes?: string;
}

/**
 * 国家食品药品监督管理总局 (NMPA 2017版) 医疗器械分类目录主数据
 */
export interface NmpaCategoryMasterItem {
  id: string;                      // 唯一标识 e.g. "NMPA-06-01-01"
  categoryCode: string;            // 大类编码 "01" ~ "22"
  categoryName: string;            // 大类名称 e.g. "06 医用成像器械"
  level1Code: string;              // 一级类别编码 e.g. "06-01"
  level1Name: string;              // 一级类别名称 e.g. "诊断 X 射线机"
  level2Code: string;              // 二级类别编码 e.g. "01", "06-01-01"
  level2Name: string;              // 二级类别名称 e.g. "血管造影 X 射线机"
  productExamples: string[];       // 品名举例 e.g. ["血管造影X射线机", "DSA系统"]
  riskClass: 'I类' | 'II类' | 'III类' | 'I/II/III类'; // 管理类别
  description?: string;            // 产品描述
  intendedUse?: string;            // 预期用途
  matchKeywords: string[];         // 智能匹配关键词库
  defaultDepreciationYears?: number; // 推荐折旧年限 (年)
  defaultMaintenanceCycleMonths?: number; // 推荐维保周期 (月)
  defaultMetrologyType?: 'mandatory' | 'periodic_calibration' | 'exempt'; // 推荐计量类别
  status: 'active' | 'inactive';
}

export type PartnerType = 
  | 'calibration_agency'   // 法定计量检测机构
  | 'manufacturer'         // 设备生产厂家 / 原厂
  | 'third_party_repair'   // 第三方维保与维修公司
  | 'supplier';            // 备件与特约供货商

export interface PartnerOrganization {
  id: string;
  name: string;
  shortName: string;
  type: PartnerType;
  level?: string; // 如：省级法定计量院、原厂核心制造商、ISO9001第三方维保机构等
  contactPerson: string;
  contactTitle: string;
  contactPhone: string;
  hotline: string; // 24小时应急热线
  email: string;
  address: string;
  website?: string;
  qualifications: string[]; // CMA, CNAS, 医疗器械生产许可证, 医疗器械经营许可证, ISO 13485等
  certNumbers: Record<string, string>; // e.g. CMA: '2023190124Z'
  contractNo: string;
  contractName: string;
  contractPeriod: string;
  contractStatus: '履约中' | '临期需续签' | '已到期' | '长期合作';
  serviceScope: string[];
  turnaroundTime: string;
  emergencyResponse: string;
  settlementTerms: string;
  bankAccount: {
    bankName: string;
    accountNo: string;
    taxNo: string;
  };
  cooperationRating: number; // 4.5 ~ 5.0
  notes?: string;
  createdAt?: string;
}

export type EquipmentStatus = '正常运行' | '维护保养中' | '故障待修' | '停用/报废';

export type EquipmentCategory = 
  | '急救监护类'
  | '影像诊断类'
  | '呼吸麻醉类'
  | '检验分析类'
  | '手术器械类'
  | '通用诊疗类';

export interface RepairRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentSn: string;
  faultDate: string; // YYYY-MM-DD
  repairType: '紧急故障维修' | '定期预防性保养' | '计量校准' | '巡检维护';
  faultDescription: string;
  technician: string; // 维修人员或服务商
  cost: number; // 费用（元）
  partsReplaced?: string; // 更换零部件
  resolution: string; // 修复处理方案
  status: '处理中' | '已完成' | '待配件';
  completionDate?: string;
}

export interface StatusLog {
  id: string;
  equipmentId: string;
  oldStatus: EquipmentStatus;
  newStatus: EquipmentStatus;
  reason: string;
  operator: string;
  timestamp: string;
}

export interface MedicalEquipment {
  id: string; // ID (系统编号/资产ID)
  categoryNo?: string; // 类别序号
  category: string; // 类别
  level1No?: string; // 一级序号
  level1Category?: string; // 一级类别
  level2No?: string; // 二级序号
  level2Category?: string; // 二级类别
  name: string; // 设备名称
  model: string; // 规格型号
  enableDate: string; // 投用时间 YYYY/M/D 或 YYYY-MM-DD
  manufactureDate?: string; // 出厂日期 YYYY/M/D 或 YYYY-MM-DD
  productValidity?: string; // 产品有效期 (年)
  sn: string; // 出厂编号
  manufacturer: string; // 厂商名称
  calibration?: string; // 计量校准 (Yes/No)
  calibrationType?: '强检(国家免费)' | '定期校准(自费)' | '免计量' | '强检类' | '常规校准'; // 计量政策分类
  catalogueCode?: string; // 关联国家强检/校准目录代码 e.g. "QJ-01", "JZ-01"
  feePolicy?: MetrologyFeePolicy; // 费用属性: 国家免费(0元免征) vs 医院自费
  calibrationUnit?: string; // 计量检测单位 (省级/市级/国家级/机构名称)
  lastCalibrationDate?: string; // 上次计量校准日期 YYYY-MM-DD
  nextCalibrationDate?: string; // 下次计量/校验到期日 YYYY-MM-DD
  calibrationCertificateNo?: string; // 计量证书编号
  department: string; // 科室
  building?: string; // 楼号
  floor?: string; // 楼层
  nursePhone?: string; // 护士站电话
  
  // Operational fields
  manager?: string; // 管理责任人
  status: EquipmentStatus; // 运行状态
  purchaseDate?: string; // 购入日期
  purchasePrice?: number; // 购入价格
  supplier?: string; // 供应商
  warrantyUntil?: string; // 保修到期
  lastMaintenanceDate?: string; // 上次维保
  nextMaintenanceDate?: string; // 下次维保
  location?: string; // 存放具体位置
  imageUrl?: string; // 设备实物照片 (URL / Base64 Data URL)
  lastFaultReason?: string; // 最近故障原因简记
  repairCount: number; // 累计维修次数
  repairRecords: RepairRecord[];
  statusLogs: StatusLog[];
}

export type SortField =
  | 'id'
  | 'categoryNo'
  | 'category'
  | 'level1No'
  | 'level1Category'
  | 'level2No'
  | 'level2Category'
  | 'name'
  | 'sn'
  | 'enableDate'
  | 'manufactureDate'
  | 'department'
  | 'building'
  | 'floor'
  | 'purchasePrice'
  | 'repairCount'
  | 'repairCost'
  | 'status';

export type SortOrder = 'asc' | 'desc';

export interface EquipmentFilterState {
  keyword: string;
  department: string;
  status: string;
  category: string;
  level1Category?: string;
  level2Category?: string;
  validityRisk?: string;
  calibrationStatus?: string; // 'valid' | 'due_soon' | 'overdue' | 'exempt'
  sortField?: SortField;
  sortOrder?: SortOrder;
}

export interface ColumnVisibility {
  indexNumber: boolean;
  id: boolean;
  category: boolean;
  level1Category: boolean;
  level2Category: boolean;
  nameModel: boolean;
  sn: boolean;
  manufacturer: boolean;
  enableDate: boolean;
  manufactureDate?: boolean;
  calibration: boolean;
  department: boolean;
  location: boolean;
  manager: boolean;
  purchasePrice: boolean;
  repairStats?: boolean;
  healthScore?: boolean;
  maintenanceNode?: boolean;
  status: boolean;
}

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  indexNumber: true,
  id: true,
  category: true,
  level1Category: true,
  level2Category: true,
  nameModel: true,
  sn: true,
  manufacturer: true,
  enableDate: true,
  manufactureDate: true,
  calibration: true,
  department: true,
  location: true,
  manager: false,
  purchasePrice: false,
  repairStats: true,
  healthScore: true,
  maintenanceNode: true,
  status: true,
};

export interface SystemStats {
  totalCount: number;
  normalCount: number;
  maintenanceCount: number;
  faultCount: number;
  decommissionedCount: number;
  totalValue: number;
  monthlyRepairCost: number;
}

// ==================== 身份认证与权限管理 (Auth & RBAC) ====================
export interface AuthUser {
  id: string; // 对应 StaffPersonMaster.id
  employeeNo: string; // 工号 e.g. "EMP-7001", "EMP-8001"
  name: string; // 姓名 e.g. "崔伟", "孙志强"
  role: StaffRole; // 主数据角色
  roles?: string[]; // 兼任角色
  departmentId: string;
  departmentName: string;
  organization: string; // 所属单位 e.g. "五莲县人民医院"
  title?: string; // 职称/头衔
  phone?: string;
  email?: string;
  stakeholderCategory?: StakeholderCluster; // 所属集群
  permissions: string[]; // 拥有权限列表
  isAdmin?: boolean; // 是否超级管理员
  loginAt: string; // 登录时间戳
}

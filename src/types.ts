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

export type ActiveTab = 'welcome' | 'ledger' | 'dashboard' | 'maintenance' | 'repairs' | 'dispatch' | 'parts_inventory' | 'adverse_events' | 'emergency_reserve' | 'tracking' | 'analytics' | 'roi' | 'ai' | 'partners' | 'master_data' | 'approvals' | 'mobile_inspection' | 'vendor_collaboration' | 'factory_repair_workflow' | 'repair_closed_loop' | 'regulations' | 'project_concluding' | 'ai_config' | 'database_backup' | 'system_update' | 'system_ops' | 'caoliao_integration';

// ==================== 移动扫码巡检与快速盘点 (Mobile Inspection & Inventory Audit) ====================
export type InspectionAuditResult = 'normal_present' | 'location_discrepancy' | 'fault_reported' | 'accessory_missing' | 'calibration_expired';

export interface MobileInspectionAuditRecord {
  id: string; // e.g. "INSP-20260906-001"
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  department: string;
  recordedLocation: string; // 系统登记位置
  actualLocation: string;   // 现场核查实际位置
  locationMatched: boolean; // 位置是否相符
  inspectorId: string;
  inspectorName: string;
  inspectorRole: string;
  inspectionTime: string; // 格式化时间戳
  result: InspectionAuditResult; // 巡检盘点结论
  statusSnapshot: EquipmentStatus; // 检查时设备状态
  appearanceCondition: '完好' | '轻微磨损' | '破损严重';
  electricalSafe: boolean; // 电源线与接地良好
  accessoriesComplete: boolean; // 专用附件齐全
  cleanliness: '清洁完好' | '待消毒保养';
  batteryCondition?: '正常待命' | '电量偏低' | '老化衰减';
  fieldPhotoUrl?: string; // 现场存证照片
  remarks?: string; // 备注说明
  repairRequestId?: string; // 若联动报修，记录生成的报修工单号
}

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
  shortPhone?: string; // 院内短号
  email?: string;
  gender?: string;
  workplace?: string; // 工作场所/具体网格
  isEquipmentAdmin?: boolean; // 设备管理员
  isAdverseEventAdmin?: boolean; // 不良事件管理员
  isRadiationWorker?: boolean; // 放射工作人员
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
  repairType: '紧急故障维修' | '定期预防性保养' | '计量校准' | '巡检维护' | '全院零星维保框架批次' | '草料二维码扫码报修' | (string & {});
  faultDescription: string;
  technician: string; // 维修人员或服务商
  cost: number; // 费用（元）
  partsReplaced?: string; // 更换零部件
  resolution: string; // 修复处理方案
  status: '处理中' | '已完成' | '待配件';
  completionDate?: string;
  department?: string;
  reporterName?: string;
  reporterPhone?: string;
  codeId?: string;
  recordNo?: string;
  photoUrl?: string;
  videoUrl?: string;
  source?: 'caoliao' | 'platform' | 'manual';
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

export interface EquipmentLoanRecord {
  id: string; // e.g. "LOAN-20260819-001"
  equipmentId: string;
  equipmentName: string;
  ownerDepartment: string; // 资产产权科室
  borrowingDepartment: string; // 实际借用科室
  borrowerName: string; // 借用经手人
  borrowerPhone?: string; // 借用人联系方式
  lenderName?: string; // 出借经手人
  lenderPhone?: string; // 出借人联系方式
  borrowTime: string; // 借出时间 e.g. "2026-08-15 10:00"
  expectedReturnTime: string; // 预计归还时间 e.g. "2026-08-25 18:00"
  actualReturnTime?: string; // 实际归还时间
  borrowReason: string; // 借用事由
  loanStatus: 'borrowed' | 'returned' | 'overdue'; // 借调中 | 已归还 | 超期未还
  accessories?: string[]; // 随借附件清单 e.g. ["主机电源线", "导联线", "血氧探头"]
  handoverNotes?: string; // 出借交接说明
  returnNotes?: string; // 归还核验备注
  returnReceiverName?: string; // 归还接收验收人
  
  // 无纸化全流程电子签名与 CA 认证存证字段
  isElectronicSigned?: boolean; // 是否全流程电子签名
  borrowerSignatureData?: string; // 领机人手写/系统签名 Base64 或手迹标示
  lenderSignatureData?: string; // 发机人手写/系统签名 Base64
  returnerSignatureData?: string; // 归还交还人电子签名
  receiverSignatureData?: string; // 验收接收工程师电子签名
  signTimestamp?: string; // 电子签署时间戳
  digitalSealCertNo?: string; // 医院电子认证证书编号 e.g. "SD-WLH-CA-20260820-9941"
  blockchainHash?: string; // 电子存证哈希
  isPaperlessArchived?: boolean; // 是否已自动归档至云端无纸化档案库
}

// ==================== 超期服役整修与稳定性检测备案 (Over-Service Life & Stability Quality Filing) ====================
export interface OverdueSafetyTestItem {
  id: string;
  name: string; // e.g. "GB 9706.1 电气安全测试"
  standard: string; // e.g. "GB 9706.1-2020 / IEC 60601-1"
  result: 'PASS' | 'FAIL';
  measuredValue: string; // e.g. "接地阻抗 0.045Ω (<0.1Ω合格); 对地漏电流 0.076mA (<0.5mA合格)"
  conclusion: string; // e.g. "符合医用电气安全限值"
}

export type OverdueFilingStatus = 'ACTIVE' | 'EXPIRED' | 'UNDER_REVIEW' | 'REVOKED';

export type ThirdPartyReportType = 
  | 'stability_72h' 
  | 'electrical_safety_gb9706' 
  | 'cma_cnas_calibration' 
  | 'refurbish_inspection' 
  | 'other';

export interface ThirdPartyInspectionReport {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'doc';
  fileSize?: string; // e.g. "3.8 MB"
  uploadDate: string; // e.g. "2026-09-10 10:30"
  uploaderName?: string; // e.g. "崔伟 (主任工程师)"
  reportType: ThirdPartyReportType;
  reportTypeName: string; // e.g. "72小时满负荷连续运行稳定性检测报告"
  agencyName: string; // e.g. "山东省医疗器械产品质量检验中心"
  reportNo: string; // e.g. "QA-STB-20260525-09"
  verificationStatus: 'verified' | 'unverified'; // 具备 CMA / CNAS 实验室资质认证
  conclusion: 'QUALIFIED' | 'DISQUALIFIED'; // 检验结论: 合格 / 不合格
  fileUrl?: string; // Base64 或预览 Data URL
  summary?: string; // 核心数据摘要
  extractedData?: {
    testDate?: string;
    agency?: string;
    reportNo?: string;
    groundResistance?: string; // 接地阻抗
    leakageCurrent?: string; // 漏电流
    continuousHours?: number; // 连续运行时间
    driftRate?: string; // 漂移率
    conclusion?: string;
  };
}

export interface OverdueFilingRecord {
  filingNo: string; // 院内特许备案证书编号 e.g. "EXT-2026-0819"
  filingStatus: OverdueFilingStatus; // 备案准用有效 | 备案到期需复核 | 审核中 | 撤销停用
  originalLifespanYears: number; // 厂家标称设计使用寿命 (年)
  overdueYears: number; // 当前超期年限 (年) e.g. 2.3
  
  // 1. 深度整修与核心部件翻新 (Refurbishment & Parts Replacement)
  refurbishDate: string; // 整修完成日期 YYYY-MM-DD
  refurbishProvider: string; // 负责整修单位/机构
  refurbishSummary: string; // 整修项目详述
  partsReplaced: string[]; // 替换的关键零部件清单
  refurbishCost?: number; // 整修支出费用 (元)
  
  // 2. 稳定性检测与电气安全 (Stability Testing & GB 9706.1)
  stabilityTestDate: string; // 稳定性检测完成日期
  stabilityTestAgency: string; // 检测机构 (资质第三方/院内质控实验室)
  stabilityTestReportNo: string; // 质控合格报告单号 e.g. "QA-STB-20260620-04"
  continuousRunHours: number; // 连续满载工况测试时长 (如 72小时连续稳定性监测)
  driftRate: string; // 关键输出漂移率 (如 "<0.35% (优于标准限值)")
  testItems: OverdueSafetyTestItem[]; // 电气安全与关键性能测试项明细
  
  // 3. 委员会论证、特许准用期限与风控 (Committee Filing & Supervision)
  approvedDate: string; // 委员会论证通过日期
  validUntil: string; // 特许延期准用截止日 (通常6个月至1年，严禁一备永逸)
  leadEngineer: string; // 监管责任工程师
  leadEngineerPhone?: string; // 责任工程师联系电话/短号
  approverRole: string; // 签批角色 (医学装备管理与伦理委员会 / 医工处长)
  approverName: string; // 审批签批人
  approvalDocNo: string; // 院内批件公文号 e.g. "医装委备[2026]042号"
  monitoringFrequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'; // 缩周期重点巡检频次
  lastInspectionDate?: string; // 最近一次缩周期重点巡检日期
  nextInspectionDate?: string; // 下次重点巡检计划日期
  remarks?: string; // 备注与临床使用限制要求 (如：限用于非急救平诊患者)

  // 4. 第三方检测与整修证明文件档案 (Third-Party Testing Reports & Attachments)
  reports?: ThirdPartyInspectionReport[];
}

export interface MedicalEquipment {
  id: string; // ID (系统编号/资产ID)
  assetNo?: string; // 资产编号 (如: ZC-2023-10159)
  assetOwnership?: string; // 资产归属 (如: 医院自有 / 科室自购 / 厂商租赁 / 厂商投放 / 受赠资产 / 科研托管 等)
  codeId?: string; // code_id (统一物资追溯条码 / 草料活码 code_id 如: 133382883)
  caoliaoUrl?: string; // 草料二维码活码线上直达链接 (如: http://qr71.cn/oTiEcM/qNfQEMG)
  caoliaoCodeName?: string; // 草料端活码全称 (如: 麻醉手术科-高频电刀)
  internalNo?: string; // 科室内部编号 / 临床自编号 (如: 8号机, 1号监护仪, US-01, ICU-03, 临床科室用于区分同类设备及日常沟通报修使用)
  usageLocation?: string; // 使用场所 / 安装场所 (如: 综合楼3F 超声诊断1室)
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
  department: string; // 科室 (若处于借出状态，此处为当前在用或借入科室，亦可为原科室)
  ownerDepartment?: string; // 资产产权归属科室 (原所有者科室)
  building?: string; // 楼号
  floor?: string; // 楼层
  nursePhone?: string; // 护士站电话
  
  // 科室间借调与流转管理 (Inter-Department Loan & Borrowing)
  currentLoan?: EquipmentLoanRecord; // 当前活跃借调单
  loanHistory?: EquipmentLoanRecord[]; // 历史借调轨迹

  // 业务运维与超期服役备案 (Over-Service Life Extension & Stability Compliance)
  overdueFiling?: OverdueFilingRecord;

  // 新机入库与开箱验收纸质档案 (New Equipment Inbound Unboxing & Acceptance Dossier)
  acceptanceDossier?: EquipmentAcceptanceDossier;

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

// 台账列表视图模式：紧凑表格 | 大卡片平铺 | 设备照片流
export type EquipmentViewMode = 'compact_table' | 'card_grid' | 'photo_stream';

// 视图模式专属快速筛选关键字
export type EquipmentQuickFilterKey =
  | 'all'                 // 全量显示
  | 'pending_repair'      // 待维修 (故障待修 / 维护保养中)
  | 'high_value'          // 高价值 (原值 >= 50万)
  | 'with_real_photo'     // 拥有真实实物照片
  | 'overdue_service'     // 超期服役 / 特许准用 / 临近失效
  | 'low_health'          // 健康评分预警 (<80分)
  | 'calibration_due'     // 计量待校准 (到期或临期)
  | 'in_loan';            // 跨科室借调流转中

export type SortField =
  | 'id'
  | 'assetNo'
  | 'assetOwnership'
  | 'codeId'
  | 'internalNo'
  | 'usageLocation'
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
  deptScopeMode?: 'owner' | 'in_use'; // 'owner': 产权所有科室 | 'in_use': 实际在用科室 (含借入)
  status: string;
  loanStatus?: string; // 'all' | 'self_use' | 'lent_out' | 'borrowed_in' | 'overdue'
  category: string;
  level1Category?: string;
  level2Category?: string;
  validityRisk?: string;
  overdueStatus?: string; // 'all_overdue' | 'filed_permitted' | 'unfiled_pending' | 'near_expiry'
  calibrationStatus?: string; // 'valid' | 'due_soon' | 'overdue' | 'exempt'
  quickFilter?: EquipmentQuickFilterKey; // 视图模式专属一键快速过滤
  sortField?: SortField;
  sortOrder?: SortOrder;
}

export interface ColumnVisibility {
  indexNumber: boolean;
  id: boolean;
  assetNo?: boolean;
  assetOwnership?: boolean;
  codeId?: boolean;
  internalNo?: boolean;
  usageLocation?: boolean;
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
  assetNo: true,
  assetOwnership: true,
  codeId: true,
  internalNo: true,
  usageLocation: true,
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

// ==================== 新机入库开箱验收纸质档案 (Inbound Unboxing & Commissioning Dossier) ====================

export type UnboxingItemCategory = '包装与外箱' | '三证与资质' | '主机与铭牌' | '技术资料与图纸' | '标配附件与线缆' | '选配组件与专用工具';

export interface UnboxingInspectionItem {
  id: string;
  category: UnboxingItemCategory;
  itemName: string;
  specification?: string;
  standardQuantity: number;
  actualQuantity: number;
  unit: string;
  checkResult: 'pass' | 'defect' | 'missing'; // 合格 / 瑕疵微损 / 缺漏待补
  remarks?: string;
}

export type TechnicalTestCategory = '供电及安装环境' | '电气安全指标' | '关键性能与参数' | '连续带载试运行';

export interface TechnicalPerformanceTestItem {
  id: string;
  testCategory: TechnicalTestCategory;
  parameterName: string;
  standardRequirement: string;
  measuredValue: string;
  testResult: 'pass' | 'fail' | 'na';
  testInstrument?: string; // 专用检测仪器 (如 Fluke ESA620、Rigel 288+、RaySafe X2 等)
}

export interface TrainingPhoto {
  id: string;
  url: string; // Base64 Data URL 或真实图片地址
  caption: string; // 现场照片描述 (如 "原厂临床专员现场指导医护人员参数设定与盲机演练")
  uploadedAt: string; // 拍摄/上传时间
  category?: 'lecture' | 'operation' | 'assessment' | 'handover'; // 理论教学 | 实操演练 | 技能考核 | 签字交接
  takenBy?: string; // 记录人 (如 "张工 / 医学装备科")
}

export interface TrainingTopicItem {
  id: string;
  category: string;
  title: string;
  durationHours: number;
}

export interface ClinicalTrainingRecord {
  trainingNo?: string; // 培训档案编号 (如 PX-2023-081401)
  trainingDate: string;
  trainingHours: number;
  trainingLocation?: string; // 现场实操教学地点 (如 "住院部5楼重症监护室(ICU) 03床旁")
  trainerName: string;
  trainerTitle: string;
  trainerCompany: string;
  trainerPhone: string;
  topics?: TrainingTopicItem[]; // 培训授课模块与科目
  trainees: Array<{
    id?: string;
    name: string;
    department: string;
    role: string;
    assessmentResult: '优秀' | '良好' | '合格';
    score?: number; // 考核实际得分 (如 98 分)
    theoryScore?: number;
    practicalScore?: number;
    signature?: string; // 学员亲笔签名
    traineeSignature?: string;
  }>;
  courseContent: string;
  assessmentSummary: string;
  photos: TrainingPhoto[]; // 培训现场实操与签到照片 (必须支持上传与 A4 文档打印)
  trainerSignature?: string; // 培训专家签名
  departmentDirectorSignature?: string; // 临床科主任/护士长签名
  equipmentEngineerSignature?: string; // 装备科主检工程师签名
}

export interface AcceptanceSignoffDetail {
  roleCode: 'vendor_engineer' | 'biomedical_engineer' | 'clinical_head' | 'equipment_director' | 'finance_auditor';
  roleTitle: string; // 如 "供货厂商原厂安装工程师"
  departmentOrCompany: string; // 如 "沈阳东软医疗系统有限公司 华东技术支持部"
  signatoryName: string; // 签署人姓名
  employeeNoOrCert?: string; // 工号/厂商资质认证号
  jobTitle?: string; // 职务/职称
  phone?: string; // 联系电话
  signDate: string; // 签署时间 YYYY-MM-DD
  opinion: string; // 验收审定意见
  signatureImage?: string; // 电子手写签名笔迹
  stampType?: 'vendor' | 'biomedical' | 'hospital_official' | 'clinical'; // 印鉴标识
}

export interface AcceptanceSheetCoupon {
  couponIndex: number;
  couponName: string; // 如 "第一联 (白联)"
  couponTitle: string; // 如 "医学装备科留存 (档案归档联)"
  bgTone: string; // 纸张仿真色调
  textColor: string;
  borderColor: string;
}

export interface EquipmentAcceptanceDossier {
  // 1. 档案标识与采购商务立项
  acceptanceNo: string; // 验收单号 (如 YS-2020-091201)
  contractNo: string; // 购销合同编号 (如 HT-2020-MED-10159)
  biddingNo: string; // 招标/挂网编号 (如 ZB-2020-WL-088)
  procurementMethod: '公开招标' | '竞争性磋商' | '单一来源采购' | '省市集采挂网' | '医院自主谈判';
  fundingSource: string; // 资金来源 (如 财政专项公债资金 / 重点学科建设专项 / 医院自有事业资金)
  invoiceCode?: string; // 发票代码
  invoiceNo?: string; // 增值税专用发票号
  deliveryDate: string; // 到货时间 YYYY-MM-DD
  installationStartDate: string; // 安装开始时间 YYYY-MM-DD
  acceptanceDate: string; // 验收竣工签署时间 YYYY-MM-DD
  installationLocation: string; // 安装调试实际科室物理房间

  // 2. 监管与资质三证核验 (NMPA Registration & Origin)
  registrationCertNo: string; // 医疗器械注册证编号 (如 国械注准20203060128)
  registrationCertExpiry: string; // 注册证到期日
  productionLicenseNo: string; // 医疗器械生产企业许可证
  customsDeclarationNo?: string; // 进口海关报关单号 (进口设备专属)
  certificateOfOrigin?: string; // 原产国/产地证明编号
  qualityInspectionCertNo: string; // 厂方出厂质检合格证书编号

  // 3. 开箱清点与实物附件查验
  unboxingItems: UnboxingInspectionItem[];
  unboxingConclusion: string; // 开箱总评

  // 4. 安装调试与工程技术参数实测
  technicalTests: TechnicalPerformanceTestItem[];
  testingConclusion: string; // 性能与安全复核结论

  // 5. 临床操作与维护技能培训
  trainingRecord: ClinicalTrainingRecord;

  // 6. 质保承诺与售后服务 SLA
  warrantyMonths: number; // 整机质保月数 (如 36)
  corePartWarrantyYears: number; // 核心部件质保年限
  responseSlaHours: number; // 故障响应时效 (如 2 小时)
  onsiteSlaHours: number; // 工程师到达现场时效 (如 24 小时)
  preventiveMaintenancePerYear: number; // 每年免费深度巡检保养频次
  postWarrantyPolicy: string; // 质保期后维修费、工时费及配件折扣承诺

  // 7. 综合评定结论
  finalAcceptanceConclusion: '合格同意入库投用' | '附条件限期整改准用' | '不合格退换货处理';
  acceptanceSummaryNotes: string; // 综合决议评语

  // 8. 五方联合签名与会签
  signoffs: {
    vendorEngineer: AcceptanceSignoffDetail;
    biomedicalEngineer: AcceptanceSignoffDetail;
    clinicalHead: AcceptanceSignoffDetail;
    equipmentDirector: AcceptanceSignoffDetail;
    financeAuditor: AcceptanceSignoffDetail;
  };

  // 9. 多联凭单与印鉴防伪
  securityVerificationCode: string; // 防伪验证码 (如 WL-SEC-883921)
  officialStampText: string; // 医院公章文字 (五莲县人民医院 医学装备科 设备验收入库专用章)
}


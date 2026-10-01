// 外协供应商协同、多科室联合议价与发票全套资料归档相关类型定义

export type VendorCollabStatus = 
  | 'PENDING_QUOTE'       // 待供应商报价
  | 'MULTI_DEPT_NEGOTIATING' // 多科室联合议价中
  | 'QUOTE_REJECTED'     // 报价已驳回/重新报价
  | 'APPROVED_REPAIRING' // 已定标同意/维修中
  | 'COMPLETED_PENDING_INVOICE' // 维修完成待传发票
  | 'INVOICE_UPLOADED'   // 发票已上传待核验
  | 'ARCHIVED';          // 全套资料已归档入库

// 报价单零部件拆解项
export interface QuotePartItem {
  id: string;
  name: string;
  spec: string;
  brand: string;
  partNo: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warrantyPeriodMonths: number;
  isOriginal: boolean;
}

// 多科室议价 - 单个科室会签意见
export interface DepartmentNegotiationOpinion {
  deptKey: 'BIOMEDICAL' | 'CLINICAL' | 'FINANCE' | 'AUDIT_PROCUREMENT';
  deptName: string;
  reviewerName: string;
  reviewerTitle: string;
  suggestedDiscountAmount?: number; // 建议核减金额 (元)
  targetPrice?: number;              // 建议目标价 (元)
  decision: 'AGREE' | 'ADVISE_NEGOTIATION' | 'REJECT'; // 同意 / 建议议价 / 驳回
  comments: string;
  reviewDate: string;
  status: 'PENDING' | 'SUBMITTED';
}

// 议价谈判轮次记录
export interface NegotiationRound {
  round: number;
  initiatedAt: string;
  initiatorDept: string;
  initiatorName: string;
  demandedPrice: number; // 院方要求降至的目标价
  hospitalNote: string; // 院方议价函说明
  vendorResponseAt?: string;
  vendorResponsePrice?: number; // 供应商二次调整后的报价
  vendorNote?: string;          // 供应商让利说明
  vendorDecision?: 'ACCEPTED' | 'COUNTER_OFFER' | 'REFUSED';
}

// 在线双向沟通留言
export interface CollaborationMessage {
  id: string;
  senderType: 'HOSPITAL' | 'VENDOR';
  senderName: string;
  senderDept?: string;
  avatar?: string;
  timestamp: string;
  content: string;
  attachments?: {
    name: string;
    url: string;
    type: 'image' | 'pdf' | 'doc';
    size?: string;
  }[];
}

// 维修服务完工凭证
export interface RepairCompletionReport {
  engineerName: string;
  engineerPhone: string;
  serviceStartTime: string;
  serviceEndTime: string;
  faultCauseAnalysis: string;
  repairMeasuresSummary: string;
  replacedPartsSummary: string;
  oldPartsReturned: boolean; // 旧件是否原样交还医院
  clinicalAcceptanceSignatureUrl?: string;
  clinicalAcceptorName?: string;
  clinicalAcceptDate?: string;
  clinicalRating: number; // 1-5星
  serviceReportFileUrl?: string;
  serviceReportFileName?: string;
  onsitePhotos?: string[];
}

// 增值税发票及结算信息
export interface VendorInvoiceRecord {
  id: string;
  invoiceType: 'SPECIAL_VAT' | 'NORMAL_VAT' | 'ELECTRONIC_VAT'; // 增值税专用发票 / 普通发票 / 全电专票
  invoiceCode: string;
  invoiceNo: string;
  invoiceAmount: number; // 价税合计
  untaxedAmount: number; // 不含税金额
  taxRate: number;       // 税率 (如 13%)
  taxAmount: number;     // 税额
  invoiceDate: string;
  buyerName: string;     // 购买方 (医院)
  buyerTaxNo: string;    // 纳税人识别号
  sellerName: string;    // 销售方 (供应商)
  sellerTaxNo: string;
  fileUrl: string;       // 发票文件/PDF/原件图片
  fileName: string;
  uploadedAt: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DISCREPANCY'; // 待核对 / 核对一致 / 存在差异
  verificationNote?: string;
  paymentPlan?: 'NET_30' | 'NET_60' | 'UPON_ACCEPTANCE'; // 付款账期
}

// 完整外协协同工单
export interface VendorCollaborationOrder {
  id: string;                      // 协同单号，例如: EXT-202609-001
  workOrderId: string;             // 关联的医院工单编号，例如: WO-2026-0902
  equipmentId: string;             // 关联设备ID
  equipmentName: string;
  equipmentModel: string;
  equipmentSerialNo: string;
  equipmentDept: string;
  faultDescription: string;
  faultImages: string[];
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  
  // 供应商信息（关联往来合作单位）
  vendorId: string;                // 关联往来合作单位 Partner.id
  vendorName: string;
  vendorContact: string;
  vendorPhone: string;
  vendorEmail?: string;
  
  createdAt: string;
  status: VendorCollabStatus;
  
  // 报价与费用
  quoteLaborCost: number;          // 工时工人工时费
  quoteTravelCost: number;         // 差旅检测费
  quotePartsTotal: number;         // 配件总计
  quoteGrandTotal: number;         // 原始报价总计
  quoteFileUrl?: string;           // 盖章报价单扫描件
  quoteFileName?: string;
  quoteValidUntil?: string;        // 报价有效期
  quoteParts: QuotePartItem[];     // 换件明细
  
  // 多科室联合议价与最终定标
  multiDeptOpinions: DepartmentNegotiationOpinion[];
  negotiationRounds: NegotiationRound[];
  finalNegotiatedPrice: number;    // 最终多科室审定成交价
  savingsAmount: number;           // 相比初始报价节约资金
  savingsRate: number;             // 节资率 (%)
  approvedAt?: string;
  approvedBy?: string;
  
  // 维修与服务完成情况
  completionReport?: RepairCompletionReport;
  
  // 发票与付款凭证
  invoiceRecord?: VendorInvoiceRecord;
  
  // 双向沟通留言时间线
  messages: CollaborationMessage[];
  
  // 资料完整性归档状态
  isDossierArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

// ==================== 月度框架批次零星维修协同与发票申报相关类型 ====================

// 零星维保批次内单笔维修记录
export interface MonthlyFrameworkItem {
  id: string;
  itemName: string;         // 维修项目名称，例如: 财务专用工作站主板硬件更换与系统恢复
  unit: string;             // 单位，例如: 台 / 项 / 批 / 套 / 次
  quantity: number;         // 数量
  unitPrice: number;        // 单价 (元)
  totalPrice: number;       // 总金额 (元)
  // 发生科室（严格规范联动全院科室主数据）
  department: string;       // 报修/发生科室，例如: 麻醉手术科、普外一科、超声科
  departmentId?: string;    // 关联主数据科室ID (例如 '240')
  departmentCode?: string;  // 关联主数据科室编码 (例如 'DEP-240')
  departmentCampus?: string;// 所属院区 (五莲县人民医院)
  departmentBuilding?: string;// 发生楼宇 (例如 '1号楼 综合楼')
  departmentFloor?: string; // 发生楼层 (例如 '5F', '12F')
  departmentPhone?: string; // 护士站联系电话
  departmentHead?: string;  // 科室责任人/护士长 (引用主数据)

  serviceDate: string;      // 维修施工日期，例如: 2026/8/18
  status?: 'COMPLETED' | 'PENDING';
  engineerName?: string;    // 施工工程师姓名
  technician?: string;      // 技术工程师

  // 科室接收与电子签字存证
  clinicalReceiveStatus?: 'PENDING' | 'RECEIVED' | 'SIGNED'; // 科室接收与电子签字状态
  clinicalSignee?: string;  // 科室电子签署人 (例如: 崔伟 护士长 / 徐爱香 总护士长)
  clinicalSigner?: string;  // 科室验收人 (兼容旧字段)
  clinicalSignerRole?: string; // 签署人职务 (科室护士长 / 技师长 / 科主任)
  clinicalReceivedAt?: string; // 科室接收时间
  clinicalSignatureTime?: string; // 电子签字时间戳 (精确到分秒)
  clinicalSignatureData?: string; // 手写签名笔迹数据 (Canvas SVG/Base64)
  clinicalSignatureCertId?: string; // CA电子存证哈希编号 (例如 CASIG-202606-DEP240-8821)
  clinicalFeedback?: string; // 科室现场试机及验收评价留言
  clinicalRating?: number;  // 满意度打分 (1-5星)

  workOrderNo?: string;     // 原始工单编号
  oldPartsReturned?: boolean; // 旧件是否原样退库
  auditTag?: '小额直接报销' | '多台合并维保' | '大额审签特批' | '常规零星维修';
  notes?: string;           // 备注说明
  // 财务对账与开票回款状态
  invoiced?: boolean;       // 是否已开具增值税发票
  invoiceNo?: string;       // 对应发票号
  paymentStatus?: 'PAID' | 'IN_TRANSIT' | 'UNBILLED'; // 回款状态
  hospitalApprovedPrice?: number; // 医院医工审定金额 (元)
  reconciled?: boolean;     // 双方对账确认无误
  reconciliationDifference?: number; // 申报与审定差额
}

// 月度框架批次流转状态
export type FrameworkBatchStatus = 
  | 'DRAFT'                    // 维修方草稿编辑中
  | 'DRAFT_COLLECTING'         // 维修方草稿汇总收集
  | 'SUBMITTED_TO_HOSPITAL'    // 维修方已提交医工科审核
  | 'AUDITED_BY_BIOMEDICAL'    // 医工科审核通过/流转财务
  | 'FINANCE_APPROVED'         // 财务科已对账审定并纳入请款
  | 'REJECTED';                // 驳回补正

// 月度框架增值税发票及税控销货清单
export interface FrameworkBatchInvoice {
  invoiceType: 'SPECIAL_VAT' | 'NORMAL_VAT' | 'ELECTRONIC_VAT';
  invoiceCode: string;
  invoiceNo: string;
  invoiceAmount: number;     // 价税合计
  untaxedAmount: number;     // 不含税金额
  taxRate: number;           // 税率 (如 13%)
  taxAmount: number;         // 税额
  invoiceDate: string;
  hasTaxSalesList: boolean;  // 是否附带金税盘防伪《销货清单》
  taxSalesListFileName?: string;
  invoiceFileName?: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'DISCREPANCY';
  buyerName?: string;
  buyerTaxNo?: string;
  sellerName?: string;
  sellerTaxNo?: string;
  checkCode?: string;
}

// 审计内控“五单合一”核验记录
export interface FrameworkComplianceChecklist {
  dispatchOrderAttached?: boolean;      // 1. 临床报修单/派工依据齐全
  fieldServiceReportAttached?: boolean; // 2. 现场工程师技术服务单齐全
  replacedPartsReturned?: boolean;      // 3. 旧件以旧换新原样退库
  clinicalAcceptanceSigned?: boolean;   // 4. 科室护士长/技师长验收签字
  invoiceMatchesSummary?: boolean;      // 5. 发票销货清单金额分毫不差
  allWorkOrdersComplete?: boolean;
  allServiceReportsComplete?: boolean;
  allOldPartsReturned?: boolean;
  allClinicalAccepted?: boolean;
  hospitalAuditPassed?: boolean;
  financeVoucherCreated?: boolean;
}

// 完整月度框架零星维保申报批次
export interface MonthlyFrameworkBatch {
  id: string;                  // 批次号，例如: BATCH-2026-08
  yearMonth: string;           // 所属年月，例如: 2026-08
  batchTitle: string;          // 批次标题，例如: 2026年08月全院零星维保框架结算批次
  vendorId: string;            // 维修服务方ID
  vendorName: string;          // 维修服务方名称
  contractNo: string;          // 维保框架合同编号
  totalAmount: number;         // 批次结算总金额 (元)
  itemCount: number;           // 维修项总数
  status: FrameworkBatchStatus;
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  auditedAt?: string;
  auditedBy?: string;
  auditNotes?: string;
  invoiceRecord?: FrameworkBatchInvoice;
  complianceChecklist?: FrameworkComplianceChecklist;
  items: MonthlyFrameworkItem[];
  // 财务回款与结算对账状态
  paymentStatus?: 'PAID' | 'IN_TRANSIT' | 'UNBILLED';
  paidAmount?: number;
  paidAt?: string;
  paymentVoucherNo?: string;
  paymentBank?: string;
  expectedPaymentDate?: string;
  invoiceStatus?: 'INVOICED' | 'NOT_INVOICED' | 'PARTIAL';
  hospitalApprovedAmount?: number; // 医工审定总额
  reconciledStatus?: 'VERIFIED' | 'PENDING' | 'DISCREPANCY'; // 双方对账确认状态
  reconciledAt?: string;
  reconciledBy?: string;
}

// 供应商账号信息（用于供应商独立登录）
export interface VendorUserAccount {
  vendorId: string;
  vendorName: string;
  accountUsername: string;
  contactPerson: string;
  phone: string;
  category: string;
  avatar?: string;
  creditCode?: string;      // 统一社会信用代码
  contractNo?: string;      // 框架维保协议编号
  bankName?: string;        // 结算开户银行
  bankAccount?: string;     // 结算银行账号
  frameworkScope?: string;  // 维保驻场范围
}

// ==================== 竞价中心 (Bidding Project) 类型定义 ====================
export type BiddingStatus = 'OPEN' | 'BIDDED' | 'EVALUATING' | 'WON' | 'LOST' | 'CLOSED';

export interface BiddingItemRequirement {
  id: string;
  equipmentName: string;
  model: string;
  department: string;
  faultSymptomOrScope: string;
  expectedDeliveryDays: number;
}

export interface BidSubmission {
  bidId: string;
  projectId: string;
  vendorId: string;
  vendorName: string;
  submittedAt: string;
  quoteAmount: number;             // 竞标总价 (元)
  quotePartsAmount: number;        // 备件费 (元)
  quoteLaborAmount: number;        // 工时与技术费 (元)
  deliveryDays: number;            // 承诺交付天数
  warrantyMonths: number;          // 承诺质保期 (月)
  schemeDescription: string;       // 技术维修方案与响应承诺
  bidDocumentFileName?: string;    // 投标文件附件名称
  bidDocumentFileUrl?: string;     // 投标文件附件地址
  status: 'PENDING_REVIEW' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
  evaluationScore?: number;        // 专家综合评分 (0-100)
  hospitalFeedback?: string;       // 医院评标委员会反馈
}

export interface BiddingProject {
  id: string;                      // 竞价项目编号，例如: BID-2026-003
  title: string;                   // 项目标题，例如: 2026年度影像科磁共振射频线圈及冷头预防性维护公开竞价
  category: 'EQUIPMENT_REPAIR' | 'ANNUAL_MAINTENANCE' | 'SPARE_PARTS' | 'THIRD_PARTY_METROLOGY';
  department: string;              // 需求科室
  publishDate: string;             // 发布日期
  deadlineDate: string;            // 竞价截止时间
  maxBudget: number;               // 最高限价 (元)
  urgency: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: BiddingStatus;
  description: string;
  technicalRequirements: string[];
  equipmentList: BiddingItemRequirement[];
  allowSubcontracting: boolean;
  minWarrantyMonths: number;
  mySubmission?: BidSubmission;    // 本供应商已投出的竞标记录
  bidsCount: number;               // 参与竞标的供应商数
  winningVendor?: string;          // 中标单位
  winningAmount?: number;          // 中标金额
}

// ==================== 企业资质证照 (Corporate Qualification) 类型定义 ====================
export type QualificationCategory = 
  | 'BUSINESS_LICENSE'            // 营业执照 (统一社会信用代码)
  | 'DEVICE_OPERATION_PERMIT'     // 医疗器械经营许可证 (二/三类)
  | 'MANUFACTURER_AUTH_LETTER'    // 原厂售后服务授权书
  | 'RADIATION_SAFETY_PERMIT'     // 辐射安全许可证
  | 'SPECIAL_EQUIPMENT_CERT'      // 特种设备安装维保资质
  | 'ENGINEER_CERTIFICATION'      // 工程师专业技术等级认证证书
  | 'ISO_QUALITY_MANAGEMENT'      // ISO9001/ISO13485质量管理体系认证
  | 'OTHER_CREDENTIAL';           // 其他资质备案证明

export type QualificationType = QualificationCategory;

export interface CorporateQualification {
  id: string;
  vendorId: string;
  category: QualificationCategory;
  title: string;                  // 资质名称，例如: 医疗器械经营许可证（三类）
  name?: string;                  // 兼容名称字段
  certificateNo: string;          // 证书编号
  issuingAuthority: string;       // 发证机关，例如: 山东省药品监督管理局
  issuedDate: string;             // 发证日期
  expiryDate: string;             // 有效期截止日期
  validFrom?: string;             // 兼容起始日期
  validUntil?: string;            // 兼容截止日期
  daysToExpiry?: number;          // 距到期天数
  legalPerson?: string;           // 法定代表人
  scopeOfOperation?: string;      // 许可经营范围 / 授权设备范围
  businessScope?: string;         // 兼容经营范围
  registeredCapital?: string;     // 注册资本
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNDER_REVIEW' | 'PENDING_AUDIT'; // 正常有效 / 临期预警(<=60天) / 已过期 / 审核中
  fileUrl: string;                // 证照附件/扫描件
  fileName: string;
  uploadedAt: string;
  auditRemark?: string;           // 医院医工科审核批注
  notes?: string;                 // 备注
  isKeyQualification?: boolean;   // 是否属于招投标核心准入资质
  verifiedByHospital?: boolean;   // 医院是否已审查
}

// ==================== 结构化单据统一整理台账 (Structured Document Ledger) ====================
export type DocumentType = 'INVOICE' | 'REPAIR_REPORT' | 'QUOTATION' | 'QUALIFICATION';

export interface StructuredDocumentRecord {
  id: string;
  docType: DocumentType;
  docName: string;
  docCode: string;                // 发票号 / 报告编号 / 报价单号 / 证照编号
  associatedOrderId?: string;     // 关联外协工单号，如 EXT-202609-001
  associatedEquipmentName?: string;// 关联设备名称
  vendorId: string;
  vendorName: string;
  amount?: number;                // 金额 (如发票价税合计、报价总额)
  parsedAt: string;               // 结构化提取与录入时间
  fileUrl: string;
  fileName: string;
  status: 'VERIFIED' | 'PENDING' | 'DISCREPANCY'; // 状态
  summaryTags: string[];          // 标签，如 ["专票13%", "射频功放板", "质保1年"]
  structuredPayload: Record<string, any>; // 完整提取字段
}

// ==================== 三单交叉勾稽核验 (Three-Way Audit) ====================
export interface ThreeWayAuditCheckItem {
  ruleName: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  actualValue: string;
  standardValue: string;
  remark: string;
}

export interface ThreeWayAuditRecord {
  id: string;
  orderId: string;
  workOrderId: string;
  equipmentName: string;
  equipmentDept: string;
  invoiceNo: string;
  invoiceAmount: number;
  quotationAmount: number;
  reportPartsAmount: number;
  discrepancyAmount: number;
  auditStatus: 'PERFECT_MATCH' | 'MINOR_DISCREPANCY' | 'AUDIT_ALERT';
  itemsCheck: ThreeWayAuditCheckItem[];
  auditorName: string;
  auditedAt: string;
  complianceDocNo: string;
}

// ==================== 旧件原样退库核销 (Old Part Return Ledger) ====================
export interface OldPartReturnRecord {
  id: string;
  orderId: string;
  workOrderId: string;
  equipmentName: string;
  partName: string;
  oldPartBarcode: string;
  serialNumber: string;
  replacedDate: string;
  faultSymptom: string;
  returnStatus: 'PENDING_RETURN' | 'WAREHOUSE_RECEIVED' | 'SCRAP_REGISTERED';
  returnDate?: string;
  receivedWarehouse: string;
  receiverStaffName?: string;
  shelfLocation?: string;
  securitySealCode: string;
}

// ==================== 配件质保生命周期与返修预警 (Part Warranty Lifecycle) ====================
export interface PartWarrantyRecord {
  id: string;
  orderId: string;
  equipmentName: string;
  equipmentDept: string;
  partName: string;
  partModel: string;
  installDate: string;
  warrantyPeriodMonths: number;
  warrantyEndDate: string;
  remainingDays: number;
  status: 'IN_WARRANTY' | 'EXPIRING_SOON' | 'EXPIRED';
  hasReFaultAlarm: boolean;
  freeReworkEligible: boolean;
  engineerName: string;
}

// ==================== 供应商季度绩效考核与评级 (Vendor Performance Evaluation) ====================
export interface PerformanceDimensionItem {
  dimension: string;
  score: number;
  fullScore: number;
  weight: string;
  evaluationDetail: string;
}

export interface VendorQuarterlyEvaluation {
  vendorId: string;
  quarter: string; // e.g. "2026年第三季度"
  overallScore: number;
  rank: number;
  totalVendors: number;
  ratingGrade: 'AAA' | 'AA' | 'A' | 'B' | 'C';
  dimensions: PerformanceDimensionItem[];
  hospitalAuditSummary: string;
  biddingPrivilege: string;
  verifiedAt: string;
}

// 扩展主菜单Tab类型
export type VendorPortalTabExtended = 
  | 'HOME'                // 主页数据概览
  | 'BIDDING'             // 公开竞价投标
  | 'NEGOTIATION'         // 联合议价磋商
  | 'MONTHLY_FRAMEWORK'   // 零星维保结算
  | 'STRUCTURED_DOCS'     // 结构单据台账
  | 'QUALIFICATIONS'      // 企业资质证照
  | 'THREE_WAY_AUDIT'     // 三单勾稽核验 [新增]
  | 'OLD_PART_RETURN'     // 旧件退库核销 [新增]
  | 'SPECIAL_ORDERS'      // 专项大修工单
  | 'PART_WARRANTY'       // 配件质保台账 [新增]
  | 'ENGINEERS_SLA'       // 驻场团队时效
  | 'VENDOR_SCORECARD'    // 供应商绩效榜 [新增]
  | 'FINANCE_ANALYTICS';  // 资金经营对账


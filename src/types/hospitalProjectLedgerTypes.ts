export interface ProjectVendorInfo {
  companyName: string; // 经办公司/供货单位全称
  creditCode: string; // 统一社会信用代码
  contactPerson: string; // 经办业务联系人
  contactPhone: string; // 联系电话
  address: string; // 经办单位登记地址
  qualification: string; // 资质等级/许可证书
  bankName: string; // 开户银行
  bankAccount: string; // 银行账号
  rating: number; // 履约评级 1-5 星
  serviceScope: string; // 承修/服务范围
}

export interface ProjectInvoiceInfo {
  invoiceType: '增值税专用发票' | '增值税电子普通发票' | '山东省财政非税电子票据' | '增值税普通发票';
  invoiceCode: string; // 发票代码 10位或12位
  invoiceNumber: string; // 发票号码 8位或20位全电发票号
  amountWithoutTax: number; // 不含税金额
  taxRate: number; // 税率 (0.00, 0.06, 0.13)
  taxAmount: number; // 税额
  totalAmount: number; // 价税合计 (元)
  totalAmountChinese: string; // 价税合计大写中文
  invoiceDate: string; // 开票日期 YYYY-MM-DD
  checkCode?: string; // 发票校验码后6位 (普票)
  taxCheckStatus: 'verified' | 'pending_check' | 'recheck_needed'; // 税务局全国发票底账查验状态
  taxCheckTime?: string; // 查验比对时间
  taxOffice: string; // 主管税务机关
  paymentStatus: '已支付电汇' | '预批已通过待付款' | '待提交发票' | '财务核销中';
  paymentDocNo?: string; // 财务记账凭证号
}

export type ProcurementComplianceMode =
  | 'exempt'            // 无费用产生（免费保内/纯院内人工免审）
  | 'price_comparison'  // ≤ ¥5,000：多方比价 / 询价
  | 'negotiation'       // ¥5,000 < 金额 ≤ ¥50,000：多科室联合议价
  | 'bidding';          // > ¥50,000：公开招标 / 院内邀请招标

export interface ApprovalProof {
  mode: 'none' | 'electronic' | 'paper_scan' | 'both';
  electronicApprovalId?: string;
  electronicApprovalTitle?: string;
  electronicStatus?: string; // draft | pending_dept | pending_engineering | pending_committee | approved | archived
  paperDocNo?: string;
  paperApprover?: string;
  paperApprovedDate?: string;
  paperAttachmentName?: string;
  paperAttachmentDataUrl?: string;
  paperRemarks?: string;
  verified?: boolean;
}

export interface ComparisonQuoteRecord {
  id: string;
  vendorName: string;
  contactPerson?: string;
  contactPhone?: string;
  quoteAmount: number;
  deliveryDays?: number;
  warrantyMonths?: number;
  isSelected: boolean;
  attachmentName?: string;
  quotedAt: string;
  remarks?: string;
}

export interface MeetingMinutesRecord {
  id: string;
  meetingType: 'dept_meeting' | 'joint_negotiation' | 'equipment_committee' | 'bidding_evaluation';
  title: string;
  meetingDate: string;
  docNo: string;
  hostName: string;
  attendees: string;
  resolutionSummary: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BiddingRecordSummary {
  linkedBiddingId?: string;
  biddingNo: string;
  biddingTitle: string;
  biddingMethod: 'open_tender' | 'invited_tender' | 'competitive_negotiation';
  bidOpenDate: string;
  bidderCount: number;
  winningVendor: string;
  winningAmount: number;
  winnerNoticeNo?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
  status: 'pending' | 'bidding_open' | 'awarded';
}

export interface ProjectAuditTrailEntry {
  id: string;
  timestamp: string;
  operatorName: string;
  operatorRole?: string;
  action: string;
  detail: string;
  blockedReason?: string;
}

export interface ProjectAuditComplianceDossier {
  sourceWorkOrderId?: string;
  sourceVendorOrderId?: string;
  equipmentId?: string;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSn?: string;
  hasCost: boolean;
  estimatedAmount?: number;
  approvedBudgetAmount?: number;
  requiredMode: ProcurementComplianceMode;
  createdFromStage?: 'dispatch' | 'field_operation' | 'manual' | 'legacy';
  approvalProof: ApprovalProof;
  comparisonQuotes: ComparisonQuoteRecord[];
  linkedVendorOrderId?: string;
  negotiationCompleted?: boolean;
  negotiationFinalPrice?: number;
  negotiationDate?: string;
  negotiationBatch?: string;
  biddingRecord?: BiddingRecordSummary;
  meetingMinutes: MeetingMinutesRecord[];
  auditLockedCleared?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  auditTrail: ProjectAuditTrailEntry[];
}

export interface HospitalProjectRecord {
  id: string; // ID_项目, 例如 "52", "548"
  department: string; // ID_科室, 例如 "麻醉手术科", "医疗设备科"
  repairInfo: string; // 报修信息
  repairDate: string; // 报修日期
  approvalStatus: string; // 报批状态 (申请通过, 无需申请, 立即申请等)
  approvalDate: string; // 报批日期
  approvalContent: string; // 报批内容
  approvedDate: string; // 获批日期
  projectName: string; // 项目名称
  preApprovalPrintDate: string; // 预批打印日期
  inquiryDate: string; // 询价日期
  bargainBatch: string; // 议价批次
  bargainDate: string; // 议价日期
  deptConfirmStatus: string; // 科室确认状态
  deptConfirmContent: string; // 确认内容
  deptConfirmDate: string; // 确认日期
  preApprovalStatus: string; // 预批状态 (已打印并通过, 打印预批, 未打印预批等)
  preApprovalPassTime: string; // 预批通过时间
  dateValidation: string; // 日期验证
  relatedDocsCount: number; // 相关文档数量
  category: string; // ID_门类
  remarks: string; // 备注
  vendor: ProjectVendorInfo; // 经办公司
  invoice: ProjectInvoiceInfo; // 开票信息
  complianceDossier?: ProjectAuditComplianceDossier; // 全流程合规与审计检查档案
}

export interface ProjectLedgerFilterState {
  keyword: string; // 搜索项目ID、名称、报批内容、经办公司
  department: string; // 科室筛选
  category: string; // 门类筛选
  preApprovalStatus: string; // 预批状态筛选
  year: string; // 年份筛选
  paymentStatus: string; // 支付状态筛选
  complianceFilter?: '' | 'audit_blocked' | 'audit_ready' | 'need_negotiation' | 'need_bidding' | 'from_work_order';
  sortBy: 'id' | 'approvalDate' | 'amount' | 'department';
  sortOrder: 'asc' | 'desc';
}

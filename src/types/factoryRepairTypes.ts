/**
 * 输尿管镜等精密器械返厂大修协同主数据模型与类型定义
 * 涵盖：科室报修 -> 现场检查与一键起草 -> 四级审批手写签章 -> 现场取件与一键寄件 -> 厂家拆检报价与沟通
 *      -> 科室/院长透明共同议价 -> 平台在线签合同 -> 维修完成返程与多方实时看板 -> 现场验收与1周试用结项 -> 发票上传与实时付款追踪
 */

export type FactoryRepairStage = 
  | 'DEPARTMENT_REPORT'        // 1. 科室报修 (麻醉手术科)
  | 'ONSITE_CHECK_DRAFT'        // 2. 现场检查与一键起草申请 (设备科检查，麻醉手术科穿透可见)
  | 'MULTI_LEVEL_APPROVAL'      // 3. 多级审批签章 (主管审核 -> 分管院长签字 -> 院长签字激活实施)
  | 'DISPATCH_EXPRESS'          // 4. 现场核验取件与一键发快递 (设备科取件封箱，发送快递信息至厂家)
  | 'VENDOR_INSPECT_QUOTE'      // 5. 厂家拆检报告、在线报价与双向沟通
  | 'JOINT_NEGOTIATION'         // 6. 科室/院长透明共同议价 (科室查看、院长批注、设备科议价、厂家让利锁定)
  | 'CONTRACT_SIGNING'          // 7. 平台在线签署大修合同 (医院电子盖章 + 厂家在线签署)
  | 'VENDOR_REPAIR_RETURN'      // 8. 维修完成返程与多方实时流转看板
  | 'ACCEPTANCE_TRIAL_SETTLE'   // 9. 现场开箱验收与1周临床试用结项
  | 'INVOICE_PAYMENT_TRACK';    // 10. 厂家发票上传与全流程实时付款进度看板

export type WorkflowRole = 
  | 'clinical_anesthesia'   // 麻醉手术科 (临床科室)
  | 'equipment_engineer'    // 设备科工程师 / 主管 (医工保障)
  | 'vp_medical'            // 分管副院长 (业务分管院领导)
  | 'president'             // 院长 (终审签批法定代表)
  | 'vendor_oem';           // 外协厂家服务商 (原厂/第三方维保中心)

// 角色信息
export interface WorkflowActor {
  id: string;
  name: string;
  roleTitle: string;
  department: string;
  avatarColor: string;
  phone: string;
  roleKey: WorkflowRole;
}

// 报修基础信息
export interface InitialFaultReport {
  repairOrderNo: string;
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSn: string;
  assetNo: string;
  department: string;
  reporterName: string;
  reporterPhone: string;
  reportedAt: string;
  faultSymptom: string; // 如：输尿管硬镜图像模糊、视场发暗、术中视野反光严重、测漏管有微量水汽渗出
  urgency: 'critical' | 'high' | 'normal';
  clinicalImpact: string; // 影响择期输尿管软镜碎石术及急诊输尿管结石取石
  fieldPhotos: string[];
}

// 设备科现场检查与起草返厂申请书
export interface OnsiteInspectionDraft {
  inspectorName: string;
  inspectorTitle: string;
  inspectedAt: string;
  inspectionConclusion: 'need_return_factory' | 'can_internal_repair';
  opticalDamageAssessment: {
    lensClarity: 'severe_foggy' | 'mild_blur' | 'normal'; // 物镜与棒镜透光雾化严重
    fiberOpticTransmission: number; // 导光束透光率，例如 42% (断丝率超 30%)
    glueDegradation: boolean; // 胶层脱胶进水
    prismDamage: boolean; // 棱镜组裂纹或错位
    sheathCondition: string; // 外管轻微磨损，工作通道畅通
  };
  draftApplicationTitle: string;
  draftReasonAndNecessity: string;
  targetVendorName: string;
  targetVendorContact: string;
  targetVendorPhone: string;
  estimatedCostRange: string; // 预计费用区间 12,000 ~ 18,000 元
  draftedAt: string;
  draftedBy: string;
  pushedToDepartmentView: boolean; // 麻醉手术科是否已可查看
}

// 四级审批节点
export interface ApprovalStepNode {
  level: 1 | 2 | 3 | 4;
  nodeName: string;
  approverRole: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'bypassed';
  approvalOpinion?: string;
  signatureDataUrl?: string; // 手写签名或电子图章
  signedAt?: string;
}

// 现场核验取件与快递信息
export interface OutboundLogistics {
  verifierName: string;
  verifiedAt: string;
  serialNumberMatch: boolean; // 机身编号比对一致
  packagingCondition: string; // 专用防震内窥镜消毒盒 + 双层气泡气柱防震装箱
  packagePhotos: string[];
  courierCompany: string; // 如 顺丰速运 (特快专递)
  trackingNumber: string; // 如 SF139820491823
  insuredValue: number; // 保价金额 20,000 元
  shippingDate: string;
  senderAddress: string;
  receiverAddress: string;
  status: 'collected' | 'in_transit' | 'delivered';
  deliveredAt?: string;
}

// 厂家拆检报告与明细报价
export interface VendorInspectionQuote {
  receivedAt: string;
  inspectionEngineer: string;
  vendorReportNo: string;
  detailedFindings: string;
  findingsPhotos: {
    title: string;
    description: string;
    url: string;
  }[];
  quoteItems: {
    id: string;
    partName: string;
    specModel: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    warrantyMonths: number;
    isOriginal: boolean;
  }[];
  laborCost: number;
  totalQuotePrice: number;
  expectedRepairDays: number;
  quotedAt: string;
  status: 'draft' | 'submitted' | 'negotiating' | 'final_accepted';
}

// 双向即时沟通留言
export interface DialogueMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderRoleKey: WorkflowRole;
  senderAvatar: string;
  timestamp: string;
  content: string;
  attachment?: {
    name: string;
    url: string;
  };
}

// 共同议价记录
export interface JointNegotiationRecord {
  clinicalDeptOpinion: {
    authorName: string;
    opinion: string;
    submittedAt: string;
    willingBudgetCeiling: number;
  };
  leadershipGuidance: {
    leaderName: string;
    title: string;
    targetPriceLimit: number;
    instruction: string;
    submittedAt: string;
  };
  negotiationRounds: {
    round: number;
    hospitalCounterOffer: number;
    hospitalRemark: string;
    vendorResponseOffer: number;
    vendorDiscountReason: string;
    timestamp: string;
  }[];
  finalAgreedPrice: number;
  finalWarrantyMonths: number;
  closedAt?: string;
  isAgreed: boolean;
}

// 在线维修合同
export interface OnlineRepairContract {
  contractNo: string;
  contractTitle: string;
  partyA: string; // 甲方：五莲县人民医院
  partyB: string; // 乙方：德国狼牌医疗技术服务中心
  equipmentSubject: string;
  repairScopeSummary: string;
  agreedAmount: number;
  paymentTermClause: string;
  warrantyPeriodClause: string;
  partyASigned: boolean;
  partyASignatureDate?: string;
  partyASealUrl?: string;
  partyBSigned: boolean;
  partyBSignatureDate?: string;
  partyBSealUrl?: string;
  status: 'draft' | 'party_a_signed' | 'fully_signed';
}

// 返程物流与进度跟踪
export interface InboundLogistics {
  courierCompany: string;
  trackingNumber: string;
  shippedAt: string;
  estimatedArrival: string;
  actualArrivalDate?: string;
  qualityCertificateUrl?: string;
  status: 'shipped' | 'delivered';
}

// 现场开箱验收与1周临床试运行
export interface OnsiteAcceptanceAndTrial {
  acceptanceDate: string;
  hospitalInspector: string;
  clinicalHeadNurse: string;
  testItems: {
    item: string;
    requirement: string;
    result: 'pass' | 'fail';
    note: string;
  }[];
  acceptanceConclusion: 'qualified' | 'unqualified';
  acceptanceSignatureA: string; // 医工工程师签名
  acceptanceSignatureB: string; // 手术室护士长签名
  // 1周临床试用跟踪
  trialStartDate: string;
  trialEndDate: string; // 7天后
  trialSurgeriesCount: number; // 试用跟台台次，如 5 台
  trialObservations: string;
  trialStatus: 'in_progress' | 'settled_qualified' | 'anomaly_reported';
  settledAt?: string;
  settledSignee?: string;
}

// 发票与付款流转
export interface InvoiceAndPaymentTrack {
  invoiceRecord?: {
    invoiceCode: string;
    invoiceNumber: string;
    amount: number;
    taxRate: number;
    invoiceType: '增值税专用发票' | '增值税普通发票';
    issuedDate: string;
    uploadedAt: string;
    invoiceFileUrl?: string;
    verificationStatus: 'verified_authentic' | 'pending';
  };
  paymentNodes: {
    id: string;
    nodeName: string;
    responsiblePerson: string;
    department: string;
    status: 'completed' | 'in_progress' | 'pending';
    completedAt?: string;
    remarks?: string;
    transactionVoucherNo?: string;
  }[];
  isPaymentCompleted: boolean;
}

// 输尿管镜大修协同主单据
export interface ReturnFactoryRepairOrder {
  id: string;
  orderNumber: string;
  currentStage: FactoryRepairStage;
  stageProgressPercent: number;
  initialFault: InitialFaultReport;
  onsiteDraft: OnsiteInspectionDraft;
  approvalChain: ApprovalStepNode[];
  outboundLogistics: OutboundLogistics;
  vendorInspectionQuote: VendorInspectionQuote;
  dialogueMessages: DialogueMessage[];
  jointNegotiation: JointNegotiationRecord;
  contract: OnlineRepairContract;
  inboundLogistics: InboundLogistics;
  acceptanceTrial: OnsiteAcceptanceAndTrial;
  invoicePayment: InvoiceAndPaymentTrack;
  createdAt: string;
  updatedAt: string;
}

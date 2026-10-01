export type ApprovalType = 
  | 'procurement_increase' // 临床设备增配 / 采购立项论证 (源于应急借调超期/业务扩容)
  | 'part_replacement'     // 高额配件更换 / 重大维修审批 (如DR换球管、CT探测器)
  | 'scrap_disposal'        // 设备技术鉴定与报废处置 (无维修价值/超役停产)
  | 'loan_extension'       // 应急调配特批延期 / 跨科调拨申请
  | 'overdue_filing'       // 超期服役整修与稳定性合格备案申请 (超期准用论证)
  | 'return_factory_repair'; // 麻醉手术科输尿管镜等精密器械返厂大修多级审批 (主管->分管院长->院长终审)

export type ApprovalStatus = 
  | 'draft'                 // 草稿
  | 'pending_dept'          // 待申请科室主任签批
  | 'pending_engineering'   // 待医学工程处技术论证与比价
  | 'pending_committee'     // 待医学装备委员会/分管院长终审
  | 'approved'              // 审批已通过 (生效)
  | 'rejected'              // 已驳回
  | 'archived';             // 已办结归档

export type ApprovalUrgency = 'normal' | 'high' | 'critical';

export interface SupplierQuotationItem {
  id: string;
  supplier: string;
  partModel: string;
  price: number;
  leadTimeDays: number;
  warrantyMonths: number;
  isRecommended: boolean;
  notes?: string;
}

export interface ApprovalAuditRecord {
  id: string;
  nodeName: string;          // 节点名称 (如 '科室发起', '科室主任审核', '医工处技术论证', '分管院长终审')
  operatorName: string;      // 经办人姓名
  operatorRole: string;      // 经办人角色 (如 '申请医师', '科室主任', '临床工程师', '医工处长', '分管副院长')
  operatorDept?: string;
  action: 'submitted' | 'agreed' | 'rejected' | 'transferred' | 'supplement' | 'cancelled';
  comment: string;           // 审批批注与论证意见
  signatureUrl?: string;     // 电子手签标识
  operatedAt: string;        // 操作时间 ISO
}

export interface ApprovalAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  url?: string;
}

export interface ApprovalApplication {
  id: string;                          // 单号 e.g. "APP-2026-0818-001"
  type: ApprovalType;
  title: string;                       // 单据标题
  urgency: ApprovalUrgency;
  status: ApprovalStatus;
  
  // 申请人及科室信息
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  applicantPhone: string;
  createdAt: string;
  updatedAt: string;
  currentApprovalNode: string;         // 当前流转节点描述
  nextApproverRole: string;            // 下一审批角色

  // 关联的已有设备档案 (若针对已有设备如维修报废)
  equipmentId?: string;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSn?: string;
  equipmentCategory?: string;
  equipmentLocation?: string;
  equipmentPurchasePrice?: number;
  equipmentPurchaseDate?: string;
  equipmentCumulativeMaintenanceCost?: number;
  targetEquipmentId?: string;

  // 1. 增配与采购论证专项 (procurement_increase)
  targetEquipmentName?: string;
  targetModel?: string;
  targetCount?: number;
  estimatedBudget?: number;
  clinicalNecessityReason?: string;
  borrowingHistorySummary?: string;    // 借调频次与超期数据依据
  clinicalRiskAnalysis?: string;       // 安全与周转风险
  aiRecommendationReport?: string;     // AI 智能论证报告

  // 2. 高额配件更换与重大维修专项 (part_replacement)
  partName?: string;                   // 拟更换配件名称 (如 "X射线球管")
  partModel?: string;                  // 配件规格型号 (如 "Varian RAD-14")
  partEstimatedCost?: number;          // 预计费用
  faultSymptoms?: string;              // 现场故障现象
  technicalAssessment?: string;        // 工程师现场技术鉴定结论
  downtimeImpact?: string;             // 停机对临床诊疗的影响
  supplierQuotations?: SupplierQuotationItem[];

  // 3. 报废与技术鉴定专项 (scrap_disposal)
  scrapCategory?: 'beyond_repair' | 'obsolete_parts_unavailable' | 'safety_hazard' | 'economically_unfeasible';
  technicalEvaluation?: string;        // 报废技术鉴定详述
  salvageValueEstimate?: number;       // 预计残值金额
  safetyHazardNotice?: string;         // 安全及绝缘隐患说明
  suggestedDisposalWay?: 'recycle_parts' | 'hazardous_waste' | 'auction' | 'scrap_destroy';

  // 4. 应急借用延期专项 (loan_extension)
  loanId?: string;
  originalDueDate?: string;
  requestedDueDate?: string;
  extensionReason?: string;

  // 5. 超期服役整修与稳定性合格备案专项 (overdue_filing)
  overdueYears?: number;               // 超期年限 (年) e.g. 2.3
  originalLifespanYears?: number;      // 出厂设计寿命 (年) e.g. 10
  refurbishDate?: string;              // 深度整修完成日期
  refurbishProvider?: string;          // 负责整修单位
  refurbishSummary?: string;           // 整修保养项目与更换核心配件
  partsReplacedList?: string[];        // 替换零部件清单
  refurbishCost?: number;              // 整修支出费用 (元)
  stabilityTestDate?: string;          // 稳定性检测完成日期
  stabilityTestAgency?: string;        // 检测机构
  stabilityTestReportNo?: string;      // 检测合格报告编号
  continuousRunHours?: number;         // 连续满载工况测试时长 (小时)
  electricalSafetyStandard?: string;   // GB 9706.1 电气安全测试结论
  extendedValidUntil?: string;         // 特许延期服役有效截止日 (通常6-12个月)
  monitoringFrequency?: string;        // 缩周期质控巡检频次 (每月/双周)
  filingNo?: string;                   // 院内特许备案证书号 (EXT-2026-XXXX)

  // 6. 精密器械返厂大修专项 (return_factory_repair)
  targetVendor?: string;               // 拟返厂大修服务商 (如德国狼牌医疗技术服务中心)
  estimatedCost?: number;              // 预估大修费用 (元)
  overdueFilingDetails?: {
    filingNo?: string;
    originalLifespanYears?: number;
    overdueYears?: number;
    refurbishDate?: string;
    refurbishSummary?: string;
    stabilityTestAgency?: string;
    stabilityTestReportNo?: string;
    continuousRunHours?: number;
    driftRate?: string;
    gb9706Result?: string;
    validUntil?: string;
    leadEngineer?: string;
    monitoringFrequency?: string;
    approvalDocNo?: string;
  };

  // 流转审批历史与附件
  auditLogs: ApprovalAuditRecord[];
  attachments?: ApprovalAttachment[];
}

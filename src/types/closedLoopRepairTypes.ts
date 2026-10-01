import { MedicalEquipment } from '../types';
import { ApprovalApplication } from './approvalTypes';

export type RepairClosedLoopStage = 
  | 'reported'              // 阶段1: 科室已报修·待设备科现场核验
  | 'verified'              // 阶段2: 设备科现场核验完成
  | 'return_drafted'        // 阶段3: 已一键起草返厂维修申请单
  | 'dept_reviewed'         // 阶段4: 设备科主管已审核
  | 'vp_approved'           // 阶段5: 分管院长已审批通过 (生效)
  | 'closed';               // 流程闭环

export type RepairTaskStatus = 
  | '待现场核验'
  | '已核验(待起草返厂)'
  | '已核验(院内自修)'
  | '返厂审批中(待主管审核)'
  | '返厂审批中(待分管院长审批)'
  | '返厂审批通过'
  | '维修已办结';

export interface OnsiteVerificationRecord {
  verifiedBy: string;               // 工程师姓名 e.g. "崔伟"
  verifierRole: string;             // 角色 e.g. "主任工程师 / 设备科主管"
  verifierPhone: string;            // 联系电话 e.g. "6802 / 13806336802"
  verifiedAt: string;               // 核验时间 e.g. "2026-09-23 09:15"
  snMatched: boolean;               // 机身钢印与台账SN是否核验一致
  verifiedSn: string;               // 现场核对的SN
  equipmentLocationConfirmed: string; // 现场物理位置确认 e.g. "综合楼8F 手术室 OR-03"
  
  // 精密检测指标 (针对内窥镜/精密设备)
  opticalTransmittance: string;     // 光学透光率实测 e.g. "42% (严重低于出厂标准 95%)"
  airtightnessLeakage: string;      // 0.05MPa负压浸水测漏 e.g. "负压泄漏 0.02MPa/min，物镜端蓝宝石封胶开裂进水"
  lensGroupCondition: string;       // 柱状棒透镜形态 e.g. "第2组 HOPKINS 柱状棒透镜存在微裂纹，光轴反光"
  testToolsUsed: string[];          // 检测仪器 e.g. ["光学投影同轴度仪", "0.05MPa负压测漏仪", "显微内窥镜检测仪"]
  
  // 核验结论判定
  conclusionType: 'factory_repair' | 'inhouse_repair' | 'third_party_repair';
  conclusionTitle: string;          // e.g. "建议原厂返厂大修"
  technicalAssessment: string;      // 详细技术判定意见与论证
  technicianSignature: string;      // 工程师签名
}

export interface FactoryRepairApplicationForm {
  applicationId: string;            // 呈批单号 e.g. "APP-2026-0923-088"
  title: string;                    // 公文标题 e.g. "【麻醉手术科】德国狼牌输尿管硬镜(8703.534)返厂大修呈批单"
  urgency: 'critical' | 'high' | 'normal';
  targetVendor: string;             // 拟委托厂家 e.g. "德国狼牌医疗技术服务中心"
  vendorContact: string;            // 厂家联络人
  vendorPhone: string;              // 厂家电话
  estimatedBudget: number;          // 预估大修费用 (元) e.g. 14200
  originalPrice: number;            // 设备原值 e.g. 168000
  budgetRatioPercent: number;       // 维修费占原值比例 e.g. 8.45%
  warrantyMonths: number;           // 大修承诺质保期 (月) e.g. 12
  
  // 核心论证
  clinicalNecessityReason: string;  // 临床不可替代性与急迫性
  technicalJustification: string;   // 设备科返厂技术论证与理由 (引用核验数据)
  clinicalRiskAnalysis: string;     // 延误返厂造成的医疗安全风险分析
  
  // 经办信息
  draftedBy: string;                // 起草人 (设备科工程师/主管)
  draftedRole: string;
  draftedAt: string;

  // 审批流转节点 1: 设备科主管审核
  deptReviewer?: string;
  deptReviewerRole?: string;
  deptReviewStatus?: 'pending' | 'agreed' | 'rejected';
  deptReviewComment?: string;
  deptReviewedAt?: string;
  deptSignature?: string;

  // 审批流转节点 2: 分管副院长审批
  vpApprover?: string;
  vpApproverRole?: string;
  vpApprovalStatus?: 'pending' | 'agreed' | 'rejected';
  vpApprovalComment?: string;
  vpApprovedAt?: string;
  vpSignature?: string;

  // 最终状态
  finalApprovalStatus: 'pending_dept' | 'pending_vp' | 'approved' | 'rejected';
}

export interface RepairTaskTimelineEvent {
  id: string;
  stage: string;
  title: string;
  actorName: string;
  actorRole: string;
  actorDept: string;
  time: string;
  notes: string;
  signatureUrl?: string;
  badgeColor: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo';
}

export interface ClosedLoopRepairTask {
  id: string;                       // 工单任务唯一标识 e.g. "TASK-20260923-01"
  taskNo: string;                   // 任务编号 e.g. "CL-REP-20260923-01"
  
  // 1. 关联设备资产信息 (Associated Equipment Asset)
  equipmentId: string;              // 台账设备ID e.g. "EQ-2023-09855"
  equipmentName: string;            // 设备名称 e.g. "德国狼牌输尿管硬镜"
  equipmentModel: string;           // 规格型号 e.g. "Richard Wolf 8703.534"
  equipmentSn: string;              // 出厂编号 e.g. "RW-20230415-87035"
  assetNo: string;                  // 医院资产编号 e.g. "ZC-2023-09855"
  internalNo?: string;              // 临床内部编号 e.g. "7991105"
  equipmentCategory: string;        // 资产分类 e.g. "医用光学内窥镜与微创器械"
  purchasePrice: number;            // 设备原值 (元) e.g. 168000
  enableDate: string;               // 投用时间 e.g. "2023-04-20"
  equipmentLocation: string;        // 当前存放位置 e.g. "1号楼 综合楼 8F 手术室 OR-03"
  
  // 2. 麻醉手术科报修申请信息 (Clinical Fault Report by Anesthesiology Dept)
  department: string;               // 报修科室 e.g. "麻醉手术科"
  reporterId: string;               // 报修人工号 e.g. "STAFF-267-02"
  reporterName: string;             // 报修人姓名 e.g. "黄晓彤"
  reporterRole: string;             // 职务 e.g. "麻醉手术科护士长"
  reporterPhone: string;            // 护士站短号/手机 e.g. "7991086 / 13863371086"
  faultTime: string;                // 故障发现时间 e.g. "2026-09-23 08:20"
  urgency: 'critical' | 'high' | 'normal'; // 紧迫等级
  faultType: string;                // 故障分类 e.g. "光学成像严重模糊起雾"
  faultDescription: string;         // 详细故障现象描述
  clinicalImpact: string;           // 临床手术影响评估
  evidencePhotos: string[];         // 现场照片凭证
  
  // 3. 闭环状态与流转阶段 (Closed-loop State)
  stage: RepairClosedLoopStage;
  status: RepairTaskStatus;
  
  // 4. 设备科现场核验记录 (Onsite Verification)
  onsiteVerification?: OnsiteVerificationRecord;

  // 5. 返厂维修呈批流转申请单 (Factory Return Application)
  factoryRepairApplication?: FactoryRepairApplicationForm;

  // 6. 全生命周期流转轨迹 (Audit Trail Timeline)
  timeline: RepairTaskTimelineEvent[];

  createdAt: string;
  updatedAt: string;
}

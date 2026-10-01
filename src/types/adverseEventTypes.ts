// ==========================================
// 医疗器械不良事件（MDR）监测与警戒直报数据结构
// 依据《医疗器械不良事件监测和再评价管理办法》设计
// ==========================================

export type AdverseEventSeverity = 'death' | 'serious_injury' | 'potential_serious_harm' | 'other';

export type AdverseEventOutcome = 'cured' | 'improved' | 'sequelae' | 'death' | 'no_harm';

export type CausalityConclusion = 
  | 'definite'     // 肯定相关
  | 'probable'     // 很可能相关
  | 'possible'     // 可能相关
  | 'unlikely'     // 可能无关
  | 'unassessable' // 待评价
  | 'unclassifiable'; // 无法评价

export type AdverseEventStatus = 
  | 'draft'          // 草稿
  | 'pending_review' // 待医工处审核
  | 'investigating'  // 现场调查与故障排查中
  | 'evaluated'      // 院内因果关系评价完成
  | 'nmpa_reported'  // 已直报国家监测网
  | 'capa_tracking'  // 警戒纠偏与召回跟踪中
  | 'closed';        // 结案归档

export type ReporterProfession = 'physician' | 'nurse' | 'clinical_engineer' | 'technician' | 'other';

export type DeviceCurrentStatus = 'quarantined' | 'investigating' | 'vendor_service' | 'returned_to_service' | 'scrapped';

// 纠偏与预防措施 (CAPA)
export interface AdverseEventCapa {
  id: string;
  type: 'clinical_training' | 'vendor_recall' | 'maintenance_strengthening' | 'equipment_scrapping' | 'sop_revision';
  title: string;
  description: string;
  targetDepartment: string;
  responsiblePerson: string;
  deadline: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  verificationNotes?: string;
}

// 不良事件调查日志
export interface AdverseEventLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
}

// 核心不良事件直报记录
export interface AdverseEventRecord {
  id: string; // 直报编号 e.g. "MDR-20260906-001"
  title: string; // 简短事件概括 e.g. "重症监护室呼吸机呼气阀卡阻致气道高压报警"
  status: AdverseEventStatus;
  severity: AdverseEventSeverity;
  
  // 关键时间与时效
  occurredAt: string;     // 事件发生时间 (YYYY-MM-DD HH:mm)
  discoveredAt: string;   // 发现时间
  reportedAt: string;     // 临床初报时间
  statutoryDeadline: string; // 法定直报国家截止时限 (严重伤害7日内，死亡24小时内)
  isOverdueRisk: boolean; // 是否存在超期风险
  nmpaReportedAt?: string; // 实际上报国家监测网时间
  nmpaReceiptNo?: string;  // 国家不良事件监测信息系统直报回执编号 e.g. "NMPA-MDR-2026-370102-0042"

  // 报告人与报告科室
  department: string;          // 报告科室 e.g. "重症医学科(ICU)"
  reporterName: string;        // 报告人
  reporterPhone: string;       // 联系电话
  reporterProfession: ReporterProfession; // 报告人职务身份
  isAdverseKeyDepartment: boolean; // 是否不良事件重点监测科室

  // 涉及医疗器械信息 (与台账联动)
  equipmentId?: string;        // 关联设备台账系统ID
  equipmentAssetNo?: string;   // 资产编号
  equipmentName: string;       // 医疗器械名称
  equipmentModel: string;      // 规格型号
  equipmentSn: string;         // 出厂序列号 / SN
  udiCode?: string;            // 唯一标识 (UDI)
  manufacturer: string;        // 生产企业名称
  manufacturerContact?: string;// 生产企业售后电话
  registrationNo: string;      // 医疗器械注册证号/备案号 e.g. "国械注准20213081234"
  deviceRiskClass: 'I' | 'II' | 'III'; // 管理分类 (高风险生命支持设备多为III类)
  enableDate?: string;         // 投用日期
  serviceLifeYears?: number;   // 已投用年限
  deviceUsageState: 'in_use' | 'standby' | 'calibration' | 'cleaning'; // 发生时器械运行状态
  consumablesBatchNo?: string; // 关联耗材批号 (若涉及耗材)
  consumablesName?: string;    // 关联耗材名称

  // 患者临床状况及结局
  patientNameMasked: string;   // 患者姓名 (脱敏如 "王*华")
  patientMedicalRecordNo: string; // 病历号/住院号
  patientGender: '男' | '女' | '其他';
  patientAge: number;
  primaryDiagnosis: string;    // 原发疾病/临床诊断
  deviceUsagePurpose: string;  // 使用该器械的目的 e.g. "重症呼吸衰竭生命体征维持"
  harmDescription: string;     // 对患者造成的机体伤害或潜在危害详细描述
  clinicalOutcome: AdverseEventOutcome; // 临床转归结局
  remedialMedicalAction?: string; // 针对患者紧急采取的补救医疗措施 (如紧急插管、抢救药物注射)

  // 设备故障表现与现场处置
  faultPhenomenon: string;     // 设备故障具体现象
  immediateAction: string;     // 现场紧急处置情况 (如立即换机、断电、保留耗材)
  deviceCurrentStatus: DeviceCurrentStatus; // 实物器械目前处置状态
  samplePreserved: boolean;    // 是否留存实物样品与原包装耗材
  associatedWorkOrderId?: string; // 关联派工工单号 (如 "WO-20260906-002")

  // 因果关系五项判定准则 (Causality Assessment)
  causalityCriterion1_timeSequence: boolean;  // 1. 使用与不良事件发生有合理时间顺序
  causalityCriterion2_knownRisk: boolean;     // 2. 属于器械可能导致的已知不良事件/说明书记载
  causalityCriterion3_dechallenge: boolean | null; // 3. 停用或排除故障后反应改善 (null为不适用)
  causalityCriterion4_rechallenge: boolean | null; // 4. 再次使用再次出现类似情况 (null为未再次使用)
  causalityCriterion5_alternativeCause: 'excluded' | 'partial' | 'cannot_exclude'; // 5. 病情/药物/误操作能否解释
  causalityConclusion: CausalityConclusion; // 综合评价结论
  evaluatorName?: string;     // 医工/评价专家姓名
  evaluatedAt?: string;       // 评价时间

  // 纠偏预防措施 (CAPA)
  capaList: AdverseEventCapa[];

  // 审计追踪流转历史
  timeline: AdverseEventLog[];
  
  // 附件/现场留存照片
  attachments?: { name: string; url: string; uploadTime: string }[];
  remarks?: string;
}

// 统计分析指标
export interface AdverseEventMetrics {
  totalReports: number;
  severeCount: number; // 死亡 + 严重伤害
  deathCount: number;
  seriousInjuryCount: number;
  potentialHarmCount: number;
  otherCount: number;
  pendingReviewCount: number;
  investigatingCount: number;
  nmpaReportedCount: number;
  nmpaReportingRate: number; // 直报国家完成率 %
  highRiskUrgentPending: number; // 存在超期预警未结案数
  keyDeptComplianceRate: number; // 重点科室直报达标率 %
}

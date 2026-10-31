// 三甲综合医院评审标准（第四篇 医疗装备管理）与公立医院绩效国考（设备质控）类型定义

export type AccreditationLevel = 'A' | 'B' | 'C' | 'D'; // A: 优秀/持续改进 | B: 良好 | C: 合格/基本达标 | D: 不符合

export interface AccreditationCriterion {
  level: AccreditationLevel;
  requirement: string; // 评审细则要求
  checkMethod: string; // 查验方式（现场查验、抽查台账、随机演练、系统数据验证）
  achieved: boolean; // 是否达成
}

export interface AccreditationClause {
  id: string; // e.g. "4.6.1", "4.6.2.1"
  clauseNumber: string; // 条款编号
  title: string; // 条款名称
  coreRequirement: string; // 条款核心要点
  category: 'organization' | 'procurement' | 'maintenance' | 'emergency' | 'adverse_event' | 'udi_consumable'; 
  categoryLabel: string;
  mandatoryCore: boolean; // 是否为核心必达条款（★核心条款）
  criteria: AccreditationCriterion[]; // A/B/C/D 逐级达成标准
  currentLevel: AccreditationLevel; // 当前自评级别
  selfScore: number; // 自评分 (0-100)
  targetLevel: AccreditationLevel; // 目标级别
  linkedModule: string; // 关联系统业务模块 (如 "计量强检台账", "应急生命支持储备", "不良事件监测", "UDI专耗闭环")
  evidenceDocuments: string[]; // 佐证制度及凭证记录
  openCapasCount: number; // 关联待整改项数量
  lastEvaluatedAt: string; // 最新自评时间
  evaluatorName: string; // 自评专家/责任工程师
  auditRemarks: string; // 评审备忘说明
}

export interface NationalHospitalKpi {
  id: string;
  code: string; // 国考/质控标准代码
  name: string; // 指标名称
  category: 'quality' | 'safety' | 'efficiency' | 'cost';
  categoryLabel: string;
  baselineRequirement: string; // 国家考核基准 / 三甲合格门槛
  currentValue: number; // 当前医院实测值
  unit: string; // 单位 (%, 天, 次)
  status: 'excellent' | 'normal' | 'warning' | 'danger'; // 达标状态
  dataFormula: string; // 计算公式与数据抓取逻辑
  relatedSource: string; // 关联系统台账
  trendDirection: 'up' | 'down' | 'stable';
  trendRate: string; // 同比/环比变化
  actionPrompt?: string; // 优化建议
}

export type CapaSeverity = 'high' | 'medium' | 'low';
export type CapaStatus = 'pending_action' | 'under_rectification' | 'pending_verification' | 'closed';

export interface QualityCapaItem {
  id: string; // CAPA-2026-001
  clauseNumber: string; // 关联三甲条款
  clauseTitle: string;
  sourceType: 'metrology_overdue' | 'emergency_missing_check' | 'fault_surge' | 'adverse_event' | 'scrap_delay' | 'expert_inspection';
  sourceTitle: string; // 预警/整改来源
  problemDescription: string; // 不符合项问题描述
  rootCauseAnalysis?: string; // 根本原因分析
  correctiveActionPlan: string; // 纠正与预防措施计划
  responsibleEngineer: string; // 责任工程师
  department: string; // 责任科室
  deadlineDate: string; // 整改截止时限
  completionDate?: string; // 实际完成时间
  severity: CapaSeverity;
  status: CapaStatus;
  verificationExpert?: string; // 复核质控专家
  verificationNotes?: string; // 复核结案意见
  attachments?: string[];
  createdAt: string;
}

export interface AccreditationSummaryStat {
  totalClauses: number;
  coreClausesCount: number;
  levelACount: number;
  levelBCount: number;
  levelCCount: number;
  levelDCount: number;
  overallComplianceRate: number; // 总体达标率 (%)
  coreClauseComplianceRate: number; // 核心条款达标率 (%)
  totalCapas: number;
  openCapas: number;
  closedCapas: number;
}

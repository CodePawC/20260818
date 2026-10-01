import { ActiveTab } from '../types';

export type RegulationCategory = 
  | '法规依据' 
  | '采购准入' 
  | '运行维保' 
  | '计量强检' 
  | '急救调配' 
  | '维修闭环' 
  | '质控安全' 
  | '资产处置' 
  | '外协协同' 
  | '培训考核' 
  | '应急预案';

export type RegulationLevel = 'national' | 'hospital' | 'departmental' | 'sop' | 'emergency';

export type RegulationStatus = 'active' | 'trial' | 'reviewing' | 'obsolete';

export interface RegulationAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  downloadCount?: number;
}

export interface RegulationRevisionRecord {
  version: string; // 修订后版本号，如 v3.2
  date: string; // 修订日期 YYYY-MM-DD
  author?: string; // 修订起草人/责任科室
  approver?: string; // 签发审批人
  summary: string; // 修订要点与原因说明
}

export interface RegulationTocItem {
  id: string;
  title: string;
  level: number;
}

export interface LinkedSystemTab {
  tab: ActiveTab;
  label: string;
  description: string;
}

export interface WorkflowStep {
  stepNumber: number; // 流程步骤序号 (1, 2, 3...)
  title: string; // 步骤环节名称 (如: "临床科室发起需求论证")
  role: string; // 责任主体/责任角色 (如: "临床科室主任/护士长")
  slaTime?: string; // 标准执行时限/SLA (如: "3个工作日内"、"即刻响应")
  actionDescription: string; // 标准操作指引与细则 (SOP)
  deliverables?: string; // 产出交付物/凭据 (如: "《医疗设备配置可行性论证表》")
  riskControlPoint?: string; // 质控重点与合规红线 (如: "严禁违规拆分标的逃避招标")
  systemAction?: {
    label: string; // 按钮文案 (如: "前往申购审批")
    tab: ActiveTab; // 关联系统模块
    tooltip?: string;
  };
}

export interface RegulationWorkflow {
  workflowCode: string; // 流程编码 (如: "SOP-FLOW-CG-01")
  workflowName: string; // 流程名称 (如: "医疗设备配置准入与招标采购全流程SOP")
  purpose: string; // 流程管控目的
  triggerCondition: string; // 启动触发条件
  cycleTime: string; // 全流程基准流转时效 (如: "5-15个工作日")
  steps: WorkflowStep[]; // 流转节点明细
  emergencyException?: string; // 紧急或绿色通道例外说明
}

export interface RegulationFormTemplate {
  id: string;
  formCode: string; // 表单编号，例如 "FORM-YXGC-01"
  name: string; // 表单名称，例如 "医疗设备预防性维护(PM)现场质控表"
  description: string;
  department: string;
  isMandatoryForAccreditation: boolean;
  downloadUrl?: string;
}

export interface RegulationItem {
  id: string;
  code: string; // 制度编号, 例如: "YXGC-ZD-2026-01"
  docNumber: string; // 发文字号, 例如: "院医工发〔2026〕08号"
  title: string; // 制度全称
  shortTitle?: string; // 制度简拼/简称
  category: RegulationCategory; // 业务分类
  level: RegulationLevel; // 制度层级
  status: RegulationStatus; // 现行状态
  effectiveDate: string; // 施行日期 (YYYY-MM-DD)
  revisionDate?: string; // 最近修订日期
  version: string; // 版本号, 例如: "v3.2"
  revisionHistory?: RegulationRevisionRecord[]; // 制度历次修订记录台账 (版本变更留痕)
  issuedBy: string; // 发文机关/负责部门
  signatory: string; // 签发人/审批人
  applicableDepartments: string[]; // 适用科室/适用对象
  keywords: string[]; // 关键词标签
  summary: string; // 核心制度摘要
  tableOfContents: RegulationTocItem[]; // 章节目录索引
  content: string; // 正文全文 (支持排版条款)
  attachments?: RegulationAttachment[]; // 配套执行表单/附件清单
  linkedSystemTab?: LinkedSystemTab; // 关联系统业务功能模块
  workflow?: RegulationWorkflow; // 配套业务标准执行流程 (SOP Flowchart)
  formTemplates?: RegulationFormTemplate[]; // 配套执行表单库
  readCount: number; // 查阅点击热度
  isMustReadForHospitalAccreditation: boolean; // 三甲医院评审核心必查制度
  isArchivedPdf?: boolean; // 标识是否为 PDF 格式归档规章制度
  pdfFileUrl?: string; // PDF 文件 Data URL
  pdfFileName?: string; // 原始 PDF 文件名
  pdfFileSize?: string; // PDF 文件大小
  updatedAt: string;
}

export interface RegulationFilterState {
  keyword: string;
  category: string; // 'all' or RegulationCategory
  level: string; // 'all' or RegulationLevel
  status: string; // 'all' or RegulationStatus
  department: string; // 'all' or specific department
  mustReadAccreditationOnly: boolean; // 仅看等级评审核心制度
  sortBy: 'effectiveDate' | 'readCount' | 'code' | 'title';
  sortOrder: 'asc' | 'desc';
}

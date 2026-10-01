import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  Printer, 
  ChevronRight, 
  ArrowRight, 
  User, 
  Building2, 
  Calendar, 
  DollarSign, 
  Wrench, 
  Trash2, 
  RotateCcw,
  Check,
  X,
  FileCheck,
  Send,
  Eye,
  Paperclip,
  ShieldCheck,
  Flame,
  CheckCircle,
  HelpCircle,
  Inbox,
  ArrowUpRight
} from 'lucide-react';
import { 
  ApprovalApplication, 
  ApprovalType, 
  ApprovalStatus, 
  ApprovalUrgency, 
  ApprovalAuditRecord 
} from '../types/approvalTypes';
import { MedicalEquipment, AuthUser, ThirdPartyInspectionReport } from '../types';
import { ThirdPartyReportPreviewModal } from './ThirdPartyReportPreviewModal';
import {
  generateAiFaultSymptomsDraft,
  generateAiEngineerTechnicalAssessment,
  generateAiScrapTechnicalEvaluation,
  generateAiApprovalReviewComment,
  computeEquipmentLifecycleProfile
} from '../utils/aiBiomedicalEngine';
import { SmartEquipmentPicker } from './SmartEquipmentPicker';
import { isHeadNurse, getUserDepartment, isClinicalStaff } from '../utils/authUtils';
import { Pagination } from './Pagination';

interface ApprovalsViewProps {
  applications: ApprovalApplication[];
  onUpdateApplications: (apps: ApprovalApplication[]) => void;
  equipmentList: MedicalEquipment[];
  onUpdateEquipmentStatus?: (equipmentId: string, newStatus: any, reason: string) => void;
  onUpdateEquipmentFiling?: (equipmentId: string, filing: any) => void;
  onOpenPrintLabel?: (equipment: MedicalEquipment) => void;
  onOpenOverdueFilingModal?: (equipment: MedicalEquipment) => void;
  currentUser: AuthUser | null;
  initialCreateData?: Partial<ApprovalApplication> | null;
  onClearInitialCreateData?: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  applications,
  onUpdateApplications,
  equipmentList,
  onUpdateEquipmentStatus,
  onUpdateEquipmentFiling,
  onOpenPrintLabel,
  onOpenOverdueFilingModal,
  currentUser,
  initialCreateData,
  onClearInitialCreateData
}) => {
  // 当前用户的科室识别与护士长专属属性
  const userDept = getUserDepartment(currentUser);
  const userIsNurse = isHeadNurse(currentUser);
  const userIsClinical = isClinicalStaff(currentUser);

  // 1. 核心视图与筛选状态（护士长智能默认优先显示本科室事务）
  const [deptScopeFilter, setDeptScopeFilter] = useState<'dept_only' | 'all'>(() => {
    return (userIsNurse || userIsClinical) && userDept ? 'dept_only' : 'all';
  });
  const [activeTabFilter, setActiveTabFilter] = useState<'pending_me' | 'my_submitted' | 'in_progress' | 'approved' | 'rejected' | 'all'>('pending_me');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 2. 详情与弹窗状态
  const [selectedAppDetail, setSelectedAppDetail] = useState<ApprovalApplication | null>(null);
  const [activeDetailViewTab, setActiveDetailViewTab] = useState<'document' | 'timeline'>('document');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createType, setCreateType] = useState<ApprovalType>('procurement_increase');
  const [previewingThirdPartyReport, setPreviewingThirdPartyReport] = useState<ThirdPartyInspectionReport | null>(null);

  // 3. 快速审批操作交互状态
  const [quickAuditApp, setQuickAuditApp] = useState<ApprovalApplication | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [isSubmittingAudit, setIsSubmittingAudit] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [aiGeneratingField, setAiGeneratingField] = useState<string | null>(null);

  // 触发 AI 生成现场故障现象
  const handleGenerateAiFaultSymptoms = (preset?: string) => {
    setAiGeneratingField('faultSymptoms');
    setTimeout(() => {
      const selectedEquipment = equipmentList.find(e => e.id === formData.equipmentId);
      const text = generateAiFaultSymptomsDraft(selectedEquipment, preset || formData.faultSymptoms);
      setFormData(prev => ({
        ...prev,
        faultSymptoms: text
      }));
      setAiGeneratingField(null);
      showToast('✨ AI 已根据设备型号参数与临床反馈生成标准现场故障现象描述');
    }, 400);
  };

  // 触发 AI 生成工程师技术鉴定与论证
  const handleGenerateAiTechnicalAssessment = () => {
    setAiGeneratingField('technicalAssessment');
    setTimeout(() => {
      const selectedEquipment = equipmentList.find(e => e.id === formData.equipmentId);
      const text = generateAiEngineerTechnicalAssessment(
        selectedEquipment,
        formData.faultSymptoms,
        formData.partName,
        formData.partEstimatedCost
      );
      setFormData(prev => ({
        ...prev,
        technicalAssessment: text
      }));
      setAiGeneratingField(null);
      showToast('✨ AI 医工技术鉴定报告已生成（含物理测试、失效机理、修复性及经济性论证）');
    }, 450);
  };

  // 触发 AI 生成报废技术鉴定详述
  const handleGenerateAiScrapEvaluation = () => {
    setAiGeneratingField('technicalEvaluation');
    setTimeout(() => {
      const selectedEquipment = equipmentList.find(e => e.id === formData.equipmentId);
      const profile = computeEquipmentLifecycleProfile(selectedEquipment);
      const text = generateAiScrapTechnicalEvaluation(
        selectedEquipment,
        formData.scrapCategory,
        profile.serviceYears,
        formData.equipmentCumulativeMaintenanceCost || 35000
      );
      setFormData(prev => ({
        ...prev,
        technicalEvaluation: text
      }));
      setAiGeneratingField(null);
      showToast('✨ AI 专家报废技术鉴定与合规检验依据已生成');
    }, 450);
  };

  // 触发 AI 生成临床增配需求与依据
  const handleGenerateAiClinicalNecessity = () => {
    setAiGeneratingField('clinicalNecessity');
    setTimeout(() => {
      const eqName = formData.targetEquipmentName || '关键医疗设备';
      const dept = formData.applicantDepartment || '临床科室';
      const text = `【1. 临床诊疗负荷与抢救周转需求】\n${dept}近三季度急危重症收治量与病床周转率同比上升 28.5%，现有同类在役机组满负荷运转，亟需增配 ${eqName} 1台，以消除救治等待瓶颈。\n\n【2. 应急调配历史与超期借用依据】\n近半年本科室累计从医学装备应急库紧急借调该型号设备达 6 次，累计调配在科天数超 45 天，跨科周转调度成本高且无法保证随时待命。\n\n【3. 预期效益与投资合理性】\n增配后可完全满足病区多床位同步救治与日间周转标准，大幅降低医疗安全隐患，预计投资回收周期为 1.8 年，临床效益显著。`;
      setFormData(prev => ({
        ...prev,
        clinicalNecessityReason: text
      }));
      setAiGeneratingField(null);
      showToast('✨ AI 临床需求与增配论证依据已生成');
    }, 400);
  };

  // 4. 新建申请单表单状态
  const [formData, setFormData] = useState<Partial<ApprovalApplication>>({
    type: 'procurement_increase',
    title: '',
    urgency: 'high',
    applicantDepartment: currentUser?.departmentName || '重症医学科 (ICU)',
    applicantName: currentUser?.name || '当前用户',
    applicantPhone: currentUser?.phone || '13800000000',
    targetEquipmentName: '',
    targetModel: '',
    targetCount: 1,
    estimatedBudget: 100000,
    clinicalNecessityReason: '',
    borrowingHistorySummary: '',
    clinicalRiskAnalysis: '',
    aiRecommendationReport: '',
    partName: '',
    partModel: '',
    partEstimatedCost: 50000,
    faultSymptoms: '',
    technicalAssessment: '',
    downtimeImpact: '',
    scrapCategory: 'beyond_repair',
    technicalEvaluation: '',
    salvageValueEstimate: 500,
    safetyHazardNotice: ''
  });

  // 如果有来自外部（应急库、维修中心、设备台账）传入的初始申请数据，自动打开新建模态框并填充
  React.useEffect(() => {
    if (initialCreateData) {
      setFormData(prev => ({
        ...prev,
        ...initialCreateData,
        applicantDepartment: initialCreateData.applicantDepartment || currentUser?.departmentName || prev.applicantDepartment,
        applicantName: initialCreateData.applicantName || currentUser?.name || prev.applicantName,
        applicantPhone: initialCreateData.applicantPhone || currentUser?.phone || prev.applicantPhone,
      }));
      if (initialCreateData.type) {
        setCreateType(initialCreateData.type);
      }
      setIsCreateModalOpen(true);
      onClearInitialCreateData?.();
    }
  }, [initialCreateData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 统计指标层级
  const deptSpecificApps = useMemo(() => {
    if (!userDept) return applications;
    return applications.filter(a => 
      a.applicantDepartment === userDept || 
      a.applicantDepartment?.includes(userDept) ||
      a.applicantName === currentUser?.name
    );
  }, [applications, userDept, currentUser]);

  const stats = useMemo(() => {
    const baseList = (deptScopeFilter === 'dept_only' && userDept) ? deptSpecificApps : applications;
    const total = baseList.length;
    const pendingReview = baseList.filter(a => a.status.startsWith('pending_')).length;
    const criticalPending = baseList.filter(a => a.status.startsWith('pending_') && (a.urgency === 'critical' || a.urgency === 'high')).length;
    const approved = baseList.filter(a => a.status === 'approved' || a.status === 'archived').length;
    const rejected = baseList.filter(a => a.status === 'rejected').length;
    const mySubmissions = currentUser ? baseList.filter(a => a.applicantName === currentUser.name).length : 0;
    const totalBudget = baseList.reduce((acc, a) => {
      if (a.estimatedBudget) return acc + a.estimatedBudget;
      if (a.partEstimatedCost) return acc + a.partEstimatedCost;
      return acc;
    }, 0);

    return { total, pendingReview, criticalPending, approved, rejected, mySubmissions, totalBudget };
  }, [applications, deptSpecificApps, deptScopeFilter, userDept, currentUser]);

  // 过滤后的申请单列表
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // 0. 科室专属范围过滤 (护士长/临床科室智能筛选)
      if (deptScopeFilter === 'dept_only' && userDept) {
        const matchDept = 
          app.applicantDepartment === userDept || 
          app.applicantDepartment?.includes(userDept) ||
          app.applicantName === currentUser?.name;
        if (!matchDept) return false;
      }

      // 1. Tab 主分类层级
      if (activeTabFilter === 'pending_me') {
        if (userIsNurse && userDept) {
          // 护士长待办：处于科室初审(pending_dept)且属于本科室，或处于全流程中与本科室相关的待办
          const isDeptPending = app.status === 'pending_dept' && (app.applicantDepartment === userDept || app.applicantDepartment?.includes(userDept));
          const isGeneralPending = app.status.startsWith('pending_') && (app.applicantDepartment === userDept || app.applicantDepartment?.includes(userDept));
          if (!isDeptPending && !isGeneralPending) return false;
        } else {
          if (!app.status.startsWith('pending_')) return false;
        }
      } else if (activeTabFilter === 'my_submitted') {
        if (currentUser && app.applicantName !== currentUser.name) return false;
      } else if (activeTabFilter === 'in_progress') {
        if (!app.status.startsWith('pending_')) return false;
      } else if (activeTabFilter === 'approved') {
        if (app.status !== 'approved' && app.status !== 'archived') return false;
      } else if (activeTabFilter === 'rejected') {
        if (app.status !== 'rejected') return false;
      }

      // 2. 类型过滤
      if (selectedTypeFilter !== 'all' && app.type !== selectedTypeFilter) return false;

      // 3. 紧迫度过滤
      if (selectedUrgencyFilter !== 'all' && app.urgency !== selectedUrgencyFilter) return false;

      // 4. 关键词搜索
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchTitle = app.title.toLowerCase().includes(kw);
        const matchId = app.id.toLowerCase().includes(kw);
        const matchDept = app.applicantDepartment.toLowerCase().includes(kw);
        const matchApplicant = app.applicantName.toLowerCase().includes(kw);
        const matchTarget = (app.targetEquipmentName || app.equipmentName || app.partName || '').toLowerCase().includes(kw);
        return matchTitle || matchId || matchDept || matchApplicant || matchTarget;
      }

      return true;
    });
  }, [applications, deptScopeFilter, userDept, userIsNurse, activeTabFilter, selectedTypeFilter, selectedUrgencyFilter, searchKeyword, currentUser]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deptScopeFilter, activeTabFilter, selectedTypeFilter, selectedUrgencyFilter, searchKeyword]);

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  // 获取流转进度阶段 (1~4)
  const getApprovalStepStage = (status: ApprovalStatus): { currentStep: number; stepLabels: string[]; isRejected: boolean } => {
    const stepLabels = ['1.科室申报', '2.医工论证', '3.装备委终审', '4.办结实施'];
    if (status === 'rejected') {
      return { currentStep: 2, stepLabels, isRejected: true };
    }
    if (status === 'pending_dept') {
      return { currentStep: 1, stepLabels, isRejected: false };
    }
    if (status === 'pending_engineering') {
      return { currentStep: 2, stepLabels, isRejected: false };
    }
    if (status === 'pending_committee') {
      return { currentStep: 3, stepLabels, isRejected: false };
    }
    return { currentStep: 4, stepLabels, isRejected: false }; // approved / archived
  };

  // 提交新申请单
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(Math.random() * 900 + 100);
    const newId = `APP-${dateStr.slice(0, 4)}-${dateStr.slice(4)}-${randSeq}`;

    let defaultTitle = formData.title;
    if (!defaultTitle) {
      if (createType === 'procurement_increase') {
        defaultTitle = `【${formData.applicantDepartment}】${formData.targetEquipmentName || '医疗设备'} ${formData.targetCount || 1}台 增配采购论证申请`;
      } else if (createType === 'part_replacement') {
        defaultTitle = `【${formData.applicantDepartment}】${formData.equipmentName || '设备'} 更换${formData.partName || '高额配件'} 审批申请`;
      } else if (createType === 'scrap_disposal') {
        defaultTitle = `【${formData.applicantDepartment}】${formData.equipmentName || '设备'} 技术鉴定与报废处置申请`;
      } else {
        defaultTitle = `【${formData.applicantDepartment}】应急储备设备特批借用延期申请`;
      }
    }

    const initialAudit: ApprovalAuditRecord = {
      id: `LOG-${Date.now()}`,
      nodeName: '申请人正式提交',
      operatorName: formData.applicantName || currentUser?.name || '申请人',
      operatorRole: currentUser?.role || '临床医工联络员',
      operatorDept: formData.applicantDepartment || '临床科室',
      action: 'submitted',
      comment: '申请单据及论证依据录入完毕，已正式发起流转审批。',
      operatedAt: new Date().toLocaleString('zh-CN')
    };

    const newApp: ApprovalApplication = {
      id: newId,
      type: createType,
      title: defaultTitle,
      urgency: formData.urgency || 'high',
      status: 'pending_dept',
      applicantId: currentUser?.id || 'STAFF-SUBMIT',
      applicantName: formData.applicantName || currentUser?.name || '申请人',
      applicantDepartment: formData.applicantDepartment || '重症医学科',
      applicantPhone: formData.applicantPhone || '13800000000',
      createdAt: new Date().toLocaleString('zh-CN').slice(0, 16),
      updatedAt: new Date().toLocaleString('zh-CN').slice(0, 16),
      currentApprovalNode: '待科室主任签批',
      nextApproverRole: '科室主任 / 主管护师',
      ...formData,
      auditLogs: [initialAudit]
    };

    const updated = [newApp, ...applications];
    onUpdateApplications(updated);
    setIsCreateModalOpen(false);
    showToast(`✅ 已成功提交申请单【${newApp.id}】并进入流转审批流！`);
    setSelectedAppDetail(newApp);
  };

  // 审批操作处理 (同意 / 驳回)
  const handlePerformAudit = (targetApp: ApprovalApplication, action: 'agree' | 'reject', customComment?: string) => {
    setIsSubmittingAudit(true);

    let nextStatus: ApprovalStatus = targetApp.status;
    let nextNode = targetApp.currentApprovalNode;
    let nextRole = targetApp.nextApproverRole;

    const opName = currentUser?.name || '审批专家';
    const opRole = currentUser?.role || '医学工程处长';
    const opDept = currentUser?.departmentName || '医学工程保障中心';

    if (action === 'agree') {
      if (targetApp.status === 'pending_dept') {
        nextStatus = 'pending_engineering';
        nextNode = '医学工程处 · 技术论证与比价审核';
        nextRole = '医学工程处长 / 临床工程师';
      } else if (targetApp.status === 'pending_engineering') {
        if (targetApp.type === 'procurement_increase' || targetApp.type === 'overdue_filing' || (targetApp.partEstimatedCost && targetApp.partEstimatedCost > 50000)) {
          nextStatus = 'pending_committee';
          nextNode = '医学装备管理委员会 / 分管院长终审';
          nextRole = '分管副院长 / 装备委员会主任';
        } else {
          nextStatus = 'approved';
          nextNode = '审批通过 · 准予实施';
          nextRole = '归档实施';
        }
      } else if (targetApp.status === 'pending_committee') {
        nextStatus = 'approved';
        nextNode = '审批通过 · 准予实施与备案生效';
        nextRole = '归档实施';

        // 联动业务：如果是报废申请通过，自动联动台账状态更新为 '停用/报废'
        if (targetApp.type === 'scrap_disposal' && targetApp.equipmentId && onUpdateEquipmentStatus) {
          onUpdateEquipmentStatus(
            targetApp.equipmentId,
            '停用/报废',
            `已通过报废技术鉴定审批 (${targetApp.id})`
          );
        }

        // 联动业务：如果是超期准用备案审批通过，自动联动更新设备台账的 overdueFiling 准用档案
        if (targetApp.type === 'overdue_filing' && targetApp.equipmentId && onUpdateEquipmentFiling) {
          const validDate = targetApp.extendedValidUntil || targetApp.overdueFilingDetails?.validUntil || '2027-05-31';
          const filingNo = targetApp.filingNo || targetApp.overdueFilingDetails?.filingNo || `EXT-2026-${targetApp.equipmentId.slice(-4)}`;
          const filingRecord = {
            filingNo,
            originalLifespanYears: targetApp.originalLifespanYears || 10,
            overdueYears: targetApp.overdueYears || 2,
            refurbishDate: targetApp.refurbishDate || targetApp.createdAt.slice(0, 10),
            refurbishProvider: targetApp.refurbishProvider || '医学工程保障中心特种翻新技术部',
            refurbishCost: targetApp.refurbishCost || 12000,
            refurbishSummary: targetApp.refurbishSummary || '整机深度除尘、电源滤波与核心驱动模组更换、关键密封件更新',
            partsReplaced: targetApp.partsReplacedList || ['高压滤波电容组', '主控电源板', '管路密封圈组'],
            stabilityTestDate: targetApp.stabilityTestDate || targetApp.createdAt.slice(0, 10),
            stabilityTestAgency: targetApp.stabilityTestAgency || '山东省医疗器械质量检验中心 (CMA/CNAS认证书字2024150882)',
            stabilityTestReportNo: targetApp.stabilityTestReportNo || `SD-MD-STAB-${Date.now().toString().slice(-6)}`,
            continuousRunHours: targetApp.continuousRunHours || 72,
            driftRate: targetApp.overdueFilingDetails?.driftRate || '±0.28% (标准限值≤±1.5%)',
            electricalSafetyPassed: true,
            approvalDocNo: targetApp.overdueFilingDetails?.approvalDocNo || `医装委备[2026]${Math.floor(Math.random() * 80 + 10)}号`,
            approvedDate: targetApp.createdAt.slice(0, 10),
            validUntil: validDate,
            leadEngineer: targetApp.applicantName || '崔伟',
            leadEngineerPhone: targetApp.applicantPhone || '6802',
            approverName: opName,
            approverRole: opRole,
            monitoringFrequency: (targetApp.monitoringFrequency as any) || 'MONTHLY',
            filingStatus: 'ACTIVE' as const,
            dossierUrl: `https://med-filing.hospital.internal/archive/overdue/${targetApp.equipmentId}.pdf`
          };
          onUpdateEquipmentFiling(targetApp.equipmentId, filingRecord);
        }
      }
    } else {
      nextStatus = 'rejected';
      nextNode = '已驳回 · 需补充材料或重新论证';
      nextRole = '申请人修改';
    }

    const commentText = customComment !== undefined ? customComment : approvalComment;

    const newAuditRecord: ApprovalAuditRecord = {
      id: `LOG-${Date.now()}`,
      nodeName: targetApp.currentApprovalNode,
      operatorName: opName,
      operatorRole: opRole,
      operatorDept: opDept,
      action: action === 'agree' ? 'agreed' : 'rejected',
      comment: commentText.trim() || (action === 'agree' ? '审核通过，情况属实，同意呈批推进。' : '审核意见：材料不充分或需重新论证，予以驳回。'),
      signatureUrl: `${opName}_signature`,
      operatedAt: new Date().toLocaleString('zh-CN')
    };

    const updatedApp: ApprovalApplication = {
      ...targetApp,
      status: nextStatus,
      currentApprovalNode: nextNode,
      nextApproverRole: nextRole,
      updatedAt: new Date().toLocaleString('zh-CN').slice(0, 16),
      auditLogs: [...targetApp.auditLogs, newAuditRecord]
    };

    const updatedList = applications.map(a => a.id === updatedApp.id ? updatedApp : a);
    onUpdateApplications(updatedList);
    
    if (selectedAppDetail && selectedAppDetail.id === updatedApp.id) {
      setSelectedAppDetail(updatedApp);
    }
    setQuickAuditApp(null);
    setApprovalComment('');
    setIsSubmittingAudit(false);
    showToast(action === 'agree' ? `✅ 已完成签署【同意】！单据流转至下一节点。` : `⚠️ 已驳回该申请单并退回发起人！`);
  };

  // 快捷意见模板
  const QUICK_OPINIONS = [
    '情况属实，临床急需，同意呈报下一节点审批。',
    '经医学工程处技术工程师核实，参数与报价公允，建议准予实施。',
    '符合报废技术鉴定标准，主要部件已停产且存在漏电隐患，同意报废。',
    '经审核，建议优先调配院内闲置设备，暂缓增配采购。'
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full gap-3 overflow-hidden">
      
      {/* Toast 提示 */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 层次 1：顶部状态栏与核心工作台焦点 (Full-Width Top Header Card) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:px-4 sm:py-3 shadow-2xs shrink-0 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* 左侧：聚焦标题与待办概览 */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  业务审批流转中心
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  审批闭环 & 资产联动
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                全院设备增配论证、大额换件维修、报废鉴定与借调延期全生命周期在线会签
              </p>
            </div>
          </div>

          {/* 右侧：关键待办提醒与主按钮 */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* 护士长/科室人员智能范围切换 */}
            {userDept && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeptScopeFilter('dept_only')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    deptScopeFilter === 'dept_only'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`仅展示【${userDept}】相关审批事务`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>仅看{userDept} ({deptSpecificApps.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeptScopeFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    deptScopeFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="展示全院所有科室的审批单据"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>全院事务 ({applications.length})</span>
                </button>
              </div>
            )}

            {stats.criticalPending > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>
                  有 <strong>{stats.criticalPending}</strong> 项特急/加急审批待处理
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setFormData({
                  type: 'procurement_increase',
                  title: '',
                  urgency: 'high',
                  applicantDepartment: currentUser?.departmentName || '重症医学科 (ICU)',
                  applicantName: currentUser?.name || '当前用户',
                  applicantPhone: currentUser?.phone || '13800000000',
                  targetEquipmentName: '',
                  targetModel: '',
                  targetCount: 1,
                  estimatedBudget: 100000,
                  clinicalNecessityReason: '',
                  borrowingHistorySummary: '',
                  clinicalRiskAnalysis: ''
                });
                setCreateType('procurement_increase');
                setIsCreateModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>新建申请单</span>
            </button>
          </div>
        </div>

        {/* 顶部一级分类 Tabs (清晰的分级筛选) */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 overflow-x-auto w-full">
          <button
            onClick={() => setActiveTabFilter('pending_me')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTabFilter === 'pending_me'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>待办审批</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTabFilter === 'pending_me' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {stats.pendingReview}
            </span>
          </button>

          <button
            onClick={() => setActiveTabFilter('my_submitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTabFilter === 'my_submitted'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>我发起的</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTabFilter === 'my_submitted' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.mySubmissions}
            </span>
          </button>

          <button
            onClick={() => setActiveTabFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTabFilter === 'in_progress'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>全院在办</span>
            <span className="text-[11px] opacity-70 font-mono">({stats.pendingReview})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTabFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>已通过办结</span>
            <span className="text-[11px] opacity-70 font-mono">({stats.approved})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTabFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>已驳回修改</span>
            <span className="text-[11px] opacity-70 font-mono">({stats.rejected})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTabFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <span>全部单据</span>
            <span className="text-[11px] opacity-70 font-mono">({stats.total})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 层次 2：二级精简工具条 (Full-Width Filter & Search Bar) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:px-4 sm:py-2.5 shadow-2xs shrink-0 w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* 类型快速筛选按钮组 */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium mr-1 text-[11px] shrink-0">类型:</span>
          {[
            { id: 'all', label: '全部类型' },
            { id: 'procurement_increase', label: '增配论证' },
            { id: 'part_replacement', label: '大额换件' },
            { id: 'scrap_disposal', label: '报废鉴定' },
            { id: 'loan_extension', label: '借用延期' },
            { id: 'overdue_filing', label: '超期准用备案' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTypeFilter(t.id)}
              className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === t.id
                  ? 'bg-slate-900 font-bold text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 紧迫度与搜索框 */}
        <div className="flex items-center gap-2">
          <select
            value={selectedUrgencyFilter}
            onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:border-blue-500 cursor-pointer shrink-0"
          >
            <option value="all">全部紧急度</option>
            <option value="critical">🔴 特急抢修</option>
            <option value="high">🟡 加急</option>
            <option value="normal">⚪ 普通</option>
          </select>

          <div className="relative min-w-[220px] md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索单号、科室、设备名或配件..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 层次 3：结构化分层申请单全宽列表 (Full-Width Adaptive List Area with Single-Screen Pagination) */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden min-h-0 w-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 min-h-0 w-full flex flex-col">
          {filteredApplications.length === 0 ? (
            <div className="my-auto h-64 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Inbox className="w-12 h-12 stroke-[1.2] text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">暂无符合条件的业务申请单据</p>
              <p className="text-xs text-slate-400 mt-1">
                您可在上方切换分类筛选，或点击右上角「新建申请单」发起新流程
              </p>
            </div>
          ) : (
            <div className="w-full space-y-3">
              {paginatedApplications.map(app => {
                const { currentStep, stepLabels, isRejected } = getApprovalStepStage(app.status);
                const isPendingMe = app.status.startsWith('pending_');
                const estimatedAmount = app.estimatedBudget || app.partEstimatedCost;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppDetail(app)}
                    className={`w-full bg-white rounded-xl border transition cursor-pointer shadow-2xs hover:shadow-md group relative overflow-hidden ${
                      app.urgency === 'critical' ? 'border-l-4 border-l-rose-500 border-slate-200' :
                      app.urgency === 'high' ? 'border-l-4 border-l-amber-500 border-slate-200' :
                      'border-l-4 border-l-slate-400 border-slate-200'
                    }`}
                  >
                  <div className="p-3.5 sm:p-4 space-y-2.5 w-full">
                    
                    {/* Level 1: 头部元信息栏 (ID + 类型 + 紧迫度 + 金额标签) */}
                    <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {app.id}
                        </span>

                        {/* 类型徽章 */}
                        {app.type === 'procurement_increase' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Plus className="w-3 h-3 text-blue-600" />
                            <span>设备增配采购论证</span>
                          </span>
                        )}
                        {app.type === 'part_replacement' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Wrench className="w-3 h-3 text-amber-600" />
                            <span>大额换件与重大维修</span>
                          </span>
                        )}
                        {app.type === 'scrap_disposal' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>技术鉴定与报废处置</span>
                          </span>
                        )}
                        {app.type === 'loan_extension' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                            <RotateCcw className="w-3 h-3 text-purple-600" />
                            <span>应急储备借调延期</span>
                          </span>
                        )}
                        {app.type === 'overdue_filing' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>超期服役准用备案</span>
                          </span>
                        )}

                        {/* 紧迫度 */}
                        {app.urgency === 'critical' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>特急抢修</span>
                          </span>
                        )}
                        {app.urgency === 'high' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <span>加急</span>
                          </span>
                        )}
                      </div>

                      {/* 预估金额或残值 */}
                      {estimatedAmount !== undefined && estimatedAmount > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-400">涉及预算:</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            ¥{estimatedAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Level 2: 核心标题 (高清晰度视觉锚点) */}
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                        {app.title}
                      </h2>
                    </div>

                    {/* Level 3: 事实要点摘要条 (Full-Width Structured Key Fact Strip) */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 text-xs w-full">
                      {app.type === 'procurement_increase' && (
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 text-slate-700 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400 shrink-0">拟购标的:</span>
                            <strong className="text-slate-900">{app.targetEquipmentName}</strong>
                            <span className="text-slate-500 font-mono">({app.targetModel || '待选型'})</span>
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold text-[11px] shrink-0">{app.targetCount} 台</span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-2xl">
                            {app.clinicalNecessityReason || app.borrowingHistorySummary || '临床业务量增长急需增配'}
                          </div>
                        </div>
                      )}

                      {app.type === 'part_replacement' && (
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 text-slate-700 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400 shrink-0">故障设备:</span>
                            <strong className="text-slate-900">{app.equipmentName}</strong>
                            <span className="text-slate-500 font-mono">({app.equipmentModel})</span>
                            <span className="text-slate-400 ml-1 shrink-0">更换配件:</span>
                            <strong className="text-amber-900">{app.partName}</strong>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-2xl">
                            {app.faultSymptoms || app.technicalAssessment || '配件老化损毁需换新'}
                          </div>
                        </div>
                      )}

                      {app.type === 'scrap_disposal' && (
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 text-slate-700 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400 shrink-0">报废设备:</span>
                            <strong className="text-slate-900">{app.equipmentName}</strong>
                            <span className="text-slate-500 font-mono">({app.equipmentId})</span>
                            <span className="text-slate-400 ml-1 shrink-0">累计维保:</span>
                            <span className="font-mono text-rose-700 font-bold">¥{app.equipmentCumulativeMaintenanceCost?.toLocaleString()}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-2xl">
                            {app.technicalEvaluation || '严重损毁无修复价值'}
                          </div>
                        </div>
                      )}

                      {app.type === 'loan_extension' && (
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 text-slate-700 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400 shrink-0">延期设备:</span>
                            <strong className="text-slate-900">{app.equipmentName}</strong>
                            <span className="text-slate-400 ml-1 shrink-0">申请延至:</span>
                            <span className="font-mono font-bold text-purple-700">{app.requestedDueDate}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-2xl">
                            {app.extensionReason || '抢救过渡期患者救治需求'}
                          </div>
                        </div>
                      )}

                      {app.type === 'overdue_filing' && (
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 text-slate-700 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400 shrink-0">申报设备:</span>
                            <strong className="text-slate-900">{app.equipmentName}</strong>
                            <span className="text-slate-500 font-mono">({app.equipmentId})</span>
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[10.5px] shrink-0">
                              超役 +{app.overdueYears || 2}年
                            </span>
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[10.5px] shrink-0 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>72h稳定性合格</span>
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-2xl flex items-center gap-2">
                            <span>报告号: <strong className="font-mono text-slate-700">{app.stabilityTestReportNo || 'SD-MD-STAB-2026'}</strong></span>
                            <span>·</span>
                            <span>准用有效期至: <strong className="font-mono text-emerald-800">{app.extendedValidUntil || app.overdueFilingDetails?.validUntil || '2027-05-31'}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Level 4: 流转进度条 + 经办底栏 + 快捷动作 (Adaptive Stepper & Actions) */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full">
                      
                      {/* 可视化 4 节点流程指示条 (Progress Stepper) */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto pb-1 xl:pb-0">
                        {stepLabels.map((lbl, idx) => {
                          const stepNum = idx + 1;
                          const isDone = stepNum < currentStep;
                          const isCurrent = stepNum === currentStep;
                          const isFuture = stepNum > currentStep;

                          return (
                            <React.Fragment key={lbl}>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isRejected && isCurrent ? 'bg-rose-600 text-white' :
                                  isDone ? 'bg-emerald-600 text-white' :
                                  isCurrent ? 'bg-amber-500 text-white animate-pulse' :
                                  'bg-slate-200 text-slate-500'
                                }`}>
                                  {isDone ? '✓' : isRejected && isCurrent ? '✕' : stepNum}
                                </span>
                                <span className={`text-[11px] whitespace-nowrap ${
                                  isCurrent ? 'font-bold text-slate-900' :
                                  isDone ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  {lbl}
                                </span>
                              </div>
                              {idx < stepLabels.length - 1 && (
                                <div className={`h-0.5 flex-1 min-w-[16px] max-w-[48px] ${
                                  isDone ? 'bg-emerald-500' : 'bg-slate-200'
                                }`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* 经办人信息与操作按钮 */}
                      <div className="flex items-center justify-between xl:justify-end gap-3 shrink-0">
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>科室: <strong className="text-slate-700">{app.applicantDepartment}</strong></span>
                          <span>·</span>
                          <span>经办: {app.applicantName}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-400">{app.createdAt.slice(0, 10)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* 快速签批按钮 (如果待审批且当前用户具备权限) */}
                          {isPendingMe && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickAuditApp(app);
                                setApprovalComment('');
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>快速签批</span>
                            </button>
                          )}

                          {/* 超期准用审批通过后的专属准用标签快捷打印入口 */}
                          {app.type === 'overdue_filing' && app.status === 'approved' && onOpenPrintLabel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const eq = equipmentList.find(e => e.id === app.equipmentId);
                                if (eq) onOpenPrintLabel(eq);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                              title="打印该超期设备的专属绿色特许准用标签贴"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                              <span>打印准用标签</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppDetail(app);
                              setActiveDetailViewTab('document');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-medium transition flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>查阅公文</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>

        {/* Fixed Footer Pagination for Approvals */}
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredApplications.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 层次 4：快捷签批轻量浮层 (Quick Approval Modal) */}
      {/* ========================================================================= */}
      {quickAuditApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold">快速在线审批签批</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickAuditApp(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-mono text-[11px] text-slate-500">单号: {quickAuditApp.id}</div>
                <div className="font-bold text-slate-900">{quickAuditApp.title}</div>
                <div className="text-slate-600">当前节点: <span className="text-amber-700 font-semibold">{quickAuditApp.currentApprovalNode}</span></div>
              </div>

              {/* 快捷意见模板 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">快捷批注意见选择:</label>
                <div className="space-y-1">
                  {QUICK_OPINIONS.map((op, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setApprovalComment(op)}
                      className="w-full text-left text-xs p-1.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 transition text-slate-700 border border-slate-200/80 truncate block cursor-pointer"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">自定义审核意见 / 批示批注:</label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="在此输入您的正式审核意见或审批要求..."
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAuditApp(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmittingAudit}
                    onClick={() => handlePerformAudit(quickAuditApp, 'reject')}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    驳回退回
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingAudit}
                    onClick={() => handlePerformAudit(quickAuditApp, 'agree')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>同意并电子签署</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 层次 5：标准公文论证呈批单与全轨迹详情 (Official Document & Timeline Modal) */}
      {/* ========================================================================= */}
      {selectedAppDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-xs bg-blue-600 px-2 py-0.5 rounded text-white shrink-0">
                  {selectedAppDetail.id}
                </span>
                <h2 className="text-sm font-bold truncate">
                  {selectedAppDetail.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppDetail(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveDetailViewTab('document')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    activeDetailViewTab === 'document' 
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>标准论证呈批表单</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailViewTab('timeline')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    activeDetailViewTab === 'timeline' 
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>审批流转轨迹 ({(selectedAppDetail.auditLogs || []).length})</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                  title="打印当前审批呈批表"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印表单</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100">
              
              {activeDetailViewTab === 'document' ? (
                /* 标准红头文件与严谨表格排版视图 */
                <div className="bg-white p-6 sm:p-10 rounded-xl border border-slate-300 shadow-sm text-slate-900 max-w-4xl w-full mx-auto print:shadow-none print:border-none print:p-0">
                  
                  {/* 1. 规范红头文头 */}
                  <div className="text-center pb-4 mb-4 border-b-2 border-red-600">
                    <div className="text-red-600 font-bold tracking-[0.25em] text-xs uppercase mb-1">
                      五莲县人民医院 · 医学装备管理委员会文件
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight my-2">
                      {selectedAppDetail.type === 'procurement_increase' && '医疗设备新增配置可行性论证呈报审批表'}
                      {selectedAppDetail.type === 'part_replacement' && '大型医疗设备高额配件更换与重大维修审批表'}
                      {selectedAppDetail.type === 'scrap_disposal' && '医疗设备技术鉴定与固定资产报废处置呈批表'}
                      {selectedAppDetail.type === 'loan_extension' && '全院应急储备设备特批借用延期申请表'}
                    </h1>
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-mono mt-3 px-1 border-t border-slate-200 pt-2">
                      <div><span className="text-slate-400">单据发文字号：</span><strong className="text-slate-800">五医装呈〔2026〕第 {selectedAppDetail.id.replace('APP-', '')} 号</strong></div>
                      <div><span className="text-slate-400">流水单号：</span><strong className="text-slate-800 font-mono">{selectedAppDetail.id}</strong></div>
                      <div><span className="text-slate-400">申报日期：</span><strong className="text-slate-800">{selectedAppDetail.createdAt}</strong></div>
                    </div>
                  </div>

                  {/* 2. 规范网格审批总表 */}
                  <div className="border-2 border-slate-700 divide-y divide-slate-700 text-xs leading-relaxed bg-white">
                    
                    {/* 表格区块 1：申报单位与经办人基本信息 */}
                    <div className="grid grid-cols-12 divide-x divide-slate-700">
                      <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                        申报科室
                      </div>
                      <div className="col-span-4 p-2.5 flex items-center font-semibold text-slate-900 bg-white">
                        {selectedAppDetail.applicantDepartment}
                      </div>
                      <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                        经办人 / 职务
                      </div>
                      <div className="col-span-4 p-2.5 flex items-center justify-between bg-white">
                        <span className="font-medium text-slate-900">{selectedAppDetail.applicantName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">📞 {selectedAppDetail.applicantPhone}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 divide-x divide-slate-700">
                      <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                        业务类别
                      </div>
                      <div className="col-span-4 p-2.5 flex items-center text-slate-900 bg-white">
                        {selectedAppDetail.type === 'procurement_increase' && '学科建设与设备增配论证'}
                        {selectedAppDetail.type === 'part_replacement' && '大额零配件更换与重大维修'}
                        {selectedAppDetail.type === 'scrap_disposal' && '设备技术鉴定与报废销卡'}
                        {selectedAppDetail.type === 'loan_extension' && '应急周转池设备特批延期'}
                      </div>
                      <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                        紧迫度评级
                      </div>
                      <div className="col-span-4 p-2.5 flex items-center gap-2 bg-white">
                        {selectedAppDetail.urgency === 'critical' && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300 text-[11px]">
                            🔴 特急抢修 (直接影响急危重症救治)
                          </span>
                        )}
                        {selectedAppDetail.urgency === 'high' && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300 text-[11px]">
                            🟡 加急 (超期占用/临床高负荷)
                          </span>
                        )}
                        {selectedAppDetail.urgency === 'normal' && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-300 text-[11px]">
                            ⚪ 普通论证 (常规流转)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 表格区块 2：标的设备明细参数与预算 */}
                    {selectedAppDetail.type === 'procurement_increase' && (
                      <>
                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            拟购设备品类
                          </div>
                          <div className="col-span-4 p-2.5 font-bold text-slate-950 bg-white">
                            {selectedAppDetail.targetEquipmentName}
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            推荐规格型号
                          </div>
                          <div className="col-span-4 p-2.5 font-mono text-slate-800 bg-white">
                            {selectedAppDetail.targetModel || '待医学工程处技术选型论证'}
                          </div>
                        </div>

                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            拟购数量
                          </div>
                          <div className="col-span-4 p-2.5 font-bold text-blue-900 bg-white">
                            {selectedAppDetail.targetCount} 台 / 套
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            预估资金预算
                          </div>
                          <div className="col-span-4 p-2.5 font-mono font-bold text-emerald-800 bg-white flex items-center justify-between">
                            <span>¥{selectedAppDetail.estimatedBudget?.toLocaleString()} 元</span>
                            <span className="text-[10px] text-slate-500 font-normal">资金来源: 医院装备专项预算</span>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedAppDetail.type === 'part_replacement' && (
                      <>
                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            故障设备名称
                          </div>
                          <div className="col-span-4 p-2.5 font-bold text-slate-950 bg-white">
                            {selectedAppDetail.equipmentName}
                            <span className="block text-[11px] text-slate-500 font-mono font-normal">台账编码: {selectedAppDetail.equipmentId}</span>
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            设备型号 / 位置
                          </div>
                          <div className="col-span-4 p-2.5 text-slate-800 bg-white">
                            <span className="font-mono">{selectedAppDetail.equipmentModel}</span>
                            <span className="block text-[11px] text-slate-500">{selectedAppDetail.equipmentLocation}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            拟换配件名称
                          </div>
                          <div className="col-span-4 p-2.5 font-bold text-amber-950 bg-white">
                            {selectedAppDetail.partName}
                            <span className="block text-[11px] text-slate-500 font-mono font-normal">{selectedAppDetail.partModel || '原厂原装规格'}</span>
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            配件预估费用
                          </div>
                          <div className="col-span-4 p-2.5 font-mono font-bold text-rose-800 bg-white flex items-center justify-between">
                            <span>¥{selectedAppDetail.partEstimatedCost?.toLocaleString()} 元</span>
                            <span className="text-[10px] text-slate-500 font-normal">设备原值: ¥{selectedAppDetail.equipmentPurchasePrice?.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedAppDetail.type === 'scrap_disposal' && (
                      <>
                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            报废设备名称
                          </div>
                          <div className="col-span-4 p-2.5 font-bold text-slate-950 bg-white">
                            {selectedAppDetail.equipmentName}
                            <span className="block text-[11px] text-slate-500 font-mono font-normal">编号: {selectedAppDetail.equipmentId}</span>
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            规格型号
                          </div>
                          <div className="col-span-4 p-2.5 font-mono text-slate-800 bg-white">
                            {selectedAppDetail.equipmentModel}
                          </div>
                        </div>

                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            购置日期 / 原值
                          </div>
                          <div className="col-span-4 p-2.5 text-slate-800 bg-white">
                            <span>{selectedAppDetail.equipmentPurchaseDate}</span>
                            <span className="font-mono font-semibold text-slate-900 block">¥{selectedAppDetail.equipmentPurchasePrice?.toLocaleString()} 元</span>
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            累计维修 / 预估残值
                          </div>
                          <div className="col-span-4 p-2.5 text-slate-800 bg-white">
                            <span className="text-rose-700 font-mono font-bold">维修支出: ¥{selectedAppDetail.equipmentCumulativeMaintenanceCost?.toLocaleString()}</span>
                            <span className="text-emerald-700 font-mono font-bold block">预估残值: ¥{selectedAppDetail.salvageValueEstimate?.toLocaleString()} 元</span>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedAppDetail.type === 'loan_extension' && (
                      <div className="grid grid-cols-12 divide-x divide-slate-700">
                        <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                          借调设备名称
                        </div>
                        <div className="col-span-4 p-2.5 font-bold text-slate-950 bg-white">
                          {selectedAppDetail.equipmentName}
                        </div>
                        <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                          申请延期至
                        </div>
                        <div className="col-span-4 p-2.5 font-mono font-bold text-purple-800 bg-white">
                          {selectedAppDetail.requestedDueDate} (特批过渡使用)
                        </div>
                      </div>
                    )}

                    {selectedAppDetail.type === 'overdue_filing' && (
                      <>
                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            备案申报设备
                          </div>
                          <div className="col-span-4 p-2.5 font-bold text-slate-950 bg-white">
                            {selectedAppDetail.equipmentName}
                            <span className="block text-[11px] text-slate-500 font-mono font-normal">台账编码: {selectedAppDetail.equipmentId}</span>
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            出厂寿命 / 超期年限
                          </div>
                          <div className="col-span-4 p-2.5 font-mono text-slate-800 bg-white flex items-center gap-2">
                            <span>设计寿命 {selectedAppDetail.originalLifespanYears || 10} 年</span>
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[11px]">
                              已超役 +{selectedAppDetail.overdueYears || 2} 年
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            整修实施单位
                          </div>
                          <div className="col-span-4 p-2.5 text-slate-900 bg-white">
                            <span className="font-semibold">{selectedAppDetail.refurbishProvider || '医学工程保障中心特种翻新技术部'}</span>
                            <span className="block text-[11px] text-slate-500">整修支出: ¥{(selectedAppDetail.refurbishCost || 12000).toLocaleString()} 元</span>
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            稳定性检测报告
                          </div>
                          <div className="col-span-4 p-2.5 font-mono text-emerald-900 bg-white">
                            <span className="font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>72h连续满载合格 (报告号: {selectedAppDetail.stabilityTestReportNo || 'SD-MD-STAB-2026'})</span>
                            </span>
                            <span className="block text-[11px] text-slate-500 font-normal">检验机构: {selectedAppDetail.stabilityTestAgency || '山东省医疗器械产品质量检验中心'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 divide-x divide-slate-700">
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            准用有效期限
                          </div>
                          <div className="col-span-4 p-2.5 font-mono font-bold text-emerald-800 bg-white">
                            {selectedAppDetail.extendedValidUntil || selectedAppDetail.overdueFilingDetails?.validUntil || '2027-05-31'}
                            <span className="block text-[10px] text-slate-500 font-normal">巡检监管: {selectedAppDetail.monitoringFrequency === 'MONTHLY' ? '实行按月缩周期重点质控巡检' : '按季度重点监测'}</span>
                          </div>
                          <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                            备案凭证公文号
                          </div>
                          <div className="col-span-4 p-2.5 font-mono font-bold text-blue-900 bg-white flex items-center justify-between">
                            <span>{selectedAppDetail.filingNo || selectedAppDetail.overdueFilingDetails?.filingNo || 'EXT-2026-0518'}</span>
                            {onOpenPrintLabel && (
                              <button
                                type="button"
                                onClick={() => {
                                  const eq = equipmentList.find(e => e.id === selectedAppDetail.equipmentId);
                                  if (eq) onOpenPrintLabel(eq);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Printer className="w-3 h-3" />
                                <span>打印专属准用贴</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 第三方检验检测合格报告列表 */}
                        {(() => {
                          const targetEq = equipmentList.find(e => e.id === selectedAppDetail.equipmentId);
                          const appReports = selectedAppDetail.overdueFilingDetails?.reports || targetEq?.overdueFiling?.reports || [];
                          if (!appReports || appReports.length === 0) return null;
                          return (
                            <div className="grid grid-cols-12 divide-x divide-slate-700 bg-emerald-50/50">
                              <div className="col-span-2 bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-center text-center">
                                随附检验检测报告
                              </div>
                              <div className="col-span-10 p-2.5 bg-white">
                                <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1.5">
                                  <div className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>已随附 {appReports.length} 份权威第三方检测报告 (CMA/CNAS 计量认证合格):</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-normal">审批人可点击在线调阅查验报告全文</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {appReports.map((rep: ThirdPartyInspectionReport) => (
                                    <div key={rep.id} className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/30 flex items-center justify-between gap-2 text-xs">
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-800 truncate" title={rep.fileName}>{rep.fileName}</div>
                                        <div className="text-[11px] text-slate-500 font-mono">单号: {rep.reportNo} · {rep.fileSize || '3.2 MB'}</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingThirdPartyReport(rep)}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-2xs font-bold shrink-0 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>在线查验</span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {/* 表格区块 3：详细临床业务需求现状与依据 */}
                    <div className="p-3.5 bg-white space-y-2">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs inline-block"></span>
                        <span>一、临床业务需求现状与数据依据 (Clinical Justification & Data)</span>
                      </div>
                      
                      {selectedAppDetail.borrowingHistorySummary && (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 text-[11.5px] leading-relaxed">
                          <strong className="text-slate-900">【应急储备池借调频次与超期记录】</strong>
                          <span>{selectedAppDetail.borrowingHistorySummary}</span>
                        </div>
                      )}

                      <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap pl-1">
                        {selectedAppDetail.clinicalNecessityReason || selectedAppDetail.faultSymptoms || selectedAppDetail.extensionReason || '临床业务量增长急需增配支持。'}
                      </div>
                    </div>

                    {/* 表格区块 4：医学工程技术鉴定与风险评估 */}
                    <div className="p-3.5 bg-white space-y-2">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <span className="w-1.5 h-3.5 bg-amber-600 rounded-xs inline-block"></span>
                        <span>二、医学工程技术鉴定与全院安全风险评估 (Engineering & Risk Assessment)</span>
                      </div>
                      
                      <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap pl-1">
                        {selectedAppDetail.technicalAssessment || selectedAppDetail.technicalEvaluation || selectedAppDetail.clinicalRiskAnalysis || '经技术查验，符合装备管理规范。'}
                      </div>

                      {selectedAppDetail.safetyHazardNotice && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-900 text-[11.5px] leading-relaxed flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-rose-950 font-bold">【安全隐患与法规合规红线预警】</strong>
                            <span>{selectedAppDetail.safetyHazardNotice}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 表格区块 5：AI 智能决策论证建议 (若有) */}
                    {selectedAppDetail.aiRecommendationReport && (
                      <div className="p-3.5 bg-purple-50/50 space-y-1.5">
                        <div className="font-bold text-purple-950 text-xs flex items-center gap-1.5 border-b border-purple-200 pb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>三、Gemini AI 智能决策模型可行性论证意见 (AI Advisory Report)</span>
                        </div>
                        <div className="text-purple-900 text-[11.5px] leading-relaxed whitespace-pre-wrap pl-1">
                          {selectedAppDetail.aiRecommendationReport}
                        </div>
                      </div>
                    )}

                    {/* 表格区块 6：四级联签审批与电子签署存证栏 (Hospital 4-Tier Signing Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700 bg-white">
                      
                      {/* 节点 1：临床科室意见 */}
                      <div className="p-3 flex flex-col justify-between min-h-[115px] relative">
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span>1. 临床使用科室申请意见</span>
                            <span className="text-emerald-700 font-mono text-[10px]">✓ 已签署</span>
                          </div>
                          <p className="text-xs text-slate-800 italic leading-snug">
                            "{(selectedAppDetail.auditLogs || []).find(l => l.nodeName.includes('科室') || l.nodeName.includes('提交'))?.comment || '情况属实，急需配置，同意呈报。'}"
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-dashed border-slate-300 font-mono">
                          <span>科室主任: <strong className="text-slate-800">{selectedAppDetail.applicantName}</strong></span>
                          <span>{selectedAppDetail.createdAt.slice(0, 10)}</span>
                        </div>
                      </div>

                      {/* 节点 2：医学工程保障中心意见 */}
                      <div className="p-3 flex flex-col justify-between min-h-[115px] relative">
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span>2. 医学工程保障中心论证意见</span>
                            {(selectedAppDetail.auditLogs || []).some(l => l.nodeName.includes('医工') || l.nodeName.includes('工程')) ? (
                              <span className="text-emerald-700 font-mono text-[10px]">✓ 已论证审核</span>
                            ) : (
                              <span className="text-amber-700 font-mono text-[10px]">⏳ 论证中</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-800 italic leading-snug">
                            "{(selectedAppDetail.auditLogs || []).find(l => l.nodeName.includes('医工') || l.nodeName.includes('工程'))?.comment || '经技术工程师核验，参数与预算公允，建议准予实施。'}"
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-dashed border-slate-300 font-mono">
                          <span>医工处长: <strong className="text-slate-800">{(selectedAppDetail.auditLogs || []).find(l => l.nodeName.includes('医工'))?.operatorName || '赵处长'}</strong></span>
                          <span>{selectedAppDetail.updatedAt.slice(0, 10)}</span>
                        </div>
                      </div>

                    </div>

                    {/* 节点 3 & 4：终审决议栏 */}
                    <div className="p-3.5 bg-slate-50 flex flex-col justify-between min-h-[120px] relative">
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>3. 医院医学装备管理委员会 / 院领导终审决议</span>
                          {selectedAppDetail.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 text-[11px]">
                              ★ 终审通过 · 准予组织实施
                            </span>
                          )}
                          {selectedAppDetail.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300 text-[11px]">
                              ✕ 终审驳回 · 暂缓采购/重新论证
                            </span>
                          )}
                          {selectedAppDetail.status.startsWith('pending_') && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300 text-[11px]">
                              ⏳ 流转会签中 (待终审)
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          {selectedAppDetail.status === 'approved' 
                            ? '【终审批复】经医学装备管理委员会集体审议，同意本科室设备申请项目立项。由医学工程保障中心协同财务科组织合规招标采购、配件更换或固定资产处置销卡手续。'
                            : (selectedAppDetail.auditLogs || []).find(l => l.nodeName.includes('院') || l.nodeName.includes('终审'))?.comment || '呈报医学装备管理委员会分管院长审批中...'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-300 font-mono mt-2">
                        <span>委员会主任 / 分管院长：<strong className="text-slate-900">{(selectedAppDetail.auditLogs || []).find(l => l.nodeName.includes('院') || l.nodeName.includes('终审'))?.operatorName || '陈院长'}</strong></span>
                        <span>签署日期：{selectedAppDetail.updatedAt}</span>
                      </div>
                    </div>

                  </div>

                  {/* 表单附注说明 */}
                  <div className="mt-3 text-[10.5px] text-slate-400 flex items-center justify-between">
                    <span>* 本审批单依据《医疗器械监督管理条例》及五莲县人民医院医学装备管理制度生成，具备全程电子存证效力。</span>
                    <span className="font-mono">第 1 页 / 共 1 页</span>
                  </div>

                </div>
              ) : (
                /* 流转历史时间轴视图 */
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                    <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>全流程电子审计轨迹 (Electronic Audit Trail)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      所有节点操作均具备不可篡改的电子身份校验、精准时间戳与批注意见留痕
                    </p>
                  </div>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {(selectedAppDetail.auditLogs || []).map((log, idx) => (
                      <div key={log.id} className="relative group">
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-2xs ${
                          log.action === 'submitted' ? 'bg-blue-600' :
                          log.action === 'agreed' ? 'bg-emerald-600' :
                          log.action === 'rejected' ? 'bg-rose-600' : 'bg-slate-600'
                        }`}>
                          {idx + 1}
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              {log.nodeName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {log.operatedAt}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>经办人员: <strong className="text-slate-700">{log.operatorName}</strong></span>
                            <span>·</span>
                            <span>角色: {log.operatorRole}</span>
                            {log.operatorDept && (
                              <>
                                <span>·</span>
                                <span>{log.operatorDept}</span>
                              </>
                            )}
                          </div>

                          <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 leading-relaxed">
                            {log.comment}
                          </div>

                          {log.signatureUrl && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono pt-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>数字证书电子签名校验通过: {log.signatureUrl}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer (审批与操作区) */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              
              {/* 如果单据尚未完结，显示在线审批签批交互框 */}
              {selectedAppDetail.status.startsWith('pending_') ? (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10.5px] text-slate-400 font-medium">✨ AI 快速批注：</span>
                    <button
                      type="button"
                      onClick={() => setApprovalComment(generateAiApprovalReviewComment(selectedAppDetail.title, 'agree', '医工技术主管'))}
                      className="text-[10.5px] px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition cursor-pointer"
                    >
                      同意更换(医工论证)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalComment(generateAiApprovalReviewComment(selectedAppDetail.title, 'agree', '院长委员会'))}
                      className="text-[10.5px] px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition cursor-pointer"
                    >
                      符合预算准予立项
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalComment(generateAiApprovalReviewComment(selectedAppDetail.title, 'reject', '医工审核'))}
                      className="text-[10.5px] px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded transition cursor-pointer"
                    >
                      退回补充检测数据
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="输入审批/论证批注意见（支持点击上方 AI 快捷批注）..."
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 bg-slate-50"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSubmittingAudit}
                        onClick={() => handlePerformAudit(selectedAppDetail, 'agree')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>同意并签署</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingAudit}
                        onClick={() => handlePerformAudit(selectedAppDetail, 'reject')}
                        className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>驳回</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>该单据已于 {selectedAppDetail.updatedAt} 办结归档，流转已终止。</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedAppDetail(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                关闭窗口
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 层次 6：新建申请单模态框 (Create Application Modal) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold">发起医学装备技术论证与业务申请单</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector Tabs */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCreateType('procurement_increase');
                  setFormData(prev => ({ ...prev, type: 'procurement_increase' }));
                }}
                className={`p-2 rounded-lg text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                  createType === 'procurement_increase'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>1. 设备增配论证</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateType('part_replacement');
                  setFormData(prev => ({ ...prev, type: 'part_replacement' }));
                }}
                className={`p-2 rounded-lg text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                  createType === 'part_replacement'
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>2. 高额配件更换</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateType('scrap_disposal');
                  setFormData(prev => ({ ...prev, type: 'scrap_disposal' }));
                }}
                className={`p-2 rounded-lg text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                  createType === 'scrap_disposal'
                    ? 'bg-rose-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>3. 报废技术鉴定</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateType('loan_extension');
                  setFormData(prev => ({ ...prev, type: 'loan_extension' }));
                }}
                className={`p-2 rounded-lg text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                  createType === 'loan_extension'
                    ? 'bg-purple-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>4. 应急借用延期</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateType('overdue_filing');
                  setFormData(prev => ({ 
                    ...prev, 
                    type: 'overdue_filing',
                    extendedValidUntil: prev.extendedValidUntil || '2027-05-31',
                    monitoringFrequency: prev.monitoringFrequency || 'MONTHLY',
                    stabilityTestAgency: prev.stabilityTestAgency || '山东省医疗器械产品质量检验中心',
                    stabilityTestReportNo: prev.stabilityTestReportNo || `SD-MD-STAB-${Date.now().toString().slice(-6)}`,
                    continuousRunHours: prev.continuousRunHours || 72,
                    refurbishProvider: prev.refurbishProvider || '医学工程保障中心特种翻新技术部',
                    refurbishCost: prev.refurbishCost || 12000
                  }));
                }}
                className={`p-2 rounded-lg text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                  createType === 'overdue_filing'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>5. 超期准用备案</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* 基础申报信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">申报科室 *</label>
                  <input
                    type="text"
                    required
                    value={formData.applicantDepartment || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicantDepartment: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500"
                    placeholder="如：重症医学科 (ICU)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">申报经办人 *</label>
                  <input
                    type="text"
                    required
                    value={formData.applicantName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicantName: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">紧迫度等级</label>
                  <select
                    value={formData.urgency || 'high'}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                  >
                    <option value="critical">🔴 特急 (影响抢救停机/急危重症)</option>
                    <option value="high">🟡 加急 (借调超期/高负荷)</option>
                    <option value="normal">⚪ 普通 (常规论证)</option>
                  </select>
                </div>
              </div>

              {/* 增配专项字段 */}
              {createType === 'procurement_increase' && (
                <div className="space-y-3 p-3 bg-blue-50/40 rounded-lg border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-900">拟申购装备规格与资金预算</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">拟购设备品类 *</label>
                      <input
                        type="text"
                        required
                        placeholder="如：危重症转运呼吸机"
                        value={formData.targetEquipmentName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetEquipmentName: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">推荐规格型号</label>
                      <input
                        type="text"
                        placeholder="如：迈瑞 SV300 Pro"
                        value={formData.targetModel || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetModel: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">预估资金预算 (元) *</label>
                      <input
                        type="number"
                        required
                        value={formData.estimatedBudget || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedBudget: Number(e.target.value) }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">临床需求与借调超期依据 *</label>
                      <button
                        type="button"
                        onClick={handleGenerateAiClinicalNecessity}
                        disabled={aiGeneratingField === 'clinicalNecessity'}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition"
                      >
                        <Sparkles className={`w-3 h-3 text-blue-600 ${aiGeneratingField === 'clinicalNecessity' ? 'animate-spin' : ''}`} />
                        <span>{aiGeneratingField === 'clinicalNecessity' ? 'AI 正在论证...' : '✨ AI 智能生成论证依据'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="详细说明科室患者量、病床周转率以及近月从应急库借调的频次与天数..."
                      value={formData.clinicalNecessityReason || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinicalNecessityReason: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500 bg-white leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* 换件专项字段 */}
              {createType === 'part_replacement' && (
                <div className="space-y-3.5 p-3.5 bg-amber-50/40 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>故障设备与高额配件信息（超5,000元转批）</span>
                    </h4>
                    <span className="text-[11px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded font-mono">
                      需医工技术鉴定 & 三级审批
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <SmartEquipmentPicker
                      equipmentList={equipmentList}
                      selectedEquipmentId={formData.equipmentId || ''}
                      currentUser={currentUser || undefined}
                      onSelectEquipment={(id, eq) => {
                        if (eq) {
                          setFormData(prev => ({
                            ...prev,
                            equipmentId: eq.id,
                            equipmentName: eq.name,
                            equipmentModel: eq.model,
                            equipmentLocation: eq.location,
                            equipmentPurchasePrice: eq.purchasePrice
                          }));
                        } else {
                          const found = equipmentList.find(item => item.id === id);
                          if (found) {
                            setFormData(prev => ({
                              ...prev,
                              equipmentId: found.id,
                              equipmentName: found.name,
                              equipmentModel: found.model,
                              equipmentLocation: found.location,
                              equipmentPurchasePrice: found.purchasePrice
                            }));
                          }
                        }
                      }}
                      label="故障设备与台账关联"
                      placeholder="快速搜索 1,000+ 台设备：输入型号 / SN / 资产号 / 科室..."
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">拟更换配件名称 *</label>
                      <input
                        type="text"
                        required
                        placeholder="如：主控数字板 / X射线球管 / 高压发生器"
                        value={formData.partName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, partName: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">预估配件单价 (元) *</label>
                      <input
                        type="number"
                        required
                        value={formData.partEstimatedCost || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, partEstimatedCost: Number(e.target.value) }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500 font-mono font-bold text-amber-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">停机对临床影响</label>
                      <input
                        type="text"
                        placeholder="如：急诊危重抢救关键通道受阻，需特急抢修"
                        value={formData.downtimeImpact || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, downtimeImpact: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 1. 现场故障现象与临床损坏情况 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="block text-xs font-semibold text-slate-700">现场故障现象与临床损坏情况 *</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateAiFaultSymptoms()}
                          disabled={aiGeneratingField === 'faultSymptoms'}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition"
                        >
                          <Sparkles className={`w-3 h-3 text-blue-600 ${aiGeneratingField === 'faultSymptoms' ? 'animate-spin' : ''}`} />
                          <span>{aiGeneratingField === 'faultSymptoms' ? 'AI 正在规范描述...' : '✨ AI 规范故障现象'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10.5px] text-slate-400">快速注入典型现象：</span>
                      {[
                        { label: '0x107F 报警死机', text: '设备运行中频繁弹出 0x107F 硬件错误代码并死机锁屏，重启无法进入主程序。' },
                        { label: '通电黑屏不启动', text: '通电开机前面板指示灯微亮，主屏黑屏无背光，蜂鸣器发出连续急促长鸣。' },
                        { label: '气路压力/漏气报警', text: '机械通气时气道高压与泄漏报警频发，呼气阀组件闻及持续微漏气声，自检泄漏超标。' },
                        { label: '高压击穿伪影', text: '曝光瞬间机架异响，图像伪影斑点严重，控制台报错 ERR-HV-OVERLOAD 高压击穿。' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleGenerateAiFaultSymptoms(item.text)}
                          className="text-[10px] px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded transition cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="详细描述设备发生故障时的现场表现、显示屏报错代码、对患者诊疗影响及现场初步处理..."
                      value={formData.faultSymptoms || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, faultSymptoms: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500 bg-white leading-relaxed"
                    />
                  </div>

                  {/* 2. 工程师技术鉴定与论证意见 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="block text-xs font-semibold text-slate-700">工程师技术鉴定与论证意见 *</label>
                      <button
                        type="button"
                        onClick={handleGenerateAiTechnicalAssessment}
                        disabled={aiGeneratingField === 'technicalAssessment'}
                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      >
                        <Sparkles className={`w-3 h-3 text-purple-600 ${aiGeneratingField === 'technicalAssessment' ? 'animate-spin' : ''}`} />
                        <span>{aiGeneratingField === 'technicalAssessment' ? 'AI 正在生成技术鉴定报告...' : '✨ AI 医工深度技术鉴定与论证'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      required
                      placeholder="详细记录万用表/示波器量测数据、失效机理分析、不可板级自修论证、更换必要性及经济性合规声明..."
                      value={formData.technicalAssessment || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, technicalAssessment: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono outline-none focus:border-blue-500 bg-white leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* 报废专项字段 */}
              {createType === 'scrap_disposal' && (
                <div className="space-y-3.5 p-3.5 bg-rose-50/40 rounded-xl border border-rose-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>拟报废处置设备与技术鉴定</span>
                    </h4>
                    <span className="text-[11px] text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded font-mono">
                      需专家鉴定 & 院长委员会终审
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <SmartEquipmentPicker
                      equipmentList={equipmentList}
                      selectedEquipmentId={formData.equipmentId || ''}
                      currentUser={currentUser || undefined}
                      onSelectEquipment={(id, eq) => {
                        if (eq) {
                          setFormData(prev => ({
                            ...prev,
                            equipmentId: eq.id,
                            equipmentName: eq.name,
                            equipmentModel: eq.model,
                            equipmentLocation: eq.location,
                            equipmentPurchasePrice: eq.purchasePrice,
                            equipmentPurchaseDate: eq.purchaseDate,
                            equipmentCumulativeMaintenanceCost: (eq.repairRecords || []).reduce((s, r) => s + (r.cost || 0), 0)
                          }));
                        } else {
                          const found = equipmentList.find(item => item.id === id);
                          if (found) {
                            setFormData(prev => ({
                              ...prev,
                              equipmentId: found.id,
                              equipmentName: found.name,
                              equipmentModel: found.model,
                              equipmentLocation: found.location,
                              equipmentPurchasePrice: found.purchasePrice,
                              equipmentPurchaseDate: found.purchaseDate,
                              equipmentCumulativeMaintenanceCost: (found.repairRecords || []).reduce((s, r) => s + (r.cost || 0), 0)
                            }));
                          }
                        }
                      }}
                      label="待报废处置目标设备"
                      placeholder="快速搜索 1,000+ 台设备：输入型号 / SN / 资产号 / 科室..."
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">报废原因分类 *</label>
                      <select
                        value={formData.scrapCategory || 'beyond_repair'}
                        onChange={(e) => setFormData(prev => ({ ...prev, scrapCategory: e.target.value as any }))}
                        className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      >
                        <option value="beyond_repair">严重损毁无修复价值</option>
                        <option value="obsolete_parts_unavailable">超役服役且厂家停产无零配件</option>
                        <option value="safety_hazard">强检不合格/严重漏电安全隐患</option>
                        <option value="economically_unfeasible">维修成本超过原值50%不经济</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">技术鉴定详述与检验依据 *</label>
                      <button
                        type="button"
                        onClick={handleGenerateAiScrapEvaluation}
                        disabled={aiGeneratingField === 'technicalEvaluation'}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      >
                        <Sparkles className={`w-3 h-3 text-rose-600 ${aiGeneratingField === 'technicalEvaluation' ? 'animate-spin' : ''}`} />
                        <span>{aiGeneratingField === 'technicalEvaluation' ? 'AI 正在生成报废鉴定...' : '✨ AI 专家报废技术鉴定论证'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      required
                      placeholder="详述使用年限、主要元器件老化程度、GB 9706.1 计量检验不合格参数及原厂停服证明..."
                      value={formData.technicalEvaluation || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, technicalEvaluation: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono outline-none focus:border-blue-500 bg-white leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* 延期专项字段 */}
              {createType === 'loan_extension' && (
                <div className="space-y-3 p-3 bg-purple-50/40 rounded-lg border border-purple-200">
                  <h4 className="text-xs font-bold text-purple-900">应急设备特批延期借用</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">借用设备名称 *</label>
                      <input
                        type="text"
                        required
                        placeholder="如：转运呼吸机 (EMG-VENT-01)"
                        value={formData.equipmentName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">申请延期至日期 *</label>
                      <input
                        type="date"
                        required
                        value={formData.requestedDueDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, requestedDueDate: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">延期原因详述 *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="说明抢救过渡期患者救治需求及科室设备检修情况..."
                      value={formData.extensionReason || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, extensionReason: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 超期服役稳定性检测与准用备案专项字段 */}
              {createType === 'overdue_filing' && (
                <div className="space-y-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-300">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-emerald-950">超期服役稳定性检测与准用备案申报</h4>
                    </div>
                    {formData.equipmentId && onOpenOverdueFilingModal && (
                      <button
                        type="button"
                        onClick={() => {
                          const eq = equipmentList.find(e => e.id === formData.equipmentId);
                          if (eq) {
                            setIsCreateModalOpen(false);
                            onOpenOverdueFilingModal(eq);
                          }
                        }}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>打开专业备案表导入CMA检测报告</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">选择申报设备 *</label>
                      <select
                        required
                        value={formData.equipmentId || ''}
                        onChange={(e) => {
                          const selected = equipmentList.find(item => item.id === e.target.value);
                          if (selected) {
                            const nowYear = new Date().getFullYear();
                            const pYear = selected.purchaseDate ? new Date(selected.purchaseDate).getFullYear() : (nowYear - 10);
                            const originalLifespan = selected.expectedLifespanYears || 10;
                            const overdueY = Math.max(1, nowYear - pYear - originalLifespan);

                            setFormData(prev => ({
                              ...prev,
                              equipmentId: selected.id,
                              equipmentName: selected.name,
                              equipmentModel: selected.model,
                              applicantDepartment: selected.department || prev.applicantDepartment,
                              originalLifespanYears: originalLifespan,
                              overdueYears: overdueY,
                              title: `超期服役稳定性检测与特许准用备案申请: ${selected.name} (${selected.id})`
                            }));
                          }
                        }}
                        className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-emerald-500"
                      >
                        <option value="">-- 请选择需要备案的在册设备 --</option>
                        {equipmentList.map(eq => (
                          <option key={eq.id} value={eq.id}>
                            [{eq.id}] {eq.name} - {eq.department} ({eq.model || '标准型'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">申请特许准用截止日期 *</label>
                      <input
                        type="date"
                        required
                        value={formData.extendedValidUntil || '2027-05-31'}
                        onChange={(e) => setFormData(prev => ({ ...prev, extendedValidUntil: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">72小时稳定性检验机构 *</label>
                      <input
                        type="text"
                        required
                        placeholder="如：山东省医疗器械产品质量检验中心"
                        value={formData.stabilityTestAgency || '山东省医疗器械产品质量检验中心 (CMA/CNAS认证)'}
                        onChange={(e) => setFormData(prev => ({ ...prev, stabilityTestAgency: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">检测报告编号 *</label>
                      <input
                        type="text"
                        required
                        placeholder="如：SD-MD-STAB-2026-0819"
                        value={formData.stabilityTestReportNo || 'SD-MD-STAB-2026-0819'}
                        onChange={(e) => setFormData(prev => ({ ...prev, stabilityTestReportNo: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs font-mono bg-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">整修实施单位 / 改造支出 (元)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="整修单位"
                          value={formData.refurbishProvider || '医学工程中心特种翻新技术部'}
                          onChange={(e) => setFormData(prev => ({ ...prev, refurbishProvider: e.target.value }))}
                          className="flex-1 h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder="支出"
                          value={formData.refurbishCost || 12000}
                          onChange={(e) => setFormData(prev => ({ ...prev, refurbishCost: Number(e.target.value) }))}
                          className="w-24 h-8 px-2 rounded-lg border border-slate-300 text-xs font-mono bg-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">缩周期重点质控巡检频次</label>
                      <select
                        value={formData.monitoringFrequency || 'MONTHLY'}
                        onChange={(e) => setFormData(prev => ({ ...prev, monitoringFrequency: e.target.value as any }))}
                        className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-emerald-500"
                      >
                        <option value="MONTHLY">按月重点巡检 (高风险/生命支持/抢救急救)</option>
                        <option value="BIMONTHLY">双月巡检 (常规监护与普通诊断装备)</option>
                        <option value="QUARTERLY">季度巡检 (低风险辅助设备)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">医学工程处稳定性测试结论与电气安全鉴定 *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="记录 72 小时连续满载运行工况、参数漂移率、电气绝缘阻抗与对地漏电流检测结论..."
                      value={formData.technicalAssessment || '该设备已完成核心电源模块与高压滤波模组升级，经第三方质检中心连续 72 小时满负荷运转稳定性试验，核心工作参数最大漂移率 ±0.28%（优于国家标准要求≤±1.5%），GB 9706.1 医用电气安全（漏电流与接地阻抗）检验合格，具备继续安全服役条件，准予办理特许准用备案并附签专属绿色准用标识。'}
                      onChange={(e) => setFormData(prev => ({ ...prev, technicalAssessment: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs leading-relaxed outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 底部提交栏 */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>正式提交进入审批流</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 第三方检测报告在线查验弹窗 */}
      {previewingThirdPartyReport && (
        <ThirdPartyReportPreviewModal
          report={previewingThirdPartyReport}
          equipmentName={selectedAppDetail?.equipmentName}
          equipmentModel={selectedAppDetail?.equipmentModel}
          equipmentSn={selectedAppDetail?.equipmentSn}
          department={selectedAppDetail?.department}
          onClose={() => setPreviewingThirdPartyReport(null)}
        />
      )}

    </div>
  );
};

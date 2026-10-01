import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  FileText, 
  Send, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  Printer, 
  ExternalLink, 
  Eye, 
  ChevronRight, 
  Sparkles, 
  Building2, 
  ArrowRight, 
  RotateCcw,
  Check,
  Layers,
  Activity,
  History,
  FileCheck,
  Tag,
  X,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { ClosedLoopRepairTask, OnsiteVerificationRecord, FactoryRepairApplicationForm } from '../types/closedLoopRepairTypes';
import { getClosedLoopTasks, saveClosedLoopTasks } from '../utils/closedLoopRepairData';
import { MedicalEquipment, AuthUser } from '../types';
import { ApprovalApplication } from '../types/approvalTypes';
import { NewRepairReportModal } from './factory_repair/NewRepairReportModal';
import { OnsiteVerificationModal } from './factory_repair/OnsiteVerificationModal';
import { DraftReturnRepairModal } from './factory_repair/DraftReturnRepairModal';
import { ApprovalWorkflowModal } from './factory_repair/ApprovalWorkflowModal';
import { PrintReturnDocumentModal } from './factory_repair/PrintReturnDocumentModal';
import { FactoryRepairWorkflowView } from './factory_repair/FactoryRepairWorkflowView';
import { TaskProgressDetailModal } from './factory_repair/TaskProgressDetailModal';
import { ClosedLoopFilterBar } from './closed_loop/ClosedLoopFilterBar';
import { ClosedLoopTable } from './closed_loop/ClosedLoopTable';
import { 
  ClosedLoopSortField, 
  ClosedLoopSortOrder, 
  ClosedLoopTableDensity, 
  ClosedLoopColumnVisibility, 
  DEFAULT_CLOSED_LOOP_COLUMN_VISIBILITY,
  ClosedLoopQuickFilterKey,
  ClosedLoopViewMode
} from './closed_loop/closedLoopTableTypes';

interface RepairClosedLoopViewProps {
  currentUser: AuthUser | null;
  equipmentList: MedicalEquipment[];
  onUpdateEquipmentStatus?: (id: string, newStatus: any, reason: string, operator: string) => void;
  onNavigateToFactoryWorkflow?: () => void;
  onNavigateToApprovals?: () => void;
  approvalApplications?: ApprovalApplication[];
  onUpdateApprovalApplications?: (apps: ApprovalApplication[]) => void;
  showToast?: (message: string) => void;
}

export const RepairClosedLoopView: React.FC<RepairClosedLoopViewProps> = ({
  currentUser,
  equipmentList,
  onUpdateEquipmentStatus,
  onNavigateToFactoryWorkflow,
  onNavigateToApprovals,
  approvalApplications,
  onUpdateApprovalApplications,
  showToast = console.log
}) => {
  // Tasks state
  const [tasks, setTasks] = useState<ClosedLoopRepairTask[]>(() => getClosedLoopTasks());

  const handleUpdateTasks = (newTasks: ClosedLoopRepairTask[]) => {
    setTasks(newTasks);
    saveClosedLoopTasks(newTasks);
  };

  // Filter & Search states
  const [subTab, setSubTab] = useState<'taskList' | 'workflowWorkspace'>('taskList');
  const [viewMode, setViewMode] = useState<ClosedLoopViewMode>('table');
  const [activeFilterTab, setActiveFilterTab] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<ClosedLoopQuickFilterKey>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [showFlowchart, setShowFlowchart] = useState<boolean>(true);

  // Pagination & Sorting & Density & Columns & Selection (Referencing Equipment Ledger Table)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<ClosedLoopSortField>('faultTime');
  const [sortOrder, setSortOrder] = useState<ClosedLoopSortOrder>('desc');
  const [density, setDensity] = useState<ClosedLoopTableDensity>('default');
  const [columnVisibility, setColumnVisibility] = useState<ClosedLoopColumnVisibility>(DEFAULT_CLOSED_LOOP_COLUMN_VISIBILITY);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState<boolean>(false);
  const [activeVerificationTask, setActiveVerificationTask] = useState<ClosedLoopRepairTask | null>(null);
  const [activeDraftTask, setActiveDraftTask] = useState<ClosedLoopRepairTask | null>(null);
  const [activeApprovalTask, setActiveApprovalTask] = useState<ClosedLoopRepairTask | null>(null);
  const [activePrintTask, setActivePrintTask] = useState<ClosedLoopRepairTask | null>(null);
  const [activeDetailTask, setActiveDetailTask] = useState<ClosedLoopRepairTask | null>(null);

  // Synchronize Factory Repair Application with global hospital approvals
  const syncFactoryApplicationToGlobalApprovals = (task: ClosedLoopRepairTask, app: FactoryRepairApplicationForm) => {
    if (!onUpdateApprovalApplications || !approvalApplications) return;

    const existingIdx = approvalApplications.findIndex(a => a.id === app.applicationId);
    const eq = equipmentList.find(e => e.id === task.equipmentId);

    const mappedApproval: ApprovalApplication = {
      id: app.applicationId,
      type: 'return_factory_repair',
      title: app.title,
      applicantId: task.reporterId,
      applicantName: task.reporterName,
      applicantDepartment: task.department,
      applicantPhone: task.reporterPhone,
      urgency: app.urgency,
      status: app.finalApprovalStatus === 'approved' ? 'approved' : app.finalApprovalStatus === 'pending_vp' ? 'pending_committee' : 'pending_engineering',
      currentApprovalNode: app.finalApprovalStatus === 'approved' 
        ? '审批通过 · 准予实施' 
        : app.finalApprovalStatus === 'pending_vp' 
        ? '分管副院长终审' 
        : '医学设备科主管审核',
      nextApproverRole: app.finalApprovalStatus === 'approved' 
        ? '返厂实施' 
        : app.finalApprovalStatus === 'pending_vp' 
        ? '分管副院长 / 王建国' 
        : '医学设备科主管 / 崔伟',
      createdAt: app.draftedAt,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16),
      equipmentId: task.equipmentId,
      equipmentName: task.equipmentName,
      equipmentModel: task.equipmentModel,
      targetEquipmentId: task.equipmentId,
      targetVendor: app.targetVendor,
      estimatedCost: app.estimatedBudget,
      technicalAssessment: `【现场核验实测依据】\n透光率: ${task.onsiteVerification?.opticalTransmittance || '41.5%'}\n测漏: ${task.onsiteVerification?.airtightnessLeakage || '封胶开裂受潮'}\n透镜: ${task.onsiteVerification?.lensGroupCondition || '柱镜碎裂'}\n论证: ${app.technicalJustification}`,
      auditLogs: [
        {
          id: `LOG-APPLY-${Date.now()}`,
          nodeName: '麻醉手术科 · 临床报修申报',
          operatorName: task.reporterName,
          operatorRole: task.reporterRole,
          operatorDept: task.department,
          action: 'agreed',
          comment: task.faultDescription,
          operatedAt: task.faultTime
        },
        {
          id: `LOG-VERIFY-${Date.now() + 1}`,
          nodeName: '医学设备科 · 现场技术核验',
          operatorName: task.onsiteVerification?.verifiedBy || '崔伟',
          operatorRole: task.onsiteVerification?.verifierRole || '主管工程师',
          operatorDept: '医疗设备科',
          action: 'agreed',
          comment: task.onsiteVerification?.technicalAssessment || '实测确认必须返厂原厂大修。',
          operatedAt: task.onsiteVerification?.verifiedAt || task.faultTime
        }
      ]
    };

    if (app.deptReviewStatus === 'agreed') {
      mappedApproval.auditLogs.push({
        id: `LOG-DEPT-${Date.now() + 2}`,
        nodeName: '医学设备科主管 · 审查签批',
        operatorName: app.deptReviewer || '崔伟',
        operatorRole: app.deptReviewerRole || '设备科科长',
        operatorDept: '医疗设备科',
        action: 'agreed',
        comment: app.deptReviewComment || '技术审查属实，论证充分，预算合规，呈报分管院长。',
        signatureUrl: app.deptSignature,
        operatedAt: app.deptReviewedAt || new Date().toLocaleString('zh-CN')
      });
    }

    if (app.vpApprovalStatus === 'agreed') {
      mappedApproval.auditLogs.push({
        id: `LOG-VP-${Date.now() + 3}`,
        nodeName: '分管副院长 · 终审签批',
        operatorName: app.vpApprover || '王建国',
        operatorRole: app.vpApproverRole || '业务副院长',
        operatorDept: '院领导 / 医学装备管理委员会',
        action: 'agreed',
        comment: app.vpApprovalComment || '同意返厂大修。',
        signatureUrl: app.vpSignature,
        operatedAt: app.vpApprovedAt || new Date().toLocaleString('zh-CN')
      });
    }

    if (existingIdx >= 0) {
      const next = [...approvalApplications];
      next[existingIdx] = mappedApproval;
      onUpdateApprovalApplications(next);
    } else {
      onUpdateApprovalApplications([mappedApproval, ...approvalApplications]);
    }
  };

  // 1. 麻醉手术科提交报修申请并生成任务记录
  const handleCreateReport = (newTask: ClosedLoopRepairTask) => {
    const updated = [newTask, ...tasks];
    handleUpdateTasks(updated);

    // 联动更新台账设备状态为「故障待修」
    if (onUpdateEquipmentStatus) {
      onUpdateEquipmentStatus(
        newTask.equipmentId,
        '故障待修',
        `麻醉手术科提交紧急报修【${newTask.faultType}】，闭环工单【${newTask.taskNo}】已生成`,
        newTask.reporterName
      );
    }

    showToast(`✅ 已成功提交报修！自动生成关联维修闭环工单【${newTask.taskNo}】，已推送设备科现场核验。`);
  };

  // 2. 设备科现场技术勘查核验
  const handleConfirmVerification = (
    taskId: string,
    verificationData: OnsiteVerificationRecord,
    needFactoryRepair: boolean
  ) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16);
    let targetTask: ClosedLoopRepairTask | null = null;

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const newTimeline = [
          ...t.timeline,
          {
            id: `EVT-${Date.now()}`,
            stage: '现场核验',
            title: '设备科工程师现场技术勘查核验完成',
            actorName: verificationData.verifiedBy,
            actorRole: verificationData.verifierRole,
            actorDept: '医疗设备科',
            time: verificationData.verifiedAt || nowStr,
            notes: `现场实测：透光率【${verificationData.opticalTransmittance}】，气密性【${verificationData.airtightnessLeakage}】。判定结论：【${verificationData.conclusionTitle}】。`,
            badgeColor: 'emerald' as const
          }
        ];

        const updatedItem: ClosedLoopRepairTask = {
          ...t,
          onsiteVerification: verificationData,
          stage: needFactoryRepair ? 'verified' : 'closed',
          status: needFactoryRepair ? '已核验(待起草返厂)' : '已核验(院内自修)',
          timeline: newTimeline,
          updatedAt: nowStr
        };
        targetTask = updatedItem;
        return updatedItem;
      }
      return t;
    });

    handleUpdateTasks(updated);
    showToast(`✅ 设备科现场技术核验已完成！结论：${verificationData.conclusionTitle}`);

    if (needFactoryRepair && targetTask) {
      // 自动弹出起草呈批单弹窗
      setActiveDraftTask(targetTask);
    }
  };

  // 3. 一键起草『返厂维修申请单』，关联设备资产，并流转至设备科主管及分管院长审批
  const handleSubmitDraft = (taskId: string, appForm: FactoryRepairApplicationForm) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16);
    let targetTask: ClosedLoopRepairTask | null = null;

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const newTimeline = [
          ...t.timeline,
          {
            id: `EVT-${Date.now()}`,
            stage: '起草呈批',
            title: '设备科一键起草返厂维修呈批报告',
            actorName: appForm.draftedBy,
            actorRole: appForm.draftedRole,
            actorDept: '医疗设备科',
            time: appForm.draftedAt || nowStr,
            notes: `生成公文【${appForm.applicationId}】，预算 ¥${appForm.estimatedBudget.toLocaleString()}，流转至设备科主管审核。`,
            badgeColor: 'indigo' as const
          }
        ];

        const updatedItem: ClosedLoopRepairTask = {
          ...t,
          factoryRepairApplication: appForm,
          stage: 'return_drafted',
          status: '返厂审批中(待主管审核)',
          timeline: newTimeline,
          updatedAt: nowStr
        };
        targetTask = updatedItem;
        return updatedItem;
      }
      return t;
    });

    handleUpdateTasks(updated);

    if (targetTask) {
      syncFactoryApplicationToGlobalApprovals(targetTask, appForm);
      showToast(`🚀 已成功起草『返厂维修呈批单』【${appForm.applicationId}】！已推送至医学设备科主管审核。`);
      // 开启审批流转弹窗
      setActiveApprovalTask(targetTask);
    }
  };

  // 4. 设备科主管审核
  const handleApproveDept = (taskId: string, reviewerName: string, comment: string, signature: string) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16);
    let targetTask: ClosedLoopRepairTask | null = null;

    const updated = tasks.map(t => {
      if (t.id === taskId && t.factoryRepairApplication) {
        const updatedApp: FactoryRepairApplicationForm = {
          ...t.factoryRepairApplication,
          deptReviewer: reviewerName,
          deptReviewStatus: 'agreed',
          deptReviewComment: comment,
          deptReviewedAt: nowStr,
          deptSignature: signature,
          finalApprovalStatus: 'pending_vp'
        };

        const newTimeline = [
          ...t.timeline,
          {
            id: `EVT-${Date.now()}`,
            stage: '主管审核',
            title: '医学设备科主管技术审查同意',
            actorName: reviewerName,
            actorRole: '医疗设备科科长',
            actorDept: '医疗设备科',
            time: nowStr,
            notes: comment,
            badgeColor: 'purple' as const
          }
        ];

        const updatedItem: ClosedLoopRepairTask = {
          ...t,
          factoryRepairApplication: updatedApp,
          stage: 'dept_reviewed',
          status: '返厂审批中(待分管院长审批)',
          timeline: newTimeline,
          updatedAt: nowStr
        };
        targetTask = updatedItem;
        return updatedItem;
      }
      return t;
    });

    handleUpdateTasks(updated);

    if (targetTask && targetTask.factoryRepairApplication) {
      syncFactoryApplicationToGlobalApprovals(targetTask, targetTask.factoryRepairApplication);
      showToast(`✅ 设备科主管【${reviewerName}】审核通过！已流转至分管副院长【王建国】终审。`);
      setActiveApprovalTask(targetTask);
    }
  };

  // 5. 分管院长终审审批
  const handleApproveVp = (taskId: string, approverName: string, comment: string, signature: string) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16);
    let targetTask: ClosedLoopRepairTask | null = null;

    const updated = tasks.map(t => {
      if (t.id === taskId && t.factoryRepairApplication) {
        const updatedApp: FactoryRepairApplicationForm = {
          ...t.factoryRepairApplication,
          vpApprover: approverName,
          vpApprovalStatus: 'agreed',
          vpApprovalComment: comment,
          vpApprovedAt: nowStr,
          vpSignature: signature,
          finalApprovalStatus: 'approved'
        };

        const newTimeline = [
          ...t.timeline,
          {
            id: `EVT-${Date.now()}`,
            stage: '院长终审',
            title: '分管副院长终审批准返厂大修',
            actorName: approverName,
            actorRole: '业务副院长 / 医学装备委员会主任',
            actorDept: '院领导',
            time: nowStr,
            notes: comment,
            badgeColor: 'emerald' as const
          }
        ];

        const updatedItem: ClosedLoopRepairTask = {
          ...t,
          factoryRepairApplication: updatedApp,
          stage: 'vp_approved',
          status: '返厂审批通过',
          timeline: newTimeline,
          updatedAt: nowStr
        };
        targetTask = updatedItem;
        return updatedItem;
      }
      return t;
    });

    handleUpdateTasks(updated);

    if (targetTask && targetTask.factoryRepairApplication) {
      syncFactoryApplicationToGlobalApprovals(targetTask, targetTask.factoryRepairApplication);
      showToast(`🎉 分管副院长【${approverName}】终审签批通过！准予实施返厂大修。`);
      setActiveApprovalTask(targetTask);
    }
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const pendingVerification = tasks.filter(t => t.stage === 'reported').length;
    const verifiedPendingDraft = tasks.filter(t => t.stage === 'verified').length;
    const approving = tasks.filter(t => t.stage === 'return_drafted' || t.stage === 'dept_reviewed').length;
    const approved = tasks.filter(t => t.stage === 'vp_approved').length;

    return { total, pendingVerification, verifiedPendingDraft, approving, approved };
  }, [tasks]);

  // Extract unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.department) set.add(t.department);
    });
    set.add('麻醉手术科');
    set.add('泌尿外科');
    set.add('医学影像科');
    set.add('重症医学科(ICU)');
    return Array.from(set);
  }, [tasks]);

  // Filtered & Sorted Task List
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Quick filter
      if (quickFilter === 'pending_verify' && t.stage !== 'reported') return false;
      if (quickFilter === 'verified_pending_draft' && t.stage !== 'verified') return false;
      if (quickFilter === 'approving' && !(t.stage === 'return_drafted' || t.stage === 'dept_reviewed')) return false;
      if (quickFilter === 'approved' && t.stage !== 'vp_approved') return false;
      if (quickFilter === 'closed' && !(t.stage === 'closed' || t.status.includes('自修') || t.status.includes('办结'))) return false;

      // Stage dropdown filter
      if (selectedStageFilter !== 'all' && t.stage !== selectedStageFilter) return false;

      // Urgency filter
      if (selectedUrgencyFilter !== 'all' && t.urgency !== selectedUrgencyFilter) return false;

      // Department filter
      if (selectedDeptFilter !== 'all' && t.department !== selectedDeptFilter) return false;

      // Keyword filter
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matches = 
          t.taskNo.toLowerCase().includes(kw) ||
          t.equipmentName.toLowerCase().includes(kw) ||
          t.equipmentModel.toLowerCase().includes(kw) ||
          t.equipmentSn.toLowerCase().includes(kw) ||
          t.assetNo.toLowerCase().includes(kw) ||
          t.department.toLowerCase().includes(kw) ||
          t.reporterName.toLowerCase().includes(kw) ||
          t.faultType.toLowerCase().includes(kw) ||
          (t.faultDescription && t.faultDescription.toLowerCase().includes(kw));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'taskNo':
          comp = a.taskNo.localeCompare(b.taskNo);
          break;
        case 'equipmentName':
          comp = a.equipmentName.localeCompare(b.equipmentName, 'zh-CN');
          break;
        case 'department':
          comp = a.department.localeCompare(b.department, 'zh-CN');
          break;
        case 'urgency': {
          const urgencyOrder = { critical: 3, high: 2, normal: 1 };
          comp = (urgencyOrder[a.urgency] || 1) - (urgencyOrder[b.urgency] || 1);
          break;
        }
        case 'stage': {
          const stageOrder = { reported: 1, verified: 2, return_drafted: 3, dept_reviewed: 4, vp_approved: 5, closed: 6 };
          comp = (stageOrder[a.stage] || 0) - (stageOrder[b.stage] || 0);
          break;
        }
        case 'budget': {
          const aBudget = a.factoryRepairApplication?.estimatedBudget || 0;
          const bBudget = b.factoryRepairApplication?.estimatedBudget || 0;
          comp = aBudget - bBudget;
          break;
        }
        case 'faultTime':
        default:
          comp = (a.faultTime || '').localeCompare(b.faultTime || '');
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [tasks, quickFilter, selectedStageFilter, selectedUrgencyFilter, selectedDeptFilter, searchKeyword, sortField, sortOrder]);

  // Paginated tasks slice for current page
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // Table sorting toggle
  const handleSortChange = (field: ClosedLoopSortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Multi-selection handlers
  const handleToggleSelectAll = () => {
    const paginatedIds = paginatedTasks.map(t => t.id);
    const isAllCurrentSelected = paginatedIds.every(id => selectedIds.includes(id));
    if (isAllCurrentSelected) {
      setSelectedIds(selectedIds.filter(id => !paginatedIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...paginatedIds]));
      setSelectedIds(merged);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Column visibility handlers
  const handleToggleColumn = (key: keyof ClosedLoopColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetColumnVisibility = () => {
    setColumnVisibility(DEFAULT_CLOSED_LOOP_COLUMN_VISIBILITY);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedDeptFilter('all');
    setSelectedUrgencyFilter('all');
    setSelectedStageFilter('all');
    setQuickFilter('all');
    setActiveFilterTab('all');
    setCurrentPage(1);
  };

  // Export CSV
  const handleExportCsv = (tasksToExport = filteredTasks) => {
    const headers = [
      '工单编号',
      '任务类型',
      '标的设备名称',
      '规格型号',
      '出厂序列号(SN)',
      '医院资产卡号',
      '报修科室',
      '申报人',
      '申报人职务',
      '联系电话',
      '紧迫等级',
      '故障类型',
      '详细故障描述',
      '闭环流转阶段',
      '当前流转状态',
      '透光率实测',
      '气密性测漏结论',
      '预估返厂预算(元)',
      '预算占原值比例',
      '报修申报时间'
    ];
    const rows = tasksToExport.map(t => [
      t.taskNo,
      t.targetVendor || t.stage === 'vp_approved' ? '外协返厂' : '院内闭环',
      `"${t.equipmentName.replace(/"/g, '""')}"`,
      `"${t.equipmentModel.replace(/"/g, '""')}"`,
      t.equipmentSn,
      t.assetNo,
      t.department,
      t.reporterName,
      t.reporterRole,
      t.reporterPhone,
      t.urgency === 'critical' ? '特急' : t.urgency === 'high' ? '高急' : '常规',
      `"${t.faultType.replace(/"/g, '""')}"`,
      `"${(t.faultDescription || '').replace(/"/g, '""')}"`,
      t.stage,
      t.status,
      `"${(t.onsiteVerification?.opticalTransmittance || '').replace(/"/g, '""')}"`,
      `"${(t.onsiteVerification?.airtightnessLeakage || '').replace(/"/g, '""')}"`,
      t.factoryRepairApplication?.estimatedBudget || '',
      t.factoryRepairApplication?.budgetRatioPercent ? `${t.factoryRepairApplication.budgetRatioPercent}%` : '',
      t.faultTime
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `维修闭环管理工单台账_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✅ 已成功导出 ${tasksToExport.length} 条闭环工单记录至 CSV 文件！`);
  };

  const handleBatchExport = () => {
    const selectedTasks = tasks.filter(t => selectedIds.includes(t.id));
    handleExportCsv(selectedTasks);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
      {/* 1. Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">维修闭环管理视图</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    临床报修 • 现场核验 • 返厂多级呈批
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  麻醉手术科在线报修发起 → 设备科入室现场技术核验 → 一键起草返厂呈批单(绑定资产) → 设备科主管审核 → 分管院长终审闭环
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSubTab('taskList')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  subTab === 'taskList'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                闭环工单台账
              </button>
              <button
                onClick={() => setSubTab('workflowWorkspace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  subTab === 'workflowWorkspace'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>十阶协同履约工作台</span>
              </button>
            </div>

            {subTab === 'taskList' && (
              <button
                onClick={() => setShowFlowchart(!showFlowchart)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
                  showFlowchart
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>{showFlowchart ? '收起闭环流程图' : '展开闭环流程图'}</span>
              </button>
            )}

            <button
              onClick={() => setIsNewReportModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>【麻醉手术科】发起报修申请</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div
            onClick={() => {
              setActiveFilterTab('all');
              setQuickFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeFilterTab === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-xs ${activeFilterTab === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>全部闭环任务</div>
            <div className="text-xl font-bold mt-0.5">{stats.total}</div>
          </div>

          <div
            onClick={() => {
              setActiveFilterTab('pending_verify');
              setQuickFilter('pending_verify');
              setCurrentPage(1);
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeFilterTab === 'pending_verify'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50/60 border-amber-200 hover:border-amber-300 text-amber-950'
            }`}
          >
            <div className={`text-xs ${activeFilterTab === 'pending_verify' ? 'text-amber-100' : 'text-amber-700'}`}>
              待设备科现场核验
            </div>
            <div className="text-xl font-bold mt-0.5 flex items-center justify-between">
              <span>{stats.pendingVerification}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${activeFilterTab === 'pending_verify' ? 'bg-white/20' : 'bg-amber-200 text-amber-800'}`}>
                急需核验
              </span>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveFilterTab('verified_pending_draft');
              setQuickFilter('verified_pending_draft');
              setCurrentPage(1);
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeFilterTab === 'verified_pending_draft'
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-teal-50/60 border-teal-200 hover:border-teal-300 text-teal-950'
            }`}
          >
            <div className={`text-xs ${activeFilterTab === 'verified_pending_draft' ? 'text-teal-100' : 'text-teal-700'}`}>
              已核验 · 待起草返厂
            </div>
            <div className="text-xl font-bold mt-0.5 flex items-center justify-between">
              <span>{stats.verifiedPendingDraft}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${activeFilterTab === 'verified_pending_draft' ? 'bg-white/20' : 'bg-teal-200 text-teal-800'}`}>
                一键呈批
              </span>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveFilterTab('approving');
              setQuickFilter('approving');
              setCurrentPage(1);
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeFilterTab === 'approving'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-300 text-indigo-950'
            }`}
          >
            <div className={`text-xs ${activeFilterTab === 'approving' ? 'text-indigo-100' : 'text-indigo-700'}`}>
              返厂呈批流转中
            </div>
            <div className="text-xl font-bold mt-0.5 flex items-center justify-between">
              <span>{stats.approving}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${activeFilterTab === 'approving' ? 'bg-white/20' : 'bg-indigo-200 text-indigo-800'}`}>
                主管/院长审批
              </span>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveFilterTab('approved');
              setQuickFilter('approved');
              setCurrentPage(1);
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeFilterTab === 'approved'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 text-emerald-950'
            }`}
          >
            <div className={`text-xs ${activeFilterTab === 'approved' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              分管院长终审通过
            </div>
            <div className="text-xl font-bold mt-0.5 flex items-center justify-between">
              <span>{stats.approved}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${activeFilterTab === 'approved' ? 'bg-white/20' : 'bg-emerald-200 text-emerald-800'}`}>
                准予返厂实施
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Body Content */}
      {subTab === 'workflowWorkspace' ? (
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setSubTab('taskList')}
                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
              >
                <span>← 返回闭环工单列表</span>
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-slate-700 font-semibold">医疗器械外协返厂十阶全生命周期在线履约协同工作台 (发件 · 报价 · 议价 · 合同 · 验收结项 · 发票与付款)</span>
            </div>
            <button
              onClick={() => setIsNewReportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>麻醉科发起新报修</span>
            </button>
          </div>
          <FactoryRepairWorkflowView currentUser={currentUser || undefined} />
        </div>
      ) : (
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 flex flex-col min-h-0">
        {/* Flowchart Diagram (Collapsible) */}
        {showFlowchart && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  医疗器械返厂大修全生命周期内控闭环机制流程图
                </h3>
              </div>
              <span className="text-[11px] text-teal-300 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800">
                内控规范 • 电子会签留痕
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {/* Step 1 */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 relative">
                <div className="text-[10px] text-teal-300 font-bold uppercase">阶段 1</div>
                <div className="text-xs font-bold text-white mt-1">麻醉手术科报修</div>
                <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                  临床使用科室在系统发起报修申请，绑定设备资产，生成任务编号。
                </p>
                <div className="text-[10px] text-teal-400 font-semibold mt-2">
                  经办：黄晓彤 (护士长)
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 relative">
                <div className="text-[10px] text-blue-300 font-bold uppercase">阶段 2</div>
                <div className="text-xs font-bold text-white mt-1">设备科现场核验</div>
                <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                  工程师携带测漏仪、投影仪入室实测，出具【需要返厂大修】论证。
                </p>
                <div className="text-[10px] text-blue-400 font-semibold mt-2">
                  核验：崔伟 (主管工程师)
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 relative">
                <div className="text-[10px] text-amber-300 font-bold uppercase">阶段 3</div>
                <div className="text-xs font-bold text-white mt-1">一键起草呈批单</div>
                <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                  自动绑定资产编号、原值与现场实测报告，拟定委托厂家与预算。
                </p>
                <div className="text-[10px] text-amber-400 font-semibold mt-2">
                  起草：红头呈批报告
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 relative">
                <div className="text-[10px] text-purple-300 font-bold uppercase">阶段 4</div>
                <div className="text-xs font-bold text-white mt-1">设备科主管审核</div>
                <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                  科长进行技术真实性复核，签署主管论证批注并流转分管院长。
                </p>
                <div className="text-[10px] text-purple-400 font-semibold mt-2">
                  审核：崔伟 (设备科科长)
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 relative">
                <div className="text-[10px] text-emerald-300 font-bold uppercase">阶段 5</div>
                <div className="text-xs font-bold text-white mt-1">分管院长终审生效</div>
                <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                  分管副院长终审电子签章，单据生效，打印红头文书并准予寄出发件。
                </p>
                <div className="text-[10px] text-emerald-400 font-semibold mt-2">
                  终审：王建国 (业务副院长)
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Equipment Technical Ledger-Style List Container (参照设备技术台账列表规范设计) */}
          <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs min-h-[580px]">
            {/* Segment 1: Filter Bar with Search, Dropdowns, Quick Filters, Density & Column Visibility Controls */}
            <ClosedLoopFilterBar
              searchKeyword={searchKeyword}
              onSearchChange={(val) => {
                setSearchKeyword(val);
                setCurrentPage(1);
              }}
              activeQuickFilter={quickFilter}
              onQuickFilterChange={(key) => {
                setQuickFilter(key);
                setActiveFilterTab(key);
                setCurrentPage(1);
              }}
              selectedDept={selectedDeptFilter}
              onDeptChange={(dept) => {
                setSelectedDeptFilter(dept);
                setCurrentPage(1);
              }}
              departmentOptions={departmentOptions}
              selectedUrgency={selectedUrgencyFilter}
              onUrgencyChange={(urg) => {
                setSelectedUrgencyFilter(urg);
                setCurrentPage(1);
              }}
              selectedStage={selectedStageFilter}
              onStageChange={(stg) => {
                setSelectedStageFilter(stg);
                setCurrentPage(1);
              }}
              onResetFilters={handleResetFilters}
              totalFilteredCount={filteredTasks.length}
              totalAllCount={tasks.length}
              tasks={tasks}
              density={density}
              onToggleDensity={() => setDensity(d => d === 'default' ? 'compact' : 'default')}
              columnVisibility={columnVisibility}
              onToggleColumn={handleToggleColumn}
              onResetColumnVisibility={handleResetColumnVisibility}
              showFlowchart={showFlowchart}
              onToggleFlowchart={() => setShowFlowchart(!showFlowchart)}
              onOpenNewReportModal={() => setIsNewReportModalOpen(true)}
              onExportCsv={() => handleExportCsv(filteredTasks)}
              selectedCount={selectedIds.length}
              onClearSelection={() => setSelectedIds([])}
              onBatchExport={handleBatchExport}
              currentUser={currentUser}
            />

            {/* Segment 2 & 3: Data Table / Cards with Sticky Header, Stepper, Badges & Integrated Pagination */}
            <ClosedLoopTable
              tasks={tasks}
              paginatedTasks={paginatedTasks}
              totalFilteredCount={filteredTasks.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              density={density}
              columnVisibility={columnVisibility}
              selectedIds={selectedIds}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleSelectRow={handleToggleSelectRow}
              onViewTaskDetail={(t) => setActiveDetailTask(t)}
              onOpenVerification={(t) => setActiveVerificationTask(t)}
              onOpenDraft={(t) => setActiveDraftTask(t)}
              onOpenApproval={(t) => setActiveApprovalTask(t)}
              onOpenPrint={(t) => setActivePrintTask(t)}
              onNavigateToWorkflowWorkspace={() => setSubTab('workflowWorkspace')}
              onOpenNewReportModal={() => setIsNewReportModalOpen(true)}
            />
          </div>

      </div>
      )}

      {/* Task Progress & Details Modal (点开详情后可以看到闭环流转进度追踪) */}
      <TaskProgressDetailModal
        isOpen={Boolean(activeDetailTask)}
        onClose={() => setActiveDetailTask(null)}
        task={activeDetailTask}
        currentUser={currentUser}
        onOpenVerification={(t) => setActiveVerificationTask(t)}
        onOpenDraft={(t) => setActiveDraftTask(t)}
        onOpenApproval={(t) => setActiveApprovalTask(t)}
        onOpenPrint={(t) => setActivePrintTask(t)}
        onOpenWorkflowWorkspace={() => setSubTab('workflowWorkspace')}
      />

      {/* Feature 1 Modal: 麻醉手术科发起报修申请 */}
      <NewRepairReportModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
        onSubmit={handleCreateReport}
        equipmentList={equipmentList}
        currentUser={currentUser}
      />

      {/* Feature 2 Modal: 设备科现场勘查核验 */}
      {activeVerificationTask && (
        <OnsiteVerificationModal
          isOpen={Boolean(activeVerificationTask)}
          onClose={() => setActiveVerificationTask(null)}
          task={activeVerificationTask}
          onConfirmVerification={handleConfirmVerification}
          currentUser={currentUser}
          onDraftFactoryRepairImmediately={(task) => {
            setActiveVerificationTask(null);
            setActiveDraftTask(task);
          }}
        />
      )}

      {/* Feature 3 Modal: 一键起草返厂维修申请单 */}
      {activeDraftTask && (
        <DraftReturnRepairModal
          isOpen={Boolean(activeDraftTask)}
          onClose={() => setActiveDraftTask(null)}
          task={activeDraftTask}
          onSubmitDraft={handleSubmitDraft}
          currentUser={currentUser}
        />
      )}

      {/* Feature 4 Modal: 设备科主管与分管副院长多级流转审批会签 */}
      {activeApprovalTask && (
        <ApprovalWorkflowModal
          isOpen={Boolean(activeApprovalTask)}
          onClose={() => setActiveApprovalTask(null)}
          task={activeApprovalTask}
          onApproveDept={handleApproveDept}
          onApproveVp={handleApproveVp}
          currentUser={currentUser}
          onOpenPrint={(task) => setActivePrintTask(task)}
          onNavigateToFactoryWorkflow={onNavigateToFactoryWorkflow}
        />
      )}

      {/* Feature 5 Modal: 打印正式红头呈批报告 */}
      {activePrintTask && (
        <PrintReturnDocumentModal
          isOpen={Boolean(activePrintTask)}
          onClose={() => setActivePrintTask(null)}
          task={activePrintTask}
        />
      )}
    </div>
  );
};

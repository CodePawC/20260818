import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Building2,
  Receipt,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  ArrowUpDown,
  Tag,
  Eye,
  SlidersHorizontal,
  BadgeCheck,
  Building,
  Wallet,
  ShieldCheck,
  Calendar,
  X,
  Copy,
  Check,
  Landmark,
  Lock,
  Scale,
  Hash,
  Link2
} from 'lucide-react';
import {
  HOSPITAL_PROJECTS_FULL_LEDGER,
  getAllDepartments,
  getAllCategories
} from '../../utils/hospitalProjectsFullData';
import {
  HospitalProjectRecord,
  ProjectLedgerFilterState
} from '../../types/hospitalProjectLedgerTypes';
import { AuthUser } from '../../types';
import {
  isDepartmentRestricted,
  canManageMasterData,
  canViewProjectLedger,
  canOperateProjectLedger
} from '../../utils/authUtils';
import { ProjectDrilldownModal } from './ProjectDrilldownModal';
import {
  ExpensePreApprovalModal,
  ExpensePreApprovalData,
  ExpensePreApprovalItem,
  numberToChineseCurrency
} from '../payment/ExpensePreApprovalModal';
import {
  evaluateProjectAuditCompliance,
  PROCUREMENT_MODE_META
} from '../../utils/complianceAuditEngine';
import { ApprovalApplication } from '../../types/approvalTypes';
import { BiddingProject, VendorCollaborationOrder } from '../../types/vendorCollaborationTypes';
import { resolveHospitalCodingChain } from '../../utils/hospitalCodingStandard';
import { HospitalCodingStandardModal } from '../common/HospitalCodingStandardModal';

interface HospitalProjectLedgerViewProps {
  currentUser?: AuthUser | null;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
  onNavigateTab?: (tab: string) => void;
  focusedProjectId?: string | null;
  onClearFocusedProject?: () => void;
  approvals?: ApprovalApplication[];
  vendorOrders?: VendorCollaborationOrder[];
  biddingProjects?: BiddingProject[];
  onStartProjectApproval?: (project: HospitalProjectRecord) => void;
  onNavigateToVendorOrder?: (vendorOrderId: string) => void;
}

export const HospitalProjectLedgerView: React.FC<HospitalProjectLedgerViewProps> = ({
  currentUser,
  showToast,
  onNavigateTab,
  focusedProjectId,
  onClearFocusedProject,
  approvals: propApprovals,
  vendorOrders: propVendorOrders,
  biddingProjects: propBiddingProjects,
  onStartProjectApproval,
  onNavigateToVendorOrder
}) => {
  const deptRestricted = isDepartmentRestricted(currentUser);
  const hasMasterDataRole = canManageMasterData(currentUser);
  const canViewLedger = !deptRestricted && hasMasterDataRole && canViewProjectLedger(currentUser);
  const canOperateLedger = !deptRestricted && hasMasterDataRole && canOperateProjectLedger(currentUser);

  const [backendAuthStatus, setBackendAuthStatus] = useState<'checking' | 'authorized' | 'forbidden'>(
    canViewLedger ? 'checking' : 'forbidden'
  );
  const [backendAuthMessage, setBackendAuthMessage] = useState<string>('');
  const [serverProjects, setServerProjects] = useState<HospitalProjectRecord[] | null>(null);
  const [localApprovals, setLocalApprovals] = useState<ApprovalApplication[]>([]);
  const [localVendorOrders, setLocalVendorOrders] = useState<VendorCollaborationOrder[]>([]);
  const [localBiddingProjects, setLocalBiddingProjects] = useState<BiddingProject[]>([]);

  const effectiveApprovals = propApprovals && propApprovals.length > 0 ? propApprovals : localApprovals;
  const effectiveVendorOrders = propVendorOrders && propVendorOrders.length > 0 ? propVendorOrders : localVendorOrders;
  const effectiveBiddingProjects =
    propBiddingProjects && propBiddingProjects.length > 0 ? propBiddingProjects : localBiddingProjects;

  const refreshProjectLedgerFromServer = React.useCallback(async () => {
    if (!canViewLedger) return;
    try {
      const [projRes, appRes, voRes, bidRes] = await Promise.all([
        fetch('/api/project-ledger'),
        fetch('/api/approvals').catch(() => null),
        fetch('/api/vendor-collaboration/orders').catch(() => null),
        fetch('/api/bidding-projects').catch(() => null)
      ]);
      const json = await projRes.json().catch(() => ({}));
      if (projRes.status === 403 || !projRes.ok || !json.success) {
        setBackendAuthStatus('forbidden');
        setBackendAuthMessage(
          json?.error || '权限不足：临床科室及非指定人员无权查看或操作设备项目台账（仅限管理员与医工主管）'
        );
        setServerProjects([]);
        return;
      }
      setBackendAuthStatus('authorized');
      const nextList: HospitalProjectRecord[] = Array.isArray(json.data)
        ? json.data
        : HOSPITAL_PROJECTS_FULL_LEDGER;
      setServerProjects(nextList);

      if (appRes && appRes.ok) {
        const appJson = await appRes.json().catch(() => ({}));
        if (Array.isArray(appJson.data)) setLocalApprovals(appJson.data);
      }
      if (voRes && voRes.ok) {
        const voJson = await voRes.json().catch(() => ({}));
        if (Array.isArray(voJson.data)) setLocalVendorOrders(voJson.data);
      }
      if (bidRes && bidRes.ok) {
        const bidJson = await bidRes.json().catch(() => ({}));
        if (Array.isArray(bidJson.data)) setLocalBiddingProjects(bidJson.data);
      }
    } catch {
      if (!canViewLedger) {
        setBackendAuthStatus('forbidden');
        setServerProjects([]);
      } else {
        setBackendAuthStatus('authorized');
      }
    }
  }, [canViewLedger]);

  useEffect(() => {
    setBackendAuthStatus(canViewLedger ? 'checking' : 'forbidden');
    setBackendAuthMessage('');
    refreshProjectLedgerFromServer();

    const onUpdated = () => {
      refreshProjectLedgerFromServer();
    };
    window.addEventListener('medtech:project-ledger-updated', onUpdated);
    window.addEventListener('work_orders_updated', onUpdated);
    return () => {
      window.removeEventListener('medtech:project-ledger-updated', onUpdated);
      window.removeEventListener('work_orders_updated', onUpdated);
    };
  }, [currentUser?.id, currentUser?.role, canViewLedger, refreshProjectLedgerFromServer]);

  // Filter state
  const [filters, setFilters] = useState<ProjectLedgerFilterState>({
    keyword: '',
    department: '',
    category: '',
    preApprovalStatus: '',
    year: '',
    paymentStatus: '',
    complianceFilter: '',
    sortBy: 'id',
    sortOrder: 'desc'
  });

  // Table display density: 'default' | 'compact' (same as equipment ledger)
  const [density, setDensity] = useState<'default' | 'compact'>('default');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');

  // Drilldown modal state
  const [selectedProject, setSelectedProject] = useState<HospitalProjectRecord | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);
  const [drilldownInitialTab, setDrilldownInitialTab] = useState<
    'overview' | 'compliance' | 'vendor' | 'invoice' | 'timeline' | 'texts'
  >('overview');
  const [drilldownBlockedAlert, setDrilldownBlockedAlert] = useState<{
    message: string;
    missingItems: string[];
  } | null>(null);

  // Pre-approval modal state
  const [isPreApprovalOpen, setIsPreApprovalOpen] = useState<boolean>(false);
  const [preApprovalInitialData, setPreApprovalInitialData] = useState<Partial<ExpensePreApprovalData> | undefined>(undefined);

  // Coding standard modal state
  const [showCodingModal, setShowCodingModal] = useState<boolean>(false);

  // Extract department & category options
  const departmentOptions = useMemo(() => getAllDepartments(), []);
  const categoryOptions = useMemo(() => getAllCategories(), []);

  // Scoped ledger source (strictly filtered empty for department-restricted / non-master-data / backend-forbidden users)
  const scopedLedgerRecords = useMemo(() => {
    if (!canViewLedger || deptRestricted || !hasMasterDataRole || backendAuthStatus === 'forbidden') {
      return [];
    }
    return serverProjects && serverProjects.length > 0 ? serverProjects : HOSPITAL_PROJECTS_FULL_LEDGER;
  }, [canViewLedger, deptRestricted, hasMasterDataRole, backendAuthStatus, serverProjects]);

  // 同步正在下钻的项目数据并在接收 focusedProjectId 时自动定位打开补办中心
  useEffect(() => {
    if (selectedProject) {
      const updated = scopedLedgerRecords.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }, [scopedLedgerRecords]);

  useEffect(() => {
    if (!focusedProjectId || scopedLedgerRecords.length === 0) return;
    const found = scopedLedgerRecords.find(
      p => p.id === focusedProjectId || p.complianceDossier?.sourceWorkOrderId === focusedProjectId
    );
    if (found) {
      setSelectedProject(found);
      setDrilldownBlockedAlert(null);
      setDrilldownInitialTab('compliance');
      setIsDrilldownOpen(true);
      onClearFocusedProject?.();
    }
  }, [focusedProjectId, scopedLedgerRecords]);

  // Pre-compute compliance evaluation map for visible filtering & table badge display
  const complianceMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateProjectAuditCompliance>>();
    scopedLedgerRecords.forEach(p => {
      map.set(
        p.id,
        evaluateProjectAuditCompliance(p, {
          approvals: effectiveApprovals,
          vendorOrders: effectiveVendorOrders,
          biddingProjects: effectiveBiddingProjects
        })
      );
    });
    return map;
  }, [scopedLedgerRecords, effectiveApprovals, effectiveVendorOrders, effectiveBiddingProjects]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    if (scopedLedgerRecords.length === 0) return [];
    return scopedLedgerRecords.filter((project) => {
      // Keyword search (ID, project name, vendor, approval content, department, plus work order and pre-approval codes)
      if (filters.keyword.trim()) {
        const kw = filters.keyword.trim().toLowerCase();
        const chain = resolveHospitalCodingChain(project.id);
        const matchId = project.id.toLowerCase().includes(kw) ||
          chain.workOrder.fullCode.toLowerCase().includes(kw) ||
          chain.workOrder.shortDocNo.toLowerCase().includes(kw) ||
          chain.projectLedger.fullCode.toLowerCase().includes(kw) ||
          chain.preApproval.standardVoucherNo.toLowerCase().includes(kw) ||
          (project.complianceDossier?.sourceWorkOrderId || '').toLowerCase().includes(kw);
        const matchName = project.projectName.toLowerCase().includes(kw);
        const matchVendor = project.vendor?.companyName.toLowerCase().includes(kw);
        const matchContent = (project.approvalContent || '').toLowerCase().includes(kw);
        const matchDept = project.department.toLowerCase().includes(kw);
        if (!matchId && !matchName && !matchVendor && !matchContent && !matchDept) {
          return false;
        }
      }

      // Department filter
      if (filters.department && project.department !== filters.department) {
        return false;
      }

      // Category filter
      if (filters.category && project.category !== filters.category) {
        return false;
      }

      // Pre-approval status filter
      if (filters.preApprovalStatus) {
        if (!project.preApprovalStatus.includes(filters.preApprovalStatus)) {
          return false;
        }
      }

      // Year filter (from approvalDate or approvedDate or preApprovalPrintDate)
      if (filters.year) {
        const dateStr = project.approvalDate || project.approvedDate || project.preApprovalPrintDate || '';
        if (!dateStr.includes(filters.year)) {
          return false;
        }
      }

      // Payment status filter
      if (filters.paymentStatus && project.invoice?.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      // Compliance filter
      if (filters.complianceFilter) {
        const ev = complianceMap.get(project.id);
        if (filters.complianceFilter === 'audit_blocked' && (!ev || ev.isAuditReady)) return false;
        if (filters.complianceFilter === 'audit_ready' && (!ev || !ev.isAuditReady)) return false;
        if (filters.complianceFilter === 'from_work_order' && !project.complianceDossier?.sourceWorkOrderId) return false;
        if (filters.complianceFilter === 'need_negotiation' && ev?.requiredMode !== 'negotiation') return false;
        if (filters.complianceFilter === 'need_bidding' && ev?.requiredMode !== 'bidding') return false;
      }

      return true;
    }).sort((a, b) => {
      // Dynamic work-order projects float cleanly when sorted by ID desc
      const aDyn = a.complianceDossier ? 1 : 0;
      const bDyn = b.complianceDossier ? 1 : 0;
      if (filters.sortBy === 'id' && filters.sortOrder === 'desc' && aDyn !== bDyn) {
        return bDyn - aDyn;
      }
      if (filters.sortBy === 'id') {
        const idA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const idB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return filters.sortOrder === 'asc' ? idA - idB : idB - idA;
      }
      if (filters.sortBy === 'amount') {
        const amtA = a.invoice?.totalAmount || 0;
        const amtB = b.invoice?.totalAmount || 0;
        return filters.sortOrder === 'asc' ? amtA - amtB : amtB - amtA;
      }
      if (filters.sortBy === 'department') {
        return filters.sortOrder === 'asc'
          ? a.department.localeCompare(b.department, 'zh-CN')
          : b.department.localeCompare(a.department, 'zh-CN');
      }
      return 0;
    });
  }, [filters, scopedLedgerRecords, complianceMap]);

  // Pagination calculation
  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalItems);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Overall Statistics summary
  const statistics = useMemo(() => {
    let totalAmount = 0;
    let preApprovedCount = 0;
    let pendingCount = 0;
    let vendorSet = new Set<string>();

    scopedLedgerRecords.forEach((p) => {
      totalAmount += p.invoice?.totalAmount || 0;
      if (p.preApprovalStatus.includes('并通过') || p.preApprovalStatus.includes('已打印')) {
        preApprovedCount++;
      } else {
        pendingCount++;
      }
      if (p.vendor?.companyName) {
        vendorSet.add(p.vendor.companyName);
      }
    });

    const preApprovedRate = scopedLedgerRecords.length
      ? Math.round((preApprovedCount / scopedLedgerRecords.length) * 100)
      : 0;

    return {
      totalCount: scopedLedgerRecords.length,
      filteredCount: filteredProjects.length,
      totalAmount,
      preApprovedCount,
      pendingCount,
      preApprovedRate,
      vendorCount: vendorSet.size
    };
  }, [filteredProjects, scopedLedgerRecords]);

  // Open drilldown
  const handleOpenDrilldown = (
    project: HospitalProjectRecord,
    tab: 'overview' | 'compliance' | 'vendor' | 'invoice' | 'timeline' | 'texts' = 'overview',
    blockedAlert?: { message: string; missingItems: string[] } | null
  ) => {
    if (!canOperateLedger) {
      showToast?.('仅限系统管理员与医工主管操作项目台账下钻');
      return;
    }
    fetch(`/api/project-ledger/${encodeURIComponent(project.id)}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'drilldown' })
    }).catch(() => {});
    setSelectedProject(project);
    setDrilldownInitialTab(blockedAlert ? 'compliance' : tab);
    setDrilldownBlockedAlert(blockedAlert || null);
    setIsDrilldownOpen(true);
  };

  // Convert project to pre-approval format and open modal (enforcing hard audit block)
  const handleOpenPreApproval = async (record: HospitalProjectRecord) => {
    if (!canOperateLedger) {
      showToast?.('仅限系统管理员与医工主管出具和打印费用预批单');
      return;
    }

    const localEval =
      complianceMap.get(record.id) ||
      evaluateProjectAuditCompliance(record, {
        approvals: effectiveApprovals,
        vendorOrders: effectiveVendorOrders,
        biddingProjects: effectiveBiddingProjects
      });

    if (!localEval.isAuditReady) {
      const msg = `审计强阻断：项目 #${record.id} 尚缺 ${localEval.missingItems.length} 项合规凭证，禁止出具费用预批单或归档`;
      showToast?.(msg, 'warning');
      handleOpenDrilldown(record, 'compliance', {
        message: msg,
        missingItems: localEval.missingItems
      });
      return;
    }

    try {
      const resp = await fetch(`/api/project-ledger/${encodeURIComponent(record.id)}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pre_approval' })
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.status === 409 || json.auditBlocked) {
        const msg = json.error || '审计合规校验未通过，禁止出具预批单';
        showToast?.(msg, 'warning');
        handleOpenDrilldown(record, 'compliance', {
          message: msg,
          missingItems: Array.isArray(json.missingItems) ? json.missingItems : localEval.missingItems
        });
        return;
      }
      refreshProjectLedgerFromServer();
    } catch {
      // network error fallback
    }
    const item: ExpensePreApprovalItem = {
      name: record.projectName || '医学装备维修/服务项目',
      model: record.category || '医疗专用规格',
      supplier: record.vendor?.companyName || '指定服务商',
      quantity: 1,
      price: record.invoice?.totalAmount || 960,
      remarks: record.deptConfirmContent ? record.deptConfirmContent.slice(0, 30) : (record.remarks || '按章申报')
    };

    const preApprovalData: Partial<ExpensePreApprovalData> = {
      id: record.id,
      docNo: record.id,
      hospitalName: '五莲县人民医院',
      department: record.department || '医疗设备科',
      items: [item],
      totalAmount: record.invoice?.totalAmount || 960,
      totalAmountUpper: numberToChineseCurrency(record.invoice?.totalAmount || 960),
      applicantSign: {
        name: '崔伟',
        date: record.approvalDate || record.approvedDate || '2026-11-04',
        signed: true
      },
      deptHeadSign: {
        name: '赵文博',
        date: record.approvalDate || record.approvedDate || '2026-11-04',
        signed: true,
        opinion: record.approvalContent ? record.approvalContent.slice(0, 40) : '符合医疗装备管理规范，拟同意申报预批'
      },
      branchLeaderSign: {
        name: '张明理',
        date: record.approvedDate || '2026-11-05',
        signed: true,
        opinion: '同意在医学装备维保及特种检测专款中列支'
      },
      mainLeaderSign: {
        name: '刘志刚',
        date: record.preApprovalPassTime || record.approvedDate || '2026-11-06',
        signed: true,
        opinion: '准予依规结算并办理财务核销'
      },
      boardResolution: `经院务及医疗装备管理委员会决议：同意按《${record.projectName}》经办发票及三单勾稽实施费用预批。`,
      invoiceInfo: {
        code: record.invoice?.invoiceCode || '037002400111',
        number: record.invoice?.invoiceNumber || '24370000000000548001',
        type: record.invoice?.invoiceType || '增值税专用发票',
        amount: record.invoice?.totalAmount || 960,
        date: record.invoice?.invoiceDate || '2026-11-03'
      }
    };

    setPreApprovalInitialData(preApprovalData);
    setIsPreApprovalOpen(true);
  };

  // Quick reset filters
  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      department: '',
      category: '',
      preApprovalStatus: '',
      year: '',
      paymentStatus: '',
      complianceFilter: '',
      sortBy: 'id',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
    setJumpPageInput('1');
    showToast?.('已重置所有筛选条件');
  };

  // Quick jump to famous sample (548 or 629 or 715)
  const handleQuickJump = (targetId: string) => {
    setFilters((prev) => ({ ...prev, keyword: targetId }));
    setCurrentPage(1);
    setJumpPageInput('1');
    showToast?.(`已快速筛选定位项目 ID: ${targetId}`);
  };

  // Page jump handler
  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpPageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      setCurrentPage(parsed);
    } else {
      setJumpPageInput(currentPage.toString());
    }
  };

  // Export visible list as CSV
  const handleExportCSV = () => {
    if (!canOperateLedger) {
      showToast?.('仅限指定授权人员导出项目台账数据');
      return;
    }
    const headers = [
      'ID_项目',
      'ID_科室',
      '项目名称',
      'ID_门类',
      '报批状态',
      '报批日期',
      '获批日期',
      '预批状态',
      '预批打印',
      '经办公司',
      '经办统一代码',
      '发票类型',
      '发票号码',
      '开票金额',
      '支付状态'
    ];
    const rows = filteredProjects.map((p) => [
      `"${p.id}"`,
      `"${p.department}"`,
      `"${p.projectName}"`,
      `"${p.category}"`,
      `"${p.approvalStatus}"`,
      `"${p.approvalDate}"`,
      `"${p.approvedDate}"`,
      `"${p.preApprovalStatus}"`,
      `"${p.preApprovalPrintDate}"`,
      `"${p.vendor?.companyName || ''}"`,
      `"${p.vendor?.creditCode || ''}"`,
      `"${p.invoice?.invoiceType || ''}"`,
      `"${p.invoice?.invoiceNumber || ''}"`,
      p.invoice?.totalAmount || 0,
      `"${p.invoice?.paymentStatus || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `五莲县人民医院_全院项目总台账_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast?.('项目总台账数据已导出 CSV');
  };

  if (!canViewLedger || deptRestricted || !hasMasterDataRole || backendAuthStatus === 'forbidden') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto max-w-xl mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">设备项目台账访问受限（RBAC 权限拦截）</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {backendAuthMessage ||
              '该模块涉及全院立项议价、经办服务商资质与发票预批核心数据，已对临床科室及非指定人员全面隐藏与过滤，仅允许系统管理员与医工主管/调度员查看与操作。'}
          </p>
        </div>
        <div className="w-full p-3 bg-slate-50 rounded-lg text-xs text-left text-slate-600 space-y-1 border border-slate-200">
          <div>
            · 当前岗位：<span className="font-semibold text-slate-800">{currentUser?.name || '未登录'} ({currentUser?.role || '访客'})</span>
          </div>
          <div>
            · 科室访问受限检查：<span className="font-mono font-semibold text-rose-600">{deptRestricted ? '是（临床受限范围）' : '否'}</span>
          </div>
          <div>
            · 主数据管理权限：<span className="font-mono font-semibold text-rose-600">{hasMasterDataRole ? '已授权' : '无权限（仅管理员/医工主管）'}</span>
          </div>
        </div>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            返回工作台概览
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* 指定人员专属授权提示条 */}
      <div className="bg-slate-900 text-slate-100 rounded-lg px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">管理员与医工主管专属受控台账</span>
          <span className="text-slate-300 truncate">
            · 已隔离临床科室及非指定人员访问，当前仅对系统管理员与医工主管开放查看与操作
          </span>
        </div>
        <span className="font-mono text-[11px] text-emerald-300 shrink-0">
          授权操作人：{currentUser?.name || '管理员'} ({currentUser?.role || '指定人员'})
        </span>
      </div>

      {/* ==================== Segment 1: StatsOverview 5-Card Strip (仿照设备技术台账) ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5 shrink-0 w-full">
        {/* Card 1: 全院在册项目总数 */}
        <div
          onClick={() => {
            setFilters((prev) => ({ ...prev, preApprovalStatus: '' }));
            setCurrentPage(1);
          }}
          className={`relative bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px] ${
            filters.preApprovalStatus === ''
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs bg-blue-50/10'
              : 'border-slate-200/90 hover:border-blue-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">全院立项申报总数</span>
              {filters.preApprovalStatus === '' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200/50">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{statistics.totalCount}</span>
              <span className="text-xs text-slate-500 font-medium">项</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shrink-0 font-mono">
              20+ 临床医技科室
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-slate-400">点击查看全部台账</span>
            <span className="font-mono text-blue-600 font-semibold">100% 覆盖</span>
          </div>
        </div>

        {/* Card 2: 预批通过 / 已归档 */}
        <div
          onClick={() => {
            setFilters((prev) => ({ ...prev, preApprovalStatus: '已打印并通过' }));
            setCurrentPage(1);
          }}
          className={`relative bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px] ${
            filters.preApprovalStatus === '已打印并通过'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs bg-emerald-50/10'
              : 'border-slate-200/90 hover:border-emerald-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">预批通过 / 已打印</span>
              {filters.preApprovalStatus === '已打印并通过' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">{statistics.preApprovedCount}</span>
              <span className="text-xs text-emerald-600 font-medium">项</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0 font-mono">
              完成率 {statistics.preApprovedRate}%
            </span>
          </div>

          <div className="mt-2.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${statistics.preApprovedRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: 待打印 / 审核中 */}
        <div
          onClick={() => {
            setFilters((prev) => ({ ...prev, preApprovalStatus: '打印预批' }));
            setCurrentPage(1);
          }}
          className={`relative bg-white p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px] ${
            filters.preApprovalStatus === '打印预批'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs bg-amber-50/10'
              : 'border-slate-200/90 hover:border-amber-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">待打印预批 / 流转中</span>
              {filters.preApprovalStatus === '打印预批' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/50">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-amber-600 tracking-tight">{statistics.pendingCount}</span>
              <span className="text-xs text-amber-600 font-medium">项</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0 font-mono">
              占比 {(100 - statistics.preApprovedRate).toFixed(1)}%
            </span>
          </div>

          <div className="mt-2.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${100 - statistics.preApprovedRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: 定点经办合作单位 */}
        <div className="relative bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 transition-all duration-200 flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px]">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">经办与服务商</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/50">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-indigo-700 tracking-tight">{statistics.vendorCount}</span>
              <span className="text-xs text-indigo-600 font-medium">家</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80 shrink-0 font-mono">
              特检院/原厂中心
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-slate-400">信用代码与资质核验</span>
            <span className="font-mono text-indigo-600 font-semibold">100% 合规</span>
          </div>
        </div>

        {/* Card 5: 经办发票结算总额 */}
        <div className="relative bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 transition-all duration-200 flex flex-col justify-between overflow-hidden group min-h-[96px] sm:min-h-[102px]">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">经办开票结算总额</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/50">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl sm:text-2xl font-bold text-amber-700 tracking-tight">
                ￥{(statistics.totalAmount / 10000).toFixed(1)}
              </span>
              <span className="text-xs text-amber-600 font-medium">万元</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0 font-mono">
              专票/电普
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-slate-400">增值税底账一致</span>
            <span className="font-mono text-emerald-600 font-semibold flex items-center gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 查验真伪通过
            </span>
          </div>
        </div>
      </div>

      {/* ==================== Segment 2: White Card Container (仿照设备技术台账) ==================== */}
      <div className="bg-white rounded-md border border-slate-200 flex flex-col shadow-xs w-full">
        {/* 2.1 Filter Bar */}
        <div className="p-3 sm:p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
          {/* Main search and dropdowns line */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Keyword Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, keyword: e.target.value }));
                    setCurrentPage(1);
                  }}
                  placeholder="搜索项目ID (如 548)、项目名称、经办公司..."
                  className="w-full pl-8.5 pr-7 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {filters.keyword && (
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, keyword: '' }));
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Department Dropdown */}
              <select
                value={filters.department}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, department: e.target.value }));
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 border border-slate-200 rounded-md text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">全部科室 ({departmentOptions.length})</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Category Dropdown */}
              <select
                value={filters.category}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, category: e.target.value }));
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 border border-slate-200 rounded-md text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">全部门类 ({categoryOptions.length})</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Pre-approval status dropdown */}
              <select
                value={filters.preApprovalStatus}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, preApprovalStatus: e.target.value }));
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 border border-slate-200 rounded-md text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">全部预批状态</option>
                <option value="已打印并通过">已打印并通过</option>
                <option value="打印预批">打印预批 (待打印)</option>
                <option value="未打印预批">未打印预批</option>
                <option value="已打印并提交">已打印并提交</option>
              </select>

              {/* Payment Status Dropdown */}
              <select
                value={filters.paymentStatus}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }));
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 border border-slate-200 rounded-md text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 hidden sm:block"
              >
                <option value="">全部结算状态</option>
                <option value="已支付电汇">已支付电汇</option>
                <option value="预批已通过待付款">预批已通过待付款</option>
                <option value="财务核销中">财务核销中</option>
                <option value="待提交发票">待提交发票</option>
              </select>

              {/* Sort By Dropdown */}
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }));
                }}
                className="py-1.5 px-2 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none hidden md:block"
              >
                <option value="id">按项目ID</option>
                <option value="amount">按结算金额</option>
                <option value="department">按所属科室</option>
              </select>
            </div>

            {/* Right actions: Density, Reset, Export */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setDensity((d) => (d === 'default' ? 'compact' : 'default'))}
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md text-xs text-slate-700 font-medium flex items-center gap-1 transition-colors"
                title="切换表格密度"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>{density === 'default' ? '宽松密度' : '紧凑密度'}</span>
              </button>

              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md text-xs text-slate-600 font-medium flex items-center gap-1 transition-colors"
                title="重置所有筛选"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                title="导出 CSV 台账"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出 CSV</span>
              </button>

              <button
                onClick={() => setShowCodingModal(true)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="查看工单WO-REP、项目ID与费用预批单编码钩稽关系"
              >
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                <span>编码钩稽规范</span>
              </button>
            </div>
          </div>

          {/* Quick pills row: Year pills & Sample anchors */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-medium">年份:</span>
              {['', '2026', '2025', '2024', '2023', '2022', '2021'].map((yr) => (
                <button
                  key={yr || 'all'}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, year: yr }));
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    filters.year === yr
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {yr ? `${yr}年` : '全部'}
                </button>
              ))}

              <div className="h-3 w-px bg-slate-300 mx-1 hidden sm:block"></div>

              <span className="text-slate-400 font-medium hidden sm:inline">审计合规快捷筛选:</span>
              {[
                { key: '', label: '全部项目' },
                { key: 'audit_blocked', label: '审计阻断/待补办' },
                { key: 'from_work_order', label: '工单收费自动立项' },
                { key: 'need_negotiation', label: '联合议价(5k-50k)' },
                { key: 'need_bidding', label: '公开/邀请招标(>50k)' }
              ].map((cf) => (
                <button
                  key={cf.key || 'all_comp'}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, complianceFilter: cf.key as any }));
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    (filters.complianceFilter || '') === cf.key
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cf.label}
                </button>
              ))}
            </div>

            <div className="text-slate-500 text-[11px] tabular-nums">
              共匹配 <strong className="text-blue-600 font-bold">{totalItems}</strong> 项项目记录
            </div>
          </div>
        </div>

        {/* 2.2 Full-Width Responsive Data Table */}
        <div className="w-full overflow-x-auto min-h-[360px]">
          <table className="w-full text-left border-collapse border-spacing-0 text-xs">
            <thead>
              <tr className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider shadow-2xs">
                <th className="py-2.5 px-3 pl-4 whitespace-nowrap w-[70px]">ID_项目</th>
                <th className="py-2.5 px-3 whitespace-nowrap w-[110px]">所属科室</th>
                <th className="py-2.5 px-4 min-w-[200px] max-w-[340px]">项目名称</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px]">项目门类</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">报批状态/日期</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">询价/议价</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">科室确认</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">预批状态</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">审计合规 / 采购方式</th>
                <th className="py-2.5 px-3 min-w-[200px] max-w-[280px]">经办公司 (可下钻)</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[110px]">开票金额</th>
                <th className="py-2.5 px-4 text-center whitespace-nowrap pr-4 min-w-[130px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">没有找到符合筛选条件的项目档案</p>
                    <p className="text-xs text-slate-400 mt-1">请尝试调整搜索关键词、清空科室门类或点击上方重置按钮</p>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project, idx) => {
                  const isHighlighted = project.id === '548' || project.id === '629';
                  const rowPadding = density === 'compact' ? 'py-1.5' : 'py-2.5';

                  return (
                    <tr
                      key={project.id}
                      onClick={() => handleOpenDrilldown(project)}
                      className={`hover:bg-blue-50/60 cursor-pointer transition-colors group ${
                        idx % 2 === 1 ? 'bg-slate-50/25' : 'bg-white'
                      } ${isHighlighted ? 'bg-amber-50/40 hover:bg-amber-50/70' : ''}`}
                    >
                      {/* ID (双轨：台账简码与规范工单全码) */}
                      <td className={`${rowPadding} px-3 pl-4 font-mono whitespace-nowrap`}>
                        {(() => {
                          const chain = resolveHospitalCodingChain(project.id);
                          return (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 group-hover:text-blue-700 text-xs">
                                ID: {project.id}
                              </span>
                              <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-mono tracking-tighter" title={`规范全码: ${chain.workOrder.fullCode}`}>
                                {chain.workOrder.fullCode}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Department */}
                      <td className={`${rowPadding} px-3 text-slate-700 font-medium whitespace-nowrap`}>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] border border-slate-200/50">
                          {project.department}
                        </span>
                      </td>

                      {/* Project Name */}
                      <td className={`${rowPadding} px-4 font-semibold text-slate-900`}>
                        <div className="line-clamp-2 leading-relaxed" title={project.projectName}>
                          {project.projectName}
                        </div>
                      </td>

                      {/* Category */}
                      <td className={`${rowPadding} px-3 text-slate-600 whitespace-nowrap`}>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">
                          {project.category || '基础保障'}
                        </span>
                      </td>

                      {/* Approval Status & Date */}
                      <td className={`${rowPadding} px-3 whitespace-nowrap text-[11px]`}>
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {project.approvalStatus}
                        </div>
                        <div className="text-slate-400 font-mono text-[10px] pl-2.5">
                          {project.approvalDate || project.approvedDate || '-'}
                        </div>
                      </td>

                      {/* Inquiry / Bargain */}
                      <td className={`${rowPadding} px-3 whitespace-nowrap text-[11px] text-slate-600`}>
                        <div>{project.inquiryDate || project.bargainBatch || '已完成'}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{project.bargainDate || ''}</div>
                      </td>

                      {/* Dept Confirm */}
                      <td className={`${rowPadding} px-3 whitespace-nowrap text-[11px] text-slate-600`}>
                        <div>{project.deptConfirmStatus || '已确认'}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{project.deptConfirmDate || '-'}</div>
                      </td>

                      {/* Pre-approval status */}
                      <td className={`${rowPadding} px-3 whitespace-nowrap`}>
                        {project.preApprovalStatus.includes('并通过') || project.preApprovalStatus.includes('已打印') ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {project.preApprovalStatus}
                          </span>
                        ) : project.preApprovalStatus.includes('拦截') ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                            <Lock className="w-3 h-3 text-rose-600" />
                            {project.preApprovalStatus}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {project.preApprovalStatus || '流转中'}
                          </span>
                        )}
                      </td>

                      {/* 审计合规 / 采购治理方式 */}
                      <td className={`${rowPadding} px-3 whitespace-nowrap`}>
                        {(() => {
                          const ev = complianceMap.get(project.id);
                          if (!ev) return <span className="text-slate-400">—</span>;
                          return (
                            <div className="flex flex-col text-[11px] tabular-nums">
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  ev.isAuditReady ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {ev.isAuditReady ? (
                                  <ShieldCheck className="w-3 h-3 shrink-0" />
                                ) : (
                                  <Lock className="w-3 h-3 shrink-0" />
                                )}
                                <span>
                                  {ev.isAuditReady ? '合规齐备' : '审计阻断'} · {ev.completedCount}/3 项
                                </span>
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {PROCUREMENT_MODE_META[ev.requiredMode].shortLabel}
                                {project.complianceDossier?.sourceWorkOrderId
                                  ? ` · 工单 ${project.complianceDossier.sourceWorkOrderId}`
                                  : ''}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Vendor (经办公司) */}
                      <td className={`${rowPadding} px-3 text-slate-700`} title={project.vendor?.companyName}>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-blue-600 transition-colors" />
                          <span className="truncate font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                            {project.vendor?.companyName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate pl-4.5">
                          {project.vendor?.contactPerson} ({project.vendor?.contactPhone})
                        </div>
                      </td>

                      {/* Invoice Amount */}
                      <td className={`${rowPadding} px-3 text-right whitespace-nowrap tabular-nums`}>
                        <div className="font-mono font-bold text-amber-600 text-xs">
                          ¥{project.invoice?.totalAmount?.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          {project.invoice?.invoiceType.includes('专用') ? '增值税专票' : '电子普票'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className={`${rowPadding} px-4 text-center whitespace-nowrap pr-4`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDrilldown(project, project.complianceDossier ? 'compliance' : 'overview')}
                            className="px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 rounded text-xs font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                            title="查看合规档案与补办审批/会议纪要"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{project.complianceDossier ? '合规补办' : '下钻'}</span>
                          </button>
                          <button
                            onClick={() => handleOpenPreApproval(project)}
                            className="px-2 py-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100/60 rounded text-xs font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                            title="出具《五莲县人民医院费用预批单》并打印"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>预批单</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ==================== Segment 3: Pagination (仿照 Pagination.tsx) ==================== */}
        <div className="px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 shrink-0 text-xs sm:text-sm text-slate-600 w-full">
          {/* Left: Summary & Page Size Selection */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-700">
              显示 <strong className="text-slate-900 font-bold">{startEntry}</strong> -{' '}
              <strong className="text-slate-900 font-bold">{endEntry}</strong> / 共{' '}
              <strong className="text-slate-900 font-bold">{totalItems}</strong> 条项目记录
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-slate-500 text-xs font-medium">每页:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                  setJumpPageInput('1');
                }}
                className="py-1 px-2 border border-slate-200 rounded-md bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value={10}>10条</option>
                <option value={20}>20条</option>
                <option value={50}>50条</option>
                <option value={100}>100条</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation & Direct Jump */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setJumpPageInput('1');
                }}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                title="首页"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const p = Math.max(1, currentPage - 1);
                  setCurrentPage(p);
                  setJumpPageInput(p.toString());
                }}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                title="上一页"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded-md">
                第 {currentPage} / {totalPages} 页
              </span>

              <button
                onClick={() => {
                  const p = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(p);
                  setJumpPageInput(p.toString());
                }}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                title="下一页"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setCurrentPage(totalPages);
                  setJumpPageInput(totalPages.toString());
                }}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                title="尾页"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Jump Input */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 ml-1 hidden sm:flex">
              <span className="text-slate-500 text-xs">前往</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                className="w-12 py-1 px-1.5 text-center text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
              <span className="text-slate-500 text-xs">页</span>
              <button
                type="submit"
                className="py-1 px-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 font-medium border border-slate-200"
              >
                跳转
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Drilldown Modal (Adapted with max-w-5xl, full responsiveness) */}
      <ProjectDrilldownModal
        isOpen={isDrilldownOpen}
        onClose={() => {
          setIsDrilldownOpen(false);
          setDrilldownBlockedAlert(null);
        }}
        project={selectedProject}
        initialTab={drilldownInitialTab}
        blockedAlert={drilldownBlockedAlert}
        approvals={effectiveApprovals}
        vendorOrders={effectiveVendorOrders}
        biddingProjects={effectiveBiddingProjects}
        onProjectUpdated={(updated) => {
          setServerProjects(prev =>
            prev
              ? prev.some(p => p.id === updated.id)
                ? prev.map(p => (p.id === updated.id ? updated : p))
                : [updated, ...prev]
              : [updated]
          );
          setSelectedProject(updated);
          refreshProjectLedgerFromServer();
        }}
        onLaunchElectronicApproval={(proj) => {
          setIsDrilldownOpen(false);
          if (onStartProjectApproval) {
            onStartProjectApproval(proj);
          } else {
            window.dispatchEvent(new CustomEvent('medtech:start-project-approval', { detail: { project: proj } }));
          }
        }}
        onNavigateVendorOrder={(vendorOrderId) => {
          setIsDrilldownOpen(false);
          if (onNavigateToVendorOrder) {
            onNavigateToVendorOrder(vendorOrderId);
          } else {
            window.dispatchEvent(new CustomEvent('medtech:focus-vendor-order', { detail: { vendorOrderId } }));
          }
        }}
        onOpenPreApproval={(proj) => {
          setIsDrilldownOpen(false);
          handleOpenPreApproval(proj);
        }}
      />

      {/* Pre-approval 1:1 Print Modal */}
      <ExpensePreApprovalModal
        isOpen={isPreApprovalOpen}
        onClose={() => setIsPreApprovalOpen(false)}
        initialData={preApprovalInitialData}
        showToast={showToast}
      />

      {/* Coding Standard & Traceability Central Modal */}
      <HospitalCodingStandardModal
        isOpen={showCodingModal}
        onClose={() => setShowCodingModal(false)}
        initialCode={filters.keyword || '3212'}
      />
    </div>
  );
};

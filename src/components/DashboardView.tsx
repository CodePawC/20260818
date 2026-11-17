import React, { useState, useEffect, useMemo } from 'react';
import {
  MedicalEquipment,
  SystemStats,
  AuthUser,
  ActiveTab
} from '../types';
import {
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  FileCheck2,
  FileText,
  Wrench,
  X
} from 'lucide-react';
import { EngineeringWorkOrder, BiomedicalEngineerProfile, OutsourcedDispatchMeta } from '../types/dispatchTypes';
import { ImmediateReconciliationItem } from './ImmediateReconciliationPanel';
import { RepairAlertPopupModal, RepairAlertData } from './RepairAlertPopupModal';
import { RepairReportDetailModal, RepairReportDetailData } from './RepairReportDetailModal';
import { DispatchAssignModal } from './DispatchAssignModal';
import { FieldOperationModal } from './FieldOperationModal';
import { ClinicalAcceptanceModal } from './ClinicalAcceptanceModal';
import { RoleTodayFocusCard } from './RoleTodayFocusCard';
import {
  DEFAULT_BIOMEDICAL_ENGINEERS,
  sortWorkOrdersNewestFirst,
  buildVendorOrderFromWorkOrder,
  upsertVendorCollaborationOrder
} from '../utils/dispatchData';
import { MonthlyFrameworkBatch } from '../types/vendorCollaborationTypes';
import { getMonthlyFrameworkBatches } from '../utils/monthlyFrameworkData';
import {
  WorkScheduleItem,
  loadScheduleItems,
  saveScheduleItems
} from '../utils/scheduleData';
import { getRoleBadgeStyle } from '../utils/staffRolesData';
import {
  isHeadNurse,
  isClinicalStaff,
  getUserDepartment,
  canDispatchWorkOrder,
  canInitiateRepair,
  canAccessTab
} from '../utils/authUtils';
import { resolveRoleArchetype, RoleArchetype } from '../utils/rbacPolicy';
import { ApprovalApplication } from '../types/approvalTypes';
import {
  BorrowedDeviceEntry,
  RoleHomepageCommonProps
} from './homepages/RoleHomeSharedTypes';
import { ClinicalNurseHomeView } from './homepages/ClinicalNurseHomeView';
import { ClinicalDirectorHomeView } from './homepages/ClinicalDirectorHomeView';
import { EngineeringSupervisorHomeView } from './homepages/EngineeringSupervisorHomeView';
import { FieldEngineerHomeView } from './homepages/FieldEngineerHomeView';
import { SystemAdminHomeView } from './homepages/SystemAdminHomeView';
import { FinancialHomeView } from './homepages/FinancialHomeView';
import { ExecutiveHomeView } from './homepages/ExecutiveHomeView';
import { VendorHomeView } from './homepages/VendorHomeView';

export interface DashboardViewProps {
  stats: SystemStats;
  equipmentList: MedicalEquipment[];
  allEquipmentList?: MedicalEquipment[];
  departmentOptions?: string[];
  currentUser?: AuthUser | null;
  approvalApplications?: ApprovalApplication[];
  onNavigateToLedger: (statusFilter?: string, departmentFilter?: string) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onNavigateToApprovals?: (data?: Partial<ApprovalApplication>) => void;
  onOpenAddModal: () => void;
  onOpenRepairModal: (device?: MedicalEquipment) => void;
  onOpenAiModal: (device?: MedicalEquipment) => void;
  onOpenStatusModal: (device: MedicalEquipment) => void;
  onSelectDeviceDetail: (device: MedicalEquipment) => void;
  onBorrowEquipment?: (device: MedicalEquipment) => void;
  onReturnEquipment?: (device: MedicalEquipment) => void;
  onOpenOfficialReport?: (device?: MedicalEquipment, reason?: string) => void;
  onDirectDispatch?: (order: EngineeringWorkOrder | any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  equipmentList,
  allEquipmentList,
  departmentOptions = [],
  currentUser,
  approvalApplications = [],
  onNavigateToLedger,
  onNavigateToTab,
  onNavigateToApprovals,
  onOpenAddModal,
  onOpenRepairModal,
  onOpenAiModal,
  onOpenStatusModal,
  onSelectDeviceDetail,
  onReturnEquipment,
  onOpenOfficialReport,
  onDirectDispatch
}) => {
  // 当前登录用户的 7+1 岗位原型与科室识别
  const roleArch: RoleArchetype = resolveRoleArchetype(currentUser);
  const userDept = getUserDepartment(currentUser);
  const userIsNurse = isHeadNurse(currentUser);
  const userIsClinical = isClinicalStaff(currentUser);
  const isClinicalRole = roleArch === 'clinical_nurse' || roleArch === 'clinical_director';
  const hasDeptScope = Boolean(userDept && isClinicalRole);
  const isDeptView = isClinicalRole && hasDeptScope;

  // RBAC 权限开关
  const allowDispatch = canDispatchWorkOrder(currentUser);
  const allowRepair = canInitiateRepair(currentUser);
  const canViewCaoliaoLogsTab = canAccessTab(currentUser, 'caoliao_webhook_logs');

  // 日程工作列表与持久化
  const [scheduleItems, setScheduleItems] = useState<WorkScheduleItem[]>(() => loadScheduleItems());
  const [handoverSuccessMessage, setHandoverSuccessMessage] = useState<string>('');

  // 月度零星框架与结算批次数据源
  const [frameworkBatches] = useState<MonthlyFrameworkBatch[]>(() => {
    try {
      return getMonthlyFrameworkBatches();
    } catch {
      return [];
    }
  });

  // 双方即时对账待办数量与核减差额统计
  const [urgentReconcileCount, setUrgentReconcileCount] = useState<number>(6);
  const [totalDiffAmount, setTotalDiffAmount] = useState<number>(1900.0);

  const handleItemReconciled = (item: ImmediateReconciliationItem) => {
    setUrgentReconcileCount(prev => Math.max(0, prev - 1));
    setTotalDiffAmount(prev => Math.max(0, prev - item.diffAmount));
  };

  // 现场派工流水工单池（统一由后端 /api/work-orders 主数据源驱动，按最新时间倒序）
  const [liveWorkOrders, setLiveWorkOrders] = useState<EngineeringWorkOrder[]>([]);

  // 各类闭环弹窗状态
  const [activeRepairAlert, setActiveRepairAlert] = useState<RepairAlertData | null>(null);
  const [selectedRepairDetail, setSelectedRepairDetail] = useState<RepairReportDetailData | null>(null);
  const [localAssigningOrder, setLocalAssigningOrder] = useState<EngineeringWorkOrder | null>(null);
  const [localFieldOrder, setLocalFieldOrder] = useState<EngineeringWorkOrder | null>(null);
  const [localAcceptOrder, setLocalAcceptOrder] = useState<EngineeringWorkOrder | null>(null);

  // 新建/编辑日程模态框
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<WorkScheduleItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<WorkScheduleItem['category']>('科室巡检');
  const [formDate, setFormDate] = useState('2026-08-17');
  const [formTimeRange, setFormTimeRange] = useState('09:00 - 10:30');
  const [formLocation, setFormLocation] = useState('');
  const [formAssignedStaff, setFormAssignedStaff] = useState('');
  const [formPriority, setFormPriority] = useState<WorkScheduleItem['priority']>('normal');
  const [formRelatedDeviceId, setFormRelatedDeviceId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // 定时轮询与全局报修事件监听
  useEffect(() => {
    let isMounted = true;

    const fetchLiveWorkOrders = async () => {
      try {
        const res = await fetch('/api/work-orders');
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          setLiveWorkOrders(sortWorkOrdersNewestFirst(json.data));
        }
      } catch {
        // 静默容错
      }
    };

    let lastAlertId = '';
    const checkLatestAlert = async () => {
      try {
        const res = await fetch('/api/caoliao/latest-alert');
        const json = await res.json();
        if (isMounted && json.success && json.hasNewAlert && json.alert) {
          setActiveRepairAlert(json.alert);
          if (json.alert.id !== lastAlertId) {
            lastAlertId = json.alert.id;
            fetchLiveWorkOrders();
            window.dispatchEvent(new CustomEvent('medical_equipment_updated'));
          }
        }
      } catch {
        // 静默容错
      }
    };

    checkLatestAlert();
    fetchLiveWorkOrders();
    const bootCatchupTimer = setTimeout(fetchLiveWorkOrders, 2800);
    const pollTimer = setInterval(() => {
      checkLatestAlert();
      fetchLiveWorkOrders();
    }, 5000);

    const handleAlertReceived = (e: any) => {
      fetchLiveWorkOrders();
      if (e.detail?.alert) {
        setActiveRepairAlert(e.detail.alert);
        lastAlertId = e.detail.alert.id;
      } else if (e.detail?.workOrderId) {
        setActiveRepairAlert({
          id: `ALERT-${Date.now()}`,
          timestamp: '刚刚',
          workOrderId: e.detail.workOrderId,
          equipmentId: e.detail.matchedEquipmentId || '',
          equipmentName: e.detail.equipmentName || '报修设备',
          department: e.detail.department || '临床科室',
          reporterName: e.detail.reporterName || '临床医护',
          reporterPhone: e.detail.reporterPhone || '',
          faultDescription: e.detail.faultDescription || '现场扫码报修：设备运行异常，需医工人员及时核查处置',
          urgency: e.detail.urgency || 'P1',
          source: '草料二维码现场扫码',
          isRead: false
        });
      }
    };

    const handleWorkOrdersUpdated = () => {
      fetchLiveWorkOrders();
    };
    const handleAlertDismissed = () => {
      setActiveRepairAlert(null);
    };

    window.addEventListener('caoliao_repair_received', handleAlertReceived);
    window.addEventListener('caoliao_alert_dismissed', handleAlertDismissed);
    window.addEventListener('work_orders_updated', handleWorkOrdersUpdated);
    window.addEventListener('medical_equipment_updated', handleWorkOrdersUpdated);

    return () => {
      isMounted = false;
      clearTimeout(bootCatchupTimer);
      clearInterval(pollTimer);
      window.removeEventListener('caoliao_repair_received', handleAlertReceived);
      window.removeEventListener('caoliao_alert_dismissed', handleAlertDismissed);
      window.removeEventListener('work_orders_updated', handleWorkOrdersUpdated);
      window.removeEventListener('medical_equipment_updated', handleWorkOrdersUpdated);
    };
  }, []);

  const handleDismissRepairAlert = async () => {
    setActiveRepairAlert(null);
    window.dispatchEvent(new CustomEvent('caoliao_alert_dismissed'));
    try {
      await fetch('/api/caoliao/dismiss-alert', { method: 'POST' });
    } catch {
      // ignore
    }
  };

  // 大盘内直接暂存预派工 (拟定工程师，留存内部讨论)
  const handleLocalPreDispatch = async (
    orderId: string,
    engineer: BiomedicalEngineerProfile,
    notes: string,
    discussionContent?: string,
    dispatchMeta?: OutsourcedDispatchMeta
  ) => {
    try {
      const res = await fetch(`/api/work-orders/${encodeURIComponent(orderId)}/pre-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineerId: engineer.id,
          engineerName: engineer.name,
          engineerPhone: engineer.phone,
          preDispatcherName: currentUser?.name || '医工调度中心',
          authorRole: currentUser?.role || '设备科调度员',
          notes,
          discussionMessage: discussionContent,
          ...(dispatchMeta || {})
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLiveWorkOrders(prev => prev.map(o => (o.id === orderId ? json.data : o)));
        setLocalAssigningOrder(prev => (prev && prev.id === orderId ? json.data : prev));
        window.dispatchEvent(new CustomEvent('work_orders_updated'));
        return json.data;
      }
    } catch (e) {
      console.error('Failed to pre-dispatch in DashboardView:', e);
    }
  };

  // 大盘内提交内部讨论确认意见
  const handleLocalAddDiscussion = async (
    orderId: string,
    content: string,
    proposedEngineer?: string | BiomedicalEngineerProfile | null
  ) => {
    try {
      const engName = typeof proposedEngineer === 'string' ? proposedEngineer : proposedEngineer?.name;
      const res = await fetch(`/api/work-orders/${encodeURIComponent(orderId)}/discussion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: currentUser?.name || '医工调度中心',
          authorRole: currentUser?.role || '设备科调度员',
          content,
          proposedEngineerName: engName
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLiveWorkOrders(prev => prev.map(o => (o.id === orderId ? json.data : o)));
        setLocalAssigningOrder(prev => (prev && prev.id === orderId ? json.data : prev));
        window.dispatchEvent(new CustomEvent('work_orders_updated'));
        return json.data;
      }
    } catch (e) {
      console.error('Failed to add discussion in DashboardView:', e);
    }
  };

  // 一线工程师更新现场维修进展
  const handleUpdateFieldWorkOrder = async (updatedOrder: EngineeringWorkOrder) => {
    setLiveWorkOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
    setLocalFieldOrder(updatedOrder);
    try {
      const res = await fetch(`/api/work-orders/${encodeURIComponent(updatedOrder.id)}/field-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLiveWorkOrders(prev => prev.map(o => (o.id === updatedOrder.id ? json.data : o)));
        setLocalFieldOrder(json.data);
      }
      if (json.linkedProject || json.data?.linkedProjectId) {
        window.dispatchEvent(
          new CustomEvent('medtech:project-ledger-updated', {
            detail: { project: json.linkedProject, projectId: json.data?.linkedProjectId }
          })
        );
      }
      window.dispatchEvent(new CustomEvent('work_orders_updated'));
    } catch (e) {
      console.error('Failed to persist field work order update:', e);
    }
  };

  // 临床科室完工验收签字确认
  const handleConfirmClinicalAcceptance = async (
    workOrderId: string,
    ratingData: {
      ratingScore: number;
      ratingTimeliness: number;
      ratingQuality: number;
      ratingAttitude: number;
      clinicalFeedback: string;
      acceptanceStaffName: string;
      acceptanceStaffRole: string;
      acceptanceSignature: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/work-orders/${encodeURIComponent(workOrderId)}/clinical-accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData)
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLiveWorkOrders(prev => prev.map(o => (o.id === workOrderId ? json.data : o)));
        window.dispatchEvent(new CustomEvent('work_orders_updated'));
        window.dispatchEvent(new CustomEvent('medical_equipment_updated'));
      }
    } catch (e) {
      console.error('Failed to confirm clinical acceptance:', e);
    } finally {
      setLocalAcceptOrder(null);
    }
  };

  // 动态问候语计算
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早上好';
    if (hour >= 12 && hour < 14) return '中午好';
    if (hour >= 14 && hour < 19) return '下午好';
    return '晚上好';
  }, []);

  const roleFocusHint = useMemo(() => {
    switch (roleArch) {
      case 'clinical_nurse':
        return '专属工作台：科室消息签收 · 在借应急设备归还 · 临床报修与晨检 · 完工验收';
      case 'clinical_director':
        return '专属工作台：科室通知签收 · 科室立项论证审批 · 单机ROI效益与质控';
      case 'engineering_supervisor':
        return '专属工作台：全院通知统一下发 · 预派工与正式派工调度 · 工程师负载监控';
      case 'engineer':
        return '专属工作台：我的接单施工台 · 派前技术讨论 · 个人巡检日程 · 备件低库存查验';
      case 'financial':
        return '专属工作台：财务通告下发 · 未开票项目与核减即时对账 · 固定资产与ROI核算';
      case 'executive':
        return '专属工作台：院级督办通告下发 · 全院质控红线态势 · 重点科室对比与战略审批';
      case 'vendor':
        return '专属工作台：院方工程指令接收 · 外协履约工单进度 · 核减即时对账';
      case 'admin':
      default:
        return '专属工作台：系统运维与网关监控 · 全院通知下发追踪 · 全局派工兜底';
    }
  }, [roleArch]);

  const roleHomeBadge = useMemo(() => {
    switch (roleArch) {
      case 'clinical_nurse':
        return '临床护理安全台';
      case 'clinical_director':
        return '临床科主任决策台';
      case 'engineering_supervisor':
        return '医工总调度中心';
      case 'engineer':
        return '一线工程师接单台';
      case 'financial':
        return '财务资产与对账台';
      case 'executive':
        return '院级运营治理驾驶舱';
      case 'vendor':
        return '签约服务商协同门户';
      case 'admin':
      default:
        return '系统全维治理中枢';
    }
  }, [roleArch]);

  const fullEquipmentList = allEquipmentList || equipmentList;

  // 当前视角下的设备列表
  const scopedEquipmentList = useMemo(() => {
    if (isDeptView) {
      return equipmentList.filter(
        e =>
          e.department === userDept ||
          e.ownerDepartment === userDept ||
          (e.currentLoan &&
            e.currentLoan.loanStatus !== 'returned' &&
            (e.currentLoan.borrowingDepartment === userDept ||
              e.currentLoan.borrowingDepartment?.includes(userDept)))
      );
    }
    return equipmentList;
  }, [equipmentList, isDeptView, userDept]);

  // 在借应急生命支持设备追踪池
  const borrowedEmergencyDevices = useMemo<BorrowedDeviceEntry[]>(() => {
    const now = Date.now();
    return fullEquipmentList
      .filter(e => {
        if (!e.currentLoan || e.currentLoan.loanStatus === 'returned') return false;
        if (isDeptView && userDept) {
          return (
            e.currentLoan.borrowingDepartment === userDept ||
            e.currentLoan.borrowingDepartment?.includes(userDept)
          );
        }
        return true;
      })
      .map(e => {
        const loan = e.currentLoan!;
        const borrowStr = loan.borrowTime || (loan as any).loanDate || '';
        const expectedStr = loan.expectedReturnTime || (loan as any).expectedReturnDate || '';
        const borrowMs = borrowStr ? new Date(borrowStr.replace(' ', 'T')).getTime() || now : now;
        const expectedMs = expectedStr ? new Date(expectedStr.replace(' ', 'T')).getTime() || now : now;
        const daysElapsed = Math.max(1, Math.ceil((now - borrowMs) / (1000 * 3600 * 24)));
        const isOverdue = now > expectedMs;
        const totalSpan = Math.max(1, expectedMs - borrowMs);
        const isHalfwayPassed = now - borrowMs >= totalSpan / 2 && !isOverdue;
        const daysRemaining = isOverdue ? 0 : Math.max(0, Math.ceil((expectedMs - now) / (1000 * 3600 * 24)));
        const daysOverdue = isOverdue ? Math.max(1, Math.ceil((now - expectedMs) / (1000 * 3600 * 24))) : 0;
        return {
          device: e,
          loan,
          daysElapsed,
          isOverdue,
          isHalfwayPassed,
          daysRemaining,
          daysOverdue
        };
      });
  }, [fullEquipmentList, isDeptView, userDept]);

  // 本科室待科室初审的单据
  const deptApprovalApplications = useMemo(() => {
    if (!userDept) return approvalApplications;
    return approvalApplications.filter(
      a =>
        a.applicantDepartment === userDept ||
        a.applicantDepartment?.includes(userDept) ||
        a.applicantName === currentUser?.name
    );
  }, [approvalApplications, userDept, currentUser]);

  const pendingDeptSignoffs = useMemo(
    () => deptApprovalApplications.filter(a => a.status === 'pending_dept'),
    [deptApprovalApplications]
  );

  // 30-60天内待强检或待维保设备
  const upcomingPmAndCalibrations = useMemo(() => {
    return scopedEquipmentList.filter(e => {
      if (e.nextCalibrationDate) {
        const diff = Math.ceil(
          (new Date(e.nextCalibrationDate).getTime() - new Date('2026-08-17').getTime()) / (1000 * 3600 * 24)
        );
        if (diff >= 0 && diff <= 60) return true;
      }
      if (e.nextMaintenanceDate) {
        const diff = Math.ceil(
          (new Date(e.nextMaintenanceDate).getTime() - new Date('2026-08-17').getTime()) / (1000 * 3600 * 24)
        );
        if (diff >= 0 && diff <= 45) return true;
      }
      return false;
    });
  }, [scopedEquipmentList]);

  // 急救生命支持类设备
  const lifeSupportDevices = useMemo(() => {
    return scopedEquipmentList.filter(
      e =>
        e.category?.includes('呼吸') ||
        e.category?.includes('急救') ||
        e.category?.includes('监护') ||
        e.category?.includes('生命') ||
        e.name?.includes('除颤') ||
        e.name?.includes('呼吸机') ||
        e.name?.includes('监护仪') ||
        e.name?.includes('注射泵') ||
        e.name?.includes('输液泵') ||
        e.name?.includes('吸引')
    );
  }, [scopedEquipmentList]);

  // 今日晨间交接点检状态
  const handoverCompletedToday = useMemo(() => {
    const todayDate = '2026-08-17';
    return scheduleItems.some(
      s =>
        s.date === todayDate &&
        s.status === 'completed' &&
        (s.title.includes('交接班') || s.title.includes('点检')) &&
        (!userDept || s.location.includes(userDept) || s.title.includes(userDept))
    );
  }, [scheduleItems, userDept]);

  // 一键完成交接班点检
  const handleCompleteHandoverCheck = () => {
    const todayDate = '2026-08-17';
    const deptLabel = userDept || '本科室';
    const existingIndex = scheduleItems.findIndex(
      s =>
        s.date === todayDate &&
        (s.title.includes('交接班') || s.title.includes('点检')) &&
        (s.location.includes(deptLabel) || s.title.includes(deptLabel))
    );

    let updated: WorkScheduleItem[];
    if (existingIndex >= 0) {
      updated = scheduleItems.map((item, idx) =>
        idx === existingIndex ? { ...item, status: 'completed' } : item
      );
    } else {
      const newItem: WorkScheduleItem = {
        id: `SCH-${todayDate}-${Date.now()}`,
        title: `${deptLabel} 抢救生命支持类设备交接班与急救包点检`,
        category: '例行工作',
        date: todayDate,
        timeRange: '08:00 - 08:30',
        location: `${deptLabel} 抢救室/治疗室`,
        assignedStaff: `${currentUser?.name || '护士长'} (${deptLabel})`,
        priority: 'high',
        status: 'completed',
        notes: `由 ${currentUser?.name || '护士长'} 完成晨间交接点检，本科室在位设备全部核对完毕，运行状态正常。`
      };
      updated = [newItem, ...scheduleItems];
    }
    setScheduleItems(updated);
    saveScheduleItems(updated);
    setHandoverSuccessMessage(`已完成【${deptLabel}】今日急救设备晨间交接点检！`);
    setTimeout(() => setHandoverSuccessMessage(''), 4000);
  };

  // 切换任务完成状态
  const handleToggleTaskStatus = (id: string) => {
    const updated = scheduleItems.map(item => {
      if (item.id === id) {
        const nextStatus: WorkScheduleItem['status'] = item.status === 'completed' ? 'pending' : 'completed';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setScheduleItems(updated);
    saveScheduleItems(updated);
  };

  // 打开新增日程弹窗
  const handleOpenScheduleAdd = () => {
    setEditingScheduleItem(null);
    setFormTitle('');
    setFormCategory('科室巡检');
    setFormDate('2026-08-17');
    setFormTimeRange('09:00 - 10:30');
    setFormLocation(currentUser?.departmentName || '急救中心 / 手术室');
    setFormAssignedStaff(currentUser ? `${currentUser.name} (${currentUser.employeeNo})` : '责任工程师');
    setFormPriority('normal');
    setFormRelatedDeviceId('');
    setFormNotes('');
    setIsAddScheduleModalOpen(true);
  };

  // 提交保存日程
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let relatedDeviceName = '';
    let relatedDeviceSn = '';
    if (formRelatedDeviceId) {
      const matched = equipmentList.find(eq => eq.id === formRelatedDeviceId || eq.sn === formRelatedDeviceId);
      if (matched) {
        relatedDeviceName = matched.name;
        relatedDeviceSn = matched.sn;
      }
    }

    if (editingScheduleItem) {
      const updated = scheduleItems.map(item => {
        if (item.id === editingScheduleItem.id) {
          return {
            ...item,
            title: formTitle.trim(),
            category: formCategory,
            date: formDate,
            timeRange: formTimeRange,
            location: formLocation.trim() || '院内科室',
            assignedStaff: formAssignedStaff.trim() || '医工工程师',
            priority: formPriority,
            relatedDeviceId: formRelatedDeviceId || undefined,
            relatedDeviceName: relatedDeviceName || item.relatedDeviceName,
            relatedDeviceSn: relatedDeviceSn || item.relatedDeviceSn,
            notes: formNotes.trim()
          };
        }
        return item;
      });
      setScheduleItems(updated);
      saveScheduleItems(updated);
    } else {
      const dateKey = (formDate || '').replace(/-/g, '') || '20260901';
      const newItem: WorkScheduleItem = {
        id: `SCH-${dateKey}-${Date.now().toString().slice(-3)}`,
        title: formTitle.trim(),
        category: formCategory,
        date: formDate,
        timeRange: formTimeRange,
        location: formLocation.trim() || '全院区域',
        assignedStaff:
          formAssignedStaff.trim() ||
          (currentUser?.name ? `${currentUser.name} (${currentUser.employeeNo})` : '责任工程师'),
        priority: formPriority,
        status: 'pending',
        relatedDeviceId: formRelatedDeviceId || undefined,
        relatedDeviceName: relatedDeviceName || undefined,
        relatedDeviceSn: relatedDeviceSn || undefined,
        notes: formNotes.trim()
      };
      const updated = [newItem, ...scheduleItems];
      setScheduleItems(updated);
      saveScheduleItems(updated);
    }

    setIsAddScheduleModalOpen(false);
  };

  // 构建 8 大专属主页共享标准 Props
  const commonHomeProps: RoleHomepageCommonProps = {
    currentUser,
    userDept,
    stats,
    equipmentList,
    allEquipmentList: fullEquipmentList,
    scopedEquipmentList,
    departmentOptions,
    liveWorkOrders,
    approvalApplications,
    borrowedEmergencyDevices,
    upcomingPmAndCalibrations,
    lifeSupportDevices,
    frameworkBatches,
    scheduleItems,
    urgentReconcileCount,
    totalDiffAmount,
    handoverCompletedToday,
    onNavigateToTab,
    onNavigateToLedger,
    onNavigateToApprovals,
    onOpenAddModal,
    onOpenRepairModal,
    onOpenAiModal,
    onOpenStatusModal,
    onSelectDeviceDetail,
    onReturnEquipment,
    onOpenOfficialReport,
    onDirectDispatch: order => {
      if (onDirectDispatch) {
        onDirectDispatch(order);
      } else {
        setLocalAssigningOrder(order);
      }
    },
    onOpenFieldOperation: order => {
      setLocalFieldOrder(order);
    },
    onOpenClinicalAcceptance: order => {
      setLocalAcceptOrder(order);
    },
    onCompleteHandoverCheck: handleCompleteHandoverCheck,
    onOpenScheduleAdd: handleOpenScheduleAdd,
    onToggleScheduleStatus: handleToggleTaskStatus,
    onOpenRepairDetail: data => setSelectedRepairDetail(data),
    onItemReconciled: handleItemReconciled
  };

  const renderRoleHomepage = () => {
    switch (roleArch) {
      case 'clinical_nurse':
        return <ClinicalNurseHomeView {...commonHomeProps} />;
      case 'clinical_director':
        return <ClinicalDirectorHomeView {...commonHomeProps} />;
      case 'engineering_supervisor':
        return <EngineeringSupervisorHomeView {...commonHomeProps} />;
      case 'engineer':
        return <FieldEngineerHomeView {...commonHomeProps} />;
      case 'financial':
        return <FinancialHomeView {...commonHomeProps} />;
      case 'executive':
        return <ExecutiveHomeView {...commonHomeProps} />;
      case 'vendor':
        return <VendorHomeView {...commonHomeProps} />;
      case 'admin':
      default:
        return <SystemAdminHomeView {...commonHomeProps} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-full pb-6">
      {/* ==================== 1. 专属岗位工作台身份与高频快捷导览条 ==================== */}
      <div className="bg-white rounded-xl px-4 py-3 text-slate-800 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              {greetingText}，{currentUser ? currentUser.name : '医工主管'}
            </span>
            {currentUser && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getRoleBadgeStyle(currentUser.role)}`}>
                {currentUser.role}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 text-white whitespace-nowrap">
              {roleHomeBadge}
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {currentUser?.employeeNo ? `[${currentUser.employeeNo}]` : ''}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden lg:block"></div>

          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{currentUser?.organization || '五莲县人民医院'} · {userDept || '医学工程保障中心'}</span>
            </span>
            <span className="text-slate-300 hidden md:inline">·</span>
            <span className="text-[11px] text-slate-600 font-medium hidden md:inline">{roleFocusHint}</span>
          </div>
        </div>

        {/* 右侧：工作台核心高频响应动作（严格按岗位权限收敛显示） */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {handoverSuccessMessage && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{handoverSuccessMessage}</span>
            </span>
          )}

          {isDeptView && (userIsNurse || userIsClinical) && (
            <button
              type="button"
              onClick={handleCompleteHandoverCheck}
              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title="完成今日急救生命支持设备晨间交接点检打卡"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>晨间交接点检</span>
            </button>
          )}

          {allowRepair && (
            <button
              type="button"
              onClick={() => onOpenRepairModal()}
              className="h-8 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="登记新设备故障报修工单"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>紧急报修</span>
            </button>
          )}

          {roleArch !== 'vendor' && (
            <button
              type="button"
              onClick={() => onOpenOfficialReport?.()}
              className="h-8 px-2.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title="生成或打印《五莲县人民医院请示报告单》"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-red-600" />
              <span>院请示单</span>
            </button>
          )}

          {canAccessTab(currentUser, 'approvals') && (
            <button
              type="button"
              onClick={() => onNavigateToApprovals?.()}
              className="h-8 px-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title="查看业务审批流转事项"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>审批中心</span>
              {pendingDeptSignoffs.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ml-0.5 font-mono tabular-nums">
                  {pendingDeptSignoffs.length}
                </span>
              )}
            </button>
          )}

          {roleArch !== 'vendor' && (
            <button
              type="button"
              onClick={() => onNavigateToLedger('', isDeptView ? userDept : undefined)}
              className="h-8 px-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title={isDeptView ? `查看${userDept}设备技术台账` : '查看全院设备技术台账'}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{isDeptView ? `${userDept}台账` : '设备台账'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== 2. 岗位今日重点关注智能摘要卡 (3项高频待办点击直达) ==================== */}
      <RoleTodayFocusCard
        currentUser={currentUser}
        roleArch={roleArch}
        userDept={userDept}
        scopedEquipmentList={scopedEquipmentList}
        allEquipmentList={fullEquipmentList}
        liveWorkOrders={liveWorkOrders}
        approvalApplications={approvalApplications}
        borrowedEmergencyDevices={borrowedEmergencyDevices}
        upcomingPmAndCalibrations={upcomingPmAndCalibrations}
        frameworkBatches={frameworkBatches}
        scheduleItems={scheduleItems}
        urgentReconcileCount={urgentReconcileCount}
        totalDiffAmount={totalDiffAmount}
        handoverCompletedToday={handoverCompletedToday}
        onNavigateToTab={onNavigateToTab}
        onNavigateToLedger={onNavigateToLedger}
        onNavigateToApprovals={onNavigateToApprovals}
        onDirectDispatch={commonHomeProps.onDirectDispatch}
        onOpenFieldOperation={commonHomeProps.onOpenFieldOperation}
        onOpenClinicalAcceptance={commonHomeProps.onOpenClinicalAcceptance}
        onCompleteHandoverCheck={handleCompleteHandoverCheck}
        onReturnEquipment={onReturnEquipment}
      />

      {/* ==================== 3. 8 大岗位置顶/核心专属主页面路由渲染 ==================== */}
      {renderRoleHomepage()}

      {/* ==================== 3. 新增 / 编辑工作日程模态框 ==================== */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingScheduleItem ? '编辑工作日程安排' : '新建工作日程 / 待办备忘'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">日程工作标题 (Task Title) *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="例如: ICU呼吸机定期质控定标 / 省计量院CT法定强检"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">工作类别 (Category)</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="科室巡检">科室巡检</option>
                    <option value="强检定标">强检定标</option>
                    <option value="预防性维护">预防性维护 (PM)</option>
                    <option value="故障抢修">故障抢修</option>
                    <option value="质控抽检">质控抽检</option>
                    <option value="例行工作">例行工作</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">优先级 (Priority)</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="normal">普通常规 (Normal)</option>
                    <option value="high">重要关注 (High)</option>
                    <option value="urgent">紧急抢修 / 强检到期 (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">计划执行日期 (Date)</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">时间段 (Time Range)</label>
                  <input
                    type="text"
                    value={formTimeRange}
                    onChange={e => setFormTimeRange(e.target.value)}
                    placeholder="如 08:30 - 10:00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">执行地点 / 科室</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="如 外科综合楼 3F 手术室"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">责任人 / 工程师</label>
                  <input
                    type="text"
                    value={formAssignedStaff}
                    onChange={e => setFormAssignedStaff(e.target.value)}
                    placeholder="如 崔伟 (EMP-7001)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">关联医疗设备 (可选)</label>
                <select
                  value={formRelatedDeviceId}
                  onChange={e => setFormRelatedDeviceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">-- 无特定关联设备 / 综合巡检 --</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.sn}) - {eq.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">工作说明与技术要点 (Notes)</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="如 携带电安全测试仪、备用氧电池及润滑剂..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition cursor-pointer shadow-sm"
                >
                  {editingScheduleItem ? '保存修改' : '确认创建日程'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 4. 实时草料二维码报修弹出消息模态框 ==================== */}
      <RepairAlertPopupModal
        alert={activeRepairAlert}
        onClose={handleDismissRepairAlert}
        onFastDispatch={(device, alertData) => {
          const order = liveWorkOrders.find(
            o => o.id === alertData?.workOrderId || (alertData?.rawRecordNo && o.caoliaoRecordNo === alertData?.rawRecordNo)
          ) || {
            id: alertData?.workOrderId || `WO-${Date.now().toString().slice(-6)}`,
            equipmentId: device?.id || alertData?.equipmentId || '',
            equipmentName: device?.name || alertData?.equipmentName || '报修设备',
            equipmentModel: device?.model || '',
            equipmentSn: device?.sn || alertData?.sn || '',
            department: device?.department || alertData?.department || '临床科室',
            location: device?.location || '诊疗室现场',
            reporterName: alertData?.reporterName || '临床医护',
            reporterPhone: alertData?.reporterPhone || '',
            reportTime: alertData?.timestamp || '',
            priority: (alertData?.urgency === 'P1' ? 'P1_CRITICAL' : 'P2_URGENT') as any,
            workOrderType: 'emergency_breakdown' as const,
            faultDescription: alertData?.faultDescription || '临床设备故障现场报修',
            status: 'pending_dispatch' as const,
            biomedicalGroup: '超声与综合诊疗组' as const,
            source: 'caoliao' as const,
            caoliaoRecordNo: alertData?.rawRecordNo,
            photoUrl: alertData?.photoUrl,
            partsReplaced: [],
            totalRepairCost: 0,
            totalDowntimeHours: 0.2,
            slaResponseLimitMinutes: 30,
            slaRepairLimitHours: 4,
            isSlaResponseMet: false,
            isSlaRepairMet: false
          };
          if (onDirectDispatch) {
            onDirectDispatch(order);
          } else {
            setLocalAssigningOrder(order as any);
          }
        }}
        onViewLogs={
          canViewCaoliaoLogsTab
            ? () => {
                onNavigateToTab?.('caoliao_webhook_logs');
              }
            : undefined
        }
        onViewEquipmentDetail={device => {
          onSelectDeviceDetail(device);
        }}
        onViewRepairDetail={alert => {
          setSelectedRepairDetail({
            id: alert.workOrderId,
            workOrderId: alert.workOrderId,
            recordNo: alert.rawRecordNo,
            timestamp: alert.timestamp,
            equipmentId: alert.equipmentId,
            equipmentName: alert.equipmentName,
            equipmentSn: alert.sn,
            department: alert.department,
            reporterName: alert.reporterName,
            reporterPhone: alert.reporterPhone,
            faultDescription: alert.faultDescription,
            photoUrl: alert.photoUrl,
            urgency: alert.urgency,
            source: alert.source
          });
        }}
        equipmentList={equipmentList}
        currentUser={currentUser}
      />

      {/* ==================== 5. 报修工单完整详情模态框 ==================== */}
      <RepairReportDetailModal
        isOpen={!!selectedRepairDetail}
        onClose={() => setSelectedRepairDetail(null)}
        data={selectedRepairDetail}
        equipmentList={equipmentList}
        currentUser={currentUser}
        onFastDispatch={(device, detailData) => {
          setSelectedRepairDetail(null);
          const order = liveWorkOrders.find(
            o => o.id === detailData?.workOrderId || (detailData?.recordNo && o.caoliaoRecordNo === detailData?.recordNo)
          ) || {
            id: detailData?.workOrderId || detailData?.id || `WO-${Date.now().toString().slice(-6)}`,
            equipmentId: device?.id || detailData?.equipmentId || '',
            equipmentName: device?.name || detailData?.equipmentName || '报修设备',
            equipmentModel: device?.model || detailData?.model || '',
            equipmentSn: device?.sn || detailData?.equipmentSn || '',
            department: device?.department || detailData?.department || '临床科室',
            location: device?.location || detailData?.location || '诊疗室现场',
            reporterName: detailData?.reporterName || '临床医护',
            reporterPhone: detailData?.reporterPhone || '',
            reportTime: detailData?.timestamp || detailData?.faultDate || '',
            priority: (detailData?.urgency === 'P1' ? 'P1_CRITICAL' : 'P2_URGENT') as any,
            workOrderType: 'emergency_breakdown' as const,
            faultDescription: detailData?.faultDescription || '临床设备故障现场报修',
            status: 'pending_dispatch' as const,
            biomedicalGroup: '超声与综合诊疗组' as const,
            source: (detailData?.source === 'caoliao' ? 'caoliao' : 'hospital') as any,
            caoliaoRecordNo: detailData?.recordNo,
            photoUrl: detailData?.photoUrl,
            partsReplaced: [],
            totalRepairCost: 0,
            totalDowntimeHours: 0.2,
            slaResponseLimitMinutes: 30,
            slaRepairLimitHours: 4,
            isSlaResponseMet: false,
            isSlaRepairMet: false
          };
          if (onDirectDispatch) {
            onDirectDispatch(order);
          } else {
            setLocalAssigningOrder(order as any);
          }
        }}
        onViewEquipmentDetail={device => {
          setSelectedRepairDetail(null);
          onSelectDeviceDetail(device);
        }}
      />

      {/* ==================== 6. 现场即时智能派工指派弹窗 ==================== */}
      <DispatchAssignModal
        isOpen={Boolean(localAssigningOrder)}
        workOrder={localAssigningOrder}
        engineers={DEFAULT_BIOMEDICAL_ENGINEERS}
        currentUserName={currentUser?.name || '医工调度中心'}
        currentUserRole={currentUser?.role || '设备科调度员'}
        canDispatch={allowDispatch}
        onClose={() => setLocalAssigningOrder(null)}
        onPreDispatch={handleLocalPreDispatch}
        onAddDiscussion={handleLocalAddDiscussion}
        onConfirmDispatch={async (orderId, engineer, notes, dispatchMeta) => {
          try {
            const res = await fetch(`/api/work-orders/${encodeURIComponent(orderId)}/dispatch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                engineerId: engineer.id,
                engineerName: engineer.name,
                engineerPhone: engineer.phone,
                dispatcherName: currentUser?.name || '医工调度中心',
                authorRole: currentUser?.role || '设备科调度员',
                notes,
                ...(dispatchMeta || {})
              })
            });
            const json = await res.json();
            if (json.vendorCollabOrder) {
              upsertVendorCollaborationOrder(json.vendorCollabOrder);
            }
            if (json.linkedProject || json.data?.linkedProjectId) {
              window.dispatchEvent(
                new CustomEvent('medtech:project-ledger-updated', {
                  detail: { project: json.linkedProject, projectId: json.data?.linkedProjectId }
                })
              );
            }
            const updatedOrder =
              json.success && json.data
                ? json.data
                : localAssigningOrder
                  ? {
                      ...localAssigningOrder,
                      status: 'dispatched' as const,
                      assignedEngineerId: engineer.id,
                      assignedEngineerName: engineer.name,
                      assignedEngineerPhone: engineer.phone,
                      dispatchNotes: notes,
                      dispatchTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
                      ...(dispatchMeta || {})
                    }
                  : null;
            if (updatedOrder) {
              if (!json.vendorCollabOrder && dispatchMeta?.dispatchChannel === 'outsourced' && dispatchMeta.syncToVendorPortal !== false) {
                upsertVendorCollaborationOrder(buildVendorOrderFromWorkOrder(updatedOrder, currentUser?.name || '医工调度中心'));
              }
              setLiveWorkOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
              setLocalAssigningOrder(prev => (prev && prev.id === orderId ? updatedOrder : prev));
              window.dispatchEvent(new CustomEvent('work_orders_updated'));
              return updatedOrder;
            }
          } catch (e) {
            console.error('Failed to dispatch in DashboardView:', e);
          }
        }}
        onNavigateToDispatchTab={() => {
          setLocalAssigningOrder(null);
          onNavigateToTab?.('dispatch');
        }}
        onNavigateToVendorCollab={(vendorOrderId) => {
          setLocalAssigningOrder(null);
          window.dispatchEvent(new CustomEvent('medtech:focus-vendor-order', { detail: { vendorOrderId } }));
        }}
        onNavigateToProjectLedger={(projectId) => {
          setLocalAssigningOrder(null);
          window.dispatchEvent(new CustomEvent('medtech:focus-project-ledger', { detail: { projectId } }));
        }}
      />

      {/* ==================== 7. 一线维修工程师现场施工与配件申领弹窗 ==================== */}
      <FieldOperationModal
        isOpen={Boolean(localFieldOrder)}
        workOrder={localFieldOrder}
        currentUserName={currentUser?.name || '维修工程师'}
        onClose={() => setLocalFieldOrder(null)}
        onUpdateWorkOrder={handleUpdateFieldWorkOrder}
        onNavigateToAcceptance={() => {
          setLocalFieldOrder(null);
        }}
      />

      {/* ==================== 8. 临床科室完工验收评价弹窗 ==================== */}
      <ClinicalAcceptanceModal
        isOpen={Boolean(localAcceptOrder)}
        workOrder={localAcceptOrder}
        currentUser={currentUser || undefined}
        onClose={() => setLocalAcceptOrder(null)}
        onConfirmAcceptance={handleConfirmClinicalAcceptance}
      />
    </div>
  );
};

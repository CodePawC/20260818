import React, { useState, useMemo } from 'react';
import { 
  MedicalEquipment, 
  SystemStats, 
  AuthUser, 
  ActiveTab 
} from '../types';
import { 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  Activity, 
  PlusCircle, 
  Bot, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Coins,
  ArrowRight,
  Clock,
  Building2,
  Calendar,
  Check,
  Plus,
  Trash2,
  Edit3,
  CalendarDays,
  MapPin,
  User,
  Stethoscope,
  CheckSquare,
  Square,
  X,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Flame,
  ShieldAlert,
  Send,
  ExternalLink,
  ChevronRight,
  HeartPulse,
  Droplets,
  Wind,
  TrendingUp,
  FlaskConical,
  PieChart as PieChartIcon,
  Receipt,
  Wallet,
  Scale,
  FileCheck2,
  Award
} from 'lucide-react';
import { FaultFrequencyAnalysisCard } from './FaultFrequencyAnalysisCard';
import { ImmediateReconciliationPanel, ImmediateReconciliationItem } from './ImmediateReconciliationPanel';
import { PinnedFinancialKpiGrid } from './PinnedFinancialKpiGrid';
import { MonthlyFrameworkBatch } from '../types/vendorCollaborationTypes';
import { getMonthlyFrameworkBatches } from '../utils/monthlyFrameworkData';
import { 
  WorkScheduleItem, 
  loadScheduleItems, 
  saveScheduleItems, 
} from '../utils/scheduleData';
import { getRoleBadgeStyle } from '../utils/staffRolesData';
import { isHeadNurse, isClinicalStaff, getUserDepartment } from '../utils/authUtils';
import { matchesDepartment } from '../utils/masterData';
import { ApprovalApplication } from '../types/approvalTypes';

export interface DashboardViewProps {
  stats: SystemStats;
  equipmentList: MedicalEquipment[];
  allEquipmentList?: MedicalEquipment[];
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  equipmentList,
  allEquipmentList,
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
  onBorrowEquipment,
  onReturnEquipment
}) => {
  // 当前登录用户的科室识别与护士长身份
  const userDept = getUserDepartment(currentUser);
  const userIsNurse = isHeadNurse(currentUser);
  const userIsClinical = isClinicalStaff(currentUser);
  const hasDeptScope = Boolean(userDept && !userDept.includes('医学工程') && !userDept.includes('信息') && !userDept.includes('系统管理'));

  // 工作台看板视角：'department' (本科室专属视角) | 'hospital' (全院全局视角)
  const [dashboardScope, setDashboardScope] = useState<'department' | 'hospital'>(() => {
    return (userIsNurse || userIsClinical) && hasDeptScope ? 'department' : 'hospital';
  });

  // 护士长强制锁定为本科室视角
  const isDeptView = (userIsNurse && hasDeptScope) || (dashboardScope === 'department' && hasDeptScope);

  // 护士长专属工作台模式：'affairs' (护士长智能专属事务协同矩阵) | 'schedule' (科室工作排班与巡检日程)
  const [nurseWorkMode, setNurseWorkMode] = useState<'affairs' | 'schedule'>(() => {
    return userIsNurse ? 'affairs' : 'schedule';
  });

  // 日程工作列表与持久化
  const [scheduleItems, setScheduleItems] = useState<WorkScheduleItem[]>(() => loadScheduleItems());
  const [scheduleFilterTab, setScheduleFilterTab] = useState<'today' | 'upcoming' | 'all'>('today');
  const [scheduleCategoryFilter, setScheduleCategoryFilter] = useState<string>('all');
  const [scheduleScopeFilter, setScheduleScopeFilter] = useState<'dept_only' | 'all'>(() => {
    return (userIsNurse || userIsClinical) && hasDeptScope ? 'dept_only' : 'all';
  });

  // 右侧监控栏目切换：'fault_stats' (设备故障频率统计分析) | 'emergency_repairs' (急需处置待修机具) | 'dept_health' (核心科室健康度)
  const [rightMonitorTab, setRightMonitorTab] = useState<'fault_stats' | 'emergency_repairs' | 'dept_health'>('fault_stats');

  // 交接班点检成功轻提示
  const [handoverSuccessMessage, setHandoverSuccessMessage] = useState<string>('');

  // 月度零星框架与结算批次数据源
  const [frameworkBatches] = useState<MonthlyFrameworkBatch[]>(() => {
    try {
      return getMonthlyFrameworkBatches();
    } catch {
      return [];
    }
  });

  // 本科室名下外协维修与零星维保换件明细（如麻醉手术科、重症医学科等）
  const deptFrameworkItems = useMemo(() => {
    if (!userDept) return [];
    return frameworkBatches.flatMap(b => (b.items || []).map(it => ({
      ...it,
      batchId: b.id,
      batchYearMonth: b.yearMonth,
      batchPaymentStatus: b.paymentStatus,
    }))).filter(it => matchesDepartment(it.department, userDept));
  }, [frameworkBatches, userDept]);

  // 护士长/科室工作台维修卡片子标签：'internal'（院内待修设备）| 'vendor'（外协零修与换件）
  const [nurseRepairTab, setNurseRepairTab] = useState<'internal' | 'vendor'>('internal');

  // 双方即时对账待办数量与核减差额统计
  const [urgentReconcileCount, setUrgentReconcileCount] = useState<number>(6);
  const [totalDiffAmount, setTotalDiffAmount] = useState<number>(1900.00);

  // 快速平滑滚动聚焦至即时对账舱
  const handleScrollToReconciliation = () => {
    const el = document.getElementById('immediate-reconciliation-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-4', 'ring-amber-400');
      setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400'), 2500);
    }
  };

  // 即时对账单据完成回调
  const handleItemReconciled = (item: ImmediateReconciliationItem) => {
    setUrgentReconcileCount(prev => Math.max(0, prev - 1));
    setTotalDiffAmount(prev => Math.max(0, prev - item.diffAmount));
  };
  
  // 新建/编辑日程模态框
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<WorkScheduleItem | null>(null);

  // 表单字段
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<WorkScheduleItem['category']>('科室巡检');
  const [formDate, setFormDate] = useState('2026-08-17');
  const [formTimeRange, setFormTimeRange] = useState('09:00 - 10:30');
  const [formLocation, setFormLocation] = useState('');
  const [formAssignedStaff, setFormAssignedStaff] = useState('');
  const [formPriority, setFormPriority] = useState<WorkScheduleItem['priority']>('normal');
  const [formRelatedDeviceId, setFormRelatedDeviceId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // 动态问候语计算
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早上好';
    if (hour >= 12 && hour < 14) return '中午好';
    if (hour >= 14 && hour < 19) return '下午好';
    return '晚上好';
  }, []);

  // 当前视角下的设备列表
  const scopedEquipmentList = useMemo(() => {
    if (isDeptView) {
      return equipmentList.filter(e => 
        e.department === userDept || 
        e.ownerDepartment === userDept ||
        (e.currentLoan && e.currentLoan.loanStatus !== 'returned' && (e.currentLoan.borrowingDepartment === userDept || e.currentLoan.borrowingDepartment?.includes(userDept)))
      );
    }
    return equipmentList;
  }, [equipmentList, isDeptView, userDept]);

  // 本科室从应急储备库在借的设备
  const borrowedEmergencyDevices = useMemo(() => {
    const list = allEquipmentList || equipmentList;
    if (!userDept) return [];
    const now = Date.now();
    return list
      .filter(e => e.currentLoan && e.currentLoan.loanStatus !== 'returned' && (e.currentLoan.borrowingDepartment === userDept || e.currentLoan.borrowingDepartment?.includes(userDept)))
      .map(e => {
        const loan = e.currentLoan!;
        const borrowStr = loan.borrowTime || (loan as any).loanDate || '';
        const expectedStr = loan.expectedReturnTime || (loan as any).expectedReturnDate || '';
        const borrowMs = borrowStr ? (new Date(borrowStr.replace(' ', 'T')).getTime() || now) : now;
        const expectedMs = expectedStr ? (new Date(expectedStr.replace(' ', 'T')).getTime() || now) : now;
        const daysElapsed = Math.max(1, Math.ceil((now - borrowMs) / (1000 * 3600 * 24)));
        const isOverdue = now > expectedMs;
        const totalSpan = Math.max(1, expectedMs - borrowMs);
        const isHalfwayPassed = (now - borrowMs) >= (totalSpan / 2) && !isOverdue;
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
  }, [allEquipmentList, equipmentList, userDept]);

  // 本科室相关的审批流转单据
  const deptApprovalApplications = useMemo(() => {
    if (!userDept) return approvalApplications;
    return approvalApplications.filter(a => 
      a.applicantDepartment === userDept || 
      a.applicantDepartment?.includes(userDept) ||
      a.applicantName === currentUser?.name
    );
  }, [approvalApplications, userDept, currentUser]);

  // 待科室初审的单据（护士长/科主任需审批）
  const pendingDeptSignoffs = useMemo(() => {
    return deptApprovalApplications.filter(a => a.status === 'pending_dept');
  }, [deptApprovalApplications]);

  // 待派单故障设备（按视角过滤）
  const faultyDevices = useMemo(() => {
    return scopedEquipmentList.filter(e => e.status === '故障待修');
  }, [scopedEquipmentList]);

  // 本科室30-60天内待强检或待维保设备
  const upcomingPmAndCalibrations = useMemo(() => {
    return scopedEquipmentList.filter(e => {
      if (e.nextCalibrationDate) {
        const diff = Math.ceil((new Date(e.nextCalibrationDate).getTime() - new Date('2026-08-17').getTime()) / (1000 * 3600 * 24));
        if (diff >= 0 && diff <= 60) return true;
      }
      if (e.nextMaintenanceDate) {
        const diff = Math.ceil((new Date(e.nextMaintenanceDate).getTime() - new Date('2026-08-17').getTime()) / (1000 * 3600 * 24));
        if (diff >= 0 && diff <= 45) return true;
      }
      return false;
    });
  }, [scopedEquipmentList]);

  // 本科室急救生命支持类设备（用于晨间交接点检）
  const lifeSupportDevices = useMemo(() => {
    return scopedEquipmentList.filter(e => 
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

  // 计算当前视角下的核心指标
  const activeStats = useMemo(() => {
    if (!isDeptView) return stats;
    const total = scopedEquipmentList.length;
    const normal = scopedEquipmentList.filter(e => e.status === '正常运行').length;
    const maint = scopedEquipmentList.filter(e => e.status === '维护保养中').length;
    const fault = scopedEquipmentList.filter(e => e.status === '故障待修').length;
    const decomm = scopedEquipmentList.filter(e => e.status === '停用/报废').length;
    const val = scopedEquipmentList.reduce((s, e) => s + (e.purchasePrice || 0), 0);
    const cost = scopedEquipmentList.reduce((s, e) => s + (e.repairRecords || []).reduce((rs, r) => rs + (r.cost || 0), 0), 0);
    return {
      totalCount: total,
      normalCount: normal,
      maintenanceCount: maint,
      faultCount: fault,
      decommissionedCount: decomm,
      totalValue: val,
      monthlyRepairCost: cost
    };
  }, [isDeptView, scopedEquipmentList, stats]);

  // 重点科室指标监控（全院视图用）
  const keyDepartments = ['急诊科', '重症医学科(ICU)', '麻醉手术科', '医学影像科', '心血管内科'];
  const departmentStats = useMemo(() => {
    return keyDepartments.map(dept => {
      const list = equipmentList.filter(e => 
        e.department === dept || 
        e.department?.includes(dept.split('(')[0]) || 
        (dept === '麻醉手术科' && (e.department === '手术室' || e.department?.includes('手术')))
      );
      const faultCount = list.filter(e => e.status === '故障待修').length;
      const maintCount = list.filter(e => e.status === '维护保养中').length;
      const normalCount = list.filter(e => e.status === '正常运行').length;
      return {
        name: dept,
        total: list.length,
        normalCount,
        faultCount,
        maintCount,
        healthRate: list.length ? Math.round((normalCount / list.length) * 100) : 100
      };
    });
  }, [equipmentList]);

  // 本科室设备类别健康度矩阵（本科室专属视角用）
  const deptCategoryBreakdown = useMemo(() => {
    if (!isDeptView) return [];
    const catMap = new Map<string, { total: number; normal: number; fault: number; maint: number }>();
    
    scopedEquipmentList.forEach(eq => {
      const cat = eq.category || '常规医疗器械';
      const cur = catMap.get(cat) || { total: 0, normal: 0, fault: 0, maint: 0 };
      cur.total += 1;
      if (eq.status === '正常运行') cur.normal += 1;
      else if (eq.status === '故障待修') cur.fault += 1;
      else if (eq.status === '维护保养中') cur.maint += 1;
      catMap.set(cat, cur);
    });

    return Array.from(catMap.entries()).map(([category, d]) => ({
      category,
      total: d.total,
      normal: d.normal,
      fault: d.fault,
      maint: d.maint,
      healthRate: d.total ? Math.round((d.normal / d.total) * 100) : 100
    })).sort((a, b) => b.total - a.total);
  }, [isDeptView, scopedEquipmentList]);

  // 过滤当前展示的日程项目（融合科室智能范围过滤）
  const filteredScheduleList = useMemo(() => {
    const todayDate = '2026-08-17';
    return scheduleItems.filter(item => {
      // 1. 日期维度筛选
      if (scheduleFilterTab === 'today') {
        if (item.date !== todayDate) return false;
      } else if (scheduleFilterTab === 'upcoming') {
        if (item.date <= todayDate) return false;
      }
      
      // 2. 类别维度筛选
      if (scheduleCategoryFilter !== 'all' && item.category !== scheduleCategoryFilter) {
        return false;
      }

      // 3. 科室专属范围过滤
      if (scheduleScopeFilter === 'dept_only' && hasDeptScope) {
        const isMatchedDept = 
          item.location.includes(userDept) ||
          item.title.includes(userDept) ||
          item.assignedStaff.includes(currentUser?.name || '') ||
          item.assignedStaff.includes(userDept) ||
          (item.notes && item.notes.includes(userDept));
        if (!isMatchedDept) return false;
      }

      return true;
    });
  }, [scheduleItems, scheduleFilterTab, scheduleCategoryFilter, scheduleScopeFilter, hasDeptScope, userDept, currentUser]);

  // 一键完成交接班点检
  const handleCompleteHandoverCheck = () => {
    const todayDate = '2026-08-17';
    const existingIndex = scheduleItems.findIndex(s => 
      s.date === todayDate && 
      (s.title.includes('交接班') || s.title.includes('点检')) && 
      (s.location.includes(userDept) || s.title.includes(userDept))
    );

    let updated: WorkScheduleItem[];
    if (existingIndex >= 0) {
      updated = scheduleItems.map((item, idx) => 
        idx === existingIndex ? { ...item, status: 'completed' } : item
      );
    } else {
      const newItem: WorkScheduleItem = {
        id: `SCH-${todayDate}-${Date.now()}`,
        title: `${userDept} 抢救生命支持类设备交接班与急救包点检`,
        category: '例行工作',
        date: todayDate,
        timeRange: '08:00 - 08:30',
        location: `${userDept} 抢救室/治疗室`,
        assignedStaff: `${currentUser?.name || '护士长'} (${userDept})`,
        priority: 'high',
        status: 'completed',
        notes: `由 ${currentUser?.name || '护士长'} 完成晨间交接点检，本科室在位设备全部核对完毕，运行状态正常。`
      };
      updated = [newItem, ...scheduleItems];
    }
    setScheduleItems(updated);
    saveScheduleItems(updated);
    setHandoverSuccessMessage(`已完成【${userDept}】今日急救设备晨间交接点检！已记录入工作台日程。`);
    setTimeout(() => setHandoverSuccessMessage(''), 4000);
  };

  // 统计日程数据指标
  const scheduleStats = useMemo(() => {
    const todayDate = '2026-08-17';
    const todayTasks = scheduleItems.filter(s => s.date === todayDate);
    const todayCompleted = todayTasks.filter(s => s.status === 'completed').length;
    const todayPending = todayTasks.filter(s => s.status !== 'completed').length;
    const urgentTasks = todayTasks.filter(s => s.priority === 'urgent' && s.status !== 'completed').length;
    const upcomingTasks = scheduleItems.filter(s => s.date > todayDate).length;

    return {
      todayTotal: todayTasks.length,
      todayCompleted,
      todayPending,
      urgentTasks,
      upcomingTasks
    };
  }, [scheduleItems]);

  // 切换任务完成状态
  const handleToggleTaskStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  // 删除日程
  const handleDeleteSchedule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要移除此项工作日程安排吗？')) {
      const updated = scheduleItems.filter(item => item.id !== id);
      setScheduleItems(updated);
      saveScheduleItems(updated);
    }
  };

  // 打开新增日程弹窗
  const handleOpenAddModal = () => {
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

  // 打开编辑日程弹窗
  const handleOpenEditModal = (item: WorkScheduleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingScheduleItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDate(item.date);
    setFormTimeRange(item.timeRange);
    setFormLocation(item.location);
    setFormAssignedStaff(item.assignedStaff);
    setFormPriority(item.priority);
    setFormRelatedDeviceId(item.relatedDeviceId || '');
    setFormNotes(item.notes || '');
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
      // 更新
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
      // 新增
      const dateKey = (formDate || '').replace(/-/g, '') || '20260901';
      const newItem: WorkScheduleItem = {
        id: `SCH-${dateKey}-${Date.now().toString().slice(-3)}`,
        title: formTitle.trim(),
        category: formCategory,
        date: formDate,
        timeRange: formTimeRange,
        location: formLocation.trim() || '全院区域',
        assignedStaff: formAssignedStaff.trim() || (currentUser?.name ? `${currentUser.name} (${currentUser.employeeNo})` : '责任工程师'),
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

  // 快速处理日程对应的任务
  const handleActionSchedule = (item: WorkScheduleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.relatedDeviceId) {
      const matched = equipmentList.find(eq => eq.id === item.relatedDeviceId || eq.sn === item.relatedDeviceSn);
      if (matched) {
        if (item.category === '故障抢修') {
          onOpenRepairModal(matched);
        } else {
          onSelectDeviceDetail(matched);
        }
        return;
      }
    }
    // 标记状态为进行中或完成
    handleToggleTaskStatus(item.id);
  };

  // 查找关联的设备对象
  const getLinkedDevice = (item: WorkScheduleItem) => {
    if (!item.relatedDeviceId && !item.relatedDeviceSn) return null;
    return equipmentList.find(eq => eq.id === item.relatedDeviceId || eq.sn === item.relatedDeviceSn) || null;
  };

  // 获取分类徽章样式
  const getCategoryBadgeStyle = (cat: WorkScheduleItem['category']) => {
    switch (cat) {
      case '强检定标':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case '预防性维护':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '故障抢修':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case '科室巡检':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '质控抽检':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '例行工作':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const currentHealthRate = activeStats.totalCount ? Math.round((activeStats.normalCount / activeStats.totalCount) * 100) : 100;

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-full pb-6">
      
      {/* ==================== 1. 工作台身份与科室导览 ==================== */}
      <div className="bg-white rounded-xl px-4 py-3 text-slate-800 shadow-2xs border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* 左侧：问候、人员科室与视角 */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              {greetingText}，{currentUser ? currentUser.name : '医工主管'}
            </span>
            {currentUser && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getRoleBadgeStyle(currentUser.role)}`}>
                {currentUser.role}
              </span>
            )}
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

            {/* 护士长专属科室锁定标识 */}
            {userIsNurse && userDept && (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {userDept}专属
              </span>
            )}

            {/* 护士长模式切换开关 (事务矩阵 vs 工作日程) */}
            {isDeptView && (
              <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-xs font-medium ml-1">
                <button
                  type="button"
                  onClick={() => setNurseWorkMode('affairs')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    nurseWorkMode === 'affairs'
                      ? 'bg-white text-rose-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="科室事务矩阵"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>事务协同</span>
                  {pendingDeptSignoffs.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {pendingDeptSignoffs.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setNurseWorkMode('schedule')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    nurseWorkMode === 'schedule'
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="工作排班与巡检日程"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>排班巡检</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：工作台快捷动作 */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* 轻提示 */}
          {handoverSuccessMessage && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{handoverSuccessMessage}</span>
            </span>
          )}

          {isDeptView && (userIsNurse || userIsClinical) && (
            <button
              onClick={handleCompleteHandoverCheck}
              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="完成今日急救生命支持设备交接点检"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>晨间交接点检</span>
            </button>
          )}

          {userIsNurse && (
            <button
              onClick={() => onNavigateToTab?.('approvals')}
              className="h-8 px-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="科室流转审批单"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>科室审批 {deptApprovalApplications.length > 0 && `(${deptApprovalApplications.length})`}</span>
            </button>
          )}

          <button
            onClick={() => onOpenRepairModal()}
            className="h-8 px-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            title="发起故障报修"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>紧急报修</span>
          </button>

          <button
            onClick={() => onNavigateToTab?.('adverse_events')}
            className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            title="不良事件直报"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>不良事件</span>
          </button>

          {/* 月度对账只在管理科室/全院视角展示，临床科室人员无需进行供应商框架对账 */}
          {!isDeptView ? (
            <button
              onClick={() => onNavigateToTab?.('vendor_collaboration')}
              className="h-8 px-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="进入月度框架维保与双方即时对账工作台"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>月度对账</span>
              {urgentReconcileCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                  {urgentReconcileCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => onNavigateToApprovals?.()}
              className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="查看科室审批流转事项"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>科室审批</span>
              {pendingDeptSignoffs.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                  {pendingDeptSignoffs.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onNavigateToLedger('', isDeptView ? userDept : undefined)}
            className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            title={isDeptView ? `查看${userDept}设备台账` : '查看全院设备台账'}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>{isDeptView ? `${userDept}台账` : '全院台账'}</span>
          </button>
        </div>
      </div>

      {/* ==================== 2. 置顶核心卡片网格 (未开票项目、待回款进度、月度维修费用置顶高亮) ==================== */}
      <PinnedFinancialKpiGrid
        batches={frameworkBatches}
        monthlyRepairCost={activeStats.monthlyRepairCost}
        healthRate={currentHealthRate}
        normalCount={activeStats.normalCount}
        faultCount={activeStats.faultCount}
        borrowedCount={borrowedEmergencyDevices.length}
        urgentReconcileCount={urgentReconcileCount}
        totalDiffAmount={totalDiffAmount}
        isDeptView={isDeptView}
        userDept={userDept}
        pendingDeptSignoffsCount={pendingDeptSignoffs.length}
        upcomingPmCount={upcomingPmAndCalibrations.length}
        lifeSupportCount={lifeSupportDevices.length}
        onNavigateToTab={onNavigateToTab}
        onScrollToReconciliation={handleScrollToReconciliation}
        onNavigateToApprovals={() => onNavigateToApprovals?.()}
      />

      {/* ==================== 3. 主体工作区 ==================== */}
      {isDeptView && nurseWorkMode === 'affairs' ? (
        /* ------------------ 模式 A: 护士长专属事务协同矩阵 (Nurse Affairs Hub) ------------------ */
        <div className="flex-1 min-h-[580px] grid grid-cols-1 lg:grid-cols-12 gap-2.5">
          
          {/* 左侧大栏 (6/12)：在借应急设备池 + 故障抢修与闭环跟踪 */}
          <div className="lg:col-span-6 flex flex-col gap-2.5 min-h-[500px]">
            
            {/* 上半区：🔄 本科室在借应急储备设备追踪池 */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-cyan-600" />
                    <span>【{userDept}】在借应急储备设备协同池</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    在用 {borrowedEmergencyDevices.length} 台
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigateToTab?.('emergency_reserve')}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-bold flex items-center gap-0.5 transition cursor-pointer"
                  >
                    <span>应急调度中心</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 借调设备列表 */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 mt-2 pr-0.5">
                {borrowedEmergencyDevices.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-90 mb-1" />
                    <p className="text-slate-700 font-bold text-xs">本科室当前未占用应急库机具</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">急救生命支持资源充足，可随时按需发起应急借调</p>
                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('emergency_reserve')}
                      className="mt-2.5 px-3 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>前往应急库借调急救机具</span>
                    </button>
                  </div>
                ) : (
                  borrowedEmergencyDevices.map(({ device, loan, daysElapsed, isOverdue, isHalfwayPassed, daysRemaining, daysOverdue }) => (
                    <div key={device.id} className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 px-1.5 rounded-lg transition">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            onClick={() => onSelectDeviceDetail(device)}
                            className="font-bold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer truncate max-w-[160px]"
                            title={device.name}
                          >
                            {device.name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {device.sn}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {device.model}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>借用人: <strong className="text-slate-700">{loan.borrowerName || currentUser?.name}</strong></span>
                          <span>在科时长: <strong className="text-slate-700">{daysElapsed}天</strong></span>
                          <span className="font-mono">应还: {loan.expectedReturnTime || (loan as any).expectedReturnDate || '待定'}</span>
                          
                          {/* 核心需求：‘剩余使用天数’倒计时标签：过半黄色提醒、到期红色提醒 */}
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-2xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>已到期 · 超期 {daysOverdue} 天</span>
                            </span>
                          ) : isHalfwayPassed ? (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>借期过半 · 剩 {daysRemaining} 天</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>剩余 {daysRemaining} 天</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 护士长专属快捷处理动作 */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onReturnEquipment?.(device)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="办理设备归还验收"
                        >
                          <Check className="w-3 h-3" />
                          <span>办理归还</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToApprovals) {
                              onNavigateToApprovals({
                                type: 'procurement_increase',
                                title: `【${userDept}】申购增配 ${device.name} 论证申请`,
                                targetEquipmentName: device.name,
                                targetModel: device.model,
                                applicantDepartment: userDept,
                                borrowingHistorySummary: `本科室从应急库借调 ${device.name} (${device.sn}) 已累计在科使用 ${daysElapsed} 天，临床周转急需常态化增配。`
                              });
                            } else {
                              onNavigateToTab?.('approvals');
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="根据借用频率一键发起增配申购"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>发起增配</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 下半区：🚨 本科室故障待修与维修进度监控 */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${faultyDevices.length > 0 ? 'bg-rose-500 animate-ping' : 'bg-blue-500'}`}></div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>【{userDept}】维修协同与维保闭环</span>
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* 维修类别快速切换药丸 */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNurseRepairTab('internal')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        nurseRepairTab === 'internal'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>科室故障</span>
                      <span className={`text-[10px] px-1 rounded ${faultyDevices.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                        {faultyDevices.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNurseRepairTab('vendor')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        nurseRepairTab === 'vendor'
                          ? 'bg-white text-blue-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Building2 className="w-3 h-3 text-blue-600" />
                      <span>外协零修换件</span>
                      <span className="text-[10px] px-1 rounded bg-blue-100 text-blue-800 font-bold">
                        {deptFrameworkItems.length}
                      </span>
                    </button>
                  </div>

                  {nurseRepairTab === 'internal' ? (
                    <button
                      type="button"
                      onClick={() => onOpenRepairModal()}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>登记新报修</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('vendor_collaboration')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>外协协同大厅</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 列表内容区 */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 mt-2 pr-0.5">
                {nurseRepairTab === 'internal' ? (
                  faultyDevices.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-90 mb-1" />
                      <p className="text-slate-700 font-bold text-xs">本科室全部设备正常运行中</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        无停机报修工单 · 当前归集外协配件零修项目 {deptFrameworkItems.length} 项
                      </p>
                      {deptFrameworkItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setNurseRepairTab('vendor')}
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          切换查看【{userDept}】外协零修与换件协同明细 ({deptFrameworkItems.length}项) →
                        </button>
                      )}
                    </div>
                  ) : (
                    faultyDevices.map((device) => (
                      <div key={device.id} className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 px-1.5 rounded-lg transition">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              onClick={() => onSelectDeviceDetail(device)}
                              className="font-bold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer truncate max-w-[170px]"
                              title={device.name}
                            >
                              {device.name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {device.sn}
                            </span>
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                              急需抢修
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate" title={device.lastFaultReason || '暂未录入故障原因'}>
                            报修现象: <span className="text-slate-900 font-medium">{device.lastFaultReason || '开机报错/传感器报警/回路漏气，急需值班工程师排查'}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenAiModal(device)}
                            className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="AI智能急救故障排查与指导"
                          >
                            <Bot className="w-3.5 h-3.5 text-cyan-600" />
                            <span>AI排查</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenRepairModal(device)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="催办或派单抢修"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>派单抢修</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenStatusModal(device)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="设备已排除故障，点击修复故障并恢复正常运行"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>修复故障</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* 外协零修与配件更换明细 */
                  deptFrameworkItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 text-xs">
                      <p className="text-slate-700 font-bold text-xs">【{userDept}】暂无外协零星维修项目</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">所有外协报修与换件将自动归集到本科室名下</p>
                    </div>
                  ) : (
                    deptFrameworkItems.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 px-1.5 rounded-lg transition">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              onClick={() => onNavigateToTab?.('vendor_collaboration')}
                              className="font-bold text-slate-900 text-xs hover:text-blue-700 cursor-pointer truncate max-w-[200px]"
                              title={item.itemName}
                            >
                              {item.itemName}
                            </span>
                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              {item.workOrderNo || 'WO-外协'}
                            </span>
                            <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              item.clinicalReceiveStatus === 'SIGNED' || item.clinicalSignee
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {item.clinicalReceiveStatus === 'SIGNED' || item.clinicalSignee ? '已电子签✓' : '待科室验签'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>施工日期: {item.serviceDate}</span>
                            <span>· 工程师: {item.engineerName || item.technician || '驻场工'}</span>
                            <span className="font-semibold text-slate-700">· 金额: ¥{item.totalPrice}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onNavigateToTab?.('vendor_collaboration')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="前往外协协同大厅查看四流合规凭单与电子核签"
                          >
                            <span>查验凭单</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

          </div>

          {/* 右侧大栏 (6/12)：本科室审批流转 + 晨检点检与强检预警 */}
          <div className="lg:col-span-6 h-full flex flex-col gap-2.5 min-h-0 overflow-hidden">
            
            {/* 模块 C: 📋 本科室审批单据流转与待办中心 */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    【{userDept}】审批流转中心
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    流转 {deptApprovalApplications.length} 项
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('approvals')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 transition cursor-pointer"
                >
                  <span>进入审批流</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 审批列表 */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 mt-2 pr-0.5">
                {deptApprovalApplications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-90 mb-1" />
                    <p className="text-slate-700 font-bold text-xs">本科室暂无流转中审批单</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">可发起设备增配采购、配件更换或报废技术鉴定</p>
                  </div>
                ) : (
                  deptApprovalApplications.map((app) => {
                    const isPendingDept = app.status === 'pending_dept';
                    return (
                      <div key={app.id} className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 px-1.5 rounded-lg transition">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isPendingDept && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                                待科室初审
                              </span>
                            )}
                            <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]" title={app.title}>
                              {app.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            <span className="font-mono text-slate-400">{app.id}</span>
                            <span>当前节点: <strong className="text-slate-700">{app.currentApprovalNode}</strong></span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateToTab?.('approvals')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                            isPendingDept
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isPendingDept ? '立即签批' : '查看进度'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 模块 D: 🛡️ 本科室近期法定强检定标与维保预警 */}
            <div className="h-[210px] bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 flex flex-col justify-between shrink-0 overflow-hidden">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    【{userDept}】法定强检与维保预警
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    近60天 {upcomingPmAndCalibrations.length} 台
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('maintenance')}
                  className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-0.5 transition cursor-pointer"
                >
                  <span>维保计划</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 列表 */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 mt-1 pr-0.5">
                {upcomingPmAndCalibrations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-90 mb-1" />
                    <p className="text-slate-700 font-bold text-xs">近期无即将超期强检/维保设备</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">全部计量证书与预防性维护均在有效期内</p>
                  </div>
                ) : (
                  upcomingPmAndCalibrations.slice(0, 3).map((eq) => (
                    <div key={eq.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            onClick={() => onSelectDeviceDetail(eq)}
                            className="font-bold text-slate-900 text-xs hover:text-purple-600 cursor-pointer truncate max-w-[160px]"
                            title={eq.name}
                          >
                            {eq.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                            {eq.sn}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>下次定标: <strong className="text-purple-700 font-mono">{eq.nextCalibrationDate || eq.nextMaintenanceDate}</strong></span>
                          <span>检定机构: {eq.calibrationAgency || '山东省计量科学研究院'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectDeviceDetail(eq)}
                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-semibold transition cursor-pointer shrink-0"
                      >
                        档案
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 底部晨间急救设备交接打卡 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                  <span>在位生命支持设备: <strong>{lifeSupportDevices.length}台</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleCompleteHandoverCheck}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>晨间交接打卡</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ------------------ 模式 B: 日程排班与巡检看板 (Schedule View) ------------------ */
        <div className="flex-1 min-h-[580px] grid grid-cols-1 lg:grid-cols-12 gap-2.5">
          
          {/* 左侧栏 (5/12)：今日与近期工作日程看板 */}
          <div className="lg:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden min-h-[500px]">
            {/* 日程工具栏 */}
            <div className="px-3 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1.5 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  {isDeptView ? `【${userDept}】日程` : '工作日程看板'}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {scheduleFilterTab === 'today' ? `今日 ${filteredScheduleList.length}项` : `近期 ${filteredScheduleList.length}项`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 科室专属范围过滤按钮 */}
                {hasDeptScope && (
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setScheduleScopeFilter('dept_only')}
                      className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                        scheduleScopeFilter === 'dept_only'
                          ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      仅看{userDept}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleScopeFilter('all')}
                      className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                        scheduleScopeFilter === 'all'
                          ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      全部
                    </button>
                  </div>
                )}

                {/* Tab 切换 */}
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-[10.5px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setScheduleFilterTab('today')}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                      scheduleFilterTab === 'today'
                        ? 'bg-white text-slate-800 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>今日</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] flex items-center justify-center font-bold">
                      {scheduleStats.todayTotal}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleFilterTab('upcoming')}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                      scheduleFilterTab === 'upcoming'
                        ? 'bg-white text-slate-800 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>近期</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 text-[9px] flex items-center justify-center font-bold">
                      {scheduleStats.upcomingTasks}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleFilterTab('all')}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      scheduleFilterTab === 'all'
                        ? 'bg-white text-slate-800 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    全部
                  </button>
                </div>

                {/* 类别筛选 */}
                <select
                  value={scheduleCategoryFilter}
                  onChange={(e) => setScheduleCategoryFilter(e.target.value)}
                  aria-label="按类别筛选"
                  className="text-[10.5px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">全部类型</option>
                  <option value="强检定标">强检定标</option>
                  <option value="预防性维护">预防性维护</option>
                  <option value="故障抢修">故障抢修</option>
                  <option value="科室巡检">科室巡检</option>
                  <option value="质控抽检">质控抽检</option>
                  <option value="例行工作">例行工作</option>
                </select>

                <button
                  onClick={handleOpenAddModal}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10.5px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>新建</span>
                </button>
              </div>
            </div>

            {/* 日程列表主体 */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
              {filteredScheduleList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
                  <p className="text-xs font-semibold text-slate-600">当前条件下无待办工作日程安排</p>
                  <button
                    onClick={handleOpenAddModal}
                    className="text-xs text-indigo-600 hover:underline font-bold"
                  >
                    + 新增工作日程安排
                  </button>
                </div>
              ) : (
                filteredScheduleList.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const isInProgress = task.status === 'in_progress';
                  const linkedDevice = getLinkedDevice(task);

                  return (
                    <div
                      key={task.id}
                      className={`p-2 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors ${
                        isCompleted ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      {/* 左侧：复选框 + 时间 + 描述 */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleTaskStatus(task.id, e)}
                          className="text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0"
                          title={isCompleted ? '标记为未完成' : '标记为已完成'}
                        >
                          {isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-indigo-500" />
                          )}
                        </button>

                        <div className="w-20 shrink-0">
                          <div className="text-[11px] font-bold font-mono text-slate-700 flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{task.timeRange}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {task.date}
                          </div>
                        </div>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {task.priority === 'urgent' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                紧急
                              </span>
                            )}
                            {task.priority === 'high' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                重要
                              </span>
                            )}

                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${getCategoryBadgeStyle(task.category)}`}>
                              {task.category}
                            </span>

                            {isCompleted ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                已结单
                              </span>
                            ) : isInProgress ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse shrink-0">
                                执行中
                              </span>
                            ) : null}

                            <span className={`text-xs font-bold text-slate-900 truncate ${isCompleted ? 'line-through text-slate-400' : ''}`} title={task.title}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[10.5px] text-slate-500 flex-wrap">
                            <span className="flex items-center gap-0.5 truncate max-w-[140px]" title={task.location}>
                              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{task.location}</span>
                            </span>
                            <span className="flex items-center gap-0.5 truncate max-w-[110px]" title={task.assignedStaff}>
                              <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{task.assignedStaff}</span>
                            </span>

                            {task.relatedDeviceName && (
                              <span 
                                onClick={() => linkedDevice && onSelectDeviceDetail(linkedDevice)}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium ${
                                  linkedDevice ? 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 cursor-pointer' : ''
                                }`}
                                title="点击查看设备档案"
                              >
                                <Stethoscope className="w-2.5 h-2.5 text-indigo-600" />
                                <span className="truncate max-w-[120px]">{task.relatedDeviceName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 动作按钮 */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => handleActionSchedule(task, e)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer ${
                              task.category === '故障抢修'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {task.category === '故障抢修' ? (
                              <>
                                <Wrench className="w-3 h-3" />
                                <span>抢修</span>
                              </>
                            ) : linkedDevice ? (
                              <>
                                <FileText className="w-3 h-3" />
                                <span>设备</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>完成</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(task, e)}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="编辑"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSchedule(task.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右侧栏 (7/12)：设备故障频率统计 + 急需抢修 + 核心健康度监控台 */}
          <div className="lg:col-span-7 flex flex-col gap-2 min-h-[500px]">
            
            {/* 顶部分类监控 Tab 栏 */}
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                <span>医工质控与设备监控台</span>
              </div>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setRightMonitorTab('fault_stats')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer ${
                    rightMonitorTab === 'fault_stats'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="设备故障频率统计（支持饼图/折线图）"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>故障频率统计</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightMonitorTab('emergency_repairs')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer ${
                    rightMonitorTab === 'emergency_repairs'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="急需抢修处置设备"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>待修处置</span>
                  {faultyDevices.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold animate-pulse">
                      {faultyDevices.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRightMonitorTab('dept_health')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer ${
                    rightMonitorTab === 'dept_health'
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="核心科室与分类健康度"
                >
                  <Building2 className="w-3 h-3 text-indigo-400" />
                  <span>健康度</span>
                </button>
              </div>
            </div>

            {/* 动态卡片内容 */}
            {rightMonitorTab === 'fault_stats' ? (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <FaultFrequencyAnalysisCard 
                  equipmentList={scopedEquipmentList}
                  userDept={userDept}
                  isDeptView={isDeptView}
                  onNavigateToLedger={onNavigateToLedger}
                  onNavigateToTab={onNavigateToTab}
                  onSelectDeviceDetail={onSelectDeviceDetail}
                  className="h-full"
                />
              </div>
            ) : rightMonitorTab === 'emergency_repairs' ? (
              /* 上卡片：急需处置故障设备 */
              <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      {isDeptView ? `【${userDept}】急需报修设备 (待响应)` : '全院急需抢修处置设备 (待响应派工)'}
                    </h3>
                  </div>
                  <button
                    onClick={() => onNavigateToLedger('故障待修', isDeptView ? userDept : undefined)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 transition cursor-pointer"
                  >
                    查看全部 ({faultyDevices.length})
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 设备列表 */}
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 mt-1 pr-0.5">
                  {faultyDevices.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-4 text-center text-slate-400 text-xs font-medium">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 opacity-90 mb-1.5" />
                      <p className="text-slate-700 font-bold text-xs">
                        {isDeptView ? `【${userDept}】当前无急需报修设备` : '全院暂无急需报修设备'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">所有急救生命支持与监护设备处于完好待命状态</p>
                      <button
                        onClick={() => onOpenRepairModal()}
                        className="mt-2.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>登记新报修工单</span>
                      </button>
                    </div>
                  ) : (
                    faultyDevices.map((device) => (
                      <div key={device.id} className="py-2 flex items-center justify-between gap-2 hover:bg-slate-50/80 px-1 rounded-md transition">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span 
                              className="font-bold text-slate-800 text-xs hover:text-indigo-600 cursor-pointer truncate max-w-[150px]" 
                              onClick={() => onSelectDeviceDetail(device)}
                              title={device.name}
                            >
                              {device.name}
                            </span>
                            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 text-[9px] font-bold rounded">
                              {device.department}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate" title={device.lastFaultReason || '暂未录入报修原因'}>
                            {device.lastFaultReason || '电源告警/报错停机，需要急诊响应'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onOpenAiModal(device)}
                            className="px-2 py-0.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded text-[11px] font-semibold transition flex items-center gap-0.5 cursor-pointer"
                            title="AI智能诊断排查"
                          >
                            <Bot className="w-3 h-3 text-cyan-600" />
                            <span>AI排查</span>
                          </button>
                          <button
                            onClick={() => onOpenRepairModal(device)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                            title="立即登记派工"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>派单抢修</span>
                          </button>
                          <button
                            onClick={() => onOpenStatusModal(device)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                            title="设备已排除故障，点击修复并恢复正常运行"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>修复故障</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* 下卡片：核心科室设备完好率监控 */
              <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {isDeptView ? `【${userDept}】重点设备分类健康度` : '全院核心科室设备健康度 (Health Matrix)'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isDeptView ? `${scopedEquipmentList.length}台在册` : '实时监测'}
                    </span>
                  </div>

                  {isDeptView ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2">
                      {deptCategoryBreakdown.slice(0, 4).map((cat) => (
                        <div key={cat.category} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                          <div className="text-[10px] font-bold text-slate-700 truncate" title={cat.category}>
                            {(cat.category || '').replace('呼吸、麻醉和急救器械', '急救呼吸类').replace('医用诊察和监护器械', '诊察监护类').replace('妇产科、辅助生殖和避孕器械', '妇产专科类')}
                          </div>
                          <div className="text-xs font-bold text-emerald-600 mt-0.5">
                            {cat.healthRate}% <span className="text-[10px] text-slate-400 font-normal">({cat.normal}/{cat.total})</span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${cat.healthRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                              style={{ width: `${cat.healthRate}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      {deptCategoryBreakdown.length === 0 && (
                        <div className="col-span-4 text-center text-xs text-slate-400 py-1">本科室暂无分类数据</div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5 mt-2">
                      {departmentStats.map((dept) => (
                        <div key={dept.name} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                          <div className="text-[10px] font-bold text-slate-700 truncate" title={dept.name}>
                            {(dept.name || '').replace('重症医学科(ICU)', 'ICU').replace('医学影像科', '影像科').replace('心血管内科', '心内科')}
                          </div>
                          <div className="text-xs font-bold text-emerald-600 mt-0.5">
                            {dept.healthRate}%
                          </div>
                          <div className="w-full h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${dept.healthRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                              style={{ width: `${dept.healthRate}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 底部快捷操作入口栏（常驻快捷通道） */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-2 shrink-0">
              <div className="grid grid-cols-4 gap-1.5">
                {isDeptView && (userIsNurse || userIsClinical) ? (
                  <>
                    <button
                      onClick={handleCompleteHandoverCheck}
                      className="p-1.5 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-center transition group cursor-pointer"
                      title="完成交接班点检"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">交接点检</div>
                    </button>

                    <button
                      onClick={() => onOpenRepairModal()}
                      className="p-1.5 bg-amber-50/70 hover:bg-amber-100 border border-amber-100 rounded-lg text-center transition group cursor-pointer"
                      title="科室设备报修"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">科室报修</div>
                    </button>

                    <button
                      onClick={() => onOpenAiModal()}
                      className="p-1.5 bg-cyan-50/70 hover:bg-cyan-100 border border-cyan-100 rounded-lg text-center transition group cursor-pointer"
                      title="AI急救应急排查"
                    >
                      <Bot className="w-3.5 h-3.5 text-cyan-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">AI排查</div>
                    </button>

                    <button
                      onClick={() => onNavigateToLedger('', userDept)}
                      className="p-1.5 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-center transition group cursor-pointer"
                      title={`查看${userDept}设备台账`}
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">科室台账</div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onOpenAddModal}
                      className="p-1.5 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-center transition group cursor-pointer"
                      title="资产建卡"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">资产建卡</div>
                    </button>

                    <button
                      onClick={() => onOpenRepairModal()}
                      className="p-1.5 bg-amber-50/70 hover:bg-amber-100 border border-amber-100 rounded-lg text-center transition group cursor-pointer"
                      title="故障报修"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">故障报修</div>
                    </button>

                    <button
                      onClick={() => onOpenAiModal()}
                      className="p-1.5 bg-cyan-50/70 hover:bg-cyan-100 border border-cyan-100 rounded-lg text-center transition group cursor-pointer"
                      title="AI专家排查"
                    >
                      <Bot className="w-3.5 h-3.5 text-cyan-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">AI排查</div>
                    </button>

                    <button
                      onClick={() => onNavigateToLedger()}
                      className="p-1.5 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-100 rounded-lg text-center transition group cursor-pointer"
                      title="全院台账"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-slate-800 mt-0.5">全院台账</div>
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================== 4. 新增 / 编辑工作日程模态框 ==================== */}
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
                  onChange={(e) => setFormTitle(e.target.value)}
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
                    onChange={(e) => setFormCategory(e.target.value as any)}
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
                    onChange={(e) => setFormPriority(e.target.value as any)}
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
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">时间段 (Time Range)</label>
                  <input
                    type="text"
                    value={formTimeRange}
                    onChange={(e) => setFormTimeRange(e.target.value)}
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
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="如 外科综合楼 3F 手术室"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">责任人 / 工程师</label>
                  <input
                    type="text"
                    value={formAssignedStaff}
                    onChange={(e) => setFormAssignedStaff(e.target.value)}
                    placeholder="如 崔伟 (EMP-7001)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">关联医疗设备 (可选)</label>
                <select
                  value={formRelatedDeviceId}
                  onChange={(e) => setFormRelatedDeviceId(e.target.value)}
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
                  onChange={(e) => setFormNotes(e.target.value)}
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

    </div>
  );
};

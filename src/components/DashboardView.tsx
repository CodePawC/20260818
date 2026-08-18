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
  X
} from 'lucide-react';
import { 
  WorkScheduleItem, 
  loadScheduleItems, 
  saveScheduleItems, 
} from '../utils/scheduleData';
import { getRoleBadgeStyle } from '../utils/staffRolesData';
import { isHeadNurse, isClinicalStaff, getUserDepartment } from '../utils/authUtils';

interface DashboardViewProps {
  stats: SystemStats;
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser | null;
  onNavigateToLedger: (statusFilter?: string, departmentFilter?: string) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onOpenRepairModal: (device?: MedicalEquipment) => void;
  onOpenAiModal: (device?: MedicalEquipment) => void;
  onOpenStatusModal: (device: MedicalEquipment) => void;
  onSelectDeviceDetail: (device: MedicalEquipment) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  equipmentList,
  currentUser,
  onNavigateToLedger,
  onNavigateToTab,
  onOpenAddModal,
  onOpenRepairModal,
  onOpenAiModal,
  onOpenStatusModal,
  onSelectDeviceDetail
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

  // 护士长强制锁定为本科室视角，不允许切换为全院视图
  const isDeptView = (userIsNurse && hasDeptScope) || (dashboardScope === 'department' && hasDeptScope);

  // 日程工作列表与持久化
  const [scheduleItems, setScheduleItems] = useState<WorkScheduleItem[]>(() => loadScheduleItems());
  const [scheduleFilterTab, setScheduleFilterTab] = useState<'today' | 'upcoming' | 'all'>('today');
  const [scheduleCategoryFilter, setScheduleCategoryFilter] = useState<string>('all');
  const [scheduleScopeFilter, setScheduleScopeFilter] = useState<'dept_only' | 'all'>(() => {
    return (userIsNurse || userIsClinical) && hasDeptScope ? 'dept_only' : 'all';
  });

  // 交接班点检成功轻提示
  const [handoverSuccessMessage, setHandoverSuccessMessage] = useState<string>('');
  
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

  // 当前日期描述
  const currentDateDisplay = useMemo(() => {
    return '2026年8月17日 星期一 · 安全保障中';
  }, []);

  // 当前视角下的设备列表
  const scopedEquipmentList = useMemo(() => {
    if (isDeptView) {
      return equipmentList.filter(e => e.department === userDept);
    }
    return equipmentList;
  }, [equipmentList, isDeptView, userDept]);

  // 待派单故障设备（按视角过滤）
  const faultyDevices = useMemo(() => {
    return scopedEquipmentList.filter(e => e.status === '故障待修');
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
    const cost = scopedEquipmentList.reduce((s, e) => s + e.repairRecords.reduce((rs, r) => rs + (r.cost || 0), 0), 0);
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
  const keyDepartments = ['急诊科', '重症医学科(ICU)', '手术室', '医学影像科', '心血管内科'];
  const departmentStats = useMemo(() => {
    return keyDepartments.map(dept => {
      const list = equipmentList.filter(e => e.department === dept || e.department?.includes(dept.split('(')[0]));
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
      const newItem: WorkScheduleItem = {
        id: `SCH-${formDate.replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
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
    <div className="h-full flex flex-col gap-2.5 overflow-hidden">
      
      {/* ==================== 1. 精简工作台欢迎与身份导航横条 (Slim Welcome Header) ==================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl px-4 py-2 text-white shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        {/* 左侧：问候、人员科室与视角切换 */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-base font-bold tracking-tight text-white whitespace-nowrap">
              {greetingText}，{currentUser ? currentUser.name : '医工值班主管'}！
            </span>
            {currentUser && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeStyle(currentUser.role)} bg-white/10`}>
                {currentUser.role}
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {currentUser?.employeeNo ? `[${currentUser.employeeNo}]` : '[EMP-7001]'}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-700 hidden lg:block"></div>

          <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <span className="flex items-center gap-1 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-medium">{currentUser?.organization || '五莲县人民医院'} · {userDept || '医学工程保障中心'}</span>
            </span>

            {/* 护士长专属科室锁定标识（无需全院视角） */}
            {userIsNurse && userDept && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600/90 text-white shadow-2xs">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>【{userDept}】专属工作台</span>
              </div>
            )}

            {/* 非护士长有科室身份的人员：科室专属视角 / 全院视图一键切换 */}
            {!userIsNurse && hasDeptScope && (
              <div className="flex items-center bg-slate-800/90 border border-slate-700 p-0.5 rounded-lg text-[11px] font-bold ml-1">
                <button
                  type="button"
                  onClick={() => {
                    setDashboardScope('department');
                    setScheduleScopeFilter('dept_only');
                  }}
                  className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                    isDeptView
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`切换为【${userDept}】本科室专属工作台`}
                >
                  <Stethoscope className="w-3 h-3" />
                  <span>{userDept}专属视角</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDashboardScope('hospital');
                    setScheduleScopeFilter('all');
                  }}
                  className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                    !isDeptView
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="切换为全院全局视图"
                >
                  <Building2 className="w-3 h-3" />
                  <span>全院全局视图</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：关键提示胶囊与工作台快捷动作 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 轻提示 */}
          {handoverSuccessMessage && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{handoverSuccessMessage}</span>
            </span>
          )}

          {isDeptView && (userIsNurse || userIsClinical) && (
            <button
              onClick={handleCompleteHandoverCheck}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs border border-emerald-500"
              title="完成今日急救生命支持设备交接点检"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>交接班点检</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs border border-indigo-500"
            title="新建工作日程安排"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>加日程</span>
          </button>

          <button
            onClick={() => onOpenRepairModal()}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs border border-amber-500"
            title="发起故障报修派工"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>登记报修</span>
          </button>

          <button
            onClick={() => onNavigateToLedger('', isDeptView ? userDept : undefined)}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-100 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-white/20"
            title={isDeptView ? `查看${userDept}设备台账` : '查看全院设备台账'}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden sm:inline">{isDeptView ? `${userDept}台账` : '台账总表'}</span>
          </button>
        </div>
      </div>

      {/* ==================== 2. 精炼核心资产与效能指标行 (5 Proportional Depth KPI Summary Cards) ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        {/* Total Assets */}
        <div 
          onClick={() => onNavigateToLedger('', isDeptView ? userDept : undefined)}
          className="relative bg-white px-3.5 py-3 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px]"
          title={isDeptView ? `点击查看【${userDept}】在册全部设备` : '点击查看全院在册全部设备'}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">在册设备总量</span>
              {isDeptView && (
                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-xs font-bold font-mono">
                  {userDept}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1 font-mono">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 tracking-tight">{activeStats.totalCount}</span>
              <span className="text-xs text-slate-600 font-bold">台</span>
            </div>
            <span className="text-xs text-slate-600 font-semibold">
              ￥{(activeStats.totalValue / 10000).toFixed(0)}万
            </span>
          </div>
        </div>

        {/* Health Rate */}
        <div 
          onClick={() => onNavigateToLedger('正常运行', isDeptView ? userDept : undefined)}
          className="relative bg-white px-3.5 py-3 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px]"
          title={isDeptView ? `点击查看【${userDept}】正常运行设备` : '点击查看全院正常运行设备'}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">设备完好率</span>
              <span className="text-xs text-emerald-700 font-semibold font-mono">Health Rate</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1 font-mono">
            <span className="text-xl font-bold text-emerald-700 tracking-tight">{currentHealthRate}%</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              正常 {activeStats.normalCount}台
            </span>
          </div>
        </div>

        {/* Fault Pending */}
        <div 
          onClick={() => onNavigateToLedger('故障待修', isDeptView ? userDept : undefined)}
          className="relative bg-white px-3.5 py-3 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-rose-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px]"
          title={isDeptView ? `点击查看【${userDept}】待修设备` : '点击查看全院待修设备'}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">急需故障抢修</span>
              <span className="text-xs text-rose-700 font-semibold font-mono">Critical Fault</span>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 shadow-2xs transition-transform ${
              activeStats.faultCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1 font-mono">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold tracking-tight ${activeStats.faultCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {activeStats.faultCount}
              </span>
              <span className="text-xs text-slate-600 font-bold">台</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
              activeStats.faultCount > 0 
                ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {activeStats.faultCount > 0 ? '待响应派工' : '良好'}
            </span>
          </div>
        </div>

        {/* Maintenance */}
        <div 
          onClick={() => onNavigateToLedger('维护保养中', isDeptView ? userDept : undefined)}
          className="relative bg-white px-3.5 py-3 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px]"
          title={isDeptView ? `点击查看【${userDept}】维保中设备` : '点击查看全院维保中设备'}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">保养定标中</span>
              <span className="text-xs text-amber-700 font-semibold font-mono">In PM / Cal</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Wrench className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1 font-mono">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-amber-700 tracking-tight">{activeStats.maintenanceCount}</span>
              <span className="text-xs text-slate-600 font-bold">台</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              例行巡检
            </span>
          </div>
        </div>

        {/* Cost */}
        <div className="relative bg-white px-3.5 py-3 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden group min-h-[96px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-500" />
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">
                {isDeptView ? `${userDept}维保支出` : '全院维保总支出'}
              </span>
              <span className="text-xs text-slate-500 font-mono">Total Expense</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1 font-mono">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs text-slate-600 font-bold notranslate" translate="no">￥</span>
              <span className="text-xl font-bold text-slate-900 tracking-tight notranslate" translate="no">
                {activeStats.monthlyRepairCost.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">累计结算</span>
          </div>
        </div>
      </div>

      {/* ==================== 3. 主体工作区 (双栏自适应一屏排布 - 7:5 比例) ==================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        
        {/* 左侧栏 (7/12)：今日与近期工作日程看板 (高密度可滚动日程表) */}
        <div className="lg:col-span-7 h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* 日程工具栏 */}
          <div className="px-3.5 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">
                {isDeptView ? `【${userDept}】专属工作日程与交接` : '今日与近期工作日程看板'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                {scheduleFilterTab === 'today' ? `今日 ${filteredScheduleList.length}项` : `近期 ${filteredScheduleList.length}项`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 科室专属范围过滤按钮 (若有科室) */}
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
                    全部日程
                  </button>
                </div>
              )}

              {/* Tab 切换 */}
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setScheduleFilterTab('today')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                    scheduleFilterTab === 'today'
                      ? 'bg-white text-slate-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>今日待办</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] flex items-center justify-center font-bold">
                    {scheduleStats.todayTotal}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilterTab('upcoming')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                    scheduleFilterTab === 'upcoming'
                      ? 'bg-white text-slate-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>近期计划</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 text-[9px] flex items-center justify-center font-bold">
                    {scheduleStats.upcomingTasks}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilterTab('all')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
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
                className="text-[11px] bg-white border border-slate-200 rounded-md px-2 py-0.5 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
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
                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>新建</span>
              </button>
            </div>
          </div>

          {/* 日程列表主体（自适应填满剩余高度，内部平滑滚动） */}
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
                    className={`p-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors ${
                      isCompleted ? 'bg-slate-50/40 opacity-70' : ''
                    }`}
                  >
                    {/* 左侧：复选框 + 时间 + 描述 */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* 完成状态勾选 */}
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

                      {/* 时间段 */}
                      <div className="w-24 shrink-0">
                        <div className="text-xs font-bold font-mono text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{task.timeRange}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {task.date}
                        </div>
                      </div>

                      {/* 标题与元数据 */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {task.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                              紧急
                            </span>
                          )}
                          {task.priority === 'high' && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                              重要
                            </span>
                          )}

                          <span className={`px-2 py-0.5 rounded text-xs font-bold border shrink-0 ${getCategoryBadgeStyle(task.category)}`}>
                            {task.category}
                          </span>

                          {isCompleted ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              已结单
                            </span>
                          ) : isInProgress ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse shrink-0">
                              执行中
                            </span>
                          ) : null}

                          <span className={`text-sm font-bold text-slate-900 truncate ${isCompleted ? 'line-through text-slate-400' : ''}`} title={task.title}>
                            {task.title}
                          </span>
                        </div>

                        {/* 地点与人员 */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-0.5 truncate max-w-[160px]" title={task.location}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{task.location}</span>
                          </span>
                          <span className="flex items-center gap-0.5 truncate max-w-[130px]" title={task.assignedStaff}>
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
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
                              <span className="truncate max-w-[140px]">{task.relatedDeviceName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：动作按钮 */}
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
                          title="立即处理并响应"
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

        {/* 右侧栏 (5/12)：急需派单故障设备 + 核心科室设备健康度 & 快捷工具 */}
        <div className="lg:col-span-5 h-full flex flex-col gap-2.5 min-h-0 overflow-hidden">
          
          {/* 上卡片：急需处置故障设备 (待派单响应) */}
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 下卡片：核心科室设备完好率监控 / 本科室设备类别矩阵 + 快捷操作矩阵 (固定紧凑高度 ~185px) */}
          <div className="h-[185px] bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-col justify-between shrink-0 overflow-hidden">
            {/* 上半部分：科室健康度或本科室设备分类分布 */}
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
                        {cat.category.replace('呼吸、麻醉和急救器械', '急救呼吸类').replace('医用诊察和监护器械', '诊察监护类').replace('妇产科、辅助生殖和避孕器械', '妇产专科类')}
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
                        {dept.name.replace('重症医学科(ICU)', 'ICU').replace('医学影像科', '影像科').replace('心血管内科', '心内科')}
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

            {/* 下半部分：4个快捷操作入口 */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
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
                    <div className="text-[10px] font-bold text-slate-800 mt-0.5">AI急救排查</div>
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

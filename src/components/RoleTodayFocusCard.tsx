import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Compass,
  ExternalLink,
  FileCheck2,
  Package,
  QrCode,
  RotateCcw,
  Scale,
  Server,
  ShieldAlert,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { ActiveTab, AuthUser, HospitalNotice, MedicalEquipment } from '../types';
import { ApprovalApplication } from '../types/approvalTypes';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { MonthlyFrameworkBatch } from '../types/vendorCollaborationTypes';
import { ROLE_ARCHETYPE_LABELS, RoleArchetype } from '../utils/rbacPolicy';
import { matchesDepartment } from '../utils/masterData';
import {
  DEFAULT_SEED_NOTICES,
  NOTICES_LOCAL_CACHE_KEY,
  doesNoticeMatchUser,
  hasUserAckNotice,
  hasUserReadNotice
} from '../utils/noticeUtils';
import { loadStoredSpareParts } from '../utils/sparePartsData';
import { getVendorCollaborationOrders } from '../utils/vendorCollaborationData';
import { WorkScheduleItem } from '../utils/scheduleData';
import { BorrowedDeviceEntry } from './homepages/RoleHomeSharedTypes';

interface FocusTaskItem {
  id: string;
  tag: string;
  title: string;
  metricText: string;
  detailText: string;
  actionLabel: string;
  detailTargetLabel: string;
  tone: 'urgent' | 'attention' | 'normal';
  icon: React.ComponentType<{ className?: string }>;
  onAction: () => void;
  onViewDetail: () => void;
}

export interface RoleTodayFocusCardProps {
  currentUser?: AuthUser | null;
  roleArch: RoleArchetype;
  userDept: string;
  scopedEquipmentList: MedicalEquipment[];
  allEquipmentList: MedicalEquipment[];
  liveWorkOrders: EngineeringWorkOrder[];
  approvalApplications: ApprovalApplication[];
  borrowedEmergencyDevices: BorrowedDeviceEntry[];
  upcomingPmAndCalibrations: MedicalEquipment[];
  frameworkBatches: MonthlyFrameworkBatch[];
  scheduleItems: WorkScheduleItem[];
  urgentReconcileCount: number;
  totalDiffAmount: number;
  handoverCompletedToday: boolean;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onNavigateToLedger: (statusFilter?: string, departmentFilter?: string) => void;
  onNavigateToApprovals?: (data?: Partial<ApprovalApplication>) => void;
  onDirectDispatch?: (order: EngineeringWorkOrder) => void;
  onOpenFieldOperation: (order: EngineeringWorkOrder) => void;
  onOpenClinicalAcceptance: (order: EngineeringWorkOrder) => void;
  onCompleteHandoverCheck: () => void;
  onReturnEquipment?: (device: MedicalEquipment) => void;
}

const scrollAndHighlight = (elementId: string) => {
  const el = document.getElementById(elementId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('ring-2', 'ring-blue-500');
    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 2000);
  }
};

export const RoleTodayFocusCard: React.FC<RoleTodayFocusCardProps> = ({
  currentUser,
  roleArch,
  userDept,
  scopedEquipmentList,
  allEquipmentList,
  liveWorkOrders,
  approvalApplications,
  borrowedEmergencyDevices,
  upcomingPmAndCalibrations,
  frameworkBatches,
  scheduleItems,
  urgentReconcileCount,
  totalDiffAmount,
  handoverCompletedToday,
  onNavigateToTab,
  onNavigateToLedger,
  onNavigateToApprovals,
  onDirectDispatch,
  onOpenFieldOperation,
  onOpenClinicalAcceptance,
  onCompleteHandoverCheck,
  onReturnEquipment
}) => {
  const [notices, setNotices] = useState<HospitalNotice[]>(() => {
    try {
      const cached = localStorage.getItem(NOTICES_LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SEED_NOTICES;
  });

  useEffect(() => {
    let active = true;
    const syncNotices = async () => {
      try {
        const res = await fetch('/api/notices');
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          setNotices(json.data);
        }
      } catch {
        // offline fallback
      }
    };
    syncNotices();
    window.addEventListener('hospital_notices_updated', syncNotices);
    return () => {
      active = false;
      window.removeEventListener('hospital_notices_updated', syncNotices);
    };
  }, [currentUser?.id, currentUser?.role]);

  const noticeSummary = useMemo(() => {
    const matched = notices.filter(n => doesNoticeMatchUser(n, currentUser));
    const unread = matched.filter(n => !hasUserReadNotice(n, currentUser));
    const needAck = matched.filter(n => n.requireAck && !hasUserAckNotice(n, currentUser));
    return {
      totalCount: matched.length,
      unreadCount: unread.length,
      needAckCount: needAck.length,
      latestTitle: (unread[0] || needAck[0] || matched[0])?.title || '暂无待签收新通知'
    };
  }, [notices, currentUser]);

  const focusTasks = useMemo<FocusTaskItem[]>(() => {
    const todayDate = '2026-08-17';

    switch (roleArch) {
      case 'clinical_nurse': {
        const overdueLoans = borrowedEmergencyDevices.filter(b => b.isOverdue);
        const deptActiveOrders = liveWorkOrders.filter(
          w =>
            w.status !== 'closed' &&
            (!userDept || w.department === userDept || matchesDepartment(w.department, userDept))
        );
        const pendingAcceptOrders = deptActiveOrders.filter(
          w => w.status === 'repaired_pending_acceptance'
        );
        const deptFaultyCount = scopedEquipmentList.filter(e => e.status === '故障待修').length;

        return [
          {
            id: 'nurse-loan',
            tag: overdueLoans.length > 0 ? '超期催还' : '借还确认',
            title: '待确认借还 · 在借应急设备',
            metricText:
              overdueLoans.length > 0
                ? `${overdueLoans.length} 台超期 / 共 ${borrowedEmergencyDevices.length} 台`
                : `${borrowedEmergencyDevices.length} 台在用`,
            detailText:
              overdueLoans.length > 0
                ? `${overdueLoans[0].device.name} 已超期 ${overdueLoans[0].daysOverdue} 天，请尽快归还或转增配`
                : borrowedEmergencyDevices.length > 0
                ? `最近应还：${borrowedEmergencyDevices[0].device.name} (${borrowedEmergencyDevices[0].loan.expectedReturnTime?.split(' ')[0] || '待定'})`
                : '科室暂无未归还应急设备，支持绿色通道快速申领',
            actionLabel: overdueLoans.length > 0 && onReturnEquipment ? '立即归还' : '借还管理',
            detailTargetLabel: '应急储备库',
            tone: overdueLoans.length > 0 ? 'urgent' : borrowedEmergencyDevices.length > 0 ? 'attention' : 'normal',
            icon: RotateCcw,
            onAction: () => {
              if (overdueLoans.length > 0 && onReturnEquipment) {
                onReturnEquipment(overdueLoans[0].device);
              } else {
                onNavigateToTab?.('emergency_reserve');
              }
            },
            onViewDetail: () => onNavigateToTab?.('emergency_reserve')
          },
          {
            id: 'nurse-accept',
            tag: pendingAcceptOrders.length > 0 ? '待验签' : deptActiveOrders.length > 0 ? '在途报修' : '报修闭环',
            title:
              pendingAcceptOrders.length > 0
                ? '待临床试机验收签字'
                : deptActiveOrders.length > 0
                ? '本科室实时报修工单进度'
                : '科室故障设备报修跟进',
            metricText:
              pendingAcceptOrders.length > 0
                ? `${pendingAcceptOrders.length} 笔待验收`
                : deptActiveOrders.length > 0
                ? `${deptActiveOrders.length} 笔在办工单`
                : `${deptFaultyCount} 台停机待修`,
            detailText:
              pendingAcceptOrders.length > 0
                ? `${pendingAcceptOrders[0].equipmentName} 已维修完毕，等待护士长确认开机签字`
                : deptActiveOrders.length > 0
                ? `${deptActiveOrders[0].caoliaoRecordNo ? `[${deptActiveOrders[0].caoliaoRecordNo}] ` : ''}${deptActiveOrders[0].equipmentName} · ${deptActiveOrders[0].faultDescription}`
                : deptFaultyCount > 0
                ? '医工组正在处理报修工单，可进入查看派工与到场节点'
                : '本科室在用器械运行平稳，无未闭环维修单',
            actionLabel: pendingAcceptOrders.length > 0 ? '立即验收' : '报修协同',
            detailTargetLabel: '故障报修中心',
            tone: pendingAcceptOrders.length > 0 || deptActiveOrders.length > 0 || deptFaultyCount > 0 ? 'attention' : 'normal',
            icon: Wrench,
            onAction: () => {
              if (pendingAcceptOrders.length > 0) {
                onOpenClinicalAcceptance(pendingAcceptOrders[0]);
              } else {
                onNavigateToTab?.('repairs');
              }
            },
            onViewDetail: () => onNavigateToTab?.('repairs')
          },
          {
            id: 'nurse-notice-handover',
            tag: noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0 ? '待签收' : '每日安全',
            title:
              noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0
                ? '未读管理通知与回执签收'
                : '急救生命支持晨间点检',
            metricText:
              noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0
                ? `未读 ${noticeSummary.unreadCount} · 待签 ${noticeSummary.needAckCount}`
                : handoverCompletedToday
                ? '今日已打卡 ✓'
                : '今日待点检',
            detailText:
              noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0
                ? noticeSummary.latestTitle
                : '核查呼吸机、除颤仪及监护仪供电电池与报警自检状态',
            actionLabel:
              noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0
                ? '查看签收'
                : handoverCompletedToday
                ? '科室台账'
                : '完成点检',
            detailTargetLabel:
              noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0 ? '制度通告中心' : '移动巡检台',
            tone:
              noticeSummary.unreadCount > 0 || !handoverCompletedToday ? 'attention' : 'normal',
            icon: noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0 ? Bell : ClipboardCheck,
            onAction: () => {
              if (noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0) {
                scrollAndHighlight('role-notice-center');
              } else if (!handoverCompletedToday) {
                onCompleteHandoverCheck();
              } else {
                onNavigateToLedger('', userDept);
              }
            },
            onViewDetail: () => {
              onNavigateToTab?.(
                noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0
                  ? 'regulations'
                  : 'mobile_inspection'
              );
            }
          }
        ];
      }

      case 'clinical_director': {
        const deptPendingApprovals = approvalApplications.filter(
          a =>
            a.status === 'pending_dept' &&
            (!userDept || a.applicantDepartment === userDept || matchesDepartment(a.applicantDepartment, userDept))
        );
        const deptActiveOrders = liveWorkOrders.filter(
          w =>
            w.status !== 'closed' &&
            (!userDept || w.department === userDept || matchesDepartment(w.department, userDept))
        );
        const deptPendingAccept = deptActiveOrders.filter(
          w => w.status === 'repaired_pending_acceptance'
        );
        const deptFaultCount = scopedEquipmentList.filter(e => e.status === '故障待修').length;

        return [
          {
            id: 'director-approval',
            tag: deptPendingApprovals.length > 0 ? '科主任签批' : '立项论证',
            title: '待审批设备增配 / 购置申请',
            metricText: `${deptPendingApprovals.length} 笔待初审`,
            detailText:
              deptPendingApprovals.length > 0
                ? deptPendingApprovals[0].title
                : '可随时发起本科室学科建设新设备购置或应急增配论证',
            actionLabel: deptPendingApprovals.length > 0 ? '立即签批' : '审批中心',
            detailTargetLabel: '审批中心',
            tone: deptPendingApprovals.length > 0 ? 'urgent' : 'normal',
            icon: FileCheck2,
            onAction: () => {
              if (onNavigateToApprovals && deptPendingApprovals.length > 0) {
                onNavigateToApprovals(deptPendingApprovals[0]);
              } else {
                onNavigateToTab?.('approvals');
              }
            },
            onViewDetail: () => onNavigateToTab?.('approvals')
          },
          {
            id: 'director-quality',
            tag: deptPendingAccept.length > 0 || deptActiveOrders.length > 0 || deptFaultCount > 0 ? '设备保障' : '强检合规',
            title:
              deptPendingAccept.length > 0
                ? '待科主任/科室验收完工工单'
                : deptActiveOrders.length > 0
                ? '本科室实时报修与抢修进展'
                : '本科室停机故障与强检到期预警',
            metricText:
              deptPendingAccept.length > 0
                ? `${deptPendingAccept.length} 单待验收`
                : deptActiveOrders.length > 0
                ? `${deptActiveOrders.length} 笔报修处理中`
                : `故障 ${deptFaultCount} · 临期强检 ${upcomingPmAndCalibrations.length}`,
            detailText:
              deptPendingAccept.length > 0
                ? `${deptPendingAccept[0].equipmentName} 已修复待试机`
                : deptActiveOrders.length > 0
                ? `${deptActiveOrders[0].caoliaoRecordNo ? `[${deptActiveOrders[0].caoliaoRecordNo}] ` : ''}${deptActiveOrders[0].equipmentName} · ${deptActiveOrders[0].faultDescription}`
                : upcomingPmAndCalibrations.length > 0
                ? `近期强检到期：${upcomingPmAndCalibrations[0].name}`
                : '本科室医疗设备计量定标与运行状态均合规',
            actionLabel: deptPendingAccept.length > 0 ? '验收签字' : deptActiveOrders.length > 0 || deptFaultCount > 0 ? '报修详情' : '计量计划',
            detailTargetLabel: deptFaultCount > 0 || deptActiveOrders.length > 0 ? '故障报修中心' : '强检维护计划',
            tone: deptFaultCount > 0 || deptActiveOrders.length > 0 ? 'attention' : 'normal',
            icon: ShieldAlert,
            onAction: () => {
              if (deptPendingAccept.length > 0) {
                onOpenClinicalAcceptance(deptPendingAccept[0]);
              } else if (deptActiveOrders.length > 0 || deptFaultCount > 0) {
                onNavigateToTab?.('repairs');
              } else {
                onNavigateToTab?.('maintenance');
              }
            },
            onViewDetail: () =>
              onNavigateToTab?.(
                deptFaultCount > 0 || deptActiveOrders.length > 0 ? 'repairs' : 'maintenance'
              )
          },
          {
            id: 'director-roi-notice',
            tag: noticeSummary.unreadCount > 0 ? '通知签收' : '效益评估',
            title: noticeSummary.unreadCount > 0 ? '待阅读院科督办通知' : '本科室高值设备 ROI 运营核查',
            metricText:
              noticeSummary.unreadCount > 0
                ? `${noticeSummary.unreadCount} 条未读`
                : `${scopedEquipmentList.filter(e => (e.purchasePrice || 0) >= 30000).length} 台重点核算`,
            detailText:
              noticeSummary.unreadCount > 0
                ? noticeSummary.latestTitle
                : '查看本科室 CT/超声/呼吸机工作量负荷与年度投入产出比',
            actionLabel: noticeSummary.unreadCount > 0 ? '前往签收' : 'ROI 看板',
            detailTargetLabel: noticeSummary.unreadCount > 0 ? '制度通告中心' : '单机 ROI 分析',
            tone: noticeSummary.unreadCount > 0 ? 'attention' : 'normal',
            icon: noticeSummary.unreadCount > 0 ? Bell : TrendingUp,
            onAction: () => {
              if (noticeSummary.unreadCount > 0) {
                scrollAndHighlight('role-notice-center');
              } else {
                onNavigateToTab?.('roi');
              }
            },
            onViewDetail: () =>
              onNavigateToTab?.(noticeSummary.unreadCount > 0 ? 'regulations' : 'roi')
          }
        ];
      }

      case 'engineering_supervisor': {
        const pendingOrders = liveWorkOrders.filter(o => o.status === 'pending_dispatch');
        const preOrders = liveWorkOrders.filter(o => o.status === 'pre_dispatched');
        const overdueLoans = borrowedEmergencyDevices.filter(b => b.isOverdue);

        return [
          {
            id: 'sup-dispatch',
            tag: pendingOrders.length > 0 ? '急修待派' : '派工总台',
            title: '待审批派工 · 现场紧急报修',
            metricText: `${pendingOrders.length} 笔待正式派工`,
            detailText:
              pendingOrders.length > 0
                ? `${pendingOrders[0].caoliaoRecordNo ? `[${pendingOrders[0].caoliaoRecordNo}] ` : ''}${pendingOrders[0].equipmentName} (${pendingOrders[0].department})`
                : '当前新到报修均已完成响应派单',
            actionLabel: pendingOrders.length > 0 ? '立即派工' : '派工中心',
            detailTargetLabel: '审批视图',
            tone: pendingOrders.length > 0 ? 'urgent' : 'normal',
            icon: Wrench,
            onAction: () => {
              if (pendingOrders.length > 0 && onDirectDispatch) {
                onDirectDispatch(pendingOrders[0]);
              } else {
                onNavigateToTab?.('dispatch');
              }
            },
            onViewDetail: () => onNavigateToTab?.('approvals')
          },
          {
            id: 'sup-predispatch',
            tag: preOrders.length > 0 ? '待定案' : '负荷协同',
            title: '预派工内部讨论与正式签发',
            metricText: `${preOrders.length} 笔拟派讨论中`,
            detailText:
              preOrders.length > 0
                ? `${preOrders[0].equipmentName}（拟定 ${preOrders[0].proposedEngineerName || '待确认'}）等待拍板`
                : '可查看各维修小组实时在手负荷与 MTTR 响应时长',
            actionLabel: preOrders.length > 0 ? '讨论签发' : '调度看板',
            detailTargetLabel: '智能派工中心',
            tone: preOrders.length > 0 ? 'attention' : 'normal',
            icon: ClipboardCheck,
            onAction: () => {
              if (preOrders.length > 0 && onDirectDispatch) {
                onDirectDispatch(preOrders[0]);
              } else {
                onNavigateToTab?.('dispatch');
              }
            },
            onViewDetail: () => onNavigateToTab?.('dispatch')
          },
          {
            id: 'sup-reserve-pm',
            tag: overdueLoans.length > 0 ? '超期督办' : '全院质控',
            title: overdueLoans.length > 0 ? '跨科在借应急设备超期回收' : '全院强检计划与通知下发追踪',
            metricText:
              overdueLoans.length > 0
                ? `${overdueLoans.length} 台超期未还`
                : `在借 ${borrowedEmergencyDevices.length} 台 · 临期强检 ${upcomingPmAndCalibrations.length} 台`,
            detailText:
              overdueLoans.length > 0
                ? `${overdueLoans[0].loan.borrowingDepartment || overdueLoans[0].device.department} 借用 ${overdueLoans[0].device.name} 已超期`
                : '检查全院计量强检排期与各临床科室安全通知签收进度',
            actionLabel: overdueLoans.length > 0 ? '调配督办' : '强检计划',
            detailTargetLabel: overdueLoans.length > 0 ? '应急储备库' : '强检维护计划',
            tone: overdueLoans.length > 0 ? 'urgent' : 'normal',
            icon: RotateCcw,
            onAction: () => {
              onNavigateToTab?.(overdueLoans.length > 0 ? 'emergency_reserve' : 'maintenance');
            },
            onViewDetail: () => {
              onNavigateToTab?.(overdueLoans.length > 0 ? 'emergency_reserve' : 'maintenance');
            }
          }
        ];
      }

      case 'engineer': {
        const engName = (currentUser?.name || '').trim();
        const myActiveOrders = liveWorkOrders.filter(
          o =>
            ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(o.status) &&
            (!engName || !o.assignedEngineerName || o.assignedEngineerName.includes(engName))
        );
        const preDiscussOrders = liveWorkOrders.filter(
          o => o.status === 'pre_dispatched' || o.status === 'pending_dispatch'
        );
        const lowStockCount = (() => {
          try {
            return loadStoredSpareParts().filter(p => p.currentStock <= p.minSafeStock).length;
          } catch {
            return 0;
          }
        })();
        const pendingTodaySchedules = scheduleItems.filter(s => s.date === todayDate && s.status !== 'completed');

        return [
          {
            id: 'eng-field',
            tag: myActiveOrders.length > 0 ? '在手施工' : preDiscussOrders.length > 0 ? '新报修待接' : '接单台',
            title: '我的待接单与全院现场抢修任务',
            metricText:
              myActiveOrders.length > 0
                ? `${myActiveOrders.length} 笔待开工 / 施工中`
                : `${preDiscussOrders.length} 笔新报修待派协同`,
            detailText:
              myActiveOrders.length > 0
                ? `${myActiveOrders[0].equipmentName} (${myActiveOrders[0].department}) — ${myActiveOrders[0].faultDescription}`
                : preDiscussOrders.length > 0
                ? `${preDiscussOrders[0].caoliaoRecordNo ? `[${preDiscussOrders[0].caoliaoRecordNo}] ` : ''}${preDiscussOrders[0].equipmentName} (${preDiscussOrders[0].department}) — ${preDiscussOrders[0].faultDescription}`
                : '当前全院抢修工单均已处置或完工验收',
            actionLabel: myActiveOrders.length > 0 ? '现场处置' : preDiscussOrders.length > 0 ? '响应/讨论' : '派工大厅',
            detailTargetLabel: '派工接单中心',
            tone: myActiveOrders.length > 0 || preDiscussOrders.length > 0 ? 'urgent' : 'normal',
            icon: Wrench,
            onAction: () => {
              if (myActiveOrders.length > 0) {
                onOpenFieldOperation(myActiveOrders[0]);
              } else if (preDiscussOrders.length > 0 && onDirectDispatch) {
                onDirectDispatch(preDiscussOrders[0]);
              } else {
                onNavigateToTab?.('dispatch');
              }
            },
            onViewDetail: () => onNavigateToTab?.('dispatch')
          },
          {
            id: 'eng-prediscuss',
            tag: preDiscussOrders.length > 0 ? '派前协同' : '日程巡检',
            title: preDiscussOrders.length > 0 ? '待参与派前技术讨论工单' : '今日个人巡检与强检协助',
            metricText:
              preDiscussOrders.length > 0
                ? `${preDiscussOrders.length} 笔待协同`
                : `${pendingTodaySchedules.length} 项待完成`,
            detailText:
              preDiscussOrders.length > 0
                ? `${preDiscussOrders[0].equipmentName} · 确认备件、工具与故障预判`
                : '完成本日科室预防性维护巡检与强检现场配合',
            actionLabel: preDiscussOrders.length > 0 ? '参与讨论' : '移动巡检',
            detailTargetLabel: preDiscussOrders.length > 0 ? '派工讨论视图' : '移动巡检台',
            tone: preDiscussOrders.length > 0 ? 'attention' : 'normal',
            icon: ClipboardCheck,
            onAction: () => {
              if (preDiscussOrders.length > 0 && onDirectDispatch) {
                onDirectDispatch(preDiscussOrders[0]);
              } else {
                onNavigateToTab?.('mobile_inspection');
              }
            },
            onViewDetail: () =>
              onNavigateToTab?.(preDiscussOrders.length > 0 ? 'dispatch' : 'mobile_inspection')
          },
          {
            id: 'eng-parts-notice',
            tag: lowStockCount > 0 ? '备件预警' : '指令签收',
            title: lowStockCount > 0 ? '应急维修备件低库存核查' : '医工调度技术指令接收',
            metricText:
              lowStockCount > 0
                ? `${lowStockCount} 种备件低于安全库存`
                : `未读 ${noticeSummary.unreadCount} · 待签 ${noticeSummary.needAckCount}`,
            detailText:
              lowStockCount > 0
                ? '氧传感器、导联线等高频消耗配件库存告急，出诊前请先核对申领'
                : noticeSummary.latestTitle,
            actionLabel: lowStockCount > 0 ? '备件库存' : '查看指令',
            detailTargetLabel: lowStockCount > 0 ? '备件库存模块' : '制度通告中心',
            tone: lowStockCount > 0 || noticeSummary.unreadCount > 0 ? 'attention' : 'normal',
            icon: lowStockCount > 0 ? Package : Bell,
            onAction: () => {
              if (lowStockCount > 0) {
                onNavigateToTab?.('parts_inventory');
              } else {
                scrollAndHighlight('role-notice-center');
              }
            },
            onViewDetail: () =>
              onNavigateToTab?.(lowStockCount > 0 ? 'parts_inventory' : 'regulations')
          }
        ];
      }

      case 'financial': {
        const uninvoicedItems = frameworkBatches.flatMap(b => b.items).filter(it => !it.invoiced);
        const uninvoicedTotal = uninvoicedItems.reduce((s, it) => s + (it.totalPrice || 0), 0);
        const financeApprovals = approvalApplications.filter(
          a => a.status === 'pending_finance' || a.status === 'pending_engineering'
        );

        return [
          {
            id: 'fin-reconcile',
            tag: '即时对账',
            title: '院企核减差额与旧件退库待认领',
            metricText: `${urgentReconcileCount} 笔 · 核减 ¥${totalDiffAmount.toLocaleString()}`,
            detailText: '依据框架协议限价条款核对声明金额与审定差额，完成四流会签',
            actionLabel: '立即对账',
            detailTargetLabel: '外协对账模块',
            tone: urgentReconcileCount > 0 ? 'urgent' : 'normal',
            icon: Scale,
            onAction: () => scrollAndHighlight('immediate-reconciliation-panel'),
            onViewDetail: () => onNavigateToTab?.('vendor_collaboration')
          },
          {
            id: 'fin-invoice',
            tag: '票据归集',
            title: '未开票零星外协维保明细归集',
            metricText: `${uninvoicedItems.length} 项 · ¥${uninvoicedTotal.toLocaleString()}`,
            detailText: '进入月度框架对账中心催办服务商批量开票与付款清结',
            actionLabel: '开票核销',
            detailTargetLabel: '外协对账模块',
            tone: uninvoicedItems.length > 0 ? 'attention' : 'normal',
            icon: Coins,
            onAction: () => onNavigateToTab?.('vendor_collaboration'),
            onViewDetail: () => onNavigateToTab?.('vendor_collaboration')
          },
          {
            id: 'fin-approvals',
            tag: financeApprovals.length > 0 ? '预算会签' : '绩效审计',
            title: financeApprovals.length > 0 ? '待财务会签设备采购立项单' : '全院单机 ROI 与 DRG 成本审计',
            metricText:
              financeApprovals.length > 0
                ? `${financeApprovals.length} 笔待会签`
                : `在册资产 ${allEquipmentList.length} 台`,
            detailText:
              financeApprovals.length > 0
                ? financeApprovals[0].title
                : '核查全院大型医疗设备折旧回报率与病种耗材成本占比',
            actionLabel: financeApprovals.length > 0 ? '预算审批' : 'DRG 审计',
            detailTargetLabel: financeApprovals.length > 0 ? '审批中心' : 'DRG 成本审计',
            tone: financeApprovals.length > 0 ? 'attention' : 'normal',
            icon: FileCheck2,
            onAction: () => {
              onNavigateToTab?.(financeApprovals.length > 0 ? 'approvals' : 'drg_cost_audit');
            },
            onViewDetail: () => {
              onNavigateToTab?.(financeApprovals.length > 0 ? 'approvals' : 'drg_cost_audit');
            }
          }
        ];
      }

      case 'executive': {
        const execApprovals = approvalApplications.filter(
          a => a.status === 'pending_dean' || a.status === 'pending_finance'
        );
        const total = allEquipmentList.length || 1;
        const faultCount = allEquipmentList.filter(e => e.status === '故障待修').length;
        const openOrders = liveWorkOrders.filter(o => o.status !== 'closed');
        const overdueLoans = borrowedEmergencyDevices.filter(b => b.isOverdue);

        return [
          {
            id: 'exec-approvals',
            tag: execApprovals.length > 0 ? '院长终审' : '立项统筹',
            title: '院级大型设备购置与报废待批事项',
            metricText: `${execApprovals.length} 笔待审阅`,
            detailText:
              execApprovals.length > 0
                ? execApprovals[0].title
                : '当前大额设备预算及报废请示均已审批归档',
            actionLabel: '审批决策',
            detailTargetLabel: '审批视图',
            tone: execApprovals.length > 0 ? 'urgent' : 'normal',
            icon: FileCheck2,
            onAction: () => {
              if (onNavigateToApprovals && execApprovals.length > 0) {
                onNavigateToApprovals(execApprovals[0]);
              } else {
                onNavigateToTab?.('approvals');
              }
            },
            onViewDetail: () => onNavigateToTab?.('approvals')
          },
          {
            id: 'exec-quality',
            tag: faultCount > 5 || openOrders.length > 0 ? '实时督办' : '三甲迎检',
            title: '全院实时停机报修与质控督办',
            metricText: `停机 ${faultCount}/${total} 台 · 在办报修 ${openOrders.length} 笔`,
            detailText:
              openOrders.length > 0
                ? `最新报修：${openOrders[0].caoliaoRecordNo ? `[${openOrders[0].caoliaoRecordNo}] ` : ''}${openOrders[0].equipmentName} (${openOrders[0].department})`
                : '关注 ICU/急诊/麻醉科生命支持装备完好率及不良事件闭环率',
            actionLabel: openOrders.length > 0 ? '查看报修' : '评审质控',
            detailTargetLabel: openOrders.length > 0 ? '全院报修工单' : '三甲评审质控',
            tone: faultCount > 0 || openOrders.length > 0 ? 'attention' : 'normal',
            icon: AlertTriangle,
            onAction: () => onNavigateToTab?.(openOrders.length > 0 ? 'repairs' : 'accreditation_quality'),
            onViewDetail: () => onNavigateToTab?.(openOrders.length > 0 ? 'repairs' : 'accreditation_quality')
          },
          {
            id: 'exec-roi-loan',
            tag: overdueLoans.length > 0 ? '跨科督办' : '运营效益',
            title: overdueLoans.length > 0 ? '跨科应急调配超期未归还监管' : '全院单机 ROI 与资源配置效益',
            metricText:
              overdueLoans.length > 0
                ? `${overdueLoans.length} 台超期 / 共 ${borrowedEmergencyDevices.length} 台`
                : `在借应急 ${borrowedEmergencyDevices.length} 台`,
            detailText:
              overdueLoans.length > 0
                ? '协调高负荷临床科室增配申请与应急储备库周转平衡'
                : '浏览各重点临床科室大型装备投资回报与运行效能排行',
            actionLabel: overdueLoans.length > 0 ? '运营监管' : 'ROI 分析',
            detailTargetLabel: overdueLoans.length > 0 ? '运营数据分析' : '单机 ROI 分析',
            tone: overdueLoans.length > 0 ? 'attention' : 'normal',
            icon: TrendingUp,
            onAction: () => onNavigateToTab?.(overdueLoans.length > 0 ? 'analytics' : 'roi'),
            onViewDetail: () => onNavigateToTab?.(overdueLoans.length > 0 ? 'analytics' : 'roi')
          }
        ];
      }

      case 'vendor': {
        const vendorOrders = (() => {
          try {
            return getVendorCollaborationOrders();
          } catch {
            return [];
          }
        })();
        const activeOrders = vendorOrders.filter(o => o.status !== 'ARCHIVED');

        return [
          {
            id: 'vendor-reconcile',
            tag: '优先核销',
            title: '院方核减差异认领与旧件交回确认',
            metricText: `${urgentReconcileCount} 项 · 差额 ¥${totalDiffAmount.toLocaleString()}`,
            detailText: '认领协议审定核减额并完成损坏旧件退回双签，确保按期开票回款',
            actionLabel: '即时对账',
            detailTargetLabel: '外协协同门户',
            tone: urgentReconcileCount > 0 ? 'urgent' : 'normal',
            icon: Scale,
            onAction: () => scrollAndHighlight('immediate-reconciliation-panel'),
            onViewDetail: () => onNavigateToTab?.('vendor_collaboration')
          },
          {
            id: 'vendor-orders',
            tag: '外协履约',
            title: '在办外协维修报价与完工验收单据',
            metricText: `${activeOrders.length} 笔履约中`,
            detailText:
              activeOrders.length > 0
                ? `${activeOrders[0].equipmentName} (${activeOrders[0].equipmentDept})`
                : '当前外协委派单据已全部履约结算完毕',
            actionLabel: '协同门户',
            detailTargetLabel: '外协协同门户',
            tone: activeOrders.length > 0 ? 'attention' : 'normal',
            icon: Wrench,
            onAction: () => onNavigateToTab?.('vendor_collaboration'),
            onViewDetail: () => onNavigateToTab?.('vendor_collaboration')
          },
          {
            id: 'vendor-notice',
            tag: '指令签收',
            title: '院方医工指令与入场维保规范通知',
            metricText: `未读 ${noticeSummary.unreadCount} · 待签 ${noticeSummary.needAckCount}`,
            detailText: noticeSummary.latestTitle,
            actionLabel: '阅读签收',
            detailTargetLabel: '制度与规范中心',
            tone: noticeSummary.unreadCount > 0 || noticeSummary.needAckCount > 0 ? 'attention' : 'normal',
            icon: Bell,
            onAction: () => scrollAndHighlight('role-notice-center'),
            onViewDetail: () => onNavigateToTab?.('regulations')
          }
        ];
      }

      case 'admin':
      default: {
        const pendingOrders = liveWorkOrders.filter(
          o => o.status === 'pending_dispatch' || o.status === 'pre_dispatched'
        );
        const caoliaoCount = liveWorkOrders.filter(o => o.source === 'caoliao').length;

        return [
          {
            id: 'admin-dispatch',
            tag: pendingOrders.length > 0 ? '调度兜底' : '派工总控',
            title: '全院待派工与预派工工单监视',
            metricText: `${pendingOrders.length} 笔待处理`,
            detailText:
              pendingOrders.length > 0
                ? `${pendingOrders[0].equipmentName} (${pendingOrders[0].department})`
                : '全院故障报修工单已正常进入维修流转',
            actionLabel: pendingOrders.length > 0 ? '调度兜底' : '派工总台',
            detailTargetLabel: '智能派工总台',
            tone: pendingOrders.length > 0 ? 'urgent' : 'normal',
            icon: Wrench,
            onAction: () => {
              if (pendingOrders.length > 0 && onDirectDispatch) {
                onDirectDispatch(pendingOrders[0]);
              } else {
                onNavigateToTab?.('dispatch');
              }
            },
            onViewDetail: () => onNavigateToTab?.('dispatch')
          },
          {
            id: 'admin-gateway',
            tag: '网关健康',
            title: '草料二维码 Webhook 报文接入校验',
            metricText: `已同步 ${caoliaoCount} 笔扫码工单`,
            detailText: '核验现场扫码报修报文解析、设备 SN 自动匹配与实时弹窗推送',
            actionLabel: '查看日志',
            detailTargetLabel: 'Webhook 报文日志',
            tone: 'normal',
            icon: QrCode,
            onAction: () => onNavigateToTab?.('caoliao_webhook_logs'),
            onViewDetail: () => onNavigateToTab?.('caoliao_webhook_logs')
          },
          {
            id: 'admin-ops-notice',
            tag: '安全运维',
            title: 'RBAC 权限治理与全院通告签收率巡检',
            metricText: `已发通告 ${noticeSummary.totalCount} 条 · 在册设备 ${allEquipmentList.length} 台`,
            detailText: '检视 7+1 岗位权限拦截审计日志及全院各临床科室公告签收状态',
            actionLabel: '系统运维',
            detailTargetLabel: '系统运维中心',
            tone: 'normal',
            icon: Server,
            onAction: () => onNavigateToTab?.('system_ops'),
            onViewDetail: () => onNavigateToTab?.('system_ops')
          }
        ];
      }
    }
  }, [
    roleArch,
    currentUser,
    userDept,
    scopedEquipmentList,
    allEquipmentList,
    liveWorkOrders,
    approvalApplications,
    borrowedEmergencyDevices,
    upcomingPmAndCalibrations,
    frameworkBatches,
    scheduleItems,
    urgentReconcileCount,
    totalDiffAmount,
    handoverCompletedToday,
    noticeSummary,
    onNavigateToTab,
    onNavigateToLedger,
    onNavigateToApprovals,
    onDirectDispatch,
    onOpenFieldOperation,
    onOpenClinicalAcceptance,
    onCompleteHandoverCheck,
    onReturnEquipment
  ]);

  const roleDisplayName = ROLE_ARCHETYPE_LABELS[roleArch] || currentUser?.role || '当前岗位';
  const actionRequiredCount = focusTasks.filter(t => t.tone !== 'normal').length;

  return (
    <section
      aria-label="今日岗位焦点工作智能摘要"
      className="bg-white rounded-xl border border-slate-200 p-3.5 shrink-0 flex flex-col"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-blue-600 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
            今日岗位重点关注 · 智能摘要
          </h2>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            · 已按「{roleDisplayName}」自动筛选 3 项最优先事务，点击直达处理
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums shrink-0">
          {actionRequiredCount > 0 ? (
            <span className="text-amber-700 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{actionRequiredCount} 项建议优先处置</span>
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>今日核心事项均处于正常受控</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin pr-0.5">
        {focusTasks.map((task, idx) => {
          const Icon = task.icon;
          const toneClasses =
            task.tone === 'urgent'
              ? 'bg-rose-50/45 border-rose-200 hover:border-rose-300 hover:bg-rose-50/70'
              : task.tone === 'attention'
              ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:bg-amber-50/65'
              : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-white';

          const tagClasses =
            task.tone === 'urgent'
              ? 'text-rose-700 bg-rose-100/80 border-rose-200'
              : task.tone === 'attention'
              ? 'text-amber-800 bg-amber-100/80 border-amber-200'
              : 'text-slate-600 bg-slate-100 border-slate-200';

          const metricClasses =
            task.tone === 'urgent'
              ? 'text-rose-700'
              : task.tone === 'attention'
              ? 'text-amber-800'
              : 'text-slate-800';

          return (
            <div
              key={task.id}
              className={`text-left rounded-lg border p-3 transition flex flex-col justify-between gap-2.5 ${toneClasses}`}
            >
              <div className="space-y-1.5 min-w-0 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {task.title}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold shrink-0 whitespace-nowrap ${tagClasses}`}>
                    {task.tag}
                  </span>
                </div>

                <div className={`text-sm font-black font-mono tabular-nums ${metricClasses}`}>
                  {task.metricText}
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-1">
                  {task.detailText}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2 text-[11px] w-full">
                <button
                  type="button"
                  onClick={task.onViewDetail}
                  title={`跳转到「${task.detailTargetLabel}」模块`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>查看详情</span>
                </button>
                <button
                  type="button"
                  onClick={task.onAction}
                  className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-100/60 transition whitespace-nowrap shrink-0 cursor-pointer group"
                >
                  <span>{task.actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

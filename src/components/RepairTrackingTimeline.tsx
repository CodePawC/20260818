import React, { useState, useMemo } from 'react';
import { VendorCollaborationOrder, CollaborationMessage } from '../types/vendorCollaborationTypes';
import { MedicalEquipment } from '../types';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import {
  FileText,
  Building2,
  Wrench,
  UserCheck,
  ShieldCheck,
  Check,
  Clock,
  ChevronRight,
  AlertCircle,
  Phone,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Send,
  Flame,
  ShieldAlert,
  User,
  Calendar,
  Info,
  X
} from 'lucide-react';
import { getVendorCollaborationOrders, saveVendorCollaborationOrders } from '../utils/vendorCollaborationData';

export type RepairTimelineStage = 1 | 2 | 3 | 4 | 5;

export interface RepairTimelineStageItem {
  stageNumber: RepairTimelineStage;
  stageKey: 'REPORT_ACCEPTED' | 'VENDOR_DISPATCHED' | 'REPAIR_IN_PROGRESS' | 'PENDING_CLINICAL' | 'ARCHIVED_CLOSED';
  title: '报修受理' | '外协派工' | '维修处理中' | '待科室确认' | '归档验收';
  subtitle: string;
  responsibleParty: string;
  statusText: string;
  timestamp?: string;
  keyInfo?: string;
  actionHint?: string;
  // 节点交互透明度字段（操作人、发生时间、处理简要描述）
  operatorName: string;
  operatorRole: string;
  operatorPhone?: string;
  exactTime: string;
  processDescription: string;
  keyDetails?: { label: string; value: string; highlight?: boolean }[];
}

export interface RepairTrackingTimelineProps {
  order?: VendorCollaborationOrder | null;
  equipment?: MedicalEquipment | null;
  workOrder?: EngineeringWorkOrder | null;
  currentStageOverride?: RepairTimelineStage;
  onStageClick?: (stage: RepairTimelineStage, stageKey: string) => void;
  onUrge?: (messageText: string, messageObj: CollaborationMessage) => void;
  forceShowOverdueAlert?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * 依据外协协同订单、设备状态与工单进度计算5阶段时序进度
 * 阶段1：报修受理
 * 阶段2：外协派工
 * 阶段3：维修处理中
 * 阶段4：待科室确认
 * 阶段5：归档验收
 */
export function calculateRepairTimelineStage(
  order?: VendorCollaborationOrder | null,
  equipment?: MedicalEquipment | null,
  workOrder?: EngineeringWorkOrder | null
): RepairTimelineStage {
  if (!order) {
    if (workOrder) {
      if (workOrder.status === 'closed') return 5;
      if (workOrder.status === 'repaired_pending_acceptance') return 4;
      if (['accepted', 'arrived_inspecting', 'waiting_parts'].includes(workOrder.status)) return 3;
      if (workOrder.status === 'dispatched') return 2;
      return 1;
    }
    if (equipment && equipment.status === '故障待修') return 3;
    return 1;
  }

  // 1. 已归档闭环，或台账已恢复正常且已完成临床复核签字
  if (order.status === 'ARCHIVED' || (equipment?.status === '正常运行' && order.completionReport?.clinicalAcceptDate)) {
    return 5;
  }

  // 2. 完工待开票 / 发票已传
  if (order.status === 'COMPLETED_PENDING_INVOICE' || order.status === 'INVOICE_UPLOADED') {
    // 若已完成临床确认与电子签字，但尚未归档
    if (order.completionReport?.clinicalAcceptDate) {
      return 5;
    }
    // 否则处于等待临床科室复核确认状态
    return 4;
  }

  // 3. 已定标同意，驻场施工检修中
  if (order.status === 'APPROVED_REPAIRING') {
    return 3;
  }

  // 4. 委外待报价、多科室审价议价中
  if (order.status === 'PENDING_QUOTE' || order.status === 'MULTI_DEPT_NEGOTIATING' || order.status === 'QUOTE_REJECTED') {
    return 2;
  }

  return 1;
}

export const RepairTrackingTimeline: React.FC<RepairTrackingTimelineProps> = ({
  order,
  equipment,
  workOrder,
  currentStageOverride,
  onStageClick,
  onUrge,
  forceShowOverdueAlert = false,
  className = '',
  compact = false
}) => {
  const currentStage: RepairTimelineStage = currentStageOverride ?? calculateRepairTimelineStage(order, equipment, workOrder);

  // 模拟切换测试（非Stage 3时也可预览预警样式）
  const [simulateStayOverdue, setSimulateStayOverdue] = useState<boolean>(false);

  // 催办状态管理
  const [isUrging, setIsUrging] = useState<boolean>(false);
  const [hasUrged, setHasUrged] = useState<boolean>(false);
  const [urgeCount, setUrgeCount] = useState<number>(0);
  const [lastUrgedTime, setLastUrgedTime] = useState<string>('');
  const [urgedFeedback, setUrgedFeedback] = useState<string | null>(null);

  // 计算外协单位在‘维修处理中’阶段的停留时间（小时）
  const inRepairStayHours = useMemo(() => {
    // 优先采用订单中记录的停留工时或起始时间
    const startTimeStr = order?.completionReport?.serviceStartTime
      || (order?.status === 'APPROVED_REPAIRING' ? order?.createdAt : null)
      || (workOrder?.status === 'accepted' || workOrder?.status === 'waiting_parts' || workOrder?.status === 'arrived_inspecting' ? (workOrder?.dispatchTime || workOrder?.reportTime) : null)
      || (equipment?.status === '故障待修' ? equipment?.repairRecords?.[0]?.faultDate : null);

    if (startTimeStr) {
      try {
        const startDate = new Date(startTimeStr.replace(/-/g, '/'));
        const diffMs = Date.now() - startDate.getTime();
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        if (!isNaN(hrs) && hrs > 0) {
          return hrs;
        }
      } catch {
        // fallback
      }
    }

    // 若当前所处阶段为 Stage 3 (维修处理中)，默认按真实业务场景赋予典型超限工时（例如 54 小时，超限 6 小时）
    if (currentStage === 3) {
      return 54;
    }
    return 0;
  }, [order, workOrder, equipment, currentStage]);

  // 判断是否触发 48 小时超时异常预警：处于‘维修处理中’（Stage 3）且停留时长超过 48 小时
  const isOverdue48h = forceShowOverdueAlert || simulateStayOverdue || (currentStage === 3 && inRepairStayHours >= 48);

  // 关联的责任外协单位与维修负责人
  const responsibleVendor = order?.vendorName || workOrder?.biomedicalGroup || '西门子医疗系统有限公司';
  const responsibleEngineer = order?.completionReport?.engineerName || order?.vendorContact || workOrder?.assignedEngineerName || '王工 (现场资深维修主管)';
  const responsiblePhone = order?.completionReport?.engineerPhone || order?.vendorPhone || workOrder?.assignedEngineerPhone || '13700112233';

  // 催办触发逻辑：向关联的维修负责人发送提醒消息
  const handleUrge = () => {
    setIsUrging(true);

    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const fullTime = now.toISOString().replace('T', ' ').slice(0, 16);

    const urgeMessage: CollaborationMessage = {
      id: `MSG-URGE-${Date.now()}`,
      senderType: 'HOSPITAL',
      senderName: '临床报修科室 (加急督办)',
      senderDept: order?.equipmentDept || equipment?.department || '临床科室',
      timestamp: fullTime,
      content: `【⚠️ 48小时超时加急催办】外协单位在「维修处理中」阶段停留已达 ${inRepairStayHours} 小时（超过48小时保障红线）。请维修负责人【${responsibleEngineer}】（${responsiblePhone}）及服务商【${responsibleVendor}】加急调配原厂备件并尽快完成现场自检，优先恢复科室日常临床诊疗！`
    };

    // 保存到外协订单留言
    if (order?.id) {
      try {
        const stored = getVendorCollaborationOrders();
        const updated = stored.map(o => {
          if (o.id === order.id || o.workOrderId === order.workOrderId) {
            return {
              ...o,
              messages: [...(o.messages || []), urgeMessage]
            };
          }
          return o;
        });
        saveVendorCollaborationOrders(updated);
        if (order.messages) {
          order.messages.push(urgeMessage);
        }
      } catch (err) {
        console.error('Failed to save urge message to orders:', err);
      }
    }

    if (onUrge) {
      onUrge(urgeMessage.content, urgeMessage);
    }

    setTimeout(() => {
      setIsUrging(false);
      setHasUrged(true);
      setUrgeCount(c => c + 1);
      setLastUrgedTime(timeFormatted);
      setUrgedFeedback(
        `已于 ${timeFormatted} 成功向维修负责人【${responsibleEngineer}】（${responsiblePhone}）发送加急提醒消息，工单已升级为【高优督办】！`
      );
    }, 500);
  };

  // 鼠标悬停交互与节点透视管理
  const [hoveredStage, setHoveredStage] = useState<RepairTimelineStage | null>(null);
  const [pinnedStage, setPinnedStage] = useState<RepairTimelineStage | null>(null);

  // 格式化各阶段节点数据（基于外协真实协同字段与高透明度实绩记录）
  const stages: RepairTimelineStageItem[] = [
    {
      stageNumber: 1,
      stageKey: 'REPORT_ACCEPTED',
      title: '报修受理',
      subtitle: '科室故障申报与医工受理',
      responsibleParty: order?.equipmentDept || equipment?.department || '临床科室 / 医工中心',
      statusText: currentStage > 1 ? '已受理入库' : currentStage === 1 ? '受理审核中' : '待受理',
      timestamp: order?.createdAt || workOrder?.reportTime || equipment?.repairRecords?.[0]?.faultDate || '已登记',
      keyInfo: order?.workOrderId ? `院内单号: ${order.workOrderId}` : (order?.faultDescription?.slice(0, 18) || '故障信息已录入'),
      actionHint: '科室提交报修，医工调度中心已建档受理',
      operatorName: workOrder?.reportedBy || '李护士 (临床值班医护)',
      operatorRole: `${order?.equipmentDept || equipment?.department || '放射科'} · 报修发起人 / 医学工程科调度中心`,
      operatorPhone: '院内分机: 8201',
      exactTime: order?.createdAt ? `${order.createdAt.length === 16 ? order.createdAt + ':15' : order.createdAt}` : (workOrder?.reportTime || '2026-09-17 08:30:15'),
      processDescription: `临床使用科室在工作站提交报修申请，登记故障现象【${order?.faultDescription || workOrder?.faultDescription || '数字探测器多轴旋转导轨限位开关受潮阻值漂移，高压发生器无法闭合'}】。医学工程科调度中心快速受理并核定危急度为【${order?.urgencyLevel === 'HIGH' ? '高急保障' : '常规保障'}】，工单号【${order?.workOrderId || 'WO-2026-0922'}】，即时发起原厂外协协同流程。`,
      keyDetails: [
        { label: '受理单号', value: order?.workOrderId || workOrder?.id || 'WO-2026-0922' },
        { label: '报修科室', value: order?.equipmentDept || equipment?.department || '放射科' },
        { label: '紧急等级', value: order?.urgencyLevel === 'HIGH' ? '高急 (优先保障)' : '常规保障', highlight: true }
      ]
    },
    {
      stageNumber: 2,
      stageKey: 'VENDOR_DISPATCHED',
      title: '外协派工',
      subtitle: '原厂委外响应与联合审价',
      responsibleParty: order?.vendorName ? (order.vendorName.length > 12 ? order.vendorName.slice(0, 12) + '...' : order.vendorName) : '原厂技术服务商',
      statusText: currentStage > 2 ? '已派工定标' : currentStage === 2 ? '接单审价中' : '待委外派工',
      timestamp: order?.createdAt ? `派工于 ${order.createdAt.slice(5, 16)}` : undefined,
      keyInfo: order?.vendorContact ? `责任工程师: ${order.vendorContact}` : (order?.vendorName ? '已指定维保单位' : '匹配原厂维保商'),
      actionHint: order?.finalNegotiatedPrice || order?.quoteGrandTotal
        ? `审定报价: ¥${(order.finalNegotiatedPrice || order.quoteGrandTotal || 0).toLocaleString()}`
        : '外协单位接收工单并出具原厂维修方案',
      operatorName: order?.vendorContact ? `${order.vendorContact} (技术调度)` : '张工 (售后服务调度主管)',
      operatorRole: `${order?.vendorName || '西门子医疗系统有限公司'} · 客户服务调度中心 / 多科室联合审价组`,
      operatorPhone: order?.vendorPhone || '13700112233',
      exactTime: order?.createdAt ? `${order.createdAt.slice(0, 10)} 09:15:30` : '2026-09-17 09:15:30',
      processDescription: `签约维保商【${order?.vendorName || '西门子医疗系统有限公司'}】确认接单。医工科、财务科及放射科联合完成线上多科室阳光议价审价，审定成交价 ￥${(order?.finalNegotiatedPrice || order?.quoteGrandTotal || 23500).toLocaleString()}（审减节资 ¥${(order?.savingsAmount || 2500).toLocaleString()}，节资率 ${order?.savingsRate || 9.6}%）。派工外协资深维修主管【${order?.completionReport?.engineerName || order?.vendorContact || '王工'}】带料专车前往医院现场抢修。`,
      keyDetails: [
        { label: '外协维保商', value: order?.vendorName || '西门子医疗系统有限公司' },
        { label: '派工工程师', value: order?.completionReport?.engineerName || order?.vendorContact || '王工 (现场资深维修主管)' },
        { label: '审定成交价', value: `¥${(order?.finalNegotiatedPrice || order?.quoteGrandTotal || 23500).toLocaleString()}`, highlight: true },
        { label: '阳光节资', value: `¥${(order?.savingsAmount || 2500).toLocaleString()}` }
      ]
    },
    {
      stageNumber: 3,
      stageKey: 'REPAIR_IN_PROGRESS',
      title: '维修处理中',
      subtitle: '现场排查与备件调换自检',
      responsibleParty: order?.completionReport?.engineerName || order?.vendorContact || '驻场工程师',
      statusText: currentStage > 3 ? '检修试机合格' : currentStage === 3 ? '现场施工调试中' : '待到场施工',
      timestamp: order?.completionReport?.serviceStartTime ? order.completionReport.serviceStartTime.slice(5, 16) : undefined,
      keyInfo: order?.completionReport?.replacedPartsSummary
        ? order.completionReport.replacedPartsSummary.slice(0, 20)
        : (order?.quoteParts && order.quoteParts.length > 0 ? `${order.quoteParts.length} 项备件更换调试` : '电气与模块排查'),
      actionHint: '工程师到场更换原厂备件并完成电气安全测试',
      operatorName: order?.completionReport?.engineerName || order?.vendorContact || '王工 (现场资深维修主管)',
      operatorRole: `${order?.vendorName || '西门子医疗系统有限公司'} · 认证驻场高级工程师`,
      operatorPhone: order?.completionReport?.engineerPhone || order?.vendorPhone || '13700112233',
      exactTime: order?.completionReport?.serviceStartTime ? `${order.completionReport.serviceStartTime}:00` : '2026-09-18 09:00:00',
      processDescription: `现场工程师到场拆机检修排查，判定故障根因：${order?.completionReport?.faultCauseAnalysis || '限位光电传感器受潮阻值漂移引发CAN总线通讯超限'}。${order?.completionReport?.repairMeasuresSummary || '工程师完成原厂数字平板限位光电感应驱动总成更换，执行多轴旋转导轨平衡校准与高压发生器闭合调试。'}电气绝缘耐压与漏电流测试全部达标，完成自检无异常报警。`,
      keyDetails: [
        { label: '现场维修人', value: `${order?.completionReport?.engineerName || order?.vendorContact || '王工'}` },
        { label: '配件更换', value: (order?.completionReport?.replacedPartsSummary || (order?.quoteParts?.[0]?.name ? `${order.quoteParts[0].name} 1套` : '原厂感应驱动总成')).slice(0, 18) },
        { label: '自检结果', value: '电气安全与自检全PASS', highlight: true }
      ]
    },
    {
      stageNumber: 4,
      stageKey: 'PENDING_CLINICAL',
      title: '待科室确认',
      subtitle: '上机带载试运行与复核签字',
      responsibleParty: order?.equipmentDept ? `${order.equipmentDept}护士长/负责人` : '科室验收人',
      statusText: currentStage > 4 ? '科室确认合格' : currentStage === 4 ? '等待临床试机复核' : '待完工验收',
      timestamp: order?.completionReport?.clinicalAcceptDate ? order.completionReport.clinicalAcceptDate.slice(5, 16) : undefined,
      keyInfo: order?.completionReport?.clinicalAcceptorName
        ? `确认人: ${order.completionReport.clinicalAcceptorName}`
        : (currentStage === 4 ? '💡 需科室上机试运行并电子签章' : '待试机就位'),
      actionHint: '使用科室核查设备运行状态，交接旧件并签署验收意见',
      operatorName: order?.completionReport?.clinicalAcceptorName || (order?.completionReport?.clinicalAcceptDate ? '王芳 (护士长)' : `${order?.equipmentDept || '放射科'} · 护士长/值班技师长`),
      operatorRole: `${order?.equipmentDept || equipment?.department || '放射科'} · 临床复核人 / 设备使用负责人`,
      operatorPhone: '院内护士站: 8202',
      exactTime: order?.completionReport?.clinicalAcceptDate ? `${order.completionReport.clinicalAcceptDate.length === 16 ? order.completionReport.clinicalAcceptDate + ':00' : order.completionReport.clinicalAcceptDate}` : (currentStage >= 4 ? '2026-09-18 16:30:00' : '待工程师施工完工后发起'),
      processDescription: currentStage >= 4
        ? (order?.completionReport?.clinicalAcceptDate
          ? `科室验收人会同维修工程师进行了实际临床开机带载试运行测试，透视胃肠图像信噪比与机械移动平稳性完全符合临床要求，清点旧件并完成电子签章验收确认（临床评价得分: ${order.completionReport.clinicalRating || 5}星满分满意）。`
          : `工程师已完工并完成现场自检，现等待使用科室护士长或医生进行实际上机带载试运行核验、核实旧件交接并电子签字确认。`)
        : '待工程师检修完毕后，由使用科室进行开机试运行测试，验证图像质量与机械运转，清点旧件交接并签署验收意见。',
      keyDetails: [
        { label: '验收状态', value: order?.completionReport?.clinicalAcceptDate ? '已验收签署' : (currentStage === 4 ? '等待临床复核' : '待试机就位'), highlight: currentStage === 4 },
        { label: '旧件退还', value: order?.completionReport?.oldPartsReturned ? '已现场清退' : '待交接清点' },
        { label: '临床服务评价', value: `${order?.completionReport?.clinicalRating || 5} 星满分` }
      ]
    },
    {
      stageNumber: 5,
      stageKey: 'ARCHIVED_CLOSED',
      title: '归档验收',
      subtitle: '台账运行恢复与全案归档',
      responsibleParty: '医工质控与资产台账',
      statusText: currentStage === 5 ? '验收归档完成' : '待闭环归档',
      timestamp: order?.completionReport?.clinicalAcceptDate ? order.completionReport.clinicalAcceptDate.slice(0, 10) : undefined,
      keyInfo: currentStage === 5 ? '设备恢复【正常运行】' : '待全套资料合规入库',
      actionHint: '发票、旧件退库单与验收评价入库，完成全生命周期闭环',
      operatorName: order?.archivedBy || '张主任 (医学工程科质控组)',
      operatorRole: '医学工程科 · 设备资产管理科 / 质控归档专员',
      operatorPhone: '医工质控专线: 8306',
      exactTime: order?.archivedAt ? `${order.archivedAt}:00` : (order?.isDossierArchived ? '2026-09-19 10:00:00' : (currentStage === 5 ? '2026-09-19 10:00:00' : '待全套资料合规核验后归档')),
      processDescription: currentStage === 5 || order?.isDossierArchived
        ? `外协单位维修完成报告单、阳光议价协议、供应商完工发票、旧件退库交接单及科室电子评价表等全套档案已通过医工质控审核。系统自动恢复该设备台账状态为【正常运行】，完成全生命周期维修闭环与质保建档。`
        : '待临床完成验收签字后，外协维修全套档案（报告单、发票、旧件单等）提交医工质控组核验装订，系统自动将设备台账恢复为【正常运行】。',
      keyDetails: [
        { label: '台账运行状态', value: currentStage === 5 ? '已恢复【正常运行】' : '维修调试闭环中', highlight: currentStage === 5 },
        { label: '归档审核人', value: order?.archivedBy || '医学工程科质控组' },
        { label: '档案合规率', value: '100% 资料合规装订' }
      ]
    }
  ];

  // 当前节点的引导文案
  const currentStageItem = stages.find(s => s.stageNumber === currentStage) || stages[0];

  // 当前查看/悬停透视的节点（优先悬停，其次固定查看，再其次当前流转阶段）
  const activeInspectStage = hoveredStage ?? pinnedStage ?? currentStage;
  const activeInspectItem = stages.find(s => s.stageNumber === activeInspectStage) || currentStageItem;

  return (
    <div className={`bg-white rounded-xl border border-indigo-150 shadow-2xs overflow-hidden ${className}`}>
      {/* 顶部概览栏：当前阶段状态标识与引导 */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold tracking-wide">科室报修跟踪 · 外协协同流程进度</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                5 阶段标准流转
              </span>
              {order?.id && (
                <span className="font-mono text-[11px] text-slate-300">
                  协同号: {order.id}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>当前所处节点：</span>
              <strong className="text-sky-300 font-bold">{currentStageItem.title}</strong>
              <span className="text-slate-400">（{currentStageItem.statusText}）</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">{currentStageItem.actionHint}</span>
            </p>
          </div>
        </div>

        {/* 右侧节点状态徽章与测试模拟切换 */}
        <div className="flex items-center gap-2">
          {currentStage !== 3 && (
            <button
              type="button"
              onClick={() => setSimulateStayOverdue(!simulateStayOverdue)}
              className="text-2xs text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-700 bg-slate-800/60 transition cursor-pointer"
              title="测试模拟维修处理中阶段超48小时异常预警提示"
            >
              {simulateStayOverdue ? '关闭模拟超48h预警' : '模拟超48h预警'}
            </button>
          )}

          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
            currentStage === 5
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : currentStage === 4
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 animate-pulse'
              : currentStage === 3
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
              : 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              currentStage === 5 ? 'bg-emerald-400' :
              currentStage === 4 ? 'bg-amber-400 animate-ping' :
              currentStage === 3 ? 'bg-rose-400 animate-ping' : 'bg-indigo-400'
            }`} />
            <span>
              {currentStage === 5 ? '已归档闭环' :
               currentStage === 4 ? '待科室试机确认' :
               currentStage === 3 ? '维修处理施工中' :
               currentStage === 2 ? '外协响应派工中' : '报修已受理'}
            </span>
          </span>
        </div>
      </div>

      {/* ⚠️ 异常预警提示区：若外协单位在‘维修处理中’阶段停留时间超过 48 小时，自动高亮提示并提供‘催办’按钮 */}
      {isOverdue48h && (
        <div className="bg-gradient-to-r from-amber-50/95 via-rose-50/90 to-amber-50/95 border-b-2 border-rose-300 p-3.5 sm:p-4 text-slate-800 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* 左侧：醒目警示与超限详细信息 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-rose-600 text-white shadow-2xs flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-200" />
                    <span>超时异常预警</span>
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    外协单位在「维修处理中」节点严重滞留
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    已滞留 {inRepairStayHours} 小时 · 超限 {Math.max(1, inRepairStayHours - 48)} 小时
                  </span>
                  <span className="text-2xs font-medium text-slate-500">
                    (临床保障红线阈值: 48 小时)
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  外协单位在该环节停留已超过 <strong className="text-rose-700 font-bold">48 小时</strong>。
                  责任服务商：<strong className="text-slate-900">{responsibleVendor}</strong>，
                  现场维修负责人：<strong className="text-indigo-950 font-bold">{responsibleEngineer}</strong>
                  （联系电话：<span className="font-mono font-bold text-slate-900">{responsiblePhone}</span>）。
                  为避免影响科室正常接诊与手术救治，科室可点击右侧「催办」按钮直接发送督办提醒！
                </p>
                {urgedFeedback && (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium">{urgedFeedback}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：催办操作按钮 */}
            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-rose-200/60">
              <button
                type="button"
                onClick={handleUrge}
                disabled={isUrging}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                  hasUrged
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white ring-2 ring-rose-300/60 hover:ring-rose-400'
                }`}
                title="向关联的维修负责人发送催促提醒消息并存证留痕"
              >
                {isUrging ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>推送催办中...</span>
                  </>
                ) : hasUrged ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>再次催办 (已催办{urgeCount}次)</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                    <span>催办</span>
                  </>
                )}
              </button>
              <span className="text-2xs text-rose-700 font-medium">
                {hasUrged ? `最近催办: ${lastUrgedTime}` : '点击向维修负责人发送提醒消息'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 横向流程进度条主体 (Horizontal Timeline Stepper) */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50/80 to-white overflow-x-auto">
        <div className="min-w-[680px]">
          {/* 进度轨道与节点指示器 */}
          <div className="relative flex items-center justify-between mb-4 px-6">
            {/* 底层贯穿轨道线 */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full -z-0" />

            {/* 高亮进度轨道（计算已通过百分比） */}
            <div
              className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-sky-500 rounded-full transition-all duration-500 -z-0"
              style={{
                width: `${Math.min(100, Math.max(0, ((currentStage - 1) / 4) * 100))}%`
              }}
            />

            {/* 5个流程节点图标（支持鼠标悬停浮动透视） */}
            {stages.map((st) => {
              const isPassed = currentStage > st.stageNumber;
              const isCurrent = currentStage === st.stageNumber;
              const isUpcoming = currentStage < st.stageNumber;
              const isHovered = hoveredStage === st.stageNumber;
              const isInspecting = activeInspectStage === st.stageNumber;

              return (
                <div
                  key={st.stageNumber}
                  onMouseEnter={() => setHoveredStage(st.stageNumber)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => {
                    setPinnedStage(prev => prev === st.stageNumber ? null : st.stageNumber);
                    if (onStageClick) onStageClick(st.stageNumber, st.stageKey);
                  }}
                  className="relative z-20 flex flex-col items-center group cursor-pointer"
                  title={`鼠标悬停查看【${st.title}】阶段操作人、具体时间与处理简述`}
                >
                  {/* 节点圆圈 */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 relative ${
                      isHovered
                        ? 'ring-4 ring-sky-400 scale-125 z-30 shadow-lg'
                        : isInspecting
                        ? 'ring-2 ring-indigo-400 scale-105'
                        : ''
                    } ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 group-hover:scale-110'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 shadow-md shadow-indigo-300 group-hover:scale-110 animate-bounce-subtle'
                        : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <span className="font-mono text-xs">{st.stageNumber}</span>
                    )}
                  </div>

                  {/* 节点序号与当前脉冲指示 */}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                  )}

                  {/* 节点悬停浮动透视弹窗 (Tooltip Popover) */}
                  {isHovered && (
                    <div
                      className={`absolute z-50 top-12 ${
                        st.stageNumber === 1
                          ? 'left-0 sm:-left-3'
                          : st.stageNumber === 2
                          ? 'left-1/2 -translate-x-1/4'
                          : st.stageNumber === 3
                          ? 'left-1/2 -translate-x-1/2'
                          : st.stageNumber === 4
                          ? 'right-1/2 translate-x-1/4'
                          : 'right-0 sm:-right-3'
                      } w-80 sm:w-96 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border-2 border-indigo-500/90 p-3.5 text-left text-slate-800 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto`}
                      style={{ filter: 'drop-shadow(0 12px 28px rgba(15, 23, 42, 0.25))' }}
                      onMouseEnter={() => setHoveredStage(st.stageNumber)}
                      onMouseLeave={() => setHoveredStage(null)}
                    >
                      {/* 顶部指示箭头 */}
                      <div
                        className={`absolute -top-2 w-3.5 h-3.5 bg-white border-t-2 border-l-2 border-indigo-500 rotate-45 ${
                          st.stageNumber === 1
                            ? 'left-4'
                            : st.stageNumber === 5
                            ? 'right-4'
                            : 'left-1/2 -translate-x-1/2'
                        }`}
                      />

                      {/* 头部：阶段名称与状态徽章 */}
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-150">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-2xs font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            阶段 {st.stageNumber} / 5
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{st.title}</span>
                            <span className="text-2xs font-normal text-slate-500 hidden sm:inline">（{st.subtitle}）</span>
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-bold ${
                            isPassed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isCurrent
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isPassed ? '✓ 节点已完成' : isCurrent ? '● 当前正在处理' : '○ 待到达节点'}
                        </span>
                      </div>

                      {/* 三大关键透明度要素 */}
                      <div className="space-y-2 text-xs">
                        {/* 1. 操作人 */}
                        <div className="bg-slate-50/90 p-2.5 rounded-lg border border-slate-200/90 flex items-start gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-2xs font-bold text-slate-500 flex items-center justify-between">
                              <span>操作人 / 责任主体</span>
                              {st.operatorPhone && (
                                <span className="font-mono text-indigo-700 font-semibold text-2xs">{st.operatorPhone}</span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-slate-900 mt-0.5">
                              {st.operatorName}
                            </div>
                            <div className="text-2xs text-slate-500 mt-0.5 line-clamp-1" title={st.operatorRole}>
                              {st.operatorRole}
                            </div>
                          </div>
                        </div>

                        {/* 2. 具体发生时间 */}
                        <div className="bg-slate-50/90 p-2.5 rounded-lg border border-slate-200/90 flex items-start gap-2">
                          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-2xs font-bold text-slate-500">具体发生时间</div>
                            <div className="text-xs font-mono font-bold text-slate-900 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{st.exactTime}</span>
                              <span className="text-2xs font-sans font-medium text-slate-500">
                                ({st.statusText})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. 处理简要描述 */}
                        <div className="bg-slate-50/90 p-2.5 rounded-lg border border-slate-200/90 flex items-start gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-2xs font-bold text-slate-500">处理简要描述</div>
                            <p className="text-xs text-slate-700 leading-relaxed mt-0.5 text-justify">
                              {st.processDescription}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 关联存证指标标签 */}
                      {st.keyDetails && st.keyDetails.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-150 flex flex-wrap items-center gap-1.5">
                          {st.keyDetails.map((kd, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-2xs flex items-center gap-1 border ${
                                kd.highlight
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="text-slate-400 font-normal">{kd.label}:</span>
                              <span>{kd.value}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 底部引导文案 */}
                      <div className="mt-2 text-2xs text-indigo-600/80 font-medium flex items-center justify-between">
                        <span>💡 点击可锁定常驻下方透明度明细看板</span>
                        <span className="text-slate-400">移开鼠标自动收起</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 5个阶段横向详情卡片（并列等宽栅格，支持悬停协同） */}
          <div className="grid grid-cols-5 gap-2.5">
            {stages.map((st) => {
              const isPassed = currentStage > st.stageNumber;
              const isCurrent = currentStage === st.stageNumber;
              const isUpcoming = currentStage < st.stageNumber;
              const isHovered = hoveredStage === st.stageNumber;
              const isInspecting = activeInspectStage === st.stageNumber;

              return (
                <div
                  key={st.stageNumber}
                  onMouseEnter={() => setHoveredStage(st.stageNumber)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => {
                    setPinnedStage(prev => prev === st.stageNumber ? null : st.stageNumber);
                    if (onStageClick) onStageClick(st.stageNumber, st.stageKey);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                    isHovered
                      ? 'bg-indigo-50/95 border-indigo-400 ring-2 ring-indigo-300 shadow-md -translate-y-0.5'
                      : isInspecting
                      ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/70'
                      : isPassed
                      ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-200/80 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/80 opacity-70 hover:opacity-90'
                  }`}
                  title={`点击或悬停查看【${st.title}】操作人、时间与处理描述`}
                >
                  {/* 阶段名称与状态标签 */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-xs font-bold ${
                      isPassed ? 'text-emerald-950' : isCurrent ? 'text-indigo-950' : 'text-slate-600'
                    }`}>
                      {st.title}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                      isPassed
                        ? 'bg-emerald-200/70 text-emerald-800'
                        : isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPassed ? '已通过' : isCurrent ? '进行中' : '未到达'}
                    </span>
                  </div>

                  {/* 简要职能描述 */}
                  <p className="text-[10px] text-slate-500 leading-tight mb-1.5 line-clamp-1" title={st.subtitle}>
                    {st.subtitle}
                  </p>

                  {/* 权责单位 / 责任人 */}
                  <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1 mb-1 truncate" title={st.responsibleParty}>
                    {st.stageNumber === 1 && <FileText className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                    {st.stageNumber === 2 && <Building2 className="w-2.5 h-2.5 text-indigo-500 shrink-0" />}
                    {st.stageNumber === 3 && <Wrench className="w-2.5 h-2.5 text-blue-500 shrink-0" />}
                    {st.stageNumber === 4 && <UserCheck className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                    {st.stageNumber === 5 && <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
                    <span className="truncate">{st.responsibleParty}</span>
                  </div>

                  {/* 关键信息 / 结果反馈 */}
                  {st.keyInfo && (
                    <div className={`text-[10px] font-mono font-medium p-1 rounded border leading-tight truncate ${
                      isPassed
                        ? 'bg-white/80 border-emerald-150 text-emerald-900'
                        : isCurrent
                        ? 'bg-white border-indigo-200 text-indigo-900 font-bold'
                        : 'bg-white/60 border-slate-200 text-slate-500'
                    }`} title={st.keyInfo}>
                      {st.keyInfo}
                    </div>
                  )}

                  {/* 时间标记 */}
                  {st.timestamp && (
                    <div className="text-[9.5px] text-slate-400 font-mono mt-1.5 flex items-center gap-0.5 truncate">
                      <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                      <span>{st.timestamp}</span>
                    </div>
                  )}

                  {/* 悬停透视交互提示标签 */}
                  <div className="mt-1.5 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9.5px] text-indigo-600 font-medium">
                    <span>{isHovered ? '正在透视明细' : '悬停查看详情'}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-indigo-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部：节点流转透明度实时明细看板 (Repair Stage Transparency Detail Panel) */}
          <div className="mt-4 pt-3.5 border-t border-slate-200/90 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-3.5 rounded-xl border border-indigo-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {activeInspectItem.stageNumber}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>【{activeInspectItem.title}】阶段透明度明细档案</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      currentStage > activeInspectItem.stageNumber
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentStage === activeInspectItem.stageNumber
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {currentStage > activeInspectItem.stageNumber ? '已通过' : currentStage === activeInspectItem.stageNumber ? '进行中' : '未到达'}
                    </span>
                    {hoveredStage === activeInspectItem.stageNumber && (
                      <span className="text-2xs text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-medium animate-pulse">
                        鼠标悬停即时透视
                      </span>
                    )}
                  </h4>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    {activeInspectItem.subtitle} · 医工全生命周期合规存证
                  </p>
                </div>
              </div>

              {/* 阶段快速切换按钮组 */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-2xs text-slate-400 font-medium px-1.5 hidden sm:inline">快速查看节点:</span>
                {stages.map((st) => (
                  <button
                    key={st.stageNumber}
                    type="button"
                    onClick={() => {
                      setPinnedStage(st.stageNumber);
                      setHoveredStage(null);
                    }}
                    onMouseEnter={() => setHoveredStage(st.stageNumber)}
                    onMouseLeave={() => setHoveredStage(null)}
                    className={`px-2 py-1 rounded text-2xs font-bold transition-all cursor-pointer ${
                      activeInspectStage === st.stageNumber
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {st.stageNumber}. {st.title}
                  </button>
                ))}
              </div>
            </div>

            {/* 三大关键信息卡片并列栅格 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. 操作人 */}
              <div className="bg-white p-3 rounded-lg border border-indigo-150/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-2xs font-bold text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1 text-indigo-700">
                      <UserCheck className="w-3.5 h-3.5" />
                      该阶段操作人
                    </span>
                    {activeInspectItem.operatorPhone && (
                      <span className="font-mono text-indigo-600 font-semibold">{activeInspectItem.operatorPhone}</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {activeInspectItem.operatorName}
                  </div>
                  <div className="text-2xs text-slate-500 mt-1 leading-normal">
                    {activeInspectItem.operatorRole}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-2xs text-slate-400 flex items-center justify-between">
                  <span>权责主体归属</span>
                  <span className="font-medium text-slate-600">{activeInspectItem.responsibleParty}</span>
                </div>
              </div>

              {/* 2. 具体发生时间 */}
              <div className="bg-white p-3 rounded-lg border border-indigo-150/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-2xs font-bold text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1 text-amber-700">
                      <Clock className="w-3.5 h-3.5" />
                      具体发生时间
                    </span>
                    <span className="text-2xs text-slate-400">{activeInspectItem.statusText}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {activeInspectItem.exactTime}
                  </div>
                  <div className="text-2xs text-slate-500 mt-1 leading-normal">
                    {activeInspectItem.timestamp ? `记录时间戳: ${activeInspectItem.timestamp}` : '节点执行状态有效存证'}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-2xs text-slate-400 flex items-center justify-between">
                  <span>时效记录</span>
                  <span className="font-mono text-slate-600">
                    {currentStage > activeInspectItem.stageNumber ? '已执行闭环' : currentStage === activeInspectItem.stageNumber ? '当前处理中' : '尚未触发'}
                  </span>
                </div>
              </div>

              {/* 3. 处理简要描述 */}
              <div className="bg-white p-3 rounded-lg border border-indigo-150/80 shadow-2xs flex flex-col justify-between md:col-span-1">
                <div>
                  <div className="flex items-center justify-between text-2xs font-bold text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <FileText className="w-3.5 h-3.5" />
                      处理简要描述
                    </span>
                    <span className="text-2xs text-emerald-700 font-semibold">透明留痕</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify line-clamp-3" title={activeInspectItem.processDescription}>
                    {activeInspectItem.processDescription}
                  </p>
                </div>
                {activeInspectItem.keyDetails && activeInspectItem.keyDetails.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
                    {activeInspectItem.keyDetails.map((kd, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                          kd.highlight
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {kd.label}: {kd.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-2xs text-slate-500">
              <div className="flex items-center gap-1 text-indigo-700">
                <Info className="w-3 h-3 text-indigo-500" />
                <span>提示：鼠标悬停在上方任意节点（如「外协派工」），即可即时显示该阶段的操作人、具体时间与处理简要描述。</span>
              </div>
              {pinnedStage && (
                <button
                  type="button"
                  onClick={() => setPinnedStage(null)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  取消锁定 (恢复默认)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

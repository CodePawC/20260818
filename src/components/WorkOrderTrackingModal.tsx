import React from 'react';
import {
  EngineeringWorkOrder,
  BiomedicalEngineerProfile
} from '../types/dispatchTypes';
import {
  X,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  UserCheck,
  User,
  Phone,
  ShieldCheck,
  Calendar,
  Sparkles,
  Printer,
  ChevronRight,
  Layers,
  Building,
  Building2,
  Package,
  FileText,
  Star,
  ArrowRight,
  MessageSquare,
  Scale,
  FolderKanban,
  Lock
} from 'lucide-react';
import { WorkOrderStepBar, getWorkOrderFlowStage } from './WorkOrderStepBar';
import { RepairTrackingTimeline } from './RepairTrackingTimeline';
import { getVendorCollaborationOrders } from '../utils/vendorCollaborationData';
import { OUTSOURCE_SERVICE_MODE_LABELS } from '../utils/dispatchData';
import {
  isWorkOrderPaid,
  getWorkOrderEstimatedOrActualAmount,
  resolveProcurementMode,
  PROCUREMENT_MODE_META
} from '../utils/complianceAuditEngine';

interface WorkOrderTrackingModalProps {
  isOpen: boolean;
  workOrder: EngineeringWorkOrder | null;
  onClose: () => void;
  onAssignEngineer?: (order: EngineeringWorkOrder) => void;
  onFieldOperation?: (order: EngineeringWorkOrder) => void;
  onClinicalAcceptance?: (order: EngineeringWorkOrder) => void;
  onPrint?: (order: EngineeringWorkOrder) => void;
  canDispatch?: boolean;
  canDiscuss?: boolean;
  canFieldOp?: boolean;
  canAccept?: boolean;
}

export const WorkOrderTrackingModal: React.FC<WorkOrderTrackingModalProps> = ({
  isOpen,
  workOrder,
  onClose,
  onAssignEngineer,
  onFieldOperation,
  onClinicalAcceptance,
  onPrint,
  canDispatch = true,
  canDiscuss = true,
  canFieldOp = true,
  canAccept = true
}) => {
  // 匹配关联的外协维保协同单数据
  const matchedVendorOrder = React.useMemo(() => {
    if (!workOrder) return null;
    try {
      const orders = getVendorCollaborationOrders();
      return orders.find(o =>
        (workOrder.linkedVendorOrderId && o.id === workOrder.linkedVendorOrderId) ||
        o.workOrderId === workOrder.id ||
        (workOrder.equipmentId && o.equipmentId === workOrder.equipmentId) ||
        (workOrder.equipmentSn && o.equipmentSerialNo === workOrder.equipmentSn)
      ) || null;
    } catch {
      return null;
    }
  }, [workOrder]);

  const [auditArchiving, setAuditArchiving] = React.useState(false);
  const [auditBlockError, setAuditBlockError] = React.useState<{
    message: string;
    missingItems: string[];
    linkedProjectId?: string;
  } | null>(null);
  const [auditClearedInfo, setAuditClearedInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAuditBlockError(null);
    setAuditClearedInfo(null);
  }, [isOpen, workOrder?.id]);

  if (!isOpen || !workOrder) return null;

  const isPaidOrder = isWorkOrderPaid(workOrder);
  const effectiveOrderAmount = getWorkOrderEstimatedOrActualAmount(workOrder);
  const complianceMode = resolveProcurementMode(isPaidOrder, effectiveOrderAmount);

  const handleTriggerAuditArchive = async () => {
    if (auditArchiving) return;
    setAuditArchiving(true);
    setAuditBlockError(null);
    try {
      const resp = await fetch(`/api/work-orders/${encodeURIComponent(workOrder.id)}/audit-archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.status === 409 || json.auditBlocked) {
        setAuditBlockError({
          message: json.error || '审计合规校验未通过，禁止归档',
          missingItems: Array.isArray(json.missingItems) ? json.missingItems : [],
          linkedProjectId: json.linkedProject?.id || workOrder.linkedProjectId
        });
        return;
      }
      if (!resp.ok || !json.success) {
        setAuditBlockError({
          message: json.error || '归档操作受限，请核对权限或合规凭证',
          missingItems: Array.isArray(json.missingItems) ? json.missingItems : []
        });
        return;
      }
      setAuditClearedInfo(`已通过三项审计核验，工单正式归档（${json.data?.auditArchivedAt || '刚刚'}）`);
      window.dispatchEvent(new CustomEvent('work_orders_updated'));
      window.dispatchEvent(new CustomEvent('medtech:project-ledger-updated'));
    } catch {
      setAuditBlockError({
        message: '请求归档校验失败，请检查网络连接后重试',
        missingItems: []
      });
    } finally {
      setAuditArchiving(false);
    }
  };

  const flowStage = getWorkOrderFlowStage(workOrder.status);
  const isPendingDispatch = workOrder.status === 'pending_dispatch';
  const isPreDispatched = workOrder.status === 'pre_dispatched';
  const isInRepair = ['dispatched', 'accepted', 'arrived_inspecting', 'waiting_parts'].includes(workOrder.status);
  const isPendingAccept = workOrder.status === 'repaired_pending_acceptance';
  const isClosed = workOrder.status === 'closed';

  const isP1 = workOrder.priority === 'P1_CRITICAL';
  const isP2 = workOrder.priority === 'P2_URGENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Top Header */}
        <div className="p-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold">工单状态流转实时追踪看板</h3>
                <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                  {workOrder.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                  isP1 ? 'bg-rose-500 text-white animate-pulse' :
                  isP2 ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {workOrder.priority === 'P1_CRITICAL' ? 'P1 特急生命支持' :
                   workOrder.priority === 'P2_URGENT' ? 'P2 紧急' :
                   workOrder.priority === 'P3_STANDARD' ? 'P3 常规' : 'P4 计划'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                实时追踪医工抢修全生命周期流转进度，减少临床交互中的不确定性
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                onClick={() => onPrint(workOrder)}
                className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-700"
                title="打印纸质工单"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">打印存根</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* 5阶段工单内部流转进度条：待分配 -> 预派工 -> 维修中 -> 待验收 -> 已完成 */}
        <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-2">
          <WorkOrderStepBar
            status={workOrder.status}
            size="md"
            proposedEngineerName={workOrder.proposedEngineerName}
            assignedEngineerName={workOrder.assignedEngineerName}
            discussionCount={workOrder.internalDiscussions?.length || 0}
          />
        </div>

        {/* 基于外协协同数据的横向流程进度条 (Timeline): 报修受理 -> 外协派工 -> 维修处理中 -> 待科室确认 -> 归档验收 */}
        <div className="bg-slate-50/70 border-b border-slate-200 p-3.5 sm:p-4">
          <RepairTrackingTimeline
            order={matchedVendorOrder}
            workOrder={workOrder}
          />
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 max-h-[68vh] overflow-y-auto space-y-4">
          {/* Equipment & Fault Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{workOrder.equipmentName}</h4>
                <div className="flex items-center gap-2 text-2xs text-slate-500 font-mono mt-0.5">
                  <span>型号: {workOrder.equipmentModel}</span>
                  <span>|</span>
                  <span>SN: {workOrder.equipmentSn}</span>
                  {workOrder.internalNo && (
                    <>
                      <span>|</span>
                      <span className="text-blue-700 font-bold">院内编号: {workOrder.internalNo}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-2xs text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>{workOrder.department}</span>
                <span className="text-slate-300">/</span>
                <span>{workOrder.location}</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-700 bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/80">
              <span className="font-semibold text-slate-800">报修故障描述：</span>
              <span>{workOrder.faultDescription}</span>
            </div>
          </div>

          {/* Next Action Guide Card (减少交互不确定性核心亮点) */}
          <div className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isPendingDispatch
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : isPreDispatched
              ? 'bg-violet-50/80 border-violet-200 text-violet-950'
              : isInRepair
              ? 'bg-blue-50/80 border-blue-200 text-blue-950'
              : isPendingAccept
              ? 'bg-cyan-50/80 border-cyan-200 text-cyan-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full animate-ping ${
                  isPendingDispatch ? 'bg-rose-500' :
                  isPreDispatched ? 'bg-violet-500' :
                  isInRepair ? 'bg-blue-500' :
                  isPendingAccept ? 'bg-cyan-500' : 'bg-emerald-500'
                }`} />
                <span className="font-bold text-xs uppercase tracking-wide">
                  当前节点：{flowStage.stageLabel}（{flowStage.subStatusLabel}）
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {isPendingDispatch && '【待办指引】报修已登记入库。请医工调度室先拟定工程师暂存预派工或开展内部讨论，确认无误后再正式下发派工。'}
                {isPreDispatched && `【预派工协同中】已暂定拟派工程师【${workOrder.proposedEngineerName || '待定'}】（${workOrder.internalDiscussions?.length || 0} 条内部讨论）。尚未正式下发，可继续讨论或一键确认正式派工。`}
                {workOrder.status === 'dispatched' && '【待办指引】已正式派发给责任工程师。请工程师在移动端点击【接单响应】并携带急修工具前往临床科室。'}
                {workOrder.status === 'accepted' && '【待办指引】工程师正在赶往现场。到达病房或手术室后请点击【到场打卡】开始排查定位故障。'}
                {workOrder.status === 'arrived_inspecting' && '【待办指引】工程师现场排查中。请排除电气/机械故障或申领备件，测试定标合格后提交临床验收。'}
                {workOrder.status === 'waiting_parts' && '【待办指引】工单挂起等待配件。已关联医工备件库出库调拨或厂商加急配送中。'}
                {isPendingAccept && '【待办指引】设备已完成维修与电气安全自检。请临床科室（护士长/技师长）上机试运行核验，并在移动端电子签名验收。'}
                {isClosed && '【流转闭环】临床科室已试机验收合格并完成五星评价，设备已恢复【正常运行】状态，维修档案已入库。'}
              </p>
            </div>

            {/* Quick action button based on current step */}
            <div className="shrink-0 flex items-center gap-2">
              {isPendingDispatch && onAssignEngineer && (canDispatch || canDiscuss) && (
                <button
                  onClick={() => {
                    onClose();
                    onAssignEngineer(workOrder);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {canDispatch ? <UserCheck className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  <span>{canDispatch ? '预派工 / 指派工程师' : '参与派前讨论'}</span>
                </button>
              )}

              {isPreDispatched && onAssignEngineer && (canDispatch || canDiscuss) && (
                <button
                  onClick={() => {
                    onClose();
                    onAssignEngineer(workOrder);
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{canDispatch ? '继续内部讨论 / 正式派工' : '参与内部技术讨论'}</span>
                </button>
              )}

              {isInRepair && onFieldOperation && canFieldOp && (
                <button
                  onClick={() => {
                    onClose();
                    onFieldOperation(workOrder);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Wrench className="w-4 h-4" />
                  <span>现场作业打卡</span>
                </button>
              )}

              {isPendingAccept && onClinicalAcceptance && canAccept && (
                <button
                  onClick={() => {
                    onClose();
                    onClinicalAcceptance(workOrder);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>临床试机验收</span>
                </button>
              )}

              {isClosed && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>全流程已闭环</span>
                </div>
              )}
            </div>
          </div>

          {/* 收费项目台账联动与审计强阻断栏 */}
          {(isPaidOrder || workOrder.linkedProjectId) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>收费维修与审计合规联锁</span>
                  {workOrder.linkedProjectId && (
                    <span className="font-mono text-[11px] text-blue-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      台账 #{workOrder.linkedProjectId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-mono font-bold text-amber-700">
                    ¥{effectiveOrderAmount.toLocaleString()}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-semibold text-slate-700">
                    {PROCUREMENT_MODE_META[complianceMode].label}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span>
                  {workOrder.auditArchiveStatus === 'archived' || auditClearedInfo
                    ? auditClearedInfo || `审计核验已通过并归档（${workOrder.auditArchivedAt || '已存证'}）`
                    : '必须完成：1) 电子审批或盖章纸质申请单；2) 5千内比价/5千-5万议价/5万以上招标；3) 会议纪要。缺一不可归档。'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {workOrder.linkedProjectId && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(
                          new CustomEvent('medtech:focus-project-ledger', {
                            detail: { projectId: workOrder.linkedProjectId }
                          })
                        );
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 rounded-md font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>前往项目台账补办</span>
                    </button>
                  )}
                  {(isPendingAccept || isClosed) && workOrder.auditArchiveStatus !== 'archived' && !auditClearedInfo && (
                    <button
                      type="button"
                      disabled={auditArchiving}
                      onClick={handleTriggerAuditArchive}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>{auditArchiving ? '校验中...' : '审计合规归档'}</span>
                    </button>
                  )}
                </div>
              </div>

              {auditBlockError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{auditBlockError.message}</span>
                  </div>
                  {auditBlockError.missingItems.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-800">
                      {auditBlockError.missingItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5-Step Detailed Timeline Cards */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>工单流转节点明细全景（5 步溯源）</span>
            </h5>

            {/* Step 1: 待分配 (Report & Dispatch) */}
            <div className={`p-3.5 rounded-xl border transition ${
              workOrder.status !== 'pending_dispatch'
                ? 'bg-slate-50/70 border-slate-200'
                : 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-2xs font-mono font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="font-bold text-xs text-slate-900">第 1 步：待分配阶段（报修录入与调度指派）</span>
                </div>
                <span className="text-2xs font-mono text-slate-500">{workOrder.reportTime}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">报修发起人：</span>
                  <span className="font-medium text-slate-800">{workOrder.reporterName}</span>
                  <span className="text-slate-400 ml-1">({workOrder.reporterPhone})</span>
                </div>
                <div>
                  <span className="text-slate-400">报修类型：</span>
                  <span className="font-medium text-slate-800">
                    {workOrder.workOrderType === 'emergency_breakdown' ? '紧急故障抢修' : '预防性维护'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">调度指派时间：</span>
                  <span className="font-mono text-slate-800">
                    {workOrder.dispatchTime || <span className="text-rose-600 font-semibold">等待调度室分配...</span>}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">调度责任人：</span>
                  <span className="text-slate-800">{workOrder.dispatcherName || '—'}</span>
                </div>
              </div>
            </div>

            {/* Step 2: 预派工/拟定工程师 (Internal Discussion & Confirmation) */}
            <div className={`p-3.5 rounded-xl border transition ${
              isPreDispatched
                ? 'bg-violet-50/60 border-violet-200 ring-1 ring-violet-200'
                : workOrder.proposedEngineerName || (workOrder.internalDiscussions && workOrder.internalDiscussions.length > 0) || !isPendingDispatch
                ? 'bg-slate-50/70 border-slate-200'
                : 'bg-slate-50/30 border-dashed border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-2xs font-mono font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="font-bold text-xs text-slate-900">第 2 步：预派工阶段（拟定工程师与内部讨论确认）</span>
                </div>
                <span className="text-2xs font-mono text-slate-500">
                  {workOrder.preDispatchTime || (isPreDispatched ? '内部确认中' : '—')}
                </span>
              </div>

              <div className="mt-2.5 space-y-2 text-xs bg-white p-2.5 rounded-lg border border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">拟定工程师：</span>
                    <span className="font-bold text-violet-900">
                      {workOrder.proposedEngineerName || workOrder.assignedEngineerName || <span className="text-slate-400">待拟定</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">预派暂存人：</span>
                    <span className="text-slate-800">{workOrder.preDispatcherName || '—'}</span>
                  </div>
                </div>

                {workOrder.internalDiscussions && workOrder.internalDiscussions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="text-2xs font-semibold text-violet-800 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>内部讨论与确认记录 ({workOrder.internalDiscussions.length}条)</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {workOrder.internalDiscussions.map((note) => (
                        <div key={note.id} className="p-1.5 bg-violet-50/50 rounded border border-violet-100 text-2xs">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-bold text-slate-800">{note.authorName}{note.authorRole ? ` (${note.authorRole})` : ''}</span>
                            <span className="font-mono text-[10px]">{note.timestamp}</span>
                          </div>
                          <p className="text-slate-700 mt-0.5">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: 维修中 (Engineer Response & Field Operation) */}
            <div className={`p-3.5 rounded-xl border transition ${
              isInRepair
                ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-200'
                : ['repaired_pending_acceptance', 'closed'].includes(workOrder.status)
                ? 'bg-slate-50/70 border-slate-200'
                : 'bg-slate-50/30 border-dashed border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-2xs font-mono font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="font-bold text-xs text-slate-900">第 3 步：维修中阶段（正式派工、现场排查与配件领用）</span>
                </div>
                <span className="text-2xs font-mono text-slate-500">
                  {workOrder.arrivedTime || workOrder.acceptedTime || '进行中'}
                </span>
              </div>

              <div className="mt-2.5 space-y-2 text-xs bg-white p-2.5 rounded-lg border border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">责任工程师：</span>
                    <span className="font-bold text-indigo-900">
                      {workOrder.assignedEngineerName || <span className="text-slate-400">待指派</span>}
                    </span>
                    {workOrder.assignedEngineerPhone && (
                      <span className="text-slate-400 ml-1">({workOrder.assignedEngineerPhone})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400">专业技术组：</span>
                    <span className="text-slate-800">{workOrder.biomedicalGroup}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">接单响应耗时：</span>
                    <span className="font-mono font-bold text-slate-800">
                      {workOrder.responseTimeMinutes ? `${workOrder.responseTimeMinutes} 分钟` : '—'}
                    </span>
                    <span className="text-2xs text-slate-400 ml-1">(SLA限时 ≤{workOrder.slaResponseLimitMinutes}分)</span>
                  </div>
                  <div>
                    <span className="text-slate-400">到场打卡时间：</span>
                    <span className="font-mono text-slate-800">{workOrder.arrivedTime || '尚未到达现场'}</span>
                  </div>
                </div>

                {(workOrder.dispatchChannel === 'outsourced' || workOrder.externalPartner) && (
                  <div className="pt-2 border-t border-amber-100 bg-amber-50/70 rounded-lg p-2.5 space-y-1 text-2xs text-amber-950">
                    <div className="font-bold flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-amber-900">
                        <Building2 className="w-3.5 h-3.5 text-amber-700" />
                        外协原厂 / 第三方维保协同：{workOrder.externalPartner}
                      </span>
                      {workOrder.linkedVendorOrderId && (
                        <span className="font-mono px-1.5 py-0.5 rounded bg-white border border-amber-200 text-indigo-700">
                          协同单: {workOrder.linkedVendorOrderId}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-700">
                      <div>
                        <span className="text-slate-400">维保结算方式：</span>
                        <span className="font-semibold">
                          {workOrder.outsourceServiceMode ? OUTSOURCE_SERVICE_MODE_LABELS[workOrder.outsourceServiceMode]?.label : '外协专项维保'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">外协联系人：</span>
                        <span>
                          {workOrder.externalVendorContact || '待定'}
                          {workOrder.externalVendorPhone ? ` (${workOrder.externalVendorPhone})` : ''}
                        </span>
                      </div>
                      {workOrder.externalContractNo && (
                        <div>
                          <span className="text-slate-400">框架合同编号：</span>
                          <span className="font-mono">{workOrder.externalContractNo}</span>
                        </div>
                      )}
                      {workOrder.outsourceReason && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-400">转外协原因：</span>
                          <span>{workOrder.outsourceReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {workOrder.repairAction && (
                  <div className="pt-2 border-t border-slate-100 text-slate-700">
                    <span className="text-slate-400">现场排除措施：</span>
                    <span className="font-medium">{workOrder.repairAction}</span>
                  </div>
                )}

                {workOrder.partsReplaced && workOrder.partsReplaced.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block mb-1">消耗备品备件清单：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {workOrder.partsReplaced.map((part, pIdx) => (
                        <span key={pIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-2xs font-mono">
                          {part.partName} × {part.quantity} (￥{part.totalPrice})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: 待验收 (Repair Completed, Awaiting Acceptance) */}
            <div className={`p-3.5 rounded-xl border transition ${
              isPendingAccept
                ? 'bg-cyan-50/40 border-cyan-200 ring-1 ring-cyan-200'
                : isClosed
                ? 'bg-slate-50/70 border-slate-200'
                : 'bg-slate-50/30 border-dashed border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-2xs font-mono font-bold flex items-center justify-center">
                    4
                  </span>
                  <span className="font-bold text-xs text-slate-900">第 4 步：待验收阶段（完工申报与质控自检）</span>
                </div>
                <span className="text-2xs font-mono text-slate-500">
                  {workOrder.repairFinishedTime || (isPendingAccept ? '已完工待核' : '未到达')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">停机修复耗时：</span>
                  <span className="font-mono font-bold text-slate-800">{workOrder.totalDowntimeHours} 小时</span>
                  <span className="text-2xs text-slate-400 ml-1">(SLA限额 ≤{workOrder.slaRepairLimitHours}h)</span>
                </div>
                <div>
                  <span className="text-slate-400">电气安全检测：</span>
                  <span className="font-bold text-emerald-600">
                    {workOrder.electricalSafetyPassed ?? true ? '✓ 自检合格' : '待复测'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">性能定标校验：</span>
                  <span className="font-bold text-emerald-600">
                    {workOrder.performanceCalibrationPassed ?? true ? '✓ 定标合格' : '待复测'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">临床试机状态：</span>
                  <span className="font-semibold text-cyan-700">
                    {isPendingAccept ? '等待科室负责人试机签字...' : isClosed ? '✓ 临床已核实验收' : '待完工'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 5: 已完成 (Clinical Acceptance & Closed) */}
            <div className={`p-3.5 rounded-xl border transition ${
              isClosed
                ? 'bg-emerald-50/40 border-emerald-200 ring-1 ring-emerald-200'
                : 'bg-slate-50/30 border-dashed border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-2xs font-mono font-bold flex items-center justify-center">
                    5
                  </span>
                  <span className="font-bold text-xs text-slate-900">第 5 步：已完成阶段（临床试机合格、五星评价与闭环归档）</span>
                </div>
                <span className="text-2xs font-mono text-slate-500">{workOrder.acceptanceTime || '待闭环'}</span>
              </div>

              {isClosed ? (
                <div className="mt-2.5 space-y-2 text-xs bg-white p-2.5 rounded-lg border border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400">验收科室人员：</span>
                      <span className="font-bold text-slate-800">{workOrder.acceptanceStaffName || '临床负责人'}</span>
                      <span className="text-slate-400 ml-1">({workOrder.acceptanceStaffRole || '护士长'})</span>
                    </div>
                    <div>
                      <span className="text-slate-400">满意度评分：</span>
                      <span className="font-bold text-amber-500 font-mono">
                        ★ {workOrder.ratingScore || 5.0} 分
                      </span>
                    </div>
                  </div>

                  {workOrder.clinicalFeedback && (
                    <div className="pt-2 border-t border-slate-100 text-slate-700 text-2xs">
                      <span className="text-slate-400">科室反馈：</span>
                      <span className="italic">“{workOrder.clinicalFeedback}”</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-2xs text-emerald-700">
                    <span className="flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>设备状态已自动更新为【正常运行】，维修记录与全流程时序已存证入库</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-2xs text-slate-400 italic">
                  尚未完成验收。完工后由临床科室人员在此确认设备试机运行正常，即可完成归档。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-2xs text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>三甲标准医工抢修全生命周期流转规范</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            关闭追踪面板
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import {
  EngineeringWorkOrder,
  BiomedicalEngineerProfile,
  DispatchDiscussionNote,
  OutsourceServiceMode,
  OutsourcedDispatchMeta
} from '../types/dispatchTypes';
import {
  recommendEngineerForOrder,
  getAvailableOutsourcedVendors,
  recommendVendorForOrder,
  OUTSOURCE_SERVICE_MODE_LABELS,
  OutsourcedVendorOption
} from '../utils/dispatchData';
import {
  resolveProcurementMode,
  PROCUREMENT_MODE_META,
  buildDynamicProjectIdFromWorkOrder
} from '../utils/complianceAuditEngine';
import { WorkOrderStepBar } from './WorkOrderStepBar';
import {
  X,
  UserCheck,
  AlertTriangle,
  Clock,
  Wrench,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Building2,
  ChevronRight,
  Check,
  ExternalLink,
  MessageSquare,
  Save,
  Send,
  Users,
  Phone,
  FileText,
  Coins,
  Scale,
  FolderKanban
} from 'lucide-react';

interface DispatchAssignModalProps {
  isOpen: boolean;
  workOrder: EngineeringWorkOrder | null;
  engineers: BiomedicalEngineerProfile[];
  currentUserName?: string;
  currentUserRole?: string;
  canDispatch?: boolean;
  onClose: () => void;
  onPreDispatch?: (
    workOrderId: string,
    engineer: BiomedicalEngineerProfile,
    notes: string,
    discussionMessage?: string,
    dispatchMeta?: OutsourcedDispatchMeta
  ) => Promise<EngineeringWorkOrder | void> | void;
  onAddDiscussion?: (
    workOrderId: string,
    content: string,
    proposedEngineerName?: string
  ) => Promise<EngineeringWorkOrder | void> | void;
  onConfirmDispatch: (
    workOrderId: string,
    engineer: BiomedicalEngineerProfile,
    notes: string,
    dispatchMeta?: OutsourcedDispatchMeta
  ) => Promise<EngineeringWorkOrder | void> | void;
  onNavigateToDispatchTab?: (orderId: string) => void;
  onNavigateToVendorCollab?: (vendorOrderId?: string) => void;
  onNavigateToProjectLedger?: (projectId?: string) => void;
}

const QUICK_DISCUSSION_TEMPLATES = [
  '已核对备件库库存，常规音频线/配件充足，建议本院自修',
  '请携带专用检测仪表进场，先排查外接耳机插口接触电阻',
  '已与功能检查科孙志强沟通，安排在门诊接诊间隙上机检修',
  '人选与工具方案内部确认无误，同意正式下发派工单'
];

const OUTSOURCE_REASON_PRESETS = [
  '核心高压/射频/主板级故障，需原厂专有诊断授权工具',
  '整机仍在年度全保/质保合同期内，由签约维保商免费到场处置',
  '专用超声探头晶体或光学探测组件需原厂备机周转与更换',
  '院内备件库无库存且涉及国家强检定标资质，需合规外协'
];

export const DispatchAssignModal: React.FC<DispatchAssignModalProps> = ({
  isOpen,
  workOrder,
  engineers,
  currentUserName = '医工调度中心',
  currentUserRole = '医工调度员',
  onClose,
  onPreDispatch,
  onAddDiscussion,
  onConfirmDispatch,
  onNavigateToDispatchTab,
  onNavigateToVendorCollab,
  onNavigateToProjectLedger,
  canDispatch = true
}) => {
  const [localOrder, setLocalOrder] = useState<EngineeringWorkOrder | null>(workOrder);

  const recommendedEngineer = useMemo(() => {
    if (!localOrder) return engineers[0];
    return recommendEngineerForOrder(localOrder, engineers);
  }, [localOrder, engineers]);

  const availableVendors = useMemo<OutsourcedVendorOption[]>(() => getAvailableOutsourcedVendors(), [isOpen]);
  const recommendedVendor = useMemo(
    () => recommendVendorForOrder(localOrder, availableVendors),
    [localOrder, availableVendors]
  );

  const [selectedEngineerId, setSelectedEngineerId] = useState<string>(
    workOrder?.proposedEngineerId || workOrder?.assignedEngineerId || recommendedEngineer?.id || engineers[0]?.id || ''
  );
  const [dispatchMode, setDispatchMode] = useState<'internal' | 'vendor'>(
    workOrder?.dispatchChannel === 'outsourced' || workOrder?.externalPartner ? 'vendor' : 'internal'
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [useCustomVendor, setUseCustomVendor] = useState<boolean>(false);
  const [vendorName, setVendorName] = useState<string>('');
  const [vendorShortName, setVendorShortName] = useState<string>('');
  const [vendorContact, setVendorContact] = useState<string>('');
  const [vendorPhone, setVendorPhone] = useState<string>('');
  const [vendorContractNo, setVendorContractNo] = useState<string>('');
  const [outsourceServiceMode, setOutsourceServiceMode] = useState<OutsourceServiceMode>('single_paid_quote');
  const [outsourceReason, setOutsourceReason] = useState<string>('');
  const [estimatedOutsourceCost, setEstimatedOutsourceCost] = useState<string>('');
  const [syncToVendorPortal, setSyncToVendorPortal] = useState<boolean>(true);
  const [hasCost, setHasCost] = useState<boolean>(Boolean(workOrder?.hasCost));
  const [estimatedCostInput, setEstimatedCostInput] = useState<string>(
    workOrder?.estimatedCost ? String(workOrder.estimatedCost) : ''
  );
  const [showAllEngineers, setShowAllEngineers] = useState<boolean>(false);
  const [isPreSaving, setIsPreSaving] = useState<boolean>(false);
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inlineNotice, setInlineNotice] = useState<{ text: string; type: 'pre' | 'comment' | 'error' } | null>(null);
  const [discussionInput, setDiscussionInput] = useState<string>('');
  const [dispatchedSuccessInfo, setDispatchedSuccessInfo] = useState<{
    engineer: BiomedicalEngineerProfile;
    notes: string;
    dispatchTime: string;
    dispatchMeta?: OutsourcedDispatchMeta;
    linkedVendorOrderId?: string;
    linkedProjectId?: string;
  } | null>(null);

  const buildDefaultNotes = (order: EngineeringWorkOrder | null) => {
    if (!order) return '';
    if (order.preDispatchNotes) return order.preDispatchNotes;
    if (order.dispatchNotes) return order.dispatchNotes;
    const text = `${order.equipmentName} ${order.faultDescription}`.toLowerCase();
    if (text.includes('耳机') || text.includes('肌电图') || order.id.includes('102642') || order.faultDescription?.includes('L12238')) {
      return '【急修抢修指令】功能检查科肌电图诱发电位仪耳机右声道故障，请工程师携带备用音频排线与检测仪表，15分钟内到场响应排查，优先保障临床检查正常开展。';
    }
    if (order.priority === 'P1_CRITICAL') {
      return '【特级生命支持抢修指令】请携带急修专用检测箱与原厂核心配件，务必在15分钟内到场响应排查！';
    }
    if (order.priority === 'P2_URGENT') {
      return '【临床紧迫诊断设备】请在30分钟内到场，尽快排除故障恢复检查。';
    }
    return '请工程师现场排查设备故障，按规范执行电气安全与性能测试后交由科室核实验收。';
  };

  const [dispatchNotes, setDispatchNotes] = useState<string>(() => buildDefaultNotes(workOrder));

  const applyVendorSelection = (vendor: OutsourcedVendorOption | undefined) => {
    if (!vendor) return;
    setSelectedVendorId(vendor.id);
    setUseCustomVendor(false);
    setVendorName(vendor.name);
    setVendorShortName(vendor.shortName || vendor.name);
    setVendorContact(vendor.contactPerson);
    setVendorPhone(vendor.contactPhone || vendor.hotline || '');
    setVendorContractNo(vendor.contractNo || '');
  };

  useEffect(() => {
    if (isOpen && workOrder) {
      setLocalOrder(workOrder);
      const rec = recommendEngineerForOrder(workOrder, engineers);
      setSelectedEngineerId(
        workOrder.proposedEngineerId || workOrder.assignedEngineerId || rec?.id || engineers[0]?.id || ''
      );
      const isOutsourced = workOrder.dispatchChannel === 'outsourced' || Boolean(workOrder.externalPartner);
      setDispatchMode(isOutsourced ? 'vendor' : 'internal');

      const vendors = getAvailableOutsourcedVendors();
      const matchedVendor =
        vendors.find(v => v.id === workOrder.externalVendorId || (workOrder.externalPartner && v.name.includes(workOrder.externalPartner.slice(0, 4)))) ||
        recommendVendorForOrder(workOrder, vendors) ||
        vendors[0];

      if (workOrder.externalPartner && !vendors.some(v => v.name === workOrder.externalPartner || v.id === workOrder.externalVendorId)) {
        setUseCustomVendor(true);
        setSelectedVendorId('CUSTOM');
        setVendorName(workOrder.externalPartner);
        setVendorShortName(workOrder.externalVendorShortName || workOrder.externalPartner);
        setVendorContact(workOrder.externalVendorContact || '');
        setVendorPhone(workOrder.externalVendorPhone || '');
        setVendorContractNo(workOrder.externalContractNo || '');
      } else {
        applyVendorSelection(matchedVendor);
        if (workOrder.externalVendorContact) setVendorContact(workOrder.externalVendorContact);
        if (workOrder.externalVendorPhone) setVendorPhone(workOrder.externalVendorPhone);
        if (workOrder.externalContractNo) setVendorContractNo(workOrder.externalContractNo);
      }

      const initServiceMode = workOrder.outsourceServiceMode || 'single_paid_quote';
      setOutsourceServiceMode(initServiceMode);
      setOutsourceReason(workOrder.outsourceReason || OUTSOURCE_REASON_PRESETS[0]);
      const initEst = workOrder.estimatedCost || workOrder.estimatedOutsourceCost || 0;
      setEstimatedOutsourceCost(workOrder.estimatedOutsourceCost ? String(workOrder.estimatedOutsourceCost) : '');
      setEstimatedCostInput(initEst > 0 ? String(initEst) : '');
      const initHasCost = Boolean(
        workOrder.hasCost ||
          initEst > 0 ||
          (isOutsourced && (initServiceMode === 'single_paid_quote' || initServiceMode === 'factory_return'))
      );
      setHasCost(initHasCost);
      setSyncToVendorPortal(true);
      setDispatchNotes(buildDefaultNotes(workOrder));
      setDispatchedSuccessInfo(null);
      setInlineNotice(null);
      setDiscussionInput('');
    }
  }, [isOpen, workOrder?.id]);

  if (!isOpen || !localOrder) return null;

  const selectedEngineer = engineers.find(e => e.id === selectedEngineerId) || engineers[0];
  const matchedGroupEngineers = engineers.filter(e => e.group === localOrder.biomedicalGroup);
  const displayEngineers = showAllEngineers
    ? engineers
    : (matchedGroupEngineers.length > 0 ? matchedGroupEngineers : engineers);

  const discussions: DispatchDiscussionNote[] = Array.isArray(localOrder.internalDiscussions)
    ? localOrder.internalDiscussions
    : [];

  const showTempNotice = (text: string, type: 'pre' | 'comment' | 'error') => {
    setInlineNotice({ text, type });
    setTimeout(() => {
      setInlineNotice(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const nowFormatted = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const resolvedCostAmount = Number(
    (dispatchMode === 'vendor' ? (estimatedOutsourceCost || estimatedCostInput) : estimatedCostInput) || 0
  );
  const effectiveComplianceMode = resolveProcurementMode(hasCost, resolvedCostAmount);

  const buildOutsourcedMeta = (): OutsourcedDispatchMeta => {
    const safeCost = Number.isFinite(resolvedCostAmount) && resolvedCostAmount > 0 ? resolvedCostAmount : undefined;
    const costFields = {
      hasCost,
      estimatedCost: hasCost ? safeCost : undefined,
      costTriggerStage: hasCost ? ('dispatch' as const) : undefined,
      autoCreateProjectLedger: hasCost
    };
    if (dispatchMode !== 'vendor') {
      return {
        dispatchChannel: 'internal',
        ...costFields
      };
    }
    const matchedVendor = availableVendors.find(v => v.id === selectedVendorId);
    const requiresQuote = OUTSOURCE_SERVICE_MODE_LABELS[outsourceServiceMode].requiresQuote;
    return {
      dispatchChannel: 'outsourced',
      externalVendorId: useCustomVendor ? `CUSTOM-${Date.now().toString().slice(-6)}` : (matchedVendor?.id || selectedVendorId || 'ISO-001'),
      externalPartner: vendorName.trim(),
      externalVendorShortName: vendorShortName.trim() || vendorName.trim(),
      externalVendorType: useCustomVendor ? 'custom' : (matchedVendor?.type || 'manufacturer'),
      externalVendorContact: vendorContact.trim(),
      externalVendorPhone: vendorPhone.trim(),
      externalContractNo: vendorContractNo.trim(),
      outsourceServiceMode,
      outsourceReason: outsourceReason.trim(),
      estimatedOutsourceCost: safeCost,
      requiresVendorQuote: requiresQuote,
      syncToVendorPortal,
      ...costFields
    };
  };

  // 1. 暂存为“预派工/拟定工程师”状态，留在当前弹窗内讨论确认
  const handlePreDispatchStage = async () => {
    if (!canDispatch || !selectedEngineer || isPreSaving) return;
    if (dispatchMode === 'vendor' && !vendorName.trim()) {
      showTempNotice('请先选择或填写外协原厂/维保服务商名称', 'error');
      return;
    }
    setIsPreSaving(true);
    const nowStr = nowFormatted();
    const meta = buildOutsourcedMeta();
    const commentText =
      discussionInput.trim() ||
      (meta.dispatchChannel === 'outsourced'
        ? `拟定转【外协协同：${meta.externalPartner}】（方式：${OUTSOURCE_SERVICE_MODE_LABELS[outsourceServiceMode].shortLabel}），院内监护工程师：【${selectedEngineer.name}】，已暂存预派工，请确认方案后正式外协派发。`
        : `拟定由【${selectedEngineer.name}】(${selectedEngineer.group}) 负责此单，已暂存预派工，请相关人员在下方开展内部讨论确认。`);

    try {
      let updatedOrder: EngineeringWorkOrder | null = null;
      if (onPreDispatch) {
        const res = await onPreDispatch(localOrder.id, selectedEngineer, dispatchNotes, commentText, meta);
        if (res && typeof res === 'object' && 'id' in res) {
          updatedOrder = res as EngineeringWorkOrder;
        }
      } else {
        const resp = await fetch(`/api/work-orders/${encodeURIComponent(localOrder.id)}/pre-dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engineerId: selectedEngineer.id,
            engineerName: selectedEngineer.name,
            engineerPhone: selectedEngineer.phone,
            preDispatcherName: currentUserName,
            authorRole: currentUserRole,
            notes: dispatchNotes,
            discussionMessage: commentText,
            ...meta,
            equipmentId: localOrder.equipmentId,
            equipmentName: localOrder.equipmentName,
            equipmentModel: localOrder.equipmentModel,
            equipmentSn: localOrder.equipmentSn,
            internalNo: localOrder.internalNo,
            category: localOrder.category,
            department: localOrder.department,
            location: localOrder.location,
            reporterName: localOrder.reporterName,
            reporterPhone: localOrder.reporterPhone,
            reportTime: localOrder.reportTime,
            priority: localOrder.priority,
            faultDescription: localOrder.faultDescription,
            biomedicalGroup: localOrder.biomedicalGroup,
            caoliaoRecordNo: localOrder.caoliaoRecordNo,
            photoUrl: localOrder.photoUrl
          })
        });
        const json = await resp.json();
        if (json.success && json.order) {
          updatedOrder = json.order;
        }
        window.dispatchEvent(new CustomEvent('work_orders_updated'));
      }

      const fallbackEntry: DispatchDiscussionNote = {
        id: `DISC-${Date.now()}`,
        authorName: currentUserName,
        authorRole: currentUserRole,
        content: commentText,
        timestamp: nowStr,
        proposedEngineerName: selectedEngineer.name,
        actionType: 'pre_dispatch'
      };

      setLocalOrder(prev =>
        updatedOrder ||
        (prev
          ? {
              ...prev,
              status: 'pre_dispatched',
              proposedEngineerId: selectedEngineer.id,
              proposedEngineerName: selectedEngineer.name,
              proposedEngineerPhone: selectedEngineer.phone,
              preDispatcherName: currentUserName,
              preDispatchTime: nowStr,
              preDispatchNotes: dispatchNotes,
              ...meta,
              internalDiscussions: [...(prev.internalDiscussions || []), fallbackEntry]
            }
          : null)
      );
      setDiscussionInput('');
      showTempNotice(
        meta.dispatchChannel === 'outsourced'
          ? `已暂存【外协预派工：${meta.externalPartner}】（院内监护：${selectedEngineer.name}），待核准后正式下发。`
          : `已暂存为【预派工/拟定工程师：${selectedEngineer.name}】，尚未正式下发，可继续内部讨论确认。`,
        'pre'
      );
    } catch (err) {
      console.error('Pre-dispatch failed:', err);
      showTempNotice('暂存预派工失败，请重试', 'error');
    } finally {
      setIsPreSaving(false);
    }
  };

  // 2. 提交内部讨论/核实确认意见
  const handlePostDiscussion = async () => {
    const content = discussionInput.trim();
    if (!content || isPostingComment) return;
    setIsPostingComment(true);
    const nowStr = nowFormatted();

    try {
      let updatedOrder: EngineeringWorkOrder | null = null;
      if (onAddDiscussion) {
        const res = await onAddDiscussion(localOrder.id, content, selectedEngineer?.name);
        if (res && typeof res === 'object' && 'id' in res) {
          updatedOrder = res as EngineeringWorkOrder;
        }
      } else {
        // 如果尚未在服务端生成工单，先自动暂存预派工再追加讨论，确保不丢记录
        if (localOrder.status === 'pending_dispatch' && selectedEngineer) {
          const preResp = await fetch(`/api/work-orders/${encodeURIComponent(localOrder.id)}/pre-dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              engineerId: selectedEngineer.id,
              engineerName: selectedEngineer.name,
              engineerPhone: selectedEngineer.phone,
              preDispatcherName: currentUserName,
              authorRole: currentUserRole,
              notes: dispatchNotes,
              discussionMessage: content,
              equipmentId: localOrder.equipmentId,
              equipmentName: localOrder.equipmentName,
              equipmentModel: localOrder.equipmentModel,
              equipmentSn: localOrder.equipmentSn,
              internalNo: localOrder.internalNo,
              category: localOrder.category,
              department: localOrder.department,
              location: localOrder.location,
              reporterName: localOrder.reporterName,
              reporterPhone: localOrder.reporterPhone,
              reportTime: localOrder.reportTime,
              priority: localOrder.priority,
              faultDescription: localOrder.faultDescription,
              biomedicalGroup: localOrder.biomedicalGroup,
              caoliaoRecordNo: localOrder.caoliaoRecordNo,
              photoUrl: localOrder.photoUrl
            })
          });
          const preJson = await preResp.json();
          if (preJson.success && preJson.order) {
            updatedOrder = preJson.order;
          }
        } else {
          const resp = await fetch(`/api/work-orders/${encodeURIComponent(localOrder.id)}/discussion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              authorName: currentUserName,
              authorRole: currentUserRole,
              content,
              proposedEngineerName: selectedEngineer?.name
            })
          });
          const json = await resp.json();
          if (json.success && json.order) {
            updatedOrder = json.order;
          }
        }
        window.dispatchEvent(new CustomEvent('work_orders_updated'));
      }

      const fallbackEntry: DispatchDiscussionNote = {
        id: `DISC-${Date.now()}`,
        authorName: currentUserName,
        authorRole: currentUserRole,
        content,
        timestamp: nowStr,
        proposedEngineerName: selectedEngineer?.name,
        actionType: localOrder.status === 'pending_dispatch' ? 'pre_dispatch' : 'discussion'
      };

      setLocalOrder(prev =>
        updatedOrder ||
        (prev
          ? {
              ...prev,
              status: prev.status === 'pending_dispatch' ? 'pre_dispatched' : prev.status,
              proposedEngineerId: prev.proposedEngineerId || selectedEngineer?.id,
              proposedEngineerName: prev.proposedEngineerName || selectedEngineer?.name,
              proposedEngineerPhone: prev.proposedEngineerPhone || selectedEngineer?.phone,
              internalDiscussions: [...(prev.internalDiscussions || []), fallbackEntry]
            }
          : null)
      );
      setDiscussionInput('');
      showTempNotice('已记录内部讨论意见，工单保持【预派工】协同确认状态', 'comment');
    } catch (err) {
      console.error('Post discussion failed:', err);
      showTempNotice('讨论意见提交失败，请重试', 'error');
    } finally {
      setIsPostingComment(false);
    }
  };

  // 3. 内部讨论确认完成后，正式下发派工单（支持本院自修与外协原厂双通道）
  const handleFormalDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngineer || isSubmitting) return;
    if (dispatchMode === 'vendor') {
      if (!vendorName.trim()) {
        showTempNotice('请填写或选择外协原厂/维保服务商名称', 'error');
        return;
      }
      if (!vendorPhone.trim()) {
        showTempNotice('请填写外协服务商联系电话或400售后专线，确保临床应急可触达', 'error');
        return;
      }
    }
    if (hasCost && (!Number.isFinite(resolvedCostAmount) || resolvedCostAmount <= 0)) {
      showTempNotice('已勾选「有费用产生」，请填写大于 0 的预估费用金额以便自动匹配比价/议价/招标合规流程', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const timeStr = nowFormatted();
      const meta = buildOutsourcedMeta();
      const expectedExtId =
        meta.dispatchChannel === 'outsourced'
          ? localOrder.linkedVendorOrderId || `EXT-${localOrder.id.replace(/[^A-Za-z0-9]/g, '').slice(-10)}`
          : undefined;
      const expectedProjectId = hasCost
        ? localOrder.linkedProjectId || buildDynamicProjectIdFromWorkOrder(localOrder.id)
        : undefined;

      const res = await onConfirmDispatch(localOrder.id, selectedEngineer, dispatchNotes, meta);
      const returnedOrder = res && typeof res === 'object' && 'id' in res ? (res as EngineeringWorkOrder) : null;
      const finalExtId = returnedOrder?.linkedVendorOrderId || expectedExtId;
      const finalProjId = returnedOrder?.linkedProjectId || expectedProjectId;

      setLocalOrder(prev =>
        returnedOrder ||
        (prev
          ? {
              ...prev,
              status: 'dispatched',
              assignedEngineerId: selectedEngineer.id,
              assignedEngineerName: selectedEngineer.name,
              assignedEngineerPhone: selectedEngineer.phone,
              dispatchTime: timeStr,
              dispatchNotes,
              ...meta,
              vendorDispatchTime: meta.dispatchChannel === 'outsourced' ? timeStr : undefined,
              linkedVendorOrderId: finalExtId,
              linkedProjectId: finalProjId
            }
          : null)
      );
      setDispatchedSuccessInfo({
        engineer: selectedEngineer,
        notes: dispatchNotes,
        dispatchTime: timeStr,
        dispatchMeta: meta,
        linkedVendorOrderId: finalExtId,
        linkedProjectId: finalProjId
      });
    } catch (err) {
      console.error('Dispatch assignment error:', err);
      showTempNotice('正式派工下发失败，请检查网络后重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isP1 = localOrder.priority === 'P1_CRITICAL';
  const isP2 = localOrder.priority === 'P2_URGENT';
  const isPreDispatched = localOrder.status === 'pre_dispatched';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div
          className={`px-4 py-3 text-white flex items-center justify-between shrink-0 ${
            isPreDispatched
              ? 'bg-gradient-to-r from-violet-700 to-indigo-800'
              : isP1
              ? 'bg-gradient-to-r from-rose-600 to-red-700'
              : isP2
              ? 'bg-gradient-to-r from-amber-600 to-orange-700'
              : 'bg-gradient-to-r from-blue-700 to-indigo-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              {isPreDispatched ? (
                <Users className="w-4.5 h-4.5 text-white" />
              ) : isP1 ? (
                <ShieldAlert className="w-4.5 h-4.5 text-white animate-pulse" />
              ) : (
                <UserCheck className="w-4.5 h-4.5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold">
                  {isPreDispatched ? '预派工内部讨论与正式确认台' : '医工调度中心 · 预派工与派工指派台'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white font-mono">
                  {localOrder.id}
                </span>
                {localOrder.caoliaoRecordNo && (
                  <span className="px-1.5 py-0.2 rounded text-[10.5px] font-bold bg-emerald-500/90 text-white font-mono">
                    草料单号: {localOrder.caoliaoRecordNo}
                  </span>
                )}
                <span className="text-2xs text-white/90">
                  (响应SLA限: {localOrder.slaResponseLimitMinutes || 15}分钟 | 修复SLA限: {localOrder.slaRepairLimitHours || 2}h)
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 顶部内置：5阶段工单状态流转进度条 (待分配 -> 预派工 -> 维修中 -> 待验收 -> 已完成) */}
        <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100 shrink-0">
          <WorkOrderStepBar
            status={localOrder.status}
            size="md"
            proposedEngineerName={localOrder.proposedEngineerName}
            assignedEngineerName={localOrder.assignedEngineerName}
            discussionCount={discussions.length}
          />
        </div>

        {/* 正式派工下发成功提示卡片 */}
        {dispatchedSuccessInfo ? (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 overflow-y-auto animate-in fade-in zoom-in-95">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${
              dispatchedSuccessInfo.dispatchMeta?.dispatchChannel === 'outsourced'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              {dispatchedSuccessInfo.dispatchMeta?.dispatchChannel === 'outsourced' ? (
                <Building2 className="w-9 h-9" />
              ) : (
                <CheckCircle2 className="w-9 h-9" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {dispatchedSuccessInfo.dispatchMeta?.dispatchChannel === 'outsourced'
                  ? '外协原厂协同派工单已正式签发！'
                  : '内部确认完成，派工单已正式下发！'}
              </h3>
              <p className="text-xs text-slate-500">
                {dispatchedSuccessInfo.dispatchMeta?.dispatchChannel === 'outsourced'
                  ? `已同步生成外协协同单 ${dispatchedSuccessInfo.linkedVendorOrderId || ''}，院内监护医工将协同对接服务商进场处置与质量验收`
                  : `状态已由【预派工】正式流转至【维修中 · 已正式派工】，系统已启动现场 ${localOrder.slaResponseLimitMinutes || 15} 分钟 SLA 响应倒计时`}
              </p>
            </div>

            <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-xs space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400">工单全码：</span>
                  <strong className="font-mono text-slate-900">{localOrder.id}</strong>
                </div>
                <div>
                  <span className="text-slate-400">报修设备：</span>
                  <strong className="text-slate-900">{localOrder.equipmentName}</strong>
                </div>

                {dispatchedSuccessInfo.dispatchMeta?.dispatchChannel === 'outsourced' && (
                  <>
                    <div>
                      <span className="text-slate-400">承接外协服务商：</span>
                      <strong className="text-amber-800">{dispatchedSuccessInfo.dispatchMeta.externalPartner}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">外协协同单号：</span>
                      <strong className="font-mono text-indigo-700">
                        {dispatchedSuccessInfo.linkedVendorOrderId || '已同步台账'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">外协方式：</span>
                      <span className="font-semibold text-slate-800">
                        {OUTSOURCE_SERVICE_MODE_LABELS[dispatchedSuccessInfo.dispatchMeta.outsourceServiceMode || 'single_paid_quote'].label}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">服务商专线：</span>
                      <span className="font-mono">{dispatchedSuccessInfo.dispatchMeta.externalVendorPhone || '—'}</span>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-slate-400">
                    {dispatchedSuccessInfo.dispatchMeta?.dispatchChannel === 'outsourced' ? '院内监护工程师：' : '正式责任工程师：'}
                  </span>
                  <strong className="text-indigo-700">{dispatchedSuccessInfo.engineer.name}</strong> ({dispatchedSuccessInfo.engineer.phone})
                </div>
                <div>
                  <span className="text-slate-400">正式下发时间：</span>
                  <span className="font-mono">{dispatchedSuccessInfo.dispatchTime}</span>
                </div>
              </div>

              {dispatchedSuccessInfo.linkedProjectId && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <FolderKanban className="w-4 h-4 text-emerald-700" />
                      <span>已自动在《设备项目台账》生成合规立项：#{dispatchedSuccessInfo.linkedProjectId}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5 tabular-nums">
                      预估 ¥{(dispatchedSuccessInfo.dispatchMeta?.estimatedCost || 0).toLocaleString()} · {PROCUREMENT_MODE_META[resolveProcurementMode(true, Number(dispatchedSuccessInfo.dispatchMeta?.estimatedCost || 0))].label} · 需补办电子/纸质申请与会议纪要
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/70 text-2xs text-slate-600">
                <span className="text-slate-400 font-semibold">正式调度派工指令：</span>
                <p className="mt-0.5 text-slate-800 bg-white p-2 rounded border border-slate-200">
                  {dispatchedSuccessInfo.notes}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                留在当前界面继续监控
              </button>
              {dispatchedSuccessInfo.linkedProjectId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToProjectLedger) {
                      onNavigateToProjectLedger(dispatchedSuccessInfo.linkedProjectId);
                    } else {
                      window.dispatchEvent(
                        new CustomEvent('medtech:focus-project-ledger', {
                          detail: { projectId: dispatchedSuccessInfo.linkedProjectId }
                        })
                      );
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>前往项目台账补办申请与会议纪要</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {dispatchedSuccessInfo.dispatchMeta?.dispatchChannel === 'outsourced' && onNavigateToVendorCollab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToVendorCollab(dispatchedSuccessInfo.linkedVendorOrderId);
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>前往外协协同中心跟踪报价/议价</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onNavigateToDispatchTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDispatchTab(localOrder.id);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>前往调度看板跟踪后续验收</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 主交互区：左侧工单详情 + 内部讨论记录；右侧拟定/指派工程师 + 指令与操作按钮 */
          <form onSubmit={handleFormalDispatch} className="p-4 flex-1 min-h-0 overflow-y-auto flex flex-col justify-between space-y-3">
            {/* Inline feedback banner */}
            {inlineNotice && (
              <div
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                  inlineNotice.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-violet-50 text-violet-900 border-violet-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>{inlineNotice.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInlineNotice(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 顶部派工策略分流模式 */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">派工处置策略：</span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setDispatchMode('internal')}
                    className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                      dispatchMode === 'internal'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>本院医工自修派工</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchMode('vendor')}
                    className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                      dispatchMode === 'vendor'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>外协原厂专家协同</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-2xs">
                {isPreDispatched ? (
                  <span className="inline-flex items-center gap-1 text-violet-800 font-bold bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                    <MessageSquare className="w-3 h-3 text-violet-600" />
                    预派工暂存中 · 已拟定【{localOrder.proposedEngineerName || selectedEngineer?.name}】· 待确认正式下发
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    支持先「暂存预派工」内部讨论确认后再正式下发
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
              {/* Left 6 cols: 工单摘要 + 内部讨论确认区 */}
              <div className="lg:col-span-6 space-y-2.5 flex flex-col min-h-0">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{localOrder.equipmentName}</span>
                      {localOrder.internalNo && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold text-2xs">
                          {localOrder.internalNo}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-2xs font-bold ${
                        isP1
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isP2
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {localOrder.priority === 'P1_CRITICAL'
                        ? 'P1 特急 / 15分钟响应'
                        : localOrder.priority === 'P2_URGENT'
                        ? 'P2 紧急 / 30分钟响应'
                        : localOrder.priority === 'P3_STANDARD'
                        ? 'P3 常规 / 2小时响应'
                        : 'P4 计划维保'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-2xs text-slate-600">
                    <div>
                      <span className="text-slate-400">报修科室：</span>
                      <strong className="text-slate-800">{localOrder.department}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">设备位置：</span>
                      <span className="text-slate-700">{localOrder.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">设备SN：</span>
                      <span className="font-mono text-slate-700">{localOrder.equipmentSn || '--'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">报修人：</span>
                      <span className="text-slate-800 font-medium">
                        {localOrder.reporterName} ({localOrder.reporterPhone})
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-200 text-slate-700 text-2xs">
                    <div className="font-semibold text-slate-900 mb-0.5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>临床报修故障现象：</span>
                      </div>
                      {localOrder.photoUrl && (
                        <a
                          href={localOrder.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 hover:underline flex items-center gap-0.5"
                        >
                          <span>查看现场照片</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed font-medium">{localOrder.faultDescription}</p>
                  </div>
                </div>

                {/* 内部讨论与确认协作区 */}
                <div className="bg-violet-50/50 border border-violet-200 rounded-lg p-3 flex flex-col flex-1 min-h-[210px] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-violet-700" />
                      <span className="text-xs font-bold text-violet-950">内部讨论与派前确认记录</span>
                      <span className="px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 font-mono font-bold text-[10px]">
                        {discussions.length} 条
                      </span>
                    </div>
                    {localOrder.proposedEngineerName && (
                      <span className="text-[11px] font-semibold text-violet-800">
                        当前拟定：{localOrder.proposedEngineerName}
                      </span>
                    )}
                  </div>

                  {/* 讨论消息列表 */}
                  <div className="flex-1 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {discussions.length === 0 ? (
                      <div className="p-3 bg-white/80 rounded border border-dashed border-violet-200 text-2xs text-slate-500 text-center">
                        暂无内部讨论记录。可先在右侧选择拟定工程师并点击【暂存预派工】，或直接录入内部协调意见后再正式下发。
                      </div>
                    ) : (
                      discussions.map(item => (
                        <div
                          key={item.id}
                          className={`p-2 rounded border text-2xs space-y-0.5 ${
                            item.actionType === 'pre_dispatch'
                              ? 'bg-violet-100/60 border-violet-200'
                              : item.actionType === 'confirm_dispatch'
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10.5px]">
                            <div className="flex items-center gap-1.5">
                              <strong className="text-slate-900">{item.authorName}</strong>
                              {item.authorRole && (
                                <span className="text-slate-500">({item.authorRole})</span>
                              )}
                              {item.proposedEngineerName && (
                                <span className="px-1 py-0.2 rounded bg-white text-violet-700 border border-violet-200 font-semibold text-[10px]">
                                  拟定: {item.proposedEngineerName}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-slate-400">{item.timestamp}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{item.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 快捷讨论确认话术 */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {QUICK_DISCUSSION_TEMPLATES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDiscussionInput(tpl)}
                        className="px-1.5 py-0.5 bg-white hover:bg-violet-100 text-violet-800 border border-violet-200 rounded text-[10.5px] transition cursor-pointer"
                        title="点击填入此确认意见"
                      >
                        + {tpl.slice(0, 14)}...
                      </button>
                    ))}
                  </div>

                  {/* 输入框 + 提交讨论按钮 */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={discussionInput}
                      onChange={e => setDiscussionInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePostDiscussion();
                        }
                      }}
                      placeholder="录入内部讨论意见（如备件核实、人员调配、科室时间确认）..."
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={!discussionInput.trim() || isPostingComment}
                      onClick={handlePostDiscussion}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isPostingComment ? '提交中' : '提交讨论'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 6 cols: 拟定/选择负责工程师 + 智能推荐 + 指令 */}
              <div className="lg:col-span-6 space-y-2.5 flex flex-col">
                {!canDispatch ? (
                  <div className="space-y-3 flex-1">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">当前派工拟定与调度指令（只读）</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]">
                          工程师协同讨论视角
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-2xs bg-white p-2.5 rounded border border-slate-200">
                        <div>
                          <span className="text-slate-400">所属技术组：</span>
                          <span className="font-semibold text-slate-800">{localOrder.biomedicalGroup}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">拟定/指派工程师：</span>
                          <span className="font-bold text-violet-800">
                            {localOrder.assignedEngineerName || localOrder.proposedEngineerName || '待调度员拟定'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-slate-200 text-2xs">
                        <div className="text-slate-400 mb-1 font-semibold">调度指令 / 排查备忘录：</div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {localOrder.preDispatchNotes || localOrder.dispatchNotes || dispatchNotes || '暂无调度指令'}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-2xs text-amber-900 leading-relaxed">
                      <strong>权限说明：</strong>仅系统管理员或医工主管/调度员可执行【暂存预派工】与【正式派工签发】。您可在左侧【内部讨论与派前确认记录】提交技术研判意见、备件领用建议或响应时间确认。
                    </div>
                  </div>
                ) : (
                  <>
                {/* Smart Recommendation */}
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-indigo-900 text-2xs">所属技术组：{localOrder.biomedicalGroup}</div>
                      {recommendedEngineer && (
                        <p className="text-indigo-700 text-2xs mt-0.5">
                          智能推荐对口工程师：<strong>{recommendedEngineer.name}</strong> ({recommendedEngineer.title} · 当前在办 {recommendedEngineer.currentWOCount}单)
                        </p>
                      )}
                    </div>
                  </div>
                  {recommendedEngineer && (
                    <button
                      type="button"
                      onClick={() => setSelectedEngineerId(recommendedEngineer.id)}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-2xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
                    >
                      选用推荐人
                    </button>
                  )}
                </div>

                {dispatchMode === 'internal' ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isPreDispatched ? '核对 / 调整拟定负责工程师' : '拟定 / 选择负责工程师'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAllEngineers(!showAllEngineers)}
                        className="text-2xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        {showAllEngineers
                          ? `仅显示本组工程师 (${matchedGroupEngineers.length}人)`
                          : `查看全科工程师 (${engineers.length}人)`}
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                      {displayEngineers.map(eng => {
                        const isSelected = selectedEngineerId === eng.id;
                        const isProposed = localOrder.proposedEngineerId === eng.id;
                        const isRecommended = recommendedEngineer?.id === eng.id;
                        return (
                          <div
                            key={eng.id}
                            onClick={() => setSelectedEngineerId(eng.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? isPreDispatched
                                  ? 'border-violet-600 bg-violet-50/70 shadow-xs ring-1 ring-violet-500'
                                  : 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                                  eng.avatarColor || 'bg-indigo-600'
                                }`}
                              >
                                {eng.name[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">{eng.name}</span>
                                  <span className="text-2xs text-slate-500 font-mono">({eng.employeeNo})</span>
                                  {isProposed && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-violet-100 text-violet-800 font-bold border border-violet-200">
                                      当前拟定
                                    </span>
                                  )}
                                  {isRecommended && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                      匹配推荐
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">· {eng.group.replace(/技术组|组/, '')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5">
                                  <span>
                                    平均到场: <strong className="font-mono">{eng.avgMttrHours}h</strong>
                                  </span>
                                  <span>
                                    满意度: <strong className="font-mono text-amber-600">{eng.avgSatisfactionScore}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  eng.status === 'idle' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {eng.status === 'idle' ? '空闲' : `${eng.currentWOCount}单在办`}
                              </span>
                              <input
                                type="radio"
                                name="assignedEngineer"
                                checked={isSelected}
                                onChange={() => setSelectedEngineerId(eng.id)}
                                className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-700" />
                        <span>外协原厂 / 第三方维保协同派工配置</span>
                      </div>
                      {recommendedVendor && (
                        <button
                          type="button"
                          onClick={() => applyVendorSelection(recommendedVendor)}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>智能匹配：{recommendedVendor.shortName}</span>
                        </button>
                      )}
                    </div>

                    {/* 1. 选择签约外协服务商或临时自定义 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-2xs font-bold text-slate-700">
                          指定外协维保机构 <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (!useCustomVendor) {
                              setUseCustomVendor(true);
                              setSelectedVendorId('CUSTOM');
                            } else {
                              applyVendorSelection(recommendedVendor || availableVendors[0]);
                            }
                          }}
                          className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer"
                        >
                          {useCustomVendor ? '返回签约服务商名录选择' : '+ 临时录入非名录厂商'}
                        </button>
                      </div>

                      {!useCustomVendor ? (
                        <select
                          value={selectedVendorId}
                          onChange={(e) => {
                            const found = availableVendors.find(v => v.id === e.target.value);
                            applyVendorSelection(found);
                          }}
                          className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        >
                          {availableVendors.map(v => (
                            <option key={v.id} value={v.id}>
                              [{v.typeLabel}] {v.name} ({v.contractNo})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={vendorName}
                          onChange={e => {
                            setVendorName(e.target.value);
                            setVendorShortName(e.target.value);
                          }}
                          placeholder="请输入原厂或第三方维修机构完整名称"
                          className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      )}

                      {/* 联系人 / 电话 / 合同号 */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">外协技术联系人</label>
                          <input
                            type="text"
                            value={vendorContact}
                            onChange={e => setVendorContact(e.target.value)}
                            placeholder="如：张伟/区域主管"
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">
                            售后专线/手机 <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={vendorPhone}
                            onChange={e => setVendorPhone(e.target.value)}
                            placeholder="400热线或工程师手机"
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">框架合同/维保单号</label>
                          <input
                            type="text"
                            value={vendorContractNo}
                            onChange={e => setVendorContractNo(e.target.value)}
                            placeholder="如：MR-HOSP-2026"
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. 外协结算/服务方式（决定是否走报价与多科室议价流转） */}
                    <div className="space-y-1">
                      <label className="block text-2xs font-bold text-slate-700">外协维保模式与结算路径</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(OUTSOURCE_SERVICE_MODE_LABELS) as OutsourceServiceMode[]).map(modeKey => {
                          const info = OUTSOURCE_SERVICE_MODE_LABELS[modeKey];
                          const active = outsourceServiceMode === modeKey;
                          return (
                        <button
                          key={modeKey}
                          type="button"
                          onClick={() => {
                            setOutsourceServiceMode(modeKey);
                            setHasCost(OUTSOURCE_SERVICE_MODE_LABELS[modeKey].requiresQuote);
                          }}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                            active
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="text-[11px] font-bold flex items-center justify-between gap-1">
                            <span className="truncate">{info.shortLabel}</span>
                            <span className={`text-[10px] px-1 rounded ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {info.requiresQuote ? '需报价议价' : '直接进场'}
                            </span>
                          </div>
                          <div className={`text-[10px] mt-0.5 line-clamp-1 ${active ? 'text-amber-100' : 'text-slate-500'}`}>
                            {info.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. 转外协原因 & 预估预算 & 院内监护医工 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-700">转外协原因说明</label>
                      <select
                        value=""
                        onChange={e => {
                          if (e.target.value) setOutsourceReason(e.target.value);
                        }}
                        className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-600"
                      >
                        <option value="">常用原因快选...</option>
                        {OUTSOURCE_REASON_PRESETS.map((r, i) => (
                          <option key={i} value={r}>{r.slice(0, 18)}...</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={outsourceReason}
                      onChange={e => setOutsourceReason(e.target.value)}
                      placeholder="说明为何转外协（如原厂授权软件锁/全保协议涵盖等）"
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      {OUTSOURCE_SERVICE_MODE_LABELS[outsourceServiceMode].requiresQuote ? '预估预算 (元)' : '合同覆盖 (¥0)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!OUTSOURCE_SERVICE_MODE_LABELS[outsourceServiceMode].requiresQuote}
                      value={OUTSOURCE_SERVICE_MODE_LABELS[outsourceServiceMode].requiresQuote ? estimatedOutsourceCost : '0'}
                      onChange={e => {
                        setEstimatedOutsourceCost(e.target.value);
                        setEstimatedCostInput(e.target.value);
                        if (Number(e.target.value || 0) > 0) setHasCost(true);
                      }}
                      placeholder="如 15000"
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md font-mono tabular-nums disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* 4. 院内监护/陪同对接工程师 + 同步外协门户开关 */}
                <div className="pt-1.5 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-7">
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      院内监护对接工程师（负责机房准入与质控复核）
                    </label>
                    <select
                      value={selectedEngineerId}
                      onChange={e => setSelectedEngineerId(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-800"
                    >
                      {engineers.map(eng => (
                        <option key={eng.id} value={eng.id}>
                          {eng.name} ({eng.group.replace(/技术组|组/, '')} · {eng.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-5 pt-3 sm:pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-amber-900 bg-white px-2 py-1.5 rounded-md border border-amber-200">
                      <input
                        type="checkbox"
                        checked={syncToVendorPortal}
                        onChange={e => setSyncToVendorPortal(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>自动推送至【外协协同中心】</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 费用产生判定与设备项目台账合规联动 */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <span>是否有费用产生 · 审计合规与自动立项判定</span>
                </div>
                <div className="flex items-center p-0.5 bg-slate-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setHasCost(false)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      !hasCost ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    无费用产生（纯人工/保内）
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasCost(true)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      hasCost ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    有费用产生（自动立项台账）
                  </button>
                </div>
              </div>

              {hasCost ? (
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        预估支出金额（元） <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={dispatchMode === 'vendor' ? (estimatedOutsourceCost || estimatedCostInput) : estimatedCostInput}
                        onChange={e => {
                          setEstimatedCostInput(e.target.value);
                          if (dispatchMode === 'vendor') setEstimatedOutsourceCost(e.target.value);
                        }}
                        placeholder="输入预估总额，自动匹配比价/议价/招标"
                        className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-md font-mono tabular-nums font-semibold text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-7 flex flex-wrap gap-1.5">
                      {[
                        { label: '¥2,500 (5千内比价)', val: '2500' },
                        { label: '¥15,000 (5千-5万议价)', val: '15000' },
                        { label: '¥68,000 (5万以上招标)', val: '68000' }
                      ].map(p => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => {
                            setEstimatedCostInput(p.val);
                            if (dispatchMode === 'vendor') setEstimatedOutsourceCost(p.val);
                          }}
                          className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded-md font-mono tabular-nums cursor-pointer whitespace-nowrap"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-white border border-slate-200 flex items-start gap-2 text-[11px] text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">
                        合规阶梯判定：{PROCUREMENT_MODE_META[effectiveComplianceMode].label}
                      </div>
                      <div className="text-slate-600">
                        派工后将在《设备项目台账》自动生成关联项目，必须完成「电子审批或纸质申请扫描件 + {PROCUREMENT_MODE_META[effectiveComplianceMode].shortLabel} + 会议纪要」三项审计校验，否则禁止预批与归档。
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  当前标记为「无费用产生」（若现场排查后领用有价备件或转付费外协，系统仍将自动建项至设备项目台账并触发补办流程）。
                </div>
              )}
            </div>

            {/* Dispatch Notes */}
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-0.5">
                    {dispatchMode === 'vendor' ? '外协协同指令 / 院内陪同与安全交底要求' : '调度派工指令 / 现场排查备忘录'}
                  </label>
                  <textarea
                    value={dispatchNotes}
                    onChange={e => setDispatchNotes(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-2 bg-slate-50/60 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder={
                      dispatchMode === 'vendor'
                        ? '输入给外协服务商及院内监护工程师的协同指令，如：需先于医工科备案进场证、更换旧件须交回、完工需测漏电流...'
                        : '输入给工程师的调度指令，如携带备用音频线、万用表、优先保障门诊...'
                    }
                  />
                </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Actions: 明确区分【暂存预派工】与【确认正式下发派工】 */}
            <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 shrink-0">
              <div className="text-2xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  {!canDispatch
                    ? '当前处于技术讨论只读视角，正式派工需由医工主管/调度员确认签发'
                    : dispatchMode === 'vendor'
                    ? '外协派工将联动【外协协同中心】与供应商门户，并由院内监护医工负责质控闭环'
                    : isPreDispatched
                    ? '当前处于预派工暂存态，尚未启动SLA计时；内部确认无误后可点击右侧正式下发'
                    : '建议先「暂存预派工」并在左侧完成内部讨论核实，再正式下发启动SLA计时'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  关闭
                </button>

                {canDispatch && (
                  <>
                    <button
                      type="button"
                      disabled={!selectedEngineer || isPreSaving}
                      onClick={handlePreDispatchStage}
                      className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-300 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="将拟定方案暂存为预派工状态，留在系统内供团队讨论确认，暂不触发正式派工"
                    >
                      <Save className="w-3.5 h-3.5 text-violet-700" />
                      <span>
                        {isPreSaving
                          ? '正在暂存...'
                          : dispatchMode === 'vendor'
                          ? '暂存外协预审方案'
                          : isPreDispatched
                          ? '更新拟定工程师 / 暂存'
                          : '暂存预派工 (拟定工程师)'}
                      </span>
                    </button>

                    <button
                      type="submit"
                      disabled={!selectedEngineer || isSubmitting || (dispatchMode === 'vendor' && (!vendorName.trim() || !vendorPhone.trim()))}
                      className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 ${
                        dispatchMode === 'vendor'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {isSubmitting
                          ? '正在正式下发...'
                          : dispatchMode === 'vendor'
                          ? '确认外协派工 · 同步协同单'
                          : isPreDispatched
                          ? '确认无误 · 正式下发派工'
                          : '直接正式派工并启动SLA'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

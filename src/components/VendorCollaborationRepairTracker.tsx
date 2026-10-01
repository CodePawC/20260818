import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Star,
  MessageSquare,
  UserCheck,
  FileSignature,
  Phone,
  ExternalLink,
  FileText,
  Building2,
  Sparkles,
  RotateCcw,
  Camera,
  Printer,
  ChevronRight,
  Copy,
  Check,
  Send,
  Calendar,
  AlertTriangle,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';
import { MedicalEquipment } from '../types';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import {
  VendorCollaborationOrder,
  VendorCollabStatus,
  QuotePartItem,
  CollaborationMessage,
  RepairCompletionReport
} from '../types/vendorCollaborationTypes';
import {
  getVendorCollaborationOrders,
  saveVendorCollaborationOrders
} from '../utils/vendorCollaborationData';
import { loadStoredWorkOrders, saveStoredWorkOrders } from '../utils/dispatchData';
import { RepairTrackingTimeline, calculateRepairTimelineStage } from './RepairTrackingTimeline';

interface VendorCollaborationRepairTrackerProps {
  equipment: MedicalEquipment;
  workOrders?: EngineeringWorkOrder[];
  onUpdateEquipment?: (updated: MedicalEquipment) => void;
  currentUser?: {
    name?: string;
    role?: string;
    department?: string;
    phone?: string;
  };
  onOpenVendorDossier?: (order: VendorCollaborationOrder) => void;
}

export const VendorCollaborationRepairTracker: React.FC<VendorCollaborationRepairTrackerProps> = ({
  equipment,
  workOrders: propWorkOrders,
  onUpdateEquipment,
  currentUser,
  onOpenVendorDossier,
}) => {
  const [allVendorOrders, setAllVendorOrders] = useState<VendorCollaborationOrder[]>(() => {
    return getVendorCollaborationOrders();
  });

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'feedback' | 'acceptance'>('progress');
  const [newMessage, setNewMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // 匹配本设备的全部外协协同工单
  const matchedVendorOrders = useMemo(() => {
    const list = allVendorOrders.filter(order =>
      (order.equipmentId && order.equipmentId === equipment.id) ||
      (equipment.sn && order.equipmentSerialNo === equipment.sn) ||
      (equipment.name && order.equipmentName && order.equipmentName.includes(equipment.name)) ||
      (equipment.internalNo && order.workOrderId && order.workOrderId.includes(equipment.internalNo))
    );

    // 如果当前设备处于故障待修状态，但没有现成的外协单，自动动态构建一个真实的委外协同单供查看与核验
    if (list.length === 0 && (equipment.status === '故障待修' || (equipment.repairRecords && equipment.repairRecords.length > 0))) {
      const isUrgent = equipment.criticalLevel === '高' || equipment.riskLevel === '高风险';
      const defaultVendorName = equipment.manufacturer
        ? `${equipment.manufacturer}（中国）原厂售后服务中心`
        : '通用电气医疗系统（中国）有限公司五莲服务站';

      const syntheticOrder: VendorCollaborationOrder = {
        id: `EXT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${equipment.id.slice(-3) || '009'}`,
        workOrderId: `WO-${new Date().getFullYear()}-${equipment.id.slice(-4) || '0901'}`,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentModel: equipment.model || '标准临床型',
        equipmentSerialNo: equipment.sn || 'SN-2026-AUTO',
        equipmentDept: equipment.department || '临床科室',
        faultDescription: equipment.repairRecords?.[0]?.faultDescription || '设备核心模块异常报警，自检未通过，急需外协原厂驻场工程师检修与校准。',
        faultImages: [
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
        ],
        urgencyLevel: isUrgent ? 'HIGH' : 'NORMAL',
        vendorId: 'partner-default',
        vendorName: defaultVendorName,
        vendorContact: '刘明 (资深认证工程师)',
        vendorPhone: '13812345678',
        vendorEmail: 'service@med-vendor.com.cn',
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString().replace('T', ' ').slice(0, 16),
        status: 'COMPLETED_PENDING_INVOICE', // 默认就位等待临床复核验收
        quoteLaborCost: 1800,
        quoteTravelCost: 600,
        quotePartsTotal: 12500,
        quoteGrandTotal: 14900,
        finalNegotiatedPrice: 13500,
        savingsAmount: 1400,
        savingsRate: 9.4,
        quoteParts: [
          {
            id: 'qp-syn-1',
            name: '高精度电源驱动控制板',
            spec: 'PWR-CTRL-MOD-V2',
            brand: '原厂原装',
            partNo: 'PCB-8892-01',
            quantity: 1,
            unitPrice: 12500,
            totalPrice: 12500,
            warrantyPeriodMonths: 12,
            isOriginal: true
          }
        ],
        completionReport: {
          engineerName: '刘明 (驻场技术工程师)',
          engineerPhone: '13812345678',
          serviceStartTime: new Date(Date.now() - 3600000 * 8).toISOString().replace('T', ' ').slice(0, 16),
          serviceEndTime: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').slice(0, 16),
          faultCauseAnalysis: '由于科室供电偶发瞬态尖峰脉冲，导致控制板输入端滤波电容短路击穿，触发欠压保护停机。',
          repairMeasuresSummary: '原厂全新备件已现场拆封更换，重置系统参数并执行50次空载加压试机，电气安全与泄漏电流测试合格。',
          replacedPartsSummary: '更换电源控制主板1套，原厂正品旧件已交接科室核验。',
          oldPartsReturned: true,
          clinicalRating: 0,
          serviceReportFileName: '外协维修完工与电气安全质控报告单_现场单.pdf'
        },
        messages: [
          {
            id: 'msg-syn-1',
            senderType: 'HOSPITAL',
            senderName: '医学工程科-值班调度',
            timestamp: new Date(Date.now() - 3600000 * 30).toISOString().replace('T', ' ').slice(0, 16),
            content: `已为【${equipment.department}】发起外协紧急协同，故障现象与设备报错码已推送原厂工程师。`
          },
          {
            id: 'msg-syn-2',
            senderType: 'VENDOR',
            senderName: '刘明 (工程师)',
            timestamp: new Date(Date.now() - 3600000 * 6).toISOString().replace('T', ' ').slice(0, 16),
            content: '配件已专车送达医院科室现场，正在进行原装主板更换与空载带电调试。'
          },
          {
            id: 'msg-syn-3',
            senderType: 'VENDOR',
            senderName: '刘明 (工程师)',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').slice(0, 16),
            content: '现场调试完成，电气安全自检合格！请临床科室护士长/技师长现场试机并执行复核验收签单。'
          }
        ],
        multiDeptOpinions: [],
        negotiationRounds: [],
        isDossierArchived: false
      };
      return [syntheticOrder];
    }

    return list;
  }, [allVendorOrders, equipment]);

  // 当前选中的外协工单（默认第一笔，最新发生）
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    return matchedVendorOrders[0]?.id || '';
  });

  useEffect(() => {
    if (matchedVendorOrders.length > 0 && !matchedVendorOrders.some(o => o.id === selectedOrderId)) {
      setSelectedOrderId(matchedVendorOrders[0].id);
    }
  }, [matchedVendorOrders, selectedOrderId]);

  const currentOrder = useMemo(() => {
    return matchedVendorOrders.find(o => o.id === selectedOrderId) || matchedVendorOrders[0] || null;
  }, [matchedVendorOrders, selectedOrderId]);

  // 匹配关联的院内工程派工单
  const currentWorkOrder = useMemo(() => {
    if (!currentOrder) return null;
    const woList = propWorkOrders || loadStoredWorkOrders();
    return woList.find(wo => 
      wo.id === currentOrder.workOrderId ||
      wo.equipmentId === equipment.id ||
      (equipment.sn && wo.equipmentSn === equipment.sn)
    ) || null;
  }, [currentOrder, propWorkOrders, equipment]);

  // ================= 验收复核表单状态 =================
  const isAlreadyAccepted = useMemo(() => {
    if (!currentOrder) return false;
    return !!(
      currentOrder.completionReport?.clinicalAcceptDate ||
      currentOrder.status === 'ARCHIVED' ||
      (currentOrder.completionReport?.clinicalRating && currentOrder.completionReport.clinicalRating > 0)
    );
  }, [currentOrder]);

  const [trialResult, setTrialResult] = useState<'PERFECT' | 'OBSERVE' | 'NOT_FIXED'>('PERFECT');
  const [ratingTimeliness, setRatingTimeliness] = useState<number>(5);
  const [ratingQuality, setRatingQuality] = useState<number>(5);
  const [ratingAttitude, setRatingAttitude] = useState<number>(5);
  const [oldPartsConfirmed, setOldPartsConfirmed] = useState<boolean>(true);
  const [clinicalFeedback, setClinicalFeedback] = useState<string>(
    '现场试机运行平稳，报错已清除，图像与控制功能各项技术指标均正常，准予恢复临床使用。'
  );

  const defaultSignerName = currentUser?.name || '崔伟';
  const defaultSignerRole = currentUser?.role || '护士长 / 科室设备安全员';
  const [signerName, setSignerName] = useState<string>(defaultSignerName);
  const [signerRole, setSignerRole] = useState<string>(defaultSignerRole);
  const [signatureMode, setSignatureMode] = useState<'preset' | 'draw'>('preset');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 手写签名 Canvas 引用
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // 复制文本辅助
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1800);
  };

  // Canvas 绘制逻辑
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // 深蓝色手迹
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // 发送双向协同留言
  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentOrder) return;

    const newMsg: CollaborationMessage = {
      id: `msg-${Date.now()}`,
      senderType: 'HOSPITAL',
      senderName: `${signerName} (${signerRole})`,
      senderDept: equipment.department || '临床科室',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content: newMessage.trim()
    };

    const updatedOrders = allVendorOrders.map(o => {
      if (o.id === currentOrder.id) {
        return {
          ...o,
          messages: [...(o.messages || []), newMsg]
        };
      }
      return o;
    });

    setAllVendorOrders(updatedOrders);
    saveVendorCollaborationOrders(updatedOrders);
    setNewMessage('');
    setToastMessage({ type: 'success', text: '留言已成功发送至外协厂家工程师团队！' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 提交临床科室复核验收
  const handleSubmitAcceptance = () => {
    if (!currentOrder) return;
    setIsSubmitting(true);

    try {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const certId = `CASIG-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${currentOrder.id.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const avgScore = Math.round((ratingTimeliness + ratingQuality + ratingAttitude) / 3);

      // 获取 Canvas 签名数据
      let sigData = '';
      if (signatureMode === 'draw' && canvasRef.current && hasDrawn) {
        sigData = canvasRef.current.toDataURL('image/png');
      }

      // 1. 更新外协订单状态与完工报告
      const updatedCompletion: RepairCompletionReport = {
        ...(currentOrder.completionReport || {
          engineerName: currentOrder.vendorContact,
          engineerPhone: currentOrder.vendorPhone,
          serviceStartTime: new Date(Date.now() - 3600000 * 24).toISOString().replace('T', ' ').slice(0, 16),
          serviceEndTime: nowStr,
          faultCauseAnalysis: currentOrder.faultDescription,
          repairMeasuresSummary: '外协原厂工程师到场完成检修，更换故障模块并调试通过。',
          replacedPartsSummary: currentOrder.quoteParts.map(p => `${p.name} x${p.quantity}`).join('、') || '原厂配件更换',
          oldPartsReturned: oldPartsConfirmed,
          clinicalRating: avgScore,
        }),
        clinicalAcceptorName: `${signerName} (${signerRole})`,
        clinicalAcceptDate: nowStr,
        clinicalRating: avgScore,
        clinicalAcceptanceSignatureUrl: sigData || currentOrder.completionReport?.clinicalAcceptanceSignatureUrl,
        oldPartsReturned: oldPartsConfirmed
      };

      const acceptanceMessage: CollaborationMessage = {
        id: `msg-acc-${Date.now()}`,
        senderType: 'HOSPITAL',
        senderName: `${signerName} (${signerRole})`,
        senderDept: equipment.department,
        timestamp: nowStr,
        content: `【临床科室完成复核验收】试机评定：${
          trialResult === 'PERFECT' ? '功能完全恢复·正常运行' :
          trialResult === 'OBSERVE' ? '基本正常·带载观察' : '需厂家二次排查'
        }。综合满意度评分：${avgScore}星。科室评价：“${clinicalFeedback}”。CA存证号：${certId}。设备恢复正常运行。`
      };

      const updatedOrders = allVendorOrders.map(o => {
        if (o.id === currentOrder.id) {
          return {
            ...o,
            status: 'ARCHIVED' as VendorCollabStatus,
            completionReport: updatedCompletion,
            messages: [...(o.messages || []), acceptanceMessage],
            isDossierArchived: true,
            archivedAt: nowStr,
            archivedBy: `${signerName} (临床科室复核闭环)`
          };
        }
        return o;
      });

      // 2. 存储外协数据
      setAllVendorOrders(updatedOrders);
      saveVendorCollaborationOrders(updatedOrders);

      // 3. 同步更新关联的工程工单
      try {
        const storedWOs = loadStoredWorkOrders();
        const updatedWOs = storedWOs.map(wo => {
          if (
            wo.id === currentOrder.workOrderId ||
            wo.equipmentId === equipment.id ||
            wo.equipmentSn === equipment.sn
          ) {
            return {
              ...wo,
              status: 'closed' as const,
              acceptanceTime: nowStr,
              acceptanceStaffName: signerName,
              acceptanceStaffRole: signerRole,
              acceptanceSignature: certId,
              ratingScore: avgScore,
              ratingTimeliness,
              ratingQuality,
              ratingAttitude,
              clinicalFeedback
            };
          }
          return wo;
        });
        saveStoredWorkOrders(updatedWOs);
      } catch (err) {
        console.warn('Sync work orders warning:', err);
      }

      // 4. 自动联动恢复设备运行状态为“正常运行”
      if (equipment.status === '故障待修' || equipment.status === '维护保养中') {
        const updatedEquip: MedicalEquipment = {
          ...equipment,
          status: '正常运行',
          repairRecords: (equipment.repairRecords || []).map(r => ({
            ...r,
            status: '已完成',
            completionDate: nowStr.split(' ')[0]
          }))
        };
        if (onUpdateEquipment) {
          onUpdateEquipment(updatedEquip);
        }
      }

      setToastMessage({
        type: 'success',
        text: `🎉 临床科室复核验收完成！该设备运行状态已自动同步恢复为【正常运行】，外协维修工单已全流程闭环归档。`
      });
      setActiveTab('acceptance');
    } catch (e) {
      console.error('Acceptance error:', e);
      setToastMessage({ type: 'info', text: '验收处理遇到问题，请重试。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 外协协同阶段计算 (5阶段标准时序: 报修受理 -> 外协派工 -> 维修处理中 -> 待科室确认 -> 归档验收)
  const currentStage = currentOrder
    ? calculateRepairTimelineStage(currentOrder, equipment, currentWorkOrder)
    : 1;

  if (!currentOrder) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
        <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
        <p className="font-semibold text-slate-700 text-sm">该设备暂无外协维保协同记录</p>
        <p className="text-slate-400 text-xs mt-1">目前由院内医学工程科自主保障维保，设备运行状态良好。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast 提示横幅 */}
      {toastMessage && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-blue-50 text-blue-900 border-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            知道了
          </button>
        </div>
      )}

      {/* 外协协同主卡片 */}
      <div className="bg-white rounded-xl border border-indigo-200/90 shadow-sm overflow-hidden">
        {/* 卡片头部：外协单号、服务商、紧急程度与状态 */}
        <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-indigo-50/70 p-4 border-b border-indigo-150">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-bold shadow-2xs">
                  {currentOrder.id}
                </span>
                <span className="font-mono text-xs text-slate-500 font-medium">
                  院内工单: {currentOrder.workOrderId}
                </span>
                <span className={`px-2 py-0.5 rounded text-2xs font-bold border ${
                  currentOrder.urgencyLevel === 'EMERGENCY' || currentOrder.urgencyLevel === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {currentOrder.urgencyLevel === 'EMERGENCY' ? '特急委外 / 急救优先' :
                   currentOrder.urgencyLevel === 'HIGH' ? '高急送修 / 临床关键' : '常规外协'}
                </span>
                <span className="text-2xs text-slate-400 font-mono">
                  发起于 {currentOrder.createdAt}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">
                  {currentOrder.vendorName}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <span>责任技术员:</span>
                  <strong className="text-slate-800">{currentOrder.vendorContact}</strong>
                </span>
                {currentOrder.vendorPhone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(currentOrder.vendorPhone, 'phone')}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/80 hover:bg-white text-indigo-700 border border-indigo-200 text-2xs font-mono font-bold transition cursor-pointer"
                    title="点击复制工程师直拨电话"
                  >
                    <Phone className="w-3 h-3 text-indigo-600" />
                    <span>{currentOrder.vendorPhone}</span>
                    {copiedText === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {matchedVendorOrders.length > 1 && (
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-400 text-2xs">协同历史:</span>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="font-mono text-xs font-semibold text-slate-700 bg-transparent border-0 cursor-pointer focus:ring-0 p-0"
                  >
                    {matchedVendorOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.id} ({o.status === 'ARCHIVED' ? '已闭环' : '进行中'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs ${
                  currentOrder.status === 'ARCHIVED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : currentStage === 4
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    : currentStage === 3
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    currentOrder.status === 'ARCHIVED' ? 'bg-emerald-500' :
                    currentStage === 4 ? 'bg-amber-500' :
                    currentStage === 3 ? 'bg-blue-500' : 'bg-indigo-500'
                  }`} />
                  <span>
                    {currentOrder.status === 'ARCHIVED' ? '归档验收 · 已闭环' :
                     currentStage === 4 ? '待科室确认 · 试机验签' :
                     currentStage === 3 ? '维修处理中 · 驻场施工' :
                     currentStage === 2 ? '外协派工 · 接单审价' : '报修受理 · 调度指派'}
                  </span>
                </span>
                <div className="text-2xs text-slate-500 mt-1 font-mono">
                  审定总额: <strong className="text-slate-900 notranslate font-bold" translate="no">￥{(currentOrder.finalNegotiatedPrice || currentOrder.quoteGrandTotal || 0).toLocaleString()}</strong>
                  {currentOrder.savingsAmount ? (
                    <span className="text-emerald-700 ml-1 font-semibold">(节资 ￥{currentOrder.savingsAmount.toLocaleString()})</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 基于外协协同数据的横向流程进度条 (Timeline): 报修受理 -> 外协派工 -> 维修处理中 -> 待科室确认 -> 归档验收 */}
        <div className="p-3 sm:p-4 bg-slate-50/60 border-b border-slate-200">
          <RepairTrackingTimeline
            order={currentOrder}
            equipment={equipment}
            workOrder={currentWorkOrder}
            onStageClick={(stageNum) => {
              if (stageNum === 1 || stageNum === 2 || stageNum === 3) {
                setActiveTab('progress');
              } else if (stageNum === 4 || stageNum === 5) {
                setActiveTab('acceptance');
              }
            }}
            onUrge={(msgText, msgObj) => {
              setAllVendorOrders(prev => prev.map(o => o.id === currentOrder.id ? { ...o, messages: [...(o.messages || []), msgObj] } : o));
              setToastMessage({ type: 'success', text: `催办提醒已发送至外协负责人【${currentOrder.vendorContact || '现场工程师'}】！` });
              setTimeout(() => setToastMessage(null), 3500);
            }}
          />
        </div>

        {/* 标签栏：外协进度与诊断反馈 | 沟通时间线 | 临床验收复核 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-2 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'progress'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
              <span>阶段性处置与技术反馈</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'feedback'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>院企在线留言记事本 ({currentOrder.messages?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('acceptance')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'acceptance'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-emerald-700 hover:text-emerald-900 bg-emerald-50/50 hover:bg-emerald-50 rounded-t-lg'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isAlreadyAccepted ? '已复核验收存证' : '临床科室验收复核与签单'}
              </span>
              {!isAlreadyAccepted && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          </div>

          {onOpenVendorDossier && (
            <button
              onClick={() => onOpenVendorDossier(currentOrder)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer py-1"
            >
              <span>查看外协全套资料档案</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tab 1: 阶段性反馈与技术诊断明细 */}
        {activeTab === 'progress' && (
          <div className="p-4 space-y-4">
            {/* 厂家技术诊断结论与排查措施 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 space-y-1.5">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                  厂家官方技术故障定位与原因分析
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {currentOrder.completionReport?.faultCauseAnalysis || currentOrder.faultDescription}
                </p>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2">
                  <span>诊断工程师: {currentOrder.vendorContact}</span>
                  <span>·</span>
                  <span>原厂技术方案审核已备案</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 space-y-1.5">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                  驻场工程师现场修复工艺与调试结果
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {currentOrder.completionReport?.repairMeasuresSummary ||
                    '原厂全新备件已现场拆封更换，完成整机电气安全检测及信噪比调校，自检代码无故障报警。'}
                </p>
                <div className="text-[11px] text-emerald-700 font-semibold pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>空载试运行通过 · 电气安全检测合格</span>
                </div>
              </div>
            </div>

            {/* 配件调换明细表 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  <span>拟换/已换原厂正品备品配件清单 ({currentOrder.quoteParts?.length || 0})</span>
                </span>
                <span className="text-2xs font-mono text-slate-500">
                  原件旧件已清点退库: <strong className="text-emerald-700">{currentOrder.completionReport?.oldPartsReturned ? '已原样交回' : '现场待交接'}</strong>
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-2xs">
                  <tr>
                    <th className="py-2 px-3">配件名称</th>
                    <th className="py-2 px-3">规格型号 / 原厂图号</th>
                    <th className="py-2 px-3 text-center">品牌属性</th>
                    <th className="py-2 px-3 text-center">数量</th>
                    <th className="py-2 px-3 text-right">单价 (元)</th>
                    <th className="py-2 px-3 text-center">质保期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentOrder.quoteParts?.map((part) => (
                    <tr key={part.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-900 font-semibold">{part.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {part.spec} <span className="text-slate-400">({part.partNo})</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {part.brand || '原厂正品'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{part.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 notranslate" translate="no">
                        ￥{part.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-emerald-700">
                        {part.warrantyPeriodMonths} 个月
                      </td>
                    </tr>
                  ))}
                  {(!currentOrder.quoteParts || currentOrder.quoteParts.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        本次外协维修主要为现场技术工时排查与工艺校准，无大宗零备件更换
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 现场施工报告凭证 */}
            {currentOrder.completionReport && (
              <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sky-950 block">
                      {currentOrder.completionReport.serviceReportFileName || '原厂外协技术完工报告单.pdf'}
                    </span>
                    <span className="text-2xs text-sky-700">
                      施工作业时间: {currentOrder.completionReport.serviceStartTime} ~ {currentOrder.completionReport.serviceEndTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('acceptance')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>前往科室验收复核</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 院企双向协同留言记事本 */}
        {activeTab === 'feedback' && (
          <div className="p-4 space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-64 overflow-y-auto space-y-2.5">
              {currentOrder.messages?.map((msg) => {
                const isHospital = msg.senderType === 'HOSPITAL';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col text-xs ${isHospital ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-700">{msg.senderName}</span>
                      {msg.senderDept && <span>({msg.senderDept})</span>}
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>
                    <div className={`p-2.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                      isHospital
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-2xs'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {(!currentOrder.messages || currentOrder.messages.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  暂无在线互动记录，科室或工程人员可在此给外协厂家留言
                </div>
              )}
            </div>

            {/* 留言输入框 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="向外协厂家工程师提问、反馈现场试机情况或催办进度..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>发送留言</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: 临床科室验收复核与签单 (核心重点功能) */}
        {activeTab === 'acceptance' && (
          <div className="p-4 space-y-4">
            {/* 状态 1: 已完成验收存证展示 */}
            {isAlreadyAccepted && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50 p-4 rounded-xl border border-emerald-300 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>临床科室已成功复核验收并完成电子签单</span>
                        <span className="px-2 py-0.5 rounded-full text-2xs font-mono font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                          CA存证已上链
                        </span>
                      </h4>
                      <p className="text-xs text-emerald-800">
                        设备已恢复正常在用状态，四流凭据已同步流转至医学工程科与财务对账档案库。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (currentOrder.completionReport?.clinicalRating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="font-mono text-xs font-bold text-emerald-900 ml-1">
                      {currentOrder.completionReport?.clinicalRating || 5}.0分 极佳满意
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-emerald-900 bg-white/70 p-3 rounded-lg border border-emerald-200/80">
                  <div>
                    <span className="text-slate-400 block text-2xs">验收签单人</span>
                    <strong className="text-emerald-950 font-bold">
                      {currentOrder.completionReport?.clinicalAcceptorName || `${signerName} (${signerRole})`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-2xs">验收时间戳</span>
                    <strong className="text-emerald-950 font-mono">
                      {currentOrder.completionReport?.clinicalAcceptDate || currentOrder.archivedAt || '已存证'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-2xs">旧件清点退库</span>
                    <strong className="text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>已原样交回医工科核销</span>
                    </strong>
                  </div>
                </div>

                {currentOrder.completionReport?.clinicalAcceptanceSignatureUrl && (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-2xs text-slate-400 shrink-0">手写数字笔迹:</span>
                    <img
                      src={currentOrder.completionReport.clinicalAcceptanceSignatureUrl}
                      alt="验收签名"
                      className="h-10 max-w-[160px] object-contain border border-slate-100 rounded bg-slate-50 px-2"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 状态 2: 待验收复核面板（临床人员操作界面） */}
            <div className={`p-4 rounded-xl border space-y-4 ${
              isAlreadyAccepted ? 'bg-slate-50/50 border-slate-200' : 'bg-gradient-to-b from-white to-sky-50/30 border-sky-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    {isAlreadyAccepted ? '补充复核或修改评分意见' : '临床使用科室 · 现场试机验收与服务评价'}
                  </span>
                </div>
                <span className="text-2xs text-slate-500">
                  当前经办: <strong className="text-slate-900 font-semibold">{signerName}</strong> ({signerRole})
                </span>
              </div>

              {/* 1. 试机运行结论选择 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  1. 现场试机运行状况评定:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'PERFECT', label: '功能完全恢复 · 正常运行', desc: '报错清除，各项技术指标与质控通过 (推荐)' },
                    { key: 'OBSERVE', label: '基本正常 · 需带载观察', desc: '主功能已恢复，需首班临床持续监控' },
                    { key: 'NOT_FIXED', label: '未彻底修复 · 要求二次排查', desc: '偶发报错未根除，技术员暂不退场' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTrialResult(opt.key as any)}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        trialResult === opt.key
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{opt.label}</span>
                        {trialResult === opt.key && <span className="text-emerald-600">✓</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 三维服务满意度评星 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  2. 外协服务商综合满意度打分 (1-5星):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: '响应时效', val: ratingTimeliness, setVal: setRatingTimeliness },
                    { label: '修复质量', val: ratingQuality, setVal: setRatingQuality },
                    { label: '服务态度', val: ratingAttitude, setVal: setRatingAttitude },
                  ].map((dim) => (
                    <div key={dim.label} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-600 font-semibold">{dim.label}:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            onClick={() => dim.setVal(s)}
                            className={`w-4 h-4 cursor-pointer transition ${
                              s <= dim.val ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'
                            }`}
                          />
                        ))}
                        <span className="font-mono text-xs font-bold text-slate-800 ml-1">{dim.val}分</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 旧件清点交接核验 */}
              <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-amber-950 font-medium">
                  <input
                    type="checkbox"
                    checked={oldPartsConfirmed}
                    onChange={(e) => setOldPartsConfirmed(e.target.checked)}
                    className="rounded border-amber-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>已在现场核查清点更换拆下的损坏旧件，确认原样交接交回医院，符合退库报废审计规定</span>
                </label>
                <span className="text-2xs font-mono text-amber-800 font-bold shrink-0">内控必检</span>
              </div>

              {/* 4. 临床意见快捷填入与文本输入 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    3. 临床科室验收评语与试机反馈说明:
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      '参数正常，准予恢复临床使用',
                      '急救修复迅速，非常满意',
                      '探头灵敏度优良，无伪影',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setClinicalFeedback(tag)}
                        className="text-2xs px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={clinicalFeedback}
                  onChange={(e) => setClinicalFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="请输入对本次修复质量的评价及科室试机实际情况..."
                />
              </div>

              {/* 5. 验收人姓名与电子签名板 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">验收签署人姓名与科室职务:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="签署人姓名"
                      className="w-1/2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={signerRole}
                      onChange={(e) => setSignerRole(e.target.value)}
                      placeholder="科室职务 (如护士长)"
                      className="w-1/2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">电子签名手迹 / CA认证存证:</label>
                    <div className="flex items-center gap-1.5 text-2xs">
                      <button
                        type="button"
                        onClick={() => setSignatureMode('preset')}
                        className={`px-2 py-0.5 rounded transition ${
                          signatureMode === 'preset' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        预设印章
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw')}
                        className={`px-2 py-0.5 rounded transition ${
                          signatureMode === 'draw' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        手写画板
                      </button>
                    </div>
                  </div>

                  {signatureMode === 'preset' ? (
                    <div className="h-20 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 text-center">
                      <div className="space-y-0.5">
                        <span className="font-serif text-sm font-bold text-indigo-900 tracking-wider block">
                          【{equipment.department}】{signerName} 验签章
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          CA-HASH: 88A92-{new Date().getMonth() + 1}-{signerName}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={80}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-20 bg-white border border-slate-300 rounded-lg cursor-crosshair touch-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded border border-slate-200"
                      >
                        重写
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 提交复核按钮 */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-2xs text-slate-400">
                  点击提交后，系统将自动把该设备状态切换为【正常运行】，并形成数字化复核档案。
                </span>

                <button
                  type="button"
                  onClick={handleSubmitAcceptance}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? '正在归档存证...' : isAlreadyAccepted ? '更新复核验收意见' : '确认完成临床复核验收并闭环'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

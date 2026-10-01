import React, { useState } from 'react';
import {
  EngineeringWorkOrder,
  WorkOrderStatus,
  FaultCategory,
  WorkOrderPart
} from '../types/dispatchTypes';
import {
  X,
  Wrench,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
  Building2,
  Send,
  PauseCircle,
  PlayCircle,
  Package,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { IssueSparePartModal } from './IssueSparePartModal';
import { SparePartItem } from '../types/sparePartsTypes';
import {
  loadStoredSpareParts,
  loadStoredStockTransactions,
  issueSparePartForWorkOrder,
  returnSparePartForWorkOrder
} from '../utils/sparePartsData';

interface FieldOperationModalProps {
  isOpen: boolean;
  workOrder: EngineeringWorkOrder | null;
  currentUserName?: string;
  onClose: () => void;
  onUpdateWorkOrder: (updatedOrder: EngineeringWorkOrder) => void;
  onNavigateToAcceptance?: (order: EngineeringWorkOrder) => void;
}

export const FieldOperationModal: React.FC<FieldOperationModalProps> = ({
  isOpen,
  workOrder,
  currentUserName = '工程技术员',
  onClose,
  onUpdateWorkOrder,
  onNavigateToAcceptance
}) => {
  if (!isOpen || !workOrder) return null;

  // Local state for field work recording
  const [faultCategory, setFaultCategory] = useState<FaultCategory>(
    workOrder.faultCategory || 'optical_sensor'
  );
  const [faultAnalysis, setFaultAnalysis] = useState<string>(
    workOrder.faultAnalysis || ''
  );
  const [repairAction, setRepairAction] = useState<string>(
    workOrder.repairAction || ''
  );
  const [parts, setParts] = useState<WorkOrderPart[]>(
    workOrder.partsReplaced || []
  );
  const [externalPartner, setExternalPartner] = useState<string>(
    workOrder.externalPartner || ''
  );
  const [electricalSafetyPassed, setElectricalSafetyPassed] = useState<boolean>(
    workOrder.electricalSafetyPassed ?? true
  );
  const [performancePassed, setPerformancePassed] = useState<boolean>(
    workOrder.performanceCalibrationPassed ?? true
  );

  // Warehouse Linkage State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [availableSpareParts, setAvailableSpareParts] = useState<SparePartItem[]>(() =>
    loadStoredSpareParts()
  );

  // New Part form inside modal (for custom/external parts)
  const [newPartName, setNewPartName] = useState('');
  const [newPartSpec, setNewPartSpec] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [newPartSource, setNewPartSource] = useState<WorkOrderPart['source']>('原厂紧急调配');
  const [showAddPart, setShowAddPart] = useState(false);

  // 1. 从医工备品备件库领料出库并实时扣减库存
  const handleConfirmIssueFromWarehouse = (part: SparePartItem, quantity: number) => {
    const currentPartsList = loadStoredSpareParts();
    const currentTxs = loadStoredStockTransactions();

    const res = issueSparePartForWorkOrder(
      currentPartsList,
      currentTxs,
      part.id,
      quantity,
      workOrder.id,
      {
        id: workOrder.equipmentId,
        name: workOrder.equipmentName,
        sn: workOrder.equipmentSn,
        department: workOrder.department
      },
      currentUserName
    );

    if (res.success) {
      setAvailableSpareParts(res.updatedParts);
      const newPart: WorkOrderPart = {
        partNo: part.partNo,
        partName: part.name,
        spec: part.spec,
        quantity: quantity,
        unitPrice: part.unitCost,
        totalPrice: quantity * part.unitCost,
        source: '院内备件库',
        partId: part.id,
        requisitionId: res.transactionRecord?.id,
        warehouseLocation: part.warehouseLocation,
        requisitionTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'issued'
      };
      setParts(prev => [...prev, newPart]);
      setShowIssueModal(false);
    } else {
      alert(res.message);
    }
  };

  // 2. 领料退料还库 (原路恢复库存并从工单移除)
  const handleReturnPart = (index: number) => {
    const target = parts[index];
    if (target.source === '院内备件库' && target.partId) {
      if (
        !window.confirm(
          `确认将备件【${target.partName}】(${target.quantity}件) 退料还库吗？\n系统将自动恢复备件库实物在库结存，并从本工单扣减 ￥${target.totalPrice} 元。`
        )
      ) {
        return;
      }
      const currentPartsList = loadStoredSpareParts();
      const currentTxs = loadStoredStockTransactions();
      const res = returnSparePartForWorkOrder(
        currentPartsList,
        currentTxs,
        target.partId,
        target.quantity,
        workOrder.id,
        currentUserName,
        '现场排查后确认该配件未拆封无需更换'
      );
      if (res.success) {
        setAvailableSpareParts(res.updatedParts);
      }
    }
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  // 3. 缺货挂起待件
  const handleMarkWaitingPartsFromModal = (reason: string) => {
    const note = `【备件缺货调配】${reason}`;
    const newAnalysis = faultAnalysis ? `${faultAnalysis}\n${note}` : note;
    setFaultAnalysis(newAnalysis);

    const updated: EngineeringWorkOrder = {
      ...workOrder,
      status: 'waiting_parts',
      faultAnalysis: newAnalysis,
      faultCategory,
      repairAction,
      partsReplaced: parts,
      totalRepairCost: (workOrder.laborHours || 1) * 120 + parts.reduce((s, p) => s + p.totalPrice, 0)
    };
    onUpdateWorkOrder(updated);
    setShowIssueModal(false);
    onClose();
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const newPart: WorkOrderPart = {
      partNo: `EXT-${Date.now().toString().slice(-6)}`,
      partName: newPartName.trim(),
      spec: newPartSpec.trim() || '标准规格',
      quantity: Number(newPartQty) || 1,
      unitPrice: Number(newPartPrice) || 0,
      totalPrice: (Number(newPartQty) || 1) * (Number(newPartPrice) || 0),
      source: newPartSource
    };
    setParts(prev => [...prev, newPart]);
    setNewPartName('');
    setNewPartSpec('');
    setNewPartQty(1);
    setNewPartPrice(0);
    setShowAddPart(false);
  };

  const handleRemovePart = (index: number) => {
    handleReturnPart(index);
  };

  const totalPartsCost = parts.reduce((sum, p) => sum + p.totalPrice, 0);

  // Status Action Handlers
  const nowStr = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 1. 接单响应
  const handleAcceptOrder = () => {
    const accepted = nowStr();
    // Calculate response time
    const reportDate = new Date(workOrder.reportTime.replace(' ', 'T'));
    const acceptDate = new Date(accepted.replace(' ', 'T'));
    const responseMins = Math.max(1, Math.round((acceptDate.getTime() - reportDate.getTime()) / (60 * 1000)));
    const isResponseMet = responseMins <= workOrder.slaResponseLimitMinutes;

    const updated: EngineeringWorkOrder = {
      ...workOrder,
      status: 'accepted',
      acceptedTime: accepted,
      responseTimeMinutes: responseMins,
      isSlaResponseMet: isResponseMet
    };
    onUpdateWorkOrder(updated);
  };

  // 2. 到场打卡
  const handleArriveOnSite = () => {
    const arrived = nowStr();
    let transitMins = 8;
    if (workOrder.acceptedTime) {
      const accDate = new Date(workOrder.acceptedTime.replace(' ', 'T'));
      const arrDate = new Date(arrived.replace(' ', 'T'));
      transitMins = Math.max(1, Math.round((arrDate.getTime() - accDate.getTime()) / (60 * 1000)));
    }

    const updated: EngineeringWorkOrder = {
      ...workOrder,
      status: 'arrived_inspecting',
      arrivedTime: arrived,
      transitTimeMinutes: transitMins
    };
    onUpdateWorkOrder(updated);
  };

  // 3. 挂起等待备件
  const handleSetWaitingParts = () => {
    const updated: EngineeringWorkOrder = {
      ...workOrder,
      status: 'waiting_parts',
      faultCategory,
      faultAnalysis: faultAnalysis || '正在申请关键备品备件或等待原厂技术专家支援。',
      repairAction,
      partsReplaced: parts,
      totalRepairCost: totalPartsCost
    };
    onUpdateWorkOrder(updated);
  };

  // 4. 恢复现场检修
  const handleResumeInspecting = () => {
    const updated: EngineeringWorkOrder = {
      ...workOrder,
      status: 'arrived_inspecting'
    };
    onUpdateWorkOrder(updated);
  };

  // 5. 提报完工，进入临床验收
  const handleFinishRepair = () => {
    const finishTime = nowStr();
    // Calculate total downtime in hours
    const reportDate = new Date(workOrder.reportTime.replace(' ', 'T'));
    const finishDate = new Date(finishTime.replace(' ', 'T'));
    const downtimeHours = Number((Math.max(0.1, (finishDate.getTime() - reportDate.getTime()) / (3600 * 1000))).toFixed(2));
    const isRepairMet = downtimeHours <= workOrder.slaRepairLimitHours;

    const updated: EngineeringWorkOrder = {
      ...workOrder,
      status: 'repaired_pending_acceptance',
      faultCategory,
      faultAnalysis: faultAnalysis || '设备故障已彻底排查排除，电气及物理性能恢复正常。',
      repairAction: repairAction || '按标准技术规范更换配件与重新参数定标测试合格。',
      partsReplaced: parts,
      externalPartner: externalPartner.trim() || undefined,
      electricalSafetyPassed,
      performanceCalibrationPassed: performancePassed,
      repairFinishedTime: finishTime,
      laborHours: Math.min(downtimeHours, 2.5),
      totalRepairCost: totalPartsCost,
      totalDowntimeHours: downtimeHours,
      isSlaRepairMet: isRepairMet,
      isFirstTimeFix: true
    };
    onUpdateWorkOrder(updated);
  };

  const isPendingAccept = workOrder.status === 'repaired_pending_acceptance';
  const isClosed = workOrder.status === 'closed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">工程师现场作业与排查闭环工作台</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                  {workOrder.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                责任工程师：<strong className="text-white">{workOrder.assignedEngineerName || '未指定'}</strong> | 报修科室：{workOrder.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Step Flow Banner */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[580px] text-xs">
            {/* Step 1: Dispatched */}
            <div className={`flex items-center gap-1.5 font-bold ${
              workOrder.status !== 'pending_dispatch' ? 'text-indigo-700' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${
                workOrder.status !== 'pending_dispatch' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>1</span>
              <span>已派工</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300" />

            {/* Step 2: Accepted */}
            <div className={`flex items-center gap-1.5 font-bold ${
              ['accepted', 'arrived_inspecting', 'waiting_parts', 'repaired_pending_acceptance', 'closed'].includes(workOrder.status)
                ? 'text-blue-700' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${
                ['accepted', 'arrived_inspecting', 'waiting_parts', 'repaired_pending_acceptance', 'closed'].includes(workOrder.status)
                  ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>2</span>
              <span>已接单响应</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300" />

            {/* Step 3: Arrived */}
            <div className={`flex items-center gap-1.5 font-bold ${
              ['arrived_inspecting', 'waiting_parts', 'repaired_pending_acceptance', 'closed'].includes(workOrder.status)
                ? 'text-amber-700' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${
                ['arrived_inspecting', 'waiting_parts', 'repaired_pending_acceptance', 'closed'].includes(workOrder.status)
                  ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>3</span>
              <span>现场排查维修</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300" />

            {/* Step 4: Repaired */}
            <div className={`flex items-center gap-1.5 font-bold ${
              ['repaired_pending_acceptance', 'closed'].includes(workOrder.status)
                ? 'text-cyan-700' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${
                ['repaired_pending_acceptance', 'closed'].includes(workOrder.status)
                  ? 'bg-cyan-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>4</span>
              <span>完工待验收</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300" />

            {/* Step 5: Closed */}
            <div className={`flex items-center gap-1.5 font-bold ${
              workOrder.status === 'closed' ? 'text-emerald-700' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${
                workOrder.status === 'closed' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>5</span>
              <span>临床验收闭环</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[68vh] overflow-y-auto space-y-4 text-xs">
          {/* Quick Action Prompt for Current Status */}
          {workOrder.status === 'dispatched' && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-blue-900 text-sm">工单已指派，等待您接单响应</span>
                  <p className="text-blue-700 text-xs mt-0.5">
                    响应SLA时限为 <strong className="font-mono">{workOrder.slaResponseLimitMinutes}分钟</strong>。请点击右侧按钮立即响应接单。
                  </p>
                </div>
              </div>
              <button
                onClick={handleAcceptOrder}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>立即接单响应</span>
              </button>
            </div>
          )}

          {workOrder.status === 'accepted' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold text-amber-900 text-sm">您已接单，请尽快赶赴设备现场</span>
                  <p className="text-amber-700 text-xs mt-0.5">
                    设备所在位置：<strong className="text-slate-900">{workOrder.location}</strong> ({workOrder.department})
                  </p>
                </div>
              </div>
              <button
                onClick={handleArriveOnSite}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <MapPin className="w-4 h-4" />
                <span>到场打卡开始检修</span>
              </button>
            </div>
          )}

          {workOrder.status === 'waiting_parts' && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PauseCircle className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <span className="font-bold text-purple-900 text-sm">工单处于【等待备件/外部支援】挂起状态</span>
                  <p className="text-purple-700 text-xs mt-0.5">
                    备件到达后，请点击右侧按钮恢复现场检修安装。
                  </p>
                </div>
              </div>
              <button
                onClick={handleResumeInspecting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <PlayCircle className="w-4 h-4" />
                <span>备件已到 · 恢复现场检修</span>
              </button>
            </div>
          )}

          {isPendingAccept && (
            <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-cyan-600 shrink-0" />
                <div>
                  <span className="font-bold text-cyan-900 text-sm">维修作业已完成，等待临床科室签字验收</span>
                  <p className="text-cyan-700 text-xs mt-0.5">
                    已累计停机 <strong className="font-mono">{workOrder.totalDowntimeHours}小时</strong>。请通知报修人（{workOrder.reporterName}）进行现场试机与验收评价。
                  </p>
                </div>
              </div>
              {onNavigateToAcceptance && (
                <button
                  onClick={() => onNavigateToAcceptance(workOrder)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>打开临床验收面板</span>
                </button>
              )}
            </div>
          )}

          {/* Equipment & Fault Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">设备信息</span>
              <div className="font-bold text-slate-900 text-sm">{workOrder.equipmentName}</div>
              <div className="text-slate-600">型号：<span className="font-mono text-slate-800">{workOrder.equipmentModel}</span></div>
              <div className="text-slate-600">SN码：<span className="font-mono text-slate-800">{workOrder.equipmentSn}</span></div>
              {workOrder.internalNo && (
                <div className="text-slate-600">科室自编号：<strong className="text-blue-700">{workOrder.internalNo}</strong></div>
              )}
              <div className="text-slate-600">安装位置：<span className="text-slate-800">{workOrder.location}</span></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">报修诉求</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">报修人：<strong>{workOrder.reporterName}</strong></span>
                <span className="text-slate-500 font-mono">{workOrder.reporterPhone}</span>
              </div>
              <div className="text-slate-600">报修时间：<span className="font-mono">{workOrder.reportTime}</span></div>
              <div className="p-2 bg-white rounded border border-slate-200 text-slate-700 mt-1">
                <p className="line-clamp-3 leading-relaxed">{workOrder.faultDescription}</p>
              </div>
            </div>
          </div>

          {/* Field Diagnosis & Action Inputs (Available during arrived_inspecting, waiting_parts, repaired_pending_acceptance) */}
          {['arrived_inspecting', 'waiting_parts', 'repaired_pending_acceptance', 'closed'].includes(workOrder.status) && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">现场排查、故障归因与修复记录</span>
                </div>
                {workOrder.status === 'arrived_inspecting' && (
                  <button
                    type="button"
                    onClick={handleSetWaitingParts}
                    className="px-2.5 py-1 text-2xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-100 transition cursor-pointer"
                  >
                    缺少备件？转为待配件挂起
                  </button>
                )}
              </div>

              {/* Fault Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  故障根因分类 (三甲质控归因) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'electrical_power', label: '电源供电与高压元器件' },
                    { id: 'mechanical_wear', label: '机械传动与轴承磨损' },
                    { id: 'optical_sensor', label: '光路传感器与探测器' },
                    { id: 'software_system', label: '软件死机与总线通信' },
                    { id: 'accessory_cable', label: '导联线缆与耗材探头破损' },
                    { id: 'user_operation', label: '临床误操作与设置偏差' },
                    { id: 'environment', label: '温湿度与地线电磁干扰' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={isClosed}
                      onClick={() => setFaultCategory(cat.id as FaultCategory)}
                      className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                        faultCategory === cat.id
                          ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900 ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fault Analysis Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  现场检测结论与故障点定位
                </label>
                <textarea
                  value={faultAnalysis}
                  disabled={isClosed}
                  onChange={(e) => setFaultAnalysis(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                  placeholder="详细记录现场万用表/示波器/分析仪检测参数，如电压波动、回路阻抗、磨损程度、报错代码排查结果..."
                />
              </div>

              {/* Repair Action Taken */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  处置措施与修复工艺
                </label>
                <textarea
                  value={repairAction}
                  disabled={isClosed}
                  onChange={(e) => setRepairAction(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                  placeholder="记录具体维修动作，如更换配件型号、焊接熔接、管路清洗脱钙、参数定标与校准通过..."
                />
              </div>

              {/* Parts Replaced Table */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">领料与更换零备件清单</span>
                    <span className="text-slate-400 font-mono">({parts.length}项)</span>
                  </div>
                  {!isClosed && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowIssueModal(true)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-2xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-indigo-200" />
                        <span>从医工备品备件库领料出库</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPart(!showAddPart)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-2xs font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>手动登记特殊配件</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Part Form Pop-in (Manual custom part) */}
                {showAddPart && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="text-2xs font-bold text-slate-600">登记非院内备件库物料（如原厂紧急调配、保修期免费配件）</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="配件名称 (如: 呼气阀密封圈)"
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        className="text-xs p-1.5 bg-white border border-slate-200 rounded"
                      />
                      <input
                        type="text"
                        placeholder="规格型号"
                        value={newPartSpec}
                        onChange={(e) => setNewPartSpec(e.target.value)}
                        className="text-xs p-1.5 bg-white border border-slate-200 rounded"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="数量"
                          min="1"
                          value={newPartQty}
                          onChange={(e) => setNewPartQty(Number(e.target.value))}
                          className="text-xs p-1.5 bg-white border border-slate-200 rounded w-16"
                        />
                        <input
                          type="number"
                          placeholder="单价 (元)"
                          min="0"
                          value={newPartPrice}
                          onChange={(e) => setNewPartPrice(Number(e.target.value))}
                          className="text-xs p-1.5 bg-white border border-slate-200 rounded flex-1"
                        />
                      </div>
                      <select
                        value={newPartSource}
                        onChange={(e) => setNewPartSource(e.target.value as any)}
                        className="text-xs p-1.5 bg-white border border-slate-200 rounded"
                      >
                        <option value="原厂紧急调配">原厂紧急调配</option>
                        <option value="保修期内免费">保修期内免费</option>
                        <option value="第三方现货采购">第三方现货采购</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddPart(false)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded text-2xs cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="px-3 py-1 bg-slate-800 text-white rounded text-2xs font-bold hover:bg-slate-900 cursor-pointer"
                      >
                        登记录入
                      </button>
                    </div>
                  </div>
                )}

                {/* Parts List */}
                {parts.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                    本次检修暂未领料更换配件。若需更换备件，请点击上方“从医工备品备件库领料出库”进行扫码/筛选出库。
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                          <th className="p-2">配件编号/名称</th>
                          <th className="p-2">规格型号</th>
                          <th className="p-2">来源属性 / 库位</th>
                          <th className="p-2 text-right">单价</th>
                          <th className="p-2 text-center">领料数量</th>
                          <th className="p-2 text-right">小计</th>
                          {!isClosed && <th className="p-2 text-center">退料 / 操作</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-2">
                              <div className="font-medium text-slate-800">{p.partName}</div>
                              {p.partNo && <div className="text-3xs text-slate-400 font-mono">{p.partNo}</div>}
                            </td>
                            <td className="p-2 text-slate-500">{p.spec}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${
                                  p.source === '院内备件库'
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {p.source}
                                </span>
                                {p.warehouseLocation && (
                                  <span className="text-3xs text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded">
                                    {p.warehouseLocation}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right font-mono">￥{p.unitPrice.toLocaleString()}</td>
                            <td className="p-2 text-center font-mono font-bold text-slate-700">{p.quantity}</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-600">￥{p.totalPrice.toLocaleString()}</td>
                            {!isClosed && (
                              <td className="p-2 text-center">
                                {p.source === '院内备件库' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleReturnPart(idx)}
                                    title="退料还库 (自动回滚库存与费用)"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-3xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3 text-amber-600" />
                                    <span>退料还库</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePart(idx)}
                                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={5} className="p-2 text-right text-slate-600">零配件支出费用总计：</td>
                          <td className="p-2 text-right text-rose-600 font-mono text-sm">￥{totalPartsCost.toLocaleString()}</td>
                          {!isClosed && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Quality & Electrical Safety Checkboxes */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
                <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>三甲医疗安全与电气质控复核</span>
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      disabled={isClosed}
                      checked={electricalSafetyPassed}
                      onChange={(e) => setElectricalSafetyPassed(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>修复后电气安全质控检测合格 (GB 9706.1 漏电流/接地电阻达标)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      disabled={isClosed}
                      checked={performancePassed}
                      onChange={(e) => setPerformancePassed(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>计量性能校准及自检通过 (输出能量/流速/压力误差在允许范围)</span>
                  </label>
                </div>
              </div>

              {/* External Partner (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  协同原厂 / 第三方维保机构 (若有)
                </label>
                <input
                  type="text"
                  disabled={isClosed}
                  value={externalPartner}
                  onChange={(e) => setExternalPartner(e.target.value)}
                  placeholder="如：GE医疗售后工程部、迈瑞原厂技术支持专线、国药器械等"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-2xs text-slate-500">
            {workOrder.status === 'dispatched' && '状态：已派单未响应，请接单'}
            {workOrder.status === 'accepted' && '状态：已接单在途中，请到场打卡'}
            {workOrder.status === 'arrived_inspecting' && '状态：现场检修中，完成排查后可提请临床验收'}
            {workOrder.status === 'waiting_parts' && '状态：挂起等待备件中'}
            {workOrder.status === 'repaired_pending_acceptance' && '状态：待临床科室验收试机'}
            {workOrder.status === 'closed' && '状态：工单已闭环'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              关闭
            </button>

            {['arrived_inspecting', 'waiting_parts'].includes(workOrder.status) && (
              <button
                type="button"
                onClick={handleFinishRepair}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>提报完工 · 提交临床验收</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spare Parts Requisition & Warehouse Linkage Modal */}
      <IssueSparePartModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        workOrder={workOrder}
        availableParts={availableSpareParts}
        currentUserName={currentUserName}
        onConfirmIssue={handleConfirmIssueFromWarehouse}
        onMarkWaitingParts={handleMarkWaitingPartsFromModal}
      />
    </div>
  );
};

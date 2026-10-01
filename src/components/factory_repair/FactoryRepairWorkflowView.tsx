import React, { useState, useEffect } from 'react';
import { 
  ReturnFactoryRepairOrder, 
  FactoryRepairStage, 
  WorkflowRole, 
  OutboundLogistics,
  OnsiteAcceptanceAndTrial 
} from '../../types/factoryRepairTypes';
import { 
  loadFactoryRepairOrders, 
  saveFactoryRepairOrders, 
  jumpToStage, 
  STAGE_CONFIGS, 
  WORKFLOW_ACTORS,
  addDialogueMessageToOrder,
  SEED_FACTORY_REPAIR_ORDER 
} from '../../utils/factoryRepairData';
import { FactoryRepairFlowchart } from './FactoryRepairFlowchart';
import { ElectronicSignaturePadModal } from './ElectronicSignaturePadModal';
import { DraftReturnApplicationModal } from './DraftReturnApplicationModal';
import { ExpressDispatchModal } from './ExpressDispatchModal';
import { JointNegotiationWorkspace } from './JointNegotiationWorkspace';
import { ContractSigningModal } from './ContractSigningModal';
import { EndoscopeAcceptanceModal } from './EndoscopeAcceptanceModal';
import { InvoicePaymentModal } from './InvoicePaymentModal';
import { 
  Wrench, 
  FileText, 
  Truck, 
  Scale, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  Eye, 
  Send, 
  PenTool, 
  ShieldCheck, 
  RotateCcw, 
  FileSignature, 
  ClipboardCheck, 
  Receipt, 
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { AuthUser } from '../../types';

interface FactoryRepairWorkflowViewProps {
  currentUser?: AuthUser;
}

export const FactoryRepairWorkflowView: React.FC<FactoryRepairWorkflowViewProps> = ({
  currentUser
}) => {
  const [orders, setOrders] = useState<ReturnFactoryRepairOrder[]>(() => loadFactoryRepairOrders());
  const activeOrder = orders[0] || SEED_FACTORY_REPAIR_ORDER;

  // 当前所选中的查看/操作阶段 (默认跟随工单当前阶段)
  const [selectedStage, setSelectedStage] = useState<FactoryRepairStage>(activeOrder.currentStage);

  // 当前模拟的操作角色 (默认根据登录用户智能推断，支持一键切换测试)
  const [currentRole, setCurrentRole] = useState<WorkflowRole>(() => {
    if (currentUser?.departmentName?.includes('麻醉') || currentUser?.role?.includes('护士长')) {
      return 'clinical_anesthesia';
    }
    if (currentUser?.role?.includes('副院长')) {
      return 'vp_medical';
    }
    if (currentUser?.role?.includes('院长')) {
      return 'president';
    }
    return 'equipment_engineer';
  });

  // 各弹窗状态
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureTargetNode, setSignatureTargetNode] = useState<{
    level: 1 | 2 | 3 | 4;
    title: string;
    signeeName: string;
    roleTitle: string;
    defaultOpinion: string;
  } | null>(null);

  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // 监听工单更新事件
  useEffect(() => {
    const handleUpdate = () => {
      const refreshed = loadFactoryRepairOrders();
      setOrders(refreshed);
    };
    window.addEventListener('factory_repair_orders_updated', handleUpdate);
    return () => window.removeEventListener('factory_repair_orders_updated', handleUpdate);
  }, []);

  const updateActiveOrder = (updated: ReturnFactoryRepairOrder) => {
    const newOrders = orders.map(o => o.id === updated.id ? updated : o);
    setOrders(newOrders);
    saveFactoryRepairOrders(newOrders);
  };

  // 快捷重置或跳转阶段
  const handleJumpToStage = (stage: FactoryRepairStage) => {
    const updated = jumpToStage(activeOrder.id, stage);
    setSelectedStage(stage);
    updateActiveOrder(updated);
  };

  const handleResetToInitial = () => {
    const resetOrder: ReturnFactoryRepairOrder = JSON.parse(JSON.stringify(SEED_FACTORY_REPAIR_ORDER));
    resetOrder.currentStage = 'DEPARTMENT_REPORT';
    resetOrder.stageProgressPercent = 10;
    setSelectedStage('DEPARTMENT_REPORT');
    updateActiveOrder(resetOrder);
  };

  // 审批签字触发
  const handleOpenSignature = (level: 1 | 2 | 3 | 4) => {
    if (level === 3) {
      setSignatureTargetNode({
        level: 3,
        title: '分管副院长大修审批签字',
        signeeName: WORKFLOW_ACTORS.vp_medical.name,
        roleTitle: WORKFLOW_ACTORS.vp_medical.roleTitle,
        defaultOpinion: '同意返厂大修。请设备科严格把控维修质量与配件保修期，压缩维修停机时间，呈刘院长终审。'
      });
    } else if (level === 4) {
      setSignatureTargetNode({
        level: 4,
        title: '院长终审签章（签字通过后激活维修实施流程）',
        signeeName: WORKFLOW_ACTORS.president.name,
        roleTitle: WORKFLOW_ACTORS.president.roleTitle,
        defaultOpinion: '批准大修实施。请严格按照外协大修内控规程执行，联合麻醉科共同议价并落实不少于1年配件质保。批准实施！'
      });
    } else {
      setSignatureTargetNode({
        level: 2,
        title: '医学装备科主管审核签字',
        signeeName: WORKFLOW_ACTORS.equipment_engineer.name,
        roleTitle: WORKFLOW_ACTORS.equipment_engineer.roleTitle,
        defaultOpinion: '现场技术勘查属实，返厂修复具有极高经济效益比，呈报分管院长批示。'
      });
    }
    setIsSignatureModalOpen(true);
  };

  const handleConfirmSignature = (sigUrl: string, opinion: string) => {
    if (!signatureTargetNode) return;
    const order = { ...activeOrder };
    const node = order.approvalChain.find(n => n.level === signatureTargetNode.level);
    if (node) {
      node.status = 'approved';
      node.signatureDataUrl = sigUrl;
      node.approvalOpinion = opinion;
      node.signedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }

    // 若是院长签字 (Level 4)，自动将状态推进到【现场核验取件与发快递】阶段！
    if (signatureTargetNode.level === 4) {
      order.currentStage = 'DISPATCH_EXPRESS';
      order.stageProgressPercent = 40;
      setSelectedStage('DISPATCH_EXPRESS');
    }

    order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    updateActiveOrder(order);
  };

  // 一键发送快递完成
  const handleConfirmDispatch = (logistics: OutboundLogistics) => {
    const order = { ...activeOrder };
    order.outboundLogistics = logistics;
    order.currentStage = 'VENDOR_INSPECT_QUOTE';
    order.stageProgressPercent = 50;
    setSelectedStage('VENDOR_INSPECT_QUOTE');
    order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    updateActiveOrder(order);
  };

  // 留言发送
  const handleSendMessage = (content: string) => {
    const actor = WORKFLOW_ACTORS[currentRole];
    addDialogueMessageToOrder(activeOrder.id, {
      senderName: actor.name,
      senderRole: actor.roleTitle.split('/')[0].trim(),
      senderRoleKey: currentRole,
      senderAvatar: actor.avatarColor,
      content
    });
    setOrders(loadFactoryRepairOrders());
  };

  // 锁定议价定标
  const handleLockNegotiation = (finalPrice: number, warrantyMonths: number) => {
    const order = { ...activeOrder };
    order.jointNegotiation.finalAgreedPrice = finalPrice;
    order.jointNegotiation.finalWarrantyMonths = warrantyMonths;
    order.jointNegotiation.isAgreed = true;
    order.contract.agreedAmount = finalPrice;
    order.currentStage = 'CONTRACT_SIGNING';
    order.stageProgressPercent = 70;
    setSelectedStage('CONTRACT_SIGNING');
    order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    updateActiveOrder(order);
  };

  // 合同签章
  const handleSignContractPartyA = () => {
    const order = { ...activeOrder };
    order.contract.partyASigned = true;
    order.contract.partyASignatureDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (order.contract.partyBSigned) {
      order.contract.status = 'fully_signed';
      order.currentStage = 'VENDOR_REPAIR_RETURN';
      order.stageProgressPercent = 80;
      setSelectedStage('VENDOR_REPAIR_RETURN');
    } else {
      order.contract.status = 'party_a_signed';
    }
    order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    updateActiveOrder(order);
  };

  const handleSignContractPartyB = () => {
    const order = { ...activeOrder };
    order.contract.partyBSigned = true;
    order.contract.partyBSignatureDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (order.contract.partyASigned) {
      order.contract.status = 'fully_signed';
      order.currentStage = 'VENDOR_REPAIR_RETURN';
      order.stageProgressPercent = 80;
      setSelectedStage('VENDOR_REPAIR_RETURN');
    }
    order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    updateActiveOrder(order);
  };

  // 结项
  const handleSettleProject = (surgeries: number, observation: string) => {
    const order = { ...activeOrder };
    order.acceptanceTrial.trialSurgeriesCount = surgeries;
    order.acceptanceTrial.trialObservations = observation;
    order.acceptanceTrial.trialStatus = 'settled_qualified';
    order.acceptanceTrial.settledAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.acceptanceTrial.settledSignee = `${WORKFLOW_ACTORS.clinical_anesthesia.name} (麻醉手术科) / ${WORKFLOW_ACTORS.equipment_engineer.name} (设备科)`;
    order.currentStage = 'INVOICE_PAYMENT_TRACK';
    order.stageProgressPercent = 100;
    setSelectedStage('INVOICE_PAYMENT_TRACK');
    order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    updateActiveOrder(order);
  };

  // 发票上传
  const handleUploadInvoice = (inv: any) => {
    const order = { ...activeOrder };
    order.invoicePayment.invoiceRecord = inv;
    order.invoicePayment.paymentNodes[0].status = 'completed';
    order.invoicePayment.paymentNodes[0].completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.invoicePayment.paymentNodes[1].status = 'in_progress';
    order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    updateActiveOrder(order);
  };

  const currentActor = WORKFLOW_ACTORS[currentRole];

  return (
    <div className="space-y-6">
      {/* 顶部主横幅：设备信息与控制区 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  医疗器械外协返厂大修·十阶协同履约工作台
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  工单号: {activeOrder.orderNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  资产编号: {activeOrder.initialFault.assetNo}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>设备标的: <strong className="text-slate-800">{activeOrder.initialFault.equipmentName}</strong> ({activeOrder.initialFault.equipmentModel})</span>
                <span className="text-slate-300">·</span>
                <span>所属科室: <strong className="text-emerald-700">{activeOrder.initialFault.department}</strong></span>
                <span className="text-slate-300">·</span>
                <span>当前节点: <strong className="text-indigo-700">{STAGE_CONFIGS.find(s => s.key === activeOrder.currentStage)?.title}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* 角色与权限透传状态说明 */}
        <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">您当前处于：</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
              <span className={`w-2 h-2 rounded-full ${currentActor.avatarColor}`} />
              <span>{currentActor.name}</span>
              <span className="text-slate-500 text-[11px]">({currentActor.roleTitle})</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>麻醉手术科穿透可见度: <strong className="text-emerald-700">100% 实时同步</strong></span>
            <span className="text-slate-300">|</span>
            <span>审批与盖章内控: <strong className="text-indigo-700">院长终审签字方可寄出</strong></span>
          </div>
        </div>
      </div>

      {/* 核心第一部分：全生命周期可视化流程图 (嵌入展示) */}
      <FactoryRepairFlowchart
        currentStage={activeOrder.currentStage}
        selectedStage={selectedStage}
        onSelectStage={(stg) => setSelectedStage(stg)}
        currentRole={currentRole}
        onChangeRole={(r) => setCurrentRole(r)}
      />

      {/* 核心第二部分：当前选中阶段对应的交互工作台 */}
      <div className="space-y-4">
        {/* 阶段 1: 科室报修 */}
        {selectedStage === 'DEPARTMENT_REPORT' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 1：麻醉手术科临床故障报修
                  </h3>
                  <p className="text-xs text-slate-500">
                    报修人: {activeOrder.initialFault.reporterName} · 报修时间: {activeOrder.initialFault.reportedAt}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                已提交待勘查
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">术中故障现象描述:</div>
                <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                  {activeOrder.initialFault.faultSymptom}
                </p>
                <div className="text-slate-500 text-[11px] pt-1">
                  临床紧迫性: <strong className="text-rose-700">特急 (影响择期与急症微创手术)</strong>
                </div>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">术中视场异常照片取证:</div>
                <div className="grid grid-cols-2 gap-2">
                  {activeOrder.initialFault.fieldPhotos.map((url, i) => (
                    <div key={i} className="h-24 rounded border border-slate-200 overflow-hidden bg-slate-100 relative">
                      <img src={url} alt="fault" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[9px] px-1 rounded">
                        镜头严重发雾
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 下一步操作 */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                设备科工程师已接单，请前往现场进行光学透光及密封性检测。
              </span>
              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('ONSITE_CHECK_DRAFT');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>推进到：设备科现场检查与起草申请</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 阶段 2: 现场检查与起草申请 */}
        {selectedStage === 'ONSITE_CHECK_DRAFT' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Search className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 2：医疗设备科现场检查判定与一键起草返厂申请
                  </h3>
                  <p className="text-xs text-slate-500">
                    责任工程师: {activeOrder.onsiteDraft.inspectorName} ({activeOrder.onsiteDraft.inspectorTitle}) · 麻醉手术科同步穿透查阅
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>{currentRole === 'clinical_anesthesia' ? '麻醉手术科查阅呈批申请书' : '查阅/编辑返厂呈批文书'}</span>
              </button>
            </div>

            {/* 现场检测数据卡片 */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <div className="font-bold text-rose-900">光学视场判定结论</div>
                <div className="text-rose-700 font-semibold mt-1">物镜与棒镜透光雾化严重</div>
                <div className="text-[11px] text-rose-600 mt-0.5">蓝宝石保护窗封胶进水脱胶</div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="font-bold text-amber-900">冷光源光纤透光率</div>
                <div className="text-amber-800 font-bold mt-1 text-base font-mono">38%</div>
                <div className="text-[11px] text-amber-700 mt-0.5">断丝率超 30%，光衰严重</div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-900">内部HOPKINS光学柱状镜棒</div>
                <div className="text-blue-800 font-semibold mt-1">微裂纹与霉斑，须整套换新</div>
                <div className="text-[11px] text-blue-600 mt-0.5">院内无百级洁净间与光轴校准设备</div>
              </div>
            </div>

            {/* 起草报告摘要 */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>呈批文书：{activeOrder.onsiteDraft.draftApplicationTitle}</span>
                <span className="text-[11px] text-indigo-700 font-semibold">
                  拟选厂商: {activeOrder.onsiteDraft.targetVendorName}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                {activeOrder.onsiteDraft.draftReasonAndNecessity}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>预估大修总预算区间: <strong className="text-rose-700 font-mono text-xs">{activeOrder.onsiteDraft.estimatedCostRange}</strong></span>
                <span>起草时间: {activeOrder.onsiteDraft.draftedAt} (经手人: {activeOrder.onsiteDraft.draftedBy})</span>
              </div>
            </div>

            {/* 操作条 */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                <span>点击打开《五莲县人民医院外协返厂大修呈批报告》红头公文详件</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('MULTI_LEVEL_APPROVAL');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>推送到设备科主管、分管院长和院长处审批</span>
              </button>
            </div>
          </div>
        )}

        {/* 阶段 3: 四级审批签字 */}
        {selectedStage === 'MULTI_LEVEL_APPROVAL' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <PenTool className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 3：多级审批与分管院长、院长电子签字
                  </h3>
                  <p className="text-xs text-slate-500">
                    核心内控规定：设备科主管审核 → 分管院长签字 → 院长终审签字后，方可激活并实施维修流程！
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                严格四级闭环签章
              </span>
            </div>

            {/* 四级审批流转卡片 */}
            <div className="grid grid-cols-4 gap-3.5">
              {activeOrder.approvalChain.map((node) => {
                const isApproved = node.status === 'approved';
                return (
                  <div
                    key={node.level}
                    className={`p-4 rounded-xl border text-xs text-left relative flex flex-col justify-between ${
                      isApproved ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-500">
                          第{node.level}级 · {node.nodeName}
                        </span>
                        {isApproved ? (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 已签字
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-bold flex items-center gap-0.5">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> 待签批
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-slate-900 text-sm">{node.approverName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{node.approverRole}</div>

                      {isApproved ? (
                        <div className="mt-3 p-2 bg-white rounded border border-emerald-100 text-[11px] text-slate-700 italic">
                          "{node.approvalOpinion}"
                          <div className="text-[10px] text-emerald-600 not-italic font-mono mt-1">
                            签章时间: {node.signedAt}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-400">
                          等待该审批人手写电子签名...
                        </div>
                      )}
                    </div>

                    {/* 签字按钮 */}
                    <div className="mt-4 pt-2 border-t border-slate-200/60">
                      {!isApproved ? (
                        <button
                          type="button"
                          onClick={() => handleOpenSignature(node.level)}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>以此身份电子签名</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSignature(node.level)}
                          className="w-full py-1 text-slate-500 hover:text-slate-800 text-[11px] transition text-center"
                        >
                          重新签批 / 更改意见
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 审批状态综合研判 */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-slate-800">
                  刘院长已终审签字批准实施，审批结果已自动推送到“现场核验取件与发快递”实施阶段。
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('DISPATCH_EXPRESS');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>进入现场取件与发快递</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 阶段 4: 现场核验取件与发快递 */}
        {selectedStage === 'DISPATCH_EXPRESS' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 4：现场核验取件与一键发送快递信息
                  </h3>
                  <p className="text-xs text-slate-500">
                    设备科至麻醉手术科现场核验内镜外观与钢印编号 · 专用防震箱封箱 · 顺丰特快寄往德国狼牌技术中心
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>现场核验并一键发送快递</span>
              </button>
            </div>

            {/* 物流卡片 */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>顺丰特快运单与保价凭单</span>
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {activeOrder.outboundLogistics.trackingNumber}
                  </span>
                </div>
                <div className="text-slate-600 leading-relaxed bg-white p-2.5 rounded border border-slate-100 space-y-1">
                  <div>承运物流：{activeOrder.outboundLogistics.courierCompany}</div>
                  <div>贵重精密仪器保价金额：<strong className="text-emerald-700 font-mono">¥{activeOrder.outboundLogistics.insuredValue.toLocaleString()} 元</strong></div>
                  <div>交接核验人：{activeOrder.outboundLogistics.verifierName}</div>
                  <div>寄件时间：{activeOrder.outboundLogistics.shippingDate}</div>
                </div>
                <div className="text-[11px] text-slate-500">
                  防护规格：{activeOrder.outboundLogistics.packagingCondition}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">包装与封箱存证照片:</div>
                <div className="grid grid-cols-2 gap-2">
                  {activeOrder.outboundLogistics.packagePhotos.map((url, i) => (
                    <div key={i} className="h-24 rounded border border-slate-200 overflow-hidden bg-slate-100 relative">
                      <img src={url} alt="package" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[9px] px-1 rounded">
                        专用防震盒封签
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 下一步操作 */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                快递信息已即时推送至德国狼牌厂家平台，厂家收到后将进行超净拆检与在线明细报价。
              </span>
              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('VENDOR_INSPECT_QUOTE');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>推进到：厂家拆检与在线报价</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 阶段 5: 厂家拆检与明细报价 */}
        {selectedStage === 'VENDOR_INSPECT_QUOTE' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  阶段 5：德国狼牌厂家到货拆检报告与在线明细报价单
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  厂家工程师已完成百级洁净拆检，出具高清物镜进水与镜棒破损图片，并已在平台录入全部配件明细报价
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('JOINT_NEGOTIATION');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Scale className="w-4 h-4" />
                <span>开启：麻醉科与院长共同议价大厅</span>
              </button>
            </div>

            <JointNegotiationWorkspace
              order={activeOrder}
              currentRole={currentRole}
              onSendMessage={handleSendMessage}
              onSubmitClinicalOpinion={(op, bg) => {
                const ord = { ...activeOrder };
                ord.jointNegotiation.clinicalDeptOpinion = {
                  authorName: `${WORKFLOW_ACTORS.clinical_anesthesia.name} (麻醉手术科)`,
                  opinion: op,
                  willingBudgetCeiling: bg,
                  submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
                };
                updateActiveOrder(ord);
              }}
              onSubmitLeadershipGuidance={(lim, inst) => {
                const ord = { ...activeOrder };
                ord.jointNegotiation.leadershipGuidance = {
                  leaderName: WORKFLOW_ACTORS.president.name,
                  title: '院长',
                  targetPriceLimit: lim,
                  instruction: inst,
                  submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
                };
                updateActiveOrder(ord);
              }}
              onSubmitHospitalCounterOffer={(amt, rem) => {
                const ord = { ...activeOrder };
                ord.jointNegotiation.negotiationRounds.push({
                  round: ord.jointNegotiation.negotiationRounds.length + 1,
                  hospitalCounterOffer: amt,
                  hospitalRemark: rem,
                  vendorResponseOffer: 14500,
                  vendorDiscountReason: '正在与德国狼牌大区经理申请特批折扣...',
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
                });
                updateActiveOrder(ord);
              }}
              onSubmitVendorCounterResponse={(amt, rsn) => {
                const ord = { ...activeOrder };
                const last = ord.jointNegotiation.negotiationRounds[ord.jointNegotiation.negotiationRounds.length - 1];
                if (last) {
                  last.vendorResponseOffer = amt;
                  last.vendorDiscountReason = rsn;
                }
                updateActiveOrder(ord);
              }}
              onCloseNegotiationAndLockPrice={handleLockNegotiation}
            />
          </div>
        )}

        {/* 阶段 6: 四方共同议价 */}
        {selectedStage === 'JOINT_NEGOTIATION' && (
          <JointNegotiationWorkspace
            order={activeOrder}
            currentRole={currentRole}
            onSendMessage={handleSendMessage}
            onSubmitClinicalOpinion={(op, bg) => {
              const ord = { ...activeOrder };
              ord.jointNegotiation.clinicalDeptOpinion = {
                authorName: `${WORKFLOW_ACTORS.clinical_anesthesia.name} (麻醉手术科)`,
                opinion: op,
                willingBudgetCeiling: bg,
                submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
              };
              updateActiveOrder(ord);
            }}
            onSubmitLeadershipGuidance={(lim, inst) => {
              const ord = { ...activeOrder };
              ord.jointNegotiation.leadershipGuidance = {
                leaderName: WORKFLOW_ACTORS.president.name,
                title: '院长',
                targetPriceLimit: lim,
                instruction: inst,
                submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
              };
              updateActiveOrder(ord);
            }}
            onSubmitHospitalCounterOffer={(amt, rem) => {
              const ord = { ...activeOrder };
              ord.jointNegotiation.negotiationRounds.push({
                round: ord.jointNegotiation.negotiationRounds.length + 1,
                hospitalCounterOffer: amt,
                hospitalRemark: rem,
                vendorResponseOffer: 14500,
                vendorDiscountReason: '正在与德国狼牌大区经理申请特批折扣...',
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
              });
              updateActiveOrder(ord);
            }}
            onSubmitVendorCounterResponse={(amt, rsn) => {
              const ord = { ...activeOrder };
              const last = ord.jointNegotiation.negotiationRounds[ord.jointNegotiation.negotiationRounds.length - 1];
              if (last) {
                last.vendorResponseOffer = amt;
                last.vendorDiscountReason = rsn;
              }
              updateActiveOrder(ord);
            }}
            onCloseNegotiationAndLockPrice={handleLockNegotiation}
          />
        )}

        {/* 阶段 7: 签署维修合同 */}
        {selectedStage === 'CONTRACT_SIGNING' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 7：平台在线签署《医用内窥镜外协大修技术服务合同》
                  </h3>
                  <p className="text-xs text-slate-500">
                    合同总价: ¥{activeOrder.contract.agreedAmount.toLocaleString()} 元 · 质保期限: 12个月 · 具备法律存证效力
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <FileSignature className="w-4 h-4" />
                <span>打开合同签署中心</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">甲方盖章状态 (五莲县人民医院):</div>
                {activeOrder.contract.partyASigned ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center justify-between">
                    <span className="font-semibold">✓ 医院电子合同公章已加盖</span>
                    <span className="font-mono text-[11px]">{activeOrder.contract.partyASignatureDate}</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center justify-between">
                    <span>待甲方签署公章</span>
                    <button
                      type="button"
                      onClick={handleSignContractPartyA}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-bold"
                    >
                      点击加盖医院公章
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">乙方盖章状态 (德国狼牌医疗技术中心):</div>
                {activeOrder.contract.partyBSigned ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center justify-between">
                    <span className="font-semibold">✓ 狼牌厂家维保专用章已加盖</span>
                    <span className="font-mono text-[11px]">{activeOrder.contract.partyBSignatureDate}</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center justify-between">
                    <span>待厂家签署印章</span>
                    <button
                      type="button"
                      onClick={handleSignContractPartyB}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-bold"
                    >
                      点击加盖厂家印章
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                双方法定签章已完成，厂家进入百级洁净间光学大修与同轴激光校准。
              </span>
              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('VENDOR_REPAIR_RETURN');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>推进到：维修完成返程与多方实时看板</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 阶段 8: 维修完成返程与实时看板 */}
        {selectedStage === 'VENDOR_REPAIR_RETURN' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 8：维修完成返程与多方全景实时看板
                  </h3>
                  <p className="text-xs text-slate-500">
                    麻醉手术科、院长办公室、设备科、厂家端 4方实时同步刷新返程物流与合格出厂单
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                顺丰特快返程中
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">返程快递运单</div>
                <div className="text-base font-bold font-mono text-blue-700">
                  {activeOrder.inboundLogistics.trackingNumber}
                </div>
                <div className="text-[11px] text-slate-500">
                  承运公司: {activeOrder.inboundLogistics.courierCompany}
                </div>
                <div className="text-[11px] text-slate-500">
                  寄出时间: {activeOrder.inboundLogistics.shippedAt}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  到货时间: {activeOrder.inboundLogistics.actualArrivalDate} (已送达五莲县医院)
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">出厂质检合格证书</div>
                <div className="text-emerald-700 font-bold text-sm">
                  ✓ 德国狼牌百级出厂全检合格
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>· 激光干涉光轴同轴度检测: 100% 达标</div>
                  <div>· 134℃高温高压蒸汽气密测试: 无泄漏</div>
                  <div>· 导光纤维透光率恢复至: 98.5%</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">各角色实时同步看板</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>麻醉手术科:</span>
                    <span>✓ 收到到货预报，备战开箱验收</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-700">
                    <span>院长办公室:</span>
                    <span>✓ 看板提示即将进入1周试用</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-700">
                    <span>医疗设备科:</span>
                    <span>✓ 工程师已携带测漏仪就位</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                器械已送达手术室，请设备科与麻醉手术科护士长共同进行现场开箱性能测试。
              </span>
              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('ACCEPTANCE_TRIAL_SETTLE');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>进入现场开箱验收与1周临床试用</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 阶段 9: 现场开箱验收与1周临床试用结项 */}
        {selectedStage === 'ACCEPTANCE_TRIAL_SETTLE' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 9：现场开箱性能实测与1周临床手术试用结项
                  </h3>
                  <p className="text-xs text-slate-500">
                    双人实机性能核验 · 7天手术跟台观察 · 满1周无异常正式确认结项
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAcceptanceModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>打开开箱验收与1周试用单</span>
              </button>
            </div>

            {/* 验收与试用状态 */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>现场开箱性能测试</span>
                  <span className="text-[11px] font-bold text-emerald-700">全部4项指标合格</span>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div>· 机身钢印编号 RW-20230415-87035 完全比对一致</div>
                  <div>· 4K超高清摄像测试：视场极度清晰，色彩还原精准</div>
                  <div>· 0.05MPa负压浸水测漏：3分钟指针无跌落，无气泡</div>
                  <div>· 134℃高温高压灭菌相容性合格</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  验收双签字：崔伟 (设备科) & 黄晓彤 (麻醉手术科)
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>临床手术试用满1周结项状态</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {activeOrder.acceptanceTrial.trialStatus === 'settled_qualified' ? '已正式结项' : '7天试用中'}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                  {activeOrder.acceptanceTrial.trialObservations}
                </p>
                <div className="text-[11px] text-emerald-800 font-semibold">
                  跟台手术台次: {activeOrder.acceptanceTrial.trialSurgeriesCount} 台碎石术 · 结项时间: {activeOrder.acceptanceTrial.settledAt}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                结项完成后，系统已自动解除发票开具限制，通知厂家上传增值税专用发票。
              </span>
              <button
                type="button"
                onClick={() => {
                  handleJumpToStage('INVOICE_PAYMENT_TRACK');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>推进到：厂家发票上传与实时付款跟踪</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 阶段 10: 厂家发票上传与实时付款追踪 */}
        {selectedStage === 'INVOICE_PAYMENT_TRACK' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    阶段 10：厂家发票上传与全流程实时付款进度看板
                  </h3>
                  <p className="text-xs text-slate-500">
                    开票金额: ¥14,200.00 · 增值税专用发票已验真 · 医工挂账 → 财务复核 → 院长签批 → 银行网银出纳电汇打款
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>打开完整发票与付款流水看板</span>
              </button>
            </div>

            {/* 发票与对公打款卡片 */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>厂家增值税专用发票</span>
                  <span className="text-[11px] font-bold text-emerald-700">全国税局验真一致</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono">
                  <div>发票代码: {activeOrder.invoicePayment.invoiceRecord?.invoiceCode}</div>
                  <div>发票号码: {activeOrder.invoicePayment.invoiceRecord?.invoiceNumber}</div>
                  <div>价税合计: <strong className="text-rose-700 text-sm">¥{activeOrder.invoicePayment.invoiceRecord?.amount.toLocaleString()}.00</strong></div>
                  <div className="text-slate-400 text-[11px]">开票日期: {activeOrder.invoicePayment.invoiceRecord?.issuedDate}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>对公电汇打款与质保激活</span>
                  <span className="text-[11px] font-bold text-indigo-700">款项已实收到账</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div>银行电汇业务流水号: <strong className="font-mono text-indigo-700">WLPH-BK-20261007-9921</strong></div>
                  <div>出纳经手人: 财务科 孙出纳</div>
                  <div>付款签批: 刘志刚 (院长) / 王建国 (副院长)</div>
                  <div className="text-emerald-700 font-semibold pt-1">
                    ★ 德国狼牌原厂 12 个月保修系统已正式激活！
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">
                  恭喜！该医疗器械返厂大修项目十阶闭环全部顺利圆满完成！已归档入全生命周期技术台账。
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToInitial}
                className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded font-bold hover:bg-emerald-100 transition"
              >
                重置再次体验全流程
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 弹窗集合 */}
      <ElectronicSignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirmSignature={handleConfirmSignature}
        title={signatureTargetNode?.title || '电子签名'}
        roleTitle={signatureTargetNode?.roleTitle || ''}
        signeeName={signatureTargetNode?.signeeName || ''}
        defaultOpinion={signatureTargetNode?.defaultOpinion}
      />

      <DraftReturnApplicationModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        order={activeOrder}
        currentRole={currentRole}
        onConfirmDraftAndPush={(draft) => {
          const ord = { ...activeOrder, onsiteDraft: draft };
          ord.currentStage = 'MULTI_LEVEL_APPROVAL';
          ord.stageProgressPercent = 30;
          setSelectedStage('MULTI_LEVEL_APPROVAL');
          updateActiveOrder(ord);
          setIsDraftModalOpen(false);
        }}
      />

      <ExpressDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        order={activeOrder}
        onConfirmDispatch={handleConfirmDispatch}
      />

      <ContractSigningModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        order={activeOrder}
        onConfirmSignPartyA={handleSignContractPartyA}
        onConfirmSignPartyB={handleSignContractPartyB}
      />

      <EndoscopeAcceptanceModal
        isOpen={isAcceptanceModalOpen}
        onClose={() => setIsAcceptanceModalOpen(false)}
        order={activeOrder}
        onConfirmAcceptance={(acc) => {
          const ord = { ...activeOrder, acceptanceTrial: acc };
          updateActiveOrder(ord);
        }}
        onSettleProject={handleSettleProject}
      />

      <InvoicePaymentModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={activeOrder}
        currentRole={currentRole}
        onUploadInvoice={handleUploadInvoice}
        onAdvancePaymentNode={(nodeId) => {}}
      />
    </div>
  );
};

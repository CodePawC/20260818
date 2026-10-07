import React, { useState, useMemo, useEffect } from 'react';
import { MedicalEquipment, MetrologyCatalogueItem, ThirdPartyInspectionReport, AcceptanceSignoffDetail } from '../types';
import { ThirdPartyReportPreviewModal } from './ThirdPartyReportPreviewModal';
import {
  X,
  Wrench,
  ShieldCheck,
  Calendar,
  MapPin,
  DollarSign,
  Building,
  Building2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  Sparkles,
  TrendingUp,
  Scale,
  Hourglass,
  Phone,
  Eye,
  FileCheck,
  FileCheck2,
  Trash2,
  ArrowRightLeft,
  RotateCcw,
  PackageCheck,
  Printer,
  ChevronRight,
  ExternalLink,
  Cpu,
  Info,
  Clock,
  Tag,
  Coins,
  Smartphone,
  QrCode,
  ShieldAlert,
  Star,
  Check,
  UserCheck,
  MessageSquare,
  ThumbsUp,
  Package,
  Zap,
  GraduationCap,
  Users,
  Camera,
  Upload,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { loadStoredWorkOrders } from '../utils/dispatchData';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { WorkOrderStepBar } from './WorkOrderStepBar';
import { WorkOrderTrackingModal } from './WorkOrderTrackingModal';
import { WorkOrderPrintModal } from './WorkOrderPrintModal';
import { EquipmentAcceptanceModal } from './EquipmentAcceptanceModal';
import { getEquipmentAcceptanceDossier } from '../utils/equipmentAcceptanceData';
import { loadStoredAdverseEvents } from '../utils/adverseEventData';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentHealthScore, getEquipmentMaintenanceNode } from '../utils/equipmentUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { getDepartmentMasterInfo } from '../utils/masterData';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { resolveMainCategory, resolveLevel1Category, resolveLevel2Category } from '../utils/categoryFormatter';
import { calculateEquipmentFinancialProfile, estimateRealisticPurchasePrice } from '../utils/roiEconomicsUtils';
import { EquipmentCostAnalysisTab } from './EquipmentCostAnalysisTab';
import { ImagePreviewModal } from './ImagePreviewModal';
import { HealthScoreDetailModal } from './HealthScoreDetailModal';
import { EquipmentLifecycleTimeline } from './EquipmentLifecycleTimeline';
import { ApprovalApplication } from '../types/approvalTypes';
import { EquipmentLoanRecord } from '../types';
import { LoanCountdownBadge, computeLoanTimeProgress } from './LoanTimeProgressBar';
import { VendorCollaborationRepairTracker } from './VendorCollaborationRepairTracker';

interface EquipmentDetailModalProps {
  equipment: MedicalEquipment | null;
  metrologyCatalogue?: MetrologyCatalogueItem[];
  onClose: () => void;
  onOpenRepairForDevice: (item: MedicalEquipment) => void;
  onOpenStatusChange: (item: MedicalEquipment) => void;
  onViewDepartmentDetails?: (departmentName: string) => void;
  onViewAgencyTransactions?: (agencyName: string, item: MedicalEquipment) => void;
  onNavigateToApprovals?: (data: Partial<ApprovalApplication>) => void;
  onBorrowEquipment?: (item: MedicalEquipment) => void;
  onReturnEquipment?: (item: MedicalEquipment) => void;
  onPrintLoanVoucher?: (equipment: MedicalEquipment, loanRecord: EquipmentLoanRecord, mode: 'loan' | 'return') => void;
  onNavigateToRoi?: (equipmentId: string) => void;
  onOpenAiDimensionModal?: (item: MedicalEquipment, initialDimension?: string) => void;
  onNavigateToInspection?: (item: MedicalEquipment) => void;
  onReportAdverseEvent?: (item: MedicalEquipment) => void;
  onOpenOverdueFiling?: (item: MedicalEquipment) => void;
  onPrintQrLabel?: (item: MedicalEquipment) => void;
  onViewAcceptanceDossier?: (item: MedicalEquipment) => void;
  workOrders?: EngineeringWorkOrder[];
  allEquipment?: MedicalEquipment[];
  initialTab?: 'basic' | 'timeline' | 'roi' | 'repairs' | 'cost_analysis' | 'logs' | 'loans' | 'acceptance';
  onSaveEquipment?: (item: MedicalEquipment) => void;
  currentUser?: {
    name?: string;
    role?: string;
    department?: string;
    phone?: string;
  };
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  metrologyCatalogue,
  allEquipment,
  onClose,
  onOpenRepairForDevice,
  onOpenStatusChange,
  onViewDepartmentDetails,
  onViewAgencyTransactions,
  onNavigateToApprovals,
  onBorrowEquipment,
  onReturnEquipment,
  onPrintLoanVoucher,
  onNavigateToRoi,
  onOpenAiDimensionModal,
  onNavigateToInspection,
  onReportAdverseEvent,
  onOpenOverdueFiling,
  onPrintQrLabel,
  onViewAcceptanceDossier,
  workOrders: workOrdersProp,
  initialTab,
  onSaveEquipment,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'timeline' | 'roi' | 'repairs' | 'cost_analysis' | 'logs' | 'loans' | 'acceptance'>(initialTab || 'basic');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'repairs' && (equipment?.status === '故障待修' || equipment?.status === '维护保养中')) {
        setRepairSubTab('vendor_collab');
      }
    }
  }, [initialTab, equipment?.id]);

  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [acceptanceModalInitialTab, setAcceptanceModalInitialTab] = useState<
    'paper' | 'training_paper' | 'unboxing' | 'technical' | 'photos' | 'signoffs'
  >('paper');
  const [previewingReport, setPreviewingReport] = useState<ThirdPartyInspectionReport | null>(null);

  // 新机开箱验收档案数据
  const acceptanceDossier = useMemo(() => {
    if (!equipment) return null;
    return getEquipmentAcceptanceDossier(equipment);
  }, [equipment]);

  // 全屏最大化状态控制，适应海量医疗设备全景信息呈现
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 维修履历专用状态：流转追踪弹窗、打印弹窗与二级过滤
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<EngineeringWorkOrder | null>(null);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<EngineeringWorkOrder | null>(null);
  const [repairSubTab, setRepairSubTab] = useState<'all' | 'vendor_collab' | 'work_orders' | 'routine'>('all');

  // 获取与当前设备匹配的工单全集
  const allStoredOrders = useMemo(() => {
    if (workOrdersProp && workOrdersProp.length > 0) return workOrdersProp;
    try {
      return loadStoredWorkOrders();
    } catch {
      return [];
    }
  }, [workOrdersProp]);

  // 过滤出与本设备相关的工程维修派工单 (按 equipmentId / SN / 院内自编号 / 设备名)
  const deviceWorkOrders = useMemo(() => {
    if (!equipment) return [];
    return allStoredOrders.filter(order =>
      (order.equipmentId && order.equipmentId === equipment.id) ||
      (equipment.sn && order.equipmentSn === equipment.sn) ||
      (equipment.internalNo && order.internalNo && order.internalNo === equipment.internalNo) ||
      (equipment.name && order.equipmentName && order.equipmentName.includes(equipment.name))
    );
  }, [allStoredOrders, equipment]);

  // 统计具有临床评分的工单
  const ratedOrders = useMemo(() => {
    return deviceWorkOrders.filter(o => typeof o.ratingScore === 'number' && o.ratingScore > 0);
  }, [deviceWorkOrders]);

  const avgRating = useMemo(() => {
    if (ratedOrders.length === 0) return null;
    const total = ratedOrders.reduce((sum, o) => sum + (o.ratingScore || 0), 0);
    return (total / ratedOrders.length).toFixed(1);
  }, [ratedOrders]);

  const avgTimeliness = useMemo(() => {
    if (ratedOrders.length === 0) return null;
    const total = ratedOrders.reduce((sum, o) => sum + (o.ratingTimeliness || o.ratingScore || 5), 0);
    return (total / ratedOrders.length).toFixed(1);
  }, [ratedOrders]);

  const avgQuality = useMemo(() => {
    if (ratedOrders.length === 0) return null;
    const total = ratedOrders.reduce((sum, o) => sum + (o.ratingQuality || o.ratingScore || 5), 0);
    return (total / ratedOrders.length).toFixed(1);
  }, [ratedOrders]);

  const avgAttitude = useMemo(() => {
    if (ratedOrders.length === 0) return null;
    const total = ratedOrders.reduce((sum, o) => sum + (o.ratingAttitude || o.ratingScore || 5), 0);
    return (total / ratedOrders.length).toFixed(1);
  }, [ratedOrders]);

  // 当前是否存在正在进行中（未闭环）的派工维修工单
  const activeWorkOrder = useMemo(() => {
    return deviceWorkOrders.find(o => o.status !== 'closed');
  }, [deviceWorkOrders]);

  // 成本与报废阈值计算 (必须放置在所有条件 return 之前，遵守 React Hooks 规则)
  const devicePurchasePrice = useMemo(() => {
    return equipment ? estimateRealisticPurchasePrice(equipment) : 0;
  }, [equipment]);

  const deviceTotalRepairExpenditure = useMemo(() => {
    if (!equipment) return 0;
    const fromRecords = (equipment.repairRecords || []).reduce((sum, r) => sum + (r.cost || 0), 0);
    const fromOrders = deviceWorkOrders.reduce((sum, o) => {
      const isDupe = (equipment.repairRecords || []).some(r => r.id === o.id);
      return isDupe ? sum : sum + (o.totalRepairCost || 0);
    }, 0);
    return fromRecords + fromOrders;
  }, [equipment, deviceWorkOrders]);

  const repairPricePercent = useMemo(() => {
    if (!devicePurchasePrice || devicePurchasePrice <= 0) return 0;
    return Math.round((deviceTotalRepairExpenditure / devicePurchasePrice) * 100);
  }, [deviceTotalRepairExpenditure, devicePurchasePrice]);

  if (!equipment) return null;

  const roiProfile = calculateEquipmentFinancialProfile(equipment);
  const photoUrl = getEquipmentPhoto(equipment);
  const activeLoan = equipment.currentLoan && equipment.currentLoan.loanStatus !== 'returned' ? equipment.currentLoan : null;
  const loanProgress = activeLoan ? computeLoanTimeProgress(activeLoan.borrowTime, activeLoan.expectedReturnTime) : null;
  const isOverdue = activeLoan?.loanStatus === 'overdue' || (loanProgress?.isOverdue ?? false);
  const totalLoanRecords = (equipment.loanHistory?.length || 0) + (activeLoan ? 1 : 0);
  const totalLifecycleEvents = 
    (equipment.manufactureDate ? 1 : 0) +
    1 + // purchase / procurement
    (equipment.enableDate ? 1 : 0) + // commissioning
    (equipment.lastCalibrationDate ? 1 : 0) +
    (equipment.repairRecords?.length || 0) +
    totalLoanRecords +
    (equipment.statusLogs?.length || 0) +
    (equipment.status === '停用/报废' ? 1 : 0);

  const catInfo = resolveMainCategory(equipment.categoryNo, equipment.category, `${equipment.name || ''} ${equipment.level2Category || ''} ${equipment.level1Category || ''}`);
  const l1Info = resolveLevel1Category(equipment.level1No, equipment.level1Category, equipment.categoryNo);
  const l2Info = resolveLevel2Category(equipment.level2No, equipment.level2Category, equipment.level1No);

  const deptMaster = getDepartmentMasterInfo(equipment.department);
  const nursePhone = equipment.nursePhone || deptMaster.nursePhone;
  const repairCount = equipment.repairRecords?.length || equipment.repairCount || 0;
  const totalRepairCost = equipment.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
  const healthInfo = getEquipmentHealthScore(equipment);
  const maintenanceNode = getEquipmentMaintenanceNode(equipment);
  const validityInfo = getEquipmentValidityInfo(equipment);
  const calibrationInfo = getEquipmentCalibrationInfo(equipment, metrologyCatalogue);

  const isCostOverThreshold = repairPricePercent >= 50 || equipment.status === '停用/报废';
  const isCostNearThreshold = !isCostOverThreshold && repairPricePercent >= 35;

  // 状态色彩判定
  const getStatusBadge = () => {
    switch (equipment.status) {
      case '正常运行':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case '维护保养中':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case '故障待修':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center transition-all duration-150 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`bg-white shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in zoom-in duration-150 ${
        isFullscreen
          ? 'fixed inset-0 w-full h-full max-w-none max-h-none rounded-none z-50'
          : 'rounded-2xl w-full max-w-[96vw] xl:max-w-[1600px] 2xl:max-w-[1760px] max-h-[96vh] h-[96vh]'
      }`}>
        
        {/* ===================== 顶部主信息栏 (Header & Quick Actions) ===================== */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* 设备高清实物头像 */}
            <div
              onClick={() => setShowPhotoPreview(true)}
              className="w-14 h-14 rounded-xl bg-slate-900 overflow-hidden shrink-0 border-2 border-white shadow-md ring-2 ring-slate-200/90 cursor-pointer relative group/p transition hover:scale-105"
              title="点击放大查看高清实物照片"
            >
              <img
                src={photoUrl}
                alt={equipment.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover/p:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/p:opacity-100 flex items-center justify-center text-white transition backdrop-blur-[1px]">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            {/* 核心主标题、编号、状态与类别 */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">{equipment.name}</h2>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  资产编号: {equipment.assetNo || `ZC-2023-${equipment.id}`}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {equipment.assetOwnership || '医院自有'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border shadow-2xs ${getStatusBadge()}`}>
                  ● {equipment.status}
                </span>
                {validityInfo.dualBadge ? (
                  <div className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1">
                      <Hourglass className="w-3.5 h-3.5 text-amber-700" />
                      <span>超龄服役: +{validityInfo.yearsPast}年</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenOverdueFiling?.(equipment)}
                      className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1 transition cursor-pointer"
                      title="点击查看院内特许准用备案证书与72h稳定性合格检验结论"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                      <span>经整修与72h稳定性合格准用 (备案号: {validityInfo.dualBadge.filingNo})</span>
                    </button>
                  </div>
                ) : validityInfo.riskLevel === 'high' ? (
                  <button
                    type="button"
                    onClick={() => onOpenOverdueFiling?.(equipment)}
                    className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs flex items-center gap-1 transition cursor-pointer"
                    title="该设备已超期服役，点击发起整修与72h稳定性合格检测特许准用备案申请"
                  >
                    <Hourglass className="w-3.5 h-3.5" />
                    <span>超龄服役: +{validityInfo.yearsPast}年 · 待办准用备案</span>
                  </button>
                ) : null}
                {activeLoan && (
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border shadow-2xs ${
                    isOverdue ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isOverdue ? '🚨 借调超期' : '🔄 跨科借出中'}
                  </span>
                )}
              </div>

              {/* 关键溯源编码条 */}
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap font-mono">
                <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-bold shadow-2xs" title="出厂序列号 (SN - 核心唯一硬件标识)">
                  <span className="text-[10px] text-indigo-500 font-sans font-medium">SN:</span>
                  <span>{equipment.sn || equipment.id}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1.5">
                  <span>code_id:</span>
                  <strong className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">{equipment.codeId || `COD-${equipment.id}`}</strong>
                  {equipment.caoliaoUrl && (
                    <a
                      href={equipment.caoliaoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px] inline-flex items-center gap-1 transition"
                      title="打开草料云端官方活码"
                    >
                      <span>草料活码</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </span>
                {equipment.internalNo && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>科室内部编号: <strong className="text-amber-900 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono" title="临床科室区分同类设备及日常沟通报修使用（如：8号监护仪）">{equipment.internalNo}</strong></span>
                  </>
                )}
                <span className="text-slate-300">|</span>
                <span className="font-sans text-slate-600">
                  型号: <strong className="font-mono text-slate-800">{equipment.model || '-'}</strong>
                </span>
              </div>

              {/* 分类面包屑 */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 flex-wrap">
                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold text-[11px]">
                  [{catInfo.code}] {catInfo.name}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-slate-700 font-medium text-xs">
                  {l1Info.name}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold text-[11px]">
                  {l2Info.name}
                </span>
              </div>
            </div>
          </div>

          {/* 快捷动作按钮组 */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAiDimensionModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenAiDimensionModal(equipment);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="启动该设备的 AI 智能多维度交互研判与推演"
              >
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>AI 多维研判</span>
              </button>
            )}

            {onNavigateToInspection && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToInspection(equipment);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="进入手机手持终端进行扫码与在位核验"
              >
                <Smartphone className="w-4 h-4" />
                <span>移动巡检</span>
              </button>
            )}

            {equipment.status === '故障待修' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStatusChange(equipment);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="设备已完成现场检修与测试，点击修复故障并恢复正常运行"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>修复故障 · 恢复运行</span>
              </button>
            )}

            <button
              onClick={() => onOpenRepairForDevice(equipment)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>登记报修</span>
            </button>

            {onReportAdverseEvent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportAdverseEvent(equipment);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="针对该在用医疗设备发起不良事件初报与警戒直报"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>直报不良事件</span>
              </button>
            )}

            {activeLoan && onReturnEquipment && (
              <button
                onClick={() => {
                  onClose();
                  onReturnEquipment(equipment);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>办理归还</span>
              </button>
            )}

            {!activeLoan && onBorrowEquipment && (
              <button
                onClick={() => {
                  onClose();
                  onBorrowEquipment(equipment);
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>跨科借出</span>
              </button>
            )}

            {equipment.overdueFiling ? (
              <button
                type="button"
                onClick={() => onOpenOverdueFiling?.(equipment)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="查看超期设备特许准用备案证与72小时稳定性测试记录"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>准用备案档案</span>
              </button>
            ) : validityInfo.riskLevel === 'high' ? (
              <button
                type="button"
                onClick={() => onOpenOverdueFiling?.(equipment)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="该设备已达到或超出设计使用寿命，立即办理超期整修与72h稳定性合格特许准用备案"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>办超期准用备案</span>
              </button>
            ) : null}

            {onPrintQrLabel && (
              <button
                type="button"
                onClick={() => onPrintQrLabel(equipment)}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="打印该设备专属资产二维码与准用标识标签"
              >
                <QrCode className="w-4 h-4 text-slate-200" />
                <span>打印准用标签</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAcceptanceModal(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="查看国家三甲医院实体纸质开箱验收入库单 (A4多联高保真凭证)"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>开箱验收单</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded-lg transition cursor-pointer"
              title={isFullscreen ? "还原窗口大小" : "全屏最大化显示"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-lg transition cursor-pointer"
              title="关闭视窗"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================== 标签页导航栏 (Tab Nav) ===================== */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 sm:gap-8 text-sm font-medium overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'basic'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>全景台账档案</span>
          </button>

          <button
            onClick={() => setActiveTab('acceptance')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'acceptance'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>新机开箱验收档案</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              实体纸质单
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>全生命周期时间轴</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalLifecycleEvents}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roi')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'roi'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>单机成本效益与ROI</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {roiProfile.annualRoi}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('repairs')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'repairs'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4 text-blue-600" />
            <span>维修履历</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
              activeWorkOrder ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {(equipment.repairRecords || []).length + deviceWorkOrders.length}
            </span>
            {activeWorkOrder && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="该设备当前有在修工单" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('cost_analysis')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'cost_analysis'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>成本分析</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
              isCostOverThreshold
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : isCostNearThreshold
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {isCostOverThreshold ? '超阈值' : isCostNearThreshold ? '临界' : `${repairPricePercent}%`}
            </span>
            {isCostOverThreshold && (
              <span className="w-2 h-2 rounded-full bg-rose-500" title="累计维修已达报废/更新阈值" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('loans')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'loans'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-teal-600" />
            <span>跨科借调与流转轨迹</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
              activeLoan ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {totalLoanRecords}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>状态变动审计</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {(equipment.statusLogs || []).length}
            </span>
          </button>
        </div>

        {/* ===================== 内容主视窗 (Modal Body) ===================== */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/70 space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              
              {/* ---------------- 1. 核心关键指标 4 格看板 (KPI Strip) ---------------- */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* 1.1 使用科室与物理空间 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>使用科室与物理空间</span>
                    </span>
                    {equipment.department ? (
                      <button
                        type="button"
                        onClick={() => onViewDepartmentDetails?.(equipment.department)}
                        className="text-base font-bold text-slate-900 hover:text-blue-700 hover:underline mt-1.5 text-left truncate flex items-center gap-1 group"
                        title={`点击查看【${equipment.department}】全景资产`}
                      >
                        <span className="truncate">{equipment.department}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </button>
                    ) : (
                      <p className="text-base font-bold text-slate-900 mt-1.5">-</p>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between gap-1 flex-wrap font-medium">
                    <span className="flex items-center gap-1 truncate" title={equipment.location}>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {equipment.location || '科室指定存放点'}
                    </span>
                    {nursePhone && (
                      <a
                        href={`tel:${nursePhone}`}
                        className="text-blue-700 hover:underline font-mono text-[11px] flex items-center gap-0.5"
                        title="拨打护士站分机"
                      >
                        <Phone className="w-3 h-3 text-blue-600" />
                        {nursePhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* 1.2 购置原值与累计维保支出 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>购置原值与累计维保</span>
                    </span>
                    <p className="text-lg font-bold text-slate-900 mt-1.5 font-mono notranslate" translate="no">
                      ￥{equipment.purchasePrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-600 font-medium">
                    <span>累计报修: <strong className="text-slate-900 font-mono">{repairCount}</strong> 次</span>
                    <span className="text-amber-800 font-bold font-mono notranslate" translate="no">
                      支出 ￥{totalRepairCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 1.3 AI 健康综合评估得分 */}
                <div
                  onClick={() => setShowHealthModal(true)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  title="点击查看健康得分剖析与扣分归因明细卡片"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                      <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
                      <span>AI健康评估指数</span>
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                      <span>明细</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-sm font-bold border ${healthInfo.badgeBg}`}>
                      {healthInfo.score} 分
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {healthInfo.label}
                    </span>
                  </div>

                  <p className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate font-medium">
                    {healthInfo.deductions.length > 0
                      ? `首要关注: ${healthInfo.deductions[0].reason}`
                      : '各项临床运行指标良好'}
                  </p>
                </div>

                {/* 1.4 保养节点与校准时效 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>预防性维护(PM)节点</span>
                    </span>
                    <p className="text-base font-bold text-slate-900 mt-1.5 font-mono">
                      {maintenanceNode.nextDate || '按周期计划'}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                    <span className={`px-2 py-0.5 rounded text-[11px] border font-bold ${maintenanceNode.badgeClass}`}>
                      {maintenanceNode.statusTag}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      校准: {calibrationInfo.statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* ---------------- 1.5 全生命周期事件流直通横幅 (Lifecycle Fast-Track Banner) ---------------- */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white shadow-md border border-indigo-800/40 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white tracking-tight">全生命周期事件流与履历时间轴</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                        {totalLifecycleEvents} 个全流程节点存证
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      涵盖采购入库 ➔ 临床启用 ➔ 强检校准 ➔ 历次维修 ➔ 跨科借调 ➔ 状态审计 ➔ 退役鉴定的全闭环脉络。
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <span>查看全生命周期时间轴</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* ---------------- 2. 跨科室借调实时流转提示横幅 (若在借中则突出显示) ---------------- */}
              {activeLoan && loanProgress && (
                <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                  loanProgress.isOverdue ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-sm' :
                  loanProgress.colorTheme === 'approaching' ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm' :
                  'bg-blue-50/80 border-blue-200 text-slate-900 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${
                        loanProgress.isOverdue ? 'bg-rose-200 text-rose-900' : 
                        loanProgress.colorTheme === 'approaching' ? 'bg-amber-200 text-amber-900' :
                        'bg-blue-200 text-blue-900'
                      }`}>
                        <ArrowRightLeft className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900">
                            实物正在借用中 · 借调至【{activeLoan.borrowingDepartment}】
                          </h4>
                          {/* 核心需求：‘剩余使用天数’倒计时标签：过半黄色提醒、到期红色提醒 */}
                          <LoanCountdownBadge loan={activeLoan} variant="badge" className="font-bold text-xs" />
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          产权归属：<strong>{equipment.ownerDepartment || equipment.department}</strong> · 借用人：<strong>{activeLoan.borrowerName}</strong> {activeLoan.borrowerPhone && `(${activeLoan.borrowerPhone})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onReturnEquipment && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onReturnEquipment(equipment);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>办理归还验收</span>
                        </button>
                      )}
                      {onPrintLoanVoucher && (
                        <button
                          type="button"
                          onClick={() => onPrintLoanVoucher(equipment, activeLoan, 'loan')}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>交接单据</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 倒计时警示横幅 */}
                  {loanProgress.isOverdue ? (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs animate-pulse">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>借用期限已到期！已超期 {loanProgress.overdueFormatted}，请尽快联系【{activeLoan.borrowingDepartment}】归还或办理续借。</span>
                      </div>
                      <span className="font-mono text-rose-800 text-[11px] shrink-0">流转严重受阻</span>
                    </div>
                  ) : loanProgress.colorTheme === 'approaching' ? (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 font-bold text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>借调时间已过半（已用 {loanProgress.rawPercent}%）· 剩余使用天数: <strong className="text-amber-900 underline underline-offset-2">{loanProgress.remainingDaysFormatted}</strong>，请关注周转进度。</span>
                      </div>
                      <span className="font-mono text-amber-800 text-[11px] shrink-0">流转紧迫</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-100/60 border border-blue-200 text-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <Hourglass className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>剩余使用天数: <strong className="font-bold text-blue-900">{loanProgress.remainingDaysFormatted}</strong> (借用计划共 {loanProgress.totalFormatted})</span>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">周转正常</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-200/80 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">借调单号:</span>
                      <span className="font-mono font-bold text-slate-800">{activeLoan.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">借出时间:</span>
                      <span className="font-mono text-slate-800">{activeLoan.borrowTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">应归还时间:</span>
                      <span className={`font-mono font-bold ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>{activeLoan.expectedReturnTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">借用事由:</span>
                      <span className="text-slate-800 truncate block" title={activeLoan.borrowReason}>{activeLoan.borrowReason || '临床临时急用'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 3. 双翼专业卡片：法定计量检定 + 出厂寿命老龄化评估 ---------------- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 3.1 法定计量检定/校准合规档案 */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  calibrationInfo.statusType === 'overdue' ? 'bg-rose-50/80 border-rose-200 text-rose-950' :
                  calibrationInfo.statusType === 'due_soon' ? 'bg-purple-50/80 border-purple-200 text-purple-950' :
                  'bg-white border-slate-200 text-slate-800 shadow-2xs'
                }`}>
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-blue-600 shrink-0" />
                        <h4 className="font-bold text-sm text-slate-900">计量检定与法定校准档案</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${calibrationInfo.badgeClass}`}>
                        {calibrationInfo.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 py-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">管理类别:</span>
                        <span className="font-bold text-slate-900">{calibrationInfo.calibrationType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">费用政策:</span>
                        <span className={`font-bold ${
                          calibrationInfo.managementType === 'mandatory' ? 'text-emerald-700' : 'text-amber-800'
                        }`}>
                          {calibrationInfo.feePolicyLabel}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">证书编号:</span>
                        <span className="font-mono font-bold text-slate-800">{calibrationInfo.certificateNo || '未登记'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">检定/校准机构:</span>
                        {calibrationInfo.agency && calibrationInfo.agency !== '-' && calibrationInfo.agency !== '免检' ? (
                          <button
                            type="button"
                            onClick={() => onViewAgencyTransactions?.(calibrationInfo.agency, equipment)}
                            className="font-semibold text-blue-700 hover:underline flex items-center gap-0.5 truncate text-left cursor-pointer"
                            title={`查看【${calibrationInfo.agency}】往来档案`}
                          >
                            <span className="truncate">{calibrationInfo.agency}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </button>
                        ) : (
                          <span className="text-slate-700 font-medium">{calibrationInfo.agency}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">上次检定日期:</span>
                        <span className="font-mono font-semibold text-slate-800">{calibrationInfo.lastDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">到期截止日期:</span>
                        <span className="font-mono font-bold text-slate-900">{calibrationInfo.nextDate}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {calibrationInfo.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {calibrationInfo.catalogueCode ? `国家强检目录代码: ${calibrationInfo.catalogueCode}` : '医院自主等级评审质控'}
                    </span>
                    {calibrationInfo.isMandatory && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenRepairForDevice(equipment);
                        }}
                        className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>登记送检记录</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3.2 出厂设计寿命与老龄化评估 */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  validityInfo.riskLevel === 'high' ? 'bg-amber-50/80 border-amber-200 text-amber-950' :
                  'bg-white border-slate-200 text-slate-800 shadow-2xs'
                }`}>
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Hourglass className="w-4 h-4 text-amber-600 shrink-0" />
                        <h4 className="font-bold text-sm text-slate-900">设计寿命与老龄化服役评估</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        validityInfo.riskLevel === 'high' ? 'bg-amber-700 text-white' :
                        validityInfo.riskLevel === 'medium' ? 'bg-amber-600 text-white' :
                        'bg-emerald-600 text-white'
                      }`}>
                        {validityInfo.riskLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">生产日期 (出厂):</span>
                        <span className="font-mono font-bold text-slate-900">{validityInfo.manufactureDateStr}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">标称使用年限:</span>
                        <span className="font-mono font-bold text-slate-900">{validityInfo.validityYears ? `${validityInfo.validityYears} 年` : '未登记'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">设计到期时间:</span>
                        <span className="font-mono font-bold text-slate-900">{validityInfo.expirationDateStr}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {validityInfo.riskDescription}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[11px] text-slate-400">
                      依据原厂出厂标准核定
                    </span>
                    <div className="flex items-center gap-3">
                      {validityInfo.riskLevel === 'high' && !equipment.overdueFiling && onOpenOverdueFiling && (
                        <button
                          type="button"
                          onClick={() => onOpenOverdueFiling(equipment)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>办理超期准用备案</span>
                        </button>
                      )}
                      {validityInfo.riskLevel === 'high' && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenStatusChange(equipment);
                          }}
                          className="text-amber-800 hover:text-amber-950 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>申请老旧报废鉴定</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------- 3.3 超期服役整修与72小时稳定性合格特许准用档案卡 (若存在备案) ---------------- */}
              {equipment.overdueFiling && (
                <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-white rounded-xl border-2 border-emerald-500/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-emerald-950">
                            超期服役稳定性检测与特许准用备案档案
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ● 备案准用有效 (特许运行期)
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white text-emerald-900 border border-emerald-300">
                            备案凭证: {equipment.overdueFiling.filingNo}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          经医学装备管理委员会论证评定 · 深度整修与72小时满载稳定性检测合格 · 实行强化缩周期巡检
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onPrintQrLabel && (
                        <button
                          type="button"
                          onClick={() => onPrintQrLabel(equipment)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="打印带有准用绿标与72h稳定性合格认证的专属资产铭牌贴"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>打印特许准用标牌贴</span>
                        </button>
                      )}
                      {onOpenOverdueFiling && (
                        <button
                          type="button"
                          onClick={() => onOpenOverdueFiling(equipment)}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>查阅技术档案与报告</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                    {/* 模块1: 寿命与深度整修 */}
                    <div className="bg-white/80 p-3.5 rounded-lg border border-emerald-200/80">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                        <Wrench className="w-4 h-4 text-emerald-700" />
                        <span>核心部件深度整修与翻新</span>
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">原厂设计寿命:</span>
                          <span className="font-bold">{equipment.overdueFiling.originalLifespanYears} 年 (已超服役 {equipment.overdueFiling.overdueYears} 年)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">整修完成日期:</span>
                          <span className="font-mono font-medium">{equipment.overdueFiling.refurbishDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">整修实施单位:</span>
                          <span className="font-medium text-slate-900">{equipment.overdueFiling.refurbishProvider}</span>
                        </div>
                        <div className="pt-1 text-[11px] text-slate-600 line-clamp-2" title={equipment.overdueFiling.refurbishSummary}>
                          <span className="font-semibold text-slate-800">整修摘要: </span>{equipment.overdueFiling.refurbishSummary}
                        </div>
                      </div>
                    </div>

                    {/* 模块2: 72小时稳定性与电气安全 */}
                    <div className="bg-white/80 p-3.5 rounded-lg border border-emerald-200/80">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>72小时稳定性与电气安全检测</span>
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">连续工况测试:</span>
                          <span className="font-bold text-emerald-800 font-mono">{equipment.overdueFiling.continuousRunHours} 小时连续满载 (零故障)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">关键输出漂移:</span>
                          <span className="font-bold text-emerald-700 font-mono">{equipment.overdueFiling.driftRate} (优于国标)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">检测评定机构:</span>
                          <span className="font-medium text-slate-900 truncate" title={equipment.overdueFiling.stabilityTestAgency}>{equipment.overdueFiling.stabilityTestAgency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">报告凭证编号:</span>
                          <span className="font-mono text-slate-800">{equipment.overdueFiling.stabilityTestReportNo}</span>
                        </div>
                      </div>
                    </div>

                    {/* 模块3: 委员会论证批复与缩周期监管 */}
                    <div className="bg-white/80 p-3.5 rounded-lg border border-emerald-200/80">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-700" />
                        <span>委员会特许准用与风控监管</span>
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">特许准用截止日:</span>
                          <span className="font-bold font-mono text-emerald-900 underline underline-offset-2">{equipment.overdueFiling.validUntil}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">缩周期质控频次:</span>
                          <span className="font-bold text-amber-800">
                            {equipment.overdueFiling.monitoringFrequency === 'MONTHLY' ? '每月重点巡检 (缩周期)' :
                             equipment.overdueFiling.monitoringFrequency === 'BIWEEKLY' ? '双周强化巡检' : '每周重点巡检'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">审批公文批号:</span>
                          <span className="font-mono text-slate-800">{equipment.overdueFiling.approvalDocNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">监管责任工程师:</span>
                          <span className="font-bold text-slate-900">{equipment.overdueFiling.leadEngineer}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 模块4: 已归档第三方检验检测报告与整修凭证 (Third-Party Testing Reports & CMA Certificates) */}
                  {equipment.overdueFiling.reports && equipment.overdueFiling.reports.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-emerald-200/80">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>已归档第三方检测报告与法定资质证书 ({equipment.overdueFiling.reports.length} 份)</span>
                        </div>
                        <span className="text-[11px] text-emerald-800 font-medium">
                          具备国家 CMA 计量认证与 CNAS 认可机构签章
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {equipment.overdueFiling.reports.map((rep) => (
                          <div
                            key={rep.id}
                            className="bg-white/95 p-3 rounded-lg border border-emerald-200/90 hover:border-emerald-400 hover:shadow-2xs transition flex flex-col justify-between gap-2 text-xs"
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate" title={rep.fileName}>
                                  {rep.fileName}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                    {rep.reportTypeName.slice(0, 10)}
                                  </span>
                                  <span>{rep.fileSize}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-600 bg-slate-50/80 p-1.5 rounded font-mono truncate">
                              单号: {rep.reportNo}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[10.5px] text-emerald-700 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>资质核验有效</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => setPreviewingReport(rep)}
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>在线查验报告</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- 4. 结构化台账主明细表 (Categorized Master Data Matrix) ---------------- */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>设备全景技术台账与管理主数据</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">系统唯一ID: #{equipment.id}</span>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
                  
                  {/* 区块 1: 资产身份与溯源体系 */}
                  <div className="space-y-3 p-3.5 rounded-lg bg-blue-50/30 border border-blue-100">
                    <h4 className="font-bold text-slate-900 pb-1.5 border-b border-blue-200/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-blue-900">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        <span>资产身份与溯源</span>
                      </span>
                    </h4>
                    <div>
                      <span className="text-slate-500 block text-[11px]">资产编号 (Asset No.):</span>
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-xs inline-block mt-0.5">
                        {equipment.assetNo || `ZC-2023-${equipment.id}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">资产归属形式:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mt-0.5">
                        {equipment.assetOwnership || '医院自有'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">code_id (统一溯源码):</span>
                      <span className="font-mono text-slate-800 font-semibold mt-0.5 block">
                        {equipment.codeId || `COD-${equipment.id}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">科室内部编号 (临床报修/呼叫号):</span>
                      <span
                        className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5"
                        title="科室区分同类设备及日常沟通报修使用（如：8号监护仪出了什么问题）"
                      >
                        {equipment.internalNo || '未登记'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">出厂序列号 (SN):</span>
                      <span className="font-mono font-bold text-slate-900 mt-0.5 block">{equipment.sn || '-'}</span>
                    </div>
                  </div>

                  {/* 区块 2: 规格分类与制造信息 */}
                  <div className="space-y-3 p-3.5 rounded-lg bg-slate-50/70 border border-slate-200">
                    <h4 className="font-bold text-slate-900 pb-1.5 border-b border-slate-200 flex items-center gap-1.5 text-xs">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>规格型号与生产制造</span>
                    </h4>
                    <div>
                      <span className="text-slate-500 block text-[11px]">设备标准名称:</span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block">{equipment.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">规格型号:</span>
                      <span className="font-mono font-semibold text-slate-800 mt-0.5 block">{equipment.model || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">医疗器械分类代码 (NMPA):</span>
                      <span className="font-medium text-slate-900 font-mono text-[11.5px] mt-0.5 block">
                        [{catInfo.code}] {catInfo.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">二级品目类别:</span>
                      <span className="font-medium text-slate-900 text-[11.5px] mt-0.5 block">
                        [{l2Info.code}] {l2Info.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">生产制造厂商:</span>
                      {equipment.manufacturer && equipment.manufacturer !== '-' ? (
                        <button
                          type="button"
                          onClick={() => onViewAgencyTransactions?.(equipment.manufacturer, equipment)}
                          className="font-semibold text-blue-700 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer text-left"
                          title="查看厂家档案"
                        >
                          <span className="truncate">{equipment.manufacturer}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </button>
                      ) : (
                        <span className="font-medium text-slate-900 mt-0.5 block">{equipment.manufacturer || '-'}</span>
                      )}
                    </div>
                  </div>

                  {/* 区块 3: 科室归属与使用场所 */}
                  <div className="space-y-3 p-3.5 rounded-lg bg-emerald-50/30 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 pb-1.5 border-b border-emerald-200/60 flex items-center gap-1.5 text-xs text-emerald-950">
                      <Building className="w-3.5 h-3.5 text-emerald-700" />
                      <span>科室归属与使用场所</span>
                    </h4>
                    <div>
                      <span className="text-slate-500 block text-[11px]">使用科室:</span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                        {equipment.department || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">具体使用场所 (房间):</span>
                      <span className="font-semibold text-emerald-950 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-xs inline-block mt-0.5">
                        {equipment.usageLocation || equipment.location || '科室指定存放点'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">存放楼宇与楼层:</span>
                      <span className="font-medium text-slate-900 mt-0.5 block">
                        {equipment.building || deptMaster.building || '1号楼 综合楼'} · {equipment.floor ? `${equipment.floor}` : `${deptMaster.floor}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">护士站/抢救台分机:</span>
                      <span className="font-mono font-bold text-blue-700 mt-0.5 block">
                        {nursePhone || '未登记'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">设备管理责任人:</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {equipment.manager || deptMaster.manager || '崔工 (设备科)'}
                      </span>
                    </div>
                  </div>

                  {/* 区块 4: 资产财务与周期管理 */}
                  <div className="space-y-3 p-3.5 rounded-lg bg-amber-50/30 border border-amber-100">
                    <h4 className="font-bold text-slate-900 pb-1.5 border-b border-amber-200/60 flex items-center gap-1.5 text-xs text-amber-950">
                      <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                      <span>资产财务与周期</span>
                    </h4>
                    <div>
                      <span className="text-slate-500 block text-[11px]">设备资产原值:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm notranslate mt-0.5 block" translate="no">
                        ￥{equipment.purchasePrice.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">购置入库时间:</span>
                      <span className="font-mono font-bold text-slate-900 mt-0.5 block">{equipment.purchaseDate || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">临床正式启用日期:</span>
                      <span className="font-mono font-bold text-slate-900 mt-0.5 block">{equipment.enableDate || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">设计使用年限:</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {equipment.productValidity ? `${equipment.productValidity} 年` : '未标定'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">累计报修支出:</span>
                      <span className="font-mono font-bold text-amber-800 mt-0.5 block notranslate" translate="no">
                        ￥{totalRepairCost.toLocaleString()} ({repairCount}次)
                      </span>
                    </div>
                  </div>

                  {/* 区块 5: 新机入库开箱与综合验收纸质凭据 (实体档案) */}
                  {acceptanceDossier && (
                    <div className="sm:col-span-2 space-y-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white shadow-xs border border-slate-700">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-700/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                            <FileCheck2 className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                              <span>新机到货开箱与安装调试验收档案</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-semibold">
                                高保真 A4 纸质多联档案
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              国家三甲医院法定验收凭据 · 包含开箱清点明细、电气安全实测、临床培训记录与五方联合签章
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAcceptanceModal(true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="调阅或打印高保真实体纸质四联验收单"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>查看实体纸质验收单 (A4凭据)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('acceptance')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-slate-700"
                          >
                            <span>查阅深度开箱档案</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 验收关键凭据速览网格 */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">法定验收单号:</span>
                          <span className="font-mono font-bold text-emerald-300 block mt-0.5">
                            {acceptanceDossier.acceptanceNo}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">验收竣工时间:</span>
                          <span className="font-mono font-bold text-slate-200 block mt-0.5">
                            {acceptanceDossier.acceptanceDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">NMPA注册证核验:</span>
                          <span className="font-mono text-slate-200 block mt-0.5 truncate" title={acceptanceDossier.registrationCertNo}>
                            {acceptanceDossier.registrationCertNo}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">开箱核验与三证结论:</span>
                          <span className="text-emerald-400 font-bold block mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                            <span>全部合格 ({acceptanceDossier.unboxingItems.length}项附件)</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">电气安全检测 (GB 9706.1):</span>
                          <span className="text-emerald-400 font-bold block mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                            <span>合格 (对地/外壳漏电流达标)</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">带载负荷试运行:</span>
                          <span className="text-slate-200 font-medium block mt-0.5">
                            72小时连续带载无故障
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">临床应用操作培训:</span>
                          <span className="text-slate-200 font-medium block mt-0.5">
                            4名骨干全员考核通过 (8学时)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">五方联合会签印章:</span>
                          <span className="text-amber-300 font-bold block mt-0.5">
                            厂商/工程/临床/科长/财务已全签
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* ---------------- Tab: 全生命周期时间轴 (Lifecycle Timeline) ---------------- */}
          {activeTab === 'timeline' && (
            <EquipmentLifecycleTimeline
              equipment={equipment}
              metrologyCatalogue={metrologyCatalogue}
              onOpenRepair={onOpenRepairForDevice}
              onOpenStatusChange={onOpenStatusChange}
              onPrintLoanVoucher={onPrintLoanVoucher}
              onPrintAcceptanceDossier={() => setShowAcceptanceModal(true)}
            />
          )}

          {/* ---------------- Tab: 单机成本效益与ROI (ROI & Cost-Benefit) ---------------- */}
          {activeTab === 'roi' && (
            <div className="space-y-5">
              {/* 顶部经济效益总览卡片 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Coins className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800">单机全生命周期成本效益与投资回报分析</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${roiProfile.badgeClass}`}>
                          {roiProfile.quadrantLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        基于资产原值、年折旧计提、历史维保配件支出、临床人次收费及专用耗材测算
                      </p>
                    </div>
                  </div>

                  {onNavigateToRoi && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToRoi(equipment.id);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-300" />
                      <span>进入全院ROI决策看板与推演沙盘</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 核心指标 4 宫格 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">设备核算原值</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5 font-mono notranslate" translate="no">
                      ￥{roiProfile.purchasePrice.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">已服役 {roiProfile.serviceYears} 年 / {roiProfile.depreciationYears} 年折旧期</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">年度业务创收</span>
                    <p className="text-base font-bold text-emerald-600 mt-0.5 font-mono notranslate" translate="no">
                      ￥{roiProfile.annualGrossRevenue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">月均 {roiProfile.monthlyExaminations} 人次 · ￥{roiProfile.unitPrice}/次</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">年度净现金收益</span>
                    <p className={`text-base font-bold mt-0.5 font-mono notranslate ${roiProfile.annualNetProfit >= 0 ? 'text-amber-600' : 'text-rose-600'}`} translate="no">
                      {roiProfile.annualNetProfit >= 0 ? '+' : ''}￥{roiProfile.annualNetProfit.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">年化 ROI: <span className="font-bold text-slate-700">{roiProfile.annualRoi}%</span></p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">保本月均工作量</span>
                    <p className="text-base font-bold text-indigo-600 mt-0.5 font-mono">
                      {roiProfile.breakEvenMonthlyVolume} <span className="text-xs text-indigo-400 font-normal">人次/月</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">负荷利用率: <span className="font-bold text-slate-700">{roiProfile.capacityUtilization}%</span></p>
                  </div>
                </div>
              </div>

              {/* 成本要素拆解与投资回收进度 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 成本结构 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>年度运营全成本结构拆解</span>
                    <span className="font-mono text-slate-500 notranslate" translate="no">年总成本: ￥{roiProfile.annualTotalCost.toLocaleString()}</span>
                  </h5>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>1. 设备折旧计提 (直线法)</span>
                        <span className="font-mono font-bold notranslate" translate="no">￥{roiProfile.annualDepreciation.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((roiProfile.annualDepreciation / roiProfile.annualTotalCost) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>2. 维保保养与配件更换</span>
                        <span className="font-mono font-bold text-amber-700 notranslate" translate="no">￥{roiProfile.annualMaintenanceCost.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((roiProfile.annualMaintenanceCost / roiProfile.annualTotalCost) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>3. 专用耗材与试剂</span>
                        <span className="font-mono font-bold notranslate" translate="no">￥{roiProfile.annualConsumableCost.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.round((roiProfile.annualConsumableCost / roiProfile.annualTotalCost) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>4. 能耗动力、场地与人工工时</span>
                        <span className="font-mono font-bold notranslate" translate="no">￥{(roiProfile.annualUtilitiesAndSpace + roiProfile.annualLaborCost).toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(((roiProfile.annualUtilitiesAndSpace + roiProfile.annualLaborCost) / roiProfile.annualTotalCost) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 投资回收与管理建议 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                      投资回收周期与经济评价
                    </h5>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">累计回本进度：</span>
                        <span className="font-bold text-emerald-700">{roiProfile.paybackProgressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${roiProfile.paybackProgressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>已服役 {roiProfile.serviceYears} 年</span>
                        <span>投资回收期 {roiProfile.paybackYears} 年</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs">
                    <p className="font-bold text-emerald-900 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>医学装备经济运行建议：</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      {roiProfile.managementAdvice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- Tab 2: 维修履历 (Repairs & Work Orders) ---------------- */}
          {activeTab === 'repairs' && (
            <div className="space-y-4">
              {/* 顶部指标统计栏 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 指标 1: 累计履历次数 */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-2xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>累计维保与工单数</span>
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {(equipment.repairRecords || []).length + deviceWorkOrders.length}
                    </span>
                    <span className="text-xs text-slate-500">次</span>
                  </div>
                  <p className="text-2xs text-slate-400 mt-0.5 truncate">
                    {deviceWorkOrders.length} 张工程派工单 · {(equipment.repairRecords || []).length} 条常规维保
                  </p>
                </div>

                {/* 指标 2: 当前工单状态 */}
                <div className={`p-3 rounded-xl border shadow-2xs ${
                  activeWorkOrder 
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <span className="text-2xs font-semibold flex items-center gap-1 mb-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>当前工单流转状态</span>
                  </span>
                  {activeWorkOrder ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-xs font-bold text-amber-900">
                          在修中 ({activeWorkOrder.id})
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                          {activeWorkOrder.status === 'pending_dispatch' ? '待指派' :
                           activeWorkOrder.status === 'dispatched' ? '已派单' :
                           activeWorkOrder.status === 'arrived_inspecting' ? '现场排查中' :
                           activeWorkOrder.status === 'waiting_parts' ? '待配件' :
                           activeWorkOrder.status === 'repaired_pending_acceptance' ? '待临床验收' : '作业中'}
                        </span>
                        <button
                          onClick={() => setSelectedTrackingOrder(activeWorkOrder)}
                          className="text-2xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                        >
                          流转追踪 &gt;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-800">全部工单已闭环</span>
                      </div>
                      <p className="text-2xs text-slate-400 mt-0.5 truncate">
                        设备当前运行状态良好，无未结工单
                      </p>
                    </div>
                  )}
                </div>

                {/* 指标 3: 工程师综合服务评分 */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-2xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>工程师服务评分</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-amber-900">
                        {avgRating || '5.0'}
                      </span>
                      <span className="text-2xs text-amber-700">/ 5.0</span>
                    </div>
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star key={st} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5 font-mono">
                    <span>时效 {avgTimeliness || '5.0'}★</span>
                    <span>质量 {avgQuality || '5.0'}★</span>
                    <span>态度 {avgAttitude || '5.0'}★</span>
                  </div>
                </div>

                {/* 指标 4: 累计维保支出 */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-2xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>累计维保支出费用</span>
                  </span>
                  <div className="flex items-baseline gap-1 font-mono text-slate-900">
                    <span className="text-sm font-semibold">￥</span>
                    <span className="text-xl font-bold">
                      {(
                        deviceWorkOrders.reduce((sum, w) => sum + (w.totalRepairCost || 0), 0) +
                        (equipment.repairRecords || []).reduce((sum, r) => sum + (r.cost || 0), 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-400 mt-0.5 truncate">
                    包含原厂配件、自维备件与外包工时
                  </p>
                </div>
              </div>

              {/* 过滤切换栏与新建操作 */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setRepairSubTab('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      repairSubTab === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    全部履历 ({(equipment.repairRecords || []).length + deviceWorkOrders.length})
                  </button>
                  <button
                    onClick={() => setRepairSubTab('vendor_collab')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      repairSubTab === 'vendor_collab'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 font-bold'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>外协维保协同与验收复核</span>
                    {(equipment.status === '故障待修' || activeWorkOrder) && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>
                  <button
                    onClick={() => setRepairSubTab('work_orders')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                      repairSubTab === 'work_orders'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>工程派工单 ({deviceWorkOrders.length})</span>
                    {activeWorkOrder && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setRepairSubTab('routine')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      repairSubTab === 'routine'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    常规维保/巡检档案 ({(equipment.repairRecords || []).length})
                  </button>
                </div>

                <button
                  onClick={() => onOpenRepairForDevice(equipment)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>登记新维修工单</span>
                </button>
              </div>

              {/* 外协协同进度、阶段性反馈与临床复核验收专区 */}
              {(repairSubTab === 'vendor_collab' || repairSubTab === 'all') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>外协单位维保协同进度、阶段性技术反馈与科室复核验收</span>
                    </span>
                    <span className="text-2xs text-slate-400">
                      原厂技术方案 · 备件专车直配 · 现场试机临床复核闭环
                    </span>
                  </div>
                  <VendorCollaborationRepairTracker
                    equipment={equipment}
                    workOrders={deviceWorkOrders}
                    onUpdateEquipment={onSaveEquipment}
                    currentUser={currentUser}
                  />
                </div>
              )}

              {/* 空数据提示 */}
              {((equipment.repairRecords || []).length === 0 && deviceWorkOrders.length === 0 && repairSubTab !== 'vendor_collab' && repairSubTab !== 'all') ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 text-sm">该设备暂无历史维修或派工记录</p>
                  <p className="text-slate-400 text-xs mt-1">设备运行状况良好，定期预防性维护执行正常。</p>
                  <button
                    onClick={() => onOpenRepairForDevice(equipment)}
                    className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-200 transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>若设备发生异常，点击发起故障报修</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* ====== 1. 调度派工单列表 (含步骤条流转状态、责任工程师、临床评价与打分) ====== */}
                  {(repairSubTab === 'all' || repairSubTab === 'work_orders') && deviceWorkOrders.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          <span>维修派工单及实时状态流转 ({deviceWorkOrders.length})</span>
                        </span>
                        <span className="text-2xs text-slate-400">
                          点击步骤条节点可直接唤起全流程追踪时间轴
                        </span>
                      </div>

                      {deviceWorkOrders.map((order) => {
                        const isClosed = order.status === 'closed';
                        const isPendingAccept = order.status === 'repaired_pending_acceptance';

                        return (
                          <div
                            key={order.id}
                            className={`bg-white p-4 rounded-xl border transition-all shadow-2xs space-y-3.5 ${
                              !isClosed
                                ? 'border-indigo-300 ring-1 ring-indigo-200/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* 工单卡片头部 */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {order.id}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-2xs font-bold border ${
                                  order.priority === 'P1_CRITICAL'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : order.priority === 'P2_URGENT'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-blue-100 text-blue-800 border-blue-300'
                                }`}>
                                  {order.priority === 'P1_CRITICAL' ? 'P1 特急 / 急救支持' :
                                   order.priority === 'P2_URGENT' ? 'P2 紧急 / 关键医技' : 'P3 普通工单'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {order.workOrderType === 'emergency_breakdown' ? '紧急故障维修' :
                                   order.workOrderType === 'routine_pm' ? '定期预防性保养' : '日常巡检维护'}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                  报修于 {order.reportTime}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {order.totalDowntimeHours ? (
                                  <span className="text-2xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                    累计停机: <strong className="text-slate-800">{order.totalDowntimeHours}h</strong>
                                  </span>
                                ) : null}
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  isClosed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isPendingAccept
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isClosed ? '已验收闭环' :
                                   isPendingAccept ? '待临床验收' :
                                   order.status === 'pending_dispatch' ? '待指派调度' : '工程师作业中'}
                                </span>
                              </div>
                            </div>

                            {/* 4步流转步骤条 WorkOrderStepBar */}
                            <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-150">
                              <WorkOrderStepBar
                                status={order.status}
                                size="sm"
                                showSubStatus={true}
                                onStepClick={() => setSelectedTrackingOrder(order)}
                              />
                            </div>

                            {/* 故障现象与分析 */}
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-500 font-semibold shrink-0">故障现象:</span>
                                <span className="text-slate-800 font-medium">{order.faultDescription}</span>
                              </div>
                              {order.faultAnalysis && (
                                <div className="flex items-start gap-2">
                                  <span className="text-slate-500 font-semibold shrink-0">检测定位:</span>
                                  <span className="text-slate-700">{order.faultAnalysis}</span>
                                </div>
                              )}
                              {order.repairAction && (
                                <div className="flex items-start gap-2">
                                  <span className="text-slate-500 font-semibold shrink-0">修复措施:</span>
                                  <span className="text-slate-700">{order.repairAction}</span>
                                </div>
                              )}
                            </div>

                            {/* 工程师、费用与零备件明细网格 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-2xs">责任工程师</span>
                                <strong className="text-slate-800 font-medium">
                                  {order.assignedEngineerName || '调度待指派'}
                                </strong>
                                {order.assignedEngineerPhone && (
                                  <span className="block text-2xs text-slate-400 font-mono">{order.assignedEngineerPhone}</span>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-400 block text-2xs">技术班组 / 响应耗时</span>
                                <strong className="text-slate-800 font-medium">{order.biomedicalGroup || '医学工程科'}</strong>
                                <span className="block text-2xs text-indigo-600 font-mono">
                                  {order.responseTimeMinutes ? `响应 ${order.responseTimeMinutes} 分钟` : '快速响应'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-2xs">维修总支出</span>
                                <strong className="text-slate-900 font-mono text-sm notranslate" translate="no">
                                  ￥{(order.totalRepairCost || 0).toLocaleString()}
                                </strong>
                                <span className="block text-2xs text-slate-400 font-mono">工时 {order.laborHours || 0}h</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-2xs">更换备件</span>
                                <strong className="text-slate-800 font-medium truncate block" title={
                                  order.partsReplaced && order.partsReplaced.length > 0
                                    ? order.partsReplaced.map(p => `${p.partName} x${p.quantity}`).join('、')
                                    : '无配件更换'
                                }>
                                  {order.partsReplaced && order.partsReplaced.length > 0
                                    ? order.partsReplaced.map(p => `${p.partName}${p.quantity > 1 ? ` x${p.quantity}` : ''}`).join('、')
                                    : '无更换备件'}
                                </strong>
                                <span className="block text-2xs text-slate-400 font-mono">
                                  质检自检: {order.electricalSafetyPassed ? '电安PASS' : '合格'}
                                </span>
                              </div>
                            </div>

                            {/* ⭐⭐⭐ 核心重点：工程师评分与临床科室服务评价专区 ⭐⭐⭐ */}
                            {order.ratingScore ? (
                              <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-50/80 p-3 rounded-xl border border-amber-200/90 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center text-amber-500">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= (order.ratingScore || 5)
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-amber-200'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs font-bold text-amber-900 font-mono">
                                      {order.ratingScore}.0分
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-200/70 text-amber-900 border border-amber-300">
                                      临床验收极佳满意
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-2xs text-amber-900 font-medium">
                                    <span>响应时效: <strong className="font-mono text-amber-950">{order.ratingTimeliness || 5}★</strong></span>
                                    <span>修复质量: <strong className="font-mono text-amber-950">{order.ratingQuality || 5}★</strong></span>
                                    <span>服务态度: <strong className="font-mono text-amber-950">{order.ratingAttitude || 5}★</strong></span>
                                  </div>
                                </div>

                                {order.clinicalFeedback && (
                                  <div className="flex items-start gap-2 text-xs text-amber-950">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="italic text-amber-900 leading-relaxed">
                                      “{order.clinicalFeedback}”
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between text-2xs text-amber-800/90 pt-0.5 font-medium">
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                                    <span>
                                      临床验收签字人: <strong className="text-amber-950">{order.acceptanceStaffName || '临床负责人'}</strong> ({order.acceptanceStaffRole || '科室经办'})
                                    </span>
                                    {order.acceptanceSignature && (
                                      <span className="text-emerald-700 font-mono">· 电子验签存证已上链</span>
                                    )}
                                  </div>
                                  {order.acceptanceTime && (
                                    <span className="font-mono text-amber-700">验收时间: {order.acceptanceTime}</span>
                                  )}
                                </div>
                              </div>
                            ) : isPendingAccept ? (
                              <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-sky-600 animate-spin" />
                                  <span className="font-medium">
                                    工程师现场已修复并完成质检定标，等待使用科室护士长/医生试机核验与服务打分
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-sky-200/80 text-sky-900 text-2xs font-bold font-mono">
                                  待科室评分
                                </span>
                              </div>
                            ) : (
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                  <span>工单处于推进作业中，待工程师现场修复完成试机后，由临床科室进行验收评分</span>
                                </span>
                                <span className="text-2xs text-slate-400 font-mono">SLA时效闭环中</span>
                              </div>
                            )}

                            {/* 卡片底部操作按钮：直接打开追踪和打印，不用离开详情弹窗 */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRepairSubTab('vendor_collab')}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="查看该工单对应的外协单位协同进度、阶段性技术反馈与验收复核"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>外协协同进度 · 验收复核</span>
                                </button>
                                <button
                                  onClick={() => setSelectedPrintOrder(order)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                                  title="打印标准医学工程A4维修工程单"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                                  <span>打印工程单</span>
                                </button>
                              </div>

                              <button
                                onClick={() => setSelectedTrackingOrder(order)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                title="打开工单全景流转追踪与各节点详情"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>实时流转追踪看板</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ====== 2. 常规维保/巡检历史记录列表 ====== */}
                  {(repairSubTab === 'all' || repairSubTab === 'routine') && (equipment.repairRecords || []).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>常规维保、预防性保养及校准档案 ({(equipment.repairRecords || []).length})</span>
                        </span>
                        <span className="text-2xs text-slate-400">
                          历史台账自维记录与原厂定期巡检存档
                        </span>
                      </div>

                      {equipment.repairRecords?.map((record) => (
                        <div key={record.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                record.repairType === '紧急故障维修' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {record.repairType}
                              </span>
                              <span className="font-mono text-xs text-slate-400">{record.id}</span>
                              <span className="text-xs text-slate-500 font-medium">{record.faultDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                <span>质检验收合格 (5.0★)</span>
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                record.status === '已完成' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {record.status}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-800 font-medium">
                            故障现象/事由: <span className="text-slate-700">{record.faultDescription}</span>
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                            <div>维保工程师: <strong className="text-slate-800">{record.technician}</strong></div>
                            <div>维修支出: <strong className="text-slate-900 font-mono notranslate" translate="no">￥{(record.cost || 0).toLocaleString()}</strong></div>
                            <div>更换配件: <strong className="text-slate-800">{record.partsReplaced || '无'}</strong></div>
                            <div>完成日期: <strong className="text-slate-800 font-mono">{record.completionDate || '推进中'}</strong></div>
                          </div>

                          <p className="text-xs text-slate-600 pt-1">
                            <strong>修复方案与结论:</strong> {record.resolution}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---------------- 成本分析与报废/更新阈值评估选项卡 (Cost Analysis & Scrap Threshold) ---------------- */}
          {activeTab === 'cost_analysis' && (
            <EquipmentCostAnalysisTab
              equipment={equipment}
              deviceWorkOrders={deviceWorkOrders}
              allEquipment={allEquipment}
              onNavigateToApprovals={onNavigateToApprovals}
              onNavigateToRoi={(eqId) => {
                setActiveTab('roi');
                if (onNavigateToRoi) {
                  onNavigateToRoi(eqId);
                }
              }}
              onCloseModal={onClose}
            />
          )}

          {/* ---------------- Tab 3: 状态变动审计 (Logs) ---------------- */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">运行状态变动审计日志（实时追踪全生命周期轨迹）：</p>
              {(!equipment.statusLogs || equipment.statusLogs.length === 0) ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                  暂无状态变更履历。
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-4 ml-3 space-y-4 py-2">
                  {equipment.statusLogs.map((log) => (
                    <div key={log.id} className="relative bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="absolute -left-6 top-4 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>{log.timestamp}</span>
                        <span className="text-slate-600">操作人: {log.operator}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-medium">
                        <span className="text-slate-500">{log.oldStatus}</span>
                        <span className="text-slate-400">➔</span>
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{log.newStatus}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5">
                        变更原因/工单: {log.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- Tab 4: 跨科借调与流转档案 (Loans) ---------------- */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                    <span>跨科室借调流转与资产监管档案</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    产权科室：<strong className="text-slate-800">{equipment.ownerDepartment || equipment.department}</strong> · 记录所有外借借出、归还验收、配件交接及超期预警
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!activeLoan && onBorrowEquipment && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onBorrowEquipment(equipment);
                      }}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>登记外借出借</span>
                    </button>
                  )}
                  {activeLoan && onReturnEquipment && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onReturnEquipment(equipment);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>办理归还验收</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 当前借出中卡片 */}
              {activeLoan && (
                <div className={`p-4 rounded-xl border ${
                  isOverdue ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-sm' : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between border-b border-amber-300/60 pb-2.5 mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-amber-300">
                        借调单号: {activeLoan.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isOverdue ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-900 border border-amber-300'
                      }`}>
                        {isOverdue ? '🚨 超期未还 (逾期告警)' : '🔄 跨科借用在用中'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span>出借经办人: <strong>{activeLoan.lenderName || activeLoan.recordedBy || '设备管理员'}</strong></span>
                      {onPrintLoanVoucher && (
                        <button
                          type="button"
                          onClick={() => onPrintLoanVoucher(equipment, activeLoan, 'loan')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-md shadow-2xs transition-colors cursor-pointer"
                          title="查看电子交接流转单 (无纸化数字存证)"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>电子交接单</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">借入使用科室:</span>
                      <strong className="text-slate-900 text-sm font-bold">{activeLoan.borrowingDepartment}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">借用人 / 经手人:</span>
                      <span className="text-slate-900 font-semibold">{activeLoan.borrowerName}</span>
                      {activeLoan.borrowerPhone && <span className="font-mono text-slate-600 block text-[11px]">{activeLoan.borrowerPhone}</span>}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">借出时间:</span>
                      <span className="font-mono text-slate-800">{activeLoan.borrowTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">应归还时间:</span>
                      <span className={`font-mono font-bold text-sm ${isOverdue ? 'text-rose-700' : 'text-slate-900'}`}>
                        {activeLoan.expectedReturnTime}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-amber-300/40 text-xs flex flex-col gap-1.5">
                    <div>
                      <span className="text-slate-600 font-semibold">借用事由: </span>
                      <span className="text-slate-800">{activeLoan.borrowReason}</span>
                    </div>
                    {((activeLoan.accessories && activeLoan.accessories.length > 0) || (activeLoan.accessoriesList && activeLoan.accessoriesList.length > 0)) && (
                      <div>
                        <span className="text-slate-600 font-semibold">随借配件清单: </span>
                        <span className="bg-white/90 px-2 py-0.5 rounded border border-amber-200 text-slate-800 font-medium text-[11px]">
                          {(activeLoan.accessories || activeLoan.accessoriesList || []).join('、')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 历史归档记录列表 */}
              <div className="space-y-2.5">
                <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>历史借还与交接归档记录 ({equipment.loanHistory?.length || 0})</span>
                </h5>

                {(!equipment.loanHistory || equipment.loanHistory.length === 0) ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                    暂无历史已归还的借调记录。
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {equipment.loanHistory.map((rec) => (
                      <div key={rec.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1 border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                              {rec.id}
                            </span>
                            <span className="font-bold text-slate-900">
                              借至【{rec.borrowingDepartment}】
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              ✅ 已归还
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">
                              归还: {rec.actualReturnTime}
                            </span>
                            {onPrintLoanVoucher && (
                              <button
                                type="button"
                                onClick={() => onPrintLoanVoucher(equipment, rec, 'return')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition-colors cursor-pointer"
                                title="查看电子闭环交接结案单 (已自动完成云端存证)"
                              >
                                <FileCheck2 className="w-3 h-3 text-emerald-600" />
                                <span>电子闭环单</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">借用人:</span>
                            <span className="font-medium text-slate-800">{rec.borrowerName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">借用周期:</span>
                            <span className="font-mono text-slate-700">{rec.borrowTime.slice(0, 10)} ~ {rec.actualReturnTime?.slice(0, 10)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">验收接收人:</span>
                            <span className="font-medium text-slate-800">{rec.returnReceiverName || '科室管理员'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">归还验收结论:</span>
                            <span className="font-medium text-emerald-700">{rec.returnNotes || rec.returnConditionNotes || '完好无损，附件齐全'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- Tab: 新机到货开箱与安装综合验收档案 (New Inbound Acceptance Dossier) ---------------- */}
          {activeTab === 'acceptance' && acceptanceDossier && (
            <div className="space-y-6">
              {/* 1. 顶部操作与实体纸质单据快速呼出横幅 */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white shadow-md border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ★ 法定新机入库综合凭据
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      验收单号: {acceptanceDossier.acceptanceNo}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      竣工日期: {acceptanceDossier.acceptanceDate}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>{equipment.name} 到货开箱验收与投用技术档案</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    按照国家医疗器械临床使用安全准入与固定资产管理规范，建立涵盖“资质三证核查、开箱实物核验、GB 9706.1 电气安全与技术参数实测、临床人员培训、五方联合签署”全闭环实体纸质档案。
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptanceModalInitialTab('paper');
                      setShowAcceptanceModal(true);
                    }}
                    className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                    title="调用 A4 纸张排版打印或导出多联验收入库单"
                  >
                    <Printer className="w-4 h-4" />
                    <span>打印 A4 验收入库单 (一式四联)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAcceptanceModalInitialTab('training_paper');
                      setShowAcceptanceModal(true);
                    }}
                    className="px-3.5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                    title="调用 A4 纸张排版打印或导出带现场照片的临床培训考核交接单"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>打印 A4 培训交接单 (带现场照片)</span>
                  </button>
                </div>
              </div>

              {/* 2. 四大关键环节综合达标指标 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>三证资质审查</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    合法合规
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate" title={acceptanceDossier.registrationCertNo}>
                    {acceptanceDossier.registrationCertNo}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>开箱清点查验</span>
                    <Package className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {acceptanceDossier.unboxingItems.length} 项物品实收
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    无缺件 / 防震封条完好
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>电气安全与性能</span>
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {acceptanceDossier.technicalTests.length} 项实测合格
                  </div>
                  <span className="text-[11px] text-blue-700 font-medium block">
                    GB 9706.1 / 72h带载试运行
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>多方联签归档</span>
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    五方联合签章
                  </div>
                  <span className="text-[11px] text-purple-700 font-medium block">
                    厂商/医学工程/临床/科长/财务
                  </span>
                </div>
              </div>

              {/* 3. 商务立项与法定技术准入明细表 (标头置顶) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      仪器设备商务立项与法定技术准入明细表
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    采购方式: <strong>{acceptanceDossier.procurementMethod}</strong>
                  </span>
                </div>
                <div className="overflow-x-auto border-t border-slate-200 space-y-3 p-3 bg-slate-50/30">
                  {/* 分项 1: 设备身份与准入证照信息 */}
                  <table className="min-w-[880px] w-full border-collapse text-xs sm:text-[13px] text-left bg-white border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2.5">设备名称与型号</th>
                        <th className="p-2.5">生产制造厂商</th>
                        <th className="p-2.5">序列号 (SN)</th>
                        <th className="p-2.5">医疗器械注册证号</th>
                        <th className="p-2.5">出厂质检合格证</th>
                        <th className="p-2.5 text-right">购置入账总值</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="p-2.5 font-bold text-slate-900">
                          {equipment.name}
                          <span className="block font-mono text-xs text-slate-600 font-normal">{equipment.model}</span>
                        </td>
                        <td className="p-2.5 text-slate-700">{equipment.manufacturer || '原厂原装正品'}</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-900">{equipment.sn}</td>
                        <td className="p-2.5 font-mono text-slate-700">{acceptanceDossier.registrationCertNo}</td>
                        <td className="p-2.5 font-mono text-slate-700">{acceptanceDossier.qualityInspectionCertNo}</td>
                        <td className="p-2.5 font-mono font-bold text-red-700 text-right">
                          ￥{(equipment.purchasePrice || 0).toLocaleString()} 元
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 分项 2: 供货配送与就位质保信息 */}
                  <table className="min-w-[880px] w-full border-collapse text-xs sm:text-[13px] text-left bg-white border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2.5">中标供货企业</th>
                        <th className="p-2.5">发票代码及号码</th>
                        <th className="p-2.5">配属科室</th>
                        <th className="p-2.5">具体就位地点</th>
                        <th className="p-2.5">整机质保承诺</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="p-2.5 font-medium text-slate-800">{equipment.supplier || '中标指定配送机构'}</td>
                        <td className="p-2.5 font-mono text-slate-700">{acceptanceDossier.invoiceCode} / No.{acceptanceDossier.invoiceNo}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{equipment.department}</td>
                        <td className="p-2.5 text-slate-700">{acceptanceDossier.installationLocation}</td>
                        <td className="p-2.5 font-semibold text-emerald-800">
                          整机 {acceptanceDossier.warrantyMonths} 个月 / 核心关键部件 {acceptanceDossier.corePartWarrantyYears} 年原厂质保
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. 开箱附件与随机资料清点明细 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      开箱实物查验与标配/选配附件明细表
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    序列号核验: <strong>{equipment.sn}</strong> (吻合)
                  </span>
                </div>
                <div className="overflow-x-auto border-t border-slate-200">
                  <table className="min-w-[880px] w-full border-collapse text-xs sm:text-[13px] text-left">
                    <colgroup>
                      <col className="w-12 text-center" />
                      <col className="w-28" />
                      <col className="min-w-[220px]" />
                      <col className="w-24 text-center" />
                      <col className="w-24 text-center" />
                      <col className="w-28 text-center" />
                      <col className="min-w-[180px]" />
                    </colgroup>
                    <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-3 text-center">序号</th>
                        <th className="p-3">分类</th>
                        <th className="p-3">物品部件名称与规格参数</th>
                        <th className="p-3 text-center">标准数量</th>
                        <th className="p-3 text-center">实收数量</th>
                        <th className="p-3 text-center">核验状态</th>
                        <th className="p-3">外观与防伪核查情况</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80">
                      {acceptanceDossier.unboxingItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3">
                            <strong className="text-slate-900 block">{item.itemName}</strong>
                            {item.specification && (
                              <span className="text-[11px] text-slate-600 block leading-tight mt-0.5">{item.specification}</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono text-slate-700">{item.standardQuantity} {item.unit}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-950">{item.actualQuantity} {item.unit}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                              <Check className="w-3.5 h-3.5" />
                              <span>合格</span>
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-700">{item.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>开箱总评：</strong>{acceptanceDossier.unboxingConclusion}</span>
                </div>
              </div>

              {/* 4. 工程技术性能与电气安全指标实测台账 (标准规范表格) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      工程技术指标与 GB 9706.1 强制电气安全现场实测记录
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    连续 72 小时带载负荷试运行达标
                  </span>
                </div>
                <div className="overflow-x-auto border-t border-slate-200">
                  <table className="min-w-[920px] w-full border-collapse text-xs sm:text-[13px] text-left">
                    <colgroup>
                      <col className="w-12 text-center" />
                      <col className="w-28" />
                      <col className="min-w-[200px]" />
                      <col className="min-w-[240px]" />
                      <col className="w-36 text-center" />
                      <col className="w-36" />
                      <col className="w-28 text-center" />
                    </colgroup>
                    <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-3 text-center">序号</th>
                        <th className="p-3">检验分类</th>
                        <th className="p-3">技术指标与实测项目</th>
                        <th className="p-3">国家/行业规程要求 (GB 9706.1)</th>
                        <th className="p-3 text-center">现场实测准确读数</th>
                        <th className="p-3">专用计量/检测仪器</th>
                        <th className="p-3 text-center">单项结论</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80">
                      {acceptanceDossier.technicalTests.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs border border-slate-300">
                              {t.testCategory}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{t.parameterName}</td>
                          <td className="p-3 font-mono text-xs text-slate-600">{t.standardRequirement}</td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-800 bg-indigo-50/50">
                            {t.measuredValue}
                          </td>
                          <td className="p-3 text-slate-700 text-xs">{t.testInstrument || '综合电气安全分析仪'}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                              <Check className="w-3.5 h-3.5" />
                              <span>合格 PASS</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs sm:text-[13px] text-slate-700 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>测试总评：</strong>{acceptanceDossier.testingConclusion}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-xs">
                    见证工程师: {acceptanceDossier.signoffs.biomedicalEngineer.signatoryName} · 仪器校准有效期内受控
                  </span>
                </div>
              </div>

              {/* 5. 临床培训与交接档案 + 质保承诺与售后SLA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">临床应用操作与日常规范维护培训档案</h4>
                  </div>
                  <div className="space-y-2 text-xs sm:text-[13px]">
                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                      <table className="w-full border-collapse text-xs sm:text-[13px] text-left">
                        <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2.5">主讲培训专家</th>
                            <th className="p-2.5">讲师所属单位</th>
                            <th className="p-2.5 text-center">考核日期</th>
                            <th className="p-2.5 text-center">培训学时</th>
                            <th className="p-2.5 text-center">考核达标率</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2.5 font-bold text-slate-900">
                              {acceptanceDossier.trainingRecord.trainerName}
                              <span className="block font-normal text-xs text-slate-500">{acceptanceDossier.trainingRecord.trainerTitle}</span>
                            </td>
                            <td className="p-2.5 text-slate-700 text-xs">{acceptanceDossier.trainingRecord.trainerCompany}</td>
                            <td className="p-2.5 text-center font-mono text-slate-800">{acceptanceDossier.trainingRecord.trainingDate}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-900">{acceptanceDossier.trainingRecord.trainingHours} 课时</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700 bg-emerald-50/40">100% (全员通过)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-700 font-bold block mb-1.5 text-xs sm:text-[13px]">科室受训骨干人员考核成绩册：</span>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                        <table className="min-w-[500px] w-full border-collapse text-xs sm:text-[13px] text-left">
                          <colgroup>
                            <col className="w-10 text-center" />
                            <col className="w-20" />
                            <col className="min-w-[120px]" />
                            <col className="w-20 text-center" />
                            <col className="w-20 text-center" />
                            <col className="w-24 text-center" />
                          </colgroup>
                          <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 font-bold border-b border-slate-300">
                            <tr>
                              <th className="p-2 text-center">序号</th>
                              <th className="p-2">姓名</th>
                              <th className="p-2">岗位角色</th>
                              <th className="p-2 text-center">学时</th>
                              <th className="p-2 text-center">得分</th>
                              <th className="p-2 text-center">准用结论</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80">
                            {acceptanceDossier.trainingRecord.trainees.map((tr, idx) => (
                              <tr key={tr.name} className="hover:bg-slate-50/80">
                                <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-900">{tr.name}</td>
                                <td className="p-2 text-slate-600 text-xs">{tr.role}</td>
                                <td className="p-2 text-center text-emerald-700 font-medium">{tr.attendance}</td>
                                <td className="p-2 text-center font-mono font-bold text-purple-700 bg-purple-50/40">
                                  {tr.score || 98}分
                                </td>
                                <td className="p-2 text-center">
                                  <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-300 shadow-2xs">
                                    {tr.assessmentResult}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 现场培训照片展示与上传 */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-800 font-bold text-xs sm:text-[13px] flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-purple-600" />
                          <span>现场实操培训照片 ({(acceptanceDossier.trainingRecord.photos || []).length} 张)</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAcceptanceModalInitialTab('photos');
                              setShowAcceptanceModal(true);
                            }}
                            className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200 transition cursor-pointer shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>上传照片</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAcceptanceModalInitialTab('training_paper');
                              setShowAcceptanceModal(true);
                            }}
                            className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                          >
                            A4 打印预览 &gt;
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        {(acceptanceDossier.trainingRecord.photos || []).slice(0, 3).map((photo, pIdx) => (
                          <div 
                            key={photo.id}
                            onClick={() => {
                              setAcceptanceModalInitialTab('photos');
                              setShowAcceptanceModal(true);
                            }}
                            className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs flex flex-col cursor-pointer group hover:border-purple-400 hover:shadow-xs transition ring-1 ring-slate-900/5"
                          >
                            <div className="h-20 w-full bg-slate-950 overflow-hidden relative">
                              <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.2 rounded font-mono shadow-xs">
                                图{pIdx + 1}
                              </span>
                            </div>
                            <div className="p-1.5 text-xs text-slate-800 font-medium leading-tight">
                              <span className="line-clamp-1">{photo.caption}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">质保服务承诺与原厂售后保障 SLA</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">整机保修期限：</span>
                      <strong className="text-emerald-800">{acceptanceDossier.warrantyMonths} 个月整机原厂质保</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">关键核心部件：</span>
                      <strong className="text-emerald-800">{acceptanceDossier.corePartWarrantyYears} 年专项质保</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">紧急响应时效：</span>
                      <span className="font-semibold text-slate-800">{acceptanceDossier.responseSlaHours} 小时内响应 / {acceptanceDossier.onsiteSlaHours} 小时到场</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">每年免费深度巡检：</span>
                      <span className="font-semibold text-slate-800">每年至少 {acceptanceDossier.preventiveMaintenancePerYear} 次全面保养</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-500 block mb-1">过保后服务优惠承诺：</span>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                        {acceptanceDossier.postWarrantyPolicy}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. 五方代表联合签署及审定意见卡片 (完整展示5方) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">五方代表联合验收入库签署意见</h4>
                  </div>
                  <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    全员已会签通过 · 准予财务正式入账
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                  {(Object.values(acceptanceDossier.signoffs) as AcceptanceSignoffDetail[]).map((s) => (
                    <div key={s.roleCode} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between text-xs space-y-2 hover:border-indigo-300 transition">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{s.roleTitle.split('·')[0].trim()}</span>
                          <span className="text-[10px] font-mono text-slate-400">{s.signDate}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                          {s.opinion}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">经办签署人:</span>
                          <strong className="text-slate-900">{s.signatoryName}</strong>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          已核签
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================== 底部操作与流程审批触发栏 (Footer) ===================== */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenStatusChange(equipment)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              变更设备状态
            </button>

            {onNavigateToApprovals && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToApprovals({
                      type: 'part_replacement',
                      equipmentId: equipment.id,
                      equipmentName: equipment.name,
                      equipmentModel: equipment.model,
                      equipmentLocation: equipment.location,
                      equipmentPurchasePrice: equipment.purchasePrice,
                      applicantDepartment: equipment.department,
                      title: `【${equipment.department}】${equipment.name} (${equipment.model}) 大额换件审批申请`
                    });
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  title="为该设备发起大额配件更换或重大维修审批"
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>换件审批</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToApprovals({
                      type: 'scrap_disposal',
                      equipmentId: equipment.id,
                      equipmentName: equipment.name,
                      equipmentModel: equipment.model,
                      equipmentLocation: equipment.location,
                      equipmentPurchasePrice: equipment.purchasePrice,
                      equipmentPurchaseDate: equipment.purchaseDate,
                      equipmentCumulativeMaintenanceCost: (equipment.repairRecords || []).reduce((s, r) => s + (r.cost || 0), 0),
                      applicantDepartment: equipment.department,
                      title: `【${equipment.department}】${equipment.name} 报废技术鉴定申请`
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  title="为该设备发起技术报废鉴定审批"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                  <span>报废审批</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
          >
            关闭详情
          </button>
        </div>

      </div>

      {/* 辅助弹窗 */}
      <HealthScoreDetailModal
        isOpen={showHealthModal}
        equipment={equipment}
        onClose={() => setShowHealthModal(false)}
        onAddRepairForDevice={onOpenRepairForDevice}
        onChangeStatusForDevice={onOpenStatusChange}
      />

      <ImagePreviewModal
        isOpen={showPhotoPreview}
        equipment={equipment}
        photoUrl={photoUrl}
        onClose={() => setShowPhotoPreview(false)}
      />

      {/* 维修工单流转全景追踪弹窗 */}
      <WorkOrderTrackingModal
        isOpen={Boolean(selectedTrackingOrder)}
        workOrder={selectedTrackingOrder}
        onClose={() => setSelectedTrackingOrder(null)}
      />

      {/* 标准医学工程A4工程维修单打印弹窗 */}
      <WorkOrderPrintModal
        isOpen={Boolean(selectedPrintOrder)}
        workOrder={selectedPrintOrder}
        onClose={() => setSelectedPrintOrder(null)}
      />

      {/* 第三方检测报告全屏高保真查验弹窗 */}
      {previewingReport && (
        <ThirdPartyReportPreviewModal
          report={previewingReport}
          equipmentName={equipment?.name}
          equipmentModel={equipment?.model}
          equipmentSn={equipment?.sn}
          department={equipment?.department}
          onClose={() => setPreviewingReport(null)}
        />
      )}

      {/* 新机开箱与工程综合验收单 A4 实体纸质凭据弹窗 (支持四联单、A4培训交接单、现场照片与PDF导出) */}
      <EquipmentAcceptanceModal
        isOpen={showAcceptanceModal}
        equipment={equipment}
        initialViewMode={acceptanceModalInitialTab}
        onClose={() => setShowAcceptanceModal(false)}
      />
    </div>
  );
};


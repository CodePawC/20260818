import React, { useState, useMemo } from 'react';
import { 
  PartnerOrganization, 
  MedicalEquipment, 
  EquipmentStatus,
  AuthUser 
} from '../types';
import { matchEquipmentToPartner } from '../utils/partnerData';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { isHeadNurse, getUserDepartment } from '../utils/authUtils';
import { 
  Building2, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Award, 
  FileText, 
  Wrench, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  ExternalLink, 
  Copy, 
  Printer, 
  Search, 
  Filter, 
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  Eye,
  Activity,
  Tag,
  Lock,
  Stethoscope
} from 'lucide-react';

interface PartnerDetailModalProps {
  isOpen: boolean;
  partner: PartnerOrganization | null;
  allEquipment: MedicalEquipment[];
  currentUser?: AuthUser;
  onClose: () => void;
  onFilterByPartner?: (partnerName: string) => void;
  onViewEquipmentDetail?: (equipment: MedicalEquipment) => void;
  onAddRepairForEquipment?: (equipment?: MedicalEquipment) => void;
  onEditPartner?: (partner: PartnerOrganization) => void;
}

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({
  isOpen,
  partner,
  allEquipment,
  currentUser,
  onClose,
  onFilterByPartner,
  onViewEquipmentDetail,
  onAddRepairForEquipment,
  onEditPartner
}) => {
  const [activeTab, setActiveTab] = useState<'equipment' | 'profile' | 'history' | 'billing'>('equipment');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isNurse = isHeadNurse(currentUser);
  const userDept = getUserDepartment(currentUser);

  // 严格权限隔离：护士长仅可查看本科室关联的设备与业务记录，跨科室设备完全屏蔽
  const effectiveEquipment = useMemo(() => {
    if (isNurse && userDept) {
      return allEquipment.filter(eq => eq.department === userDept);
    }
    return allEquipment;
  }, [allEquipment, isNurse, userDept]);

  // Associated equipment list
  const associatedEquipment = useMemo(() => {
    if (!partner) return [];
    return effectiveEquipment.filter(eq => matchEquipmentToPartner(eq, partner));
  }, [partner, effectiveEquipment]);

  // Filtered equipment by search query & status
  const filteredEquipment = useMemo(() => {
    return associatedEquipment.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.sn.toLowerCase().includes(q) ||
          (e.model && e.model.toLowerCase().includes(q)) ||
          e.department.toLowerCase().includes(q) ||
          (e.building && e.building.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [associatedEquipment, searchQuery, statusFilter]);

  // Aggregated history of work orders & inspections
  const serviceHistory = useMemo(() => {
    if (!partner) return [];
    const historyList: {
      id: string;
      date: string;
      type: string;
      equipmentName: string;
      equipmentSn: string;
      equipmentId: string;
      engineer: string;
      cost: number;
      result: string;
      description: string;
      status: string;
      certificateNo?: string;
    }[] = [];

    // 1. If metrology agency, collect calibration records
    if (partner.type === 'calibration_agency') {
      associatedEquipment.forEach(eq => {
        const cal = getEquipmentCalibrationInfo(eq);
        if (cal.lastDate) {
          historyList.push({
            id: `CAL-${eq.id}`,
            date: cal.lastDate,
            type: '法定计量强检与定标',
            equipmentName: eq.name,
            equipmentSn: eq.sn,
            equipmentId: eq.id,
            engineer: `${partner.shortName} 授权主检工程师`,
            cost: eq.purchasePrice && eq.purchasePrice > 1000000 ? 3500 : 1200,
            result: '检定合格 (符合规程指标)',
            description: `依据国家检定规程完成输出剂量、电气安全及关键性能指标定标。`,
            status: '已出具正式证书',
            certificateNo: cal.certificateNo !== '-' ? cal.certificateNo : `GD-${eq.id}-2025`
          });
        }
      });
    }

    // 2. Collect repair records
    associatedEquipment.forEach(eq => {
      if (eq.repairRecords && eq.repairRecords.length > 0) {
        eq.repairRecords.forEach(r => {
          historyList.push({
            id: r.id,
            date: r.faultDate,
            type: r.repairType,
            equipmentName: r.equipmentName || eq.name,
            equipmentSn: r.equipmentSn || eq.sn,
            equipmentId: eq.id,
            engineer: r.technician || partner.contactPerson,
            cost: r.cost || 0,
            result: r.resolution || '已修复并恢复正常运行',
            description: r.faultDescription,
            status: r.status === '已完成' ? '已完成归档' : '处理中',
            certificateNo: undefined
          });
        });
      }
    });

    // Sort descending by date
    return historyList.sort((a, b) => b.date.localeCompare(a.date));
  }, [partner, associatedEquipment]);

  // Financial and KPI stats
  const stats = useMemo(() => {
    let faultCount = 0;
    let maintCount = 0;
    let normalCount = 0;
    let totalSpend = 0;

    associatedEquipment.forEach(eq => {
      if (eq.status === '故障待修') faultCount++;
      else if (eq.status === '维护保养中') maintCount++;
      else normalCount++;
    });

    serviceHistory.forEach(s => {
      totalSpend += s.cost;
    });

    return {
      totalEquipment: associatedEquipment.length,
      faultCount,
      maintCount,
      normalCount,
      totalSpend,
      totalOrders: serviceHistory.length
    };
  }, [associatedEquipment, serviceHistory]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !partner) return null;

  // Type badge styling
  const getTypeBadge = (type: PartnerOrganization['type']) => {
    switch (type) {
      case 'calibration_agency':
        return { label: '法定计量检测机构', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'manufacturer':
        return { label: '设备生产厂家 / 原厂', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'third_party_repair':
        return { label: '第三方专业维保公司', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'supplier':
        return { label: '备件耗材特约供货商', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      default:
        return { label: '往来协同单位', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Service role helper for associated equipment
  const getServiceRole = (type: PartnerOrganization['type']) => {
    switch (type) {
      case 'calibration_agency':
        return {
          title: '法定计量检定与强检定标',
          badge: '法定强检定标',
          tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          desc: '负责全院该类特种/重点设备法定周期性计量强检、定标测试、CMA/CNAS 电子合格证出具与溯源校准。'
        };
      case 'manufacturer':
        return {
          title: '设备原厂制造、核心保修与技术升级',
          badge: '原厂制造/质保',
          tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
          desc: '负责设备原厂核心技术保障、原装零备件供应、原厂工程师驻点保修及定期固件版本升级维护。'
        };
      case 'third_party_repair':
        return {
          title: '第三方全托管专业预防性维保与抢修',
          badge: '第三方驻点维保',
          tagBg: 'bg-amber-50 text-amber-800 border-amber-200',
          desc: '负责该设备周期性预防性保养(PM)、2小时应急抢修响应、日常电气安全巡检与综合故障兜底排除。'
        };
      case 'supplier':
        return {
          title: '核心备品备件与专用耗材特约供应',
          badge: '专用备件/耗材供货',
          tagBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          desc: '负责专机专用传感器、回路管路、电极导联及易损耗材集采保障与 SPD 快速配送对账。'
        };
      default:
        return {
          title: '设备全生命周期协同运维',
          badge: '协同运维',
          tagBg: 'bg-slate-50 text-slate-700 border-slate-200',
          desc: '负责该设备的日常运行协同支持与综合技术服务保障。'
        };
    }
  };

  // Detailed stage & step progress helper for equipment
  const getEquipmentStageProgress = (eq: MedicalEquipment) => {
    // Check latest repair record if any active
    const activeRepair = eq.repairRecords?.find(r => r.status === '处理中' || r.status === '待配件');
    const latestRepair = eq.repairRecords && eq.repairRecords.length > 0 
      ? eq.repairRecords[eq.repairRecords.length - 1] 
      : null;

    if (eq.status === '故障待修') {
      if (activeRepair?.status === '待配件') {
        return {
          badge: '故障待修',
          stageText: '步骤 3/4 · 原厂备件调拨等待中',
          subDetail: activeRepair.partsReplaced ? `待到货: ${activeRepair.partsReplaced}` : '急需核心零备件在途调配',
          stepIndex: 3,
          totalSteps: 4,
          stepName: '配件调拨',
          color: 'rose',
          dotBg: 'bg-rose-500',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      }
      return {
        badge: '故障待修',
        stageText: '步骤 2/4 · 工程师响应与故障检修中',
        subDetail: activeRepair?.faultDescription || '临床报修已受理，技术员现场定位故障',
        stepIndex: 2,
        totalSteps: 4,
        stepName: '现场检修',
        color: 'rose',
        dotBg: 'bg-rose-500',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }

    if (eq.status === '维护保养中') {
      return {
        badge: '维护保养中',
        stageText: '步骤 2/3 · 预防性深度维护(PM)与性能定标',
        subDetail: '完成光学系统清洗、气路密闭性测试与电气安全校验',
        stepIndex: 2,
        totalSteps: 3,
        stepName: '定标测试',
        color: 'amber',
        dotBg: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }

    if (eq.status === '停用/报废') {
      return {
        badge: '停用/报废',
        stageText: '已完成 · 资产封存/待报废论证',
        subDetail: '已暂停临床调用，待医学装备委员会残值评估',
        stepIndex: 4,
        totalSteps: 4,
        stepName: '封存归档',
        color: 'slate',
        dotBg: 'bg-slate-400',
        badgeBg: 'bg-slate-100 text-slate-600 border-slate-200'
      };
    }

    // 正常运行
    const cal = getEquipmentCalibrationInfo(eq);
    let stageText = '步骤 4/4 · 临床就绪 (临床在用正常)';
    let subDetail = '设备自检通过，性能参数处于法定受控绿色周期';

    if (cal.isMandatory && cal.daysRemaining !== null) {
      if (cal.daysRemaining <= 30 && cal.daysRemaining >= 0) {
        stageText = `步骤 3/4 · 强检临期提醒 (剩 ${cal.daysRemaining} 天)`;
        subDetail = '需在到期前向计量院提交定标强检申请';
      } else if (cal.daysRemaining < 0) {
        stageText = `步骤 3/4 · 定标超期预警 (已超 ${Math.abs(cal.daysRemaining)} 天)`;
        subDetail = '请立即安排法定计量强检';
      }
    }

    return {
      badge: '正常运行',
      stageText,
      subDetail,
      stepIndex: 4,
      totalSteps: 4,
      stepName: '临床在用',
      color: 'emerald',
      dotBg: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  const typeMeta = getTypeBadge(partner.type);
  const serviceRoleMeta = getServiceRole(partner.type);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col overflow-hidden text-slate-800">
        
        {/* 1. Modal Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 px-6 shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-blue-500/10 transform skew-x-12 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-xl bg-blue-600/90 text-white flex items-center justify-center font-bold text-2xl shadow-lg border border-blue-400/30 shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${typeMeta.bg}`}>
                    {typeMeta.label}
                  </span>
                  {partner.level && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-blue-200 border border-slate-700">
                      {partner.level}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {partner.contractStatus}
                  </span>
                  {isNurse && userDept && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-rose-300 shrink-0" />
                      <span>【{userDept}】专属视图 (跨科室设备已隔离)</span>
                    </span>
                  )}
                </div>

                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {partner.name}
                  <span className="text-xs font-normal text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    简称: {partner.shortName}
                  </span>
                </h1>

                <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    合作评价: <strong className="text-amber-300 font-bold">{partner.cooperationRating} / 5.0</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-300" />
                    协议编号: <strong className="text-slate-200">{partner.contractNo}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    资质认证: {partner.qualifications.slice(0, 2).join(' / ')}
                  </span>
                </p>
              </div>
            </div>

            {/* Close & Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="打印此往来单位全景档案"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">打印档案</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Header Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
              <div className="text-slate-400 text-[11px]">{isNurse && userDept ? `科室在管设备 (${userDept})` : '关联在管设备'}</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {stats.totalEquipment} <span className="text-xs font-normal text-slate-300">台</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
              <div className="text-slate-400 text-[11px]">设备健康运行率</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {stats.totalEquipment > 0 ? Math.round((stats.normalCount / stats.totalEquipment) * 100) : 100}%
                <span className="text-xs font-normal text-slate-300 ml-1">({stats.normalCount}台正常)</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
              <div className="text-slate-400 text-[11px]">往来工单/定标数</div>
              <div className="text-lg font-bold text-blue-300 mt-0.5">
                {stats.totalOrders} <span className="text-xs font-normal text-slate-300">次</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
              <div className="text-slate-400 text-[11px]">年度累计往来结算</div>
              <div className="text-lg font-bold text-amber-300 font-mono mt-0.5 notranslate" translate="no">
                ￥{stats.totalSpend.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 flex items-center justify-between shrink-0">
          <div className="flex gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'equipment'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>关联台账设备列表</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                {associatedEquipment.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>机构概况与资质档案</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>往来工单与定标台账</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {serviceHistory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'billing'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>合同协议与财务结算</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onFilterByPartner && (
              <button
                type="button"
                onClick={() => onFilterByPartner(partner.shortName || partner.name)}
                className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer"
                title="在主台账中过滤此单位相关设备"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>在主台账中聚焦筛选</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/40">
          
          {/* TAB 1: 关联台账设备列表 */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              
              {/* Responsibility & Scope Header Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {serviceRoleMeta.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${serviceRoleMeta.tagBg}`}>
                        {serviceRoleMeta.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                      {serviceRoleMeta.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">在管关联设备</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {associatedEquipment.length} <span className="text-xs font-normal text-slate-500">台</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Filter Bar & Search inside Tab */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    全部 ({associatedEquipment.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('正常运行')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                      statusFilter === '正常运行'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    正常运行 ({stats.normalCount})
                  </button>
                  {stats.maintCount > 0 && (
                    <button
                      onClick={() => setStatusFilter('维护保养中')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        statusFilter === '维护保养中'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      维护保养中 ({stats.maintCount})
                    </button>
                  )}
                  {stats.faultCount > 0 && (
                    <button
                      onClick={() => setStatusFilter('故障待修')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        statusFilter === '故障待修'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      故障待修 ({stats.faultCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="检索设备名称、资产号、型号、科室..."
                      className="pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-md text-xs font-medium w-64 text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                </div>
              </div>

              {/* Equipment Grid Table */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">资产编号 / 序列号</th>
                      <th className="py-3 px-4">设备名称与规格型号</th>
                      <th className="py-3 px-4 min-w-[220px]">运行状态与流转阶段</th>
                      <th className="py-3 px-4">使用科室与位置</th>
                      <th className="py-3 px-4">往来服务职责与周期</th>
                      <th className="py-3 px-4 text-right min-w-[130px]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredEquipment.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center">
                            <Layers className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
                            <div className="text-slate-600 font-semibold text-sm">暂无匹配的关联台账设备</div>
                            <p className="text-slate-400 text-xs mt-1">请尝试调整搜索条件或切换状态筛选</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEquipment.map(eq => {
                        const cal = getEquipmentCalibrationInfo(eq);
                        const stageInfo = getEquipmentStageProgress(eq);

                        return (
                          <tr key={eq.id} className="hover:bg-blue-50/50 transition group">
                            {/* 1. Asset ID */}
                            <td className="py-3 px-4">
                              <button
                                onClick={() => onViewEquipmentDetail && onViewEquipmentDetail(eq)}
                                className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer text-left"
                                title="点击查看此设备完整档案"
                              >
                                <span>{eq.id}</span>
                              </button>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                SN: {eq.sn || '-'}
                              </div>
                            </td>

                            {/* 2. Name & Model */}
                            <td className="py-3 px-4">
                              <button
                                onClick={() => onViewEquipmentDetail && onViewEquipmentDetail(eq)}
                                className="font-bold text-slate-900 group-hover:text-blue-600 transition text-left cursor-pointer flex items-center gap-1"
                              >
                                {eq.name}
                              </button>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span>型号: {eq.model || '-'}</span>
                                {eq.manufacturer && (
                                  <span className="text-slate-400">| 厂家: {eq.manufacturer}</span>
                                )}
                              </div>
                            </td>

                            {/* 3. Running Status & Step Progress (运行状态与流转步骤) */}
                            <td className="py-3 px-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 border ${stageInfo.badgeBg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${stageInfo.dotBg} ${eq.status === '故障待修' ? 'animate-pulse' : ''}`} />
                                    {stageInfo.badge}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-600 font-mono">
                                    {stageInfo.stepName}
                                  </span>
                                </div>

                                {/* Step Progress Track */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: stageInfo.totalSteps }).map((_, idx) => (
                                      <div
                                        key={idx}
                                        className={`h-1.5 rounded-full flex-1 transition-all ${
                                          idx < stageInfo.stepIndex
                                            ? stageInfo.color === 'emerald'
                                              ? 'bg-emerald-500'
                                              : stageInfo.color === 'amber'
                                              ? 'bg-amber-500'
                                              : stageInfo.color === 'rose'
                                              ? 'bg-rose-500'
                                              : 'bg-slate-400'
                                            : 'bg-slate-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <div className="text-[10.5px] font-semibold text-slate-700 leading-tight">
                                    {stageInfo.stageText}
                                  </div>
                                  <div className="text-[10px] text-slate-400 line-clamp-1">
                                    {stageInfo.subDetail}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 4. Department & Location */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">{eq.department}</span>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {eq.building ? `${eq.building} ${eq.floor ? eq.floor + 'F' : ''}` : '院内临床病区'}
                              </div>
                            </td>

                            {/* 5. Service Role & Dates */}
                            <td className="py-3 px-4 text-[11px]">
                              <div className="flex items-center gap-1 mb-1">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${serviceRoleMeta.tagBg}`}>
                                  {serviceRoleMeta.badge}
                                </span>
                              </div>
                              {cal.isMandatory ? (
                                <div className="text-slate-600">
                                  <span>强检定标: </span>
                                  <strong className="font-mono text-indigo-700">{cal.nextDate || '周期受控'}</strong>
                                  {cal.certificateNo && (
                                    <div className="text-slate-400 font-mono text-[10px]">证书: {cal.certificateNo}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-slate-600">
                                  <span>维保巡检: </span>
                                  <span className="font-mono text-slate-700">{eq.nextMaintenanceDate || '按季度巡检'}</span>
                                </div>
                              )}
                            </td>

                            {/* 6. Actions with One-click Jump */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onViewEquipmentDetail && (
                                  <button
                                    onClick={() => onViewEquipmentDetail(eq)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                    title="一键打开此设备的全生命周期档案"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>设备详情 ↗</span>
                                  </button>
                                )}
                                {onAddRepairForEquipment && (
                                  <button
                                    onClick={() => onAddRepairForEquipment(eq)}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold transition cursor-pointer"
                                    title="为此设备创建维修/定标工单"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">报修</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & CERTIFICATIONS */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact and Service Station */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">专属对接团队与 24h 应急专线</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">首要技术对接人 / 专家</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{partner.contactPerson}</div>
                      <div className="text-slate-600 text-[11px] mt-0.5">{partner.contactTitle}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(partner.contactPhone, 'phone')}
                      className="px-2 py-1 bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 rounded text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === 'phone' ? '已复制' : '复制电话'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-rose-500" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">24小时急修应急热线</span>
                          <strong className="text-slate-800 text-xs font-mono">{partner.hotline}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(partner.hotline, 'hotline')}
                        className="text-blue-600 hover:underline text-[11px] cursor-pointer"
                      >
                        {copiedField === 'hotline' ? '已复制' : '复制'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">官方技术支持邮箱</span>
                          <span className="text-slate-800 text-xs font-mono">{partner.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(partner.email, 'email')}
                        className="text-blue-600 hover:underline text-[11px] cursor-pointer"
                      >
                        {copiedField === 'email' ? '已复制' : '复制'}
                      </button>
                    </div>

                    <div className="flex items-start justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">检测实验基地 / 驻点服务基地地址</span>
                          <span className="text-slate-800 text-xs leading-relaxed">{partner.address}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(partner.address, 'address')}
                        className="text-blue-600 hover:underline text-[11px] shrink-0 ml-2 cursor-pointer"
                      >
                        {copiedField === 'address' ? '已复制' : '复制'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    SLA 时效承诺与应急保供
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>响应时效：</strong>{partner.emergencyResponse}
                  </p>
                  <p className="text-[11px] leading-relaxed mt-1">
                    <strong>检修报告周期：</strong>{partner.turnaroundTime}
                  </p>
                </div>
              </div>

              {/* Qualifications and Licenses */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">法定资质与认证证书备案</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">具备资质认证项目</span>
                    <div className="flex flex-wrap gap-1.5">
                      {partner.qualifications.map((q, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white text-slate-800 font-semibold border border-slate-200 rounded text-[11px] shadow-2xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 block">资质许可及证书编号档案</span>
                    <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
                      {Object.entries(partner.certNumbers).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
                          <span className="text-slate-600 font-medium">{k}:</span>
                          <span className="font-bold text-slate-900">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                    <span className="text-[11px] font-semibold text-blue-900 block mb-1.5">主要业务范围与服务条款</span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {partner.serviceScope.map((scope, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{scope}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {partner.notes && (
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                      备注说明: {partner.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORK ORDERS & SERVICE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  全院与【{partner.name}】历史往来业务记录共 <strong className="text-blue-600">{serviceHistory.length}</strong> 笔
                </span>
                <span className="text-slate-500 font-medium">
                  累计核销金额: <strong className="text-rose-600 font-mono font-bold notranslate" translate="no">￥{stats.totalSpend.toLocaleString()}</strong>
                </span>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">工单/检定编号</th>
                      <th className="py-2.5 px-3">完成日期</th>
                      <th className="py-2.5 px-3">业务类型</th>
                      <th className="py-2.5 px-3">目标设备</th>
                      <th className="py-2.5 px-3">主检/服务工程师</th>
                      <th className="py-2.5 px-3">评定结论与方案</th>
                      <th className="py-2.5 px-3 text-right">结算费用</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {serviceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          暂无历史工单或定标记录。
                        </td>
                      </tr>
                    ) : (
                      serviceHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {item.id}
                            {item.certificateNo && (
                              <div className="text-[10px] text-blue-600 font-mono">
                                证号: {item.certificateNo}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{item.date}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.equipmentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">SN: {item.equipmentSn}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{item.engineer}</td>
                          <td className="py-2.5 px-3 max-w-xs truncate text-[11px] text-slate-600" title={item.description}>
                            <div className="font-semibold text-slate-800">{item.result}</div>
                            <div className="text-slate-500 truncate">{item.description}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 notranslate" translate="no">
                            {item.cost > 0 ? `￥${item.cost.toLocaleString()}` : '全保免费'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CONTRACTS & BILLING */}
          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">年度服务框架协议与商务条款</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-500 font-semibold block">协议全称</span>
                    <strong className="text-xs text-slate-900 block mt-0.5">{partner.contractName}</strong>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
                      <span>协议编号: <strong className="font-mono text-slate-900">{partner.contractNo}</strong></span>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {partner.contractStatus}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">履约有效期:</span>
                      <span className="font-mono font-bold text-slate-900">{partner.contractPeriod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">结算与对账周期:</span>
                      <span className="font-semibold text-slate-900">{partner.settlementTerms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">综合考评得分:</span>
                      <span className="font-bold text-amber-600">{partner.cooperationRating} / 5.0 (卓越合作方)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">开户信息与财务对账开票账号</h3>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">开户银行</span>
                    <div className="font-bold text-slate-900 mt-0.5">{partner.bankAccount.bankName}</div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">对公银行账号</span>
                    <div className="font-mono font-bold text-blue-700 mt-0.5 flex items-center justify-between">
                      <span>{partner.bankAccount.accountNo}</span>
                      <button
                        onClick={() => handleCopy(partner.bankAccount.accountNo, 'bank')}
                        className="text-blue-600 hover:underline text-[11px] cursor-pointer"
                      >
                        {copiedField === 'bank' ? '已复制' : '复制账号'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">纳税人统一社会信用代码 (税号)</span>
                    <div className="font-mono font-bold text-slate-800 mt-0.5 flex items-center justify-between">
                      <span>{partner.bankAccount.taxNo}</span>
                      <button
                        onClick={() => handleCopy(partner.bankAccount.taxNo, 'tax')}
                        className="text-blue-600 hover:underline text-[11px] cursor-pointer"
                      >
                        {copiedField === 'tax' ? '已复制' : '复制税号'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 4. Modal Footer */}
        <div className="p-3.5 px-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            医疗设备全生命周期合作协同系统 · 档案更新时间: <span className="font-mono">2026-08-13</span>
          </div>

          <div className="flex items-center gap-2">
            {onFilterByPartner && (
              <button
                type="button"
                onClick={() => {
                  onFilterByPartner(partner.shortName || partner.name);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>在设备台账中查看该单位 {associatedEquipment.length} 台设备 ↗</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              关闭视窗
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

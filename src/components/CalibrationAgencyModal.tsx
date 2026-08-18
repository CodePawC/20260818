import React, { useState, useMemo } from 'react';
import { MedicalEquipment, AuthUser } from '../types';
import {
  getAgencyProfile,
  generateAgencyInspectionHistory,
  CalibrationAgencyProfile,
  AgencyInspectionLog
} from '../utils/calibrationAgencyData';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { isHeadNurse, getUserDepartment } from '../utils/authUtils';
import {
  Building2,
  X,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Calendar,
  Clock,
  CreditCard,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Wrench,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

interface CalibrationAgencyModalProps {
  isOpen: boolean;
  agencyName: string | null;
  allEquipment: MedicalEquipment[];
  currentUser?: AuthUser;
  onClose: () => void;
  onFilterByAgency?: (agencyName: string) => void;
  onViewEquipmentDetail?: (equipment: MedicalEquipment) => void;
  onAddRepairForEquipment?: (equipment: MedicalEquipment) => void;
}

export const CalibrationAgencyModal: React.FC<CalibrationAgencyModalProps> = ({
  isOpen,
  agencyName,
  allEquipment,
  currentUser,
  onClose,
  onFilterByAgency,
  onViewEquipmentDetail,
  onAddRepairForEquipment
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'equipment' | 'history' | 'billing'>('equipment');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AgencyInspectionLog | null>(null);

  const isNurse = isHeadNurse(currentUser);
  const userDept = getUserDepartment(currentUser);

  // 严格权限隔离：护士长仅可查看本科室设备定标档案，跨科室设备完全屏蔽
  const effectiveEquipment = useMemo(() => {
    if (isNurse && userDept) {
      return allEquipment.filter(eq => eq.department === userDept);
    }
    return allEquipment;
  }, [allEquipment, isNurse, userDept]);

  const profile: CalibrationAgencyProfile = useMemo(() => {
    return getAgencyProfile(agencyName || '');
  }, [agencyName]);

  // 获取归属该机构检定的有效设备列表（已严格限制科室范围）
  const associatedEquipment = useMemo(() => {
    if (!agencyName) return [];
    return effectiveEquipment.filter(eq => {
      const calInfo = getEquipmentCalibrationInfo(eq);
      if (!calInfo.isMandatory) return false;
      const agency = (calInfo.agency || '').trim();
      const target = (agencyName || '').trim();
      
      if (agency === target) return true;
      if (target.includes('广东') && agency.includes('广东')) return true;
      if (target.includes('深圳') && agency.includes('深圳')) return true;
      if (target.includes('中国') && (agency.includes('中国') || agency.includes('国家级'))) return true;
      if (target.includes('市级') && (agency.includes('市级') || agency.includes('深圳'))) return true;
      if (target.includes('省级') && (agency.includes('省级') || agency.includes('广东'))) return true;
      return agency.includes(target) || target.includes(agency);
    });
  }, [effectiveEquipment, agencyName]);

  // 往来检定记录
  const inspectionHistory = useMemo(() => {
    if (!agencyName) return [];
    return generateAgencyInspectionHistory(profile, associatedEquipment);
  }, [profile, associatedEquipment, agencyName]);

  // 统计指标
  const stats = useMemo(() => {
    let overdueCount = 0;
    let dueSoonCount = 0;
    let validCount = 0;
    let totalRepairCost = 0;

    associatedEquipment.forEach(eq => {
      const cal = getEquipmentCalibrationInfo(eq);
      if (cal.statusType === 'overdue') overdueCount++;
      else if (cal.statusType === 'due_soon') dueSoonCount++;
      else validCount++;

      // 统计维保/检定费用
      eq.repairRecords?.forEach(r => {
        if (r.repairType === '计量校准' || r.technician?.includes('计量') || r.faultDescription?.includes('计量')) {
          totalRepairCost += (r.cost || 0);
        }
      });
    });

    const totalInspectionFees = inspectionHistory.reduce((sum, item) => sum + item.fee, 0);

    return {
      totalEquipment: associatedEquipment.length,
      overdueCount,
      dueSoonCount,
      validCount,
      complianceRate: associatedEquipment.length > 0
        ? Math.round(((validCount + dueSoonCount) / associatedEquipment.length) * 100)
        : 100,
      totalInspectionFees,
      totalRecords: inspectionHistory.length
    };
  }, [associatedEquipment, inspectionHistory]);

  const filteredEquipmentList = useMemo(() => {
    if (!searchQuery.trim()) return associatedEquipment;
    const q = searchQuery.toLowerCase().trim();
    return associatedEquipment.filter(eq => 
      eq.name.toLowerCase().includes(q) ||
      eq.sn.toLowerCase().includes(q) ||
      eq.id.toLowerCase().includes(q) ||
      eq.department.toLowerCase().includes(q) ||
      (eq.calibrationCertificateNo && eq.calibrationCertificateNo.toLowerCase().includes(q))
    );
  }, [associatedEquipment, searchQuery]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !agencyName) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      {/* Modal Container */}
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-5 py-4 flex-none border-b border-blue-900/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 shadow-inner">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-white">{profile.name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    {profile.level}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    协议合作单位 (2026有效)
                  </span>
                  {isNurse && userDept && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/40 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-rose-300 shrink-0" />
                      <span>【{userDept}】专属强检档案 (跨科室已隔离)</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-200/80 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>授权资质: <strong className="text-white font-mono">{profile.cmaCertNo}</strong> (CMA) / <strong className="text-white font-mono">{profile.cnasCertNo}</strong> (CNAS)</span>
                  <span>法定授权号: <strong className="text-white font-mono">{profile.legalAuthNo}</strong></span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
              title="关闭窗口 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar in Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-blue-800/40">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-200/70 block">{isNurse && userDept ? `科室在检设备 (${userDept})` : '管辖在检设备'}</span>
                <span className="text-base font-bold font-mono text-white">{stats.totalEquipment} <span className="text-xs font-normal text-blue-200">台</span></span>
              </div>
              <Layers className="w-5 h-5 text-blue-400/60" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-200/70 block">强检准用合格率</span>
                <span className="text-base font-bold font-mono text-emerald-300">{stats.complianceRate}%</span>
              </div>
              <Award className="w-5 h-5 text-emerald-400/60" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-200/70 block">检定/预警状态</span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold mt-0.5">
                  <span className="text-emerald-400" title="合格有效">{stats.validCount}正常</span>
                  {stats.dueSoonCount > 0 && <span className="text-amber-400" title="临期预警">/ {stats.dueSoonCount}临期</span>}
                  {stats.overdueCount > 0 && <span className="text-rose-400" title="超期预警">/ {stats.overdueCount}超期</span>}
                </div>
              </div>
              <Clock className="w-5 h-5 text-amber-400/60" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-200/70 block">往来检定总额</span>
                <span className="text-base font-bold font-mono text-cyan-300">¥{stats.totalInspectionFees.toLocaleString()}</span>
              </div>
              <CreditCard className="w-5 h-5 text-cyan-400/60" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 px-5 border-b border-slate-200 flex-none flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1 py-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('equipment')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'equipment'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>管辖设备清单</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'equipment' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {associatedEquipment.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>往来检定校准记录</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {stats.totalRecords}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>机构资质与档案</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'billing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>往来账目与协议</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 py-1.5">
            {onFilterByAgency && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFilterByAgency(agencyName);
                }}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                title="在主台账表格中筛选此机构负责的所有设备"
              >
                <Filter className="w-3 h-3 text-blue-600" />
                <span>在台账中聚焦该单位设备</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: 管辖设备清单 */}
          {activeTab === 'equipment' && (
            <div className="space-y-3">
              {/* Search & Action filter row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="按设备名称、SN编号、科室、证书号搜索..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  显示 <strong className="text-slate-800 font-bold">{filteredEquipmentList.length}</strong> / 共 {associatedEquipment.length} 台在管设备
                </div>
              </div>

              {/* Equipment Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">设备信息 / 规格型号</th>
                        <th className="py-2.5 px-3">出厂SN / 资产ID</th>
                        <th className="py-2.5 px-3">使用科室与位置</th>
                        <th className="py-2.5 px-3">上次定标日</th>
                        <th className="py-2.5 px-3">下次到期日</th>
                        <th className="py-2.5 px-3">检定证书编号</th>
                        <th className="py-2.5 px-3 text-center">计量状态</th>
                        <th className="py-2.5 px-3 text-center">快捷操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredEquipmentList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            未找到符合搜索条件的在管设备记录
                          </td>
                        </tr>
                      ) : (
                        filteredEquipmentList.map((eq) => {
                          const cal = getEquipmentCalibrationInfo(eq);
                          return (
                            <tr key={eq.id} className="hover:bg-blue-50/50 transition">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{eq.name}</div>
                                <div className="text-[11px] text-slate-500">{eq.model || '标准型号'} · {eq.manufacturer}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">
                                <div className="font-semibold">{eq.sn}</div>
                                <div className="text-[10px] text-slate-400">ID: {eq.id}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-800">{eq.department}</span>
                                <div className="text-[10px] text-slate-400">{eq.building || '1号楼'} {eq.floor ? `${eq.floor}F` : ''}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{cal.lastDate}</td>
                              <td className="py-2.5 px-3 font-mono font-bold">
                                <span className={
                                  cal.statusType === 'overdue' ? 'text-rose-600' :
                                  cal.statusType === 'due_soon' ? 'text-amber-600' : 'text-slate-800'
                                }>
                                  {cal.nextDate}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">
                                {cal.certificateNo}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${cal.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cal.dotClass}`}></span>
                                  {cal.statusLabel}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {onViewEquipmentDetail && (
                                    <button
                                      type="button"
                                      onClick={() => onViewEquipmentDetail(eq)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded text-[11px] font-medium transition cursor-pointer"
                                      title="查看台账详情"
                                    >
                                      详情
                                    </button>
                                  )}
                                  {onAddRepairForEquipment && (
                                    <button
                                      type="button"
                                      onClick={() => onAddRepairForEquipment(eq)}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-0.5"
                                      title="登记检定/维保工单"
                                    >
                                      <Wrench className="w-3 h-3" />
                                      <span>送检</span>
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
            </div>
          )}

          {/* TAB 2: 往来检定校准记录 */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">历史法定强检与计量定标报告记录 Inspection Logs</h3>
                  <p className="text-xs text-slate-500">本院送检或由 {profile.shortName} 工程师现场定标的历次检定与校准原始台账</p>
                </div>
                <div className="text-xs text-slate-600">
                  累计出具报告：<strong className="text-slate-900 font-mono font-bold">{inspectionHistory.length}</strong> 份
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">检定单号 / 日期</th>
                        <th className="py-2.5 px-3">受检设备与科室</th>
                        <th className="py-2.5 px-3">检定类型</th>
                        <th className="py-2.5 px-3">检定与测试项目</th>
                        <th className="py-2.5 px-3">主检工程师</th>
                        <th className="py-2.5 px-3">评定结论与证书号</th>
                        <th className="py-2.5 px-3 text-right">检定费用</th>
                        <th className="py-2.5 px-3 text-center">电子报告</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {inspectionHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-800">{log.id}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{log.inspectionDate}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{log.equipmentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{log.equipmentSn} · {log.department}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                              {log.inspectionType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-[220px] truncate" title={log.testItems}>
                            {log.testItems}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {log.inspector}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{log.result}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              证书: {log.certificateNo}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ¥{log.fee.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>查看凭证</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Certificate Preview Card if selected */}
              {selectedLog && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 shadow-sm animate-in fade-in duration-100 relative">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-emerald-950">
                          国家法定计量检定证书电子档案 Certificate Details
                        </h4>
                        <span className="px-2 py-0.2 bg-emerald-600 text-white rounded text-[10px] font-mono font-bold">
                          {selectedLog.certificateNo}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        受检设备：<strong>{selectedLog.equipmentName}</strong> (SN: {selectedLog.equipmentSn}) · 检定机构：<strong>{profile.name}</strong> · 主检员：{selectedLog.inspector}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-medium text-emerald-900 border-t border-emerald-200">
                        <div>检定日期：<span className="font-mono font-bold">{selectedLog.inspectionDate}</span></div>
                        <div>有效截止：<span className="font-mono font-bold">{selectedLog.expiryDate}</span></div>
                        <div>检定费用：<span className="font-mono font-bold">¥{selectedLog.fee}</span></div>
                        <div>资质标识：<span className="font-mono font-bold">{profile.cmaCertNo}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 机构资质与档案 */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Contact Card */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>专属业务对接团队</span>
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">对接专家 / 主任:</span>
                      <span className="font-bold text-slate-900 text-sm">{profile.contactPerson}</span>
                      <span className="text-slate-600 text-[11px] block">{profile.contactTitle}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">办公及业务电话:</span>
                      <div className="flex items-center justify-between font-mono font-semibold text-slate-800">
                        <span>{profile.contactPhone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(profile.contactPhone, 'phone')}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="复制电话"
                        >
                          {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">24小时应急保供专线:</span>
                      <span className="font-mono font-bold text-rose-700 text-xs block">{profile.hotline}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">业务受理邮箱:</span>
                      <span className="font-mono text-slate-700">{profile.email}</span>
                    </div>
                  </div>
                </div>

                {/* Address & System Card */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>送检实验室与平台</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">国家/省级检测基地地址:</span>
                      <div className="flex items-start justify-between gap-1 font-medium text-slate-900 mt-0.5">
                        <span>{profile.address}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(profile.address, 'address')}
                          className="text-blue-600 hover:text-blue-800 p-1 shrink-0"
                          title="复制地址"
                        >
                          {copiedField === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">网上送检与防伪证书查询:</span>
                      <span className="font-mono text-blue-700 text-[11px] break-all block mt-0.5">{profile.website}</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-slate-500 block text-[11px]">定标出证承诺时效:</span>
                      <span className="font-semibold text-emerald-800 text-xs">{profile.turnaroundTime}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">急诊与临床应急响应:</span>
                      <span className="font-semibold text-blue-900 text-xs">{profile.emergencyResponse}</span>
                    </div>
                  </div>
                </div>

                {/* Qualification Certificates */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>法定计量授权与认证</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] block">中国检验检测机构资质认定 (CMA):</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{profile.cmaCertNo}</span>
                    </div>

                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] block">国家实验室认可委员会 (CNAS):</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{profile.cnasCertNo}</span>
                    </div>

                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] block">法定计量检定机构授权证书:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{profile.legalAuthNo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Scope Badges */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>重点授权检定与基准传递范围 Authorized Metrology Capabilities</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {profile.serviceScope.map((scope, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold font-mono">0{idx + 1}.</span>
                      <span className="font-medium">{scope}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 往来账目与协议 */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contract Summary */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>年度框架合作协议 Contract Summary</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">协议名称:</span>
                      <span className="font-semibold text-slate-900">《三甲医院医学装备法定强检与定标技术服务协议》</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">协议编号:</span>
                      <span className="font-mono font-bold text-slate-900">{profile.contractNo}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">协议周期:</span>
                      <span className="font-mono font-semibold text-emerald-700">{profile.contractPeriod}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">结算与付款周期:</span>
                      <span className="font-medium text-slate-800">{profile.settlementTerms}</span>
                    </div>
                  </div>
                </div>

                {/* Bank & Invoicing */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>对公结算与财务信息 Financial Details</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">开户银行:</span>
                      <span className="font-semibold text-slate-900">{profile.bankAccount.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">对公银行账号:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                        <span>{profile.bankAccount.accountNo}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(profile.bankAccount.accountNo, 'bank')}
                          className="text-blue-600 hover:text-blue-800 p-0.5"
                          title="复制账号"
                        >
                          {copiedField === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">统一社会信用代码 / 税号:</span>
                      <span className="font-mono font-semibold text-slate-800">{profile.bankAccount.taxNo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Summary Box */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">2026年度 累计法定计量检测费用总览</h4>
                  <p className="text-xs text-blue-200 mt-0.5">包含全院影像大型设备、重症呼吸麻醉、监护除颤等送检与现场定标款项</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-blue-200/70 block">已出账检定金额</span>
                    <span className="text-xl font-bold font-mono text-cyan-300">¥{stats.totalInspectionFees.toLocaleString()}</span>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="text-right">
                    <span className="text-[11px] text-blue-200/70 block">结算状态</span>
                    <span className="text-sm font-semibold text-emerald-300">按季度挂账核销中</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex-none flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
            <span>当前机构：<strong className="text-slate-800">{profile.shortName}</strong></span>
            <span>·</span>
            <span>关联台账：<strong className="text-blue-700 font-bold">{associatedEquipment.length}</strong> 台</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>打印往来档案</span>
            </button>

            {onFilterByAgency && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFilterByAgency(agencyName);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>筛选全院台账</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-xs font-semibold transition cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
